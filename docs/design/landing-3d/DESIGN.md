---
name: Diagrammatic Systema Preview
description: Scoped visual system for the isolated /landing-3d/ preview.
colors:
  ink: "#f4f3ee"
  surface: "#ebeae5"
  paper: "#151513"
  muted: "#686863"
  divider: "#d4d2ca"
  white: "#fff"
  black: "#151513"
  control-selected: "#dcdad2"
  surface-hover: "#e4e2dc"
  review-concern: "#e4b783"
  button-hover: "oklch(92% 0.004 286.32)"
  button-border: "oklch(37% 0.013 285.805)"
  button-outline-hover: "oklch(21% 0.006 285.885)"
  button-ghost: "oklch(87.1% 0.006 286.286)"
typography:
  display:
    fontFamily: "Inter, sans-serif"
    fontSize: "clamp(46px, 4.8vw, 69px)"
    fontWeight: 400
    lineHeight: 1.055
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Inter, sans-serif"
    fontSize: "clamp(34px, 3.2vw, 46px)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "15px"
    lineHeight: 1.85
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "11px"
rounded:
  control: "4px"
  button: "0.375rem"
  feature: "7px"
  menu: "8px"
spacing:
  control-gap: "8px"
  feature-gap: "16px"
  story-gap: "32px"
components:
  button-primary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.black}"
    rounded: "{rounded.button}"
    height: "2.75rem"
    padding: "0 1.25rem"
  button-primary-hover:
    backgroundColor: "{colors.button-hover}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.white}"
    rounded: "{rounded.button}"
    height: "2.75rem"
    padding: "0 1.25rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.button-ghost}"
    rounded: "{rounded.button}"
  phase-selected:
    backgroundColor: "{colors.control-selected}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "0 11px"
  feature:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.paper}"
    rounded: "{rounded.feature}"
    padding: "20px 28px 28px"
---

# Design System: Diagrammatic Systema Preview

## Overview

**Creative North Star: "Make the reasoning behind a system visible."**

This document applies only to the isolated `/landing-3d/` preview. It does not define Diagrammatic's global identity, replace the existing homepage, or authorize changes to other surfaces. The user selected [Systema](https://motionsites.ai/?prompt=systema) as the visual reference; the implementation adapts its restrained black-and-white composition to Diagrammatic's architecture-learning purpose.

A warm paper canvas, quiet Inter typography, and fine architectural lines put the diagram beside the argument. The signature is an original SVG URL-shortener walkthrough: Design, Review, Improve. The direction is code-led; there is no approved image comp or shipping raster asset to reproduce. The earlier landing experiment remains stashed separately.

**Key Characteristics:**

- Quiet monochrome surfaces with generous space around the main argument.
- A meaningful diagram that changes alongside the learning narrative.
- Compact controls, visible keyboard focus, and user-controlled motion.

Source of truth: `src/pages/Landing3D.tsx`, its direction-contract comment, `src/pages/Landing3D.css`, `src/components/landing3d/ArchitectureDiagram.tsx`, and `src/components/ui/button.tsx`. Button utility values come from the installed Tailwind theme. Product purpose is grounded in the parent workspace's `PRODUCT.md`. Final finishing review: PASS for this scoped preview, with all seven findings resolved. Accepted limitation at 1440 × 768: the phase buttons touch the fold and the insight text sits below it. This document records source values; rendered QA evidence remains with the finishing review.

## Colors

The palette is nearly monochrome, with warmth reserved for the question raised during review.

### Primary

- **White action:** primary calls to action use white against near-black text; hover softens the surface.
- **Paper:** the paper canvas carries the page while near-black headlines and primary labels provide contrast.

### Neutral

- **Ink:** continuous page canvas and light scrollbar track.
- **Surface:** understated feature panels; hover increases tonal separation.
- **Muted:** explanatory text and secondary navigation.
- **Divider:** thin section and toolbar boundaries.
- **Control selected:** communicates the current walkthrough phase together with `aria-pressed`.

The review-concern color marks repeated database reads and the insight dot. It is a local semantic state, not a new brand accent. Node labels explicitly have no stroke so highlighting a parent group does not thicken the text.

