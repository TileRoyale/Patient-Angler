#!/usr/bin/env node
// Generates "Patient Angler Loot Table.pdf" from current game data
const fs   = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

const OUT = path.join(__dirname, 'Patient Angler Loot Table.pdf');

// ── Colours ───────────────────────────────────────────────────────────────────
const BG      = rgb(0.07, 0.05, 0.03);
const BG2     = rgb(0.11, 0.08, 0.05);
const BG3     = rgb(0.14, 0.10, 0.06);
const WHITE   = rgb(1, 1, 1);
const GRAY    = rgb(0.55, 0.55, 0.55);
const GOLD    = rgb(0.957, 0.769, 0.188);
const DIM     = rgb(0.45, 0.42, 0.38);

const RARITY_COLOR = {
  common:    rgb(0.65, 0.65, 0.65),
  uncommon:  rgb(0.20, 0.75, 0.20),
  rare:      rgb(0.10, 0.55, 0.95),
  epic:      rgb(0.65, 0.22, 0.90),
  legendary: rgb(1.00, 0.55, 0.00),
  plant:     rgb(0.30, 0.65, 0.30),
  trash:     rgb(0.45, 0.40, 0.35),
};

const ZONE_COLOR = {
  pond:  rgb(0.18, 0.42, 0.18),
  river: rgb(0.10, 0.38, 0.55),
  lake:  rgb(0.08, 0.28, 0.52),
  bay:   rgb(0.08, 0.38, 0.50),
  sea:   rgb(0.06, 0.20, 0.55),
  ocean: rgb(0.04, 0.10, 0.48),
};

const ZONE_NAME = { pond:'Pond (Tiik)', river:'River (Jõgi)', lake:'Lake (Järv)', bay:'Bay (Laht)', sea:'Sea (Meri)', ocean:'Ocean (Ookean)' };

// ── Data (from game.js) ───────────────────────────────────────────────────────

