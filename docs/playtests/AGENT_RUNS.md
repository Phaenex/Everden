# Agent Playtest Runs (NOT human T8)

Automated browser sessions by Cursor agents. **Do not count** toward T8 external playtests or alpha gate.

Use [`docs/systems/VISUAL_QA_AGENTS.md`](../systems/VISUAL_QA_AGENTS.md) for agent prompts and rubrics.

---

## Log

| Run ID | Date | Agent | Build | Scout | Persona | Notes |
|--------|------|-------|-------|-------|---------|-------|
| AR-001 | 2026-07-07 | visual-scout | localhost:5189 | **FAIL** | — | Pre-V1: floating slab, invisible exits |
| AR-002 | 2026-07-07 | visual-scout + fresh-player | localhost:5189 | **PASS** | fresh-player PASS | V1 gate — see detail |
| AR-003 | 2026-07-07 | visual-scout | localhost:5189 | **BORDERLINE** | — | G4 Pip dialogue PASS; Nick eye test **pending** |
| AR-004 | 2026-07-07 | district-explorer | localhost:5189 | **BORDERLINE** | — | Causeway→Lilymarket OK; full hub loop not automated E2E |
| AR-005 | 2026-07-07 | quest-runner | localhost:5189 | — | **PARTIAL** | Pip dialogue + quest stage cellar verified; full rows 4–10 need human |
| AR-006 | 2026-07-07 | combat-tester | — | — | **DEFERRED** | Unit tests green; browser Blackfen run deferred to human T8 |
| AR-007 | 2026-07-07 | district-explorer | localhost:5190 | **BORDERLINE** | — | Visual-cohesion pass — all 5 empty-stage backdrops + composited sprites verified; Nick eye test pending |
| AR-008 | 2026-07-07 | backdrop-framing | localhost:5191 | **BORDERLINE** | — | Distinct causeway plate + brighter croakend, both native 16:9. Causeway verified in-game; edge-crop framing diagnosed — Nick eye test on a 16:9 display pending |
| AR-009 | 2026-07-07 | bug-fix (from Nick's 16:9 screenshots) | localhost:5192 | **PASS** | — | Real bugs found from Nick's screen: stray click-marker, top-cropped UI prompt, wrong hardcoded aspect stretching every backdrop. All fixed + verified via live geometry inspection |
| AR-010 | 2026-07-07 | bug-fix (navPolygon vs. art mismatch) | localhost:5193 | **PASS** | — | "Can click backgrounds I can't go" — walkable rectangle in 4 districts reached screen positions near/off the visible frame edge. Shrunk navPolygon + reflowed NPCs/objects/exits/spawn in mudwall, ferry_rest, croakend, lilymarket; verified via camera-projection math, not guesswork |
| AR-011 | 2026-07-07 | feature (BG3-style dice duel) | localhost:5194 | **PASS** | — | New `combat:dice_duel` popup — attacker/defender portraits, tumbling d20, breakdown + outcome banner. Verified live in Blackfen Poachers: real enemy/species art loaded into portraits, MISS/HIT text + `duel-miss`/`duel-hit` classes matched actual roll math. Screenshot tool crops to a sub-viewport in this environment — used `Emulation.setDeviceMetricsOverride(960×540)` to get an honest screenshot instead of guessing from a stale/cropped one |
| AR-012 | 2026-07-07 | bug-fix + dev tools (Nick feedback) | localhost + vercel | **PASS** | — | NPC hour-teleport glitch removed; schedule-aware NPC spawning (fewer wrong-district NPCs); dev menu (F1/`); dialogue skill checks use duel popup; NPC coords respread |
| AR-013 | 2026-07-07 | Playwright E2E + QA harness | preview:4173 | **PASS** | mechanical | 8/8 e2e green — boot, 5 districts, NPC +6h skip, examines, Domet duel DOM, Blackfen diplomacy+no soft-lock, save round-trip, ferry quest hook. See detail |
| AR-014 | 2026-07-07 | bug-fix (Nick's core-loop feedback: E-prompt, combat surprise, NPC clipping, dev menu) | localhost:5173 | **PASS** | — | Fixed 5 reported issues in the initial-world core loop, verified via new `getScreenLayout`/`projectToScreen` QA tools (real camera math) instead of eyeballing screenshots — see detail |
| AR-015 | 2026-07-07 | Nail Core Loop Basics — Causeway landmarks + full nav sweep + backdrop-crop bug fix | localhost:5200 | **PASS** | — | Causeway got a waystone, lantern, and Fennick Farrow NPC; found and fixed a real 2x backdrop-oversize bug affecting **all 5 districts**; full 5-district round-trip verified — see detail |
| AR-016 | 2026-07-07 | Intro arc — opening beat, control hint, title flavor, quest tracker, Pip dialogue fix | localhost:4174 (real click flow, no QA warp) | **PASS** | — | Full non-QA playthrough: title → species pick → opening narration → control hint → click-walked to Lilymarket → talked to Pip (new reaction text confirmed) — see detail |
| AR-017 | 2026-07-08 | Character creation wizard + save v2 + D&D mechanics fixes | localhost (unit + e2e) | **PASS** | mechanical | 120 unit tests + 8/8 e2e; full wizard tortoise path Nick eye pending — see detail |
| AR-018 | 2026-07-08 | Wizard eye — tortoise / messenger non-QA path | preview + screenshots | **PASS** | mechanical | Playwright wizard flow + screenshots; Nick human eye still pending |
| AR-019 | 2026-07-08 | V4 quest-runner + combat-tester expansion | preview e2e | **PASS** | mechanical | Main quest stage chain, Kess INT + species line, council expose, frog ability smoke — 16/16 e2e |
| AR-020 | 2026-07-08 | Parallel sprint — NPC walk, hub e2e, species combat | preview e2e | **PASS** | mechanical | NpcPathFollower (exit→slot walk); 5-species ability e2e; V3 hub loop; 129 unit + 23/23 Playwright |
| AR-021 | 2026-07-08 | Creator visual QA — 9-tab menu live walk | localhost:5200 | **BORDERLINE** | creator | Found + fixed 3 UI bugs; skip-narration enter Causeway verified — Nick 16:9 eye still needed |
| AR-022 | 2026-07-08 | Full retest — creator + mechanical | localhost:5200 | **PASS** mechanical / **BORDERLINE** visual | creator | 141 unit + 25/25 Playwright; live 9-tab walk + enter; AR-021 regressions held; Nick eye still pending |
| AR-023 | 2026-07-08 | Look / Outfits / tint before-after visual proof | localhost:5200 | **PASS** agent visual | creator | Live clicks + pixel samples; contrast + preview size fixes confirmed; 5/5 char-creation e2e |
| AR-024 | 2026-07-08 | Full creator pass + in-world appearance fix | localhost:5200 | **PASS** agent visual | creator | All 9 tabs walked; PNG overlay bug fixed; folk 2-col grid; review checklist; 144 unit + 5/5 e2e |
| AR-025 | 2026-07-08 | Creator polish + appearance save e2e | localhost:5200 | **PASS** | creator | Compact header chrome; look/outfit save round-trip e2e (6/6); 144 unit |

### AR-025 detail (Compact chrome + appearance save e2e)

**Scope:** Continue creator groundwork — dense header fix + automated regression for appearance persistence.

**Shipped:**

- **Compact creator header** — hide premise/studio when `.creator-shell` is active; smaller title so tabs + preview get vertical room
- **`completeCharacterWithAppearance` helper** — e2e path for Look + Outfits + Settings skip
- **New e2e:** `look and outfit choices persist in save` — variant 3, spots, tint 35, ferry kepi + levy mantle round-trip through save v2
- **E2e fix:** click `#game-canvas` before Escape so pause menu opens after creator (focus was trapped on form controls)

**Mechanical:** 144 unit + **6/6** char-creation Playwright + build green.

**Screenshot:** `AR025_creator_all_tabs.png` (from smokeCreatorTabs).

**Nick eye test:** still pending.

---

### AR-024 detail (Full creator polish + in-world Look/Outfit fix)

**Scope:** User asked to verify/fix everything in the character menu — all tabs, contrast, wardrobe/tint in creator AND in-world.

**Root bug fixed:** `createCharacterMesh` swapped player to species PNG after load, which **discarded** tint/markings and drew wardrobe as a broken full-canvas overlay. Customized players now keep the **procedural sprite** (`appearanceNeedsProceduralRender`) so in-world matches creator preview. Default look (no customization) still uses PNG art.

**Other fixes:**

- Folk panel → 2-column compact grid (all 5 folk visible without scroll)
- Brighter stat row hints + skills mod chips
- Review checklist → motivation, look line, named outfit pieces
- Folk switch preserves hue/marking/wardrobe (only variant resets)
- Settings toggles no longer re-render entire panel on each click
- `applyWardrobeOverlay` now includes cloak back-layer
- `applyAppearanceToArtCanvas` for NPC/default PNG tint path

**Live browser (`localhost:5200`):**

| Tab | Result |
|-----|--------|
| Folk | 5 cards in 2-col grid, tortoise/vole visible |
| Look | Pattern/tint/markings change preview (AR-023 held) |
| Outfits | Ferry kepi + Levy mantle on preview + summary |
| Stats / Kit / Skills | Readable panels, mods visible |
| Story | Name → summary; motivation note refreshes |
| Settings | Skip narration → review shows "skipped" |
| Review | Full checklist lines; Enter works |
| In-world | Procedural frog with hat/cloak visible on Causeway (no PNG glitch box) |

**Mechanical:** 144 unit + typecheck + build + **5/5** char-creation Playwright.

**Screenshots:** `AR024_tab_folk_grid.png`, `AR024_tab_stats.png`, `AR024_tab_story.png`, `AR024_inworld_procedural_outfit.png`.

**Nick eye test:** still pending for 16:9 density / default-PNG vs procedural feel.

---

### AR-023 detail (Look / Outfits / tint — before-after proof)

**Scope:** User-reported "wardrobe and skin coloring don't work" + unreadable contrast. Re-verify after preview-size / contrast / wardrobe-color fixes with **before/after screenshots and canvas pixel samples** (not code-only).

**Live browser (`localhost:5200`, fresh save):**

| Check | Before | After | Result |
|-------|--------|-------|--------|
| Look baseline | avg RGB 62,84,59 | — | baseline shot |
| Pattern 3 + Spots + tint 45 | — | avg RGB 45,92,52; darkSpots 32764 | ✅ visible |
| Outfits baseline | gold pixels 0 | — | bare frog |
| Ferry kepi + Levy mantle + Shell brooch | — | gold 7248, redCloak 4076; summary line updates | ✅ visible on preview |
| Folk vole→tortoise | center still said Frog (AR-021 bug) | center "Tortoise" + Tank · Chronicle-minded | ✅ held |
| Panel duplicate on equip | AR-021 bug | single Outfits panel after each click | ✅ held |
| Contrast / readability | user complaint | dark panels, gold borders, large preview | ✅ improved (Nick 16:9 still pending) |

**Screenshots (saved under `docs/playtests/screenshots/`):**

- `AR023_baseline_folk.png`
- `AR023_look_baseline.png` → `AR023_look_pattern3_spots_tint45.png`
- `AR023_outfits_baseline.png` → `AR023_outfit_full_equipped.png`
- `AR023_folk_tortoise.png`

**Mechanical:** `npx playwright test e2e/character-creation.spec.ts` → **5/5** green.

**Nick eye test:** still required for 16:9 layout density and in-world wardrobe vs creator preview parity.

---

### AR-022 detail (Full creator + mechanical retest)

**Scope:** Honest full check after AR-021 fixes — not a new feature build.

**Mechanical:**

- `npm test` → 141 passed
- `npm run typecheck` + `npm run build` → green
- Full Playwright → **25/25** (char creation 5, combat abilities 5, hub loop 2, vertical slice + V4 quest, AR-018 shots)

**Live browser (`localhost:5200`, fresh save):**

| Check | Result |
|-------|--------|
| Folk switch vole→tortoise updates center title immediately | ✅ |
| Look / Outfits / Stats stay at 1 panel (no AR-021 duplicate) | ✅ |
| Outfit equip Shell cap + Levy mantle + Shell brooch | ✅ summary line |
| Kit shows Shell Block / Withdraw / Ram | ✅ |
| Skills 6 refs + live mods | ✅ |
| Story neighbor motivation note refreshes | ✅ |
| Settings skip narration → Review checklist "skipped" | ✅ |
| Enter → Causeway, HUD `FullCheck · Tortoise`, **0** dialogue panels | ✅ |
| Quest tracker + district exits visible | ✅ |

**Screenshots:**

- `docs/playtests/screenshots/AR022_creator_review.png`
- `docs/playtests/screenshots/AR022_creator_enter_causeway.png`
- `docs/playtests/screenshots/AR022_creator_walk_mid.png`

**Still BORDERLINE / Nick:**

- Creator chrome still dense (Everden title + 9 tabs + preview + panel + summary)
- Folk cards need scroll to see Turtle/Tortoise/Vole
- In-world wardrobe overlay on species PNG is subtler than creator procedural preview (not a blocker this run)
- T6 / Nick 16:9 eye test still required — agent PASS ≠ Nick PASS

**Nick eye test:** pending

---

### AR-021 detail (Character creator visual walk — Kit/Skills/Settings groundwork)

**Scope:** Live browser walk of full 9-tab creator on `localhost:5200` (not Playwright-only).

**Bugs found visually (fixed same session):**

1. Folk select updated summary/canvas but center title stayed "Frog" until tab change → `onSpeciesChange` now full `render()`
2. Look / Outfits / Stats re-render appended a second panel instead of replacing → callbacks use `renderPanel()` (clears first)
3. Story motivation guide note stayed on investigator after picking messenger → motivation click now `renderPanel()`

**Verified working:**

- Kit tab — Shell Block / Withdraw / Ram with type + gameHint
- Skills tab — live mods + Insight/History/Persuasion reference
- Settings — skip narration checkbox → causeway with **no** dialogue panel
- Enter → HUD `Shellen Eye · Tortoise` · Reedwater Causeway · quest tracker on

**Screenshot:** `docs/playtests/screenshots/AR_creator_enter_causeway.png`

**Still open / Nick eye:**

- Creator chrome is dense (title + 9 tabs + preview + panel + summary). Needs 16:9 human composition pass.
- Wardrobe procedural hats show on preview; full in-world PNG wardrobe not re-checked this run.
- Folk card list on Folk tab only shows ~2 cards without scroll (panel max-height).

**Nick eye test:** pending — agent visual BORDERLINE, not a T6 PASS.

---

### AR-007 detail (Visual Cohesion Pass — all 5 districts captured)

Regenerated backdrops as empty iso stages + crisp flat-bg sprites, fixed-per-district camera, cover-fit backdrop sizing, feet-anchored shadows. Screenshot per district (fresh save, frog):

| District | Backdrop art | Composite verdict |
|----------|--------------|-------------------|
| Causeway | wooden docks over water | PASS — stage fills frame, frog on floor with shadow, no brown wedge |
| Lilymarket | wooden docks/market | PASS — vole + frog merchants, crisp sprites, correct scale |
| Mudwall | cobblestone mason town + rostrum | PASS — turtle/tortoise masons, distinct stage |
| Croakend | clay/mud artisan flat | PASS — toad artisans; stage is sparse but clean |
| Ferryman's Rest | warm wooden pier + barrels | PASS — toad ferry-hands + lantern, distinct lighting |

**Screenshots:** docs/playtests/screenshots/AR_{causeway,lilymarket,mudwall,croakend,ferrymans_rest}.png

**Fixed vs AR-001/003/004:** "layers on layers" clash gone — sprites now read as standing *in* the scene, not pasted on a finished painting. No baked-in crowds; backdrops are empty stages.

**Known follow-ups:** `causeway.json` still points its backdrop at `lilymarket.webp` (both read as docks, acceptable but worth a distinct causeway plate later). Croakend stage art is plainer than the others.

**Nick eye test required:** yes — result: pending

### AR-008 detail (Backdrop framing + two new plates)

Follow-up on AR-007's two known gaps.

- **Causeway** now has its own plate (`causeway.webp`): a wooden-plank boardwalk over dark marsh water, reeds/cattails, mooring posts, hanging lanterns, lily pads at the corners, clear central floor. `causeway.json` rewired off `lilymarket.webp`. Verified rendering in-game (HUD + floor correct).
- **Croakend** regenerated (`croakend.webp`): same clay burrow-shop night market but warmer/brighter so the huts and pots read instead of going near-black at the edges.
- Both generated at **native 16:9** — the aspect `getBackdropSize` frames for.

**Root-cause found (the real "plain district" cause):** the fixed per-district camera cover-fits the backdrop to a 16:9 frustum. The old backdrops are 3:2 (1280×854), so on a 16:9 display their left/right edge scenery is cropped — you see mostly the empty central floor, which reads as "plain." Native 16:9 art fills the frame with no crop. This is why Croakend looked barest: its detail sits entirely at the edges.

**Capture caveat:** the Cursor webview viewport isn't 16:9, so it crops the new plates' edges here too, and `preserveDrawingBuffer:false` makes single-nav WebGL captures lag a frame. Full-frame verification of the 16:9 plates needs a real 16:9 display — that's the Nick eye test.

**Next (with Nick):** decide whether to (a) re-gen the remaining three backdrops (lilymarket, mudwall, ferrymans_rest) at native 16:9 too, or (b) switch backdrop sizing to contain-fit + a matched background color so no edge ever crops.

**Nick eye test required:** yes — result: pending

### AR-009 detail (Real bugs from Nick's live 16:9 screenshots)

Nick sent screenshots from his actual browser (real 16:9 display) after AR-008. They surfaced three distinct, previously-undiagnosed bugs — none of them were the "needs more Nick eye-testing" kind, all three were reproducible root causes fixed with certainty:

1. **Stray exit-ring showing up somewhere never clicked.** Root cause: `SceneManager.showClickMarker()` (the "walked here" ring) was never hidden after arrival, and `clearSceneContent()` explicitly re-added the *disposed* marker mesh into the next scene's `foreground` layer — so the last click from district A reappeared at the same numeric world coordinates in district B, landing in a random spot. Fixed: `debugMarker` is nulled (not re-added) on scene clear, and `hideClickMarker()` is called on arrival (`onArrive`) and on any entity pick. Verified live: clicked ground in Ferryman's Rest mid-walk (marker visible:true), switched scenes via `loadScene`, `kernel.foreground.children` came back `[]` — nothing carried over.
2. **"Click or [E] Back to X" text cropped off the top of the browser.** Root cause: `.interaction-prompt` is `position: absolute; bottom: 2rem` meant to anchor to the viewport, but `UIManager` nested it inside `.hud` (also `position: absolute`), so `bottom: 2rem` resolved against the hud's own ~40px box instead of the screen, pushing the prompt off-screen above the browser's own tab bar. Fixed: mounted `prompt` on `#ui-root` directly, same as `toastEl`/`dialoguePanel`. Verified live at a real 1280×720 viewport — the prompt now renders bottom-center, fully visible.
3. **NPCs floating in a huge empty gap, not "doing anything."** Traced to the same root cause as AR-008's diagnosis, but the actual bug was worse than assumed: the "16:9" backdrop regens from AR-008 were **not actually 16:9** — the generator returned 1536×1024 (3:2) regardless of the requested ratio. `SceneComposition.getBackdropSize` was hardcoding `BACKDROP_IMAGE_ASPECT = 16/9`, so every backdrop's plane got shaped for an aspect the art never had, stretching the real 3:2 texture ~19% *and* still cover-fit-cropping whatever didn't fit — which chopped off Mudwall's rostrum/domes and Ferryman's cottage almost entirely, leaving bare floor with NPCs clustered near the only "safe" (uncropped) patch near the exit. Fixed at the root: `getBackdropSize` now takes the real `imageAspect` as a parameter, and `SceneLoader.addBackdrop` re-measures `tex.image.width/height` once loaded and rebuilds the plane geometry — verified live via geometry inspection (`planeAspect` now exactly equals `imgAspect`, both 1.5, for all 5 districts). Regenerated Mudwall/Ferryman's Rest/Lilymarket with their landmarks pulled away from the frame edges, and spread NPC/object coordinates across much more of each district's walkable width, near their thematically-matching landmark where one exists (Council Speaker near the rostrum, potion seller by her shop, etc).

**Verified:** 78 unit tests (2 new regression tests for the aspect bug) + typecheck + build green. Live geometry inspection confirms plane/image aspect match for all 5 districts. Marker lifecycle confirmed via direct scene-graph inspection (not just a screenshot). Deployed https://everden-chi.vercel.app.

**Honest caveat:** could not get a clean full-frame screenshot through the automation tooling even at a forced 1280×720 CDP viewport (the extension's own capture letterboxes to a smaller region) — verification here relied on live scene-graph/DOM inspection instead of pixels. Nick's own screenshots are still the most reliable check that domes/cottage/stalls are now fully in-frame.

**Nick eye test required:** yes — result: pending

**QA note:** WebGL screenshots in the Cursor browser need `preserveDrawingBuffer` + fresh navigation per district to capture reliably; a temporary `?scene=` boot hook + hook were used and reverted after capture.

### AR-010 detail (navPolygon vs. art mismatch — "click backgrounds I can't go")

Nick: "i also able to click in the backgrounds places i cant go either." Root cause was different from AR-009's aspect bug (that was already fixed) — this was a **stale-data** bug: `navPolygon`/`ground`/NPC/object/exit coordinates in `mudwall.json`, `ferry_rest.json`, `croakend.json`, `lilymarket.json` were never recalibrated after AR-009 regenerated those four backdrops. Clicking outside `navPolygon` doesn't reject the click — `NavigationController.walkTo` calls `nav.nearestWalkable()` and snaps to the closest point *on* the polygon edge — so if the polygon edge itself sits visually on top of painted domes/walls/rostrum, the "snap" still walks the player onto a painted structure.

**How this was actually verified (not eyeballed):** the isometric camera (`IsometricCamera.ts`) is an `OrthographicCamera` whose vertical frustum bounds are fixed regardless of window aspect, and whose horizontal bounds only ever *widen* on wider (more 16:9-like) screens — so a world point that projects safely inside the visible NDC range on a narrower test viewport is provably at least as safe on Nick's real wider display. Added a temp `window.__everden.project(x, z)` hook that runs the real `THREE.Vector3.project(camera)` math, then binary-searched each district's `navPolygon` down until all 4 corners landed within a comfortable ±0.5 NDC band (well clear of the frame edges where these compositions put domes/walls/rostrum/stalls). Reflowed spawn/exit/npcs/objects to fit inside the new smaller polygon, keeping relative groupings (e.g. Marta's shop still next to Marta).

**Trade-off:** walkable area in these 4 districts shrank roughly 45-55%; NPCs now cluster tighter around the player's spawn instead of spreading to the old (unsafe) edges. Causeway was left untouched — it's the hub with 4 load-bearing exits at wide x-offsets, art is a fairly benign boardwalk/water scene (not building-walled), and Nick's reports were specifically about the four districts changed in AR-009.

**Verified:** 78 unit tests + typecheck + build green (no test coverage added — this is JSON data, not logic; the logic itself, `nearestWalkable`/`walkTo`, is already covered in `NavMesh.test.ts`). Visually re-screenshotted all 4 districts after the reflow — NPCs/objects sit on open floor, no overlap with edge structures in-frame.

**Nick eye test required:** yes — result: pending (verification here used camera-projection math + a narrower test viewport as a provably-conservative proxy for Nick's real 16:9 display; a real-screen confirmation is still the final word).

### AR-011 detail (BG3-style dice duel popup)

Nick: "make the dice animation for the vs and make it like a duel when the dice are rolled you know like baldurs gate." `CombatManager` now emits a `combat:dice_duel` event (actor/target participant, natural/modifier/total/dc, outcome) alongside `combat:log` for every "roll vs a DC/AC" moment: attacks, `flee`, `attemptDiplomacy`, and the two WIS-save abilities (`fear_croak`, `nibble_distraction`). A new `DiceDuelOverlay` (mounted by `UIManager`, purely presentational, queues events so back-to-back rolls never overlap) shows attacker-vs-target portraits, a tumbling diamond d20 that cycles random faces for ~700ms before landing on the real roll, then a breakdown line and a color-coded outcome banner (gold crit, green hit/success, gray miss, red fumble).

Named-enemy portraits reuse the existing NPC-art fallback pattern: `loadEnemyArtCanvas` tries `sprites/enemies/{slug}.png` (full name slug, then first word — matches the shipped `skadge.png`/`bulk.png` convention) before falling back to species art, same never-throws contract as `loadArtCanvas`.

**Verified live** (Blackfen Poachers encounter, temp `window.__everden.startCombat()` QA hook, reverted after): attack rolls popped the duel card with real Bulk/Skadge portraits (not just procedural fallback — confirmed via `img.src` data-URL length), correct breakdown math (`3-4 = -1 vs 12`), and outcome banner class matched the actual roll (`MISS` → `duel-miss`). Screenshot tool in this environment crops to a smaller sub-viewport than `window.innerWidth` (1920×1080 real vs. ~819×600 captured) — confirmed via CDP `getBoundingClientRect()` showing the combat-log at `x:1584` outside the crop — so used `Emulation.setDeviceMetricsOverride({width:960,height:540})` to get an honest screenshot instead of trusting a misleading crop.

**Verified:** 89 unit tests (11 new: `DiceDuelOverlay.test.ts` for the enemy-slug helper, `CharacterSprites.test.ts` enemy-art-fallback cases, `CombatManager.test.ts` duel-event emission/outcome-consistency for attack/flee/diplomacy/save) + typecheck + build green.

**Nick eye test required:** yes — result: pending (this is a new presentation feature; the popup's pacing/readability on a real 16:9 display is the open question, not correctness).

### AR-002 detail (PASS — V1 gate)

| Gate | Result |
|------|--------|
| G1 causeway spawn | PASS — player, backdrop, visible exit markers with labels |
| G2 click move | PASS — debug ring + movement |
| G3 lilymarket | PASS — district HUD updates, single backdrop |
| G4 pip dialogue | PASS — Pip Marshwick portrait + intro line |
| G5 return causeway | BORDERLINE — forward exit reliable; return needs player at back portal |

**Fresh-player:** Pip reachable via click+E in ~30s; exits discoverable via gold rings.

### AR-003 (V2 — Nick eye test pending)

- Lilymarket reads better than AR-001; NPC spread improved
- **Nick eye test: pending** — screenshot shows some sprite overlap at market center

### AR-004 (V3)

- Causeway ↔ Lilymarket forward transition: PASS
- Croakend / Mudwall / Ferry automated loop: not fully verified in one session

### AR-013 detail (Playwright E2E + `window.__everden` QA harness)

Mechanical vertical-slice regression — **not** a substitute for Nick eye test or human T8.

**Added:** `src/core/QaHarness.ts`, `window.__everden` when `?qa=1`, `e2e/vertical-slice.spec.ts` (`npm run test:e2e`), `docs/playtests/MANUAL_CHECKLIST.md`, CI Playwright step.

**8/8 PASS:** boot + quest, 5 districts, +6h NPC skip, examines/flags, Domet duel DOM, Blackfen diplomacy on player turn + no soft-lock, save round-trip (`?qa=1&keep=1`), ferry quest dialogue hook.

**Nick eye test required:** yes — visual/feel/narrative rows in MANUAL_CHECKLIST.md

### T8 status

**Unblocked for scheduling** per [MASTER_BUILD_PLAN.md](../MASTER_BUILD_PLAN.md) V5 — agent pre-checks AR-002 PASS. Human sessions still required for alpha gate; AR-005/006 partial.

---

### AR-014 detail (core-loop fixes from Nick's live feedback)

Nick played the deployed build and reported 5 concrete problems with the base "walk around the first area" loop, before any questing polish. All 5 traced to real root causes, not vague "needs eye test" items:

1. **"[E] showing all the time, not even near something"** — object/NPC interaction radii (2.0–3.0 world units) covered nearly the full depth of these ~3-unit-deep districts, and every spawn point sat almost on top of its own "Back to Causeway" exit trigger. Shrunk every `objects.json` radius to 1.0–1.5 and the NPC default from 1.8→1.1, then moved all 4 leaf-district spawns and shrunk exit radii to 0.8. Verified with a new `window.__everden.getScreenLayout()`/`getState().player` combo: at spawn in all 4 districts, `.interaction-prompt` is `hidden` with zero live target — not a guess, checked by loading each district fresh and reading the actual DOM class.
2. **"Random combat came up and went before I could do anything"** — `blackfen_poachers` fired `combatManager.startEncounter()` directly on interact, zero confirmation, with a 3-unit radius that made it easy to trigger by accident. Added `UIManager.showConfirm()` (reuses the dialogue panel) — combat objects now show "Fight" / "Back away" before anything starts. Verified live: pressed `[E]` near the trigger, got the confirm text, clicked "Back away" → `combatActive` stayed `false`; re-triggered, clicked "Fight" → `combatActive` became `true`. Also gated `PlayerController.onKeyDown`'s `[E]` handler behind `interactionLocked` so mashing E while a dialogue/confirm/combat panel is already open can't queue a second trigger.
3. **"NPCs still moving and clipping too much"** — real cause wasn't the clock speed alone, it was NPC art literally overlapping on screen. Built a proper diagnostic instead of eyeballing: `SceneManager.projectToScreen(x,z)` + `getActorWorldPosition` (exposed via `window.__everden.getScreenLayout()`/`projectToScreen()`), which run the actual camera projection matrix. Confirmed the isometric camera's screen position is linear in `(x−z, x+z)` — two NPCs can be ~2.75 world units apart and still land almost directly on top of each other on screen if their `x−z` values are too close (this is exactly what was happening to Elder Domet / Old Myrtle in Mudwall — screenshot showed them fully stacked). Respread all Mudwall (4) and Lilymarket (6) NPC coordinates using the real projection math (not just world-space eyeballing) so every pair has meaningfully different `x−z`. Re-screenshotted both — no more stacked figures. Also slowed `WorldClock` from 0.5→0.25 min/real-sec so hourly schedule pop-in/out (a separate, real limitation — NPCs teleport to their next scheduled spot rather than walking there) happens half as often during a normal play session.
4. **Dev menu blocking things in the background** — it never paused the world; time/NPCs/combat kept running invisibly behind the panel. Added `DevMenuActions.onToggle`, wired to `GameLoop.stop()`/`start()` in `GameBootstrap`. Verified live: opened the panel, waited 4 real seconds, `getState().hour` didn't move; closed it, time advanced normally again.
5. Known limitation not fixed this pass: combat's enemy-turn `setTimeout` isn't tied to the game loop, so it still fires while the loop (and thus the dev menu) is paused — same pre-existing gap as the Esc pause menu. Documented, not silently ignored.

**New reusable QA surface** (not throwaway): `SceneManager.projectToScreen`/`getActorWorldPosition`/`getPlayerWorldPosition`, `window.__everden.getScreenLayout()`/`projectToScreen(x,z)`. Useful for any future "do these NPCs overlap on screen" regression check without trusting screenshot capture (which has had staleness/tab-focus artifacts in this environment before, per AR-011).

**Verified:** 91 unit tests + 8/8 e2e (Playwright) + typecheck + build all green after every change (not just at the end). Live-verified in-browser via the QA harness for all 5 fixes above — not claimed from code-reading alone.

**Nick eye test still required:** yes — NPC spacing is meaningfully better (verified via real projection math + screenshots) but 2 pairs in the crowded 6-NPC Lilymarket cluster (fern/croaker, jenna/bramble) are still "cozy" (~115-135px screen gap) rather than fully separated; a small district with 6 NPCs has real geometric limits. Worth Nick's eye on a real display before calling this fully resolved.

### AR-015 detail (Causeway hub life + full nav sweep + backdrop-crop bug)

Checkpoint 1+2 of the "Nail Core Loop Basics" plan.

**Checkpoint 1 — Causeway hub:**

- Added `causeway_waystone` (crossroads signpost) and `causeway_lantern` (ferry lantern) as `examine` objects in `causeway.json`, each rendered with a new procedural billboard prop (`src/presentation/PropSprites.ts`, `visualProp` field on `WorldObjectDefinition`) since the hub's own backdrop plate is otherwise unpopulated (`npcs: []`, `objects: []` before this change) — matches the "procedural fallback is permanent" art-pipeline doctrine, no new art asset required.
- Added `fennick_farrow` (vole peddler, 24/7 schedule) as the hub's first idle NPC, with a full `fennick_intro` dialogue tree (species-conditional line for vole players).
- Re-verified spacing/prompts with `getScreenLayout()`: only 1 NPC in Causeway currently, well clear of the player and all 4 exit rings; interaction prompt confirmed hidden at spawn and correctly shown only inside each object/NPC/exit radius.

**Checkpoint 2 — full nav sweep, and a real bug found along the way:**

Walked the full loop (Causeway → Croakend → Causeway → Lilymarket → Causeway → Mudwall → Causeway → Ferryman's Rest → Causeway), screenshotting every leg. Croakend's first screenshot immediately looked wrong — a flat repeating tan tile pattern with zero buildings, despite `croakend.webp` being a fully painted mud-hut courtyard (buildings, barrels, lanterns on all four sides, confirmed by inspecting the raw asset). This was not a "content gap" like Causeway — it was a real rendering bug hiding *finished art* in all 4 leaf districts.

**Root cause:** `SceneComposition.getViewExtents()` computed the camera's visible world height as `CAMERA_FRUSTUM_HALF_HEIGHT * 2` (22 units). But `IsometricCamera` already uses that same constant as the camera's *full* on-screen span (`top = +frustumSize/2`, `bottom = -frustumSize/2`, so visible height = `frustumSize` = 11, not `frustumSize * 2`). The constant's name is misleading but the camera math is correct — `getViewExtents` was silently doubling it. That made every backdrop plane 2x oversized in both dimensions (4x area), so the camera only ever showed a heavily zoomed-in crop of the exact center of each backdrop — every building, lantern, and market stall painted at the edges was scaled off-frame. This is almost certainly the real explanation for "the world looks empty" going back several sessions, independent of and in addition to Causeway's genuine lack of placed content.

**Fix:** `getViewExtents` now uses `CAMERA_FRUSTUM_HALF_HEIGHT` directly (1 line). Verified live: reloaded all 5 districts, every backdrop now shows its full painted scene — Causeway's crates/lanterns/reeds/lily-pond edges, Croakend's ring of mud huts and dock, Lilymarket's market stalls with awnings, Mudwall's domed stone temples, Ferryman's Rest's hut/jetty. Screenshots: `docs/playtests/screenshots/AR_{causeway_v3,croakend_v2,lilymarket_v2,mudwall_v2,ferrymans_rest_v2}.png`.

**Regression guard:** added 2 tests to `DistrictBackdrop.test.ts` — `getViewExtents` height must equal `CAMERA_FRUSTUM_HALF_HEIGHT` exactly, and `getBackdropSize` width must stay within the intentional 1.06x overscan margin instead of ballooning to ~2x.

**Side effect surfaced and fixed:** with the correct (wider) view now showing full backdrops, 3 NPC pairs that were previously "hidden" by the crop read as visually close: Lilymarket's 6 NPCs (now confirmed present simultaneously more often since AR-014's wraparound-schedule fix) and Mudwall's `tor_stoneback`/`kess_ridge`. Respread both using `projectToScreen` math (not eyeballing): Lilymarket NPCs now zigzag across the full walkable width alternating near/far z, worst-pair screen separation went from ~107-165px to ~145px; Mudwall's `tor_stoneback`/`kess_ridge` went from ~112px to ~147px. Not perfect — Lilymarket with 6 NPCs in a ~2.3-unit-deep band still has real geometric limits — but meaningfully better and screenshotted.

**Verified:** 105 unit tests (2 new) + 8/8 Playwright e2e + typecheck + build all green. Full 5-district round trip confirmed via `getState().sceneId` at every hop (not just visual inspection) — Causeway → Croakend → Causeway → Lilymarket → Causeway → Mudwall → Causeway → Ferryman's Rest → Causeway all landed on the correct scene id. Ferryman's Rest NPCs (night-only schedule) confirmed absent at hour 12 and present at hour 20 — correct per `npcs.json`, not a bug.

**Nick eye test still required:** yes — this is exactly the kind of composition fix that needs a real-display confirmation before V2/V3 can be called PASS by doctrine, not just agent-verified. Framing this alongside AR-014 as the concrete ask.

**Deployed:** redeployed to production and confirmed live at https://everden-chi.vercel.app (`?qa=1` boots straight into Causeway) — not just localhost screenshots. Checkpoint 3's ask to Nick is a real link he can open himself, not secondhand agent evidence.

---

### AR-016 detail (Intro arc: opening beat, control hint, title flavor, quest tracker, Pip dialogue fix)

Prompted by "what's logically next until we have an intro to test" — a subagent first mapped the actual new-player experience end to end and found a real gap: mechanically everything worked, but nothing acknowledged the player. Quest auto-granted silently at boot with the HUD showing raw ids (`Quest: what_water_remembers — cellar`), nobody greeted the player, no control hints existed, and Pip's dialogue still had a `start_quest` action that was dead code (quest was always already active by the time you could reach him).

**Fixes, in order:**

1. **Quest tracker readability** — `QuestManager` now emits `title`/`stageDescription` (looked up from `quests.json`) alongside every `quest:stage` event via a new `emitStage()` helper; `UIManager` reads them instead of raw `questId`/`stage`. HUD now reads `What the Water Remembers: Examine the flooded cellar in Lilymarket.` instead of `Quest: what_water_remembers — cellar`.
2. **Opening narration beat** — new `UIManager.showNarration(lines, onDone)` reuses the existing dialogue panel (so it locks player movement via the same `dialogue:opened`/`dialogue:closed` events `PlayerController` already listens for; no new interaction-locking logic needed). `GameBootstrap` fires it once, only on a brand-new save, right after the Causeway loads — 3 lines establishing premise (flooding, levy dispute, 7-day council vote) and nudging the player toward Lilymarket. Skipped entirely in QA mode (`?qa=1`) so e2e mechanical gates stay deterministic.
3. **First-time control hint** — `showToast` gained an optional `durationMs` param (default unchanged at 2000ms); the opening beat's `onDone` callback fires a 6-second toast: `Click to move · [E] to interact · [J] for journal`.
4. **Title screen flavor pass** — added a one-line premise blurb under the pronunciation guide, and a `SPECIES_BLURBS` map in `main.ts` that updates a new `#species-blurb` paragraph on every species button click (frog/toad/turtle/vole each get a one-line personality description, not just the combat role word).
5. **Pip dialogue fix** — the quest was already auto-granted at boot (kept intentionally — player should never wander with zero direction), so Pip's `quest_hook` node calling `start_quest` was a guaranteed no-op (`QuestManager.startQuest` guards on `activeStage.has(questId)`). Rewrote the choice text from "I'll look into it." to "I already heard — that's why I'm here." and the reply node (`already_knew`, replacing dead `quest_hook`) to "Word travels fast on the causeway, then. Start with the cellar marks..." — Pip now correctly acknowledges prior knowledge instead of pretending to hand out a fresh quest.

**Verified live, real click flow, no QA warp** (this matters — most of this session's other verification passes used `?qa=1` scene-jumping, which is fine for mechanics but can't verify an intro sequence that's explicitly skipped in QA mode):

- Title screen: premise blurb + species blurb confirmed updating live for frog and toad picks (screenshots `AR_intro_title.png`)
- Fresh save → clicked Enter → all 3 narration lines displayed in order, "Continue" on lines 1–2, "Begin" on line 3 (screenshot `AR_intro_opening_beat.png`)
- Control hint toast confirmed via direct DOM check (`textContent` = exact expected string) after round-trip latency had already auto-hidden it in screenshots — functionality confirmed, not just assumed
- Real click-to-move (no QA teleport) from Causeway to Lilymarket, then to Pip specifically — his dialogue showed the new choice text and reaction (screenshots `AR_intro_pip_choice.png`, `AR_intro_pip_reaction.png`)
- Quest tracker showed the human-readable title/description throughout, not raw ids, in every screenshot

**Not touched / explicitly out of scope this pass:** examine → journal → stage-advance chain (unchanged, already covered by the existing "four examines" e2e test), NPC walk-not-teleport, council quest chain, combat balance.

**Regression tests added:** `QuestManager.test.ts` (quest:stage payload includes title+description), `UIManager.test.ts` (×3 — `showNarration` line-stepping + `onDone`/`dialogue:closed` timing, empty-array short-circuit, `showToast` custom duration).

**Verified:** 110 unit tests (+4 from this session, +1 from the earlier combat-pause fix) + 8/8 Playwright e2e + typecheck + build all green.

**Deployed:** redeployed to production at https://everden-chi.vercel.app.

**Nick eye test:** the title-screen text and opening-beat panel are UI/copy, not composition/backdrop changes — lower visual risk than prior AR entries, but still worth a look since it's the first thing every player sees. Not blocking Experience % either way (this is UX/systems work, not a "did the art render correctly" fix).

---

### AR-017 detail (Character creation wizard + save v2 + D&D mechanics fixes)

User-approved full scope: tortoise as 5th species, name, arrival motivation, confirm stat/ability sheet, Continue/New Game with overwrite confirm.

**Shipped:**

1. **`TitleScreen.ts`** — multi-step wizard (species → name → motivation → confirm sheet); Continue journey when save exists; New game overwrite confirm.
2. **Five playable folk** — `species.json` `selectBlurb`/`selectRole`; tortoise shares turtle combat kit with distinct stats/copy.
3. **Player identity (save v2)** — `PlayerProfile.name`, `motivation`, `applyMotivationFlags()`; `SaveSystem` v2 with v1 migration.
4. **Flavored intro** — `OpeningNarration.ts` species + motivation lines; `{playerName}` in dialogue; Pip motivation `altText` append lines.
5. **D&D mechanical fixes** — crit doubles dice only; skill checks + diplomacy use flat DC (no nat 1/20 auto on checks); `COMBAT.md` flee wording corrected.
6. **QA fix** — `?qa=1&keep=1` now uses `mode: 'continue'` so save round-trip e2e stays green after title flow landed.

**Verified:** 120/120 unit tests, typecheck, build, 8/8 Playwright e2e (after QA continue fix).

**Nick eye test:** wizard UI + tortoise path not yet screenshot-verified in a real non-QA browser session this run (machine load ~200+). Use `docs/design/INTRO_AND_CHARACTER_CREATION.md` + updated MANUAL_CHECKLIST.

**Deployed:** pending this session's commit push.

---

### AR-018 detail (Wizard eye — tortoise / messenger non-QA path)

**Scope:** Non-`?qa=1` character creation: tortoise → name "River Test" → messenger motivation → confirm sheet → opening narration → Causeway.

**Verified:** Playwright `e2e/character-creation.spec.ts` (3 tests) + `e2e/ar018-screenshots.spec.ts` capturing:

- `AR_intro_wizard_tortoise_species.png`
- `AR_intro_wizard_tortoise_motivation.png`
- `AR_intro_wizard_tortoise_confirm.png`
- `AR_intro_wizard_tortoise_opening.png`
- `AR_intro_wizard_tortoise_causeway.png`

Save v2 profile asserts `species: tortoise`, `motivation: messenger`. Continue journey skips wizard + opening beat.

**Nick eye test:** UI/layout still needs human pass on real 16:9 display — mechanical path green.

---

### AR-019 detail (V4 quest-runner + combat-tester expansion)

**Added e2e coverage (PLAYTEST rows 7–11, 13 partial):**

1. Four examines advance main quest `cellar` → `council` + `evidence_gathered`
2. Kess INT History check → dice duel DOM
3. Kess frog species-exclusive line (`smell upstream silt`)
4. `completeQuestOutcome('expose')` completes main quest + `kess_stopped` flag
5. Blackfen combat: frog `leap` ability button visible + `combatUseAbility` smoke

**Harness:** `completeQuestOutcome`, `combatUseAbility`; council outcome flags in `qaGetState()`.

**Verified:** 16/16 Playwright e2e green (122 unit tests).

**Still human-only:** council UI walk-up, full PLAYTEST feel rows, Nick V2 composition.

---

## Template (copy for new runs)

```markdown
### AR-NNN — YYYY-MM-DD

| Field | Value |
|-------|-------|
| Agent | everden-visual-scout / fresh-player / quest-runner / combat-tester / district-explorer |
| Build | localhost:PORT / https://everden-chi.vercel.app |
| Fresh save | yes / no |
| Verdict | PASS / BORDERLINE / FAIL |

**Gates:** G1 ☐ G2 ☐ G3 ☐ G4 ☐ G5 ☐

**Screenshots:** docs/playtests/screenshots/AR-NNN-Gn.png

**FAIL reasons:**

**Friction (fresh-player):**

**PLAYTEST rows verified:**

**Nick eye test required:** yes / no — result:
```
