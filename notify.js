#!/usr/bin/env node
// ─── Patient Angler — Notify Script ──────────────────────────────────────────
// Run this ~1 hour after release.js, once Google Play has approved the update.
// Updates PA_LATEST_VERSION on the server so players see the update banner.
//
// Usage: node notify.js

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT         = __dirname;
const VERSION_JS   = path.join(ROOT, 'www', 'version.js');
const SERVER_INDEX = path.join(
  ROOT, '..', 'TileRoyale', 'tile-royale-server',
  'tile-royale-server', 'src', 'index.ts'
);
const SERVER_DIR   = path.join(
  ROOT, '..', 'TileRoyale', 'tile-royale-server', 'tile-royale-server'
);

// Read current game version from version.js
const versionJsText  = fs.readFileSync(VERSION_JS, 'utf8');
const versionMatch   = versionJsText.match(/GAME_VERSION\s*=\s*'v([^']+)'/);
if (!versionMatch) { console.error('❌ Could not parse version.js'); process.exit(1); }
const newVersion = versionMatch[1]; // e.g. "0.1.12"

// Update PA_LATEST_VERSION in server index.ts
const serverText    = fs.readFileSync(SERVER_INDEX, 'utf8');
const currentMatch  = serverText.match(/PA_LATEST_VERSION\s*=\s*"v([^"]+)"/);
const currentServer = currentMatch ? currentMatch[1] : '?';

if (currentServer === newVersion) {
  console.log(`ℹ️  Server already at v${newVersion} — nothing to do.`);
  process.exit(0);
}

const newServerText = serverText.replace(
  /PA_LATEST_VERSION\s*=\s*"v[^"]+"/,
  `PA_LATEST_VERSION     = "v${newVersion}"`
);
fs.writeFileSync(SERVER_INDEX, newServerText);
console.log(`✓ server index.ts: v${currentServer} → v${newVersion}`);

// Deploy server
console.log('\n── Deploying server ──');
execSync('railway up --detach', { cwd: SERVER_DIR, stdio: 'inherit' });

console.log(`\n✅ Done! Players on v${currentServer} will now see the update notification.`);
