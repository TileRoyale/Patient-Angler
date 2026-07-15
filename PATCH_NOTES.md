# Patient Angler: Idle Fishing — Patch Notes

---

## v0.8.5 — Build 42 (July 2026)

### New
- **Discord community** — join link added to Settings. Chat with other anglers, share catches, give feedback
- **Google Play review** — rate the game link added to Settings. Helps the game grow!

---

## v0.8.4 — Build 41 (July 2026)

### Fix
- **Debug button removed** — Ghost Ship debug spawn button is no longer visible in production builds

---

## v0.8.3 — Build 40 (July 2026)

### Fix
- **Sea unlock comic** — Sea Discovery comic no longer gets permanently skipped after Prestige; it will now show again the next time the player unlocks the Sea zone

---

## v0.8.2 — Build 39 (July 2026)

### New
- **Haptic Feedback toggle** — Settings › Audio now has an ON/OFF toggle for vibration / haptic feedback

### Balance
- **Ghost Ship rebalanced** — spawn rolls every 2 real hours (was 7 h). Multiple ships can now appear simultaneously: 1 slot by default, +1 per Expedition Vessel owned (max 5). Every expedition now always rewards a Sunken Treasure Chest in addition to coins and an automation unit. Treasure Hold blocking: claim is blocked when hold is full — ship waits until you open a chest
- **Ghost Ship reward pre-generated** — reward is locked in when expedition starts; re-opening the popup or reloading the save never rerolls it
- **Expedition Vessel repriced** — base cost 75M → 50M, scaling ×5 → ×2 (prices: 50M · 100M · 200M · 400M · 800M · 1.6B · 3.2B · 6.4B · 12.8B · 25.6B)
- **Expedition Vessel chests never lost** — if hold is full when a chest is due, the vessel holds it and delivers automatically the moment you open a chest
- **Ocean zone costs ×5** — Ocean Rod 1.25B → 6.25B · Research Vessel 200M → 1B (total unlock: 1.45B → 7.25B)

---

## v0.8.1 — Build 38 (July 2026)

### New
- **Ghost Busters pearl upgrade** — reduces Ghost Ship expedition time by 1 in-game hour per level (max 20 levels, costs 10→20→40→… pearls doubling each time)
- **Animated Worm Bobber** — new cosmetic bobber available in the Diamond shop for 100 Diamonds
- **Bobber shop sorted by price** — all diamond cosmetics now ordered cheapest to most expensive

### Balance
- **Sea Rod and above repriced ×5** — Sea Rod 25M→125Mc · Ocean Rod 250M→1.25Bc · Carbon Rod 200M→1Bc · Mythic Rod 500M→2.5Bc · Abyss Rod 1.5B→7.5Bc
- **Ghost Ship loot rebalanced** — no longer awards Diamonds. Now always gives an automation unit: 50% River Net · 30% Ancient Fisherman · 20% Ancient Fishing Boat, plus coins (24–48h of automation income)
- **Ancient unit production** now shown individually in the automation rate breakdown (click the fish icon)

### Fixes
- Ghost Ship reward popup now shows the awarded automation unit prominently with its icon

---

## v0.8.0 — Build 37 (July 2026)

### New
- **Dad Jokes** — after every manual fish catch, a dad joke appears in the catch popup. 700 jokes cycle in a shuffled order; the full set completes before any joke repeats. Toggle in Settings › Display. Off by default.

### Balance
- **Bay automation repriced** — Row Boat 30,000 → 350,000c · Motor Boat 300,000 → 1,200,000c · Fishing Boat 3,000,000 → 4,000,000c
- **Sea automation repriced** — Small Fleet 5,000,000 → 15,000,000c · Large Fleet 50,000,000 → 75,000,000c
- Catch rates unchanged. +15% per-purchase scaling unchanged.

### Fixes
- **Background resume** — bringing the app to the foreground now correctly runs offline progress calculation. Previously only a cold launch triggered it, causing storage mismatches for players who left the app running in the background.

---

## v0.7.x — Builds 25–36 (June–July 2026)

