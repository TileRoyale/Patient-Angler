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

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 4 — ABYSS DATA FRAMEWORK
// Single source of truth for all World 2 (Abyss) content.
// All data derived from Patient_Angler_Abyss_Design_Workbook(7).xlsx.
// ═══════════════════════════════════════════════════════════════════════════════

const ABYSS_ZONES = [
  {
    id: 'emerald_forest', name: 'Emerald Forest', order: 1,
    theme: 'Emerald', themeColor: '#10b981',
    atmosphere: 'Lush crystal forest', landmark: 'Crystal trees',
    expectedCatchsPerSecond: 10000,
    fish:    ['emerald_glowfin','crystal_minnow','moss_koi','jade_pike','leaf_ray','forest_eel','verdant_carp','root_catfish','emerald_disc','canopy_guppy'],
    crystals:['emerald_shard','living_emerald','moss_crystal','root_crystal','forest_core','leaf_prism','green_cluster','glow_emerald','ancient_emerald','wild_emerald'],
    insects: ['crystal_beetle','glow_moth','leaf_cricket','emerald_spider','root_ant','moss_firefly','fern_hopper','crystal_bee','green_scarab','forest_wasp'],
    mythicFish: 'ancient_emerald_leviathan', tribe: 'emerald_wardens', bobberReward: 'emerald_root_bobber',
    previousZone: null, nextZone: 'amber_reef',
    unlockRequirement: 'Complete Maelstrom stabilization', bg: null,
  },
  {
    id: 'amber_reef', name: 'Amber Reef', order: 2,
    theme: 'Amber', themeColor: '#f59e0b',
    atmosphere: 'Warm coral reef', landmark: 'Golden coral cathedral',
    expectedCatchsPerSecond: 20000,
    fish:    ['forest_eel','verdant_carp','root_catfish','emerald_disc','canopy_guppy','amber_snapper','honey_wrasse','golden_butterflyfish','reef_grouper','sunscale_bass'],
    crystals:['leaf_prism','green_cluster','glow_emerald','ancient_emerald','wild_emerald','amber_shard','sun_amber','honey_crystal','golden_resin','warm_prism'],
    insects: ['moss_firefly','fern_hopper','crystal_bee','green_scarab','forest_wasp','amber_beetle','honey_bee','golden_mantis','reef_cricket','sun_hopper'],
    mythicFish: 'amber_reef_colossus', tribe: 'amber_reefkin', bobberReward: 'amber_coral_bobber',
    previousZone: 'emerald_forest', nextZone: 'amethyst_caverns',
    unlockRequirement: 'Complete Zone 1 Initial Request, equip its Tribe Bobber, and catch its Mythic fish', bg: null,
  },
  {
    id: 'amethyst_caverns', name: 'Amethyst Caverns', order: 3,
    theme: 'Amethyst', themeColor: '#8b34c8',
    atmosphere: 'Glowing crystal caves', landmark: 'Giant crystal pillars',
    expectedCatchsPerSecond: 30000,
    fish:    ['amber_snapper','honey_wrasse','golden_butterflyfish','reef_grouper','sunscale_bass','amethyst_angelfish','violet_stingray','crystal_loach','purple_lanternfish','gem_betta'],
    crystals:['amber_shard','sun_amber','honey_crystal','golden_resin','warm_prism','amethyst_shard','dream_quartz','violet_prism','crystal_bloom','echo_gem'],
    insects: ['amber_beetle','honey_bee','golden_mantis','reef_cricket','sun_hopper','amethyst_moth','violet_scarab','gem_spider','purple_wasp','echo_cricket'],
    mythicFish: 'amethyst_dream_serpent', tribe: 'amethyst_seers', bobberReward: 'amethyst_eye_bobber',
    previousZone: 'amber_reef', nextZone: 'ruby_chasm',
    unlockRequirement: 'Complete Zone 2 Initial Request, equip its Tribe Bobber, and catch its Mythic fish', bg: null,
  },
  {
    id: 'ruby_chasm', name: 'Ruby Chasm', order: 4,
    theme: 'Ruby', themeColor: '#dc2626',
    atmosphere: 'Deep fractured canyon', landmark: 'Ruby canyon',
    expectedCatchsPerSecond: 40000,
    fish:    ['amethyst_angelfish','violet_stingray','crystal_loach','purple_lanternfish','gem_betta','ruby_barracuda','scarlet_shark','crimson_moray','red_emperor','bloodfin_tuna'],
    crystals:['amethyst_shard','dream_quartz','violet_prism','crystal_bloom','echo_gem','ruby_shard','crimson_core','blood_prism','fire_ruby','scarlet_gem'],
    insects: ['amethyst_moth','violet_scarab','gem_spider','purple_wasp','echo_cricket','ruby_hornet','scarlet_beetle','fire_ant','red_mantis','crimson_moth'],
    mythicFish: 'crimson_chasm_tyrant', tribe: 'ruby_forged', bobberReward: 'ruby_fang_bobber',
    previousZone: 'amethyst_caverns', nextZone: 'aquamarine_lagoon',
    unlockRequirement: 'Complete Zone 3 Initial Request, equip its Tribe Bobber, and catch its Mythic fish', bg: null,
  },
  {
    id: 'aquamarine_lagoon', name: 'Aquamarine Lagoon', order: 5,
    theme: 'Aquamarine', themeColor: '#06b6d4',
    atmosphere: 'Bright tropical abyss', landmark: 'Mirror-clear lagoon',
    expectedCatchsPerSecond: 50000,
    fish:    ['ruby_barracuda','scarlet_shark','crimson_moray','red_emperor','bloodfin_tuna','aquamarine_sailfish','lagoon_gar','azure_seahorse','glass_marlin','wave_surgeon'],
    crystals:['ruby_shard','crimson_core','blood_prism','fire_ruby','scarlet_gem','aquamarine_shard','tide_crystal','ocean_prism','wave_core','sea_glass_gem'],
    insects: ['ruby_hornet','scarlet_beetle','fire_ant','red_mantis','crimson_moth','lagoon_dragonfly','azure_beetle','wave_cricket','sea_hopper','blue_wasp'],
    mythicFish: 'lagoon_skywhale', tribe: 'aquamarine_tidefolk', bobberReward: 'aquamarine_pearl_bobber',
    previousZone: 'ruby_chasm', nextZone: 'opal_gardens',
    unlockRequirement: 'Complete Zone 4 Initial Request, equip its Tribe Bobber, and catch its Mythic fish', bg: null,
  },
  {
    id: 'opal_gardens', name: 'Opal Gardens', order: 6,
    theme: 'Opal', themeColor: '#c7d2fe',
    atmosphere: 'Shimmering crystal gardens', landmark: 'Color-shifting gardens',
    expectedCatchsPerSecond: 60000,
    fish:    ['aquamarine_sailfish','lagoon_gar','azure_seahorse','glass_marlin','wave_surgeon','opal_butterfly_fish','moon_carp','pearl_eel','iridescent_koi','halo_ray'],
    crystals:['aquamarine_shard','tide_crystal','ocean_prism','wave_core','sea_glass_gem','opal_shard','moon_opal','rainbow_core','mist_prism','white_bloom'],
    insects: ['lagoon_dragonfly','azure_beetle','wave_cricket','sea_hopper','blue_wasp','opal_butterfly_insect','moon_moth','white_scarab','rainbow_beetle','mist_bee'],
    mythicFish: 'iridescent_garden_ray', tribe: 'opal_gardeners', bobberReward: 'opal_bloom_bobber',
    previousZone: 'aquamarine_lagoon', nextZone: 'obsidian_abyss',
    unlockRequirement: 'Complete Zone 5 Initial Request, equip its Tribe Bobber, and catch its Mythic fish', bg: null,
  },
  {
    id: 'obsidian_abyss', name: 'Obsidian Abyss', order: 7,
    theme: 'Obsidian', themeColor: '#374151',
    atmosphere: 'Dark volcanic depths', landmark: 'Volcanic obsidian towers',
    expectedCatchsPerSecond: 70000,
    fish:    ['opal_butterfly_fish','moon_carp','pearl_eel','iridescent_koi','halo_ray','obsidian_sturgeon','shadow_pike','void_catfish','ash_moray','basalt_shark'],
    crystals:['opal_shard','moon_opal','rainbow_core','mist_prism','white_bloom','obsidian_spike','void_glass','black_prism','lava_core','night_shard'],
    insects: ['opal_butterfly_insect','moon_moth','white_scarab','rainbow_beetle','mist_bee','obsidian_beetle','shadow_spider','ash_wasp','void_mantis','dark_firefly'],
    mythicFish: 'voidjaw', tribe: 'obsidian_keepers', bobberReward: 'obsidian_spike_bobber',
    previousZone: 'opal_gardens', nextZone: 'topaz_rift',
    unlockRequirement: 'Complete Zone 6 Initial Request, equip its Tribe Bobber, and catch its Mythic fish', bg: null,
  },
  {
    id: 'topaz_rift', name: 'Topaz Rift', order: 8,
    theme: 'Topaz', themeColor: '#f97316',
    atmosphere: 'Golden mineral rift', landmark: 'Topaz fault line',
    expectedCatchsPerSecond: 80000,
    fish:    ['obsidian_sturgeon','shadow_pike','void_catfish','ash_moray','basalt_shark','topaz_triggerfish','goldscale_perch','citrine_eel','fault_snapper','auric_carp'],
    crystals:['obsidian_spike','void_glass','black_prism','lava_core','night_shard','topaz_cluster','golden_prism','sun_core','bright_topaz','fault_crystal'],
    insects: ['obsidian_beetle','shadow_spider','ash_wasp','void_mantis','dark_firefly','topaz_butterfly','gold_scarab','sun_beetle','fault_wasp','bright_hopper'],
    mythicFish: 'golden_fault_eel', tribe: 'topaz_riftborn', bobberReward: 'topaz_rift_bobber',
    previousZone: 'obsidian_abyss', nextZone: 'sapphire_trench',
    unlockRequirement: 'Complete Zone 7 Initial Request, equip its Tribe Bobber, and catch its Mythic fish', bg: null,
  },
  {
    id: 'sapphire_trench', name: 'Sapphire Trench', order: 9,
    theme: 'Sapphire', themeColor: '#1e3a8a',
    atmosphere: 'Cold deep-ocean trench', landmark: 'Bottomless trench',
    expectedCatchsPerSecond: 90000,
    fish:    ['topaz_triggerfish','goldscale_perch','citrine_eel','fault_snapper','auric_carp','sapphire_dragonfish','deep_blue_cod','royal_ray','frost_eel','trench_leviathan'],
    crystals:['topaz_cluster','golden_prism','sun_core','bright_topaz','fault_crystal','sapphire_core','blue_prism','frozen_sapphire','royal_crystal','deep_gem'],
    insects: ['topaz_butterfly','gold_scarab','sun_beetle','fault_wasp','bright_hopper','sapphire_dragonfly','royal_scarab','ice_moth','trench_spider','deep_wasp'],
    mythicFish: 'sapphire_trench_warden', tribe: 'sapphire_deepwatch', bobberReward: 'sapphire_trench_bobber',
    previousZone: 'topaz_rift', nextZone: 'blue_diamond_sanctuary',
    unlockRequirement: 'Complete Zone 8 Initial Request, equip its Tribe Bobber, and catch its Mythic fish', bg: null,
  },
  {
    id: 'blue_diamond_sanctuary', name: 'Blue Diamond Sanctuary', order: 10,
    theme: 'Blue Diamond', themeColor: '#3b82f6',
    atmosphere: 'Ancient sacred sanctuary', landmark: 'Ancient blue diamond sanctuary',
    expectedCatchsPerSecond: 100000,
    fish:    ['sapphire_dragonfish','deep_blue_cod','royal_ray','frost_eel','trench_leviathan','diamond_whale','blue_prism_shark','sanctuary_koi','celestial_eel','heart_guardian'],
    crystals:['sapphire_core','blue_prism','frozen_sapphire','royal_crystal','deep_gem','blue_diamond_fragment','blue_diamond_cluster','perfect_diamond','sanctuary_core','abyss_heart'],
    insects: ['sapphire_dragonfly','royal_scarab','ice_moth','trench_spider','deep_wasp','diamond_beetle','prism_butterfly','sanctuary_bee','blue_scarab','heart_firefly'],
    mythicFish: 'heart_of_the_abyss', tribe: 'blue_diamond_ancients', bobberReward: 'blue_diamond_bobber',
    previousZone: 'sapphire_trench', nextZone: null,
    unlockRequirement: 'Complete Zone 9 Initial Request, equip its Tribe Bobber, and catch its Mythic fish', bg: null,
  },
];

