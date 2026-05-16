const fs = require('fs');
const { google } = require('googleapis');

const keyPath = './.play-store-key.json';

console.log('🔑 检查密钥文件...');

if (!fs.existsSync(keyPath)) {
  console.error('❌ 密钥文件不存在:', keyPath);
  process.exit(1);
}

console.log('✅ 密钥文件存在');

const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
console.log('📝 密钥类型:', keyData.type);
console.log('📧 客户端邮箱:', keyData.client_email);

console.log('\n🔐 尝试认证...');

const auth = new google.auth.GoogleAuth({
  keyFile: keyPath,
  scopes: ['https://www.googleapis.com/auth/androidpublisher'],
});

auth.getClient().then(client => {
  console.log('✅ 认证成功！');
  console.log('🎯 正在获取 Play Store 信息...');
  
  const androidpublisher = google.androidpublisher({
    version: 'v3',
    auth: client,
  });
  
  return androidpublisher.edits.insert({
    packageName: 'com.treasurecat.app',
  });
}).then(edit => {
  console.log('✅ 成功连接到 Google Play API!');
  console.log('Edit ID:', edit.data.id);
  process.exit(0);
}).catch(error => {
  console.error('❌ 错误:', error.message);
  if (error.code === 403) {
    console.error('\n⚠️  权限问题：请确认服务账号已在 Google Play Console 中授予权限');
  } else if (error.code === 404) {
    console.error('\n⚠️  应用不存在或未在 Play Console 中创建');
  }
  process.exit(1);
});
