'use strict';

// ─── MAELSTROM & ABYSS EXPANSION FRAMEWORK ─────────────────────────────────
// Phase 1: Architecture foundation.
// Phase 2: Maelstrom crystal-mission shell (debug only).
// Phase 3: Full Maelstrom stabilization progression (debug only).
// All expansion access controlled by canAccessMaelstromAndAbyss().
// When local debug is disabled, nothing in this file affects live gameplay.

// ─── ENVIRONMENT DETECTION ────────────────────────────────────────────────────

function isLocalDevelopmentEnvironment() {
  if (window.Capacitor) return false;        // Capacitor/Android — never local dev
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '';
}

// ─── DEBUG TOGGLE ─────────────────────────────────────────────────────────────
// Stored in a separate localStorage key — never inside the game save (G).
// Only readable/writable when isLocalDevelopmentEnvironment() is true.

const _ABYSS_DEBUG_KEY = 'patientAnglerAbyssDebugEnabled';

function isLocalAbyssDebugEnabled() {
  if (!isLocalDevelopmentEnvironment()) return false;
  try { return localStorage.getItem(_ABYSS_DEBUG_KEY) === 'true'; } catch(e) { return false; }
}

function setLocalAbyssDebugEnabled(enabled) {
  if (!isLocalDevelopmentEnvironment()) return;
  try {
    if (enabled) {
      localStorage.setItem(_ABYSS_DEBUG_KEY, 'true');
    } else {
      localStorage.removeItem(_ABYSS_DEBUG_KEY);
      if (isInMaelstrom() || isInAbyss()) leaveExpansionWorld();
    }
  } catch(e) {}
}

// ─── ACCESS GATES ─────────────────────────────────────────────────────────────
// These are the ONLY helpers that grant expansion access.
// All expansion code must call canAccessMaelstromAndAbyss() — never scatter direct booleans.

function isMaelstromUnlockedForPlayer() {
  // Always false until the real unlock system is implemented in a future phase.
  return false;
}

function canAccessMaelstromAndAbyss() {
  return isLocalAbyssDebugEnabled() || isMaelstromUnlockedForPlayer();
}

// ─── WORLD STATE HELPERS ──────────────────────────────────────────────────────

function getCurrentExpansionWorld() {
  return (typeof G !== 'undefined' && G.currentWorld) || 'overworld';
}

function isInMaelstrom() { return getCurrentExpansionWorld() === 'maelstrom'; }
function isInAbyss()      { return getCurrentExpansionWorld() === 'abyss';     }

function getCurrentAbyssZone() {
  return (typeof G !== 'undefined' && G.abyss && G.abyss.currentZone) || null;
}

// ─── WORLD REGISTRIES ─────────────────────────────────────────────────────────
// See ABYSS Missing Assets.md for all art assets required before production.

const MAELSTROM_ZONE = {
  id:         'maelstrom',
  name:       'The Maelstrom',
  themeColor: '#8b00ff',
  bg:         null,   // Missing — see ABYSS Missing Assets.md
};

const ABYSS_ZONES = [
  { id: 'azure_crystal_caverns', name: 'Azure Crystal Caverns', themeColor: '#1a8fd4', order: 1, bg: null, locked: true },
  { id: 'emerald_bloom',         name: 'Emerald Bloom',         themeColor: '#1aa352', order: 2, bg: null, locked: true },
  { id: 'amethyst_depths',       name: 'Amethyst Depths',       themeColor: '#8b34c8', order: 3, bg: null, locked: true },
  { id: 'ruby_chasm',            name: 'Ruby Chasm',            themeColor: '#c43030', order: 4, bg: null, locked: true },
  { id: 'golden_rift',           name: 'Golden Rift',           themeColor: '#c49a00', order: 5, bg: null, locked: true },
];

// ─── PLACEHOLDER COMPONENT ────────────────────────────────────────────────────
// White box, thin dark border, large red question mark. No emoji, no broken-image icon.
// Only call when canAccessMaelstromAndAbyss() is true.
// opts: { width, height, label }

