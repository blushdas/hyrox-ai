---
name: finisher-logo
description: Logo system for FINISHER. A four-segment race-clock F in one green on near-black, with a caps wordmark. No AI signifiers, no HYROX styling.
status: proposed
colors:
  mark: "#3DDC84"
  mark-ink: "#04140A"
  tile: "#0A0B0A"
  wordmark-rest: "#FFFFFF"
  mono-light: "#FFFFFF"
  mono-dark: "#04140A"
geometry:
  grid: "6u wide x 8u tall"
  stroke: "2u"
  gap: "0.25u"
  mid-arm-length: "3u (ends 1u short of the top arm)"
  optical-shift: "0.35u right, 0.4u down from bounding-box centre"
scale:
  app-icon-mark-height: "52% of canvas"
  android-adaptive-mark-height: "44% of canvas"
  favicon-mark-height: "75% of canvas"
  solid-variant-below: "64px canvas"
wordmark:
  text: "FINISHER"
  fontFamily: "Geist, system-ui, sans-serif"
  fontWeight: 600
  letterSpacing: "-0.025em"
  case: "uppercase"
motion:
  splash: "900ms, existing wordmark mask-expand, unchanged"
  segment-step: "150 to 250ms, ease-out-expo, opacity only"
---

# Logo Design: FINISHER

This file specifies the logo. The app design system lives in the root `DESIGN.md`; where the two disagree on a token, see section 2.4.

Assumption: "how the app should work" is taken from `PRODUCT.md`, the root `DESIGN.md` and the shipped code. Nothing here comes from a separate brief.

## 1. Overview

**Creative North Star: "The Race Clock F"**

The app's north star is the race clock: tight, tabular, decisive. The logo is the first letter of the name drawn as a character on that clock. An F on a seven-segment display uses exactly four segments (top bar, upper stem, mid bar, lower stem). Those four segments are the mark.

Why this fits the product:

- **Glanceable first.** A block F in one colour on near-black is readable on a home screen, in a tab strip and through gym sweat. It is already the shipped icon, so recognition carries over.
- **AI work is visible but restrained.** Plan generation shows three named stages plus "ready" (`planStages` in `src/lib/motion.ts`). Four segments can light one per stage, so the logo shows staged work instead of a sparkle or shimmer. Today those stages run on a fixed 800ms timer, not on real generation events (see section 7).
- **One go signal.** The mark is the same green as every actionable element in the app. It introduces no second brand colour.
- **Finisher, not starter.** The last segment to light is the mid bar, which closes the letter. The mark completes when the work completes.

**Key characteristics:**

- One flat colour, no gradient, no glow, no shadow.
- Built on a 6 x 8 unit grid with a 2 unit stroke.
- Segmented at display sizes, solid at small sizes.
- Upright. No italic lean, no speed lines.

## 2. Current-State Audit

Measured from the repo on 2026-11-25.

### 2.1 What ships today

| Surface | File | State |
|---|---|---|
| PWA icons (192, 512, maskable 512, apple-touch 180) | `public/icons/*` | Solid block F, `#3DDC84` on `#0A0B0A`, on all four files. Glyph is 215 x 267 px on the 512 canvas (52% of height), stroke about 62 to 67 px; the 192 and 180 files are the same drawing scaled. |
| Wordmark | `src/components/shared/logo.tsx` | Live text, Geist 600, tight tracking. Green F, white INISHER. |
| Web cold-start splash | `src/app/globals.css` (`.motion-splash*`) | The whole wordmark (all eight letters) filled with accent green, scale 1 to 0.8 to 40 over 900ms, then fade. |
| In-app placements | sidebar, sign-in, onboarding header, plan loader | Wordmark only. The symbol never appears inside the app. |

### 2.2 Defects found

1. **iOS app icon is the Capacitor placeholder.** `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` is the blue cross on a white grid, not the F. Any native build ships with it.
2. **Favicon is not the brand.** `src/app/favicon.ico` has one commit, the initial one, and renders as a black disc with a white shape. It looks like the framework default. Browser tabs do not show the F.
3. **Native splash does not match the web splash.** Both show an all-green wordmark, but the iOS image uses a different typeface, `#22C55E` and a `#0F1A0E` ground. The web splash is Geist, `#3DDC84` on `#0A0B0A`. The hand-off from one to the other shifts typeface, green and ground.
4. **Maskable icon reuses the "any" icon.** It passes the PWA safe zone today (farthest glyph corner is 171 px from centre against a 204.8 px limit) but would exceed the tighter Android adaptive safe zone if reused there.
5. **No vector source.** The F exists only as PNGs. There is no SVG master and no icon generator in `scripts/`.