// ─── ABYSS FISH DATABASE ─────────────────────────────────────────────────────
// 55 unique fish. Inherited fish appear in multiple zones but have one DB entry.

const ABYSS_FISH_DB = [
  // Zone 1 native (10 fish)
  { id: 'emerald_glowfin',      name: 'Emerald Glowfin',      nativeZone: 'emerald_forest',         img: null },
  { id: 'crystal_minnow',       name: 'Crystal Minnow',       nativeZone: 'emerald_forest',         img: null },
  { id: 'moss_koi',             name: 'Moss Koi',             nativeZone: 'emerald_forest',         img: null },
  { id: 'jade_pike',            name: 'Jade Pike',            nativeZone: 'emerald_forest',         img: null },
  { id: 'leaf_ray',             name: 'Leaf Ray',             nativeZone: 'emerald_forest',         img: null },
  { id: 'forest_eel',           name: 'Forest Eel',           nativeZone: 'emerald_forest',         img: null },
  { id: 'verdant_carp',         name: 'Verdant Carp',         nativeZone: 'emerald_forest',         img: null },
  { id: 'root_catfish',         name: 'Root Catfish',         nativeZone: 'emerald_forest',         img: null },
  { id: 'emerald_disc',         name: 'Emerald Disc',         nativeZone: 'emerald_forest',         img: null },
  { id: 'canopy_guppy',         name: 'Canopy Guppy',         nativeZone: 'emerald_forest',         img: null },
  // Zone 2 new (+5)
  { id: 'amber_snapper',        name: 'Amber Snapper',        nativeZone: 'amber_reef',             img: null },
  { id: 'honey_wrasse',         name: 'Honey Wrasse',         nativeZone: 'amber_reef',             img: null },
  { id: 'golden_butterflyfish', name: 'Golden Butterflyfish', nativeZone: 'amber_reef',             img: null },
  { id: 'reef_grouper',         name: 'Reef Grouper',         nativeZone: 'amber_reef',             img: null },
  { id: 'sunscale_bass',        name: 'Sunscale Bass',        nativeZone: 'amber_reef',             img: null },
  // Zone 3 new (+5)
  { id: 'amethyst_angelfish',   name: 'Amethyst Angelfish',   nativeZone: 'amethyst_caverns',       img: null },
  { id: 'violet_stingray',      name: 'Violet Stingray',      nativeZone: 'amethyst_caverns',       img: null },
  { id: 'crystal_loach',        name: 'Crystal Loach',        nativeZone: 'amethyst_caverns',       img: null },
  { id: 'purple_lanternfish',   name: 'Purple Lanternfish',   nativeZone: 'amethyst_caverns',       img: null },
  { id: 'gem_betta',            name: 'Gem Betta',            nativeZone: 'amethyst_caverns',       img: null },
  // Zone 4 new (+5)
  { id: 'ruby_barracuda',       name: 'Ruby Barracuda',       nativeZone: 'ruby_chasm',             img: null },
  { id: 'scarlet_shark',        name: 'Scarlet Shark',        nativeZone: 'ruby_chasm',             img: null },
  { id: 'crimson_moray',        name: 'Crimson Moray',        nativeZone: 'ruby_chasm',             img: null },
  { id: 'red_emperor',          name: 'Red Emperor',          nativeZone: 'ruby_chasm',             img: null },
  { id: 'bloodfin_tuna',        name: 'Bloodfin Tuna',        nativeZone: 'ruby_chasm',             img: null },
  // Zone 5 new (+5)
  { id: 'aquamarine_sailfish',  name: 'Aquamarine Sailfish',  nativeZone: 'aquamarine_lagoon',      img: null },
  { id: 'lagoon_gar',           name: 'Lagoon Gar',           nativeZone: 'aquamarine_lagoon',      img: null },
  { id: 'azure_seahorse',       name: 'Azure Seahorse',       nativeZone: 'aquamarine_lagoon',      img: null },
  { id: 'glass_marlin',         name: 'Glass Marlin',         nativeZone: 'aquamarine_lagoon',      img: null },
  { id: 'wave_surgeon',         name: 'Wave Surgeon',         nativeZone: 'aquamarine_lagoon',      img: null },
  // Zone 6 new (+5) — opal_butterfly_fish shares display name with opal_butterfly_insect
  { id: 'opal_butterfly_fish',  name: 'Opal Butterfly',       nativeZone: 'opal_gardens',           img: null },
  { id: 'moon_carp',            name: 'Moon Carp',            nativeZone: 'opal_gardens',           img: null },
  { id: 'pearl_eel',            name: 'Pearl Eel',            nativeZone: 'opal_gardens',           img: null },
  { id: 'iridescent_koi',       name: 'Iridescent Koi',       nativeZone: 'opal_gardens',           img: null },
  { id: 'halo_ray',             name: 'Halo Ray',             nativeZone: 'opal_gardens',           img: null },
  // Zone 7 new (+5)
  { id: 'obsidian_sturgeon',    name: 'Obsidian Sturgeon',    nativeZone: 'obsidian_abyss',         img: null },
  { id: 'shadow_pike',          name: 'Shadow Pike',          nativeZone: 'obsidian_abyss',         img: null },
  { id: 'void_catfish',         name: 'Void Catfish',         nativeZone: 'obsidian_abyss',         img: null },
  { id: 'ash_moray',            name: 'Ash Moray',            nativeZone: 'obsidian_abyss',         img: null },
  { id: 'basalt_shark',         name: 'Basalt Shark',         nativeZone: 'obsidian_abyss',         img: null },
  // Zone 8 new (+5)
  { id: 'topaz_triggerfish',    name: 'Topaz Triggerfish',    nativeZone: 'topaz_rift',             img: null },
  { id: 'goldscale_perch',      name: 'Goldscale Perch',      nativeZone: 'topaz_rift',             img: null },
  { id: 'citrine_eel',          name: 'Citrine Eel',          nativeZone: 'topaz_rift',             img: null },
  { id: 'fault_snapper',        name: 'Fault Snapper',        nativeZone: 'topaz_rift',             img: null },
  { id: 'auric_carp',           name: 'Auric Carp',           nativeZone: 'topaz_rift',             img: null },
  // Zone 9 new (+5)
  { id: 'sapphire_dragonfish',  name: 'Sapphire Dragonfish',  nativeZone: 'sapphire_trench',        img: null },
  { id: 'deep_blue_cod',        name: 'Deep Blue Cod',        nativeZone: 'sapphire_trench',        img: null },
  { id: 'royal_ray',            name: 'Royal Ray',            nativeZone: 'sapphire_trench',        img: null },
  { id: 'frost_eel',            name: 'Frost Eel',            nativeZone: 'sapphire_trench',        img: null },
  { id: 'trench_leviathan',     name: 'Trench Leviathan',     nativeZone: 'sapphire_trench',        img: null },
  // Zone 10 new (+5, zone-exclusive)
  { id: 'diamond_whale',        name: 'Diamond Whale',        nativeZone: 'blue_diamond_sanctuary', img: null },
  { id: 'blue_prism_shark',     name: 'Blue Prism Shark',     nativeZone: 'blue_diamond_sanctuary', img: null },
  { id: 'sanctuary_koi',        name: 'Sanctuary Koi',        nativeZone: 'blue_diamond_sanctuary', img: null },
  { id: 'celestial_eel',        name: 'Celestial Eel',        nativeZone: 'blue_diamond_sanctuary', img: null },
  { id: 'heart_guardian',       name: 'Heart Guardian',       nativeZone: 'blue_diamond_sanctuary', img: null },
];

// ─── ABYSS CRYSTAL DATABASE ──────────────────────────────────────────────────
// 55 unique crystals. Same inheritance pattern as fish.

