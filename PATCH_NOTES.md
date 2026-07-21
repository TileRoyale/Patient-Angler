# Patient Angler: Idle Fishing — Patch Notes

---

## v0.9.4.6 — Build 73 (July 2026)

### Fix
- **Monk Fish / Blue Whale images broken** — Android filesystem is case-sensitive; image paths were `Monk Fish.png` and `Blue Whale.png` while actual files are `Monk fish.png` and `Blue whale.png`. Both paths corrected.
- **Automation speed display wrong** — HUD showed lower catch-per-second than actual automation rate because `getAutomationUpgradeMultiplier()` was applied to catches but not to the display calculation. Both `_calcZoneAutoRate()` and `_calcTypeRate()` now include the multiplier.
- **Legendary fish confusion** — game hint said legendary fish could only be caught manually. Only the 3 Black Pearl legendaries per zone are true legendaries; the manual-only Seahorse, Monk Fish, Coelacanth, Giant Squid, Blue Whale, and Mola-mola are Epic rarity. Manual Fishdex header text clarified; rarity values corrected in fishdex data.
- **Trophy Catches stat resets on sell** — stat was reading from `trophyPile.length` which empties after selling. Replaced with cumulative `stats.trophyCatches` counter; old saves are migrated automatically from trophy records.
- **Legendary catch popup** — removed stale line "It does not award Black Pearls now."

### Feature
- **Dynamic IAP prices** — diamond packs and premium features now show the real localized price fetched from Google Play Billing on every launch. No hardcoded prices remain; buttons show "…" while loading and "Unavailable" if a product cannot be queried.
- **Font size slider** — minimum reduced from 70% to 40% for players who need smaller text.

### Balance
- **Diamond purchase confirmation** — all three diamond-spend actions (Automation Upgrade, Premium Bait, Auto-Seller) now show a confirmation dialog before deducting diamonds.

---

## v0.9.4.5 — Build 72 (July 2026)

### Fix
- **Rewarded ad after background** — "Grab the Treasure" button could get permanently stuck on "Loading ad…" after returning from a background session. Android can invalidate a loaded rewarded ad while the app is backgrounded; the ad-ready flag is now reset on every background event so AdMob always performs a fresh reload on foreground. If a special event was already showing before the player backgrounded, a reload is also triggered immediately on return so the ad is ready by the time the player taps claim.

---

## v0.9.4.4 — Build 71 (July 2026)

### Feature
- **Remote config** — balance values, UI defaults, event timing, and feature flags can now be updated server-side without a new app build. Font/bobber scale defaults, fish sell multiplier, special event frequency, competition and Ghost Ship toggles, and a server message banner are all live-configurable.

---

## v0.9.4.3 — Build 70 (July 2026)

### Fix
- **Full House daily quest** — quest was not completing when storage was already at capacity from a previous session. The fill-detection logic only triggers on a not-full → full transition; added a startup check so the quest is credited immediately if storage is full when the game loads.
- **Rewarded ad / special event after background** — special event could fire while the app was backgrounded (the foreground-resume timer was not tracked and therefore not cancellable). Event now waits 10 seconds after the player returns to the foreground, giving AdMob time to reconnect and preventing a popup the player can't act on.

### Security
- **Crash logging** — Sentry integrated (EU data residency); captures unhandled errors with game context (zone, progress, user id). Helps catch issues players would otherwise just uninstall over.
- **Cloud save auth** — cloud save and load now require a valid Firebase ID token; server derives the player UID from the token instead of trusting the client.
- **IAP hardening** — purchases and non-consumable restores are server-verified before items are granted; network errors no longer silently grant items.
- **Save anti-cheat** — server now validates coin rate, diamond/black pearl gain, bobber tier, prestige rate, and non-consumable ownership against purchase receipts on every save.

---

## v0.9.4.2 — Build 69 (July 2026)

### Fix
- **Jeweler display** — removed redundant Fish Sell Multiplier line; only the percentage bonus is shown now
- **Competition rewards** — rewards now correctly scale to 1 in-game hour of automation income (was 1 real hour = 24× too high)
- **Competition end screen** — reward shown in K/M/B/T or scientific notation instead of raw number

### UI
- **Jeweler help (?)** — added explanation of Black Pearl diminishing returns with examples

---

## v0.9.4.1 — Build 68 (July 2026)

