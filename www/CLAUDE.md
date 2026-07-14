# CLAUDE.md — Patient Angler: Idle Fishing

## Project Overview
A 2D idle/incremental fishing **empire** game built in Unity with pixel art graphics (Stardew Valley aesthetic).
The player actively fishes to start, then builds layered automation (Nets → Fishermen → Boats → Fleets) across every zone they unlock. Active fishing and idle empire-building run side by side for the entire life of the game — see the Core Design Principle in the Prestige section: old zones never go idle, they keep producing.

**Game title:** Patient Angler: Idle Fishing
**Engine:** Unity 2D (URP)
**Graphics:** Claude Design (pixel art, Stardew Valley style)
**Target platform:** Android (Google Play), iOS later
**Developer:** Recapsa OÜ / Henly Games

### Current Design Status

The following systems are considered locked unless future balancing proves otherwise:
- Zone progression
- Rod progression
- Storage progression
- Automation progression
- Empire model
- Competition model
- Fishdex structure

Future balancing work should focus primarily on economy numbers rather than introducing new core systems.

### Long-Term Fantasy

The player begins as a lone angler with a basic rod.

Over time they build: Rod → Net → Fisherman → Boat → Fleet → Ocean Company → Abyss Expedition

The endgame fantasy is operating a large fishing empire spanning every unlocked zone in the game.

---

## What Makes This Game Successful (Design Pillars)

Based on top idle games analysis (Cookie Clicker, Idle Fishing, Hooked Inc., AFK Arena):

1. **Variable reward loop** — players never know what they'll catch (rare vs common), this is the core addiction mechanic
2. **Visible progress** — every upgrade must have immediate visible impact (e.g. Rod tiers visibly reduce taps-to-catch, not a hidden percentage)
3. **Active + Idle balance** — active play gives faster/rarer catches, idle automation (Nets/Fishermen/Boats/Fleets) keeps every owned zone earning permanently
4. **Time-of-day mechanics** — rare fish only at specific times = daily check-in motivation
5. **Competitions** — daily/monthly tournaments = retention and social hooks
6. **Collection drive** — fish encyclopedia (Fishdex) fills up = completion motivation
7. **Empire growth, not zone replacement** — unlocking a new zone never retires the old one; the player is stacking income sources, not migrating
8. **Offline rewards** — players return because every owned zone earned coins while away

---

## Core Gameplay Loop

```
Cast → Wait for bobber → Tap bobber (rod-dependent click count) → Catch fish → Sell/Store → Upgrade → Repeat
```

### Casting mechanic
- Player taps on water body
- Fishing rod animation plays, hook enters water
- Bobber floats on surface (animated)
- After random delay (based on location, bait, time of day) bobber starts moving/dipping
- Player must tap the bobber a number of times set by their current rod (see Rods table — ranges from 20 taps on Basic Rod down to 4 taps on Abyss Rod)
- If player fails tap timing → fish escapes
- Success → fish catch animation + fish revealed with rarity fanfare

### Timing window
- Easy fish: 5 second window, slow bobber movement
- Medium fish: 3 second window
- Rare/large fish: 1.5 second window, erratic movement
- Window speed scales with rod quality (better rod = more time)

### First Session Goal

The first player session should last approximately 5 minutes.

During this period the player manually fishes to learn the gameplay loop.

Target outcome:
- Catch enough fish to purchase the first Fishing Net.
- First Fishing Net cost remains 100 coins.
- First Fishing Net should be achievable within the first 5 minutes of play.

This is the player's first major progression milestone.

---

## Game Time System

- 1 real hour = 1 in-game day
- Full 24-hour in-game cycle = 24 real hours
- Game clock visible in UI always
- Time of day affects:
  - Which fish species are available
  - Fish market prices (morning rush, evening premium)
  - Competition windows

### Time periods
| In-game time | Real time | Special fish active |
|---|---|---|
| Dawn 04:00–07:00 | 4–7 AM | Dawn species (perch, trout) |
| Morning 07:00–12:00 | 7 AM–12 PM | Standard species |
| Afternoon 12:00–18:00 | 12–6 PM | Standard species, fewer rare |
| Evening 18:00–22:00 | 6–10 PM | Evening species (catfish, eel) |
| Night 22:00–04:00 | 10 PM–4 AM | Night species (pike, giant carp, rare sea creatures) |

---

## Water Bodies (Progression Zones)

Unlocked sequentially by purchasing required gear.

### 1. TIIK (Pond) — Starting zone
- Unlock: Free
- Required gear: Basic rod
- Depth: Shallow
- 30 catchable things:
  - 10x Trash: Old boot, tin can, plastic bag, glass bottle, rusty hook, broken rod, tire, rubber duck, garden glove, bicycle wheel
  - 10x Plants: Reed, lily pad, algae clump, water hyacinth, hornwort, duckweed, cattail, watercress, arrowhead plant, water mint
  - 10x Fish: Crucian carp, roach, tench, goldfish (escaped pet), small perch, stone loach, stickleback, pumpkinseed, weatherfish, common bream

### 2. JÕGI (River) — Zone 2
- Unlock: Requires River Rod + Waders (shop)
- Required gear: River Rod (150 coins), Waders (80 coins)
- Depth: Medium, current affects casting
- 30 catchable things:
  - 10x Trash: Fishing net fragment, old shoe, plastic bottle, car part, rope, styrofoam, broken glass jar, shopping bag, traffic cone (small), glove
  - 10x Plants: Water crowfoot, river weed, submerged moss, water celery, hornwort, river grass, watercress, flowering rush, mare's tail, water parsley
  - 10x Fish: Brown trout, grayling, barbel, chub, dace, river perch, pike, ide, asp, burbot

### 3. JÄRV (Lake) — Zone 3
- Unlock: Requires Lake Rod + Boat (shop)
- Required gear: Lake Rod (400 coins), Rowing Boat (250 coins)
- Depth: Medium-deep
- 30 catchable things:
  - 10x Trash: Anchor, sunken buoy, old outboard motor part, beer cans, fishing lure collection, rope coil, waterlogged suitcase, trolling weight, net fragment, bicycle
  - 10x Plants: Yellow water lily, white water lily, quillwort, Canadian waterweed, water soldier, bladderwort, floating pondweed, curly pondweed, water violet, bulrush
  - 10x Fish: Pike-perch (zander), large perch, lake trout, whitefish (siig), vendace (mudamaimuk), eel, large pike, tench, carp, catfish (European)

### 4. LAHT (Bay) — Zone 4
- Unlock: Requires Sea Rod + Speedboat
- Required gear: Sea Rod (900 coins), Speedboat (600 coins)
- Depth: Medium-deep, tidal effects
- 30 catchable things:
  - 10x Trash: Lobster trap, lost anchor chain, old crab pot, oil drum, sunken buoy, shipping rope, lost propeller, diver's fin, rubber seal decoy, tangled net
  - 10x Plants: Bladderwrack (põisadru), sea lettuce, kelp frond, eelgrass, coralline algae, gut weed, sea grass, rockweed, Irish moss, dulse
  - 10x Fish: Baltic herring (räim), flounder, garfish, sea trout, seabass, mackerel, smelt (tint), sprat, viviparous blenny, turbot

### 5. MERI (Sea) — Zone 5
- Unlock: Requires Deep Sea Rod + Fishing Vessel
- Required gear: Deep Sea Rod (2500 coins), Fishing Vessel (2000 coins)
- Depth: Deep, weather system affects catches
- 30 catchable things:
  - 10x Trash: Sunken chest (empty), old naval mine (safe), ship's bell, anchor, depth charge casing, submarine periscope piece, sailor's boot, old lantern, ship wheel, naval flag
  - 10x Plants: Giant kelp, sea oak, sea belt, furbelows, oarweed, dabberlocks, sugar kelp, sea thong, bootlace weed, pepper dulse
  - 10x Fish: Cod, salmon, halibut, wolffish, lumpsucker, capelin, Atlantic herring, redfish, haddock, Atlantic mackerel

