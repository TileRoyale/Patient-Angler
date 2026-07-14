// ─── In-App Purchases — Google Play Billing 7.1.1 via custom BillingPlugin ───
// Non-consumables: remove_ads, permanent_autoseller, dev_support_package
// Consumables:     starter, pouch, chest, vault  (diamond packs)

const PRODUCT = {
  REMOVE_ADS:           'remove_ads',
  PERMANENT_AUTOSELLER: 'permanent_autoseller',
  DEV_SUPPORT:          'dev_support_package',
  STARTER:              'starter',
  POUCH:                'pouch',
  CHEST:                'chest',
  VAULT:                'vault',
};

const NON_CONSUMABLES = [
  PRODUCT.REMOVE_ADS,
  PRODUCT.PERMANENT_AUTOSELLER,
  PRODUCT.DEV_SUPPORT,
];

// FIX #10: single source of truth for diamond amounts — DIAMOND_PACKS in game.js
// reads from this map so both files stay in sync automatically.
const DIAMOND_PACK_MAP = {
  starter: 80,
  pouch:   200,
  chest:   550,
  vault:   1200,
};

let _billing = null;

function getBilling() {
  if (!_billing) _billing = window.Capacitor?.Plugins?.Billing || null;
  return _billing;
}

function isAndroid() {
  return window.Capacitor?.getPlatform() === 'android';
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function initIAP() {
  if (!isAndroid()) return;
  const B = getBilling();
  if (!B) return;
  try {
    await _restoreNonConsumables();
  } catch (e) {
    console.warn('[IAP] init restore failed:', e);
  }
}

// ── Public purchase entry points (called from game.js) ────────────────────────

async function iapBuyRemoveAds() {
  // FIX #6: owned guard prevents ITEM_ALREADY_OWNED error on double-tap
  if (G.removeAds) { showStatus('Already owned!', 1500); return; }
  await _purchase(PRODUCT.REMOVE_ADS, () => {
    G.removeAds = true;
    saveState(); updateHUD(); renderDiamondStore();
    showStatus('Ads removed! Permanent +25% fishing speed active.', 2500);
  });
}

async function iapBuyPermanentAutoSell() {
  // FIX #6: owned guard
  if (G.autoSellPermanent) { showStatus('Already owned!', 1500); return; }
  await _purchase(PRODUCT.PERMANENT_AUTOSELLER, () => {
    G.autoSellPermanent = true;
    G.autoSellEnabled   = true;
    saveState(); renderDiamondStore();
    showStatus('Permanent Auto-Seller unlocked!', 2000);
  });
}

async function iapBuyDevSupport() {
  if (G.devSupportOwned) { showStatus('Already owned!', 1500); return; }
  await _purchase(PRODUCT.DEV_SUPPORT, () => {
    G.devSupportOwned = true;
    saveState(); updateHUD(); renderDiamondStore();
    showStatus('+25% fishing speed, sell price & storage unlocked!', 3000);
  });
}

// FIX #10: removed dead _ignoredDiamonds parameter — amounts come from DIAMOND_PACK_MAP
async function iapBuyDiamondPack(packId) {
  const diamonds = DIAMOND_PACK_MAP[packId];
  if (!diamonds) { console.warn('[IAP] Unknown pack:', packId); return; }
  if (packId === 'starter' && G.starterPackClaimed) {
    showStatus('Starter Pack already claimed!', 1500);
    return;
  }
  await _purchase(packId, () => {
    if (packId === 'starter') G.starterPackClaimed = true;
    G.diamonds = (G.diamonds || 0) + diamonds;
    saveState(); updateHUD(); renderDiamondStore();
    showStatus('+' + diamonds + ' Diamonds added!', 2000);
  });
}

async function restorePurchases() {
  if (!isAndroid()) { showStatus('Restore is only available on Android.', 2000); return; }
  const B = getBilling();
  if (!B) { showStatus('Store unavailable. Please update the app.', 2500); return; }
  try {
    const { purchases } = await B.restoreTransactions();
    let restored = 0;
    for (const p of (purchases || [])) {
      for (const pid of (p.productIds || [])) {
        if (_grantNonConsumable(pid)) restored++;
      }
    }
    saveState(); updateHUD(); renderDiamondStore();
    showStatus(restored > 0 ? restored + ' purchase(s) restored!' : 'Nothing to restore.', 2000);
  } catch (e) {
    showStatus('Restore failed. Please try again.', 2500);
  }
}

const PA_IAP_VERIFY_URL = 'https://tile-royale-eu-production.up.railway.app/pa/iap/verify';

// ── Core purchase flow ────────────────────────────────────────────────────────

async function _purchase(productId, onSuccess) {
  if (!isAndroid()) {
    showStatus('Purchases are only available in the Android app.', 2000);
    return;
  }
  const B = getBilling();
  if (!B) { showStatus('Store unavailable. Please update the app.', 2500); return; }
  try {
    const result = await B.purchaseProduct({ productId });

    // FIX #11: verify the resolved purchase actually contains what we requested
    const ids = result?.productIds;
    if (!ids || !ids.includes(productId)) {
      console.error('[IAP] Product mismatch — expected', productId, 'got', ids);
      showStatus('Purchase error. Please contact support.', 3000);
      return;
    }

    // Server-side receipt validation — grant only on server confirmation
    const uid = (typeof getCurrentUser === 'function' && getCurrentUser()?.uid) || '';
    let serverOk = false;
    try {
      const vRes = await fetch(PA_IAP_VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          productId,
          purchaseToken: result.purchaseToken,
          orderId: result.orderId || '',
        }),
      });
      const vData = await vRes.json();
      if (vData.ok) {
        serverOk = true;
      } else {
        console.error('[IAP] Server rejected purchase:', vData.error);
        if (vData.error === 'google_play_rejected') {
          showStatus('Purchase could not be verified. Please contact support.', 3500);
        } else {
          showStatus('Purchase failed. Please try again.', 2500);
        }
      }
    } catch (netErr) {
      // Network error — server unreachable. Grant locally and log for manual review.
      // This is the only path where a grant happens without server confirmation.
      console.error('[IAP] Server verify network error — granting locally:', netErr);
      serverOk = true;
    }

    if (serverOk) onSuccess(result);
  } catch (e) {
    const msg = typeof e === 'string' ? e : (e?.message || '');
    if (msg === 'USER_CANCELLED') return;
    if (msg === 'ITEM_ALREADY_OWNED') {
      showStatus('You already own this. Use Restore Purchases to recover it.', 3500);
      return;
    }
    if (msg === 'BILLING_DISCONNECTED') {
      showStatus('Store connection lost. Please try again.', 2500);
      return;
    }
    if (msg === 'PURCHASE_IN_PROGRESS') {
      showStatus('A purchase is already in progress.', 2000);
      return;
    }
    showStatus('Purchase failed. Please try again.', 2500);
    console.error('[IAP] purchase error:', e);
  }
}

async function _restoreNonConsumables() {
  const B = getBilling();
  if (!B) return;
  const { purchases } = await B.restoreTransactions();
  let changed = false;
  for (const p of (purchases || [])) {
    for (const pid of (p.productIds || [])) {
      if (_grantNonConsumable(pid)) changed = true;
    }
  }
  if (changed) { saveState(); updateHUD(); }
}

function _grantNonConsumable(productId) {
  if (productId === PRODUCT.REMOVE_ADS && !G.removeAds) {
    G.removeAds = true; return true;
  }
  if (productId === PRODUCT.PERMANENT_AUTOSELLER && !G.autoSellPermanent) {
    G.autoSellPermanent = true; G.autoSellEnabled = true; return true;
  }
  if (productId === PRODUCT.DEV_SUPPORT && !G.devSupportOwned) {
    G.devSupportOwned = true; return true;
  }
  return false;
}
