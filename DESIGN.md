---
name: hyrox-ai
description: Dark, flat, stopwatch-sharp training app for HYROX athletes. One green go signal on near-black surfaces.
colors:
  primary: "#22C55E"
  primary-deep: "#16A34A"
  on-primary: "#000000"
  background: "#0A0A0A"
  nav-surface: "#0D0D0D"
  surface: "#111111"
  surface-alt: "#161616"
  border: "#1F1F1F"
  divider: "#1A1A1A"
  text: "#FFFFFF"
  text-muted: "#6B7280"
  text-faint: "#3D3D3D"
  destructive: "#EF4444"
  session-engine: "#3B82F6"
  session-threshold: "#F97316"
  session-stations: "#EF4444"
  session-race-sim: "#8B5CF6"
  session-recovery: "#22C55E"
  session-rest: "#374151"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.15
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.45
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 500
    letterSpacing: "0.05em"
rounded:
  sm: "0.225rem"
  md: "0.3rem"
  lg: "0.375rem"
  xl: "0.525rem"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.lg}"
    height: "32px"
    padding: "0 10px"
  button-secondary:
    backgroundColor: "{colors.surface-alt}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    height: "32px"
  session-row:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
    padding: "14px 16px"
  bottom-nav:
    backgroundColor: "{colors.nav-surface}"
    textColor: "{colors.text-muted}"
    height: "64px"
  bottom-nav-active:
    textColor: "{colors.primary}"
---

# Design System: hyrox-ai

## 1. Overview

**Creative North Star: "The Race Clock"**

