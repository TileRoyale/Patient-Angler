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

// ─── TRIBE BALANCE CONFIGURATION ─────────────────────────────────────────────
// All request quantities are generated from this config — never hand-written.
// Tune these parameters to adjust request difficulty without touching tribe data.
//
// Model:  qualifiedRate = expectedRate × (1/activeSlots) × sourceZoneFishFraction
//         totalCatches  = qualifiedRate × stageDays × 86400
//         per-species   = totalCatches × speciesDist[i]
//
// expectedRates     — total OW automation output (catches/s) per zone tier
// activeSlots       — active OW automation zone slots (2 default, 3 with upgrade)
// sourceZoneFishFraction — fraction of source zone's output that are the 4 requested
//                       species; derived from loot table weights + species distribution
// speciesDist       — 40/30/20/10% split across the 4 fish in each request
// Trial of Return   — auto-computed as 25% of initialRequest (see getTrialFishRequirements)

const TRIBE_BALANCE = {
  stageDays: { initialRequest: 3, friendly: 2, honored: 4, revered: 7, exalted: 12 },
  activeSlots: 2,
  expectedRates: [10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000],
  // Per-tribe fraction of source zone output = (rarity weight of requested species) / 100
  // Z1  emerald:       salmon/tuna/swordfish/marlin       ocean uncommon  ≈22%
  // Z2  amber:         pike/zander/catfish/eel             lake rare+epic  ≈24%
  // Z3  amethyst:      crucian_carp/roach/tench/bream      pond common     ≈20%
  // Z4  ruby:          grayling/barbel/chub/burbot         river uncommon  ≈22%
  // Z5  aquamarine:    large_perch/carp/whitefish/trout    lake uncommon   ≈21%
  // Z6  opal:          flounder/garfish/smelt/sprat        bay common      ≈20%
  // Z7  obsidian:      haddock/redfish/wolffish/mackerel   sea uncommon    ≈22%
  // Z8  topaz:         tuna/mahi_mahi/swordfish/marlin     ocean uncommon  ≈22%
  // Z9  sapphire:      cod/oarfish/wolffish/halibut        sea+ocean mix   ≈20%
  // Z10 blue_diamond:  salmon/tuna/swordfish/oarfish       ocean un+rare   ≈21%
  sourceZoneFishFraction: [0.22, 0.24, 0.20, 0.22, 0.21, 0.20, 0.22, 0.22, 0.20, 0.21],
  speciesDist: [0.40, 0.30, 0.20, 0.10],
};

// Builds a complete stage object with computed quantities
function _tribeStage(tribeIdx, stageName, fishDefs, extras) {
  var b = TRIBE_BALANCE;
  var total = Math.round(
    b.expectedRates[tribeIdx] * (1 / b.activeSlots) *
    b.sourceZoneFishFraction[tribeIdx] *
    b.stageDays[stageName] * 86400
  );
  var fish = fishDefs.map(function(f, i) {
    return { id: f.id, name: f.name, qty: Math.round(total * b.speciesDist[i]) };
  });
  var stage = { targetDays: b.stageDays[stageName], totalCatches: total, fish: fish };
  if (extras) Object.assign(stage, extras);
  return stage;
}

// ─── ABYSS TRIBES ────────────────────────────────────────────────────────────
// 10 tribes, one per zone. Reputation and rewards survive prestige.
// Current-stage catch counters reset on prestige; completed stages do not.

const _EW = [{id:'salmon',name:'Salmon'},{id:'tuna',name:'Tuna'},{id:'swordfish',name:'Swordfish'},{id:'marlin',name:'Marlin'}];
const _AR = [{id:'pike',name:'Pike'},{id:'zander',name:'Zander'},{id:'catfish',name:'European Catfish'},{id:'eel',name:'Eel'}];
const _AS = [{id:'crucian_carp',name:'Crucian Carp'},{id:'roach',name:'Roach'},{id:'tench',name:'Tench'},{id:'common_bream',name:'Common Bream'}];
const _RF = [{id:'grayling',name:'Grayling'},{id:'barbel',name:'Barbel'},{id:'chub',name:'Chub'},{id:'burbot',name:'Burbot'}];
const _AT = [{id:'large_perch',name:'Large Perch'},{id:'carp',name:'Carp'},{id:'whitefish',name:'Whitefish'},{id:'brown_trout',name:'Brown Trout'}];
const _OG = [{id:'flounder',name:'Flounder'},{id:'garfish',name:'Garfish'},{id:'smelt',name:'Smelt'},{id:'sprat',name:'Sprat'}];
const _OK = [{id:'haddock',name:'Haddock'},{id:'redfish',name:'Redfish'},{id:'wolffish',name:'Wolffish'},{id:'atlantic_mackerel',name:'Atlantic Mackerel'}];
const _TR = [{id:'tuna',name:'Tuna'},{id:'mahi_mahi',name:'Mahi-Mahi'},{id:'swordfish',name:'Swordfish'},{id:'marlin',name:'Marlin'}];
const _SD = [{id:'cod',name:'Cod'},{id:'oarfish',name:'Oarfish'},{id:'wolffish',name:'Wolffish'},{id:'halibut',name:'Halibut'}];
const _BD = [{id:'salmon',name:'Salmon'},{id:'tuna',name:'Tuna'},{id:'swordfish',name:'Swordfish'},{id:'oarfish',name:'Oarfish'}];

