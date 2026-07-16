// ─────────────────────────────────────────────────────────────────────────────
// Patient Angler Analytics Client
// Private developer telemetry — never displayed to players.
// Reads from G (game state) and calls the Railway backend.
// Upload strategy: checkpoint-based (~2–5 uploads/day).
//   Triggers: zone unlock, prestige, series complete, fishdex 10% steps, daily.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const _ANL_VERSION = 1;
const _ANL_STORAGE_KEY = 'pa_anl_v1';
const _ANL_DAILY_KEY   = 'pa_anl_daily';

// ─── Session tracking (not persisted to G to keep cloud save clean) ───────────
let _anlSessionStart  = Date.now();
let _anlSessionCount  = 0;
let _anlLastZone      = '';
let _anlLastSnapshot  = null; // last successfully sent snapshot for change detection
let _anlPendingMilestones = [];

// Milestones already sent this install (persisted in localStorage, not G)
function _anlLoadSentMilestones() {
  try { return JSON.parse(localStorage.getItem('pa_anl_ms') || '[]'); } catch { return []; }
}
function _anlSaveSentMilestones(arr) {
  try { localStorage.setItem('pa_anl_ms', JSON.stringify(arr)); } catch {}
}

// ─── Change Detection ─────────────────────────────────────────────────────────
function _anlHasMeaningfulChange(snap) {
  if (!_anlLastSnapshot) return true;
  const p = _anlLastSnapshot;
  return (
    snap.highestZone              !== p.highestZone ||
    snap.prestigeCount            !== p.prestigeCount ||
    snap.competitionSeriesCompleted !== p.competitionSeriesCompleted ||
    Math.floor(snap.overallFishdexPercent / 10) !== Math.floor(p.overallFishdexPercent / 10) ||
    Math.abs(snap.gameCompletionPercent - p.gameCompletionPercent) >= 5
  );
}

