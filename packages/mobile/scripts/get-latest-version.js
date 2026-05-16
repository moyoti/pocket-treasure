#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');

const PACKAGE_NAME = process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.treasurecat.app';
const TRACK = 'internal';

const POSSIBLE_KEY_PATHS = [
  './.play-store-key.json',
  './play-store-key.json',
  '../.play-store-key.json',
  process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
].filter(Boolean);

async function getLatestVersionCode() {
  let SERVICE_ACCOUNT_KEY_PATH = null;
  
  for (const path of POSSIBLE_KEY_PATHS) {
    const fs = require('fs');
    if (fs.existsSync(path)) {
      SERVICE_ACCOUNT_KEY_PATH = path;
      break;
    }
  }
  
  if (!SERVICE_ACCOUNT_KEY_PATH) {
    console.error('❌ Error: Service account key file not found');
    console.error('');
    console.error('Please place your key file in one of these locations:');
    console.error('  - ./.play-store-key.json');
    console.error('  - ./play-store-key.json');
    console.error('  - ../.play-store-key.json');
    console.error('');
    console.error('Or set the GOOGLE_SERVICE_ACCOUNT_KEY environment variable.');
    console.error('Example: export GOOGLE_SERVICE_ACCOUNT_KEY=/path/to/key.json');
    process.exit(1);
  }

  if (!fs.existsSync(SERVICE_ACCOUNT_KEY_PATH)) {
    console.error(`❌ Error: Service account key file not found: ${SERVICE_ACCOUNT_KEY_PATH}`);
    process.exit(1);
  }

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: SERVICE_ACCOUNT_KEY_PATH,
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });

    const androidpublisher = google.androidpublisher({
      version: 'v3',
      auth,
    });

    console.log(`📱 Fetching version code for ${PACKAGE_NAME} (${TRACK} track)...`);

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
      console.log('ℹ️  No releases found. Latest version code: 0');
      return;
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

    console.log(`✅ Latest version code: ${maxVersionCode}`);
    console.log(`📈 Next version code should be: ${maxVersionCode + 1}`);

  } catch (error) {
    if (error.code === 404) {
      console.log('ℹ️  Track not found. This might be the first release.');
      console.log('ℹ️  Latest version code: 0');
      console.log('📈 Next version code should be: 1');
    } else {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
}

getLatestVersionCode();