### Balance
- **Black Pearl sell bonus — diminishing returns** — bonus is now logarithmic instead of linear. At low counts the feel is similar (10 pearls ≈ +9.5%), but high stacks are significantly reduced (100 pearls → +69% instead of +100%; 5 000 pearls → +393% instead of +5 000%).
- **Market Discount reworked** — early levels nerfed from −10% to **−5% per level** (Lv1–5); Lv6+ stays at −2% per level. Maximum discount hard-capped at **−90%** (minimum 0.10× price).
- **Competition rewards now zone-scaled** — rewards are based on estimated automation income multiplied by a zone factor (River 1.25×/0.75×/0.375×; Lake 2×/1.2×/0.6×; Bay 3×/1.8×/0.9×; Sea 5×/3×/1.5×; Ocean 10×/6×/3×). Pond keeps its fixed base + small % bonus.

---

## v0.9.4.0 — Build 67 (July 2026)

### Feature
- **20 numerical fish size ranges** — replaces the 5 named sizes (Tiny / Small / Medium / Large / Trophy). Fish are now Size 1–20, with a bell-curve weight distribution. Sizes 18–20 are Trophy-class (earn a Diamond).
- **Heavy Bobber reworked** — instead of a hard index shift (capping at Large), each tier now adds weighted bias toward larger size ranges. All 15 tiers provide distinct improvement. Trophy chance grows from ~0.3% (no bobber) to ~2.5% (Tier 15 max).

### Balance
- **Basic Bobber** — fishing speed bonus increased from +1% to **+3% per tier** (Tier 15 = +45% total)
- **Electronic Bobber** — changed from guaranteed +1 extra fish per tier to **+50% extra catch chance per tier** (stacks: Tier 2 = 100% = guaranteed +1; Tier 3 = guaranteed +1 + 50% chance of +2; etc.)

### Fix
- **Save migration** — existing fish pile entries and FishDex best-size records are automatically converted from the old named-size format to the new numeric format on first load

---

## v0.9.3.9 — Build 66 (July 2026)

### Balance
- **Pond fish sell values doubled** — all Pond fish baseValues ×2 (Giant Crucian Carp unchanged at 39c): Stickleback 1→2, Crucian Carp / Roach / Small Perch 2→4, Common Bream / Afternoon Roach 3→6, Morning Perch 4→8, Stone Loach 6→12, Tench 7→14, Goldfish 8→16, Pumpkinseed 11→22, Weatherfish 13→26
- **Net costs reduced** — Fishing Net base 100→60c (1st purchase still 10c), Reinforced Net 3 000→1 000c, River Net 15 000→5 000c
- **River Net faster** — catch interval 30s → 25s

---

## v0.9.3.8 — Build 65 (July 2026)

### New
- **4 new manual-only fish** — catch them only by active fishing during specific in-game hours:
  - **Seahorse** (Bay, Legendary, 07:00–11:00) — earns 320 coins base
  - **Monk Fish** (Bay, Epic, 20:00–00:00) — earns 196 coins base
  - **Mola-mola** (Sea, Legendary, 10:00–14:00) — earns 500 coins base
  - **Blue Whale** (Ocean, Legendary, 01:00–03:00) — earns 1 260 coins base
- **Coelacanth moved to Sea** — previously Ocean-only, now a Sea Legendary (01:00–03:00, 500 coins base)
- **Bay and Sea loot tables** now include a Legendary weight slot — manual fishing in these zones can roll Legendary fish

### Balance
- **Giant Squid baseValue** 392 → 960 (Ocean Legendary rebalance)
- **Coelacanth baseValue** 1 260 → 500 (moved to Sea; reflects zone)
- **Mola-mola baseValue** set to 500 (matches Coelacanth at Sea tier)

### Fix
- **Mastery help overlay** — Gold / Platinum / Diamond catch thresholds were showing outdated values; now match the actual thresholds in code (200 K / 2 M / 20 M)
- **Ghost Ship reward popup** — on small screens the reward list can now scroll; title, image and Claim button always stay visible
- **Jeweler — pearl upgrade bonus display** — multiple upgrades showed incorrect current/next bonus text:
  - Lucky Waters: was showing ×5 the real value (+5% per level shown, +1% actual)
  - Fish Whisperer: was showing ×6 the real value (+3% per level shown, +0.5% actual)
  - Market Discount / Empire Boost / Offline Expert / Competition Spirit / Treasure Hunter: bonus display did not account for the rate change after the upgrade's breakpoint level, showing inflated numbers at high levels
  - Ghost Busters, Starting Capital, Ghost Whisperer: now show a current bonus label (were blank before)
