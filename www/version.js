// ===== VERSION — SINGLE SOURCE OF TRUTH =====
// When bumping: update GAME_VERSION + BUILD_NUMBER here AND android/app/build.gradle versionName/versionCode
// Also bump PA_MIN_CLIENT_VERSION in tile-royale-server/src/index.ts when forcing an update
const GAME_VERSION = 'v0.8.7';
const BUILD_NUMBER  = 46;

document.addEventListener('DOMContentLoaded', () => {
  const badge = document.getElementById('version-badge');
  if (badge) badge.textContent = GAME_VERSION;

  const aboutVer = document.getElementById('about-version-text');
  if (aboutVer) aboutVer.textContent = `${GAME_VERSION} · Build ${BUILD_NUMBER}`;

  checkClientVersion();
});

function _parseVersion(v) {
  return (v || '').replace(/^v/, '').split('.').map(Number);
}
function _isVersionOutdated(client, minimum) {
  const c = _parseVersion(client), m = _parseVersion(minimum);
  for (let i = 0; i < 3; i++) {
    if ((c[i] || 0) < (m[i] || 0)) return true;
    if ((c[i] || 0) > (m[i] || 0)) return false;
  }
  return false;
}

let _versionChecked = false;

async function checkClientVersion(retryCount = 0) {
  if (_versionChecked) return;
  try {
    const res = await fetch('https://tile-royale-eu-production.up.railway.app/pa/version', { cache: 'no-store' });
    const data = await res.json();
    const min    = data.minClientVersion;
    const latest = data.latestVersion;

    _versionChecked = true;

    if (min && _isVersionOutdated(GAME_VERSION, min)) {
      // Forced update — block the game
      const overlay = document.getElementById('update-required-overlay');
      const info    = document.getElementById('update-version-info');
      if (info)    info.textContent = `Your version: ${GAME_VERSION} · Required: ${min}`;
      if (overlay) overlay.style.display = 'flex';
    } else if (latest && _isVersionOutdated(GAME_VERSION, latest)) {
      // Soft update — show dismissible banner
      const banner = document.getElementById('update-available-banner');
      if (banner) banner.style.display = 'flex';
    }
  } catch (e) {
    // Network unavailable — retry up to 3 times at 10s intervals (handles slow Android startup)
    if (retryCount < 3) {
      setTimeout(() => checkClientVersion(retryCount + 1), 10000);
    }
  }
}

function openPlayStorePage() {
  const url = 'https://play.google.com/store/apps/details?id=com.henlygames.patientangler';
  try {
    if (window.Capacitor?.Plugins?.Browser) {
      window.Capacitor.Plugins.Browser.open({ url });
    } else {
      window.open(url, '_system');
    }
  } catch (e) {
    window.open(url, '_blank');
  }
}