function expansionPlaceholder(opts) {
  if (!canAccessMaelstromAndAbyss()) return '';
  const w   = (opts && opts.width)  || '100%';
  const h   = (opts && opts.height) || '120px';
  const lbl = (opts && opts.label) ? `<span class="exp-ph-label">${opts.label}</span>` : '';
  return `<div class="expansion-placeholder" style="width:${w};height:${h};">${lbl}<span class="exp-ph-mark">?</span></div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3 — MAELSTROM STABILIZATION CONFIG
// All numeric values in one place. Non-final; will be tuned in future phases.
// ═══════════════════════════════════════════════════════════════════════════════

const MAELSTROM_MISSION_CONFIG = {
  // Base mission duration. Divided by permanentExpeditionSpeedMultiplier at runtime.
  baseDurationMs: 6 * 60 * 60 * 1000,  // 6 real hours (Phase 3 provisional)

  // Weighted probabilities for crystal type selection.
  // Sum = 100; values are relative weights, not percentages.
  crystalWeights: {
    azure:    35,
    emerald:  25,
    amethyst: 20,
    ruby:     15,
    golden:   5,
  },

  // Crystal quantity range per completed mission, indexed by crystal type.
  crystalAmounts: {
    azure:    { min: 8,  max: 14 },
    emerald:  { min: 6,  max: 11 },
    amethyst: { min: 4,  max: 8  },
    ruby:     { min: 3,  max: 6  },
    golden:   { min: 1,  max: 3  },
  },
};

// Stabilization requirements. Stored in code only — never in the player save.
// Player save tracks contributed amounts in G.maelstrom.stabilizationProgress.
const MAELSTROM_STAB_REQUIREMENTS = {
  azure:    120,
  emerald:  90,
  amethyst: 65,
  ruby:     40,
  golden:   15,
};
// Total required: 330 crystals across all types.

// ─── CRYSTAL REGISTRY ────────────────────────────────────────────────────────

const MAELSTROM_CRYSTALS = [
  { id: 'azure',    name: 'Azure Crystal',    color: '#1a8fd4', icon: null },  // crystal_blue.png — Missing
  { id: 'emerald',  name: 'Emerald Crystal',  color: '#1aa352', icon: null },  // crystal_green.png — Missing
  { id: 'amethyst', name: 'Amethyst Crystal', color: '#8b34c8', icon: null },  // crystal_purple.png — Missing
  { id: 'ruby',     name: 'Ruby Crystal',     color: '#c43030', icon: null },  // crystal_red.png — Missing
  { id: 'golden',   name: 'Golden Crystal',   color: '#c49a00', icon: null },  // crystal_gold.png — Missing
];

// ─── SMALL HELPERS ────────────────────────────────────────────────────────────

function _crystalName(id) {
  const c = MAELSTROM_CRYSTALS.find(x => x.id === id);
  return c ? c.name : id;
}

function _crystalColor(id) {
  const c = MAELSTROM_CRYSTALS.find(x => x.id === id);
  return c ? c.color : '#ffffff';
}

function _formatMsCountdown(ms) {
  if (ms <= 0) return 'Ready';
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function _evStatusLabel(v) {
  if (v.maelstromMissionId) return 'On Mission';
  if (v.awaitingDelivery)   return 'Awaiting Delivery';
  const ms = v.nextChestAt - Date.now();
  return ms > 0 ? _formatMsCountdown(ms) : 'Ready';
}

function _missionId() {
  return 'mael_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
}

// ─── MISSION DURATION ─────────────────────────────────────────────────────────
// Extension point for future Diamond Shop "Expedition Speed" upgrade.
// Returns 1 until the upgrade is implemented — no code change needed here.

function _getExpeditionSpeedMultiplier() {
  return 1; // placeholder: future upgrade increases this value
}

function _getMaelstromMissionDuration() {
  return Math.round(MAELSTROM_MISSION_CONFIG.baseDurationMs / _getExpeditionSpeedMultiplier());
}

// ─── WEIGHTED CRYSTAL SELECTION ───────────────────────────────────────────────
// Reward generated at mission completion — NOT at dispatch time.

function _weightedCrystalType() {
  const weights = MAELSTROM_MISSION_CONFIG.crystalWeights;
  const ids = Object.keys(weights);
  const total = ids.reduce(function(s, id) { return s + weights[id]; }, 0);
  let r = Math.random() * total;
  for (let i = 0; i < ids.length; i++) {
    r -= weights[ids[i]];
    if (r <= 0) return ids[i];
  }
  return ids[ids.length - 1]; // fallback
}

function _crystalAmountForType(type) {
  const range = MAELSTROM_MISSION_CONFIG.crystalAmounts[type];
  if (!range) return 1;
  return range.min + Math.floor(Math.random() * (range.max - range.min + 1));
}

// Generates and assigns the crystal reward to a mission object exactly once.
// Idempotent — safe to call on missions that already have rewardGenerated = true.

function _generateMissionReward(mission) {
  if (mission.rewardGenerated) return;
  mission.crystalType     = _weightedCrystalType();
  mission.crystalAmount   = _crystalAmountForType(mission.crystalType);
  mission.rewardGenerated = true;
}

// ─── UI REFRESH TIMER ─────────────────────────────────────────────────────────
// Runs only while Maelstrom screen is visible; stopped on leave.

let _maelstromUIInterval = null;

function _startMaelstromUITimer() {
  if (_maelstromUIInterval) return;
  _maelstromUIInterval = setInterval(function() {
    if (isInMaelstrom()) {
      _processMaelstromMissions(); // catch completions
      renderMaelstromDebug();
    }
  }, 5000);
}

function _stopMaelstromUITimer() {
  if (_maelstromUIInterval) { clearInterval(_maelstromUIInterval); _maelstromUIInterval = null; }
}

// ─── MISSION PROCESSING ──────────────────────────────────────────────────────
// Idempotent. Transitions active missions to complete when timer expires,
// generating the reward at that moment. Does NOT grant crystals automatically.
// Player must tap Collect.

function _processMaelstromMissions() {
  if (!canAccessMaelstromAndAbyss()) return;
  if (typeof G === 'undefined' || !G.maelstrom || !Array.isArray(G.maelstrom.crystalMissions)) return;
  const now = Date.now();
  let changed = false;
  G.maelstrom.crystalMissions.forEach(function(m) {
    if (m.status === 'active' && now >= m.completesAt) {
      _generateMissionReward(m); // exactly once — idempotent
      m.completedAt = now;
      m.status = 'complete';
      changed = true;
    }
  });
  if (changed && typeof saveState === 'function') saveState();
}

// ─── ASSIGN VESSEL TO MAELSTROM MISSION ──────────────────────────────────────

function assignVesselToMaelstrom(vesselId) {
  if (!canAccessMaelstromAndAbyss()) return;
  if (typeof G === 'undefined') return;
  const vessels = G.expeditionVessels || [];
  const v = vessels.find(x => x.id === vesselId);
  if (!v) { if (typeof showStatus === 'function') showStatus('Vessel not found.', 1500); return; }
  if (v.maelstromMissionId) { if (typeof showStatus === 'function') showStatus('Vessel already on a mission.', 1500); return; }

  // Preserve remaining treasure timer so it resumes when mission ends
  const remaining = v.nextChestAt > Date.now() ? v.nextChestAt - Date.now() : 0;
  v.savedTreasureRemainingMs = remaining;
  v.nextChestAt = 0; // sentinel — normal EV loops check maelstromMissionId before touching this

  const missionId = _missionId();
  const now = Date.now();

  const mission = {
    id:             missionId,
    vesselId:       vesselId,
    crystalType:    null,   // generated at completion — not known yet
    crystalAmount:  0,
    rewardGenerated:false,
    startedAt:      now,
    completesAt:    now + _getMaelstromMissionDuration(),
    completedAt:    0,
    status:         'active',  // 'active' | 'complete' | 'claimed'
  };

  v.maelstromMissionId = missionId;
  G.maelstrom.crystalMissions.push(mission);
  G.maelstrom.stats.missionsStarted = (G.maelstrom.stats.missionsStarted || 0) + 1;

  if (typeof saveState === 'function') saveState();
  if (typeof showStatus === 'function') showStatus('Vessel dispatched into the Maelstrom!', 2000);
  renderMaelstromDebug();
}

// ─── COLLECT MISSION REWARD ──────────────────────────────────────────────────
// Idempotent via _collectingMission guard + status check.
// Marks claimed before granting to prevent partial state on error.
// Removes mission from array after collection to keep save clean.

const _collectingMission = {};

function collectMaelstromMission(missionId) {
  if (!canAccessMaelstromAndAbyss()) return;
  if (_collectingMission[missionId]) return;
  _collectingMission[missionId] = true;

  if (typeof G === 'undefined') { delete _collectingMission[missionId]; return; }
  const missions = G.maelstrom.crystalMissions || [];
  const idx = missions.findIndex(x => x.id === missionId);
  if (idx === -1 || missions[idx].status === 'claimed') { delete _collectingMission[missionId]; return; }
  const m = missions[idx];
  if (!m.rewardGenerated) { delete _collectingMission[missionId]; return; } // reward not ready

  // Mark claimed BEFORE granting — prevents partial state if anything throws
  m.status = 'claimed';
  if (typeof saveState === 'function') saveState();

  G.maelstrom.crystals[m.crystalType] = (G.maelstrom.crystals[m.crystalType] || 0) + m.crystalAmount;
  G.maelstrom.stats.missionsCompleted = (G.maelstrom.stats.missionsCompleted || 0) + 1;
  G.maelstrom.stats.crystalsRecovered = (G.maelstrom.stats.crystalsRecovered || 0) + m.crystalAmount;

  _restoreVesselFromMaelstrom(m.vesselId);

  // Remove claimed mission from array to keep save clean
  const currentIdx = G.maelstrom.crystalMissions.indexOf(m);
  if (currentIdx !== -1) G.maelstrom.crystalMissions.splice(currentIdx, 1);

  if (typeof saveState === 'function') saveState();
  delete _collectingMission[missionId];

  if (typeof showStatus === 'function') {
    showStatus(`+${m.crystalAmount} ${_crystalName(m.crystalType)} recovered!`, 2500);
  }
  renderMaelstromDebug();
}

// ─── RECALL MISSION (CANCEL EARLY) ───────────────────────────────────────────

function recallMaelstromMission(missionId) {
  if (!canAccessMaelstromAndAbyss()) return;
  if (typeof G === 'undefined') return;
  const missions = G.maelstrom.crystalMissions || [];
  const idx = missions.findIndex(x => x.id === missionId);
  if (idx === -1) return;
  const m = missions[idx];
  if (m.status === 'claimed') return;

  m.status = 'claimed'; // block concurrent collect taps before splice
  _restoreVesselFromMaelstrom(m.vesselId);
  G.maelstrom.crystalMissions.splice(idx, 1);

  if (typeof saveState === 'function') saveState();
  if (typeof showStatus === 'function') showStatus('Mission recalled — vessel returned.', 2000);
  renderMaelstromDebug();
}

// ─── RESTORE VESSEL AFTER MISSION ────────────────────────────────────────────

function _restoreVesselFromMaelstrom(vesselId) {
  if (typeof G === 'undefined') return;
  const v = (G.expeditionVessels || []).find(x => x.id === vesselId);
  if (!v) return;
  v.maelstromMissionId = null;
  const saved = (v.savedTreasureRemainingMs != null && v.savedTreasureRemainingMs > 0)
    ? v.savedTreasureRemainingMs
    : (typeof EXPEDITION_VESSEL_INTERVAL !== 'undefined' ? EXPEDITION_VESSEL_INTERVAL : 30 * 60 * 60 * 1000);
  v.nextChestAt = Date.now() + saved;
  v.savedTreasureRemainingMs = null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3 — STABILIZATION SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

function _maelstromStabReq() {
  return MAELSTROM_STAB_REQUIREMENTS;
}

function _isStabilizationComplete() {
  if (typeof G === 'undefined' || !G.maelstrom) return false;
  const prog = G.maelstrom.stabilizationProgress || {};
  const req  = _maelstromStabReq();
  return MAELSTROM_CRYSTALS.every(function(c) { return (prog[c.id] || 0) >= req[c.id]; });
}

// Guard against rapid Contribute taps
let _contributingCrystals = false;

function contributeCrystals() {
  if (!canAccessMaelstromAndAbyss()) return;
  if (_contributingCrystals) return;
  _contributingCrystals = true;

  if (typeof G === 'undefined') { _contributingCrystals = false; return; }
  if (G.maelstrom.stabilized) { _contributingCrystals = false; return; } // already done

  const crystals = G.maelstrom.crystals;
  const progress = G.maelstrom.stabilizationProgress;
  const req      = _maelstromStabReq();
  let anyContributed = false;

  MAELSTROM_CRYSTALS.forEach(function(c) {
    const contributed = progress[c.id] || 0;
    const remaining   = Math.max(0, req[c.id] - contributed);
    const available   = Math.max(0, crystals[c.id] || 0);
    const amount      = Math.min(remaining, available);
    if (amount > 0) {
      crystals[c.id]  = available - amount;
      progress[c.id]  = contributed + amount;
      anyContributed  = true;
    }
  });

  if (anyContributed) {
    _checkStabilizationCompletion();
    if (typeof saveState === 'function') saveState();
  }

  _contributingCrystals = false;
  renderMaelstromDebug();
}

// Idempotent. G.maelstrom.stabilized guards against re-triggering.

function _checkStabilizationCompletion() {
  if (typeof G === 'undefined' || !G.maelstrom) return;
  if (G.maelstrom.stabilized) return;      // already complete
  if (!_isStabilizationComplete()) return; // requirements not met

  G.maelstrom.stabilized                   = true;
  G.maelstrom.abyssEntranceUnlocked        = true;
  G.maelstrom.stabilizationCompletionShown = false; // cleared so render shows the banner once
  if (typeof saveState === 'function') saveState();
}

// ─── PRESTIGE HOOK ────────────────────────────────────────────────────────────
// Called from executePrestige() BEFORE G.expeditionVessels is cleared.
// Vessels don't need restoring — prestige wipes them immediately after.

function _clearMaelstromMissionsOnPrestige() {
  if (typeof G === 'undefined' || !G.maelstrom) return;
  G.maelstrom.crystalMissions              = [];
  G.maelstrom.crystals                     = { azure:0, emerald:0, amethyst:0, ruby:0, golden:0 };
  G.maelstrom.stabilizationProgress        = { azure:0, emerald:0, amethyst:0, ruby:0, golden:0 };
  G.maelstrom.stabilized                   = false;
  G.maelstrom.abyssEntranceUnlocked        = false;
  G.maelstrom.stabilizationCompletionShown = false;
  // Permanent stats kept — same principle as fishdex and pearl stats
}

// ─── DEBUG STATE RESET ────────────────────────────────────────────────────────
// Clears all Maelstrom state including stabilization. Restores EV timers first.
// Dev-only — called from Settings debug section.

function _resetMaelstromDebugState() {
  if (!canAccessMaelstromAndAbyss()) return;
  if (typeof G === 'undefined') return;

  (G.expeditionVessels || []).forEach(function(v) {
    if (v.maelstromMissionId) _restoreVesselFromMaelstrom(v.id);
  });

  G.maelstrom.crystalMissions              = [];
  G.maelstrom.crystals                     = { azure:0, emerald:0, amethyst:0, ruby:0, golden:0 };
  G.maelstrom.stabilizationProgress        = { azure:0, emerald:0, amethyst:0, ruby:0, golden:0 };
  G.maelstrom.stabilized                   = false;
  G.maelstrom.abyssEntranceUnlocked        = false;
  G.maelstrom.stabilizationCompletionShown = false;

  if (typeof saveState === 'function') saveState();
  if (typeof showStatus === 'function') showStatus('Expansion debug state reset.', 1500);
}

// ─── DEBUG HELPERS (local environment only) ───────────────────────────────────

function _debugAddCrystals() {
  if (!isLocalDevelopmentEnvironment() || !canAccessMaelstromAndAbyss()) return;
  if (typeof G === 'undefined' || !G.maelstrom) return;
  MAELSTROM_CRYSTALS.forEach(function(c) {
    G.maelstrom.crystals[c.id] = (G.maelstrom.crystals[c.id] || 0) + 10;
  });
  if (typeof saveState === 'function') saveState();
  if (isInMaelstrom()) renderMaelstromDebug();
  if (typeof showStatus === 'function') showStatus('+10 of each crystal added.', 1500);
}

function _debugCompleteStabilization() {
  if (!isLocalDevelopmentEnvironment() || !canAccessMaelstromAndAbyss()) return;
  if (typeof G === 'undefined' || !G.maelstrom) return;
  const req = _maelstromStabReq();
  MAELSTROM_CRYSTALS.forEach(function(c) {
    G.maelstrom.stabilizationProgress[c.id] = req[c.id];
    if (!isFinite(G.maelstrom.crystals[c.id])) G.maelstrom.crystals[c.id] = 0;
  });
  _checkStabilizationCompletion();
  if (typeof saveState === 'function') saveState();
  if (isInMaelstrom()) renderMaelstromDebug();
  if (typeof showStatus === 'function') showStatus('Stabilization completed instantly.', 1500);
}

function _debugClearStabilization() {
  if (!isLocalDevelopmentEnvironment() || !canAccessMaelstromAndAbyss()) return;
  if (typeof G === 'undefined' || !G.maelstrom) return;
  G.maelstrom.stabilizationProgress        = { azure:0, emerald:0, amethyst:0, ruby:0, golden:0 };
  G.maelstrom.stabilized                   = false;
  G.maelstrom.abyssEntranceUnlocked        = false;
  G.maelstrom.stabilizationCompletionShown = false;
  if (typeof saveState === 'function') saveState();
  if (isInMaelstrom()) renderMaelstromDebug();
  if (typeof showStatus === 'function') showStatus('Stabilization progress cleared.', 1500);
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────

function enterMaelstromDebug() {
  if (!canAccessMaelstromAndAbyss()) return;
  G.currentWorld = 'maelstrom';
  _processMaelstromMissions(); // catch any that completed since last check
  _startMaelstromUITimer();
  if (typeof showScreen === 'function') showScreen('expansion-maelstrom');
}

function enterAbyssDebug(zoneId) {
  if (!canAccessMaelstromAndAbyss()) return;
  _stopMaelstromUITimer();
  G.currentWorld = 'abyss';
  if (zoneId) G.abyss.currentZone = zoneId;
  if (typeof showScreen === 'function') showScreen('expansion-abyss');
}

function leaveExpansionWorld() {
  _stopMaelstromUITimer();
  if (typeof G !== 'undefined') G.currentWorld = 'overworld';
  if (typeof showScreen === 'function') showScreen('fishing');
}

function resetExpansionDebugState() {
  if (!canAccessMaelstromAndAbyss()) return;
  _stopMaelstromUITimer();
  _resetMaelstromDebugState();
  if (typeof G !== 'undefined') {
    G.currentWorld = 'overworld';
    if (G.abyss) G.abyss.currentZone = null;
  }
  if (typeof showScreen === 'function') showScreen('fishing');
}

function selectAbyssZoneDebug(zoneId) {
  if (!canAccessMaelstromAndAbyss()) return;
  G.abyss.currentZone = zoneId;
  renderAbyssDebug();
}

// ─── RENDER: MAELSTROM DEBUG VIEW ────────────────────────────────────────────

function renderMaelstromDebug() {
  if (!canAccessMaelstromAndAbyss()) { if (typeof showScreen === 'function') showScreen('fishing'); return; }
  const el = document.getElementById('expansion-maelstrom-content');
  if (!el) return;
  el.innerHTML = `
    <div class="mael-screen">
      <div class="mael-header" style="color:${MAELSTROM_ZONE.themeColor}">
        The Maelstrom <span class="mael-debug-tag">DEBUG</span>
      </div>
      ${expansionPlaceholder({ width: '100%', height: '90px', label: 'Maelstrom Background' })}
      ${_renderCrystalInventory()}
      ${_renderMissionPanel()}
      ${_renderStabilizationPanel()}
      ${_renderAbyssEntrance()}
      <div class="mael-controls">
        <button class="btn-secondary expansion-return-btn" onclick="leaveExpansionWorld()">Return to Overworld</button>
      </div>
    </div>`;
}

function _renderCrystalInventory() {
  if (typeof G === 'undefined' || !G.maelstrom) return '';
  const crystals = G.maelstrom.crystals || {};
  const rows = MAELSTROM_CRYSTALS.map(function(c) {
    return `<div class="mael-crystal-row">
      <span class="mael-crystal-dot" style="background:${c.color};"></span>
      <span class="mael-crystal-name">${c.name}</span>
      <span class="mael-crystal-amt">${crystals[c.id] || 0}</span>
    </div>`;
  }).join('');
  return `<div class="mael-panel">
    <div class="mael-panel-title">Crystal Inventory</div>
    ${rows}
  </div>`;
}

function _renderMissionPanel() {
  if (typeof G === 'undefined') return '';
  const vessels  = G.expeditionVessels || [];
  const missions = (G.maelstrom && G.maelstrom.crystalMissions) || [];
  const stats    = (G.maelstrom && G.maelstrom.stats) || {};
  const now      = Date.now();

  if (vessels.length === 0) {
    return `<div class="mael-panel">
      <div class="mael-panel-title">Expedition Vessel Missions</div>
      <div class="mael-panel-note">No Expedition Vessels owned. Purchase one from the Shop (Ocean zone required).</div>
    </div>`;
  }

  const vesselRows = vessels.map(function(v) {
    const mission = missions.find(function(m) { return m.vesselId === v.id; });
    if (mission) {
      const remaining = mission.completesAt - now;
      const complete  = mission.status === 'complete' || (remaining <= 0 && mission.rewardGenerated);

      if (complete && mission.rewardGenerated) {
        return `<div class="mael-vessel-row mael-vessel-complete">
          <span class="mael-vessel-label">EV ${v.id.slice(-4)}</span>
          <span class="mael-vessel-status ready">Complete!</span>
          <span class="mael-vessel-crystal" style="color:${_crystalColor(mission.crystalType)}">
            ${_crystalName(mission.crystalType)} x${mission.crystalAmount}
          </span>
          <button class="mael-collect-btn" onclick="collectMaelstromMission('${mission.id}')">Collect</button>
        </div>`;
      } else {
        return `<div class="mael-vessel-row">
          <span class="mael-vessel-label">EV ${v.id.slice(-4)}</span>
          <span class="mael-vessel-status">Searching the Maelstrom...</span>
          <span class="mael-vessel-countdown">${_formatMsCountdown(Math.max(0, remaining))}</span>
          <button class="mael-recall-btn" onclick="recallMaelstromMission('${mission.id}')">Recall</button>
        </div>`;
      }
    } else {
      return `<div class="mael-vessel-row">
        <span class="mael-vessel-label">EV ${v.id.slice(-4)}</span>
        <span class="mael-vessel-status">${_evStatusLabel(v)}</span>
        <button class="mael-dispatch-btn" onclick="assignVesselToMaelstrom('${v.id}')">Dispatch</button>
      </div>`;
    }
  }).join('');

  return `<div class="mael-panel">
    <div class="mael-panel-title">Expedition Vessel Missions</div>
    ${vesselRows}
    <div class="mael-panel-stats">
      ${stats.missionsCompleted || 0} missions completed &bull; ${stats.crystalsRecovered || 0} crystals recovered
    </div>
  </div>`;
}

function _renderStabilizationPanel() {
  if (typeof G === 'undefined' || !G.maelstrom) return '';
  const req       = _maelstromStabReq();
  const prog      = G.maelstrom.stabilizationProgress || {};
  const crystals  = G.maelstrom.crystals || {};
  const stabilized = G.maelstrom.stabilized;

  // Overall progress
  const totalReq  = MAELSTROM_CRYSTALS.reduce(function(s, c) { return s + req[c.id]; }, 0);
  const totalProg = MAELSTROM_CRYSTALS.reduce(function(s, c) { return s + Math.min(prog[c.id] || 0, req[c.id]); }, 0);
  const overallPct = totalReq > 0 ? Math.min(100, Math.round(totalProg / totalReq * 100)) : 0;

  // Per-crystal rows
  const crystalRows = MAELSTROM_CRYSTALS.map(function(c) {
    const contributed = Math.min(prog[c.id] || 0, req[c.id]);
    const pct         = Math.min(100, Math.round(contributed / req[c.id] * 100));
    const complete    = contributed >= req[c.id];
    const inInventory = crystals[c.id] || 0;
    return `<div class="mael-stab-row">
      <span class="mael-crystal-dot" style="background:${c.color};"></span>
      <span class="mael-stab-label">${c.name.replace(' Crystal', '')}</span>
      <span class="mael-stab-count${complete ? ' complete' : ''}">${contributed}/${req[c.id]}</span>
      <div class="mael-stab-bar-wrap"><div class="mael-stab-bar" style="width:${pct}%;background:${c.color};"></div></div>
      ${complete
        ? '<span class="mael-stab-check">&#10003;</span>'
        : `<span class="mael-stab-inv">(+${inInventory})</span>`
      }
    </div>`;
  }).join('');

  const btnDisabled = stabilized ? 'disabled' : '';
  const btnLabel    = stabilized ? 'Fully Stabilized' : 'Contribute Crystals';

  return `<div class="mael-panel">
    <div class="mael-panel-title">Maelstrom Stabilization${stabilized ? ' — COMPLETE' : ''}</div>
    <div class="mael-stab-overall">
      <div class="mael-stab-overall-label">Overall: ${totalProg} / ${totalReq} (${overallPct}%)</div>
      <div class="mael-stab-bar-wrap mael-stab-bar-overall">
        <div class="mael-stab-bar" style="width:${overallPct}%;background:linear-gradient(90deg,#8b00ff,#1a8fd4);"></div>
      </div>
    </div>
    ${crystalRows}
    <button class="mael-contribute-btn" onclick="contributeCrystals()" ${btnDisabled}>${btnLabel}</button>
  </div>`;
}

function _renderAbyssEntrance() {
  if (typeof G === 'undefined' || !G.maelstrom) return '';
  const stabilized = G.maelstrom.stabilized;

  if (!stabilized) {
    return `<div class="mael-panel mael-abyss-entrance locked">
      <div class="mael-panel-title">Abyss Entrance</div>
      ${expansionPlaceholder({ width: '100%', height: '70px', label: 'Locked Abyss Entrance' })}
      <div class="mael-panel-note">Complete Maelstrom Stabilization to unlock the Abyss.</div>
    </div>`;
  }

  // Show completion banner exactly once; persist the shown flag immediately
  let completionBanner = '';
  if (!G.maelstrom.stabilizationCompletionShown) {
    completionBanner = `<div class="mael-stab-complete-banner">MAELSTROM STABILIZED — ABYSS UNLOCKED</div>`;
    G.maelstrom.stabilizationCompletionShown = true;
    if (typeof saveState === 'function') saveState();
  }

  return `<div class="mael-panel mael-abyss-entrance active">
    <div class="mael-panel-title" style="color:#7ec8e3;">Abyss Entrance</div>
    ${completionBanner}
    ${expansionPlaceholder({ width: '100%', height: '90px', label: 'Active Abyss Entrance' })}
    <div class="mael-panel-note mael-abyss-ready-note">The Abyss awaits. Depths are unstable — proceed with caution.</div>
    <button class="mael-abyss-btn" onclick="enterAbyssDebug(null)">Enter the Abyss</button>
  </div>`;
}

// ─── RENDER: ABYSS DEBUG VIEW ─────────────────────────────────────────────────

function renderAbyssDebug() {
  if (!canAccessMaelstromAndAbyss()) { if (typeof showScreen === 'function') showScreen('fishing'); return; }
  const el = document.getElementById('expansion-abyss-content');
  if (!el) return;
  const currentZoneId = getCurrentAbyssZone();
  const zoneCards = ABYSS_ZONES.map(z => `
    <div class="expansion-zone-card ${currentZoneId === z.id ? 'selected' : ''}" style="border-color:${z.themeColor}"
         onclick="selectAbyssZoneDebug('${z.id}')">
      ${expansionPlaceholder({ width: '100%', height: '55px', label: z.name })}
      <div class="expansion-zone-name" style="color:${z.themeColor}">${z.name}</div>
      <div class="expansion-zone-status">[Placeholder · Phase 1]</div>
    </div>`).join('');
  el.innerHTML = `
    <div class="expansion-debug-world">
      <div class="expansion-debug-label" style="color:#7ec8e3;">WORLD: ABYSS (Phase 1 Placeholder)</div>
      ${currentZoneId
        ? `<div class="expansion-debug-zone">Selected Zone: <strong>${currentZoneId}</strong></div>`
        : '<div class="expansion-debug-zone">No zone selected</div>'}
      ${expansionPlaceholder({ width: '100%', height: '90px', label: 'Abyss Zone Frame' })}
      <div class="expansion-debug-desc">No Abyss gameplay yet. Architecture only.</div>
      <div class="expansion-zone-grid">${zoneCards}</div>
      <div class="expansion-dev-controls">
        <button class="btn-secondary expansion-return-btn" onclick="enterMaelstromDebug()">Return to Maelstrom</button>
        <button class="btn-secondary expansion-return-btn" onclick="resetExpansionDebugState()">Reset &amp; Return to Overworld</button>
      </div>
    </div>`;
}

// ─── DEBUG CONTROLS (SETTINGS SECTION) ───────────────────────────────────────
// Visible only when isLocalDevelopmentEnvironment() === true.
// Never shown in production Android builds.

function renderAbyssDebugSettings() {
  const el = document.getElementById('abyss-debug-settings');
  if (!el) return;
  if (!isLocalDevelopmentEnvironment()) { el.style.display = 'none'; return; }
  el.style.display = '';
  const enabled = isLocalAbyssDebugEnabled();
  const world   = getCurrentExpansionWorld();
  el.innerHTML = `
    <div class="settings-section-title" style="color:#ff6b35;">Dev — Maelstrom/Abyss Debug [LOCAL ONLY]</div>
    <div class="settings-row">
      <span class="settings-label">Enable Maelstrom / Abyss Debug</span>
      <button class="btn-toggle ${enabled ? '' : 'off'}" onclick="toggleAbyssDebugMode()">${enabled ? 'ON' : 'OFF'}</button>
    </div>
    ${enabled ? `
    <div class="settings-info-row dim" style="margin-bottom:6px;">Current world: <strong>${world}</strong></div>
    <div class="expansion-dev-controls">
      <button class="btn-secondary-sm" onclick="enterMaelstromDebug()">Enter Maelstrom</button>
      <button class="btn-secondary-sm" onclick="enterAbyssDebug(null)">Enter Abyss</button>
      <button class="btn-secondary-sm" onclick="resetExpansionDebugState()">Reset All</button>
    </div>
    <div class="mael-debug-helpers">
      <button class="btn-secondary-sm" onclick="_debugAddCrystals()">+10 Each Crystal</button>
      <button class="btn-secondary-sm" onclick="_debugCompleteStabilization()">Complete Stabilization</button>
      <button class="btn-secondary-sm" onclick="_debugClearStabilization()">Clear Stabilization</button>
    </div>` : ''}`;
}

function toggleAbyssDebugMode() {
  if (!isLocalDevelopmentEnvironment()) return;
  setLocalAbyssDebugEnabled(!isLocalAbyssDebugEnabled());
  renderAbyssDebugSettings();
}

// ─── STARTUP ──────────────────────────────────────────────────────────────────
// Called from game.js init() after G is ready and migrations are applied.

function initAbyssFramework() {
  renderAbyssDebugSettings();

  if (!canAccessMaelstromAndAbyss()) return;

  // Process missions that completed while the app was closed
  _processMaelstromMissions();

  // Sanity check: stabilize if requirements are met but flag was not set
  // (handles crash-during-save or cross-save edge cases)
  _checkStabilizationCompletion();

  // Orphan cleanup: remove missions whose vessel no longer exists
  if (typeof G !== 'undefined' && G.maelstrom && Array.isArray(G.maelstrom.crystalMissions)) {
    const validVesselIds = new Set((G.expeditionVessels || []).map(function(v) { return v.id; }));
    const before = G.maelstrom.crystalMissions.length;
    G.maelstrom.crystalMissions = G.maelstrom.crystalMissions.filter(function(m) {
      return validVesselIds.has(m.vesselId);
    });
    // Clear orphaned mission pointers on vessels
    (G.expeditionVessels || []).forEach(function(v) {
      if (v.maelstromMissionId) {
        const missionExists = G.maelstrom.crystalMissions.some(function(m) { return m.id === v.maelstromMissionId; });
        if (!missionExists) _restoreVesselFromMaelstrom(v.id);
      }
    });
    if (G.maelstrom.crystalMissions.length !== before && typeof saveState === 'function') saveState();
  }
}