const ABYSS_CRYSTAL_DB = [
  { id: 'emerald_shard',         name: 'Emerald Shard',         nativeZone: 'emerald_forest',         img: null },
  { id: 'living_emerald',        name: 'Living Emerald',        nativeZone: 'emerald_forest',         img: null },
  { id: 'moss_crystal',          name: 'Moss Crystal',          nativeZone: 'emerald_forest',         img: null },
  { id: 'root_crystal',          name: 'Root Crystal',          nativeZone: 'emerald_forest',         img: null },
  { id: 'forest_core',           name: 'Forest Core',           nativeZone: 'emerald_forest',         img: null },
  { id: 'leaf_prism',            name: 'Leaf Prism',            nativeZone: 'emerald_forest',         img: null },
  { id: 'green_cluster',         name: 'Green Cluster',         nativeZone: 'emerald_forest',         img: null },
  { id: 'glow_emerald',          name: 'Glow Emerald',          nativeZone: 'emerald_forest',         img: null },
  { id: 'ancient_emerald',       name: 'Ancient Emerald',       nativeZone: 'emerald_forest',         img: null },
  { id: 'wild_emerald',          name: 'Wild Emerald',          nativeZone: 'emerald_forest',         img: null },
  { id: 'amber_shard',           name: 'Amber Shard',           nativeZone: 'amber_reef',             img: null },
  { id: 'sun_amber',             name: 'Sun Amber',             nativeZone: 'amber_reef',             img: null },
  { id: 'honey_crystal',         name: 'Honey Crystal',         nativeZone: 'amber_reef',             img: null },
  { id: 'golden_resin',          name: 'Golden Resin',          nativeZone: 'amber_reef',             img: null },
  { id: 'warm_prism',            name: 'Warm Prism',            nativeZone: 'amber_reef',             img: null },
  { id: 'amethyst_shard',        name: 'Amethyst Shard',        nativeZone: 'amethyst_caverns',       img: null },
  { id: 'dream_quartz',          name: 'Dream Quartz',          nativeZone: 'amethyst_caverns',       img: null },
  { id: 'violet_prism',          name: 'Violet Prism',          nativeZone: 'amethyst_caverns',       img: null },
  { id: 'crystal_bloom',         name: 'Crystal Bloom',         nativeZone: 'amethyst_caverns',       img: null },
  { id: 'echo_gem',              name: 'Echo Gem',              nativeZone: 'amethyst_caverns',       img: null },
  { id: 'ruby_shard',            name: 'Ruby Shard',            nativeZone: 'ruby_chasm',             img: null },
  { id: 'crimson_core',          name: 'Crimson Core',          nativeZone: 'ruby_chasm',             img: null },
  { id: 'blood_prism',           name: 'Blood Prism',           nativeZone: 'ruby_chasm',             img: null },
  { id: 'fire_ruby',             name: 'Fire Ruby',             nativeZone: 'ruby_chasm',             img: null },
  { id: 'scarlet_gem',           name: 'Scarlet Gem',           nativeZone: 'ruby_chasm',             img: null },
  { id: 'aquamarine_shard',      name: 'Aquamarine Shard',      nativeZone: 'aquamarine_lagoon',      img: null },
  { id: 'tide_crystal',          name: 'Tide Crystal',          nativeZone: 'aquamarine_lagoon',      img: null },
  { id: 'ocean_prism',           name: 'Ocean Prism',           nativeZone: 'aquamarine_lagoon',      img: null },
  { id: 'wave_core',             name: 'Wave Core',             nativeZone: 'aquamarine_lagoon',      img: null },
  { id: 'sea_glass_gem',         name: 'Sea Glass Gem',         nativeZone: 'aquamarine_lagoon',      img: null },
  { id: 'opal_shard',            name: 'Opal Shard',            nativeZone: 'opal_gardens',           img: null },
  { id: 'moon_opal',             name: 'Moon Opal',             nativeZone: 'opal_gardens',           img: null },
  { id: 'rainbow_core',          name: 'Rainbow Core',          nativeZone: 'opal_gardens',           img: null },
  { id: 'mist_prism',            name: 'Mist Prism',            nativeZone: 'opal_gardens',           img: null },
  { id: 'white_bloom',           name: 'White Bloom',           nativeZone: 'opal_gardens',           img: null },
  { id: 'obsidian_spike',        name: 'Obsidian Spike',        nativeZone: 'obsidian_abyss',         img: null },
  { id: 'void_glass',            name: 'Void Glass',            nativeZone: 'obsidian_abyss',         img: null },
  { id: 'black_prism',           name: 'Black Prism',           nativeZone: 'obsidian_abyss',         img: null },
  { id: 'lava_core',             name: 'Lava Core',             nativeZone: 'obsidian_abyss',         img: null },
  { id: 'night_shard',           name: 'Night Shard',           nativeZone: 'obsidian_abyss',         img: null },
  { id: 'topaz_cluster',         name: 'Topaz Cluster',         nativeZone: 'topaz_rift',             img: null },
  { id: 'golden_prism',          name: 'Golden Prism',          nativeZone: 'topaz_rift',             img: null },
  { id: 'sun_core',              name: 'Sun Core',              nativeZone: 'topaz_rift',             img: null },
  { id: 'bright_topaz',          name: 'Bright Topaz',          nativeZone: 'topaz_rift',             img: null },
  { id: 'fault_crystal',         name: 'Fault Crystal',         nativeZone: 'topaz_rift',             img: null },
  { id: 'sapphire_core',         name: 'Sapphire Core',         nativeZone: 'sapphire_trench',        img: null },
  { id: 'blue_prism',            name: 'Blue Prism',            nativeZone: 'sapphire_trench',        img: null },
  { id: 'frozen_sapphire',       name: 'Frozen Sapphire',       nativeZone: 'sapphire_trench',        img: null },
  { id: 'royal_crystal',         name: 'Royal Crystal',         nativeZone: 'sapphire_trench',        img: null },
  { id: 'deep_gem',              name: 'Deep Gem',              nativeZone: 'sapphire_trench',        img: null },
  { id: 'blue_diamond_fragment', name: 'Blue Diamond Fragment', nativeZone: 'blue_diamond_sanctuary', img: null },
  { id: 'blue_diamond_cluster',  name: 'Blue Diamond Cluster',  nativeZone: 'blue_diamond_sanctuary', img: null },
  { id: 'perfect_diamond',       name: 'Perfect Diamond',       nativeZone: 'blue_diamond_sanctuary', img: null },
  { id: 'sanctuary_core',        name: 'Sanctuary Core',        nativeZone: 'blue_diamond_sanctuary', img: null },
  { id: 'abyss_heart',           name: 'Abyss Heart',           nativeZone: 'blue_diamond_sanctuary', img: null },
];

// ─── ABYSS INSECT DATABASE ───────────────────────────────────────────────────
// 55 unique insects. opal_butterfly_insect disambiguates from opal_butterfly_fish.

const ABYSS_INSECT_DB = [
  { id: 'crystal_beetle',        name: 'Crystal Beetle',     nativeZone: 'emerald_forest',         img: null },
  { id: 'glow_moth',             name: 'Glow Moth',          nativeZone: 'emerald_forest',         img: null },
  { id: 'leaf_cricket',          name: 'Leaf Cricket',       nativeZone: 'emerald_forest',         img: null },
  { id: 'emerald_spider',        name: 'Emerald Spider',     nativeZone: 'emerald_forest',         img: null },
  { id: 'root_ant',              name: 'Root Ant',           nativeZone: 'emerald_forest',         img: null },
  { id: 'moss_firefly',          name: 'Moss Firefly',       nativeZone: 'emerald_forest',         img: null },
  { id: 'fern_hopper',           name: 'Fern Hopper',        nativeZone: 'emerald_forest',         img: null },
  { id: 'crystal_bee',           name: 'Crystal Bee',        nativeZone: 'emerald_forest',         img: null },
  { id: 'green_scarab',          name: 'Green Scarab',       nativeZone: 'emerald_forest',         img: null },
  { id: 'forest_wasp',           name: 'Forest Wasp',        nativeZone: 'emerald_forest',         img: null },
  { id: 'amber_beetle',          name: 'Amber Beetle',       nativeZone: 'amber_reef',             img: null },
  { id: 'honey_bee',             name: 'Honey Bee',          nativeZone: 'amber_reef',             img: null },
  { id: 'golden_mantis',         name: 'Golden Mantis',      nativeZone: 'amber_reef',             img: null },
  { id: 'reef_cricket',          name: 'Reef Cricket',       nativeZone: 'amber_reef',             img: null },
  { id: 'sun_hopper',            name: 'Sun Hopper',         nativeZone: 'amber_reef',             img: null },
  { id: 'amethyst_moth',         name: 'Amethyst Moth',      nativeZone: 'amethyst_caverns',       img: null },
  { id: 'violet_scarab',         name: 'Violet Scarab',      nativeZone: 'amethyst_caverns',       img: null },
  { id: 'gem_spider',            name: 'Gem Spider',         nativeZone: 'amethyst_caverns',       img: null },
  { id: 'purple_wasp',           name: 'Purple Wasp',        nativeZone: 'amethyst_caverns',       img: null },
  { id: 'echo_cricket',          name: 'Echo Cricket',       nativeZone: 'amethyst_caverns',       img: null },
  { id: 'ruby_hornet',           name: 'Ruby Hornet',        nativeZone: 'ruby_chasm',             img: null },
  { id: 'scarlet_beetle',        name: 'Scarlet Beetle',     nativeZone: 'ruby_chasm',             img: null },
  { id: 'fire_ant',              name: 'Fire Ant',           nativeZone: 'ruby_chasm',             img: null },
  { id: 'red_mantis',            name: 'Red Mantis',         nativeZone: 'ruby_chasm',             img: null },
  { id: 'crimson_moth',          name: 'Crimson Moth',       nativeZone: 'ruby_chasm',             img: null },
  { id: 'lagoon_dragonfly',      name: 'Lagoon Dragonfly',   nativeZone: 'aquamarine_lagoon',      img: null },
  { id: 'azure_beetle',          name: 'Azure Beetle',       nativeZone: 'aquamarine_lagoon',      img: null },
  { id: 'wave_cricket',          name: 'Wave Cricket',       nativeZone: 'aquamarine_lagoon',      img: null },
  { id: 'sea_hopper',            name: 'Sea Hopper',         nativeZone: 'aquamarine_lagoon',      img: null },
  { id: 'blue_wasp',             name: 'Blue Wasp',          nativeZone: 'aquamarine_lagoon',      img: null },
  { id: 'opal_butterfly_insect', name: 'Opal Butterfly',     nativeZone: 'opal_gardens',           img: null },
  { id: 'moon_moth',             name: 'Moon Moth',          nativeZone: 'opal_gardens',           img: null },
  { id: 'white_scarab',          name: 'White Scarab',       nativeZone: 'opal_gardens',           img: null },
  { id: 'rainbow_beetle',        name: 'Rainbow Beetle',     nativeZone: 'opal_gardens',           img: null },
  { id: 'mist_bee',              name: 'Mist Bee',           nativeZone: 'opal_gardens',           img: null },
  { id: 'obsidian_beetle',       name: 'Obsidian Beetle',    nativeZone: 'obsidian_abyss',         img: null },
  { id: 'shadow_spider',         name: 'Shadow Spider',      nativeZone: 'obsidian_abyss',         img: null },
  { id: 'ash_wasp',              name: 'Ash Wasp',           nativeZone: 'obsidian_abyss',         img: null },
  { id: 'void_mantis',           name: 'Void Mantis',        nativeZone: 'obsidian_abyss',         img: null },
  { id: 'dark_firefly',          name: 'Dark Firefly',       nativeZone: 'obsidian_abyss',         img: null },
  { id: 'topaz_butterfly',       name: 'Topaz Butterfly',    nativeZone: 'topaz_rift',             img: null },
  { id: 'gold_scarab',           name: 'Gold Scarab',        nativeZone: 'topaz_rift',             img: null },
  { id: 'sun_beetle',            name: 'Sun Beetle',         nativeZone: 'topaz_rift',             img: null },
  { id: 'fault_wasp',            name: 'Fault Wasp',         nativeZone: 'topaz_rift',             img: null },
  { id: 'bright_hopper',         name: 'Bright Hopper',      nativeZone: 'topaz_rift',             img: null },
  { id: 'sapphire_dragonfly',    name: 'Sapphire Dragonfly', nativeZone: 'sapphire_trench',        img: null },
  { id: 'royal_scarab',          name: 'Royal Scarab',       nativeZone: 'sapphire_trench',        img: null },
  { id: 'ice_moth',              name: 'Ice Moth',           nativeZone: 'sapphire_trench',        img: null },
  { id: 'trench_spider',         name: 'Trench Spider',      nativeZone: 'sapphire_trench',        img: null },
  { id: 'deep_wasp',             name: 'Deep Wasp',          nativeZone: 'sapphire_trench',        img: null },
  { id: 'diamond_beetle',        name: 'Diamond Beetle',     nativeZone: 'blue_diamond_sanctuary', img: null },
  { id: 'prism_butterfly',       name: 'Prism Butterfly',    nativeZone: 'blue_diamond_sanctuary', img: null },
  { id: 'sanctuary_bee',         name: 'Sanctuary Bee',      nativeZone: 'blue_diamond_sanctuary', img: null },
  { id: 'blue_scarab',           name: 'Blue Scarab',        nativeZone: 'blue_diamond_sanctuary', img: null },
  { id: 'heart_firefly',         name: 'Heart Firefly',      nativeZone: 'blue_diamond_sanctuary', img: null },
];

