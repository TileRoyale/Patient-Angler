'use strict';

// ─── MAELSTROM & ABYSS EXPANSION FRAMEWORK ─────────────────────────────────
// Phase 1: Architecture foundation.
// Phase 2: Maelstrom crystal-mission shell (debug only, no live gameplay).
// All expansion access controlled by canAccessMaelstromAndAbyss().
// When local debug is disabled, nothing in this file affects live gameplay.

// ─── ENVIRONMENT DETECTION ────────────────────────────────────────────────────

function isLocalDevelopmentEnvironment() {
  if (window.Capacitor) return false;          // Running inside Capacitor/Android — never local dev
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
// Placeholder-only. No loot, fish, economy, or tribe data in Phase 1/2.
// See ABYSS Missing Assets.md for all assets needed before production.

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
// White box, thin dark border, large red question mark — no emoji, no broken-image icon.
// Only call when canAccessMaelstromAndAbyss() is true.
// opts: { width, height, label }

function expansionPlaceholder(opts) {
  if (!canAccessMaelstromAndAbyss()) return '';
  const w = (opts && opts.width)  || '100%';
  const h = (opts && opts.height) || '120px';
  const lbl = (opts && opts.label) ? `<span class="exp-ph-label">${opts.label}</span>` : '';
  return `<div class="expansion-placeholder" style="width:${w};height:${h};">${lbl}<span class="exp-ph-mark">?</span></div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 2 — MAELSTROM CRYSTAL MISSIONS (DEBUG ONLY)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── PROVISIONAL CONSTANTS (Phase 2 — non-final, will be tuned in future phase) ──

const _MAEL_MISSION_DURATION_MS = 10 * 60 * 1000;  // 10 minutes in debug; production TBD
const _MAEL_CRYSTAL_MIN         = 1;
const _MAEL_CRYSTAL_MAX         = 3;

// ─── CRYSTAL REGISTRY ────────────────────────────────────────────────────────

const MAELSTROM_CRYSTALS = [
  { id: 'azure',    name: 'Azure Crystal',    color: '#1a8fd4', icon: null },  // icon: crystal_blue.png (Missing)
  { id: 'emerald',  name: 'Emerald Crystal',  color: '#1aa352', icon: null },  // icon: crystal_green.png (Missing)
  { id: 'amethyst', name: 'Amethyst Crystal', color: '#8b34c8', icon: null },  // icon: crystal_purple.png (Missing)
  { id: 'ruby',     name: 'Ruby Crystal',     color: '#c43030', icon: null },  // icon: crystal_red.png (Missing)
  { id: 'golden',   name: 'Golden Crystal',   color: '#c49a00', icon: null },  // icon: crystal_gold.png (Missing)
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
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
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

function _randomCrystalType() {
  return MAELSTROM_CRYSTALS[Math.floor(Math.random() * MAELSTROM_CRYSTALS.length)].id;
}

function _randomCrystalAmount() {
  return _MAEL_CRYSTAL_MIN + Math.floor(Math.random() * (_MAEL_CRYSTAL_MAX - _MAEL_CRYSTAL_MIN + 1));
}

// ─── UI REFRESH TIMER ─────────────────────────────────────────────────────────
// Runs only while Maelstrom screen is visible; stopped when leaving.

let _maelstromUIInterval = null;

function _startMaelstromUITimer() {
  if (_maelstromUIInterval) return;
  _maelstromUIInterval = setInterval(function() {
    if (isInMaelstrom()) renderMaelstromDebug();
  }, 5000);
}

function _stopMaelstromUITimer() {
  if (_maelstromUIInterval) { clearInterval(_maelstromUIInterval); _maelstromUIInterval = null; }
}

// ─── MISSION PROCESSING ──────────────────────────────────────────────────────
// Idempotent: safe to call multiple times. Completes missions whose timer has
// expired but have not yet been collected. Does NOT grant crystals automatically
// — player must tap Collect. Sets status = 'complete' so UI shows the button.

function _processMaelstromMissions() {
  if (!canAccessMaelstromAndAbyss()) return;
  if (typeof G === 'undefined' || !G.maelstrom || !Array.isArray(G.maelstrom.crystalMissions)) return;
  const now = Date.now();
  let changed = false;
  G.maelstrom.crystalMissions.forEach(function(m) {
    if (m.status === 'active' && now >= m.completesAt) {
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
  if (v.maelstromMissionId) { if (typeof showStatus === 'function') showStatus('Already on a mission.', 1500); return; }

  // Preserve remaining treasure timer
  const remaining = v.nextChestAt > Date.now() ? v.nextChestAt - Date.now() : 0;
  v.savedTreasureRemainingMs = remaining;
  v.nextChestAt = 0; // sentinel — normal EV loops skip nextChestAt === 0

  const missionId = _missionId();
  const crystalType = _randomCrystalType();
  const crystalAmount = _randomCrystalAmount();
  const now = Date.now();

  const mission = {
    id:           missionId,
    vesselId:     vesselId,
    crystalType:  crystalType,
    crystalAmount:crystalAmount,
    startedAt:    now,
    completesAt:  now + _MAEL_MISSION_DURATION_MS,
    status:       'active',   // 'active' | 'complete' | 'claimed'
  };

  v.maelstromMissionId = missionId;
  G.maelstrom.crystalMissions.push(mission);
  G.maelstrom.stats.missionsStarted = (G.maelstrom.stats.missionsStarted || 0) + 1;

  if (typeof saveState === 'function') saveState();
  if (typeof showStatus === 'function') showStatus('Vessel dispatched on a crystal mission!', 2000);
  renderMaelstromDebug();
}

// ─── COLLECT MISSION REWARD ──────────────────────────────────────────────────
// Idempotent: claim guard prevents double-collection even on rapid taps.

const _collectingMission = {};

function collectMaelstromMission(missionId) {
  if (!canAccessMaelstromAndAbyss()) return;
  if (_collectingMission[missionId]) return;
  _collectingMission[missionId] = true;

  if (typeof G === 'undefined') { delete _collectingMission[missionId]; return; }
  const m = (G.maelstrom.crystalMissions || []).find(x => x.id === missionId);
  if (!m || m.status === 'claimed') { delete _collectingMission[missionId]; return; }

  // Mark claimed BEFORE granting — prevents partial state if anything throws
  m.status = 'claimed';
  if (typeof saveState === 'function') saveState();

  G.maelstrom.crystals[m.crystalType] = (G.maelstrom.crystals[m.crystalType] || 0) + m.crystalAmount;
  G.maelstrom.stats.missionsCompleted = (G.maelstrom.stats.missionsCompleted || 0) + 1;
  G.maelstrom.stats.crystalsRecovered = (G.maelstrom.stats.crystalsRecovered || 0) + m.crystalAmount;

  _restoreVesselFromMaelstrom(m.vesselId);

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

  m.status = 'claimed'; // mark before removal to block concurrent collect taps
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
  // Restore remaining treasure countdown from when vessel was dispatched
  const saved = (v.savedTreasureRemainingMs != null && v.savedTreasureRemainingMs > 0)
    ? v.savedTreasureRemainingMs
    : (typeof EXPEDITION_VESSEL_INTERVAL !== 'undefined' ? EXPEDITION_VESSEL_INTERVAL : 30 * 60 * 60 * 1000);
  v.nextChestAt = Date.now() + saved;
  v.savedTreasureRemainingMs = null;
}

// ─── PRESTIGE HOOK ────────────────────────────────────────────────────────────
// Called from executePrestige() BEFORE G.expeditionVessels is cleared.
// Cleans up crystal missions referencing vessels that are about to be wiped.

function _clearMaelstromMissionsOnPrestige() {
  if (typeof G === 'undefined' || !G.maelstrom) return;
  G.maelstrom.crystalMissions = [];
  G.maelstrom.crystals        = { azure:0, emerald:0, amethyst:0, ruby:0, golden:0 };
  // Stats intentionally kept — they're a permanent record like fishdex
}

// ─── DEBUG STATE RESET ────────────────────────────────────────────────────────
// Wipes all Maelstrom mission state and restores all vessels.
// Dev-only: called from Settings debug controls.

function _resetMaelstromDebugState() {
  if (!canAccessMaelstromAndAbyss()) return;
  if (typeof G === 'undefined') return;
  // Restore all vessels before clearing missions
  (G.expeditionVessels || []).forEach(function(v) {
    if (v.maelstromMissionId) _restoreVesselFromMaelstrom(v.id);
  });
  G.maelstrom.crystalMissions = [];
  G.maelstrom.crystals        = { azure:0, emerald:0, amethyst:0, ruby:0, golden:0 };
  if (typeof saveState === 'function') saveState();
  if (typeof showStatus === 'function') showStatus('Maelstrom debug state reset.', 1500);
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
// Entering debug worlds must not spend coins, modify automation, trigger analytics,
// trigger achievements, or change overworld state.

function enterMaelstromDebug() {
  if (!canAccessMaelstromAndAbyss()) return;
  G.currentWorld = 'maelstrom';
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

// ─── RENDER: MAELSTROM DEBUG VIEW (Phase 2 functional shell) ─────────────────

function renderMaelstromDebug() {
  if (!canAccessMaelstromAndAbyss()) { if (typeof showScreen === 'function') showScreen('fishing'); return; }
  const el = document.getElementById('expansion-maelstrom-content');
  if (!el) return;
  el.innerHTML = `
    <div class="mael-screen">
      <div class="mael-header" style="color:${MAELSTROM_ZONE.themeColor}">The Maelstrom <span class="mael-debug-tag">DEBUG</span></div>
      ${expansionPlaceholder({ width: '100%', height: '100px', label: 'Maelstrom Background' })}
      ${_renderCrystalInventory()}
      ${_renderStabilizationPanel()}
      ${_renderMissionPanel()}
      <div class="mael-controls">
        <button class="btn-secondary expansion-return-btn" onclick="enterAbyssDebug(null)">Go to Abyss Debug</button>
        <button class="btn-secondary expansion-return-btn" onclick="leaveExpansionWorld()">Return to Overworld</button>
        <button class="btn-secondary-sm mael-reset-btn" onclick="_resetMaelstromDebugState();renderMaelstromDebug();">Reset Missions</button>
      </div>
    </div>`;
}

function _renderCrystalInventory() {
  if (typeof G === 'undefined' || !G.maelstrom) return '';
  const crystals = G.maelstrom.crystals || {};
  const rows = MAELSTROM_CRYSTALS.map(function(c) {
    const amt = crystals[c.id] || 0;
    return `<div class="mael-crystal-row">
      <span class="mael-crystal-dot" style="background:${c.color};"></span>
      <span class="mael-crystal-name">${c.name}</span>
      <span class="mael-crystal-amt">${amt}</span>
    </div>`;
  }).join('');
  return `<div class="mael-panel">
    <div class="mael-panel-title">Crystal Inventory</div>
    ${expansionPlaceholder({ width: '40px', height: '40px', label: 'Inv' })}
    ${rows}
  </div>`;
}

function _renderStabilizationPanel() {
  return `<div class="mael-panel">
    <div class="mael-panel-title">Stabilization</div>
    ${expansionPlaceholder({ width: '100%', height: '60px', label: 'Stabilization Meter — Phase 3' })}
    <div class="mael-panel-note">Stabilization system not yet implemented.</div>
  </div>`;
}

function _renderMissionPanel() {
  if (typeof G === 'undefined') return '';
  const vessels = G.expeditionVessels || [];
  const missions = (G.maelstrom && G.maelstrom.crystalMissions) || [];
  const now = Date.now();

  if (vessels.length === 0) {
    return `<div class="mael-panel">
      <div class="mael-panel-title">Expedition Vessel Missions</div>
      <div class="mael-panel-note">No Expedition Vessels owned. Purchase one from the Shop (Ocean zone required).</div>
    </div>`;
  }

  const vesselRows = vessels.map(function(v) {
    const mission = missions.find(function(m) { return m.vesselId === v.id && m.status !== 'claimed'; });
    if (mission) {
      const remaining = mission.completesAt - now;
      const isReady   = remaining <= 0 || mission.status === 'complete';
      return `<div class="mael-vessel-row">
        <span class="mael-vessel-label">EV ${v.id.slice(-4)}</span>
        <span class="mael-vessel-status ${isReady ? 'ready' : ''}">
          ${isReady ? 'READY' : _formatMsCountdown(remaining)} &mdash; ${_crystalName(mission.crystalType)} x${mission.crystalAmount}
        </span>
        ${isReady
          ? `<button class="btn-sm mael-collect-btn" onclick="collectMaelstromMission('${mission.id}')">Collect</button>`
          : `<button class="btn-sm-secondary mael-recall-btn" onclick="recallMaelstromMission('${mission.id}')">Recall</button>`
        }
      </div>`;
    } else {
      const status = _evStatusLabel(v);
      return `<div class="mael-vessel-row">
        <span class="mael-vessel-label">EV ${v.id.slice(-4)}</span>
        <span class="mael-vessel-status">${status}</span>
        <button class="btn-sm mael-dispatch-btn" onclick="assignVesselToMaelstrom('${v.id}')">Dispatch</button>
      </div>`;
    }
  }).join('');

  const stats = G.maelstrom.stats || {};
  return `<div class="mael-panel">
    <div class="mael-panel-title">Expedition Vessel Missions</div>
    ${vesselRows}
    <div class="mael-panel-stats">
      Missions: ${stats.missionsCompleted || 0} completed &bull;
      ${stats.crystalsRecovered || 0} crystals recovered
    </div>
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
      ${currentZoneId ? `<div class="expansion-debug-zone">Selected Zone: <strong>${currentZoneId}</strong></div>` : '<div class="expansion-debug-zone">No zone selected</div>'}
      ${expansionPlaceholder({ width: '100%', height: '100px', label: 'Abyss Zone Frame' })}
      <div class="expansion-debug-desc">No gameplay in Phase 1. Architecture only.</div>
      <div class="expansion-zone-grid">${zoneCards}</div>
      <div class="expansion-dev-controls">
        <button class="btn-secondary expansion-return-btn" onclick="enterMaelstromDebug()">Go to Maelstrom Debug</button>
        <button class="btn-secondary expansion-return-btn" onclick="resetExpansionDebugState()">Reset &amp; Return to Overworld</button>
      </div>
    </div>`;
}

// ─── DEBUG CONTROLS (SETTINGS SECTION) ───────────────────────────────────────
// Only shown when isLocalDevelopmentEnvironment() === true.
// Never visible in public Android builds or to normal players.

function renderAbyssDebugSettings() {
  const el = document.getElementById('abyss-debug-settings');
  if (!el) return;
  if (!isLocalDevelopmentEnvironment()) { el.style.display = 'none'; return; }
  el.style.display = '';
  const enabled = isLocalAbyssDebugEnabled();
  const world   = getCurrentExpansionWorld();
  el.innerHTML = `
    <div class="settings-section-title" style="color:#ff6b35;">Dev — Abyss Debug [LOCAL ONLY]</div>
    <div class="settings-row">
      <span class="settings-label">Enable Maelstrom / Abyss Debug</span>
      <button class="btn-toggle ${enabled ? '' : 'off'}" onclick="toggleAbyssDebugMode()">${enabled ? 'ON' : 'OFF'}</button>
    </div>
    ${enabled ? `
    <div class="settings-info-row dim" style="margin-bottom:6px;">Current world: <strong>${world}</strong></div>
    <div class="expansion-dev-controls">
      <button class="btn-secondary-sm" onclick="enterMaelstromDebug()">Enter Maelstrom</button>
      <button class="btn-secondary-sm" onclick="enterAbyssDebug(null)">Enter Abyss</button>
      <button class="btn-secondary-sm" onclick="resetExpansionDebugState()">Reset State</button>
    </div>` : ''}`;
}

function toggleAbyssDebugMode() {
  if (!isLocalDevelopmentEnvironment()) return;
  setLocalAbyssDebugEnabled(!isLocalAbyssDebugEnabled());
  renderAbyssDebugSettings();
}

// ─── STARTUP ──────────────────────────────────────────────────────────────────
// Called from game.js init() after G is ready.

function initAbyssFramework() {
  renderAbyssDebugSettings();

  // Process any missions that completed while the app was closed
  if (canAccessMaelstromAndAbyss()) {
    _processMaelstromMissions();

    // Orphan cleanup: remove missions referencing vessels that no longer exist
    if (typeof G !== 'undefined' && G.maelstrom && Array.isArray(G.maelstrom.crystalMissions)) {
      const validVesselIds = new Set((G.expeditionVessels || []).map(function(v) { return v.id; }));
      const before = G.maelstrom.crystalMissions.length;
      G.maelstrom.crystalMissions = G.maelstrom.crystalMissions.filter(function(m) {
        return validVesselIds.has(m.vesselId) || m.status === 'claimed';
      });
      // Also clear orphaned vessel mission pointers
      (G.expeditionVessels || []).forEach(function(v) {
        if (v.maelstromMissionId) {
          const missionExists = G.maelstrom.crystalMissions.some(function(m) { return m.id === v.maelstromMissionId; });
          if (!missionExists) _restoreVesselFromMaelstrom(v.id);
        }
      });
      if (G.maelstrom.crystalMissions.length !== before && typeof saveState === 'function') saveState();
    }
  }
}
