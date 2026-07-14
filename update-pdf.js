#!/usr/bin/env node
// Appends today's design changes as new pages to the Game Reference PDF
const fs   = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

const PDF_PATH = path.join(__dirname, 'Patient Angler Game Reference.pdf');

const GOLD   = rgb(0.957, 0.769, 0.188);
const WHITE  = rgb(1, 1, 1);
const GRAY   = rgb(0.6, 0.6, 0.6);
const BLACK  = rgb(0, 0, 0);
const BG     = rgb(0.08, 0.06, 0.04);
const BG2    = rgb(0.12, 0.09, 0.05);

// ── Content sections ──────────────────────────────────────────────────────────

const SECTIONS = [
  {
    title: 'Dev Log — v0.1.13  (2026-07-09)',
    subtitle: 'All changes since v0.1.12',
    color: GOLD,
    blocks: [],
  },
  {
    title: 'BLACK PEARL SYSTEM (reworked)',
    blocks: [
      {
        heading: 'Passive Sell Bonus',
        lines: [
          'Formula: sellMultiplier = 1 + (blackPearls × 0.01)',
          'Each unspent Black Pearl adds +1% to all fish sell value.',
          'No cap — scales linearly with pearl count.',
          'Spending pearls in the Pearl Shop reduces the passive bonus.',
        ],
      },
      {
        heading: 'Prestige Threshold (dynamic)',
        lines: [
          'Formula: threshold = floor(15,000 × 1.20^prestigeCount)',
          'Prestige 0: 15,000c   Prestige 5: ~37,324c',
          'Prestige 10: ~92,876c   Prestige 20: ~574,856c',
          'Each subsequent prestige requires more coins to unlock.',
        ],
      },
    ],
  },
  {
    title: 'PEARL SHOP (reworked)',
    blocks: [
      {
        heading: 'Upgrade Table',
        lines: [
          'Cost formula: ceil(baseCost × growthRate^currentLevel)',
          '',
          'Market Discount   base:2 ×1.60  max:5    -10% shop costs / level',
          'Empire Boost      base:2 ×1.45  max:8    +25% automation speed / level',
          'Expanded Holds    base:2 ×1.35  no cap   +50% storage capacity / level',
          'Hauling Nets      base:5 ×1.40  no cap   +1 extra auto catch / 5 levels',
          'Lucky Waters      base:3 ×1.45  max:10   +5% Rare/Epic catch chance / level',
          'Master Angler     base:3 ×1.35  max:8    -1 tap required / 2 levels (min 4)',
          'Treasure Hunter   base:4 ×1.45  max:10   +5% Lost Treasure event chance / level',
          'Offline Expert    base:3 ×1.40  max:12   +10% offline earnings / level',
          'Competition Spirit base:3 ×1.35 max:10   +10% competition coin rewards / level',
          'Fish Whisperer    base:4 ×1.50  max:10   +3% Trophy fish chance / level',
        ],
      },
    ],
  },
  {
    title: 'TARGETED LURE (new system)',
    blocks: [
      {
        heading: 'Overview',
        lines: [
          'Permanent coin upgrade, 5 levels. Purchased from Bait Shop tab.',
          'Each level adds 1 active target slot.',
          'Targets are set from Fishdex — tap "Target" on any caught eligible item.',
          'Eligible: common / uncommon / rare / epic fish, plants, trash.',
          'Not eligible: legendary fish, special/manual-only items.',
        ],
      },
      {
        heading: 'Costs & Effect',
        lines: [
          'Level 1 -- 25,000c     -> 1 target slot',
          'Level 2 -- 250,000c   -> 2 target slots',
          'Level 3 -- 2,500,000c -> 3 target slots',
          'Level 4 -- 25M coins  -> 4 target slots',
          'Level 5 -- 250M coins -> 5 target slots',
          '',
          'Targeted items get ×3 loot weight in automation rollCatch().',
          'Does NOT affect manual (active) fishing — automation only.',
        ],
      },
    ],
  },
  {
    title: 'SEAGULL REWARD (rebalanced)',
    blocks: [
      {
        heading: 'Formula',
        lines: [
          'Reward = max(10, round(getEstimatedHourlyIncome() × 0.01 × baitMult))',
          '',
          'Estimated hourly income = base automation income only.',
          '  — No Pearl bonuses, no rod sell bonus, no multipliers.',
          '',
          'Bait multiplier: +10% per Seagull Bait consumed (linear, no cap).',
          '  baitMult = 1 + (seagullBaitCount × 0.10)',
          '',
          'Scales throughout the entire game with player progression.',
        ],
      },
    ],
  },
  {
    title: 'PREMIUM BAIT',
    blocks: [
      {
        heading: 'Updated Cost',
        lines: [
          'Cost: 5 Diamonds (increased from 2)',
          'Effect: unchanged — doubles non-common loot weights for 30 min.',
          'Does not guarantee rare catches; improves expected value.',
        ],
      },
    ],
  },
  {
    title: 'SERVER-SIDE REDEEM CODES',
    blocks: [
      {
        heading: 'Architecture',
        lines: [
          'Codes stored on Railway server — not visible in client source code.',
          'Endpoint: POST /pa/redeem  { uid, code }',
          'Each code can be redeemed once per Google account (uid).',
          'Requires Google Sign-In to redeem.',
          'Table: pa_codes_used (code TEXT, uid TEXT, PRIMARY KEY(code, uid))',
          '',
          'Active codes: REVIEW, LAUNCH, PEARLS5',
          'Reward types: coins, diamonds, autoIncome (1h estimated income)',
        ],
      },
    ],
  },
  {
    title: 'FISHDEX MASTERY (new system)',
    blocks: [
      {
        heading: 'Mastery Tiers (per item)',
        lines: [
          'Bronze   -- 100 catches    -> 1 mastery point',
          'Silver   -- 1,000 catches  -> 2 mastery points',
          'Gold     -- 10,000 catches -> 3 mastery points',
          'Platinum -- 100,000 catches-> 4 mastery points',
          'Diamond  -- 1,000,000 catches -> 5 mastery points',
          '',
          'Eligible: all fish except legendary/special, all plants, all trash.',
          'All catches count (manual + automation + offline).',
          'Counts persist across prestige (masteryData kept).',
        ],
      },
      {
        heading: 'Zone Mastery Points',
        lines: [
          'Zone points = sum of all item tier points in that zone.',
          'Max 150 points per zone (30 items × 5 pts).',
          'Bonus thresholds: 25 / 50 / 75 / 100 / 125 / 150 points.',
        ],
      },
      {
        heading: 'Zone Bonuses (unlocked at each threshold)',
        lines: [
          'Pond:   +5% fish sell, +10% storage, +3% rare catch,',
          '        +8% auto speed, +10% quest reward, +10% offline',
          'River:  +5% fish sell, +8% auto speed, +3% rare catch,',
          '        +10% offline, +2% trophy chance, +10% comp reward',
          'Lake:   +5% fish sell, +10% storage, +3% rare catch,',
          '        +8% auto speed, +10% offline, +2% trophy chance',
          'Bay:    +5% fish sell, +3% rare catch, +2% trophy chance,',
          '        +10% offline, +10% quest reward, +8% auto speed',
          'Sea:    +5% fish sell, +10% storage, +3% rare catch,',
          '        +2% trophy chance, +8% auto speed, +10% comp reward',
          'Ocean:  +5% fish sell, +3% rare catch, +2% trophy chance,',
          '        +10% storage, +10% offline, +10% comp reward',
        ],
      },
      {
        heading: 'Fishdex UI',
        lines: [
          'Zone mastery panel at top: points bar + bonus tags (locked/unlocked).',
          'Each item cell shows: tier medal (B/S/G/P/D), catch count, progress bar.',
          'Diamond tier cells have animated cyan glow border.',
        ],
      },
    ],
  },
  {
    title: 'COMPETITION REWARDS (rebalanced)',
    blocks: [
      {
        heading: 'New Formula',
        lines: [
          '1st Place: 500 + round(estimatedHourlyIncome × 0.05)',
          '2nd Place: 250 + round(estimatedHourlyIncome × 0.03)',
          '3rd Place: 100 + round(estimatedHourlyIncome × 0.01)',
          '4th+ Place: 0',
          '',
          'Estimated hourly income = base economy only.',
          '  — No Pearl/Mastery bonuses, no rod sell multiplier.',
          '',
          'Pearl Competition Spirit and Mastery compReward bonuses',
          'apply on top as multipliers after the base reward is calculated.',
          '',
          'Competition gameplay, duration, and AI unchanged.',
        ],
      },
    ],
  },
  {
    title: 'ROD TIER EFFECTS (rebalanced)',
    blocks: [
      {
        heading: 'New Values',
        lines: [
          'Basic Rod      +5%  fish sell price / tier      (was +15%)',
          'River Rod      +10% Net automation speed / tier  (was +20%)',
          'Lake Rod       +10% Fisherman speed / tier       (was +20%)',
          'Bay Rod        +12% storage capacity / tier      (was +20%)',
          'Sea Rod        +10% Boat speed / tier            (was +20%)',
          'Ocean Rod      +10% Fleet speed / tier           (was +20%)',
          'Carbon Rod     +3%  Legendary catch chance / tier (was +10%)',
          '               (relative weight multiplier, not flat %)',
          'Mythic Rod     +8%  Diamond earnings / tier      (was +50%)',
          'Abyss Rod      +8%  Abyss fish sell value / tier (was +50%)',
          '               (Abyss zone fish only — unchanged scope)',
          '',
          'Rod unlock costs and click counts unchanged.',
          'Existing tier levels carry over — only percentages changed.',
        ],
      },
    ],
  },
  {
    title: 'ADMOB GDPR FIX',
    blocks: [
      {
        heading: 'UMP Consent Flow',
        lines: [
          'EU/EEA players (e.g. Greece, Estonia) were not receiving ads.',
          'Root cause: AdMob requires UMP consent before initialization.',
          '',
          'Fix: requestConsentInfo() → loadAndShowConsentFormIfRequired()',
          'runs before AM.initialize() on every app start.',
          'If consent SDK unavailable, falls back gracefully and continues.',
        ],
      },
    ],
  },
];

