# WhiteThroated site color palette

Method: original proposal in fresh-palette mode (no extraction from any
existing website), revised 2026-11-18 to a user-supplied achromatic +
blue/orange palette applied as a values-only change. All RGB/HSL values and
WCAG ratios were computed with the `website-color-palette` skill helper
script (`colors` and `contrast` modes). The installed skill file only
documents extraction mode, so this report follows the task's fresh-palette
workflow and the skill's output schema instead; no page was downloaded and
no `extract` run was performed.

Token source of truth: [color-palette.json](./color-palette.json). Pages
reference these tokens through CSS variables only.

## Signature colors

| Name | HEX | RGB | HSL | Role |
|---|---|---|---|---|
| Signal Blue | `#0C4FEC` | 12, 79, 236 | 222, 90, 49 | Brand blue; chart bars, links on light |
| Signal Blue Light | `#60A5FA` | 96, 165, 250 | 213, 94, 68 | Brand blue on dark; chart bars, links |

## Link and interactive colors

Links reuse the signature blues: Signal Blue on light, Signal Blue Light on
dark. No separate link hue exists, so interactive text is always recognizable.

## Foundation ramp

| Name | HEX | RGB | HSL | Typical role |
|---|---|---|---|---|
| Paper | `#FFFFFF` | 255, 255, 255 | 0, 0, 100 | Light page background |
| Mist | `#F5F5F5` | 245, 245, 245 | 0, 0, 96 | Light surface, table headers |
| Fog Line | `#E5E5E5` | 229, 229, 229 | 0, 0, 90 | Light borders (decorative) |
| Ink | `#171717` | 23, 23, 23 | 0, 0, 9 | Light primary text |
| Gray Note | `#737373` | 115, 115, 115 | 0, 0, 45 | Light secondary text |
| Night Gray | `#1F1F1F` | 31, 31, 31 | 0, 0, 12 | Dark page background |
| Night Surface | `#262626` | 38, 38, 38 | 0, 0, 15 | Dark surface, table headers |
| Night Line | `#404040` | 64, 64, 64 | 0, 0, 25 | Dark borders (decorative) |
| Night Ink | `#EDEDED` | 237, 237, 237 | 0, 0, 93 | Dark primary text |
| Night Note | `#A3A3A3` | 163, 163, 163 | 0, 0, 64 | Dark secondary text |

Every neutral is achromatic (0% saturation).

## Accent and gate colors

| Name | HEX | RGB | HSL | Role |
|---|---|---|---|---|
| Ember Text | `#B15B10` | 177, 91, 16 | 28, 83, 38 | Highlight and mixed-gate text on light |
| Highlight Tint | `#FDF4EC` | 253, 244, 236 | 28, 81, 96 | Highlight wash on light |
| Ember Orange | `#ED8F3D` | 237, 143, 61 | 28, 83, 58 | Highlight and mixed-gate text on dark |
| Highlight Shade | `#503A26` | 80, 58, 38 | 29, 36, 23 | Highlight wash on dark |
| Gate Pass | `#0C4FEC` | 12, 79, 236 | 222, 90, 49 | `pass` text and badge fill on light |
| Gate Pass Tint | `#E7EDFD` | 231, 237, 253 | 224, 85, 95 | `pass` badge wash on light |
| Gate Mixed Tint | `#FDF4EC` | 253, 244, 236 | 28, 81, 96 | `mixed` badge wash on light |
| Gate Rejected | `#B3261E` | 179, 38, 30 | 3, 71, 41 | `rejected` text and badge fill on light |
| Gate Rejected Tint | `#F7E9E8` | 247, 233, 232 | 4, 48, 94 | `rejected` badge wash on light |
| Gate Pass Bright | `#60A5FA` | 96, 165, 250 | 213, 94, 68 | `pass` text on dark |
| Gate Pass Shade | `#2F3F54` | 47, 63, 84 | 214, 28, 26 | `pass` badge wash on dark |
| Gate Mixed Shade | `#503A26` | 80, 58, 38 | 29, 36, 23 | `mixed` badge wash on dark |
| Gate Rejected Soft | `#F2A49E` | 242, 164, 158 | 4, 76, 78 | `rejected` text on dark |
| Gate Rejected Shade | `#523F3D` | 82, 63, 61 | 6, 15, 28 | `rejected` badge wash on dark |

Raw `#ED8F3D` is never light-mode text (2.44:1 on white, fail); light mode
uses Ember Text `#B15B10` (same hue 28, 4.80:1). Raw `#0C4FEC` is never
dark-mode text (2.63:1 on `#1F1F1F`, fail); dark mode uses `#60A5FA` (6.48:1).

## Light and dark mode mapping

