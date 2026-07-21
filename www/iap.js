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
  starter: 200,
  pouch:   400,
  chest:   1100,
  vault:   2500,
};

let _billing = null;

function getBilling() {
  if (!_billing) _billing = window.Capacitor?.Plugins?.Billing || null;
  return _billing;
}

function isAndroid() {
  return window.Capacitor?.getPlatform() === 'android';
}

// ── IAP Price Cache ───────────────────────────────────────────────────────────
// Prices are fetched once after billing init and refreshed on every app launch.
// In-memory only — never persisted — so country/account changes are safe.

const _ALL_PRODUCT_IDS = [
  PRODUCT.REMOVE_ADS,
  PRODUCT.PERMANENT_AUTOSELLER,
  PRODUCT.DEV_SUPPORT,
  PRODUCT.STARTER,
  PRODUCT.POUCH,
  PRODUCT.CHEST,
  PRODUCT.VAULT,
];

let _iapPrices    = {};    // productId → Google Play formatted price string
let _iapPricesReady = false;

async function loadProductPrices() {
  const B = getBilling();
  if (!B) return;
  try {
    const result   = await B.getProducts({ productIds: _ALL_PRODUCT_IDS });
    const products = result?.products || [];
    const fresh    = {};
    for (const p of products) {
      fresh[p.productId] = p.price || 'Unavailable';
      if (!p.price) console.warn('[IAP] No price returned for:', p.productId);
    }
    for (const id of _ALL_PRODUCT_IDS) {
      if (!(id in fresh)) {
        console.warn('[IAP] Product not returned by Play Store:', id);
        fresh[id] = 'Unavailable';
      }
    }
    _iapPrices      = fresh;
    _iapPricesReady = true;
  } catch (e) {
    console.error('[IAP] loadProductPrices failed:', e);
    for (const id of _ALL_PRODUCT_IDS) _iapPrices[id] = 'Unavailable';
    _iapPricesReady = true;
  }
  if (typeof renderDiamondStore === 'function') renderDiamondStore();
}

function getProductPrice(productId) {
  if (!_iapPricesReady) return '…';
  return _iapPrices[productId] || 'Unavailable';
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
  loadProductPrices(); // fire-and-forget; calls renderDiamondStore() when ready
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

    // Server-side receipt validation — grant ONLY on server confirmation, never locally
    const token = await _getPAToken();
    let serverOk = false;
    try {
      const vRes = await fetch(PA_IAP_VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
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
      // Network error — do NOT grant without server confirmation.
      // Google Play has already charged the user — they can restore via "Restore Purchases" once reconnected.
      console.error('[IAP] Server verify network error — purchase not granted:', netErr);
      showStatus('Purchase verified by Google Play but could not reach server. Please reconnect and use Restore Purchases.', 5000);
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
  const token = await _getPAToken();
  let changed = false;
  for (const p of (purchases || [])) {
    for (const pid of (p.productIds || [])) {
      if (!NON_CONSUMABLES.includes(pid)) continue;
      // Verify each non-consumable with server before granting (same flow as initial purchase)
      if (token && p.purchaseToken) {
        try {
          const vRes = await fetch(PA_IAP_VERIFY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ productId: pid, purchaseToken: p.purchaseToken, orderId: p.orderId || '' }),
          });
          const vData = await vRes.json();
          if (!vData.ok) continue; // Server rejected — skip this product
        } catch {
          continue; // Network error — skip, do not grant without verification
        }
      }
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