const ABYSS_TRIBES = [
  {
    id: 'emerald_wardens', name: 'Emerald Wardens', zone: 'emerald_forest',
    specialization: 'Storage', expectedCatchsPerSecond: 10000,
    bobber: 'emerald_root_bobber', mythicFish: 'ancient_emerald_leviathan',
    stages: {
      initialRequest: _tribeStage(0,'initialRequest',_EW,{reward:'emerald_root_bobber',rewardDesc:'Emerald Root Bobber — unlocks Mythic catch'}),
      friendly:       _tribeStage(0,'friendly',      _EW,{bonus:{stat:'storage',pct:3},rewardDesc:'+3% Storage'}),
      honored:        _tribeStage(0,'honored',        _EW,{bonus:{stat:'storage',pct:3},rewardDesc:'+3% Storage'}),
      revered:        _tribeStage(0,'revered',        _EW,{bonus:{stat:'storage',pct:4},rewardDesc:'+4% Storage'}),
      exalted:        _tribeStage(0,'exalted',        _EW,{bonus:{stat:'storage',pct:5},rewardDesc:'+5% Storage — MAX'}),
    },
  },
  {
    id: 'amber_reefkin', name: 'Amber Reefkin', zone: 'amber_reef',
    specialization: 'Fish Value', expectedCatchsPerSecond: 20000,
    bobber: 'amber_coral_bobber', mythicFish: 'amber_reef_colossus',
    stages: {
      initialRequest: _tribeStage(1,'initialRequest',_AR,{reward:'amber_coral_bobber',rewardDesc:'Amber Coral Bobber — unlocks Mythic catch'}),
      friendly:       _tribeStage(1,'friendly',      _AR,{bonus:{stat:'fishValue',pct:2},rewardDesc:'+2% Fish Value'}),
      honored:        _tribeStage(1,'honored',        _AR,{bonus:{stat:'fishValue',pct:2},rewardDesc:'+2% Fish Value'}),
      revered:        _tribeStage(1,'revered',        _AR,{bonus:{stat:'fishValue',pct:3},rewardDesc:'+3% Fish Value'}),
      exalted:        _tribeStage(1,'exalted',        _AR,{bonus:{stat:'fishValue',pct:5},rewardDesc:'+5% Fish Value — MAX'}),
    },
  },
  {
    id: 'amethyst_seers', name: 'Amethyst Seers', zone: 'amethyst_caverns',
    specialization: 'Automation Speed', expectedCatchsPerSecond: 30000,
    bobber: 'amethyst_eye_bobber', mythicFish: 'amethyst_dream_serpent',
    stages: {
      initialRequest: _tribeStage(2,'initialRequest',_AS,{reward:'amethyst_eye_bobber',rewardDesc:'Amethyst Eye Bobber — unlocks Mythic catch'}),
      friendly:       _tribeStage(2,'friendly',      _AS,{bonus:{stat:'automationSpeed',pct:2},rewardDesc:'+2% Automation Speed'}),
      honored:        _tribeStage(2,'honored',        _AS,{bonus:{stat:'automationSpeed',pct:2},rewardDesc:'+2% Automation Speed'}),
      revered:        _tribeStage(2,'revered',        _AS,{bonus:{stat:'automationSpeed',pct:3},rewardDesc:'+3% Automation Speed'}),
      exalted:        _tribeStage(2,'exalted',        _AS,{bonus:{stat:'automationSpeed',pct:5},rewardDesc:'+5% Automation Speed — MAX'}),
    },
  },
  {
    id: 'ruby_forged', name: 'Ruby Forged', zone: 'ruby_chasm',
    specialization: 'Manual Catch Speed', expectedCatchsPerSecond: 40000,
    bobber: 'ruby_fang_bobber', mythicFish: 'crimson_chasm_tyrant',
    stages: {
      initialRequest: _tribeStage(3,'initialRequest',_RF,{reward:'ruby_fang_bobber',rewardDesc:'Ruby Fang Bobber — unlocks Mythic catch'}),
      friendly:       _tribeStage(3,'friendly',      _RF,{bonus:{stat:'manualCatchSpeed',pct:3},rewardDesc:'+3% Manual Catch Speed'}),
      honored:        _tribeStage(3,'honored',        _RF,{bonus:{stat:'manualCatchSpeed',pct:3},rewardDesc:'+3% Manual Catch Speed'}),
      revered:        _tribeStage(3,'revered',        _RF,{bonus:{stat:'manualCatchSpeed',pct:4},rewardDesc:'+4% Manual Catch Speed'}),
      exalted:        _tribeStage(3,'exalted',        _RF,{bonus:{stat:'manualCatchSpeed',pct:5},rewardDesc:'+5% Manual Catch Speed — MAX'}),
    },
  },
  {
    id: 'aquamarine_tidefolk', name: 'Aquamarine Tidefolk', zone: 'aquamarine_lagoon',
    specialization: 'Offline Income', expectedCatchsPerSecond: 50000,
    bobber: 'aquamarine_pearl_bobber', mythicFish: 'lagoon_skywhale',
    stages: {
      initialRequest: _tribeStage(4,'initialRequest',_AT,{reward:'aquamarine_pearl_bobber',rewardDesc:'Aquamarine Pearl Bobber — unlocks Mythic catch'}),
      friendly:       _tribeStage(4,'friendly',      _AT,{bonus:{stat:'offlineIncome',pct:3},rewardDesc:'+3% Offline Income'}),
      honored:        _tribeStage(4,'honored',        _AT,{bonus:{stat:'offlineIncome',pct:3},rewardDesc:'+3% Offline Income'}),
      revered:        _tribeStage(4,'revered',        _AT,{bonus:{stat:'offlineIncome',pct:4},rewardDesc:'+4% Offline Income'}),
      exalted:        _tribeStage(4,'exalted',        _AT,{bonus:{stat:'offlineIncome',pct:5},rewardDesc:'+5% Offline Income — MAX'}),
    },
  },
  {
    id: 'opal_gardeners', name: 'Opal Gardeners', zone: 'opal_gardens',
    specialization: 'Rare/Epic Chance', expectedCatchsPerSecond: 60000,
    bobber: 'opal_bloom_bobber', mythicFish: 'iridescent_garden_ray',
    stages: {
      initialRequest: _tribeStage(5,'initialRequest',_OG,{reward:'opal_bloom_bobber',rewardDesc:'Opal Bloom Bobber — unlocks Mythic catch'}),
      friendly:       _tribeStage(5,'friendly',      _OG,{bonus:{stat:'rareEpicChance',pct:0.5},rewardDesc:'+0.5% Rare/Epic Chance'}),
      honored:        _tribeStage(5,'honored',        _OG,{bonus:{stat:'rareEpicChance',pct:0.5},rewardDesc:'+0.5% Rare/Epic Chance'}),
      revered:        _tribeStage(5,'revered',        _OG,{bonus:{stat:'rareEpicChance',pct:0.75},rewardDesc:'+0.75% Rare/Epic Chance'}),
      exalted:        _tribeStage(5,'exalted',        _OG,{bonus:{stat:'rareEpicChance',pct:1},rewardDesc:'+1% Rare/Epic Chance — MAX'}),
    },
  },
  {
    id: 'obsidian_keepers', name: 'Obsidian Keepers', zone: 'obsidian_abyss',
    specialization: 'Mythic Fish Chance', expectedCatchsPerSecond: 70000,
    bobber: 'obsidian_spike_bobber', mythicFish: 'voidjaw',
    stages: {
      initialRequest: _tribeStage(6,'initialRequest',_OK,{reward:'obsidian_spike_bobber',rewardDesc:'Obsidian Spike Bobber — unlocks Mythic catch'}),
      friendly:       _tribeStage(6,'friendly',      _OK,{bonus:{stat:'mythicFishChance',pct:0.25},rewardDesc:'+0.25% Mythic Fish Chance'}),
      honored:        _tribeStage(6,'honored',        _OK,{bonus:{stat:'mythicFishChance',pct:0.25},rewardDesc:'+0.25% Mythic Fish Chance'}),
      revered:        _tribeStage(6,'revered',        _OK,{bonus:{stat:'mythicFishChance',pct:0.25},rewardDesc:'+0.25% Mythic Fish Chance'}),
      exalted:        _tribeStage(6,'exalted',        _OK,{bonus:{stat:'mythicFishChance',pct:0.5},rewardDesc:'+0.5% Mythic Fish Chance — MAX'}),
    },
  },
  {
    id: 'topaz_riftborn', name: 'Topaz Riftborn', zone: 'topaz_rift',
    specialization: 'Expedition Speed', expectedCatchsPerSecond: 80000,
    bobber: 'topaz_rift_bobber', mythicFish: 'golden_fault_eel',
    stages: {
      initialRequest: _tribeStage(7,'initialRequest',_TR,{reward:'topaz_rift_bobber',rewardDesc:'Topaz Rift Bobber — unlocks Mythic catch'}),
      friendly:       _tribeStage(7,'friendly',      _TR,{bonus:{stat:'expeditionSpeed',pct:5},rewardDesc:'+5% Expedition Speed'}),
      honored:        _tribeStage(7,'honored',        _TR,{bonus:{stat:'expeditionSpeed',pct:5},rewardDesc:'+5% Expedition Speed'}),
      revered:        _tribeStage(7,'revered',        _TR,{bonus:{stat:'expeditionSpeed',pct:7.5},rewardDesc:'+7.5% Expedition Speed'}),
      exalted:        _tribeStage(7,'exalted',        _TR,{bonus:{stat:'expeditionSpeed',pct:10},rewardDesc:'+10% Expedition Speed — MAX'}),
    },
  },
  {
    id: 'sapphire_deepwatch', name: 'Sapphire Deepwatch', zone: 'sapphire_trench',
    specialization: 'Geode Find Rate', expectedCatchsPerSecond: 90000,
    bobber: 'sapphire_trench_bobber', mythicFish: 'sapphire_trench_warden',
    stages: {
      initialRequest: _tribeStage(8,'initialRequest',_SD,{reward:'sapphire_trench_bobber',rewardDesc:'Sapphire Trench Bobber — unlocks Mythic catch'}),
      friendly:       _tribeStage(8,'friendly',      _SD,{bonus:{stat:'geodeFindRate',pct:2},rewardDesc:'+2% Geode Find Rate'}),
      honored:        _tribeStage(8,'honored',        _SD,{bonus:{stat:'geodeFindRate',pct:2},rewardDesc:'+2% Geode Find Rate'}),
      revered:        _tribeStage(8,'revered',        _SD,{bonus:{stat:'geodeFindRate',pct:3},rewardDesc:'+3% Geode Find Rate'}),
      exalted:        _tribeStage(8,'exalted',        _SD,{bonus:{stat:'geodeFindRate',pct:5},rewardDesc:'+5% Geode Find Rate — MAX'}),
    },
  },
  {
    id: 'blue_diamond_ancients', name: 'Blue Diamond Ancients', zone: 'blue_diamond_sanctuary',
    specialization: 'Extra Geode Diamond Chance', expectedCatchsPerSecond: 100000,
    bobber: 'blue_diamond_bobber', mythicFish: 'heart_of_the_abyss',
    stages: {
      initialRequest: _tribeStage(9,'initialRequest',_BD,{reward:'blue_diamond_bobber',rewardDesc:'Blue Diamond Bobber — unlocks Mythic catch'}),
      friendly:       _tribeStage(9,'friendly',      _BD,{bonus:{stat:'geodeExtraDiamondChance',pct:2},rewardDesc:'+2% Extra Geode Diamond Chance'}),
      honored:        _tribeStage(9,'honored',        _BD,{bonus:{stat:'geodeExtraDiamondChance',pct:3},rewardDesc:'+3% Extra Geode Diamond Chance'}),
      revered:        _tribeStage(9,'revered',        _BD,{bonus:{stat:'geodeExtraDiamondChance',pct:5},rewardDesc:'+5% Extra Geode Diamond Chance'}),
      exalted:        _tribeStage(9,'exalted',        _BD,{bonus:{stat:'geodeExtraDiamondChance',pct:10},rewardDesc:'+10% Extra Geode Diamond Chance — MAX'}),
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
  return typeof getTribeExpeditionSpeedMultiplier === 'function' ? getTribeExpeditionSpeedMultiplier() : 1;
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
  var a = G.abyss;
  // Reset run-specific state
  a.tribeProgress      = {};
  a.mythicCatches      = {};
  a.tribeTrialProgress = {};
  a.tribeTrialCompleted = {};
  a.currentZone        = null;
  // Mark Trial of Return needed for all tribes that completed Initial Request
  var initDone = a.tribeInitialCompleted || {};
  a.tribeTrialNeeded = {};
  if (typeof ABYSS_TRIBES !== 'undefined') {
    ABYSS_TRIBES.forEach(function(t) {
      if (initDone[t.id]) a.tribeTrialNeeded[t.id] = true;
    });
  }
  // Reset current run (zone unlocks + mythic catches this run)
  a.currentRun = { unlockedZones: ['emerald_forest'], mythicCaughtThisRun: {} };
  // tribeReputation, tribeInitialCompleted, tribeBonusesClaimed, tribeBobbers, fishdex, geodes survive
  // Remove Abyss biome zones from active automation slots — run reset means they're no longer unlocked
  if (typeof ABYSS_ZONES !== 'undefined' && Array.isArray(G.activeAutomationZones)) {
    var _abyssIdSet = {};
    ABYSS_ZONES.forEach(function(z) { _abyssIdSet[z.id] = true; });
    G.activeAutomationZones = G.activeAutomationZones.filter(function(id) { return !_abyssIdSet[id]; });
  }
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
    </div>
    <div class="settings-info-row dim" style="margin-top:10px;margin-bottom:4px;"><strong>Abyss Tribes</strong></div>
    <div class="mael-debug-helpers">
      <button class="btn-secondary-sm" onclick="enterTribeMenu()">Open Tribe Menu</button>
      <button class="btn-secondary-sm" onclick="_debugTribeResetAll()">Reset All Tribes</button>
    </div>
    <div class="settings-info-row dim" style="margin-top:10px;margin-bottom:4px;"><strong>Abyss Fishing (Phase 7)</strong></div>
    <div class="mael-debug-helpers">
      <button class="btn-secondary-sm" onclick="_debugAbyssForceNormalCatch()">Force Catch</button>
      <button class="btn-secondary-sm" onclick="_debugAbyssSpawnMythic()">Spawn Mythic</button>
      <button class="btn-secondary-sm" onclick="_debugAbyssUnlockNextZone()">Unlock Next Zone</button>
      <button class="btn-secondary-sm" onclick="_debugAbyssResetRun()">Reset Run</button>
    </div>
    <div class="settings-info-row dim" style="margin-top:10px;margin-bottom:4px;"><strong>Abyss Geodes (Phase 8)</strong></div>
    <div class="settings-info-row dim" style="font-size:10px;margin-bottom:4px;opacity:0.6;">
      Owned: ${getGeodeOwnedCount()} · Base drop: ${(ABYSS_GEODE_BASE_DROP_CHANCE*100).toFixed(2)}%
      · Tribe mult: ${typeof getTribeGeodeFindRateMultiplier==='function'?getTribeGeodeFindRateMultiplier().toFixed(3):'1.000'}x
      · Extra ◆ chance: ${typeof getTribeExtraGeodeDiamondChance==='function'?(getTribeExtraGeodeDiamondChance()*100).toFixed(1):'0'}%
    </div>
    <div class="mael-debug-helpers">
      <button class="btn-secondary-sm" onclick="_debugAbyssAddGeode(1)">+1 Geode</button>
      <button class="btn-secondary-sm" onclick="_debugAbyssAddGeode(10)">+10 Geodes</button>
      <button class="btn-secondary-sm" onclick="_debugAbyssOpenGeodeForce()">Open (Random)</button>
      <button class="btn-secondary-sm" onclick="_debugAbyssOpenGeodeForce(1)">Force 1 ◆</button>
      <button class="btn-secondary-sm" onclick="_debugAbyssOpenGeodeForce(2)">Force 2 ◆</button>
      <button class="btn-secondary-sm" onclick="_debugAbyssOpenGeodeForce(3)">Force 3 ◆</button>
      <button class="btn-secondary-sm" onclick="_debugAbyssOpenGeodeForce(4)">Force 4 ◆ (max)</button>
      <button class="btn-secondary-sm" onclick="_debugAbyssResetGeodes()">Reset Geodes</button>
    </div>
    <div class="settings-info-row dim" style="margin-top:10px;margin-bottom:4px;"><strong>Abyss Automation (Phase 9)</strong></div>
    <div class="settings-info-row dim" style="font-size:10px;margin-bottom:4px;opacity:0.6;">
      Abyss catch/s: ${typeof getAbyssAutoCatchsPerSec==='function'?getAbyssAutoCatchsPerSec().toFixed(2):'0'} ·
      Active biomes: ${typeof getActiveAbyssZonesForAuto==='function'?getActiveAbyssZonesForAuto().length:'0'} ·
      Auto ◆/day: ${(ABYSS_GEODE_AUTO_PER_DAY*(typeof getTribeGeodeFindRateMultiplier==='function'?getTribeGeodeFindRateMultiplier():1)).toFixed(2)} ·
      Progress: ${typeof G!=='undefined'&&G.abyss&&G.abyss.geodes?((G.abyss.geodes.automationProgress||0)*100).toFixed(1):'0'}% ·
      Fish pile: ${typeof abyssFishPileTotal==='function'?abyssFishPileTotal():'0'} ·
      3rd slot: ${typeof G!=='undefined'&&G.thirdAutoSlotUnlocked?'YES':'NO'}
    </div>
    <div class="mael-debug-helpers">
      <button class="btn-secondary-sm" onclick="_debugSimAbyssAuto(60)">Sim 1 min</button>
      <button class="btn-secondary-sm" onclick="_debugSimAbyssAuto(3600)">Sim 1 hour</button>
      <button class="btn-secondary-sm" onclick="_debugSimAbyssAuto(86400)">Sim 24h</button>
      <button class="btn-secondary-sm" onclick="_debugAddAbyssGeodeAutoProgress(0.5)">+0.5 Auto ◆ Progress</button>
      <button class="btn-secondary-sm" onclick="_debugCompleteNextAutoGeode()">Complete Next ◆</button>
      <button class="btn-secondary-sm" onclick="_debugBuyThirdSlot()">Force 3rd Slot</button>
      <button class="btn-secondary-sm" onclick="_debugResetAbyssAutoState()">Reset Auto State</button>
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

// ─── ABYSS TRIBES (Phase 6) ──────────────────────────────────────────────────

let _tribeOpenId       = null;
let _tribeCompleteLock = false;

function _fmtAbyssQty(n) {
  if (n >= 1e12) return (n/1e12).toFixed(1) + 'T';
  if (n >= 1e9)  return (n/1e9).toFixed(1) + 'B';
  if (n >= 1e6)  return (n/1e6).toFixed(1) + 'M';
  if (n >= 1e3)  return (n/1e3).toFixed(1) + 'K';
  return String(n);
}

function _ensureAbyssTribeState() {
  if (!G.abyss) G.abyss = { currentZone:null, tribeReputation:{}, tribeProgress:{}, tribeBobbers:[], mythicCatches:{}, tribeInitialCompleted:{}, tribeBonusesClaimed:{}, tribeTrialNeeded:{}, tribeTrialProgress:{}, tribeTrialCompleted:{}, fishdex:{ fish:{}, crystals:{}, insects:{}, mythics:{}, geode:{ discovered:false, foundCount:0, openedCount:0 } } };
  var a = G.abyss;
  if (!a.tribeReputation)       a.tribeReputation       = {};
  if (!a.tribeProgress)         a.tribeProgress         = {};
  if (!a.tribeBobbers)          a.tribeBobbers          = [];
  if (!a.mythicCatches)         a.mythicCatches         = {};
  if (!a.tribeInitialCompleted) a.tribeInitialCompleted = {};
  if (!a.tribeBonusesClaimed)   a.tribeBonusesClaimed   = {};
  if (!a.tribeTrialNeeded)      a.tribeTrialNeeded      = {};
  if (!a.tribeTrialProgress)    a.tribeTrialProgress    = {};
  if (!a.tribeTrialCompleted)   a.tribeTrialCompleted   = {};
}

// ── State machine helpers ────────────────────────────────────────────────────
function getTribeReputation(tribeId) {
  _ensureAbyssTribeState();
  return G.abyss.tribeReputation[tribeId] || 'stranger';
}

function getActiveTribeRequestType(tribeId) {
  _ensureAbyssTribeState();
  var a        = G.abyss;
  var initDone = !!(a.tribeInitialCompleted[tribeId]);
  var trialNeed = !!(a.tribeTrialNeeded[tribeId]);
  var trialDone = !!(a.tribeTrialCompleted[tribeId]);
  var rep      = a.tribeReputation[tribeId] || 'stranger';
  if (initDone && trialNeed && !trialDone) return 'trialOfReturn';
  if (!initDone) return 'initialRequest';
  if (rep === 'exalted')  return 'none';
  if (rep === 'stranger') return 'friendly';
  if (rep === 'friendly') return 'honored';
  if (rep === 'honored')  return 'revered';
  if (rep === 'revered')  return 'exalted';
  return 'none';
}

function getTrialFishRequirements(tribeId) {
  var tribe = getAbyssTribe(tribeId);
  if (!tribe) return [];
  return tribe.stages.initialRequest.fish.map(function(f) {
    return { id: f.id, name: f.name, qty: Math.max(1, Math.ceil(f.qty * 0.25)) };
  });
}

function getActiveTribeRequestFish(tribeId) {
  var reqType = getActiveTribeRequestType(tribeId);
  if (reqType === 'none') return [];
  if (reqType === 'trialOfReturn') return getTrialFishRequirements(tribeId);
  var tribe = getAbyssTribe(tribeId);
  if (!tribe) return [];
  return (tribe.stages[reqType] || {}).fish || [];
}

function _getActiveTribeProgress(tribeId) {
  _ensureAbyssTribeState();
  var reqType = getActiveTribeRequestType(tribeId);
  if (reqType === 'none') return {};
  if (reqType === 'trialOfReturn') return G.abyss.tribeTrialProgress[tribeId] || {};
  return G.abyss.tribeProgress[tribeId] || {};
}

function isTribeRequestComplete(tribeId) {
  var fish = getActiveTribeRequestFish(tribeId);
  if (!fish.length) return false;
  var prog = _getActiveTribeProgress(tribeId);
  return fish.every(function(f) { return (prog[f.id] || 0) >= f.qty; });
}

function isTribeBobberOwned(tribeId) {
  _ensureAbyssTribeState();
  return G.abyss.tribeBobbers.indexOf(tribeId) >= 0;
}

function getTribeRequestProgress(tribeId) {
  var fish = getActiveTribeRequestFish(tribeId);
  if (!fish.length) return 0;
  var prog = _getActiveTribeProgress(tribeId);
  var total = 0, current = 0;
  fish.forEach(function(f) {
    total   += f.qty;
    current += Math.min(prog[f.id] || 0, f.qty);
  });
  return total > 0 ? current / total : 0;
}

function getActiveTribeRequestTitle(tribeId) {
  var reqType = getActiveTribeRequestType(tribeId);
  var titles = { initialRequest:'Initial Request', friendly:'Friendly Request', honored:'Honored Request', revered:'Revered Request', exalted:'Exalted Request', trialOfReturn:'Trial of Return' };
  return titles[reqType] || '';
}

// ── Progress recording ───────────────────────────────────────────────────────
function recordTribeFishCatch(fishId, amount) {
  if (!canAccessMaelstromAndAbyss()) return;
  if (!fishId) return;
  amount = Math.max(1, Math.floor(Number(amount) || 1));
  _ensureAbyssTribeState();
  var changed = false;
  var a = G.abyss;
  ABYSS_TRIBES.forEach(function(tribe) {
    var reqType = getActiveTribeRequestType(tribe.id);
    if (reqType === 'none') return;
    var reqFish, progStore;
    if (reqType === 'trialOfReturn') {
      reqFish = getTrialFishRequirements(tribe.id);
      if (!a.tribeTrialProgress[tribe.id]) a.tribeTrialProgress[tribe.id] = {};
      progStore = a.tribeTrialProgress[tribe.id];
    } else {
      reqFish = ((tribe.stages[reqType] || {}).fish || []);
      if (!a.tribeProgress[tribe.id]) a.tribeProgress[tribe.id] = {};
      progStore = a.tribeProgress[tribe.id];
    }
    reqFish.forEach(function(f) {
      if (f.id !== fishId) return;
      var cur    = progStore[fishId] || 0;
      var capped = Math.min(cur + amount, f.qty);
      if (capped > cur) { progStore[fishId] = capped; changed = true; }
    });
  });
  if (changed) {
    if (typeof saveState === 'function') saveState();
    var scr = document.getElementById('screen-abyss');
    if (scr && scr.classList.contains('active')) renderTribeMenu();
  }
}

// ── Request completion ───────────────────────────────────────────────────────
function _grantTribalBonus(tribeId, stageKey) {
  _ensureAbyssTribeState();
  var a = G.abyss;
  if (!a.tribeBonusesClaimed[tribeId]) a.tribeBonusesClaimed[tribeId] = {};
  if (a.tribeBonusesClaimed[tribeId][stageKey]) return;
  a.tribeBonusesClaimed[tribeId][stageKey] = true;
}

function completeTribeRequest(tribeId) {
  if (_tribeCompleteLock) return;
  if (!canAccessMaelstromAndAbyss()) return;
  if (!isTribeRequestComplete(tribeId)) return;
  _tribeCompleteLock = true;
  _ensureAbyssTribeState();
  var a       = G.abyss;
  var reqType = getActiveTribeRequestType(tribeId);
  if (reqType === 'none') { _tribeCompleteLock = false; return; }
  try {
    if (reqType === 'initialRequest') {
      if (a.tribeInitialCompleted[tribeId]) { _tribeCompleteLock = false; return; }
      a.tribeInitialCompleted[tribeId] = true;
      _awardTribeBobber(tribeId);
      a.tribeProgress[tribeId] = {};
    } else if (reqType === 'trialOfReturn') {
      if (a.tribeTrialCompleted[tribeId]) { _tribeCompleteLock = false; return; }
      a.tribeTrialCompleted[tribeId] = true;
      a.tribeTrialProgress[tribeId]  = {};
    } else {
      if (!a.tribeInitialCompleted[tribeId]) { _tribeCompleteLock = false; return; }
      _grantTribalBonus(tribeId, reqType);
      a.tribeReputation[tribeId] = reqType;
      a.tribeProgress[tribeId]   = {};
    }
    if (typeof saveState === 'function') saveState();
    if (typeof showStatus === 'function') showStatus('Request complete!', 1500);
    var scr = document.getElementById('screen-abyss');
    if (scr && scr.classList.contains('active')) renderTribeMenu();
  } finally {
    _tribeCompleteLock = false;
  }
}

// ── Bobber award ─────────────────────────────────────────────────────────────
function _awardTribeBobber(tribeId) {
  _ensureAbyssTribeState();
  var a = G.abyss;
  if (a.tribeBobbers.indexOf(tribeId) >= 0) return;
  a.tribeBobbers.push(tribeId);
  var tribe    = getAbyssTribe(tribeId);
  var bobberId = tribe ? tribe.bobber : null;
  if (bobberId) {
    if (!G.unlockedBobberCosmetics) G.unlockedBobberCosmetics = ['bc_basic'];
    if (G.unlockedBobberCosmetics.indexOf(bobberId) < 0) {
      G.unlockedBobberCosmetics.push(bobberId);
    }
  }
}

// ── Permanent bonus getters ──────────────────────────────────────────────────
var TRIBE_STAGES_ORDERED = ['friendly', 'honored', 'revered', 'exalted'];

function _sumTribeStat(stat) {
  if (!G.abyss || !G.abyss.tribeBonusesClaimed) return 0;
  var total = 0;
  ABYSS_TRIBES.forEach(function(tribe) {
    var claimed = G.abyss.tribeBonusesClaimed[tribe.id] || {};
    TRIBE_STAGES_ORDERED.forEach(function(stageKey) {
      if (!claimed[stageKey]) return;
      var stage = tribe.stages[stageKey];
      if (stage && stage.bonus && stage.bonus.stat === stat) total += (stage.bonus.pct || 0);
    });
  });
  return total;
}

function getTribeStorageMultiplier()          { return 1 + _sumTribeStat('storage')                / 100; }
function getTribeFishValueMultiplier()        { return 1 + _sumTribeStat('fishValue')              / 100; }
function getTribeAutomationSpeedMultiplier()  { return 1 + _sumTribeStat('automationSpeed')        / 100; }
function getTribeManualCatchSpeedMultiplier() { return 1 + _sumTribeStat('manualCatchSpeed')       / 100; }
function getTribeOfflineIncomeMultiplier()    { return 1 + _sumTribeStat('offlineIncome')          / 100; }
function getTribeRareChanceBonus()            { return     _sumTribeStat('rareEpicChance')         / 100; }
function getTribeMythicChanceBonus()          { return     _sumTribeStat('mythicFishChance')       / 100; }
function getTribeExpeditionSpeedMultiplier()  { return 1 + _sumTribeStat('expeditionSpeed')        / 100; }
function getTribeGeodeFindRateMultiplier()    { return 1 + _sumTribeStat('geodeFindRate')          / 100; }
function getTribeExtraGeodeDiamondChance()    { return     _sumTribeStat('geodeExtraDiamondChance') / 100; }

// ── Mythic eligibility (Phase 7 gate) ────────────────────────────────────────
function isAbyssMythicEligible(zoneId) {
  if (!canAccessMaelstromAndAbyss()) return false;
  _ensureAbyssTribeState();
  var a     = G.abyss;
  var tribe = getAbyssTribeForZone(zoneId);
  if (!tribe) return false;
  var tribeId = tribe.id;
  if (a.mythicCatches[tribeId]) return false;
  if (a.tribeBobbers.indexOf(tribeId) < 0) return false;
  if (a.tribeInitialCompleted[tribeId] && !a.tribeTrialNeeded[tribeId]) return true;
  if (a.tribeTrialNeeded[tribeId] && a.tribeTrialCompleted[tribeId]) return true;
  return false;
}

// ── Tribe bobbers in Diamond Store ───────────────────────────────────────────
function renderAbyssTribeBobbers() {
  if (!canAccessMaelstromAndAbyss()) return;
  _ensureAbyssTribeState();
  var owned = ABYSS_TRIBE_BOBBERS.filter(function(b) {
    return G.abyss.tribeBobbers.indexOf(b.tribe) >= 0;
  });
  if (!owned.length) return;
  var grid = document.getElementById('bobber-cosmetics-grid');
  if (!grid) return;
  var hdr = document.createElement('div');
  hdr.className = 'bobber-tribe-section-hdr';
  hdr.textContent = 'Abyss Tribe Bobbers';
  grid.appendChild(hdr);
  owned.forEach(function(bobberDef) {
    var equipped = G.equippedBobberCosmetic === bobberDef.id;
    var card = document.createElement('div');
    card.className = 'bobber-cosm-card' + (equipped ? ' equipped' : '');
    var imgWrap = document.createElement('div');
    imgWrap.className = 'bobber-cosm-img-wrap tribe-bobber-placeholder';
    imgWrap.textContent = bobberDef.name[0].toUpperCase();
    var label = document.createElement('div');
    label.className = 'bobber-cosm-name';
    label.textContent = bobberDef.name;
    var action = document.createElement('div');
    action.className = 'bobber-cosm-action';
    if (equipped) {
      action.innerHTML = '<span class="bobber-cosm-equipped-tag">Equipped</span>';
    } else {
      var btn = document.createElement('button');
      btn.className = 'btn-secondary-sm';
      btn.textContent = 'Equip';
      btn.onclick = (function(bid) { return function() {
        G.equippedBobberCosmetic = bid;
        if (typeof updateBobberImg === 'function') updateBobberImg();
        if (typeof saveState === 'function') saveState();
        if (typeof renderBobberCosmetics === 'function') renderBobberCosmetics();
      }; })(bobberDef.id);
      action.appendChild(btn);
    }
    card.appendChild(imgWrap);
    card.appendChild(label);
    card.appendChild(action);
    grid.appendChild(card);
  });
}

// ── Tribe UI ─────────────────────────────────────────────────────────────────
var TRIBE_REP_COLORS = { stranger:'#777', friendly:'#4caf50', honored:'#2196f3', revered:'#9c27b0', exalted:'#f4c430' };
var TRIBE_REP_LABELS = { stranger:'—', friendly:'Friendly', honored:'Honored', revered:'Revered', exalted:'★ Exalted (MAX)' };

function enterTribeMenu() {
  _tribeOpenId = null;
  if (typeof showScreen === 'function') showScreen('abyss');
}

function renderTribeMenu() {
  var el = document.getElementById('abyss-content');
  if (!el) return;
  if (!canAccessMaelstromAndAbyss()) return;
  var navBtn = document.querySelector('.hud-nav-btn[data-screen="abyss"] span');
  if (navBtn) navBtn.textContent = 'Tribes';
  var screenTitle = document.querySelector('#screen-abyss .panel-header h2');
  if (screenTitle) screenTitle.textContent = 'Abyss Tribes';
  el.innerHTML = '';
  if (_tribeOpenId) {
    _renderTribeDetail(_tribeOpenId, el);
  } else {
    _renderTribeList(el);
  }
}

function _renderTribeList(el) {
  _ensureAbyssTribeState();
  var bonusBar = document.createElement('div');
  bonusBar.className = 'tribe-bonus-summary';
  var storage   = Math.round(_sumTribeStat('storage')        * 10) / 10;
  var fishVal   = Math.round(_sumTribeStat('fishValue')      * 10) / 10;
  var autoSpeed = Math.round(_sumTribeStat('automationSpeed') * 10) / 10;
  bonusBar.innerHTML = storage || fishVal || autoSpeed
    ? '<span class="tribe-bonus-tag">Storage +' + storage + '%</span>' +
      '<span class="tribe-bonus-tag">Fish Value +' + fishVal + '%</span>' +
      '<span class="tribe-bonus-tag">Auto Speed +' + autoSpeed + '%</span>'
    : '<span style="opacity:0.5;font-size:11px;">Complete Tribe requests to earn permanent bonuses</span>';
  el.appendChild(bonusBar);
  ABYSS_TRIBES.forEach(function(tribe) { _renderTribeCard(tribe, el); });
}

function _renderTribeCard(tribe, container) {
  _ensureAbyssTribeState();
  var reqType  = getActiveTribeRequestType(tribe.id);
  var rep      = getTribeReputation(tribe.id);
  var pct      = Math.round(getTribeRequestProgress(tribe.id) * 100);
  var bobOwned = isTribeBobberOwned(tribe.id);
  var complete = isTribeRequestComplete(tribe.id);
  var isMax    = reqType === 'none' && rep === 'exalted';
  var repColor = TRIBE_REP_COLORS[rep] || '#777';
  var zone     = getAbyssZone(tribe.zone);
  var zoneName = zone ? zone.name : tribe.zone;

  var card = document.createElement('div');
  card.className = 'tribe-card' + (isMax ? ' tribe-card-max' : '');

  var title = document.createElement('div');
  title.className = 'tribe-card-title';
  title.innerHTML = '<span class="tribe-card-name">' + tribe.name + '</span>' +
    '<span class="tribe-card-rep" style="color:' + repColor + '">' + (TRIBE_REP_LABELS[rep] || rep) + '</span>';
  card.appendChild(title);

  var meta = document.createElement('div');
  meta.className = 'tribe-card-meta';
  meta.innerHTML = '<span class="tribe-card-biome">' + zoneName + '</span>' +
    (bobOwned ? '<span class="tribe-card-bobber">Bobber Owned</span>' : '');
  card.appendChild(meta);

  if (!isMax && reqType !== 'none') {
    var reqTitle = document.createElement('div');
    reqTitle.className = 'tribe-card-req-label';
    reqTitle.textContent = getActiveTribeRequestTitle(tribe.id);
    card.appendChild(reqTitle);

    var barWrap = document.createElement('div');
    barWrap.className = 'tribe-progress-bar-wrap';
    var bar = document.createElement('div');
    bar.className = 'tribe-progress-bar' + (complete ? ' complete' : '');
    bar.style.width = pct + '%';
    barWrap.appendChild(bar);
    card.appendChild(barWrap);

    var pctLabel = document.createElement('div');
    pctLabel.className = 'tribe-card-pct';
    pctLabel.textContent = pct + '% ' + (complete ? '— Ready to complete!' : '');
    card.appendChild(pctLabel);
  } else if (isMax) {
    var maxTag = document.createElement('div');
    maxTag.className = 'tribe-max-tag';
    maxTag.textContent = 'MAX — Exalted';
    card.appendChild(maxTag);
  }

  card.addEventListener('click', function() { _tribeOpenId = tribe.id; renderTribeMenu(); });
  container.appendChild(card);
}

function _renderTribeDetail(tribeId, el) {
  _ensureAbyssTribeState();
  var tribe = getAbyssTribe(tribeId);
  if (!tribe) { _tribeOpenId = null; renderTribeMenu(); return; }
  var a        = G.abyss;
  var reqType  = getActiveTribeRequestType(tribeId);
  var rep      = getTribeReputation(tribeId);
  var repColor = TRIBE_REP_COLORS[rep] || '#777';
  var reqFish  = getActiveTribeRequestFish(tribeId);
  var prog     = _getActiveTribeProgress(tribeId);
  var isMax    = reqType === 'none' && rep === 'exalted';
  var zone     = getAbyssZone(tribe.zone);
  var zoneName = zone ? zone.name : tribe.zone;
  var mythic   = getAbyssMythicFishForZone(tribe.zone);
  var mythicName = mythic ? mythic.name : '???';

  var backBtn = document.createElement('button');
  backBtn.className = 'btn-secondary-sm tribe-back-btn';
  backBtn.textContent = 'All Tribes';
  backBtn.addEventListener('click', function() { _tribeOpenId = null; renderTribeMenu(); });
  el.appendChild(backBtn);

  var header = document.createElement('div');
  header.className = 'tribe-detail-header';
  header.innerHTML =
    '<div class="tribe-portrait-placeholder">' + tribe.name[0].toUpperCase() + '</div>' +
    '<div class="tribe-detail-info">' +
      '<div class="tribe-detail-name">' + tribe.name + '</div>' +
      '<div class="tribe-detail-biome">' + zoneName + ' &bull; ' + tribe.specialization + '</div>' +
      '<div class="tribe-detail-rep" style="color:' + repColor + '">' + (TRIBE_REP_LABELS[rep] || rep) + '</div>' +
    '</div>';
  el.appendChild(header);

  var stagesEl = document.createElement('div');
  stagesEl.className = 'tribe-stages';
  var stageOrder  = ['initialRequest', 'friendly', 'honored', 'revered', 'exalted'];
  var stageLabels = { initialRequest:'Initial Request', friendly:'Friendly', honored:'Honored', revered:'Revered', exalted:'Exalted' };
  stageOrder.forEach(function(sk) {
    var stage = tribe.stages[sk];
    if (!stage) return;
    var isDone, isActive;
    if (sk === 'initialRequest') {
      isDone   = !!(a.tribeInitialCompleted[tribeId]);
      isActive = reqType === 'initialRequest';
    } else {
      var repRanks = ['stranger','friendly','honored','revered','exalted'];
      var skIdx  = repRanks.indexOf(sk);
      var curIdx = repRanks.indexOf(rep);
      isDone   = curIdx >= skIdx && skIdx > 0;
      isActive = reqType === sk;
    }
    var cls = isDone ? 'tribe-stage-row done' : isActive ? 'tribe-stage-row active' : 'tribe-stage-row locked';
    var row = document.createElement('div');
    row.className = cls;
    var desc = isDone && stage.rewardDesc ? stage.rewardDesc : '';
    row.innerHTML = '<span class="tribe-stage-dot">' + (isDone ? '✓' : isActive ? '▶' : '○') + '</span>' +
      '<span class="tribe-stage-label">' + stageLabels[sk] + '</span>' +
      (desc ? '<span class="tribe-stage-reward">' + desc + '</span>' : '');
    stagesEl.appendChild(row);
  });
  el.appendChild(stagesEl);

  if (a.tribeTrialNeeded[tribeId]) {
    var trialEl = document.createElement('div');
    var trialDone = !!(a.tribeTrialCompleted[tribeId]);
    trialEl.className = 'tribe-trial-row' + (trialDone ? ' done' : reqType === 'trialOfReturn' ? ' active' : '');
    trialEl.innerHTML = '<span class="tribe-stage-dot">' + (trialDone ? '✓' : reqType === 'trialOfReturn' ? '▶' : '○') + '</span>' +
      '<span class="tribe-stage-label">Trial of Return</span>' +
      (trialDone ? '<span class="tribe-stage-reward">Mythic eligible this run</span>' : '');
    el.appendChild(trialEl);
  }

  if (!isMax && reqType !== 'none') {
    var reqSection = document.createElement('div');
    reqSection.className = 'tribe-req-section';

    var overallPct = Math.round(getTribeRequestProgress(tribeId) * 100);
    var reqHdr = document.createElement('div');
    reqHdr.className = 'tribe-req-header';
    reqHdr.innerHTML = '<span>' + getActiveTribeRequestTitle(tribeId) + '</span><span class="tribe-req-pct">' + overallPct + '%</span>';
    reqSection.appendChild(reqHdr);

    var overallBarWrap = document.createElement('div');
    overallBarWrap.className = 'tribe-progress-bar-wrap';
    var overallBar = document.createElement('div');
    overallBar.className = 'tribe-progress-bar' + (overallPct >= 100 ? ' complete' : '');
    overallBar.style.width = overallPct + '%';
    overallBarWrap.appendChild(overallBar);
    reqSection.appendChild(overallBarWrap);

    reqFish.forEach(function(f) {
      var cur     = Math.min(prog[f.id] || 0, f.qty);
      var fishPct = Math.round(cur / f.qty * 100);
      var row = document.createElement('div');
      row.className = 'tribe-req-fish-row';
      row.innerHTML =
        '<div class="tribe-req-fish-name">' + f.name + '</div>' +
        '<div class="tribe-req-fish-bar-wrap"><div class="tribe-req-fish-bar" style="width:' + fishPct + '%;background:' + (fishPct >= 100 ? '#4caf50' : '#7ec8e3') + '"></div></div>' +
        '<div class="tribe-req-fish-count">' + _fmtAbyssQty(cur) + ' / ' + _fmtAbyssQty(f.qty) + '</div>';
      reqSection.appendChild(row);
    });

    var activeStage = tribe.stages[reqType];
    if (activeStage && activeStage.rewardDesc) {
      var rwdEl = document.createElement('div');
      rwdEl.className = 'tribe-req-reward';
      rwdEl.textContent = 'Reward: ' + activeStage.rewardDesc;
      reqSection.appendChild(rwdEl);
    }

    var complete = isTribeRequestComplete(tribeId);
    var completeBtn = document.createElement('button');
    completeBtn.className = 'tribe-complete-btn' + (complete ? ' ready' : ' locked');
    completeBtn.disabled = !complete;
    completeBtn.textContent = complete ? 'Complete Request' : 'Request in Progress';
    completeBtn.addEventListener('click', function() { completeTribeRequest(tribeId); });
    reqSection.appendChild(completeBtn);
    el.appendChild(reqSection);
  } else if (isMax) {
    var maxEl = document.createElement('div');
    maxEl.className = 'tribe-max-banner';
    maxEl.innerHTML = '<span>Exalted (MAX)</span><span style="opacity:0.7;font-size:12px;">All requests complete</span>';
    el.appendChild(maxEl);
  }

  var claimed = a.tribeBonusesClaimed[tribeId] || {};
  var earnedBonuses = TRIBE_STAGES_ORDERED.filter(function(sk) { return claimed[sk]; }).map(function(sk) {
    var stage = tribe.stages[sk];
    return stage && stage.rewardDesc ? stage.rewardDesc : '';
  }).filter(Boolean);
  if (earnedBonuses.length) {
    var bonusEl = document.createElement('div');
    bonusEl.className = 'tribe-bonuses-earned';
    bonusEl.innerHTML = '<div class="tribe-bonuses-title">Permanent Bonuses Earned</div>' +
      earnedBonuses.map(function(b) { return '<div class="tribe-bonus-earned-row">+ ' + b + '</div>'; }).join('');
    el.appendChild(bonusEl);
  }

  var mythicEl = document.createElement('div');
  mythicEl.className = 'tribe-mythic-row';
  var mythicEligible = isAbyssMythicEligible(tribe.zone);
  mythicEl.innerHTML = '<span class="tribe-mythic-label">Mythic:</span> <span>' + mythicName + '</span>' +
    '<span class="tribe-mythic-status ' + (mythicEligible ? 'eligible' : 'locked') + '">' +
    (a.mythicCatches[tribeId] ? '✓ Caught this run' : mythicEligible ? 'Eligible' : 'Not yet eligible') + '</span>';
  el.appendChild(mythicEl);

  if (isLocalAbyssDebugEnabled()) _renderTribeDebugPanel(tribeId, el);
}

function _renderTribeDebugPanel(tribeId, container) {
  var panel = document.createElement('div');
  panel.className = 'tribe-debug-panel';
  panel.innerHTML = '<div class="tribe-debug-title">Dev — Tribe Debug [LOCAL ONLY]</div>';

  var repRow = document.createElement('div');
  repRow.className = 'tribe-debug-row';
  ['stranger','friendly','honored','revered','exalted'].forEach(function(r) {
    var btn = document.createElement('button');
    btn.className = 'btn-secondary-sm';
    btn.textContent = 'Rep:' + r;
    btn.onclick = function() { _debugTribeSetReputation(tribeId, r); };
    repRow.appendChild(btn);
  });
  panel.appendChild(repRow);

  var btnRow = document.createElement('div');
  btnRow.className = 'tribe-debug-row';
  [
    { label:'+25% Progress', fn: function() { _debugTribeAddProgress(tribeId, 0.25); } },
    { label:'Instant Complete', fn: function() { _debugTribeComplete(tribeId); } },
    { label:'Reset Progress',   fn: function() { _debugTribeResetProgress(tribeId); } },
    { label:'Grant Bobber',     fn: function() { _debugTribeGrantBobber(tribeId); } },
    { label:'Activate Trial',   fn: function() { _debugTribeActivateTrialOfReturn(tribeId); } },
    { label:'Complete Trial',   fn: function() { _debugTribeCompleteTrialOfReturn(tribeId); } },
  ].forEach(function(r) {
    var btn = document.createElement('button');
    btn.className = 'btn-secondary-sm';
    btn.textContent = r.label;
    btn.addEventListener('click', r.fn);
    btnRow.appendChild(btn);
  });
  panel.appendChild(btnRow);
  container.appendChild(panel);
}

// ── Debug helpers ────────────────────────────────────────────────────────────
function _debugTribeAddProgress(tribeId, fraction) {
  if (!isLocalAbyssDebugEnabled()) return;
  _ensureAbyssTribeState();
  var reqFish = getActiveTribeRequestFish(tribeId);
  if (!reqFish.length) return;
  var reqType = getActiveTribeRequestType(tribeId);
  var a = G.abyss;
  var store;
  if (reqType === 'trialOfReturn') {
    if (!a.tribeTrialProgress[tribeId]) a.tribeTrialProgress[tribeId] = {};
    store = a.tribeTrialProgress[tribeId];
  } else {
    if (!a.tribeProgress[tribeId]) a.tribeProgress[tribeId] = {};
    store = a.tribeProgress[tribeId];
  }
  reqFish.forEach(function(f) {
    var add = Math.max(1, Math.ceil(f.qty * fraction));
    store[f.id] = Math.min((store[f.id] || 0) + add, f.qty);
  });
  if (typeof saveState === 'function') saveState();
  renderTribeMenu();
}

function _debugTribeComplete(tribeId) {
  if (!isLocalAbyssDebugEnabled()) return;
  _ensureAbyssTribeState();
  var reqFish = getActiveTribeRequestFish(tribeId);
  if (!reqFish.length) return;
  var reqType = getActiveTribeRequestType(tribeId);
  var a = G.abyss;
  var store;
  if (reqType === 'trialOfReturn') {
    if (!a.tribeTrialProgress[tribeId]) a.tribeTrialProgress[tribeId] = {};
    store = a.tribeTrialProgress[tribeId];
  } else {
    if (!a.tribeProgress[tribeId]) a.tribeProgress[tribeId] = {};
    store = a.tribeProgress[tribeId];
  }
  reqFish.forEach(function(f) { store[f.id] = f.qty; });
  completeTribeRequest(tribeId);
}

function _debugTribeResetProgress(tribeId) {
  if (!isLocalAbyssDebugEnabled()) return;
  _ensureAbyssTribeState();
  G.abyss.tribeProgress[tribeId]      = {};
  G.abyss.tribeTrialProgress[tribeId] = {};
  if (typeof saveState === 'function') saveState();
  renderTribeMenu();
}

function _debugTribeSetReputation(tribeId, rank) {
  if (!isLocalAbyssDebugEnabled()) return;
  _ensureAbyssTribeState();
  G.abyss.tribeReputation[tribeId] = rank;
  if (rank !== 'stranger') G.abyss.tribeInitialCompleted[tribeId] = true;
  if (typeof saveState === 'function') saveState();
  renderTribeMenu();
}

function _debugTribeGrantBobber(tribeId) {
  if (!isLocalAbyssDebugEnabled()) return;
  _awardTribeBobber(tribeId);
  if (typeof saveState === 'function') saveState();
  renderTribeMenu();
}

function _debugTribeActivateTrialOfReturn(tribeId) {
  if (!isLocalAbyssDebugEnabled()) return;
  _ensureAbyssTribeState();
  G.abyss.tribeTrialNeeded[tribeId]    = true;
  G.abyss.tribeTrialCompleted[tribeId] = false;
  G.abyss.tribeTrialProgress[tribeId]  = {};
  if (typeof saveState === 'function') saveState();
  renderTribeMenu();
}

function _debugTribeCompleteTrialOfReturn(tribeId) {
  if (!isLocalAbyssDebugEnabled()) return;
  _ensureAbyssTribeState();
  if (!G.abyss.tribeTrialNeeded[tribeId]) G.abyss.tribeTrialNeeded[tribeId] = true;
  var reqFish = getTrialFishRequirements(tribeId);
  if (!G.abyss.tribeTrialProgress[tribeId]) G.abyss.tribeTrialProgress[tribeId] = {};
  reqFish.forEach(function(f) { G.abyss.tribeTrialProgress[tribeId][f.id] = f.qty; });
  completeTribeRequest(tribeId);
}

function _debugTribeResetAll() {
  if (!isLocalAbyssDebugEnabled()) return;
  if (!confirm('Reset ALL Tribe state? This does NOT affect Fishdex or Maelstrom.')) return;
  _ensureAbyssTribeState();
  var a = G.abyss;
  a.tribeReputation       = {};
  a.tribeProgress         = {};
  a.tribeBobbers          = [];
  a.mythicCatches         = {};
  a.tribeInitialCompleted = {};
  a.tribeBonusesClaimed   = {};
  a.tribeTrialNeeded      = {};
  a.tribeTrialProgress    = {};
  a.tribeTrialCompleted   = {};
  var tribeBobbedIds = ABYSS_TRIBE_BOBBERS.map(function(b) { return b.id; });
  if (G.unlockedBobberCosmetics) {
    G.unlockedBobberCosmetics = G.unlockedBobberCosmetics.filter(function(id) {
      return tribeBobbedIds.indexOf(id) < 0;
    });
    if (G.unlockedBobberCosmetics.indexOf('bc_basic') < 0) G.unlockedBobberCosmetics.push('bc_basic');
  }
  if (tribeBobbedIds.indexOf(G.equippedBobberCosmetic) >= 0) G.equippedBobberCosmetic = 'bc_basic';
  if (typeof saveState === 'function') saveState();
  _tribeOpenId = null;
  renderTribeMenu();
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 7 — ABYSS FISHING LOOP, MYTHIC FISH ENCOUNTER, LINEAR ZONE PROGRESSION
// ═══════════════════════════════════════════════════════════════════════════════

// ─── CONFIG ──────────────────────────────────────────────────────────────────

var ABYSS_MYTHIC_TAPS      = 75;    // Fish Fight taps required for Mythic fish
var ABYSS_MYTHIC_DURATION  = 30000; // Fish Fight time limit for Mythic (30s)
var ABYSS_MYTHIC_CHANCE    = 0.05;  // Base 5% spawn chance per cast when eligible
var ABYSS_MYTHIC_CHANCE_MAX = 0.20; // Clamped maximum

var ABYSS_LOOT_WEIGHTS = { fish: 60, crystal: 25, insect: 15 };

// ─── RUN STATE ───────────────────────────────────────────────────────────────

function _ensureAbyssRunState() {
  _ensureAbyssTribeState();
  var a = G.abyss;
  if (!a.currentRun) a.currentRun = { unlockedZones: ['emerald_forest'], mythicCaughtThisRun: {} };
  if (!Array.isArray(a.currentRun.unlockedZones)) a.currentRun.unlockedZones = ['emerald_forest'];
  if (!a.currentRun.mythicCaughtThisRun) a.currentRun.mythicCaughtThisRun = {};
  if (a.currentRun.unlockedZones.indexOf('emerald_forest') < 0) a.currentRun.unlockedZones.unshift('emerald_forest');
}

function isAbyssZoneUnlockedThisRun(zoneId) {
  if (!G.abyss || !G.abyss.currentRun) return zoneId === 'emerald_forest';
  return G.abyss.currentRun.unlockedZones.indexOf(zoneId) >= 0;
}

function unlockNextAbyssZone(currentZoneId) {
  _ensureAbyssRunState();
  var zone = getAbyssZone(currentZoneId);
  if (!zone || !zone.nextZone) return;
  var next = zone.nextZone;
  if (G.abyss.currentRun.unlockedZones.indexOf(next) >= 0) return;
  G.abyss.currentRun.unlockedZones.push(next);
  if (typeof saveState === 'function') saveState();
  var nextDef = getAbyssZone(next);
  if (typeof showStatus === 'function') showStatus('New zone unlocked: ' + (nextDef ? nextDef.name : next) + '!', 3000);
}

// ─── LOOT TABLE ──────────────────────────────────────────────────────────────

function rollAbyssCatch(zoneId) {
  var zone = getAbyssZone(zoneId);
  if (!zone) return null;
  var total = ABYSS_LOOT_WEIGHTS.fish + ABYSS_LOOT_WEIGHTS.crystal + ABYSS_LOOT_WEIGHTS.insect;
  var r = Math.random() * total;
  var category, pool, db;
  if (r < ABYSS_LOOT_WEIGHTS.fish) {
    category = 'fish'; pool = zone.fish; db = ABYSS_FISH_DB;
  } else if (r < ABYSS_LOOT_WEIGHTS.fish + ABYSS_LOOT_WEIGHTS.crystal) {
    category = 'crystal'; pool = zone.crystals; db = ABYSS_CRYSTAL_DB;
  } else {
    category = 'insect'; pool = zone.insects; db = ABYSS_INSECT_DB;
  }
  if (!pool || !pool.length) return null;
  var id  = pool[Math.floor(Math.random() * pool.length)];
  var def = db.find(function(e) { return e.id === id; }) || null;
  return { category: category, id: id, name: def ? def.name : id, zoneId: zoneId, img: def ? def.img : null };
}

// ─── MYTHIC SPAWN CHANCE ─────────────────────────────────────────────────────

function getAbyssMythicSpawnChance() {
  var bonus = typeof getTribeMythicChanceBonus === 'function' ? getTribeMythicChanceBonus() : 0;
  return Math.min(ABYSS_MYTHIC_CHANCE + bonus, ABYSS_MYTHIC_CHANCE_MAX);
}

// ─── CATCH RESOLVER ──────────────────────────────────────────────────────────
// Called from game.js tapBobber() when G.currentWorld === 'abyss'.

function resolveAbyssCatch(zoneId) {
  if (!canAccessMaelstromAndAbyss() || !zoneId) {
    if (typeof resetFishingState === 'function') resetFishingState();
    return;
  }
  _ensureAbyssRunState();

  var tribe   = getAbyssTribeForZone(zoneId);
  var tribeId = tribe ? tribe.id : null;
  var alreadyCaught = tribeId && G.abyss.currentRun.mythicCaughtThisRun[tribeId];

  if (!alreadyCaught && isAbyssMythicEligible(zoneId)) {
    if (Math.random() < getAbyssMythicSpawnChance()) {
      _startAbyssMythicFight(zoneId);
      return;
    }
  }

  // Geode drop — lower priority than Mythic; replaces normal catch if triggered.
  var _geodeChance = getAbyssGeodeDropChance('manual');
  if (_geodeChance > 0 && Math.random() < _geodeChance) {
    _awardAbyssGeode();
    return;
  }

  var catchObj = rollAbyssCatch(zoneId);
  if (!catchObj) { if (typeof resetFishingState === 'function') resetFishingState(); return; }

  if (catchObj.category === 'fish')    recordAbyssFishCatch(catchObj.id, 1);
  if (catchObj.category === 'crystal') recordAbyssCrystalFound(catchObj.id, 1);
  if (catchObj.category === 'insect')  recordAbyssInsectFound(catchObj.id, 1);

  showAbyssCatchPopup(catchObj);
}

// ─── ABYSS CATCH POPUP ───────────────────────────────────────────────────────

function showAbyssCatchPopup(catchObj) {
  var popup = document.getElementById('abyss-catch-popup');
  if (!popup) { if (typeof resetFishingState === 'function') resetFishingState(); return; }
  var zone   = getAbyssZone(catchObj.zoneId);
  var color  = catchObj.category === 'fish' ? '#4dd0e1' : catchObj.category === 'crystal' ? '#ce93d8' : '#a5d6a7';
  var label  = catchObj.category === 'fish' ? 'ABYSS FISH' : catchObj.category === 'crystal' ? 'CRYSTAL' : 'INSECT';

  var badge  = document.getElementById('acp-badge');
  var nameEl = document.getElementById('acp-name');
  var zoneEl = document.getElementById('acp-zone');
  var btn    = document.getElementById('acp-ok');

  if (badge)  { badge.textContent = label; badge.style.color = color; }
  if (nameEl) nameEl.textContent = catchObj.name;
  if (zoneEl) { zoneEl.textContent = zone ? zone.name : catchObj.zoneId; zoneEl.style.color = zone ? zone.themeColor : '#7ec8e3'; }
  if (btn)    { btn.disabled = true; setTimeout(function() { btn.disabled = false; }, 600); }

  popup.classList.remove('hidden');
  if (typeof fishingState !== 'undefined') fishingState = 'result';
}

function dismissAbyssCatchPopup() {
  var popup = document.getElementById('abyss-catch-popup');
  if (popup) popup.classList.add('hidden');
  if (typeof resetFishingState === 'function') resetFishingState();
}

// ─── MYTHIC FISH FIGHT ────────────────────────────────────────────────────────

function _startAbyssMythicFight(zoneId) {
  var mythicDef = getAbyssMythicFishForZone(zoneId);
  if (!mythicDef || typeof startFishFight !== 'function') {
    if (typeof resetFishingState === 'function') resetFishingState();
    return;
  }
  var tribe = getAbyssTribeForZone(zoneId);
  var catchObj = {
    fishId:        mythicDef.id,
    name:          mythicDef.name,
    img:           mythicDef.img || null,
    rarity:        'mythic',
    value:         0,
    isAbyssMythic: true,
    _ffRequired:   ABYSS_MYTHIC_TAPS,
    _ffDuration:   ABYSS_MYTHIC_DURATION,
    _abyssOnWin:   function() { _onAbyssMythicWin(zoneId, tribe ? tribe.id : null, mythicDef); },
    _abyssOnLoss:  function() { _onAbyssMythicLoss(zoneId); },
  };
  if (typeof showStatus === 'function') showStatus('MYTHIC FISH ENCOUNTERED — ' + mythicDef.name + '!', 2000);
  startFishFight(catchObj);
}

function _onAbyssMythicWin(zoneId, tribeId, mythicDef) {
  _ensureAbyssRunState();
  if (tribeId) {
    G.abyss.currentRun.mythicCaughtThisRun[tribeId] = true;
    G.abyss.mythicCatches[tribeId] = true;
  }
  if (mythicDef) recordAbyssMythicCatch(mythicDef.id, 1);
  unlockNextAbyssZone(zoneId);
  if (typeof saveState === 'function') saveState();
  _showAbyssMythicResult(zoneId, mythicDef);
}

function _onAbyssMythicLoss(zoneId) {
  if (typeof showStatus === 'function') showStatus('The mythic fish escaped... try again!', 2500);
  if (typeof resetFishingState === 'function') resetFishingState();
}

function _showAbyssMythicResult(zoneId, mythicDef) {
  var popup = document.getElementById('abyss-catch-popup');
  if (!popup) { if (typeof resetFishingState === 'function') resetFishingState(); return; }
  var zone   = getAbyssZone(zoneId);
  var badge  = document.getElementById('acp-badge');
  var nameEl = document.getElementById('acp-name');
  var zoneEl = document.getElementById('acp-zone');
  var btn    = document.getElementById('acp-ok');
  if (badge)  { badge.textContent = 'MYTHIC CAUGHT!'; badge.style.color = '#ffd700'; }
  if (nameEl) nameEl.textContent = mythicDef ? mythicDef.name : 'Mythic Fish';
  if (zoneEl) { zoneEl.textContent = (zone ? zone.name : zoneId) + ' — next zone unlocked!'; zoneEl.style.color = '#ffd700'; }
  if (btn)    { btn.disabled = true; setTimeout(function() { btn.disabled = false; }, 800); }
  popup.classList.remove('hidden');
  if (typeof fishingState !== 'undefined') fishingState = 'result';
}

// ─── ZONE SELECTOR (replaces Phase 4 data inspector as the Abyss screen) ─────

function renderAbyssDebug() {
  if (!canAccessMaelstromAndAbyss()) { if (typeof showScreen === 'function') showScreen('fishing'); return; }
  renderAbyssZoneSelector();
}

function renderAbyssZoneSelector() {
  if (!canAccessMaelstromAndAbyss()) return;
  _ensureAbyssRunState();
  var el = document.getElementById('expansion-abyss-content');
  if (!el) return;

  var currentZoneId = getCurrentAbyssZone();

  var rows = ABYSS_ZONES.map(function(z) {
    var unlocked  = isAbyssZoneUnlockedThisRun(z.id);
    var isCurrent = currentZoneId === z.id;
    var tribe     = getAbyssTribeForZone(z.id);
    var tribeId   = tribe ? tribe.id : null;
    var bobberOwned = tribeId ? isTribeBobberOwned(tribeId) : false;
    var mythicDone  = tribeId && G.abyss.currentRun.mythicCaughtThisRun[tribeId];
    var mythicElig  = unlocked && isAbyssMythicEligible(z.id);
    var fd = G.abyss.fishdex || {};
    var fishDisc   = (z.fish    ||[]).filter(function(id){ return fd.fish    &&fd.fish[id]    &&fd.fish[id].discovered;    }).length;
    var crystDisc  = (z.crystals||[]).filter(function(id){ return fd.crystals&&fd.crystals[id]&&fd.crystals[id].discovered; }).length;
    var insectDisc = (z.insects ||[]).filter(function(id){ return fd.insects &&fd.insects[id] &&fd.insects[id].discovered;  }).length;
    var mythicDisc = z.mythicFish&&fd.mythics&&fd.mythics[z.mythicFish]&&fd.mythics[z.mythicFish].discovered ? 1 : 0;
    var totalDisc  = fishDisc + crystDisc + insectDisc + mythicDisc;
    var totalItems = (z.fish||[]).length + (z.crystals||[]).length + (z.insects||[]).length + (z.mythicFish ? 1 : 0);

    if (!unlocked) {
      var prevDef    = z.previousZone ? getAbyssZone(z.previousZone) : null;
      var prevMythic = prevDef ? getAbyssMythicFishForZone(z.previousZone) : null;
      return '<div class="abyss-zone-card locked" style="border-color:' + z.themeColor + '55;">' +
        '<div class="azc-header"><span class="azc-order" style="color:' + z.themeColor + '80;">Zone ' + z.order + '</span>' +
        '<span class="azc-name locked-name">' + z.name + '</span></div>' +
        '<div class="azc-lock-note">Catch ' + (prevMythic ? prevMythic.name : 'previous Mythic') + ' to unlock</div>' +
      '</div>';
    }

    var statusBadge = '';
    if (mythicDone)       statusBadge = '<span class="abyss-zone-badge done">Mythic Caught</span>';
    else if (mythicElig)  statusBadge = '<span class="abyss-zone-badge eligible">Mythic Eligible</span>';

    return '<div class="abyss-zone-card' + (isCurrent ? ' active-zone' : '') + '" style="border-color:' + z.themeColor + ';cursor:pointer;" onclick="enterAbyssZoneForFishing(\'' + z.id + '\')">' +
      '<div class="azc-header">' +
        '<span class="azc-order" style="color:' + z.themeColor + '">Zone ' + z.order + '</span>' +
        '<span class="azc-name">' + z.name + '</span>' + statusBadge +
      '</div>' +
      '<div class="azc-meta">' +
        '<span>Dex: ' + totalDisc + '/' + totalItems + '</span>' +
        (bobberOwned ? '<span class="azc-bobber-tag">Bobber</span>' : '<span class="azc-no-bobber">No Bobber</span>') +
        (mythicElig && !mythicDone ? '<span class="azc-mythic-chance">5% Mythic</span>' : '') +
      '</div>' +
      '<div class="azc-tribe">Tribe: ' + (tribe ? tribe.name : z.tribe) + '</div>' +
    '</div>';
  }).join('');

  el.innerHTML =
    '<div class="abyss-zone-sel">' +
      '<div class="azs-header">Choose a Zone</div>' +
      '<div class="azs-subtext">Catch each zone\'s Mythic fish to unlock the next.</div>' +
      '<div class="abyss-zone-grid">' + rows + '</div>' +
      '<div class="expansion-dev-controls" style="margin-top:12px;">' +
        '<button class="btn-secondary expansion-return-btn" onclick="enterMaelstromDebug()">Return to Maelstrom</button>' +
        '<button class="btn-secondary expansion-return-btn" onclick="leaveExpansionWorld()">Leave Abyss</button>' +
      '</div>' +
      (isLocalAbyssDebugEnabled() ? _renderAbyssZoneDebugPanel() : '') +
    '</div>';
}

// ─── ZONE ENTRY ──────────────────────────────────────────────────────────────

function enterAbyssZoneForFishing(zoneId) {
  if (!canAccessMaelstromAndAbyss()) return;
  _ensureAbyssRunState();
  if (!isAbyssZoneUnlockedThisRun(zoneId)) {
    if (typeof showStatus === 'function') showStatus('Zone not unlocked this run.', 1500);
    return;
  }
  _stopMaelstromUITimer();
  G.currentWorld = 'abyss';
  G.abyss.currentZone = zoneId;
  var zone = getAbyssZone(zoneId);
  var hudZone = document.getElementById('hud-zone');
  if (hudZone && zone) hudZone.textContent = zone.name;
  if (typeof saveState === 'function') saveState();
  if (typeof showScreen === 'function') showScreen('fishing');
  if (typeof showStatus === 'function') showStatus('Entered ' + (zone ? zone.name : zoneId) + ' — tap to cast!', 2000);
}

// ─── DEBUG PANEL ─────────────────────────────────────────────────────────────

function _renderAbyssZoneDebugPanel() {
  var zoneId = getCurrentAbyssZone() || 'emerald_forest';
  return '<div class="mael-debug-helpers" style="margin-top:10px;">' +
    '<div style="font-size:11px;margin-bottom:4px;opacity:0.7;">Active zone: <strong>' + zoneId + '</strong></div>' +
    '<button class="btn-secondary-sm" onclick="_debugAbyssForceNormalCatch()">Force Normal Catch</button>' +
    '<button class="btn-secondary-sm" onclick="_debugAbyssSpawnMythic()">Spawn Mythic</button>' +
    '<button class="btn-secondary-sm" onclick="_debugAbyssUnlockNextZone()">Unlock Next Zone</button>' +
    '<button class="btn-secondary-sm" onclick="_debugAbyssResetRun()">Reset Run</button>' +
  '</div>';
}

function _debugAbyssForceNormalCatch() {
  if (!isLocalAbyssDebugEnabled()) return;
  var zoneId = getCurrentAbyssZone();
  if (!zoneId) { if (typeof showStatus === 'function') showStatus('Enter a zone first.', 1500); return; }
  var c = rollAbyssCatch(zoneId);
  if (!c) return;
  if (c.category === 'fish')    recordAbyssFishCatch(c.id, 1);
  if (c.category === 'crystal') recordAbyssCrystalFound(c.id, 1);
  if (c.category === 'insect')  recordAbyssInsectFound(c.id, 1);
  showAbyssCatchPopup(c);
}

function _debugAbyssSpawnMythic() {
  if (!isLocalAbyssDebugEnabled()) return;
  var zoneId = getCurrentAbyssZone();
  if (!zoneId) { if (typeof showStatus === 'function') showStatus('Enter a zone first.', 1500); return; }
  _startAbyssMythicFight(zoneId);
}

function _debugAbyssUnlockNextZone() {
  if (!isLocalAbyssDebugEnabled()) return;
  var zoneId = getCurrentAbyssZone();
  if (!zoneId) zoneId = (G.abyss && G.abyss.currentRun && G.abyss.currentRun.unlockedZones.slice(-1)[0]) || 'emerald_forest';
  unlockNextAbyssZone(zoneId);
  renderAbyssZoneSelector();
}

function _debugAbyssResetRun() {
  if (!isLocalAbyssDebugEnabled()) return;
  if (!confirm('Reset Abyss run? (zone unlocks + mythic catches this run only)')) return;
  _ensureAbyssRunState();
  G.abyss.currentRun = { unlockedZones: ['emerald_forest'], mythicCaughtThisRun: {} };
  if (typeof saveState === 'function') saveState();
  if (typeof showStatus === 'function') showStatus('Run reset.', 1500);
  renderAbyssZoneSelector();
}

// ─── PHASE 8 — UNIVERSAL GEODE SYSTEM ────────────────────────────────────────
// Target: ~10 Geodes/day from manual Abyss fishing.
// Assumptions: ~2 h active Abyss play/day at ~1 cast per 5 s → 1440 catches/day.
// Base chance: 10 / 1440 ≈ 0.694% → ABYSS_GEODE_BASE_DROP_CHANCE = 0.007.
// Tribe Geode Find Rate bonus (Sapphire Deepwatch, max +12%) applied multiplicatively.
// Automation balance deferred to Phase 9; getAbyssGeodeDropChance('automation') returns 0.

var ABYSS_GEODE_BASE_DROP_CHANCE = 0.007;  // ~0.7% per manual Abyss catch
var ABYSS_GEODE_OPEN_REVEAL_MS   = 1500;   // ms before reward reveals in popup

var _geodeOpeningInProgress = false;

// ── State helper ──────────────────────────────────────────────────────────────
// Authoritative inventory  : G.abyss.geodes.owned (unbounded int)
// Authoritative found/opened: G.abyss.fishdex.geode.foundCount / openedCount (Phase 5)
// Unique to Phase 8        : G.abyss.geodes.totalDiamondsEarned

function _ensureAbyssGeodeInventory() {
  if (!G.abyss) G.abyss = {};
  if (!G.abyss.geodes || typeof G.abyss.geodes !== 'object') G.abyss.geodes = {};
  var inv = G.abyss.geodes;
  if (typeof inv.owned !== 'number'               || !isFinite(inv.owned)               || inv.owned < 0)               inv.owned               = 0;
  if (typeof inv.totalDiamondsEarned !== 'number' || !isFinite(inv.totalDiamondsEarned) || inv.totalDiamondsEarned < 0) inv.totalDiamondsEarned = 0;
  inv.owned               = Math.floor(inv.owned);
  inv.totalDiamondsEarned = Math.floor(inv.totalDiamondsEarned);
}

function getGeodeOwnedCount() {
  if (!G.abyss || !G.abyss.geodes) return 0;
  var n = G.abyss.geodes.owned;
  return (typeof n === 'number' && isFinite(n) && n > 0) ? Math.floor(n) : 0;
}

// ── Drop chance calculator ────────────────────────────────────────────────────
// Centralized so manual and future automation (Phase 9) share one source.

function getAbyssGeodeDropChance(context) {
  if (context === 'automation') {
    // Phase 9 — automation uses a separate time-normalized model; return 0 for now.
    return 0;
  }
  // Manual fishing: base × Sapphire Deepwatch Geode Find Rate multiplier.
  var mult = typeof getTribeGeodeFindRateMultiplier === 'function'
    ? getTribeGeodeFindRateMultiplier() : 1;
  return ABYSS_GEODE_BASE_DROP_CHANCE * mult;
}

// ── Drop award ────────────────────────────────────────────────────────────────

function _awardAbyssGeode() {
  _ensureAbyssGeodeInventory();
  _ensureAbyssFishdexState();
  G.abyss.geodes.owned++;
  recordAbyssGeodeFound(1);
  if (typeof saveState         === 'function') saveState();
  if (typeof resetFishingState === 'function') resetFishingState();
  if (typeof showStatus        === 'function') showStatus('Abyss Geode found! Open it in the Market.', 2500);
}

// ── Reward generation ─────────────────────────────────────────────────────────
// base:  uniform integer in [diamondMin, diamondMax] = [1, 3].
// extra: +1 Diamond if Blue Diamond Ancients geodeExtraDiamondChance roll passes.
// Max:   4 Diamonds (3 base + 1 extra at max Tribe stage).
// Reward generated BEFORE decrement so a crash during popup cannot grant twice.

function _generateGeodeReward() {
  var min  = (ABYSS_UNIVERSAL_GEODE && ABYSS_UNIVERSAL_GEODE.diamondMin) || 1;
  var max  = (ABYSS_UNIVERSAL_GEODE && ABYSS_UNIVERSAL_GEODE.diamondMax) || 3;
  var base = Math.floor(Math.random() * (max - min + 1)) + min;
  var extra = 0;
  var extraChance = typeof getTribeExtraGeodeDiamondChance === 'function'
    ? getTribeExtraGeodeDiamondChance() : 0;
  if (extraChance > 0 && Math.random() < extraChance) extra = 1;
  return { diamonds: base + extra, base: base, extra: extra > 0 };
}

// ── Opening transaction ───────────────────────────────────────────────────────
// Atomic order: validate → generate reward → guard → decrement → grant Diamonds
//               → update stats → save → popup.
// Diamonds granted before popup so a crash does not lose the reward silently.

function openAbyssGeode() {
  if (!canAccessMaelstromAndAbyss()) return;
  if (_geodeOpeningInProgress)       return;
  _ensureAbyssGeodeInventory();
  var inv = G.abyss.geodes;
  if (inv.owned <= 0) {
    if (typeof showStatus === 'function') showStatus('No Geodes to open.', 1200);
    return;
  }

  var reward = _generateGeodeReward();

  _geodeOpeningInProgress     = true;
  inv.owned                   = Math.max(0, inv.owned - 1);
  G.diamonds                  = (G.diamonds || 0) + reward.diamonds;
  inv.totalDiamondsEarned     = (inv.totalDiamondsEarned || 0) + reward.diamonds;
  recordAbyssGeodeOpened(1);
  if (typeof saveState  === 'function') saveState();
  if (typeof updateHUD  === 'function') updateHUD();

  showGeodeOpenPopup(reward);
}

// ── Opening popup ─────────────────────────────────────────────────────────────

function showGeodeOpenPopup(reward) {
  var overlay = document.getElementById('geode-open-overlay');
  if (!overlay) {
    _geodeOpeningInProgress = false;
    return;
  }
  var revealEl  = document.getElementById('geode-reward-reveal');
  var contentEl = document.getElementById('geode-reward-content');

  if (revealEl) revealEl.classList.add('hidden');
  overlay.classList.remove('hidden');

  if (contentEl) {
    var bonusLine = reward.extra
      ? '<div class="geode-reward-bonus">+ Tribe Bonus!</div>' : '';
    contentEl.innerHTML =
      '<div class="geode-reward-diamonds">+' + reward.diamonds +
      ' <img src="img/icons/Diamond icon.png" class="diamond-icon-sm" alt=""> Diamond' +
      (reward.diamonds !== 1 ? 's' : '') + '</div>' + bonusLine;
  }

  setTimeout(function() {
    var el = document.getElementById('geode-reward-reveal');
    if (el) el.classList.remove('hidden');
  }, ABYSS_GEODE_OPEN_REVEAL_MS);
}

function dismissGeodeOpenPopup() {
  var overlay = document.getElementById('geode-open-overlay');
  if (overlay) overlay.classList.add('hidden');
  _geodeOpeningInProgress = false;
  if (typeof renderMarket === 'function') {
    var ms = document.getElementById('screen-market');
    if (ms && ms.classList.contains('active')) renderMarket();
  }
  if (typeof renderAbyssFishdex === 'function') {
    var as = document.getElementById('screen-abyss');
    if (as && as.classList.contains('active')) renderAbyssFishdex();
  }
}

// ── Phase 8 debug helpers ─────────────────────────────────────────────────────
// Guarded by isLocalAbyssDebugEnabled(). No effect on Sunken Treasure.
// All forced-reward paths call the production opening flow (_geodeOpeningInProgress, saveState).

function _debugAbyssAddGeode(qty) {
  if (!isLocalAbyssDebugEnabled()) return;
  qty = qty || 1;
  _ensureAbyssGeodeInventory();
  _ensureAbyssFishdexState();
  G.abyss.geodes.owned += qty;
  recordAbyssGeodeFound(qty);
  if (typeof saveState  === 'function') saveState();
  if (typeof showStatus === 'function') showStatus('Debug: +' + qty + ' Geode(s). Owned: ' + G.abyss.geodes.owned, 2000);
  if (typeof renderMarket === 'function') {
    var ms = document.getElementById('screen-market');
    if (ms && ms.classList.contains('active')) renderMarket();
  }
}

function _debugAbyssOpenGeodeForce(forceDiamonds) {
  if (!isLocalAbyssDebugEnabled()) return;
  if (_geodeOpeningInProgress) {
    if (typeof showStatus === 'function') showStatus('Opening already in progress.', 1200);
    return;
  }
  _ensureAbyssGeodeInventory();
  if (G.abyss.geodes.owned <= 0) {
    if (typeof showStatus === 'function') showStatus('No Geodes owned — use +1 Geode first.', 1500);
    return;
  }
  var reward = (forceDiamonds != null)
    ? { diamonds: forceDiamonds, base: forceDiamonds, extra: false }
    : _generateGeodeReward();
  _geodeOpeningInProgress             = true;
  G.abyss.geodes.owned                = Math.max(0, G.abyss.geodes.owned - 1);
  G.diamonds                          = (G.diamonds || 0) + reward.diamonds;
  G.abyss.geodes.totalDiamondsEarned  = (G.abyss.geodes.totalDiamondsEarned || 0) + reward.diamonds;
  recordAbyssGeodeOpened(1);
  if (typeof saveState  === 'function') saveState();
  if (typeof updateHUD  === 'function') updateHUD();
  showGeodeOpenPopup(reward);
}

function _debugAbyssResetGeodes() {
  if (!isLocalAbyssDebugEnabled()) return;
  if (!G.abyss) G.abyss = {};
  G.abyss.geodes = { owned: 0, totalDiamondsEarned: 0 };
  if (G.abyss.fishdex && G.abyss.fishdex.geode)
    G.abyss.fishdex.geode = { discovered: false, foundCount: 0, openedCount: 0 };
  if (typeof saveState  === 'function') saveState();
  if (typeof showStatus === 'function') showStatus('Debug: Geode inventory and Fishdex stats reset.', 2000);
  if (typeof renderMarket === 'function') {
    var ms = document.getElementById('screen-market');
    if (ms && ms.classList.contains('active')) renderMarket();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 9 — ABYSS AUTOMATION PRODUCTION
// Batched catch generation; time-normalized Geode model; Tribe bonus integration.
// Third automation slot (1000 Diamonds) state lives in G.thirdAutoSlotUnlocked.
// Abyss fish sell for coins; Crystals and Insects auto-discard (Fishdex only).
// [PROVISIONAL] economy constants marked — subject to balancing audit.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── PROVISIONAL ABYSS FISH BASE VALUES ──────────────────────────────────────
// [PROVISIONAL] Scales ~2× per zone (Zone 1→Zone 10). Economy audit pending.
var _ABYSS_FISH_VALUE_BY_ZONE = [200, 400, 700, 1200, 2000, 3000, 4500, 6000, 8000, 12000];

function getAbyssFishBaseValue(fishId) {
  var fish = ABYSS_FISH_DB.find(function(f) { return f.id === fishId; });
  if (!fish) return 200;
  var z = ABYSS_ZONES.find(function(z) { return z.id === fish.nativeZone; });
  var order = z ? z.order : 1;
  return _ABYSS_FISH_VALUE_BY_ZONE[Math.min(order - 1, _ABYSS_FISH_VALUE_BY_ZONE.length - 1)];
}

// ─── ABYSS FISH PILE HELPERS ──────────────────────────────────────────────────
// G.abyss.abyssFishPile = { fishId: qty } — sellable Abyss fish in shared storage.
// Crystals and Insects: discarded, counted only in Fishdex.

function _ensureAbyssFishPile() {
  if (!G.abyss) G.abyss = {};
  if (!G.abyss.abyssFishPile || typeof G.abyss.abyssFishPile !== 'object')
    G.abyss.abyssFishPile = {};
}

function abyssFishPileTotal() {
  if (!G.abyss || !G.abyss.abyssFishPile) return 0;
  return Object.values(G.abyss.abyssFishPile).reduce(function(s, q) { return s + (q || 0); }, 0);
}

function sellAbyssFish(fishId, qty) {
  if (!canAccessMaelstromAndAbyss()) return;
  _ensureAbyssFishPile();
  var pile = G.abyss.abyssFishPile;
  var have = pile[fishId] || 0;
  qty = Math.min(qty, have);
  if (qty <= 0) return;
  var val  = getAbyssFishBaseValue(fishId);
  var tribeFV  = typeof getTribeFishValueMultiplier === 'function' ? getTribeFishValueMultiplier() : 1;
  var sellBonus= typeof getRodSellBonus            === 'function' ? getRodSellBonus()            : 1;
  var total = Math.round(val * tribeFV * sellBonus * qty);
  pile[fishId] -= qty;
  if (typeof _earnCoins  === 'function') _earnCoins(total);
  if (typeof saveState   === 'function') saveState();
  if (typeof updateHUD   === 'function') updateHUD();
  var ms = document.getElementById('screen-market');
  if (ms && ms.classList.contains('active') && typeof renderMarket === 'function') renderMarket();
}

function sellAllAbyssFish() {
  if (!canAccessMaelstromAndAbyss()) return 0;
  _ensureAbyssFishPile();
  var pile     = G.abyss.abyssFishPile;
  var tribeFV  = typeof getTribeFishValueMultiplier === 'function' ? getTribeFishValueMultiplier() : 1;
  var sellBonus= typeof getRodSellBonus            === 'function' ? getRodSellBonus()            : 1;
  var total = 0;
  Object.keys(pile).forEach(function(id) {
    var qty = pile[id] || 0;
    if (qty <= 0) return;
    total += Math.round(getAbyssFishBaseValue(id) * tribeFV * sellBonus * qty);
    pile[id] = 0;
  });
  if (total > 0 && typeof _earnCoins === 'function') _earnCoins(total);
  return total;
}

// ─── ACTIVE ABYSS ZONE HELPERS ────────────────────────────────────────────────

function getActiveAbyssZonesForAuto() {
  if (!canAccessMaelstromAndAbyss()) return [];
  var active = G.activeAutomationZones || [];
  var unlockedThisRun = (G.abyss && G.abyss.currentRun)
    ? (G.abyss.currentRun.unlockedZones || ['emerald_forest'])
    : ['emerald_forest'];
  return active.filter(function(id) {
    return ABYSS_ZONES.some(function(z) { return z.id === id; }) && unlockedThisRun.includes(id);
  });
}

// ─── BATCH DISTRIBUTION ───────────────────────────────────────────────────────
// Distributes `total` items uniformly across `pool` array.
// Returns plain object { id: count }. Sum of values === total.

function _batchDistributeUniform(total, pool) {
  var result = {};
  if (!pool || !pool.length || total <= 0) return result;
  var n = pool.length;
  var base = Math.floor(total / n);
  var remainder = total - base * n;
  var indices = [];
  for (var i = 0; i < n; i++) indices.push(i);
  for (var j = n - 1; j > 0; j--) {
    var k = Math.floor(Math.random() * (j + 1));
    var tmp = indices[j]; indices[j] = indices[k]; indices[k] = tmp;
  }
  for (var i = 0; i < n; i++) {
    result[pool[i]] = base + (i < remainder ? 1 : 0);
  }
  return result;
}

// ─── ABYSS AUTO BATCH PROCESSOR ───────────────────────────────────────────────
// Called from game.js autoTick() and calculateOfflineProgress() for each Abyss zone.
// `count` — total catches to process. Batched: does NOT loop once per catch.

function processAbyssAutoBatch(zoneId, count) {
  if (!canAccessMaelstromAndAbyss() || !count || count <= 0) return;
  var zone = ABYSS_ZONES.find(function(z) { return z.id === zoneId; });
  if (!zone) return;
  _ensureAbyssFishPile();

  var total = ABYSS_LOOT_WEIGHTS.fish + ABYSS_LOOT_WEIGHTS.crystal + ABYSS_LOOT_WEIGHTS.insect;
  var fishExp    = count * ABYSS_LOOT_WEIGHTS.fish    / total;
  var crystalExp = count * ABYSS_LOOT_WEIGHTS.crystal / total;
  var fishCount    = Math.floor(fishExp);    if (Math.random() < (fishExp    - fishCount))    fishCount++;
  var crystalCount = Math.floor(crystalExp); if (Math.random() < (crystalExp - crystalCount)) crystalCount++;
  var insectCount  = count - fishCount - crystalCount;
  if (insectCount < 0) { fishCount += insectCount; insectCount = 0; }

  // Fish → Abyss fish pile + Fishdex
  if (fishCount > 0 && zone.fish && zone.fish.length) {
    var fishDist = _batchDistributeUniform(fishCount, zone.fish);
    var pile = G.abyss.abyssFishPile;
    Object.keys(fishDist).forEach(function(id) {
      var qty = fishDist[id];
      if (qty <= 0) return;
      pile[id] = (pile[id] || 0) + qty;
      if (typeof recordAbyssFishCatch === 'function') recordAbyssFishCatch(id, qty);
    });
  }

  // Crystals → Fishdex only (auto-discard, worthless)
  if (crystalCount > 0 && zone.crystals && zone.crystals.length) {
    var crystalDist = _batchDistributeUniform(crystalCount, zone.crystals);
    Object.keys(crystalDist).forEach(function(id) {
      var qty = crystalDist[id];
      if (qty > 0 && typeof recordAbyssCrystalFound === 'function') recordAbyssCrystalFound(id, qty);
    });
  }

  // Insects → Fishdex only (auto-discard, worthless)
  if (insectCount > 0 && zone.insects && zone.insects.length) {
    var insectDist = _batchDistributeUniform(insectCount, zone.insects);
    Object.keys(insectDist).forEach(function(id) {
      var qty = insectDist[id];
      if (qty > 0 && typeof recordAbyssInsectFound === 'function') recordAbyssInsectFound(id, qty);
    });
  }
}

// ─── AUTOMATION GEODE MODEL (time-normalized) ─────────────────────────────────
// [PROVISIONAL] 4 Geodes/day while ≥1 Abyss zone active above min threshold.
// Multiple active Abyss zones do NOT multiply the rate (prevents slot-count explosion).
// Sapphire Deepwatch Tribe Find Rate bonus applied multiplicatively.
// Fractional progress survives Prestige and reload.

var ABYSS_GEODE_AUTO_PER_DAY        = 4;    // [PROVISIONAL] automation Geodes per real day
var ABYSS_GEODE_AUTO_MIN_CATCH_RATE = 1.0;  // minimum catch/s to Abyss zones before progress runs

function _ensureAbyssGeodeAutoProgress() {
  _ensureAbyssGeodeInventory();
  var inv = G.abyss.geodes;
  if (typeof inv.automationProgress !== 'number' || !isFinite(inv.automationProgress) || inv.automationProgress < 0)
    inv.automationProgress = 0;
}

function _getAbyssGeodeAutoMsPerGeode() {
  var mult = typeof getTribeGeodeFindRateMultiplier === 'function' ? getTribeGeodeFindRateMultiplier() : 1;
  var perDay = Math.max(0.001, ABYSS_GEODE_AUTO_PER_DAY * mult);
  return 86400000 / perDay;
}

// Called once per autoTick (elapsedMs≈1000) and from calculateOfflineProgress.
function _advanceAbyssGeodeAutoProgress(elapsedMs, abyssZones, abyssRate) {
  if (!canAccessMaelstromAndAbyss() || elapsedMs <= 0) return;
  if (!abyssZones || !abyssZones.length) return;
  if (abyssRate < ABYSS_GEODE_AUTO_MIN_CATCH_RATE) return;

  _ensureAbyssGeodeAutoProgress();
  var msPerGeode = _getAbyssGeodeAutoMsPerGeode();
  var progress   = elapsedMs / msPerGeode;
  G.abyss.geodes.automationProgress = (G.abyss.geodes.automationProgress || 0) + progress;

  var toGrant = Math.floor(G.abyss.geodes.automationProgress);
  if (toGrant > 0) {
    G.abyss.geodes.automationProgress -= toGrant;
    _grantAbyssAutoGeodes(toGrant);
  }
}

function _grantAbyssAutoGeodes(count) {
  if (count <= 0) return;
  _ensureAbyssGeodeInventory();
  _ensureAbyssFishdexState();
  G.abyss.geodes.owned = (G.abyss.geodes.owned || 0) + count;
  if (typeof recordAbyssGeodeFound === 'function') recordAbyssGeodeFound(count);
  if (typeof saveState === 'function') saveState();
  var ms = document.getElementById('screen-market');
  if (ms && ms.classList.contains('active') && typeof renderMarket === 'function') renderMarket();
}

// ─── ZONE AUTO CARD RENDERER ─────────────────────────────────────────────────
// Called from game.js renderZones() to append Abyss biome cards below Overworld.

function renderAbyssZoneAutoCards() {
  if (!canAccessMaelstromAndAbyss()) return '';
  var unlockedThisRun = (G.abyss && G.abyss.currentRun)
    ? (G.abyss.currentRun.unlockedZones || ['emerald_forest'])
    : ['emerald_forest'];
  var activeZones = G.activeAutomationZones || [];
  var slotLimit   = typeof getActiveSlotLimit === 'function' ? getActiveSlotLimit() : 2;
  var cards = '';
  ABYSS_ZONES.forEach(function(zone) {
    var isUnlocked = unlockedThisRun.includes(zone.id);
    var isActive   = activeZones.includes(zone.id);
    var isFull     = !isActive && activeZones.length >= slotLimit;
    var btnHtml;
    if (!isUnlocked) {
      btnHtml = '<button class="btn-zone-auto btn-zone-auto-full" disabled>Locked</button>';
    } else if (isActive) {
      btnHtml = '<button class="btn-zone-auto btn-zone-auto-on" onclick="toggleZoneAuto(\'' + zone.id + '\')">Auto ✓</button>';
    } else if (isFull) {
      btnHtml = '<button class="btn-zone-auto btn-zone-auto-full" disabled>Auto Full</button>';
    } else {
      btnHtml = '<button class="btn-zone-auto" onclick="toggleZoneAuto(\'' + zone.id + '\')">Set Auto</button>';
    }
    cards += '<div class="zone-card zone-card-abyss' + (!isUnlocked ? ' zone-card-locked' : '') + '" style="--zc:' + zone.themeColor + '">' +
      '<div class="zone-color-bar"></div>' +
      '<div class="zone-card-body">' +
        '<div class="zone-card-text">' +
          '<div class="zone-card-head">' +
            '<span class="zone-card-name">' + zone.name + '</span>' +
            '<span class="zone-world-badge">Abyss</span>' +
            '<span class="zone-depth">' + (isUnlocked ? 'Zone ' + zone.order : 'Locked') + '</span>' +
          '</div>' +
          '<div class="zone-card-desc">' + zone.atmosphere + '</div>' +
          (!isUnlocked ? '<div class="zone-reqs"><div class="zone-req">' + zone.unlockRequirement + '</div></div>' : '') +
        '</div>' +
        '<div class="zone-auto-col">' + btnHtml + '</div>' +
      '</div>' +
      '<div class="zone-card-right"></div>' +
      '</div>';
  });
  return cards ? '<div class="zone-abyss-divider">Abyss Biomes</div>' + cards : '';
}

// ─── PHASE 9 DEBUG TOOLS ──────────────────────────────────────────────────────

function _debugSimAbyssAuto(seconds) {
  if (!isLocalAbyssDebugEnabled()) return;
  var abyssZones = getActiveAbyssZonesForAuto();
  if (!abyssZones.length) {
    if (typeof showStatus === 'function') showStatus('No active Abyss zones — select one in Zones.', 1800); return;
  }
  var totalRate = typeof calcFishRate === 'function' ? calcFishRate() : 0;
  var totalActive = (G.activeAutomationZones || []).length || 1;
  var perZoneRate = totalRate / totalActive;
  var totals = {};
  abyssZones.forEach(function(zid) {
    var catches = Math.round(perZoneRate * seconds);
    if (catches <= 0) return;
    processAbyssAutoBatch(zid, catches);
    totals[zid] = catches;
  });
  var abyssRate = abyssZones.length * perZoneRate;
  _advanceAbyssGeodeAutoProgress(seconds * 1000, abyssZones, abyssRate);
  if (typeof saveState  === 'function') saveState();
  if (typeof updateHUD  === 'function') updateHUD();
  var ms = document.getElementById('screen-market');
  if (ms && ms.classList.contains('active') && typeof renderMarket === 'function') renderMarket();
  var labels = Object.entries(totals).map(function(kv) { return kv[0].split('_')[0] + '=' + kv[1]; }).join(', ');
  if (typeof showStatus === 'function') showStatus('Simulated ' + seconds + 's Abyss auto: ' + labels, 3000);
}

function _debugAddAbyssGeodeAutoProgress(amount) {
  if (!isLocalAbyssDebugEnabled()) return;
  _ensureAbyssGeodeAutoProgress();
  G.abyss.geodes.automationProgress = (G.abyss.geodes.automationProgress || 0) + amount;
  var toGrant = Math.floor(G.abyss.geodes.automationProgress);
  if (toGrant > 0) {
    G.abyss.geodes.automationProgress -= toGrant;
    _grantAbyssAutoGeodes(toGrant);
  }
  if (typeof saveState  === 'function') saveState();
  if (typeof showStatus === 'function') showStatus('Debug: +' + amount + ' Geode auto progress → granted ' + toGrant, 2000);
}

function _debugCompleteNextAutoGeode() {
  if (!isLocalAbyssDebugEnabled()) return;
  _ensureAbyssGeodeAutoProgress();
  var needed = 1 - (G.abyss.geodes.automationProgress || 0);
  _debugAddAbyssGeodeAutoProgress(Math.max(needed + 0.001, 0.01));
}

function _debugResetAbyssAutoState() {
  if (!isLocalAbyssDebugEnabled()) return;
  _ensureAbyssFishPile();
  _ensureAbyssGeodeAutoProgress();
  G.abyss.abyssFishPile             = {};
  G.abyss.geodes.automationProgress = 0;
  if (typeof saveState  === 'function') saveState();
  if (typeof showStatus === 'function') showStatus('Debug: Abyss automation state reset.', 1500);
  var ms = document.getElementById('screen-market');
  if (ms && ms.classList.contains('active') && typeof renderMarket === 'function') renderMarket();
}

function _debugBuyThirdSlot() {
  if (!isLocalAbyssDebugEnabled()) return;
  if (G.thirdAutoSlotUnlocked) { if (typeof showStatus === 'function') showStatus('Third slot already unlocked.', 1000); return; }
  G.thirdAutoSlotUnlocked = true;
  if (typeof saveState   === 'function') saveState();
  if (typeof renderZones === 'function') renderZones();
  if (typeof showStatus  === 'function') showStatus('Debug: Third automation slot unlocked.', 1500);
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