const FISH_DB = [
  // Pond
  { id:'crucian_carp',       name:'Crucian Carp',            rarity:'common',   baseValue:3,    zone:'pond',  zones:['pond'] },
  { id:'roach',              name:'Roach',                    rarity:'common',   baseValue:3,    zone:'pond',  zones:['pond','river'] },
  { id:'tench',              name:'Tench',                    rarity:'uncommon', baseValue:10,   zone:'pond',  zones:['pond','river','lake'] },
  { id:'goldfish',           name:'Goldfish',                  rarity:'uncommon', baseValue:12,   zone:'pond',  zones:['pond'] },
  { id:'small_perch',        name:'Small Perch',              rarity:'common',   baseValue:3,    zone:'pond',  zones:['pond','river'] },
  { id:'stone_loach',        name:'Stone Loach',              rarity:'uncommon', baseValue:9,    zone:'pond',  zones:['pond'] },
  { id:'stickleback',        name:'Stickleback',              rarity:'common',   baseValue:2,    zone:'pond',  zones:['pond'] },
  { id:'pumpkinseed',        name:'Pumpkinseed',              rarity:'rare',     baseValue:15,   zone:'pond',  zones:['pond'] },
  { id:'weatherfish',        name:'Weatherfish',              rarity:'rare',     baseValue:18,   zone:'pond',  zones:['pond'] },
  { id:'common_bream',       name:'Common Bream',             rarity:'common',   baseValue:4,    zone:'pond',  zones:['pond','river'] },
  { id:'giant_crucian_carp', name:'Giant Crucian Carp',       rarity:'epic',     baseValue:55,   zone:'pond',  zones:['pond'], special:true },
  // River
  { id:'brown_trout',        name:'Brown Trout',              rarity:'rare',     baseValue:45,   zone:'river', zones:['river','lake'] },
  { id:'grayling',           name:'Grayling',                 rarity:'uncommon', baseValue:18,   zone:'river', zones:['river'] },
  { id:'barbel',             name:'Barbel',                   rarity:'uncommon', baseValue:13,   zone:'river', zones:['river'] },
  { id:'chub',               name:'Chub',                     rarity:'common',   baseValue:5,    zone:'river', zones:['river'] },
  { id:'pike',               name:'Pike',                     rarity:'rare',     baseValue:50,   zone:'river', zones:['river','lake'] },
  { id:'burbot',             name:'Burbot',                   rarity:'epic',     baseValue:160,  zone:'river', zones:['river'] },
  // Lake
  { id:'large_perch',        name:'Large Perch',              rarity:'common',   baseValue:12,   zone:'lake',  zones:['lake'] },
  { id:'zander',             name:'Zander',                   rarity:'uncommon', baseValue:35,   zone:'lake',  zones:['lake'] },
  { id:'whitefish',          name:'Whitefish',                rarity:'uncommon', baseValue:38,   zone:'lake',  zones:['lake','bay'] },
  { id:'vendace',            name:'Vendace',                  rarity:'uncommon', baseValue:28,   zone:'lake',  zones:['lake'] },
  { id:'eel',                name:'Eel',                      rarity:'rare',     baseValue:75,   zone:'lake',  zones:['lake','bay'] },
  { id:'carp',               name:'Carp',                     rarity:'common',   baseValue:14,   zone:'lake',  zones:['lake'] },
  { id:'catfish',            name:'European Catfish',         rarity:'epic',     baseValue:200,  zone:'lake',  zones:['lake'] },
  // Bay
  { id:'baltic_herring',     name:'Baltic Herring',           rarity:'common',   baseValue:15,   zone:'bay',   zones:['bay','sea'] },
  { id:'flounder',           name:'Flounder',                 rarity:'uncommon', baseValue:45,   zone:'bay',   zones:['bay'] },
  { id:'garfish',            name:'Garfish',                  rarity:'rare',     baseValue:110,  zone:'bay',   zones:['bay'] },
  { id:'sea_trout',          name:'Sea Trout',                rarity:'epic',     baseValue:320,  zone:'bay',   zones:['bay','sea'] },
  { id:'seabass',            name:'Seabass',                  rarity:'rare',     baseValue:120,  zone:'bay',   zones:['bay','sea'] },
  { id:'mackerel',           name:'Mackerel',                 rarity:'uncommon', baseValue:35,   zone:'bay',   zones:['bay','sea'] },
  { id:'smelt',              name:'Smelt',                    rarity:'common',   baseValue:11,   zone:'bay',   zones:['bay'] },
  { id:'sprat',              name:'Sprat',                    rarity:'common',   baseValue:9,    zone:'bay',   zones:['bay'] },
  // Sea
  { id:'cod',                name:'Cod',                      rarity:'uncommon', baseValue:80,   zone:'sea',   zones:['sea','ocean'] },
  { id:'salmon',             name:'Salmon',                   rarity:'rare',     baseValue:190,  zone:'sea',   zones:['sea'] },
  { id:'halibut',            name:'Halibut',                  rarity:'epic',     baseValue:550,  zone:'sea',   zones:['sea','ocean'] },
  { id:'haddock',            name:'Haddock',                  rarity:'uncommon', baseValue:75,   zone:'sea',   zones:['sea'] },
  { id:'redfish',            name:'Redfish',                  rarity:'uncommon', baseValue:78,   zone:'sea',   zones:['sea'] },
  { id:'wolffish',           name:'Wolffish',                 rarity:'epic',     baseValue:500,  zone:'sea',   zones:['sea'] },
  // Ocean
  { id:'atlantic_mackerel',  name:'Atlantic Mackerel',        rarity:'common',   baseValue:65,   zone:'ocean', zones:['ocean'] },
  { id:'tuna',               name:'Tuna',                     rarity:'common',   baseValue:80,   zone:'ocean', zones:['ocean'] },
  { id:'swordfish',          name:'Swordfish',                rarity:'uncommon', baseValue:220,  zone:'ocean', zones:['ocean'] },
  { id:'marlin',             name:'Marlin',                   rarity:'rare',     baseValue:480,  zone:'ocean', zones:['ocean'] },
  { id:'mahi_mahi',          name:'Mahi-Mahi',                rarity:'common',   baseValue:65,   zone:'ocean', zones:['ocean'] },
  { id:'giant_squid',        name:'Giant Squid',              rarity:'legendary',baseValue:560,  zone:'ocean', zones:['ocean'], timeWindow:'00:00-02:00' },
  { id:'oarfish',            name:'Oarfish',                  rarity:'rare',     baseValue:420,  zone:'ocean', zones:['ocean'] },
  { id:'coelacanth',         name:'Coelacanth',               rarity:'legendary',baseValue:1800, zone:'ocean', zones:['ocean'], timeWindow:'01:00-03:00' },
  // Time-specific / Special (Manual Only)
  { id:'morning_perch',   name:'Morning Perch',   rarity:'uncommon', baseValue:5,   zone:'pond',  zones:['pond'],  timeWindow:'07:00-10:00', special:true },
  { id:'afternoon_roach', name:'Afternoon Roach', rarity:'common',   baseValue:4,   zone:'pond',  zones:['pond'],  timeWindow:'12:00-15:00', special:true },
  { id:'dawn_trout',      name:'Dawn Trout',      rarity:'rare',     baseValue:50,  zone:'river', zones:['river'], timeWindow:'04:00-07:00', special:true },
  { id:'midnight_eel',    name:'Midnight Eel',    rarity:'epic',     baseValue:160, zone:'river', zones:['river'], timeWindow:'00:00-03:00', special:true },
  { id:'evening_catfish', name:'Evening Catfish', rarity:'uncommon', baseValue:35,  zone:'lake',  zones:['lake'],  timeWindow:'18:00-22:00', special:true },
  { id:'night_pike',      name:'Night Pike',      rarity:'rare',     baseValue:60,  zone:'lake',  zones:['lake'],  timeWindow:'22:00-02:00', special:true },
  { id:'predawn_zander',  name:'Pre-dawn Zander', rarity:'rare',     baseValue:40,  zone:'lake',  zones:['lake'],  timeWindow:'03:00-05:00', special:true },
];