// ─── ABYSS MYTHIC FISH ───────────────────────────────────────────────────────
// One per zone. Manual fishing only. Requires equipped Tribe Bobber.

const ABYSS_MYTHIC_FISH = [
  { id: 'ancient_emerald_leviathan', name: 'Ancient Emerald Leviathan', zone: 'emerald_forest',         img: null },
  { id: 'amber_reef_colossus',       name: 'Amber Reef Colossus',       zone: 'amber_reef',             img: null },
  { id: 'amethyst_dream_serpent',    name: 'Amethyst Dream Serpent',    zone: 'amethyst_caverns',       img: null },
  { id: 'crimson_chasm_tyrant',      name: 'Crimson Chasm Tyrant',      zone: 'ruby_chasm',             img: null },
  { id: 'lagoon_skywhale',           name: 'Lagoon Skywhale',           zone: 'aquamarine_lagoon',      img: null },
  { id: 'iridescent_garden_ray',     name: 'Iridescent Garden Ray',     zone: 'opal_gardens',           img: null },
  { id: 'voidjaw',                   name: 'Voidjaw',                   zone: 'obsidian_abyss',         img: null },
  { id: 'golden_fault_eel',          name: 'Golden Fault Eel',          zone: 'topaz_rift',             img: null },
  { id: 'sapphire_trench_warden',    name: 'Sapphire Trench Warden',    zone: 'sapphire_trench',        img: null },
  { id: 'heart_of_the_abyss',        name: 'Heart of the Abyss',        zone: 'blue_diamond_sanctuary', img: null },
];

// ─── ABYSS TRIBE BOBBERS ─────────────────────────────────────────────────────
// Permanent cosmetics. Never consumed. Survive prestige. Enable mythic catch.

const ABYSS_TRIBE_BOBBERS = [
  { id: 'emerald_root_bobber',     name: 'Emerald Root Bobber',     tribe: 'emerald_wardens',       zone: 'emerald_forest',         permanent: true, consumable: false, lostOnPrestige: false, img: null },
  { id: 'amber_coral_bobber',      name: 'Amber Coral Bobber',      tribe: 'amber_reefkin',         zone: 'amber_reef',             permanent: true, consumable: false, lostOnPrestige: false, img: null },
  { id: 'amethyst_eye_bobber',     name: 'Amethyst Eye Bobber',     tribe: 'amethyst_seers',        zone: 'amethyst_caverns',       permanent: true, consumable: false, lostOnPrestige: false, img: null },
  { id: 'ruby_fang_bobber',        name: 'Ruby Fang Bobber',        tribe: 'ruby_forged',           zone: 'ruby_chasm',             permanent: true, consumable: false, lostOnPrestige: false, img: null },
  { id: 'aquamarine_pearl_bobber', name: 'Aquamarine Pearl Bobber', tribe: 'aquamarine_tidefolk',   zone: 'aquamarine_lagoon',      permanent: true, consumable: false, lostOnPrestige: false, img: null },
  { id: 'opal_bloom_bobber',       name: 'Opal Bloom Bobber',       tribe: 'opal_gardeners',        zone: 'opal_gardens',           permanent: true, consumable: false, lostOnPrestige: false, img: null },
  { id: 'obsidian_spike_bobber',   name: 'Obsidian Spike Bobber',   tribe: 'obsidian_keepers',      zone: 'obsidian_abyss',         permanent: true, consumable: false, lostOnPrestige: false, img: null },
  { id: 'topaz_rift_bobber',       name: 'Topaz Rift Bobber',       tribe: 'topaz_riftborn',        zone: 'topaz_rift',             permanent: true, consumable: false, lostOnPrestige: false, img: null },
  { id: 'sapphire_trench_bobber',  name: 'Sapphire Trench Bobber',  tribe: 'sapphire_deepwatch',    zone: 'sapphire_trench',        permanent: true, consumable: false, lostOnPrestige: false, img: null },
  { id: 'blue_diamond_bobber',     name: 'Blue Diamond Bobber',     tribe: 'blue_diamond_ancients', zone: 'blue_diamond_sanctuary', permanent: true, consumable: false, lostOnPrestige: false, img: null },
];

// ─── ABYSS TRIBES ────────────────────────────────────────────────────────────
// 10 tribes, one per zone. Reputation and rewards survive prestige.
// Current-stage catch counters reset on prestige; completed stages do not.

