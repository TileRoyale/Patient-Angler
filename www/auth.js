// ─── Firebase Auth + Railway Cloud Save ────────────────────────────────────────
// Auth:  @capacitor-firebase/authentication (Google Sign-In)
// Save:  Railway backend (anti-cheat validated, PostgreSQL storage)
//        POST /pa/save  { save }  — Authorization: Bearer <firebase_id_token>
//        GET  /pa/load/:uid       — Authorization: Bearer <firebase_id_token>
//        Server extracts uid from verified token; body uid is ignored.

const PA_SERVER       = 'https://tile-royale-eu-production.up.railway.app';
const CLOUD_SYNC_MS   = 5 * 60 * 1000; // 5 min auto-sync

let _firebaseAuth      = null;
let _currentUser       = null;
let _cloudSyncInterval = null;
let _saveDebounce      = null;

function getFirebaseAuth() {
  if (!_firebaseAuth) _firebaseAuth = window.Capacitor?.Plugins?.FirebaseAuthentication || null;
  return _firebaseAuth;
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function initAuth() {
  const FA = getFirebaseAuth();
  if (!FA) return;

  FA.addListener('authStateChange', async (result) => {
    _currentUser = result.user;
    updateAuthUI();
    if (_currentUser) {
      await loadCloudSave();
      _startCloudSync();
      if (typeof initAnalytics === 'function') initAnalytics();
      setTimeout(() => { if (typeof sendAnalyticsSnapshot === 'function') sendAnalyticsSnapshot('auth_change'); }, 3000);
    } else {
      _stopCloudSync();
    }
  });

  try {
    const result = await FA.getCurrentUser();
    _currentUser = result.user || null;
    updateAuthUI();
    if (_currentUser) {
      await loadCloudSave();
      _startCloudSync();
      if (typeof initAnalytics === 'function') initAnalytics();
      setTimeout(() => { if (typeof sendAnalyticsSnapshot === 'function') sendAnalyticsSnapshot('init_auth'); }, 3000);
    }
  } catch (e) { /* not signed in */ }
}

// ── Sign in / out ─────────────────────────────────────────────────────────────
async function signInWithGoogle() {
  const FA = getFirebaseAuth();
  if (!FA) { showStatus('Google Sign-In requires the Android app.', 2000); return; }
  try {
    const result = await FA.signInWithGoogle();
    _currentUser = result.user;
    updateAuthUI();
    await loadCloudSave();
    _startCloudSync();
    showStatus('Signed in as ' + (_currentUser.displayName || 'Player'), 2000);
    renderSettings();
  } catch (e) {
    console.error('[Auth] signInWithGoogle error:', e);
    const msg = e?.message || '';
    if (msg.toLowerCase().includes('cancel') || msg.includes('12501') || msg.includes('network_error')) {
      showStatus('Sign-in cancelled or unavailable.', 2000);
    } else {
      showStatus('Sign-in failed: ' + (msg || 'unknown error'), 3000);
    }
  }
}

async function signOut() {
  const FA = getFirebaseAuth();
  if (!FA) return;
  await saveCloudSave();
  await FA.signOut();
  _currentUser = null;
  _stopCloudSync();
  updateAuthUI();
  renderSettings();
  showStatus('Signed out.', 1500);
}

function getCurrentUser() { return _currentUser; }
function isSignedIn()     { return !!_currentUser; }

// ── Cloud Save (Railway) ──────────────────────────────────────────────────────

async function _getPAToken() {
  const FA = getFirebaseAuth();
  if (!FA || !_currentUser) return null;
  try {
    const result = await FA.getIdToken();
    return result.token || null;
  } catch (e) {
    console.warn('[Auth] getIdToken failed:', e);
    return null;
  }
}

async function saveCloudSave() {
  if (!_currentUser) return;
  try {
    const token = await _getPAToken();
    if (!token) return;
    const snapshot = { ...G, _savedAt: Date.now() };
    const res = await fetch(PA_SERVER + '/pa/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ save: snapshot }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (body.error === 'validation_failed') {
        console.warn('[PA] Save rejected by anti-cheat:', body.reason);
      }
    }
  } catch (e) {
    console.warn('Cloud save failed:', e);
  }
}

