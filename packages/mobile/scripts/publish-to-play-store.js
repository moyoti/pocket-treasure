#!/usr/bin/env node

/**
 * Google Play Store Auto-Publish Script
 * 
 * Features:
 * 1. Fetch latest version code from Google Play Console (internal testing track)
 * 2. Increment version code automatically
 * 3. Build AAB with new version code
 * 4. Upload to Google Play Console internal testing track
 * 
 * Prerequisites:
 * - GOOGLE_SERVICE_ACCOUNT_KEY environment variable pointing to service account JSON file
 * - GOOGLE_PLAY_PACKAGE_NAME environment variable (e.g., com.treasurecat.app)
 * - Google Service Account with Google Play Android Developer API access
 */

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
  let SERVICE_ACCOUNT_KEY_PATH = null;
  
  for (const keyPath of POSSIBLE_KEY_PATHS) {
    if (fs.existsSync(keyPath)) {
      SERVICE_ACCOUNT_KEY_PATH = keyPath;
      break;
    }
  }
  
  if (!SERVICE_ACCOUNT_KEY_PATH) {
    throw new Error(
      'Service account key not found. Please place it at:\n' +
      '  - ./.play-store-key.json\n' +
      '  - ./play-store-key.json\n' +
      '  - ../.play-store-key.json\n' +
      '\nOr set GOOGLE_SERVICE_ACCOUNT_KEY environment variable.'
    );
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });

  const androidpublisher = google.androidpublisher({
    version: 'v3',
    auth,
  });

  return androidpublisher;
}

async function getLatestVersionCode(androidpublisher) {
  console.log(`📱 Fetching latest version code for ${PACKAGE_NAME}...`);
  
  try {
    const edits = await androidpublisher.edits.insert({
      packageName: PACKAGE_NAME,
    });

    const editId = edits.data.id;

    // Get all tracks
    const tracksResponse = await androidpublisher.edits.tracks.get({
      editId: editId,
      packageName: PACKAGE_NAME,
      track: TRACK,
    });

    // Commit the edit (we just needed to read)
    await androidpublisher.edits.commit({
      editId: editId,
      packageName: PACKAGE_NAME,
    });

    const track = tracksResponse.data;
    
    if (!track.releases || track.releases.length === 0) {
      console.log('ℹ️  No releases found in internal track. Starting from version code 1.');
      return 0;
    }

    // Find the highest version code from all releases
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

    console.log(`✅ Latest version code in ${TRACK} track: ${maxVersionCode}`);
    return maxVersionCode;

  } catch (error) {
    if (error.code === 404) {
      console.log('ℹ️  Internal track not found. Starting from version code 1.');
      return 0;
    }
    throw error;
  }
}

function updateVersionCodeInAppBuildGradle(newVersionCode) {
  const appBuildGradlePath = path.join(__dirname, '../android/app/build.gradle');
  
  if (!fs.existsSync(appBuildGradlePath)) {
    throw new Error(`build.gradle not found at: ${appBuildGradlePath}`);
  }

  let content = fs.readFileSync(appBuildGradlePath, 'utf8');
  
  const versionCodeRegex =/(versionCode\s+)(\d+)/;
  const match = content.match(versionCodeRegex);
  
  if (!match) {
    throw new Error('Could not find versionCode in build.gradle');
  }

  const oldVersionCode = parseInt(match[2], 10);
  console.log(`📝 Updating versionCode from ${oldVersionCode} to ${newVersionCode}`);
  
  content = content.replace(versionCodeRegex, `$1${newVersionCode}`);
  fs.writeFileSync(appBuildGradlePath, content, 'utf8');
  
  console.log('✅ versionCode updated successfully');
}

function buildAAB() {
  console.log('🔨 Building AAB...');
  
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
    
    console.log(`✅ AAB built successfully: ${aabPath}`);
    return aabPath;
    
  } catch (error) {
    console.error('❌ AAB build failed:', error.message);
    throw error;
  }
}

async function uploadToPlayStore(androidpublisher, aabPath) {
  console.log('📤 Uploading AAB to Google Play Console...');
  
  try {
    // Insert a new edit
    const edits = await androidpublisher.edits.insert({
      packageName: PACKAGE_NAME,
    });

    const editId = edits.data.id;
    console.log(`✅ Edit created: ${editId}`);

    // Upload the AAB
    const fileStream = fs.createReadStream(aabPath);
    const fileSize = fs.statSync(aabPath).size;
    
    console.log(`📦 Uploading ${fileSize / (1024 * 1024)} MB...`);
    
    const uploadResponse = await androidpublisher.edits.bundles.upload({
      editId: editId,
      packageName: PACKAGE_NAME,
      media: {
        mimeType: 'application/octet-stream',
        body: fileStream,
      },
    });

    const uploadedVersionCode = uploadResponse.data.versionCode.toString();
    console.log(`✅ AAB uploaded successfully with version code: ${uploadedVersionCode}`);

    // Update the internal testing track
    console.log(`🎯 Updating ${TRACK} track...`);
    
    await androidpublisher.edits.tracks.update({
      editId: editId,
      packageName: PACKAGE_NAME,
      track: TRACK,
      requestBody: {
        releases: [
          {
            name: `Release ${uploadedVersionCode} - ${new Date().toISOString().split('T')[0]}`,
            versionCodes: [uploadedVersionCode],
            status: 'draft', // Can be: draft, inProgress, halted, completed
          },
        ],
      },
    });

    console.log(`✅ ${TRACK} track updated`);

    console.log('💾 Committing changes...');
    await androidpublisher.edits.commit({
      editId: editId,
      packageName: PACKAGE_NAME,
    });

    console.log('✅ Changes committed successfully!');
    console.log('🎉 Upload complete! Check Google Play Console to review and publish.');

  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting Google Play Store auto-publish...\n');

    // Initialize API client
    const androidpublisher = await getAndroidPublisher();

    // Get latest version code
    const latestVersionCode = await getLatestVersionCode(androidpublisher);
    const newVersionCode = latestVersionCode + 1;

    console.log(`📈 New version code will be: ${newVersionCode}\n`);

    updateVersionCodeInAppBuildGradle(newVersionCode);

    const aabPath = buildAAB();

    await uploadToPlayStore(androidpublisher, aabPath);

    console.log('\n✅ All done!');

  } catch (error) {
    console.error('\n❌ Auto-publish failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
main();
