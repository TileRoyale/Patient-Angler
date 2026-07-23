'use strict';

// ─── MUSIC ────────────────────────────────────────────────────────────────────

const bgMusic = new Audio("img/icons/Fishing in the Mist.mp3");
bgMusic.loop   = true;
bgMusic.volume = 0.5;
let _musicStarted = false;

const sfxSeagull      = new Audio("img/sfx/seagull_caw.mp3");       sfxSeagull.volume      = 0.8;
const sfxCast         = new Audio("img/sfx/cast.mp3");               sfxCast.volume         = 0.7;
const sfxBobberDip    = new Audio("img/sfx/bobber_dip.mp3");         sfxBobberDip.volume    = 0.8;
const sfxFishCaught   = new Audio("img/sfx/fish_caught.mp3");        sfxFishCaught.volume   = 0.9;
const sfxGhostShip    = new Audio("img/sfx/ghost_ship_spawn.mp3");   sfxGhostShip.volume    = 0.8;

// ─── Fish Fight constants & state ──────────────────────────────────────────
const FF_REQUIRED    = 25;
const FF_DURATION    = 10000;
const FF_COOLDOWN_MS = 180000; // 3 minutes between Fish Fights
let _ffActive     = false;
let _ffTaps       = 0;
let _ffCatch      = null;
let _ffStartTime  = 0;
let _ffLastEnd    = 0;         // timestamp of last FF end (won or lost)
let _ffTimer      = null;
let _ffCdInterval = null;

function playSfx(sfx) {
  if (G.soundEnabled === false) return;
  sfx.currentTime = 0;
  sfx.play().catch(() => {});
}

let _shopOpenTs    = [];
let _coinTapCount  = 0;
let _lockedDexTaps = 0;
let _fisherNpcTaps = 0;

function startMusic() {
  if (_musicStarted) return;
  _musicStarted = true;
  bgMusic.volume = (G.musicVolume ?? 50) / 100;
  if (!G.musicMuted) bgMusic.play().catch(() => {});
}

function applyMusicState() {
  bgMusic.volume = (G.musicVolume ?? 50) / 100;
  if (!G.musicMuted) {
    bgMusic.play().catch(() => {});
  } else {
    bgMusic.pause();
  }
}

// ─── DATA ─────────────────────────────────────────────────────────────────────

const FISH_DB = [
  // ── Pond (unique: crucian_carp, goldfish, stone_loach, stickleback, pumpkinseed, weatherfish) ──
  { id:'crucian_carp',       name:'Crucian Carp',       rarity:'common',   baseValue:2,       zone:'pond',  zones:['pond'], img:'img/fish/Crucian Carp.png' },
  { id:'roach',              name:'Roach',               rarity:'common',   baseValue:2,       zone:'pond',  zones:['pond','river'], img:'img/fish/Roach.png' },
  { id:'tench',              name:'Tench',               rarity:'uncommon', baseValue:7,       zone:'pond',  zones:['pond','river','lake'], img:'img/fish/Tench.png' },
  { id:'goldfish',           name:'Goldfish',             rarity:'uncommon', baseValue:8,       zone:'pond',  zones:['pond'], img:'img/fish/Goldfish.png' },
  { id:'small_perch',        name:'Small Perch',         rarity:'common',   baseValue:2,       zone:'pond',  zones:['pond','river'], img:'img/fish/Small Perch.png' },
  { id:'stone_loach',        name:'Stone Loach',         rarity:'uncommon', baseValue:6,       zone:'pond',  zones:['pond'], img:'img/fish/Stone Loach.png' },
  { id:'stickleback',        name:'Stickleback',         rarity:'common',   baseValue:1,       zone:'pond',  zones:['pond'], img:'img/fish/Stickleback.png' },
  { id:'pumpkinseed',        name:'Pumpkinseed',         rarity:'rare',     baseValue:11,      zone:'pond',  zones:['pond'], img:'img/fish/Pumpkinseed.png' },
  { id:'weatherfish',        name:'Weatherfish',         rarity:'rare',     baseValue:13,      zone:'pond',  zones:['pond'], img:'img/fish/Weatherfish.png' },
  { id:'common_bream',       name:'Common Bream',        rarity:'common',   baseValue:3,       zone:'pond',  zones:['pond','river'], img:'img/fish/Common Bream.png' },
  { id:'giant_crucian_carp', name:'Giant Crucian Carp',  rarity:'epic',     baseValue:39,      zone:'pond',  zones:['pond'], img:'img/fish/Giant Crucian Carp.png', special:true },
  // ── River (unique: grayling, barbel, chub, burbot) ──
  { id:'brown_trout',        name:'Brown Trout',         rarity:'rare',     baseValue:32,      zone:'river', zones:['river','lake'], img:'img/fish/Brown Trout.png' },
  { id:'grayling',           name:'Grayling',            rarity:'uncommon', baseValue:13,      zone:'river', zones:['river'], img:'img/fish/Grayling.png' },
  { id:'barbel',             name:'Barbel',              rarity:'uncommon', baseValue:9,       zone:'river', zones:['river'], img:'img/fish/Barbel.png' },
  { id:'chub',               name:'Chub',                rarity:'common',   baseValue:4,       zone:'river', zones:['river'], img:'img/fish/Chub.png' },
  { id:'pike',               name:'Pike',                rarity:'rare',     baseValue:35,      zone:'river', zones:['river','lake'], img:'img/fish/Pike.png' },
  { id:'burbot',             name:'Burbot',              rarity:'epic',     baseValue:112,     zone:'river', zones:['river'], img:'img/fish/Burbot.png' },
  // ── Lake (unique: large_perch, zander, vendace, carp, catfish) ──
  { id:'large_perch',        name:'Large Perch',         rarity:'common',   baseValue:8,       zone:'lake',  zones:['lake'], img:'img/fish/Large Perch.png' },
  { id:'zander',             name:'Zander',              rarity:'uncommon', baseValue:25,      zone:'lake',  zones:['lake'], img:'img/fish/Zander.png' },
  { id:'whitefish',          name:'Whitefish',           rarity:'uncommon', baseValue:27,      zone:'lake',  zones:['lake','bay'], img:'img/fish/Whitefish.png' },
  { id:'vendace',            name:'Vendace',             rarity:'uncommon', baseValue:20,      zone:'lake',  zones:['lake'], img:'img/fish/Vendace.png' },
  { id:'eel',                name:'Eel',                 rarity:'rare',     baseValue:53,      zone:'lake',  zones:['lake','bay'], img:'img/fish/Eel.png' },
  { id:'carp',               name:'Carp',                rarity:'common',   baseValue:10,      zone:'lake',  zones:['lake'], img:'img/fish/Carp.png' },
  { id:'catfish',            name:'European Catfish',    rarity:'epic',     baseValue:140,     zone:'lake',  zones:['lake'], img:'img/fish/European Catfish.png' },
  // ── Bay (unique: flounder, garfish, smelt, sprat, seahorse, monk_fish) ──
  { id:'baltic_herring',     name:'Baltic Herring',      rarity:'common',   baseValue:11,      zone:'bay',   zones:['bay','sea'], img:'img/fish/Baltic Herring.png' },
  { id:'flounder',           name:'Flounder',            rarity:'uncommon', baseValue:32,      zone:'bay',   zones:['bay'], img:'img/fish/Flounder.png' },
  { id:'garfish',            name:'Garfish',             rarity:'rare',     baseValue:77,      zone:'bay',   zones:['bay'], img:'img/fish/Garfish.png' },
  { id:'sea_trout',          name:'Sea Trout',           rarity:'epic',     baseValue:224,     zone:'bay',   zones:['bay','sea'], img:'img/fish/Sea Trout.png' },
  { id:'seabass',            name:'Seabass',             rarity:'rare',     baseValue:84,      zone:'bay',   zones:['bay','sea'], img:'img/fish/Seabass.png' },
  { id:'mackerel',           name:'Mackerel',            rarity:'uncommon', baseValue:25,      zone:'bay',   zones:['bay','sea'], img:'img/fish/Mackerel.png' },
  { id:'smelt',              name:'Smelt',               rarity:'common',   baseValue:8,       zone:'bay',   zones:['bay'], img:'img/fish/Smelt.png' },
  { id:'sprat',              name:'Sprat',               rarity:'common',   baseValue:6,       zone:'bay',   zones:['bay'], img:'img/fish/Sprat.png' },
  { id:'monk_fish',          name:'Monk Fish',           rarity:'epic',     baseValue:196,     zone:'bay',   zones:['bay'], img:'img/fish/Monk fish.png', timeWindow:{from:20,to:0}, manualOnly:true },
  { id:'seahorse',           name:'Seahorse',            rarity:'epic',      baseValue:320,    zone:'bay',   zones:['bay'], img:'img/fish/Seahorse.png', timeWindow:{from:7,to:11}, manualOnly:true },
  // ── Sea (unique: salmon, haddock, redfish, wolffish, coelacanth, mola_mola) ──
  { id:'cod',                name:'Cod',                 rarity:'uncommon', baseValue:56,      zone:'sea',   zones:['sea','ocean'], img:'img/fish/Cod.png' },
  { id:'salmon',             name:'Salmon',              rarity:'rare',     baseValue:133,     zone:'sea',   zones:['sea'], img:'img/fish/Salmon.png' },
  { id:'halibut',            name:'Halibut',             rarity:'epic',     baseValue:385,     zone:'sea',   zones:['sea','ocean'], img:'img/fish/Halibut.png' },
  { id:'haddock',            name:'Haddock',             rarity:'uncommon', baseValue:53,      zone:'sea',   zones:['sea'], img:'img/fish/Haddock.png' },
  { id:'redfish',            name:'Redfish',             rarity:'uncommon', baseValue:55,      zone:'sea',   zones:['sea'], img:'img/fish/Redfish.png' },
  { id:'wolffish',           name:'Wolffish',            rarity:'epic',     baseValue:350,     zone:'sea',   zones:['sea'], img:'img/fish/Wolffish.png' },
  { id:'coelacanth',         name:'Coelacanth',          rarity:'epic',      baseValue:500,    zone:'sea',   zones:['sea'], img:'img/fish/Coelacanth.png', timeWindow:{from:1,to:3}, manualOnly:true },
  { id:'mola_mola',          name:'Mola-mola',           rarity:'epic',      baseValue:500,    zone:'sea',   zones:['sea'], img:'img/fish/Mola-mola.png', timeWindow:{from:10,to:14}, manualOnly:true },
  // ── Ocean (unique: atlantic_mackerel, tuna, swordfish, marlin, mahi_mahi, giant_squid, oarfish, blue_whale) ──
  { id:'atlantic_mackerel',  name:'Atlantic Mackerel',   rarity:'common',   baseValue:46,      zone:'ocean', zones:['ocean'], img:'img/fish/Atlantic Mackerel.png' },
  { id:'tuna',               name:'Tuna',                rarity:'common',   baseValue:56,      zone:'ocean', zones:['ocean'], img:'img/fish/Tuna.png' },
  { id:'swordfish',          name:'Swordfish',           rarity:'uncommon', baseValue:154,     zone:'ocean', zones:['ocean'], img:'img/fish/Swordfish.png' },
  { id:'marlin',             name:'Marlin',              rarity:'rare',     baseValue:336,     zone:'ocean', zones:['ocean'], img:'img/fish/Marlin.png' },
  { id:'mahi_mahi',          name:'Mahi-Mahi',           rarity:'common',   baseValue:46,      zone:'ocean', zones:['ocean'], img:'img/fish/Mahi-Mahi.png' },
  { id:'giant_squid',        name:'Giant Squid',         rarity:'epic',      baseValue:960,    zone:'ocean', zones:['ocean'], img:'img/fish/Giant Squid.png', timeWindow:{from:0,to:2}, manualOnly:true },
  { id:'oarfish',            name:'Oarfish',             rarity:'rare',     baseValue:294,     zone:'ocean', zones:['ocean'], img:'img/fish/Oarfish.png' },
  { id:'blue_whale',         name:'Blue Whale',          rarity:'epic',      baseValue:1260,   zone:'ocean', zones:['ocean'], img:'img/fish/Blue whale.png', timeWindow:{from:1,to:3}, manualOnly:true },
  // ── Time-specific (special = not in base Excel table, shown separately in Fishdex) ──
  { id:'morning_perch',   name:'Morning Perch',   rarity:'uncommon', baseValue:4,    zone:'pond',  zones:['pond'],  img:'img/fish/Morning Perch.png',   timeWindow:{from:7,to:10},  special:true },
  { id:'afternoon_roach', name:'Afternoon Roach', rarity:'common',   baseValue:3,    zone:'pond',  zones:['pond'],  img:'img/fish/Afternoon Roach.png', timeWindow:{from:12,to:15}, special:true },
  { id:'dawn_trout',      name:'Dawn Trout',      rarity:'rare',     baseValue:35,   zone:'river', zones:['river'], img:'img/fish/Dawn Trout.png',      timeWindow:{from:4,to:7},   special:true },
  { id:'midnight_eel',    name:'Midnight Eel',    rarity:'epic',     baseValue:112,  zone:'river', zones:['river'], img:'img/fish/Midnight Eel.png',    timeWindow:{from:0,to:3},   special:true },
  { id:'evening_catfish', name:'Evening Catfish', rarity:'uncommon', baseValue:25,   zone:'lake',  zones:['lake'],  img:'img/fish/Evening Catfish.png', timeWindow:{from:18,to:22}, special:true },
  { id:'night_pike',      name:'Night Pike',      rarity:'rare',     baseValue:42,   zone:'lake',  zones:['lake'],  img:'img/fish/Night Pike.png',      timeWindow:{from:22,to:2},  special:true },
  { id:'predawn_zander',  name:'Pre-dawn Zander', rarity:'rare',     baseValue:28,   zone:'lake',  zones:['lake'],  img:'img/fish/Pre-dawn Zander.png', timeWindow:{from:3,to:5},   special:true },
  // ── World 1 Legendary fish (w1legendary:true — independent 1/50M per-catch roll, catchable by automation) ──
  { id:'crimson_crown_perch',  name:'Crimson Crown Perch',  rarity:'legendary', baseValue:0, zone:'pond',  zones:['pond'],  img:'img/fish/ultra rare fish/Pond/Crimson Crown Perch.png',   w1legendary:true },
  { id:'golden_veil_carp',     name:'Golden Veil Carp',     rarity:'legendary', baseValue:0, zone:'pond',  zones:['pond'],  img:'img/fish/ultra rare fish/Pond/Golden Veil Carp.png',       w1legendary:true },
  { id:'silver_ribbon_loach',  name:'Silver Ribbon Loach',  rarity:'legendary', baseValue:0, zone:'pond',  zones:['pond'],  img:'img/fish/ultra rare fish/Pond/Silver Ribbon Loach.png',    w1legendary:true },
  { id:'emerald_grayling',     name:'Emerald Grayling',     rarity:'legendary', baseValue:0, zone:'river', zones:['river'], img:'img/fish/ultra rare fish/River/Emerald Grayling.png',       w1legendary:true },
  { id:'marbleback_barbel',    name:'Marbleback Barbel',    rarity:'legendary', baseValue:0, zone:'river', zones:['river'], img:'img/fish/ultra rare fish/River/Marbleback Barbel.png',      w1legendary:true },
  { id:'redfin_chub',          name:'Redfin Chub',          rarity:'legendary', baseValue:0, zone:'river', zones:['river'], img:'img/fish/ultra rare fish/River/Redfin Chub.png',            w1legendary:true },
  { id:'blueglass_char',       name:'Blueglass Char',       rarity:'legendary', baseValue:0, zone:'lake',  zones:['lake'],  img:'img/fish/ultra rare fish/Lake/Blueglass Char.png',          w1legendary:true },
  { id:'copperplate_bream',    name:'Copperplate Bream',    rarity:'legendary', baseValue:0, zone:'lake',  zones:['lake'],  img:'img/fish/ultra rare fish/Lake/Copperplate Bream.png',       w1legendary:true },
  { id:'frostback_pike',       name:'Frostback Pike',       rarity:'legendary', baseValue:0, zone:'lake',  zones:['lake'],  img:'img/fish/ultra rare fish/Lake/Frostback Pike.png',          w1legendary:true },
  { id:'copperbelly_mullet',   name:'Copperbelly Mullet',   rarity:'legendary', baseValue:0, zone:'bay',   zones:['bay'],   img:'img/fish/ultra rare fish/Bay/Copperbelly Mullet.png',       w1legendary:true },
  { id:'golden_flounder',      name:'Golden Flounder',      rarity:'legendary', baseValue:0, zone:'bay',   zones:['bay'],   img:'img/fish/ultra rare fish/Bay/Golden Flounder.png',          w1legendary:true },
  { id:'silver_needlefish',    name:'Silver Needlefish',    rarity:'legendary', baseValue:0, zone:'bay',   zones:['bay'],   img:'img/fish/ultra rare fish/Bay/Silver Needlefish.png',        w1legendary:true },
  { id:'arctic_wolffish',      name:'Arctic Wolffish',      rarity:'legendary', baseValue:0, zone:'sea',   zones:['sea'],   img:'img/fish/ultra rare fish/Sea/Arctic Wolffish.png',          w1legendary:true },
  { id:'crimson_rockfish',     name:'Crimson Rockfish',     rarity:'legendary', baseValue:0, zone:'sea',   zones:['sea'],   img:'img/fish/ultra rare fish/Sea/Crimson Rockfish.png',         w1legendary:true },
  { id:'stormscale_cod',       name:'Stormscale Cod',       rarity:'legendary', baseValue:0, zone:'sea',   zones:['sea'],   img:'img/fish/ultra rare fish/Sea/Stormscale Cod.png',           w1legendary:true },
  { id:'obsidian_moonfish',    name:'Obsidian Moonfish',    rarity:'legendary', baseValue:0, zone:'ocean', zones:['ocean'], img:'img/fish/ultra rare fish/Ocean/Obsidian Moonfish.png',      w1legendary:true },
  { id:'sapphire_spearfish',   name:'Sapphire Spearfish',   rarity:'legendary', baseValue:0, zone:'ocean', zones:['ocean'], img:'img/fish/ultra rare fish/Ocean/Sapphire Spearfish.png',     w1legendary:true },
  { id:'suncrest_mahi',        name:'Suncrest Mahi',        rarity:'legendary', baseValue:0, zone:'ocean', zones:['ocean'], img:'img/fish/ultra rare fish/Ocean/Suncrest Mahi.png',          w1legendary:true },
];

// Weight ranges in grams per species (realistic world records as upper bound)
const FISH_WEIGHTS = {
  crucian_carp:      [100,   4500],
  roach:             [50,    1800],
  tench:             [200,   5000],
  goldfish:          [50,    2000],
  small_perch:       [30,    800],
  stone_loach:       [5,     50],
  stickleback:       [2,     10],
  pumpkinseed:       [20,    300],
  weatherfish:       [10,    150],
  common_bream:      [200,   8000],
  giant_crucian_carp:[500,   6000],
  brown_trout:       [100,   10000],
  grayling:          [50,    2500],
  barbel:            [200,   10000],
  chub:              [100,   4000],
  pike:              [500,   25000],
  burbot:            [100,   7000],
  large_perch:       [100,   3000],
  zander:            [200,   12000],
  whitefish:         [100,   3000],
  vendace:           [20,    400],
  eel:               [100,   3000],
  carp:              [500,   20000],
  catfish:           [2000,  80000],
  baltic_herring:    [20,    100],
  flounder:          [100,   3000],
  garfish:           [100,   1200],
  sea_trout:         [200,   15000],
  seabass:           [200,   10000],
  mackerel:          [100,   2000],
  smelt:             [10,    80],
  sprat:             [10,    50],
  cod:               [500,   40000],
  salmon:            [500,   30000],
  halibut:           [2000,  300000],
  haddock:           [200,   10000],
  redfish:           [100,   5000],
  wolffish:          [500,   20000],
  atlantic_mackerel: [100,   1800],
  tuna:              [10000, 600000],
  swordfish:         [10000, 500000],
  marlin:            [20000, 800000],
  mahi_mahi:         [1000,  40000],
  giant_squid:       [100000,300000],
  oarfish:           [50000, 270000],
  coelacanth:        [30000, 95000],
  morning_perch:     [30,    800],
  afternoon_roach:   [50,    1800],
  dawn_trout:        [100,   10000],
  midnight_eel:      [100,   3000],
  evening_catfish:   [500,   30000],
  night_pike:        [500,   25000],
  predawn_zander:    [200,   12000],
};

function formatWeight(g) {
  return g >= 1000 ? (g / 1000).toFixed(2).replace(/\.?0+$/, '') + ' kg' : g + ' g';
}

const TRASH_DB = [
  // ── Pond (unique: glass_bottle, rusty_hook, broken_rod, old_tire, rubber_duck, bicycle_wheel) ──
  { id:'old_boot',      name:'Old Boot',             rarity:'trash', baseValue:1, zone:'pond',  zones:['pond','river'], img:'img/Trash/Old Boot.png' },
  { id:'tin_can',       name:'Tin Can',              rarity:'trash', baseValue:1, zone:'pond',  zones:['pond','river'], img:'img/Trash/Tin Can.png' },
  { id:'plastic_bag',   name:'Plastic Bag',          rarity:'trash', baseValue:1, zone:'pond',  zones:['pond','river'], img:'img/Trash/Plastic Bag.png' },
  { id:'glass_bottle',  name:'Glass Bottle',         rarity:'trash', baseValue:1, zone:'pond',  zones:['pond'], img:'img/Trash/Glass Bottle.png' },
  { id:'rusty_hook',    name:'Rusty Hook',           rarity:'trash', baseValue:1, zone:'pond',  zones:['pond'], img:'img/Trash/Rusty Hook.png' },
  { id:'broken_rod',    name:'Broken Rod',           rarity:'trash', baseValue:1, zone:'pond',  zones:['pond'], img:'img/Trash/Broken Rod.png' },
  { id:'old_tire',      name:'Old Tire',             rarity:'trash', baseValue:1, zone:'pond',  zones:['pond'], img:'img/Trash/Old Tire.png' },
  { id:'rubber_duck',   name:'Rubber Duck',          rarity:'trash', baseValue:1, zone:'pond',  zones:['pond'], img:'img/Trash/Rubber Duck.png' },
  { id:'garden_glove',  name:'Garden Glove',         rarity:'trash', baseValue:1, zone:'pond',  zones:['pond','river'], img:'img/Trash/Garden Glove.png' },
  { id:'bicycle_wheel', name:'Bicycle Wheel',        rarity:'trash', baseValue:1, zone:'pond',  zones:['pond'], img:'img/Trash/Bicycle Wheel.png' },
  // ── River (unique: plastic_bottle, broken_jar, shopping_bag) ──
  { id:'net_fragment',  name:'Fishing Net Fragment', rarity:'trash', baseValue:1, zone:'river', zones:['river','lake'], img:'img/Trash/Fishing Net Fragment.png' },
  { id:'plastic_bottle',name:'Plastic Bottle',       rarity:'trash', baseValue:1, zone:'river', zones:['river'], img:'img/Trash/Plastic Bottle.png' },
  { id:'car_part',      name:'Car Part',             rarity:'trash', baseValue:1, zone:'river', zones:['river','lake'], img:'img/Trash/Car Part.png' },
  { id:'rope',          name:'Rope',                 rarity:'trash', baseValue:1, zone:'river', zones:['river','lake','bay'], img:'img/Trash/Rope.png' },
  { id:'broken_jar',    name:'Broken Glass Jar',     rarity:'trash', baseValue:1, zone:'river', zones:['river'], img:'img/Trash/Broken Glass Jar.png' },
  { id:'shopping_bag',  name:'Shopping Bag',         rarity:'trash', baseValue:1, zone:'river', zones:['river'], img:'img/Trash/Shopping Bag.png' },
  // ── Lake (unique: motor_part, beer_cans, wet_suitcase, troll_weight, sunken_bicycle) ──
  { id:'anchor',        name:'Anchor',               rarity:'trash', baseValue:1, zone:'lake',  zones:['lake','bay','sea'], img:'img/Trash/Anchor.png' },
  { id:'sunken_buoy',   name:'Sunken Buoy',          rarity:'trash', baseValue:1, zone:'lake',  zones:['lake','bay'], img:'img/Trash/Sunken Buoy.png' },
  { id:'motor_part',    name:'Outboard Motor Part',  rarity:'trash', baseValue:1, zone:'lake',  zones:['lake'], img:'img/Trash/Outboard Motor Part.png' },
  { id:'beer_cans',     name:'Beer Cans',            rarity:'trash', baseValue:1, zone:'lake',  zones:['lake'], img:'img/Trash/Beer Cans.png' },
  { id:'wet_suitcase',  name:'Waterlogged Suitcase', rarity:'trash', baseValue:1, zone:'lake',  zones:['lake'], img:'img/Trash/Waterlogged Suitcase.png' },
  { id:'troll_weight',  name:'Trolling Weight',      rarity:'trash', baseValue:1, zone:'lake',  zones:['lake'], img:'img/Trash/Trolling Weight.png' },
  { id:'sunken_bicycle',name:'Bicycle',              rarity:'trash', baseValue:1, zone:'lake',  zones:['lake'], img:'img/Trash/Bicycle.png' },
  // ── Bay (unique: lobster_trap, crab_pot, propeller, divers_fin) ──
  { id:'lobster_trap',  name:'Lobster Trap',         rarity:'trash', baseValue:1, zone:'bay',   zones:['bay'], img:'img/Trash/Lobster Trap.png' },
  { id:'anchor_chain',  name:'Lost Anchor Chain',    rarity:'trash', baseValue:1, zone:'bay',   zones:['bay','sea'], img:'img/Trash/Lost Anchor Chain.png' },
  { id:'crab_pot',      name:'Old Crab Pot',         rarity:'trash', baseValue:1, zone:'bay',   zones:['bay'], img:'img/Trash/Old Crab Pot.png' },
  { id:'oil_drum',      name:'Oil Drum',             rarity:'trash', baseValue:1, zone:'bay',   zones:['bay','sea'], img:'img/Trash/Oil Drum.png' },
  { id:'propeller',     name:'Lost Propeller',       rarity:'trash', baseValue:1, zone:'bay',   zones:['bay'], img:'img/Trash/Lost Propeller.png' },
  { id:'divers_fin',    name:"Diver's Fin",          rarity:'trash', baseValue:1, zone:'bay',   zones:['bay'], img:"img/Trash/Diver_s Fin.png" },
  { id:'tangled_net',   name:'Tangled Net',          rarity:'trash', baseValue:1, zone:'bay',   zones:['bay','sea'], img:'img/Trash/Tangled Net.png' },
  // ── Sea (unique: sunken_chest, naval_mine, old_lantern) ──
  { id:'sunken_chest',  name:'Sunken Chest',         rarity:'trash', baseValue:1, zone:'sea',   zones:['sea'], img:'img/Trash/Sunken Chest.png' },
  { id:'naval_mine',    name:'Old Naval Mine',       rarity:'trash', baseValue:1, zone:'sea',   zones:['sea'], img:'img/Trash/Old Naval Mine.png' },
  { id:'ships_bell',    name:"Ship's Bell",          rarity:'trash', baseValue:1, zone:'sea',   zones:['sea','ocean'], img:"img/Trash/Ship's Bell.png" },
  { id:'old_lantern',   name:'Old Lantern',          rarity:'trash', baseValue:1, zone:'sea',   zones:['sea'], img:'img/Trash/Old Lantern.png' },
  { id:'ship_wheel',    name:'Ship Wheel',           rarity:'trash', baseValue:1, zone:'sea',   zones:['sea','ocean'], img:'img/Trash/Ship Wheel.png' },
  { id:'naval_flag',    name:'Naval Flag',           rarity:'trash', baseValue:1, zone:'sea',   zones:['sea','ocean'], img:'img/Trash/Naval Flag.png' },
  // ── Ocean (unique: aircraft_part, pressure_gauge, lost_submarine, amphora, black_box, whale_bones, sub_cable) ──
  { id:'aircraft_part', name:'Sunken Aircraft Part',    rarity:'trash', baseValue:1, zone:'ocean', zones:['ocean'], img:'img/Trash/Sunken Aircraft Part.png' },
  { id:'pressure_gauge',name:'Deep Sea Pressure Gauge', rarity:'trash', baseValue:1, zone:'ocean', zones:['ocean'], img:'img/Trash/Deep Sea Pressure Gauge.png' },
  { id:'lost_submarine',name:'Lost Submarine',          rarity:'trash', baseValue:1, zone:'ocean', zones:['ocean'], img:'img/Trash/Lost Submarine.png' },
  { id:'amphora',       name:'Ancient Amphora',         rarity:'trash', baseValue:1, zone:'ocean', zones:['ocean'], img:'img/Trash/Ancient Amphora.png' },
  { id:'black_box',     name:'Black Box',               rarity:'trash', baseValue:1, zone:'ocean', zones:['ocean'], img:'img/Trash/Black Box.png' },
  { id:'whale_bones',   name:'Whale Bones',             rarity:'trash', baseValue:1, zone:'ocean', zones:['ocean'], img:'img/Trash/Whale Bones.png' },
  { id:'sub_cable',     name:'Submarine Cable',         rarity:'trash', baseValue:1, zone:'ocean', zones:['ocean'], img:'img/Trash/Submarine Cable.png' },
];

const PLANT_DB = [
  // ── Pond (unique: reed, lily_pad, algae_clump, water_hyacinth, cattail, arrowhead_plant) ──
  { id:'reed',            name:'Reed',                    rarity:'plant', baseValue:0, zone:'pond',  zones:['pond'], img:'img/Plants/Reed.png' },
  { id:'lily_pad',        name:'Lily Pad',                rarity:'plant', baseValue:0, zone:'pond',  zones:['pond'], img:'img/Plants/Lily Pad.png' },
  { id:'algae_clump',     name:'Algae Clump',             rarity:'plant', baseValue:0, zone:'pond',  zones:['pond'], img:'img/Plants/Algae Clump.png' },
  { id:'water_hyacinth',  name:'Water Hyacinth',          rarity:'plant', baseValue:0, zone:'pond',  zones:['pond'], img:'img/Plants/Water Hyacinth.png' },
  { id:'hornwort',        name:'Hornwort',                rarity:'plant', baseValue:0, zone:'pond',  zones:['pond','river','lake'], img:'img/Plants/Hornwort.png' },
  { id:'duckweed',        name:'Duckweed',                rarity:'plant', baseValue:0, zone:'pond',  zones:['pond','river'], img:'img/Plants/Duckweed.png' },
  { id:'cattail',         name:'Cattail',                 rarity:'plant', baseValue:0, zone:'pond',  zones:['pond'], img:'img/Plants/Cattail.png' },
  { id:'watercress',      name:'Watercress',              rarity:'plant', baseValue:0, zone:'pond',  zones:['pond','river','lake'], img:'img/Plants/Watercress.png' },
  { id:'arrowhead_plant', name:'Arrowhead Plant',         rarity:'plant', baseValue:0, zone:'pond',  zones:['pond'], img:'img/Plants/Arrowhead Plant.png' },
  { id:'water_mint',      name:'Water Mint',              rarity:'plant', baseValue:0, zone:'pond',  zones:['pond','river'], img:'img/Plants/Water Mint.png' },
  // ── River (unique: water_crowfoot, river_weed, submerged_moss, water_celery, mares_tail) ──
  { id:'water_crowfoot',  name:'Water Crowfoot',          rarity:'plant', baseValue:0, zone:'river', zones:['river'], img:'img/Plants/Water Crowfoot.png' },
  { id:'river_weed',      name:'River Weed',              rarity:'plant', baseValue:0, zone:'river', zones:['river'], img:'img/Plants/River Weed.png' },
  { id:'submerged_moss',  name:'Submerged Moss',          rarity:'plant', baseValue:0, zone:'river', zones:['river'], img:'img/Plants/Submerged Moss.png' },
  { id:'water_celery',    name:'Water Celery',            rarity:'plant', baseValue:0, zone:'river', zones:['river'], img:'img/Plants/Water Celery.png' },
  { id:'flowering_rush',  name:'Flowering Rush',          rarity:'plant', baseValue:0, zone:'river', zones:['river','lake'], img:'img/Plants/Flowering Rush.png' },
  { id:'mares_tail',      name:"Mare's Tail",             rarity:'plant', baseValue:0, zone:'river', zones:['river'], img:"img/Plants/Mare's Tail.png" },
  // ── Lake (unique: yellow_lily, white_lily, quillwort, water_soldier, bladderwort) ──
  { id:'yellow_lily',     name:'Yellow Water Lily',       rarity:'plant', baseValue:0, zone:'lake',  zones:['lake'], img:'img/Plants/Yellow Water Lily.png' },
  { id:'white_lily',      name:'White Water Lily',        rarity:'plant', baseValue:0, zone:'lake',  zones:['lake'], img:'img/Plants/White Water Lily.png' },
  { id:'quillwort',       name:'Quillwort',               rarity:'plant', baseValue:0, zone:'lake',  zones:['lake'], img:'img/Plants/Quillwort.png' },
  { id:'water_soldier',   name:'Water Soldier',           rarity:'plant', baseValue:0, zone:'lake',  zones:['lake'], img:'img/Plants/Water Soldier.png' },
  { id:'bladderwort',     name:'Bladderwort',             rarity:'plant', baseValue:0, zone:'lake',  zones:['lake'], img:'img/Plants/Bladderwort.png' },
  { id:'water_violet',    name:'Water Violet',            rarity:'plant', baseValue:0, zone:'lake',  zones:['lake','bay'], img:'img/Plants/Water Violet.png' },
  { id:'bulrush',         name:'Bulrush',                 rarity:'plant', baseValue:0, zone:'lake',  zones:['lake','bay'], img:'img/Plants/Bulrush.png' },
  // ── Bay (unique: coralline_algae, irish_moss, dulse, rockweed) ──
  { id:'bladderwrack',    name:'Bladderwrack',            rarity:'plant', baseValue:0, zone:'bay',   zones:['bay','sea'], img:'img/Plants/Bladderwrack.png' },
  { id:'sea_lettuce',     name:'Sea Lettuce',             rarity:'plant', baseValue:0, zone:'bay',   zones:['bay','sea'], img:'img/Plants/Sea Lettuce.png' },
  { id:'kelp_frond',      name:'Kelp Frond',              rarity:'plant', baseValue:0, zone:'bay',   zones:['bay','sea'], img:'img/Plants/Kelp Frond.png' },
  { id:'eelgrass',        name:'Eelgrass',                rarity:'plant', baseValue:0, zone:'bay',   zones:['bay','sea'], img:'img/Plants/Eelgrass.png' },
  { id:'coralline_algae', name:'Coralline Algae',         rarity:'plant', baseValue:0, zone:'bay',   zones:['bay'], img:'img/Plants/Coralline Algae.png' },
  { id:'irish_moss',      name:'Irish Moss',              rarity:'plant', baseValue:0, zone:'bay',   zones:['bay'], img:'img/Plants/Irish Moss.png' },
  { id:'dulse',           name:'Dulse',                   rarity:'plant', baseValue:0, zone:'bay',   zones:['bay'], img:'img/Plants/Dulse.png' },
  { id:'rockweed',        name:'Rockweed',                rarity:'plant', baseValue:0, zone:'bay',   zones:['bay'], img:'img/Plants/Rockweed.png' },
  // ── Sea (unique: sea_oak, oarweed, pepper_dulse) ──
  { id:'giant_kelp',      name:'Giant Kelp',              rarity:'plant', baseValue:0, zone:'sea',   zones:['sea','ocean'], img:'img/Plants/Giant Kelp.png' },
  { id:'sugar_kelp',      name:'Sugar Kelp',              rarity:'plant', baseValue:0, zone:'sea',   zones:['sea','ocean'], img:'img/Plants/Sugar Kelp.png' },
  { id:'bootlace_weed',   name:'Bootlace Weed',           rarity:'plant', baseValue:0, zone:'sea',   zones:['sea','ocean'], img:'img/Plants/Bootlace Weed.png' },
  { id:'sea_oak',         name:'Sea Oak',                 rarity:'plant', baseValue:0, zone:'sea',   zones:['sea'], img:'img/Plants/Sea Oak.png' },
  { id:'oarweed',         name:'Oarweed',                 rarity:'plant', baseValue:0, zone:'sea',   zones:['sea'], img:'img/Plants/Oarweed.png' },
  { id:'pepper_dulse',    name:'Pepper Dulse',            rarity:'plant', baseValue:0, zone:'sea',   zones:['sea'], img:'img/Plants/Pepper Dulse.png' },
  // ── Ocean (unique: deep_coral, vent_algae, midnight_kelp, biolum_algae, abyssal_grass, tube_worm, sea_fan) ──
  { id:'deep_coral',      name:'Deep Sea Coral',          rarity:'plant', baseValue:0, zone:'ocean', zones:['ocean'], img:'img/Plants/Deep Sea Coral.png' },
  { id:'vent_algae',      name:'Black Smoker Vent Algae', rarity:'plant', baseValue:0, zone:'ocean', zones:['ocean'], img:'img/Plants/Black Smoker Vent Algae.png' },
  { id:'midnight_kelp',   name:'Midnight Zone Kelp',      rarity:'plant', baseValue:0, zone:'ocean', zones:['ocean'], img:'img/Plants/Midnight Zone Kelp.png' },
  { id:'biolum_algae',    name:'Bioluminescent Algae',    rarity:'plant', baseValue:0, zone:'ocean', zones:['ocean'], img:'img/Plants/Bioluminescent Algae.png' },
  { id:'abyssal_grass',   name:'Abyssal Sea Grass',       rarity:'plant', baseValue:0, zone:'ocean', zones:['ocean'], img:'img/Plants/Abyssal Sea Grass.png' },
  { id:'tube_worm',       name:'Giant Tube Worm Cluster', rarity:'plant', baseValue:0, zone:'ocean', zones:['ocean'], img:'img/Plants/Giant Tube Worm Cluster.png' },
  { id:'sea_fan',         name:'Sea Fan',                 rarity:'plant', baseValue:0, zone:'ocean', zones:['ocean'], img:'img/Plants/Sea Fan.png' },
];

const FISHDEX_TOTAL      = FISH_DB.length + TRASH_DB.length + PLANT_DB.length;
const FISHDEX_AUTO_TOTAL = FISH_DB.filter(f => !f.special && !f.manualOnly).length + TRASH_DB.length + PLANT_DB.length;

const SIZE_TABLE = [
  { size:1,  weight:70,  mult:0.30 },
  { size:2,  weight:100, mult:0.36 },
  { size:3,  weight:120, mult:0.43 },
  { size:4,  weight:135, mult:0.51 },
  { size:5,  weight:140, mult:0.60 },
  { size:6,  weight:135, mult:0.68 },
  { size:7,  weight:120, mult:0.76 },
  { size:8,  weight:100, mult:0.84 },
  { size:9,  weight:80,  mult:0.92 },
  { size:10, weight:62,  mult:1.00 },
  { size:11, weight:46,  mult:1.10 },
  { size:12, weight:33,  mult:1.22 },
  { size:13, weight:22,  mult:1.36 },
  { size:14, weight:14,  mult:1.52 },
  { size:15, weight:8,   mult:1.72 },
  { size:16, weight:4,   mult:1.96 },
  { size:17, weight:2,   mult:2.25 },
  { size:18, weight:2,   mult:2.60, trophy:true },
  { size:19, weight:1,   mult:3.00, trophy:true },
  { size:20, weight:1,   mult:3.50, trophy:true },
];

const RODS = [
  { id:'basic_rod',  name:'Basic Rod',  clicks:20, cost:0,           zone:'pond',  baseTierCost:1000,    tierDesc:'+5% fish sell price / tier',              img:'img/icons/Shop/Rods/Basic Rod.png' },
  { id:'river_rod',  name:'River Rod',  clicks:18, cost:9000,        zone:'river', baseTierCost:5000,    tierDesc:'+10% Net automation speed / tier',        img:'img/icons/Shop/Rods/River Rod.png' },
  { id:'lake_rod',   name:'Lake Rod',   clicks:16, cost:90000,       zone:'lake',  baseTierCost:25000,   tierDesc:'+10% Fisherman speed / tier',             img:'img/icons/Shop/Rods/Lake Rod.png' },
  { id:'bay_rod',    name:'Bay Rod',    clicks:14, cost:900000,      zone:'bay',   baseTierCost:100000,  tierDesc:'+12% storage capacity / tier',            img:'img/icons/Shop/Rods/Bay Rod.png' },
  { id:'sea_rod',    name:'Sea Rod',    clicks:12, cost:625000000,        zone:'sea',   baseTierCost:500000,    tierCosts:[1250000000,12500000000,125000000000],                      tierDesc:'+10% Boat automation speed / tier',       img:'img/icons/Shop/Rods/Sea Rod.png' },
  { id:'ocean_rod',  name:'Ocean Rod',  clicks:10, cost:62500000000,      zone:'ocean', baseTierCost:2500000,   tierCosts:[125000000000,1250000000000,12500000000000],                tierDesc:'+10% Fleet speed / tier',                 img:'img/icons/Shop/Rods/Ocean Rod.png' },
  { id:'carbon_rod', name:'Carbon Rod', clicks:8,  cost:250000000000,     zone:'all',   baseTierCost:10000000,  tierCosts:[500000000000,5000000000000,50000000000000],               tierDesc:'+3% Legendary catch chance / tier',       img:'img/icons/Shop/Rods/Carbon Rod.png' },
  { id:'mythic_rod', name:'Mythic Rod', clicks:6,  cost:1000000000000,    zone:'abyss', baseTierCost:50000000,  tierCosts:[2000000000000,20000000000000,200000000000000],            tierDesc:'+8% Diamond earnings / tier',             img:'img/icons/Shop/Rods/Mythic Rod.png' },
  { id:'abyss_rod',  name:'Abyss Rod',  clicks:4,  cost:10000000000000,   zone:'abyss', baseTierCost:200000000, tierCosts:[20000000000000,200000000000000,2000000000000000],         tierDesc:'+8% Abyss fish sell value / tier',        img:'img/icons/Shop/Rods/Abyss Rod.png' },
];

const STORAGE_ITEMS = [
  { id:'bucket',        name:'Bucket',              cost:50,     capacity:5,     unlocksAt:'pond',  desc:'+5 fish slots',      img:'img/icons/Shop/Storage/Bucket.png' },
  { id:'icebox',        name:'Ice Box',              cost:200,    capacity:20,    unlocksAt:'pond',  desc:'+20 fish slots',     img:'img/icons/Shop/Storage/Ice Box.png' },
  { id:'coolerbox',     name:'Cooler Box',           cost:600,    capacity:50,    unlocksAt:'river', desc:'+50 fish slots',     img:'img/icons/Shop/Storage/Cooler Box.png' },
  { id:'fridge',        name:'Portable Fridge',      cost:2000,   capacity:150,   unlocksAt:'river', desc:'+150 fish slots',    img:'img/icons/Shop/Storage/Portable Fridge.png' },
  { id:'freezer',       name:'Chest Freezer',        cost:10000,  capacity:500,   unlocksAt:'bay',   desc:'+500 fish slots',    img:'img/icons/Shop/Storage/Chest Freezer.png' },
  { id:'walkinfreezer', name:'Walk-in Freezer',      cost:50000000,  capacity:2000,  unlocksAt:'sea',   desc:'+2000 fish slots',   img:'img/icons/Shop/Storage/Walk-in Freezer.png' },
  { id:'harborcs',             name:'Harbor Cold Storage',   cost:250000000, capacity:10000, unlocksAt:'sea', desc:'+10000 fish slots',  img:'img/icons/Shop/Storage/Harbor Cold Storage.png' },
  // Ghost Ship expedition reward — cannot be purchased
  { id:'ancient_frozen_storage', name:'Ancient Frozen Storage', cost:0,         capacity:2500,  unlocksAt:'sea', desc:'+2500 fish slots',   img:'img/icons/Shop/Storage/Ancient Frozen Storage.png', ghostOnly:true },
];

const BOBBERS = [
  { id:'basic_bobber',      name:'Basic Bobber',      baseCost:800,  desc:'+3% fishing speed per tier (all methods)', img:'img/icons/Shop/Bait/Basic bobber.png' },
  { id:'sensitive_bobber',  name:'Sensitive Bobber',  baseCost:1200, desc:'+1% rare fish chance per tier',            img:'img/icons/Shop/Bait/Sensitive Bobber.png' },
  { id:'heavy_bobber',      name:'Heavy Bobber',      baseCost:2000, desc:'+1 fish size tier per tier',               img:'img/icons/Shop/Bait/Heavy Bobber.png' },
  { id:'electronic_bobber', name:'Electronic Bobber', baseCost:5000, desc:'+50% extra catch chance per tier (stacks)', img:'img/icons/Shop/Bait/Electronic Bobber.png' },
  { id:'premium_bait',      name:'Premium Bait',      baseCost:0,    desc:'+100% rare chance, 30 min (Diamonds)',     img:'img/icons/Shop/Bait/Premium Bait.png', diamondCost:5 },
];

const BOBBER_COSMETICS = [
  { id:'bc_basic',      name:'Basic Bobber',              diamondCost:0,   img:'img/Player bobber cosmetics/Basic bobber.png' },
  { id:'bc_sensitive',  name:'Sensitive Bobber',          diamondCost:5,   img:'img/Player bobber cosmetics/Sensitive Bobber.png' },
  { id:'bc_heavy',      name:'Heavy Bobber',              diamondCost:10,  img:'img/Player bobber cosmetics/Heavy Bobber.png' },
  { id:'bc_electronic', name:'Electronic Bobber',         diamondCost:15,  img:'img/Player bobber cosmetics/Electronic Bobber.png' },
  { id:'bc_banana',     name:'Banana Bobber',             diamondCost:15,  img:'img/Player bobber cosmetics/Banana bobber.png' },
  { id:'bc_target',     name:'Target Bobber',             diamondCost:30,  img:'img/Player bobber cosmetics/Target bobber.png' },
  { id:'bc_worm',       name:'Worm Bobber',               diamondCost:35,  img:'img/Player bobber cosmetics/Worm bobber.png' },
  { id:'bc_worm_anim',  name:'Animated Worm Bobber',      diamondCost:100, img:'img/Player bobber cosmetics/Animated worm bobber.gif' },
  { id:'bc_cthulhu',    name:"Finger of C'thulu Bobber",  diamondCost:250, img:"img/Player bobber cosmetics/Finger of C'thulu bobber.png" },
];

const AUTOMATION = [
  // Nets — unlocks at Pond
  { id:'fishing_net',    name:'Fishing Net',    cost:100, firstCost:10, rate:60,   desc:'1 catch / 60s',   unlocksAt:'pond',  type:'net',        img:'img/icons/Shop/Automation/Fishing Net.png' },
  { id:'reinforced_net', name:'Reinforced Net', cost:3000,       rate:45,   desc:'1 catch / 45s',   unlocksAt:'pond',  type:'net',        img:'img/icons/Shop/Automation/Reinforced Net.png' },
  { id:'river_net',      name:'River Net',      cost:15000,      rate:30,   desc:'1 catch / 30s',   unlocksAt:'pond',  type:'net',        img:'img/icons/Shop/Automation/River Net.png' },
  // Fishermen — unlocks at River
  { id:'local_fisher',   name:'Local Fisher',   cost:3000,       rate:30,   desc:'1 catch / 30s',   unlocksAt:'river', type:'fisherman',  img:'img/icons/Shop/Automation/Local Fisher.png' },
  { id:'skilled_fisher', name:'Skilled Fisher', cost:30000,      rate:15,   desc:'1 catch / 15s',   unlocksAt:'river', type:'fisherman',  img:'img/icons/Shop/Automation/Skilled Fisher.png' },
  { id:'veteran_fisher', name:'Veteran Fisher', cost:300000,     rate:8,    desc:'1 catch / 8s',    unlocksAt:'river', type:'fisherman',  img:'img/icons/Shop/Automation/Veteran Fisher.png' },
  // Boats — unlocks at Bay
  { id:'row_boat',       name:'Row Boat',       cost:350000,     rate:8,    desc:'1 catch / 8s',    unlocksAt:'bay',   type:'boat',       img:'img/icons/Shop/Automation/Row Boat.png' },
  { id:'motor_boat',     name:'Motor Boat',     cost:1200000,    rate:3,    desc:'1 catch / 3s',    unlocksAt:'bay',   type:'boat',       img:'img/icons/Shop/Automation/Motor Boat.png' },
  { id:'fishing_boat',   name:'Fishing Boat',   cost:4000000,    rate:1.5,  desc:'1 catch / 1.5s',  unlocksAt:'bay',   type:'boat',       img:'img/icons/Shop/Automation/Fishing Boat.png' },
  // Fleets — unlocks at Sea
  { id:'small_fleet',    name:'Small Fleet',    cost:125000000,  rate:0.5,  desc:'2 catches / s',   unlocksAt:'sea',   type:'fleet',      img:'img/icons/Shop/Automation/Small Fleet.png' },
  { id:'large_fleet',    name:'Large Fleet',    cost:500000000,  rate:0.25, desc:'4 catches / s',   unlocksAt:'sea',   type:'fleet',      img:'img/icons/Shop/Automation/Large Fleet.png' },
  { id:'deep_sea_fleet', name:'Deep Sea Fleet', cost:2500000000, rate:0.1,  desc:'10 catches / s',  unlocksAt:'sea',   type:'fleet',      img:'img/icons/Shop/Automation/Deep Sea Fleet.png' },
  // Ghost Ship expedition rewards — unlocks at Sea, cannot be purchased
  { id:'ancient_fisherman', name:'Ancient Fisherman',   cost:0, rate:1,   desc:'1 catch / s',     unlocksAt:'sea', type:'fisherman', ghostOnly:true, img:'img/icons/Shop/Automation/Ancient fisherman.png' },
  { id:'ancient_boat',      name:'Ancient Fishing Boat', cost:0, rate:0.5, desc:'2 catches / s',   unlocksAt:'sea', type:'boat',      ghostOnly:true, img:'img/icons/Shop/Automation/Ancient fishing boat.png' },
];

// ─── QUEST DATA ───────────────────────────────────────────────────────────────

const DAILY_QUESTS = [
  { id:'dq_morning',  name:'Morning Catch',  desc:'Catch 10 fish',                    type:'fish',      goal:10, reward:20  },
  { id:'dq_market',   name:'Market Day',     desc:'Sell 5 fish',                      type:'sell',      goal:5,  reward:15  },
  { id:'dq_lucky',    name:'Lucky Cast',     desc:'Catch 1 Rare+ fish',               type:'rare',      goal:1,  reward:50  },
  { id:'dq_cleaner',  name:'Pond Cleaner',   desc:'Catch 5 trash items',              type:'trash',     goal:5,  reward:10  },
  { id:'dq_seagull',  name:'Bird Hunter',    desc:'Click the seagull flying by',      type:'seagull',   goal:1,  reward:40  },
  { id:'dq_variety',  name:'Variety Fisher', desc:'Catch 3 different species today',  type:'variety',   goal:3,  reward:25  },
  { id:'dq_dawn',     name:'Dawn Fisher',    desc:'Catch a fish during Dawn (04-07)', type:'dawn',      goal:1,  reward:35  },
  { id:'dq_house',    name:'Full House',     desc:'Fill your storage to capacity',    type:'storefull', goal:1,  reward:20  },
];

const WEEKLY_QUESTS = [
  { id:'wq_pond',    name:'Pond Master',    desc:'Catch 100 fish this week',          type:'fish',          goal:100, reward:200 },
  { id:'wq_trash',   name:'Trash Hauler',   desc:'Catch 50 trash items this week',    type:'trash',         goal:50,  reward:150 },
  { id:'wq_mogul',   name:'Market Mogul',   desc:'Sell fish worth 500c total',        type:'coins',         goal:500, reward:250 },
  { id:'wq_dex',     name:'Dex Complete',   desc:'Catch all 10 pond fish species',    type:'fishdex',       goal:10,  reward:500 },
  { id:'wq_seagull', name:'Bird Watcher',   desc:'Click the seagull 5 times',         type:'seagull_week',  goal:5,   reward:300 },
];

const ACHIEVEMENTS = [
  { id:'ach_first',    name:'First Cast',        desc:'Catch your first fish',                  type:'totalfish',     goal:1,   reward:10  },
  { id:'ach_lucky',    name:'Lucky Day',          desc:'Catch an Epic fish',                     type:'epic',          goal:1,   reward:100 },
  { id:'ach_hoarder',  name:'Hoarder',            desc:'Fill storage to capacity 3 times',       type:'storefills',    goal:3,   reward:50  },
  { id:'ach_night',    name:'Night Owl',          desc:'Catch a fish at midnight (00:00-01:00)', type:'midnight',      goal:1,   reward:75  },
  { id:'ach_trash',    name:'Trash King',         desc:'Catch 100 trash items total',            type:'totaltrash',    goal:100, reward:80  },
  { id:'ach_pond',     name:'Pond Complete',      desc:'Catch all 30 pond items',                type:'pondall',       goal:30,  reward:500 },
  { id:'ach_speed',    name:'Speed Fisher',       desc:'Catch 20 fish in 1 real hour',           type:'speed',         goal:20,  reward:150 },
  { id:'ach_7days',    name:'Patient Angler',     desc:'Log in 7 days in a row',                 type:'streak',        goal:7,   reward:300 },
  { id:'ach_gull10',   name:'Lucky Bird',         desc:'Click the seagull 10 times total',       type:'totalseagull',  goal:10,  reward:200 },
  { id:'ach_gull50',   name:'Seagull Whisperer',  desc:'Click the seagull 50 times total',       type:'totalseagull',  goal:50,  reward:500 },
  // ── Progression ───────────────────────────────────────────────────────────
  { id:'ach_h_born_fisher',   name:'Born Fisherman',     desc:'Catch 1,000 fish by hand.',                                  type:'h_manual_fish',    goal:1000, reward:500  },
  { id:'ach_h_trophy_streak', name:'Lucky Streak',       desc:'Catch 3 Trophy fish in a row without missing a bite.',       type:'h_trophy_streak',  goal:3,    reward:250  },
  { id:'ach_h_double_legend', name:'Unbelievable',       desc:'Catch two Legendary fish within 5 minutes.',                 type:'h_double_legend',  goal:1,    reward:500  },
  { id:'ach_h_perfect_cast',  name:'Perfect Cast',       desc:'Catch 25 fish in a row without missing a bite.',             type:'h_cast_streak',    goal:25,   reward:300  },
  { id:'ach_h_only_best',     name:'Only the Best',      desc:'Catch a Legendary fish while Lucky Hook is active.',         type:'h_only_best',      goal:1,    reward:400  },
  { id:'ach_h_tiny_terror',   name:'Tiny Terror',        desc:'Catch a Trophy fish weighing less than 10 grams.',           type:'h_tiny_trophy',    goal:1,    reward:300  },
  { id:'ach_h_monster',       name:'Monster Hunter',     desc:'Catch a Trophy fish weighing over 100 kg.',                  type:'h_big_trophy',     goal:1,    reward:500  },
  { id:'ach_h_treasure_25',   name:'Treasure Addict',    desc:'Find 25 Lost Treasures.',                                    type:'h_lost_treasure',  goal:25,   reward:300  },
  { id:'ach_h_treasure_100',  name:'Sunken Fortune',     desc:'Find 100 Lost Treasures.',                                   type:'h_lost_treasure',  goal:100,  reward:750  },
  { id:'ach_h_pkg_day',       name:'Lucky Pocket',       desc:'Open 3 Care Packages in one day.',                           type:'h_pkg_day',        goal:1,    reward:350  },
  { id:'ach_h_jackpot',       name:'Jackpot!',           desc:'Receive the maximum Care Package reward.',                   type:'h_jackpot',        goal:1,    reward:500  },
  { id:'ach_h_bird_whisper',  name:'Bird Whisperer',     desc:'Feed the Seagull during all 5 time periods in one day.',     type:'h_seagull_periods',goal:5,    reward:400  },
  { id:'ach_h_bird_friend',   name:'Bird Friend',        desc:'Feed Seagulls 100 times total.',                             type:'totalseagull',     goal:100,  reward:400  },
  { id:'ach_h_bird_army',     name:'Bird Army',          desc:'Have 10 Seagulls visit in one play session.',                type:'h_seagull_sess',   goal:10,   reward:300  },
  { id:'ach_h_one_more',      name:'One More Cast',      desc:'Catch a fish right before closing the app.',                 type:'h_last_fish',      goal:1,    reward:200  },
  { id:'ach_h_ocean',         name:'The Long Journey',   desc:'Reach the Ocean.',                                           type:'h_ocean',          goal:1,    reward:600  },
  { id:'ach_h_abyss',         name:'Into the Darkness',  desc:'Complete your first Prestige reset.',                        type:'h_prestige',       goal:1,    reward:800  },
  { id:'ach_h_prestige10',    name:'Again?!',            desc:'Prestige 10 times.',                                         type:'h_prestige',       goal:10,   reward:750  },
  { id:'ach_h_prestige25',    name:'Never Enough',       desc:'Prestige 25 times.',                                         type:'h_prestige',       goal:25,   reward:1500 },
  { id:'ach_h_pearls',        name:'Pearl Collector',    desc:'Own 500 Black Pearls.',                                      type:'h_pearls',         goal:500,  reward:1000 },
  { id:'ach_h_millionaire',   name:'Millionaire',        desc:'Hold 1,000,000 coins at once.',                              type:'h_millionaire',    goal:1,    reward:500  },
  { id:'ach_h_tycoon',        name:'Tycoon',             desc:'Earn 100,000,000 coins total.',                              type:'h_tycoon',         goal:1,    reward:1000 },
  { id:'ach_h_bigspender',    name:'Big Spender',        desc:'Spend 50,000,000 coins in the shop.',                        type:'h_bigspender',     goal:1,    reward:750  },
  { id:'ach_h_harbor_sell',   name:'Everything Must Go', desc:'Sell a fully packed Harbor Cold Storage.',                   type:'h_harbor_sell',    goal:1,    reward:600  },
  { id:'ach_h_world_dex',     name:'World Explorer',     desc:'Complete the Fishdex for every zone.',                       type:'h_world_dex',      goal:6,    reward:1500 },
  { id:'ach_h_full_dex',      name:'Master Collector',   desc:'Complete the entire Fishdex.',                               type:'h_fishdex',        goal:FISHDEX_AUTO_TOTAL, reward:2000 },
  { id:'ach_h_early_bird',    name:'Early Bird',         desc:'Catch a fish between 04:00 and 05:00 in-game.',              type:'h_dawn_first',     goal:1,    reward:200  },
  { id:'ach_h_insomniac',     name:'Insomniac',          desc:'Catch 100 fish between midnight and 04:00 in-game.',         type:'h_midnight_fish',  goal:100,  reward:400  },
  { id:'ach_h_clock',         name:'Around the Clock',   desc:'Catch fish during all 5 time periods in one day.',           type:'h_all_periods',    goal:5,    reward:600  },
  { id:'ach_h_weekend',       name:'Weekend Warrior',    desc:'Play on both Saturday and Sunday.',                          type:'h_weekend',        goal:1,    reward:250  },
  { id:'ach_h_365',           name:'Patient Indeed',     desc:'Play on 365 different days.',                                type:'h_unique_days',    goal:365,  reward:2000 },
  { id:'ach_h_pure_skill',    name:'Pure Skill',         desc:'Win a Competition without using Lucky Hook.',                type:'h_pure_skill',     goal:1,    reward:750  },
  { id:'ach_h_untouchable',   name:'Untouchable',        desc:'Win 10 Competitions in a row.',                              type:'h_comp_streak',    goal:10,   reward:1000 },
  { id:'ach_h_collector',     name:"Collector's Dream",  desc:'Own every Rod, Bobber tier, Storage tier and Automation.',   type:'h_collector',      goal:1,    reward:1000 },
  { id:'ach_h_empire',        name:'Empire Builder',     desc:'Unlock all 6 fishing zones.',                                type:'h_empire',         goal:1,    reward:800  },
  // ── Hidden Achievements (7 total) ─────────────────────────────────────────
  { id:'ach_h_night_legend',  name:'Night Hunter',       desc:'Catch a Legendary fish during Night (22:00–04:00).',         type:'h_night_legend',   goal:1,    reward:300,  hidden:true },
  { id:'ach_h_pond_first',    name:'Perfect Pond',       desc:'Complete the Pond Fishdex before unlocking the River.',      type:'h_pond_first',     goal:1,    reward:500,  hidden:true },
  { id:'ach_h_no_waste',      name:'No Waste',           desc:'Reach the River without catching any trash manually.',       type:'h_no_waste',       goal:1,    reward:500,  hidden:true },
  { id:'ach_h_restless',      name:'Restless',           desc:'Open the shop 5 times in under 1 minute.',                   type:'h_shop_rush',      goal:1,    reward:150,  hidden:true },
  { id:'ach_h_hello_there',   name:'Hello There',        desc:'Tap the fisherman on the lake shore 3 times.',               type:'h_fisher_npc',     goal:1,    reward:200,  hidden:true },
  { id:'ach_h_money_obsessed',name:'Money Obsessed',     desc:'Tap the coin counter 25 times.',                             type:'h_coin_tap',       goal:1,    reward:100,  hidden:true },
  { id:'ach_h_window_shopper',name:'Window Shopper',     desc:'Tap a locked Fishdex entry 10 times.',                       type:'h_locked_dex',     goal:1,    reward:100,  hidden:true },
  // ── Ghost Ship ────────────────────────────────────────────────────────────────
  { id:'ach_gs_spotted',    name:'Ghost Encounter',    desc:'Spot the Ghost Ship for the first time.',                    type:'h_gs_spotted',      goal:1,    reward:150 },
  { id:'ach_gs_first',      name:'Privateer',          desc:'Complete your first Ghost Ship expedition.',                 type:'h_gs_expeditions',  goal:1,    reward:200 },
  { id:'ach_gs_5',          name:'Buccaneer',          desc:'Complete 5 Ghost Ship expeditions.',                        type:'h_gs_expeditions',  goal:5,    reward:350 },
  { id:'ach_gs_25',         name:'Sea Captain',        desc:'Complete 25 Ghost Ship expeditions.',                       type:'h_gs_expeditions',  goal:25,   reward:750 },
  { id:'ach_gs_boat',       name:'Ancient Fleet',      desc:'Receive an Ancient Fishing Boat from the Ghost Ship.',      type:'h_gs_boat',         goal:1,    reward:300 },
  { id:'ach_gs_100',        name:'Legendary Pirate',   desc:'Complete 100 Ghost Ship expeditions.',                      type:'h_gs_expeditions',  goal:100,  reward:1500, hidden:true },
  { id:'ach_gs_all_units',  name:'Full Crew',          desc:'Own all 3 Ghost Ship unit types at once.',                  type:'h_gs_all_units',    goal:1,    reward:500,  hidden:true },
  { id:'ach_gs_ghostbust',  name:'Ghost Buster',       desc:'Max out the Ghost Busters pearl upgrade.',                  type:'h_gs_ghostbusters', goal:50,   reward:1000, hidden:true },
  // ── Sunken Treasure Chest ─────────────────────────────────────────────────────
  { id:'ach_chest_first',   name:'Treasure Hunter',    desc:'Open your first Sunken Treasure Chest.',                    type:'h_chest_opened',    goal:1,    reward:200 },
  { id:'ach_chest_10',      name:'Wreck Diver',        desc:'Open 10 Sunken Treasure Chests.',                           type:'h_chest_opened',    goal:10,   reward:400 },
  { id:'ach_chest_50',      name:'Deep Sea Salvager',  desc:'Open 50 Sunken Treasure Chests.',                           type:'h_chest_opened',    goal:50,   reward:800 },
  { id:'ach_chest_diamonds',name:'Diamond Diver',      desc:'Earn 100 Diamonds from Sunken Treasure Chests.',            type:'h_chest_diamonds',  goal:100,  reward:600 },
  { id:'ach_chest_coins',   name:'Coin Hoard',         desc:'Earn 10,000,000 coins from Sunken Treasure Chests.',        type:'h_chest_coins',     goal:1,    reward:500 },
  { id:'ach_chest_hold5',   name:'Full Hold',          desc:'Hold 5 Sunken Treasure Chests at once.',                    type:'h_chest_hold',      goal:5,    reward:300,  hidden:true },
  { id:'ach_chest_auto',    name:'Automated Treasure', desc:'Receive a Sunken Treasure Chest from your fleet.',          type:'h_chest_auto',      goal:1,    reward:250,  hidden:true },
];

// ─── COMPETITION & HOF DATA ───────────────────────────────────────────────────

const COMP_DURATION_MS = 5 * 60 * 1000; // 5 min prototype (60 min production)
const BOT_NAMES = ['FisherKing','Angler99','ReelDeal','CaptainHook','WormWrangler',
                   'BigCatch','TackleMaster','PatienceIsKey','LureExpert'];
const SERIES_LENGTH = 10;
const SERIES_POINTS = [0, 10, 7, 5, 3, 2, 1, 1, 1, 1, 1]; // index = rank; rank > 10 → 0
const _COMP_NAME_FALLBACK = [
  'The Classic Cup','The Open Tournament','The Fishing Derby',
  'The Challenge','The Trophy Hunt','The Masters',
  'The Championship','The Open','The Grand Prix','The Invitational',
  'The Finals','The Showdown',
];
let _competitionNamesData = null; // patient_angler_competition_names_v0_1_14.json
let _grandWinnersMode = false;    // true while grand-winners screen is showing
function getCompBaseReward(rank, zone) {
  if (rank < 1 || rank > 3) return 0;
  const z      = zone || (G.competition && G.competition.zone) || G.currentZone;
  const hourly = estimateAutoHourlyIncome() / 24;
  if (z === 'pond') {
    const fixed = [500,  250,  100 ][rank - 1];
    const pct   = [0.05, 0.03, 0.01][rank - 1];
    return fixed + Math.round(hourly * pct);
  }
  const ZONE_MULTS = {
    river: [1.25, 0.75,  0.375],
    lake:  [2,    1.2,   0.6  ],
    bay:   [3,    1.8,   0.9  ],
    sea:   [5,    3,     1.5  ],
    ocean: [10,   6,     3    ],
  };
  const m = (ZONE_MULTS[z] || ZONE_MULTS.river)[rank - 1];
  return Math.round(hourly * m);
}
const HOF_SEEDED = {
  pond:  {fishName:'Giant Crucian Carp', value:2850,   rarity:'epic',      size:20, player:'MasterAngler'},
  river: {fishName:'Brown Trout',        value:1560,   rarity:'rare',      size:20, player:'TroutHunter'},
  lake:  {fishName:'Catfish',            value:31500,  rarity:'epic',      size:20, player:'BigGameFisher'},
  bay:   {fishName:'Sea Trout',          value:54000,  rarity:'epic',      size:20, player:'BayMaster'},
  sea:   {fishName:'Halibut',            value:135000, rarity:'epic',      size:20, player:'DeepSeaDave'},
  ocean: {fishName:'Coelacanth',         value:432000, rarity:'epic',      size:20, player:'OceanKing'},
};

const ZONE_TITLES = {
  pond:  'Master Angler of the Pond',
  river: 'Master Angler of the River',
  lake:  'Master Angler of the Lake',
  bay:   'Master Angler of the Bay',
  sea:   'Master Angler of the Sea',
  ocean: 'Master Angler of the Ocean',
};

// ─── ZONE & TRANSPORT DATA ───────────────────────────────────────────────────

const ZONE_DATA = [
  { id:'pond',   name:'Pond',   depth:'Shallow',       desc:'A quiet pond teeming with familiar fish.',             requiredRod:null,        requiredTransport:null,              bg:'img/backgrounds/pond.png', bgColor:'#2d6e8e' },
  { id:'river',  name:'River',  depth:'Medium',        desc:'Fast current and fresh-water species await.',          requiredRod:'river_rod',  requiredTransport:'waders',          bg:'img/backgrounds/River.png', bgColor:'#1a5c3e' },
  { id:'lake',   name:'Lake',   depth:'Medium-deep',   desc:'Deep waters hold larger and rarer fish.',              requiredRod:'lake_rod',   requiredTransport:'rowing_boat',     bg:'img/backgrounds/Lake.png',  bgColor:'#1a3a6e' },
  { id:'bay',    name:'Bay',    depth:'Medium-deep',   desc:'Tidal waters where salt and fresh meet.',              requiredRod:'bay_rod',    requiredTransport:'speedboat',       bg:'img/backgrounds/Bay.png',   bgColor:'#1a4a6e' },
  { id:'sea',    name:'Sea',    depth:'Deep',          desc:'Open sea — trophy catches and sea monsters.',          requiredRod:'sea_rod',    requiredTransport:'fishing_vessel',  bg:'img/backgrounds/sea.png',   bgColor:'#0d2a4e' },
  { id:'ocean',  name:'Ocean',  depth:'Extreme',       desc:'The depths hold legendary creatures.',                 requiredRod:'ocean_rod',  requiredTransport:'research_vessel', bg:'img/backgrounds/Ocean.png', bgColor:'#060f2e' },
];

const TRANSPORT = [
  { id:'waders',           name:'Waders',           cost:6000,      zone:'river', desc:'Wade into the River' },
  { id:'rowing_boat',      name:'Rowing Boat',       cost:60000,     zone:'lake',  desc:'Row out to the Lake' },
  { id:'speedboat',        name:'Speedboat',         cost:600000,    zone:'bay',   desc:'Speed out to the Bay' },
  { id:'fishing_vessel',   name:'Fishing Vessel',    cost:1250000000,  zone:'sea',   desc:'Sail out to the Sea' },
  { id:'research_vessel',  name:'Research Vessel',   cost:125000000000, zone:'ocean', desc:'Venture to the Ocean' },
];

// ─── STATE ────────────────────────────────────────────────────────────────────

const DEFAULT_STATE = {
  coins: 0,
  diamonds: 5,
  tutorialDone: false,
  tutStep: 0,
  tutSeagullSpawned: false,
  tutSeagullClaimed: false,
  premiumBaitActive: false,
  premiumBaitEnd: 0,
  seagullBaitCount: 0,
  numberFormat: 'normal',
  soundEnabled: true,
  hapticsEnabled: true,
  tickersEnabled: true,
  dadJokesEnabled: false,
  dadJokesRemainingKeys: [],
  dadJokesLastShownKey: '',
  hideCompletedQuests: false,
  showGuildOverlay: true,
  musicMuted: false,
  musicVolume: 50,
  fontScale: 100,
  bobberScale: 100,
  fontScaleCustomized: false,
  bobberScaleCustomized: false,
  playerName: '',
  currentZone: 'pond',
  currentRod: 'basic_rod',
  inventory: [],          // { fishId, name, rarity, size, sizeMult, value, img }
  ownedRods: ['basic_rod'],
  ownedStorage: [],       // [{ id, purchasedAt }] — stackable, each adds capacity
  bobberTiers: { basic_bobber:0, sensitive_bobber:0, heavy_bobber:0, electronic_bobber:0 },
  rodTiers: { basic_rod:0, river_rod:0, lake_rod:0, bay_rod:0, sea_rod:0, ocean_rod:0, carbon_rod:0, mythic_rod:0, abyss_rod:0 },
  ownedTransport: [],
  ownedAutomation: [],    // { id, zone, purchasedAt }
  lastSeen: 0,
  backgroundAt: 0,
  competition: null,
  records: {},
  hofWins: [],
  hofActive: {},
  hofLastReset: 0,
  blackPearls: 0,
  prestigeCount: 0,
  pearlUpgrades: { discount:0, speed:0, storage:0, multicatch:0, luckywaters:0, masterangler:0, treasure:0, offline:0, compspirit:0, fishwhisperer:0, treasurehold:0, ghostbusters:0, startingcapital:0, ghostwhisperer:0 },
  seaComicSeen:                    false,
  sunkenTreasureUnlocked:          false,
  sunkenChests:                    [],
  automationTreasureCooldownUntil: 0,
  expeditionVessels:               [],
  sunkenTreasureStats: { foundTotal:0, foundManual:0, foundAutomation:0, foundExpedition:0, opened:0, diamondsEarned:0, coinsEarned:0 },
  removeAds: false,
  chestFullPopupSuppressed: false,
  devSupportOwned: false,
  rapidWatersEnd: 0,
  adSpeedBoostEnd: 0,
  specialCatchEnd: 0,
  specialCatchNextAt: 0,
  specialEventNextAt: 0,
  diamondUpgrades: { autoSpeed: 0, storage: 0 },
  starterPackClaimed: false,
  lastShopVisit: 0,
  fishermanLastDialogHour: {},
  series: {
    index: 1, competitionNumber: 0, nextName: '',
    usedNames: [], standings: {}, grandPending: false,
  },
  targetedLureLevel: 0,
  targetedLureTargets: [],
  masteryData: {},
  manualFishdex: {}, // { fishId: { discovered, firstCaughtDate, totalCatches, largestWeight, bestSize, trophyCount } }
  activeAutomationZones: null,  // null = all unlocked zones; array of ≤2 zone IDs when player configures
  autoSellEnd: 0,
  autoSellPermanent: false,
  autoSellEnabled: true,
  autoSellNextAt: 0,
  w1legBugCleaned: false,
  fishdex: [],
  trashPile: {},   // { trashId: quantity }
  plantPile: {},   // { plantId: quantity }
  fishPile:     {},   // { "fishId|size": quantity }
  trophyPile:   [],   // [{ fishId, name, rarity, weightG, img, caughtAt, zone }]
  trophyRecords:{},   // { fishId: { weight, caughtAt } } — heaviest per species
  stats: {
    totalFish: 0,
    totalTrash: 0,
    totalEpic: 0,
    trophyCatches: 0,
    totalSeagull: 0,
    storageFills: 0,
    hourFish: 0,
    hourStart: 0,
    playStreak: 0,
    lastPlay: '',
    lifeCoinsEarned: 0,
    lifeCoinsSpent: 0,
    highestCoins: 0,
    bestFishSold: 0,
    autoCatchTotal: 0,
    autoCatchNet: 0,
    autoCatchFisherman: 0,
    autoCatchBoat: 0,
    autoCatchFleet: 0,
    offlineFishTotal: 0,
    evLuckyHook: 0,
    evFishingFrenzy: 0,
    evRapidWaters: 0,
    evCarePackage: 0,
    evLostTreasure: 0,
    evPremiumBaits: 0,
    manualFishTotal: 0,
    trophyStreak: 0,
    lastLegendaryAt: 0,
    castStreak: 0,
    seagullSession: 0,
    seagullPeriodsDate: '',
    seagullPeriods: [],
    carePkgToday: 0,
    carePkgDate: '',
    compStreak: 0,
    lastCompLucky: false,
    midnightFishTotal: 0,
    periodsDate: '',
    periodsCaught: [],
    weekendSat: false,
    weekendSun: false,
    uniqueDaysPlayed: 0,
    noWasteTrash: 0,
    lastFishAt: 0,
    recBiggestFish:         null,
    recHeaviestTrophy:      null,
    recManualTrophyCount:   0,
    recMostValuableSale:    null,
    recMostValuableSaleVal: 0,
    recHighestMult:         0,
    recHighestDiamonds:     0,
    recHighestBlackPearls:  0,
    recHighestZone:         'pond',
    recGrandTitles:         0,
    fishFightTriggered:     0,
    fishFightWon:           0,
    fishFightLost:          0,
    fishFightCoinsEarned:   0,
  },
  quests: {
    dailyIds: [],
    dp: {},         // daily progress: { questId: { prog, claimed } }
    weeklyId: null,
    wp: { prog: 0, claimed: false },
    dailyDate: '',
    weeklyDate: '',
    ap: {},         // achievement progress: { achId: { prog, claimed } }
    dailySpecies: [],
  },
  unlockedBobberCosmetics: ['bc_basic'],
  equippedBobberCosmetic: 'bc_basic',
  guild: {
    order: null,
    recentFishIds: [],
    stats: {
      ordersCompleted: 0,
      ordersFailed: 0,
      goldenCompleted: 0,
      totalFishDelivered: 0,
      largestOrderTotal: 0,
      totalRewardEarned: 0,
      totalCompletionTimeMs: 0,
      completionTimeSamples: 0,
    },
  },
  ghostShips: [],
  ghostShipNextSpawnAt: 0,
  usedCodes: [],
};

// Captured before any saveState() calls so loadCloudSave() knows if this is a fresh install
const _hadLocalSave = !!localStorage.getItem('patientAngler_v1');

let G = loadState();

function _earnCoins(n) {
  if (!n) return;
  G.coins += n;
  G.stats.lifeCoinsEarned = (G.stats.lifeCoinsEarned || 0) + n;
  if (G.coins > (G.stats.highestCoins || 0)) G.stats.highestCoins = G.coins;
  if (G.coins >= 1000000) syncAch('h_millionaire', 1);
  if ((G.stats.lifeCoinsEarned || 0) >= 100000000) syncAch('h_tycoon', 1);
}
function _spendCoins(n) {
  if (!n) return;
  G.coins -= n;
  G.stats.lifeCoinsSpent = (G.stats.lifeCoinsSpent || 0) + n;
  if ((G.stats.lifeCoinsSpent || 0) >= 50000000) syncAch('h_bigspender', 1);
}

let fishingState = 'idle';  // idle | casting | waiting | bite | catching | result
let biteTimer = null;
let statusTimer = null;
let autoTickInterval = null;
let _autoSaveInterval = null;
let _autoSaveDirty = false;
let currentCatch = null;
let tapCount = 0;
let tapsRequired = 0;
let _compBotInterval = null;
let _compCheckInterval = null;

// ─── PERSISTENCE ──────────────────────────────────────────────────────────────

function loadState() {
  try {
    const raw = localStorage.getItem('patientAngler_v1');
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch(e) {}
  return { ...DEFAULT_STATE };
}

function saveState() {
  // Keep local timestamp fresh so an older cloud save never overwrites newer local progress
  // (reset sets _savedAt into the future on purpose — don't lower it)
  if (!G._savedAt || G._savedAt < Date.now()) G._savedAt = Date.now();
  // Cap trophyPile to 200 most recent entries to prevent save file bloat
  if (G.trophyPile && G.trophyPile.length > 200) {
    G.trophyPile = G.trophyPile.slice(-200);
  }
  try { localStorage.setItem('patientAngler_v1', JSON.stringify(G)); } catch(e) {}
  if (typeof triggerCloudSave === 'function') triggerCloudSave();
}

function getPlayerName() {
  return (G.playerName || '').trim() || 'You';
}

// Fish that can only be caught by active manual fishing.
// Automation must never produce these.
// Note: w1legendary fish are NOT manualOnly — they use independent probability and
// are catchable by automation and offline. Only fish with explicit manualOnly:true are excluded.
function isManualOnlyFish(f) {
  if (!f) return false;
  return !!f.special || !!f.manualOnly;
}

// ─── WORLD 1 LEGENDARY HELPERS ───────────────────────────────────────────────

function isW1LegendaryId(fishId) {
  const f = FISH_DB.find(x => x.id === fishId);
  return !!(f && f.w1legendary);
}

// In-session queue for Legendary catch popups (not persisted — fish/discovery already persisted).
// Filled by manual catch confirm, auto-tick, and offline progress; drained by the popup UI.
let _legendaryPopupQueue = [];

function _queueLegendaryPopup(info) {
  // info: { fishId, name, img, zone, isFirst, desc }
  _legendaryPopupQueue.push(info);
}

function _drainLegendaryPopups() {
  if (_legendaryPopupQueue.length === 0) return;
  const next = _legendaryPopupQueue.shift();
  if (next) _displayLegendaryPopup(next);
}

// Count unique W1 Legendary species discovered (used for Prestige bonus)
function getLegendaryPrestigeBonus() {
  return FISH_DB.filter(f => f.w1legendary && G.fishdex.includes(f.id)).length;
}

// Apply W1 legendary independent pre-roll (1 in 50,000,000 per fish per catch).
// Returns a catch object if a legendary triggers, or null.
function _rollW1Legendary(zone) {
  const pool = FISH_DB.filter(f => f.w1legendary && f.zones.includes(zone));
  for (const fish of pool) {
    if (Math.random() < 1 / 50000000) {
      return {
        fishId: fish.id, name: fish.name, rarity: 'legendary', w1legendary: true,
        size: 15, sizeMult: 1.72, value: 0, caughtAt: Date.now(),
        img: fish.img, autoSell: false, isTrophy: false, zone,
      };
    }
  }
  return null;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function weightedRandom(table) {
  const total = table.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * total;
  for (const t of table) { r -= t.weight; if (r <= 0) return t; }
  return table[table.length - 1];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatCoins(n) {
  if (G.numberFormat === 'scientific') {
    if (n >= 1000) {
      const exp = Math.floor(Math.log10(n));
      const coef = n / Math.pow(10, exp);
      return coef.toFixed(2).replace(/\.?0+$/, '') + 'e' + exp;
    }
    return String(n);
  }
  if (n >= 1e15) return (n/1e15).toFixed(1) + 'Qa';
  if (n >= 1e12) return (n/1e12).toFixed(1) + 'T';
  if (n >= 1e9)  return (n/1e9).toFixed(1)  + 'B';
  if (n >= 1e6)  return (n/1e6).toFixed(1)  + 'M';
  if (n >= 1e3)  return (n/1e3).toFixed(1)  + 'K';
  return String(n);
}

function rarityClass(r) {
  return 'rarity-' + r;
}

function getRodData(id) {
  return RODS.find(r => r.id === id) || RODS[0];
}

function getBobberSrc() {
  const cosm = G.equippedBobberCosmetic;
  if (cosm && cosm !== 'bc_basic') {
    const cd = BOBBER_COSMETICS.find(c => c.id === cosm);
    if (cd) return cd.img;
  }
  const bob = BOBBERS.find(b => b.id === G.currentBobber);
  return (bob && bob.img) ? bob.img : 'img/icons/Shop/Bait/Basic bobber.png';
}

// ─── BOBBER TIER SYSTEM ──────────────────────────────────────────────────────

function getBobberTier(id) { return ((G.bobberTiers || {})[id]) || 0; }

function getBobberMaxUnlockedTier() {
  const bt = G.bobberTiers || {};
  const minTier = Math.min(bt.basic_bobber||0, bt.sensitive_bobber||0, bt.heavy_bobber||0, bt.electronic_bobber||0);
  if (minTier >= 10) return 15;
  if (minTier >= 5)  return 10;
  return 5;
}

function getBobberNextCost(id) {
  const b = BOBBERS.find(x => x.id === id);
  if (!b || b.diamondCost) return 0;
  const tier = getBobberTier(id);
  return Math.floor(b.baseCost * Math.pow(10, tier));
}

function isLuckyHookActive()    { return Date.now() < (G.specialCatchEnd || 0); }
function isRapidWatersActive()  { return Date.now() < (G.rapidWatersEnd || 0); }
function getRapidWatersMult()   { return isRapidWatersActive() ? 1.5 : 1; }
function isAdSpeedBoostActive() { return Date.now() < (G.adSpeedBoostEnd || 0); }
function getAdSpeedMult()       { return isAdSpeedBoostActive() ? 1.25 : 1; }
function getSpeedMult() {
  return (1 + getBobberTier('basic_bobber') * 0.03)
    * getRapidWatersMult()
    * getAdSpeedMult()
    * (G.devSupportOwned ? 1.25 : 1)
    * (G.removeAds ? 1.25 : 1);
}
function getRarityBonus()  { return     getBobberTier('sensitive_bobber') * 0.01; }
function getSizeShift()    { return     getBobberTier('heavy_bobber'); }
function getMultiCatch() {
  // Expected value (float) for rate calculations and offline phase
  return 1 + getBobberTier('electronic_bobber') * 0.5 + ((G.pearlUpgrades||{}).multicatch||0);
}
function rollMultiCatch() {
  // Probabilistic integer for actual per-catch quantities (auto tick)
  const tier = getBobberTier('electronic_bobber');
  const pearl = (G.pearlUpgrades||{}).multicatch||0;
  return 1 + pearl + Math.floor(tier / 2) + (tier % 2 === 1 && Math.random() < 0.5 ? 1 : 0);
}
function getManualMultiCatch() { return 1 + Math.floor(getBobberTier('electronic_bobber') / 2); }

function buyBobberTier(id) {
  const maxTier = getBobberMaxUnlockedTier();
  const curTier = getBobberTier(id);
  if (curTier >= 15) { showStatus('Max tier reached!', 1500); return; }
  if (curTier >= maxTier) { showStatus('Upgrade all bobbers to tier ' + maxTier + ' first!', 2000); return; }
  const cost = getBobberNextCost(id);
  if (G.coins < cost) { showStatus('Not enough coins!', 1500); return; }
  _spendCoins(cost);
  if (!G.bobberTiers) G.bobberTiers = { basic_bobber:0, sensitive_bobber:0, heavy_bobber:0, electronic_bobber:0 };
  G.bobberTiers[id] = curTier + 1;
  checkCollectorsDream();
  saveState(); updateHUD(); renderShop(activeShopTab);
  showStatus(BOBBERS.find(b=>b.id===id)?.name + ' → Tier ' + (curTier+1), 1800);
}

function triggerBobberHaptic() {
  if (G.hapticsEnabled === false) return;
  if (!getBobberTier('electronic_bobber')) return;
  try {
    if (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Haptics)
      Capacitor.Plugins.Haptics.impact({ style: 'medium' });
    else if (navigator.vibrate) navigator.vibrate(40);
  } catch(e) {}
}

// ─── ROD TIER SYSTEM ─────────────────────────────────────────────────────────

function getRodTier(id) { return ((G.rodTiers || {})[id]) || 0; }

function getRodNextCost(id) {
  const r = RODS.find(x => x.id === id);
  if (!r) return 0;
  const tier = getRodTier(id);
  if (r.tierCosts) return r.tierCosts[tier] ?? null; // null = max tier reached
  return Math.floor(r.baseTierCost * Math.pow(10, tier));
}

// Effect getters — each returns a multiplier or additive value
function getRodSellBonus()           { return 1 + getRodTier('basic_rod')  * 0.05; }
function getRodNetSpeedMult()        { return 1 + getRodTier('river_rod')  * 0.10; }
function getRodFishermanSpeedMult()  { return 1 + getRodTier('lake_rod')   * 0.10; }
function getRodStorageCapacityMult() { return 1 + getRodTier('bay_rod')    * 0.12; }
function getRodBoatSpeedMult()       { return 1 + getRodTier('sea_rod')    * 0.10; }
function getRodFleetSpeedMult()      { return 1 + getRodTier('ocean_rod')  * 0.10; }
function getRodLegendaryBonus()      { return     getRodTier('carbon_rod') * 0.03; }
function getRodDiamondMult()         { return 1 + getRodTier('mythic_rod') * 0.08; }
function getRodAbyssSellBonus()      { return 1 + getRodTier('abyss_rod')  * 0.08; }

function buyRodTier(id) {
  if (!(G.ownedRods || []).includes(id)) { showStatus('Buy this rod first!', 1500); return; }
  const curTier = getRodTier(id);
  const cost = getRodNextCost(id);
  if (cost === null || curTier >= 15) { showStatus('Max tier reached!', 1500); return; }
  if (G.coins < cost) { showStatus('Not enough coins!', 1500); return; }
  _spendCoins(cost);
  if (!G.rodTiers) G.rodTiers = {};
  G.rodTiers[id] = curTier + 1;
  saveState(); updateHUD(); renderShop(activeShopTab);
  showStatus(RODS.find(r=>r.id===id)?.name + ' → Tier ' + (curTier+1), 1800);
}

// ─── BLACK PEARL / PRESTIGE SYSTEM ───────────────────────────────────────────

function prestigeThreshold() { return Math.floor(15000 * Math.pow(1.20, G.prestigeCount || 0)); }

const PEARL_UPGRADES = [
  { id:'discount',     name:'Market Discount',   desc:'Shop prices cheaper per level (−5% up to Lv5, then −2% per level, max −90%).',  costs:[4,7,11,17,26],                                  growthRate:1.53, maxLevel:null },
  { id:'speed',        name:'Empire Boost',       desc:'Automation faster per level (+25% up to Lv8, then +10% per level).',            costs:[5,8,12,18,27,40,60,90],                         growthRate:1.50, maxLevel:null },
  { id:'storage',      name:'Expanded Holds',     desc:'Storage holds 50% more items per level.',                                        costs:[3,5,7,10,14,20,28,39,55,77],  growthRate:1.40,  maxLevel:null },
  { id:'multicatch',   name:'Hauling Nets',        desc:'Automation collects 1 extra item per cycle per level.',                          costs:[50,75,110,160,230,330,470,670,950,1350], growthRate:1.42, maxLevel:null },
  { id:'luckywaters',  name:'Lucky Waters',        desc:'Higher chance to catch Rare and Epic fish (+1% per level).',                    costs:[5,8,12,18,26,38,55,80,115,165],                 growthRate:1.43, maxLevel:null },
  { id:'masterangler', name:'Master Angler',       desc:'Manual fishing requires 1 fewer tap per level (minimum 4).',                    costs:[12,20,35,60],                                   maxLevel:4    },
  { id:'treasure',     name:'Treasure Hunter',     desc:'Lost Treasure events appear more often (+5% per level, +1% after Lv10).',       costs:[5,8,12,18,27,40,58,84,120,170],                 growthRate:1.42, maxLevel:null },
  { id:'offline',      name:'Offline Expert',      desc:'Chance to catch an extra fish per catch (+10% per level, +2% after Lv10).',     costs:[4,6,9,13,19,28,40,58,84,120],                   growthRate:1.43, maxLevel:null },
  { id:'compspirit',   name:'Competition Spirit',  desc:'Earn more coins from competitions (+10% per level, +2% after Lv10).',           costs:[4,6,9,13,19,28,40,58,84,120],                   growthRate:1.43, maxLevel:null },
  { id:'fishwhisperer',name:'Fish Whisperer',      desc:'Higher chance to catch Trophy fish (+0.5% per level).',                         costs:[6,10,16,25,38,58,88,132,198,297],               growthRate:1.50, maxLevel:null },
  { id:'treasurehold',  name:'Treasure Hold',       desc:'Carry 1 extra Sunken Treasure Chest per level. Requires Sea zone.',               costs:[10], growthRate:5, maxLevel:null, requiresSunkenTreasure:true },
  { id:'ghostbusters',  name:'Ghost Busters',        desc:'Ghost Ship returns 1 in-game hour faster per level (−1h/level, max 50 levels).',   costs:[10,20,40,80,160,320,640,1280,2560,5120,10240,20480,40960,81920,163840,327680,655360,1310720,2621440,5242880,10485760,20971520,41943040,83886080,167772160,335544320,671088640,1342177280,2684354560,5368709120,10737418240,21474836480,42949672960,85899345920,171798691840,343597383680,687194767360,1374389534720,2748779069440,5497558138880,10995116277760,21990232555520,43980465111040,87960930222080,175921860444160,351843720888320,703687441776640,1407374883553280,2814749767106560,5629499534213120], maxLevel:50 },
  { id:'startingcapital',  name:'Starting Capital',   desc:'Start each prestige run with +2000 coins per level.',                                  linearStep:2,  maxLevel:null },
  { id:'ghostwhisperer',   name:'Ghost Whisperer',    desc:'Ghost Ship appears 5% more often per level.',                                           costs:[50],    growthRate:2,  maxLevel:15 },
];

const PEARL_IMG = `<img src="img/icons/Black pearl icon.png" style="width:16px;height:16px;vertical-align:middle;margin-right:2px">`;

function getBlackPearlBonus()         { const p = Math.max(0, G.blackPearls || 0); return 1 + Math.log(1 + p / 100); }
function getBlackPearlBonusPct()      { const p = Math.max(0, G.blackPearls || 0); return 100 * Math.log(1 + p / 100); }
function getPearlDiscountMult() {
  const lvl = Math.max(0, (G.pearlUpgrades||{}).discount||0);
  const p1 = Math.min(lvl, 5) * 0.05;
  const p2 = Math.max(0, lvl - 5) * 0.02;
  return Math.max(0.10, 1 - Math.min(p1 + p2, 0.90));
}
function getPearlSpeedMult() {
  const lvl = (G.pearlUpgrades||{}).speed||0;
  const p1 = Math.min(lvl, 8) * 0.25;
  const p2 = Math.max(0, lvl - 8) * 0.10;
  return 1 + p1 + p2;
}
function getPearlStorageMult()        { return 1 + ((G.pearlUpgrades||{}).storage||0) * 0.50; }
function getPearlLuckyWatersBonus()   { return ((G.pearlUpgrades||{}).luckywaters||0) * 0.01; }
function getPearlMasterAnglerReduce() { return (G.pearlUpgrades||{}).masterangler||0; }
function getPearlTreasureBonus() {
  const lvl = (G.pearlUpgrades||{}).treasure||0;
  const p1 = Math.min(lvl, 10) * 0.05;
  const p2 = Math.max(0, lvl - 10) * 0.01;
  return p1 + p2;
}
function getPearlExtraCatchChance() {
  const lvl = (G.pearlUpgrades||{}).offline||0;
  const p1 = Math.min(lvl, 10) * 0.10;
  const p2 = Math.max(0, lvl - 10) * 0.02;
  return p1 + p2;
}
function getPearlOfflineExpertMult()  { return 1; } // kept for offline calc compat — use getPearlExtraCatchChance()
function getPearlCompSpiritMult() {
  const lvl = (G.pearlUpgrades||{}).compspirit||0;
  const p1 = Math.min(lvl, 10) * 0.10;
  const p2 = Math.max(0, lvl - 10) * 0.02;
  return 1 + p1 + p2;
}
function getPearlFishWhispererBonus()   { return ((G.pearlUpgrades||{}).fishwhisperer||0) * 0.005; }
function getPearlGhostBustersReduceMs()   { return ((G.pearlUpgrades||{}).ghostbusters||0) * (3600000/24); }
function getPearlGhostWhispererInterval() {
  const lvl = (G.pearlUpgrades||{}).ghostwhisperer||0;
  return Math.round(GS_SPAWN_INTERVAL_MS * Math.max(0.25, 1 - lvl * 0.05));
}
function getPearlStartingCapital()      { return ((G.pearlUpgrades||{}).startingcapital||0) * 2000; }
function getGsExpeditionMs()            { return Math.max(3600000/24, GS_EXPEDITION_MS - getPearlGhostBustersReduceMs()); }

// ─── DIAMOND UPGRADES ────────────────────────────────────────────────────────
function getAutomationUpgradeLevel()      { return (G.diamondUpgrades || {}).autoSpeed || 0; }
function getStorageUpgradeLevel()         { return (G.diamondUpgrades || {}).storage   || 0; }
function getAutomationUpgradeMaxLevel()   { return (typeof canAccessMaelstromAndAbyss === 'function' && canAccessMaelstromAndAbyss()) ? 50 : 25; }
function getStorageUpgradeMaxLevel()      { return (typeof canAccessMaelstromAndAbyss === 'function' && canAccessMaelstromAndAbyss()) ? 50 : 25; }
function getAutomationUpgradeMultiplier() { return 1 + getAutomationUpgradeLevel() * 0.10; }
function getStorageUpgradeMultiplier()    { return 1 + getStorageUpgradeLevel()    * 0.10; }

function buyDiamondUpgrade(type) {
  if (!G.diamondUpgrades) G.diamondUpgrades = { autoSpeed: 0, storage: 0 };
  const lvl    = G.diamondUpgrades[type] || 0;
  const maxLvl = type === 'autoSpeed' ? getAutomationUpgradeMaxLevel() : getStorageUpgradeMaxLevel();
  if (lvl >= maxLvl) { showStatus('Maximum level reached!', 1500); return; }
  const COST = 100;
  if ((G.diamonds || 0) < COST) { showStatus('Not enough Diamonds!', 1500); return; }
  const label = type === 'autoSpeed' ? 'Automation Speed Upgrade' : 'Storage Upgrade';
  confirmDiamondPurchase(label + ' (Lv ' + (lvl + 1) + ')', COST, () => {
    G.diamonds = (G.diamonds || 0) - COST;
    G.diamondUpgrades[type] = lvl + 1;
    saveState(); updateHUD(); renderDiamondStore();
    showStatus(label + ' → Level ' + (lvl + 1), 1800);
  });
}

function pearlUpgradeCost(upg) {
  const lvl = (G.pearlUpgrades || {})[upg.id] || 0;
  if (upg.linearStep !== undefined) return (lvl + 1) * upg.linearStep;
  if (upg.costs) {
    if (lvl < upg.costs.length) return upg.costs[lvl];
    // unlimited upgrades: extrapolate beyond table
    const extra = lvl - upg.costs.length + 1;
    return Math.ceil(upg.costs[upg.costs.length - 1] * Math.pow(upg.growthRate, extra));
  }
  return Math.ceil(upg.baseCost * Math.pow(upg.growthRate, lvl));
}

function prestigePearlReward() {
  const base  = Math.max(1, Math.floor(Math.sqrt((G.coins || 0) / 2000))); // sqrt — 15k→2p, 50k→5p, 1M→22p
  const legPct = getLegendaryPrestigeBonus(); // +1% per unique W1 legendary discovered
  return legPct > 0 ? Math.max(1, Math.floor(base * (1 + legPct / 100))) : base;
}
function canPrestige()           { return (G.coins || 0) >= prestigeThreshold(); }

function doPrestige() {
  const pearls = prestigePearlReward();
  if (pearls < 1) return;
  const label = pearls + ' Black Pearl' + (pearls > 1 ? 's' : '');
  document.getElementById('pc-pearls').textContent = label;
  document.getElementById('prestige-confirm-overlay').classList.remove('hidden');
}

function closePrestigeConfirm() {
  document.getElementById('prestige-confirm-overlay').classList.add('hidden');
}

function showStorageFullPopup() {
  document.getElementById('storage-full-overlay').classList.remove('hidden');
}
function closeStorageFullPopup() {
  document.getElementById('storage-full-overlay').classList.add('hidden');
}

function executePrestige() {
  closePrestigeConfirm();
  const pearls = prestigePearlReward();
  if (pearls < 1) return;

  G.blackPearls   = (G.blackPearls || 0) + pearls;
  G.prestigeCount = (G.prestigeCount || 0) + 1;
  syncAch('h_prestige', G.prestigeCount);
  syncAch('h_pearls',   G.blackPearls);

  // Reset progression
  G.coins              = getPearlStartingCapital();
  G.currentZone        = 'pond';
  G.currentRod         = 'basic_rod';
  G.ownedRods          = ['basic_rod'];
  G.ownedStorage       = [];
  G.ownedTransport          = [];
  G.ownedAutomation         = [];
  G.activeAutomationZones   = ['pond'];
  G.fishPile           = {};
  G.trophyPile         = [];
  G.plantPile          = {};
  G.trashPile          = {};
  G.competition        = null;
  G.rodTiers           = { basic_rod:0, river_rod:0, lake_rod:0, bay_rod:0, sea_rod:0, ocean_rod:0, carbon_rod:0, mythic_rod:0, abyss_rod:0 };
  G.bobberTiers        = { basic_bobber:0, sensitive_bobber:0, heavy_bobber:0, electronic_bobber:0 };
  G.currentBobber      = 'basic_bobber';
  G.seagullBaitCount   = 0;
  G.targetedLureLevel  = 0;
  G.targetedLureTargets= [];

  // Clear active event buffs (purchased buffs like premiumBait stay)
  G.rapidWatersEnd  = 0;
  G.adSpeedBoostEnd = 0;
  G.specialCatchEnd = 0;

  // Dismiss any pending special event
  _pendingEvent = null;
  if (_eventExpireTimeout) { clearTimeout(_eventExpireTimeout); _eventExpireTimeout = null; }
  const evIcon = document.getElementById('event-side-icon');
  if (evIcon) evIcon.classList.add('hidden');

  // Clear guild order — will regenerate for pond on next guild open
  if (G.guild) G.guild.order = null;

  // Reset competition series
  if (_compBotInterval)   { clearInterval(_compBotInterval);   _compBotInterval = null; }
  if (_compCheckInterval) { clearInterval(_compCheckInterval); _compCheckInterval = null; }
  G.series = { index: ((G.series || {}).index || 1), competitionNumber: 0, nextName: _pickCompName ? _pickCompName() : '', usedNames: [], standings: {}, grandPending: false };

  // Reset expedition vessels and chest cooldown; keep chests, sunkenTreasureUnlocked, treasurehold level, stats
  G.expeditionVessels               = [];
  G.automationTreasureCooldownUntil = 0;
  if (_expeditionCheckInterval) { clearInterval(_expeditionCheckInterval); _expeditionCheckInterval = null; }

  // Reset ghost ships; spawn timer restarts after prestige
  G.ghostShips           = [];
  G.ghostShipNextSpawnAt = 0;
  if (_gsSpawnTimeout) { clearTimeout(_gsSpawnTimeout); _gsSpawnTimeout = null; }
  _gsRemoveAllDom();

  // Reset sea comic so it shows again when Sea is re-unlocked after prestige
  G.seaComicSeen = false;

  // Keep: fishdex, masteryData, manualFishdex, diamonds, diamondUpgrades, blackPearls, prestigeCount, pearlUpgrades, quests, stats, records, unlockedBobberCosmetics, equippedBobberCosmetic, premiumBait, sunkenChests, sunkenTreasureUnlocked, sunkenTreasureStats

  saveState();
  updateZoneBg('pond');
  updateHUD();
  resetFishingState();
  startAutomation();
  scheduleNextSpecialEvent();
  showScreen('fishing');
  showStatus('Prestige! +' + pearls + ' Black Pearl' + (pearls > 1 ? 's' : ', welcome back!'), 3000);
  if (typeof onAnalyticsPrestige === 'function') onAnalyticsPrestige();
}

function buyPearlUpgrade(id) {
  const upg = PEARL_UPGRADES.find(u => u.id === id);
  if (!upg) return;
  if (!G.pearlUpgrades) G.pearlUpgrades = {};
  const current = G.pearlUpgrades[id] || 0;
  if (upg.maxLevel !== null && current >= upg.maxLevel) { showStatus('Already at maximum level!', 1500); return; }
  const cost = pearlUpgradeCost(upg);
  if ((G.blackPearls||0) < cost) { showStatus('Not enough Black Pearls!', 1500); return; }
  G.blackPearls -= cost;
  G.pearlUpgrades[id] = current + 1;
  if (id === 'ghostbusters') syncAch('h_gs_ghostbusters', G.pearlUpgrades[id]);
  saveState(); updateHUD(); renderShop('jeweler');
  showStatus(upg.name + ' → Level ' + (current + 1), 1800);
}

function updateBobberImg() {
  document.getElementById('bobber').src = getBobberSrc();
}

function applyDiscount(cost) { return Math.max(1, Math.floor(cost * getPearlDiscountMult())); }

// ─── TARGETED LURE ────────────────────────────────────────────────────────────
const TARGETED_LURE_COSTS = [25000, 250000, 2500000, 25000000, 250000000];

function getTargetedLureSlots()  { return G.targetedLureLevel || 0; }
function isTargetedItem(id)      { return (G.targetedLureTargets || []).includes(id); }
function updateFishdexLureCount() {
  const el = document.getElementById('fishdex-lure-count');
  if (!el) return;
  const slots  = getTargetedLureSlots();
  const active = (G.targetedLureTargets || []).length;
  if (slots === 0) { el.style.display = 'none'; return; }
  el.textContent   = active + ' / ' + slots + ' targeted';
  el.style.display = '';
}
function isLureEligible(item) {
  // Eligible = automation-catchable: common/uncommon/rare/epic fish, plants, trash. Not legendary, not special/manual-only.
  if (!item) return false;
  if (item.rarity === 'legendary') return false;
  if (item.special) return false;
  return true;
}

function resetLureTargets() {
  if (!G.targetedLureTargets || G.targetedLureTargets.length === 0) {
    showStatus('No targets set.', 1200);
    return;
  }
  G.targetedLureTargets = [];
  saveState();
  renderFishdex();
  updateFishdexLureCount();
  showStatus('Targeted Lure targets cleared.', 1500);
}

function toggleLureTarget(id) {
  if (!G.targetedLureTargets) G.targetedLureTargets = [];
  const idx = G.targetedLureTargets.indexOf(id);
  if (idx !== -1) {
    G.targetedLureTargets.splice(idx, 1); // remove
  } else {
    if (G.targetedLureTargets.length >= getTargetedLureSlots()) return;
    G.targetedLureTargets.push(id);
  }
  saveState();
  renderFishdex();
  updateFishdexLureCount();
}

function buyTargetedLure() {
  const lvl  = G.targetedLureLevel || 0;
  if (lvl >= 5) { showStatus('Targeted Lure is already at max level!', 1500); return; }
  const cost = TARGETED_LURE_COSTS[lvl];
  if ((G.coins || 0) < cost) { showStatus('Not enough coins!', 1500); return; }
  G.coins -= cost;
  G.targetedLureLevel = lvl + 1;
  saveState(); updateHUD(); renderShop(activeShopTab);
  showStatus('Targeted Lure → Level ' + G.targetedLureLevel, 2000);
}
// ─── FISHDEX MASTERY ─────────────────────────────────────────────────────────

const MASTERY_TIERS = [
  { name:'Bronze',   threshold:200,     pts:1, medal:'B', color:'#cd7f32' },
  { name:'Silver',   threshold:2000,    pts:2, medal:'S', color:'#c0c0c0' },
  { name:'Gold',     threshold:200000,   pts:3, medal:'G', color:'#f4c430' },
  { name:'Platinum', threshold:2000000,  pts:4, medal:'P', color:'#7ecfff' },
  { name:'Diamond',  threshold:20000000, pts:5, medal:'D', color:'#a8f4ff' },
];
const MASTERY_THRESHOLDS = [25, 50, 75, 100, 125, 150];

const ZONE_MASTERY_BONUSES = {
  pond:  [
    { type:'fishSell',    value:0.025, label:'+2.5% fish sell' },
    { type:'storage',     value:0.05,  label:'+5% storage' },
    { type:'rareChance',  value:0.015, label:'+1.5% rare catch' },
    { type:'autoSpeed',   value:0.04,  label:'+4% auto speed' },
    { type:'questReward', value:0.05,  label:'+5% quest reward' },
    { type:'offline',     value:0.05,  label:'+5% offline income' },
  ],
  river: [
    { type:'fishSell',    value:0.025, label:'+2.5% fish sell' },
    { type:'autoSpeed',   value:0.04,  label:'+4% auto speed' },
    { type:'rareChance',  value:0.015, label:'+1.5% rare catch' },
    { type:'offline',     value:0.05,  label:'+5% offline income' },
    { type:'trophyChance',value:0.005, label:'+0.5% trophy chance' },
    { type:'compReward',  value:0.05,  label:'+5% competition reward' },
  ],
  lake:  [
    { type:'fishSell',    value:0.025, label:'+2.5% fish sell' },
    { type:'storage',     value:0.05,  label:'+5% storage' },
    { type:'rareChance',  value:0.015, label:'+1.5% rare catch' },
    { type:'autoSpeed',   value:0.04,  label:'+4% auto speed' },
    { type:'offline',     value:0.05,  label:'+5% offline income' },
    { type:'trophyChance',value:0.005, label:'+0.5% trophy chance' },
  ],
  bay:   [
    { type:'fishSell',    value:0.025, label:'+2.5% fish sell' },
    { type:'rareChance',  value:0.015, label:'+1.5% rare catch' },
    { type:'trophyChance',value:0.005, label:'+0.5% trophy chance' },
    { type:'offline',     value:0.05,  label:'+5% offline income' },
    { type:'questReward', value:0.05,  label:'+5% quest reward' },
    { type:'autoSpeed',   value:0.04,  label:'+4% auto speed' },
  ],
  sea:   [
    { type:'fishSell',    value:0.025, label:'+2.5% fish sell' },
    { type:'storage',     value:0.05,  label:'+5% storage' },
    { type:'rareChance',  value:0.015, label:'+1.5% rare catch' },
    { type:'trophyChance',value:0.005, label:'+0.5% trophy chance' },
    { type:'autoSpeed',   value:0.04,  label:'+4% auto speed' },
    { type:'compReward',  value:0.05,  label:'+5% competition reward' },
  ],
  ocean: [
    { type:'fishSell',    value:0.025, label:'+2.5% fish sell' },
    { type:'rareChance',  value:0.015, label:'+1.5% rare catch' },
    { type:'trophyChance',value:0.005, label:'+0.5% trophy chance' },
    { type:'storage',     value:0.05,  label:'+5% storage' },
    { type:'offline',     value:0.05,  label:'+5% offline income' },
    { type:'compReward',  value:0.05,  label:'+5% competition reward' },
  ],
};

function isMasteryEligible(item) {
  if (!item) return false;
  if (item.rarity === 'legendary') return false;
  if (item.special) return false;
  return true;
}

let _masteryDirty = true;
let _masteryBonusCache = {};

function _invalidateMasteryCache() { _masteryDirty = true; }

function _computeMasteryBonuses() {
  if (!_masteryDirty) return;
  _masteryDirty = false;
  const cache = {};
  const allTypes = ['fishSell','storage','autoSpeed','offline','rareChance','trophyChance','questReward','compReward'];
  for (const type of allTypes) {
    let total = 0;
    for (const [zoneId, bonuses] of Object.entries(ZONE_MASTERY_BONUSES)) {
      const pts = getZoneMasteryPoints(zoneId);
      bonuses.forEach((b, i) => {
        if (b.type === type && pts >= MASTERY_THRESHOLDS[i]) total += b.value;
      });
    }
    cache[type] = total;
  }
  _masteryBonusCache = cache;
}

function getActiveMasteryBonus(type) {
  _computeMasteryBonuses();
  return _masteryBonusCache[type] || 0;
}

function incrementMastery(itemId) {
  const item = FISH_DB.find(f => f.id === itemId)
    || PLANT_DB.find(p => p.id === itemId)
    || TRASH_DB.find(t => t.id === itemId);
  if (!isMasteryEligible(item)) return;
  if (!G.masteryData) G.masteryData = {};
  G.masteryData[itemId] = (G.masteryData[itemId] || 0) + 1;
  _invalidateMasteryCache();
}

function getMasteryCount(itemId)   { return (G.masteryData || {})[itemId] || 0; }

function getMasteryTierIndex(itemId) {
  const count = getMasteryCount(itemId);
  let idx = -1;
  for (let i = 0; i < MASTERY_TIERS.length; i++) {
    if (count >= MASTERY_TIERS[i].threshold) idx = i; else break;
  }
  return idx;
}

function getMasteryItemPoints(itemId) {
  const idx = getMasteryTierIndex(itemId);
  return idx >= 0 ? MASTERY_TIERS[idx].pts : 0;
}

function getZoneMasteryPoints(zoneId) {
  const items = [
    ...FISH_DB.filter(f => f.zones.includes(zoneId) && isMasteryEligible(f)),
    ...PLANT_DB.filter(p => p.zones.includes(zoneId)),
    ...TRASH_DB.filter(t => t.zones.includes(zoneId)),
  ];
  return items.reduce((sum, item) => sum + getMasteryItemPoints(item.id), 0);
}

function getMasteryFishSellMult()    { return 1 + getActiveMasteryBonus('fishSell'); }
function getMasteryStorageMult()     { return 1 + getActiveMasteryBonus('storage'); }
function getMasteryAutoSpeedMult()   { return 1 + getActiveMasteryBonus('autoSpeed'); }
function getMasteryOfflineMult()     { return 1 + getActiveMasteryBonus('offline'); }
function getMasteryRareChanceBonus() { return getActiveMasteryBonus('rareChance'); }
function getMasteryTrophyBonus()     { return getActiveMasteryBonus('trophyChance'); }
function getMasteryQuestMult()       { return 1 + getActiveMasteryBonus('questReward'); }
function getMasteryCompMult()        { return 1 + getActiveMasteryBonus('compReward'); }

// Zone unlock costs (rods + transport) scale up per prestige — keeps progression meaningful even with sell bonuses
function applyZoneCostScaling(cost) { return Math.floor(cost * (1 + Math.sqrt(G.prestigeCount || 0) * 0.35)); }

function calcBulkCost(baseCost, currentCount, qty, firstCost) {
  let total = 0;
  for (let i = 0; i < qty; i++) {
    if (firstCost !== undefined && currentCount === 0 && i === 0) {
      total += firstCost;
    } else {
      total += Math.floor(baseCost * Math.pow(1.22, currentCount + i));
    }
  }
  return applyDiscount(total);
}

function calcMaxAffordable(baseCost, currentCount, coins, firstCost) {
  let total = 0, n = 0;
  while (n < 100000) {
    let next;
    if (firstCost !== undefined && currentCount === 0 && n === 0) {
      next = firstCost;
    } else {
      next = Math.floor(baseCost * Math.pow(1.22, currentCount + n));
    }
    if (applyDiscount(total + next) > coins) break;
    total += next;
    n++;
  }
  return n;
}

function getStorageCost(id) {
  const s = STORAGE_ITEMS.find(x => x.id === id);
  if (!s) return 0;
  const count = G.ownedStorage.filter(o => o.id === id).length;
  return applyDiscount(Math.floor(s.cost * Math.pow(1.22,count)));
}

function getAutomationCost(id) {
  const a = AUTOMATION.find(x => x.id === id);
  if (!a) return 0;
  const count = G.ownedAutomation.filter(o => o.id === id).length;
  return applyDiscount(Math.floor(a.cost * Math.pow(1.22,count)));
}

function storageCapacity() {
  const base = 5 + G.ownedStorage.reduce((sum, owned) => {
    const s = STORAGE_ITEMS.find(x => x.id === owned.id);
    return s ? sum + s.capacity : sum;
  }, 0);
  return Math.round(base * getRodStorageCapacityMult() * getPearlStorageMult() * getMasteryStorageMult() * getStorageUpgradeMultiplier() * (G.devSupportOwned ? 1.25 : 1));
}

function isPremiumBaitActive() {
  if (!G.premiumBaitActive) return false;
  if (Date.now() > G.premiumBaitEnd) {
    G.premiumBaitActive = false;
    G.premiumBaitEnd = 0;
    return false;
  }
  return true;
}

function buyPremiumBait() {
  const COST = 5;
  if ((G.diamonds || 0) < COST) { showStatus('Not enough Diamonds!', 1500); return; }
  if (isPremiumBaitActive()) { showStatus('Premium Bait already active!', 1500); return; }
  confirmDiamondPurchase('Premium Bait (30 min)', COST, () => {
    G.diamonds -= COST;
    G.premiumBaitActive = true;
    G.premiumBaitEnd = Date.now() + 30 * 60 * 1000;
    G.stats.evPremiumBaits = (G.stats.evPremiumBaits || 0) + 1;
    saveState(); updateHUD(); renderShop(activeShopTab);
    showStatus('Premium Bait active! +100% rare chance for 30 min', 3000);
  });
}

function showStatus(msg, ms = 1800) {
  const el = document.getElementById('status-msg');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => el.classList.remove('show'), ms);
}

// ─── ZONE LOGIC ──────────────────────────────────────────────────────────────

const LOOT_TABLES = {
  pond:  [{type:'trash',weight:30},{type:'plant',weight:20},{type:'common',weight:35},{type:'uncommon',weight:10},{type:'rare',weight:4},{type:'epic',weight:1}],
  river: [{type:'trash',weight:25},{type:'plant',weight:18},{type:'common',weight:36},{type:'uncommon',weight:13},{type:'rare',weight:6},{type:'epic',weight:2}],
  lake:  [{type:'trash',weight:20},{type:'plant',weight:15},{type:'common',weight:37},{type:'uncommon',weight:16},{type:'rare',weight:9},{type:'epic',weight:3}],
  bay:   [{type:'trash',weight:18},{type:'plant',weight:12},{type:'common',weight:35},{type:'uncommon',weight:20},{type:'rare',weight:12},{type:'epic',weight:3},{type:'legendary',weight:4}],
  sea:   [{type:'trash',weight:15},{type:'plant',weight:10},{type:'common',weight:33},{type:'uncommon',weight:22},{type:'rare',weight:15},{type:'epic',weight:5},{type:'legendary',weight:4}],
  ocean: [{type:'trash',weight:12},{type:'plant',weight:8}, {type:'common',weight:28},{type:'uncommon',weight:22},{type:'rare',weight:18},{type:'epic',weight:8},{type:'legendary',weight:4}],
};

function isZoneUnlocked(zoneId) {
  if (zoneId === 'pond') return true;
  const z = ZONE_DATA.find(x => x.id === zoneId);
  if (!z) return false;
  const hasRod = !z.requiredRod || G.ownedRods.includes(z.requiredRod);
  const hasTransport = !z.requiredTransport || (G.ownedTransport || []).includes(z.requiredTransport);
  return hasRod && hasTransport;
}

function buyTransport(id) {
  const t = TRANSPORT.find(x => x.id === id);
  if (!t) return;
  if ((G.ownedTransport || []).includes(id)) return;
  const tCost = applyDiscount(applyZoneCostScaling(t.cost));
  if (G.coins < tCost) { showStatus('Not enough coins!', 1500); return; }
  _spendCoins(tCost);
  if (!G.ownedTransport) G.ownedTransport = [];
  G.ownedTransport.push(id);
  if (id === 'fishing_vessel' && !G.sunkenTreasureUnlocked) {
    G.sunkenTreasureUnlocked = true;
    _gsStartup(); // begin Ghost Ship spawn cycle when Sea first unlocked
  }
  if (id === 'fishing_vessel' && !G.seaComicSeen) {
    G.seaComicSeen = true;
    setTimeout(showSeaComicPopup, 2000);
  }
  // No Waste — River just unlocked without any manual trash
  if (id === 'waders') {
    if ((G.stats.noWasteTrash || 0) === 0) syncAch('h_no_waste', 1);
    G.stats.noWasteTrash = -1; // disqualify future checks
    // Perfect Pond — pond complete before river
    const pondAll = FISH_DB.filter(f => f.zones.includes('pond') && !isManualOnlyFish(f) && G.fishdex.includes(f.id)).length
      + PLANT_DB.filter(p => p.zones.includes('pond') && G.fishdex.includes(p.id)).length
      + TRASH_DB.filter(t => t.zones.includes('pond') && G.fishdex.includes(t.id)).length;
    if (pondAll >= 30) syncAch('h_pond_first', 1);
  }
  if (isZoneUnlocked('ocean')) syncAch('h_ocean', 1);
  if (ZONE_DATA.every(z => isZoneUnlocked(z.id))) syncAch('h_empire', 1);
  const _unlockedByTransport = ZONE_DATA.find(z => z.requiredTransport === id);
  if (_unlockedByTransport) {
    const _curIdx = ZONE_DATA.findIndex(z => z.id === (G.stats.recHighestZone || 'pond'));
    const _newIdx = ZONE_DATA.findIndex(z => z.id === _unlockedByTransport.id);
    if (_newIdx > _curIdx) G.stats.recHighestZone = _unlockedByTransport.id;
  }
  // Auto-activate newly unlocked zone for automation (shift oldest out if already at 2)
  const _newZone = ZONE_DATA.find(z => z.requiredTransport === id);
  if (_newZone) {
    if (!G.activeAutomationZones) G.activeAutomationZones = [];
    if (!G.activeAutomationZones.includes(_newZone.id)) {
      if (G.activeAutomationZones.length >= 2) G.activeAutomationZones.shift();
      G.activeAutomationZones.push(_newZone.id);
    }
  }
  saveState();
  updateHUD();
  renderZones();
  showStatus('Purchased: ' + t.name + '!', 2000);
  if (typeof anlOnZoneUnlocked === 'function') {
    anlOnZoneUnlocked(_newZone ? _newZone.id : id);
  }
}

function switchZone(zoneId) {
  if (!isZoneUnlocked(zoneId)) return;
  G.currentZone = zoneId;
  saveState();
  updateZoneBg(zoneId);
  showScreen('fishing');
  const z = ZONE_DATA.find(x => x.id === zoneId);
  showStatus('Now fishing in the ' + z.name + '!', 2200);
  if (typeof onAnalyticsZoneChange === 'function') onAnalyticsZoneChange(zoneId);
}

// Zones that have bespoke automation backgrounds — net/fisherman baked into the image.
// Bespoke automation backgrounds — automation assets are baked into the image.
// types: per-automation-type ticker positions (x%, y%); labelX/Y: catch/s rate label.
// Zones not listed here show no automation overlays until a custom bg is added.
const ZONE_AUTO_BG = {
  pond: {
    bg: 'img/backgrounds/Pond with automation.png',
    types: {
      net: { x:30, y:60, labelX:37, labelY:66 },
    },
    combined: { x:70, y:60 },
  },
  river: {
    bg: 'img/backgrounds/River with automation.png',
    types: {
      fisherman: { x:48, y:74, labelX:22, labelY:57 },
    },
    combined: { x:60, y:70 },
  },
  lake: {
    bg: 'img/backgrounds/Lake with Automation.png',
    types: {
      net:       { x:40, y:80, labelX:60, labelY:80 },
      fisherman: { x:20, y:40, labelX:20, labelY:40 },
    },
    combined: { x:80, y:70 },
  },
  bay: {
    bg: 'img/backgrounds/Bay with automation.png',
    types: {
      net:       { x:60, y:80, labelX:60, labelY:80 },
      fisherman: { x:14, y:20, labelX:15, labelY:20 },
      boat:      { x:70, y:60, labelX:75, labelY:55 },
    },
    combined: { x:90, y:30 },
  },
  sea: {
    bg: 'img/backgrounds/Sea with automation.png',
    types: {
      fleet: { x:60, y:50, labelX:60, labelY:55 },
    },
    combined: { x:80, y:40 },
  },
  ocean: {
    bg: 'img/backgrounds/Ocean with deep sea.png',
    types: {
      fleet: { x:60, y:60, labelX:60, labelY:55 },
    },
    combined: { x:80, y:50 },
  },
};

const AUTO_TYPE_ORDER = ['net','fisherman','boat','fleet'];


function getAutoCount(type, zone) {
  return G.ownedAutomation.filter(o => {
    const def = AUTOMATION.find(a => a.id === o.id);
    return def && def.type === type && o.zone === zone;
  }).length;
}

function _hasZoneAuto(zone) {
  return G.ownedAutomation.some(o => o.zone === zone);
}

function _calcZoneAutoRate(zone) {
  return G.ownedAutomation.reduce((sum, owned) => {
    if (owned.zone !== zone) return sum;
    const def = AUTOMATION.find(a => a.id === owned.id);
    if (!def) return sum;
    const tm = def.type === 'net'       ? getRodNetSpeedMult()
             : def.type === 'fisherman' ? getRodFishermanSpeedMult()
             : def.type === 'boat'      ? getRodBoatSpeedMult()
             : def.type === 'fleet'     ? getRodFleetSpeedMult() : 1;
    return sum + (getSpeedMult() * tm * getPearlSpeedMult() * getMasteryAutoSpeedMult() * getAutomationUpgradeMultiplier() * getMultiCatch()) / def.rate;
  }, 0);
}

function _calcTypeRate(type) {
  const speedBase = getSpeedMult() * getPearlSpeedMult() * getMasteryAutoSpeedMult() * getAutomationUpgradeMultiplier() * getMultiCatch();
  const tm = type === 'net'       ? getRodNetSpeedMult()
           : type === 'fisherman' ? getRodFishermanSpeedMult()
           : type === 'boat'      ? getRodBoatSpeedMult()
           : type === 'fleet'     ? getRodFleetSpeedMult() : 1;
  return G.ownedAutomation.reduce((sum, owned) => {
    const def = AUTOMATION.find(a => a.id === owned.id && a.type === type);
    if (!def) return sum;
    return sum + (speedBase * tm) / def.rate;
  }, 0);
}

function _fmtRate(rate) {
  if (rate <= 0) return '';
  if (rate >= 1)   return rate.toFixed(1) + '/s';
  if (rate >= 0.1) return rate.toFixed(2) + '/s';
  return '1 / ' + Math.round(1 / rate) + 's';
}

function renderWaterAutomation(zone) {
  const layer = document.getElementById('water-automation-layer');
  if (!layer) return;
  layer.innerHTML = '';

  const autoBg = ZONE_AUTO_BG[zone];
  if (!autoBg || !_hasZoneAuto(zone)) return;

  // Place invisible per-type anchors and per-type rate labels.
  AUTO_TYPE_ORDER.forEach(type => {
    const pos = autoBg.types[type];
    if (!pos) return;
    const anchor = document.createElement('div');
    anchor.id = 'water-auto-' + type;
    anchor.style.cssText = `position:absolute;left:${pos.x}%;top:${pos.y}%;width:0;height:0;pointer-events:none`;
    layer.appendChild(anchor);

    if (pos.labelX !== undefined) {
      const rate = _calcTypeRate(type);
      if (rate > 0) {
        const lbl = document.createElement('div');
        lbl.className = 'pond-net-rate-label';
        lbl.textContent = _fmtRate(rate);
        lbl.style.left = pos.labelX + '%';
        lbl.style.top  = pos.labelY + '%';
        layer.appendChild(lbl);
      }
    }
  });

}

const _FF_ICON_FISH  = 'img/icons/Game screen icons/fish_counter_icon.png';
const _FF_ICON_PLANT = 'img/icons/Game screen icons/Plant.png';
const _FF_ICON_TRASH = 'img/icons/Game screen icons/Trash.png';

function _autoTickIcon(rarity) {
  if (rarity === 'plant') return _FF_ICON_PLANT;
  if (rarity === 'trash') return _FF_ICON_TRASH;
  return _FF_ICON_FISH;
}

function _spawnTick(layer, x, y, icon, count) {
  const tick = document.createElement('div');
  tick.className = 'auto-catch-tick';
  tick.innerHTML = '<img src="' + icon + '" alt="" onerror="this.src=\'' + _FF_ICON_FISH + '\'">+' + count;
  tick.style.left = x + '%';
  tick.style.top  = y + '%';
  layer.appendChild(tick);
  tick.addEventListener('animationend', () => tick.remove());
}

function _spawnTickForCatch(type, rarity, count) {
  if (G.tickersEnabled === false) return;
  const layer = document.getElementById('water-automation-layer');
  if (!layer) return;
  const icon = _autoTickIcon(rarity);
  const ox = (Math.random() - 0.5) * 10;
  const oy = (Math.random() - 0.5) * 8;
  const anchor = document.getElementById('water-auto-' + type);
  if (anchor) {
    _spawnTick(layer, parseFloat(anchor.style.left) + ox, parseFloat(anchor.style.top) + oy, icon, count);
  } else {
    const pos = (ZONE_AUTO_BG[G.currentZone] || {}).combined || { x: 50, y: 45 };
    _spawnTick(layer, pos.x + ox, pos.y + oy, icon, count);
  }
}

// ── Seagull ───────────────────────────────────────────────────────────────────
// Sprite sheet: 1536×1024 — 6 cols × 3 rows = 18 frames, each 256×341px
// Displayed at 96×128px (scale 0.375), background-size 576×384px
const SGULL_COLS   = 6;
const SGULL_FRAME_W = 96;
const SGULL_FRAME_H = 128;
const SGULL_FRAMES  = 18; // 3 rows × 6 cols
const SGULL_FPS     = 12; // ms per frame = ~83ms

let _seagullTimer    = null;
let _seagullFlyEnd   = null;
let _seagullFlapIv   = null;
let _seagullFrame    = 0;
let _seagullActive   = false;

function _seagullStopFlap() {
  clearInterval(_seagullFlapIv);
  _seagullFlapIv = null;
}

function _seagullStartFlap(el) {
  _seagullFrame = 0;
  _seagullStopFlap();
  _seagullFlapIv = setInterval(() => {
    const col = _seagullFrame % SGULL_COLS;
    const row = Math.floor(_seagullFrame / SGULL_COLS);
    el.style.backgroundPosition = (-col * SGULL_FRAME_W) + 'px ' + (-row * SGULL_FRAME_H) + 'px';
    _seagullFrame = (_seagullFrame + 1) % SGULL_FRAMES;
  }, Math.round(1000 / SGULL_FPS));
}

function getSeagullIntervalMs() {
  return Math.round(60000 * Math.pow(0.95, G.seagullBaitCount || 0));
}

function getSeagullRewardMultiplier() {
  return 1 + ((G.seagullBaitCount || 0) * 0.10);
}

function startSeagullTimer() {
  clearTimeout(_seagullTimer);
  const iv = getSeagullIntervalMs();
  _seagullTimer = setTimeout(function nextGull() {
    spawnSeagull();
    _seagullTimer = setTimeout(nextGull, getSeagullIntervalMs());
  }, iv);
}

function stopSeagullTimer() {
  clearTimeout(_seagullTimer);
  _seagullTimer = null;
}

function spawnTutorialSeagull() {
  if (_seagullActive) return;
  const el = document.getElementById('seagull');
  if (!el) return;
  _seagullActive = true;
  el.style.top       = '35%';
  el.style.left      = 'calc(50% - 48px)';
  el.style.transform = '';
  el.style.backgroundPosition = '0px 0px';
  el.classList.remove('hidden', 'fly-right', 'fly-left');
  _seagullStartFlap(el);
  // No fly-out timer — tutorial controls dismissal via seagull click
}

function spawnSeagull() {
  if (_seagullActive) return;
  const el = document.getElementById('seagull');
  if (!el) return;
  _seagullActive = true;

  const goRight = Math.random() < 0.5;
  const y0 = (12 + Math.random() * 28);
  const y1 = (12 + Math.random() * 28);
  const durMs = Math.round(7500 + Math.random() * 3500); // 7.5–11s

  el.style.setProperty('--gull-y0', y0 + '%');
  el.style.setProperty('--gull-y1', y1 + '%');
  el.style.setProperty('--gull-dur', (durMs / 1000) + 's');
  el.style.top  = y0 + '%';
  el.style.left = '';
  el.style.transform = '';
  el.style.backgroundPosition = '0px 0px';
  el.classList.remove('hidden', 'fly-right', 'fly-left');
  void el.offsetWidth;
  el.classList.add(goRight ? 'fly-right' : 'fly-left');
  _seagullStartFlap(el);

  _seagullFlyEnd = setTimeout(() => {
    _seagullStopFlap();
    el.classList.add('hidden');
    el.classList.remove('fly-right', 'fly-left');
    el.style.transform = '';
    _seagullActive = false;
  }, durMs + 100);
}

function onSeagullClick(e) {
  if (e) e.stopPropagation();
  if (!_seagullActive) return;
  const el = document.getElementById('seagull');
  if (!el) return;

  _seagullStopFlap();
  clearTimeout(_seagullFlyEnd);
  _seagullActive = false;
  if (typeof tutHook === 'function') tutHook('seagull', null);
  playSfx(sfxSeagull);

  const reward = Math.max(10, Math.round(getEstimatedHourlyIncome() * 0.01 * getSeagullRewardMultiplier()));
  _earnCoins(reward);
  G.stats.totalSeagull = (G.stats.totalSeagull || 0) + 1;
  onSeagullEvent();
  saveState();
  updateHUD();
  _showSeagullRewardTick(el, reward);

  // Freeze at current visual position, play vanish
  const rect       = el.getBoundingClientRect();
  const parentRect = el.parentElement.getBoundingClientRect();
  el.style.left      = (rect.left - parentRect.left) + 'px';
  el.style.top       = (rect.top  - parentRect.top)  + 'px';
  el.classList.remove('fly-right', 'fly-left');
  el.style.transform = '';
  el.style.animation = 'seagullCatch 0.45s ease-out forwards';

  setTimeout(() => {
    el.classList.add('hidden');
    el.style.animation = '';
    el.style.left = '';
    el.style.transform = '';
  }, 480);
}

function _showSeagullRewardTick(seagullEl, amount) {
  const layer = document.getElementById('water-automation-layer');
  if (!layer) return;
  const rect       = seagullEl.getBoundingClientRect();
  const parentRect = layer.parentElement.getBoundingClientRect();
  const tick = document.createElement('div');
  tick.className = 'auto-catch-tick seagull-reward-tick';
  tick.innerHTML = '<img src="img/icons/Game screen icons/coin_icon.png" alt="">+' + formatCoins(amount) + 'c';
  tick.style.left = (rect.left - parentRect.left + rect.width / 2) + 'px';
  tick.style.top  = (rect.top  - parentRect.top)  + 'px';
  layer.appendChild(tick);
  tick.addEventListener('animationend', () => tick.remove());
}

const FISH_SHADOW_CLIPS = {
  pond:  'ellipse(38% 43% at 50% 53%)',
  river: 'polygon(12% 5%, 62% 5%, 90% 58%, 90% 90%, 5% 90%, 5% 38%)',
  lake:  'polygon(40% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 52%)',
  bay:   'polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 44%)',
  sea:   null,
  ocean: null,
};

function updateZoneBg(zoneId) {
  const z = ZONE_DATA.find(x => x.id === zoneId) || ZONE_DATA[0];
  const imgEl = document.getElementById('zone-bg');
  const area  = document.getElementById('water-area');
  // Switch to bespoke automation background when zone has any automation
  const autoBg = ZONE_AUTO_BG[zoneId];
  const bgSrc  = (autoBg && _hasZoneAuto(zoneId)) ? autoBg.bg : z.bg;
  if (bgSrc) {
    imgEl.src = bgSrc;
    imgEl.style.display = '';
    area.style.background = '';
  } else {
    imgEl.src = '';
    imgEl.style.display = 'none';
    area.style.background = 'linear-gradient(180deg, ' + z.bgColor + ' 0%, #0a0a1a 100%)';
  }
  document.getElementById('hud-zone').textContent = z.name;

  const shadowArea = document.querySelector('.fish-shadow-area');
  if (shadowArea) {
    const clip = FISH_SHADOW_CLIPS[zoneId];
    shadowArea.style.clipPath = clip || 'none';
  }

  renderWaterAutomation(zoneId);
  _gsRender();

  const npcHotspot = document.getElementById('npc-fisher-hotspot');
  if (npcHotspot) npcHotspot.classList.toggle('hidden', zoneId !== 'lake' || !_hasZoneAuto('lake'));
}

function openZonesHelp()  { document.getElementById('zones-help-overlay').classList.remove('hidden'); }
function closeZonesHelp() { document.getElementById('zones-help-overlay').classList.add('hidden'); }

function toggleZoneAuto(zoneId) {
  if (!G.activeAutomationZones) G.activeAutomationZones = [];
  const idx = G.activeAutomationZones.indexOf(zoneId);
  if (idx >= 0) {
    G.activeAutomationZones.splice(idx, 1);
  } else {
    if (G.activeAutomationZones.length >= 2) return;
    G.activeAutomationZones.push(zoneId);
  }
  saveState();
  renderZones();
}

function resetAutoZonesToPond() {
  G.activeAutomationZones = ['pond'];
  saveState();
  renderZones();
}

function renderZones() {
  const el = document.getElementById('zones-content');
  if (!el) return;
  el.innerHTML = '';

  // Update header counter
  const _countEl = document.getElementById('zones-auto-count');
  if (_countEl) _countEl.textContent = (G.activeAutomationZones || []).length + ' / 2';

  ZONE_DATA.forEach(zone => {
    const unlocked = isZoneUnlocked(zone.id);
    const isCurrent = G.currentZone === zone.id;
    const div = document.createElement('div');
    div.className = 'zone-card' + (isCurrent ? ' zone-card-active' : '') + (!unlocked ? ' zone-card-locked' : '');

    // Color stripe
    div.style.setProperty('--zc', zone.bgColor);

    const autoLine = '';

    // Requirements block for locked zones
    let reqHtml = '';
    let actionHtml = '';
    if (!unlocked) {
      const needRod = zone.requiredRod && !G.ownedRods.includes(zone.requiredRod);
      const rodDef  = RODS.find(r => r.id === zone.requiredRod);
      const transDef = TRANSPORT.find(t => t.id === zone.requiredTransport);
      const hasTransport = (G.ownedTransport || []).includes(zone.requiredTransport || '');
      const hasRod = !zone.requiredRod || G.ownedRods.includes(zone.requiredRod);

      const scaledRodCost   = rodDef   ? applyDiscount(applyZoneCostScaling(rodDef.cost))   : 0;
      const scaledTransCost = transDef ? applyDiscount(applyZoneCostScaling(transDef.cost)) : 0;
      if (rodDef) {
        reqHtml += '<div class="zone-req ' + (hasRod ? 'req-met' : '') + '">' +
          (hasRod ? '✓' : '×') + ' ' + rodDef.name + ' — ' + formatCoins(scaledRodCost) + 'c (Shop)</div>';
      }
      if (transDef) {
        reqHtml += '<div class="zone-req ' + (hasTransport ? 'req-met' : '') + '">' +
          (hasTransport ? '✓' : '×') + ' ' + transDef.name + ' — ' + formatCoins(scaledTransCost) + 'c</div>';
      }

      if (hasRod && transDef && !hasTransport) {
        const canAfford = G.coins >= scaledTransCost;
        actionHtml = '<button class="btn-zone ' + (canAfford ? 'btn-zone-buy js-buy' : 'btn-zone-cant') + '"' +
          (canAfford ? '' : ' disabled') + ' data-tid="' + transDef.id + '">' +
          (canAfford ? 'Buy ' + transDef.name : 'Need ' + formatCoins(scaledTransCost) + 'c') + '</button>';
      } else {
        actionHtml = '<button class="btn-zone btn-zone-cant" disabled>Locked</button>';
      }
    } else if (isCurrent) {
      actionHtml = '<button class="btn-zone btn-zone-active" disabled>Active</button>';
    } else {
      actionHtml = '<button class="btn-zone btn-zone-switch js-switch">Fish Here</button>';
    }

    const previewHtml = zone.bg
      ? '<img class="zone-preview-img" src="' + zone.bg + '" alt="">'
      : '<div class="zone-preview-color" style="background:' + zone.bgColor + '"></div>';

    const comicBtn = (zone.id === 'sea' && unlocked)
      ? '<button class="btn-zone-comic js-sea-comic" title="View Sea comic">📖</button>'
      : '';

    let autoZoneBtn = '';
    if (unlocked) {
      const activeZones = G.activeAutomationZones || [];
      const isAutoActive = activeZones.includes(zone.id);
      const isFull = !isAutoActive && activeZones.length >= 2;
      if (isAutoActive) {
        autoZoneBtn = '<button class="btn-zone-auto btn-zone-auto-on js-auto-toggle">Auto ✓</button>';
      } else if (isFull) {
        autoZoneBtn = '<button class="btn-zone-auto btn-zone-auto-full" disabled>Auto Full</button>';
      } else {
        autoZoneBtn = '<button class="btn-zone-auto js-auto-toggle">Set Auto</button>';
      }
    }

    div.innerHTML =
      '<div class="zone-color-bar"></div>' +
      '<div class="zone-card-body">' +
        '<div class="zone-card-text">' +
          '<div class="zone-card-head">' +
            '<span class="zone-card-name">' + zone.name + '</span>' +
            comicBtn +
            '<span class="zone-depth">' + zone.depth + '</span>' +
          '</div>' +
          '<div class="zone-card-desc">' + zone.desc + '</div>' +
          (reqHtml ? '<div class="zone-reqs">' + reqHtml + '</div>' : '') +
          autoLine +
        '</div>' +
        (autoZoneBtn ? '<div class="zone-auto-col">' + autoZoneBtn + '</div>' : '') +
        previewHtml +
      '</div>' +
      '<div class="zone-card-right">' + actionHtml + '</div>';

    const switchBtn = div.querySelector('.js-switch');
    if (switchBtn) switchBtn.addEventListener('click', () => switchZone(zone.id));

    const buyBtn = div.querySelector('.js-buy');
    if (buyBtn) buyBtn.addEventListener('click', () => buyTransport(buyBtn.dataset.tid));

    const seaComicBtn = div.querySelector('.js-sea-comic');
    if (seaComicBtn) seaComicBtn.addEventListener('click', () => showSeaComicPopup());

    const autoToggleBtn = div.querySelector('.js-auto-toggle');
    if (autoToggleBtn) autoToggleBtn.addEventListener('click', () => toggleZoneAuto(zone.id));

    el.appendChild(div);
  });
}

// ─── QUEST SYSTEM ────────────────────────────────────────────────────────────

let _storageFull = false;
let _questMsgThrottle = false;

function todayStr()  { return new Date().toISOString().slice(0, 10); }

function mondayStr() {
  const d    = new Date();
  const day  = d.getUTCDay(); // use UTC day to match toISOString() output
  const diff = day === 0 ? -6 : 1 - day;
  return new Date(d.getTime() + diff * 86400000).toISOString().slice(0, 10);
}

function initQuests() {
  const _preMergeStats = G.stats || {};
  const _needsZoneMigration = !('recHighestZone' in _preMergeStats);
  G.stats  = { ...DEFAULT_STATE.stats,  ..._preMergeStats };
  G.quests = { ...DEFAULT_STATE.quests, ...(G.quests || {}) };
  if (_needsZoneMigration) {
    const _top = [...ZONE_DATA].reverse().find(z => isZoneUnlocked(z.id));
    if (_top) G.stats.recHighestZone = _top.id;
  }
  migrateManualFishdex();
  migrateW1LegendaryBug();
  migrateSizeStringsToNumbers();
  // Seed trophyCatches for existing saves: use trophyRecords species count as minimum baseline
  // (trophyRecords is never cleared, so it's the best available lower bound for old saves)
  if (!G.stats.trophyCatches && Object.keys(G.trophyRecords || {}).length > 0)
    G.stats.trophyCatches = Object.keys(G.trophyRecords).length;

  const today  = todayStr();
  const monday = mondayStr();

  // No Waste — disqualify for existing saves that already have River
  if ((G.stats.noWasteTrash || 0) !== -1 && isZoneUnlocked('river')) G.stats.noWasteTrash = -1;

  if (G.quests.dailyDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if      (G.stats.lastPlay === yesterday) G.stats.playStreak++;
    else if (G.stats.lastPlay !== today)     G.stats.playStreak = 1;
    G.stats.lastPlay = today;

    // Unique days played
    G.stats.uniqueDaysPlayed = (G.stats.uniqueDaysPlayed || 0) + 1;
    syncAch('h_unique_days', G.stats.uniqueDaysPlayed);

    // Weekend Warrior
    const dow = new Date().getDay(); // 0=Sun, 6=Sat
    if (dow === 6) G.stats.weekendSat = true;
    if (dow === 0) G.stats.weekendSun = true;
    if (G.stats.weekendSat && G.stats.weekendSun) syncAch('h_weekend', 1);

    const shuffled = [...DAILY_QUESTS].sort(() => Math.random() - 0.5);
    G.quests.dailyIds = shuffled.slice(0, 3).map(q => q.id);
    G.quests.dp = {};
    G.quests.dailyIds.forEach(id => { G.quests.dp[id] = { prog: 0, claimed: false }; });
    G.quests.dailyDate    = today;
    G.quests.dailySpecies = [];
    saveState();
  }

  if (G.quests.weeklyDate !== monday) {
    const wq = WEEKLY_QUESTS[Math.floor(Math.random() * WEEKLY_QUESTS.length)];
    G.quests.weeklyId = wq.id;
    G.quests.wp       = { prog: 0, claimed: false };
    G.quests.weeklyDate = monday;
    saveState();
  }

  ACHIEVEMENTS.forEach(a => {
    if (!G.quests.ap[a.id]) G.quests.ap[a.id] = { prog: 0, claimed: false };
  });

  syncAch('streak', G.stats.playStreak);

  // Sync hidden achievements from saved state so old saves get credit
  syncAch('h_prestige',      G.prestigeCount || 0);
  syncAch('h_pearls',        G.blackPearls   || 0);
  syncAch('h_lost_treasure', G.stats.evLostTreasure || 0);
  syncAch('h_gs_expeditions',  G.stats.ghostShipExpeditions || 0);
  syncAch('h_gs_ghostbusters', (G.pearlUpgrades || {}).ghostbusters || 0);
  syncAch('h_chest_opened',    (G.sunkenTreasureStats || {}).opened || 0);
  syncAch('h_chest_diamonds',  (G.sunkenTreasureStats || {}).diamondsEarned || 0);
  if ((G.ghostShips || []).length > 0 || (G.stats.ghostShipExpeditions || 0) > 0 || (G.ownedAutomation || []).some(a => a.source === 'ghost_ship')) syncAch('h_gs_spotted', 1);
  if (((G.sunkenTreasureStats || {}).coinsEarned || 0) >= 10000000) syncAch('h_chest_coins', 1);
  if (((G.sunkenTreasureStats || {}).foundAutomation || 0) > 0) syncAch('h_chest_auto', 1);
  const _gsOwnedInit = new Set((G.ownedAutomation || []).filter(a => a.source === 'ghost_ship').map(a => a.id));
  if (_gsOwnedInit.has('river_net') && _gsOwnedInit.has('ancient_fisherman') && _gsOwnedInit.has('ancient_boat')) syncAch('h_gs_all_units', 1);
  if ((G.ownedAutomation || []).some(a => a.source === 'ghost_ship' && a.id === 'ancient_boat')) syncAch('h_gs_boat', 1);
  syncAch('h_manual_fish',   G.stats.manualFishTotal || 0);
  syncAch('h_midnight_fish', G.stats.midnightFishTotal || 0);
  syncAch('totalseagull',    G.stats.totalSeagull || 0);
  if ((G.coins || 0) >= 1000000) syncAch('h_millionaire', 1);
  if ((G.stats.lifeCoinsEarned || 0) >= 100000000) syncAch('h_tycoon', 1);
  if ((G.stats.lifeCoinsSpent  || 0) >= 50000000)  syncAch('h_bigspender', 1);
  if (isZoneUnlocked('ocean'))                       syncAch('h_ocean', 1);
  if (ZONE_DATA.every(z => isZoneUnlocked(z.id)))   syncAch('h_empire', 1);
  checkFishdexAch();

  // Sync storefull quest in case storage was already at capacity when the game loaded.
  // checkStorageFull() only fires on a not-full → full transition, so it never triggers
  // for storage that was already full in a previous session.
  _storageFull = fishPileTotal() >= storageCapacity();
  if (_storageFull) {
    (G.quests.dailyIds || []).forEach(id => {
      const qd = DAILY_QUESTS.find(q => q.id === id);
      if (qd && qd.type === 'storefull' && G.quests.dp[id] && !G.quests.dp[id].claimed)
        G.quests.dp[id].prog = 1;
    });
  }

  updateQuestBadge();
  checkGuildOrder();
  updateGuildBadge();
}

function onCatchEvent(fishId, rarity) {
  const isTrash = rarity === 'trash';
  const isPlant = rarity === 'plant';
  const isFish  = !isTrash && !isPlant;
  const isRare  = rarity === 'rare' || rarity === 'epic' || rarity === 'legendary';
  const isEpic  = rarity === 'epic' || rarity === 'legendary';

  if (isFish)  G.stats.totalFish++;
  if (isTrash) G.stats.totalTrash++;
  if (isEpic)  G.stats.totalEpic++;

  const now = Date.now();
  if (isFish) {
    if (now - G.stats.hourStart > 3600000) { G.stats.hourFish = 1; G.stats.hourStart = now; }
    else G.stats.hourFish++;
  }

  const { h } = getIngameTime();
  const isDawn     = h >= 4 && h < 7;
  const isMidnight = h === 0;

  (G.quests.dailyIds || []).forEach(id => {
    const qd = DAILY_QUESTS.find(q => q.id === id);
    if (!qd) return;
    const p = G.quests.dp[id];
    if (!p || p.claimed || p.prog >= qd.goal) return;
    if      (qd.type === 'fish'    && isFish)             p.prog++;
    else if (qd.type === 'trash'   && isTrash)            p.prog++;
    else if (qd.type === 'rare'    && isRare)             p.prog++;
    else if (qd.type === 'dawn'    && isDawn && isFish)   p.prog++;
    else if (qd.type === 'variety' && isFish) {
      if (!G.quests.dailySpecies.includes(fishId)) G.quests.dailySpecies.push(fishId);
      p.prog = Math.min(G.quests.dailySpecies.length, qd.goal);
    }
    if (p.prog > qd.goal) p.prog = qd.goal;
  });

  const wq = WEEKLY_QUESTS.find(q => q.id === G.quests.weeklyId);
  if (wq && !G.quests.wp.claimed) {
    if      (wq.type === 'fish'    && isFish)  G.quests.wp.prog = Math.min(G.quests.wp.prog + 1, wq.goal);
    else if (wq.type === 'trash'   && isTrash) G.quests.wp.prog = Math.min(G.quests.wp.prog + 1, wq.goal);
    else if (wq.type === 'fishdex') {
      G.quests.wp.prog = FISH_DB.filter(f => f.zones.includes('pond') && !isManualOnlyFish(f) && G.fishdex.includes(f.id)).length;
    }
  }

  syncAch('totalfish',  G.stats.totalFish);
  syncAch('totaltrash', G.stats.totalTrash);
  syncAch('epic',       G.stats.totalEpic);
  syncAch('speed',      G.stats.hourFish);
  syncAch('streak',     G.stats.playStreak);
  if (isMidnight && isFish) syncAch('midnight', 1);

  const pondAll =
    FISH_DB.filter(f  => f.zones.includes('pond') && !isManualOnlyFish(f) && G.fishdex.includes(f.id)).length +
    PLANT_DB.filter(p => p.zones.includes('pond') && G.fishdex.includes(p.id)).length +
    TRASH_DB.filter(t => t.zones.includes('pond') && G.fishdex.includes(t.id)).length;
  syncAch('pondall', pondAll);
  checkFishdexAch();
}

function onSellEvent(fishId, value) {
  (G.quests.dailyIds || []).forEach(id => {
    const qd = DAILY_QUESTS.find(q => q.id === id);
    if (!qd) return;
    const p = G.quests.dp[id];
    if (!p || p.claimed || p.prog >= qd.goal) return;
    if (qd.type === 'sell') p.prog++;
  });

  const wq = WEEKLY_QUESTS.find(q => q.id === G.quests.weeklyId);
  if (wq && wq.type === 'coins' && !G.quests.wp.claimed)
    G.quests.wp.prog = Math.min(G.quests.wp.prog + value, wq.goal);
}

function onSeagullEvent() {
  const total = G.stats.totalSeagull || 0;

  (G.quests.dailyIds || []).forEach(id => {
    const qd = DAILY_QUESTS.find(q => q.id === id);
    if (!qd || qd.type !== 'seagull') return;
    const p = G.quests.dp[id];
    if (!p || p.claimed || p.prog >= qd.goal) return;
    p.prog = Math.min(p.prog + 1, qd.goal);
  });

  const wq = WEEKLY_QUESTS.find(q => q.id === G.quests.weeklyId);
  if (wq && wq.type === 'seagull_week' && !G.quests.wp.claimed)
    G.quests.wp.prog = Math.min(G.quests.wp.prog + 1, wq.goal);

  syncAch('totalseagull', total);

  // Bird Army — seagulls this session
  _seagullSession++;
  syncAch('h_seagull_sess', _seagullSession);

  // Bird Whisperer — feed during all 5 time periods in one day
  const today = todayStr();
  const { h } = getIngameTime();
  const period = getTimePeriod(h);
  if ((G.stats.seagullPeriodsDate || '') !== today) {
    G.stats.seagullPeriodsDate = today;
    G.stats.seagullPeriods = [];
  }
  if (!(G.stats.seagullPeriods || []).includes(period)) {
    G.stats.seagullPeriods = [...(G.stats.seagullPeriods || []), period];
    syncAch('h_seagull_periods', G.stats.seagullPeriods.length);
  }

  finalizeQuestUpdate();
}

function onStorageFullEvent() {
  G.stats.storageFills++;

  (G.quests.dailyIds || []).forEach(id => {
    const qd = DAILY_QUESTS.find(q => q.id === id);
    if (qd && qd.type === 'storefull' && G.quests.dp[id] && !G.quests.dp[id].claimed)
      G.quests.dp[id].prog = 1;
  });

  syncAch('storefills', G.stats.storageFills);
  finalizeQuestUpdate();
}

function fishPileKey(fishId, size) { return fishId + '|' + size; }
function fishPileTotal() {
  return Object.values(G.fishPile || {}).reduce((s, q) => s + q, 0)
       + (G.trophyPile || []).length;
}
function fishPileValue(fishId, size) {
  const f = FISH_DB.find(x => x.id === fishId);
  if (!f) return 0;
  if (size === 'FishFight') return f.baseValue * 5; // exact 5× base, no multipliers
  const sizeKey = isNaN(Number(size)) ? size : Number(size); // keys from split() are strings; SIZE_TABLE uses numbers
  const s = SIZE_TABLE.find(x => x.size === sizeKey);
  if (!s) return 0;
  const abyssBonus = f.zone === 'abyss' ? getRodAbyssSellBonus() : 1;
  return Math.round(f.baseValue * s.mult * getRodSellBonus() * abyssBonus * getBlackPearlBonus() * getMasteryFishSellMult() * (G.devSupportOwned ? 1.25 : 1) * getRemoteFishSellMult());
}

function checkStorageFull() {
  const full = fishPileTotal() >= storageCapacity();
  if (full && !_storageFull) { _storageFull = true; onStorageFullEvent(); }
  else if (!full) _storageFull = false;
}

function syncAch(type, value) {
  ACHIEVEMENTS.forEach(a => {
    if (a.type !== type) return;
    const ap = G.quests.ap[a.id];
    if (ap && !ap.claimed) ap.prog = Math.min(value, a.goal);
  });
}

let _seagullSession = 0; // reset each app load — for Bird Army

function checkFishdexAch() {
  const allItems = FISH_DB.filter(f => !isManualOnlyFish(f)).length + PLANT_DB.length + TRASH_DB.length;
  const autoFishdexCount = G.fishdex.filter(id => {
    const f = FISH_DB.find(x => x.id === id);
    if (f) return !isManualOnlyFish(f);
    return true; // plants/trash always count
  }).length;
  syncAch('h_fishdex', Math.min(autoFishdexCount, allItems));
  let zonesComplete = 0;
  ZONE_DATA.forEach(z => {
    const entries = [
      ...FISH_DB.filter(f => f.zones.includes(z.id) && !isManualOnlyFish(f)),
      ...PLANT_DB.filter(p => p.zones.includes(z.id)),
      ...TRASH_DB.filter(t => t.zones.includes(z.id)),
    ];
    if (entries.length && entries.every(e => G.fishdex.includes(e.id))) zonesComplete++;
  });
  syncAch('h_world_dex', zonesComplete);
}

function checkCollectorsDream() {
  const hasAllRods = RODS.every(r => (G.ownedRods || []).includes(r.id));
  const bobberTypes = ['basic_bobber','sensitive_bobber','heavy_bobber','electronic_bobber'];
  const hasAllBobbers = bobberTypes.every(b => (G.bobberTiers || {})[b] > 0);
  const hasAllStorage = STORAGE_ITEMS.every(s => (G.ownedStorage || []).some(o => o.id === s.id));
  const ownedAutoIds = new Set((G.ownedAutomation || []).map(a => a.id));
  const hasAllAuto = AUTOMATION.every(a => ownedAutoIds.has(a.id));
  if (hasAllRods && hasAllBobbers && hasAllStorage && hasAllAuto) syncAch('h_collector', 1);
}

function checkAllAch() {
  const others = ACHIEVEMENTS.filter(a => a.id !== 'ach_h_patient');
  const allDone = others.every(a => { const ap = G.quests.ap[a.id]; return ap && ap.claimed; });
  if (allDone) syncAch('h_all_ach', 1);
}

function trackManualCatch(c) {
  const isFish  = c.rarity !== 'trash' && c.rarity !== 'plant';
  const { h }   = getIngameTime();
  const today   = todayStr();

  G.stats.manualFishTotal = (G.stats.manualFishTotal || 0) + 1;
  syncAch('h_manual_fish', G.stats.manualFishTotal);

  G.stats.castStreak = (G.stats.castStreak || 0) + 1;
  syncAch('h_cast_streak', G.stats.castStreak);

  G.stats.lastFishAt = Date.now();

  if (c.luckyHook && isCompetitionActive()) G.stats.lastCompLucky = true;

  if (isFish) {
    if (c.isTrophy) {
      G.stats.trophyStreak = (G.stats.trophyStreak || 0) + 1;
      syncAch('h_trophy_streak', G.stats.trophyStreak);
    } else {
      G.stats.trophyStreak = 0;
      syncAch('h_trophy_streak', 0);
    }

    if (c.rarity === 'legendary') {
      if (h >= 22 || h < 4) syncAch('h_night_legend', 1);
      const now = Date.now();
      if ((G.stats.lastLegendaryAt || 0) > 0 && now - G.stats.lastLegendaryAt < 300000)
        syncAch('h_double_legend', 1);
      G.stats.lastLegendaryAt = now;
      if (c.luckyHook) syncAch('h_only_best', 1);
    }

    if (c.isTrophy && c.weightG != null) {
      if (c.weightG < 10)      syncAch('h_tiny_trophy', 1);
      if (c.weightG >= 100000) syncAch('h_big_trophy',  1);
    }

    if (h >= 0 && h < 4) {
      G.stats.midnightFishTotal = (G.stats.midnightFishTotal || 0) + 1;
      syncAch('h_midnight_fish', G.stats.midnightFishTotal);
    }
  }

  if (h === 4) syncAch('h_dawn_first', 1);

  const period = getTimePeriod(h);
  if ((G.stats.periodsDate || '') !== today) {
    G.stats.periodsDate = today;
    G.stats.periodsCaught = [];
  }
  if (!(G.stats.periodsCaught || []).includes(period)) {
    G.stats.periodsCaught = [...(G.stats.periodsCaught || []), period];
    syncAch('h_all_periods', G.stats.periodsCaught.length);
  }

  if (c.rarity === 'trash' && (G.stats.noWasteTrash || 0) !== -1) {
    G.stats.noWasteTrash = (G.stats.noWasteTrash || 0) + 1;
  }

  if (isFish) {
    const wt = c.weightG != null ? c.weightG : _estimateFishWeight(c.fishId, c.size);
    if (wt != null && (!G.stats.recBiggestFish || wt > G.stats.recBiggestFish.weightG)) {
      G.stats.recBiggestFish = { name: c.name, weightG: wt };
    }
    if (c.isTrophy && c.weightG != null) {
      G.stats.recManualTrophyCount = (G.stats.recManualTrophyCount || 0) + 1;
      if (!G.stats.recHeaviestTrophy || c.weightG > G.stats.recHeaviestTrophy.weightG) {
        G.stats.recHeaviestTrophy = { name: c.name, weightG: c.weightG };
      }
    }
  }

  if (isFish) onGuildManualCatch(c.fishId, c._multi || 1);
}

function _estimateFishWeight(fishId, size) {
  const range = FISH_WEIGHTS[fishId];
  if (!range) return null;
  const [lo, hi] = range;
  const r = { Tiny: 0.1, Small: 0.3, Medium: 0.55, Large: 0.75, Trophy: 0.9 }[size] || 0.55;
  return Math.round(lo + (hi - lo) * r);
}

function _updateSaleRecords(fishId, size, val) {
  const fish = FISH_DB.find(f => f.id === fishId);
  if (val > (G.stats.recMostValuableSaleVal || 0)) {
    G.stats.recMostValuableSaleVal = val;
    G.stats.recMostValuableSale = { name: fish ? fish.name : fishId, sizeLabel: size, value: val };
  }
  if (fish && fish.baseValue > 0) {
    const mult = val / fish.baseValue;
    if (mult > (G.stats.recHighestMult || 0)) G.stats.recHighestMult = mult;
  }
}

// bestSize is now a number 1–20; comparison is numeric

function trackManualFishdexEntry(c) {
  const fish = FISH_DB.find(f => f.id === c.fishId);
  if (!fish || !isManualOnlyFish(fish)) return;
  if (!G.manualFishdex) G.manualFishdex = {};
  const prev = G.manualFishdex[c.fishId] || {
    discovered: false, firstCaughtDate: null,
    totalCatches: 0, largestWeight: 0, bestSize: null, trophyCount: 0,
  };
  const isFirstCatch = !prev.discovered;
  prev.discovered = true;
  if (!prev.firstCaughtDate) prev.firstCaughtDate = todayStr();
  prev.totalCatches = (prev.totalCatches || 0) + 1;
  const sz = c.size || null;
  if (sz) {
    if (!prev.bestSize || sz > prev.bestSize)
      prev.bestSize = sz;
  }
  if (c.weightG && c.weightG > (prev.largestWeight || 0)) prev.largestWeight = c.weightG;
  if (c.isTrophy) prev.trophyCount = (prev.trophyCount || 0) + 1;
  G.manualFishdex[c.fishId] = prev;

  if (isFirstCatch && fish.rarity === 'legendary' && !fish.w1legendary) {
    // Existing manual-only legendaries (giant squid, coelacanth) give +3 diamonds
    G.diamonds = (G.diamonds || 0) + 3;
    showStatus('LEGENDARY CATCH! +3 Diamonds earned!', 4000);
  }
  if (fish.w1legendary) {
    // Queue the golden legendary popup; show after the normal catch popup closes
    _queueLegendaryPopup({ fishId: fish.id, name: fish.name, img: fish.img, zone: c.zone || G.currentZone, isFirst: isFirstCatch });
  }
}

// On first load, migrate any already-caught manual-only fish from G.fishdex
function migrateManualFishdex() {
  if (!G.manualFishdex) G.manualFishdex = {};
  const manualFish = FISH_DB.filter(f => isManualOnlyFish(f));
  manualFish.forEach(f => {
    if (G.fishdex.includes(f.id) && !G.manualFishdex[f.id]) {
      G.manualFishdex[f.id] = {
        discovered: true, firstCaughtDate: null,
        totalCatches: 1, largestWeight: 0, bestSize: null, trophyCount: 0,
      };
      // Migrate trophy record if it exists
      if ((G.trophyRecords || {})[f.id]) {
        G.manualFishdex[f.id].largestWeight = G.trophyRecords[f.id].weight || 0;
        G.manualFishdex[f.id].trophyCount   = 1;
        G.manualFishdex[f.id].bestSize       = 20;
      }
    }
  });
  // Sanitize: remove any W1 legendary IDs from targeted lure targets (not targetable)
  if (G.targetedLureTargets && G.targetedLureTargets.length > 0) {
    G.targetedLureTargets = G.targetedLureTargets.filter(id => !isW1LegendaryId(id));
  }
}

// One-time cleanup: remove W1 legendary fish that were incorrectly caught via the epic loot-table
// fallback bug (v0.9.0–v0.9.1). W1 legendary fish should only be catchable at 1/50M probability;
// the bug caused them to appear at ~0.23% in Pond zone for automation/offline.
function migrateW1LegendaryBug() {
  if (G.w1legBugCleaned) return;
  const w1ids = new Set(FISH_DB.filter(f => f.w1legendary).map(f => f.id));
  Object.keys(G.fishPile || {}).forEach(key => {
    const fishId = key.split('|')[0];
    if (w1ids.has(fishId)) delete G.fishPile[key];
  });
  if (G.fishdex) G.fishdex = G.fishdex.filter(id => !w1ids.has(id));
  G.w1legBugCleaned = true;
}

// Migrate fishPile string-size keys and manualFishdex bestSize strings → numeric sizes (v0.9.4+)
function migrateSizeStringsToNumbers() {
  if (G.sizesMigrated) return;
  const _strToNum = { Tiny:4, Small:8, Medium:10, Large:14, Trophy:20 };
  if (G.fishPile) {
    const newPile = {};
    Object.entries(G.fishPile).forEach(([key, qty]) => {
      const parts = key.split('|');
      const fishId = parts[0], sizeStr = parts[1];
      if (sizeStr && isNaN(Number(sizeStr))) {
        const numSize = _strToNum[sizeStr] || 10;
        const newKey = fishId + '|' + numSize;
        newPile[newKey] = (newPile[newKey] || 0) + qty;
      } else {
        newPile[key] = (newPile[key] || 0) + qty;
      }
    });
    G.fishPile = newPile;
  }
  if (G.manualFishdex) {
    Object.values(G.manualFishdex).forEach(entry => {
      if (entry.bestSize && isNaN(Number(entry.bestSize))) {
        entry.bestSize = _strToNum[entry.bestSize] || 10;
      }
    });
  }
  G.sizesMigrated = true;
}

function finalizeQuestUpdate() {
  const hasClaimable =
    (G.quests.dailyIds || []).some(id => {
      const qd = DAILY_QUESTS.find(q => q.id === id);
      return qd && G.quests.dp[id] && G.quests.dp[id].prog >= qd.goal && !G.quests.dp[id].claimed;
    }) ||
    (() => {
      const wq = WEEKLY_QUESTS.find(q => q.id === G.quests.weeklyId);
      return wq && G.quests.wp.prog >= wq.goal && !G.quests.wp.claimed;
    })() ||
    ACHIEVEMENTS.some(a => {
      const ap = G.quests.ap[a.id];
      return ap && ap.prog >= a.goal && !ap.claimed;
    });

  if (hasClaimable && !_questMsgThrottle) {
    _questMsgThrottle = true;
    showStatus('Quest complete! Tap Quests for reward.', 3000);
    setTimeout(() => { _questMsgThrottle = false; }, 8000);
  }
  updateQuestBadge();
}

const ZONE_AVG_COIN = { pond:4, river:10, lake:22, bay:50, sea:110, ocean:220, abyss:500 };

function calcQuestBonus(seconds) {
  const rate = calcFishRate();
  if (rate <= 0) return 0;
  const avgVal = (ZONE_AVG_COIN[G.currentZone] || 4) * getRodSellBonus() * getBlackPearlBonus();
  return Math.floor(rate * avgVal * seconds);
}

function questTotalReward(baseReward, seconds) {
  return baseReward + calcQuestBonus(seconds);
}

function claimQuestReward(type, id) {
  let reward = 0;
  let seconds = 0;
  if (type === 'daily') {
    const qd = DAILY_QUESTS.find(q => q.id === id);
    const p  = G.quests.dp[id];
    if (!qd || !p || p.prog < qd.goal || p.claimed) return;
    reward = qd.reward; seconds = 30; p.claimed = true;
  } else if (type === 'weekly') {
    const wq = WEEKLY_QUESTS.find(q => q.id === G.quests.weeklyId);
    if (!wq || G.quests.wp.prog < wq.goal || G.quests.wp.claimed) return;
    reward = wq.reward; seconds = 120; G.quests.wp.claimed = true;
  } else if (type === 'ach') {
    const a  = ACHIEVEMENTS.find(x => x.id === id);
    const ap = G.quests.ap[id];
    if (!a || !ap || ap.prog < a.goal || ap.claimed) return;
    reward = a.reward; seconds = 60; ap.claimed = true;
  }
  if (!reward) return;
  const total = Math.round(questTotalReward(reward, seconds) * getMasteryQuestMult());
  _earnCoins(total);
  checkAllAch();
  saveState();
  updateHUD();
  showStatus('+' + formatCoins(total) + 'c reward claimed!', 2000);
  renderQuests();
  updateQuestBadge();
}

function updateQuestBadge() {
  const claimable =
    (G.quests.dailyIds || []).some(id => {
      const qd = DAILY_QUESTS.find(q => q.id === id);
      return qd && G.quests.dp[id] && G.quests.dp[id].prog >= qd.goal && !G.quests.dp[id].claimed;
    }) ||
    (() => {
      const wq = WEEKLY_QUESTS.find(q => q.id === G.quests.weeklyId);
      return wq && G.quests.wp.prog >= wq.goal && !G.quests.wp.claimed;
    })() ||
    ACHIEVEMENTS.some(a => {
      const ap = G.quests.ap[a.id];
      return ap && ap.prog >= a.goal && !ap.claimed;
    });

  const btn = document.querySelector('[data-screen="quests"]');
  if (!btn) return;
  let dot = btn.querySelector('.quest-badge');
  if (claimable && !dot) {
    dot = document.createElement('span');
    dot.className = 'quest-badge';
    btn.style.position = 'relative';
    btn.appendChild(dot);
  } else if (!claimable && dot) {
    dot.remove();
  }
}

function renderQuests() {
  const el = document.getElementById('quests-content');
  if (!el) return;
  el.innerHTML = '';

  // ── Hide completed toggle ──
  const toggleRow = document.createElement('div');
  toggleRow.className = 'quests-toggle-row';
  toggleRow.innerHTML =
    '<span class="quests-toggle-label">Hide completed</span>' +
    '<button class="quests-toggle-btn' + (G.hideCompletedQuests ? ' active' : '') + '" id="btn-hide-completed">' +
    (G.hideCompletedQuests ? 'ON' : 'OFF') + '</button>';
  toggleRow.querySelector('#btn-hide-completed').addEventListener('click', () => {
    G.hideCompletedQuests = !G.hideCompletedQuests;
    saveState();
    renderQuests();
  });
  el.appendChild(toggleRow);

  // ── Daily Quests ──
  const now = new Date();
  const msTilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
  const hh = Math.floor(msTilMidnight / 3600000);
  const mm = Math.floor((msTilMidnight % 3600000) / 60000);
  el.appendChild(makeSectionHeader('Daily Quests', 'Resets in ' + hh + 'h ' + mm + 'm'));
  (G.quests.dailyIds || []).forEach(id => {
    const qd = DAILY_QUESTS.find(q => q.id === id);
    if (!qd) return;
    const p = G.quests.dp[id] || { prog: 0, claimed: false };
    if (G.hideCompletedQuests && p.claimed) return;
    el.appendChild(makeQuestCard(qd.name, qd.desc, p.prog, qd.goal, qd.reward, 30, p.claimed,
      () => claimQuestReward('daily', id)));
  });

  // ── Weekly Quest ──
  el.appendChild(makeSectionHeader('Weekly Quest', 'Resets Monday'));
  const wq = WEEKLY_QUESTS.find(q => q.id === G.quests.weeklyId);
  if (wq) {
    const wp = G.quests.wp;
    if (!(G.hideCompletedQuests && wp.claimed)) {
      el.appendChild(makeQuestCard(wq.name, wq.desc, wp.prog, wq.goal, wq.reward, 120, wp.claimed,
        () => claimQuestReward('weekly', wq.id)));
    }
  }

  // ── Achievements ──
  const achDone = ACHIEVEMENTS.filter(a => G.quests.ap[a.id] && G.quests.ap[a.id].claimed).length;
  el.appendChild(makeSectionHeader('Achievements', achDone + ' / ' + ACHIEVEMENTS.length + ' unlocked'));
  ACHIEVEMENTS.forEach(a => {
    const ap = G.quests.ap[a.id] || { prog: 0, claimed: false };
    if (G.hideCompletedQuests && ap.claimed) return;
    const isHidden = a.hidden && ap.prog < a.goal && !ap.claimed;
    el.appendChild(makeQuestCard(
      isHidden ? '???' : a.name,
      isHidden ? 'Hidden Achievement' : a.desc,
      isHidden ? 0 : ap.prog,
      isHidden ? 1 : a.goal,
      a.reward, 60, ap.claimed,
      () => claimQuestReward('ach', a.id),
      isHidden
    ));
  });
}

function makeSectionHeader(title, sub) {
  const div = document.createElement('div');
  div.className = 'quests-section-header';
  div.innerHTML = title + (sub ? '<span class="quests-section-sub">' + sub + '</span>' : '');
  return div;
}

function makeQuestCard(name, desc, prog, goal, baseReward, seconds, claimed, onClaim, hidden) {
  if (hidden) {
    const div = document.createElement('div');
    div.className = 'quest-card quest-card-hidden';
    div.innerHTML =
      '<div class="quest-left">' +
        '<span class="quest-name quest-hidden-name">???</span>' +
        '<span class="quest-desc-inline"> · Hidden Achievement</span>' +
      '</div>' +
      '<div class="quest-mid">' +
        '<div class="quest-prog-bar"><div class="quest-prog-fill quest-hidden-fill"></div></div>' +
        '<span class="quest-prog-text">?/?</span>' +
      '</div>' +
      '<div class="quest-right">' +
        '<span class="quest-reward quest-hidden-reward">+?c</span>' +
        '<button class="btn-quest" disabled>Hidden</button>' +
      '</div>';
    return div;
  }
  const complete = prog >= goal;
  const pct      = Math.min(100, Math.round(prog / goal * 100));
  const total    = questTotalReward(baseReward, seconds);
  const div = document.createElement('div');
  div.className = 'quest-card' + (claimed ? ' quest-card-done' : complete ? ' quest-card-ready' : '');
  div.innerHTML =
    '<div class="quest-left">' +
      '<span class="quest-name">' + name + '</span>' +
      '<span class="quest-desc-inline"> · ' + desc + '</span>' +
    '</div>' +
    '<div class="quest-mid">' +
      '<div class="quest-prog-bar"><div class="quest-prog-fill" style="width:' + pct + '%"></div></div>' +
      '<span class="quest-prog-text">' + prog + '/' + goal + '</span>' +
    '</div>' +
    '<div class="quest-right">' +
      '<span class="quest-reward">+' + formatCoins(total) + 'c</span>' +
      '<button class="btn-quest' + (complete && !claimed ? ' btn-quest-ready' : '') + '"' +
        (!complete || claimed ? ' disabled' : '') + '>' +
        (claimed ? 'Done' : complete ? 'Claim!' : 'Active') +
      '</button>' +
    '</div>';
  if (complete && !claimed) div.querySelector('.btn-quest').addEventListener('click', onClaim);
  return div;
}

// ─── CATCH LOGIC ─────────────────────────────────────────────────────────────

function rollCatch(zone, isManual) {
  zone = zone || G.currentZone;

  // W1 Legendary independent pre-roll: 1/50,000,000 per fish, independent of loot table.
  // Applies to both manual and automation catches. Not affected by rarity bonuses or targeting.
  if (fishPileTotal() < storageCapacity()) {
    const legC = _rollW1Legendary(zone);
    if (legC) return legC;
  }

  let lootTable = (LOOT_TABLES[zone] || LOOT_TABLES.pond).map(e => ({ ...e }));

  // Existing manual-only legendaries (giant_squid, coelacanth) use loot table weight.
  // W1 legendary are handled above via independent roll, never in the weight table.
  if (!isManual) lootTable = lootTable.filter(e => e.type !== 'legendary');

  // Manual fishing: no plants, only 5% trash, +25% rarity bonus on non-common
  if (isManual) {
    lootTable = lootTable.filter(e => e.type !== 'plant');
    const nonTrashTotal = lootTable.filter(e => e.type !== 'trash').reduce((s, e) => s + e.weight, 0);
    const trashWeight = nonTrashTotal * (5 / 95);
    lootTable = lootTable.map(e => e.type === 'trash' ? { ...e, weight: trashWeight } : e);
    if (!isPremiumBaitActive()) {
      lootTable = lootTable.map(e =>
        (e.type !== 'trash' && e.type !== 'common')
          ? { ...e, weight: e.weight * 1.25 } : e
      );
    }
  }

  const rarBonus = 1 + getRarityBonus() + (isPremiumBaitActive() ? 1 : 0) + getPearlLuckyWatersBonus() + getMasteryRareChanceBonus();
  if (rarBonus > 1) {
    lootTable = lootTable.map(e =>
      (e.type !== 'trash' && e.type !== 'plant' && e.type !== 'common')
        ? { ...e, weight: e.weight * rarBonus } : e
    );
  }
  const legBonus = 1 + getRodLegendaryBonus();
  if (legBonus > 1) {
    lootTable = lootTable.map(e =>
      e.type === 'legendary' ? { ...e, weight: e.weight * legBonus } : e
    );
  }

  let usedLuckyHook = false;
  if (isManual && isLuckyHookActive()) {
    usedLuckyHook = true;
    const rarePlus = lootTable.filter(e => ['rare','epic','legendary'].includes(e.type));
    if (rarePlus.length) lootTable = rarePlus;
  }

  const roll = weightedRandom(lootTable);

  const _lureActive = !isManual && (G.targetedLureTargets || []).length > 0;
  function _pickFromPool(pool) {
    if (!_lureActive) return pool[randInt(0, pool.length - 1)];
    const weighted = pool.map(item => ({ item, w: isTargetedItem(item.id) ? 3 : 1 }));
    const total = weighted.reduce((s, e) => s + e.w, 0);
    let r = Math.random() * total;
    for (const e of weighted) { r -= e.w; if (r <= 0) return e.item; }
    return weighted[weighted.length - 1].item;
  }

  if (roll.type === 'plant') {
    const pool = PLANT_DB.filter(p => p.zones.includes(zone));
    const plant = _pickFromPool(pool);
    if (!plant) return rollCatch(zone, isManual); // safety fallback
    return { fishId:plant.id, name:plant.name, rarity:'plant', size:null, sizeMult:1, value:0, caughtAt:Date.now(), img:null, autoSell:true };
  }

  if (roll.type === 'trash') {
    const pool = TRASH_DB.filter(t => t.zones.includes(zone));
    const t = _pickFromPool(pool);
    if (!t) return rollCatch(zone, isManual);
    return { fishId:t.id, name:t.name, rarity:'trash', size:null, sizeMult:1, value:1, caughtAt:Date.now(), img:t.img || null, autoSell:true };
  }

  let pool = FISH_DB.filter(f => f.rarity === roll.type && f.zones.includes(zone) && isTimeAvailable(f) && (isManual || !isManualOnlyFish(f)) && !f.w1legendary);
  // Fallbacks: time-gated manualOnly/special fish must ALWAYS respect their timeWindow —
  // only relax the constraint for regular fish that have no timeWindow.
  if (!pool.length) pool = FISH_DB.filter(f => f.rarity === roll.type && f.zones.includes(zone) && (!isManualOnlyFish(f) || isTimeAvailable(f)) && (isManual || !isManualOnlyFish(f)) && !f.w1legendary);
  if (!pool.length) pool = FISH_DB.filter(f => f.zones.includes(zone) && (!isManualOnlyFish(f) || isTimeAvailable(f)) && (isManual || !isManualOnlyFish(f)) && !f.w1legendary);
  if (!pool.length) return rollCatch('pond', isManual); // ultimate fallback
  const fish = _pickFromPool(pool);
  const trophyMult = (isCompetitionActive() ? 2 : 1) * (1 + getPearlFishWhispererBonus() * 10 + getMasteryTrophyBonus() * 10);
  const bobberShift = getSizeShift(); // 0–5+; each tier adds weight bias toward larger ranges
  const sizePool = SIZE_TABLE.map((e, i) => {
    // Trophy ranges (i=17-19) use a much smaller scale so Tier 15 ≈ 2.5% trophy max.
    // Non-trophy ranges use /4 for a strong per-tier distribution shift.
    const bonus = e.trophy
        ? Math.floor(bobberShift * (i - 16) * 9 / 20)
        : Math.floor(bobberShift * i / 4);
    let w = e.weight + bonus;
    if (e.trophy && trophyMult !== 1) w = Math.round(w * trophyMult);
    return w !== e.weight ? { ...e, weight: w } : e;
  });
  const sizeRow = weightedRandom(sizePool);
  const isTrophy = !!sizeRow.trophy;
  const weightG  = isTrophy ? (() => {
    const [wMin, wMax] = FISH_WEIGHTS[fish.id] || [100, 1000];
    return Math.round(wMin + Math.random() * (wMax - wMin));
  })() : null;
  // Trophies sell for diamonds, but still need a coin value for competition/record ranking
  const value = Math.round(fish.baseValue * sizeRow.mult);

  return { fishId:fish.id, name:fish.name, rarity:fish.rarity, size:sizeRow.size, sizeMult:sizeRow.mult, value, caughtAt:Date.now(), img:fish.img, autoSell:false, isTrophy, weightG, zone:zone || G.currentZone, luckyHook:usedLuckyHook };
}

function presentCatch(c) {
  currentCatch = c;
  playSfx(sfxFishCaught);

  // Check storage capacity (fish only — trash/plants and Fish Fight always accepted)
  if (!c.isFishFight && c.rarity !== 'trash' && c.rarity !== 'plant' && fishPileTotal() >= storageCapacity()) {
    showStorageFullPopup();
    resetFishingState();
    return;
  }

  // Show catch popup
  const popup = document.getElementById('catch-popup');
  const badge = document.getElementById('catch-rarity-badge');
  const img   = document.getElementById('catch-fish-img');
  const name  = document.getElementById('catch-fish-name');
  const size  = document.getElementById('catch-fish-size');
  const val   = document.getElementById('catch-fish-value');

  const isTrash     = c.rarity === 'trash';
  const isPlant     = c.rarity === 'plant';
  const isFishFight = !!c.isFishFight;
  if (isFishFight) {
    badge.textContent = 'FISH FIGHT!';
    badge.className = 'catch-rarity-badge rarity-fishfight';
  } else if (c.isTrophy) {
    badge.textContent = 'TROPHY';
    badge.className = 'catch-rarity-badge rarity-trophy';
  } else if (isTrash) {
    badge.textContent = 'TRASH';
    badge.className = 'catch-rarity-badge rarity-trash';
  } else if (isPlant) {
    badge.textContent = 'PLANT';
    badge.className = 'catch-rarity-badge rarity-plant';
  } else {
    badge.textContent = c.rarity.toUpperCase();
    badge.className = 'catch-rarity-badge ' + rarityClass(c.rarity);
  }
  img.src = c.img || '';
  img.style.display = c.img ? 'block' : 'none';
  name.textContent = c.name;
  const _eTier = getBobberTier('electronic_bobber');
  const _pearlMC = (G.pearlUpgrades||{}).multicatch||0;
  const _exc = getPearlExtraCatchChance();
  const _multi = 1 + _pearlMC + Math.floor(_eTier / 2)
               + (_eTier % 2 === 1 && Math.random() < 0.5 ? 1 : 0)
               + (_exc > 0 && Math.random() < _exc ? 1 : 0);
  c._preMulti = _multi;
  if (isFishFight)   size.textContent = 'Fish Fight Catch' + (_multi > 1 ? ' ×' + _multi : '');
  else if (c.isTrophy) size.textContent = 'Trophy · ' + formatWeight(c.weightG);
  else if (isTrash)  size.textContent = 'Goes to Market' + (_multi > 1 ? ' ×' + _multi : '');
  else if (isPlant)  size.textContent = 'Goes to Market' + (_multi > 1 ? ' ×' + _multi : '');
  else               size.textContent = 'Size ' + c.size + (_multi > 1 ? ' ×' + _multi : '');
  if (isFishFight)   val.textContent = '+' + (c.value * _multi) + 'c (base ×5' + (_multi > 1 ? ' ×' + _multi + ' multi' : '') + ')';
  else if (c.isTrophy) val.innerHTML = '+1 <img src="img/icons/Diamond icon.png" class="diamond-icon-sm" alt="◆" style="vertical-align:middle">';
  else if (isTrash)  val.textContent = '+' + _multi + 'c';
  else if (isPlant)  val.textContent = 'No value';
  else               val.textContent = '+' + (c.value * _multi) + 'c' + (_multi > 1 ? ' (' + c.value + 'c ×' + _multi + ')' : '');

  const btn = document.getElementById('btn-catch-ok');
  btn.disabled = true;
  setTimeout(() => { btn.disabled = false; }, 1000);

  // Rarity glow on card
  const inner = popup.querySelector('.catch-popup-inner');
  inner.classList.remove('glow-epic', 'glow-legendary', 'glow-trophy');
  if (c.isTrophy)              inner.classList.add('glow-trophy');
  else if (c.rarity === 'legendary') inner.classList.add('glow-legendary');
  else if (c.rarity === 'epic')      inner.classList.add('glow-epic');

  // Screen flash for high rarity
  if (c.isTrophy || c.rarity === 'epic' || c.rarity === 'legendary') {
    const flash = document.createElement('div');
    flash.className = 'rarity-flash ' + (c.isTrophy ? 'trophy' : c.rarity);
    document.body.appendChild(flash);
    flash.addEventListener('animationend', () => flash.remove());
  }

  // Dad joke injection (manual fish only — not trash, plant, fish fight, or auto)
  if (typeof renderDadJokeInPopup === 'function') {
    const isManual = !c.rarity || (c.rarity !== 'trash' && c.rarity !== 'plant' && !c.isAuto);
    renderDadJokeInPopup(isManual);
  }

  popup.classList.remove('hidden');
  if (typeof tutHook === 'function') tutHook('catch', c);
}

document.getElementById('btn-catch-ok').addEventListener('click', () => {
  if (!currentCatch) return;
  const c = currentCatch;
  const multi = c._preMulti || (1 + getBobberTier('electronic_bobber') + ((G.pearlUpgrades||{}).multicatch||0));
  c._multi = multi;

  trackManualCatch(c);

  if (c.rarity === 'trash') {
    G.trashPile[c.fishId] = (G.trashPile[c.fishId] || 0) + multi;
  } else if (c.rarity === 'plant') {
    G.plantPile[c.fishId] = (G.plantPile[c.fishId] || 0) + multi;
  } else if (c.isTrophy) {
    G.trophyPile = G.trophyPile || [];
    G.trophyPile.push({ fishId:c.fishId, name:c.name, rarity:c.rarity, weightG:c.weightG, img:c.img, caughtAt:Date.now(), zone:c.zone || G.currentZone });
    G.trophyRecords = G.trophyRecords || {};
    if (!G.trophyRecords[c.fishId] || c.weightG > G.trophyRecords[c.fishId].weight)
      G.trophyRecords[c.fishId] = { weight:c.weightG, caughtAt:Date.now() };
    G.stats.trophyCatches = (G.stats.trophyCatches || 0) + 1;
  } else if (c.isFishFight) {
    const _k = fishPileKey(c.fishId, 'FishFight');
    G.fishPile[_k] = (G.fishPile[_k] || 0) + multi;
  } else {
    const _k = fishPileKey(c.fishId, c.size);
    G.fishPile[_k] = (G.fishPile[_k] || 0) + multi;
  }

  if (!G.fishdex.includes(c.fishId)) G.fishdex.push(c.fishId);
  onCatchEvent(c.fishId, c.rarity);
  incrementMastery(c.fishId);
  trackManualFishdexEntry(c);
  updateCompetitionBest(c);
  updateRecord(G.currentZone, c);
  checkStorageFull();
  // Sunken Treasure Chest — 0.01% chance per non-trash, non-plant manual catch
  if (G.sunkenTreasureUnlocked && c.rarity !== 'trash' && c.rarity !== 'plant' && !c.isTrophy) {
    if (Math.random() < 0.0001 && addSunkenChest('manual', G.currentZone)) {
      setTimeout(() => showStatus('You discovered a Sunken Treasure Chest!', 3500), 200);
    }
  }
  finalizeQuestUpdate();
  saveState();
  updateHUD();
  document.getElementById('catch-popup').classList.add('hidden');
  currentCatch = null;
  if (typeof tutHook === 'function') tutHook('catch_ok', null);
  // Show queued legendary popups (e.g. from a W1 legendary just confirmed)
  setTimeout(_drainLegendaryPopups, 150);
  resetFishingState();
});

// ─── FISHING STATE MACHINE ────────────────────────────────────────────────────

function resetFishingState() {
  // Cancel Fish Fight if active
  if (_ffActive) {
    _ffActive = false;
    clearTimeout(_ffTimer);    _ffTimer = null;
    clearInterval(_ffCdInterval); _ffCdInterval = null;
    document.removeEventListener('visibilitychange', _ffVisibilityHandler);
    _ffCatch = null;
  }
  const _ffPulse = document.getElementById('ff-pulse');
  if (_ffPulse) { _ffPulse.classList.add('hidden'); _ffPulse.classList.remove('ff-orange'); _ffPulse.style.animationDuration = ''; }
  const _ffUI = document.getElementById('ff-ui');
  if (_ffUI) _ffUI.classList.add('hidden');
  const bobber2 = document.getElementById('bobber');
  if (bobber2) bobber2.classList.remove('ff-bobber-active');

  _hideSeaView();
  fishingState = 'idle';
  tapCount = 0;
  clearTimeout(biteTimer);

  const rig     = document.getElementById('fishing-rig');
  const bobber  = document.getElementById('bobber');
  const prompt  = document.getElementById('cast-prompt');
  const biteP   = document.getElementById('bite-prompt');
  const splash  = document.getElementById('splash-ring');
  const tapCnt  = document.getElementById('tap-counter');

  rig.style.display = 'none';
  bobber.className = 'bobber';
  prompt.classList.remove('hidden');
  // Clear any lingering status (e.g. "TAP THE BOBBER!" with long timeout)
  const statusEl = document.getElementById('status-msg');
  if (statusEl) statusEl.classList.remove('show');
  document.getElementById('cast-main-text').textContent = 'Tap to Cast';
  document.getElementById('cast-sub-text').classList.add('hidden');
  document.getElementById('cast-arrow').classList.remove('hidden');
  biteP.classList.add('hidden');
  tapCnt.classList.add('hidden');
  splash.classList.remove('animate');
}

// ─── FISH FIGHT ───────────────────────────────────────────────────────────────

function _ffPositionUI() {
  const bobberEl = document.getElementById('bobber');
  const ffUI     = document.getElementById('ff-ui');
  if (!bobberEl || !ffUI) return;
  const r = bobberEl.getBoundingClientRect();
  ffUI.style.left = (r.left + r.width / 2) + 'px';
  ffUI.style.top  = r.top + 'px';
}

function _ffBarColor(pct) {
  if (pct >= 0.66) return '#4caf50';
  if (pct >= 0.33) return '#ff9800';
  return '#f44336';
}

function _ffTickCountdown() {
  const elapsed = Date.now() - _ffStartTime;
  const remaining = Math.max(0, FF_DURATION - elapsed);
  const secsLeft = Math.ceil(remaining / 1000);
  const el = document.getElementById('ff-countdown');
  if (el) el.textContent = secsLeft + 's';

  // Speed up pulse when time is low
  const pulse = document.getElementById('ff-pulse');
  if (pulse) {
    if (secsLeft <= 7 && !pulse.classList.contains('ff-orange')) {
      pulse.classList.add('ff-orange');
      pulse.style.animationDuration = '0.65s';
    }
  }

  _ffPositionUI();
}

function _ffVisibilityHandler() {
  if (document.visibilityState === 'hidden' && _ffActive) {
    _endFishFight(false);
  }
}

function startFishFight(c) {
  // Safety: only trigger on real fish entries
  if (!c || !c.fishId || !FISH_DB.find(x => x.id === c.fishId)) {
    presentCatch(c);
    return;
  }
  _ffCatch  = c;
  _ffActive = true;
  _ffTaps   = 0;
  _ffStartTime = Date.now();
  fishingState = 'fishfight';

  G.stats.fishFightTriggered = (G.stats.fishFightTriggered || 0) + 1;

  // Edge pulse
  const pulse = document.getElementById('ff-pulse');
  if (pulse) { pulse.classList.remove('hidden', 'ff-orange'); pulse.style.animationDuration = ''; }

  // Bobber shake
  const bobberEl = document.getElementById('bobber');
  if (bobberEl) bobberEl.classList.add('ff-bobber-active');

  // Position and show bar UI
  const ffUI = document.getElementById('ff-ui');
  if (ffUI) {
    document.getElementById('ff-bar-fill').style.width = '0%';
    document.getElementById('ff-bar-fill').style.background = _ffBarColor(0);
    document.getElementById('ff-countdown').textContent = Math.ceil(FF_DURATION / 1000) + 's';
    ffUI.classList.remove('hidden');
    _ffPositionUI();
  }

  // Visibility handler (backgrounding = forfeit)
  document.addEventListener('visibilitychange', _ffVisibilityHandler);

  // Countdown interval
  _ffCdInterval = setInterval(_ffTickCountdown, 250);

  // Timeout = loss
  _ffTimer = setTimeout(() => _endFishFight(false), FF_DURATION);
}

function tapFishFight() {
  if (!_ffActive) return;
  _ffTaps++;

  const pct = _ffTaps / FF_REQUIRED;
  const fill = document.getElementById('ff-bar-fill');
  if (fill) {
    fill.style.width = Math.min(100, pct * 100) + '%';
    fill.style.background = _ffBarColor(pct);
  }

  if (_ffTaps >= FF_REQUIRED) {
    _endFishFight(true);
  }
}

function _endFishFight(won) {
  if (!_ffActive) return;
  _ffActive  = false;
  _ffLastEnd = Date.now();

  clearTimeout(_ffTimer);    _ffTimer = null;
  clearInterval(_ffCdInterval); _ffCdInterval = null;
  document.removeEventListener('visibilitychange', _ffVisibilityHandler);

  const pulse = document.getElementById('ff-pulse');
  if (pulse) { pulse.classList.add('hidden'); pulse.classList.remove('ff-orange'); pulse.style.animationDuration = ''; }

  const bobberEl = document.getElementById('bobber');
  if (bobberEl) bobberEl.classList.remove('ff-bobber-active');

  const ffUI = document.getElementById('ff-ui');

  if (won) {
    G.stats.fishFightWon = (G.stats.fishFightWon || 0) + 1;
    fishingState = 'result';

    // Flash bar green briefly, then show catch
    const fill = document.getElementById('ff-bar-fill');
    if (fill) { fill.style.width = '100%'; fill.style.background = '#4caf50'; }

    showStatus('FISH FIGHT WON!', 800);

    const catchToPresent = _ffCatch;
    _ffCatch = null;
    setTimeout(() => {
      if (ffUI) ffUI.classList.add('hidden');
      if (!catchToPresent) { resetFishingState(); return; }
      catchToPresent.isFishFight = true;
      const fishDef = FISH_DB.find(x => x.id === catchToPresent.fishId);
      catchToPresent.value = Math.round((fishDef ? fishDef.baseValue : catchToPresent.value) * 5);
      presentCatch(catchToPresent);
    }, 500);
  } else {
    G.stats.fishFightLost = (G.stats.fishFightLost || 0) + 1;
    if (ffUI) ffUI.classList.add('hidden');
    _ffCatch = null;
    resetFishingState();
    showStatus('Fish Fight lost — fish got away!', 2500);
  }
}

function _isSeaViewZone() {
  return G.currentZone === 'sea' || G.currentZone === 'ocean';
}
function _showSeaView() {
  // Sea/Ocean bobber view panel removed by design
}
function _hideSeaView() {
  const el = document.getElementById('sea-view-bg');
  if (el) el.classList.remove('visible');
}

function startCast() {
  if (fishingState !== 'idle') return;
  fishingState = 'waiting';
  if (_isSeaViewZone()) _showSeaView();
  if (typeof tutHook === 'function') tutHook('cast', null);
  playSfx(sfxCast);

  document.getElementById('cast-main-text').textContent = 'Tap water';
  document.getElementById('cast-sub-text').textContent = 'Waiting for bite...';
  document.getElementById('cast-sub-text').classList.remove('hidden');
  document.getElementById('cast-arrow').classList.add('hidden');
  const rig = document.getElementById('fishing-rig');
  rig.style.display = 'flex';
  rig.classList.remove('casting');
  void rig.offsetWidth;
  rig.classList.add('casting');
  setTimeout(() => rig.classList.remove('casting'), 320);

  const bobber = document.getElementById('bobber');
  bobber.className = 'bobber bobber-idle';


  const spd = getSpeedMult();
  const delay = randInt(Math.floor(2000/spd), Math.floor(5000/spd));
  biteTimer = setTimeout(startBite, delay);
}

function startBite() {
  fishingState = 'bite';
  if (typeof tutHook === 'function') tutHook('bite', null);
  playSfx(sfxBobberDip);
  const bobber = document.getElementById('bobber');
  bobber.className = 'bobber bobber-bite';

  const splash = document.getElementById('splash-ring');
  splash.classList.add('animate');
  setTimeout(() => splash.classList.remove('animate'), 500);

  document.getElementById('cast-prompt').classList.add('hidden');
  document.getElementById('bite-prompt').classList.remove('hidden');
  showStatus('TAP THE BOBBER!', 999999);
  triggerBobberHaptic();

  const rod = getRodData(G.currentRod);
  const tapCnt = document.getElementById('tap-counter');
  tapCnt.classList.remove('hidden');
  tapsRequired = Math.max(4, rod.clicks - getPearlMasterAnglerReduce());
  tapCount = 0;
  document.getElementById('tap-counter').textContent = '0 / ' + tapsRequired;

  biteTimer = setTimeout(() => {
    showStatus('The fish got away…', 2000);
    G.stats.castStreak = 0;
    G.stats.trophyStreak = 0;
    syncAch('h_trophy_streak', 0);
    resetFishingState();
  }, 3000);
}

function tapBobber() {
  if (fishingState !== 'bite') return;
  clearTimeout(biteTimer);

  tapCount++;
  const tapCnt = document.getElementById('tap-counter');
  tapCnt.textContent = tapCount + ' / ' + tapsRequired;
  tapCnt.style.animation = 'none';
  tapCnt.offsetHeight; // reflow to restart animation
  tapCnt.style.animation = '';

  if (tapCount >= tapsRequired) {
    fishingState = 'result';
    document.getElementById('bite-prompt').classList.add('hidden');
    tapCnt.classList.add('hidden');
    const c = rollCatch(G.currentZone, true);
    // Fish Fight: 1% chance on non-trash, non-plant, non-trophy fish only, with 3-min cooldown
    if (c.rarity !== 'trash' && c.rarity !== 'plant' && !c.isTrophy &&
        Date.now() - _ffLastEnd > FF_COOLDOWN_MS && Math.random() < 0.005) {
      startFishFight(c);
    } else {
      presentCatch(c);
    }
  } else {
    biteTimer = setTimeout(() => {
      showStatus('The fish got away…', 2000);
      resetFishingState();
    }, 3000);

    const bobber = document.getElementById('bobber');
    bobber.style.transform = 'translateY(' + (tapCount % 2 === 0 ? '0' : '4px') + ')';
    setTimeout(() => bobber.style.transform = '', 150);
  }
}

// Seagull tap — pointerdown fires on both mouse and touch, before click
document.getElementById('seagull').addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  e.preventDefault();
  onSeagullClick(e);
});

// Casting only accepts taps in the middle of the water (the pond itself),
// so HUD/nav/edge taps no longer throw the bobber in
function isCenterTap(e) {
  const area = document.getElementById('water-area');
  const r = area.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  return x > 0.28 && x < 0.72 && y > 0.30 && y < 0.78;
}

// Hidden achievement: coin counter taps
document.getElementById('hud-coins').addEventListener('click', () => {
  _coinTapCount++;
  if (_coinTapCount >= 25) syncAch('h_coin_tap', 1);
});

// Hidden achievement: fisherman NPC on lake shore
document.getElementById('npc-fisher-hotspot').addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  e.preventDefault();
  _fisherNpcTaps++;
  if      (_fisherNpcTaps === 1) _showFishermanBubble('lake', 'Hey! Careful with that rod!');
  else if (_fisherNpcTaps === 2) _showFishermanBubble('lake', 'You again? Go fish!');
  else if (_fisherNpcTaps >= 3) { _showFishermanBubble('lake', '...'); syncAch('h_fisher_npc', 1); }
});

// Water tap handler — seagull pointerdown stopPropagation prevents this firing when gull is tapped
document.getElementById('water-area').addEventListener('click', (e) => {
  startMusic();
  if (fishingState === 'idle') {
    if (isCenterTap(e)) startCast();
    return;
  }
  if (fishingState === 'fishfight') {
    tapFishFight();
    return;
  }
  if (fishingState === 'bite') {
    tapBobber();
  }
});

// ─── AUTOMATION ───────────────────────────────────────────────────────────────

function startAutomation() {
  clearInterval(autoTickInterval);
  autoTickInterval = setInterval(autoTick, 1000);
  // Flush dirty save every 15s instead of every tick
  clearInterval(_autoSaveInterval);
  _autoSaveInterval = setInterval(() => { if (_autoSaveDirty) { saveState(); _autoSaveDirty = false; } }, 15000);
}

function autoTick() {
  if (!G.ownedAutomation.length) return;
  let changed = false;

  // Pre-compute multipliers once per tick (not per unit)
  const speedBase      = getSpeedMult() * getPearlSpeedMult() * getMasteryAutoSpeedMult() * getAutomationUpgradeMultiplier();
  const multiCatch     = rollMultiCatch();
  const extraCatchMult = 1 + getPearlExtraCatchChance();
  const typeMults  = {
    net:       getRodNetSpeedMult(),
    fisherman: getRodFishermanSpeedMult(),
    boat:      getRodBoatSpeedMult(),
    fleet:     getRodFleetSpeedMult(),
  };

  const _allUnlockedZones = ZONE_DATA.filter(z => isZoneUnlocked(z.id)).map(z => z.id);
  const _tickZones = (G.activeAutomationZones || []).filter(z => _allUnlockedZones.includes(z));
  if (!_tickZones.length) return; // no active zones — skip tick entirely
  const _tickRandZone = () => _tickZones[Math.floor(Math.random() * _tickZones.length)];

  // Aggregate by automation id only (zone ignored — all units of same type work together)
  const agg = {};
  for (const owned of G.ownedAutomation) {
    const k = owned.id;
    if (!agg[k]) {
      const aDef = AUTOMATION.find(x => x.id === owned.id);
      if (!aDef) continue;
      agg[k] = { aDef, count: 0 };
    }
    agg[k].count++;
  }

  // Max catches per tick prevents CPU spikes with extreme automation counts
  const MAX_PER_TICK = 150;
  let tickTotal = 0;

  for (const { aDef, count } of Object.values(agg)) {
    if (tickTotal >= MAX_PER_TICK) break;
    if (fishPileTotal() >= storageCapacity()) break;
    const spd = speedBase * (typeMults[aDef.type] || 1);
    const ratePerUnit = spd / aDef.rate;
    const expected = count * ratePerUnit * extraCatchMult;
    let catches = Math.floor(expected);
    if (Math.random() < (expected - catches)) catches++;
    catches = Math.min(catches, MAX_PER_TICK - tickTotal);
    if (catches <= 0) continue;

    changed = true;
    tickTotal += catches;
    G.stats.autoCatchTotal = (G.stats.autoCatchTotal || 0) + catches * multiCatch;
    const _atKey = 'autoCatch' + aDef.type.charAt(0).toUpperCase() + aDef.type.slice(1);
    G.stats[_atKey] = (G.stats[_atKey] || 0) + catches * multiCatch;

    const _firstCatch = rollCatch(_tickRandZone());

    for (let i = 0; i < catches; i++) {
      if (fishPileTotal() >= storageCapacity()) break;
      const c = (i === 0) ? _firstCatch : rollCatch(_tickRandZone());
      if (c.rarity === 'trash') {
        G.trashPile[c.fishId] = (G.trashPile[c.fishId] || 0) + multiCatch;
        if (!G.fishdex.includes(c.fishId)) G.fishdex.push(c.fishId);
      } else if (c.rarity === 'plant') {
        G.plantPile[c.fishId] = (G.plantPile[c.fishId] || 0) + multiCatch;
        if (!G.fishdex.includes(c.fishId)) G.fishdex.push(c.fishId);
      } else {
        const space = storageCapacity() - fishPileTotal();
        if (space <= 0) break;
        const qty = c.w1legendary ? 1 : Math.min(multiCatch, space);
        const autoSize = c.isTrophy ? 14 : (c.w1legendary ? 15 : c.size);
        const _k = fishPileKey(c.fishId, autoSize);
        const isFirstW1 = c.w1legendary && !G.fishdex.includes(c.fishId);
        G.fishPile[_k] = (G.fishPile[_k] || 0) + qty;
        if (!G.fishdex.includes(c.fishId)) G.fishdex.push(c.fishId);
        if (c.w1legendary) {
          // Queue golden popup — displayed after current tick (next animation frame)
          _queueLegendaryPopup({ fishId:c.fishId, name:c.name, img:c.img, zone:c.zone || G.currentZone, isFirst:isFirstW1 });
          setTimeout(_drainLegendaryPopups, 500);
        }
        checkStorageFull();
        _spawnTickForCatch(aDef.type, c.rarity, qty);
        onCatchEvent(c.fishId, c.rarity);
        incrementMastery(c.fishId);
        continue;
      }
      _spawnTickForCatch(aDef.type, c.rarity, multiCatch);
      onCatchEvent(c.fishId, c.rarity);
      incrementMastery(c.fishId);
    }
  }

  if (changed) {
    _autoSaveDirty = true;
    updateHUD();
    finalizeQuestUpdate();
    if (document.getElementById('screen-market').classList.contains('active')) renderMarket();
  }

  // Automation Sunken Treasure Chest roll — checked once per tick regardless of catch count
  if (G.sunkenTreasureUnlocked && tickTotal > 0 && Date.now() > (G.automationTreasureCooldownUntil || 0)) {
    const p = 1.16e-9; // 0.000000116% per catch
    if (Math.random() < 1 - Math.pow(1 - p, tickTotal)) {
      const randZone = _tickRandZone();
      if (addSunkenChest('automation', randZone)) {
        G.automationTreasureCooldownUntil = Date.now() + 7 * 3600000; // 7h cooldown
        _autoSaveDirty = true;
        // Spawn visual ticker
        const _tLayer = document.getElementById('water-automation-layer');
        if (_tLayer && G.tickersEnabled !== false) {
          const _tPos = (ZONE_AUTO_BG[G.currentZone] || {}).combined || { x: 50, y: 45 };
          _spawnTick(_tLayer, _tPos.x, _tPos.y, 'img/icons/Lost Treasure.png', 1);
        }
        showStatus('Your fleet discovered a Sunken Treasure Chest!', 3500);
        if (document.getElementById('screen-market').classList.contains('active')) renderMarket();
      }
    }
  }
}

// ─── SCREENS ──────────────────────────────────────────────────────────────────

let _loadingReadyAt = 0;

function pressToStart() {
  if (Date.now() < _loadingReadyAt) return;
  startMusic();
  showScreen('fishing');
  if (typeof initTutorial === 'function') initTutorial();
  checkClientVersion(); // retry in case DOMContentLoaded call failed (slow Android network)
}

function showScreen(id) {
  if (id !== 'fishing' && _ffActive) resetFishingState(); // abort FF on screen leave
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');

  document.querySelectorAll('.float-btn, .float-nav-top .float-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.screen === id);
  });

  if (id === 'shop') {
    document.querySelectorAll('.shop-tab-icon').forEach(t => t.classList.remove('active'));
    document.getElementById('shop-panel').classList.remove('visible');
    activeShopTab = null;
    onShopOpen();
    const now = Date.now();
    _shopOpenTs = _shopOpenTs.filter(t => now - t <= 60000);
    _shopOpenTs.push(now);
    if (_shopOpenTs.length >= 5) syncAch('h_shop_rush', 1);
  }
  if (id === 'market')      { switchMarketTab('catch'); renderMarket(); }
  if (id === 'fishdex') {
    if (!_fishdexZone) _fishdexZone = G.currentZone;
    renderFishdexTabs();
    renderFishdex();
  }
  if (id === 'quests')      renderQuests();
  if (id === 'zones')       renderZones();
  if (id === 'competition') renderCompetition();
  if (id === 'halloffame')  renderStatistics();
  if (id === 'abyss')         renderAbyss();
  if (id === 'diamondstore')  renderDiamondStore();
  if (id === 'settings')    renderSettings();
  if (id === 'fishing')     updateHUD();
  if (typeof tutHook === 'function') tutHook('screen', id);
}

// Nav buttons
document.addEventListener('click', e => {
  if (_autoRateDropdownOpen && !e.target.closest('#hud-storage-btn') && !e.target.closest('#auto-rate-dropdown')) {
    _autoRateDropdownOpen = false;
    const dd = document.getElementById('auto-rate-dropdown');
    if (dd) dd.classList.add('hidden');
  }
});

document.querySelectorAll('.float-btn, .btn-back').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.screen;
    if (target) showScreen(target);
  });
});

// ─── SHOP ─────────────────────────────────────────────────────────────────────

let activeShopTab = 'rods';

const SHOP_TAB_TITLES = { rods:'RODS', bait:'BAIT', automation:'AUTOMATION', storage:'STORAGE', jeweler:'JEWELER' };

document.getElementById('shop-panel-close-btn')?.addEventListener('click', () => {
  document.getElementById('shop-panel').classList.remove('visible');
  document.querySelectorAll('.shop-tab-icon').forEach(t => t.classList.remove('active'));
  activeShopTab = null;
});

document.querySelectorAll('.shop-tab-icon').forEach(tab => {
  tab.addEventListener('click', () => {
    const panel = document.getElementById('shop-panel');
    const isAlreadyActive = tab.classList.contains('active') && panel.classList.contains('visible');
    document.querySelectorAll('.shop-tab-icon').forEach(t => t.classList.remove('active'));
    if (isAlreadyActive) {
      panel.classList.remove('visible');
      activeShopTab = null;
    } else {
      tab.classList.add('active');
      activeShopTab = tab.dataset.tab;
      panel.classList.add('visible');
      renderShop(activeShopTab);
    }
  });
});

function renderShop(tab) {
  const el = document.getElementById('shop-content');
  const _isJeweler = tab === 'jeweler';
  const _shopCoinsEl = document.getElementById('shop-coins');
  const _shopIconEl  = document.getElementById('shop-coin-icon');
  if (_shopCoinsEl) _shopCoinsEl.textContent = _isJeweler ? (G.blackPearls || 0) : formatCoins(G.coins);
  if (_shopIconEl)  _shopIconEl.src = _isJeweler ? 'img/icons/Black pearl icon.png' : 'img/icons/Game screen icons/coin_icon.png';
  document.getElementById('shop-panel-title').textContent = SHOP_TAB_TITLES[tab] || tab.toUpperCase();
  el.innerHTML = '';

  if (tab === 'rods') {
    RODS.forEach(rod => el.appendChild(makeRodTierItem(rod)));
  }

  if (tab === 'bait') {
    BOBBERS.forEach(bob => { if (!bob.diamondCost) el.appendChild(makeBobberTierItem(bob)); });
    el.appendChild(makeSeagullBaitItem());
    el.appendChild(makeTargetedLureItem());
  }

  if (tab === 'storage') {
    STORAGE_ITEMS.filter(s => isZoneUnlocked(s.unlocksAt) && !s.ghostOnly).forEach(s => {
      const count = G.ownedStorage.filter(o => o.id === s.id).length;
      el.appendChild(makeBulkBuyItem(s.name, s.desc, s.cost, s.img,
        count, qty => buyStorage(s.id, qty)
      ));
    });
    // Ghost Ship storage rewards — shown but cannot be purchased
    STORAGE_ITEMS.filter(s => isZoneUnlocked(s.unlocksAt) && s.ghostOnly).forEach(s => {
      const count = G.ownedStorage.filter(o => o.id === s.id).length;
      const row = document.createElement('div');
      row.className = 'shop-item';
      row.innerHTML = `
        <img class="shop-item-icon" src="${s.img}" alt="">
        <div class="shop-item-info">
          <div class="shop-item-name-row">
            <span class="shop-item-name">${s.name}${count > 0 ? ' <span style="color:#f5c842">×'+count+'</span>' : ''}</span>
            <span class="shop-item-desc">${s.desc}</span>
          </div>
        </div>
        <div style="font-size:11px;color:#7ecfff;text-align:center;padding:4px 8px;background:rgba(0,100,180,0.18);border:1px solid rgba(126,207,255,0.3);border-radius:6px;white-space:nowrap;">
          Ghost Ship reward
        </div>`;
      el.appendChild(row);
    });
  }

  if (tab === 'automation') {
    // Regular purchasable automation units
    AUTOMATION.filter(a => isZoneUnlocked(a.unlocksAt) && !a.ghostOnly).forEach(a => {
      const count = G.ownedAutomation.filter(o => o.id === a.id).length;
      el.appendChild(makeBulkBuyItem(a.name, a.desc, a.cost, a.img,
        count, qty => buyAutomation(a.id, qty), a.firstCost
      ));
    });

    // Expedition Vessel — requires Sea zone to be currently unlocked (sunkenTreasureUnlocked persists across prestiges)
    if (G.sunkenTreasureUnlocked && isZoneUnlocked('sea')) {
      const evCount  = (G.expeditionVessels || []).length;
      const atMax    = evCount >= EXPEDITION_VESSEL_MAX;
      const maxBuy   = _evMaxAffordable();
      const now      = Date.now();

      const makeEvBtn = (qty) => {
        let n, label, canAfford;
        if (qty === 'all') {
          n = maxBuy; label = 'All(' + n + ')'; canAfford = n > 0;
        } else {
          n = qty;
          label = '×' + qty;
          canAfford = !atMax && (G.coins || 0) >= _evBulkCost(Math.min(qty, EXPEDITION_VESSEL_MAX - evCount));
        }
        const cls = (canAfford && !atMax) ? 'btn-bulk btn-bulk-buy' : 'btn-bulk btn-bulk-locked';
        return `<button class="${cls}" ${(canAfford && !atMax) ? '' : 'disabled'} onclick="buyExpeditionVessel(${n})">${atMax && qty !== 'all' ? 'MAX' : label}</button>`;
      };

      const evRow = document.createElement('div');
      evRow.className = 'shop-item';
      evRow.innerHTML = `
        <img class="shop-item-icon" src="img/icons/Shop/Automation/Expedition vessel.png" alt="">
        <div class="shop-item-info">
          <div class="shop-item-name-row">
            <span class="shop-item-name">Expedition Vessel${evCount > 0 ? ' <span class="shop-item-count">×'+evCount+'</span>' : ''}</span>
            <span class="shop-item-desc">Each vessel raises your Ghost Ship capacity.</span>
            <button class="guild-help-btn" onclick="openEvInfo()" style="margin-left:4px;">?</button>
          </div>
          <div class="shop-item-bulk-actions">${makeEvBtn(1)}${makeEvBtn(10)}${makeEvBtn(100)}${makeEvBtn('all')}</div>
        </div>
        <div class="shop-item-price">
          <img src="img/icons/Game screen icons/coin_icon.png"><span>${atMax ? 'MAX' : formatCoins(_evBulkCost(1))}</span>
        </div>`;
      el.appendChild(evRow);
    }

    // Ghost Ship expedition reward units — shown after Expedition Vessel, cannot be purchased
    AUTOMATION.filter(a => isZoneUnlocked(a.unlocksAt) && a.ghostOnly).forEach(a => {
      const count = G.ownedAutomation.filter(o => o.id === a.id).length;
      const row = document.createElement('div');
      row.className = 'shop-item';
      row.innerHTML = `
        <img class="shop-item-icon" src="${a.img}" alt="">
        <div class="shop-item-info">
          <div class="shop-item-name-row">
            <span class="shop-item-name">${a.name}${count > 0 ? ' <span style="color:#f5c842">×'+count+'</span>' : ''}</span>
            <span class="shop-item-desc">${a.desc}</span>
          </div>
        </div>
        <div style="font-size:11px;color:#7ecfff;text-align:center;padding:4px 8px;background:rgba(0,100,180,0.18);border:1px solid rgba(126,207,255,0.3);border-radius:6px;white-space:nowrap;">
          Ghost Ship reward
        </div>`;
      el.appendChild(row);
    });
  }

  if (tab === 'jeweler') {
    el.innerHTML = '';
    const pearls       = G.blackPearls || 0;
    const count        = G.prestigeCount || 0;
    const reward       = prestigePearlReward();
    const eligible     = canPrestige();
    const threshold    = prestigeThreshold();
    const currentCoins = G.coins || 0;
    const coinsNeeded  = Math.max(0, threshold - currentCoins);
    const pearlBonusPct = getBlackPearlBonusPct();
    const upgrades     = G.pearlUpgrades || {};


    const upgradeRows = PEARL_UPGRADES.filter(u => !u.requiresSunkenTreasure || G.sunkenTreasureUnlocked).map(u => {
      const lvl    = upgrades[u.id] || 0;
      const atCap  = u.maxLevel !== null && lvl >= u.maxLevel;
      const cost   = atCap ? 0 : pearlUpgradeCost(u);
      const canAfford = !atCap && pearls >= cost;

      const currentEffect = (() => {
        if (u.id === 'discount')       { if (!lvl) return 'None'; const d = Math.min(Math.min(lvl,5)*0.05+Math.max(0,lvl-5)*0.02,0.90); return `-${(d*100).toFixed(0)}% cheaper shop prices`; }
        if (u.id === 'speed')          { const s = Math.min(lvl,8)*25 + Math.max(0,lvl-8)*10; return lvl ? `Automation ${s}% faster` : 'None'; }
        if (u.id === 'storage')        return lvl ? `+${lvl*50}% storage capacity` : 'None';
        if (u.id === 'multicatch')     return lvl ? `+${lvl} extra item${lvl>1?'s':''} per catch` : 'None';
        if (u.id === 'luckywaters')    return lvl ? `+${lvl}% Uncommon–Legendary fish chance` : 'None';
        if (u.id === 'masterangler')   return lvl ? `-${lvl} tap${lvl>1?'s':''} to catch a fish` : 'None';
        if (u.id === 'treasure')       { const t = Math.min(lvl,10)*5 + Math.max(0,lvl-10)*1; return lvl ? `+${t}% Lost Treasure chance` : 'None'; }
        if (u.id === 'offline')        { const o = Math.min(lvl,10)*10 + Math.max(0,lvl-10)*2; return lvl ? `+${o}% chance for extra fish per catch` : 'None'; }
        if (u.id === 'compspirit')     { const c = Math.min(lvl,10)*10 + Math.max(0,lvl-10)*2; return lvl ? `+${c}% competition coins` : 'None'; }
        if (u.id === 'fishwhisperer')  return lvl ? `+${lvl*0.5}% Trophy fish chance` : 'None';
        if (u.id === 'treasurehold')   return lvl ? `+${lvl} Treasure Chest slot${lvl>1?'s':''} (capacity ${1+lvl})` : 'None';
        if (u.id === 'ghostbusters')   return lvl ? `-${lvl} in-game hour${lvl>1?'s':''} expedition time` : 'None';
        if (u.id === 'startingcapital')return lvl ? `+${(lvl*2000).toLocaleString()} coins on prestige` : 'None';
        if (u.id === 'ghostwhisperer') return lvl ? `-${lvl*5}% Ghost Ship spawn interval` : 'None';
        return '';
      })();

      const nextEffect = (() => {
        if (atCap) return '';
        const nl = lvl + 1;
        if (u.id === 'discount')       { const d = Math.min(Math.min(nl,5)*0.05+Math.max(0,nl-5)*0.02,0.90); return `-${(d*100).toFixed(0)}% cheaper shop prices`; }
        if (u.id === 'speed')          { const s = Math.min(nl,8)*25 + Math.max(0,nl-8)*10; return `Automation ${s}% faster`; }
        if (u.id === 'storage')        return `+${nl*50}% storage capacity`;
        if (u.id === 'multicatch')     return `+${nl} extra item${nl>1?'s':''} per catch`;
        if (u.id === 'luckywaters')    return `+${nl}% Uncommon–Legendary fish chance`;
        if (u.id === 'masterangler')   return `-${nl} tap${nl>1?'s':''} to catch a fish`;
        if (u.id === 'treasure')       { const t = Math.min(nl,10)*5 + Math.max(0,nl-10)*1; return `+${t}% Lost Treasure chance`; }
        if (u.id === 'offline')        { const o = Math.min(nl,10)*10 + Math.max(0,nl-10)*2; return `+${o}% chance for extra fish per catch`; }
        if (u.id === 'compspirit')     { const c = Math.min(nl,10)*10 + Math.max(0,nl-10)*2; return `+${c}% competition coins`; }
        if (u.id === 'fishwhisperer')  return `+${nl*0.5}% Trophy fish chance`;
        if (u.id === 'treasurehold')   return `+${nl} Treasure Chest slot${nl>1?'s':''} (capacity ${1+nl})`;
        if (u.id === 'ghostbusters')   return `-${nl} in-game hour${nl>1?'s':''} expedition time`;
        if (u.id === 'startingcapital')return `+${(nl*2000).toLocaleString()} coins on prestige`;
        if (u.id === 'ghostwhisperer') return `-${nl*5}% Ghost Ship spawn interval`;
        return '';
      })();

      return `
        <div class="pearl-upgrade-row">
          <div class="pearl-upgrade-info">
            <div class="pearl-upgrade-name">${u.name} <span style="color:#d4a0ff">Lv${lvl}${atCap?' <span style="color:#f0c040">(MAX)</span>':u.maxLevel?' / '+u.maxLevel:''}</span></div>
            <div class="pearl-upgrade-desc">${u.desc}</div>
            <div style="font-size:11px;color:#aaa;margin-top:3px;text-transform:uppercase;letter-spacing:0.05em">Current Bonus</div>
            <div style="font-size:12px;color:#90c890;margin-top:1px">${currentEffect}</div>
            ${!atCap?`<div style="font-size:11px;color:#aaa;margin-top:3px;text-transform:uppercase;letter-spacing:0.05em">Next Bonus</div><div style="font-size:12px;color:#c8c8c8;margin-top:1px">${nextEffect}</div>`:''}
          </div>
          <button class="${canAfford?'btn-shop-buy':'btn-shop-locked'}"
            ${canAfford?'':'disabled'}
            onclick="buyPearlUpgrade('${u.id}')">
            ${atCap ? 'MAX' : PEARL_IMG+cost}
          </button>
        </div>`;
    }).join('');

    el.innerHTML = `
      <div class="prestige-screen">
        <div class="prestige-pearl-banner">
          <div class="prestige-pearl-count"><img src="img/icons/Black pearl icon.png" style="width:36px;height:36px;vertical-align:middle;margin-right:6px">${pearls}</div>
          <div class="prestige-pearl-label">Black Pearls</div>
          <div style="font-size:12px;color:#d4a0ff;margin-top:4px">Unspent Black Pearls increase fish sell value. Each additional Pearl provides a smaller bonus.</div>
          <div style="font-size:13px;color:#e0e0e0;margin-top:6px">Current Fish Sell Bonus: <span style="color:#f0c040">+${pearlBonusPct.toFixed(1)}%</span></div>
        </div>
        <div class="prestige-section">
          <div class="prestige-section-title">PRESTIGE</div>
          <div class="prestige-info-row"><span>Times prestiged</span><span>${count}</span></div>
          <div class="prestige-info-row"><span>Required coins</span><span style="color:#d4a0ff">${formatCoins(threshold)}</span></div>
          <div class="prestige-info-row"><span>Current pearls</span><span style="color:#d4a0ff">${pearls} ${PEARL_IMG}</span></div>
          <div class="prestige-info-row"><span>Est. Pearl reward</span><span style="color:#d4a0ff">+${reward} ${PEARL_IMG}</span></div>
          ${(() => { const lp = getLegendaryPrestigeBonus(); return lp > 0 ? `<div class="prestige-info-row"><span>Legendary bonus</span><span style="color:#f4c430">+${lp}% ${PEARL_IMG}</span></div>` : ''; })()}
          <div style="font-size:11px;color:#888;margin:6px 0 10px;text-align:center">
            Pearls = √(coins/2,000) · Resets coins, automation, storage, zones
          </div>
          ${eligible
            ? `<div style="font-size:13px;color:#90c890;text-align:center;margin-bottom:8px;font-weight:bold">Prestige Available</div>`
            : `<div style="font-size:12px;color:#aaa;text-align:center;margin-bottom:8px">Need ${formatCoins(coinsNeeded)} more coins to Prestige.</div>`
          }
          <button class="${eligible?'btn-prestige':'btn-prestige-locked'}" ${eligible?'':'disabled'}
            onclick="doPrestige()">
            ${eligible?'PRESTIGE (+'+reward+' Pearl'+(reward>1?'s':'')+')'  :'Reach '+formatCoins(threshold)+' coins first'}
          </button>
        </div>
        <div class="prestige-section">
          <div class="prestige-section-title">PEARL SHOP</div>
          <div style="font-size:11px;color:#aaa;margin-bottom:8px;text-align:center">
            Spending pearls reduces your passive sell bonus
          </div>
          ${upgradeRows}
        </div>
      </div>`;
  }
}

function makeRodTierItem(rod) {
  const owned    = (G.ownedRods || []).includes(rod.id);
  const equipped = G.currentRod === rod.id;
  const tier     = getRodTier(rod.id);
  const cost     = getRodNextCost(rod.id);
  const maxed    = cost === null || tier >= 15;

  const div = document.createElement('div');
  div.className = 'shop-item shop-item-flex';

  if (!owned) {
    const scaledCost = applyDiscount(applyZoneCostScaling(rod.cost));
    const canBuy = G.coins >= scaledCost;
    const priceHtml = `<img src="img/icons/Game screen icons/coin_icon.png"><span style="${canBuy ? '' : 'color:#c55'}">${formatCoins(scaledCost)}</span>`;
    div.innerHTML = `
      <img class="shop-item-icon" src="${rod.img}" onerror="this.style.display='none'">
      <div class="shop-item-info">
        <div class="shop-item-name-row">
          <span class="shop-item-name">${rod.name}</span>
          <span class="shop-item-desc">· ${rod.tierDesc} · ${rod.clicks} taps</span>
        </div>
      </div>
      <div class="shop-item-actions">
        <button class="btn-shop ${canBuy ? 'btn-shop-buy' : 'btn-shop-locked'}" ${canBuy?'':'disabled'}>Buy</button>
      </div>
      <div class="shop-item-price">${priceHtml}</div>
    `;
    div.querySelector('button').addEventListener('click', () => buyRod(rod.id));
    return div;
  }

  // Owned — equip + tier upgrade
  const pipHtml = Array.from({length:15}, (_,i) => {
    const filled = i < tier;
    const color  = i < 5 ? '#a0c070' : i < 10 ? '#5090e0' : '#d070e0';
    return `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;margin:1px;background:${filled?color:'#333'};border:1px solid #555;"></span>`;
  }).join('');

  const currentEffect = (() => {
    if (rod.id === 'basic_rod')  return `+${Math.round(tier*5)}% sell price`;
    if (rod.id === 'river_rod')  return `+${Math.round(tier*10)}% Net speed`;
    if (rod.id === 'lake_rod')   return `+${Math.round(tier*10)}% Fisher speed`;
    if (rod.id === 'bay_rod')    return `+${Math.round(tier*12)}% storage`;
    if (rod.id === 'sea_rod')    return `+${Math.round(tier*10)}% Boat speed`;
    if (rod.id === 'ocean_rod')  return `+${Math.round(tier*10)}% Fleet speed`;
    if (rod.id === 'carbon_rod') return `+${Math.round(tier*3)}% Legendary`;
    if (rod.id === 'mythic_rod') return `+${Math.round(tier*8)}% Diamonds`;
    if (rod.id === 'abyss_rod')  return `+${Math.round(tier*8)}% Abyss sell`;
    return '';
  })();

  const upgradeDisabled = maxed || G.coins < cost;
  const upgradeBtnClass = maxed             ? 'btn-shop-equipped'
                        : G.coins < cost    ? 'btn-shop-locked'
                        : 'btn-shop-buy';
  const upgradeBtnText  = maxed ? 'MAX' : 'Upgrade';
  const priceHtml = maxed ? '' :
    `<img src="img/icons/Game screen icons/coin_icon.png"><span style="${G.coins < cost ? 'color:#c55' : ''}">${formatCoins(cost)}</span>`;

  div.innerHTML = `
    <img class="shop-item-icon" src="${rod.img}" onerror="this.style.display='none'">
    <div class="shop-item-info">
      <div class="shop-item-name-row">
        <span class="shop-item-name">${rod.name}</span>
        <span class="shop-item-desc">· ${rod.tierDesc} · <span style="color:#ffd700">T${tier}/15</span></span>
      </div>
      <div class="shop-item-pip-row">${pipHtml}<span class="shop-item-effect">${currentEffect}</span></div>
    </div>
    <div class="shop-item-actions">
      <button class="btn-shop ${upgradeBtnClass}" ${upgradeDisabled?'disabled':''}>${upgradeBtnText}</button>
    </div>
    <div class="shop-item-price">${priceHtml}</div>
  `;
  if (!maxed) div.querySelector('.shop-item-actions button').addEventListener('click', () => buyRodTier(rod.id));
  return div;
}

function makeBobberTierItem(bob) {
  const tier    = getBobberTier(bob.id);
  const maxTier = getBobberMaxUnlockedTier();
  const cost    = getBobberNextCost(bob.id);
  const locked  = tier >= maxTier && tier < 15;
  const maxed   = tier >= 15;

  const div = document.createElement('div');
  div.className = 'shop-item shop-item-flex';

  const pipHtml = Array.from({length:15}, (_,i) => {
    const filled = i < tier;
    const color  = i < 5 ? '#a0c070' : i < 10 ? '#5090e0' : '#d070e0';
    return `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;margin:1px;background:${filled?color:'#333'};border:1px solid #555;"></span>`;
  }).join('');

  const effectValue = bob.id === 'basic_bobber'    ? `+${tier * 3}% speed`
                    : bob.id === 'sensitive_bobber' ? `+${tier}% rarity`
                    : bob.id === 'heavy_bobber'     ? `+${tier} size tier`
                    : bob.id === 'electronic_bobber'? `+${tier * 50}% catch chance`
                    : '';

  const disabled  = maxed || locked || G.coins < cost;
  const btnClass  = maxed ? 'btn-shop-equipped' : disabled ? 'btn-shop-disabled' : 'btn-shop-buy';
  const btnText   = maxed ? 'MAX' : locked ? `T${maxTier}` : 'Upgrade';
  const priceHtml = maxed || locked ? '' :
    `<img src="img/icons/Game screen icons/coin_icon.png"><span style="${G.coins < cost ? 'color:#c55' : ''}">${formatCoins(cost)}</span>`;

  div.innerHTML = `
    <img class="shop-item-icon" src="${bob.img}" onerror="this.style.display='none'">
    <div class="shop-item-info">
      <div class="shop-item-name-row">
        <span class="shop-item-name">${bob.name}</span>
        <span class="shop-item-desc">· ${bob.desc} · <span style="color:#ffd700">T${tier}/15</span></span>
      </div>
      <div class="shop-item-pip-row">${pipHtml}<span class="shop-item-effect">${effectValue}</span></div>
    </div>
    <div class="shop-item-actions">
      <button class="btn-shop ${btnClass}" ${disabled?'disabled':''}>${btnText}</button>
    </div>
    <div class="shop-item-price">${priceHtml}</div>
  `;
  if (!maxed && !locked) div.querySelector('button').addEventListener('click', () => buyBobberTier(bob.id));
  return div;
}

function makeSeagullBaitItem() {
  const SGULL_BASE = 10000;
  const tier       = G.seagullBaitCount || 0;
  const maxed      = tier >= 15;
  const cost       = Math.floor(SGULL_BASE * Math.pow(5, tier));
  const canAfford  = G.coins >= cost;
  const intervalSec = Math.round(getSeagullIntervalMs() / 1000);

  const div = document.createElement('div');
  div.className = 'shop-item';

  const pipHtml = Array.from({length:15}, (_,i) => {
    const filled = i < tier;
    const color  = i < 5 ? '#a0c070' : i < 10 ? '#5090e0' : '#d070e0';
    return `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;margin:1px;background:${filled?color:'#444'};border:1px solid #666;"></span>`;
  }).join('');

  const disabled  = maxed || !canAfford;
  const btnClass  = maxed ? 'btn-shop-equipped' : canAfford ? 'btn-shop-buy' : 'btn-shop-disabled';
  const btnText   = maxed ? 'MAX' : 'Upgrade';
  const priceHtml = maxed ? '' :
    `<img src="img/icons/Game screen icons/coin_icon.png"><span style="${canAfford ? '' : 'color:#c55'}">${formatCoins(cost)}</span>`;

  div.className = 'shop-item shop-item-flex';
  div.innerHTML = `
    <img class="shop-item-icon" src="img/icons/Shop/Bait/Fries.png" alt="">
    <div class="shop-item-info">
      <div class="shop-item-name-row">
        <span class="shop-item-name">Seagull Bait</span>
        <span class="shop-item-desc">· -5% interval · +10% reward · <span style="color:#ffd700">T${tier}/15</span></span>
      </div>
      <div class="shop-item-pip-row">${pipHtml}<span class="shop-item-effect">Every ${intervalSec}s · ${getSeagullRewardMultiplier().toFixed(1)}× reward</span></div>
    </div>
    <div class="shop-item-actions">
      <button class="btn-shop ${btnClass}" ${disabled ? 'disabled' : ''}>${btnText}</button>
    </div>
    <div class="shop-item-price">${priceHtml}</div>
  `;
  if (!disabled) div.querySelector('button').addEventListener('click', buySeagullBait);
  return div;
}

function makeTargetedLureItem() {
  const lvl     = G.targetedLureLevel || 0;
  const maxed   = lvl >= 5;
  const cost    = maxed ? 0 : TARGETED_LURE_COSTS[lvl];
  const slots   = getTargetedLureSlots();
  const active  = (G.targetedLureTargets || []).length;
  const canAfford = !maxed && (G.coins || 0) >= cost;

  const div = document.createElement('div');
  div.className = 'shop-item shop-item-flex';

  const statusLine = lvl === 0
    ? 'Locked — purchase to unlock'
    : `Active targets: ${active} / ${slots}  ·  ${maxed ? 'MAX LEVEL' : 'Next: +1 active target'}`;

  const priceHtml = maxed ? '' :
    `<img src="img/icons/Game screen icons/coin_icon.png"><span style="${canAfford ? '' : 'color:#c55'}">${formatCoins(cost)}</span>`;

  const btnClass = maxed ? 'btn-shop-equipped' : canAfford ? 'btn-shop-buy' : 'btn-shop-disabled';
  const btnText  = lvl === 0 ? 'Unlock' : maxed ? 'MAX' : `Upgrade`;

  div.innerHTML = `
    <img class="shop-item-icon" src="img/Player bobber cosmetics/Target bobber.png" alt="">
    <div class="shop-item-info">
      <div class="shop-item-name-row">
        <span class="shop-item-name">Targeted Lure</span>
        <span class="shop-item-desc">· Increase chance of selected Fishdex items · <span style="color:#ffd700">Lv${lvl}/5</span></span>
      </div>
      <div class="shop-item-effect" style="font-size:12px;color:#aaa;margin-top:2px">${statusLine}</div>
    </div>
    <div class="shop-item-actions">
      <button class="btn-shop ${btnClass}" ${maxed || !canAfford ? 'disabled' : ''}>${btnText}</button>
    </div>
    <div class="shop-item-price">${priceHtml}</div>
  `;
  if (!maxed && canAfford) div.querySelector('button').addEventListener('click', buyTargetedLure);
  return div;
}

function makePremiumBaitItem(bob) {
  const active   = isPremiumBaitActive();
  const hasEnough = (G.diamonds || 0) >= bob.diamondCost;
  const remMin   = active ? Math.ceil((G.premiumBaitEnd - Date.now()) / 60000) : 0;
  const div = document.createElement('div');
  div.className = 'shop-item';

  let btnClass, btnText, disabled;
  if (active) {
    btnClass = 'btn-shop-equipped'; btnText = 'Active ' + remMin + 'm'; disabled = true;
  } else if (hasEnough) {
    btnClass = 'btn-shop-buy js-buy-bait'; btnText = 'Activate'; disabled = false;
  } else {
    btnClass = 'btn-shop-locked'; btnText = 'Need Diamonds'; disabled = true;
  }

  div.className = 'shop-item shop-item-flex';
  div.innerHTML = `
    <img class="shop-item-icon" src="${bob.img}" alt="">
    <div class="shop-item-info">
      <div class="shop-item-name-row">
        <span class="shop-item-name">${bob.name}</span>
        <span class="shop-item-desc">· ${bob.desc}</span>
      </div>
    </div>
    <div class="shop-item-actions">
      <button class="btn-shop ${btnClass}" ${disabled ? 'disabled' : ''}>${btnText}</button>
    </div>
    <div class="shop-item-price"><span class="diamond-cost"><img src="img/icons/Diamond icon.png" class="diamond-icon-sm"> ${bob.diamondCost}</span></div>
  `;
  if (!disabled) div.querySelector('.js-buy-bait').addEventListener('click', buyPremiumBait);
  return div;
}

function makeBulkBuyItem(name, desc, baseCost, iconSrc, currentCount, onBuyN, firstCost) {
  const div = document.createElement('div');
  div.className = 'shop-item';

  const x1cost = calcBulkCost(baseCost, currentCount, 1, firstCost);
  const maxAll = calcMaxAffordable(baseCost, currentCount, G.coins, firstCost);
  const countBadge = currentCount > 0 ? `<span class="shop-item-count">×${currentCount}</span>` : '';
  const priceHtml = `<img src="img/icons/Game screen icons/coin_icon.png"><span>${formatCoins(x1cost)}</span>`;

  const makeBtn = (qty) => {
    let label, n, affordable;
    if (qty === 'all') {
      n = maxAll; label = 'All(' + n + ')'; affordable = n > 0;
    } else {
      n = qty; label = '×' + qty;
      affordable = G.coins >= calcBulkCost(baseCost, currentCount, qty, firstCost);
    }
    const cls = affordable ? 'btn-bulk btn-bulk-buy' : 'btn-bulk btn-bulk-locked';
    return `<button class="${cls}" data-qty="${n}" ${affordable ? '' : 'disabled'}>${label}</button>`;
  };

  div.innerHTML = `
    <img class="shop-item-icon" src="${iconSrc}" alt="">
    <div class="shop-item-info">
      <div class="shop-item-name-row">
        <span class="shop-item-name">${name}</span>
        ${desc ? `<span class="shop-item-desc">${desc}</span>` : ''}
        ${countBadge}
      </div>
      <div class="shop-item-bulk-actions">
        ${makeBtn(1)}${makeBtn(10)}${makeBtn(100)}${makeBtn('all')}
      </div>
    </div>
    <div class="shop-item-price">${priceHtml}</div>
  `;
  div.querySelectorAll('.btn-bulk-buy').forEach(btn => {
    btn.addEventListener('click', () => onBuyN(parseInt(btn.dataset.qty)));
  });
  return div;
}

function buyRod(id) {
  const rod = RODS.find(r => r.id === id);
  if (!rod) return;
  if (G.currentRod === id) return;
  if (!G.ownedRods.includes(id)) {
    const rodCost = applyDiscount(applyZoneCostScaling(rod.cost));
    if (G.coins < rodCost) { showStatus('Not enough coins!', 1500); return; }
    _spendCoins(rodCost);
    G.ownedRods.push(id);
  }
  G.currentRod = id;
  if (isZoneUnlocked('ocean')) syncAch('h_ocean', 1);
  if (ZONE_DATA.every(z => isZoneUnlocked(z.id))) syncAch('h_empire', 1);
  checkCollectorsDream();
  saveState();
  updateHUD();
  renderShop(activeShopTab);
  showStatus('Equipped: ' + rod.name, 1500);
}

function buyStorage(id, qty = 1) {
  const s = STORAGE_ITEMS.find(x => x.id === id);
  if (!s || qty < 1) return;
  const currentCount = G.ownedStorage.filter(o => o.id === id).length;
  const totalCost = calcBulkCost(s.cost, currentCount, qty);
  if (G.coins < totalCost) { showStatus('Not enough coins!', 1500); return; }
  _spendCoins(totalCost);
  for (let i = 0; i < qty; i++) G.ownedStorage.push({ id, purchasedAt: Date.now() });
  checkCollectorsDream();
  saveState();
  updateHUD();
  renderShop(activeShopTab);
  const newCount = G.ownedStorage.filter(o => o.id === id).length;
  showStatus('Purchased: ' + s.name + (qty > 1 ? ' ×' + qty : '') + '  (total ×' + newCount + ')', 1500);
}

function buyAutomation(id, qty = 1) {
  const a = AUTOMATION.find(x => x.id === id);
  if (!a || qty < 1 || a.ghostOnly) return;
  const currentCount = G.ownedAutomation.filter(o => o.id === id).length;
  const totalCost = calcBulkCost(a.cost, currentCount, qty, a.firstCost);
  if (G.coins < totalCost) { showStatus('Not enough coins!', 1500); return; }
  _spendCoins(totalCost);
  for (let i = 0; i < qty; i++) G.ownedAutomation.push({ id, zone: G.currentZone, purchasedAt: Date.now() });
  if (typeof tutHook === 'function') tutHook('auto_buy', id);
  checkCollectorsDream();
  saveState();
  updateHUD();
  renderShop(activeShopTab);
  updateZoneBg(G.currentZone); // also calls renderWaterAutomation
  const newCount = G.ownedAutomation.filter(o => o.id === id).length;
  showStatus('Purchased: ' + a.name + (qty > 1 ? ' ×' + qty : '') + '  (total ×' + newCount + ')', 1500);
}

function buySeagullBait() {
  const tier = G.seagullBaitCount || 0;
  if (tier >= 15) { showStatus('Max tier reached!', 1500); return; }
  const cost = Math.floor(10000 * Math.pow(5, tier));
  if (G.coins < cost) { showStatus('Not enough coins!', 1500); return; }
  _spendCoins(cost);
  G.seagullBaitCount = tier + 1;
  startSeagullTimer();
  saveState(); updateHUD(); renderShop(activeShopTab);
  showStatus('Seagull Bait → Tier ' + G.seagullBaitCount, 1800);
}

// ─── MARKET SCREEN (inventory + prices) ──────────────────────────────────────

let _activeMarketTab = 'catch';

function switchMarketTab(tab) {
  _activeMarketTab = tab;
  const catchPanel = document.getElementById('market-catch-panel');
  const guildPanel = document.getElementById('market-guild-panel');
  const catchBtn   = document.getElementById('market-tab-catch');
  const guildBtn   = document.getElementById('market-tab-guild');
  if (!catchPanel || !guildPanel) return;
  catchPanel.classList.toggle('hidden', tab !== 'catch');
  guildPanel.classList.toggle('hidden', tab !== 'guild');
  if (catchBtn) catchBtn.classList.toggle('active', tab === 'catch');
  if (guildBtn) guildBtn.classList.toggle('active', tab === 'guild');
  if (tab === 'guild') { checkGuildOrder(); renderGuild(); }
}

function renderMarket() {
  const cap = storageCapacity();
  document.getElementById('market-coins').textContent = formatCoins(G.coins);
  document.getElementById('market-storage-label').textContent =
    fishPileTotal() + ' / ' + cap;

  const trashTotal = Object.values(G.trashPile || {}).reduce((s, q) => s + q, 0);
  const fishTotal  = Object.entries(G.fishPile || {}).reduce((s, [key, qty]) => {
    const [fishId, size] = key.split('|');
    if (isW1LegendaryId(fishId)) return s; // legendary excluded from Sell All
    return s + fishPileValue(fishId, size) * qty;
  }, 0);
  const sellAllVal = trashTotal + fishTotal;
  const sellAllBtn = document.getElementById('btn-sell-all');
  if (sellAllBtn) sellAllBtn.textContent = sellAllVal > 0
    ? `Sell All (+${formatCoins(sellAllVal)}c)`
    : 'Sell All';

  const inv = document.getElementById('market-inventory');
  inv.innerHTML = '';

  function mkHeader(label) {
    const h = document.createElement('div');
    h.className = 'market-section-header';
    h.textContent = label;
    inv.appendChild(h);
  }

  // ── Trophy Fish section ──────────────────────────────────────────
  const trophies = G.trophyPile || [];
  if (trophies.length) {
    mkHeader('🏆 Trophy Fish');
    trophies.forEach((t, idx) => {
      const div = document.createElement('div');
      div.className = 'storage-item';
      div.innerHTML = `
        <img class="storage-item-img" src="${t.img || ''}" alt="" ${!t.img ? 'style="display:none"' : ''}>
        <div class="storage-item-info">
          <div class="storage-item-name">${t.name}</div>
          <div class="storage-item-meta trophy-weight">${formatWeight(t.weightG)} · ${t.rarity}</div>
        </div>
        <div class="storage-item-demand">
          <div class="storage-item-value"><img src="img/icons/Diamond icon.png" class="diamond-icon-sm" alt="">1</div>
        </div>
        <button class="btn-sell-one">Sell</button>
      `;
      div.querySelector('.btn-sell-one').addEventListener('click', () => sellTrophy(idx));
      inv.appendChild(div);
    });
  }

  // ── Sunken Treasure Chests ─────────────────────────────────────
  const chests = (G.sunkenChests || []);
  if (chests.length) {
    mkHeader('Sunken Treasure');
    chests.forEach(chest => {
      const tierLabel = chest.rewardTier === 'ocean' ? 'Ocean Tier' : 'Sea Tier';
      const srcLabel  = (chest.source.charAt(0).toUpperCase() + chest.source.slice(1)).replace(/_/g, ' ');
      const div = document.createElement('div');
      div.className = 'storage-item';
      div.innerHTML = `
        <img class="storage-item-img" src="img/icons/Sunken treasure icon.png" alt="">
        <div class="storage-item-info">
          <div class="storage-item-name">Sunken Treasure Chest</div>
          <div class="storage-item-meta">${tierLabel} · ${srcLabel}</div>
        </div>
        <div class="storage-item-demand"></div>
        <button class="btn-sell-one" style="background:var(--color-gold);color:#222">Open</button>
      `;
      div.querySelector('.btn-sell-one').addEventListener('click', () => openSunkenChest(chest.id));
      inv.appendChild(div);
    });
  }

  // ── Fish section (stacked by species + size) ──────────────────
  const fishEntries = Object.entries(G.fishPile || {}).filter(([,q]) => q > 0);
  if (fishEntries.length) {
    mkHeader('Fish');
    fishEntries
      .map(([key, qty]) => {
        const [fishId, size] = key.split('|');
        const f = FISH_DB.find(x => x.id === fishId);
        const val = fishPileValue(fishId, size);
        return { key, fishId, size, qty, val, f };
      })
      .sort((a, b) => {
        // W1 legendary always show at top so player notices them
        if (a.f && a.f.w1legendary && !(b.f && b.f.w1legendary)) return -1;
        if (b.f && b.f.w1legendary && !(a.f && a.f.w1legendary)) return 1;
        return b.val - a.val;
      })
      .forEach(({ key, fishId, size, qty, val, f }) => {
        const isLeg = !!(f && f.w1legendary);
        const div = document.createElement('div');
        div.className = 'storage-item' + (isLeg ? ' storage-item-legendary' : '');
        if (isLeg) {
          div.innerHTML = `
            <img class="storage-item-img" src="${f.img || ''}" alt="" ${!f.img ? 'style="display:none"' : ''}>
            <div class="storage-item-info">
              <div class="storage-item-name" style="color:#f4c430;font-weight:bold">${f.name}</div>
              <div class="storage-item-meta">Legendary ${qty > 1 ? '· ×' + qty : ''}</div>
            </div>
            <div class="storage-item-demand">
              <div class="storage-item-value" style="color:#d4a0ff">10 ${PEARL_IMG}</div>
            </div>
            <button class="btn-sell-one btn-sell-legendary">Sell for 10 ${PEARL_IMG}</button>
          `;
          div.querySelector('.btn-sell-legendary').addEventListener('click', () => sellLegendaryFish(key));
        } else {
          div.innerHTML = `
            <img class="storage-item-img" src="${f?.img || ''}" alt="" ${!f?.img ? 'style="display:none"' : ''}>
            <div class="storage-item-info">
              <div class="storage-item-name">${f?.name || fishId}</div>
              <div class="storage-item-meta">${size === 'FishFight' ? 'Fish Fight' : size} · ${f?.rarity || ''}</div>
            </div>
            <div class="storage-item-demand">
              <div class="storage-item-value">${val}c ${qty > 1 ? '<span style="color:var(--color-text-dim)">×' + qty + '</span>' : ''}</div>
            </div>
            <button class="btn-sell-one">Sell</button>
          `;
          div.querySelector('.btn-sell-one').addEventListener('click', () => sellFish(key, 1));
        }
        inv.appendChild(div);
      });
  }

  // ── Trash section (grouped by type, quantity) ──────────────────
  const trashEntries = Object.entries(G.trashPile || {}).filter(([,q]) => q > 0);
  if (trashEntries.length) {
    mkHeader('Trash');
    trashEntries.forEach(([id, qty]) => {
      const item = TRASH_DB.find(t => t.id === id);
      if (!item) return;
      const div = document.createElement('div');
      div.className = 'storage-item';
      div.innerHTML = `
        <img class="storage-item-img" src="${item.img || ''}" alt="" ${!item.img ? 'style="display:none"' : ''}>
        <div class="storage-item-info">
          <div class="storage-item-name">${item.name}</div>
          <div class="storage-item-meta">trash · ×${qty}</div>
        </div>
        <div class="storage-item-demand"><div class="storage-item-value">${qty}c</div></div>
        <button class="btn-sell-one">Sell</button>
      `;
      div.querySelector('.btn-sell-one').addEventListener('click', () => {
        _earnCoins(qty); G.trashPile[id] = 0;
        onSellEvent(id, qty);
        finalizeQuestUpdate(); saveState(); updateHUD(); renderMarket();
      });
      inv.appendChild(div);
    });
  }

  // ── Plant section (grouped by type, quantity) ──────────────────
  const plantEntries = Object.entries(G.plantPile || {}).filter(([,q]) => q > 0);
  if (plantEntries.length) {
    mkHeader('Plants');
    plantEntries.forEach(([id, qty]) => {
      const item = PLANT_DB.find(p => p.id === id);
      if (!item) return;
      const div = document.createElement('div');
      div.className = 'storage-item';
      div.innerHTML = `
        <img class="storage-item-img" src="${item.img || ''}" alt="" ${!item.img ? 'style="display:none"' : ''}>
        <div class="storage-item-info">
          <div class="storage-item-name">${item.name}</div>
          <div class="storage-item-meta">plant · ×${qty}</div>
        </div>
        <div class="storage-item-demand"><div class="storage-item-value">0c</div></div>
        <button class="btn-sell-one">Discard</button>
      `;
      div.querySelector('.btn-sell-one').addEventListener('click', () => {
        G.plantPile[id] = 0;
        saveState(); renderMarket();
      });
      inv.appendChild(div);
    });
  }

  if (!chests.length && !trophies.length && !fishEntries.length && !trashEntries.length && !plantEntries.length) {
    inv.innerHTML = '<p style="color:var(--color-text-dim);padding:12px 0 8px;text-align:center;font-size:13px">Nothing to sell.</p>';
  }
}

function sellTrophy(idx) {
  const t = (G.trophyPile || [])[idx];
  if (!t) return;
  G.trophyPile.splice(idx, 1);
  const diamondsEarned = Math.max(1, Math.round(getRodDiamondMult()));
  G.diamonds = (G.diamonds || 0) + diamondsEarned;
  onSellEvent(t.fishId, 0);
  finalizeQuestUpdate();
  showStatus('Trophy sold for ' + diamondsEarned + ' diamonds!', 2000);
  saveState(); updateHUD(); renderMarket();
}

function sellLegendaryFish(key) {
  const available = G.fishPile[key] || 0;
  if (!available) return;
  const [fishId] = key.split('|');
  const fish = FISH_DB.find(f => f.id === fishId);
  G.fishPile[key] = available - 1;
  G.blackPearls = (G.blackPearls || 0) + 10;
  // Discovery and prestige bonus are retained — selling never removes them
  const pearlImg = typeof PEARL_IMG !== 'undefined' ? PEARL_IMG : '◆';
  showStatus((fish ? fish.name : 'Legendary Fish') + ' sold for 10 Black Pearls!', 3000);
  checkStorageFull();
  finalizeQuestUpdate();
  saveState(); updateHUD(); renderMarket();
}

function sellFish(key, qty, btnEl) {
  const available = G.fishPile[key] || 0;
  if (!available) return;
  const [fishId, size] = key.split('|');
  if (isW1LegendaryId(fishId)) { sellLegendaryFish(key); return; }
  const val = fishPileValue(fishId, size);
  const selling = Math.min(qty, available);
  const earned = val * selling;
  _earnCoins(earned);
  if (typeof tutHook === 'function') tutHook('sell', earned);
  if (val > (G.stats.bestFishSold || 0)) G.stats.bestFishSold = val;
  if (size === 'FishFight') G.stats.fishFightCoinsEarned = (G.stats.fishFightCoinsEarned || 0) + earned;
  _updateSaleRecords(fishId, size, val);
  G.fishPile[key] = available - selling;
  onSellEvent(fishId, earned);
  showCoinFloat(earned, btnEl || null);
  checkStorageFull();
  finalizeQuestUpdate();
  saveState();
  updateHUD();
  renderMarket();
}

document.getElementById('btn-sell-all').addEventListener('click', () => {
  const _hasHarbor = (G.ownedStorage || []).some(o => o.id === 'harborcs');
  if (_hasHarbor && fishPileTotal() >= Math.floor(storageCapacity() * 0.90)) syncAch('h_harbor_sell', 1);
  let total = 0;
  // Sell all trash
  Object.entries(G.trashPile || {}).forEach(([id, qty]) => {
    if (qty > 0) { total += qty; G.trashPile[id] = 0; }
  });
  // Discard all plants (0c)
  Object.keys(G.plantPile || {}).forEach(id => { G.plantPile[id] = 0; });
  // Sell all fish (W1 Legendary are skipped — must be sold manually for 10 Black Pearls each)
  Object.entries(G.fishPile || {}).forEach(([key, qty]) => {
    if (qty > 0) {
      const [fishId, size] = key.split('|');
      if (isW1LegendaryId(fishId)) return;
      const val = fishPileValue(fishId, size);
      if (val > (G.stats.bestFishSold || 0)) G.stats.bestFishSold = val;
      if (size === 'FishFight') G.stats.fishFightCoinsEarned = (G.stats.fishFightCoinsEarned || 0) + val * qty;
      _updateSaleRecords(fishId, size, val);
      total += val * qty;
      onSellEvent(fishId, val * qty);
      G.fishPile[key] = 0;
    }
  });
  _earnCoins(total);
  if (typeof tutHook === 'function') tutHook('sell', total);
  if (total > 0) showCoinFloat(total);
  _storageFull = false;
  finalizeQuestUpdate();
  saveState();
  updateHUD();
  renderMarket();
  showStatus('Sold all for ' + formatCoins(total) + 'c', 2000);
});

// ─── AUTO-SELLER ─────────────────────────────────────────────────────────────

function isTempAutoSellActive() { return Date.now() < (G.autoSellEnd || 0); }
function isAutoSellActive() {
  return isTempAutoSellActive() || (G.autoSellPermanent && G.autoSellEnabled);
}

function doAutoSell() {
  if (!isAutoSellActive()) return;
  const _hasHarbor = (G.ownedStorage || []).some(o => o.id === 'harborcs');
  if (_hasHarbor && fishPileTotal() >= Math.floor(storageCapacity() * 0.90)) syncAch('h_harbor_sell', 1);
  let total = 0;
  Object.entries(G.trashPile || {}).forEach(([id, qty]) => {
    if (qty > 0) { total += qty; G.trashPile[id] = 0; }
  });
  Object.keys(G.plantPile || {}).forEach(id => { G.plantPile[id] = 0; });
  Object.entries(G.fishPile || {}).forEach(([key, qty]) => {
    if (qty > 0) {
      const [fishId, size] = key.split('|');
      if (isW1LegendaryId(fishId)) return; // W1 Legendary never auto-sold — player must sell manually for 10 Black Pearls
      const val = fishPileValue(fishId, size);
      if (val > (G.stats.bestFishSold || 0)) G.stats.bestFishSold = val;
      if (size === 'FishFight') G.stats.fishFightCoinsEarned = (G.stats.fishFightCoinsEarned || 0) + val * qty;
      _updateSaleRecords(fishId, size, val);
      total += val * qty;
      onSellEvent(fishId, val * qty);
      G.fishPile[key] = 0;
    }
  });
  (G.trophyPile || []).forEach(() => {
    G.diamonds = (G.diamonds || 0) + Math.max(1, Math.round(getRodDiamondMult()));
  });
  G.trophyPile = [];
  _earnCoins(total);
  if (total > 0) {
    showCoinFloat(total);
    _storageFull = false;
    finalizeQuestUpdate();
    saveState();
    updateHUD();
    if (document.getElementById('screen-market').classList.contains('active')) renderMarket();
  }
}

const AUTO_SELL_INTERVAL_MS = 3600 * 1000; // 24 in-game hours = 1 real hour

function startAutoSellTimer() {
  const checkSell = () => {
    if (!isAutoSellActive()) return;
    if (Date.now() >= (G.autoSellNextAt || 0)) {
      G.autoSellNextAt = Date.now() + AUTO_SELL_INTERVAL_MS;
      doAutoSell();
      saveState();
    }
  };
  setTimeout(checkSell, 2000);   // check shortly after startup
  setInterval(checkSell, 60000); // then every minute
}

function buyTempAutoSell() {
  const COST = 10;
  if ((G.diamonds || 0) < COST) { showStatus('Not enough Diamonds!', 1500); return; }
  confirmDiamondPurchase('Auto-Seller (6 hours)', COST, () => {
    G.diamonds -= COST;
    const _base = Math.max(Date.now(), G.autoSellEnd || 0);
    G.autoSellEnd = _base + 6 * 3600 * 1000; // stack 6h on top of remaining time
    if (!isTempAutoSellActive()) G.autoSellNextAt = Date.now() + AUTO_SELL_INTERVAL_MS;
    saveState(); updateHUD(); renderDiamondStore();
    showStatus('Auto-Seller active for 6 hours!', 2000);
    doAutoSell(); // immediate sell on purchase
  });
}

function toggleAutoSell() {
  G.autoSellEnabled = !G.autoSellEnabled;
  saveState(); updateHUD(); renderDiamondStore();
}

// ─── COIN FLOAT ──────────────────────────────────────────────────────────────

function showCoinFloat(amount, anchorEl) {
  if (!amount || amount <= 0) return;
  const el = document.createElement('div');
  el.className = 'coin-float';
  el.textContent = '+' + formatCoins(amount) + 'c';
  if (anchorEl) {
    const r = anchorEl.getBoundingClientRect();
    el.style.left = (r.left + r.width / 2) + 'px';
    el.style.top  = (r.top) + 'px';
  } else {
    const coinEl = document.getElementById('hud-coins');
    const r = coinEl ? coinEl.getBoundingClientRect() : { left: window.innerWidth / 2, top: 60, width: 0 };
    el.style.left = (r.left + r.width / 2) + 'px';
    el.style.top  = r.top + 'px';
  }
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

// ─── HUD UPDATE ──────────────────────────────────────────────────────────────

function calcFishRate() {
  return G.ownedAutomation.reduce((sum, owned) => {
    const aDef = AUTOMATION.find(x => x.id === owned.id);
    if (!aDef) return sum;
    const tm = aDef.type === 'net'       ? getRodNetSpeedMult()
             : aDef.type === 'fisherman' ? getRodFishermanSpeedMult()
             : aDef.type === 'boat'      ? getRodBoatSpeedMult()
             : aDef.type === 'fleet'     ? getRodFleetSpeedMult()
             : 1;
    return sum + (getSpeedMult() * tm * getPearlSpeedMult() * getMasteryAutoSpeedMult() * getAutomationUpgradeMultiplier() * getMultiCatch()) / aDef.rate;
  }, 0);
}

function getEstimatedHourlyIncome() {
  if (!G.ownedAutomation || !G.ownedAutomation.length) return 0;
  const sizeTotal   = SIZE_TABLE.reduce((s, e) => s + e.weight, 0);
  const sizeAvgMult = SIZE_TABLE.reduce((s, e) => s + e.weight * e.mult, 0) / sizeTotal;
  const avgByZone = {};
  ZONE_DATA.forEach(z => {
    const byR = {};
    ['common','uncommon','rare','epic'].forEach(r => {
      const pool = FISH_DB.filter(f => f.rarity === r && f.zones.includes(z.id) && !isManualOnlyFish(f));
      byR[r] = pool.length ? pool.reduce((s, f) => s + f.baseValue, 0) / pool.length : 0;
    });
    avgByZone[z.id] = byR;
  });
  const agg = {};
  for (const owned of G.ownedAutomation) {
    const k = owned.zone + '|' + owned.id;
    if (!agg[k]) {
      const aDef = AUTOMATION.find(x => x.id === owned.id);
      if (!aDef) continue;
      agg[k] = { zone: owned.zone, aDef, count: 0 };
    }
    agg[k].count++;
  }
  const speedBase = getSpeedMult() * getPearlSpeedMult() * getMasteryAutoSpeedMult() * getAutomationUpgradeMultiplier();
  const typeMults = { net: getRodNetSpeedMult(), fisherman: getRodFishermanSpeedMult(), boat: getRodBoatSpeedMult(), fleet: getRodFleetSpeedMult() };
  let perSec = 0;
  for (const { zone, aDef, count } of Object.values(agg)) {
    const catchesPerSec = count * speedBase * (typeMults[aDef.type] || 1) / aDef.rate;
    const lt = (LOOT_TABLES[zone] || LOOT_TABLES.pond).filter(e => e.type !== 'legendary');
    const tw = lt.reduce((s, e) => s + e.weight, 0);
    let avgVal = 0;
    for (const e of lt) {
      const p = e.weight / tw;
      if (e.type === 'trash') avgVal += p * 1;
      else if (e.type !== 'plant') avgVal += p * ((avgByZone[zone] || {})[e.type] || 0) * sizeAvgMult;
    }
    perSec += catchesPerSec * avgVal;
  }
  return Math.round(perSec * 3600);
}

function estimateAutoHourlyIncome() {
  if (!G.ownedAutomation || !G.ownedAutomation.length) return 0;
  const sizeTotal = SIZE_TABLE.reduce((s, e) => s + e.weight, 0);
  const sizeAvgMult = SIZE_TABLE.reduce((s, e) => s + e.weight * e.mult, 0) / sizeTotal;
  const avgByZone = {};
  ZONE_DATA.forEach(z => {
    const byR = {};
    ['common','uncommon','rare','epic'].forEach(r => {
      const pool = FISH_DB.filter(f => f.rarity === r && f.zones.includes(z.id) && !isManualOnlyFish(f));
      byR[r] = pool.length ? pool.reduce((s, f) => s + f.baseValue, 0) / pool.length : 0;
    });
    avgByZone[z.id] = byR;
  });
  const speedBase = getSpeedMult() * getPearlSpeedMult();
  const tm = { net: getRodNetSpeedMult(), fisherman: getRodFishermanSpeedMult(), boat: getRodBoatSpeedMult(), fleet: getRodFleetSpeedMult() };
  const agg = {};
  for (const owned of G.ownedAutomation) {
    const k = owned.zone + '|' + owned.id;
    if (!agg[k]) {
      const aDef = AUTOMATION.find(x => x.id === owned.id);
      if (!aDef) continue;
      agg[k] = { zone: owned.zone, aDef, count: 0 };
    }
    agg[k].count++;
  }
  let perSec = 0;
  for (const { zone, aDef, count } of Object.values(agg)) {
    const catchesPerSec = count * speedBase * (tm[aDef.type] || 1) / aDef.rate * getMultiCatch();
    const lt = (LOOT_TABLES[zone] || LOOT_TABLES.pond).filter(e => e.type !== 'legendary');
    const tw = lt.reduce((s, e) => s + e.weight, 0);
    let avgVal = 0;
    for (const e of lt) {
      const p = e.weight / tw;
      if (e.type === 'trash') avgVal += p;
      else if (e.type !== 'plant') avgVal += p * ((avgByZone[zone] || {})[e.type] || 0) * sizeAvgMult;
    }
    perSec += catchesPerSec * avgVal;
  }
  return Math.max(500, Math.round(perSec * 3600));
}

function updateHUD() {
  document.getElementById('hud-coins').textContent = formatCoins(G.coins);
  document.getElementById('hud-storage').textContent =
    formatCoins(fishPileTotal()) + '/' + formatCoins(storageCapacity());
  const _scEl = document.getElementById('shop-coins');
  if (_scEl) _scEl.textContent = activeShopTab === 'jeweler' ? (G.blackPearls || 0) : formatCoins(G.coins);

  const diamEl = document.getElementById('hud-diamonds');
  if (diamEl) diamEl.textContent = G.diamonds || 0;
  const _diam = G.diamonds || 0;
  if (_diam > (G.stats.recHighestDiamonds || 0)) G.stats.recHighestDiamonds = _diam;

  const pearlEl = document.getElementById('hud-pearls');
  const pearlStat = document.getElementById('hud-pearl-stat');
  if (pearlEl && pearlStat) {
    const p = G.blackPearls || 0;
    pearlEl.textContent = p;
    pearlStat.style.display = p > 0 ? '' : 'none';
    if (p > (G.stats.recHighestBlackPearls || 0)) G.stats.recHighestBlackPearls = p;
  }

  const rate = calcFishRate();
  const rateEl = document.getElementById('hud-fishrate');
  if (rateEl) {
    if (rate > 0) {
      const rateStr = rate < 1
        ? (rate < 0.1 ? rate.toFixed(2) : rate.toFixed(1))
        : formatCoins(Math.round(rate));
      rateEl.textContent = rateStr + ' catch/s';
    } else {
      rateEl.textContent = '';
    }
  }
}

// ─── CLOCK ────────────────────────────────────────────────────────────────────

const TIME_PERIODS = [
  { from: 4,  to: 7,  label: 'Dawn' },
  { from: 7,  to: 12, label: 'Morning' },
  { from: 12, to: 18, label: 'Afternoon' },
  { from: 18, to: 22, label: 'Evening' },
  { from: 22, to: 28, label: 'Night' }, // 22-28 wraps midnight
];

function getTimePeriod(hour) {
  const h = hour >= 22 ? hour : (hour < 4 ? hour + 24 : hour);
  for (const p of TIME_PERIODS) { if (h >= p.from && h < p.to) return p.label; }
  return 'Night';
}

function getIngameTime() {
  const now = new Date();
  // 1 real hour = 1 in-game day → in-game runs 24× faster than real time
  const realSecondsInHour = now.getMinutes() * 60 + now.getSeconds();
  const ingameTotalSeconds = (realSecondsInHour / 3600) * 86400;
  return {
    h: Math.floor(ingameTotalSeconds / 3600),
    m: Math.floor((ingameTotalSeconds % 3600) / 60),
  };
}

function isTimeAvailable(fish) {
  if (!fish.timeWindow) return true;
  const { h } = getIngameTime();
  const { from, to } = fish.timeWindow;
  if (from < to) return h >= from && h < to;
  return h >= from || h < to; // wraps midnight (e.g. 22-02)
}

function updateClock() {
  const { h, m } = getIngameTime();
  checkFishermanDialogue(G.currentZone);
  const period = getTimePeriod(h);
  document.getElementById('hud-clock').textContent =
    h.toString().padStart(2, '0') + ':' + m.toString().padStart(2, '0');
  const periodEl = document.getElementById('hud-period');
  if (periodEl) periodEl.textContent = period;

  updatePremiumBaitHUD();
  updateRapidWatersHUD();
  updateAdBoostHUD();
  updateAutoSellHUD();
  updateLuckyHookHUD();

  if (isCompetitionActive()) {
    const timerEl = document.getElementById('comp-timer');
    if (timerEl) {
      const remMs  = Math.max(0, G.competition.ends - Date.now());
      const remMin = Math.floor(remMs / 60000);
      const remSec = Math.floor((remMs % 60000) / 1000);
      timerEl.textContent = remMin + ':' + remSec.toString().padStart(2, '0');
    }
  }
  updateGuildOverlay();
  updateCompOverlay();

  const guildTimeEl = document.getElementById('guild-time-remaining');
  if (guildTimeEl) guildTimeEl.textContent = formatGuildTime(getGuildWeekRemaining());

  _gsTick();
}

let _clockInterval = null;

function startClock() {
  if (_clockInterval) { clearInterval(_clockInterval); _clockInterval = null; }
  updateClock();
  _clockInterval = setInterval(() => {
    updateClock();
    // Fallback: fire event if setTimeout was throttled (e.g. Android background)
    if (_nextEventAt && !_pendingEvent && Date.now() >= _nextEventAt) {
      triggerSpecialEvent();
    }
  }, 2500); // update every 2.5s — 1 in-game min = 2.5 real sec
}

// ─── OFFLINE PROGRESS ─────────────────────────────────────────────────────────

function calculateOfflineProgress() {
  const now = Date.now();
  const lastSeen = G.lastSeen || 0;

  // Ghost Ship advance — advance all ships while offline
  if (lastSeen) {
    if (!G.ghostShips) G.ghostShips = [];
    G.ghostShips = G.ghostShips.filter(gs => {
      if (gs.state === 'idle' && gs.despawnAt > 0 && now >= gs.despawnAt) return false;
      if (gs.state === 'expedition' && gs.expeditionEndAt > 0 && now >= gs.expeditionEndAt) gs.state = 'complete';
      return true;
    });
    if (G.sunkenTreasureUnlocked && G.ghostShipNextSpawnAt > 0 && now >= G.ghostShipNextSpawnAt) {
      G.ghostShipNextSpawnAt = 0;
      setTimeout(_gsSpawnRoll, 2000);
    }
  }

  // Save the updated timestamp BEFORE processing catches (idempotency: a crash between
  // here and the end of processing cannot cause the same interval to replay on next start).
  G.lastSeen = now;
  saveState();

  if (!lastSeen || !G.ownedAutomation.length) return;

  const elapsedMs = Math.max(0, now - lastSeen);
  const elapsedSec = Math.min(elapsedMs / 1000, 43200); // cap at 12h
  if (elapsedSec < 10) return;

  // Per-session result — freshly created each call, never read from a persistent field.
  // Discarded after the popup is shown; never accumulated across sessions.
  const _sess = {
    fish:    {},   // { fishId: count } — items generated this session
    plants:  {},   // { plantId: count }
    trash:   {},   // { trashId: count }
    totalFish:   0,
    totalPlant:  0,
    totalTrash:  0,
    totalEpic:   0,
    totalCaught: 0,
    coins:       0, // coins earned from scheduled Auto-Seller sales this offline window
    elapsedMs,
  };

  // Expedition vessel offline catch-up (one chest per vessel; lost if hold full)
  if (G.expeditionVessels && G.expeditionVessels.length) {
    for (const v of G.expeditionVessels) {
      if (now >= v.nextChestAt) {
        addSunkenChest('expedition', 'sea');
        v.nextChestAt = now + EXPEDITION_VESSEL_INTERVAL;
      }
    }
  }

  const _offAllUnlocked  = ZONE_DATA.filter(z => isZoneUnlocked(z.id)).map(z => z.id);
  const _offZones = (G.activeAutomationZones || []).filter(z => _offAllUnlocked.includes(z));
  const _offRandZone = () => _offZones.length ? _offZones[Math.floor(Math.random() * _offZones.length)] : _offAllUnlocked[0];

  // Pre-cache catch pools by zone to avoid repeated FISH_DB.filter() calls inside the 200k-iteration loop.
  // Without this, each rollCatch() does up to 3 × 180-item filter passes → ~108M ops for large offline windows.
  const _zonesToCache = [...new Set([..._offZones, ..._offAllUnlocked])];
  const _offPools = {};
  const _offLootTables = {};
  _zonesToCache.forEach(function(zone) {
    _offLootTables[zone] = (LOOT_TABLES[zone] || LOOT_TABLES.pond).filter(function(e) { return e.type !== 'legendary'; });
    ['common','uncommon','rare','epic'].forEach(function(rarity) {
      let pool = FISH_DB.filter(function(f) { return f.rarity === rarity && f.zones.includes(zone) && !isManualOnlyFish(f) && !f.w1legendary; });
      if (!pool.length) pool = FISH_DB.filter(function(f) { return f.zones.includes(zone) && !isManualOnlyFish(f) && !f.w1legendary; });
      _offPools[zone + '|' + rarity] = pool;
    });
    _offPools[zone + '|trash'] = TRASH_DB.filter(function(t) { return t.zones.includes(zone); });
    _offPools[zone + '|plant'] = PLANT_DB.filter(function(p) { return p.zones.includes(zone); });
    // Pre-cache W1 legendary pool per zone for independent offline pre-roll
    _offPools[zone + '|w1leg'] = FISH_DB.filter(function(f) { return f.w1legendary && f.zones.includes(zone); });
  });

  function _fastOfflineRoll(zone) {
    const lt = _offLootTables[zone] || _offLootTables[_offAllUnlocked[0]] || [];
    const roll = weightedRandom(lt);
    const type = roll ? roll.type : 'common';
    const pool = _offPools[zone + '|' + type] || [];
    if (!pool.length) return { fishId: 'old_boot', name: 'Old Boot', rarity: 'trash' };
    const item = pool[randInt(0, pool.length - 1)];
    if (type === 'trash') return { fishId: item.id, name: item.name, rarity: 'trash' };
    if (type === 'plant') return { fishId: item.id, name: item.name, rarity: 'plant' };
    const sizeRow = weightedRandom(SIZE_TABLE);
    const size = sizeRow.trophy ? 17 : sizeRow.size;
    return { fishId: item.id, rarity: type, size, isTrophy: false };
  }

  // Pre-compute per-unit effective catch rates (avoids re-computing multipliers in the inner loop)
  const _offUnits = G.ownedAutomation.map(owned => {
    const aDef = AUTOMATION.find(x => x.id === owned.id);
    if (!aDef) return null;
    const typeMult = aDef.type === 'net'       ? getRodNetSpeedMult()
                   : aDef.type === 'fisherman' ? getRodFishermanSpeedMult()
                   : aDef.type === 'boat'      ? getRodBoatSpeedMult()
                   : aDef.type === 'fleet'     ? getRodFleetSpeedMult()
                   : 1;
    const spd = getSpeedMult() * typeMult * getPearlSpeedMult() * getMasteryAutoSpeedMult() * getAutomationUpgradeMultiplier();
    return { aDef, effectiveRate: aDef.rate / spd };
  }).filter(Boolean);

  // Total catches produced by all units in a given window (seconds)
  function _catchesInSec(sec) {
    return _offUnits.reduce((total, u) => {
      return total + Math.floor(
        Math.floor(sec / u.effectiveRate) * 0.75
        * (1 + getPearlExtraCatchChance())
        * getMasteryOfflineMult()
      );
    }, 0);
  }
  const _offMultiCatch = getMultiCatch(); // captured once; stable across all phases

  // Build timeline of scheduled Auto-Seller events within the offline window.
  // Only interval-based sell events free storage — storage-full alone never triggers a sell.
  const _offlineStartAbs = now - elapsedMs;
  const _autoSellOn = isAutoSellActive();
  const _sellTimesRelSec = []; // seconds from _offlineStartAbs

  if (_autoSellOn) {
    let nextSell = G.autoSellNextAt || 0;
    if (nextSell < _offlineStartAbs) {
      const intervals = Math.ceil((_offlineStartAbs - nextSell) / AUTO_SELL_INTERVAL_MS);
      nextSell += intervals * AUTO_SELL_INTERVAL_MS;
    }
    while (nextSell < now) {
      _sellTimesRelSec.push((nextSell - _offlineStartAbs) / 1000);
      nextSell += AUTO_SELL_INTERVAL_MS;
    }
    G.autoSellNextAt = nextSell; // first sell time after player returns
  }

  const _offStorageCap = storageCapacity();
  let   _offTotal      = fishPileTotal();

  // Use Set for O(1) fishdex lookups during analytical computation; flushed to array at end.
  const _offFishdexSet = new Set(G.fishdex);

  const _offItemMap = {};
  [...FISH_DB, ...PLANT_DB, ...TRASH_DB].forEach(function(it) { _offItemMap[it.id] = it; });
  const _offMasteryBatch = {};

  // Pre-compute size distribution for automation (trophy entries → size 14). Built once, reused per catch.
  const _offSizeDist = [];
  const _stTotalW = SIZE_TABLE.reduce(function(s, e) { return s + e.weight; }, 0);
  SIZE_TABLE.forEach(function(e) {
    const sz = e.trophy ? 14 : e.size; // trophy catches stored as size 14 in auto pile
    const ex = _offSizeDist.find(function(x) { return x.sz === sz; });
    if (ex) ex.prob += e.weight / _stTotalW;
    else _offSizeDist.push({ sz: sz, prob: e.weight / _stTotalW });
  });

  // Analytical phase: replaces the per-catch iteration loop.
  // Computes expected catches per loot type and item via loot table weights — O(zones × types × items).
  // For a 12h offline window this runs in <1ms vs ~60s for 200k iterations on a mid-range device.
  function _analyticalPhase(phaseSec) {
    const totalPulls = _catchesInSec(phaseSec);
    if (totalPulls <= 0) return;
    const zones = _offZones.length ? _offZones : [_offAllUnlocked[0]];
    const pullsPerZone = totalPulls / zones.length;

    for (let zi = 0; zi < zones.length; zi++) {
      const zone = zones[zi];

      // W1 Legendary: expected = pullsPerZone / 50M per fish; Bernoulli trial for fractional part
      const w1pool = _offPools[zone + '|w1leg'] || [];
      for (let wi = 0; wi < w1pool.length; wi++) {
        if (_offTotal >= _offStorageCap) break;
        const lf = w1pool[wi];
        const expected = pullsPerZone / 50000000;
        const n = expected >= 1
          ? Math.floor(expected) + (Math.random() < (expected % 1) ? 1 : 0)
          : (Math.random() < expected ? 1 : 0);
        if (n > 0) {
          const qty = Math.min(n, _offStorageCap - _offTotal);
          const key = fishPileKey(lf.id, 15);
          const isFirst = !_offFishdexSet.has(lf.id);
          G.fishPile[key] = (G.fishPile[key] || 0) + qty;
          _offTotal += qty;
          _offFishdexSet.add(lf.id);
          incrementMastery(lf.id);
          _queueLegendaryPopup({ fishId: lf.id, name: lf.name, img: lf.img, zone: zone, isFirst: isFirst });
          _sess.totalCaught += qty;
          _sess.totalFish += qty;
        }
      }

      // Regular catches: expected count per type by loot table weight ratio
      const lt = _offLootTables[zone] || [];
      const ltTotal = lt.reduce(function(s, e) { return s + e.weight; }, 0);
      if (!ltTotal) continue;

      for (let ei = 0; ei < lt.length; ei++) {
        const entry = lt[ei];
        const pool = _offPools[zone + '|' + entry.type] || [];
        if (!pool.length) continue;

        const typePulls = pullsPerZone * (entry.weight / ltTotal);
        const typeCount = Math.floor(typePulls) + (Math.random() < (typePulls % 1) ? 1 : 0);
        if (!typeCount) continue;

        const perItem = typeCount / pool.length; // expected catch events per unique item

        if (entry.type === 'trash') {
          for (let ii = 0; ii < pool.length; ii++) {
            const item = pool[ii];
            const raw = perItem * _offMultiCatch;
            const qty = Math.floor(raw) + (Math.random() < (raw % 1) ? 1 : 0);
            if (!qty) continue;
            G.trashPile[item.id] = (G.trashPile[item.id] || 0) + qty;
            _offFishdexSet.add(item.id);
            _offMasteryBatch[item.id] = (_offMasteryBatch[item.id] || 0) + 1;
            _sess.trash[item.id] = (_sess.trash[item.id] || 0) + qty;
            _sess.totalTrash += qty;
            _sess.totalCaught += qty;
          }
        } else if (entry.type === 'plant') {
          for (let ii = 0; ii < pool.length; ii++) {
            const item = pool[ii];
            const raw = perItem * _offMultiCatch;
            const qty = Math.floor(raw) + (Math.random() < (raw % 1) ? 1 : 0);
            if (!qty) continue;
            G.plantPile[item.id] = (G.plantPile[item.id] || 0) + qty;
            _offFishdexSet.add(item.id);
            _offMasteryBatch[item.id] = (_offMasteryBatch[item.id] || 0) + 1;
            _sess.plants[item.id] = (_sess.plants[item.id] || 0) + qty;
            _sess.totalPlant += qty;
            _sess.totalCaught += qty;
          }
        } else {
          // Fish: distribute across pool items and sizes, respect remaining storage space
          for (let ii = 0; ii < pool.length; ii++) {
            if (_offTotal >= _offStorageCap) break;
            const item = pool[ii];
            const raw = perItem * _offMultiCatch;
            const maxFit = _offStorageCap - _offTotal;
            const itemTotal = Math.min(
              Math.floor(raw) + (Math.random() < (raw % 1) ? 1 : 0),
              maxFit
            );
            if (!itemTotal) continue;
            // Distribute itemTotal across sizes; last bucket absorbs rounding remainder
            let placed = 0;
            for (let si = 0; si < _offSizeDist.length; si++) {
              const isLastSz = si === _offSizeDist.length - 1;
              const sizeQty = isLastSz
                ? itemTotal - placed
                : Math.round(itemTotal * _offSizeDist[si].prob);
              if (sizeQty <= 0) continue;
              const key = fishPileKey(item.id, _offSizeDist[si].sz);
              G.fishPile[key] = (G.fishPile[key] || 0) + sizeQty;
              placed += sizeQty;
            }
            _offTotal += placed;
            _offFishdexSet.add(item.id);
            _offMasteryBatch[item.id] = (_offMasteryBatch[item.id] || 0) + 1;
            _sess.fish[item.id] = (_sess.fish[item.id] || 0) + placed;
            _sess.totalFish += placed;
            if (entry.type === 'epic') _sess.totalEpic += placed;
            _sess.totalCaught += placed;
          }
        }
      }
    }
  }

  let phaseStartSec = 0;
  const _phaseEnds = [..._sellTimesRelSec, elapsedSec];

  for (let pi = 0; pi < _phaseEnds.length; pi++) {
    const phaseEndSec = _phaseEnds[pi];
    const phaseSec = Math.max(0, phaseEndSec - phaseStartSec);

    if (phaseSec > 0) {
      if (_offTotal >= _offStorageCap && !_autoSellOn) break;
      _analyticalPhase(phaseSec);
    }

    phaseStartSec = phaseEndSec;

    if (_autoSellOn && pi < _phaseEnds.length - 1) {
      const coinsBefore = G.coins;
      doAutoSell();
      _sess.coins += Math.max(0, G.coins - coinsBefore);
      _offTotal = fishPileTotal();
    }
  }

  // Flush fishdex Set back to array (new discoveries added during analytical phase)
  G.fishdex = [..._offFishdexSet];

  // Flush batched mastery increments from the inner loop (avoids FISH_DB.find() per iteration)
  if (!G.masteryData) G.masteryData = {};
  for (const id in _offMasteryBatch) {
    const item = _offItemMap[id];
    if (item && isMasteryEligible(item)) {
      G.masteryData[id] = (G.masteryData[id] || 0) + _offMasteryBatch[id];
    }
  }
  if (Object.keys(_offMasteryBatch).length) _invalidateMasteryCache();

  // Batch-update lifetime stats for parity with online autoTick() (which calls onCatchEvent per catch)
  G.stats.totalFish  = (G.stats.totalFish  || 0) + _sess.totalFish;
  G.stats.totalTrash = (G.stats.totalTrash || 0) + _sess.totalTrash;
  G.stats.totalEpic  = (G.stats.totalEpic  || 0) + _sess.totalEpic;
  G.stats.autoCatchTotal = (G.stats.autoCatchTotal || 0) + _sess.totalCaught;
  if (_sess.totalCaught > 0) G.stats.offlineFishTotal = (G.stats.offlineFishTotal || 0) + _sess.totalCaught;

  // Batch-update daily quest progress for fish and trash (same categories autoTick tracks via onCatchEvent)
  if (_sess.totalCaught > 0) {
    (G.quests.dailyIds || []).forEach(id => {
      const qd = DAILY_QUESTS.find(q => q.id === id);
      if (!qd) return;
      const p = G.quests.dp[id];
      if (!p || p.claimed || p.prog >= qd.goal) return;
      if      (qd.type === 'fish')  p.prog = Math.min(p.prog + _sess.totalFish,  qd.goal);
      else if (qd.type === 'trash') p.prog = Math.min(p.prog + _sess.totalTrash, qd.goal);
    });
    const wq = WEEKLY_QUESTS.find(q => q.id === G.quests.weeklyId);
    if (wq && !G.quests.wp.claimed) {
      if      (wq.type === 'fish')  G.quests.wp.prog = Math.min(G.quests.wp.prog + _sess.totalFish,  wq.goal);
      else if (wq.type === 'trash') G.quests.wp.prog = Math.min(G.quests.wp.prog + _sess.totalTrash, wq.goal);
    }
  }

  saveState();

  if (_sess.totalCaught > 0) {
    setTimeout(() => _showOfflineSummary(_sess), 800);
  }
}

function _showOfflineSummary(sess) {
  const h   = Math.floor(sess.elapsedMs / 3600000);
  const m   = Math.floor((sess.elapsedMs % 3600000) / 60000);
  const dur = h > 0 ? h + 'h ' + m + 'm' : m + 'm';

  const ov = document.getElementById('offline-summary-overlay');
  if (ov) {
    let rows = '<div style="color:var(--color-text-dim);font-size:11px;margin-bottom:8px">Away for ' + dur + '</div>';
    if (sess.totalFish  > 0) rows += '<div>' + sess.totalFish.toLocaleString()  + ' fish</div>';
    if (sess.totalTrash > 0) rows += '<div>' + sess.totalTrash.toLocaleString() + ' trash</div>';
    if (sess.totalPlant > 0) rows += '<div>' + sess.totalPlant.toLocaleString() + ' plants</div>';
    if (sess.coins      > 0) rows += '<div style="color:var(--color-gold)">+' + formatCoins(sess.coins) + 'c sold</div>';
    document.getElementById('offline-summary-body').innerHTML = rows;
    ov.classList.remove('hidden');
    return;
  }
  // Fallback for any environment where the overlay element is missing
  const parts = [];
  if (sess.totalFish  > 0) parts.push(sess.totalFish.toLocaleString()  + ' fish');
  if (sess.totalTrash > 0) parts.push(sess.totalTrash.toLocaleString() + ' trash');
  if (sess.totalPlant > 0) parts.push(sess.totalPlant.toLocaleString() + ' plants');
  if (sess.coins      > 0) parts.push('+' + formatCoins(sess.coins)    + 'c sold');
  showStatus('Welcome back (' + dur + ')! ' + parts.join(' · '), 6000);
}

function closeOfflineSummary() {
  const ov = document.getElementById('offline-summary-overlay');
  if (ov) ov.classList.add('hidden');
  setTimeout(_drainLegendaryPopups, 200);
}

// ─── SUNKEN TREASURE CHESTS ───────────────────────────────────────────────────

function sunkenChestCapacity() { return 1 + ((G.pearlUpgrades || {}).treasurehold || 0); }

function _showChestFullPopup(capacity) {
  const msg = document.getElementById('chest-full-msg');
  if (msg) msg.textContent = 'Chest sank back to the deep — chest storage (' + capacity + ') was at max capacity.';
  const cb = document.getElementById('chest-full-suppress-cb');
  if (cb) cb.checked = false;
  document.getElementById('chest-full-overlay').classList.remove('hidden');
}
function closeChestFullPopup() {
  document.getElementById('chest-full-overlay').classList.add('hidden');
}
function toggleChestFullSuppress(checked) {
  G.chestFullPopupSuppressed = !!checked;
  saveState();
}

function _chestRewardTier(zone) { return zone === 'ocean' ? 'ocean' : 'sea'; }

function _generateChestReward(tier) {
  const hourly = estimateAutoHourlyIncome();
  if (tier === 'ocean') {
    const diamonds = Math.random() < 0.5 ? 1 : 2;
    const mult     = 24 + Math.floor(Math.random() * 49); // 24–72 in-game hours
    return { diamonds, coins: Math.max(50, Math.round(hourly * mult / 24)) };
  }
  const mult = 24 + Math.floor(Math.random() * 25); // 24–48 in-game hours
  return { diamonds: 1, coins: Math.max(50, Math.round(hourly * mult / 24)) };
}

function addSunkenChest(source, zone, pregenReward) {
  if (!G.sunkenChests) G.sunkenChests = [];
  if (G.sunkenChests.length >= sunkenChestCapacity()) {
    if (G.chestFullPopupSuppressed) {
      showStatus('Chest sank back to the deep — chest storage (' + sunkenChestCapacity() + ') was at max capacity.', 3500);
    } else {
      _showChestFullPopup(sunkenChestCapacity());
    }
    return false;
  }
  const tier   = pregenReward ? (pregenReward.tier || _chestRewardTier(zone || G.currentZone)) : _chestRewardTier(zone || G.currentZone);
  const reward = pregenReward ? { diamonds: pregenReward.diamonds, coins: pregenReward.coins } : _generateChestReward(tier);
  const id     = 'chest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  G.sunkenChests.push({ id, source, foundAt: Date.now(), rewardTier: tier, reward });
  if (!G.sunkenTreasureStats) G.sunkenTreasureStats = {};
  const sts = G.sunkenTreasureStats;
  sts.foundTotal = (sts.foundTotal || 0) + 1;
  if (source === 'manual')     sts.foundManual     = (sts.foundManual     || 0) + 1;
  if (source === 'automation') { sts.foundAutomation = (sts.foundAutomation || 0) + 1; syncAch('h_chest_auto', 1); }
  if (source === 'expedition') sts.foundExpedition = (sts.foundExpedition || 0) + 1;
  if (source === 'ghost_ship') sts.foundGhostShip  = (sts.foundGhostShip  || 0) + 1;
  syncAch('h_chest_hold', G.sunkenChests.length);
  return true;
}

function openSunkenChest(chestId) {
  const chest = (G.sunkenChests || []).find(c => c.id === chestId);
  if (!chest) return;
  const r = chest.reward;
  G.diamonds = (G.diamonds || 0) + r.diamonds;
  _earnCoins(r.coins);
  if (!G.sunkenTreasureStats) G.sunkenTreasureStats = {};
  const sts = G.sunkenTreasureStats;
  sts.opened        = (sts.opened        || 0) + 1;
  sts.diamondsEarned= (sts.diamondsEarned|| 0) + r.diamonds;
  sts.coinsEarned   = (sts.coinsEarned   || 0) + r.coins;
  G.sunkenChests = (G.sunkenChests || []).filter(c => c.id !== chestId);
  syncAch('h_chest_opened',   sts.opened || 0);
  syncAch('h_chest_diamonds', sts.diamondsEarned || 0);
  if ((sts.coinsEarned || 0) >= 10000000) syncAch('h_chest_coins', 1);
  saveState(); updateHUD();
  _showChestOpenPopup(chest, r);
}

function _showChestOpenPopup(chest, reward) {
  const overlay = document.getElementById('chest-open-overlay');
  if (!overlay) return;
  overlay.classList.remove('hidden');
  // Load GIF with loop extension stripped — plays once and holds last frame
  const gif = document.getElementById('chest-open-gif');
  if (gif) {
    gif.src = '';
    _loadGifOnce('img/icons/Sunken treasure opening no background.gif').then(function(url) {
      const el = document.getElementById('chest-open-gif');
      if (el) el.src = url;
    });
  }
  const rewWrap = document.getElementById('chest-reward-wrap');
  if (rewWrap) rewWrap.classList.add('hidden');
  const rewardEl = document.getElementById('chest-open-reward');
  if (rewardEl) {
    const tierLabel = chest.rewardTier === 'ocean' ? 'Ocean Tier' : 'Sea Tier';
    const srcLabel  = (chest.source.charAt(0).toUpperCase() + chest.source.slice(1)).replace(/_/g, ' ');
    rewardEl.innerHTML =
      `<div style="font-size:16px;margin-bottom:8px;color:#f5c842;font-weight:bold">Treasure Found!</div>` +
      `<div style="font-size:13px;color:#e0e0e0;margin-bottom:4px">` +
        `+${reward.diamonds} <img src="img/icons/Diamond icon.png" class="diamond-icon-sm" alt=""> Diamond${reward.diamonds>1?'s':''}</div>` +
      `<div style="font-size:15px;color:#f5c842;font-weight:bold">+${formatCoins(reward.coins)}c</div>` +
      `<div style="font-size:11px;color:#888;margin-top:6px">Found by ${srcLabel}</div>`;
  }
  setTimeout(() => { if (rewWrap) rewWrap.classList.remove('hidden'); }, 1500);
}

function closeChestOpenPopup() {
  const overlay = document.getElementById('chest-open-overlay');
  if (overlay) overlay.classList.add('hidden');
  if (document.getElementById('screen-market').classList.contains('active')) renderMarket();
}

function showSeaComicPopup() {
  const overlay = document.getElementById('sea-comic-overlay');
  if (overlay) overlay.classList.remove('hidden');
}
function closeSeaComicPopup() {
  const overlay = document.getElementById('sea-comic-overlay');
  if (overlay) overlay.classList.add('hidden');
}

function openEvInfo()  { document.getElementById('ev-info-overlay').classList.remove('hidden'); }
function closeEvInfo() { document.getElementById('ev-info-overlay').classList.add('hidden'); }

function enterMaelstromFromZones() {
  if (typeof canAccessMaelstromAndAbyss !== 'function' || !canAccessMaelstromAndAbyss()) return;
  if (!G.maelstromComicSeen) {
    G.maelstromComicSeen = true;
    saveState();
    showMaelstromComicPopup();
    return;
  }
  if (typeof enterMaelstromDebug === 'function') enterMaelstromDebug();
}
function showMaelstromComicPopup() {
  const overlay = document.getElementById('maelstrom-comic-overlay');
  if (overlay) overlay.classList.remove('hidden');
}
function closeMaelstromComicPopup() {
  const overlay = document.getElementById('maelstrom-comic-overlay');
  if (overlay) overlay.classList.add('hidden');
  if (typeof enterMaelstromDebug === 'function') enterMaelstromDebug();
}

// ── Expedition Vessel ─────────────────────────────────────────────────────────

const EXPEDITION_VESSEL_PRICES = [
  1000000000,    //  #1 —   1B  (meaningful first investment at Sea)
  5000000000,    //  #2 —   5B
  20000000000,   //  #3 —  20B
  100000000000,  //  #4 — 100B
  500000000000,  //  #5 — 500B  (bridge to Ocean)
  2000000000000, //  #6 —   2T
  8000000000000, //  #7 —   8T
  25000000000000,//  #8 —  25T
  75000000000000,//  #9 —  75T
  200000000000000,// #10 — 200T  (endgame)
];
const EXPEDITION_VESSEL_MAX      = 10;
const EXPEDITION_VESSEL_INTERVAL = 30 * 3600000; // 30 real hours = 30 in-game days

function expeditionVesselCost() {
  const idx = (G.expeditionVessels || []).length;
  return EXPEDITION_VESSEL_PRICES[Math.min(idx, EXPEDITION_VESSEL_PRICES.length - 1)];
}

function _evBulkCost(qty) {
  const count = (G.expeditionVessels || []).length;
  let total = 0;
  for (let i = 0; i < qty; i++) {
    const idx = Math.min(count + i, EXPEDITION_VESSEL_PRICES.length - 1);
    total += EXPEDITION_VESSEL_PRICES[idx];
  }
  return applyDiscount(total);
}

function _evMaxAffordable() {
  const count = (G.expeditionVessels || []).length;
  const remaining = EXPEDITION_VESSEL_MAX - count;
  let total = 0, n = 0;
  while (n < remaining) {
    const idx = Math.min(count + n, EXPEDITION_VESSEL_PRICES.length - 1);
    total += EXPEDITION_VESSEL_PRICES[idx];
    if (total > (G.coins || 0)) break;
    n++;
  }
  return n;
}

function buyExpeditionVessel(qty) {
  if (!G.sunkenTreasureUnlocked) return;
  if (!qty || qty < 1) qty = 1;
  const count = (G.expeditionVessels || []).length;
  const canBuy = Math.min(qty, EXPEDITION_VESSEL_MAX - count);
  if (canBuy < 1) { showStatus('Maximum 10 Expedition Vessels!', 1500); return; }
  const cost = _evBulkCost(canBuy);
  if ((G.coins || 0) < cost) { showStatus('Not enough coins!', 1500); return; }
  _spendCoins(cost);
  if (!G.expeditionVessels) G.expeditionVessels = [];
  for (let i = 0; i < canBuy; i++) {
    G.expeditionVessels.push({ id: 'ev_' + Date.now() + i, purchasedAt: Date.now(), nextChestAt: Date.now() + EXPEDITION_VESSEL_INTERVAL });
  }
  saveState(); updateHUD();
  renderShop('automation');
  // Each EV increases Ghost Ship capacity — refresh GS spawn if newly eligible
  if (count === 0 && G.sunkenTreasureUnlocked) _gsStartup();
  showStatus('Expedition Vessel' + (canBuy > 1 ? ' ×' + canBuy : '') + ' deployed!', 2500);
}

let _expeditionCheckInterval = null;

function startExpeditionTimer() {
  if (_expeditionCheckInterval) clearInterval(_expeditionCheckInterval);
  _expeditionCheckInterval = setInterval(_checkExpeditionVessels, 60000);
  _checkExpeditionVessels(); // check immediately on start
}

function _checkExpeditionVessels() {
  if (!G.expeditionVessels || !G.expeditionVessels.length) return;
  const now = Date.now();
  let changed = false;
  for (const v of G.expeditionVessels) {
    if (now >= v.nextChestAt) {
      if (addSunkenChest('expedition', 'sea')) {
        showStatus('Expedition returned with a Sunken Treasure Chest!', 3000);
      }
      v.nextChestAt = now + EXPEDITION_VESSEL_INTERVAL;
      changed = true;
    }
  }
  if (changed) {
    saveState(); updateHUD();
    if (document.getElementById('screen-market').classList.contains('active')) renderMarket();
  }
}

// ─── GHOST SHIP ───────────────────────────────────────────────────────────────

// Strips the NETSCAPE2.0 infinite-loop extension from a GIF binary.
// Binary data is cached after first fetch. A FRESH blob URL is created each
// call so the browser always plays from frame 1 (same blob URL = no replay).
const _gifStripData = {}; // url → stripped Uint8Array (or null on error)

async function _loadGifOnce(url) {
  if (!_gifStripData.hasOwnProperty(url)) {
    _gifStripData[url] = null; // mark as loading
    try {
      const buf = await fetch(url).then(function(r) { return r.arrayBuffer(); });
      const src = new Uint8Array(buf);
      let ls = -1, le = -1;
      for (let i = 0; i < src.length - 13; i++) {
        if (src[i]    === 0x21 && src[i+1]  === 0xFF && src[i+2]  === 0x0B &&
            src[i+3]  === 0x4E && src[i+4]  === 0x45 && src[i+5]  === 0x54 &&
            src[i+6]  === 0x53 && src[i+7]  === 0x43 && src[i+8]  === 0x41 &&
            src[i+9]  === 0x50 && src[i+10] === 0x45 &&
            src[i+11] === 0x32 && src[i+12] === 0x2E && src[i+13] === 0x30) {
          ls = i;
          let j = i + 14;
          while (j < src.length) { const sz = src[j++]; if (sz === 0) break; j += sz; }
          le = j;
          break;
        }
      }
      if (ls >= 0) {
        const a = src.slice(0, ls), b = src.slice(le);
        const d = new Uint8Array(a.length + b.length);
        d.set(a); d.set(b, a.length);
        _gifStripData[url] = d;
      } else {
        _gifStripData[url] = src; // no loop extension — already plays once
      }
    } catch(e) { /* _gifStripData[url] stays null → fallback below */ }
  }

  const data = _gifStripData[url];
  if (!data) return url; // fallback: original URL (may loop)
  // Fresh blob URL every call — browser starts animation from frame 1
  return URL.createObjectURL(new Blob([data], { type: 'image/gif' }));
}

const GS_ELIGIBLE_ZONES    = ['sea', 'ocean'];
const GS_IDLE_MS           = 1 * 3600000;                    // 24 in-game h = 1 real hour
const GS_EXPEDITION_MS     = 3 * 3600000;                    // 72 in-game h = 3 real hours
const GS_SPAWN_INTERVAL_MS = 1 * 3600000;                   // roll every 1 real hour
const GS_SPAWN_CHANCE      = 0.60;

const GS_SPAWN_POSITIONS = {
  sea:   [{ x:18, y:18 }, { x:76, y:16 }, { x:84, y:58 }, { x:14, y:62 }, { x:50, y:74 }],
  ocean: [{ x:10, y:10 }, { x:10, y:70 }, { x:60, y:90 }, { x:90, y:70 }, { x:90, y:30 }],
};
const GS_FALLBACK_POSITIONS = [{ x:18, y:18 }, { x:76, y:16 }, { x:84, y:58 }, { x:14, y:62 }, { x:50, y:74 }];

let _gsSpawnTimeout = null;

const GS_COLS    = 8;
const GS_FRAME_W = 125;  // 221 × 0.75 × 0.75
const GS_FRAME_H = 169;  // 300 × 0.75 × 0.75
const GS_FPS     = 10;

// Per-ship flap tracking (unused for GIF sprites, kept for compat)
const _gsFlapIvs = {};
function _gsStopFlap(shipId) {
  if (shipId) { clearInterval(_gsFlapIvs[shipId]); delete _gsFlapIvs[shipId]; }
  else { Object.keys(_gsFlapIvs).forEach(k => { clearInterval(_gsFlapIvs[k]); delete _gsFlapIvs[k]; }); }
}

// Max simultaneous Ghost Ships = 1 per Expedition Vessel owned, capped at 5
function _gsMaxShips() {
  return Math.min(5, Math.max(1, (G.expeditionVessels || []).length));
}

function _gsCanSpawn() {
  if (!G.sunkenTreasureUnlocked) return false;
  if (!GS_ELIGIBLE_ZONES.includes(G.currentZone)) return false;
  if (!G.ghostShips) G.ghostShips = [];
  return G.ghostShips.length < _gsMaxShips();
}

function _gsUsedPositions(zone) {
  return new Set((G.ghostShips || []).filter(s => s.zone === zone).map(s => s.posIndex));
}

function _gsDebugSpawn() {
  if (!G.ghostShips) G.ghostShips = [];
  const zone      = GS_ELIGIBLE_ZONES.includes(G.currentZone) ? G.currentZone : 'sea';
  const positions = GS_SPAWN_POSITIONS[zone] || GS_FALLBACK_POSITIONS;
  const usedIdx   = _gsUsedPositions(zone);
  const available = positions.map((_,i) => i).filter(i => !usedIdx.has(i));
  const posIndex  = available.length ? available[Math.floor(Math.random() * available.length)] : 0;
  const now       = Date.now();
  const id        = 'gs_debug_' + now;
  const ship      = { id, state:'idle', zone, posIndex, spawnedAt:now, despawnAt:now + GS_IDLE_MS, expeditionEndAt:0, reward:null };
  ship.reward     = _gsGenerateReward(zone);
  G.ghostShips.push(ship);
  saveState();
  _gsRenderShip(ship);
  showStatus('DEBUG: Ghost Ship spawned!', 2000);
}

function _gsSpawnRoll() {
  if (!G.ghostShips) G.ghostShips = [];
  // Always re-schedule next roll regardless of outcome
  _gsScheduleNext();

  if (!G.sunkenTreasureUnlocked) return;
  // Spawn in any unlocked eligible zone — not just the one the player is currently viewing.
  // Previously this check used G.currentZone, which caused ships to never spawn when the
  // player was in Pond/River/Lake/Bay, even with Sea/Ocean fully unlocked.
  const _gsUnlockedEligible = GS_ELIGIBLE_ZONES.filter(z => isZoneUnlocked(z));
  if (!_gsUnlockedEligible.length) return;
  if (G.ghostShips.length >= _gsMaxShips()) return;
  if (Math.random() >= GS_SPAWN_CHANCE) return;

  const zone      = _gsUnlockedEligible[Math.floor(Math.random() * _gsUnlockedEligible.length)];
  const positions = GS_SPAWN_POSITIONS[zone] || GS_FALLBACK_POSITIONS;
  const usedIdx   = _gsUsedPositions(zone);
  const available = positions.map((_,i) => i).filter(i => !usedIdx.has(i));
  if (!available.length) return;

  const posIndex = available[Math.floor(Math.random() * available.length)];
  const now      = Date.now();
  const id       = 'gs_' + now + '_' + Math.random().toString(36).substr(2, 4);
  const ship     = { id, state:'idle', zone, posIndex, spawnedAt:now, despawnAt:now + GS_IDLE_MS, expeditionEndAt:0, reward:null };
  G.ghostShips.push(ship);
  saveState();
  syncAch('h_gs_spotted', 1);
  _gsRenderShip(ship);
  showStatus('A Ghost Ship was spotted nearby!', 3000);
}

function _gsScheduleNext() {
  if (_gsSpawnTimeout) clearTimeout(_gsSpawnTimeout);
  const interval = getPearlGhostWhispererInterval();
  G.ghostShipNextSpawnAt = Date.now() + interval;
  _autoSaveDirty = true;
  _gsSpawnTimeout = setTimeout(_gsSpawnRoll, interval);
}

// Lightweight timer re-attach — called on foreground resume to recover killed Android setTimeouts.
// Does NOT re-render ships (use _gsStartup for that).
function _gsReattachTimer() {
  if (!G.sunkenTreasureUnlocked) return;
  if (_gsSpawnTimeout) return; // timer still alive, nothing to do
  const now = Date.now();
  if (!G.ghostShipNextSpawnAt || G.ghostShipNextSpawnAt <= 0) {
    _gsScheduleNext();
  } else if (now >= G.ghostShipNextSpawnAt) {
    G.ghostShipNextSpawnAt = 0;
    setTimeout(_gsSpawnRoll, 1500);
  } else {
    const delay = Math.min(G.ghostShipNextSpawnAt - now, getPearlGhostWhispererInterval());
    _gsSpawnTimeout = setTimeout(_gsSpawnRoll, delay);
  }
}

function _gsReattachTimer() {
  if (!G.sunkenTreasureUnlocked) return;
  if (_gsSpawnTimeout) return;
  const now = Date.now();
  if (!G.ghostShipNextSpawnAt || G.ghostShipNextSpawnAt <= 0) {
    _gsScheduleNext();
  } else if (now >= G.ghostShipNextSpawnAt) {
    G.ghostShipNextSpawnAt = 0;
    setTimeout(_gsSpawnRoll, 1500);
  } else {
    const delay = Math.min(G.ghostShipNextSpawnAt - now, getPearlGhostWhispererInterval());
    _gsSpawnTimeout = setTimeout(_gsSpawnRoll, delay);
  }
}

function _gsStartup() {
  if (_gsSpawnTimeout) { clearTimeout(_gsSpawnTimeout); _gsSpawnTimeout = null; }
  if (!G.sunkenTreasureUnlocked) return;
  if (!G.ghostShips) G.ghostShips = [];

  // Render all ships that are already in the save
  G.ghostShips.forEach(ship => _gsRenderShip(ship));

  // Cap next spawn time to the new 2-hour interval in case it was longer (old saves)
  const now    = Date.now();
  const maxNext = now + GS_SPAWN_INTERVAL_MS;
  if (!G.ghostShipNextSpawnAt || G.ghostShipNextSpawnAt <= 0) {
    _gsScheduleNext();
  } else if (now >= G.ghostShipNextSpawnAt) {
    setTimeout(_gsSpawnRoll, 1500);
  } else {
    const delay = Math.min(G.ghostShipNextSpawnAt, maxNext) - now;
    _gsSpawnTimeout = setTimeout(_gsSpawnRoll, delay);
  }
}

// Remove all ghost ship DOM elements (used on prestige / zone change)
function _gsRemoveAllDom() {
  _gsStopFlap();
  document.querySelectorAll('[id^="ghost-ship-obj-"]').forEach(el => el.remove());
}

// Re-render all ships for current zone (called on zone switch)
function _gsRender() {
  _gsRemoveAllDom();
  if (!G.ghostShips) return;
  G.ghostShips.filter(gs => gs.zone === G.currentZone).forEach(gs => _gsRenderShip(gs));
}

function _gsRenderShip(gs) {
  const elId    = 'ghost-ship-obj-' + gs.id;
  const imgId   = 'ghost-ship-img-' + gs.id;
  const labelId = 'ghost-ship-label-' + gs.id;
  const ex = document.getElementById(elId);
  if (ex) ex.remove();
  _gsStopFlap(gs.id);
  if (gs.zone !== G.currentZone) return;

  const positions = GS_SPAWN_POSITIONS[gs.zone] || GS_FALLBACK_POSITIONS;
  const pos       = positions[gs.posIndex] || positions[0];

  const el = document.createElement('div');
  el.id = elId;
  el.style.cssText = 'position:absolute;left:' + pos.x + '%;top:' + pos.y + '%;transform:translate(-50%,-50%);z-index:0;cursor:pointer;text-align:center;pointer-events:auto;user-select:none;-webkit-user-select:none;background:transparent;';
  el.addEventListener('click', () => _gsOnTap(gs.id));

  const sprite = document.createElement('img');
  sprite.id  = imgId;
  sprite.style.cssText = 'display:block;margin:0 auto;width:' + GS_FRAME_W + 'px;height:' + GS_FRAME_H + 'px;image-rendering:pixelated;';
  _loadGifOnce('img/icons/Ghost ship animation.gif').then(function(url) {
    const el2 = document.getElementById(imgId);
    if (el2) { el2.src = url; playSfx(sfxGhostShip); }
  });

  const labelDiv = document.createElement('div');
  labelDiv.id = labelId;
  labelDiv.style.cssText = 'font-size:14px;color:#ddd;text-shadow:0 1px 4px rgba(0,0,0,0.9),0 0 6px rgba(0,0,0,0.7);line-height:1.35;margin-top:3px;font-family:GameFont,Pixeloid,monospace;font-weight:bold;';

  el.appendChild(sprite);
  el.appendChild(labelDiv);

  const waterArea = document.getElementById('water-area');
  if (waterArea) waterArea.appendChild(el);

  _gsUpdateLabel(gs.id);
}

function _gsUpdateLabel(shipId) {
  const gs      = (G.ghostShips || []).find(s => s.id === shipId);
  const labelEl = document.getElementById('ghost-ship-label-' + shipId);
  if (!labelEl || !gs) return;
  const now = Date.now();
  if (gs.state === 'idle') {
    labelEl.innerHTML = '<span style="color:#c8e8ff">Ghost Ship</span>';
  } else if (gs.state === 'expedition') {
    const remMs = Math.max(0, gs.expeditionEndAt - now);
    if (remMs > 0) {
      const igSec = remMs / 1000 * 24;
      const igH   = Math.floor(igSec / 3600);
      const igM   = Math.floor((igSec % 3600) / 60);
      labelEl.innerHTML = 'Expedition<br>' + igH + 'h ' + String(igM).padStart(2, '0') + 'm';
    } else {
      labelEl.innerHTML = '<span style="color:#f5c842">Tap to claim!</span>';
    }
  } else if (gs.state === 'complete') {
    const holdFull = (G.sunkenChests || []).length >= sunkenChestCapacity();
    labelEl.innerHTML = holdFull
      ? '<span style="color:#ff9090">Hold full!</span>'
      : '<span style="color:#f5c842">Tap to claim!</span>';
  }
}

function _gsTick() {
  if (!G.ghostShips || !G.ghostShips.length) return;
  const now = Date.now();
  G.ghostShips = G.ghostShips.filter(gs => {
    if (gs.state === 'idle' && gs.despawnAt > 0 && now >= gs.despawnAt) {
      _autoSaveDirty = true;
      const el = document.getElementById('ghost-ship-obj-' + gs.id);
      if (el) el.remove();
      _gsStopFlap(gs.id);
      return false;
    }
    if (gs.state === 'expedition' && gs.expeditionEndAt > 0 && now >= gs.expeditionEndAt) {
      gs.state = 'complete';
      _autoSaveDirty = true;
      _gsUpdateLabel(gs.id);
      showStatus('Ghost Ship expedition complete! Tap the ship to claim!', 3500);
    } else {
      _gsUpdateLabel(gs.id);
    }
    return true;
  });
}

// Tracks which ship's reward popup is currently open
let _gsCurrentClaimId = null;

function _gsOnTap(shipId) {
  const gs = (G.ghostShips || []).find(s => s.id === shipId);
  if (!gs) return;
  const now = Date.now();

  if (gs.state === 'idle') {
    gs.state           = 'expedition';
    gs.expeditionEndAt = now + getGsExpeditionMs();
    gs.despawnAt       = 0;
    gs.failed          = Math.random() < 0.05;
    gs.reward          = _gsGenerateReward(gs.zone);
    saveState();
    _gsUpdateLabel(gs.id);
    showStatus('Ghost Ship expedition started! Returns in 72 in-game hours.', 3000);
    return;
  }

  if (gs.state === 'expedition') {
    const remMs = Math.max(0, gs.expeditionEndAt - now);
    if (remMs > 0) {
      const igSec = remMs / 1000 * 24;
      const igH   = Math.floor(igSec / 3600);
      const igM   = Math.floor((igSec % 3600) / 60);
      showStatus('Expedition returns in ' + igH + 'h ' + String(igM).padStart(2, '0') + 'm…', 2200);
      return;
    }
    gs.state = 'complete';
    saveState();
    _gsUpdateLabel(gs.id);
  }

  if (gs.state === 'complete') {
    if (gs.failed) {
      _gsCurrentClaimId = gs.id;
      _gsShowFailPopup(gs);
      return;
    }
    // Block claim if Treasure Hold is full (chest is guaranteed)
    if ((G.sunkenChests || []).length >= sunkenChestCapacity()) {
      showStatus('Treasure Hold is full! Open a chest to make space.', 2500);
      _gsUpdateLabel(gs.id);
      return;
    }
    _gsCurrentClaimId = gs.id;
    _gsShowRewardPopup(gs);
  }
}

function _gsGenerateReward(zone) {
  const hourly    = estimateAutoHourlyIncome();
  const multHours = 24 + Math.floor(Math.random() * 25); // in-game hours (1 real hour = 24 ig hours)
  const coins     = Math.max(50, Math.round(hourly * multHours / 24));
  const r = Math.random();
  const automationId = r < 0.50 ? 'river_net'
                     : r < 0.80 ? 'ancient_fisherman'
                     :            'ancient_boat';
  // Pre-generate chest so reward never rerolls on popup re-open or save reload
  const chestTier = _chestRewardTier(zone || G.currentZone);
  const chest = Object.assign({ tier: chestTier }, _generateChestReward(chestTier));
  const storage = Math.random() < 0.10 ? { id: 'ancient_frozen_storage' } : null;
  return { coins, chest, automation: { id: automationId }, storage };
}

function _gsShowRewardPopup(gs) {
  if (!gs || !gs.reward) return;
  const r       = gs.reward;
  const overlay = document.getElementById('ghost-ship-reward-overlay');
  if (!overlay) return;

  // Reset elements to success state
  const titleEl = document.getElementById('gs-reward-title');
  if (titleEl) { titleEl.textContent = 'Ghost Ship'; titleEl.style.color = '#c8e8ff'; }
  const subtitleEl = document.getElementById('gs-reward-subtitle');
  if (subtitleEl) subtitleEl.textContent = 'Expedition returned with salvage and a Treasure Chest!';
  const imgEl = document.getElementById('ghost-ship-reward-img');
  if (imgEl) imgEl.style.display = '';
  const btn = document.getElementById('gs-reward-btn');
  if (btn) { btn.textContent = 'Claim Salvage'; btn.onclick = gsClaimReward; }

  const autoDef  = r.automation ? AUTOMATION.find(a => a.id === r.automation.id) : null;
  const autoName = autoDef ? autoDef.name : null;
  const autoImg  = autoDef ? autoDef.img  : null;

  const autoLine = autoName
    ? '<div style="margin-bottom:10px;padding:9px 10px;background:rgba(255,255,255,0.07);border-radius:8px;display:flex;align-items:center;gap:10px">'
      + (autoImg ? '<img src="' + autoImg + '" style="width:36px;height:36px;object-fit:contain;image-rendering:pixelated;" alt="">' : '')
      + '<div><div style="font-size:15px;font-weight:bold;color:#90e890">' + autoName + '</div>'
      + '<div style="font-size:11px;color:#aaa;">Added to your fleet!</div></div>'
      + '</div>'
    : '';

  const chestLine = r.chest
    ? '<div style="margin-bottom:10px;padding:9px 10px;background:rgba(255,215,0,0.08);border-radius:8px;display:flex;align-items:center;gap:10px">'
      + '<img src="img/Trash/Sunken Chest.png" style="width:36px;height:36px;object-fit:contain;image-rendering:pixelated;" alt="" onerror="this.style.display=\'none\'">'
      + '<div><div style="font-size:15px;font-weight:bold;color:#f5c842">Sunken Treasure Chest</div>'
      + '<div style="font-size:11px;color:#aaa;">Added to Treasure Hold!</div></div>'
      + '</div>'
    : '';

  const storageDef = r.storage ? STORAGE_ITEMS.find(s => s.id === r.storage.id) : null;
  const storageLine = storageDef
    ? '<div style="margin-bottom:10px;padding:9px 10px;background:rgba(126,207,255,0.08);border-radius:8px;display:flex;align-items:center;gap:10px">'
      + '<img src="' + storageDef.img + '" style="width:36px;height:36px;object-fit:contain;image-rendering:pixelated;" alt="" onerror="this.style.display=\'none\'">'
      + '<div><div style="font-size:15px;font-weight:bold;color:#7ecfff">' + storageDef.name + '</div>'
      + '<div style="font-size:11px;color:#aaa;">' + storageDef.desc + ' added!</div></div>'
      + '</div>'
    : '';

  document.getElementById('ghost-ship-reward-body').innerHTML =
    autoLine
    + storageLine
    + chestLine
    + '<div style="font-size:20px;font-weight:bold;color:#f5c842">+' + formatCoins(r.coins) + 'c</div>';

  overlay.classList.remove('hidden');
}

function gsClaimReward() {
  const shipId = _gsCurrentClaimId;
  _gsCurrentClaimId = null;
  const gs = (G.ghostShips || []).find(s => s.id === shipId);
  if (!gs || !gs.reward) {
    const ov = document.getElementById('ghost-ship-reward-overlay');
    if (ov) ov.classList.add('hidden');
    return;
  }
  const r    = gs.reward;
  const zone = gs.zone || G.currentZone;

  // Final capacity check (may have changed between popup open and claim)
  if ((G.sunkenChests || []).length >= sunkenChestCapacity()) {
    const ov = document.getElementById('ghost-ship-reward-overlay');
    if (ov) ov.classList.add('hidden');
    showStatus('Treasure Hold is full! Open a chest first.', 2500);
    _gsUpdateLabel(gs.id);
    return;
  }

  _earnCoins(r.coins);

  G.stats.ghostShipExpeditions = (G.stats.ghostShipExpeditions || 0) + 1;
  syncAch('h_gs_expeditions', G.stats.ghostShipExpeditions);

  if (r.automation) {
    G.ownedAutomation.push({ id: r.automation.id, zone, purchasedAt: Date.now(), source: 'ghost_ship' });
    if (zone === G.currentZone) updateZoneBg(G.currentZone);
    if (r.automation.id === 'ancient_boat') syncAch('h_gs_boat', 1);
    const gsOwned = new Set((G.ownedAutomation || []).filter(a => a.source === 'ghost_ship').map(a => a.id));
    if (gsOwned.has('river_net') && gsOwned.has('ancient_fisherman') && gsOwned.has('ancient_boat')) syncAch('h_gs_all_units', 1);
  }

  // Add pre-generated chest (never rerolled)
  if (r.chest) addSunkenChest('ghost_ship', zone, r.chest);

  if (r.storage) {
    if (!G.ownedStorage) G.ownedStorage = [];
    G.ownedStorage.push({ id: r.storage.id, purchasedAt: Date.now(), source: 'ghost_ship' });
  }

  G.ghostShips = (G.ghostShips || []).filter(s => s.id !== gs.id);
  saveState();
  updateHUD();

  _gsStopFlap(gs.id);
  const el = document.getElementById('ghost-ship-obj-' + gs.id);
  if (el) el.remove();

  const overlay = document.getElementById('ghost-ship-reward-overlay');
  if (overlay) overlay.classList.add('hidden');

  showStatus('Ghost Ship salvage collected!', 2000);
}

function _gsOverlayBackdropClick() {
  const gs = _gsCurrentClaimId ? (G.ghostShips || []).find(s => s.id === _gsCurrentClaimId) : null;
  if (gs && gs.failed) gsClaimFail();
  else gsClaimReward();
}

function _gsShowFailPopup(gs) {
  const overlay = document.getElementById('ghost-ship-reward-overlay');
  if (!overlay) return;

  const titleEl = document.getElementById('gs-reward-title');
  if (titleEl) { titleEl.textContent = 'Expedition Failed'; titleEl.style.color = '#ff6b6b'; }
  const subtitleEl = document.getElementById('gs-reward-subtitle');
  if (subtitleEl) subtitleEl.textContent = 'Expedition failed. Our expedition ship sunk and needs replacement from the shop.';
  const imgEl = document.getElementById('ghost-ship-reward-img');
  if (imgEl) imgEl.style.display = 'none';

  document.getElementById('ghost-ship-reward-body').innerHTML =
    '<div style="font-size:14px;color:var(--color-text-dim);margin-top:8px;margin-bottom:4px">'
    + 'Your expedition vessel was lost at sea. Buy a replacement from the shop.'
    + '</div>';

  const btn = document.getElementById('gs-reward-btn');
  if (btn) {
    btn.textContent = 'Go to Shop';
    btn.onclick = function() { gsClaimFail(); showScreen('shop'); };
  }

  overlay.classList.remove('hidden');
}

function gsClaimFail() {
  const shipId = _gsCurrentClaimId;
  _gsCurrentClaimId = null;
  const overlay = document.getElementById('ghost-ship-reward-overlay');
  if (overlay) overlay.classList.add('hidden');
  G.ghostShips = (G.ghostShips || []).filter(s => s.id !== shipId);
  // Remove the expedition vessel that was lost
  if (G.expeditionVessels && G.expeditionVessels.length > 0) {
    G.expeditionVessels.splice(G.expeditionVessels.length - 1, 1);
  }
  saveState();
  updateHUD();
  _gsStopFlap(shipId);
  const el = document.getElementById('ghost-ship-obj-' + shipId);
  if (el) el.remove();
  showStatus('Expedition vessel lost. Buy a replacement from the shop.', 3500);
}

// ─── GHOST SHIP DEBUG ─────────────────────────────────────────────────────────


// ─── FISHDEX ──────────────────────────────────────────────────────────────────

let _fishdexZone = null;  // null = use G.currentZone on first open
let _fishdexMode = 'auto'; // 'auto' | 'manual'

const RARITY_COLORS = {
  common: '#9d9d9d', uncommon: '#4caf50', rare: '#2196f3',
  epic: '#9c27b0', legendary: '#f4c430', plant: '#2e7d32', trash: '#546e7a',
};

function renderFishdexTabs() {
  const tabRow = document.getElementById('fishdex-tab-row');
  if (!tabRow) return;
  tabRow.innerHTML = '';

  // ── Mode toggle (Automation / Manual) ──────────────────────────────────────
  const modeWrap = document.createElement('div');
  modeWrap.className = 'fishdex-mode-toggle';
  ['auto', 'manual'].forEach(mode => {
    const btn = document.createElement('button');
    btn.className = 'fishdex-mode-btn' + (mode === _fishdexMode ? ' active' : '');
    btn.textContent = mode === 'auto' ? 'Automation' : 'Manual';
    btn.addEventListener('click', () => {
      _fishdexMode = mode;
      renderFishdexTabs();
      renderFishdex();
    });
    modeWrap.appendChild(btn);
  });
  tabRow.appendChild(modeWrap);

  // ── Zone tabs ───────────────────────────────────────────────────────────────
  const zoneWrap = document.createElement('div');
  zoneWrap.className = 'fishdex-zone-tabs';
  ZONE_DATA.forEach(z => {
    const unlocked = isZoneUnlocked(z.id);
    const btn = document.createElement('button');
    btn.className = 'fishdex-tab' +
      (z.id === _fishdexZone ? ' active' : '') +
      (!unlocked ? ' locked' : '');
    btn.textContent = z.name;
    if (unlocked) {
      btn.addEventListener('click', () => {
        _fishdexZone = z.id;
        renderFishdexTabs();
        renderFishdex();
      });
    }
    zoneWrap.appendChild(btn);
  });
  tabRow.appendChild(zoneWrap);
}

function _renderMasteryPanel(zone, container) {
  const pts = getZoneMasteryPoints(zone);
  const maxPts = 150;
  const bonuses = ZONE_MASTERY_BONUSES[zone] || [];
  const panel = document.createElement('div');
  panel.className = 'mastery-zone-panel';
  const pct = Math.min(100, (pts / maxPts) * 100).toFixed(0);
  let bonusRows = bonuses.map((b, i) => {
    const unlocked = pts >= MASTERY_THRESHOLDS[i];
    return `<span class="mastery-bonus-tag${unlocked ? ' unlocked' : ''}">${b.label}</span>`;
  }).join('');

  // Legendary progress for this zone
  const w1Pool    = FISH_DB.filter(f => f.w1legendary && f.zones.includes(zone));
  const w1Caught  = w1Pool.filter(f => G.fishdex.includes(f.id)).length;
  const w1Total   = w1Pool.length;
  const legBonus  = w1Caught; // +1% each
  const legComplete = w1Caught === w1Total && w1Total > 0;
  const legHtml   = w1Total > 0 ? `
    <div class="mastery-zone-title" style="margin-top:8px;padding-top:8px;border-top:1px solid #333;margin-bottom:0${legComplete ? ';color:#f4c430' : ''}">
      &#9733; Legendary Fish: ${w1Caught} / ${w1Total}
      <span class="mastery-zone-pts" style="margin-left:8px">Prestige Pearl Bonus: +${legBonus}%</span>
    </div>` : '';

  panel.innerHTML = `
    <div class="mastery-zone-title">Automation Mastery <span class="mastery-zone-pts">${pts}/${maxPts} pts</span></div>
    <div class="mastery-zone-bar-wrap"><div class="mastery-zone-bar" style="width:${pct}%"></div></div>
    <div class="mastery-bonus-row">${bonusRows}</div>
    ${legHtml}
  `;
  container.appendChild(panel);
}

function _formatTimeWindow(tw) {
  if (!tw) return null;
  const pad = n => String(n).padStart(2, '0');
  return pad(tw.from) + ':00 – ' + pad(tw.to) + ':00';
}

function _renderManualFishdex(zone, content, progress) {
  const manualFish = FISH_DB.filter(f => isManualOnlyFish(f) && f.zones.includes(zone));
  if (!manualFish.length) {
    const empty = document.createElement('div');
    empty.className = 'fishdex-section-header';
    empty.style.opacity = '0.5';
    empty.textContent = 'No manual-only fish in this zone yet.';
    content.appendChild(empty);
    if (progress) progress.textContent = '0 / 0';
    return;
  }

  const discoveredCount = manualFish.filter(f => (G.manualFishdex || {})[f.id]?.discovered).length;
  if (progress) progress.textContent = discoveredCount + ' / ' + manualFish.length;

  // Summary panel
  const summary = document.createElement('div');
  summary.className = 'manual-fishdex-summary';
  summary.innerHTML = `
    <div class="manual-summary-title">Manual Fishdex</div>
    <div class="manual-summary-sub">These fish require active (manual) fishing — automation cannot catch them</div>
    <div class="manual-summary-progress">
      <div class="manual-summary-bar-wrap">
        <div class="manual-summary-bar" style="width:${manualFish.length ? Math.round(discoveredCount/manualFish.length*100) : 0}%"></div>
      </div>
      <span class="manual-summary-count">${discoveredCount} / ${manualFish.length} discovered</span>
    </div>
  `;
  content.appendChild(summary);

  // Sort: discovered first, then undiscovered
  const sorted = [...manualFish].sort((a, b) => {
    const aDisc = !!(G.manualFishdex || {})[a.id]?.discovered;
    const bDisc = !!(G.manualFishdex || {})[b.id]?.discovered;
    return bDisc - aDisc;
  });

  sorted.forEach(fish => {
    const entry = (G.manualFishdex || {})[fish.id] || null;
    const discovered = !!(entry?.discovered);
    const dotColor = RARITY_COLORS[fish.rarity] || '#9d9d9d';
    const timeStr = _formatTimeWindow(fish.timeWindow);

    const card = document.createElement('div');
    card.className = 'manual-fish-card' + (discovered ? '' : ' undiscovered');

    if (!discovered) {
      const hint = fish.timeWindow ? 'Appears during a specific time window.' : 'Rare manual catch.';
      card.innerHTML = `
        <div class="manual-fish-art">
          <div class="manual-fish-silhouette">?</div>
        </div>
        <div class="manual-fish-info">
          <div class="manual-fish-name">??? Unknown catch</div>
          <div class="manual-fish-zone-row">
            <span class="manual-fish-zone">${zone.charAt(0).toUpperCase()+zone.slice(1)}</span>
            <span class="manual-fish-rarity" style="color:${dotColor}">${fish.rarity.toUpperCase()}</span>
          </div>
          <div class="manual-fish-hint">${hint}</div>
        </div>
      `;
    } else {
      const totalCatches = entry.totalCatches || 0;
      const trophyCount  = entry.trophyCount  || 0;
      const largestWt    = entry.largestWeight || 0;
      const bestSize     = entry.bestSize      || '—';
      const firstDate    = entry.firstCaughtDate || '—';

      card.innerHTML = `
        <div class="manual-fish-art">
          ${fish.img ? `<img src="${fish.img}" alt="${fish.name}" class="manual-fish-img">` : `<div class="manual-fish-placeholder" style="color:${dotColor}">${fish.name[0]}</div>`}
          <span class="fishdex-rarity-dot" style="background:${dotColor};position:absolute;bottom:4px;right:4px"></span>
        </div>
        <div class="manual-fish-info">
          <div class="manual-fish-name">${fish.name}</div>
          <div class="manual-fish-zone-row">
            <span class="manual-fish-zone">${zone.charAt(0).toUpperCase()+zone.slice(1)}</span>
            <span class="manual-fish-rarity" style="color:${dotColor}">${fish.rarity.toUpperCase()}</span>
          </div>
          ${timeStr ? `<div class="manual-fish-time">&#9200; ${timeStr}</div>` : ''}
          <div class="manual-fish-stats">
            <span class="manual-stat"><span class="manual-stat-label">Caught</span><span class="manual-stat-val">${totalCatches}x</span></span>
            <span class="manual-stat"><span class="manual-stat-label">Trophy</span><span class="manual-stat-val">${trophyCount}x</span></span>
            <span class="manual-stat"><span class="manual-stat-label">Best size</span><span class="manual-stat-val">${bestSize}</span></span>
            ${largestWt ? `<span class="manual-stat"><span class="manual-stat-label">Record</span><span class="manual-stat-val">${formatWeight(largestWt)}</span></span>` : ''}
            <span class="manual-stat"><span class="manual-stat-label">First caught</span><span class="manual-stat-val">${firstDate}</span></span>
          </div>
        </div>
      `;
    }
    if (discovered) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => openFishdexDetail(fish.id));
    }
    content.appendChild(card);
  });
}

function renderFishdex() {
  const content  = document.getElementById('fishdex-content');
  const progress = document.getElementById('fishdex-progress');
  if (!content) return;

  updateFishdexLureCount();

  const zone = _fishdexZone || G.currentZone;
  content.innerHTML = '';

  if (_fishdexMode === 'manual') {
    _renderManualFishdex(zone, content, progress);
    return;
  }

  // ── Automation Fishdex ────────────────────────────────────────────────────
  const sections = [
    { label: 'Fish',   db: FISH_DB.filter(f  => f.zones.includes(zone) && !isManualOnlyFish(f)) },
    { label: 'Plants', db: PLANT_DB.filter(p => p.zones.includes(zone)) },
    { label: 'Trash',  db: TRASH_DB.filter(t => t.zones.includes(zone)) },
  ].filter(s => s.db.length > 0);

  const allItems    = sections.flatMap(s => s.db);
  const caughtCount = allItems.filter(i => G.fishdex.includes(i.id)).length;
  if (progress) progress.textContent = caughtCount + ' / ' + allItems.length;

  _renderMasteryPanel(zone, content);

  sections.forEach(section => {
    const items = section.db;
    const header = document.createElement('div');
    header.className = 'fishdex-section-header';
    const sectionCaught = items.filter(i => G.fishdex.includes(i.id)).length;
    header.textContent = section.label + '  ' + sectionCaught + '/' + items.length;
    content.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'fishdex-grid';

    items.forEach(item => {
      const caught = G.fishdex.includes(item.id);
      const cell = document.createElement('div');
      const eligible = isMasteryEligible(item);
      const tierIdx = caught && eligible ? getMasteryTierIndex(item.id) : -1;
      const masteryClass = (!caught || !eligible) ? '' : (tierIdx >= 0 ? ' mastery-' + MASTERY_TIERS[tierIdx].name.toLowerCase() : ' mastery-none');
      cell.className = 'fishdex-cell' + (caught ? '' : ' locked') + masteryClass;
      const dotColor = RARITY_COLORS[item.rarity] || '#9d9d9d';

      if (caught && item.img) {
        cell.innerHTML = `
          <img src="${item.img}" alt="${item.name}" class="fishdex-img">
          <span class="fishdex-rarity-dot" style="background:${dotColor}"></span>
          <div class="fishdex-name">${item.name}</div>
        `;
      } else if (caught) {
        cell.innerHTML = `
          <div class="fishdex-placeholder" style="color:${dotColor}">${item.name[0].toUpperCase()}</div>
          <span class="fishdex-rarity-dot" style="background:${dotColor}"></span>
          <div class="fishdex-name">${item.name}</div>
        `;
      }

      if (caught && eligible) {
        const count = getMasteryCount(item.id);
        const nextTierIdx = tierIdx + 1;
        const hasTier = tierIdx >= 0;
        const tier = hasTier ? MASTERY_TIERS[tierIdx] : null;
        const nextTier = nextTierIdx < MASTERY_TIERS.length ? MASTERY_TIERS[nextTierIdx] : null;
        const barPct = nextTier
          ? Math.min(100, ((count - (tier ? tier.threshold : 0)) / (nextTier.threshold - (tier ? tier.threshold : 0))) * 100).toFixed(0)
          : 100;
        const masteryEl = document.createElement('div');
        masteryEl.className = 'mastery-info';
        const medalHtml = hasTier
          ? `<span class="mastery-medal" style="color:${tier.color}">${tier.medal}</span>`
          : '<span class="mastery-medal" style="color:#555">-</span>';
        masteryEl.innerHTML = `
          <div class="mastery-row">${medalHtml}<span class="mastery-count">${count >= 1000 ? (count/1000).toFixed(1)+'k' : count}</span></div>
          <div class="mastery-bar-wrap"><div class="mastery-bar" style="width:${barPct}%;background:${nextTier ? nextTier.color : (tier ? tier.color : '#555')}"></div></div>
        `;
        cell.appendChild(masteryEl);
      }

      if (caught && item.w1legendary && (G.targetedLureLevel || 0) > 0) {
        // W1 Legendary cannot be targeted — show static label instead of targeting button
        const ntEl = document.createElement('div');
        ntEl.textContent = 'Not targetable';
        ntEl.setAttribute('style', 'color:#666;font-size:10px;margin-top:3px;text-align:center');
        cell.appendChild(ntEl);
      } else if (caught && (G.targetedLureLevel || 0) > 0 && isLureEligible(item)) {
        const targeted  = isTargetedItem(item.id);
        const slotsLeft = getTargetedLureSlots() - (G.targetedLureTargets || []).length;
        const canTarget = targeted || slotsLeft > 0;
        const btnLabel  = targeted ? 'Targeting' : canTarget ? 'Target' : 'Limit reached';
        const btnStyle  = targeted
          ? 'background:#2e7d32;color:#fff;border:none;border-radius:4px;padding:2px 6px;font-size:10px;cursor:pointer;margin-top:3px;display:block;width:100%'
          : canTarget
          ? 'background:#1a4a7a;color:#fff;border:none;border-radius:4px;padding:2px 6px;font-size:10px;cursor:pointer;margin-top:3px;display:block;width:100%'
          : 'background:#333;color:#888;border:none;border-radius:4px;padding:2px 6px;font-size:10px;cursor:default;margin-top:3px;display:block;width:100%';
        const btn = document.createElement('button');
        btn.textContent = btnLabel;
        btn.setAttribute('style', btnStyle);
        btn.disabled = !canTarget;
        if (canTarget) btn.addEventListener('click', (e) => { e.stopPropagation(); toggleLureTarget(item.id); });
        cell.appendChild(btn);
      }

      if (!caught) {
        cell.innerHTML = `
          <div class="fishdex-placeholder">?</div>
          <span class="fishdex-rarity-dot" style="background:#333"></span>
          <div class="fishdex-name">???</div>
        `;
        cell.style.cursor = 'pointer';
        cell.addEventListener('click', () => {
          _lockedDexTaps++;
          if (_lockedDexTaps >= 10) syncAch('h_locked_dex', 1);
        });
      } else {
        cell.style.cursor = 'pointer';
        cell.addEventListener('click', () => openFishdexDetail(item.id));
      }
      grid.appendChild(cell);
    });

    content.appendChild(grid);
  });
}

// ─── GUILD ORDERS ─────────────────────────────────────────────────────────────

const GUILD_WEEK_MS = 7 * 3600 * 1000; // 1 in-game week = 7 real hours
const GUILD_WEEK_EPOCH = 70778; // absolute week number at feature release (2026-07-10)

const GUILD_BASE_QTY = { common: 50, uncommon: 36, rare: 20, epic: 12 };
const GUILD_ZONE_MULT = { pond: 1.0, river: 0.9, lake: 0.78, bay: 0.65, sea: 0.52, ocean: 0.40 };

const GUILD_MESSAGES = [
  'The harbor needs fresh fish.',
  'The merchants are paying well this week.',
  'The Guild appreciates reliable anglers.',
  'The taverns are running low on fish.',
  'Fresh fish. Fewer excuses.',
  'Quality over quantity. Preferably both.',
  'Another shipment leaves tomorrow.',
  'The market waits for no fisherman.',
  'Deliver on time. Or slightly before.',
  'The Guild remembers those who deliver.',
  'Harbor supply is low. Your rod is the solution.',
  'The cook is waiting. So is the entire port.',
  'Reliable anglers eat first.',
  'Fish do not catch themselves. Usually.',
  'The Guild seal means quality. Deliver accordingly.',
  'Orders stamped. Excuses rejected.',
  'A full order. A fair reward. Simple enough.',
  'The fishmonger is impatient. You should not be.',
  'These are Guild terms. Not suggestions.',
  'The sea does not care about your schedule.',
  'Every contract honors the Guild.',
  'Catch well. The Guild is watching.',
  'The harbor quays need filling.',
  'Timely delivery is its own reward. Plus coins.',
  'The Guild has fed this port for generations.',
  'No fish. No coins. Simple arithmetic.',
  'Storm or calm — the Guild expects delivery.',
  'The fishmonger trusts only fresh catches.',
  'A good angler honors every order.',
  'The Guild seal is worth more than a lucky catch.',
  'Consistent catches build empires.',
  'The nets are ready. The order is written.',
  'Even legends started with a pond and a contract.',
  'One order at a time. That is how empires are built.',
  'The Guild clock runs on fish, not excuses.',
  'Skilled anglers prefer Guild contracts.',
  'A patient angler always delivers.',
  'The dock hands are waiting.',
  'This week belongs to the dedicated.',
];

function getGuildWeekNumber() {
  return Math.floor(Date.now() / GUILD_WEEK_MS);
}

function getGuildDisplayWeek() {
  return Math.max(1, getGuildWeekNumber() - GUILD_WEEK_EPOCH + 1);
}

function getGuildWeekRemaining() {
  const weekStart = getGuildWeekNumber() * GUILD_WEEK_MS;
  return Math.max(0, (weekStart + GUILD_WEEK_MS) - Date.now());
}

function formatGuildTime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return d + 'd ' + h + 'h';
  if (h > 0) return h + 'h ' + m + 'm';
  return m + 'm';
}

function _guildGetEligibleFish() {
  const zones = (typeof ZONE_DATA !== 'undefined' ? ZONE_DATA : [])
    .filter(z => isZoneUnlocked(z.id))
    .map(z => z.id);
  return FISH_DB.filter(f => {
    if (!f.zones.some(z => zones.includes(z))) return false;
    if (isManualOnlyFish(f)) return false;
    if (f.w1legendary) return false; // legendary fish are 1-in-50M, not achievable in a guild order
    if (f.rarity === 'legendary') return false;
    return true;
  });
}

function _guildGenerateOrder() {
  const eligible = _guildGetEligibleFish();
  if (eligible.length < 2) return null;

  if (!G.guild) _guildEnsureState();
  const recent = G.guild.recentFishIds || [];

  const preferred = eligible.filter(f => !recent.includes(f.id));
  const pool = preferred.length >= 2 ? preferred : eligible;

  const r = Math.random();
  const desiredCount = r < 0.4 ? 2 : r < 0.8 ? 3 : 4;
  const count = Math.min(desiredCount, pool.length);

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const picked   = shuffled.slice(0, count);

  const golden = Math.random() < 0.02;

  const items = picked.map(f => {
    const base = GUILD_BASE_QTY[f.rarity] || 15;
    const zm   = GUILD_ZONE_MULT[f.zone]  || 1.0;
    return {
      fishId:   f.id,
      name:     f.name,
      zone:     f.zone,
      zones:    f.zones || [f.zone],
      rarity:   f.rarity,
      img:      f.img || '',
      required: Math.max(3, Math.round(base * zm)),
      progress: 0,
    };
  });

  const usedIds  = picked.map(f => f.id);
  G.guild.recentFishIds = [...recent, ...usedIds].slice(-15);

  const total = items.reduce((s, i) => s + i.required, 0);
  if (total > (G.guild.stats.largestOrderTotal || 0)) G.guild.stats.largestOrderTotal = total;

  return {
    week:        getGuildWeekNumber(),
    golden,
    generatedAt: Date.now(),
    items,
    complete:    false,
    claimed:     false,
    completedAt: 0,
  };
}

function _guildEnsureState() {
  if (!G.guild) G.guild = JSON.parse(JSON.stringify(DEFAULT_STATE.guild));
  if (!G.guild.stats)          G.guild.stats          = JSON.parse(JSON.stringify(DEFAULT_STATE.guild.stats));
  if (!G.guild.recentFishIds)  G.guild.recentFishIds  = [];
}

function checkGuildOrder() {
  _guildEnsureState();
  const currentWeek = getGuildWeekNumber();
  if (G.guild.order && G.guild.order.week < currentWeek) {
    if (!G.guild.order.claimed && !G.guild.order.complete) {
      G.guild.stats.ordersFailed = (G.guild.stats.ordersFailed || 0) + 1;
    }
    G.guild.order = null;
  }
  if (!G.guild.order) {
    G.guild.order = _guildGenerateOrder();
    saveState();
  }
}

function onGuildManualCatch(fishId, count) {
  _guildEnsureState();
  const ord = G.guild.order;
  if (!ord || ord.claimed || ord.complete) return;

  const item = ord.items.find(i => i.fishId === fishId);
  if (!item || item.progress >= item.required) return;

  const add = Math.min(count || 1, item.required - item.progress);
  item.progress += add;
  G.guild.stats.totalFishDelivered = (G.guild.stats.totalFishDelivered || 0) + add;

  const allDone = ord.items.every(i => i.progress >= i.required);
  if (allDone) {
    ord.complete    = true;
    ord.completedAt = Date.now();
    if (!_questMsgThrottle) {
      _questMsgThrottle = true;
      showStatus('Guild Order complete! Open Market → Guild Orders to claim.', 3500);
      setTimeout(() => { _questMsgThrottle = false; }, 9000);
    }
    updateGuildBadge();
  }

  updateGuildOverlay();
  if (_activeMarketTab === 'guild') renderGuild();
}

function claimGuildReward() {
  _guildEnsureState();
  const ord = G.guild.order;
  if (!ord || !ord.complete || ord.claimed) return;

  // 24 in-game hours = 1 real hour; 72 in-game hours = 3 real hours
  const realHours = ord.golden ? 3 : 1;
  const reward = Math.round(getEstimatedHourlyIncome() * realHours);

  ord.claimed = true;

  G.guild.stats.ordersCompleted    = (G.guild.stats.ordersCompleted    || 0) + 1;
  if (ord.golden) G.guild.stats.goldenCompleted = (G.guild.stats.goldenCompleted || 0) + 1;
  G.guild.stats.totalRewardEarned  = (G.guild.stats.totalRewardEarned  || 0) + reward;

  if (ord.completedAt && ord.generatedAt) {
    const elapsed = ord.completedAt - ord.generatedAt;
    G.guild.stats.totalCompletionTimeMs   = (G.guild.stats.totalCompletionTimeMs   || 0) + elapsed;
    G.guild.stats.completionTimeSamples   = (G.guild.stats.completionTimeSamples   || 0) + 1;
  }

  _earnCoins(reward);
  updateHUD();
  saveState();
  updateGuildBadge();
  // Refresh market coins display if the screen is open
  const coinsEl = document.getElementById('market-coins');
  if (coinsEl) coinsEl.textContent = formatCoins(G.coins);
  renderGuild();

  showStatus((ord.golden ? 'Golden Contract' : 'Guild Reward') + ': +' + formatCoins(reward) + 'c!', 3500);
  setTimeout(() => anlCheckpoint('guild_order_claimed'), 2000);
}

function updateGuildBadge() {
  _guildEnsureState();
  const claimable = G.guild.order?.complete && !G.guild.order?.claimed;

  // Badge on the Market nav button (bottom nav)
  const marketBtn = document.querySelector('[data-screen="market"]');
  if (marketBtn) {
    let dot = marketBtn.querySelector('.quest-badge');
    if (claimable && !dot) {
      dot = document.createElement('span');
      dot.className = 'quest-badge';
      marketBtn.style.position = 'relative';
      marketBtn.appendChild(dot);
    } else if (!claimable && dot) {
      dot.remove();
    }
  }

  // Badge on the Guild Orders tab button
  const guildTabBtn = document.getElementById('market-tab-guild');
  if (guildTabBtn) {
    let dot = guildTabBtn.querySelector('.quest-badge');
    if (claimable && !dot) {
      dot = document.createElement('span');
      dot.className = 'quest-badge';
      guildTabBtn.appendChild(dot);
    } else if (!claimable && dot) {
      dot.remove();
    }
  }
}

function renderGuild() {
  checkGuildOrder();
  const el = document.getElementById('market-guild-panel');
  if (!el) return;
  el.innerHTML = '';

  // ── Fishing screen overlay toggle ──
  const toggleRow = document.createElement('label');
  toggleRow.className = 'guild-overlay-toggle-row';
  const checked = G.showGuildOverlay !== false;
  toggleRow.innerHTML =
    '<input type="checkbox" id="guild-overlay-chk"' + (checked ? ' checked' : '') + ' onchange="toggleGuildOverlay(this.checked)">' +
    'Show tracking on fishing screen';
  el.appendChild(toggleRow);

  const ord = G.guild.order;

  // ── Flavor message ──
  const msg = GUILD_MESSAGES[Math.floor(Math.random() * GUILD_MESSAGES.length)];
  const flavor = document.createElement('div');
  flavor.className = 'guild-flavor';
  flavor.textContent = '“' + msg + '”';
  el.appendChild(flavor);

  // ── Week + timer row ──
  const weekRow = document.createElement('div');
  weekRow.className = 'guild-week-row';
  weekRow.innerHTML =
    '<span class="guild-week-label">Guild Week ' + getGuildDisplayWeek() + '</span>' +
    '<span style="display:flex;align-items:center;gap:8px;">' +
      '<span class="guild-timer-label">Expires in: <span id="guild-time-remaining">' +
      formatGuildTime(getGuildWeekRemaining()) + '</span></span>' +
      '' +
    '</span>';
  el.appendChild(weekRow);

  if (!ord) {
    const empty = document.createElement('div');
    empty.className = 'guild-empty';
    empty.textContent = 'No active order. Check back soon.';
    el.appendChild(empty);
    return;
  }

  // ── Order card ──
  const card = document.createElement('div');
  card.className = 'guild-order-card' + (ord.golden ? ' golden' : '');

  if (ord.golden) {
    const seal = document.createElement('div');
    seal.className = 'guild-golden-banner';
    seal.innerHTML = '★ Golden Guild Contract ★';
    card.appendChild(seal);
  }

  const cardTitle = document.createElement('div');
  cardTitle.className = 'guild-card-title';
  cardTitle.textContent = ord.golden ? 'Golden Contract' : 'Guild Order';
  card.appendChild(cardTitle);

  const totalDone = ord.items.reduce((s, i) => s + i.progress, 0);
  const totalReq  = ord.items.reduce((s, i) => s + i.required, 0);
  const pct = totalReq > 0 ? Math.floor(totalDone / totalReq * 100) : 0;

  // Items
  const itemsDiv = document.createElement('div');
  itemsDiv.className = 'guild-items';
  ord.items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'guild-item-row';

    const iDone = Math.min(item.progress, item.required);
    const iPct  = Math.floor(iDone / item.required * 100);

    const _GUILD_ZONE_LABELS = { pond:'Pond', river:'River', lake:'Lake', bay:'Bay', sea:'Sea', ocean:'Ocean' };
    const _allZones = (item.zones || (item.zone ? [item.zone] : []));
    const _zoneLabel = _allZones.map(z => _GUILD_ZONE_LABELS[z] || z).join(' · ');
    row.innerHTML =
      '<div class="guild-item-header">' +
        '<img class="guild-fish-img" src="' + item.img + '" alt="">' +
        '<div class="guild-item-name-col">' +
          '<span class="guild-item-name">' + item.name + '</span>' +
          (_zoneLabel ? '<span class="guild-item-zone">' + _zoneLabel + '</span>' : '') +
        '</div>' +
        '<span class="guild-item-count' + (iDone >= item.required ? ' done' : '') + '">' +
          iDone + ' / ' + item.required +
        '</span>' +
      '</div>' +
      '<div class="guild-bar-bg"><div class="guild-bar-fill' + (ord.golden ? ' golden' : '') + '" style="width:' + iPct + '%"></div></div>';

    itemsDiv.appendChild(row);
  });
  card.appendChild(itemsDiv);

  // Overall progress
  const progSection = document.createElement('div');
  progSection.className = 'guild-progress-section';
  progSection.innerHTML =
    '<div class="guild-progress-label"><span>' + pct + '%</span></div>' +
    '<div class="guild-bar-bg guild-total-bar"><div class="guild-bar-fill' + (ord.golden ? ' golden' : '') + '" style="width:' + pct + '%"></div></div>';
  card.appendChild(progSection);

  // Reward
  const hourlyInc = getEstimatedHourlyIncome();
  const rewardHrs = ord.golden ? 3 : 1; // 24/72 in-game hours = 1/3 real hours
  const rewardAmt = Math.round(hourlyInc * rewardHrs);

  const rewardDiv = document.createElement('div');
  rewardDiv.className = 'guild-reward' + (ord.golden ? ' golden' : '');
  rewardDiv.innerHTML =
    '<div class="guild-reward-label">Reward: ' + (ord.golden ? '72h' : '24h') + ' automation income</div>' +
    '<div class="guild-reward-amount">' + formatCoins(rewardAmt) + 'c</div>';
  card.appendChild(rewardDiv);

  // Claim / complete state
  if (ord.claimed) {
    const claimedTag = document.createElement('div');
    claimedTag.className = 'guild-claimed-tag';
    claimedTag.textContent = 'Reward claimed. New order next week.';
    card.appendChild(claimedTag);
  } else if (ord.complete) {
    const claimBtn = document.createElement('button');
    claimBtn.className = 'btn-primary guild-claim-btn' + (ord.golden ? ' golden-btn' : '');
    claimBtn.textContent = 'Claim Reward';
    claimBtn.onclick = claimGuildReward;
    card.appendChild(claimBtn);
  }

  el.appendChild(card);

  // ── Stats footer ──
  const st = G.guild.stats;
  const statsDiv = document.createElement('div');
  statsDiv.className = 'guild-stats-footer';
  const avgMs  = st.completionTimeSamples > 0 ? (st.totalCompletionTimeMs / st.completionTimeSamples) : 0;
  const avgHrs = avgMs > 0 ? (avgMs / 3600000).toFixed(1) + 'h' : '—';
  statsDiv.innerHTML =
    '<div class="guild-stat-row"><span>Orders Completed</span><span>' + (st.ordersCompleted || 0) + '</span></div>' +
    '<div class="guild-stat-row"><span>Golden Contracts</span><span>' + (st.goldenCompleted || 0) + '</span></div>' +
    '<div class="guild-stat-row"><span>Total Fish Delivered</span><span>' + (st.totalFishDelivered || 0) + '</span></div>' +
    '<div class="guild-stat-row"><span>Total Reward Earned</span><span>' + formatCoins(st.totalRewardEarned || 0) + 'c</span></div>' +
    '<div class="guild-stat-row"><span>Avg Completion Time</span><span>' + avgHrs + '</span></div>';
  el.appendChild(statsDiv);
}

// ─── COMPETITION ──────────────────────────────────────────────────────────────

function isCompetitionActive() {
  const c = G.competition;
  return !!(c && c.active && !c.finished && Date.now() < c.ends);
}

function updateGuildOverlay() {
  const el = document.getElementById('guild-overlay');
  if (!el) return;
  const ord = G.guild?.order;
  if (!ord || ord.complete || ord.claimed || G.showGuildOverlay === false) {
    el.classList.add('hidden');
    return;
  }
  el.classList.remove('hidden');
  el.classList.toggle('golden-contract', !!ord.golden);
  const header = el.querySelector('.go-header');
  if (header) header.textContent = ord.golden ? '★ GOLDEN CONTRACT ★' : 'GUILD ORDER';
  const itemsEl = document.getElementById('go-items');
  if (itemsEl) {
    itemsEl.innerHTML = ord.items.map(item => {
      const done = item.progress >= item.required;
      return `<div class="go-item${done ? ' go-done' : ''}">` +
        `<span class="go-name">${item.name}</span>` +
        `<span class="go-prog">${item.progress}/${item.required}</span>` +
      `</div>`;
    }).join('');
  }
}

function toggleGuildOverlay(checked) {
  G.showGuildOverlay = checked;
  saveState();
  updateGuildOverlay();
}

function updateCompOverlay() {
  const el = document.getElementById('comp-overlay');
  if (!el) return;
  const eventVisible = !document.getElementById('event-side-icon')?.classList.contains('hidden');
  if (!isCompetitionActive() || eventVisible) {
    el.classList.add('hidden');
    return;
  }
  el.classList.remove('hidden');
  const remMs  = Math.max(0, G.competition.ends - Date.now());
  const remMin = Math.floor(remMs / 60000);
  const remSec = Math.floor((remMs % 60000) / 1000);
  const timerEl = document.getElementById('co-timer');
  if (timerEl) timerEl.textContent = '⏳ ' + remMin + ':' + remSec.toString().padStart(2, '0');
  const boardEl = document.getElementById('co-board');
  if (boardEl) {
    const medals = ['🥇', '🥈', '🥉'];
    boardEl.innerHTML = getCompLeaderboard().slice(0, 3).map((e, i) =>
      `<div class="co-row${e.isPlayer ? ' is-player' : ''}">` +
        `<span class="co-rank">${medals[i]}</span>` +
        `<span class="co-name">${e.name}</span>` +
        `<span class="co-val">${e.value > 0 ? e.value + 'c' : '—'}</span>` +
      `</div>`
    ).join('');
  }
  const warnEl = document.getElementById('co-warning');
  if (warnEl) {
    const inCompZone = G.currentZone === G.competition.zone;
    warnEl.classList.toggle('hidden', inCompZone);
  }
}

// ── Series helpers ────────────────────────────────────────────────────────────

function _initSeries() {
  if (!G.series) {
    G.series = { index:1, competitionNumber:0, nextName:'', usedNames:[], standings:{}, grandPending:false };
  }
  if (!G.series.standings)  G.series.standings  = {};
  if (!G.series.usedNames)  G.series.usedNames  = [];
  if (G.series.competitionNumber === undefined) G.series.competitionNumber = 0;
  if (!G.series.nextName) G.series.nextName = _pickCompName();
}

function _getCompNamePool() {
  if (_competitionNamesData && Array.isArray(_competitionNamesData.competitionNames)) {
    return _competitionNamesData.competitionNames;
  }
  return _COMP_NAME_FALLBACK;
}

function _pickCompName() {
  const pool = _getCompNamePool();
  const used = G.series ? (G.series.usedNames || []) : [];
  const available = pool.filter(n => !used.includes(n));
  const source = available.length > 0 ? available : pool;
  return source[Math.floor(Math.random() * source.length)];
}

function _seriesPointsForRank(rank) {
  return (rank >= 1 && rank <= SERIES_POINTS.length - 1) ? SERIES_POINTS[rank] : 0;
}

function _addSeriesPoints(sortedBoard) {
  _initSeries();
  sortedBoard.forEach((entry, i) => {
    const rank = i + 1;
    const pts  = _seriesPointsForRank(rank);
    if (!G.series.standings[entry.name]) G.series.standings[entry.name] = { points: 0, wins: 0, isPlayer: !!entry.isPlayer };
    G.series.standings[entry.name].points += pts;
    if (rank === 1) G.series.standings[entry.name].wins++;
    if (entry.isPlayer) G.series.standings[entry.name].isPlayer = true;
  });
}

function _getSeriesRanking() {
  return Object.entries(G.series.standings || {})
    .map(([name, d]) => ({ name, points: d.points, wins: d.wins, isPlayer: !!d.isPlayer }))
    .sort((a, b) => b.points - a.points || b.wins - a.wins);
}

function _calcGrandReward(rank) {
  const base = getCompBaseReward(rank, G.competition && G.competition.zone) * 5;
  return Math.round(base * getPearlCompSpiritMult() * getMasteryCompMult());
}

function _resetSeries() {
  G.series = { index: (G.series.index || 1) + 1, competitionNumber: 0, nextName: _pickCompName(), usedNames: [], standings: {}, grandPending: false };
  _grandWinnersMode = false;
  saveState();
}

function _renderSeriesStandings(standings) {
  if (!standings.length) return '';
  return `
    <div class="comp-leaderboard-title" style="margin-top:12px">Series Standings</div>
    <div class="comp-leaderboard">
      ${standings.slice(0, 10).map((e, i) => `
        <div class="comp-row${e.isPlayer ? ' comp-row-player' : ''}">
          <span class="comp-rank">#${i + 1}</span>
          <span class="comp-name">${e.name}</span>
          <span class="comp-val series-pts">${e.points} pts</span>
        </div>`).join('')}
    </div>`;
}

function _renderGrandWinners() {
  const el = document.getElementById('competition-content');
  if (!el) return;
  _initSeries();
  const ranking = _getSeriesRanking();
  const top3 = ranking.slice(0, 3);
  const playerEntry = ranking.find(e => e.isPlayer);
  const playerRank  = ranking.findIndex(e => e.isPlayer) + 1;

  const podiumLabels = ['1st', '2nd', '3rd'];
  const podiumHtml = top3.map((e, i) => {
    const grandReward = _calcGrandReward(i + 1);
    return `
      <div class="comp-row${e.isPlayer ? ' comp-row-player' : ''}">
        <span class="comp-rank">${podiumLabels[i]}</span>
        <span class="comp-name">${e.name}</span>
        <span class="comp-val">${e.points} pts</span>
        <span class="grand-reward-badge">+${grandReward}c</span>
      </div>`;
  }).join('');

  const playerSection = playerRank > 3
    ? `<div class="comp-result-rank" style="margin-top:8px">Your final rank: #${playerRank} — ${playerEntry ? playerEntry.points : 0} pts</div>`
    : '';

  const allStandings = _renderSeriesStandings(ranking);

  el.innerHTML = '';
  const div = document.createElement('div');
  div.className = 'comp-results';
  div.innerHTML = `
    <div class="comp-result-title" style="color:#f4c430">Grand Winners</div>
    <div class="comp-series-subtitle">Series ${G.series.index} — Final Results</div>
    <div class="comp-leaderboard">${podiumHtml}</div>
    ${playerSection}
    ${allStandings}
    <button class="btn-primary js-new-series" style="margin-top:14px">Start New Series</button>`;
  div.querySelector('.js-new-series').addEventListener('click', () => {
    _resetSeries();
    renderCompetition();
  });
  el.appendChild(div);
}

// ─────────────────────────────────────────────────────────────────────────────

function joinCompetition() {
  if (isCompetitionActive()) return;
  _initSeries();
  const now = Date.now();
  G.stats.lastCompLucky = false;
  const bots = [...BOT_NAMES].sort(() => Math.random() - 0.5).slice(0, 9)
    .map(name => ({ name, best: null }));
  const seriesNum  = G.series.competitionNumber + 1;
  const seriesName = G.series.nextName || _pickCompName();
  G.series.usedNames = [...(G.series.usedNames || []), seriesName];
  G.competition = {
    active: true, started: now, ends: now + COMP_DURATION_MS,
    zone: G.currentZone, myBest: null, bots, finished: false, myReward: 0, myRank: 0,
    seriesNum, seriesName,
  };
  saveState();
  _compBotInterval   = setInterval(tickCompetitionBots, 10000);
  _compCheckInterval = setInterval(checkCompetitionEnd, 1000);
  showStatus('Competition started! Catch the biggest fish!', 3000);
  renderCompetition();
}

function tickCompetitionBots() {
  const c = G.competition;
  if (!c || c.finished) { clearInterval(_compBotInterval); return; }
  c.bots.forEach(bot => {
    if (Math.random() > 0.35) return;
    const zone = c.zone;
    const table = LOOT_TABLES[zone] || LOOT_TABLES.pond;
    const roll = weightedRandom(table);
    if (roll.type === 'trash' || roll.type === 'plant') return;
    const pool = FISH_DB.filter(f => f.rarity === roll.type && f.zones.includes(zone));
    if (!pool.length) return;
    const fish = pool[randInt(0, pool.length - 1)];
    const sizeRow = weightedRandom(SIZE_TABLE.filter(s => !s.trophy));
    const value = Math.round(fish.baseValue * sizeRow.mult);
    if (!bot.best || value > bot.best.value) {
      bot.best = { name: fish.name, value, rarity: fish.rarity, size: sizeRow.size };
    }
  });
  saveState();
  const scr = document.getElementById('screen-competition');
  if (scr && scr.classList.contains('active')) renderCompetition();
}

function checkCompetitionEnd() {
  const c = G.competition;
  if (!c || c.finished) { clearInterval(_compCheckInterval); return; }
  if (Date.now() >= c.ends) {
    finishCompetition();
    const scr = document.getElementById('screen-competition');
    if (scr && scr.classList.contains('active')) renderCompetition();
  }
}

function _showSeriesCompletePopup(rank, reward) {
  const popup = document.getElementById('series-complete-popup');
  if (!popup) return;
  if (!popup.classList.contains('hidden')) return; // already showing
  const ordinal = rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : rank + 'th';
  document.getElementById('scp-rank').textContent = 'You finished ' + ordinal + ' in the series';
  document.getElementById('scp-reward').textContent = reward > 0
    ? 'Grand Prize: +' + reward.toLocaleString() + 'c'
    : 'Series complete — no grand prize this time';
  popup.classList.remove('hidden');
  const _close = () => {
    popup.classList.add('hidden');
    if (G.series) { delete G.series.pendingRank; delete G.series.pendingGrandReward; }
    saveState();
  };
  document.getElementById('btn-scp-winners').onclick = () => {
    _close();
    showScreen('competition');
    _grandWinnersMode = true;
    renderCompetition();
  };
  document.getElementById('btn-scp-continue').onclick = _close;
}

function finishCompetition() {
  const c = G.competition;
  if (!c || c.finished) return;
  clearInterval(_compBotInterval);
  clearInterval(_compCheckInterval);
  const myVal = c.myBest ? c.myBest.value : 0;
  const sorted = [
    { name: getPlayerName(), value: myVal, isPlayer: true },
    ...c.bots.map(b => ({ name: b.name, value: b.best ? b.best.value : 0 })),
  ].sort((a, b) => b.value - a.value);
  const myRank = sorted.findIndex(e => e.isPlayer) + 1;
  let reward = Math.round(getCompBaseReward(myRank, c.zone) * getPearlCompSpiritMult() * getMasteryCompMult());
  c.finished = true; c.myRank = myRank; c.myReward = reward; c.active = false;
  if (reward > 0) _earnCoins(reward);
  if (myRank === 1) {
    G.stats.compStreak = (G.stats.compStreak || 0) + 1;
    syncAch('h_comp_streak', G.stats.compStreak);
    if (!G.stats.lastCompLucky) syncAch('h_pure_skill', 1);
  } else {
    G.stats.compStreak = 0;
  }
  G.stats.lastCompLucky = false;
  if (myRank === 1 && c.myBest) {
    if (!G.hofWins) G.hofWins = [];
    if (!G.hofActive) G.hofActive = {};
    const dateStr = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
    G.hofWins.push({ zone: c.zone, fishName: c.myBest.name, value: c.myBest.value, rarity: c.myBest.rarity, size: c.myBest.size, date: dateStr });
    G.hofActive[c.zone] = { fishName: c.myBest.name, value: c.myBest.value, rarity: c.myBest.rarity, size: c.myBest.size, player: getPlayerName(), date: dateStr, isPlayer: true };
  }
  // Series: add points, advance counter
  _initSeries();
  _addSeriesPoints(sorted);
  G.series.competitionNumber++;
  if (G.series.competitionNumber >= SERIES_LENGTH) {
    G.series.grandPending = true;
    const seriesRanking = _getSeriesRanking();
    const _pIdx = seriesRanking.findIndex(e => e.isPlayer);
    const playerSeriesRank = _pIdx >= 0 ? _pIdx + 1 : seriesRanking.length + 1;
    let grandReward = 0;
    seriesRanking.slice(0, 3).forEach((e, i) => {
      if (e.isPlayer) {
        grandReward = _calcGrandReward(i + 1);
        _earnCoins(grandReward);
        if (i === 0) G.stats.recGrandTitles = (G.stats.recGrandTitles || 0) + 1;
      }
    });
    if (!G.series.completedCount) G.series.completedCount = 0;
    G.series.completedCount++;
    G.series.pendingRank        = playerSeriesRank;
    G.series.pendingGrandReward = grandReward;
    saveState(); updateHUD();
    showStatus('Competition ended! Rank #' + myRank + (reward ? ' — +' + reward + 'c' : ''), 4000);
    setTimeout(() => _showSeriesCompletePopup(playerSeriesRank, grandReward), 500);
    if (typeof anlOnSeriesCompleted === 'function') anlOnSeriesCompleted();
  } else {
    G.series.nextName = _pickCompName();
    saveState(); updateHUD();
    showStatus('Competition ended! Rank #' + myRank + (reward ? ' — +' + reward + 'c' : ''), 4000);
  }
}

function updateCompetitionBest(catchResult) {
  if (!isCompetitionActive()) return;
  if (catchResult.rarity === 'trash' || catchResult.rarity === 'plant' || catchResult.isTrophy) return;
  const c = G.competition;
  if (G.currentZone !== c.zone) return;
  if (!c.myBest || catchResult.value > c.myBest.value) {
    c.myBest = { name: catchResult.name, value: catchResult.value, rarity: catchResult.rarity, size: catchResult.size };
    saveState();
  }
}

function getCompLeaderboard() {
  const c = G.competition;
  if (!c) return [];
  const myVal = c.myBest ? c.myBest.value : 0;
  return [
    { name: getPlayerName(), value: myVal, isPlayer: true },
    ...c.bots.map(b => ({ name: b.name, value: b.best ? b.best.value : 0 })),
  ].sort((a, b) => b.value - a.value);
}

function renderLeaderboardRows(board, limit) {
  return (limit ? board.slice(0, limit) : board).map((e, i) => `
    <div class="comp-row${e.isPlayer ? ' comp-row-player' : ''}">
      <span class="comp-rank">#${i + 1}</span>
      <span class="comp-name">${e.name}</span>
      <span class="comp-val">${e.value > 0 ? e.value + 'c' : '—'}</span>
    </div>`).join('');
}

function renderCompetition() {
  const el = document.getElementById('competition-content');
  if (!el) return;
  el.innerHTML = '';
  _initSeries();
  const c = G.competition;

  // Grand winners mode
  if (_grandWinnersMode) { _renderGrandWinners(); return; }

  // ── Join screen ──────────────────────────────────────────────────────────────
  if (!c || (!c.active && !c.finished)) {
    const zoneName   = (ZONE_DATA.find(z => z.id === G.currentZone) || {}).name || 'Pond';
    const compNum    = G.series.competitionNumber + 1;
    const compName   = G.series.nextName || _pickCompName();
    if (!G.series.nextName) { G.series.nextName = compName; saveState(); }
    el.innerHTML = `
      <div class="comp-join-screen">
        <div class="comp-join-icon"><img src="img/icons/Game screen icons/competition.png" style="width:60px;height:60px;object-fit:contain"></div>
        <div class="comp-series-header">Competition ${compNum} / ${SERIES_LENGTH}</div>
        <div class="comp-series-name">${compName}</div>
        <div class="comp-join-desc">Catch the highest-value fish in 5 minutes!<br>Compete against 9 other anglers.</div>
        <div class="comp-join-zone">Zone: ${zoneName}</div>
        <button class="btn-primary comp-join-btn js-join">Join Competition</button>
      </div>`;
    el.querySelector('.js-join').addEventListener('click', joinCompetition);
    return;
  }

  // ── Results screen ───────────────────────────────────────────────────────────
  if (c.finished) {
    const board    = getCompLeaderboard();
    const standing = _renderSeriesStandings(_getSeriesRanking());
    const isLast   = G.series.grandPending;
    const div = document.createElement('div');
    div.className = 'comp-results';
    div.innerHTML = `
      <div class="comp-series-header" style="text-align:center">Competition ${c.seriesNum || '?'} / ${SERIES_LENGTH}</div>
      <div class="comp-series-name" style="text-align:center;margin-bottom:4px">${c.seriesName || ''}</div>
      <div class="comp-result-title">Competition Ended!</div>
      <div class="comp-result-rank">Your rank: #${c.myRank}</div>
      <div class="comp-result-reward${c.myReward > 0 ? '' : ' dim'}">${c.myReward > 0 ? '+' + formatCoins(c.myReward) + 'c reward earned!' : 'No reward this time.'}</div>
      <div class="comp-leaderboard-title">Final Leaderboard</div>
      <div class="comp-leaderboard">${renderLeaderboardRows(board, 0)}</div>
      ${standing}
      ${isLast
        ? `<button class="btn-primary js-grand" style="margin-top:14px;background:#8b5cf6">Grand Winners</button>`
        : `<button class="btn-primary js-new-comp" style="margin-top:14px">New Competition</button>`}`;
    if (isLast) {
      div.querySelector('.js-grand').addEventListener('click', () => {
        _grandWinnersMode = true;
        renderCompetition();
      });
      // Show popup if it was missed (app restart / navigation away before 500ms)
      if (G.series.pendingRank !== undefined) {
        setTimeout(() => _showSeriesCompletePopup(G.series.pendingRank, G.series.pendingGrandReward || 0), 300);
      }
    } else {
      div.querySelector('.js-new-comp').addEventListener('click', () => {
        G.competition = null; saveState(); renderCompetition();
      });
    }
    el.appendChild(div);
    return;
  }

  // ── Active screen ────────────────────────────────────────────────────────────
  const now       = Date.now();
  const remMs     = Math.max(0, c.ends - now);
  const remMin    = Math.floor(remMs / 60000);
  const remSec    = Math.floor((remMs % 60000) / 1000);
  const board     = getCompLeaderboard();
  const myRankNow = board.findIndex(e => e.isPlayer) + 1;
  const zoneName  = (ZONE_DATA.find(z => z.id === c.zone) || {}).name || 'Zone';

  const div = document.createElement('div');
  div.className = 'comp-active';
  div.innerHTML = `
    <div class="comp-series-header">Competition ${c.seriesNum || '?'} / ${SERIES_LENGTH} — ${c.seriesName || ''}</div>
    <div class="comp-header">
      <div class="comp-zone-label">Zone: ${zoneName}</div>
      <div class="comp-timer" id="comp-timer">${remMin}:${remSec.toString().padStart(2,'0')}</div>
    </div>
    <div class="comp-mybest">
      <div class="comp-best-label">${c.myBest ? 'Your best catch:' : 'No catch yet — go fish!'}</div>
      ${c.myBest ? `<div class="comp-best-fish ${rarityClass(c.myBest.rarity)}">${c.myBest.name} — ${c.myBest.size} — ${c.myBest.value}c</div>` : ''}
      <div class="comp-rank-now">Current rank: #${myRankNow} of 10</div>
    </div>
    <div class="comp-leaderboard-title">Leaderboard</div>
    <div class="comp-leaderboard">${renderLeaderboardRows(board, 5)}</div>
    <button class="btn-primary js-go-fish" style="margin-top:10px">Fish Now</button>`;
  div.querySelector('.js-go-fish').addEventListener('click', () => showScreen('fishing'));
  el.appendChild(div);
}

// ─── HALL OF FAME ─────────────────────────────────────────────────────────────

function checkHofReset() {
  const now = new Date();
  const qMonth = Math.floor(now.getMonth() / 3) * 3;
  const quarterStart = new Date(now.getFullYear(), qMonth, 1).getTime();
  if ((G.hofLastReset || 0) < quarterStart) {
    G.hofActive = {};
    G.hofLastReset = quarterStart;
    saveState();
  }
}

function getNextQuarterDate() {
  const now = new Date();
  const qMonth = Math.floor(now.getMonth() / 3) * 3 + 3;
  const next = new Date(now.getFullYear(), qMonth, 1);
  return next.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

function getEarnedTitles() {
  const wins = G.hofWins || [];
  const seen = new Set();
  return wins.filter(w => { if (seen.has(w.zone)) return false; seen.add(w.zone); return true; })
    .map(w => {
      const z = ZONE_DATA.find(z => z.id === w.zone);
      return { zone: w.zone, title: ZONE_TITLES[w.zone], zoneName: z?.name || w.zone, color: z?.bgColor || '#444', date: w.date };
    });
}

function updateRecord(zone, catchResult) {
  if (catchResult.rarity === 'trash' || catchResult.rarity === 'plant') return;
  if (!G.records) G.records = {};
  const cur = G.records[zone];
  if (!cur || catchResult.value > cur.value) {
    G.records[zone] = {
      fishName: catchResult.name, value: catchResult.value,
      rarity: catchResult.rarity, size: catchResult.size,
      date: new Date().toLocaleDateString(),
    };
    saveState();
  }
}

// ── Statistics ─────────────────────────────────────────────
let _statsTab = 1;
let _bonusesTimerId = null;

function switchStatsTab(n) {
  _statsTab = n;
  document.querySelectorAll('.stats-tab').forEach((btn, i) => {
    btn.classList.toggle('active', i + 1 === n);
  });
  _renderStatsContent();
}

function renderStatistics() {
  document.querySelectorAll('.stats-tab').forEach((btn, i) => {
    btn.classList.toggle('active', i + 1 === _statsTab);
  });
  _renderStatsContent();
}

function _renderStatsContent() {
  _stopBonusesTimers();
  const el = document.getElementById('stats-content');
  if (!el) return;

  if (_statsTab === 8) {
    el.innerHTML = _renderBonusesTab();
    _startBonusesTimers();
    return;
  }

  const NA = '<span class="stat-value untracked">Not tracked yet</span>';
  const val = v => `<span class="stat-value">${v}</span>`;
  const row = (label, value) =>
    `<div class="stat-row"><span class="stat-label">${label}</span>${value !== null ? val(value) : NA}</div>`;

  const trophyRecords = G.trophyRecords || {};
  const trophyKeys = Object.keys(trophyRecords);
  const bestFishStr = (() => {
    if (!trophyKeys.length) return null;
    const best = trophyKeys.reduce((a, b) => trophyRecords[a].weight > trophyRecords[b].weight ? a : b);
    const fish = FISH_DB.find(f => f.id === best);
    return (fish ? fish.name + ' · ' : '') + formatWeight(trophyRecords[best].weight);
  })();

  const zonesUnlocked = ZONE_DATA.filter(z => isZoneUnlocked(z.id)).length;
  const currentZoneName = (ZONE_DATA.find(z => z.id === G.currentZone) || {}).name || G.currentZone;
  const currentRodName  = (RODS.find(r => r.id === G.currentRod) || {}).name || G.currentRod;
  const fishdexPct = Math.round(((G.fishdex || []).length / FISHDEX_TOTAL) * 100) + '%';
  const achClaimed = Object.values((G.quests || {}).ap || {}).filter(a => a.claimed).length;

  const tabs = {
    1: { title: 'Fishing', rows: [
      row('Total Fish Caught',      String((G.stats.totalFish  || 0).toLocaleString())),
      row('Epic+ Catches',          String((G.stats.totalEpic  || 0).toLocaleString())),
      row('Trophy Catches',         String((G.stats.trophyCatches || 0).toLocaleString())),
      row('Trophy Species Recorded',String(trophyKeys.length.toLocaleString())),
      row('Heaviest Catch',         bestFishStr),
      row('Total Trash Collected',  String((G.stats.totalTrash || 0).toLocaleString())),
      row('Total Plants Collected', null),
      row('Legendary Catches',      null),
    ]},
    2: { title: 'Economy', rows: [
      row('Lifetime Coins Earned',  formatCoins(G.stats.lifeCoinsEarned || 0) + 'c'),
      row('Lifetime Coins Spent',   formatCoins(G.stats.lifeCoinsSpent  || 0) + 'c'),
      row('Highest Coin Balance',   formatCoins(G.stats.highestCoins    || 0) + 'c'),
      row('Most Valuable Fish Sold',G.stats.bestFishSold > 0 ? formatCoins(G.stats.bestFishSold) + 'c' : null),
    ]},
    3: { title: 'Automation', rows: [
      row('Catches by Automation',     (G.stats.autoCatchTotal     || 0).toLocaleString()),
      row('Catches from Nets',         (G.stats.autoCatchNet        || 0).toLocaleString()),
      row('Catches from Fishermen',    (G.stats.autoCatchFisherman  || 0).toLocaleString()),
      row('Catches from Boats',        (G.stats.autoCatchBoat       || 0).toLocaleString()),
      row('Catches from Fleets',       (G.stats.autoCatchFleet      || 0).toLocaleString()),
      row('Total Offline Catches',     (G.stats.offlineFishTotal    || 0).toLocaleString()),
    ]},
    4: { title: 'Progression', rows: (() => {
      const allFishdexItems = FISH_DB.filter(f => !f.special).length + PLANT_DB.length + TRASH_DB.length;
      const compParts = [
        { done: ZONE_DATA.filter(z => isZoneUnlocked(z.id)).length,                                          max: ZONE_DATA.length },
        { done: Math.min((G.fishdex || []).length, allFishdexItems),                                         max: allFishdexItems },
        { done: Math.max(0, (G.ownedRods || []).length - 1),                                                  max: RODS.length - 1 },
        { done: new Set((G.ownedStorage || []).map(o => o.id)).size,                                         max: STORAGE_ITEMS.length },
        { done: new Set((G.ownedAutomation || []).map(a => a.id)).size,                                      max: AUTOMATION.length },
        { done: (G.ownedTransport || []).length,                                                              max: TRANSPORT.length },
        { done: achClaimed,                                                                                    max: ACHIEVEMENTS.length },
        { done: (G.prestigeCount || 0) > 0 ? 1 : 0,                                                         max: 1 },
        { done: new Set((G.hofWins || []).map(w => w.zone)).size,                                            max: ZONE_DATA.length },
      ];
      const pct = (compParts.reduce((s, p) => s + p.done / p.max, 0) / compParts.length * 100).toFixed(1) + '%';
      return [
        `<div class="stat-row"><span class="stat-label">Game Completion</span><span class="stat-value">${pct}</span></div>` +
        `<div style="margin-top:-4px;margin-bottom:6px;font-size:calc(clamp(9px,2.1vw,11px)*var(--font-scale,1));color:var(--color-text-dim);font-style:italic">Based on all currently available content</div>`,
        row('Current Zone',       currentZoneName),
        row('Zones Unlocked',     String(zonesUnlocked)),
        row('Current Rod',        currentRodName),
        row('Prestige Resets',    String(G.prestigeCount || 0)),
        row('Black Pearls Earned',String(G.blackPearls   || 0)),
        row('Fishdex Completion', fishdexPct),
      ];
    })()},
    5: { title: 'Gameplay', rows: [
      row('Current Play Streak',  (G.stats.playStreak || 0) + ' days'),
      row('Competitions Won',     String((G.hofWins || []).length)),
      row('Achievements Unlocked',String(achClaimed)),
      row('Seagull Visits',       String(G.stats.totalSeagull || 0)),
      row('Storage Filled Count', String(G.stats.storageFills || 0)),
      row('Daily Quests Completed', null),
    ]},
    6: { title: 'Events', rows: (() => {
      const sts = G.sunkenTreasureStats || {};
      const treasureRows = G.sunkenTreasureUnlocked ? [
        row('Treasure Chests Found',    (sts.foundTotal      || 0).toLocaleString()),
        row('— Manual',                 (sts.foundManual     || 0).toLocaleString()),
        row('— Automation',             (sts.foundAutomation || 0).toLocaleString()),
        row('— Expedition',             (sts.foundExpedition || 0).toLocaleString()),
        row('Chests Opened',            (sts.opened          || 0).toLocaleString()),
        row('Diamonds from Chests',     (sts.diamondsEarned  || 0).toLocaleString()),
        row('Coins from Chests',        formatCoins(sts.coinsEarned || 0) + 'c'),
        `<div class="stat-row" style="border-top:1px solid #333;margin-top:4px;padding-top:4px"></div>`,
      ] : [];
      return [
        ...treasureRows,
        row('Special Events Seen',      ((G.stats.evLuckyHook||0)+(G.stats.evFishingFrenzy||0)+(G.stats.evRapidWaters||0)+(G.stats.evCarePackage||0)+(G.stats.evLostTreasure||0)).toLocaleString()),
        row('Lucky Hook Activations',    (G.stats.evLuckyHook     || 0).toLocaleString()),
        row('Fishing Frenzies',          (G.stats.evFishingFrenzy || 0).toLocaleString()),
        row('Care Packages Claimed',     (G.stats.evCarePackage   || 0).toLocaleString()),
        row('Rapid Waters Activations',  (G.stats.evRapidWaters   || 0).toLocaleString()),
        row('Premium Baits Used',        (G.stats.evPremiumBaits  || 0).toLocaleString()),
        row('Fish Fights Triggered',     (G.stats.fishFightTriggered || 0).toLocaleString()),
        row('Fish Fights Won',           (G.stats.fishFightWon       || 0).toLocaleString()),
        row('Fish Fights Lost',          (G.stats.fishFightLost      || 0).toLocaleString()),
        row('Coins from Fish Fights',    formatCoins(G.stats.fishFightCoinsEarned || 0) + 'c'),
      ];
    })()},
    7: { title: 'Records', rows: (() => {
      const bigFish = G.stats.recBiggestFish;
      const hvyTrp  = G.stats.recHeaviestTrophy;
      const mvs     = G.stats.recMostValuableSale;
      const hzName  = (ZONE_DATA.find(z => z.id === (G.stats.recHighestZone || 'pond')) || {}).name || 'Pond';
      return [
        row('Biggest Fish Caught',    bigFish ? bigFish.name + ' · ' + formatWeight(bigFish.weightG) : null),
        row('Heaviest Trophy Catch',  hvyTrp  ? hvyTrp.name  + ' · ' + formatWeight(hvyTrp.weightG) : null),
        row('Manual Trophies Caught', (G.stats.recManualTrophyCount || 0).toLocaleString()),
        row('Most Valuable Sale',     mvs ? mvs.name + ' (' + mvs.sizeLabel + ') · ' + formatCoins(mvs.value) + 'c' : null),
        row('Highest Sell Multiplier',(G.stats.recHighestMult || 0) > 0 ? (G.stats.recHighestMult).toFixed(1) + 'x' : null),
        row('Peak Diamonds Held',     (G.stats.recHighestDiamonds || 0).toLocaleString()),
        row('Peak Black Pearls Held', (G.stats.recHighestBlackPearls || 0).toLocaleString()),
        row('Highest Zone Reached',   hzName),
        row('Grand Series Wins',      (G.stats.recGrandTitles || 0).toLocaleString()),
      ];
    })()},
  };

  const t = tabs[_statsTab] || tabs[1];
  el.innerHTML = `<div class="stats-category-title">${t.title}</div>${t.rows.join('')}`;
}

// ── Bonuses tab (tab 8) ──────────────────────────────────────
function _renderBonusesTab() {
  const rod = RODS.find(r => r.id === G.currentRod) || RODS[0];
  const devS = G.devSupportOwned ? 1.25 : 1;

  const fmtX = v => v.toFixed(2) + 'x';
  const fmtP = v => v > 0 ? '+' + (v * 100).toFixed(0) + '%' : '0%';
  const src  = (name, val) =>
    `<div class="bonus-source-row"><span>${name}</span><span>${val}</span></div>`;
  const bon  = (label, combined, sources) =>
    `<details class="bonus-item"><summary class="bonus-summary"><span class="bonus-label">${label}</span><span class="bonus-combined">${combined}</span></summary><div class="bonus-sources">${sources.join('')}</div></details>`;
  const sec  = (title, items) =>
    `<div class="bonus-section-header">${title}</div>${items.join('')}`;
  const fmtCd = (id, end, active) => {
    if (!active) return `<span class="bonus-temp-inactive" id="${id}">Inactive</span>`;
    const rem = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    return `<span class="bonus-temp-active" id="${id}">${Math.floor(rem/60)}:${String(rem%60).padStart(2,'0')}</span>`;
  };

  const baseSpeed     = getSpeedMult() * getPearlSpeedMult() * getMasteryAutoSpeedMult();
  const tapsBase      = rod.clicks;
  const tapsReduce    = getPearlMasterAnglerReduce();
  const tapsFinal     = Math.max(4, tapsBase - tapsReduce);
  const storageBase   = 5 + (G.ownedStorage||[]).reduce((s,o) => {
    const it = STORAGE_ITEMS.find(x => x.id === o.id);
    return it ? s + it.capacity : s;
  }, 0);
  const luckywaters   = getPearlLuckyWatersBonus();
  const rareMastery   = getMasteryRareChanceBonus();
  const trophyPearl   = getPearlFishWhispererBonus();
  const trophyMastery = getMasteryTrophyBonus();
  const legendary     = getRodLegendaryBonus();
  const treasure      = getPearlTreasureBonus();

  let html = `<div class="stats-category-title">Bonuses</div>`;

  html += sec('Income', [
    bon('Fish Sell Value',
      fmtX(getRodSellBonus() * getBlackPearlBonus() * getMasteryFishSellMult() * devS),
      [
        src('Basic Rod tier', fmtX(getRodSellBonus())),
        src('Black Pearls',   fmtX(getBlackPearlBonus())),
        src('Zone Mastery',   fmtX(getMasteryFishSellMult())),
        ...(G.devSupportOwned ? [src('Dev Support', '1.25x')] : []),
      ]
    ),
    ...(getRodTier('abyss_rod') > 0 ? [
      bon('Abyss Fish Sell',
        fmtX(getRodAbyssSellBonus()),
        [src('Abyss Rod tier', fmtX(getRodAbyssSellBonus()))]
      ),
    ] : []),
  ]);

  html += sec('Automation', [
    bon('Base Auto Speed', fmtX(baseSpeed), [
      src('Bite Speed base',      fmtX(getSpeedMult())),
      src('Pearl Empire Boost',   fmtX(getPearlSpeedMult())),
      src('Zone Mastery',         fmtX(getMasteryAutoSpeedMult())),
      ...(getAutomationUpgradeLevel() > 0 ? [src('Diamond Auto Upgrade', fmtX(getAutomationUpgradeMultiplier()))] : []),
    ]),
    bon('Net Speed (total)',        fmtX(baseSpeed * getRodNetSpeedMult()), [
      src('Base speed',            fmtX(baseSpeed)),
      src('River Rod tier',        fmtX(getRodNetSpeedMult())),
    ]),
    bon('Fisherman Speed (total)',  fmtX(baseSpeed * getRodFishermanSpeedMult()), [
      src('Base speed',            fmtX(baseSpeed)),
      src('Lake Rod tier',         fmtX(getRodFishermanSpeedMult())),
    ]),
    bon('Boat Speed (total)',       fmtX(baseSpeed * getRodBoatSpeedMult()), [
      src('Base speed',            fmtX(baseSpeed)),
      src('Sea Rod tier',          fmtX(getRodBoatSpeedMult())),
    ]),
    bon('Fleet Speed (total)',      fmtX(baseSpeed * getRodFleetSpeedMult()), [
      src('Base speed',            fmtX(baseSpeed)),
      src('Ocean Rod tier',        fmtX(getRodFleetSpeedMult())),
    ]),
    bon('Multi-Catch', getMultiCatch().toFixed(1) + 'x avg', [
      src('Electronic Bobber tier', '+' + (getBobberTier('electronic_bobber') * 50) + '% catch chance'),
      src('Hauling Nets pearl',     '+' + ((G.pearlUpgrades||{}).multicatch||0)),
    ]),
    bon('Extra Catch Chance', Math.round(getPearlExtraCatchChance() * 100) + '%', [
      src('Offline Expert pearl', '+' + Math.round(getPearlExtraCatchChance() * 100) + '%'),
    ]),
    bon('Offline Production', fmtX(getMasteryOfflineMult()), [
      src('Zone Mastery', fmtX(getMasteryOfflineMult())),
    ]),
  ]);

  html += sec('Fishing', [
    bon('Taps to Catch', tapsFinal + ' taps', [
      src('Rod base (' + rod.name + ')', tapsBase + ' taps'),
      src('Master Angler pearl',         tapsReduce > 0 ? '-' + tapsReduce : 'None'),
      src('Minimum',                     '4 taps'),
    ]),
    bon('Bite Speed', fmtX(getSpeedMult()), [
      src('Basic Bobber tier',       fmtX(1 + getBobberTier('basic_bobber') * 0.03)),
      ...(isRapidWatersActive()  ? [src('Rapid Waters (active)',  '1.50x')] : []),
      ...(isAdSpeedBoostActive() ? [src('Ad Speed Boost (active)','1.25x')] : []),
      ...(G.devSupportOwned      ? [src('Dev Support',            '1.25x')] : []),
      ...(G.removeAds            ? [src('Remove Ads',             '1.25x')] : []),
    ]),
  ]);

  html += sec('Storage', [
    bon('Storage Capacity', storageCapacity().toLocaleString() + ' slots', [
      src('Base + items',           storageBase.toLocaleString()),
      src('Bay Rod tier',           fmtX(getRodStorageCapacityMult())),
      src('Pearl Expanded Holds',   fmtX(getPearlStorageMult())),
      src('Zone Mastery',           fmtX(getMasteryStorageMult())),
      ...(getStorageUpgradeLevel() > 0 ? [src('Diamond Storage Upgrade', fmtX(getStorageUpgradeMultiplier()))] : []),
      ...(G.devSupportOwned ? [src('Dev Support', '1.25x')] : []),
    ]),
  ]);

  html += sec('Loot and Rarity', [
    bon('Lucky Waters', luckywaters > 0 ? fmtP(luckywaters) + ' Rare+ weight' : 'None', [
      src('Pearl Lucky Waters', fmtP(luckywaters)),
    ]),
    bon('Rare Catch Bonus', rareMastery > 0 ? fmtP(rareMastery) + ' weight' : 'None', [
      src('Zone Mastery', fmtP(rareMastery)),
    ]),
    bon('Trophy Fish Bonus', (trophyPearl + trophyMastery) > 0 ? fmtP(trophyPearl + trophyMastery) + ' weight' : 'None', [
      src('Pearl Fish Whisperer', fmtP(trophyPearl)),
      src('Zone Mastery',         fmtP(trophyMastery)),
    ]),
    bon('Legendary Bonus', legendary > 0 ? fmtP(legendary) + ' weight' : 'None', [
      src('Carbon Rod tier', fmtP(legendary)),
    ]),
    bon('Treasure Event Bonus', treasure > 0 ? fmtP(treasure) + ' event weight' : 'None', [
      src('Pearl Treasure Hunter', fmtP(treasure)),
    ]),
  ]);

  html += sec('Competitions', [
    bon('Reward Multiplier', fmtX(getPearlCompSpiritMult() * getMasteryCompMult()), [
      src('Pearl Competition Spirit', fmtX(getPearlCompSpiritMult())),
      src('Zone Mastery',             fmtX(getMasteryCompMult())),
    ]),
  ]);

  html += sec('Diamonds and Events', [
    bon('Trophy Fish Sale Diamonds', fmtX(getRodDiamondMult()), [
      src('Mythic Rod tier', fmtX(getRodDiamondMult())),
    ]),
    bon('Seagull Reward', fmtX(getSeagullRewardMultiplier()), [
      src('Seagull Bait count', (G.seagullBaitCount||0) + ' baits (+10% each)'),
    ]),
    bon('Seagull Interval', Math.round(getSeagullIntervalMs()/1000) + 's', [
      src('Base interval',  '60s'),
      src('Bait reduction', '-5% per bait'),
      src('Current count',  (G.seagullBaitCount||0) + ' baits'),
    ]),
  ]);

  const autoSellLabel = (() => {
    if (G.autoSellPermanent && G.autoSellEnabled)
      return '<span class="bonus-temp-active">Always On</span>';
    if (isTempAutoSellActive())
      return fmtCd('bns-tmr-sell', G.autoSellEnd, true);
    return '<span class="bonus-temp-inactive" id="bns-tmr-sell">Inactive</span>';
  })();

  html += sec('Temporary Effects', [
    bon('Rapid Waters',  fmtCd('bns-tmr-rapid', G.rapidWatersEnd,  isRapidWatersActive()),  [src('Effect when active', '1.50x catch speed')]),
    bon('Lucky Hook',    fmtCd('bns-tmr-lucky', G.specialCatchEnd, isLuckyHookActive()),    [src('Effect when active', 'Next catch guaranteed Rare+')]),
    bon('Premium Bait',  fmtCd('bns-tmr-bait',  G.premiumBaitEnd,  isPremiumBaitActive()),  [src('Effect when active', '+100% non-Common rarity weight')]),
    bon('Ad Speed Boost',fmtCd('bns-tmr-ad',    G.adSpeedBoostEnd, isAdSpeedBoostActive()),[src('Effect when active', '1.25x catch speed')]),
    bon('Auto-Sell',     autoSellLabel,                                                      [src('Effect when active', 'Fish sell automatically at Surge demand')]),
  ]);

  return html;
}

function _startBonusesTimers() {
  _stopBonusesTimers();
  _bonusesTimerId = setInterval(_updateBonusesTimers, 1000);
}

function _stopBonusesTimers() {
  if (_bonusesTimerId) { clearInterval(_bonusesTimerId); _bonusesTimerId = null; }
}

function _updateBonusesTimers() {
  if (_statsTab !== 8) { _stopBonusesTimers(); return; }
  const el = document.getElementById('stats-content');
  if (!el) { _stopBonusesTimers(); return; }

  const update = (id, end, active) => {
    const span = document.getElementById(id);
    if (!span) return;
    if (!active) {
      span.className = 'bonus-temp-inactive';
      span.textContent = 'Inactive';
    } else {
      span.className = 'bonus-temp-active';
      const rem = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      span.textContent = Math.floor(rem / 60) + ':' + String(rem % 60).padStart(2, '0');
    }
  };

  update('bns-tmr-rapid', G.rapidWatersEnd,  isRapidWatersActive());
  update('bns-tmr-lucky', G.specialCatchEnd, isLuckyHookActive());
  update('bns-tmr-bait',  G.premiumBaitEnd,  isPremiumBaitActive());
  update('bns-tmr-ad',    G.adSpeedBoostEnd, isAdSpeedBoostActive());
  if (!(G.autoSellPermanent && G.autoSellEnabled))
    update('bns-tmr-sell', G.autoSellEnd, isTempAutoSellActive());
}

// ── Hall of Fame (used by competition system) ───────────────
function renderHallOfFame() {
  const el = document.getElementById('halloffame-content');
  if (!el) return;
  el.innerHTML = '';

  // ── Quarterly reset notice ──
  const resetEl = document.createElement('div');
  resetEl.className = 'hof-reset-notice';
  resetEl.textContent = 'Resets ' + getNextQuarterDate();
  el.appendChild(resetEl);

  // ── Your Titles ──
  const titles = getEarnedTitles();
  const titlesHdr = document.createElement('div');
  titlesHdr.className = 'hof-section-header';
  titlesHdr.textContent = 'Your Titles';
  el.appendChild(titlesHdr);

  if (!titles.length) {
    const empty = document.createElement('div');
    empty.className = 'hof-empty';
    empty.textContent = 'Win a competition to earn a title';
    el.appendChild(empty);
  } else {
    titles.forEach(t => {
      const row = document.createElement('div');
      row.className = 'hof-title-row';
      row.innerHTML = `
        <div class="hof-title-bar" style="background:${t.color}"></div>
        <div class="hof-title-text">
          <div class="hof-title-name">${t.title}</div>
          <div class="hof-title-zone">${t.zoneName} · ${t.date}</div>
        </div>
        <div class="hof-title-crown">&#128081;</div>`;
      el.appendChild(row);
    });
  }

  // ── Zone Records ──
  const zoneHdr = document.createElement('div');
  zoneHdr.className = 'hof-section-header';
  zoneHdr.textContent = 'Zone Records';
  el.appendChild(zoneHdr);

  ZONE_DATA.forEach(z => {
    const unlocked = isZoneUnlocked(z.id);
    const active   = G.hofActive?.[z.id];
    const seeded   = HOF_SEEDED[z.id];
    const show     = active || seeded || null;
    const isPlayer = !!(active?.isPlayer);

    const card = document.createElement('div');
    card.className = 'hof-card' + (!unlocked ? ' hof-locked' : '') + (isPlayer ? ' hof-card-player' : '');
    card.innerHTML = `
      <div class="hof-zone-bar" style="background:${z.bgColor}"></div>
      <div class="hof-card-body">
        <div class="hof-zone-name">${z.name}</div>
        ${!show
          ? '<div class="hof-no-record">No record yet</div>'
          : `<div class="hof-record-fish ${rarityClass(show.rarity)}">${show.fishName}</div>
             <div class="hof-record-meta">${show.size} · ${show.value.toLocaleString()}c${show.date ? ' · ' + show.date : ''}</div>
             ${isPlayer
               ? '<div class="hof-player-badge">&#9733; You</div>'
               : '<div class="hof-record-holder">' + (show.player || '') + '</div>'}`}
      </div>
      ${isPlayer ? '<div class="hof-zone-crown">&#128081;</div>' : ''}`;
    el.appendChild(card);
  });

  // ── Trophy Records ──
  const trophyRecs = G.trophyRecords || {};
  const recKeys = Object.keys(trophyRecs);
  if (recKeys.length) {
    const tHdr = document.createElement('div');
    tHdr.className = 'hof-section-header';
    tHdr.textContent = 'Trophy Records';
    el.appendChild(tHdr);

    recKeys
      .map(fishId => ({ fishId, rec: trophyRecs[fishId], fish: FISH_DB.find(f => f.id === fishId) }))
      .sort((a, b) => b.rec.weight - a.rec.weight)
      .forEach(({ rec, fish }) => {
        const card = document.createElement('div');
        card.className = 'hof-trophy-row';
        const date = rec.caughtAt
          ? new Date(rec.caughtAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short' })
          : '';
        card.innerHTML = `
          <img class="hof-trophy-img" src="${fish?.img || ''}" alt="" ${!fish?.img ? 'style="display:none"' : ''}>
          <div class="hof-trophy-info">
            <div class="hof-trophy-name">${fish?.name || fishId}</div>
            <div class="hof-trophy-meta">${formatWeight(rec.weight)}${date ? ' · ' + date : ''}</div>
          </div>
          <div class="hof-trophy-badge">&#127942;</div>`;
        el.appendChild(card);
      });
  }
}

// ─── ABYSS ────────────────────────────────────────────────────────────────────

// ─── DIAMOND STORE ────────────────────────────────────────────────────────────

const DIAMOND_PACKS = [
  { id:'starter',  name:'Starter Pack',   diamonds:200,  tag:'BEST START', starterOnly:true },
  { id:'pouch',    name:"Angler's Pouch", diamonds:400,  tag:'' },
  { id:'chest',    name:"Fisher's Chest", diamonds:1100, tag:'+25% BONUS' },
  { id:'vault',    name:"Captain's Vault",diamonds:2500, tag:'+67% BONUS' },
];

function renderDiamondStore() {
  const el = document.getElementById('diamondstore-content');
  if (!el) return;

  const bal = G.diamonds || 0;
  const removeAdsOwned = !!G.removeAds;
  const devSupportOwned = !!G.devSupportOwned;

  let html = `
    <div class="ds-balance-bar">
      <img src="img/icons/Diamond icon.png" class="ds-balance-icon" alt="">
      <span class="ds-balance-num">${bal} Diamonds</span>
    </div>

    <div class="ds-section-label">Diamond Packs</div>
    <div class="ds-packs-grid">`;

  DIAMOND_PACKS.forEach(pack => {
    const isStarter = pack.starterOnly && !G.starterPackClaimed;
    const alreadyClaimed = pack.starterOnly && G.starterPackClaimed;
    if (alreadyClaimed) return;

    const tagHtml = pack.tag ? `<div class="ds-pack-tag">${pack.tag}</div>` : '';
    const starterBadge = isStarter ? `<div class="ds-starter-badge">First Purchase Bonus!</div>` : '';

    html += `
      <div class="ds-pack-card${isStarter ? ' ds-pack-starter' : ''}">
        ${tagHtml}
        <div class="ds-pack-amount"><img src="img/icons/Diamond icon.png" class="ds-inline-icon" alt=""> ${pack.diamonds}</div>
        <div class="ds-pack-name">${pack.name}</div>
        ${starterBadge}
        <button class="btn-primary ds-pack-btn" onclick="buyDiamondPack('${pack.id}')">${getProductPrice(pack.id)}</button>
      </div>`;
  });

  html += `</div>

    <div class="ds-section-label">Premium Features</div>
    <div class="ds-premium-list">`;

  if (!removeAdsOwned) {
    html += `
      <div class="ds-premium-row">
        <div class="ds-premium-info">
          <div class="ds-premium-name">Remove Ads</div>
          <div class="ds-premium-desc">No more ads · +25% fishing speed permanently · Special Catch every 10 min auto</div>
        </div>
        <button class="btn-primary ds-premium-btn" onclick="buyRemoveAds()">${getProductPrice(PRODUCT.REMOVE_ADS)}</button>
      </div>`;
  } else {
    html += `
      <div class="ds-premium-row ds-premium-owned">
        <div class="ds-premium-info">
          <div class="ds-premium-name">Remove Ads</div>
          <div class="ds-premium-desc">Active — enjoying an ad-free experience!</div>
        </div>
        <div class="ds-premium-owned-badge">OWNED</div>
      </div>`;
  }

  html += G.autoSellPermanent ? `
      <div class="ds-premium-row ds-premium-owned">
        <div class="ds-premium-info">
          <div class="ds-premium-name">Permanent Auto-Seller</div>
          <div class="ds-premium-desc">Owned — sells all catch once every 24 in-game hours (every 1 real hour) · toggleable on/off</div>
        </div>
        <button class="btn-toggle ${G.autoSellEnabled ? '' : 'off'}" onclick="toggleAutoSell()">${G.autoSellEnabled ? 'ON' : 'OFF'}</button>
      </div>` : `
      <div class="ds-premium-row">
        <div class="ds-premium-info">
          <div class="ds-premium-name">Permanent Auto-Seller</div>
          <div class="ds-premium-desc">Sells all catch once every 24 in-game hours (every 1 real hour) · toggleable on/off</div>
        </div>
        <button class="btn-primary ds-premium-btn" onclick="buyPermanentAutoSell()">${getProductPrice(PRODUCT.PERMANENT_AUTOSELLER)}</button>
      </div>`;

  html += devSupportOwned ? `
      <div class="ds-premium-row ds-premium-owned">
        <div class="ds-premium-info">
          <div class="ds-premium-name">Developer's Support Package</div>
          <div class="ds-premium-desc">Active — +25% fishing speed · +25% sell price · +25% storage capacity</div>
        </div>
        <div class="ds-premium-owned-badge">OWNED</div>
      </div>` : `
      <div class="ds-premium-row">
        <div class="ds-premium-info">
          <div class="ds-premium-name">Developer's Support Package</div>
          <div class="ds-premium-desc">Support the dev! +25% fishing speed · +25% sell price · +25% storage capacity — permanently</div>
        </div>
        <button class="btn-primary ds-premium-btn" onclick="buyDevSupport()">${getProductPrice(PRODUCT.DEV_SUPPORT)}</button>
      </div>`;
  html += `</div>`;

  const _permUpgDefs = [
    { type:'autoSpeed', label:'Automation Upgrade', desc:'+10% global automation speed per level. Survives Prestige.' },
    { type:'storage',   label:'Storage Upgrade',    desc:'+10% global storage capacity per level. Survives Prestige.' },
  ];
  const permUpgradeRows = _permUpgDefs.map(d => {
    const lvl     = d.type === 'autoSpeed' ? getAutomationUpgradeLevel() : getStorageUpgradeLevel();
    const maxLvl  = d.type === 'autoSpeed' ? getAutomationUpgradeMaxLevel() : getStorageUpgradeMaxLevel();
    const atCap   = lvl >= maxLvl;
    const COST    = 100;
    const canAff  = !atCap && bal >= COST;
    const curEff  = lvl > 0 ? `+${lvl*10}% ${d.type === 'autoSpeed' ? 'automation speed' : 'storage capacity'}` : 'None yet';
    return `
      <div class="ds-spend-row">
        <div class="ds-spend-info">
          <div class="ds-spend-name">${d.label} <span style="color:#5cf;font-size:12px">Lv ${lvl}/${maxLvl}${atCap ? ' <span style="color:#f0c040">(MAX)</span>' : ''}</span></div>
          <div class="ds-spend-desc">${d.desc}</div>
          <div style="font-size:12px;color:#90c890;margin-top:2px">${curEff}</div>
        </div>
        <button class="btn-primary ds-spend-btn" ${canAff ? '' : 'disabled'}
          onclick="buyDiamondUpgrade('${d.type}')">
          ${atCap ? 'MAX' : `100 <img src="img/icons/Diamond icon.png" class="ds-inline-icon" alt="">`}
        </button>
      </div>`;
  }).join('');

  html += `
    <div class="ds-section-label">Permanent Upgrades</div>
    <div class="ds-spend-list">
      ${permUpgradeRows}
    </div>

    <div class="ds-section-label">Spend Diamonds</div>
    <div class="ds-spend-list">
      <div class="ds-spend-row">
        <img src="img/icons/Shop/Bait/Premium Bait.png" class="ds-spend-icon" alt="">
        <div class="ds-spend-info">
          <div class="ds-spend-name">Premium Bait</div>
          <div class="ds-spend-desc">+100% rare catch chance for 30 minutes</div>
        </div>
        <button class="btn-primary ds-spend-btn" onclick="confirmDiamondPurchase('Premium Bait (30 min)', 5, () => { buyPremiumBait(); showScreen('diamondstore'); })">5 <img src="img/icons/Diamond icon.png" class="ds-inline-icon" alt=""></button>
      </div>

      <div class="ds-spend-row">
        <img src="img/icons/Game screen icons/Shop.png" class="ds-spend-icon" alt="">
        <div class="ds-spend-info">
          <div class="ds-spend-name">Auto-Seller (6h)</div>
          <div class="ds-spend-desc">Automatically sells your catch every 1 real hour (24 in-game hours) while active. Duration: 6 hours.</div>
        </div>
        <button class="btn-primary ds-spend-btn" onclick="confirmDiamondPurchase('Auto-Seller (6h)', 10, buyTempAutoSell)">10 <img src="img/icons/Diamond icon.png" class="ds-inline-icon" alt=""></button>
      </div>
    </div>

    <div class="ds-section-label">Bobber Cosmetics</div>
    <div style="font-size:12px;color:var(--color-text-dim);margin:-4px 0 10px;text-align:center;">Changes appearance only. No gameplay effect.</div>
    <div id="bobber-cosmetics-grid" class="bobber-cosmetics-grid"></div>

    `;

  el.innerHTML = html;
  renderBobberCosmetics();
}

// ─── DIAMOND PURCHASE CONFIRMATION ────────────────────────────────────────────

function confirmDiamondPurchase(itemName, diamondCost, onConfirm) {
  document.getElementById('diamond-confirm-item').textContent = itemName;
  document.getElementById('diamond-confirm-cost').innerHTML =
    'Cost: ' + diamondCost + ' <img src="img/icons/Diamond icon.png" style="width:14px;height:14px;vertical-align:middle" alt="Diamonds">';
  const btn = document.getElementById('diamond-confirm-ok-btn');
  btn.onclick = () => { closeDiamondConfirm(); onConfirm(); };
  document.getElementById('diamond-confirm-overlay').classList.remove('hidden');
}

function closeDiamondConfirm() {
  document.getElementById('diamond-confirm-overlay').classList.add('hidden');
}

const AUTO_CAT_ICONS = {
  net:       'img/icons/Shop/Automation/Fishing Net.png',
  fisherman: 'img/icons/Shop/Automation/Local Fisher.png',
  boat:      'img/icons/Shop/Automation/Row Boat.png',
  fleet:     'img/icons/Shop/Automation/Small Fleet.png',
};

let _autoRateDropdownOpen = false;
function toggleAutoRateDropdown() {
  const dd = document.getElementById('auto-rate-dropdown');
  if (!dd) return;
  _autoRateDropdownOpen = !_autoRateDropdownOpen;
  if (_autoRateDropdownOpen) {
    _renderAutoRateDropdown();
    dd.classList.remove('hidden');
  } else {
    dd.classList.add('hidden');
  }
}
function _renderAutoRateDropdown() {
  const el = document.getElementById('auto-rate-dropdown-content');
  if (!el) return;
  const types = ['net', 'fisherman', 'boat', 'fleet'];
  const names = { net:'Nets', fisherman:'Fishermen', boat:'Boats', fleet:'Fleets' };
  let html = '';
  let hasAny = false;
  for (const type of types) {
    const rate = _calcTypeRate(type);
    if (rate <= 0) continue;
    hasAny = true;
    const icon = AUTO_CAT_ICONS[type] || '';
    html += `<div class="auto-rate-row">
      <img src="${icon}" alt="${type}">
      <span>${names[type]}</span>
      <span class="auto-rate-val">${_fmtRate(rate)}</span>
    </div>`;
  }
  // Individual rows for ghost-only units when owned
  AUTOMATION.filter(a => a.ghostOnly).forEach(a => {
    const count = G.ownedAutomation.filter(o => o.id === a.id).length;
    if (count <= 0) return;
    hasAny = true;
    const unitRate = count / a.rate;
    html += `<div class="auto-rate-row" style="padding-left:14px;opacity:0.85">
      <img src="${a.img}" alt="${a.name}" style="width:20px;height:20px;object-fit:contain;">
      <span>${a.name}${count > 1 ? ' ×' + count : ''}</span>
      <span class="auto-rate-val">${_fmtRate(unitRate)}</span>
    </div>`;
  });
  if (!hasAny) html = '<div style="color:#aaa;font-size:12px;padding:4px 0;">No automation yet</div>';
  el.innerHTML = html;
}

function openMarketHelp()  {
  const trEl = document.getElementById('market-help-treasure');
  if (trEl) trEl.style.display = G.sunkenTreasureUnlocked ? '' : 'none';
  document.getElementById('market-help-overlay').classList.remove('hidden');
}
function closeMarketHelp() { document.getElementById('market-help-overlay').classList.add('hidden'); }
function openCompHelp()    { document.getElementById('comp-help-overlay').classList.remove('hidden'); }
function closeCompHelp()   { document.getElementById('comp-help-overlay').classList.add('hidden'); }
function openFishdexHelp() { document.getElementById('fishdex-help-overlay').classList.remove('hidden'); }
function closeFishdexHelp(){ document.getElementById('fishdex-help-overlay').classList.add('hidden'); }

// ─── LEGENDARY CATCH POPUP ───────────────────────────────────────────────────
function _displayLegendaryPopup(info) {
  const overlay  = document.getElementById('legendary-catch-overlay');
  if (!overlay) return;

  const fishDef = FISH_DB.find(f => f.id === info.fishId);
  const zoneObj = (typeof ZONE_DATA !== 'undefined' ? ZONE_DATA : []).find(z => z.id === info.zone);
  const desc    = (() => {
    const entry = typeof _fishdexInfoEntry === 'function' ? _fishdexInfoEntry(info.fishId) : null;
    return (entry && entry.description) || '';
  })();

  const imgEl   = document.getElementById('legendary-catch-img');
  const nameEl  = document.getElementById('legendary-catch-name');
  const zoneEl  = document.getElementById('legendary-catch-zone');
  const descEl  = document.getElementById('legendary-catch-desc');
  const fdEl    = document.getElementById('legendary-first-disc');

  if (imgEl)  { imgEl.src = info.img || (fishDef && fishDef.img) || ''; imgEl.alt = info.name || ''; }
  if (nameEl)  nameEl.textContent = info.name || '';
  if (zoneEl)  zoneEl.textContent = zoneObj ? zoneObj.name : (info.zone || '');
  if (descEl)  descEl.textContent = desc;
  if (fdEl)   { fdEl.classList.toggle('hidden', !info.isFirst); }

  overlay.classList.remove('hidden');
  playSfx(typeof sfxFishCaught !== 'undefined' ? sfxFishCaught : null);
}

function closeLegendaryCatchPopup() {
  const overlay = document.getElementById('legendary-catch-overlay');
  if (overlay) overlay.classList.add('hidden');
  // Show next queued popup (for multiple offline legendary catches)
  setTimeout(_drainLegendaryPopups, 200);
}

const SHOP_HELP_CONTENT = {
  rods: {
    title: 'Fishing Rods',
    body: `<p>Your rod determines how many taps it takes to land a fish. Fewer taps means faster catches.</p>
<p>Each rod also unlocks access to a new fishing zone when combined with the required transport vehicle.</p>
<p>Each owned rod can be upgraded up to 15 tiers independently, unlocking bonus effects like faster automation or higher sell prices.</p>
<p style="color:var(--color-text-dim);font-size:12px;">Rods reset on Prestige — except the progress you've made carries over as Black Pearls.</p>`
  },
  bait: {
    title: 'Bait & Tackle',
    body: `<p>Bobbers are permanent upgrades with up to 15 tiers each — no equipping needed, effects apply immediately.</p>
<p style="color:var(--color-text-dim);font-size:12px;">Bait resets on Prestige.</p>`
  },
  automation: {
    title: 'Automation',
    body: `<p>Automation units catch fish for you — even when you're not playing.</p>
<p>You can buy multiple of the same unit and they all produce at the same time. All units pool together and fish across all your unlocked zones.</p>
<p>Higher tiers catch faster. New tiers unlock as you progress through zones.</p>
<p style="color:var(--color-text-dim);font-size:12px;">Automation resets on Prestige.</p>`
  },
  storage: {
    title: 'Storage',
    body: `<p>Storage controls how many fish you can hold at once.</p>
<p>Upgrades take effect immediately — no equipping needed. New tiers unlock as you reach higher zones.</p>
<p style="color:var(--color-text-dim);font-size:12px;">Storage resets on Prestige.</p>`
  },
  jeweler: {
    title: 'Jeweler — Pearl Upgrades',
    body: `<p>Spend <strong>Black Pearls</strong> here on permanent upgrades that apply across the whole game and <em>survive every Prestige reset</em>.</p>
<p>Pearl upgrades stack with each Prestige — the more you prestige, the more you can invest here.</p>
<p>Black Pearls are earned by Prestiging. The more progress you've made, the more Pearls you receive.</p>
<div style="margin-top:10px;padding:8px 10px;background:rgba(180,130,255,0.08);border-left:3px solid #b47fff;border-radius:4px;font-size:12px;line-height:1.7;">
  <strong style="color:#d4a0ff;">Unspent Pearl Bonus — Diminishing Returns</strong><br>
  Every unspent Black Pearl increases your fish sell value, but each additional Pearl adds a smaller bonus than the last.<br>
  <span style="color:#aaa;">Examples: 10 pearls → +9.5% · 100 → +69% · 500 → +179% · 1 000 → +240% · 5 000 → +393%</span><br>
  Spending pearls on upgrades reduces this bonus — so there is a trade-off between passive sell value and permanent upgrades.
</div>
<div style="margin-top:10px;font-size:12px;line-height:1.6;">
  <div style="color:#c55;margin-bottom:3px;"><strong>Resets on Prestige:</strong> coins, rods, storage, automation, transport, zones.</div>
  <div style="color:#5c5;"><strong>Kept after Prestige:</strong> Fishdex, mastery, diamonds, Black Pearls, Pearl upgrades, cosmetics.</div>
</div>`
  }
};

function openShopHelp() {
  const tab = activeShopTab || 'rods';
  const info = SHOP_HELP_CONTENT[tab] || SHOP_HELP_CONTENT.rods;
  document.getElementById('shop-help-title').textContent = info.title;
  document.getElementById('shop-help-body').innerHTML = info.body;
  document.getElementById('shop-help-overlay').classList.remove('hidden');
}
function closeShopHelp() { document.getElementById('shop-help-overlay').classList.add('hidden'); }

function buyDiamondPack(id) {
  const pack = DIAMOND_PACKS.find(p => p.id === id);
  if (!pack) return;
  iapBuyDiamondPack(id); // iap.js — amount comes from DIAMOND_PACK_MAP in iap.js
}

function buyRemoveAds() {
  iapBuyRemoveAds(); // iap.js
}

function buyPermanentAutoSell() {
  iapBuyPermanentAutoSell(); // iap.js
}

function buyDevSupport() {
  iapBuyDevSupport(); // iap.js
}


function renderAbyss() {
  const el = document.getElementById('abyss-content');
  if (!el) return;
  el.innerHTML = `
    <div class="abyss-screen">
      <img src="img/icons/Abyss mode landscape.png" alt="Abyss Mode Preview" class="abyss-sneak-img">
    </div>`;
}

// ─── FONT SCALE ───────────────────────────────────────────────────────────────
// styles.css font-size declarations are pre-wrapped in calc(orig * var(--font-scale, 1));
// the Settings slider only needs to set the CSS variable.

function applyFontScale() {
  document.documentElement.style.setProperty('--font-scale', (G.fontScale || 100) / 100);
}

function applyBobberScale() {
  document.documentElement.style.setProperty('--bobber-scale', (G.bobberScale || 100) / 100);
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────

async function redeemCode(rawCode) {
  const code = (rawCode || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!code) { showStatus('Enter a code first.', 1500); return; }
  const user = getCurrentUser();
  if (!user?.uid) { showStatus('Sign in first to redeem a code.', 2000); return; }
  try {
    const res  = await fetch('https://tile-royale-eu-production.up.railway.app/pa/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: user.uid, code }),
    });
    const data = await res.json();
    if (!data.ok) {
      const msgs = { invalid_code: 'Invalid or expired code.', already_redeemed: 'Code already used.', expired: 'Code has expired.', server_error: 'Server error, try again.' };
      showStatus(msgs[data.error] || 'Invalid code.', 2500);
      return;
    }
    const r = data.reward;
    if (r.rewardType === 'diamonds' && r.amount) {
      G.diamonds = (G.diamonds || 0) + r.amount;
      saveState(); updateHUD();
      showStatus(`+${r.amount} Diamonds added! ${data.desc || ''}`, 3000);
    } else if (r.rewardType === 'coins' && r.amount) {
      G.coins = (G.coins || 0) + r.amount;
      saveState(); updateHUD();
      showStatus(`+${formatNumber(r.amount)} coins added! ${data.desc || ''}`, 3000);
    } else if (r.rewardType === 'autoIncome') {
      const income = Math.round(estimateAutoHourlyIncome() * (r.amount || 1));
      _earnCoins(income);
      if (r.bonusDiamonds) G.diamonds = (G.diamonds || 0) + r.bonusDiamonds;
      saveState(); updateHUD();
      const diamondPart = r.bonusDiamonds ? ` +${r.bonusDiamonds} Diamonds!` : '';
      showStatus(`+${formatCoins(income)} coins!${diamondPart}`, 4000);
    } else if (r.rewardType === 'save_restore' && r.save) {
      const saveData = typeof r.save === 'string' ? JSON.parse(r.save) : r.save;
      Object.assign(G, saveData);
      saveState();
      showStatus('Save restored! Reloading...', 2000);
      setTimeout(() => location.reload(), 2000);
    } else {
      showStatus(data.desc || 'Reward claimed!', 2500);
    }
    const input = document.getElementById('redeem-code-input');
    if (input) input.value = '';
  } catch (e) {
    showStatus('Could not reach server. Check your connection.', 2500);
  }
}

function renderSettings() {
  const muteBtn = document.getElementById('btn-music-mute');
  if (muteBtn) {
    muteBtn.textContent = G.musicMuted ? 'OFF' : 'ON';
    muteBtn.classList.toggle('off', !!G.musicMuted);
    muteBtn.onclick = () => {
      G.musicMuted = !G.musicMuted;
      applyMusicState();
      saveState();
      renderSettings();
    };
  }
  const volSlider = document.getElementById('music-volume-slider');
  if (volSlider) {
    volSlider.value = G.musicVolume ?? 50;
    volSlider.oninput = () => {
      G.musicVolume = parseInt(volSlider.value);
      bgMusic.volume = G.musicVolume / 100;
      saveState();
    };
  }
  const sfxBtn = document.getElementById('btn-sfx-toggle');
  if (sfxBtn) {
    sfxBtn.textContent = G.soundEnabled === false ? 'OFF' : 'ON';
    sfxBtn.classList.toggle('off', G.soundEnabled === false);
    sfxBtn.onclick = () => {
      G.soundEnabled = G.soundEnabled === false ? true : false;
      saveState();
      renderSettings();
    };
  }
  const hapticsBtn = document.getElementById('btn-haptics-toggle');
  if (hapticsBtn) {
    hapticsBtn.textContent = G.hapticsEnabled === false ? 'OFF' : 'ON';
    hapticsBtn.classList.toggle('off', G.hapticsEnabled === false);
    hapticsBtn.onclick = () => {
      G.hapticsEnabled = G.hapticsEnabled === false ? true : false;
      saveState();
      renderSettings();
    };
  }
  const numFmtBtn = document.getElementById('btn-numformat-toggle');
  if (numFmtBtn) {
    const isSci = G.numberFormat === 'scientific';
    numFmtBtn.textContent = isSci ? 'Scientific' : 'Normal';
    numFmtBtn.classList.toggle('off', isSci);
    numFmtBtn.onclick = () => {
      G.numberFormat = isSci ? 'normal' : 'scientific';
      saveState();
      renderSettings();
      updateHUD();
    };
  }
  const tickersBtn = document.getElementById('btn-tickers-toggle');
  if (tickersBtn) {
    tickersBtn.textContent = G.tickersEnabled === false ? 'OFF' : 'ON';
    tickersBtn.classList.toggle('off', G.tickersEnabled === false);
    tickersBtn.onclick = () => {
      G.tickersEnabled = G.tickersEnabled === false ? true : false;
      saveState();
      renderSettings();
    };
  }
  const djBtn = document.getElementById('btn-dadjokes-toggle');
  if (djBtn) {
    djBtn.textContent = G.dadJokesEnabled ? 'ON' : 'OFF';
    djBtn.classList.toggle('off', !G.dadJokesEnabled);
    djBtn.onclick = () => {
      G.dadJokesEnabled = !G.dadJokesEnabled;
      saveState();
      renderSettings();
    };
  }
  const djHelpBtn = document.getElementById('btn-dadjokes-help');
  if (djHelpBtn) {
    djHelpBtn.onclick = () => {
      if (typeof showDadJokesHelp === 'function') showDadJokesHelp();
    };
  }
  const fontSlider = document.getElementById('font-size-slider');
  const fontValue  = document.getElementById('font-size-value');
  if (fontSlider) {
    fontSlider.value = G.fontScale || 100;
    if (fontValue) fontValue.textContent = (G.fontScale || 100) + '%';
    fontSlider.oninput = () => {
      G.fontScale = parseInt(fontSlider.value);
      G.fontScaleCustomized = true;
      if (fontValue) fontValue.textContent = G.fontScale + '%';
      applyFontScale();
      saveState();
    };
  }
  const bobberSlider = document.getElementById('bobber-size-slider');
  const bobberValue  = document.getElementById('bobber-size-value');
  if (bobberSlider) {
    bobberSlider.value = G.bobberScale || 100;
    if (bobberValue) bobberValue.textContent = (G.bobberScale || 100) + '%';
    bobberSlider.oninput = () => {
      G.bobberScale = parseInt(bobberSlider.value);
      G.bobberScaleCustomized = true;
      if (bobberValue) bobberValue.textContent = G.bobberScale + '%';
      applyBobberScale();
      saveState();
    };
  }
  const nameInput = document.getElementById('player-name-input');
  const nameBtn   = document.getElementById('btn-save-name');
  if (nameInput && nameBtn) {
    nameInput.value = G.playerName || '';
    nameBtn.onclick = () => {
      const name = (nameInput.value || '').replace(/[<>&"']/g, '').trim().slice(0, 10);
      G.playerName = name;
      nameInput.value = name;
      saveState();
      showStatus(name ? 'Name saved: ' + name : 'Name cleared', 2000);
    };
  }
  const playerIdDisplay = document.getElementById('player-id-display');
  const copyPlayerIdBtn  = document.getElementById('btn-copy-player-id');
  if (playerIdDisplay && copyPlayerIdBtn) {
    const user = getCurrentUser();
    const uid  = user?.uid || 'Not signed in';
    playerIdDisplay.textContent = uid;
    copyPlayerIdBtn.onclick = () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(uid).then(() => showStatus('Player ID copied!', 1500));
      } else {
        showStatus(uid, 5000);
      }
    };
  }

  const redeemInput = document.getElementById('redeem-code-input');
  const redeemBtn   = document.getElementById('btn-redeem-code');
  if (redeemInput && redeemBtn) {
    redeemBtn.onclick = () => redeemCode(redeemInput.value);
  }

  const resetBtn = document.getElementById('btn-reset-save');
  if (resetBtn) {
    resetBtn.onclick = () => {
      if (confirm('Reset ALL progress? This cannot be undone!')) {
        Object.assign(G, JSON.parse(JSON.stringify(DEFAULT_STATE)));
        G._savedAt = Date.now() + 60000; // 1 min in the future — beats any old cloud save
        saveState(); // writes fresh DEFAULT_STATE to localStorage
        location.reload();
      }
    };
  }

  // social button onclicks set via HTML attributes
}


function renderBobberCosmetics() {
  const grid = document.getElementById('bobber-cosmetics-grid');
  if (!grid) return;
  if (!G.unlockedBobberCosmetics) G.unlockedBobberCosmetics = ['bc_basic'];
  if (!G.equippedBobberCosmetic)  G.equippedBobberCosmetic  = 'bc_basic';

  grid.innerHTML = '';
  BOBBER_COSMETICS.forEach(cosm => {
    const unlocked  = G.unlockedBobberCosmetics.includes(cosm.id);
    const equipped  = G.equippedBobberCosmetic === cosm.id;
    const card = document.createElement('div');
    card.className = 'bobber-cosm-card' + (equipped ? ' equipped' : '') + (unlocked ? '' : ' locked');

    const imgWrap = document.createElement('div');
    imgWrap.className = 'bobber-cosm-img-wrap';
    const img = document.createElement('img');
    img.src = cosm.img;
    img.alt = cosm.name;
    img.className = 'bobber-cosm-img';
    imgWrap.appendChild(img);

    const label = document.createElement('div');
    label.className = 'bobber-cosm-name';
    label.textContent = cosm.name;

    const action = document.createElement('div');
    action.className = 'bobber-cosm-action';

    if (equipped) {
      action.innerHTML = '<span class="bobber-cosm-equipped-tag">Equipped</span>';
    } else if (unlocked) {
      const btn = document.createElement('button');
      btn.className = 'btn-secondary-sm';
      btn.textContent = 'Equip';
      btn.onclick = () => {
        G.equippedBobberCosmetic = cosm.id;
        updateBobberImg();
        saveState();
        renderBobberCosmetics();
      };
      action.appendChild(btn);
    } else {
      const btn = document.createElement('button');
      btn.className = 'btn-primary bobber-cosm-buy-btn';
      btn.innerHTML = '<img src="img/icons/Diamond icon.png" class="diamond-icon-sm" alt=""> ' + cosm.diamondCost;
      btn.onclick = () => {
        if ((G.diamonds || 0) < cosm.diamondCost) { showStatus('Not enough Diamonds!', 1500); return; }
        confirmDiamondPurchase(cosm.name, cosm.diamondCost, () => {
          G.diamonds -= cosm.diamondCost;
          if (!G.unlockedBobberCosmetics) G.unlockedBobberCosmetics = ['bc_basic'];
          G.unlockedBobberCosmetics.push(cosm.id);
          G.equippedBobberCosmetic = cosm.id;
          updateBobberImg();
          updateHUD();
          saveState();
          renderBobberCosmetics();
          showStatus(cosm.name + ' unlocked!', 2000);
        });
      };
      action.appendChild(btn);
    }

    card.appendChild(imgWrap);
    card.appendChild(label);
    card.appendChild(action);
    grid.appendChild(card);
  });
}

// Enter key submits the redeem code
(() => {
  const input = document.getElementById('redeem-code-input');
  if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') redeemCode(input.value); });
})();

// ─── REMOTE CONFIG ────────────────────────────────────────────────────────────

const PA_CONFIG_URL = 'https://tile-royale-eu-production.up.railway.app/pa/config';

let _remoteConfig = {};

function _rcNum(key, fallback) { const v = _remoteConfig[key]; return (typeof v === 'number' && isFinite(v)) ? v : fallback; }
function _rcBool(key, fallback) { const v = _remoteConfig[key]; return typeof v === 'boolean' ? v : fallback; }
function _rcStr(key, fallback)  { const v = _remoteConfig[key]; return (typeof v === 'string' && v) ? v : fallback; }

// Accessor functions used throughout the game
function getRemoteFishSellMult()        { return _rcNum('fishSellMult',            1.0); }
function getRemoteEventIntervalMin()    { return _rcNum('specialEventIntervalMin', 15);  }
function getRemoteEventIntervalMax()    { return _rcNum('specialEventIntervalMax', 30);  }
function isRemoteCompetitionEnabled()   { return _rcBool('competitionEnabled',     true); }
function isRemoteGhostShipEnabled()     { return _rcBool('ghostShipEnabled',       true); }

function _applyRemoteConfig() {
  const cfg = _remoteConfig;

  // Font/bobber scale — only if the player hasn't manually customised them
  const defaultFont   = _rcNum('defaultFontScale',   100);
  const defaultBobber = _rcNum('defaultBobberScale',  100);
  if (!G.fontScaleCustomized   && defaultFont   !== 100) { G.fontScale   = defaultFont;   applyFontScale(); }
  if (!G.bobberScaleCustomized && defaultBobber !== 100) { G.bobberScale = defaultBobber; applyBobberScale(); }

  // MOTD banner
  const motd     = typeof cfg.motd === 'string' && cfg.motd ? cfg.motd : null;
  const motdType = _rcStr('motdType', 'info');
  const motdEl   = document.getElementById('pa-motd-banner');
  if (motdEl) {
    if (motd) {
      const seen = localStorage.getItem('pa_motd_seen');
      if (seen !== motd) {
        document.getElementById('pa-motd-text').textContent = motd;
        motdEl.className = 'pa-motd-banner pa-motd-' + motdType;
        motdEl.classList.remove('hidden');
      }
    } else {
      motdEl.classList.add('hidden');
    }
  }
}

function dismissMotd() {
  const motdEl = document.getElementById('pa-motd-banner');
  if (motdEl) {
    const text = document.getElementById('pa-motd-text');
    if (text) localStorage.setItem('pa_motd_seen', text.textContent);
    motdEl.classList.add('hidden');
  }
}

async function loadRemoteConfig() {
  try {
    const res = await fetch(PA_CONFIG_URL, { cache: 'no-store' });
    if (res.ok) _remoteConfig = await res.json();
  } catch { /* offline — use defaults */ }
  _applyRemoteConfig();
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

function init() {
  console.log('[Init] stage: start');
  if (!G.diamonds && G.diamonds !== 0) G.diamonds = DEFAULT_STATE.diamonds;
  if (!G.records)      G.records      = {};
  if (!G.hofWins)      G.hofWins      = [];
  if (!G.hofActive)    G.hofActive    = {};
  if (!G.hofLastReset) G.hofLastReset = 0;
  if (!G.adSpeedBoostEnd)                  G.adSpeedBoostEnd    = 0;
  if (!G.specialCatchEnd)    G.specialCatchEnd    = 0;
  if (!G.specialCatchNextAt) G.specialCatchNextAt = 0;
  if (!G.specialEventNextAt)               G.specialEventNextAt  = 0;
  checkHofReset();
  if (!G.targetedLureLevel)   G.targetedLureLevel   = 0;
  if (!G.targetedLureTargets) G.targetedLureTargets = [];
  if (!G.trashPile)    G.trashPile    = {};
  if (!G.plantPile)    G.plantPile    = {};
  if (!G.fishPile)     G.fishPile     = {};
  if (!G.trophyPile)   G.trophyPile   = [];
  if (!G.trophyRecords)G.trophyRecords= {};
  // Migrate old inventory array → fishPile
  if (G.inventory && G.inventory.length) {
    G.inventory.forEach(item => {
      const k = fishPileKey(item.fishId, item.size || 10);
      G.fishPile[k] = (G.fishPile[k] || 0) + 1;
    });
    G.inventory = [];
  }
  // Migrate old storage format (string array → object array)
  if (!G.ownedStorage) G.ownedStorage = [];
  if (G.ownedStorage.length && typeof G.ownedStorage[0] === 'string') {
    G.ownedStorage = G.ownedStorage.map(id => ({ id, purchasedAt: Date.now() }));
  }
  if (G.currentStorage !== undefined) delete G.currentStorage;
  // Sunken Treasure — ensure fields exist for saves predating the feature
  if (!G.sunkenChests)                G.sunkenChests                = [];
  if (!G.sunkenTreasureStats)         G.sunkenTreasureStats         = { foundTotal:0, foundManual:0, foundAutomation:0, foundExpedition:0, opened:0, diamondsEarned:0, coinsEarned:0 };
  if (!G.expeditionVessels)           G.expeditionVessels           = [];
  if (!G.automationTreasureCooldownUntil) G.automationTreasureCooldownUntil = 0;
  if (!G.pearlUpgrades) G.pearlUpgrades = {};
  if (G.pearlUpgrades.treasurehold === undefined) G.pearlUpgrades.treasurehold = 0;
  if (G.chestFullPopupSuppressed === undefined) G.chestFullPopupSuppressed = false;
  // Diamond Upgrades — migrate old saves (level 0 means no effect, safe default)
  if (G.backgroundAt === undefined) G.backgroundAt = 0;
  if (!G.diamondUpgrades) G.diamondUpgrades = { autoSpeed: 0, storage: 0 };
  if (G.diamondUpgrades.autoSpeed === undefined) G.diamondUpgrades.autoSpeed = 0;
  if (G.diamondUpgrades.storage   === undefined) G.diamondUpgrades.storage   = 0;
  G.diamondUpgrades.autoSpeed = Math.max(0, Math.min(50, G.diamondUpgrades.autoSpeed || 0));
  G.diamondUpgrades.storage   = Math.max(0, Math.min(50, G.diamondUpgrades.storage   || 0));
  // Ghost Ship — migrate single ghostShip (old) → ghostShips[] (new)
  if (G.ghostShip !== undefined) {
    if (!G.ghostShips) G.ghostShips = [];
    if (G.ghostShip !== null) {
      if (!G.ghostShip.id) G.ghostShip.id = 'gs_legacy_' + Date.now();
      if (!G.ghostShips.some(s => s.id === G.ghostShip.id)) G.ghostShips.push(G.ghostShip);
    }
    delete G.ghostShip;
  }
  if (!G.ghostShips)              G.ghostShips           = [];
  if (!G.ghostShipNextSpawnAt)    G.ghostShipNextSpawnAt = 0;
  // Existing players who already have Sea unlocked should not see the comic
  if (G.seaComicSeen === undefined) G.seaComicSeen = (G.ownedTransport || []).includes('fishing_vessel');
  // Default active automation zones = 2 most recently unlocked zones
  if (!G.activeAutomationZones || !Array.isArray(G.activeAutomationZones)) {
    const _unl = ZONE_DATA.filter(z => isZoneUnlocked(z.id)).map(z => z.id);
    G.activeAutomationZones = _unl.slice(-2);
  }
  if (!G.usedCodes)                       G.usedCodes            = [];

  isPremiumBaitActive(); // clears expired bait
  applyFontScale();
  applyBobberScale();
  calculateOfflineProgress();
  initQuests();
  loadRemoteConfig(); // async — applies when resolved, game continues with defaults
  if (!G.stats.highestCoins) G.stats.highestCoins = G.coins || 0;
  resetFishingState();
  updateBobberImg();
  updateHUD();
  updateZoneBg(G.currentZone);
  startAutomation();
  startExpeditionTimer();
  _gsStartup();
  renderWaterAutomation(G.currentZone);
  startClock();
  startSeagullTimer();
  // Resume competition if it was active when page last closed
  const c = G.competition;
  if (c && c.active && !c.finished) {
    if (Date.now() < c.ends) {
      _compBotInterval   = setInterval(tickCompetitionBots, 10000);
      _compCheckInterval = setInterval(checkCompetitionEnd, 1000);
    } else {
      finishCompetition();
    }
  }
  setupBackButton();
  console.log('[Init] stage: showing loading screen');
  _loadingReadyAt = Date.now() + 1200;
  showScreen('loading');
  setTimeout(() => {
    const startBtn = document.getElementById('btn-press-to-start');
    if (startBtn) {
      startBtn.addEventListener('click', pressToStart, { once: true });
      startBtn.classList.add('ready');
    }
  }, 1200);
  // Restore special event timer — fire immediately if time passed while app was closed
  if (!G.specialEventNextAt) {
    scheduleNextSpecialEvent();
  } else if (Date.now() >= G.specialEventNextAt) {
    _nextEventAt = 0;
    G.specialEventNextAt = 0;
    setTimeout(triggerSpecialEvent, 2000); // 2s delay so UI is ready
  } else {
    const remaining = G.specialEventNextAt - Date.now();
    _nextEventAt = G.specialEventNextAt;
    _specialEventTimeout = setTimeout(triggerSpecialEvent, remaining);
  }
  _startAutoSpecialCatch();
  startAutoSellTimer();
  // Capacitor App lifecycle — fallback for Android devices where visibilitychange is unreliable
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
    try {
      window.Capacitor.Plugins.App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) { _onAppForeground(); } else { _onAppBackground(); }
      });
    } catch(e) { console.warn('[Lifecycle] appStateChange listener failed:', e); }
  }
  // Optional subsystems — failures are non-fatal and must not block loading
  try { if (typeof initAdMob     === 'function') initAdMob();     } catch(e) { console.warn('[Init] AdMob failed:', e); }
  try { if (typeof initIAP       === 'function') initIAP();       } catch(e) { console.warn('[Init] IAP failed:', e); }
  try { if (typeof initAuth      === 'function') initAuth();       } catch(e) { console.warn('[Init] Auth failed:', e); }
  try { if (typeof initAnalytics === 'function') initAnalytics();  } catch(e) { console.warn('[Init] Analytics failed:', e); }
  try { loadDialogueData(); } catch(e) { console.warn('[Init] Dialogue load failed:', e); }
  console.log('[Init] startup complete');
}

// ─── BACKGROUND / FOREGROUND LIFECYCLE ───────────────────────────────────────

let _appInBackground = false;
let _resumeHandled   = false;

function _onAppBackground() {
  if (_appInBackground) return;
  _appInBackground = true;
  _resumeHandled   = false;
  const now = Date.now();
  G.backgroundAt = now;
  G.lastSeen     = now;
  // Pause special event timers — don't fire while app is backgrounded
  if (_specialEventTimeout)    { clearTimeout(_specialEventTimeout);    _specialEventTimeout    = null; }
  if (_foregroundEventTimeout) { clearTimeout(_foregroundEventTimeout); _foregroundEventTimeout = null; }
  if (_eventExpireTimeout)     { clearTimeout(_eventExpireTimeout);     _eventExpireTimeout     = null; }
  if ((G.stats.lastFishAt || 0) > 0 && now - G.stats.lastFishAt < 120000) {
    if (typeof syncAch === 'function')             syncAch('h_last_fish', 1);
    if (typeof finalizeQuestUpdate === 'function') finalizeQuestUpdate();
  }
  // Pause automation and clock — calculateOfflineProgress() handles catch-up on resume
  clearInterval(autoTickInterval);   autoTickInterval  = null;
  clearInterval(_autoSaveInterval);  _autoSaveInterval = null;
  clearInterval(_clockInterval);     _clockInterval    = null;
  saveState();
  bgMusic.pause();
  if (typeof onAdBackground === 'function') onAdBackground();
  console.log('[Lifecycle] backgrounded');
}

function _onAppForeground() {
  if (!_appInBackground) return;  // not returning from background — ignore
  if (_resumeHandled)    return;  // already handled this foreground cycle
  _resumeHandled   = true;
  _appInBackground = false;
  const elapsed = Math.round((Date.now() - (G.backgroundAt || Date.now())) / 1000);
  console.log('[Lifecycle] foregrounded, elapsed ' + elapsed + 's');
  if (!G.musicMuted && _musicStarted) bgMusic.play().catch(() => {});
  calculateOfflineProgress();
  updateHUD();
  // Restart automation and clock that were paused on background
  startAutomation();
  startClock();
  // Special event: timer was paused on background — resolve on return
  if (_pendingEvent) {
    const elapsed = _eventStartedAt ? Date.now() - _eventStartedAt : 0;
    if (elapsed > 5 * 60 * 1000) {
      expireSpecialEvent(); // window expired while backgrounded
    } else {
      // Restart the expire countdown with only the time remaining
      const remaining = Math.max(10000, 5 * 60 * 1000 - elapsed);
      _eventExpireTimeout = setTimeout(expireSpecialEvent, remaining);
      // Pre-load the ad, then show the icon — gives the ad 8s head-start before player can tap
      if (typeof prepareRewardedAd === 'function') prepareRewardedAd();
      const _resumeIcon = document.getElementById('event-side-icon');
      if (_resumeIcon) {
        _resumeIcon.classList.add('hidden');
        setTimeout(() => { if (_pendingEvent) _resumeIcon.classList.remove('hidden'); }, 8000);
      }
    }
  } else if (G.specialEventNextAt && Date.now() >= G.specialEventNextAt) {
    G.specialEventNextAt = 0;
    _nextEventAt = 0;
    _foregroundEventTimeout = setTimeout(triggerSpecialEvent, 10000); // 10s: player settles + AdMob reconnects
    if (typeof prepareRewardedAd === 'function') prepareRewardedAd(); // pre-load while player settles
  } else if (G.specialEventNextAt && Date.now() < G.specialEventNextAt) {
    const remaining = G.specialEventNextAt - Date.now();
    _nextEventAt = G.specialEventNextAt;
    _specialEventTimeout = setTimeout(triggerSpecialEvent, remaining);
  } else {
    scheduleNextSpecialEvent();
  }
  // Re-attach GS spawn timer — Android kills long setTimeouts while backgrounded, so the timer
  // may be gone even when the spawn deadline hasn't passed yet. Reattach without re-rendering ships.
  _gsReattachTimer();
  if (typeof _processCompletedExpeditions === 'function') _processCompletedExpeditions();
  if (typeof isInMaelstrom === 'function' && isInMaelstrom() && typeof renderMaelstromDebug === 'function') renderMaelstromDebug();
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    _onAppBackground();
  } else if (document.visibilityState === 'visible') {
    _onAppForeground();
  }
});

// ─── TUTORIAL ─────────────────────────────────────────────────────────────────

const TUTORIAL_STEPS = [
  {
    icon: '🎣',
    title: 'Welcome, Angler!',
    desc: 'You are starting with a basic rod at the Pond. Tap the water to cast your line.',
  },
  {
    icon: '🎯',
    title: 'Catch the Fish!',
    desc: 'When the bobber bobs — TAP IT! You need to tap 20 times quickly to reel in the catch.',
  },
  {
    icon: '🪣',
    title: 'Fill Your Bucket',
    desc: 'Your starter Bucket holds 5 fish. Open the Market to sell them for coins.',
  },
  {
    icon: '🕸️',
    title: 'Build Your Empire',
    desc: 'Earn 30 coins and buy your first Fishing Net from the Shop. It collects items while you\'re away!',
  },
];

let _tutorialStep = 0;

function showTutorial() {
  if (G.tutorialDone) return;
  _tutorialStep = 0;
  renderTutorialStep();
  document.getElementById('tutorial-overlay').classList.remove('hidden');
}

function renderTutorialStep() {
  const step = TUTORIAL_STEPS[_tutorialStep];
  const total = TUTORIAL_STEPS.length;
  const dotsEl = document.getElementById('tutorial-dots');
  dotsEl.innerHTML = TUTORIAL_STEPS.map((_, i) =>
    `<div class="tutorial-dot${i === _tutorialStep ? ' active' : ''}"></div>`
  ).join('');
  document.getElementById('tutorial-icon').textContent = step.icon;
  document.getElementById('tutorial-title').textContent = step.title;
  document.getElementById('tutorial-desc').textContent = step.desc;
  const btn = document.getElementById('tutorial-btn');
  btn.textContent = _tutorialStep < total - 1 ? 'Next' : 'Start Fishing!';
}

document.getElementById('tutorial-btn').addEventListener('click', () => {
  _tutorialStep++;
  if (_tutorialStep >= TUTORIAL_STEPS.length) {
    document.getElementById('tutorial-overlay').classList.add('hidden');
    G.tutorialDone = true;
    saveState();
    _maybShowCommunityNotice();
  } else {
    renderTutorialStep();
  }
});

// ─── SPECIAL EVENTS ───────────────────────────────────────────────────────────

const SPECIAL_EVENTS = [
  {
    id: 'care_package',
    name: 'Care Package',
    icon: 'img/icons/Care package icon.png',
    desc: 'A mysterious package washed ashore! Claim 30 minutes of idle income.',
    btnLabel: 'Claim Package',
    claim(){
      const rate = calcFishRate();
      const avgValue = 10;
      const reward = Math.min(12000, Math.max(50, Math.round(rate * avgValue * 1800)));
      _earnCoins(reward);
      G.stats.evCarePackage = (G.stats.evCarePackage || 0) + 1;
      // Lucky Pocket — 3 packages in one day
      const today = todayStr();
      if ((G.stats.carePkgDate || '') !== today) { G.stats.carePkgDate = today; G.stats.carePkgToday = 0; }
      G.stats.carePkgToday = (G.stats.carePkgToday || 0) + 1;
      if (G.stats.carePkgToday >= 3) syncAch('h_pkg_day', 1);
      // Jackpot — max reward
      if (reward >= 12000) syncAch('h_jackpot', 1);
      showCoinFloat(reward);
      saveState(); updateHUD();
    }
  },
  {
    id: 'rapid_waters',
    name: 'Rapid Waters',
    icon: 'img/icons/Rapid waters.png',
    desc: 'The currents are wild! Fishing speed ×1.5 for 20 minutes.',
    btnLabel: 'Ride the Current',
    claim(){ G.rapidWatersEnd = Date.now() + 1200000; G.stats.evRapidWaters = (G.stats.evRapidWaters||0)+1; saveState(); updateHUD(); updateRapidWatersHUD(); }
  },
  {
    id: 'lost_treasure',
    name: 'Lost Treasure',
    icon: 'img/icons/Lost Treasure.png',
    desc: 'A sunken chest full of gems! Claim +3 Diamonds.',
    btnLabel: 'Grab the Treasure',
    claim(){ G.diamonds = (G.diamonds || 0) + 3; G.stats.evLostTreasure = (G.stats.evLostTreasure||0)+1; syncAch('h_lost_treasure', G.stats.evLostTreasure); saveState(); updateHUD(); }
  },
  {
    id: 'bite_speed_boost',
    name: 'Fishing Frenzy',
    icon: 'img/icons/Speed Boost.png',
    desc: '+25% fishing speed for 30 minutes.',
    btnLabel: 'Boost Speed',
    claim(){ G.adSpeedBoostEnd = Date.now() + 30 * 60000; G.stats.evFishingFrenzy = (G.stats.evFishingFrenzy||0)+1; saveState(); updateHUD(); updateAdBoostHUD(); }
  },
  {
    id: 'special_catch',
    name: 'Lucky Hook',
    icon: 'img/icons/Lucky Hook.png',
    desc: 'Your next catch is guaranteed Rare or better!',
    btnLabel: 'Activate Lucky Hook',
    claim(){ G.specialCatchEnd = Date.now() + 3 * 60000; G.specialCatchNextAt = Date.now() + 10 * 60000; G.stats.evLuckyHook = (G.stats.evLuckyHook||0)+1; saveState(); updateLuckyHookHUD(); showStatus('Lucky Hook active! Rare+ for 3 minutes', 3000); }
  },
];

let _specialEventTimeout   = null;
let _foregroundEventTimeout = null; // tracked separately so background cancels it
let _pendingEvent = null;
let _nextEventAt = 0;

function scheduleNextSpecialEvent() {
  if (_specialEventTimeout)    { clearTimeout(_specialEventTimeout);    _specialEventTimeout    = null; }
  if (_foregroundEventTimeout) { clearTimeout(_foregroundEventTimeout); _foregroundEventTimeout = null; }
  const now    = Date.now();
  const minMs  = getRemoteEventIntervalMin() * 60000;
  const rangeMs = Math.max(0, getRemoteEventIntervalMax() - getRemoteEventIntervalMin()) * 60000;
  const delayMs = minMs + Math.random() * rangeMs;
  _nextEventAt = now + delayMs;
  G.specialEventNextAt = _nextEventAt;
  saveState();
  _specialEventTimeout = setTimeout(triggerSpecialEvent, delayMs);
}

let _eventExpireTimeout = null;
let _eventStartedAt    = 0;

function triggerSpecialEvent() {
  const available = SPECIAL_EVENTS.filter(e => {
    if (e.id === 'rapid_waters'    && isRapidWatersActive()) return false;
    if (e.id === 'bite_speed_boost' && isAdSpeedBoostActive()) return false;
    if (e.id === 'special_catch'   && isLuckyHookActive()) return false;
    if (e.id === 'special_catch'   && Date.now() < (G.specialCatchNextAt || 0)) return false;
    return true;
  });
  if (!available.length) { scheduleNextSpecialEvent(); return; }
  const _evWeights = available.map(e => e.id === 'lost_treasure' ? 1 + getPearlTreasureBonus() : 1);
  const _evTotal   = _evWeights.reduce((a, b) => a + b, 0);
  let   _evRand    = Math.random() * _evTotal;
  let   _evIdx     = available.length - 1;
  for (let i = 0; i < _evWeights.length; i++) { _evRand -= _evWeights[i]; if (_evRand <= 0) { _evIdx = i; break; } }
  _pendingEvent    = available[_evIdx];
  _eventStartedAt  = Date.now();
  const iconEl = document.getElementById('event-side-icon');
  if (iconEl) {
    iconEl.querySelector('.event-side-img').src = _pendingEvent.icon;
    iconEl.classList.remove('hidden');
  }
  if (_eventExpireTimeout) clearTimeout(_eventExpireTimeout);
  _eventExpireTimeout = setTimeout(expireSpecialEvent, 5 * 60 * 1000); // 5 min window (foreground)
  // Pre-load ad now so it's ready when player taps claim (not when they tap — that's too late)
  if (typeof prepareRewardedAd === 'function' && !G.removeAds) prepareRewardedAd();
}

function expireSpecialEvent() {
  _pendingEvent = null;
  const iconEl = document.getElementById('event-side-icon');
  if (iconEl) iconEl.classList.add('hidden');
  scheduleNextSpecialEvent();
}

function onEventIconClick() {
  if (!_pendingEvent) return;
  showSpecialEventPopup(_pendingEvent);
}

function showSpecialEventPopup(ev) {
  const overlay = document.getElementById('special-event-overlay');
  const icon    = document.getElementById('se-icon');
  const title   = document.getElementById('se-title');
  const desc    = document.getElementById('se-desc');
  const btn     = document.getElementById('se-claim-btn');
  const adNote  = document.getElementById('se-ad-note');

  icon.src   = ev.icon;
  title.textContent = ev.name;
  desc.textContent  = ev.desc;
  btn.textContent   = ev.btnLabel;

  if (G.removeAds) {
    adNote.classList.add('hidden');
  } else {
    adNote.classList.remove('hidden');
  }

  btn.onclick = () => {
    if (G.removeAds) {
      ev.claim();
      closeSpecialEventPopup();
    } else {
      showSpecialEventAd(() => {
        ev.claim();
        closeSpecialEventPopup();
      });
    }
  };

  document.getElementById('se-skip-btn').onclick = closeSpecialEventPopup;
  overlay.classList.remove('hidden');
}

function closeSpecialEventPopup() {
  _pendingEvent = null;
  if (_eventExpireTimeout) { clearTimeout(_eventExpireTimeout); _eventExpireTimeout = null; }
  document.getElementById('special-event-overlay').classList.add('hidden');
  const iconEl = document.getElementById('event-side-icon');
  if (iconEl) iconEl.classList.add('hidden');
  scheduleNextSpecialEvent();
}

function showSpecialEventAd(onReward) {
  const adNote = document.getElementById('se-ad-note');
  const btn    = document.getElementById('se-claim-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Loading ad…'; }
  if (adNote) adNote.textContent = 'Loading ad…';

  showRewardedAd(onReward, () => {
    // Ad unavailable or dismissed — let player retry or skip manually
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Try Again';
      btn.onclick = () => showSpecialEventAd(onReward);
    }
    if (adNote) adNote.textContent = 'Ad not available. Tap Try Again or skip.';
  });
}

function updatePremiumBaitHUD() {
  const el = document.getElementById('buff-bait');
  if (!el) return;
  if (isPremiumBaitActive()) {
    const remMin = Math.ceil((G.premiumBaitEnd - Date.now()) / 60000);
    document.getElementById('buff-bait-timer').textContent = remMin + 'm';
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}

function updateAutoSellHUD() {
  const el = document.getElementById('buff-autosell');
  if (!el) return;
  if (isAutoSellActive()) {
    const msLeft = (G.autoSellNextAt || 0) - Date.now();
    let label;
    if (msLeft > 0) {
      const h = Math.floor(msLeft / 3600000);
      const m = Math.ceil((msLeft % 3600000) / 60000);
      label = h > 0 ? h + 'h' : m + 'm';
    } else {
      label = 'ON';
    }
    document.getElementById('buff-autosell-timer').textContent = label;
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}

function updateRapidWatersHUD() {
  const el = document.getElementById('buff-rapid');
  if (!el) return;
  if (isRapidWatersActive()) {
    const remMin = Math.ceil((G.rapidWatersEnd - Date.now()) / 60000);
    document.getElementById('buff-rapid-timer').textContent = remMin + 'm';
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}

function updateLuckyHookHUD() {
  const el = document.getElementById('buff-luckyhook');
  if (!el) return;
  if (isLuckyHookActive()) {
    const remSec = Math.ceil((G.specialCatchEnd - Date.now()) / 1000);
    const remMin = Math.ceil(remSec / 60);
    document.getElementById('buff-luckyhook-timer').textContent = remMin + 'm';
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}

function updateAdBoostHUD() {
  const el = document.getElementById('buff-adboost');
  if (!el) return;
  if (isAdSpeedBoostActive()) {
    const remMin = Math.ceil((G.adSpeedBoostEnd - Date.now()) / 60000);
    document.getElementById('buff-adboost-timer').textContent = remMin + 'm';
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}

function _startAutoSpecialCatch() {
  setInterval(() => {
    if (G.removeAds && !isLuckyHookActive()) {
      G.specialCatchEnd = Date.now() + 3 * 60000;
      G.specialCatchNextAt = 0;
      saveState();
      updateLuckyHookHUD();
      showStatus('Lucky Hook ready! Rare+ for 3 minutes', 3000);
    }
  }, 10 * 60000);
}

// ─── Android back button — back to fishing screen; double-back to exit
let _backPressedOnce = false;
function setupBackButton() {
  if (!window.Capacitor) return;
  window.Capacitor.Plugins.App.addListener('backButton', () => {
    const active = document.querySelector('.screen.active');
    if (active && active.id !== 'screen-fishing' && active.id !== 'screen-loading') {
      showScreen('fishing');
      _backPressedOnce = false;
    } else {
      if (_backPressedOnce) {
        window.Capacitor.Plugins.App.exitApp();
      } else {
        _backPressedOnce = true;
        showStatus('Press back again to exit', 2000);
        setTimeout(() => { _backPressedOnce = false; }, 2000);
      }
    }
  });
}

// ─── DIALOGUE SYSTEM ──────────────────────────────────────────────────────────

let _dialogueData    = null;  // patient_angler_dialogue_v0_1_18.json
let _fishdexInfoData = null;  // fishdex_info_v0_1_14.json

async function loadDialogueData() {
  try {
    const [dRes, fRes, cRes] = await Promise.all([
      fetch('img/Dialogues/patient_angler_dialogue_v0_1_18.json'),
      fetch('img/Dialogues/fishdex_info_v0_1_14.json'),
      fetch('img/Dialogues/patient_angler_competition_names_v0_1_14.json'),
    ]);
    if (dRes.ok) _dialogueData         = await dRes.json();
    if (fRes.ok) _fishdexInfoData       = await fRes.json();
    if (cRes.ok) _competitionNamesData  = await cRes.json();
  } catch (e) { /* silent fail — game continues normally */ }
}

// ── Speech bubble core ────────────────────────────────────────────────────────

const _bubbleTimeouts = {};

function showSpeechBubble(bubbleId, text, durationMs) {
  const el = document.getElementById(bubbleId);
  if (!el) return;
  el.textContent = text;
  el.classList.remove('hidden', 'sb-visible');
  void el.offsetWidth; // force reflow so transition replays
  el.classList.add('sb-visible');
  clearTimeout(_bubbleTimeouts[bubbleId]);
  _bubbleTimeouts[bubbleId] = setTimeout(() => {
    el.classList.remove('sb-visible');
    setTimeout(() => el.classList.add('hidden'), 320);
  }, durationMs);
}

function _pickExcluding(arr, exclude) {
  if (!arr || !arr.length) return null;
  const pool = arr.length > 1 ? arr.filter(x => x !== exclude) : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Dialogue history — session-only, prevents immediate repetition
const _dlgHistory = { shopNormal:[], shopTip:[], shopQuick:[], shopAbsence:[], river:[], lake:[], bay:[] };
const _DLG_MAX_HIST = 5;

function _pickAvoidingHistory(pool, history) {
  if (!pool || !pool.length) return null;
  const available = pool.length > 1 ? pool.filter(x => !history.includes(x)) : pool;
  const pick = (available.length > 0 ? available : pool)[Math.floor(Math.random() * (available.length > 0 ? available : pool).length)];
  history.push(pick);
  if (history.length > _DLG_MAX_HIST) history.shift();
  return pick;
}

function _getPlayerFirstName() {
  const name = (G.playerName || '').trim();
  if (!name) return 'Angler';
  const first = name.split(/\s+/)[0];
  return first || 'Angler';
}

function resolveDialoguePlaceholders(text, extras) {
  if (!text) return '';
  const zoneDef = ZONE_DATA.find(z => z.id === G.currentZone);
  const rodDef  = RODS.find(r => r.id === G.currentRod);
  const highestZoneId = (G.stats && G.stats.recHighestZone) || G.currentZone;
  const highestZoneDef = ZONE_DATA.find(z => z.id === highestZoneId);
  let out = text
    .replace(/\{playerName\}/g,    _getPlayerFirstName())
    .replace(/\{zone\}/g,          zoneDef         ? zoneDef.name          : 'Pond')
    .replace(/\{rodName\}/g,       rodDef          ? rodDef.name           : 'Basic Rod')
    .replace(/\{highestZone\}/g,   highestZoneDef  ? highestZoneDef.name   : 'Pond')
    .replace(/\{fishCaught\}/g,    formatCoins((G.stats && G.stats.totalFish) || 0))
    .replace(/\{prestigeCount\}/g, String(G.prestigeCount || 0))
    .replace(/\{blackPearls\}/g,   String(G.blackPearls   || 0));
  if (extras) {
    for (const [k, v] of Object.entries(extras)) {
      out = out.replace(new RegExp('\\{' + k + '\\}', 'g'), String(v));
    }
  }
  return out;
}

function _formatTimeAway(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d > 0) return h > 0 ? `${d}d ${h}h` : `${d}d`;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${Math.max(1, m)}m`;
}

// ── Shopkeeper ────────────────────────────────────────────────────────────────

function onShopOpen() {
  const now       = Date.now();
  const lastVisit = G.lastShopVisit || 0;
  const awayMs    = now - lastVisit;
  G.lastShopVisit = now;
  saveState();

  if (!_dialogueData || !_dialogueData.shopkeeper) return;
  const sk = _dialogueData.shopkeeper;
  const notes    = sk.implementationNotes || {};
  const tipRate  = notes.tipRate              ?? 0.15;
  const nameRate = notes.personalizedLineRate ?? 0.20;

  let rawText = null;
  let isTip   = false;

  if (lastVisit > 0 && awayMs < 10000) {
    // Quick return (< 10 s)
    const all   = (sk.quickReturnGreetings || []).map(x => typeof x === 'object' ? x.message : x);
    const named = all.filter(x => x.includes('{playerName}'));
    const plain = all.filter(x => !x.includes('{playerName}'));
    const useNamed = named.length > 0 && Math.random() < nameRate;
    rawText = _pickAvoidingHistory(useNamed ? named : (plain.length > 0 ? plain : all), _dlgHistory.shopQuick);
  } else if (lastVisit > 0 && awayMs >= 5 * 3600 * 1000) {
    // Long absence (>= 5 h)
    const all   = sk.longAbsenceGreetings || [];
    const named = all.filter(x => (x.messageTemplate || x.message || '').includes('{playerName}'));
    const plain = all.filter(x => !(x.messageTemplate || x.message || '').includes('{playerName}'));
    const useNamed = named.length > 0 && Math.random() < nameRate;
    const entry = _pickAvoidingHistory(useNamed ? named : (plain.length > 0 ? plain : all), _dlgHistory.shopAbsence);
    const tmpl  = entry ? (entry.messageTemplate || entry.message || '') : '';
    rawText = tmpl ? resolveDialoguePlaceholders(tmpl, { timeAway: _formatTimeAway(awayMs) }) : null;
  } else {
    // Normal greeting, or occasionally a tip
    if (Math.random() < tipRate && (sk.tips || []).length > 0) {
      rawText = _pickAvoidingHistory(sk.tips, _dlgHistory.shopTip);
      isTip   = true;
    } else {
      const all   = sk.normalGreetings || [];
      const named = all.filter(x => x.includes('{playerName}'));
      const plain = all.filter(x => !x.includes('{playerName}'));
      const useNamed = named.length > 0 && Math.random() < nameRate;
      rawText = _pickAvoidingHistory(useNamed ? named : (plain.length > 0 ? plain : all), _dlgHistory.shopNormal);
    }
  }

  if (!rawText) return;
  // Long-absence already resolved above; resolve remaining placeholders for all other cases
  const text     = (lastVisit > 0 && awayMs >= 5 * 3600 * 1000) ? rawText : resolveDialoguePlaceholders(rawText);
  const duration = isTip ? 6500 : 4500;
  setTimeout(() => showSpeechBubble('shop-speech-bubble', text, duration), 180);
}

// ── Fisherman dialogue ────────────────────────────────────────────────────────

function checkFishermanDialogue(zone) {
  const fishermanZones = ['river', 'lake', 'bay'];
  if (!fishermanZones.includes(zone)) return;
  if (!_dialogueData || !_dialogueData.fishermen) return;
  // Only show when player has any automation in this zone (automation bg must be active)
  if (!_hasZoneAuto(zone)) return;

  // Don't interrupt an active bubble
  const fb = document.getElementById('fisherman-speech-bubble');
  if (fb && fb.classList.contains('sb-visible')) return;

  const { h } = getIngameTime();
  if (!G.fishermanLastDialogHour) G.fishermanLastDialogHour = {};
  if (G.fishermanLastDialogHour[zone] === h) return;
  G.fishermanLastDialogHour[zone] = h;

  const allLines = _dialogueData.fishermen[zone] || [];
  if (!allLines.length) return;

  const rules    = _dialogueData.fishermen.globalRules || {};
  const nameRate = rules.personalizedLineRate ?? 0.20;
  const tipRate  = rules.tipLineRate          ?? 0.20;

  const tipLines    = allLines.filter(l => l.startsWith('Tip:'));
  const namedLines  = allLines.filter(l => !l.startsWith('Tip:') && l.includes('{playerName}'));
  const normalLines = allLines.filter(l => !l.startsWith('Tip:') && !l.includes('{playerName}'));

  const roll = Math.random();
  let rawText = null;
  const histKey = zone;

  if (roll < tipRate && tipLines.length > 0) {
    rawText = _pickAvoidingHistory(tipLines, _dlgHistory[histKey]);
  } else if (roll < tipRate + nameRate && namedLines.length > 0) {
    rawText = _pickAvoidingHistory(namedLines, _dlgHistory[histKey]);
  } else {
    const pool = normalLines.length > 0 ? normalLines : allLines.filter(l => !l.startsWith('Tip:'));
    rawText = _pickAvoidingHistory(pool.length > 0 ? pool : allLines, _dlgHistory[histKey]);
  }

  if (!rawText) return;
  const isTip   = rawText.startsWith('Tip:');
  const text     = resolveDialoguePlaceholders(rawText);
  const duration = isTip ? 6500 : 5000;
  setTimeout(() => _showFishermanBubble(zone, text, duration), 400);
}

function _showFishermanBubble(zone, text, durationMs) {
  const bubble = document.getElementById('fisherman-speech-bubble');
  if (!bubble) return;
  // Positions match where the fisherman NPC character appears in each zone's
  // automation background artwork.
  const POS = {
    river: { left: '15%', top: '30%', tailLeft: false },
    lake:  { left: '20%', top: '20%', tailLeft: false },
    bay:   { left: '10%', top:  '5%', tailLeft: false },
  };
  const pos = POS[zone] || { left: '10%', top: '8%', tailLeft: false };
  bubble.style.left = pos.left;
  bubble.style.top  = pos.top;
  bubble.classList.toggle('tail-left', pos.tailLeft);
  showSpeechBubble('fisherman-speech-bubble', text, durationMs || 5000);
}

// ── Fishdex detail popup ──────────────────────────────────────────────────────

function _fishdexInfoEntry(itemId) {
  if (!_fishdexInfoData || !_fishdexInfoData.entries) return null;
  // Exact match
  if (_fishdexInfoData.entries[itemId]) return _fishdexInfoData.entries[itemId];
  // Normalised fallback: lowercase, spaces→_, hyphens and apostrophes removed
  const _norm = s => s.toLowerCase().replace(/\s+/g, '_').replace(/[-']/g, '');
  const normId = _norm(itemId);
  for (const [k, v] of Object.entries(_fishdexInfoData.entries)) {
    if (_norm(k) === normId) return v;
  }
  // Still no match — log for debugging
  const dbItem = FISH_DB.find(f => f.id === itemId)
              || PLANT_DB.find(p => p.id === itemId)
              || TRASH_DB.find(t => t.id === itemId);
  console.warn('[Fishdex] No JSON entry for id:', itemId,
    dbItem ? `| name: ${dbItem.name} | rarity: ${dbItem.rarity} | zone: ${dbItem.zone}` : '| (not in DB)');
  return null;
}

function _itemActiveBonusText(item) {
  const bonuses = ZONE_MASTERY_BONUSES[item.zone];
  if (!bonuses) return null;
  const pts = getZoneMasteryPoints(item.zone);
  const active = bonuses.filter((b, i) => pts >= MASTERY_THRESHOLDS[i]).map(b => b.label);
  return active.length ? active.join(' · ') : null;
}

function openFishdexDetail(itemId) {
  if (!G.fishdex.includes(itemId)) return;

  const item = FISH_DB.find(f => f.id === itemId)
             || PLANT_DB.find(p => p.id === itemId)
             || TRASH_DB.find(t => t.id === itemId);
  if (!item) return;

  const el = document.getElementById('fishdex-detail-overlay');
  if (!el) return;

  const info     = _fishdexInfoEntry(itemId);
  const tierIdx  = getMasteryTierIndex(itemId);
  const tier     = tierIdx >= 0 ? MASTERY_TIERS[tierIdx] : null;
  const eligible = isMasteryEligible(item);

  // Category — derive from info JSON or DB type
  const catRaw  = (info && info.category) || (PLANT_DB.find(p=>p.id===itemId) ? 'plant' : TRASH_DB.find(t=>t.id===itemId) ? 'trash' : 'fish');
  const catLabel = catRaw.charAt(0).toUpperCase() + catRaw.slice(1);

  // Rarity
  const rarityRaw   = item.rarity || (info && (info.rarity || '').toLowerCase()) || '';
  const rarityLabel = rarityRaw ? rarityRaw.charAt(0).toUpperCase() + rarityRaw.slice(1) : '';
  const rarityColor = RARITY_COLORS[rarityRaw] || '#9d9d9d';

  // Mastery block (only for eligible items)
  let masteryHtml = '';
  if (eligible) {
    const tierName  = tier ? tier.name  : 'None';
    const tierColor = tier ? tier.color : '#555555';
    const bonus     = _itemActiveBonusText(item);
    masteryHtml = `
      <div class="fdp-section">
        <div class="fdp-label">Current Mastery</div>
        <div class="fdp-mastery-tier" style="color:${tierColor}">${tierName}</div>
        <div class="fdp-label" style="margin-top:6px">Active Bonus</div>
        <div class="fdp-mastery-bonus">${bonus || 'No active bonus yet.'}</div>
      </div>`;
  }

  // How to Catch (only if JSON supplies it)
  let howToHtml = '';
  const howTo = info && info.howToCatch;
  if (howTo) {
    howToHtml = `
      <div class="fdp-section">
        <div class="fdp-label">How to Catch</div>
        <div class="fdp-howtocatch">${howTo}</div>
      </div>`;
  }

  // Description
  const desc = (info && info.description) || 'No description available yet.';

  // Art
  const imgHtml = item.img
    ? `<img src="${item.img}" class="fdp-fish-img" alt="${item.name}">`
    : `<div class="fdp-fish-placeholder" style="color:${rarityColor}">${item.name[0].toUpperCase()}</div>`;

  el.querySelector('.fdp-panel').innerHTML = `
    <div class="fdp-header">
      ${imgHtml}
      <div class="fdp-header-info">
        <div class="fdp-name">${item.name}</div>
        <div class="fdp-badges">
          <span class="fdp-category-badge">${catLabel}</span>
          ${rarityLabel ? `<span class="fdp-rarity-badge" style="background:${rarityColor}20;border:1px solid ${rarityColor};color:${rarityColor}">${rarityLabel}</span>` : ''}
        </div>
      </div>
      <button class="fdp-close" onclick="closeFishdexDetail()">&#x2715;</button>
    </div>
    ${masteryHtml}
    ${howToHtml}
    <div class="fdp-section">
      <div class="fdp-label">Description</div>
      <div class="fdp-description">${desc}</div>
    </div>
  `;

  el.classList.remove('hidden');
  void el.offsetWidth;
  el.classList.add('fdp-visible');
}

function closeFishdexDetail() {
  const el = document.getElementById('fishdex-detail-overlay');
  if (!el) return;
  el.classList.remove('fdp-visible');
  setTimeout(() => el.classList.add('hidden'), 280);
}

init();

/* =====================================================================
   VARIANT 2 — Automation Overview Popup  (COMMENTED OUT — NOT LIVE)
   =====================================================================
   HOW TO ENABLE:
     1. Uncomment this entire block
     2. Add HTML snippet below to index.html (before </body>)
     3. Add CSS snippet below to styles.css
     4. In renderShop(), uncomment the notice block inside 'automation' tab

   NOTE: Variant 2 is designed for the zone-based automation model.
   If Variant 1 (pooled zones) is active, the zone catch/s values in
   this popup will reflect purchase-zone assignment, not actual production.
   =====================================================================

   ── HTML (add to index.html before </body>) ──────────────────────────
   <div id="auto-overview-overlay" class="overlay-backdrop hidden" onclick="if(event.target===this)closeAutoOverview()">
     <div class="auto-overview-panel">
       <div class="auto-overview-header">
         <span class="auto-overview-title">Automation by Zone</span>
         <button class="btn-close-x" onclick="closeAutoOverview()">✕</button>
       </div>
       <div id="auto-overview-body" class="auto-overview-body"></div>
     </div>
   </div>

   ── CSS (add to styles.css) ──────────────────────────────────────────
   .auto-overview-panel {
     background: var(--color-panel);
     border: 2px solid var(--color-border);
     border-radius: 12px;
     width: min(92vw, 420px);
     max-height: 80vh;
     display: flex;
     flex-direction: column;
     overflow: hidden;
   }
   .auto-overview-header {
     display: flex;
     align-items: center;
     justify-content: space-between;
     padding: 12px 16px;
     border-bottom: 1px solid var(--color-border);
   }
   .auto-overview-title { font-size: 18px; font-weight: bold; color: var(--color-gold); }
   .auto-overview-body  { overflow-y: auto; padding: 8px 14px 14px; }
   .ao-zone-block { padding: 10px 0; border-bottom: 1px solid var(--color-border-subtle, #333); }
   .ao-zone-block:last-child { border-bottom: none; }
   .ao-zone-name  { font-size: 15px; font-weight: bold; margin-bottom: 6px; color: var(--color-text); }
   .ao-cats       { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 6px; }
   .ao-cat        { display: flex; align-items: center; gap: 4px; font-size: 14px; }
   .ao-cat img    { width: 28px; height: 28px; object-fit: contain; }
   .ao-rate       { font-size: 13px; color: var(--color-text-dim); }
   .ao-total-row  { padding-top: 10px; display: flex; justify-content: space-between; align-items: center; font-weight: bold; font-size: 15px; }
   .shop-zone-notice {
     background: rgba(255,200,80,0.12);
     border: 1px solid rgba(255,200,80,0.35);
     border-radius: 8px;
     padding: 10px 12px;
     font-size: 13px;
     color: var(--color-text-dim);
     margin-bottom: 10px;
     line-height: 1.4;
   }
   ────────────────────────────────────────────────────────────────────

// Which automation category types are possible per zone
// (based on unlocksAt zone — only show valid categories per zone card)
const ZONE_AUTO_TYPES = {
  pond:  ['net'],
  river: ['net', 'fisherman'],
  lake:  ['net', 'fisherman'],
  bay:   ['net', 'fisherman', 'boat'],
  sea:   ['net', 'fisherman', 'boat', 'fleet'],
  ocean: ['net', 'fisherman', 'boat', 'fleet'],
};

const AUTO_CAT_ICONS = {
  net:       'img/icons/Shop/Automation/Fishing Net.png',
  fisherman: 'img/icons/Shop/Automation/Local Fisher.png',
  boat:      'img/icons/Shop/Automation/Row Boat.png',
  fleet:     'img/icons/Shop/Automation/Small Fleet.png',
};

function openAutoOverview() {
  renderAutoOverview();
  document.getElementById('auto-overview-overlay').classList.remove('hidden');
}

function closeAutoOverview() {
  document.getElementById('auto-overview-overlay').classList.add('hidden');
}

function renderAutoOverview() {
  const body = document.getElementById('auto-overview-body');
  if (!body) return;

  const speedBase  = getSpeedMult() * getPearlSpeedMult() * getMasteryAutoSpeedMult() * getAutomationUpgradeMultiplier();
  const multiCatch = getMultiCatch();
  const extraMult  = 1 + getPearlExtraCatchChance();
  const typeMults  = {
    net:       getRodNetSpeedMult(),
    fisherman: getRodFishermanSpeedMult(),
    boat:      getRodBoatSpeedMult(),
    fleet:     getRodFleetSpeedMult(),
  };

  const unlockedZones = ZONE_DATA.filter(z => isZoneUnlocked(z.id));
  let html = '';
  let grandTotal = 0;

  for (const zone of unlockedZones) {
    const zoneAuto = G.ownedAutomation.filter(o => o.zone === zone.id);
    if (!zoneAuto.length) continue;

    // Aggregate by type
    const typeCounts = {};
    for (const owned of zoneAuto) {
      const def = AUTOMATION.find(a => a.id === owned.id);
      if (!def) continue;
      typeCounts[def.type] = (typeCounts[def.type] || 0) + 1;
    }

    // Zone catch/s — sum of all assigned units
    const zoneRate = zoneAuto.reduce((sum, owned) => {
      const def = AUTOMATION.find(a => a.id === owned.id);
      if (!def) return sum;
      const tm = typeMults[def.type] || 1;
      return sum + (speedBase * tm * multiCatch * extraMult) / def.rate;
    }, 0);
    grandTotal += zoneRate;

    const allowedTypes = ZONE_AUTO_TYPES[zone.id] || [];

    const catHtml = allowedTypes
      .filter(t => typeCounts[t] > 0)
      .map(t => `<div class="ao-cat"><img src="${AUTO_CAT_ICONS[t]}" alt="${t}">×${typeCounts[t]}</div>`)
      .join('');

    const rateStr = zoneRate >= 1   ? zoneRate.toFixed(1) + ' catch/s'
                  : zoneRate >= 0.1 ? zoneRate.toFixed(2) + ' catch/s'
                  : '1 / ' + Math.round(1 / zoneRate) + 's';

    html += `
      <div class="ao-zone-block">
        <div class="ao-zone-name">${zone.name}</div>
        <div class="ao-cats">${catHtml}</div>
        <div class="ao-rate">${rateStr}</div>
      </div>`;
  }

  const totalStr = grandTotal >= 10  ? Math.round(grandTotal) + ' catch/s'
                 : grandTotal >= 1   ? grandTotal.toFixed(1) + ' catch/s'
                 : grandTotal >= 0.1 ? grandTotal.toFixed(2) + ' catch/s'
                 : grandTotal > 0    ? '1 / ' + Math.round(1 / grandTotal) + 's'
                 : '0 catch/s';

  html += `<div class="ao-total-row"><span>Total</span><span>${totalStr}</span></div>`;
  body.innerHTML = html;
}

function rateApp() {
  const marketUrl = 'market://details?id=com.henlygames.patientangler';
  const webUrl = 'https://play.google.com/store/apps/details?id=com.henlygames.patientangler&hl=en';
  if (typeof Capacitor !== 'undefined' && Capacitor.Plugins && Capacitor.Plugins.App) {
    Capacitor.Plugins.App.openUrl({ url: marketUrl });
  } else if (typeof Capacitor !== 'undefined') {
    setTimeout(() => { window.open(marketUrl, '_system'); }, 1000);
  } else {
    window.open(webUrl, '_blank');
  }
}

function openExternalLink(url) {
  if (typeof Capacitor !== 'undefined') {
    setTimeout(() => { window.open(url, '_system'); }, 1000);
  } else {
    window.open(url, '_blank');
  }
}

// Make catch/s HUD indicator clickable
// document.getElementById('hud-fishrate').style.cursor = 'pointer';
// document.getElementById('hud-fishrate').addEventListener('click', openAutoOverview);

// AUTOMATION SHOP NOTICE — add inside renderShop() 'automation' tab block:
// if (tab === 'automation') {
//   const notice = document.createElement('div');
//   notice.className = 'shop-zone-notice';
//   notice.textContent = 'Automation purchased in this zone will permanently work here. Only Prestige lets you choose a different zone.';
//   el.appendChild(notice);
//   AUTOMATION.filter(a => isZoneUnlocked(a.unlocksAt)).forEach(a => { ... });
// }

===================================================================== */