// ─── Snapshot Builder ─────────────────────────────────────────────────────────
// Maps G fields to the analytics payload. All values sanitized client-side too.
function buildAnalyticsSnapshot() {
  if (typeof G === 'undefined') return null;

  // Session tracking
  const stored = (() => { try { return JSON.parse(localStorage.getItem(_ANL_STORAGE_KEY) || '{}'); } catch { return {}; } })();
  const firstSeen = stored.firstSeen || Date.now();
  const totalPlaySecs = Math.floor(((stored.totalPlayMs || 0) + (Date.now() - _anlSessionStart)) / 1000);
  const sessionCountTotal = (stored.sessionCount || 0) + _anlSessionCount;

  // Rod lookup helpers
  const RODS = [
    { id:'basic_rod',    tier:1 }, { id:'river_rod',    tier:2 },
    { id:'lake_rod',     tier:3 }, { id:'bay_rod',      tier:4 },
    { id:'sea_rod',      tier:5 }, { id:'ocean_rod',    tier:6 },
    { id:'carbon_rod',   tier:7 }, { id:'mythic_rod',   tier:8 },
    { id:'abyss_rod',    tier:9 },
  ];
  function rodTier(id) { return RODS.find(r => r.id === id)?.tier || 0; }

  const fishdexTotal = typeof FISH_DB !== 'undefined'
    ? (FISH_DB.length + (typeof TRASH_DB !== 'undefined' ? TRASH_DB.length : 0) + (typeof PLANT_DB !== 'undefined' ? PLANT_DB.length : 0))
    : 140;
  const fishdexFound = Array.isArray(G.fishdex) ? G.fishdex.length : 0;

  // Automation fishdex (excludes manual-only)
  const autoFishdexTotal = 130;
  const manualOnlyIds = (typeof FISH_DB !== 'undefined')
    ? FISH_DB.filter(f => f.manualOnly).map(f => f.id)
    : [];
  const autoFishdexFound = Array.isArray(G.fishdex)
    ? G.fishdex.filter(id => !manualOnlyIds.includes(id)).length
    : 0;
  const manualFishdexFound = Array.isArray(G.fishdex)
    ? G.fishdex.filter(id => manualOnlyIds.includes(id)).length
    : 0;

  // Mastery
  const masteryPoints = typeof getMasteryTotalPoints === 'function' ? getMasteryTotalPoints() : 0;
  const masteryMaxPoints = typeof getMasteryMaxPoints === 'function' ? getMasteryMaxPoints() : 0;

  // Prestige
  const prestigeCount = G.prestigeCount || 0;

  // Diamonds (same as G.blackPearls)
  const blackPearls = G.blackPearls || 0;
  const lifetimePearls = G.stats?.lifetimeBlackPearlsEarned || 0;
  const pearlsSpent = G.stats?.blackPearlsSpent || 0;

  // Economy
  const coins = G.coins || 0;
  const lifeEarned = G.stats?.lifeCoinsEarned || 0;
  const lifeSpent = G.stats?.lifeCoinsSpent || 0;
  const highCoins = G.stats?.highestCoins || 0;

  const hourlyIncome = typeof getEstimatedHourlyIncome === 'function' ? getEstimatedHourlyIncome() : 0;
  const fishRate = typeof calcFishRate === 'function' ? calcFishRate() : 0;

  // Rod
  const curRod = G.currentRod || 'basic_rod';
  const highestRodId = G.stats?.highestRod || curRod;

  // Targeted lure
  const luLevel = G.targetedLure?.level || 0;
  const luTargets = Array.isArray(G.targetedLure?.targets) ? G.targetedLure.targets.length : 0;

  // Competitions
  const compWins = G.stats?.totalCompWins || 0;
  const firstPlaceWins = G.stats?.firstPlaceFinishes || 0;
  const grandTitles = G.stats?.recGrandTitles || G.hofWins?.length || 0;
  const seriesCompleted = G.series?.completedCount || 0;

  // Quests
  const dailyCompleted = G.stats?.dailyQuestsCompleted || 0;
  const weeklyCompleted = G.stats?.weeklyQuestsCompleted || 0;

  // Achievements
  const achList = Object.values(G.quests?.ap || {});
  const achCompleted = achList.filter(a => a.claimed).length;
  const hiddenCompleted = achList.filter(a => a.claimed && a.hidden).length;
  const achTotal = typeof ACHIEVEMENTS !== 'undefined' ? ACHIEVEMENTS.length : achList.length;

  // Fish records
  const trophyCount = G.stats?.totalTrophyFish || 0;
  const bigFishData = G.stats?.recBiggestFish;
  const bigFishGrams = bigFishData?.weightGrams || 0;
  const bigFishName = bigFishData?.name || '';
  const mvSale = G.stats?.recMostValuableSaleVal || 0;
  const mvSaleName = G.stats?.recMostValuableSaleName || '';

  // Misc
  const offlineHours = G.stats?.offlineHoursClaimed || 0;
  const seagulls = G.stats?.totalSeagull || 0;
  const eventsTriggered = G.stats?.totalSpecialEvents || 0;

  // Game completion: use a weighted formula
  const ZONES = ['pond','river','lake','bay','sea','ocean'];
  const highestZoneIdx = ZONES.indexOf(G.stats?.recHighestZone || G.currentZone || 'pond');
  const zonePercent = ((highestZoneIdx + 1) / ZONES.length) * 30;
  const dexPercent = (fishdexFound / fishdexTotal) * 35;
  const masteryPct = masteryMaxPoints > 0 ? (masteryPoints / masteryMaxPoints) * 20 : 0;
  const achPct = achTotal > 0 ? (achCompleted / achTotal) * 15 : 0;
  const gameCompletion = Math.min(100, zonePercent + dexPercent + masteryPct + achPct);

  const daysSinceFirst = Math.floor((Date.now() - firstSeen) / 86400000);

  return {
    appVersion:               typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : (typeof PA_VERSION !== 'undefined' ? PA_VERSION : null),
    buildNumber:              typeof BUILD_NUMBER !== 'undefined' ? String(BUILD_NUMBER) : null,
    platform:                 window.Capacitor?.getPlatform?.() || 'web',
    firstInstallVersion:      stored.firstInstallVersion || null,
    previousVersion:          stored.previousVersion || null,
    daysSinceFirstPlay:       daysSinceFirst,
    totalPlayTimeSeconds:     totalPlaySecs,
    sessionCount:             sessionCountTotal,
    lastSessionDurationSeconds: Math.floor((Date.now() - _anlSessionStart) / 1000),
    currentZone:              G.currentZone || 'pond',
    highestZone:              G.stats?.recHighestZone || G.currentZone || 'pond',
    gameCompletionPercent:    Math.round(gameCompletion * 10) / 10,
    overallFishdexFound:      fishdexFound,
    overallFishdexTotal:      fishdexTotal,
    overallFishdexPercent:    fishdexTotal > 0 ? Math.round(fishdexFound / fishdexTotal * 1000) / 10 : 0,
    automationFishdexFound:   autoFishdexFound,
    automationFishdexTotal:   autoFishdexTotal,
    automationFishdexPercent: autoFishdexTotal > 0 ? Math.round(autoFishdexFound / autoFishdexTotal * 1000) / 10 : 0,
    manualFishdexFound:       manualFishdexFound,
    manualFishdexTotal:       manualOnlyIds.length || 10,
    manualFishdexPercent:     manualOnlyIds.length > 0 ? Math.round(manualFishdexFound / manualOnlyIds.length * 1000) / 10 : 0,
    masteryPoints,
    masteryMaxPoints,
    masteryPercent:           masteryMaxPoints > 0 ? Math.round(masteryPoints / masteryMaxPoints * 1000) / 10 : 0,
    prestigeCount,
    currentBlackPearls:       blackPearls,
    lifetimeBlackPearlsEarned:lifetimePearls,
    blackPearlsSpent:         pearlsSpent,
    currentDiamonds:          G.diamonds || 0,
    highestDiamondsHeld:      G.stats?.highestDiamonds || G.diamonds || 0,
    currentCoins:             coins,
    lifetimeCoinsEarned:      lifeEarned,
    lifetimeCoinsSpent:       lifeSpent,
    highestCoinBalance:       highCoins,
    estimatedHourlyIncome:    Math.floor(hourlyIncome),
    currentFishRate:          Math.round(fishRate * 100) / 100,
    currentRod:               curRod,
    currentRodTier:           rodTier(curRod),
    highestRod:               highestRodId,
    highestRodTier:           rodTier(highestRodId),
    targetedLureLevel:        luLevel,
    targetedLureActiveTargets:luTargets,
    competitionWins:          compWins,
    firstPlaceFinishes:       firstPlaceWins,
    grandCompetitionTitles:   grandTitles,
    competitionSeriesCompleted:seriesCompleted,
    dailyQuestsCompleted:     dailyCompleted,
    weeklyQuestsCompleted:    weeklyCompleted,
    achievementsCompleted:    achCompleted,
    hiddenAchievementsCompleted: hiddenCompleted,
    achievementsTotal:        achTotal,
    trophyFishCaught:         trophyCount,
    largestFishWeightGrams:   bigFishGrams,
    largestFishName:          bigFishName,
    mostValuableCatch:        mvSale,
    mostValuableCatchName:    mvSaleName,
    offlineHoursClaimedTotal: offlineHours,
    seagullsClicked:          seagulls,
    specialEventsClaimed:     eventsTriggered,
    guildOrdersCompleted:     G.guild?.stats?.ordersCompleted     || 0,
    guildGoldenCompleted:     G.guild?.stats?.goldenCompleted     || 0,
    guildTotalFishDelivered:  G.guild?.stats?.totalFishDelivered  || 0,
    guildAvgCompletionHrs:    G.guild?.stats?.completionTimeSamples > 0
      ? Math.round((G.guild.stats.totalCompletionTimeMs / G.guild.stats.completionTimeSamples) / 360000) / 10
      : 0,
    clientUpdatedAt:          new Date().toISOString(),
  };
}