- **Lucky Waters description** updated to reflect that Uncommon and Legendary fish also benefit (not just Rare and Epic)

---

## v0.9.3.7 — Build 64 (July 2026)

### Fix
- **Ad loading after long background sessions** — replaced unreliable `visibilitychange` event with Capacitor's `App.appStateChange` for proper foreground detection on Android. Ads now reload correctly when returning to the game after hours in the background.
- **Claim button stuck on "Loading ad…"** — fixed a bug where `removeAllListeners()` could hang after a long background session, permanently stalling the button. The promise now resolves immediately; a 15-second safety timer also unblocks the button if anything else hangs.
- **Stale ad prepare guard** — if an ad prepare has been running for over 10 seconds when the app resumes, it is now force-reset before starting a fresh load.

---

## v0.9.3.6 — Build 63 (July 2026)

### Feature
- **Redeem codes can now grant multiple rewards** — a single code can give both automation income and Diamonds at the same time.

---

## v0.9.3.5 — Build 62 (July 2026)

### Balance
- **Diamond pack sizes increased** — Starter Pack 80→200, Angler's Pouch 200→400, Fisher's Chest 550→1100, Captain's Vault 1200→2500.

---

## v0.9.3.4 — Build 61 (July 2026)

### Fix
- **Expedition Vessel chest no longer held** — when Treasure Hold is full, expedition chests now sink immediately (same as manual/automation/Ghost Ship chests) instead of being stored and delivered later.
- **Chest storage full popup** — a dismissible popup now appears when a chest sinks due to a full Treasure Hold. Includes a "Do not show again" option that switches to a quiet toast notification instead.

### Polish
- **Status notifications wrap** — long toast messages (e.g. chest capacity warning) now wrap to multiple lines instead of overflowing off-screen.
- **Ancient Frozen Storage icon** — image resized from 1029×900 px (1.93 MB) to 256×224 px (128 KB), matching other Storage shop icons.

---

## v0.9.3.3 — Build 60 (July 2026)

### Fix
- **Sunken Treasure Chest reward now in in-game hours** — coin reward was calculated as 24–48 real hours of automation income (Sea) / 24–72 real hours (Ocean). Now correctly uses in-game hours (÷24), matching the same fix applied to Ghost Ship rewards in v0.9.3.1.

---

## v0.9.3.2 — Build 59 (July 2026)

### Fix
- **Expedition Vessels and Ancient units visible again** — a leftover reference to the old pricing constant caused a JavaScript error that hid the entire Boats shop section. Fixed.

### Balance
- **Ghost Ship stays longer** — idle time extended from 20 real minutes to 1 real hour (24 in-game hours). Players have more time to notice and send the ship on expedition.

---

## v0.9.3.1 — Build 58 (July 2026)

### Fix
- **Ghost Ship coin reward now in in-game hours** — reward was calculated as 24–48 real hours of automation income. Now correctly 24–48 in-game hours (1–2 real hours), making it proportional to actual expedition duration.

### Balance
- **Ghost Ship smaller** — sprite reduced another 25% (now 125×169px, down from original 221×300px). Takes up less screen space while fishing.

---

## v0.9.3.0 — Build 57 (July 2026)

### Balance — Late-game economy overhaul
- **Sea / Ocean progression significantly slower** — Sea Rod 125M → 625M, Ocean Rod 6.25B → 62.5B. Bay → Sea now takes approximately 5× longer; Sea → Ocean approximately 10× longer.
- **Transport costs updated** — Fishing Vessel 20M → 100M, Research Vessel 1B → 10B.
- **Fleets more expensive** — Small Fleet 15M → 125M, Large Fleet 75M → 500M, Deep Sea Fleet 500M → 2.5B. Fleet production rates unchanged.
- **Sea-tier storage repriced** — Walk-in Freezer 50K → 50M, Harbor Cold Storage 250K → 250M. Capacities unchanged.
- **Rod hierarchy fixed** — Carbon Rod and Mythic Rod now cost more than Ocean Rod (1B and 2.5B were both cheaper than Ocean Rod). New costs: Carbon Rod 250B, Mythic Rod 1T, Abyss Rod 10T.
- **Rod upgrade costs updated** — all Sea+ rod tier upgrades repriced to match new rod costs.
- **Expedition Vessels completely rebalanced** — hand-tuned curve replaces simple ×2 doubling. New prices: 1B / 5B / 20B / 100B / 500B / 2T / 8T / 25T / 75T / 200T. First vessel is now a meaningful Sea investment; last vessels belong to Ocean endgame.