// Returns true if cloud save represents more real progress than local state.
// Used to detect reinstall scenarios where localTs > cloudTs due to saveState()
// running at startup before the cloud fetch completes.
function _cloudIsRicher(cloud, local) {
  const ZONE_ORDER = ['pond','river','lake','bay','sea','ocean','abyss'];
  const cloudZone  = ZONE_ORDER.indexOf(cloud.stats?.recHighestZone  || cloud.currentZone  || 'pond');
  const localZone  = ZONE_ORDER.indexOf(local.stats?.recHighestZone  || local.currentZone  || 'pond');
  if (cloudZone > localZone) return true;
  const cloudRods  = (cloud.ownedRods  || []).length;
  const localRods  = (local.ownedRods  || []).length;
  if (cloudRods > localRods) return true;
  const cloudTrans = (cloud.ownedTransport || []).length;
  const localTrans = (local.ownedTransport || []).length;
  if (cloudTrans > localTrans) return true;
  const cloudLife  = (cloud.stats?.lifeCoinsEarned || 0) + (cloud.coins || 0);
  const localLife  = (local.stats?.lifeCoinsEarned || 0) + (local.coins || 0);
  if (cloudLife > localLife * 5 && cloudLife > 5000) return true;
  return false;
}

async function loadCloudSave() {
  if (!_currentUser) return;

  try {
    const token = await _getPAToken();
    if (!token) return;
    const res = await fetch(PA_SERVER + '/pa/load/' + encodeURIComponent(_currentUser.uid), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) return;
    const body = await res.json();
    if (!body.ok || !body.save) return;
    const cloud   = body.save;
    const localTs = G._savedAt || 0;
    const cloudTs = cloud._savedAt || 0;
    // Prefer cloud when:
    // 1. No local save existed before init (fresh install / wipe)
    // 2. Cloud timestamp is newer (normal sync)
    // 3. Cloud has more game progress (reinstall detection — catches the case where
    //    saveState() at startup set localTs=now, making localTs > cloudTs even though
    //    the cloud has the real save and local only has a default/post-reinstall state)
    const freshInstall = typeof _hadLocalSave !== 'undefined' && !_hadLocalSave;
    if (freshInstall || cloudTs > localTs || _cloudIsRicher(cloud, G)) {
      Object.assign(G, cloud);
      saveState();
      updateHUD();
      showStatus('Cloud save loaded!', 2000);
    }
  } catch (e) {
    console.warn('Cloud load failed:', e);
  }
}

// Called from saveState() to also push to cloud (debounced)
function triggerCloudSave() {
  if (!isSignedIn()) return;
  if (_saveDebounce) clearTimeout(_saveDebounce);
  _saveDebounce = setTimeout(saveCloudSave, 3000);
}

function _startCloudSync() {
  _stopCloudSync();
  _cloudSyncInterval = setInterval(saveCloudSave, CLOUD_SYNC_MS);
}
function _stopCloudSync() {
  if (_cloudSyncInterval) { clearInterval(_cloudSyncInterval); _cloudSyncInterval = null; }
}

// ── UI ────────────────────────────────────────────────────────────────────────
function updateAuthUI() {
  const row       = document.getElementById('auth-row');
  const loginBtn  = document.getElementById('btn-google-login');
  const userInfo  = document.getElementById('auth-user-info');
  const userName  = document.getElementById('auth-user-name');
  if (!row) return;

  if (_currentUser) {
    if (loginBtn)  loginBtn.style.display  = 'none';
    if (userInfo)  userInfo.style.display  = 'flex';
    if (userName)  userName.textContent    = _currentUser.displayName || _currentUser.email || 'Player';
  } else {
    if (loginBtn)  loginBtn.style.display  = 'block';
    if (userInfo)  userInfo.style.display  = 'none';
  }
}
