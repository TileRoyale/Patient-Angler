// ─── AdMob Integration ────────────────────────────────────────────────────────
// Plugin: @capacitor-community/admob v6.2.0

const ADMOB_APP_ID = 'ca-app-pub-1687381057809117~5623450627';

// AdMob approved 2026-07-08 (status: Ready) — production ads live.
// Flip ADMOB_USE_TEST_ID to true only for local ad testing.
const ADMOB_USE_TEST_ID = false;
const ADMOB_REWARDED_ID = ADMOB_USE_TEST_ID
  ? 'ca-app-pub-3940256099942544/5224354917'   // Google official test ID — always works
  : 'ca-app-pub-1687381057809117/5149073837';   // Production ID — needs AdMob approval

let _adMob         = null;
let _rewardedReady = false;
let _preparePromise = null; // shared promise so concurrent callers all wait on the same load
let _retryTimer    = null;  // background retry — re-attempts prepare every 30s if not ready
let _quickRetry    = null;  // one-shot 3s retry after a failed load
let _prepareStart  = 0;     // timestamp when current prepare began (stale-promise guard)

function getAdMob() {
  if (!_adMob) _adMob = window.Capacitor?.Plugins?.AdMob || null;
  return _adMob;
}

async function initAdMob() {
  const AM = getAdMob();
  if (!AM) return;
  try {
    // Step 1: Request GDPR consent info (required for EU/EEA users)
    // Without this, AdMob will not serve ads to EU players (e.g. Greece, Estonia)
    try {
      const consentInfo = await AM.requestConsentInfo({ tagForUnderAgeOfConsent: false });
      // consentStatus: 'REQUIRED' | 'NOT_REQUIRED' | 'OBTAINED' | 'UNKNOWN'
      if (consentInfo.isConsentFormAvailable &&
          (consentInfo.consentStatus === 'REQUIRED' || consentInfo.consentStatus === 'UNKNOWN')) {
        await AM.loadAndShowConsentFormIfRequired();
      }
    } catch (consentErr) {
      // Consent SDK unavailable or already obtained — proceed anyway
      console.warn('AdMob consent check skipped:', consentErr);
    }

    // Step 2: Initialize AdMob after consent is resolved
    await AM.initialize({
      testingDevices: [],
      initializeForTesting: false,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
      maxAdContentRating: 'General',
    });
    await _prepareRewarded();

    // Retry every 15s so there's minimal gap after a failed load
    if (!_retryTimer) {
      _retryTimer = setInterval(() => {
        if (!_rewardedReady && !_preparePromise) _prepareRewarded();
      }, 15 * 1000);
    }

    // Use Capacitor App plugin for reliable foreground detection on Android.
    // document.visibilitychange is not reliably fired by the Android WebView after
    // long background sessions; App.appStateChange always fires on resume.
    const AppPlugin = window.Capacitor?.Plugins?.App;
    if (AppPlugin) {
      AppPlugin.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          // If a prepare has been running for >10s it's stale — force-reset it.
          if (_preparePromise && _prepareStart && (Date.now() - _prepareStart) > 10000) {
            _preparePromise = null;
            _rewardedReady  = false;
          }
          if (!_rewardedReady && !_preparePromise) _prepareRewarded();
        }
      });
    } else {
      // Fallback for browser / non-Capacitor environments
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !_rewardedReady && !_preparePromise) {
          _prepareRewarded();
        }
      });
    }
  } catch (e) {
    console.warn('AdMob init failed:', e);
  }
}

// Returns the in-progress promise if a load is already running so all callers wait together.
function _prepareRewarded() {
  const AM = getAdMob();
  if (!AM) return Promise.resolve();
  if (_preparePromise) return _preparePromise; // already loading — share the promise

  _rewardedReady = false;
  _prepareStart  = Date.now();
  _preparePromise = new Promise((resolve) => {
    let settled = false;

    function done(loaded) {
      if (settled) return;
      settled = true;
      _rewardedReady  = loaded;
      _preparePromise = null;
      if (!loaded) {
        // Quick retry after 3s — don't wait for the 15s interval
        if (_quickRetry) clearTimeout(_quickRetry);
        _quickRetry = setTimeout(() => {
          _quickRetry = null;
          if (!_rewardedReady && !_preparePromise) _prepareRewarded();
        }, 3000);
      }
      // FIX: resolve immediately — do NOT block on removeAllListeners().
      // On Android, removeAllListeners() can hang after long background sessions,
      // which permanently stalls any awaiter (e.g. the claim button).
      resolve();
      AM.removeAllListeners().catch(() => {});
    }

    // Timeout — if no event within 8s, give up and quick-retry
    const timeout = setTimeout(() => done(false), 8000);

    AM.addListener('onRewardedVideoAdLoaded', () => {
      clearTimeout(timeout);
      done(true);
    });
    AM.addListener('onRewardedVideoAdFailedToLoad', (err) => {
      clearTimeout(timeout);
      console.warn('Rewarded ad failed to load:', err);
      done(false);
    });

    AM.prepareRewardVideoAd({ adId: ADMOB_REWARDED_ID, isTesting: false })
      .catch((e) => {
        clearTimeout(timeout);
        console.warn('prepareRewardVideoAd threw:', e);
        done(false);
      });
  });

  return _preparePromise;
}