### 2.3 Hard constraints the logo must meet

- **Works as a flat fill.** The splash paints the logo as one flat green fill and scales it 40x. Whatever is used there must be a single-colour shape with no internal detail that matters at that scale.
- **16 px legibility.** The favicon is the smallest use, followed by the small system icon sizes on iOS ([I] about 58 px for Settings at 2x).
- **Circle-safe.** Android and PWA launchers crop to a circle or squircle.
- **Single-colour reducible.** iOS tinted and clear modes and Android themed icons recolour a monochrome layer.

### 2.4 Token drift (resolved for this file)

Root `DESIGN.md` documents `#22C55E`, Inter and `#0A0A0A`. Shipped CSS and icons use `#3DDC84`, Geist and `#0A0B0A`. This file follows the shipped values because they are what athletes see. Root `DESIGN.md` should be corrected separately.

## 3. Research

Findings marked **[S]** are sourced (links under Sources at the end). Findings marked **[I]** are inference or recalled knowledge and should be checked before they are relied on.

### 3.1 Platform rules

- **[S] iOS and iPadOS icons are layered.** A background layer plus one or more foreground layers, composed in Icon Composer, with system-applied Liquid Glass effects. Appearance modes to test: default, dark, clear (light and dark), tinted (light and dark). A single mono annotation can serve the clear and tinted modes. Apple recommends vector (SVG) layers. Xcode generates flat icons for older OS versions.
- **[S] PWA maskable icons** keep important content inside a centred circle with a radius of 40% of the icon width. The outer 10% may be cropped.
- **[S] Android adaptive icons** use a 108 x 108 dp canvas with a centred 66 dp safe zone. Themed icons (Android 13 and later) need a monochrome layer. From Android 16 QPR2 the system themes icons automatically when the layer is missing.
- **[S] SVG favicons** can switch colours with `prefers-color-scheme`, but the query follows the OS setting, not the site theme, and Safari support has been unreliable. A favicon should hold up on both near-white and near-black tab backgrounds.
- **[I]** A flat one-colour glyph on a solid tile is the lowest-risk shape for all of the above. It needs no per-mode redraw.

### 3.2 HYROX brand constraints

- **[S]** HYROX World owns the HYROX trademark. Its published terms bar using the name or logo in a way that suggests partnership, sponsorship, endorsement or affiliation without written consent.
- **[S]** Its affiliate brand guidelines bar putting the HYROX name into digital identifiers and business names. These rules are written for affiliates. No public policy for independent apps was found.
- **[I]** HYROX's own identity is black with yellow. Green on near-black keeps clear of it.
- **Implication for the logo:** no HYROX wordmark, no yellow, no lockup that pairs FINISHER with HYROX. See section 8 for two identifiers outside the logo that carry the same risk.

### 3.3 Category scan

- **[S]** An older App Store app is already named "Finisher" (multi-sport endurance plans, apparently unmaintained). No trademark search was run. The name alone will not distinguish the product in a store listing, so the icon has to.
- **[S]** Current HYROX-focused apps include ROXFIT, TrainRox, Formd, Enduroco and the official Centr programmes. Roundups describe ROXFIT as a race companion without multi-week plans. None was clearly described as an AI coach grounded in a plan.
- **[I]** Reference apps named in `PRODUCT.md`: Strava is orange, WHOOP is black and white, Nike Run Club is black with a white mark. A green letter on black is distinct inside the fitness shelf. Outside it, Spotify also uses green on black.
- **[I]** `#3DDC84` is the same hex as Android's brand green. On an Android home screen a green block glyph may read as a system app. This is a reason to draw a distinctive shape, and a reason to revisit the hex if Android becomes a primary platform.
- **[I]** A plain block F is generic (many apps use a single capital). The segment cuts are what make this F ownable.

### 3.4 What the research rules out

- Sparkles, orbs, gradients, chat bubbles or any "AI" signifier (anti-reference in `PRODUCT.md`).
- A runner figure, sled, kettlebell or finish-flag pictogram. These are category clichés and fail at 16 px.
- Medals, laurels, badges (gamified clutter).
- An italic or speed-line treatment. The clock is upright.

## 4. The Mark

### 4.1 Construction

Unit `u`. The mark sits in a box 6u wide and 8u tall, origin top-left. Stroke is 2u. Gap is 0.25u.

Solid form (one path):

```
(0,0) (6,0) (6,2) (2,2) (2,3) (5,3) (5,5) (2,5) (2,8) (0,8)
```