const ABYSS_TRIBES = [
  {
    id: 'emerald_wardens', name: 'Emerald Wardens', zone: 'emerald_forest',
    specialization: 'Storage', expectedCatchsPerSecond: 10000,
    bobber: 'emerald_root_bobber', mythicFish: 'ancient_emerald_leviathan',
    stages: {
      initialRequest: { targetDays: 3, totalCatches: 2592000000,
        fish: [{id:'salmon',name:'Salmon',qty:1036800000},{id:'tuna',name:'Tuna',qty:777600000},{id:'swordfish',name:'Swordfish',qty:518400000},{id:'marlin',name:'Marlin',qty:259200000}],
        reward: 'emerald_root_bobber', rewardDesc: 'Emerald Root Bobber — unlocks Mythic catch' },
      friendly: { targetDays: 2, totalCatches: 1728000000,
        fish: [{id:'salmon',name:'Salmon',qty:691200000},{id:'tuna',name:'Tuna',qty:518400000},{id:'swordfish',name:'Swordfish',qty:345600000},{id:'marlin',name:'Marlin',qty:172800000}],
        bonus: {stat:'storage',pct:3}, rewardDesc: '+3% Storage' },
      honored: { targetDays: 4, totalCatches: 3456000000,
        fish: [{id:'salmon',name:'Salmon',qty:1382400000},{id:'tuna',name:'Tuna',qty:1036800000},{id:'swordfish',name:'Swordfish',qty:691200000},{id:'marlin',name:'Marlin',qty:345600000}],
        bonus: {stat:'storage',pct:3}, rewardDesc: '+3% Storage' },
      revered: { targetDays: 7, totalCatches: 6048000000,
        fish: [{id:'salmon',name:'Salmon',qty:2419200000},{id:'tuna',name:'Tuna',qty:1814400000},{id:'swordfish',name:'Swordfish',qty:1209600000},{id:'marlin',name:'Marlin',qty:604800000}],
        bonus: {stat:'storage',pct:4}, rewardDesc: '+4% Storage' },
      exalted: { targetDays: 12, totalCatches: 10368000000,
        fish: [{id:'salmon',name:'Salmon',qty:4147200000},{id:'tuna',name:'Tuna',qty:3110400000},{id:'swordfish',name:'Swordfish',qty:2073600000},{id:'marlin',name:'Marlin',qty:1036800000}],
        bonus: {stat:'storage',pct:5}, rewardDesc: '+5% Storage — MAX' },
    },
  },
  {
    id: 'amber_reefkin', name: 'Amber Reefkin', zone: 'amber_reef',
    specialization: 'Fish Value', expectedCatchsPerSecond: 20000,
    bobber: 'amber_coral_bobber', mythicFish: 'amber_reef_colossus',
    stages: {
      initialRequest: { targetDays: 3, totalCatches: 5184000000,
        fish: [{id:'pike',name:'Pike',qty:2073600000},{id:'zander',name:'Zander',qty:1555200000},{id:'catfish',name:'European Catfish',qty:1036800000},{id:'eel',name:'Eel',qty:518400000}],
        reward: 'amber_coral_bobber', rewardDesc: 'Amber Coral Bobber — unlocks Mythic catch' },
      friendly: { targetDays: 2, totalCatches: 3456000000,
        fish: [{id:'pike',name:'Pike',qty:1382400000},{id:'zander',name:'Zander',qty:1036800000},{id:'catfish',name:'European Catfish',qty:691200000},{id:'eel',name:'Eel',qty:345600000}],
        bonus: {stat:'fishValue',pct:2}, rewardDesc: '+2% Fish Value' },
      honored: { targetDays: 4, totalCatches: 6912000000,
        fish: [{id:'pike',name:'Pike',qty:2764800000},{id:'zander',name:'Zander',qty:2073600000},{id:'catfish',name:'European Catfish',qty:1382400000},{id:'eel',name:'Eel',qty:691200000}],
        bonus: {stat:'fishValue',pct:2}, rewardDesc: '+2% Fish Value' },
      revered: { targetDays: 7, totalCatches: 12096000000,
        fish: [{id:'pike',name:'Pike',qty:4838400000},{id:'zander',name:'Zander',qty:3628800000},{id:'catfish',name:'European Catfish',qty:2419200000},{id:'eel',name:'Eel',qty:1209600000}],
        bonus: {stat:'fishValue',pct:3}, rewardDesc: '+3% Fish Value' },
      exalted: { targetDays: 12, totalCatches: 20736000000,
        fish: [{id:'pike',name:'Pike',qty:8294400000},{id:'zander',name:'Zander',qty:6220800000},{id:'catfish',name:'European Catfish',qty:4147200000},{id:'eel',name:'Eel',qty:2073600000}],
        bonus: {stat:'fishValue',pct:5}, rewardDesc: '+5% Fish Value — MAX' },
    },
  },
  {
    id: 'amethyst_seers', name: 'Amethyst Seers', zone: 'amethyst_caverns',
    specialization: 'Automation Speed', expectedCatchsPerSecond: 30000,
    bobber: 'amethyst_eye_bobber', mythicFish: 'amethyst_dream_serpent',
    stages: {
      initialRequest: { targetDays: 3, totalCatches: 7776000000,
        fish: [{id:'crucian_carp',name:'Crucian Carp',qty:3110400000},{id:'roach',name:'Roach',qty:2332800000},{id:'tench',name:'Tench',qty:1555200000},{id:'common_bream',name:'Common Bream',qty:777600000}],
        reward: 'amethyst_eye_bobber', rewardDesc: 'Amethyst Eye Bobber — unlocks Mythic catch' },
      friendly: { targetDays: 2, totalCatches: 5184000000,
        fish: [{id:'crucian_carp',name:'Crucian Carp',qty:2073600000},{id:'roach',name:'Roach',qty:1555200000},{id:'tench',name:'Tench',qty:1036800000},{id:'common_bream',name:'Common Bream',qty:518400000}],
        bonus: {stat:'automationSpeed',pct:2}, rewardDesc: '+2% Automation Speed' },
      honored: { targetDays: 4, totalCatches: 10368000000,
        fish: [{id:'crucian_carp',name:'Crucian Carp',qty:4147200000},{id:'roach',name:'Roach',qty:3110400000},{id:'tench',name:'Tench',qty:2073600000},{id:'common_bream',name:'Common Bream',qty:1036800000}],
        bonus: {stat:'automationSpeed',pct:2}, rewardDesc: '+2% Automation Speed' },
      revered: { targetDays: 7, totalCatches: 18144000000,
        fish: [{id:'crucian_carp',name:'Crucian Carp',qty:7257600000},{id:'roach',name:'Roach',qty:5443200000},{id:'tench',name:'Tench',qty:3628800000},{id:'common_bream',name:'Common Bream',qty:1814400000}],
        bonus: {stat:'automationSpeed',pct:3}, rewardDesc: '+3% Automation Speed' },
      exalted: { targetDays: 12, totalCatches: 31104000000,
        fish: [{id:'crucian_carp',name:'Crucian Carp',qty:12441600000},{id:'roach',name:'Roach',qty:9331200000},{id:'tench',name:'Tench',qty:6220800000},{id:'common_bream',name:'Common Bream',qty:3110400000}],
        bonus: {stat:'automationSpeed',pct:5}, rewardDesc: '+5% Automation Speed — MAX' },
    },
  },
  {
    id: 'ruby_forged', name: 'Ruby Forged', zone: 'ruby_chasm',
    specialization: 'Manual Catch Speed', expectedCatchsPerSecond: 40000,
    bobber: 'ruby_fang_bobber', mythicFish: 'crimson_chasm_tyrant',
    stages: {
      initialRequest: { targetDays: 3, totalCatches: 10368000000,
        fish: [{id:'grayling',name:'Grayling',qty:4147200000},{id:'barbel',name:'Barbel',qty:3110400000},{id:'chub',name:'Chub',qty:2073600000},{id:'burbot',name:'Burbot',qty:1036800000}],
        reward: 'ruby_fang_bobber', rewardDesc: 'Ruby Fang Bobber — unlocks Mythic catch' },
      friendly: { targetDays: 2, totalCatches: 6912000000,
        fish: [{id:'grayling',name:'Grayling',qty:2764800000},{id:'barbel',name:'Barbel',qty:2073600000},{id:'chub',name:'Chub',qty:1382400000},{id:'burbot',name:'Burbot',qty:691200000}],
        bonus: {stat:'manualCatchSpeed',pct:3}, rewardDesc: '+3% Manual Catch Speed' },
      honored: { targetDays: 4, totalCatches: 13824000000,
        fish: [{id:'grayling',name:'Grayling',qty:5529600000},{id:'barbel',name:'Barbel',qty:4147200000},{id:'chub',name:'Chub',qty:2764800000},{id:'burbot',name:'Burbot',qty:1382400000}],
        bonus: {stat:'manualCatchSpeed',pct:3}, rewardDesc: '+3% Manual Catch Speed' },
      revered: { targetDays: 7, totalCatches: 24192000000,
        fish: [{id:'grayling',name:'Grayling',qty:9676800000},{id:'barbel',name:'Barbel',qty:7257600000},{id:'chub',name:'Chub',qty:4838400000},{id:'burbot',name:'Burbot',qty:2419200000}],
        bonus: {stat:'manualCatchSpeed',pct:4}, rewardDesc: '+4% Manual Catch Speed' },
      exalted: { targetDays: 12, totalCatches: 41472000000,
        fish: [{id:'grayling',name:'Grayling',qty:16588800000},{id:'barbel',name:'Barbel',qty:12441600000},{id:'chub',name:'Chub',qty:8294400000},{id:'burbot',name:'Burbot',qty:4147200000}],
        bonus: {stat:'manualCatchSpeed',pct:5}, rewardDesc: '+5% Manual Catch Speed — MAX' },
    },
  },
  {
    id: 'aquamarine_tidefolk', name: 'Aquamarine Tidefolk', zone: 'aquamarine_lagoon',
    specialization: 'Offline Income', expectedCatchsPerSecond: 50000,
    bobber: 'aquamarine_pearl_bobber', mythicFish: 'lagoon_skywhale',
    stages: {
      initialRequest: { targetDays: 3, totalCatches: 12960000000,
        fish: [{id:'large_perch',name:'Large Perch',qty:5184000000},{id:'carp',name:'Carp',qty:3888000000},{id:'whitefish',name:'Whitefish',qty:2592000000},{id:'brown_trout',name:'Brown Trout',qty:1296000000}],
        reward: 'aquamarine_pearl_bobber', rewardDesc: 'Aquamarine Pearl Bobber — unlocks Mythic catch' },
      friendly: { targetDays: 2, totalCatches: 8640000000,
        fish: [{id:'large_perch',name:'Large Perch',qty:3456000000},{id:'carp',name:'Carp',qty:2592000000},{id:'whitefish',name:'Whitefish',qty:1728000000},{id:'brown_trout',name:'Brown Trout',qty:864000000}],
        bonus: {stat:'offlineIncome',pct:3}, rewardDesc: '+3% Offline Income' },
      honored: { targetDays: 4, totalCatches: 17280000000,
        fish: [{id:'large_perch',name:'Large Perch',qty:6912000000},{id:'carp',name:'Carp',qty:5184000000},{id:'whitefish',name:'Whitefish',qty:3456000000},{id:'brown_trout',name:'Brown Trout',qty:1728000000}],
        bonus: {stat:'offlineIncome',pct:3}, rewardDesc: '+3% Offline Income' },
      revered: { targetDays: 7, totalCatches: 30240000000,
        fish: [{id:'large_perch',name:'Large Perch',qty:12096000000},{id:'carp',name:'Carp',qty:9072000000},{id:'whitefish',name:'Whitefish',qty:6048000000},{id:'brown_trout',name:'Brown Trout',qty:3024000000}],
        bonus: {stat:'offlineIncome',pct:4}, rewardDesc: '+4% Offline Income' },
      exalted: { targetDays: 12, totalCatches: 51840000000,
        fish: [{id:'large_perch',name:'Large Perch',qty:20736000000},{id:'carp',name:'Carp',qty:15552000000},{id:'whitefish',name:'Whitefish',qty:10368000000},{id:'brown_trout',name:'Brown Trout',qty:5184000000}],
        bonus: {stat:'offlineIncome',pct:5}, rewardDesc: '+5% Offline Income — MAX' },
    },
  },
  {
    id: 'opal_gardeners', name: 'Opal Gardeners', zone: 'opal_gardens',
    specialization: 'Rare/Epic Chance', expectedCatchsPerSecond: 60000,
    bobber: 'opal_bloom_bobber', mythicFish: 'iridescent_garden_ray',
    stages: {
      initialRequest: { targetDays: 3, totalCatches: 15552000000,
        fish: [{id:'flounder',name:'Flounder',qty:6220800000},{id:'garfish',name:'Garfish',qty:4665600000},{id:'smelt',name:'Smelt',qty:3110400000},{id:'sprat',name:'Sprat',qty:1555200000}],
        reward: 'opal_bloom_bobber', rewardDesc: 'Opal Bloom Bobber — unlocks Mythic catch' },
      friendly: { targetDays: 2, totalCatches: 10368000000,
        fish: [{id:'flounder',name:'Flounder',qty:4147200000},{id:'garfish',name:'Garfish',qty:3110400000},{id:'smelt',name:'Smelt',qty:2073600000},{id:'sprat',name:'Sprat',qty:1036800000}],
        bonus: {stat:'rareEpicChance',pct:0.5}, rewardDesc: '+0.5% Rare/Epic Chance' },
      honored: { targetDays: 4, totalCatches: 20736000000,
        fish: [{id:'flounder',name:'Flounder',qty:8294400000},{id:'garfish',name:'Garfish',qty:6220800000},{id:'smelt',name:'Smelt',qty:4147200000},{id:'sprat',name:'Sprat',qty:2073600000}],
        bonus: {stat:'rareEpicChance',pct:0.5}, rewardDesc: '+0.5% Rare/Epic Chance' },
      revered: { targetDays: 7, totalCatches: 36288000000,
        fish: [{id:'flounder',name:'Flounder',qty:14515200000},{id:'garfish',name:'Garfish',qty:10886400000},{id:'smelt',name:'Smelt',qty:7257600000},{id:'sprat',name:'Sprat',qty:3628800000}],
        bonus: {stat:'rareEpicChance',pct:0.75}, rewardDesc: '+0.75% Rare/Epic Chance' },
      exalted: { targetDays: 12, totalCatches: 62208000000,
        fish: [{id:'flounder',name:'Flounder',qty:24883200000},{id:'garfish',name:'Garfish',qty:18662400000},{id:'smelt',name:'Smelt',qty:12441600000},{id:'sprat',name:'Sprat',qty:6220800000}],
        bonus: {stat:'rareEpicChance',pct:1}, rewardDesc: '+1% Rare/Epic Chance — MAX' },
    },
  },
  {
    id: 'obsidian_keepers', name: 'Obsidian Keepers', zone: 'obsidian_abyss',
    specialization: 'Mythic Fish Chance', expectedCatchsPerSecond: 70000,
    bobber: 'obsidian_spike_bobber', mythicFish: 'voidjaw',
    stages: {
      initialRequest: { targetDays: 3, totalCatches: 18144000000,
        fish: [{id:'haddock',name:'Haddock',qty:7257600000},{id:'redfish',name:'Redfish',qty:5443200000},{id:'wolffish',name:'Wolffish',qty:3628800000},{id:'atlantic_mackerel',name:'Atlantic Mackerel',qty:1814400000}],
        reward: 'obsidian_spike_bobber', rewardDesc: 'Obsidian Spike Bobber — unlocks Mythic catch' },
      friendly: { targetDays: 2, totalCatches: 12096000000,
        fish: [{id:'haddock',name:'Haddock',qty:4838400000},{id:'redfish',name:'Redfish',qty:3628800000},{id:'wolffish',name:'Wolffish',qty:2419200000},{id:'atlantic_mackerel',name:'Atlantic Mackerel',qty:1209600000}],
        bonus: {stat:'mythicFishChance',pct:0.25}, rewardDesc: '+0.25% Mythic Fish Chance' },
      honored: { targetDays: 4, totalCatches: 24192000000,
        fish: [{id:'haddock',name:'Haddock',qty:9676800000},{id:'redfish',name:'Redfish',qty:7257600000},{id:'wolffish',name:'Wolffish',qty:4838400000},{id:'atlantic_mackerel',name:'Atlantic Mackerel',qty:2419200000}],
        bonus: {stat:'mythicFishChance',pct:0.25}, rewardDesc: '+0.25% Mythic Fish Chance' },
      revered: { targetDays: 7, totalCatches: 42336000000,
        fish: [{id:'haddock',name:'Haddock',qty:16934400000},{id:'redfish',name:'Redfish',qty:12700800000},{id:'wolffish',name:'Wolffish',qty:8467200000},{id:'atlantic_mackerel',name:'Atlantic Mackerel',qty:4233600000}],
        bonus: {stat:'mythicFishChance',pct:0.25}, rewardDesc: '+0.25% Mythic Fish Chance' },
      exalted: { targetDays: 12, totalCatches: 72576000000,
        fish: [{id:'haddock',name:'Haddock',qty:29030400000},{id:'redfish',name:'Redfish',qty:21772800000},{id:'wolffish',name:'Wolffish',qty:14515200000},{id:'atlantic_mackerel',name:'Atlantic Mackerel',qty:7257600000}],
        bonus: {stat:'mythicFishChance',pct:0.5}, rewardDesc: '+0.5% Mythic Fish Chance — MAX' },
    },
  },
  {
    id: 'topaz_riftborn', name: 'Topaz Riftborn', zone: 'topaz_rift',
    specialization: 'Expedition Speed', expectedCatchsPerSecond: 80000,
    bobber: 'topaz_rift_bobber', mythicFish: 'golden_fault_eel',
    stages: {
      initialRequest: { targetDays: 3, totalCatches: 20736000000,
        fish: [{id:'tuna',name:'Tuna',qty:8294400000},{id:'mahi_mahi',name:'Mahi-Mahi',qty:6220800000},{id:'swordfish',name:'Swordfish',qty:4147200000},{id:'marlin',name:'Marlin',qty:2073600000}],
        reward: 'topaz_rift_bobber', rewardDesc: 'Topaz Rift Bobber — unlocks Mythic catch' },
      friendly: { targetDays: 2, totalCatches: 13824000000,
        fish: [{id:'tuna',name:'Tuna',qty:5529600000},{id:'mahi_mahi',name:'Mahi-Mahi',qty:4147200000},{id:'swordfish',name:'Swordfish',qty:2764800000},{id:'marlin',name:'Marlin',qty:1382400000}],
        bonus: {stat:'expeditionSpeed',pct:5}, rewardDesc: '+5% Expedition Speed' },
      honored: { targetDays: 4, totalCatches: 27648000000,
        fish: [{id:'tuna',name:'Tuna',qty:11059200000},{id:'mahi_mahi',name:'Mahi-Mahi',qty:8294400000},{id:'swordfish',name:'Swordfish',qty:5529600000},{id:'marlin',name:'Marlin',qty:2764800000}],
        bonus: {stat:'expeditionSpeed',pct:5}, rewardDesc: '+5% Expedition Speed' },
      revered: { targetDays: 7, totalCatches: 48384000000,
        fish: [{id:'tuna',name:'Tuna',qty:19353600000},{id:'mahi_mahi',name:'Mahi-Mahi',qty:14515200000},{id:'swordfish',name:'Swordfish',qty:9676800000},{id:'marlin',name:'Marlin',qty:4838400000}],
        bonus: {stat:'expeditionSpeed',pct:7.5}, rewardDesc: '+7.5% Expedition Speed' },
      exalted: { targetDays: 12, totalCatches: 82944000000,
        fish: [{id:'tuna',name:'Tuna',qty:33177600000},{id:'mahi_mahi',name:'Mahi-Mahi',qty:24883200000},{id:'swordfish',name:'Swordfish',qty:16588800000},{id:'marlin',name:'Marlin',qty:8294400000}],
        bonus: {stat:'expeditionSpeed',pct:10}, rewardDesc: '+10% Expedition Speed — MAX' },
    },
  },
  {
    id: 'sapphire_deepwatch', name: 'Sapphire Deepwatch', zone: 'sapphire_trench',
    specialization: 'Geode Find Rate', expectedCatchsPerSecond: 90000,
    bobber: 'sapphire_trench_bobber', mythicFish: 'sapphire_trench_warden',
    stages: {
      initialRequest: { targetDays: 3, totalCatches: 23328000000,
        fish: [{id:'giant_squid',name:'Giant Squid',qty:9331200000},{id:'oarfish',name:'Oarfish',qty:6998400000},{id:'coelacanth',name:'Coelacanth',qty:4665600000},{id:'halibut',name:'Halibut',qty:2332800000}],
        reward: 'sapphire_trench_bobber', rewardDesc: 'Sapphire Trench Bobber — unlocks Mythic catch' },
      friendly: { targetDays: 2, totalCatches: 15552000000,
        fish: [{id:'giant_squid',name:'Giant Squid',qty:6220800000},{id:'oarfish',name:'Oarfish',qty:4665600000},{id:'coelacanth',name:'Coelacanth',qty:3110400000},{id:'halibut',name:'Halibut',qty:1555200000}],
        bonus: {stat:'geodeFindRate',pct:2}, rewardDesc: '+2% Geode Find Rate' },
      honored: { targetDays: 4, totalCatches: 31104000000,
        fish: [{id:'giant_squid',name:'Giant Squid',qty:12441600000},{id:'oarfish',name:'Oarfish',qty:9331200000},{id:'coelacanth',name:'Coelacanth',qty:6220800000},{id:'halibut',name:'Halibut',qty:3110400000}],
        bonus: {stat:'geodeFindRate',pct:2}, rewardDesc: '+2% Geode Find Rate' },
      revered: { targetDays: 7, totalCatches: 54432000000,
        fish: [{id:'giant_squid',name:'Giant Squid',qty:21772800000},{id:'oarfish',name:'Oarfish',qty:16329600000},{id:'coelacanth',name:'Coelacanth',qty:10886400000},{id:'halibut',name:'Halibut',qty:5443200000}],
        bonus: {stat:'geodeFindRate',pct:3}, rewardDesc: '+3% Geode Find Rate' },
      exalted: { targetDays: 12, totalCatches: 93312000000,
        fish: [{id:'giant_squid',name:'Giant Squid',qty:37324800000},{id:'oarfish',name:'Oarfish',qty:27993600000},{id:'coelacanth',name:'Coelacanth',qty:18662400000},{id:'halibut',name:'Halibut',qty:9331200000}],
        bonus: {stat:'geodeFindRate',pct:5}, rewardDesc: '+5% Geode Find Rate — MAX' },
    },
  },
  {
    id: 'blue_diamond_ancients', name: 'Blue Diamond Ancients', zone: 'blue_diamond_sanctuary',
    specialization: 'Extra Geode Diamond Chance', expectedCatchsPerSecond: 100000,
    bobber: 'blue_diamond_bobber', mythicFish: 'heart_of_the_abyss',
    stages: {
      initialRequest: { targetDays: 3, totalCatches: 25920000000,
        fish: [{id:'salmon',name:'Salmon',qty:10368000000},{id:'tuna',name:'Tuna',qty:7776000000},{id:'giant_squid',name:'Giant Squid',qty:5184000000},{id:'oarfish',name:'Oarfish',qty:2592000000}],
        reward: 'blue_diamond_bobber', rewardDesc: 'Blue Diamond Bobber — unlocks Mythic catch' },
      friendly: { targetDays: 2, totalCatches: 17280000000,
        fish: [{id:'salmon',name:'Salmon',qty:6912000000},{id:'tuna',name:'Tuna',qty:5184000000},{id:'giant_squid',name:'Giant Squid',qty:3456000000},{id:'oarfish',name:'Oarfish',qty:1728000000}],
        bonus: {stat:'geodeExtraDiamondChance',pct:2}, rewardDesc: '+2% Extra Geode Diamond Chance' },
      honored: { targetDays: 4, totalCatches: 34560000000,
        fish: [{id:'salmon',name:'Salmon',qty:13824000000},{id:'tuna',name:'Tuna',qty:10368000000},{id:'giant_squid',name:'Giant Squid',qty:6912000000},{id:'oarfish',name:'Oarfish',qty:3456000000}],
        bonus: {stat:'geodeExtraDiamondChance',pct:3}, rewardDesc: '+3% Extra Geode Diamond Chance' },
      revered: { targetDays: 7, totalCatches: 60480000000,
        fish: [{id:'salmon',name:'Salmon',qty:24192000000},{id:'tuna',name:'Tuna',qty:18144000000},{id:'giant_squid',name:'Giant Squid',qty:12096000000},{id:'oarfish',name:'Oarfish',qty:6048000000}],
        bonus: {stat:'geodeExtraDiamondChance',pct:5}, rewardDesc: '+5% Extra Geode Diamond Chance' },
      exalted: { targetDays: 12, totalCatches: 103680000000,
        fish: [{id:'salmon',name:'Salmon',qty:41472000000},{id:'tuna',name:'Tuna',qty:31104000000},{id:'giant_squid',name:'Giant Squid',qty:20736000000},{id:'oarfish',name:'Oarfish',qty:10368000000}],
        bonus: {stat:'geodeExtraDiamondChance',pct:10}, rewardDesc: '+10% Extra Geode Diamond Chance — MAX' },
    },
  },
];