### 6. OOKEAN (Ocean) — Zone 6 (endgame)
- Unlock: Requires Ocean Gear set + Research Vessel
- Required gear: Ocean Rod (8000 coins), Research Vessel (7000 coins)
- Depth: Extreme, day/night cycle most impactful
- 30 catchable things:
  - 10x Trash: Sunken aircraft part, deep sea pressure gauge, lost submarine, ancient amphora, black box, diving bell piece, whale bones, deep sea mining equipment, lost satellite, submarine cable
  - 10x Plants: Deep sea coral, black smoker vent algae, midnight zone kelp, bioluminescent algae, abyssal sea grass, giant tube worm cluster, vent bacteria mat, sea pen, sea fan, carnivorous sponge
  - 10x Fish: Tuna, swordfish, marlin, mahi-mahi, giant squid, oarfish (rare), coelacanth (ultra rare), anglerfish, giant manta ray, whale shark (legendary)

---

## Fish Rarity System

| Rarity | Colour | Catch rate | Base value multiplier |
|---|---|---|---|
| Common | Grey | 60% | 1x |
| Uncommon | Green | 25% | 3x |
| Rare | Blue | 10% | 8x |
| Epic | Purple | 4% | 20x |
| Legendary | Gold | 1% | 60x |

Rarity is per-fish species (each fish has a fixed rarity tier) + influenced by bait, rod, and time of day.

---

## Loot Table & Pricing

### Catch probability per zone (example: Tiik)
| Category | Probability | Examples |
|---|---|---|
| Trash | 30% | Boot, tin can, plastic bag etc |
| Plants | 20% | Reed, lily pad, algae etc |
| Common fish | 35% | Crucian carp, roach, bream |
| Uncommon fish | 10% | Tench, stone loach, stickleback |
| Rare fish | 4% | Weatherfish, pumpkinseed |
| Epic fish | 1% | Giant crucian carp |

Probability shifts with: Premium Bait active (+100% chance on non-common rarities for its duration), time of day, rod quality. Each subsequent zone has slightly lower trash/plant % and higher rare/epic %.

### Base prices & demand multipliers
| Rarity | Base price | Low (0.5x) | Normal (1x) | High (1.5x) | Surge (2.5x) |
|---|---|---|---|---|---|
| Trash | 1c | 1c | 1c | 1c | 1c |
| Common | 5–15c | 3–8c | 5–15c | 8–23c | 13–38c |
| Uncommon | 20–50c | 10–25c | 20–50c | 30–75c | 50–125c |
| Rare | 80–200c | 40–100c | 80–200c | 120–300c | 200–500c |
| Epic | 400–800c | 200–400c | 400–800c | 600–1200c | 1000–2000c |
| Legendary | 2000–5000c | 1000–2500c | 2000–5000c | 3000–7500c | 5000–12500c |

### Fish Size System
Every caught fish gets a random size class at the moment of catch, affecting sell price.

| Size | Probability | Price multiplier |
|---|---|---|
| Tiny | 20% | 0.5x |
| Small | 30% | 0.8x |
| Medium | 30% | 1x (base) |
| Large | 15% | 1.5x |
| Trophy | 5% | 3x |

**Trophy fish special behaviour:**
- Unique catch fanfare animation
- Automatically recorded in Fishdex as record weight
- Share button appears (screenshot sharing)
- Counts for competition leaderboard size ranking

**Rod quality shifts size probability:**
- Basic Rod: default table above
- Carbon Fiber Rod: Trophy 10%, Large 25%, Medium 30%, Small 25%, Tiny 10%

**Example prices with size + demand:**
- Common fish (10c base) Trophy + Surge = 10c × 3x × 2.5x = 75c
- Epic fish (600c base) Trophy + Surge = 600c × 3x × 2.5x = 4500c — memorable moment!


- Common fish at Surge (2.5x) = 38c — better than Uncommon at Low (10c)
- Epic fish at Surge = up to 2000c — memorable moment for player
- Watching demand trends is genuinely important, not just cosmetic
- Trash always 1c — never worth storing, auto-sells immediately

---

## Fish Market & Economy

### Dynamic pricing — core strategy mechanic
- Each fish species has a base price
- Demand changes every in-game day (every real hour) — player must strategically decide WHEN to sell
- Demand levels shown clearly in market UI with trend arrows (rising/falling):
  - 💀 Collapsed (0.1x) — market flooded, almost worthless
  - 📉 Low (0.5x) — poor time to sell
  - ➡️ Normal (1x) — baseline price
  - 📈 High (1.5x) — good time to sell
  - 🔥 Surge (2.5x) — sell now!
- Demand is **visible to the player at all times** in the market screen
- Each fish species cycles through demand states independently
- Trend indicator shows if price is rising or falling (player can anticipate)
- Special events cause price spikes (e.g. "Restaurant Week" = all fish 2x for 2 real hours)

### Spoilage = core tension mechanic
- Caught fish expire after **12 real hours** by default
- **Expired fish CANNOT be sold** — they are lost completely
- This creates constant strategic tension: sell now at low price, or wait for surge and risk spoilage?
- Spoilage timer visible on each fish in storage (countdown clock icon)
- Better cooling equipment extends shelf life — giving player more time to wait for good prices
- Spoilage is the PRIMARY reason to upgrade cooling equipment

### Spoilage states
| State | Time remaining | Visual | Sell value |
|---|---|---|---|
| Fresh | >75% time left | Green glow | 100% |
| Good | 50–75% | No indicator | 100% |
| Aging | 25–50% | Yellow tint | 100% |
| Near expiry | <25% | Red flashing | 100% |
| Expired | 0 | Grey, smell icon | 0 — cannot sell |

### Player strategy examples
- Catch pike at night → pike demand Low → wait in fridge → next day pike demand Surges → sell at 2.5x
- Catch 10 trout → fridge almost full → demand still Low → must decide: sell at loss or discard oldest to make room?
- Surge event announced 30 min in advance via notification → player rushes to catch more of that species

### Trash economy
- All trash items sell for flat 1 coin each immediately on catch (auto-sell, no storage)
- No demand fluctuation for trash

### Plants
- Plants have 0 coin value by default
- Late-game unlock: Herbalist NPC buys rare plants for coins

---

## Equipment Shop

### Rods
| Rod | Clicks Required | Cost | Zone unlocked |
|---|---|---|---|
| Basic Rod | 20 | Free | Pond |
| River Rod | 18 | 9,000c | River |
| Lake Rod | 16 | 90,000c | Lake |
| Bay Rod | 14 | 900,000c | Bay |
| Sea Rod | 12 | 25,000,000c | Sea |
| Ocean Rod | 10 | 250,000,000c | Ocean |
| Carbon Rod | 8 | 200,000,000c | All (post-game) |
| Mythic Rod | 6 | 500,000,000c | Abyss |
| Abyss Rod | 4 | 1,500,000,000c | Abyss (endgame) |

Clicks Required replaces the old catch-speed/rarity-chance percentage bonuses — each rod tier directly and visibly reduces how many taps are needed to land a catch, making progression immediately felt by the player rather than hidden in a percentage.

All gameplay power progression is purchased with Coins. Diamonds are reserved for Prestige systems, Premium Bait and cosmetic purchases. This keeps the game non-pay-to-win.

### Premium Bait
| Item | Currency | Effect | Duration |
|---|---|---|---|
| Premium Bait | Diamonds | +100% chance on non-common rarities | 30 min |

Premium Bait increases rarity chances by 100% for 30 minutes.

### Premium Bait Example

