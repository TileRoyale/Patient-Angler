'use strict';

// ─── MAELSTROM & ABYSS EXPANSION FRAMEWORK ─────────────────────────────────
// Phase 1: Architecture foundation only. No gameplay.
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
// Placeholder-only. No loot, fish, economy, or tribe data in Phase 1.
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

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
// Entering debug worlds must not spend coins, modify automation, trigger analytics,
// trigger achievements, or change overworld state.

function enterMaelstromDebug() {
  if (!canAccessMaelstromAndAbyss()) return;
  G.currentWorld = 'maelstrom';
  if (typeof showScreen === 'function') showScreen('expansion-maelstrom');
}

function enterAbyssDebug(zoneId) {
  if (!canAccessMaelstromAndAbyss()) return;
  G.currentWorld = 'abyss';
  if (zoneId) G.abyss.currentZone = zoneId;
  if (typeof showScreen === 'function') showScreen('expansion-abyss');
}

function leaveExpansionWorld() {
  if (typeof G !== 'undefined') G.currentWorld = 'overworld';
  if (typeof showScreen === 'function') showScreen('fishing');
}

function resetExpansionDebugState() {
  if (!canAccessMaelstromAndAbyss()) return;
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

// ─── RENDER: MAELSTROM DEBUG VIEW ─────────────────────────────────────────────

function renderMaelstromDebug() {
  if (!canAccessMaelstromAndAbyss()) { if (typeof showScreen === 'function') showScreen('fishing'); return; }
  const el = document.getElementById('expansion-maelstrom-content');
  if (!el) return;
  el.innerHTML = `
    <div class="expansion-debug-world">
      <div class="expansion-debug-label" style="color:${MAELSTROM_ZONE.themeColor}">WORLD: MAELSTROM (Phase 1 Placeholder)</div>
      ${expansionPlaceholder({ width: '100%', height: '160px', label: 'Maelstrom Background' })}
      <div class="expansion-debug-desc">No gameplay in Phase 1. Architecture only.</div>
      <div class="expansion-zone-grid">
        <div class="expansion-zone-card" style="border-color:${MAELSTROM_ZONE.themeColor}">
          ${expansionPlaceholder({ width: '100%', height: '70px', label: 'Maelstrom Zone' })}
          <div class="expansion-zone-name" style="color:${MAELSTROM_ZONE.themeColor}">${MAELSTROM_ZONE.name}</div>
          <div class="expansion-zone-status">[Placeholder]</div>
        </div>
      </div>
      <div class="expansion-dev-controls">
        <button class="btn-secondary expansion-return-btn" onclick="enterAbyssDebug(null)">Go to Abyss Debug</button>
        <button class="btn-secondary expansion-return-btn" onclick="leaveExpansionWorld()">Return to Overworld</button>
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
// No timers, no intervals, no processing started here.

function initAbyssFramework() {
  renderAbyssDebugSettings();
}