// onReward  — called when user watches the full ad
// onDismiss — called if user skips / ad fails (no reward given)
async function showRewardedAd(onReward, onDismiss) {
  const AM = getAdMob();

  // Web / no plugin → 5s countdown fallback
  if (!AM) {
    _webAdFallback(onReward, onDismiss);
    return;
  }

  // Update UI immediately so user sees something
  const btn    = document.getElementById('se-claim-btn');
  const adNote = document.getElementById('se-ad-note');
  if (btn) { btn.disabled = true; btn.textContent = 'Loading ad…'; }

  // Safety net — if the whole flow hangs for any reason, unblock the button after 15s.
  let _safetyFired = false;
  const _safetyTimer = setTimeout(() => {
    _safetyFired    = true;
    _rewardedReady  = false;
    _preparePromise = null;
    if (btn)    { btn.disabled = false; btn.textContent = 'Try Again'; }
    if (adNote) adNote.textContent = 'Ad not available. Tap Try Again or skip.';
    if (onDismiss) onDismiss();
  }, 15000);

  if (!_rewardedReady) {
    if (adNote) adNote.textContent = 'Loading ad, please wait…';
    await _prepareRewarded(); // waits for any in-progress load to finish
    if (_safetyFired) return;
    if (!_rewardedReady) {
      clearTimeout(_safetyTimer);
      if (btn)    { btn.disabled = false; btn.textContent = btn.dataset.label || 'Watch Ad'; }
      if (adNote) adNote.textContent = 'Ad not available right now. Try again later.';
      if (onDismiss) onDismiss();
      return;
    }
  }

  if (_safetyFired) return;
  if (btn) btn.textContent = 'Ad loading…';

  try {
    clearTimeout(_safetyTimer);
    await AM.removeAllListeners();
    let _rewarded = false;

    AM.addListener('onRewardedVideoAdReward', () => {
      _rewarded = true;
    });
    AM.addListener('onRewardedVideoAdDismissed', () => {
      _rewardedReady = false;
      AM.removeAllListeners().then(() => _prepareRewarded()); // pre-load next ad after listeners are cleared
      if (_rewarded) {
        onReward();
      } else {
        if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || 'Watch Ad'; }
        if (onDismiss) onDismiss();
      }
    });
    AM.addListener('onRewardedVideoAdFailedToShow', (err) => {
      console.warn('Ad failed to show:', err);
      _rewardedReady = false;
      AM.removeAllListeners().then(() => _prepareRewarded()); // pre-load after listeners are cleared
      if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || 'Watch Ad'; }
      if (adNote) adNote.textContent = 'Ad failed to show. Try again.';
      if (onDismiss) onDismiss();
    });

    await AM.showRewardVideoAd();
  } catch (e) {
    console.error('showRewardVideoAd threw:', e);
    _rewardedReady = false;
    AM.removeAllListeners().then(() => _prepareRewarded()); // pre-load after listeners are cleared
    if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || 'Watch Ad'; }
    if (adNote) adNote.textContent = 'Ad error. Try again.';
    if (onDismiss) onDismiss();
  }
}

// Public — called by game.js when a special event fires so the ad starts loading early
function prepareRewardedAd() {
  if (!G?.removeAds && !_rewardedReady && !_preparePromise) _prepareRewarded();
}

// Web fallback — 5s countdown (only used in browser, never on Android)
function _webAdFallback(onReward, onDismiss) {
  const btn    = document.getElementById('se-claim-btn');
  const adNote = document.getElementById('se-ad-note');
  if (!btn) { if (onReward) onReward(); return; }
  let secs = 5;
  btn.disabled = true;
  btn.textContent = 'Ad playing… ' + secs + 's';
  if (adNote) adNote.textContent = 'Watching ad…';
  const iv = setInterval(() => {
    secs--;
    if (secs <= 0) {
      clearInterval(iv);
      btn.disabled = false;
      if (onReward) onReward();
    } else {
      btn.textContent = 'Ad playing… ' + secs + 's';
    }
  }, 1000);
}