const FISH_WEIGHTS = {
  crucian_carp:[100,4500], roach:[50,1800], tench:[200,5000], goldfish:[50,2000],
  small_perch:[30,800], stone_loach:[5,50], stickleback:[2,10], pumpkinseed:[20,300],
  weatherfish:[10,150], common_bream:[200,8000], giant_crucian_carp:[500,6000],
  brown_trout:[100,10000], grayling:[50,2500], barbel:[200,10000], chub:[100,4000],
  pike:[500,25000], burbot:[100,7000],
  large_perch:[100,3000], zander:[200,12000], whitefish:[100,3000], vendace:[20,400],
  eel:[100,3000], carp:[500,20000], catfish:[2000,80000],
  baltic_herring:[20,100], flounder:[100,3000], garfish:[100,1200], sea_trout:[200,15000],
  seabass:[200,10000], mackerel:[100,2000], smelt:[10,80], sprat:[10,50],
  cod:[500,40000], salmon:[500,30000], halibut:[2000,300000], haddock:[200,10000],
  redfish:[100,5000], wolffish:[500,20000],
  atlantic_mackerel:[100,1800], tuna:[10000,600000], swordfish:[10000,500000],
  marlin:[20000,800000], mahi_mahi:[1000,40000], giant_squid:[100000,300000],
  oarfish:[50000,270000], coelacanth:[30000,95000],
  morning_perch:[30,800], afternoon_roach:[50,1800], dawn_trout:[100,10000],
  midnight_eel:[100,3000], evening_catfish:[500,30000], night_pike:[500,25000],
  predawn_zander:[200,12000],
};

function fmtWeight(g) { return g >= 1000 ? (g/1000).toFixed(g>=10000?0:1)+' kg' : g+' g'; }
function fmtWeightRange(id) {
  const w = FISH_WEIGHTS[id];
  if (!w) return '—';
  return fmtWeight(w[0]) + ' – ' + fmtWeight(w[1]);
}