// ─── UNIVERSAL GEODE ─────────────────────────────────────────────────────────
// Single definition shared across all 10 zones. Primary repeatable Diamond source.

const ABYSS_UNIVERSAL_GEODE = {
  id: 'universal_geode', name: 'Abyss Geode',
  diamondMin: 1, diamondMax: 3, targetFindsPerDay: 10,
  dropLogic: 'universal', fishdexEntry: 'shared', fishdexCategory: 'geode',
  img: null,
};

// ─── PHASE 4 LOOKUP HELPERS ──────────────────────────────────────────────────

function getAbyssZone(id)       { return ABYSS_ZONES.find(function(z) { return z.id === id; }) || null; }
function getAbyssZoneByOrder(n) { return ABYSS_ZONES.find(function(z) { return z.order === n; }) || null; }
function getAbyssFish(id)       { return ABYSS_FISH_DB.find(function(f) { return f.id === id; }) || null; }
function getAbyssCrystal(id)    { return ABYSS_CRYSTAL_DB.find(function(c) { return c.id === id; }) || null; }
function getAbyssInsect(id)     { return ABYSS_INSECT_DB.find(function(i) { return i.id === id; }) || null; }
function getAbyssMythicFish(id) { return ABYSS_MYTHIC_FISH.find(function(m) { return m.id === id; }) || null; }
function getAbyssTribe(id)      { return ABYSS_TRIBES.find(function(t) { return t.id === id; }) || null; }
function getAbyssTribeBobber(id){ return ABYSS_TRIBE_BOBBERS.find(function(b) { return b.id === id; }) || null; }

