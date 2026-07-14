const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const PACKAGE_NAME = 'com.henlygames.patientangler';
const AAB_PATH = path.join(__dirname, 'android/app/build/outputs/bundle/release/app-release.aab');
const SERVICE_ACCOUNT_KEY = 'C:/Users/Legend/.secrets/tile-royale-service-account.json';

async function upload() {
  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_KEY,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });
  const client = await auth.getClient();
  const publisher = google.androidpublisher({ version: 'v3', auth: client });

  // Open edit
  const editRes = await publisher.edits.insert({ packageName: PACKAGE_NAME });
  const editId = editRes.data.id;
  console.log('Edit opened:', editId);

  // Upload AAB
  const aabRes = await publisher.edits.bundles.upload({
    packageName: PACKAGE_NAME,
    editId,
    media: { mimeType: 'application/octet-stream', body: fs.createReadStream(AAB_PATH) },
  });
  const versionCode = aabRes.data.versionCode;
  console.log('AAB uploaded, versionCode:', versionCode);

  // Assign to production track
  await publisher.edits.tracks.update({
    packageName: PACKAGE_NAME,
    editId,
    track: 'production',
    requestBody: {
      track: 'production',
      releases: [{ versionCodes: [versionCode], status: 'completed' }],
    },
  });
  console.log('Assigned to production track');

  // Commit edit
  await publisher.edits.commit({ packageName: PACKAGE_NAME, editId });
  console.log('Edit committed — v0.1.13 live on Play Store!');
}

upload().catch(e => { console.error(e.message || e); process.exit(1); });