### New Features
- **Interactive tutorial** — 13-step guided intro for new players. Covers casting, the bobber, catching, the Fishdex, the market, and buying a first Net. Automatically skips for returning players.
- **Fish Fight events** — rare mini-event during active fishing. A competing fish tries to steal your catch; tap fast enough to win and receive the catch at ×5 base value. 3-minute cooldown between events.
- **Quests system** — 3 random daily quests (resets midnight), 1 weekly quest (resets Monday), and 9 permanent achievements. Red badge on the Quests nav button when rewards are ready to claim.
- **All 6 zones** — River, Lake, Bay, Sea, and Ocean fully implemented. Each zone has 10 fish, 10 plants, and 10 trash items (180 total Fishdex entries). Loot tables shift toward rarer catches in deeper zones.
- **Transport vehicles** — one-time zone-unlock purchases separate from automation boats. Waders (River), Rowing Boat (Lake), Speedboat (Bay), Fishing Vessel (Sea), Research Vessel (Ocean).
- **Fishermen, Boats & Fleets** — full automation tier ladder. Each tier belongs to a specific zone and runs permanently and simultaneously with all other zones.
- **Diamond currency + Premium Bait** — Diamonds earned through Abyss prestige, competitions, and quests (or purchased via IAP). Premium Bait costs 2 Diamonds and doubles the weight of all non-common loot rolls for 30 minutes.
- **Fishdex** — full encyclopedia across all 6 zones with zone tabs. Caught entries show species image and rarity; uncaught entries show a silhouette. Progress counter per zone.
- **In-game clock** — 24× real-time speed (1 real hour = 1 in-game day). Clock visible in HUD. Time period (Dawn / Morning / Afternoon / Evening / Night) affects which fish species appear.
- **Dynamic fish market** — each species cycles through demand states independently (Crash 0.1× / Low 0.5× / Normal 1× / High 1.5× / Surge 2.5×). Demand badge and value shown inline on every inventory item.
- **Fish spoilage** — caught fish expire after 12 hours by default. Expired fish cannot be sold. Storage upgrades extend shelf life up to 7 days (Harbor Cold Storage).
- **Offline progress** — automation catches calculated for time spent away, capped at storage capacity. Summary shown on return.
- **Trophy fish** — rare size class (5% chance). Triggers special fanfare, awards 1 Diamond, records weight in Fishdex, counts toward competition leaderboard.
- **Settings screen** — music on/off + volume, sound effects toggle, font size, bobber size, catch tickers toggle, player name, reset progress, about.
- **Scrollable info windows** — ? help buttons in all major menu screens. Content scrolls; button row stays fixed.
- **Fish production rate counter** — HUD shows current catch/s from all active automation.

### Changes
- **Automation multiple purchases** — any automation unit can be purchased any number of times. Each subsequent purchase costs base × 1.15^n. Owned count badge shown.
- **Bobber** — replaced CSS-drawn div with actual equipped bobber PNG. Updates live on equip.
- **Sprite transparency** — white backgrounds removed from all icon PNGs and fish sprites.
- **Font** — Pixeloid Sans Bold added as primary game font via @font-face.
- **Navigation** — bottom bar expanded to 5 icons (Shop, Market, Zones, Competition, Fishdex). HUD center nav added for Quests, Hall of Fame, Abyss, Settings.
- **Shop** — panel hidden by default, slides in on tab press; same tab again closes it. Exit button always visible. All items now show a description line.
- **Market** — demand shown inline on inventory items (no separate prices table). Sell All button moved to top.
- **HUD** — zone name, coin counter, fish counter rendered at 2× previous size.

### Balance
- **Zone unlock costs ×10** — all rod and transport costs multiplied by 10. River: 2,300c total · Lake: 6,500c · Bay: 15,000c · Sea: 45,000c · Ocean: 150,000c
- **Automation rates slowed ~1.5×** — all catch intervals increased. Fishing Net: 40s → 60s · Skilled Fisher: 10s → 15s · Motor Boat: 2s → 3s · Small Fleet: 5/s → 2/s
- **Automation costs dramatically increased** — mid and high tiers repriced for 8-month F2P target. Veteran Fisher ×30 (10k → 300k) · Fishing Boat ×60 (50k → 3M) · Deep Sea Fleet ×250 (2M → 500M)
- **Sea & Ocean unlock costs ×3** — on top of the ×10 pass. Sea total: 15M → 45M · Ocean total: 150M → 450M

### Fixes
- **Fish Fight cooldown** — 3-minute cooldown between Fish Fight triggers. Previously could fire back-to-back.
- **Fish Fight probability** — reduced from 1% to 0.5% per eligible catch.
