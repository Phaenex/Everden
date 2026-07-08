# Lilypond Cast — Example Characters

All characters below are in `public/data/npcs.json` with procedural pixel sprites.

## Player (selectable)

| Species | Role | Combat kit |
|---------|------|------------|
| Frog | Mobile | Leap, Tongue Lash, Amphibious Rush |
| Toad | Control | Bufotoxin, Fear Croak, Burrow |
| Turtle | Tank | Shell Block, Withdraw, Ram |
| Vole | Healer | Burrow Hide, Cheek Poultice, Nibble Distraction |

## NPCs (16)

| Name | Species | Title | Faction |
|------|---------|-------|---------|
| Pip Marshwick | Frog | Market Factor | Lilymarket Traders |
| Fern Reedweaver | Frog | Reed Weaver | Lilymarket Traders |
| Jenna Leapwell | Frog | River Courier | Lilymarket Traders |
| Croaker Finn | Frog | Stall Apprentice | Lilymarket Traders |
| Bramble | Frog | Causeway Guard | Lilymarket Traders |
| Rivulet | Frog | Tadpole Teacher | Lilymarket Traders |
| Grizz Burrowman | Toad | Ferry Operator | Croakend Artisans |
| Marta Clayhollow | Toad | Potion Seller | Croakend Artisans |
| Silt | Toad | Ferry Hand | Croakend Artisans |
| Pondwort | Toad | Alchemy Apprentice | Croakend Artisans |
| Elder Shellen Domet | Turtle | Council Speaker | Mudwall Masons |
| Kess Ridge | Turtle | Levy Foreman | Mudwall Masons |
| Tor Stoneback | Turtle | Mason Captain | Mudwall Masons |
| Elder Thatch | Turtle | Chapel Warden | Mudwall Masons |
| Old Myrtle Shellsong | Tortoise | Chronicle Keeper | Mudwall Masons |
| Sable Meadowrun | Vole | Wandering Healer | Vale Wanderers |

## Combat Enemies (examples)

| Name | Species | Role | Encounter |
|------|---------|------|-----------|
| Skadge the Poacher | Toad | Control | Blackfen Poachers |
| Bulk | Turtle | Tank | Blackfen Poachers |

## Items (examples)

| Item | Effect |
|------|--------|
| Reed Hop Charm | +1 attack, +1d4 initiative |
| Clay Phial of Tonic | +2 saves |
| Shell Fragment Amulet | +2 defense |

## World Objects

See `public/data/objects.json` — market board, nursery pool, council rostrum, merchants, quest examine nodes.

## Adding Your Sketches

1. Drop art in `public/assets/sprites/{species}/`
2. Update `CharacterSprites.ts` to load images when present
3. Add entry to `docs/IDEAS.md`
