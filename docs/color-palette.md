# WhiteThroated site color palette

Method: original proposal in fresh-palette mode (no extraction from any
existing website). All RGB/HSL values and WCAG ratios were computed with the
`website-color-palette` skill helper script (`colors` and `contrast` modes)
on 2026-11-18. The installed skill file only documents extraction mode, so
this report follows the task's fresh-palette workflow and the skill's output
schema instead; no page was downloaded and no `extract` run was performed.

Token source of truth: [color-palette.json](./color-palette.json). Pages
reference these tokens through CSS variables only.

## Signature colors

| Name | HEX | RGB | HSL | Role |
|---|---|---|---|---|
| Deep Pine | `#175c3a` | 23, 92, 58 | 150, 60, 23 | Brand green; chart bars, links on light |
| Pine Light | `#7fcfa0` | 127, 207, 160 | 145, 45, 65 | Brand green on dark; chart bars, links |

## Link and interactive colors

Links reuse the signature greens: Deep Pine on light, Pine Light on dark.
No separate link hue exists, so interactive text is always recognizable.

## Foundation ramp

| Name | HEX | RGB | HSL | Typical role |
|---|---|---|---|---|
| Paper | `#ffffff` | 255, 255, 255 | 0, 0, 100 | Light page background |
| Mist | `#eef2f0` | 238, 242, 240 | 150, 13, 94 | Light surface, table headers |
| Fog Line | `#d8dfdc` | 216, 223, 220 | 154, 10, 86 | Light borders (decorative) |
| Ink | `#17201d` | 23, 32, 29 | 160, 16, 11 | Light primary text |
| Slate Note | `#47534e` | 71, 83, 78 | 155, 8, 30 | Light secondary text |
| Night Pine | `#0f1513` | 15, 21, 19 | 160, 17, 7 | Dark page background |
| Night Surface | `#1a2220` | 26, 34, 32 | 165, 13, 12 | Dark surface, table headers |
| Night Line | `#2e3a36` | 46, 58, 54 | 160, 12, 20 | Dark borders (decorative) |
| Night Ink | `#e9eeec` | 233, 238, 236 | 156, 13, 92 | Dark primary text |
| Night Note | `#a7b4af` | 167, 180, 175 | 157, 8, 68 | Dark secondary text |

## Accent and gate colors

| Name | HEX | RGB | HSL | Role |
|---|---|---|---|---|
| Amber Text | `#9a5b00` | 154, 91, 0 | 35, 100, 30 | Highlight and mixed-gate text on light |
| Highlight Tint | `#fdf3e0` | 253, 243, 224 | 39, 88, 94 | Highlight wash on light |
| Amber Bright | `#e8a33d` | 232, 163, 61 | 36, 79, 57 | Highlight and mixed-gate text on dark |
| Highlight Shade | `#3a2c12` | 58, 44, 18 | 39, 53, 15 | Highlight wash on dark |
| Gate Pass | `#177245` | 23, 114, 69 | 150, 66, 27 | `pass` text and badge fill on light |
| Gate Pass Tint | `#e6f4ec` | 230, 244, 236 | 146, 39, 93 | `pass` badge wash on light |
| Gate Mixed Tint | `#fdf0dc` | 253, 240, 220 | 36, 89, 93 | `mixed` badge wash on light |
| Gate Rejected | `#b3261e` | 179, 38, 30 | 3, 71, 41 | `rejected` text and badge fill on light |
| Gate Rejected Tint | `#fbe9e7` | 251, 233, 231 | 6, 71, 95 | `rejected` badge wash on light |
| Gate Pass Bright | `#7fd6a4` | 127, 214, 164 | 146, 51, 67 | `pass` text on dark |
| Gate Pass Shade | `#123626` | 18, 54, 38 | 153, 50, 14 | `pass` badge wash on dark |
| Gate Mixed Shade | `#3a2a10` | 58, 42, 16 | 37, 57, 15 | `mixed` badge wash on dark |
| Gate Rejected Soft | `#f2a49e` | 242, 164, 158 | 4, 76, 78 | `rejected` text on dark |
| Gate Rejected Shade | `#3d1512` | 61, 21, 18 | 4, 54, 15 | `rejected` badge wash on dark |

## Light and dark mode mapping