## Typography

Inter is the sole display and body family, with a sans-serif fallback. Regular-weight headlines carry the visual hierarchy through size and tight tracking; muted continuation lines temper their emphasis. The frontmatter records desktop roles, not an invented global type scale.

Body copy is limited to a readable column (395px on desktop, 500px below 900px). Feature titles use regular weight (17px); their descriptions are smaller (12px, line-height 1.8). Phase numbers use tabular numerals. At 600px and below, the hero uses `clamp(42px, 10.8vw, 63px)` with line-height 1.09, section headings use 35px, and body copy uses 14px with line-height 1.8.

## Layout

Desktop content is centered within `min(1280px, calc(100% - 112px))`. The narrative uses a two-column grid (0.95fr / 1.15fr): left copy and a right diagram spanning three story rows. The stage stays sticky at `max(25px, calc((100svh - 620px) / 2))`. Review and Improve each have a 640px minimum height; capabilities follow as three equal panels.

At 1100px and below, horizontal gutters narrow to 32px per side. Below 900px, the layout becomes one column: hero, diagram, Review, Improve. The diagram is no longer sticky and phase selection is manual; scrolling lower copy must not change a diagram above the viewport. Navigation becomes a menu, and the diagram stage is capped at 620px. At 600px and below, gutters become 20px per side, feature panels stack, and secondary diagram details disappear while node labels grow. At 360px and below, the header CTA hides to preserve the brand and menu.

## Elevation & Depth

The page is flat: no box shadows, glass, gradients, or floating-card effects. Depth comes from slightly lighter panels, hairline borders, and the diagram's dotted field and dashed application boundary. Do not extrapolate this preview's material treatment into a global product rule.

## Shapes

Compact rounded rectangles carry controls and panels; the frontmatter records their actual radii. Diagram geometry communicates meaning: server racks, cylindrical storage, a circular balancer, and thin directed connectors. Node outlines are restrained (1.1 SVG units); connector lines are 1.3 units. The artwork uses a `650 × 540` viewBox and scales with its column.

## Components

**Buttons.** The shared button primitive supplies default, outline, and ghost variants. Heights are 44px default, 36px small, and 48px large; icon controls are 44px square before narrow-screen overrides. Primary actions lead to `/problems/`; the outline action leads to `/problems/url-shortener-like-bit-ly/`. Hover changes color without lifting or scaling. Route-local keyboard focus is a paper outline (2px, offset 5px).

**Navigation.** Muted text links brighten on hover. The mobile menu reports its expanded state, closes on selection, and closes with Escape while returning focus to the toggle. A skip link provides direct access to the main content. Learning-path and problem links are real routes.

**Walkthrough.** Three numbered buttons expose Design, Review, and Improve with `aria-pressed`; a polite live region describes the current insight. Desktop section visibility updates the phase. Manual controls work at every width. Review highlights the repeated read path; Improve adds a cache and a database path for cache misses. The diagram is labeled as an illustrative walkthrough, not a live user design or measured performance result.

**Motion.** Request packets traverse the diagram in a linear five-second loop; the added database path appears over 500ms. The pause button pauses packet flow. Reduced-motion preference removes animations and transitions and hides the redundant motion control; phase changes remain available. See the scoped sidecar for exact motion values.

**Feature panels.** Three linked panels use original inline SVG illustrations and concise supporting copy. They link to practice problems, learning paths, and the example problem. They are navigation surfaces, not invented metrics or testimonials.

## Do's and Don'ts

- **Do** preserve the preview's route boundary and the existing homepage.
- **Do** keep the diagram's request path, review concern, and cache trade-off understandable.
- **Do** retain keyboard focus, manual phase controls, pause, and reduced-motion behavior.
- **Do** use original code-native SVG geometry and document provenance if raster assets are later added.
- **Don't** imply this illustrative walkthrough is a live assessment or benchmark.
- **Don't** replace meaningful architecture with an unrelated decorative animation.
- **Don't** promote this route's composition or palette into a global product redesign.

The companion `.impeccable/design.json` lives inside this same documentation folder deliberately. It extends this preview record only; it is not installed as the project's global Impeccable design system.