Segmented form (four paths, named after seven-segment positions):

```
A  top bar      (0.25,0) (6,0) (6,2) (2.25,2)
F  upper stem   (0,0.25) (2,2.25) (2,3.875) (0,3.875)
G  mid bar      (2.25,3) (5,3) (5,5) (2.25,5)
E  lower stem   (0,4.125) (2,4.125) (2,8) (0,8)
```

The A and F segments meet on a 45 degree mitre at the top-left corner. That diagonal is the signature detail. The mid bar is 1u shorter than the top bar.

Reference SVG (viewBox in units x 100):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" fill="#3DDC84">
  <path d="M25 0H600V200H225Z"/>
  <path d="M0 25L200 225V387.5H0Z"/>
  <path d="M225 300H500V500H225Z"/>
  <path d="M0 412.5H200V800H0Z"/>
</svg>
```

This geometry was proof-rendered at 512, 180, 120, 58, 32 and 16 px. It has not been refined by a designer. Treat the numbers as the starting construction, not a final drawing.

### 4.2 Size tiers

| Canvas | Form | Mark height |
|---|---|---|
| 64 px and up (app icons, splash art, store art) | Segmented | 52% of canvas |
| Below 64 px (favicon, tab, notification) | Solid | 75% of canvas |
| Android adaptive foreground and monochrome | Segmented | 44% of canvas |

[I] On iOS the system scales the master down to about 58 px for Settings. At that size the gaps are about 1 px and close up toward the solid form. That is acceptable.

### 4.3 Placement

Centre the bounding box on the canvas, then shift 0.35u right and 0.4u down. The F is heavy at top-left and looks off-centre without the shift. At 52% height with the shift, the farthest corner is 36% of the canvas from centre, inside the 40% maskable limit.

### 4.4 Clear space and minimum size

- Clear space: 2u (one stroke) on every side, measured from the bounding box.
- Minimum size: solid form 12 px tall, segmented form 32 px tall.

### Named Rules

**The Four Segments Rule.** The mark is always four segments or one solid shape. Never three, never five, never an outline.
**The Small Means Solid Rule.** Below a 64 px canvas, use the solid form. Hairline gaps that blur are worse than no gaps.

## 5. Colour

| Use | Mark | Ground | Contrast |
|---|---|---|---|
| Primary | `#3DDC84` | `#0A0B0A` | 11.05:1 |
| Reversed tile | `#04140A` | `#3DDC84` | 10.61:1 |
| Mono on dark | `#FFFFFF` | any dark | n/a |
| Mono on light | `#04140A` | `#FFFFFF` | 18.93:1 |

Green on white is 1.78:1 and is not allowed. On a light surface, use the primary tile (green F on its own near-black square) or the mono-on-light form.

### Named Rules

**The Go Signal Rule.** The mark green is the app's accent token. If the accent changes, the logo changes with it. The logo never gets its own green.
**The Flat Mark Rule.** No gradient, glow, bevel, stroke or shadow on the mark. Platform effects (Liquid Glass, themed tint) are applied by the OS, never baked in.

## 6. Wordmark and Lockups

- **Wordmark:** FINISHER, uppercase, Geist 600, tracking -0.025em. The F is mark green, INISHER is white. This is the shipped treatment and stays.
- **Wordmark F:** a normal Geist F, not the segmented mark. The segmented F is for the symbol only.
- **Static uses** (native splash, store art, OG image, email): outline the wordmark to SVG paths so it does not depend on font loading. In-app chrome can stay live text because Geist is loaded by `next/font`.
- **Mono wordmark:** all white on dark, all `#04140A` on light.
- **Lockups:** symbol alone, or wordmark alone. Symbol above wordmark is allowed for store and splash art, with a gap of 4u. Symbol beside wordmark is not allowed.

### Named Rules

**The No Double F Rule.** Never place the symbol directly left of the wordmark. It reads as "F FINISHER".
**The No Descriptor Rule.** The logo carries no tagline and no "AI", "HYROX" or "Training" suffix. Descriptors live in body copy.

## 7. Motion

Motion follows the root system: 150 to 250ms, ease-out-expo, transform and opacity only.