function getAbyssFishForZone(zoneId) {
  var zone = getAbyssZone(zoneId);
  if (!zone) return [];
  return zone.fish.map(function(id) { return getAbyssFish(id); }).filter(Boolean);
}
function getAbyssCrystalsForZone(zoneId) {
  var zone = getAbyssZone(zoneId);
  if (!zone) return [];
  return zone.crystals.map(function(id) { return getAbyssCrystal(id); }).filter(Boolean);
}
function getAbyssInsectsForZone(zoneId) {
  var zone = getAbyssZone(zoneId);
  if (!zone) return [];
  return zone.insects.map(function(id) { return getAbyssInsect(id); }).filter(Boolean);
}
function getAbyssTribeForZone(zoneId) {
  var zone = getAbyssZone(zoneId);
  return zone ? getAbyssTribe(zone.tribe) : null;
}
function getAbyssMythicFishForZone(zoneId) {
  var zone = getAbyssZone(zoneId);
  return zone ? getAbyssMythicFish(zone.mythicFish) : null;
}
function getAbyssBobberForZone(zoneId) {
  var zone = getAbyssZone(zoneId);
  return zone ? getAbyssTribeBobber(zone.bobberReward) : null;
}

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

// ─── ABYSS PRESTIGE HOOK ─────────────────────────────────────────────────────
// Called from executePrestige() in game.js after _clearMaelstromMissionsOnPrestige().
// tribeReputation and tribeBobbers survive prestige — only current-request progress resets.