const TRASH_DB = [
  // Pond
  { id:'old_boot',       name:'Old Boot',                  zone:'pond',  zones:['pond','river'] },
  { id:'tin_can',        name:'Tin Can',                   zone:'pond',  zones:['pond','river'] },
  { id:'plastic_bag',    name:'Plastic Bag',               zone:'pond',  zones:['pond','river'] },
  { id:'glass_bottle',   name:'Glass Bottle',              zone:'pond',  zones:['pond'] },
  { id:'rusty_hook',     name:'Rusty Hook',                zone:'pond',  zones:['pond'] },
  { id:'broken_rod',     name:'Broken Rod',                zone:'pond',  zones:['pond'] },
  { id:'old_tire',       name:'Old Tire',                  zone:'pond',  zones:['pond'] },
  { id:'rubber_duck',    name:'Rubber Duck',               zone:'pond',  zones:['pond'] },
  { id:'garden_glove',   name:'Garden Glove',              zone:'pond',  zones:['pond','river'] },
  { id:'bicycle_wheel',  name:'Bicycle Wheel',             zone:'pond',  zones:['pond'] },
  // River
  { id:'net_fragment',   name:'Fishing Net Fragment',      zone:'river', zones:['river','lake'] },
  { id:'plastic_bottle', name:'Plastic Bottle',            zone:'river', zones:['river'] },
  { id:'car_part',       name:'Car Part',                  zone:'river', zones:['river','lake'] },
  { id:'rope',           name:'Rope',                      zone:'river', zones:['river','lake','bay'] },
  { id:'broken_jar',     name:'Broken Glass Jar',          zone:'river', zones:['river'] },
  { id:'shopping_bag',   name:'Shopping Bag',              zone:'river', zones:['river'] },
  // Lake
  { id:'anchor',         name:'Anchor',                    zone:'lake',  zones:['lake','bay','sea'] },
  { id:'sunken_buoy',    name:'Sunken Buoy',               zone:'lake',  zones:['lake','bay'] },
  { id:'motor_part',     name:'Outboard Motor Part',       zone:'lake',  zones:['lake'] },
  { id:'beer_cans',      name:'Beer Cans',                 zone:'lake',  zones:['lake'] },
  { id:'wet_suitcase',   name:'Waterlogged Suitcase',      zone:'lake',  zones:['lake'] },
  { id:'troll_weight',   name:'Trolling Weight',           zone:'lake',  zones:['lake'] },
  { id:'sunken_bicycle', name:'Bicycle',                   zone:'lake',  zones:['lake'] },
  // Bay
  { id:'lobster_trap',   name:'Lobster Trap',              zone:'bay',   zones:['bay'] },
  { id:'anchor_chain',   name:'Lost Anchor Chain',         zone:'bay',   zones:['bay','sea'] },
  { id:'crab_pot',       name:'Old Crab Pot',              zone:'bay',   zones:['bay'] },
  { id:'oil_drum',       name:'Oil Drum',                  zone:'bay',   zones:['bay','sea'] },
  { id:'propeller',      name:'Lost Propeller',            zone:'bay',   zones:['bay'] },
  { id:'divers_fin',     name:"Diver's Fin",               zone:'bay',   zones:['bay'] },
  { id:'tangled_net',    name:'Tangled Net',               zone:'bay',   zones:['bay','sea'] },
  // Sea
  { id:'sunken_chest',   name:'Sunken Chest',              zone:'sea',   zones:['sea'] },
  { id:'naval_mine',     name:'Old Naval Mine',            zone:'sea',   zones:['sea'] },
  { id:'ships_bell',     name:"Ship's Bell",               zone:'sea',   zones:['sea','ocean'] },
  { id:'old_lantern',    name:'Old Lantern',               zone:'sea',   zones:['sea'] },
  { id:'ship_wheel',     name:'Ship Wheel',                zone:'sea',   zones:['sea','ocean'] },
  { id:'naval_flag',     name:'Naval Flag',                zone:'sea',   zones:['sea','ocean'] },
  // Ocean
  { id:'aircraft_part',  name:'Sunken Aircraft Part',      zone:'ocean', zones:['ocean'] },
  { id:'pressure_gauge', name:'Deep Sea Pressure Gauge',   zone:'ocean', zones:['ocean'] },
  { id:'lost_submarine', name:'Lost Submarine',            zone:'ocean', zones:['ocean'] },
  { id:'amphora',        name:'Ancient Amphora',           zone:'ocean', zones:['ocean'] },
  { id:'black_box',      name:'Black Box',                 zone:'ocean', zones:['ocean'] },
  { id:'whale_bones',    name:'Whale Bones',               zone:'ocean', zones:['ocean'] },
  { id:'sub_cable',      name:'Submarine Cable',           zone:'ocean', zones:['ocean'] },
];