// Immediate one-off milestone call from tutorial.js or other game code
function trackMilestone(key) {
  const sent = _anlLoadSentMilestones();
  if (sent.includes(key)) return;
  sent.push(key);
  _anlSaveSentMilestones(sent);
  _anlPendingMilestones.push({
    key,
    reachedAt:    new Date().toISOString(),
    playTimeSecs: 0,
    appVersion:   (typeof APP_VERSION !== 'undefined') ? APP_VERSION : '',
  });
}

// ─── Milestone Detection ──────────────────────────────────────────────────────
function _anlBuildMilestones(snapshot) {
  if (!snapshot) return [];
  const sent = _anlLoadSentMilestones();
  const newMs = [];

  function check(key, condition) {
    if (!condition) return;
    if (sent.includes(key)) return;
    newMs.push({
      key,
      reachedAt:    new Date().toISOString(),
      playTimeSecs: snapshot.totalPlayTimeSeconds,
      appVersion:   snapshot.appVersion,
    });
    sent.push(key);
  }

  // Game started milestone — once ever
  check('game_started', true);

  // Zone unlocks
  const ZONES = ['pond','river','lake','bay','sea','ocean'];
  const hzIdx = ZONES.indexOf(snapshot.highestZone);
  if (hzIdx >= 1) check('river_unlocked', true);
  if (hzIdx >= 2) check('lake_unlocked', true);
  if (hzIdx >= 3) check('bay_unlocked', true);
  if (hzIdx >= 4) check('sea_unlocked', true);
  if (hzIdx >= 5) check('ocean_unlocked', true);

  // Prestige
  check('first_prestige',  snapshot.prestigeCount >= 1);
  check('prestige_5',      snapshot.prestigeCount >= 5);
  check('prestige_10',     snapshot.prestigeCount >= 10);
  check('prestige_25',     snapshot.prestigeCount >= 25);
  check('prestige_50',     snapshot.prestigeCount >= 50);

  // Overall fishdex
  check('overall_fishdex_25',  snapshot.overallFishdexPercent  >= 25);
  check('overall_fishdex_50',  snapshot.overallFishdexPercent  >= 50);
  check('overall_fishdex_75',  snapshot.overallFishdexPercent  >= 75);
  check('overall_fishdex_100', snapshot.overallFishdexPercent  >= 100);
  check('automation_fishdex_25',  snapshot.automationFishdexPercent >= 25);
  check('automation_fishdex_50',  snapshot.automationFishdexPercent >= 50);
  check('automation_fishdex_75',  snapshot.automationFishdexPercent >= 75);
  check('automation_fishdex_100', snapshot.automationFishdexPercent >= 100);
  check('manual_fishdex_25',   snapshot.manualFishdexPercent   >= 25);
  check('manual_fishdex_50',   snapshot.manualFishdexPercent   >= 50);
  check('manual_fishdex_75',   snapshot.manualFishdexPercent   >= 75);
  check('manual_fishdex_100',  snapshot.manualFishdexPercent   >= 100);

  // Mastery
  check('mastery_25',  snapshot.masteryPercent >= 25);
  check('mastery_50',  snapshot.masteryPercent >= 50);
  check('mastery_75',  snapshot.masteryPercent >= 75);
  check('mastery_100', snapshot.masteryPercent >= 100);

  // Competitions — fires once player completes their first series or wins any comp
  check('first_competition',         snapshot.competitionSeriesCompleted >= 1 || snapshot.competitionWins >= 1);
  check('first_competition_win',     snapshot.firstPlaceFinishes >= 1);
  check('first_grand_competition_title', snapshot.grandCompetitionTitles >= 1);
  check('grand_titles_5',            snapshot.grandCompetitionTitles >= 5);
  check('grand_titles_10',           snapshot.grandCompetitionTitles >= 10);

  // Targeted lure
  check('targeted_lure_unlocked',    snapshot.targetedLureLevel >= 1);
  check('targeted_lure_max_level',   snapshot.targetedLureLevel >= 10);

  // Black Pearls
  check('first_black_pearl',         snapshot.lifetimeBlackPearlsEarned >= 1);
  check('black_pearls_10',           snapshot.lifetimeBlackPearlsEarned >= 10);
  check('black_pearls_50',           snapshot.lifetimeBlackPearlsEarned >= 50);
  check('black_pearls_100',          snapshot.lifetimeBlackPearlsEarned >= 100);
  check('black_pearls_500',          snapshot.lifetimeBlackPearlsEarned >= 500);

  // Achievements
  check('first_achievement',         snapshot.achievementsCompleted >= 1);
  check('achievements_25_percent',   snapshot.achievementsTotal > 0 && (snapshot.achievementsCompleted/snapshot.achievementsTotal) >= 0.25);
  check('achievements_50_percent',   snapshot.achievementsTotal > 0 && (snapshot.achievementsCompleted/snapshot.achievementsTotal) >= 0.5);
  check('achievements_75_percent',   snapshot.achievementsTotal > 0 && (snapshot.achievementsCompleted/snapshot.achievementsTotal) >= 0.75);
  check('achievements_100_percent',  snapshot.achievementsCompleted >= snapshot.achievementsTotal && snapshot.achievementsTotal > 0);

  // Rod tiers
  check('first_rod_tier_5',  snapshot.highestRodTier >= 5);
  check('first_rod_tier_10', snapshot.highestRodTier >= 10);
  check('first_rod_tier_15', snapshot.highestRodTier >= 15);

  // Guild Orders
  check('first_guild_order_completed',  snapshot.guildOrdersCompleted  >= 1);
  check('guild_orders_10',              snapshot.guildOrdersCompleted  >= 10);
  check('first_golden_contract',        snapshot.guildGoldenCompleted  >= 1);

  // Fish records
  check('first_trophy_fish', snapshot.trophyFishCaught >= 1);

  // Tutorial
  check('tutorial_started',       (typeof G !== 'undefined') && (G.tutStep  || 0) > 0);
  check('tutorial_completed',     (typeof G !== 'undefined') && !!G.tutorialDone);
  check('first_net_purchased',    (typeof G !== 'undefined') && (G.ownedAutomation || []).length >= 1);

  if (newMs.length > 0) _anlSaveSentMilestones(sent);
  return newMs;
}

