'use strict';

// ─── Interactive Tutorial ──────────────────────────────────────────────────
// New-player only. Resumes from G.tutStep after reload/force-close.
// Uses real game elements throughout — no fake UI duplicates.

const _TUT_DONE          = 99;
const _TUT_CATCHES_NEEDED = 3;    // catches required in step 7 before seagull spawns

let _tutActive          = false;
let _tutTargetEl        = null;
let _tutCardPos         = 'bottom';
let _tutFreeMode        = false;  // true = bars fully hidden, player can interact freely
let _tutBars            = null;   // { t, b, l, r }
let _tutGlow            = null;
let _tutCard            = null;
let _tut7Catches        = 0;      // catches made during step 7
let _tutContinueTarget  = 0;      // which step Continue button advances to

// ────────────────────────────────────────────────────────────────────────────
// Public init — called from pressToStart() in game.js
// ────────────────────────────────────────────────────────────────────────────

function initTutorial() {
  // Existing save with meaningful progress → mark done, skip tutorial
  if (_tutShouldSkip()) {
    G.tutorialDone = true;
    if (!G.tutStep || G.tutStep < _TUT_DONE) G.tutStep = _TUT_DONE;
    saveState();
    return;
  }
  if (G.tutorialDone || G.tutStep === _TUT_DONE) return;

  // Suppress normal seagull spawning while tutorial controls it
  if (typeof stopSeagullTimer === 'function') stopSeagullTimer();

  _tutActive = true;

  const step = G.tutStep || 0;
  if (step === 0) {
    _tutGo(1);
  } else {
    _tutResume(step);
  }
}

function _tutShouldSkip() {
  if (G.tutorialDone)                              return true;
  if (G.tutStep === _TUT_DONE)                     return true;
  if ((G.ownedAutomation  || []).length  >  0)     return true;
  if ((G.ownedTransport   || []).length  >  0)     return true;
  if ((G.prestigeCount    || 0)          >  0)     return true;
  if (G.stats && (G.stats.totalFish      || 0) > 10) return true;
  return false;
}

function _tutResume(step) {
  // Seagull not yet claimed → always go back to practice step and respawn
  if ((step === 7 || step === 8) && !G.tutSeagullClaimed) {
    G.tutSeagullSpawned = false;
    _tutGo(7);
    return;
  }
  // Seagull claimed, net not yet bought → resume at shop step
  if (step >= 8 && step < 10 && G.tutSeagullClaimed) {
    _tutGo(10);
    return;
  }
  _tutGo(step);
}

// ────────────────────────────────────────────────────────────────────────────
// Step machine
// ────────────────────────────────────────────────────────────────────────────

