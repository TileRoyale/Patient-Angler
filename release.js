#!/usr/bin/env node
// ─── Patient Angler — Release Script ─────────────────────────────────────────
// Usage: node release.js
//
// Does everything in order:
//   1. Bump versionName (patch +1) and versionCode (+1)
//   2. Update version.js, android/app/build.gradle, server index.ts
//   3. Deploy server (railway up)
//   4. npx cap sync android
//   5. gradlew bundleRelease
//   6. Upload AAB to Play Store production

const fs        = require('fs');
const path      = require('path');
const { execSync } = require('child_process');
const { google } = require('googleapis');

// ─── Paths ────────────────────────────────────────────────────────────────────
const ROOT          = __dirname;
const VERSION_JS    = path.join(ROOT, 'www', 'version.js');
const BUILD_GRADLE  = path.join(ROOT, 'android', 'app', 'build.gradle');
const SERVER_INDEX  = path.join(
  ROOT, '..', 'TileRoyale', 'tile-royale-server',
  'tile-royale-server', 'src', 'index.ts'
);
const AAB_PATH      = path.join(ROOT, 'android', 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
const SERVICE_KEY   = 'C:/Users/Legend/.secrets/tile-royale-service-account.json';
const PACKAGE_NAME  = 'com.henlygames.patientangler';
const JAVA_HOME     = 'C:\\Program Files\\Android\\Android Studio\\jbr';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function run(cmd, opts = {}) {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', ...opts });
}

function bumpVersion(current) {
  // "0.1.11" → "0.1.12"
  const parts = current.replace(/^v/, '').split('.').map(Number);
  parts[2]++;
  return parts.join('.');
}

// ─── 1. Read current versions ─────────────────────────────────────────────────
console.log('\n═══ Patient Angler Release Script ═══\n');

const versionJsText   = fs.readFileSync(VERSION_JS, 'utf8');
const buildGradleText = fs.readFileSync(BUILD_GRADLE, 'utf8');

const currentVersionMatch = versionJsText.match(/GAME_VERSION\s*=\s*'v([^']+)'/);
const currentBuildMatch   = versionJsText.match(/BUILD_NUMBER\s*=\s*(\d+)/);
if (!currentVersionMatch || !currentBuildMatch) {
  console.error('❌ Could not parse version.js'); process.exit(1);
}

const currentVersion = currentVersionMatch[1];          // e.g. "0.1.11"
const currentBuild   = parseInt(currentBuildMatch[1]);  // e.g. 17
const newVersion     = bumpVersion(currentVersion);     // e.g. "0.1.12"
const newBuild       = currentBuild + 1;                // e.g. 18

console.log(`Current: v${currentVersion} / build ${currentBuild}`);
console.log(`New:     v${newVersion} / build ${newBuild}`);

// ─── 2. Update files ──────────────────────────────────────────────────────────
// version.js
fs.writeFileSync(VERSION_JS,
  versionJsText
    .replace(`GAME_VERSION = 'v${currentVersion}'`, `GAME_VERSION = 'v${newVersion}'`)
    .replace(`BUILD_NUMBER  = ${currentBuild}`,      `BUILD_NUMBER  = ${newBuild}`)
);
console.log(`✓ version.js → v${newVersion} / build ${newBuild}`);

// build.gradle
fs.writeFileSync(BUILD_GRADLE,
  buildGradleText
    .replace(`versionCode ${currentBuild}`,       `versionCode ${newBuild}`)
    .replace(`versionName "${currentVersion}"`,   `versionName "${newVersion}"`)
);
console.log(`✓ build.gradle → versionCode ${newBuild} / versionName ${newVersion}`);

// upload script log line
const uploadScript = path.join(ROOT, 'upload_to_play_store.js');
const uploadText   = fs.readFileSync(uploadScript, 'utf8');
fs.writeFileSync(uploadScript,
  uploadText.replace(/Edit committed — v[\d.]+ live/, `Edit committed — v${newVersion} live`)
);

// ─── 3. Cap sync ─────────────────────────────────────────────────────────────
console.log('\n── Syncing Capacitor ──');
run('npx cap sync android', { cwd: ROOT });

// ─── 5. Gradle build ──────────────────────────────────────────────────────────
console.log('\n── Building AAB ──');
run('.\\gradlew bundleRelease', {
  cwd: path.join(ROOT, 'android'),
  env: { ...process.env, JAVA_HOME, PATH: `${JAVA_HOME}\\bin;${process.env.PATH}` }
});

// ─── 6. Upload to Play Store ──────────────────────────────────────────────────
console.log('\n── Uploading to Play Store ──');
(async () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_KEY,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });
  const publisher = google.androidpublisher({ version: 'v3', auth: await auth.getClient() });

  const editRes = await publisher.edits.insert({ packageName: PACKAGE_NAME });
  const editId  = editRes.data.id;
  console.log('Edit opened:', editId);

  const aabRes = await publisher.edits.bundles.upload({
    packageName: PACKAGE_NAME,
    editId,
    media: { mimeType: 'application/octet-stream', body: fs.createReadStream(AAB_PATH) },
  });
  console.log('AAB uploaded, versionCode:', aabRes.data.versionCode);

  await publisher.edits.tracks.update({
    packageName: PACKAGE_NAME,
    editId,
    track: 'production',
    requestBody: { track: 'production', releases: [{ versionCodes: [aabRes.data.versionCode], status: 'completed' }] },
  });

  await publisher.edits.commit({ packageName: PACKAGE_NAME, editId });
  console.log(`\n✅ v${newVersion} (build ${newBuild}) uploaded to Play Store.`);
  console.log(`\n⏳ Wait ~1 hour for Google review, then run:`);
  console.log(`   node notify.js`);
  console.log(`   (updates server so players see the update notification)\n`);
})().catch(e => { console.error('❌ Upload failed:', e.message || e); process.exit(1); });