// ─── Send to Server ───────────────────────────────────────────────────────────
let _anlSending    = false;
let _anlLastSentAt = 0;
const ANL_MIN_INTERVAL_MS = 30_000;

// Persist current session time to localStorage on app hide/close,
// so playtime accumulates even if no server send fires this session.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    try {
      const stored = JSON.parse(localStorage.getItem(_ANL_STORAGE_KEY) || '{}');
      const sessionMs = Date.now() - _anlSessionStart;
      if (sessionMs > 0) {
        localStorage.setItem(_ANL_STORAGE_KEY, JSON.stringify({
          ...stored,
          totalPlayMs: (stored.totalPlayMs || 0) + sessionMs,
        }));
        _anlSessionStart = Date.now(); // reset so we never double-count this slice
      }
    } catch {}
  }
});

function _anlGetDeviceId() {
  const KEY = 'pa_anl_device_id';
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch { return null; }
}

async function sendAnalyticsSnapshot(trigger, force = false) {
  if (_anlSending) return;
  const now = Date.now();
  if (!force && now - _anlLastSentAt < ANL_MIN_INTERVAL_MS) return;

  const snapshot = buildAnalyticsSnapshot();
  if (!snapshot) return;

  const milestones = _anlBuildMilestones(snapshot);

  _anlSending    = true;
  _anlLastSentAt = now;

  try {
    const PA_SERVER_URL = typeof PA_SERVER !== 'undefined' ? PA_SERVER : 'https://tile-royale-eu-production.up.railway.app';

    let authHeader = null;
    let anonUid    = null;
    const signedIn = typeof _currentUser !== 'undefined' && _currentUser?.uid;

    if (signedIn) {
      try {
        const fa = window.Capacitor?.Plugins?.FirebaseAuthentication;
        if (fa) {
          const tokenResult = await fa.getIdToken({ forceRefresh: false });
          if (tokenResult?.token) authHeader = 'Bearer ' + tokenResult.token;
        }
      } catch {}
    }
    if (!authHeader) {
      anonUid = _anlGetDeviceId();
      if (!anonUid) { _anlSending = false; return; }
    }

    const headers = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;

    await fetch(PA_SERVER_URL + '/pa/analytics/progress', {
      method: 'POST',
      headers,
      body: JSON.stringify({ payload: snapshot, milestones, anonUid }),
    });

    _anlLastSnapshot = snapshot;
    _anlPersistSession(snapshot);
  } catch (_err) {
    // Silently fail — analytics should never affect gameplay
  } finally {
    _anlSending = false;
  }
}