Base rarity table:
- Common 60%
- Uncommon 25%
- Rare 10%
- Epic 4%
- Legendary 1%

Premium Bait doubles the weight of all non-common rarity rolls.

Example adjusted result:
- Common ≈ 43%
- Uncommon ≈ 36%
- Rare ≈ 14%
- Epic ≈ 6%
- Legendary ≈ 1.5%

Exact values may be tuned during balancing.

Important: Premium Bait improves expected value. Premium Bait does NOT guarantee higher rarity catches.

Premium Bait doubles the chance of all non-common rarity rolls while proportionally reducing Common probability. Premium Bait increases expected value significantly but does not guarantee rarity upgrades. This is the only bait item in the game — no consumable per-cast lures. Diamonds are earned through Abyss prestige, competitions, quests, or purchased via IAP (see Premium Bait IAP packs in Monetisation).

### Bobbers
| Bobber | Cost | Effect |
|---|---|---|
| Basic Bobber | Free | Standard |
| Sensitive Bobber | 150c | +1 second tap window |
| Heavy Bobber | 400c | Fewer false bobs |
| Electronic Bobber | 1200c | Alerts player (vibration) when fish bites |

### Automation — Fishing Nets
| Automation | Cost | Production |
|---|---|---|
| Fishing Net | 100c | 1 catch / 60 sec |
| Reinforced Net | 3000c | 1 catch / 45 sec |
| River Net | 15000c | 1 catch / 30 sec |

### Automation — Fishermen
| Fisherman | Cost | Production |
|---|---|---|
| Local Fisher | 3000c | 1 catch / 30 sec |
| Skilled Fisher | 30000c | 1 catch / 15 sec |
| Veteran Fisher | 300000c | 1 catch / 8 sec |

### Automation — Boats
| Boat | Cost | Production |
|---|---|---|
| Row Boat | 30000c | 1 catch / 8 sec |
| Motor Boat | 300000c | 1 catch / 3 sec |
| Fishing Boat | 3000000c | 1 catch / 1.5 sec |

### Automation — Fleets
| Fleet | Cost | Production |
|---|---|---|
| Small Fleet | 5000000c | 2 catches / sec |
| Large Fleet | 50000000c | 4 catches / sec |
| Deep Sea Fleet | 500000000c | 10 catches / sec |

Each automation tier (Nets, Fishermen, Boats, Fleets) is purchased per zone — a player can own a Fishing Net in the Pond AND a Row Boat in the Lake simultaneously.

Automation can catch:
- Common
- Uncommon
- Rare
- Epic

Legendary fish require active fishing. Mythic fish are Abyss-exclusive and always require active fishing. Legendary catches should remain exciting player moments and competition relevant.

See the core design principle below: old zones never stop producing once automated.

### Storage & Cooling
| Storage | Cost | Capacity | Shelf Life |
|---|---|---|---|
| Bucket | Free | 5 | 12h |
| Ice Box | 200c | 20 | 13h |
| Cooler Box | 600c | 50 | 18h |
| Portable Fridge | 2000c | 150 | 24h |
| Chest Freezer | 10000c | 500 | 48h |
| Walk-in Freezer | 50000c | 2000 | 72h |
| Harbor Cold Storage | 250000c | 10000 | 7 days |

Storage determines:
- Maximum fish inventory.
- Maximum offline production before overflow.
- Maximum spoilage duration.

If storage reaches capacity:
- New fish cannot be stored.
- Automation pauses until space becomes available.

Storage upgrades are a critical progression path and are intended to scale alongside automation growth.

### Storage Design Rule

Storage is the only system that controls:
- Fish capacity
- Fish spoilage duration
- Maximum offline production before overflow

No other equipment affects spoilage duration. The Storage table is the single source of truth.

### Transport (zone access — one-time purchase, separate from Automation Boats above)
| Vehicle | Cost | Unlocks zone |
|---|---|---|
| Waders | 6,000c | River |
| Rowing Boat | 60,000c | Lake |
| Speedboat | 600,000c | Bay |
| Fishing Vessel | 20,000,000c | Sea |
| Research Vessel | 200,000,000c | Ocean |

Transport vehicles are required once to physically access a new zone — they are not idle-production assets. They are distinct from the Automation — Boats tier (Row Boat, Motor Boat, Fishing Boat) listed earlier, which are repeatable idle-income purchases per zone. Transport unlocks the zone; Automation Boats produce fish within an already-unlocked zone. The Bay transport vehicle is named Speedboat (not Motor Boat) specifically to avoid confusion with the Automation Boats tier.

---

## Daily Fishing Competition

### Schedule
- **2 competitions per day:**
  - European session: **18:00–19:00 CET** (Central European Time)
  - American session: **18:00–19:00 CST** (Central Standard Time)
- Duration: 1 real hour
- Player opts in manually via competition button in UI

### How it works
- Each day a random water body is selected as competition zone
- Players compete to catch the **largest single fish** (Trophy size wins)
- Special competition-only fish can appear (slightly higher Trophy rate)
- No nets allowed during competition — active fishing only
- Player must own the required gear for that zone to participate

### Leaderboard & Rewards
| Place | Coin reward |
|---|---|
| 1st | 500c |
| 2nd | 300c |
| 3rd | 200c |
| 5th | 100c |
| 10th | 75c |
| 15th | 50c |
| 25th | 30c |
| 50th | 15c |

### Hall of Fame
- Winner's name displayed on a **small cottage/cabin** on the water body shore
- Tapping the cottage opens that water body's Hall of Fame
- Hall of Fame shows: player name, fish species, size, date caught
- **Resets every quarter** (Jan 1, Apr 1, Jul 1, Oct 1) — no reward on reset, prestige only
- Winning grants permanent **avatar + title** for that water body:

| Zone | Title |
|---|---|
| Tiik | Master Angler of the Pond |
| Jõgi | Master Angler of the River |
| Järv | Master Angler of the Lake |
| Laht | Master Angler of the Bay |
| Meri | Master Angler of the Sea |
| Ookean | Master Angler of the Ocean |
| Sügavik | Master Angler of the Abyss |

- Player can display one active title + avatar in their profile
- Multiple titles collectible over time

---

## Time-Specific Fish (examples)

| Fish | Zone | Time window | Rarity |
|---|---|---|---|
| Dawn Trout | River | 04:00–07:00 | Rare |
| Morning Perch | Pond | 07:00–10:00 | Uncommon |
| Afternoon Roach | Pond | 12:00–15:00 | Common |
| Evening Catfish | Lake | 18:00–22:00 | Uncommon |
| Night Pike | Lake | 22:00–02:00 | Rare |
| Midnight Eel | River | 00:00–03:00 | Epic |
| Pre-dawn Zander | Lake | 03:00–05:00 | Rare |
| Anglerfish | Ocean | 22:00–04:00 | Epic |
| Giant Squid | Ocean | 00:00–02:00 | Legendary |
| Coelacanth | Ocean | 01:00–03:00 | Legendary |

---

## Fish Encyclopedia (Fishdex)

- Every unique fish, plant, and trash item has an entry
- Entry unlocked on first catch
- Shows: species info, best time to catch, rarity, max size caught, value
- Completion rewards: cosmetics, coin bonuses, special rods
- Total entries: 6 zones × 30 items = 180 entries

---

## Prestige & Long-term Progression

### Aastaaegade süsteem (Seasons)
- Iga 3 kuud reaalajas vahetub hooaeg: Kevad → Suvi → Sügis → Talv
- Iga hooaeg toob:
  - 5–10 uut hooajalist kalaliiki (kättesaadavad ainult selle hooaja jooksul)
  - Muutuvad turuhinnad (nt talvel ahven kallis, suvel makrell odav)
  - Hooajaline võistlus edetabeliga — top 10 saavad eksklusiivse cosmetic (õnge skin, paat skin)
  - Uued hooajalised ülesanded (quest chain)