const PLANT_DB = [
  // Pond
  { id:'reed',            name:'Reed',                     zone:'pond',  zones:['pond'] },
  { id:'lily_pad',        name:'Lily Pad',                 zone:'pond',  zones:['pond'] },
  { id:'algae_clump',     name:'Algae Clump',              zone:'pond',  zones:['pond'] },
  { id:'water_hyacinth',  name:'Water Hyacinth',           zone:'pond',  zones:['pond'] },
  { id:'hornwort',        name:'Hornwort',                 zone:'pond',  zones:['pond','river','lake'] },
  { id:'duckweed',        name:'Duckweed',                 zone:'pond',  zones:['pond','river'] },
  { id:'cattail',         name:'Cattail',                  zone:'pond',  zones:['pond'] },
  { id:'watercress',      name:'Watercress',               zone:'pond',  zones:['pond','river','lake'] },
  { id:'arrowhead_plant', name:'Arrowhead Plant',          zone:'pond',  zones:['pond'] },
  { id:'water_mint',      name:'Water Mint',               zone:'pond',  zones:['pond','river'] },
  // River
  { id:'water_crowfoot',  name:'Water Crowfoot',           zone:'river', zones:['river'] },
  { id:'river_weed',      name:'River Weed',               zone:'river', zones:['river'] },
  { id:'submerged_moss',  name:'Submerged Moss',           zone:'river', zones:['river'] },
  { id:'water_celery',    name:'Water Celery',             zone:'river', zones:['river'] },
  { id:'flowering_rush',  name:'Flowering Rush',           zone:'river', zones:['river','lake'] },
  { id:'mares_tail',      name:"Mare's Tail",              zone:'river', zones:['river'] },
  // Lake
  { id:'yellow_lily',     name:'Yellow Water Lily',        zone:'lake',  zones:['lake'] },
  { id:'white_lily',      name:'White Water Lily',         zone:'lake',  zones:['lake'] },
  { id:'quillwort',       name:'Quillwort',                zone:'lake',  zones:['lake'] },
  { id:'water_soldier',   name:'Water Soldier',            zone:'lake',  zones:['lake'] },
  { id:'bladderwort',     name:'Bladderwort',              zone:'lake',  zones:['lake'] },
  { id:'water_violet',    name:'Water Violet',             zone:'lake',  zones:['lake','bay'] },
  { id:'bulrush',         name:'Bulrush',                  zone:'lake',  zones:['lake','bay'] },
  // Bay
  { id:'bladderwrack',    name:'Bladderwrack',             zone:'bay',   zones:['bay','sea'] },
  { id:'sea_lettuce',     name:'Sea Lettuce',              zone:'bay',   zones:['bay','sea'] },
  { id:'kelp_frond',      name:'Kelp Frond',               zone:'bay',   zones:['bay','sea'] },
  { id:'eelgrass',        name:'Eelgrass',                 zone:'bay',   zones:['bay','sea'] },
  { id:'coralline_algae', name:'Coralline Algae',          zone:'bay',   zones:['bay'] },
  { id:'irish_moss',      name:'Irish Moss',               zone:'bay',   zones:['bay'] },
  { id:'dulse',           name:'Dulse',                    zone:'bay',   zones:['bay'] },
  { id:'rockweed',        name:'Rockweed',                 zone:'bay',   zones:['bay'] },
  // Sea
  { id:'giant_kelp',      name:'Giant Kelp',               zone:'sea',   zones:['sea','ocean'] },
  { id:'sugar_kelp',      name:'Sugar Kelp',               zone:'sea',   zones:['sea','ocean'] },
  { id:'bootlace_weed',   name:'Bootlace Weed',            zone:'sea',   zones:['sea','ocean'] },
  { id:'sea_oak',         name:'Sea Oak',                  zone:'sea',   zones:['sea'] },
  { id:'oarweed',         name:'Oarweed',                  zone:'sea',   zones:['sea'] },
  { id:'pepper_dulse',    name:'Pepper Dulse',             zone:'sea',   zones:['sea'] },
  // Ocean
  { id:'deep_coral',      name:'Deep Sea Coral',           zone:'ocean', zones:['ocean'] },
  { id:'vent_algae',      name:'Black Smoker Vent Algae',  zone:'ocean', zones:['ocean'] },
  { id:'midnight_kelp',   name:'Midnight Zone Kelp',       zone:'ocean', zones:['ocean'] },
  { id:'biolum_algae',    name:'Bioluminescent Algae',     zone:'ocean', zones:['ocean'] },
  { id:'abyssal_grass',   name:'Abyssal Sea Grass',        zone:'ocean', zones:['ocean'] },
  { id:'tube_worm',       name:'Giant Tube Worm Cluster',  zone:'ocean', zones:['ocean'] },
  { id:'sea_fan',         name:'Sea Fan',                  zone:'ocean', zones:['ocean'] },
];

const LOOT_TABLE = {
  pond:  { trash:30, plant:20, common:35, uncommon:10, rare:4, epic:1, legendary:0 },
  river: { trash:28, plant:18, common:32, uncommon:12, rare:7, epic:3, legendary:0 },
  lake:  { trash:22, plant:15, common:32, uncommon:14, rare:11, epic:5, legendary:1 },
  bay:   { trash:18, plant:12, common:32, uncommon:18, rare:12, epic:6, legendary:2 },
  sea:   { trash:14, plant:10, common:28, uncommon:20, rare:15, epic:9, legendary:4 },
  ocean: { trash:10, plant:8,  common:26, uncommon:20, rare:18, epic:12, legendary:6 },
};

const RARITY_ORDER = ['common','uncommon','rare','epic','legendary'];

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function otherZones(zones, native) { return zones.filter(z => z !== native).map(z => cap(z)).join(', '); }

// ── PDF layout constants ───────────────────────────────────────────────────────
const PW = 595, PH = 842, M = 38, CW = PW - M*2;

// Column widths for fish table
const COL = { name:185, rarity:58, value:55, weight:125, notes:92 };