### New
- **Starting Capital (Jeweler upgrade)** — new pearl upgrade. Each level grants +2000 starting coins after every prestige. Cost: 2 pearls at level 1, +2 pearls per subsequent level.

### Fix
- **Coin display now shows B / T / Qa** — large coin amounts previously displayed as e.g. "6250.0M" instead of "6.25B". Billions, trillions, and quadrillions now format correctly.

---

## v0.9.2.1 — Build 55 (July 2026)

### Performance
- **Offline calculation instant** — offline progress calculation now runs analytically instead of simulating up to 200,000 individual catches. Loading time on return from a 12-hour offline session drops from several seconds to near-instant on all devices.

---

## v0.9.2.2 — Build 56 (July 2026)

### Balance
- **Ghost Ship spawns more often** — spawn roll now fires every 1 real hour (was 2 hours). 60% spawn chance unchanged — average time between ships roughly halved.
- **Expedition duration extended** — Ghost Ship expeditions now take 3 real hours (was 1 hour), matching their deeper lore as ocean voyages.
- **Ghost Busters upgrade expanded** — max level raised from 20 to 50. Each level still reduces expedition time by 1 in-game hour (2.5 real minutes). At max level, expedition time reduces by ~125 real minutes.

### Fix
- **Guild Orders never request legendary fish** — W1 Legendary fish (1-in-50,000,000 drop rate) were eligible to appear in Guild Orders, making those orders impossible to complete. They are now excluded from all Guild Order generation.

---

## v0.9.2 — Build 54 (July 2026)

### Fix
- **Legendary fish drop rate** — Crimson Crown Perch, Golden Veil Carp, Silver Ribbon Loach and other W1 Legendary fish were appearing far too frequently for Pond zone automation and offline catches (roughly 1 per 430 catches instead of the intended 1 per 50,000,000). Root cause: the epic loot-table fallback incorrectly included W1 Legendary fish when no non-manual epic existed in a zone. Fixed by excluding W1 Legendary fish from all regular loot-table paths — they now only appear via the dedicated 1-in-50-million roll. A one-time save migration removes any W1 Legendary fish caught via this bug from existing inventories and Fishdex on first launch.

---

## v0.9.1 — Build 53 (July 2026)

### Fix
- **Legendary catch popup scrollable** — on small or landscape screens the golden legendary catch popup now scrolls vertically so all content (fish image, name, description, first-discovery bonus, sell button) is always reachable.

---

## v0.9.0 — Build 52 (July 2026)

### New
- **World 1 Legendary Fish** — 18 ultra-rare legendary fish hidden across all 6 zones (3 per zone). Each has a 1-in-50,000,000 chance per cast, catchable by manual fishing, automation, and offline progress. Catching a new species for the first time grants a permanent +1% Prestige Black Pearl bonus (up to +18% total across all 18 fish). Legendary fish sell for 10 Black Pearls each — never auto-sold, must be sold manually from the Market.
- **Golden Legendary catch popup** — a special full-screen golden popup appears on every legendary catch, showing the fish, zone, lore description, and first-discovery bonus if applicable. Automation and offline catches queue their popups and show them one-by-one.
- **Legendary Fishdex section** — each zone's mastery panel now shows legendary fish progress (X / 3) and your current Prestige Pearl bonus from legendary discoveries.

---

## v0.8.12 — Build 51 (July 2026)

### Fix
- **Auto-Seller interval corrected** — Auto-Seller now fires every 1 real hour (24 in-game hours) instead of every 3 real hours.
- **Storage-full stops automation correctly** — when storage is full, automation no longer converts excess catches into average-value coins. Catches stop until the next scheduled Auto-Seller sale frees space, matching the intended storage/spoilage design.
- **Offline simulation uses sell timeline** — offline progress is now simulated in phases between scheduled Auto-Seller events. Automation pauses at storage-full and resumes after each scheduled sale, so offline catch results are consistent with what the game would have produced in real time.

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