function _anlPersistSession(snapshot) {
  try {
    const stored = JSON.parse(localStorage.getItem(_ANL_STORAGE_KEY) || '{}');
    const sessionMs = Date.now() - _anlSessionStart;
    localStorage.setItem(_ANL_STORAGE_KEY, JSON.stringify({
      ...stored,
      firstSeen: stored.firstSeen || Date.now(),
      firstInstallVersion: stored.firstInstallVersion || snapshot.appVersion,
      previousVersion: stored.appVersion !== snapshot.appVersion ? stored.appVersion : stored.previousVersion,
      appVersion: snapshot.appVersion,
      totalPlayMs: (stored.totalPlayMs || 0) + sessionMs,
      sessionCount: (stored.sessionCount || 0) + _anlSessionCount,
      lastSentAt: Date.now(),
    }));
    _anlSessionStart = Date.now();
    _anlSessionCount = 0;
  } catch {}
}

// ─── Checkpoint — Central Upload Trigger ─────────────────────────────────────
// Sends analytics only when meaningful state has changed, or when forced.
async function anlCheckpoint(reason, force = false) {
  const snap = buildAnalyticsSnapshot();
  if (!snap) return;
  if (!force && !_anlHasMeaningfulChange(snap)) return;
  await sendAnalyticsSnapshot(reason, force);
}

