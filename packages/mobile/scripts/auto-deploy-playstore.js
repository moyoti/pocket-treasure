#!/usr/bin/env node

const { google } = require('googleapis');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PACKAGE_NAME = process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.treasurecat.app';
const TRACK = 'internal';

const POSSIBLE_KEY_PATHS = [
  './.play-store-key.json',
  './play-store-key.json',
  '../.play-store-key.json',
  process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
].filter(Boolean);

async function getAndroidPublisher() {
  let keyPath = null;
  
  for (const p of POSSIBLE_KEY_PATHS) {
    if (fs.existsSync(p)) {
      keyPath = p;
      break;
    }
  }
  
  if (!keyPath) {
    throw new Error(
      'Service account key not found. Please place it at:\n' +
      '  - ./.play-store-key.json\n' +
      '  - ./play-store-key.json\n' +
      '\nOr set GOOGLE_SERVICE_ACCOUNT_KEY environment variable.'
    );
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });

  return google.androidpublisher({
    version: 'v3',
    auth,
  });
}

async function getLatestVersionCode(androidpublisher) {
  console.log(`📱 从 Google Play 获取最新版本号... (${PACKAGE_NAME})`);
  
  try {
    const edits = await androidpublisher.edits.insert({
      packageName: PACKAGE_NAME,
    });

    const editId = edits.data.id;

    const tracksResponse = await androidpublisher.edits.tracks.get({
      editId: editId,
      packageName: PACKAGE_NAME,
      track: TRACK,
    });

    await androidpublisher.edits.commit({
      editId: editId,
      packageName: PACKAGE_NAME,
    });

    const track = tracksResponse.data;
    
    if (!track.releases || track.releases.length === 0) {
      console.log('ℹ️  内测轨道暂无发布，将从版本 1 开始');
      return 0;
    }

    let maxVersionCode = 0;
    track.releases.forEach(release => {
      if (release.versionCodes) {
        release.versionCodes.forEach(code => {
          const versionCode = parseInt(code, 10);
          if (versionCode > maxVersionCode) {
            maxVersionCode = versionCode;
          }
        });
      }
    });

    console.log(`✅ 当前最新版本号：${maxVersionCode}`);
    return maxVersionCode;

  } catch (error) {
    if (error.code === 404) {
      console.log('ℹ️  内测轨道不存在，将从版本 1 开始');
      return 0;
    }
    throw error;
  }
}

function updateVersionCode(newVersionCode) {
  const appBuildGradlePath = path.join(__dirname, '../android/app/build.gradle');
  
  if (!fs.existsSync(appBuildGradlePath)) {
    throw new Error(`build.gradle not found at: ${appBuildGradlePath}`);
  }

  let content = fs.readFileSync(appBuildGradlePath, 'utf8');
  
  const versionCodeRegex = /(versionCode\s+)(\d+)/;
  const match = content.match(versionCodeRegex);
  
  if (!match) {
    throw new Error('Could not find versionCode in build.gradle');
  }

  const oldVersionCode = parseInt(match[2], 10);
  console.log(`📝 更新 versionCode: ${oldVersionCode} → ${newVersionCode}`);
  
  content = content.replace(versionCodeRegex, `$1${newVersionCode}`);
  fs.writeFileSync(appBuildGradlePath, content, 'utf8');
  
  console.log('✅ versionCode 已更新');
}

function buildAAB() {
  console.log('\n🔨 开始构建 AAB...');
  console.log('⏳ 这可能需要 3-5 分钟...\n');
  
  try {
    execSync(
      'cd android && ./gradlew bundleRelease --no-daemon',
      { 
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
        env: { ...process.env }
      }
    );
    
    const aabPath = path.join(__dirname, '../android/app/build/outputs/bundle/release/app-release.aab');
    
    if (!fs.existsSync(aabPath)) {
      throw new Error(`AAB file not created at: ${aabPath}`);
    }
    
    const fileSize = fs.statSync(aabPath).size;
    console.log(`\n✅ AAB 构建成功！`);
    console.log(`📦 文件大小：${(fileSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`📍 文件位置：${aabPath}`);
    return aabPath;
    
  } catch (error) {
    console.error('\n❌ AAB 构建失败:', error.message);
    throw error;
  }
}

async function uploadToPlayStore(androidpublisher, aabPath) {
  console.log('\n📤 正在上传到 Google Play Console...');
  
  try {
    const edits = await androidpublisher.edits.insert({
      packageName: PACKAGE_NAME,
    });

    const editId = edits.data.id;
    console.log(`✅ 编辑会话已创建：${editId}`);

    const fileStream = fs.createReadStream(aabPath);
    const fileSize = fs.statSync(aabPath).size;
    
    console.log(`📦 正在上传 ${(fileSize / (1024 * 1024)).toFixed(2)} MB...`);
    
    const uploadResponse = await androidpublisher.edits.bundles.upload({
      editId: editId,
      packageName: PACKAGE_NAME,
      media: {
        mimeType: 'application/octet-stream',
        body: fileStream,
      },
    });

    const uploadedVersionCode = uploadResponse.data.versionCode.toString();
    console.log(`✅ AAB 上传成功！版本号：${uploadedVersionCode}`);

    const today = new Date().toISOString().split('T')[0];
    console.log(`\n🎯 更新 ${TRACK} 发布轨道...`);
    
    await androidpublisher.edits.tracks.update({
      editId: editId,
      packageName: PACKAGE_NAME,
      track: TRACK,
      requestBody: {
        releases: [
          {
            name: `Release ${uploadedVersionCode} - ${today}`,
            versionCodes: [uploadedVersionCode],
            status: 'draft',
          },
        ],
      },
    });

    console.log(`✅ ${TRACK} 轨道已更新`);

    console.log('\n💾 提交更改到 Google Play...');
    await androidpublisher.edits.commit({
      editId: editId,
      packageName: PACKAGE_NAME,
    });

    console.log('✅ 提交成功！');
    console.log('\n🎉 完成！请前往 Google Play Console 审核发布：');
    console.log('https://play.google.com/console/apps/' + PACKAGE_NAME + '/releases/internal');

  } catch (error) {
    console.error('\n❌ 上传失败:', error.message);
    throw error;
  }
}

async function main() {
  const startTime = Date.now();
  
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Treasure Cat - Google Play 自动部署工具                ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    const androidpublisher = await getAndroidPublisher();

    const latestVersionCode = await getLatestVersionCode(androidpublisher);
    const newVersionCode = latestVersionCode + 1;

    console.log(`📈 新版本号将是：${newVersionCode}\n`);

    updateVersionCode(newVersionCode);

    const aabPath = buildAAB();

    await uploadToPlayStore(androidpublisher, aabPath);

    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    console.log(`\n⏱️  总耗时：${duration} 分钟`);
    console.log('\n✅ 所有步骤完成！\n');

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    console.error('\n❌ 部署失败:', error.message);
    console.error('\n错误详情:', error.stack);
    console.log(`\n⏱️  已耗时：${duration} 分钟`);
    console.log('\n💡 提示：如果是权限问题，请确认服务账号已在 Google Play Console 中授予权限');
    process.exit(1);
  }
}

main();