async function run() {
  const doc = await PDFDocument.create();
  const B   = await doc.embedFont(StandardFonts.HelveticaBold);
  const R   = await doc.embedFont(StandardFonts.Helvetica);

  let page, y;

  function newPage(fillBg = true) {
    page = doc.addPage([PW, PH]);
    if (fillBg) page.drawRectangle({ x:0, y:0, width:PW, height:PH, color:BG });
    y = PH - M;
  }

  function space(needed) { if (y - needed < M + 12) newPage(); }

  function txt(text, opts = {}) {
    const { font=R, size=8.5, color=WHITE, x=M, maxW=CW, spacing=3.5 } = opts;
    // word-wrap
    const words = String(text).split(' ');
    let line = '';
    for (const w of words) {
      const test = line ? line+' '+w : w;
      if (font.widthOfTextAtSize(test, size) > maxW && line) {
        space(size + spacing);
        page.drawText(line, { x, y: y - size, font, size, color });
        y -= size + spacing;
        line = w;
      } else { line = test; }
    }
    if (line) {
      space(size + spacing);
      page.drawText(line, { x, y: y - size, font, size, color });
      y -= size + spacing;
    }
  }

  function rule(color = rgb(0.25,0.18,0.08), h = 0.5) {
    space(h + 4);
    page.drawLine({ start:{x:M,y:y-1}, end:{x:PW-M,y:y-1}, thickness:h, color });
    y -= h + 4;
  }

  // ── Cover page ───────────────────────────────────────────────────────────────
  newPage();
  page.drawRectangle({ x:0, y:PH-120, width:PW, height:120, color:BG2 });
  page.drawLine({ start:{x:0,y:PH-120}, end:{x:PW,y:PH-120}, thickness:2, color:GOLD });

  page.drawText('Patient Angler: Idle Fishing', { x:M, y:PH-52, font:B, size:22, color:GOLD });
  page.drawText('Complete Loot Table', { x:M, y:PH-74, font:B, size:15, color:WHITE });
  page.drawText('v0.1.14  |  2026-07-09  |  Henly Games / Recapsa OU', { x:M, y:PH-92, font:R, size:9, color:GRAY });

  y = PH - 148;

  // Summary table
  const ZONES = ['pond','river','lake','bay','sea','ocean'];
  const headers = ['Zone', 'Fish (regular)', 'Time-specific', 'Plants', 'Trash', 'Total'];
  const colX = [M, M+100, M+200, M+280, M+350, M+420];

  y -= 6;
  page.drawRectangle({ x:M-4, y:y-14, width:CW+8, height:18, color:BG3 });
  headers.forEach((h, i) => page.drawText(h, { x:colX[i], y:y-11, font:B, size:8, color:GOLD }));
  y -= 16; rule();

  let grandTotal = 0;
  ZONES.forEach(zone => {
    const regularFish  = FISH_DB.filter(f => f.zone === zone && !f.special && !f.timeWindow);
    const specialFish  = FISH_DB.filter(f => f.zone === zone && (f.special || f.timeWindow) && !f.zones.includes('ocean') || (f.zone === zone && (f.timeWindow||f.special)));
    const timeFish     = FISH_DB.filter(f => f.zone === zone && (f.special || f.timeWindow));
    const plants       = PLANT_DB.filter(p => p.zone === zone);
    const trash        = TRASH_DB.filter(t => t.zone === zone);
    const total        = regularFish.length + timeFish.length + plants.length + trash.length;
    grandTotal += total;
    const row = [ZONE_NAME[zone], String(regularFish.length), String(timeFish.length), String(plants.length), String(trash.length), String(total)];
    row.forEach((v, i) => page.drawText(v, { x:colX[i], y:y-9.5, font: i===0?B:R, size:8.5, color: i===5?GOLD:WHITE }));
    y -= 16;
    rule(rgb(0.15,0.10,0.05));
  });
  page.drawText('Total items in game: ' + grandTotal, { x:M, y:y-10, font:B, size:9, color:GOLD });
  y -= 28;

  // Legend
  rule();
  y -= 4;
  txt('RARITY LEGEND', { font:B, size:8, color:GRAY });
  y -= 2;
  const rarities = ['common','uncommon','rare','epic','legendary'];
  const rarityDesc = { common:'Grey — 60% base', uncommon:'Green — 25% base', rare:'Blue — 10% base', epic:'Purple — 4% base', legendary:'Gold — 1% base (manual only)' };
  rarities.forEach(r => {
    space(14);
    page.drawRectangle({ x:M, y:y-10, width:8, height:8, color:RARITY_COLOR[r] });
    page.drawText(cap(r) + '  —  ' + rarityDesc[r], { x:M+13, y:y-10, font:R, size:8, color:WHITE });
    y -= 13;
  });
  y -= 6;
  rule();
  y -= 4;
  txt('NOTES', { font:B, size:8, color:GRAY });
  y -= 2;
  const notes = [
    '* "Also in" shows other zones where the item is catchable (shared loot pool).',
    '* Time-specific fish are manual-only. Automation catches them only during the active window.',
    '* Special / epic unique fish (e.g. Giant Crucian Carp) are manual-only.',
    '* Legendary fish are always manual-only regardless of time window.',
    '* All trash items sell for 1c flat (no demand fluctuation).',
    '* All plants have 0c base value (Herbalist NPC buys late-game).',
    '* Base value is before demand multiplier (0.1x Collapse to 2.5x Surge) and size modifier.',
    '* Trophy size multiplier: 3x. Large: 1.5x. Medium: 1x. Small: 0.8x. Tiny: 0.5x.',
  ];
  notes.forEach(n => { txt(n, { size:7.5, color:GRAY, spacing:4 }); y -= 1; });

  // ── Zone pages ───────────────────────────────────────────────────────────────
  for (const zone of ZONES) {
    newPage();

    // Zone header bar
    page.drawRectangle({ x:0, y:PH-58, width:PW, height:58, color:ZONE_COLOR[zone] });
    page.drawText(ZONE_NAME[zone].toUpperCase(), { x:M, y:PH-32, font:B, size:18, color:WHITE });
    const lt = LOOT_TABLE[zone];
    const ltStr = `Catch rates: Trash ${lt.trash}%  Plant ${lt.plant}%  Common ${lt.common}%  Uncommon ${lt.uncommon}%  Rare ${lt.rare}%  Epic ${lt.epic}%` + (lt.legendary ? `  Legendary ${lt.legendary}%` : '');
    page.drawText(ltStr, { x:M, y:PH-48, font:R, size:7, color:rgb(0.8,0.8,0.8) });
    y = PH - 74;

    // ── FISH section ────────────────────────────────────────────────────────
    const regularFish = FISH_DB.filter(f => f.zone === zone && !f.special && !f.timeWindow);
    const timeFish    = FISH_DB.filter(f => f.zone === zone && (f.special || f.timeWindow));

    // section title
    rule(ZONE_COLOR[zone], 1);
    space(14);
    page.drawText('FISH', { x:M, y:y-11, font:B, size:9.5, color:GOLD });
    y -= 14;

    // column headers
    space(13);
    page.drawRectangle({ x:M-3, y:y-12, width:CW+6, height:14, color:BG3 });
    page.drawText('Name',         { x:M,                          y:y-10, font:B, size:7.5, color:GRAY });
    page.drawText('Rarity',       { x:M+COL.name,                 y:y-10, font:B, size:7.5, color:GRAY });
    page.drawText('Base Val',     { x:M+COL.name+COL.rarity,      y:y-10, font:B, size:7.5, color:GRAY });
    page.drawText('Weight range', { x:M+COL.name+COL.rarity+COL.value, y:y-10, font:B, size:7.5, color:GRAY });
    page.drawText('Also catchable in', { x:M+COL.name+COL.rarity+COL.value+COL.weight, y:y-10, font:B, size:7.5, color:GRAY });
    y -= 14; rule();

    function drawFishRow(f) {
      space(13);
      const others = otherZones(f.zones, zone);
      page.drawText(f.name,         { x:M,                          y:y-9, font:R, size:8, color:WHITE });
      page.drawText(cap(f.rarity),  { x:M+COL.name,                 y:y-9, font:B, size:8, color:RARITY_COLOR[f.rarity] || WHITE });
      page.drawText(f.baseValue+'c',{ x:M+COL.name+COL.rarity,      y:y-9, font:R, size:8, color:WHITE });
      page.drawText(fmtWeightRange(f.id), { x:M+COL.name+COL.rarity+COL.value, y:y-9, font:R, size:8, color:DIM });
      if (others) page.drawText(others, { x:M+COL.name+COL.rarity+COL.value+COL.weight, y:y-9, font:R, size:7.5, color:DIM });
      y -= 13;
      rule(rgb(0.12,0.09,0.06));
    }

    // sort by rarity order
    const sorted = [...regularFish].sort((a,b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));
    sorted.forEach(drawFishRow);

    if (timeFish.length) {
      y -= 4;
      space(13);
      page.drawText('TIME-SPECIFIC / SPECIAL  (manual only)', { x:M, y:y-10, font:B, size:8.5, color:rgb(1,0.65,0.10) });
      y -= 14; rule(rgb(0.35,0.20,0.05));

      // headers with Time Window column replacing Weight
      space(13);
      page.drawRectangle({ x:M-3, y:y-12, width:CW+6, height:14, color:BG3 });
      page.drawText('Name',         { x:M,                          y:y-10, font:B, size:7.5, color:GRAY });
      page.drawText('Rarity',       { x:M+COL.name,                 y:y-10, font:B, size:7.5, color:GRAY });
      page.drawText('Base Val',     { x:M+COL.name+COL.rarity,      y:y-10, font:B, size:7.5, color:GRAY });
      page.drawText('Time Window',  { x:M+COL.name+COL.rarity+COL.value, y:y-10, font:B, size:7.5, color:GRAY });
      page.drawText('Weight range', { x:M+COL.name+COL.rarity+COL.value+COL.weight, y:y-10, font:B, size:7.5, color:GRAY });
      y -= 14; rule();

      timeFish.forEach(f => {
        space(13);
        const tw = f.timeWindow || '—';
        page.drawText(f.name,         { x:M,                          y:y-9, font:R, size:8, color:WHITE });
        page.drawText(cap(f.rarity),  { x:M+COL.name,                 y:y-9, font:B, size:8, color:RARITY_COLOR[f.rarity] || WHITE });
        page.drawText(f.baseValue+'c',{ x:M+COL.name+COL.rarity,      y:y-9, font:R, size:8, color:WHITE });
        page.drawText(tw,             { x:M+COL.name+COL.rarity+COL.value, y:y-9, font:R, size:8, color:rgb(1,0.65,0.10) });
        page.drawText(fmtWeightRange(f.id), { x:M+COL.name+COL.rarity+COL.value+COL.weight, y:y-9, font:R, size:8, color:DIM });
        y -= 13;
        rule(rgb(0.12,0.09,0.06));
      });
    }

    // ── PLANTS section ────────────────────────────────────────────────────────
    const plants = PLANT_DB.filter(p => p.zone === zone);
    y -= 6;
    rule(ZONE_COLOR[zone], 1);
    space(14);
    page.drawText('PLANTS  (0c — no sell value)', { x:M, y:y-11, font:B, size:9.5, color:RARITY_COLOR.plant });
    y -= 14;

    space(13);
    page.drawRectangle({ x:M-3, y:y-12, width:CW+6, height:14, color:BG3 });
    page.drawText('Name',             { x:M,       y:y-10, font:B, size:7.5, color:GRAY });
    page.drawText('Also catchable in',{ x:M+260,   y:y-10, font:B, size:7.5, color:GRAY });
    y -= 14; rule();

    plants.forEach(p => {
      space(13);
      const others = otherZones(p.zones, zone);
      page.drawText(p.name,  { x:M,     y:y-9, font:R, size:8, color:RARITY_COLOR.plant });
      if (others) page.drawText(others, { x:M+260, y:y-9, font:R, size:7.5, color:DIM });
      y -= 13;
      rule(rgb(0.12,0.09,0.06));
    });

    // ── TRASH section ─────────────────────────────────────────────────────────
    const trash = TRASH_DB.filter(t => t.zone === zone);
    y -= 6;
    rule(ZONE_COLOR[zone], 1);
    space(14);
    page.drawText('TRASH  (1c flat — auto-sells)', { x:M, y:y-11, font:B, size:9.5, color:RARITY_COLOR.trash });
    y -= 14;

    space(13);
    page.drawRectangle({ x:M-3, y:y-12, width:CW+6, height:14, color:BG3 });
    page.drawText('Name',             { x:M,     y:y-10, font:B, size:7.5, color:GRAY });
    page.drawText('Also catchable in',{ x:M+260, y:y-10, font:B, size:7.5, color:GRAY });
    y -= 14; rule();

    trash.forEach(t => {
      space(13);
      const others = otherZones(t.zones, zone);
      page.drawText(t.name,  { x:M,     y:y-9, font:R, size:8, color:RARITY_COLOR.trash });
      if (others) page.drawText(others, { x:M+260, y:y-9, font:R, size:7.5, color:DIM });
      y -= 13;
      rule(rgb(0.12,0.09,0.06));
    });
  }

  // ── Save ─────────────────────────────────────────────────────────────────────
  const bytes = await doc.save();
  fs.writeFileSync(OUT, bytes);
  const pages = doc.getPageCount();
  console.log(`PDF created: ${pages} pages`);
  console.log(`Saved: ${OUT}`);
}

run().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