// ── PDF builder ───────────────────────────────────────────────────────────────

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 48;
const COL_W  = PAGE_W - MARGIN * 2;

async function run() {
  const existing = fs.readFileSync(PDF_PATH);
  const pdfDoc   = await PDFDocument.load(existing);

  const fontBold  = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg   = await pdfDoc.embedFont(StandardFonts.Helvetica);

  function sanitize(t) {
    return t
      .replace(/→/g, '->')   // →
      .replace(/–/g, '-')    // en dash
      .replace(/—/g, '--')   // em dash
      .replace(/×/g, 'x')   // ×
      .replace(/◆/g, '*')   // ◆
      .replace(/[^\x00-\xFF]/g, '?');
  }

  function wrapText(text, font, size, maxW) {
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (font.widthOfTextAtSize(test, size) > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  let page, y;

  function newPage() {
    page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    // dark background
    page.drawRectangle({ x:0, y:0, width:PAGE_W, height:PAGE_H, color:BG });
    y = PAGE_H - MARGIN;
  }

  function ensureSpace(needed) {
    if (y - needed < MARGIN) newPage();
  }

  function drawText(text, { font = fontReg, size = 10, color = WHITE, indent = 0, spacing = 4 } = {}) {
    const wrapped = wrapText(sanitize(text), font, size, COL_W - indent);
    for (const line of wrapped) {
      ensureSpace(size + spacing);
      page.drawText(line, { x: MARGIN + indent, y: y - size, font, size, color });
      y -= size + spacing;
    }
  }

  function drawRule(color = GOLD, thickness = 1) {
    ensureSpace(thickness + 6);
    page.drawLine({ start:{x:MARGIN,y:y-2}, end:{x:PAGE_W-MARGIN,y:y-2}, thickness, color });
    y -= thickness + 6;
  }

  function drawSectionHeader(text, subtitle, color = GOLD) {
    newPage();
    // header bar
    page.drawRectangle({ x:0, y:PAGE_H-60, width:PAGE_W, height:60, color:BG2 });
    page.drawText(sanitize(text), { x:MARGIN, y:PAGE_H-38, font:fontBold, size:16, color });
    if (subtitle) {
      page.drawText(sanitize(subtitle), { x:MARGIN, y:PAGE_H-54, font:fontReg, size:9, color:GRAY });
    }
    y = PAGE_H - 76;
    drawRule(color);
  }

  // ── Render sections ──────────────────────────────────────────────────────
  for (const section of SECTIONS) {
    drawSectionHeader(section.title, section.subtitle, section.color || GOLD);
    for (const block of section.blocks) {
      ensureSpace(24);
      drawText(block.heading, { font:fontBold, size:11, color:GOLD, spacing:3 });
      drawRule(rgb(0.3, 0.2, 0.05), 0.5);
      y -= 2;
      for (const line of block.lines) {
        if (line === '') { y -= 5; continue; }
        const isSub = line.startsWith('  ') || line.startsWith('—');
        drawText(line, {
          font:  isSub ? fontReg : fontReg,
          size:  9,
          color: isSub ? GRAY : WHITE,
          indent: isSub ? 12 : 0,
          spacing: 3,
        });
      }
      y -= 10;
    }
  }

  const bytes = await pdfDoc.save();
  fs.writeFileSync(PDF_PATH, bytes);
  console.log(`✅ PDF updated — ${pdfDoc.getPageCount()} pages total.`);
  console.log(`   Saved: ${PDF_PATH}`);
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