- **Cold-start splash (900ms, existing).** Stays as shipped: the all-green wordmark with the current mask-expand. Segments do not animate here, because the splash must not delay the first glance. Swapping the wordmark for the solid symbol is a possible later change and needs its own test of the 40x expand.
- **Plan generation.** Segments start at 12% opacity and step to 100% one per stage: E (lower stem) for "Reading your profile", F (upper stem) for "Building your 12 weeks", A (top bar) for "Scheduling sessions", G (mid bar) for "Your plan is ready". Each step is a 200ms opacity change on the stage boundary, never a loop. The loader is currently driven by elapsed time (`planSequence(elapsed)`, 800ms per stage), so the segments would follow that timer at first. Wiring the stages to real generation events is a prerequisite for the rule below to be true.
- **Coach AI.** No animated logo while streaming. The existing thinking indicator covers it.
- **Reduced motion.** Show the full mark at once; progress is carried by the stage labels.

### Named Rules

**The Real Progress Rule.** Target behaviour: a segment lights only when a real stage completes. In every case the mark never pulses, spins or shimmers on a loop.

## 8. Exports and Follow-ups

Required assets, all generated from one SVG master:

| Asset | Spec |
|---|---|
| `logo-mark.svg`, `logo-mark-solid.svg` | Masters, viewBox 600 x 800 |
| iOS app icon | Icon Composer file: background layer `#0A0B0A`, one foreground group (segmented mark), mono annotation for clear and tinted. [I] 1024 px master with no baked corner radius; confirm against the current Apple page. |
| PWA icons | 192, 512 ("any"), 512 maskable, apple-touch 180. Segmented, 52%. |
| Favicon | `icon.svg` (solid, 75%, on its own near-black rounded tile so it survives light tab bars) plus a 32 px `.ico` fallback |
| Android adaptive (when needed) | 108 dp foreground and monochrome at 44%, background `#0A0B0A` |
| Native splash | Outlined Geist wordmark, all `#3DDC84`, on `#0A0B0A`, matching the first frame of the web splash |
| OG / store art | Symbol above wordmark on `#0A0B0A` |

Open items outside the logo, found during research:

- The bundle ID `ai.hyrox.finisher` and the page title "FINISHER — HYROX Training App" put the HYROX name in product identifiers. The manifest description says "Built from the official coaching manual". HYROX's published rules restrict this kind of use for affiliates. Get a legal read before store submission.
- An App Store app named "Finisher" already exists. Run a trademark and store-name check before listing.
- Root `DESIGN.md` and `DESIGN.json` still document `#22C55E`, Inter and `#0A0A0A`.

Alternates considered and not chosen: keep the plain block F (zero work, but generic and not ownable); a finish-tape or flag pictogram (cliché, fails at 16 px).

## 9. Do's and Don'ts

### Do:
- **Do** use the segmented form at 64 px and up and the solid form below.
- **Do** keep the mark in the accent green on near-black, or in a single mono colour.
- **Do** keep 2u of clear space around the mark.
- **Do** tie segment lighting to stage boundaries, and to real generation events once they exist.
- **Do** generate every raster from the SVG master.

### Don't:
- **Don't** add sparkles, orbs, gradients, glows or any AI signifier.
- **Don't** use yellow, the HYROX name or any HYROX styling in or next to the logo.
- **Don't** slant, outline, round or rotate the mark, or change the stroke weight.
- **Don't** put the green mark directly on white or on a photo without the near-black tile.
- **Don't** place the symbol beside the wordmark.
- **Don't** fill segments with session-type hues.
- **Don't** animate the mark on a loop.

## Sources

- Apple, Human Interface Guidelines: App icons — https://developer.apple.com/design/human-interface-guidelines/app-icons
- Apple, Creating your app icon using Icon Composer — https://developer.apple.com/documentation/xcode/creating-your-app-icon-using-icon-composer
- Apple, WWDC25 session 361 (app icon appearance modes) — https://developer.apple.com/videos/play/wwdc2025/361
- web.dev, Adaptive icon support in PWAs with maskable icons — https://web.dev/articles/maskable-icon
- Android Developers, Adaptive icons — https://developer.android.com/develop/ui/views/launch/icon_design_adaptive
- web.dev, Building an adaptive favicon — https://web.dev/articles/building/an-adaptive-favicon
- HYROX365, Brand Guidelines — https://www.hyrox365.com/meta-pages/brand-guidelines
- HYROX365, Terms and Conditions — https://www.hyrox365.com/meta-pages/terms-and-conditions
- App Store, "Finisher" — https://apps.apple.com/us/app/finisher/id834762134
- Roundups used for the category scan (several are written by the apps they rank) — https://roxgrit.com/best-training-apps-for-hyrox/ , https://www.fitvizpro.com/blog/hyrox-training-app , https://www.ccomplete.app/guides/best-hyrox-training-apps

Platform rules were taken from search summaries of these pages on 2026-11-25. Re-read the Apple and Android pages for exact export sizes before producing assets.