| Role | Light | Dark |
|---|---|---|
| Page background | Paper `#FFFFFF` | Night Gray `#1F1F1F` |
| Raised surface | Mist `#F5F5F5` | Night Surface `#262626` |
| Borders | Fog Line `#E5E5E5` | Night Line `#404040` |
| Primary text | Ink `#171717` | Night Ink `#EDEDED` |
| Secondary text | Gray Note `#737373` | Night Note `#A3A3A3` |
| Links | Signal Blue `#0C4FEC` | Signal Blue Light `#60A5FA` |
| Highlight text | Ember Text `#B15B10` | Ember Orange `#ED8F3D` |
| Highlight wash | Highlight Tint `#FDF4EC` | Highlight Shade `#503A26` |
| `pass` | Gate Pass on Pass Tint | Pass Bright on Pass Shade |
| `mixed` | Ember Text on Mixed Tint | Ember Orange on Mixed Shade |
| `rejected` | Gate Rejected on Rejected Tint | Rejected Soft on Rejected Shade |

The default follows `prefers-color-scheme`; a footer button cycles system →
light → dark, persisted in `localStorage` (`wt-theme`) and applied via
`data-theme` on `<html>`. The dark block in `src/styles/global.css` mirrors
these tokens exactly.

## Harmony analysis

Achromatic neutrals (0% saturation) carry every surface and all body text.
Exactly one chromatic pair sits on top: signal blue (hue 222) as primary,
links, and pass states, and ember orange (hue 28, near-complementary at 194
degrees apart) as the single warm accent for highlights and mixed states.
Gate red (hue 3–6) is reserved for rejected states only: hue carries verdict
meaning and is never decorative.

## WCAG contrast results

All text on main backgrounds meets AA. Four wash/surface pairs are sub-AA
(AA-large); they are graded honestly below and justified after the tables.

Light mode:

| Pair | Ratio | Grade |
|---|---|---|
| Ink / Paper | 17.93 | AAA |
| Gray Note / Paper | 4.74 | AA |
| Signal Blue / Paper | 6.28 | AA |
| Ember Text / Paper | 4.80 | AA |
| Ink / Mist | 16.44 | AAA |
| Gray Note / Mist | 4.35 | AA-large |
| Signal Blue / Mist | 5.76 | AA |
| Ink / Highlight Tint | 16.50 | AAA |
| White / Gate Pass | 6.28 | AA |
| White / Ember Text | 4.80 | AA |
| White / Gate Rejected | 6.54 | AA |
| Gate Pass / Pass Tint | 5.36 | AA |
| Ember Text / Mixed Tint | 4.42 | AA-large |
| Gate Rejected / Rejected Tint | 5.53 | AA |

Dark mode:

| Pair | Ratio | Grade |
|---|---|---|
| Night Ink / Night Gray | 14.08 | AAA |
| Night Note / Night Gray | 6.53 | AA |
| Signal Blue Light / Night Gray | 6.48 | AA |
| Ember Orange / Night Gray | 6.75 | AA |
| Night Ink / Night Surface | 12.93 | AAA |
| Night Note / Night Surface | 6.00 | AA |
| Signal Blue Light / Night Surface | 5.95 | AA |
| Pass Bright / Pass Shade | 4.21 | AA-large |
| Ember Orange / Mixed Shade | 4.35 | AA-large |
| Rejected Soft / Rejected Shade | 4.95 | AA |

Sub-AA justification (values are fixed by the supplied palette, so these
pairs are justified rather than re-derived): Gray Note on Mist (4.35) is
used only for table captions beside AAA-rated body text; the three badge
pairs — Ember Text on Mixed Tint (4.42), Pass Bright on Pass Shade (4.21),
Ember Orange on Mixed Shade (4.35) — are bold `gate: …` labels that always
appear next to the full verdict paragraph at AAA. All four sit within 0.3
of the 4.5 threshold; no pair fails.

## Design tokens as CSS variables

```css
:root {
  --wt-bg: #ffffff;
  --wt-surface: #f5f5f5;
  --wt-border: #e5e5e5;
  --wt-text: #171717;
  --wt-text-secondary: #737373;
  --wt-link: #0c4fec;
  --wt-signature: #0c4fec;
  --wt-highlight-text: #b15b10;
  --wt-highlight-wash: #fdf4ec;
  --wt-pass: #0c4fec;
  --wt-pass-wash: #e7edfd;
  --wt-mixed: #b15b10;
  --wt-mixed-wash: #fdf4ec;
  --wt-rejected: #b3261e;
  --wt-rejected-wash: #f7e9e8;
}
html[data-theme="dark"] {
  --wt-bg: #1f1f1f;
  --wt-surface: #262626;
  --wt-border: #404040;
  --wt-text: #ededed;
  --wt-text-secondary: #a3a3a3;
  --wt-link: #60a5fa;
  --wt-signature: #60a5fa;
  --wt-highlight-text: #ed8f3d;
  --wt-highlight-wash: #503a26;
  --wt-pass: #60a5fa;
  --wt-pass-wash: #2f3f54;
  --wt-mixed: #ed8f3d;
  --wt-mixed-wash: #503a26;
  --wt-rejected: #f2a49e;
  --wt-rejected-wash: #523f3d;
}
```

## Limits of the analysis

- This palette is newly proposed for a site with no live URL yet, so there
  was no production CSS to extract or audit.
- Chart bars reuse signature blues; their pair ratios are covered by the
  link/signature rows above.
- Border colors are decorative dividers, not text, and carry no grade.