function _clearAbyssOnPrestige() {
  if (typeof G === 'undefined' || !G.abyss) return;
  G.abyss.tribeProgress  = {};  // current-stage catch counts reset
  G.abyss.mythicCatches  = {};  // mythic catch flags reset
  // tribeReputation, tribeBobbers, and permanent bonuses survive
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

  const zoneRows = ABYSS_ZONES.map(function(z) {
    const tribe   = getAbyssTribeForZone(z.id);
    const mythic  = getAbyssMythicFishForZone(z.id);
    const bobber  = getAbyssBobberForZone(z.id);
    const isSel   = currentZoneId === z.id;
    return `<div class="expansion-zone-card ${isSel ? 'selected' : ''}" style="border-color:${z.themeColor};cursor:pointer;"
                 onclick="selectAbyssZoneDebug('${z.id}')">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="color:${z.themeColor};font-weight:bold;">Zone ${z.order}: ${z.name}</span>
        <span style="opacity:0.6;font-size:11px;">${z.theme}</span>
      </div>
      <div style="display:flex;gap:18px;margin-top:4px;font-size:11px;opacity:0.8;">
        <span>Fish: ${z.fish.length}</span>
        <span>Crystals: ${z.crystals.length}</span>
        <span>Insects: ${z.insects.length}</span>
        <span>${z.expectedCatchsPerSecond.toLocaleString()}/s</span>
      </div>
      <div style="font-size:11px;margin-top:2px;opacity:0.7;">
        Tribe: <em>${tribe ? tribe.name : z.tribe}</em> &bull;
        Mythic: <em>${mythic ? mythic.name : z.mythicFish}</em>
      </div>
      <div style="font-size:11px;opacity:0.6;">
        Bobber: ${bobber ? bobber.name : z.bobberReward}
      </div>
    </div>`;
  }).join('');

  const totals = {
    fish:    ABYSS_FISH_DB.length,
    crystal: ABYSS_CRYSTAL_DB.length,
    insect:  ABYSS_INSECT_DB.length,
    mythic:  ABYSS_MYTHIC_FISH.length,
    tribe:   ABYSS_TRIBES.length,
    bobber:  ABYSS_TRIBE_BOBBERS.length,
  };

  el.innerHTML = `
    <div class="expansion-debug-world">
      <div class="expansion-debug-label" style="color:#7ec8e3;">WORLD: ABYSS — Phase 4 Data Inspector</div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin:8px 0;font-size:12px;">
        <span>Fish DB: <strong>${totals.fish}</strong></span>
        <span>Crystal DB: <strong>${totals.crystal}</strong></span>
        <span>Insect DB: <strong>${totals.insect}</strong></span>
        <span>Mythic: <strong>${totals.mythic}</strong></span>
        <span>Tribes: <strong>${totals.tribe}</strong></span>
        <span>Bobbers: <strong>${totals.bobber}</strong></span>
        <span>Zones: <strong>${ABYSS_ZONES.length}</strong></span>
      </div>
      <div style="font-size:11px;opacity:0.6;margin-bottom:8px;">
        Geode: ${ABYSS_UNIVERSAL_GEODE.id} (${ABYSS_UNIVERSAL_GEODE.diamondMin}–${ABYSS_UNIVERSAL_GEODE.diamondMax} diamonds, target ${ABYSS_UNIVERSAL_GEODE.targetFindsPerDay}/day)
      </div>
      <div class="expansion-zone-grid">${zoneRows}</div>
      <div class="expansion-dev-controls" style="margin-top:12px;">
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
    </div>
    <div class="settings-info-row dim" style="margin-top:10px;margin-bottom:4px;"><strong>Abyss Fishdex</strong></div>
    <div class="mael-debug-helpers">
      <button class="btn-secondary-sm" onclick="_debugAbyssDiscoverBiome()">Discover Biome</button>
      <button class="btn-secondary-sm" onclick="_debugAbyssDiscoverAll()">Discover All</button>
      <button class="btn-secondary-sm" onclick="_debugAbyssDiscoverGeode()">Find Geode</button>
      <button class="btn-secondary-sm" onclick="_debugAbyssResetFishdex()">Reset Fishdex</button>
    </div>` : ''}`;
}

function toggleAbyssDebugMode() {
  if (!isLocalDevelopmentEnvironment()) return;
  setLocalAbyssDebugEnabled(!isLocalAbyssDebugEnabled());
  renderAbyssDebugSettings();
}

// ─── ABYSS FISHDEX (Phase 5) ──────────────────────────────────────────────────

let _abyssFishdexBiome = null; // session state: which biome tab is showing

function _ensureAbyssFishdexState() {
  if (!G.abyss) G.abyss = { currentZone:null, tribeReputation:{}, tribeProgress:{}, tribeBobbers:[], mythicCatches:{}, fishdex:{ fish:{}, crystals:{}, insects:{}, mythics:{}, geode:{ discovered:false, foundCount:0, openedCount:0 } } };
  if (!G.abyss.fishdex) G.abyss.fishdex = { fish:{}, crystals:{}, insects:{}, mythics:{}, geode:{ discovered:false, foundCount:0, openedCount:0 } };
  const fd = G.abyss.fishdex;
  if (!fd.fish)     fd.fish     = {};
  if (!fd.crystals) fd.crystals = {};
  if (!fd.insects)  fd.insects  = {};
  if (!fd.mythics)  fd.mythics  = {};
  if (!fd.geode)    fd.geode    = { discovered: false, foundCount: 0, openedCount: 0 };
}

// ── Recording helpers ──────────────────────────────────────────────────────────

function recordAbyssFishCatch(fishId, amount) {
  _ensureAbyssFishdexState();
  const fd = G.abyss.fishdex.fish;
  if (!fd[fishId]) fd[fishId] = { discovered: false, count: 0 };
  fd[fishId].discovered = true;
  fd[fishId].count = (fd[fishId].count || 0) + (amount || 1);
  if (typeof saveState === 'function') saveState();
}

function recordAbyssCrystalFound(crystalId, amount) {
  _ensureAbyssFishdexState();
  const fd = G.abyss.fishdex.crystals;
  if (!fd[crystalId]) fd[crystalId] = { discovered: false, count: 0 };
  fd[crystalId].discovered = true;
  fd[crystalId].count = (fd[crystalId].count || 0) + (amount || 1);
  if (typeof saveState === 'function') saveState();
}

function recordAbyssInsectFound(insectId, amount) {
  _ensureAbyssFishdexState();
  const fd = G.abyss.fishdex.insects;
  if (!fd[insectId]) fd[insectId] = { discovered: false, count: 0 };
  fd[insectId].discovered = true;
  fd[insectId].count = (fd[insectId].count || 0) + (amount || 1);
  if (typeof saveState === 'function') saveState();
}

function recordAbyssMythicCatch(mythicId, amount) {
  _ensureAbyssFishdexState();
  const fd = G.abyss.fishdex.mythics;
  if (!fd[mythicId]) fd[mythicId] = { discovered: false, count: 0 };
  fd[mythicId].discovered = true;
  fd[mythicId].count = (fd[mythicId].count || 0) + (amount || 1);
  if (typeof saveState === 'function') saveState();
}

function recordAbyssGeodeFound(amount) {
  _ensureAbyssFishdexState();
  const g = G.abyss.fishdex.geode;
  g.discovered  = true;
  g.foundCount  = (g.foundCount  || 0) + (amount || 1);
  if (typeof saveState === 'function') saveState();
}

function recordAbyssGeodeOpened(amount) {
  _ensureAbyssFishdexState();
  const g = G.abyss.fishdex.geode;
  g.openedCount = (g.openedCount || 0) + (amount || 1);
  if (typeof saveState === 'function') saveState();
}

// ── Renderer ───────────────────────────────────────────────────────────────────

function renderAbyssFishdex() {
  // Safety: fall back to auto if access was revoked mid-session
  if (!canAccessMaelstromAndAbyss()) {
    if (typeof _fishdexMode !== 'undefined') { window._fishdexMode = 'auto'; }
    if (typeof renderFishdexTabs === 'function') renderFishdexTabs();
    if (typeof renderFishdex    === 'function') renderFishdex();
    return;
  }
  _ensureAbyssFishdexState();

  const content  = document.getElementById('fishdex-content');
  const progress = document.getElementById('fishdex-progress');
  if (!content) return;
  content.innerHTML = '';

  // Ensure a valid biome is selected
  if (!_abyssFishdexBiome || !ABYSS_ZONES.find(function(z) { return z.id === _abyssFishdexBiome; })) {
    _abyssFishdexBiome = ABYSS_ZONES[0] ? ABYSS_ZONES[0].id : null;
  }

  // ── Overall progress ─────────────────────────────────────────────────────
  const totalEntries   = ABYSS_FISH_DB.length + ABYSS_CRYSTAL_DB.length + ABYSS_INSECT_DB.length + ABYSS_MYTHIC_FISH.length + 1;
  const fd             = G.abyss.fishdex;
  const discFish       = Object.values(fd.fish    ).filter(function(e) { return e.discovered; }).length;
  const discCrystals   = Object.values(fd.crystals).filter(function(e) { return e.discovered; }).length;
  const discInsects    = Object.values(fd.insects ).filter(function(e) { return e.discovered; }).length;
  const discMythics    = Object.values(fd.mythics ).filter(function(e) { return e.discovered; }).length;
  const discGeode      = fd.geode.discovered ? 1 : 0;
  const totalDisc      = discFish + discCrystals + discInsects + discMythics + discGeode;

  if (progress) progress.textContent = totalDisc + ' / ' + totalEntries;

  const pct = totalEntries ? Math.round(totalDisc / totalEntries * 100) : 0;
  const header = document.createElement('div');
  header.className = 'abyss-fishdex-header';
  header.innerHTML =
    '<div class="abyss-fd-title">Abyss Fishdex</div>' +
    '<div class="abyss-fd-subtitle">' + totalDisc + ' / ' + totalEntries + ' discovered</div>' +
    '<div class="abyss-fd-bar-wrap"><div class="abyss-fd-bar" style="width:' + pct + '%"></div></div>';
  content.appendChild(header);

  // ── Universal Geode ──────────────────────────────────────────────────────
  _renderAbyssGeodeSection(content);

  // ── Biome tabs ───────────────────────────────────────────────────────────
  const biomeTabs = document.createElement('div');
  biomeTabs.className = 'abyss-biome-tabs';
  ABYSS_ZONES.forEach(function(zone) {
    const btn = document.createElement('button');
    btn.className = 'abyss-biome-tab' + (zone.id === _abyssFishdexBiome ? ' active' : '');
    btn.textContent = zone.name || zone.id;
    btn.addEventListener('click', function() {
      _abyssFishdexBiome = zone.id;
      renderAbyssFishdex();
    });
    biomeTabs.appendChild(btn);
  });
  content.appendChild(biomeTabs);

  // ── Selected biome content ───────────────────────────────────────────────
  if (_abyssFishdexBiome) _renderAbyssBiome(_abyssFishdexBiome, content);
}

function _renderAbyssGeodeSection(container) {
  _ensureAbyssFishdexState();
  const geode    = G.abyss.fishdex.geode;
  const geodeDef = ABYSS_UNIVERSAL_GEODE;

  const section = document.createElement('div');
  section.className = 'abyss-geode-section';

  const hdr = document.createElement('div');
  hdr.className = 'abyss-category-header';
  hdr.innerHTML = '<span>Universal Reward</span><span class="abyss-cat-progress">' + (geode.discovered ? '1' : '0') + '/1</span>';
  section.appendChild(hdr);

  const cell = document.createElement('div');
  cell.className = 'fishdex-cell' + (geode.discovered ? '' : ' locked');

  if (geode.discovered) {
    cell.innerHTML =
      '<div class="fishdex-placeholder" style="color:#00e5ff">' + (geodeDef && geodeDef.name ? geodeDef.name[0].toUpperCase() : 'G') + '</div>' +
      '<span class="fishdex-rarity-dot" style="background:#00e5ff"></span>' +
      '<div class="fishdex-name">' + (geodeDef ? geodeDef.name : 'Abyss Geode') + '</div>' +
      '<div class="abyss-entry-count">Found ' + (geode.foundCount || 0) + 'x &middot; Opened ' + (geode.openedCount || 0) + 'x</div>';
  } else {
    cell.innerHTML =
      '<div class="fishdex-placeholder">?</div>' +
      '<span class="fishdex-rarity-dot" style="background:#333"></span>' +
      '<div class="fishdex-name">???</div>';
  }

  const grid = document.createElement('div');
  grid.className = 'fishdex-grid abyss-geode-grid';
  grid.appendChild(cell);
  section.appendChild(grid);
  container.appendChild(section);
}

function _renderAbyssCategory(itemIds, db, fdMap, label, color, container) {
  var disc = itemIds.filter(function(id) { return fdMap[id] && fdMap[id].discovered; }).length;

  var catHeader = document.createElement('div');
  catHeader.className = 'abyss-category-header';
  catHeader.innerHTML = '<span>' + label + '</span><span class="abyss-cat-progress">' + disc + '/' + itemIds.length + '</span>';
  container.appendChild(catHeader);

  var grid = document.createElement('div');
  grid.className = 'fishdex-grid';

  itemIds.forEach(function(id) {
    var def        = db.find(function(e) { return e.id === id; });
    var entry      = fdMap[id] || null;
    var discovered = !!(entry && entry.discovered);

    var cell = document.createElement('div');
    cell.className = 'fishdex-cell' + (discovered ? '' : ' locked');

    if (discovered && def) {
      cell.innerHTML =
        (def.img
          ? '<img src="' + def.img + '" alt="' + def.name + '" class="fishdex-img">'
          : '<div class="fishdex-placeholder" style="color:' + color + '">' + def.name[0].toUpperCase() + '</div>') +
        '<span class="fishdex-rarity-dot" style="background:' + color + '"></span>' +
        '<div class="fishdex-name">' + def.name + '</div>' +
        (entry.count ? '<div class="abyss-entry-count">' + entry.count + 'x</div>' : '');
    } else {
      cell.innerHTML =
        '<div class="fishdex-placeholder">?</div>' +
        '<span class="fishdex-rarity-dot" style="background:#333"></span>' +
        '<div class="fishdex-name">???</div>';
    }
    grid.appendChild(cell);
  });
  container.appendChild(grid);
}

function _renderAbyssBiome(biomeId, container) {
  var zone = ABYSS_ZONES.find(function(z) { return z.id === biomeId; });
  if (!zone) return;
  _ensureAbyssFishdexState();
  var fd = G.abyss.fishdex;

  var biomeTotal = zone.fish.length + zone.crystals.length + zone.insects.length + (zone.mythicFish ? 1 : 0);
  var biomeDisc  =
    zone.fish    .filter(function(id) { return fd.fish[id]    && fd.fish[id].discovered;    }).length +
    zone.crystals.filter(function(id) { return fd.crystals[id] && fd.crystals[id].discovered; }).length +
    zone.insects .filter(function(id) { return fd.insects[id]  && fd.insects[id].discovered;  }).length +
    (zone.mythicFish && fd.mythics[zone.mythicFish] && fd.mythics[zone.mythicFish].discovered ? 1 : 0);

  var biomeHeader = document.createElement('div');
  biomeHeader.className = 'abyss-biome-header';
  biomeHeader.innerHTML = '<span>' + (zone.name || biomeId) + '</span><span class="abyss-biome-count">' + biomeDisc + '/' + biomeTotal + '</span>';
  container.appendChild(biomeHeader);

  _renderAbyssCategory(zone.fish,     ABYSS_FISH_DB,    fd.fish,     'Fish',     '#4dd0e1', container);
  _renderAbyssCategory(zone.crystals, ABYSS_CRYSTAL_DB, fd.crystals, 'Crystals', '#ce93d8', container);
  _renderAbyssCategory(zone.insects,  ABYSS_INSECT_DB,  fd.insects,  'Insects',  '#a5d6a7', container);
  if (zone.mythicFish) {
    _renderAbyssCategory([zone.mythicFish], ABYSS_MYTHIC_FISH, fd.mythics, 'Mythic', '#ffd700', container);
  }
}

// ── Debug helpers (local dev only) ────────────────────────────────────────────

function _debugAbyssDiscoverBiome() {
  if (!isLocalAbyssDebugEnabled()) return;
  _ensureAbyssFishdexState();
  var biomeId = _abyssFishdexBiome || (ABYSS_ZONES[0] && ABYSS_ZONES[0].id);
  if (!biomeId) return;
  var zone = ABYSS_ZONES.find(function(z) { return z.id === biomeId; });
  if (!zone) return;
  var fd = G.abyss.fishdex;
  zone.fish    .forEach(function(id) { fd.fish[id]     = { discovered:true, count:(fd.fish[id]    ?.count||0)+1 }; });
  zone.crystals.forEach(function(id) { fd.crystals[id] = { discovered:true, count:(fd.crystals[id]?.count||0)+1 }; });
  zone.insects .forEach(function(id) { fd.insects[id]  = { discovered:true, count:(fd.insects[id] ?.count||0)+1 }; });
  if (zone.mythicFish) fd.mythics[zone.mythicFish] = { discovered:true, count:1 };
  if (typeof saveState === 'function') saveState();
  if (typeof renderFishdex === 'function') renderFishdex();
}

function _debugAbyssDiscoverAll() {
  if (!isLocalAbyssDebugEnabled()) return;
  _ensureAbyssFishdexState();
  var fd = G.abyss.fishdex;
  ABYSS_FISH_DB   .forEach(function(f) { fd.fish[f.id]     = { discovered:true, count:1 }; });
  ABYSS_CRYSTAL_DB.forEach(function(c) { fd.crystals[c.id] = { discovered:true, count:1 }; });
  ABYSS_INSECT_DB .forEach(function(i) { fd.insects[i.id]  = { discovered:true, count:1 }; });
  ABYSS_MYTHIC_FISH.forEach(function(m){ fd.mythics[m.id]  = { discovered:true, count:1 }; });
  fd.geode = { discovered:true, foundCount:1, openedCount:1 };
  if (typeof saveState === 'function') saveState();
  if (typeof renderFishdex === 'function') renderFishdex();
}

function _debugAbyssDiscoverGeode() {
  if (!isLocalAbyssDebugEnabled()) return;
  recordAbyssGeodeFound(1);
  recordAbyssGeodeOpened(1);
  if (typeof renderFishdex === 'function') renderFishdex();
}

function _debugAbyssResetFishdex() {
  if (!isLocalAbyssDebugEnabled()) return;
  if (!confirm('Reset Abyss Fishdex progress?')) return;
  _ensureAbyssFishdexState();
  G.abyss.fishdex = { fish:{}, crystals:{}, insects:{}, mythics:{}, geode:{ discovered:false, foundCount:0, openedCount:0 } };
  if (typeof saveState === 'function') saveState();
  if (typeof renderFishdex === 'function') renderFishdex();
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