| Role | Light | Dark |
|---|---|---|
| Page background | Paper `#ffffff` | Night Pine `#0f1513` |
| Raised surface | Mist `#eef2f0` | Night Surface `#1a2220` |
| Borders | Fog Line `#d8dfdc` | Night Line `#2e3a36` |
| Primary text | Ink `#17201d` | Night Ink `#e9eeec` |
| Secondary text | Slate Note `#47534e` | Night Note `#a7b4af` |
| Links | Deep Pine `#175c3a` | Pine Light `#7fcfa0` |
| Highlight text | Amber Text `#9a5b00` | Amber Bright `#e8a33d` |
| Highlight wash | Highlight Tint `#fdf3e0` | Highlight Shade `#3a2c12` |
| `pass` | Gate Pass on Pass Tint | Pass Bright on Pass Shade |
| `mixed` | Amber Text on Mixed Tint | Amber Bright on Mixed Shade |
| `rejected` | Gate Rejected on Rejected Tint | Rejected Soft on Rejected Shade |

Dark mode follows `prefers-color-scheme`; there is no manual toggle.

## Harmony analysis

Cool pine greens (hue ~150) carry structure, links, and pass states, while a
warm amber family (hue ~36, about 114 degrees from pine) carries highlights
and mixed states. Neutrals are a near-monochrome cool green-gray ramp, so the
two chromatic families stay legible. Gate red (hue ~4) is reserved for
rejected states only: hue carries verdict meaning and is never decorative.

## WCAG contrast results

Every text/background pair meets AA; most reach AAA. No sub-AA pair ships,
so no justification is needed. Border colors are decorative and ungraded.

Light mode:

| Pair | Ratio | Grade |
|---|---|---|
| Ink / Paper | 16.66 | AAA |
| Slate Note / Paper | 8.03 | AAA |
| Deep Pine / Paper | 7.99 | AAA |
| Amber Text / Paper | 5.43 | AA |
| Ink / Mist | 14.75 | AAA |
| Slate Note / Mist | 7.11 | AAA |
| Deep Pine / Mist | 7.07 | AAA |
| Ink / Highlight Tint | 15.13 | AAA |
| White / Gate Pass | 5.95 | AA |
| White / Amber Text | 5.43 | AA |
| White / Gate Rejected | 6.54 | AA |
| Gate Pass / Pass Tint | 5.25 | AA |
| Amber Text / Mixed Tint | 4.82 | AA |
| Gate Rejected / Rejected Tint | 5.58 | AA |

Dark mode:

| Pair | Ratio | Grade |
|---|---|---|
| Night Ink / Night Pine | 15.75 | AAA |
| Night Note / Night Pine | 8.61 | AAA |
| Pine Light / Night Pine | 9.97 | AAA |
| Amber Bright / Night Pine | 8.56 | AAA |
| Night Ink / Night Surface | 13.84 | AAA |
| Night Note / Night Surface | 7.57 | AAA |
| Pine Light / Night Surface | 8.76 | AAA |
| Pass Bright / Pass Shade | 7.62 | AAA |
| Amber Bright / Mixed Shade | 6.41 | AA |
| Rejected Soft / Rejected Shade | 8.05 | AAA |
| Amber Bright / Highlight Shade | 6.29 | AA |

## Design tokens as CSS variables

```css
:root {
  --wt-bg: #ffffff;
  --wt-surface: #eef2f0;
  --wt-border: #d8dfdc;
  --wt-text: #17201d;
  --wt-text-secondary: #47534e;
  --wt-link: #175c3a;
  --wt-signature: #175c3a;
  --wt-highlight-text: #9a5b00;
  --wt-highlight-wash: #fdf3e0;
  --wt-pass: #177245;
  --wt-pass-wash: #e6f4ec;
  --wt-mixed: #9a5b00;
  --wt-mixed-wash: #fdf0dc;
  --wt-rejected: #b3261e;
  --wt-rejected-wash: #fbe9e7;
}
@media (prefers-color-scheme: dark) {
  :root {
    --wt-bg: #0f1513;
    --wt-surface: #1a2220;
    --wt-border: #2e3a36;
    --wt-text: #e9eeec;
    --wt-text-secondary: #a7b4af;
    --wt-link: #7fcfa0;
    --wt-signature: #7fcfa0;
    --wt-highlight-text: #e8a33d;
    --wt-highlight-wash: #3a2c12;
    --wt-pass: #7fd6a4;
    --wt-pass-wash: #123626;
    --wt-mixed: #e8a33d;
    --wt-mixed-wash: #3a2a10;
    --wt-rejected: #f2a49e;
    --wt-rejected-wash: #3d1512;
  }
}
```

## Limits of the analysis

- This palette is newly proposed for a site with no live URL yet, so there
  was no production CSS to extract or audit.
- Chart bars reuse signature greens; their pair ratios are covered by the
  link/signature rows above.
- Border colors are decorative dividers, not text, and carry no grade.