function _tutGo(n) {
  G.tutStep = n;
  saveState();
  switch (n) {
    case 1:  _tut1();  break;
    case 2:  _tut2();  break;
    case 3:  _tut3();  break;
    case 4:  _tut4();  break;
    case 5:  _tut5();  break;
    case 6:  _tut6();  break;
    case 7:  _tut7();  break;
    case 8:  _tut8();  break;
    case 10: _tut10(); break;
    case 11: _tut11(); break;
    case 12: _tut12(); break;
    case 13: _tut13(); break;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Hook entry — called from game.js at each gameplay moment
// ────────────────────────────────────────────────────────────────────────────

window.tutHook = function tutHook(ev, data) {
  if (!_tutActive) return;
  const s = G.tutStep;

  if      (ev === 'cast'     && s === 1)                              _tutGo(2);
  else if (ev === 'bite'     && s === 2)                              _tutGo(3);
  else if (ev === 'catch'    && s === 3)                              _tutGo(4);
  else if (ev === 'catch_ok' && s === 4)                              _tutGo(5);
  else if (ev === 'screen'   && s === 5  && data === 'market')        _tutGo(6);
  else if (ev === 'sell'     && s === 6)                              _tutGo(7);
  else if (ev === 'catch_ok' && s === 7)                              _tut7OnCatch();
  else if (ev === 'seagull'  && s === 8)                              _tutSeagullTapped();
  else if (ev === 'screen'   && s === 10 && data === 'shop')          _tutGo(11);
  else if (ev === 'auto_buy' && s === 11 && data === 'fishing_net')   _tutGo(12);
};

// ────────────────────────────────────────────────────────────────────────────
// Step implementations
// ────────────────────────────────────────────────────────────────────────────

function _tut1() {
  if (typeof showScreen === 'function') showScreen('fishing');
  _tutEnsureDOM();
  _tutShow(
    document.getElementById('water-area'),
    'Welcome to Patient Angler!',
    'Let\'s catch your first fish.\n\nTap the water to cast your line.',
    'bottom'
  );
  if (typeof trackMilestone === 'function') trackMilestone('tutorial_started');
}

function _tut2() {
  _tutShow(
    document.getElementById('fishing-rig'),
    'Wait for a bite',
    'Watch the bobber. When it dips, get ready to tap!',
    'bottom'
  );
}

function _tut3() {
  _tutShow(
    document.getElementById('water-area'),
    'Tap to reel it in!',
    'Tap the bobber repeatedly to land the catch.',
    'bottom'
  );
}

function _tut4() {
  // Catch popup is visible — spotlight it, let player tap "Nice!"
  _tutShow(
    document.getElementById('catch-popup'),
    'Great catch!',
    'Your fish is now stored in your bucket.\n\nTap "Nice!" to continue.',
    'top'
  );
}

function _tut5() {
  if (typeof showScreen === 'function') showScreen('fishing');
  const marketBtn = document.querySelector('button[data-screen="market"]');
  _tutShow(
    marketBtn,
    'Time to sell',
    'Fish earn coins when you sell them.\n\nLet\'s visit the Market.',
    'top'
  );
}

function _tut6() {
  // Market screen is open — spotlight the Sell All button
  const sellBtn = document.getElementById('btn-sell-all');
  _tutShow(
    sellBtn,
    'Sell your fish',
    'Tap Sell All to exchange your catch for coins.',
    'bottom'
  );
}

function _tut7() {
  if (typeof showScreen === 'function') showScreen('fishing');
  _tut7Catches = 0;

  // If seagull was already spawned before a reload but not yet claimed, go straight to step 8
  if (G.tutSeagullSpawned && !G.tutSeagullClaimed) {
    _tutSpawnGuaranteedSeagull();
    return;
  }

  _tutEnsureDOM();
  _tutHideOverlay();
  _tut7UpdateCard();
}

function _tut7UpdateCard() {
  _tutEnsureDOM();
  var remaining = _TUT_CATCHES_NEEDED - _tut7Catches;
  document.getElementById('tut-card-title').textContent = 'Keep fishing';
  document.getElementById('tut-card-desc').textContent  = 'Catch ' + remaining + ' more fish and something special will happen!';
  document.getElementById('tut-finish-btn').classList.add('tut-elem-hidden');
  document.getElementById('tut-continue-btn').classList.add('tut-elem-hidden');
  _tutCard.style.display = '';
  _tutCardPos  = 'top-left';
  _tutTargetEl = null;
  _tutUpdatePositions();
}

function _tut7OnCatch() {
  _tut7Catches++;
  if (_tut7Catches >= _TUT_CATCHES_NEEDED) {
    _tutSpawnGuaranteedSeagull();
  } else {
    _tut7UpdateCard();
  }
}

function _tut8() {
  const gull = document.getElementById('seagull');
  _tutShow(
    gull,
    'Tap the Seagull!',
    'A seagull has arrived with coins! Tap it!',
    'bottom'
  );
}

function _tutSeagullTapped() {
  G.tutSeagullClaimed = true;
  saveState();
  if (typeof trackMilestone === 'function') trackMilestone('tutorial_seagull_claimed');
  _tutClearSpotlight();
  _tutShowCard(
    'Nice!',
    'You now have enough coins for your first automation.',
    'center',
    false,
    10   // Continue → step 10
  );
}

function _tut10() {
  if (typeof showScreen === 'function') showScreen('fishing');
  const shopBtn = document.querySelector('button[data-screen="shop"]');
  _tutShow(
    shopBtn,
    'Buy automation',
    'Let\'s buy your first Fishing Net.\n\nOpen the Shop.',
    'top'
  );
}

function _tut11() {
  // Programmatically open the Automation tab via the real tab handler
  const autoTab  = document.querySelector('.shop-tab-icon[data-tab="automation"]');
  const panel    = document.getElementById('shop-panel');
  if (autoTab && panel) {
    if (!panel.classList.contains('visible') || !autoTab.classList.contains('active')) {
      autoTab.click();
    }
  }

  // Give renderShop() a tick to build the item list, then spotlight fishing_net
  setTimeout(function() {
    const shopContent = document.getElementById('shop-content');
    const netItem     = shopContent ? shopContent.querySelector('.shop-item') : null;
    _tutShow(
      netItem || autoTab,
      'Fishing Net',
      'Fishing Nets catch items automatically,\neven while you\'re away!\n\nBuy your first Fishing Net.',
      'top'
    );
    _tutEnsureNetAffordable();
  }, 150);
}

function _tutEnsureNetAffordable() {
  // Safety: grant the difference if coins fell below 10 due to an edge case.
  // Does not grant preemptively — only triggered when the player genuinely can't afford.
  const FIRST_NET_COST = 10;
  if ((G.coins || 0) < FIRST_NET_COST) {
    const missing = FIRST_NET_COST - (G.coins || 0);
    if (typeof _earnCoins === 'function') _earnCoins(missing);
    if (typeof updateHUD  === 'function') updateHUD();
    if (typeof renderShop === 'function' && typeof activeShopTab !== 'undefined') renderShop(activeShopTab);
    if (typeof saveState  === 'function') saveState();
  }
}

function _tut12() {
  if (typeof showScreen === 'function') showScreen('fishing');
  setTimeout(function() {
    const rateEl = document.getElementById('hud-fishrate');
    _tutShow(
      rateEl && rateEl.textContent ? rateEl : document.getElementById('hud-storage-btn'),
      'Automation started!',
      'Your Fishing Net catches items automatically, even while you\'re away.\n\nYour empire begins here.',
      'bottom'
    );
    _tutShowContinue(13);
  }, 300);
}

function _tut13() {
  _tutClearSpotlight();
  _tutShowCard(
    'You\'re ready!',
    'Build your fishing empire your own way.',
    'center',
    true   // show Finish button
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Guaranteed tutorial seagull
// ────────────────────────────────────────────────────────────────────────────

function _tutSpawnGuaranteedSeagull() {
  if (G.tutSeagullClaimed)  return;   // idempotent — reward can't be duplicated

  // Already visible and waiting — just advance to step 8
  const gull = document.getElementById('seagull');
  if (G.tutSeagullSpawned && gull && !gull.classList.contains('hidden')) {
    _tutGo(8);
    return;
  }

  G.tutSeagullSpawned = true;
  saveState();

  if (typeof spawnTutorialSeagull === 'function') {
    spawnTutorialSeagull();
  }

  _tutGo(8);
}

// ────────────────────────────────────────────────────────────────────────────
// Overlay DOM
// ────────────────────────────────────────────────────────────────────────────

function _tutEnsureDOM() {
  if (document.getElementById('tut-root')) return;

  const root = document.createElement('div');
  root.id = 'tut-root';
  root.innerHTML =
    '<div id="tut-bar-t" class="tut-bar"></div>' +
    '<div id="tut-bar-b" class="tut-bar"></div>' +
    '<div id="tut-bar-l" class="tut-bar"></div>' +
    '<div id="tut-bar-r" class="tut-bar"></div>' +
    '<div id="tut-glow"></div>' +
    '<div id="tut-card">' +
      '<div id="tut-card-title"></div>' +
      '<div id="tut-card-desc"></div>' +
      '<button id="tut-continue-btn" class="tut-card-btn tut-elem-hidden">Continue</button>' +
      '<button id="tut-finish-btn"   class="tut-card-btn tut-elem-hidden">Start Fishing!</button>' +
    '</div>';
  document.body.appendChild(root);

  _tutBars = {
    t: document.getElementById('tut-bar-t'),
    b: document.getElementById('tut-bar-b'),
    l: document.getElementById('tut-bar-l'),
    r: document.getElementById('tut-bar-r'),
  };
  _tutGlow = document.getElementById('tut-glow');
  _tutCard = document.getElementById('tut-card');

  document.getElementById('tut-continue-btn').addEventListener('click', function() {
    var target = _tutContinueTarget;
    _tutContinueTarget = 0;
    document.getElementById('tut-continue-btn').classList.add('tut-elem-hidden');
    if (target > 0) _tutGo(target);
  });
  document.getElementById('tut-finish-btn').addEventListener('click', _tutComplete);
  window.addEventListener('resize', _tutUpdatePositions);
}

// ────────────────────────────────────────────────────────────────────────────
// Spotlight / Overlay positioning
// ────────────────────────────────────────────────────────────────────────────

function _tutShow(el, title, desc, cardPos) {
  _tutEnsureDOM();
  _tutFreeMode = false;
  _tutTargetEl = el || null;
  _tutCardPos  = cardPos || 'bottom';

  document.getElementById('tut-card-title').textContent = title;
  document.getElementById('tut-card-desc').textContent  = desc;
  document.getElementById('tut-finish-btn').classList.add('tut-elem-hidden');
  document.getElementById('tut-continue-btn').classList.add('tut-elem-hidden');
  _tutContinueTarget = 0;

  Object.values(_tutBars).forEach(function(b) { b.style.display = ''; });
  _tutGlow.style.display = '';
  _tutCard.style.display = '';

  _tutUpdatePositions();
}

function _tutShowCard(title, desc, pos, showFinish, continueTo) {
  _tutEnsureDOM();
  _tutTargetEl = null;
  _tutCardPos  = pos || 'top-left';

  document.getElementById('tut-card-title').textContent = title;
  document.getElementById('tut-card-desc').textContent  = desc;

  var fb = document.getElementById('tut-finish-btn');
  if (showFinish) fb.classList.remove('tut-elem-hidden');
  else            fb.classList.add('tut-elem-hidden');

  var cb = document.getElementById('tut-continue-btn');
  if (continueTo) {
    _tutContinueTarget = continueTo;
    cb.classList.remove('tut-elem-hidden');
  } else {
    cb.classList.add('tut-elem-hidden');
  }

  _tutCard.style.display = '';
  _tutClearSpotlight();
  _tutUpdatePositions();
}

function _tutShowContinue(toStep) {
  _tutEnsureDOM();
  _tutContinueTarget = toStep;
  document.getElementById('tut-continue-btn').classList.remove('tut-elem-hidden');
  _tutUpdatePositions();
}

function _tutClearSpotlight() {
  _tutFreeMode = false;
  if (!_tutBars) return;
  // One full-screen bar blocks everything except the card
  _tutBars.t.style.cssText = 'display:block;top:0;left:0;right:0;bottom:0';
  _tutBars.b.style.display = 'none';
  _tutBars.l.style.display = 'none';
  _tutBars.r.style.display = 'none';
  if (_tutGlow) _tutGlow.style.display = 'none';
  _tutTargetEl = null;
}

function _tutHideOverlay() {
  // Hides all bars completely — player can interact with the full game
  _tutFreeMode = true;
  if (!_tutBars) return;
  Object.values(_tutBars).forEach(function(b) { b.style.display = 'none'; });
  if (_tutGlow) _tutGlow.style.display = 'none';
  _tutTargetEl = null;
}

function _tutUpdatePositions() {
  if (!_tutBars || !_tutCard) return;

  if (_tutFreeMode) {
    // Free mode — bars stay hidden, just reposition the card
    Object.values(_tutBars).forEach(function(b) { b.style.display = 'none'; });
    if (_tutGlow) _tutGlow.style.display = 'none';
    _tutPositionCard(0, 0, window.innerWidth, window.innerHeight);
    return;
  }

  if (!_tutTargetEl) {
    // Card only mode — dim full screen but card is still visible
    _tutBars.t.style.cssText = 'display:block;top:0;left:0;right:0;bottom:0';
    _tutBars.b.style.display = 'none';
    _tutBars.l.style.display = 'none';
    _tutBars.r.style.display = 'none';
    if (_tutGlow) _tutGlow.style.display = 'none';
    _tutPositionCard(0, 0, window.innerWidth, window.innerHeight);
    return;
  }

  var r   = _tutTargetEl.getBoundingClientRect();
  var W   = window.innerWidth;
  var H   = window.innerHeight;
  var pad = 10;

  var x1 = Math.max(0, r.left   - pad);
  var y1 = Math.max(0, r.top    - pad);
  var x2 = Math.min(W, r.right  + pad);
  var y2 = Math.min(H, r.bottom + pad);

  // Defensive: if element has no size (hidden, display:none), fall back to center
  if (x2 - x1 < 4 || y2 - y1 < 4) {
    _tutClearSpotlight();
    _tutPositionCard(0, 0, W, H);
    return;
  }

  // 4-bar layout leaves a rectangular gap around the target
  _tutBars.t.style.cssText = 'display:block;top:0;left:0;right:0;height:' + y1 + 'px';
  _tutBars.b.style.cssText = 'display:block;top:' + y2 + 'px;left:0;right:0;bottom:0';
  _tutBars.l.style.cssText = 'display:block;top:' + y1 + 'px;left:0;width:' + x1 + 'px;height:' + (y2-y1) + 'px';
  _tutBars.r.style.cssText = 'display:block;top:' + y1 + 'px;left:' + x2 + 'px;right:0;height:' + (y2-y1) + 'px';

  // Gold glow ring — sits OVER the gap, pointer-events:none so clicks pass through
  _tutGlow.style.cssText   = 'display:block;left:' + x1 + 'px;top:' + y1 + 'px;width:' + (x2-x1) + 'px;height:' + (y2-y1) + 'px';

  _tutPositionCard(x1, y1, x2, y2);
}

function _tutPositionCard(x1, y1, x2, y2) {
  var W      = window.innerWidth;
  var H      = window.innerHeight;
  var MARGIN = 14;
  var CW     = Math.min(Math.floor(W * 0.84), 320);
  var CH     = _tutCard.offsetHeight || 150;

  var top, left;

  switch (_tutCardPos) {
    case 'top':
      top  = Math.max(MARGIN, y1 - CH - 14);
      left = _tutClampX((x1 + x2) / 2 - CW / 2, CW, W, MARGIN);
      // If not enough space above, put it below
      if (top < MARGIN) { top = Math.min(H - CH - MARGIN, y2 + 14); }
      break;
    case 'bottom':
      top  = Math.min(H - CH - MARGIN, y2 + 14);
      left = _tutClampX((x1 + x2) / 2 - CW / 2, CW, W, MARGIN);
      // If not enough space below, put it above
      if (top + CH > H - MARGIN) { top = Math.max(MARGIN, y1 - CH - 14); }
      break;
    case 'top-left':
      top  = MARGIN;
      left = MARGIN;
      break;
    case 'center':
      top  = Math.max(MARGIN, Math.floor((H - CH) / 2));
      left = _tutClampX(W / 2 - CW / 2, CW, W, MARGIN);
      break;
    default:
      top  = MARGIN;
      left = MARGIN;
  }

  _tutCard.style.cssText = 'display:block;position:fixed;top:' + top + 'px;left:' + left + 'px;width:' + CW + 'px';
}

function _tutClampX(ideal, cw, W, margin) {
  return Math.max(margin, Math.min(W - cw - margin, ideal));
}

// ────────────────────────────────────────────────────────────────────────────
// Completion
// ────────────────────────────────────────────────────────────────────────────

function _tutComplete() {
  G.tutorialDone = true;
  G.tutStep      = _TUT_DONE;
  _tutActive     = false;


  window.removeEventListener('resize', _tutUpdatePositions);

  var root = document.getElementById('tut-root');
  if (root) root.remove();
  _tutBars     = null;
  _tutGlow     = null;
  _tutCard     = null;
  _tutTargetEl = null;

  // Restore normal seagull spawning
  if (typeof startSeagullTimer === 'function') startSeagullTimer();

  saveState();
  if (typeof showScreen === 'function') showScreen('fishing');
  if (typeof trackMilestone === 'function') trackMilestone('tutorial_completed');
  if (typeof _maybShowCommunityNotice === 'function') _maybShowCommunityNotice();
}