// ─── Daily Backup ─────────────────────────────────────────────────────────────
// At most once per calendar day — ensures server always has a fresh snapshot.
function _anlDailyCheck() {
  try {
    const today = new Date().toDateString();
    if (localStorage.getItem(_ANL_DAILY_KEY) === today) return;
    localStorage.setItem(_ANL_DAILY_KEY, today);
    setTimeout(() => anlCheckpoint('daily', true), 35_000);
  } catch {}
}

// ─── Zone Unlock Hook ─────────────────────────────────────────────────────────
// Called from game.js when a transport is purchased (zone first unlocked).
function anlOnZoneUnlocked(zoneId) {
  setTimeout(() => anlCheckpoint('zone_unlock_' + (zoneId || 'unknown'), true), 2000);
}

// ─── Zone Change Hook (zone switch, lower priority) ───────────────────────────
function onAnalyticsZoneChange(newZone) {
  if (newZone !== _anlLastZone) {
    _anlLastZone = newZone;
    setTimeout(() => anlCheckpoint('zone_change'), 3000);
  }
}

// ─── Prestige Hook ────────────────────────────────────────────────────────────
function onAnalyticsPrestige() {
  setTimeout(() => anlCheckpoint('prestige', true), 1500);
}

// ─── Series Complete Hook ─────────────────────────────────────────────────────
// Called from game.js after the 10th competition in a series finishes.
function anlOnSeriesCompleted() {
  setTimeout(() => anlCheckpoint('series_complete', true), 2000);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
function initAnalytics() {
  _anlSessionCount++;
  _anlSessionStart = Date.now();
  _anlLastZone = typeof G !== 'undefined' ? G.currentZone : 'pond';
  _anlDailyCheck();
  // Initial snapshot after game state settles (8s to avoid auth/load race)
  setTimeout(() => sendAnalyticsSnapshot('init'), 8000);
}
