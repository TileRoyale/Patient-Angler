# Patient Angler: Idle Fishing — Patch Notes

---

## v0.8.11 — Build 50 (July 2026)

### Fix
- **Hauling Nets no longer boosts manual fishing** — Hauling Nets (pearl upgrade) was incorrectly multiplying catches during active fishing as well as automation. It now only affects automation catches as intended. Electric Bobber continues to give +1 catch to manual fishing.

---

## v0.8.10 — Build 49 (July 2026)

### Fix
- **Offline progress loading delay** — large offline windows (4 h+) no longer cause a 20–25 second freeze on app launch. Fish catch pools are now pre-cached per zone before the processing loop instead of filtering the full database on every iteration.
- **Storage not filling on resume** — app returning from background now correctly recalculates offline catches. Previously the background/foreground handlers were registered but never defined, so the offline timer was never applied when the app resumed without a cold restart.
- **Jeweler tab shows coins** — the currency counter in the shop header now displays Black Pearls (with pearl icon) when the Jeweler tab is open, and switches back to coins for all other tabs.

---

## v0.8.9 — Build 48 (July 2026)

### Fix
- **Diamond Store** — Automation Upgrade and Storage Upgrade moved from the Jeweler tab to the Diamond Store under a dedicated Permanent Upgrades section. Buy button style now matches Premium Bait and Auto-Seller.

---

## v0.8.8 — Build 47 (July 2026)

### New
- **Diamond Shop** — two permanent upgrades in the Jeweler tab: Automation Upgrade (+10% global automation speed/level) and Storage Upgrade (+10% storage capacity/level). Each costs 100 Diamonds. Max 25 levels; 50 levels unlocked after reaching the Abyss. Survive every Prestige reset.
- **Rod upgrades independent** — each owned rod now upgrades to its maximum tier freely. No longer blocked by other rods needing to reach the same tier first.
- **Fishdex help** — mastery popup now explains that catch progress and current medal are visible on each Fishdex entry.

### Fix
- **Android resume** — added Capacitor `appStateChange` listener as fallback for devices where `visibilitychange` is unreliable. App now recovers correctly after returning from background on all tested Android versions.
- **Loading screen** — optional subsystems (AdMob, IAP, Auth, Analytics) now wrapped in try/catch. A failed subsystem no longer risks an infinite loading screen.
- **Special events while backgrounded** — special event timer now pauses when the app is backgrounded. On return, at most one event spawns if the cooldown expired. Previously the timer could fire while the app was hidden, consuming the event without the player seeing it.

---

## v0.8.7 — Build 46 (July 2026)

### Fix
- **Special events** — rewarded ad now loads on demand when the player taps the claim button, instead of pre-loading when the event spawns. This fixes the issue where the app returning from background showed an active event but the ad was unavailable, forcing the player to skip. Ad retries automatically up to 3 times before showing a manual retry option.

---

## v0.8.6.2 — Build 45 (July 2026)

### Fix
- **Community buttons** — Discord, Google Play and Reddit buttons in Settings now open correctly on Android (fixed SVG pointer-event blocking and Capacitor WebView inline handler scope)

---

## v0.8.6.1 — Build 44 (July 2026)

### Fix
- **Community links on mobile** — Discord and Google Play links now open in the system browser (installed Capacitor Browser plugin)

---

## v0.8.6 — Build 43 (July 2026)

### Fix
- **Community links on mobile** — Discord and Google Play links now correctly open in the system browser on Android instead of inside the game

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