- Hooajalised kalad lisatakse Fishdexis eraldi sektsioonina
- Motiveerib mängijaid igal hooajal tagasi tulema

### Sügavik (The Abyss) — Prestige süsteem
Pärast ookeani kõigi kalade püüdmist (100% Ocean Fishdex) avaneb **Sügavik**.

**Kontseptsioon:**
Mängija laskub sügavikku — eraldi progressioon mis toimub paralleelselt tavamänguga. Sügavik on pime, müstiline, bioluminestseeruv maailm täiesti uute olenditega.

**Kuidas töötab:**
- Sügaviku jaoks kasutatakse mängu peamist prestiiž-valuutat: **Diamonds** (ei sega tavamängu münte — sama valuuta mida kasutatakse Premium Bait ja kosmeetika ostmiseks; Mythic/Abyss Rod ostetakse Coins'idega, vaata Rods tabel)
- Sügaviku kalad ei roiska (külm temperatuur) — aga neid saab ainult Sügaviku poes müüa
- Sügaviku poes saab osta permanentseid boonuseid mis mõjutavad KOGU mängu (nt +10% kõigi kalade väärtus)
- Iga Sügaviku "kiht" on sügavam ja keerulisem — 10 kihti kokku
- Iga kiht resetib Sügaviku progressi aga annab permanentse Diamond multiplieri

**Sügaviku kalad (näited):**
| Kiht | Olend | Rarity | Eripära |
|---|---|---|---|
| 1–2 | Hiiglaslik angerjas | Epic | Ainult südaöö |
| 3–4 | Hõbedane heeringas | Rare | Bioluminestseeruv |
| 5–6 | Vampiirkalmaar | Epic | Liigub kiiresti, raske püüda |
| 7–8 | Hiiglaslik merikurat | Legendary | Ainult teatud ilmaga |
| 9 | Kristallkala | Legendary | Ultra haruldane |
| 10 | Sügaviku Koletis | Mythic | Lõpuboss, üks püük per reset |

**Sügaviku eripära mehaanikad:**
- Nähtavus piiratud — mängija näeb ainult lühikest vahemaa vees
- Bioluminestseeruvad kalad annavad valgust (visuaalne efekt)
- Erinevad lanted ja õnged vajalikud (Sügaviku pood)
- Sügavamal on suurem oht kaotada püük täielikult (õng katkeb)

**Permanentsed boonused Sügaviku poes:**
- +5/10/15/20% kõigi kalade müügihind
- +10% haruldaste kalade ilmumine
- +2h säilimisaeg kõigile kaladele
- Uus veekogude slot (saad korraga mitmes veekogus võrke pidada)

### Core Design Principle — Building an Empire, Not Moving Through Maps

**Old zones never become obsolete.** When a player unlocks a new zone, all previous zones continue producing fish through nets, fishermen, and boats. The player is building a fishing empire, not simply moving from one map to another.

This single principle drives every automation and progression decision in this document: the Pond a player started in on day one is still earning them coins via its Fishing Net or Row Boat months later, even while they actively fish the Abyss. Zones stack — they do not replace each other.

### Zone-Based Automation

Every automation asset belongs to a specific zone.

Example:

Pond:
- 3 Fishing Nets
- 1 Fisherman

River:
- 2 Fishing Nets
- 1 Row Boat

Lake:
- 1 Motor Boat

All automation assets operate simultaneously.

Unlocking a new zone never disables automation in older zones.

Players are building a fishing empire across all water bodies.

### Progression Timeline
| Time Played | Expected Progress |
|---|---|
| 5 min | First Net |
| 1–2 weeks | Multiple Nets + first Fisherman |
| 1–2 months | First Boat |
| 3–4 months | First Fleet |
| 6–8 months | Ocean Company |
| 9–12 months | Abyss Expedition |
| 12+ months | Fishing Empire |

These timelines assume a F2P player watching rewarded ads but making no coin purchases. Paying players or very active players will progress faster.

### Intended Progression Pace
| Zone | F2P (ads only) | Active buyer |
|---|---|---|
| Pond | 1–2 weeks | 3–5 days |
| River | 2–4 weeks | 1–2 weeks |
| Lake | 1–2 months | 2–4 weeks |
| Bay | 2–3 months | 1–2 months |
| Sea | 4–6 months | 2–3 months |
| Ocean | 8 months | 4–5 months |
| Abyss | 10+ months | 6+ months |

Design goal: a F2P player who watches ads (but spends no real money) should reach Ocean in approximately **8 months**. Active players who purchase coin bundles should reach Ocean in 4–5 months.

### Economy Balance Goal

The game should never allow a F2P player to skip multiple zones in a single week through normal play.

Target pacing (F2P, ads only):
- Pond = 1–2 weeks
- River = 2–4 weeks
- Lake = 1–2 months
- Bay = 2–3 months
- Sea = 4–6 months
- Ocean = 8 months
- Abyss = 10+ months

Automation should accelerate progress gradually but never invalidate active gameplay. The game should feel like a growing fishing empire, not a rapidly completed idle clicker.

**Key constraints enforced in code:**
- Automation rates are significantly slower than active fishing — automation supplements income, not replaces it
- High-tier automation (Boats, Fleets) costs dramatically more than low-tier to prevent fast snowballing
- Sea and Ocean zone unlock costs are intentionally steep (Sea: 45M total, Ocean: 450M total)

---

## Quests & Achievements

### Core principle
- **Quests & Achievements** → rewards are coins + cosmetics only (rod skins, bobber skins, lure skins, UI themes)
- **Gear & progression** → purchased from shop with coins only
- **IAP** → cosmetics + coin bundles
- Never give functional gear as quest reward — keeps economy clean and monetisation fair

### Daily Quests (3 random per day, reset at midnight)

| Quest | Goal | Reward |
|---|---|---|
| Morning Catch | Catch 10 fish | 20c |
| Market Day | Sell 5 fish | 15c |
| Lucky Cast | Catch 1 Rare fish | 50c |
| Pond Cleaner | Catch 5 trash items | 10c |
| Surge Seller | Sell any fish during Surge demand | 30c |
| Variety Fisher | Catch 3 different species | 25c |
| Dawn Fisher | Catch fish between 04:00–07:00 | 35c + Dawn bobber skin |
| Full House | Fill storage to capacity | 20c |

### Weekly Quests (1 active per week, reset Monday)

| Quest | Goal | Reward |
|---|---|---|
| Pond Master | Catch 100 fish from pond | 200c |
| Trash Collector | Catch 50 trash items | 150c + Rusty bucket skin |
| Patient Fisher | Catch fish 7 days in a row | 300c + Wooden rod skin |
| Market Mogul | Sell fish worth 500c total | 250c + Gold bobber skin |
| Full Fishdex | Catch all 10 pond fish species | 500c + Pond Master title |

### Achievements (permanent, one-time unlock)

| Achievement | Condition | Reward |
|---|---|---|
| First Cast | Catch your first fish | 10c |
| Lucky Day | Catch an Epic fish | 100c + Epic glow rod skin |
| Hoarder | Fill storage 3 times | 50c |
| Night Owl | Catch fish at midnight (00:00–01:00) | 75c + Moon bobber skin |
| Trash King | Catch 100 trash items total | 80c + Rusty hook bobber skin |
| Pond Complete | Catch all 30 pond items | 500c + Pond Explorer title |
| Surge Seller | Sell during Surge 5 times | 100c + Gold coin purse skin |
| Speed Fisher | Catch 20 fish in 1 real hour | 150c + Lightning rod skin |
| Early Bird | Catch fish at dawn 5 days in a row | 200c + Sunrise lure skin |
| Patient Angler | Play for 7 consecutive days | 300c + Veteran badge |

---

## Monetisation (ethical, non-pay-to-win)

### Future Feature Notice

Season Pass values are placeholder content. Season Pass balancing is intentionally excluded from current economy balancing. The core economy must first be balanced around:
- Fishing
- Storage
- Market
- Automation
- Competitions
- Abyss

before Season Pass rewards are finalized.

### Rewarded Ads
- **Bite Speed Boost**: available every 30 minutes — watch ad → +25% fish bite speed for 30 minutes. Visual indicator: glowing bobber + countdown timer
- **Special Catch**: available every 10 minutes — watch ad → next catch is guaranteed Rare or higher. If player ignores/declines, offer disappears and normal loot table resumes. No pressure, no popup — player taps the offer voluntarily

### Remove Ads — 16.99€ (one-time purchase in shop)
- Removes all ads permanently
- +25% fish bite speed permanently (no cooldown)
- Special Catch guaranteed Rare+ triggers automatically every 10 minutes without watching ad

### IAP (In-App Purchases)
- **Cosmetic only**: rod skins, boat skins, bobber skins, UI themes
- **Coin bundles**: for players who want faster progression
- **Premium Bait packs** — +100% chance on non-common rarities for 30 min, currency is Diamonds:
  - Single — 2.99€ (5 Diamonds, 1 boost)
  - Pack of 5 — 9.99€ (25 Diamonds, 5 boosts)
  - Pack of 15 — 24.99€ (75 Diamonds, 15 boosts)
- Note: Premium Bait improves rarity odds but does not guarantee rare catches. Competition success still depends on fish size, timing, active play and luck.

### Season Pass — 9.99€/month
Season Journey style pass — 30 levels, resets monthly. XP earned from: catching fish, selling, daily quests, competition participation, automation milestones.

| Level | Free | Premium |
|---|---|---|
| 1 | 10c | 50c |
| 2 | 2 Diamonds | 10 Diamonds |
| 3 | 20c | 100c |
| 4 | 1 Diamond | 5 Diamonds |
| 5 | 30c | 150c + exclusive bobber skin |
| 6 | 2 Diamonds | 10 Diamonds |
| 7 | 40c | 200c |
| 8 | 3 Diamonds | 15 Diamonds |
| 9 | 50c | 250c |
| 10 | 2 Diamonds | 10 Diamonds + exclusive lure skin |
| 11 | 60c | 300c |
| 12 | 3 Diamonds | 15 Diamonds |
| 13 | 70c | 350c |
| 14 | 1 Diamond | 5 Diamonds |
| 15 | 80c | 400c + exclusive rod skin |
| 16 | 3 Diamonds | 15 Diamonds |
| 17 | 90c | 450c |
| 18 | 2 Diamonds | 10 Diamonds |
| 19 | 100c | 500c |
| 20 | 2 Diamonds | 10 Diamonds + exclusive bobber skin |
| 21 | 110c | 550c |
| 22 | 3 Diamonds | 15 Diamonds |
| 23 | 120c | 600c |
| 24 | 2 Diamonds | 10 Diamonds |
| 25 | 130c | 650c + exclusive boat skin |
| 26 | 3 Diamonds | 15 Diamonds |
| 27 | 140c | 700c |
| 28 | 2 Diamonds | 10 Diamonds |
| 29 | 150c | 750c |
| 30 | 200c + rod skin | 1000c + animated rod skin + title "Season X Champion" |

**Total rewards:**
- Free: ~1200c + ~28 Diamonds + basic cosmetics
- Premium: ~6000c + ~140 Diamonds + exclusive animated cosmetics + title

### Monetisation principles
- Player feels in control — ads are a choice, never forced
- "Remove ads" is a fair deal — player gets permanent bonus as replacement
- Cosmetic sales never affect game balance

---

## Push Notifications

All notifications individually toggleable in Settings — player has full control.

| Notification | Trigger | Message example |
|---|---|---|
| Competition starting | 15 min before competition | "🎣 Competition starts in 15 minutes at the Lake!" |
| Fish spoiling soon | When fish has <25% shelf life remaining | "⚠️ Your pike is about to spoil — sell it now!" |
| Bite speed boost ending | 5 min before boost expires | "⏱️ Your fishing boost ends in 5 minutes!" |
| New ad available | When 30min cooldown resets | "🎬 Free bite speed boost available — watch now!" |

### Settings UI
- Notifications master toggle (on/off all)
- Individual toggles for each notification type
- No notification sent if master toggle is off
- Notifications respect device Do Not Disturb settings

### Technical notes
- Use Firebase Cloud Messaging (FCM) for Android
- Server triggers spoilage notifications based on player's fish expiry timestamps
- Competition notifications sent from server at fixed CET/CST times
- Boost expiry notification scheduled locally on device at boost start

### Main screen layout
- Water body background (animated: ripples, fish shadows, weather)
- Rod/bobber visible when fishing
- Bottom bar: Coin count | Storage indicator | Current time | Market button
- Top bar: Zone name | Fish caught today | Competition timer
- Side button: Shop | Fishdex | Settings

### Key screens
- **Water body**: Main gameplay, tap to cast
- **Shop**: Tab layout — Rods | Bait | Bobbers | Nets | Storage | Boats
- **Market**: Fish in storage, prices shown, sell individually or all
- **Fishdex**: Grid of all 180 entries, locked = silhouette
- **Competition**: Leaderboard, timer, current zone rules
- **Settings**: Sound, notifications, time zone

---

## Art Style Guidelines (for Claude Design)

- **Style**: Pixel art, 16x16 or 32x32 base sprites
- **Palette**: Warm, earthy tones like Stardew Valley
- **Water**: Animated pixel ripples, fish shadows visible below surface
- **Fish**: Side-view sprites, each species unique and recognisable
- **UI**: Wooden frame aesthetic, parchment-style menus
- **Time of day**: Sky color and lighting changes with in-game time (dawn orange, midday blue, night dark purple)
- **Weather**: Rain, fog, clear — affects visuals and some fish catch rates

### UI Font Specification
- **Font**: Pixeloid Sans Bold — file must be placed at `Assets/Fonts/PixeloidSans-Bold.ttf`
  - Free download: itch.io → search "PixeloidSans" by GGBotNet
  - SceneBuilder falls back to Unity LegacyRuntime.ttf if file is missing
- **Color**: White `#FFFFFF`
- **Outline**: Black, 8-direction via Unity `Outline` component, `effectDistance (2, -2)`
- **Font sizes** (after 25% reduction from original):

| Element | Size |
|---|---|
| Zone name | 30 |
| Clock / time | 28 |
| Coin counter | 36 |
| Storage counter | 36 |
| Status message | 28 |
| Prompt ("Tap to cast") | 34 |
| Panel info text | 22–26 |
| Buttons (default) | 24 |
| Shop tab buttons | 18 |
| List row labels | 22 |
| Sell buttons | 20 |
| Fishdex headers | 28 |
| Fishdex entries | 22 |

### HUD Counter Icons
- **Coin counter**: `[coin_icon.png] [amount]c` — left side of top bar
- **Storage counter**: `[fish_counter_icon.png] [count/max]` — right side of top bar
- Source spritesheet: `Assets/Resources/Sprites/Icons/coin_fish_counter.png`
- SceneBuilder auto-splits spritesheet on first Build → generates `coin_icon.png` + `fish_counter_icon.png` with transparent background

---

## Technical Architecture (Unity)

### Multiplayer & Server
- **Server:** Railway (sama nagu Tile Royale)
- **Backend framework:** Node.js + Express või Colyseus (kuna Tile Royale kogemus olemas)
- **Database:** PostgreSQL (Railway pakub seda natively)
- All game-critical data validated server-side — client never trusted:
  - Fish catches (loot table rolled server-side)
  - Coin transactions (buy/sell)
  - Competition results (leaderboard)
  - Premium Bait usage
  - Season Pass progress
  - Hall of Fame entries

### Google Account Backup
- Mängija logib sisse Google kontoga (Google Play Games Services)
- Kõik mänguandmed seotud Google ID-ga serveris
- Kui mängija vahetab telefoni → logib Google kontoga sisse → kõik andmed taastuvad
- Lokaalne cache kiiruse jaoks, aga server on alati autoriteet

### Anti-cheat põhimõtted
- Loot table arvutatakse serveris — klient saab ainult tulemuse
- Coin balance muudetakse ainult serveri kaudu
- Competition kala suurus valideeritakse serveris
- IAP receipt valideeritakse Google Play / App Store serveritega enne mündi lisamist
- Suspicious activity logging (nt liiga palju püüke minutis)

### Scene structure
```
- MainScene
  - WaterBody (background + animation)
  - FishingController (cast, bobber, catch logic — result from server)
  - UIManager
  - TimeManager (in-game clock, synced with server)
  - MarketManager (prices from server)
  - StorageManager (fish inventory, synced)
  - CompetitionManager (leaderboard from server)
  - NetworkManager (Railway connection)
  - AuthManager (Google Play Games Services)
  - SaveManager (local cache + server sync)
```

### Save & Sync system
- Auto-sync every 5 minutes to server
- Sync on app background/close
- On launch: load from server, fall back to local cache if offline
- Conflict resolution: server always wins
- Offline mode: limited functionality, no competitions, catches queued for sync

### Data files
- `fish_database.json` — all 180 catchable items with stats
- `market_prices.json` — base prices and demand rules
- `equipment_shop.json` — all purchasable items
- `competition_schedule.json` — daily rotation

---

## Development Phases

### Phase 1 — Core loop (MVP)
- [x] Pond zone only
- [x] Cast → bobber → tap 20x → catch
- [x] Basic fish database (10 fish)
- [x] Simple market (fixed prices)
- [x] Basic shop (3 rods, ice box)
- [x] Coin economy working
- [x] Save/load

### Phase 2 — Content expansion
- [x] All 6 zones
- [x] Full fish database (180 entries)
- [x] Dynamic market prices
- [x] Full shop (rods, premium bait, bobbers, storage, transport, automation tabs)
- [x] Fishdex UI
- [x] Time of day system
- [x] Season system (Spring/Summer/Autumn/Winter)

### Phase 3 — Retention features
- [x] Daily competition + Hall of Fame
- [x] Nets (idle automation)
- [x] Spoilage system
- [x] Offline progress (SaveManager with local cache + server sync)
- [x] Quests system (daily + weekly)
- [x] Abyss prestige system

### Phase 4 — Polish & monetisation
- [x] UI icon sprites (coin counter, fish counter, all nav buttons)
- [x] Pixel font (Pixeloid Sans Bold) + white text + black outline
- [ ] Animations and particle effects
- [ ] Sound design
- [ ] IAP integration (IAPManager stub exists)
- [ ] Notifications (NotificationManager stub exists)
- [ ] Ads (AdManager stub exists)
- [ ] Google Play Games Services login

### Phase 5 — Fishing Empire systems (NEW, supersedes old Nets-only automation)
- [ ] Diamond currency (separate from coins, server-validated)
- [ ] Premium Bait system (+100% chance on non-common rarities, 30 min, Diamond cost)
- [ ] Fishermen tier (Local/Skilled/Veteran) per zone
- [ ] Boats automation tier (Row/Motor/Fishing Boat) per zone — distinct from Transport vehicles
- [ ] Fleets automation tier (Small/Large/Deep Sea Fleet) per zone
- [ ] Multi-zone simultaneous production — verify old zones keep producing after new zone unlocked
- [ ] Rod click-count system (NetManager/CatchResolver updated from % bonuses to required-taps-per-rod)
- [ ] Remove all old consumable bait code (Worm/Corn/Artificial Lure/Live Bait/Glowing Lure/Master Lure)

---

## Notes for Claude Code

### Token efficiency — CRITICAL
- **Modular architecture** — iga süsteem eraldi failis, Claude Code töötab ühe failiga korraga
- **Small focused files** — max ~200 rida failis, pikemad failid jagada osadeks
- **Clear file naming** — `FishingController.cs`, `MarketManager.cs`, `CompetitionManager.cs` — Claude teab kohe mis failis mis on
- **ScriptableObjects kõige data jaoks** — muudatused andmetes ei nõua koodi muutmist
- **No hardcoded values** — kõik numbrid konstantides või ScriptableObjectides, mitte koodis
- **Interfaces over inheritance** — lihtsam refaktoreerida ilma suuri faile puutumata
- **Self-documenting code** — selged muutujate nimed, minimaalselt kommentaare (kommentaarid kulutavad tokeneid)
- **Single responsibility** — iga klass teeb üht asja, ei rohkem
- **Prefabs data-driven** — uue kala lisamine = uus ScriptableObject, mitte koodimuutus

### File structure (actual current state)
```
Assets/
  Editor/
    SceneBuilder.cs       ← builds full scene via Patient Angler → Build MVP Scene
    SmokeTest.cs
  Fonts/
    PixeloidSans-Bold.ttf ← MUST BE MANUALLY ADDED (download from itch.io)
  Prefabs/
    FishRow.prefab
    FishdexHeader.prefab
    FishdexEntry.prefab
  Resources/
    Data/
      Zones/
        pond.json / river.json / lake.json / bay.json / sea.json / ocean.json
      equipment_shop.json
    Sprites/
      Fish/               ← individual fish sprites (PNG)
      Icons/
        coin_fish_counter.png  ← source spritesheet (coin + fish icons)
        coin_icon.png          ← auto-generated by SceneBuilder
        fish_counter_icon.png  ← auto-generated by SceneBuilder
        zones.png / market.png / shop.png / fishdex.png
        competition.png / settings.png / quests.png
        hallOfFame.png / abyss.png
      Zones/              ← zone background sprites
  Scenes/
    MainScene.unity       ← built by SceneBuilder
  Scripts/
    Abyss/        AbyssData.cs, AbyssManager.cs
    Ads/          AdManager.cs
    Audio/        AudioManager.cs
    Competition/  CompetitionManager.cs, HallOfFameManager.cs
    Core/         GameManager.cs, SaveManager.cs, TimeManager.cs, ZoneManager.cs
    Data/         FishData.cs, FishSpriteDatabase.cs, ZoneDatabase.cs,
                  ZoneInfo.cs, EquipmentData.cs, EquipmentDatabase.cs, SeasonalFishData.cs
    Economy/      CoinManager.cs, DiamondManager.cs, FishdexManager.cs, MarketManager.cs, StorageManager.cs
    Fishing/      BobberController.cs, CatchResolver.cs, CatchResult.cs,
                  FishingController.cs, NetManager.cs, FishermanManager.cs, BoatManager.cs,
                  FleetManager.cs, PondInputController.cs
    IAP/          IAPManager.cs
    Notifications/ NotificationManager.cs
    Quests/       QuestManager.cs
    Seasons/      SeasonManager.cs
    Shop/         ShopManager.cs
    UI/           UIManager.cs, FishingHud.cs, MarketUI.cs, ShopUI.cs,
                  ZoneUI.cs, FishdexUI.cs, CompetitionUI.cs, SettingsUI.cs,
                  QuestsUI.cs, HallOfFameUI.cs, AbyssUI.cs,
                  ZoneBackgroundDisplay.cs, UITween.cs
  Generated/
    ButtonFrame.png       ← auto-generated by SceneBuilder
```

### When asking Claude Code for help
- Always specify exact filename
- One system per conversation where possible
- Paste only relevant code, not entire files
- Ask for changes in small increments, not full rewrites

---

## Dev Log

### 2026-06-17

#### Graphics & Assets

- **Bobber PNG** — replaced CSS-drawn red/white div bobber with actual PNG from equipped bobber item. JS `updateBobberImg()` updates the image live when player equips a new bobber from the Bait shop.
- **White background removal** — ran PowerShell pixel-processing script (System.Drawing) on all icon PNGs in `img/icons/` (42 files) and all fish sprites in `img/fish/` (10 files). Near-white pixels (R,G,B ≥ 250) replaced with transparency. PNG files permanently fixed.

#### Font

- **Pixeloid Sans Bold** added as the primary game font via `@font-face` in CSS. Source: `img/Pixeloid_Font_1_0/`. Falls back to Courier New if font file missing.

#### UI — Game Screen

- **Estonian text removed** — "Tiik (Pond)" → "Pond". All zone identifiers in code are English-only.
- **HUD text 2× larger** — zone name, coin counter, fish counter font sizes doubled. HUD bar height increased to match.
- **Green bar removed** — `.water-area` changed to `position: absolute; inset: 0` so the background image covers the full screen including behind the HUD. `.hud-top` changed to `position: absolute; top: 0` overlaying the water area. Body background no longer bleeds through.
- **All emojis removed** — demand labels (Surge/High/Normal/Low/Crash), locked Buy button, Diamond label, placeholder screen icons all converted to text or PNG icons.

#### UI — Navigation

- **Bottom nav expanded** — added Zones, Contest, Fishdex alongside Shop and Market (5 icons total).
- **HUD center nav added** — Quests, Fame, Abyss, Settings icons placed in the top HUD bar, horizontally centered, with text labels below each icon.
- **All game screen icons integrated** — all icons from `img/icons/Game screen icons/` are now in use: Shop, coin_icon, fish_counter_icon, fishdex, settings, competition, quests, hallOfFame, zones, abyss.
- **Nav icon size** — bottom nav icons 2× larger; HUD nav icons 2× larger.

#### UI — Shop

- **Panel hidden by default** — shop opens showing only the 4 tab icons. Panel slides in when a tab is pressed. Pressing the same tab again closes the panel (toggle).
- **Shop exit button** — permanent X button in top-right corner of shop screen, visible whether panel is open or not.
- **Item descriptions added** — all shop items now show a description line below the item name (italic, dimmed text). Rods show tap count, bobbers show effect, storage shows capacity + shelf life, automation shows catch rate.
- **Rod icon size** — icon display width `240px`, height `90px` to match the horizontal/landscape shape of rod sprites.

#### Automation System

- **Multiple purchases enabled** — automation items (nets, fishermen, boats, fleets) can now be bought any number of times. Previously limited to 1 per type.
- **Escalating price** — each subsequent purchase of the same item costs `baseCost × 1.15^count`. Price displayed in shop updates after each purchase.
- **Owned count badge** — item name shows `×2`, `×3` etc. in gold text after first purchase.
- **Storage confirmed upgrade-only** — storage items remain single-equip progression upgrades, not stackable.

#### UI — Market

- **Sell All button moved to top** — now appears immediately below the "Your Catch" section header, before the fish list.

#### Placeholder Screens Added

- Zones, Competition, Quests, Hall of Fame, Abyss — all wired to nav buttons with "Coming Soon" placeholder UI showing the relevant icon and a short description of future content.

---

### 2026-06-18

#### Pond Zone — Missing Systems Implemented

- **Full Trash DB** — expanded from 3 to 10 items: Old Boot, Tin Can, Plastic Bag, Glass Bottle, Rusty Hook, Broken Rod, Old Tire, Rubber Duck, Garden Glove, Bicycle Wheel. All zone-filtered via `TRASH_DB.filter(t => t.zone === G.currentZone)`.
- **Plant DB added** — 10 pond plants: Reed, Lily Pad, Algae Clump, Water Hyacinth, Hornwort, Duckweed, Cattail, Watercress, Arrowhead Plant, Water Mint. Stored in `PLANT_DB`. Plants auto-discard (0 value), tracked in Fishdex.
- **Plant loot table entry** — `LOOT_TABLE_POND` updated: Trash 30%, Plant 20%, Common 35%, Uncommon 10%, Rare 4%, Epic 1% (matches CLAUDE.md spec exactly).
- **Epic fish** — Giant Crucian Carp (epic, 500c base) added to `FISH_DB` for pond zone.
- **Offline progress** — `calculateOfflineProgress()` runs on init. Computes missed automation catches based on `G.lastSeen` timestamp (capped at 12h). Fish distributed with random timestamps across offline period. Shows "Welcome back!" status message. `visibilitychange` event saves `lastSeen` when app goes to background.
- **Fishdex screen** — fully implemented. 4-column grid, 3 sections (Fish / Plants / Trash), 31 total pond items. Caught items show image (or letter placeholder) + rarity dot. Uncaught items show grey `?`. Progress counter `X / 31 caught` in header. Auto-records trash and plant catches in Fishdex even though they auto-discard.

#### In-Game Clock

- **Clock added to HUD** — `hud-clock` element below zone name on left side. Shows `HH:MM · [Period]` in Pixeloid Bold.
- **In-game time speed** — 1 real hour = 1 in-game day (24× faster than real time). Calculated from `(realSecondsInHour / 3600) * 86400`. Updates every 2.5 real seconds (= 1 in-game minute).
- **Time periods** — Dawn 04–07, Morning 07–12, Afternoon 12–18, Evening 18–22, Night 22–04. `getTimePeriod(h)` returns period label.

#### Market Screen

- **Demand inline on inventory** — removed separate "Market Prices" table. Each fish card in inventory now shows demand badge (Surge/High/Normal/Low/Crash) + coin value directly on the item row. `.storage-item-demand` flex column groups badge and price on the right side.

#### HUD — Fish/s Counter

- **Fish production rate** — `calcFishRate()` sums `1 / aDef.rate` for all owned automation. Displayed below fish storage counter as `X.X fish/s`. Hidden when no automation owned. Same font size and weight as storage counter.

#### HUD — Layout & Font Fixes

- **HUD left/right absolute positioned** — `.hud-left` and `.hud-right` use `position: absolute` with same `translateY(calc(-50% + clamp(16px,3.5vw,24px)))` as center nav, aligning coins/fish/clock vertically with Quests/Fame/Abyss/Settings buttons.
- **Coins text gold** — `#hud-coins` uses `var(--color-gold)`.
- **Global bold font** — `font-weight: bold` added to `body`. Entire game now uses Pixeloid Bold variant by default. Previously elements without explicit bold were silently using Regular variant.

---

### 2026-06-18 (continued)

#### Quests System — Implemented

- **Daily Quests** — 3 random quests per day from 8-item pool (Morning Catch, Market Day, Lucky Cast, Pond Cleaner, Surge Seller, Variety Fisher, Dawn Fisher, Full House). Reset at midnight, progress tracked per session.
- **Weekly Quest** — 1 random quest per week from 4-item pool (Pond Master, Trash Hauler, Market Mogul, Dex Complete). Resets Monday.
- **Achievements** — 9 permanent one-time achievements (First Cast, Lucky Day, Hoarder, Night Owl, Trash King, Pond Complete, Surge Expert, Speed Fisher, Patient Angler). Claim button gives coin rewards.
- **Quest badge** — Red pulsing dot appears on Quests nav button when rewards are claimable. Disappears after all rewards claimed.
- **Event hooks** — `onCatchEvent(fishId, rarity)`, `onSellEvent(fishId, demandKey, value)`, `onStorageFullEvent()` track all relevant game events. All active and automation catches trigger quest progress.
- **Persistent stats** — `G.stats` tracks totalFish, totalTrash, totalEpic, totalSurge, storageFills, hourFish, playStreak for achievement conditions.
- **State** — `G.quests` holds daily/weekly/achievement progress. Daily resets on new calendar day. Weekly resets on Monday.

#### Multi-Zone System — Implemented

- **All 6 zones with full fish data** — 180 total catchable items across Pond, River, Lake, Bay, Sea, Ocean. Each zone has 10 fish + 10 plants + 10 trash. Fish rarity and value scales per zone (Pond 5–500c → Ocean 1000–80000c).
- **Zone-specific loot tables** — `LOOT_TABLES` object. Each successive zone has lower trash/plant % and higher rare/epic/legendary %. Ocean adds legendary tier (4% weight).
- **Transport system** — `TRANSPORT` array with 5 vehicles (Waders 80c, Rowing Boat 250c, Speedboat 600c, Fishing Vessel 2000c, Research Vessel 7000c). Tracked in `G.ownedTransport`. Purchased directly from the Zones screen.
- **Zone unlock logic** — `isZoneUnlocked(zoneId)` checks both required rod (owned in shop) and required transport (owned via Zones screen).
- **Zones screen** — Shows 6 zone cards with color bar per zone. Active zone shows green "Active" badge. Unlocked zones show "Fish Here" button + automation summary. Locked zones show requirements checklist with ✓/× and "Buy [Transport]" button if rod requirement is met.
- **Zone switching** — `switchZone(zoneId)` updates `G.currentZone`, switches zone background (pond.png for Pond, CSS gradient for others), updates HUD zone name.
- **Zone-aware automation** — `autoTick()` passes `owned.zone` to `rollCatch(zone)`. Each automation unit catches fish from its own zone independently. Offline progress also zone-aware.
- **rollCatch(zone)** — now accepts optional zone parameter (defaults to `G.currentZone`). Uses `LOOT_TABLES[zone]` for probabilities and zone-filtered fish/plant/trash pools.

#### Diamond Currency + Premium Bait — Implemented

- **Diamond counter** — `G.diamonds` added to DEFAULT_STATE (starts at 5). Shown in HUD as `◆ 5` in cyan next to coin counter.
- **Premium Bait purchase** — Bait shop tab shows Premium Bait with "Activate" button (costs 2 Diamonds). `buyPremiumBait()` deducts diamonds, sets `G.premiumBaitActive = true`, `G.premiumBaitEnd = now + 30min`.
- **Premium Bait loot effect** — `rollCatch()` checks `isPremiumBaitActive()`. When active, all non-common/non-trash/non-plant loot table weights ×2 (uncommon/rare/epic/legendary doubled). Common probability drops proportionally.
- **Bait active banner** — Floating pill banner in water area showing `◆ Bait: Xm` remaining. Updates every 2.5s via `updateClock()`. Auto-hides when bait expires.
- **`isPremiumBaitActive()`** — helper that auto-clears `G.premiumBaitActive` if `premiumBaitEnd` has passed.

#### Settings Screen — Implemented

- **Sound toggle** — `G.soundEnabled` boolean in state. Toggle button shows ON/OFF. Saves to localStorage. Ready for audio system when added.
- **Reset Progress** — Danger button with `confirm()` dialog. Clears `patientAngler_v1` from localStorage and reloads.
- **About section** — Shows game name, version, developer.

#### Fishdex Multi-Zone Tabs — Implemented

- **Zone tab bar** — Scrollable horizontal tab row above fishdex content. 6 zone tabs. Active tab highlighted gold. Locked zones greyed out.
- **`_fishdexZone`** — Session variable. Initializes to `G.currentZone` on first open, remembers last viewed zone.
- **`renderFishdexTabs()`** — Renders tab bar. Each unlocked tab updates `_fishdexZone` and re-renders.
- **`renderFishdex()`** — Now uses `_fishdexZone` instead of hardcoded `G.currentZone`.

---

### 2026-06-18 (balance pass)

#### Economy Rebalancing — Zone Unlock Costs ×10

**Problem:** Progression was ~13–15× faster than the Intended Progression Pace. Root cause: zone unlock costs were far too low relative to active fishing income (~71c/min at Pond). Example: River unlock (Rod + Waders) cost only 230c → achievable in ~3 minutes. Spec target: 1–3 days.

**Fish values and automation rates were correct and unchanged.** The Bucket (5-slot) storage bottleneck correctly caps idle income. The issue was purely unlock cost calibration.

**Fix: all Rod costs and Transport costs ×10.**

New zone unlock totals:
- River: 1500c (rod) + 800c (transport) = **2300c** → ~32 min active play → 1–2 day casual pace ✓
- Lake: 4000c + 2500c = **6500c** → ~3–4 days ✓
- Bay: 9000c + 6000c = **15000c** → ~7–10 days ✓
- Sea: 25000c + 20000c = **45000c** → ~14–21 days ✓
- Ocean: 80000c + 70000c = **150000c** → ~30–50 days ✓
- Abyss rods: 200000c → 500000c → 1500000c (endgame arc) ✓

Bobbers also ×3 (QoL items, not progression gates, so lighter increase).

Automation and storage costs unchanged — they already pace well within zones.

---

### 2026-06-25 (8-month economy overhaul)

#### Target timeline corrected

**Previous spec was wrong.** The Intended Progression Pace table said Ocean = "30–60 days." The real target is:

- **Ocean (F2P, ads only) = 8 months**
- Active buyers should reach Ocean in 4–5 months

Previous automation costs and rates were ~10-50× too cheap/fast — economy was still 14× too fast even after the ×10 zone cost pass from 2026-06-18.

#### Automation Rates — Slowed ~1.5×

All automation catch rates reduced to increase the time-to-ROI for each unit and limit income snowballing:

| Tier | Before | After |
|---|---|---|
| Fishing Net | 1/40s | 1/60s |
| Reinforced Net | 1/30s | 1/45s |
| River Net | 1/20s | 1/30s |
| Local Fisher | 1/20s | 1/30s |
| Skilled Fisher | 1/10s | 1/15s |
| Veteran Fisher | 1/5s | 1/8s |
| Row Boat | 1/5s | 1/8s |
| Motor Boat | 1/2s | 1/3s |
| Fishing Boat | 1/s | 1/1.5s |
| Small Fleet | 5/s | 2/s |
| Large Fleet | 10/s | 4/s |
| Deep Sea Fleet | 25/s | 10/s |

#### Automation Costs — Dramatically increased for mid/high tier

| Tier | Before | After | Multiplier |
|---|---|---|---|
| Fishing Net | 100c | 100c | 1× (locked per spec) |
| Reinforced Net | 500c | 3,000c | 6× |
| River Net | 2,000c | 15,000c | 7.5× |
| Local Fisher | 500c | 3,000c | 6× |
| Skilled Fisher | 2,500c | 30,000c | 12× |
| Veteran Fisher | 10,000c | 300,000c | 30× |
| Row Boat | 2,500c | 30,000c | 12× |
| Motor Boat | 10,000c | 300,000c | 30× |
| Fishing Boat | 50,000c | 3,000,000c | 60× |
| Small Fleet | 100,000c | 5,000,000c | 50× |
| Large Fleet | 500,000c | 50,000,000c | 100× |
| Deep Sea Fleet | 2,000,000c | 500,000,000c | 250× |

#### Sea and Ocean zone costs — 3× increase

Sea and Ocean were the most under-priced relative to income at those stages:

| Zone | Before (rod + transport) | After | Total |
|---|---|---|---|
| Sea | 9M + 6M | 25M + 20M | **45M** (was 15M) |
| Ocean | 90M + 60M | 250M + 200M | **450M** (was 150M) |

River/Lake/Bay unchanged — those zone paces were acceptable.