Everything reads like a stopwatch: tight, tabular, decisive. The surface is near-black and flat. A single green (#22C55E) is the go signal and appears only where the athlete should act or where something is live. Session types get their own hue as a small dot, never as a fill. The design serves a gym-side glance: today's session is readable in under two seconds, and motion confirms state rather than decorating it.

The system is sharp, fast, athletic, with momentum but no noise. It explicitly rejects generic SaaS or AI slop (purple gradients, sparkle icons, chatbot shimmer) and gamified clutter (confetti, XP bars, popping badges). Motion is never bouncy and never cinematic-slow.

**Key Characteristics:**
- Flat, tonal layering with hairline borders; no resting shadows.
- One accent, green, used sparingly and only for go/active/live.
- Compact type on a 14px body, tabular numerals for times and counts.
- Motion is 150 to 250ms, exponential ease-out, and collapses to a plain fade under `prefers-reduced-motion`.
- One-handed, thumb-reachable controls; the bottom nav is the primary navigation on mobile.

## 2. Colors

Near-black tonal stack with a single green go signal and six session-type hues used as small markers.

### Primary
- **Go Green** (#22C55E): Primary buttons, active nav item, focus ring, progress fill, live/today markers. Primary text on it is black (#000000).
- **Deep Go Green** (#16A34A): Pressed or darker companion where the base green needs weight.

### Secondary
- **Session hues**: Engine Builder Blue (#3B82F6), Threshold Orange (#F97316), Stations Red (#EF4444), Race Sim Violet (#8B5CF6), Recovery Green (#22C55E), Rest Slate (#374151). Used only as a 6px dot or a thin chart series, never as a card fill.

### Neutral
- **Void Black** (#0A0A0A): App background.
- **Nav Black** (#0D0D0D): Sidebar and bottom nav surface.
- **Panel Black** (#111111): Cards and popovers.
- **Lift Black** (#161616): Secondary buttons, muted fills, hover-adjacent surfaces.
- **Hairline** (#1F1F1F): Borders and inputs. **Divider** (#1A1A1A): list row separators.
- **White** (#FFFFFF): Primary text. **Muted Slate** (#6B7280): Secondary text and inactive icons. **Faint** (#3D3D3D): Skipped or disabled text.
- **Alert Red** (#EF4444): Destructive actions and errors only.

### Named Rules
**The One Go Signal Rule.** Green marks what is active, live, or actionable, and covers well under 10% of any screen. If green is everywhere, nothing is the go signal.
**The Marker Not Fill Rule.** Session-type hues appear as dots and chart strokes. They never flood a row or card.

## 3. Typography

**Display Font:** Inter (with system-ui fallback)
**Body Font:** Inter (with system-ui fallback)
**Label/Mono Font:** Inter with tabular numerals (`.tnum`); Geist Mono is available as `--font-mono`.

**Character:** One neutral, technical sans at compact sizes. Hierarchy comes from weight and size steps, not from a second typeface.

### Hierarchy
- **Display** (700, 1.875rem, 1.15): Race countdown and hero numbers only.
- **Headline** (600, 1.5rem, 1.2): Page titles.
- **Title** (600, 1.25rem, 1.25): Section and card headings.
- **Body** (500, 0.875rem, 1.45): Rows, descriptions, most UI text. Cap long text at 65 to 75ch.
- **Label** (500, 0.625rem to 0.75rem, +0.05em, uppercase for status): Nav labels, "Done" and "Skip" tags.

### Named Rules
**The Tabular Rule.** Any number that changes or is compared (times, weights, counts, countdowns) uses tabular numerals so digits never jitter.

## 4. Elevation

Flat by default. Depth comes from tonal steps (#0A0A0A to #111111 to #161616) and 1px hairline borders, not shadows. The one allowed lift is the center FAB in the bottom nav, which carries a dark ambient shadow so it reads as above the bar.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows appear only on the FAB and, if introduced, on overlays that must sit above the page. If a card has a visible shadow at rest, remove it.

## 5. Components

Compact, confident, and quiet. Controls are small (32px default height) with a 6px radius.

### Buttons
- **Shape:** Gently squared (6px radius, `rounded-lg`); default height 32px, icon sizes 24 to 36px.
- **Primary:** Go Green fill with black text; hover lowers opacity to 80%.
- **Hover / Focus:** Focus shows a 3px green ring at 50% alpha and a green border. Disabled drops to 50% opacity.
- **Secondary / Ghost:** Lift Black fill, or transparent with a muted hover fill. Destructive is a tinted red, not a solid red.

### Cards / Containers
- **Corner Style:** 6px radius.
- **Background:** Panel Black (#111111) on Void Black.
- **Shadow Strategy:** None at rest (see Elevation).
- **Border:** 1px Hairline.
- **Internal Padding:** 16px.

### Inputs / Fields
- **Style:** Hairline (#1F1F1F) stroke, dark fill, 6px radius.
- **Focus:** Green border and 3px green ring at 50% alpha.
- **Error / Disabled:** Red border and 20% red ring on invalid; 50% opacity when disabled.

### Navigation
- **Mobile bottom nav:** 64px tall, Nav Black with a 1px divider on top. Three destinations plus a raised green circular FAB in the center. Active item turns green with a 2px green top edge; inactive items are Muted Slate at 10px labels.
- **Desktop sidebar:** 240px wide, Nav Black, hairline right border. Active item shows a 6px green dot at the right edge.

### Session Row (signature)
- **Style:** Full-width list row, 14px vertical and 16px horizontal padding, Divider bottom rule. A 6px session-type dot on the left, title in 14px medium white, day and duration in 12px muted. Status ("Done", "Skip") is a 10px uppercase label on the right.
- **State:** Hover adds a 3% white wash. Today is marked by a green accent (currently a left edge; prefer a green dot or "Today" label instead of a side stripe).

## 6. Do's and Don'ts

### Do:
- **Do** keep the green (#22C55E) as the only accent and reserve it for active, live, or actionable elements.
- **Do** show real progress in loaders: named stages for AI plan generation, skeletons shaped like the content they replace.
- **Do** keep transitions 150 to 250ms with exponential ease-out; animate `transform` and `opacity` only.
- **Do** honor `prefers-reduced-motion` by collapsing every animation to a plain fade or instant change.
- **Do** use tabular numerals for times, counts, and countdowns.
- **Do** build depth from tonal steps and 1px hairlines.

### Don't:
- **Don't** use generic SaaS or AI slop: purple gradients, sparkle icons, or chatbot shimmer.
- **Don't** add gamified clutter: confetti, XP bars, or popping badges.
- **Don't** use bouncy or playful easing, and don't use slow cinematic fades that make a gym-side tap feel laggy.
- **Don't** use `border-left` or `border-right` wider than 1px as a colored accent on rows or cards.
- **Don't** put a shadow on cards or rows at rest.
- **Don't** fill rows or cards with session-type hues; keep them to dots and chart strokes.
- **Don't** animate layout properties (width, height, top, left, margin).
- **Don't** block input during an animation; taps must register immediately.
