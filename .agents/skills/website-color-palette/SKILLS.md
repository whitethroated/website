<!--
Portable agent skill. Copy this single file into any website project.
Suggested location: .agents/skills/website-color-palette/SKILL.md
It is fully self-contained: method, formulas, output format, and the helper
script are all in this file. No other files or services are required.
-->

---
name: website-color-palette
description: Extract and analyze the color palette of a website from its production CSS and theme sources. Use when asked for a website's colors, brand colors, color palette, or a color audit.
---

# Website Color Palette Analysis

## Goal

Produce a verified, deep color palette analysis for any website: every color
grouped by function, with HEX, RGB, and HSL values, the harmony between the
chromatic colors, the light and dark mode mapping, and WCAG contrast grades
for the pairs that matter. Every reported color must come from a real
extraction, never from memory or guesswork.

## Inputs

- The live site URL, the project source in this repo, or both.
- When both exist, production CSS is the ground truth for what users see, and
  the source explains intent. Report any disagreement between the two.
- If the site is unreachable, work from the source alone and say so.

## Method

### 1. Collect the colors from production

- Download two or three representative pages (home, a content page, and any
  page with data visualization or a dashboard) into a scratch folder:

```bash
curl -sL https://example.com/ -o page-home.html
```

- Find the stylesheet links in the saved HTML and download each CSS bundle.
  Production CSS is where the real palette lives after the framework compiles.
- Run the helper script (included below) in `extract` mode on all saved CSS
  and HTML files. It returns every color as JSON with occurrence counts, the
  alpha variants seen, and one example context per color.
- Treat colors that appear only inside shadow, mask, or gradient syntax as
  supporting values. Keep them out of the main palette unless a selector shows
  a visible role.

### 2. Verify roles against the source

- Read the theme sources when reachable: a Tailwind config, a global
  stylesheet, CSS variables on `:root`, a theme or tokens file, or design
  tokens in the repo. Compare them with the extracted list before calling any
  color custom.
- Classify each frequent color as a custom value, a framework default, or a
  one-off arbitrary value. Say plainly when a config defines no custom colors
  at all, because that is itself a key finding.
- Trace each role from the example contexts and class names (background, text,
  border, link, hover, chart series, badge, and so on). Never assign a role
  the context does not support.
- Cross-check any surprising value in a second source before reporting it.
  Minified bundles mix pages and components, and a similar hex nearby can
  mislead.

### 3. Compute the analysis

- Run the helper script in `colors` mode to get RGB and HSL for every palette
  color. Never convert by hand.
- Group the palette by function. Typical groups: signature or brand colors,
  link and interactive colors, the neutral or gray foundation ramp, and any
  secondary ramp a typography or component library brings in.
- Measure the hue distance between the chromatic colors and describe the
  harmony in plain terms (complementary, near-complementary, analogous,
  monochrome with one accent). Note which colors are warm and which are cool,
  and whether warmth or saturation carries a consistent meaning.
- Map the light and dark mode pairs for background, primary text, secondary
  text, borders, fills, and links whenever the CSS carries a dark variant.
- Run the helper script in `contrast` mode on the pairs that matter, at
  minimum: body text, secondary text, and link colors on the light
  background, the same set on the dark background, and each chromatic color on
  both backgrounds. Report the WCAG grade beside each ratio.

### 4. Deliver

- Save two files in the project (suggested: `docs/color-palette.md` and
  `docs/color-palette.json`, or wherever the user keeps docs):
  - The Markdown report with the sections listed under Output format.
  - The JSON tokens with the schema listed under Output format.
- Summarize in chat in the language the user is using: lead with the
  architecture of the palette, then the grouped colors, then the findings
  that matter most.
- Offer a visual palette board (one swatch per color, click to copy the HEX)
  when the user wants to see or share the palette. Feed the builder the
  verified values from the extraction instead of letting it fetch or invent
  colors.

## Helper script

Save this as `palette_tools.py` next to the downloaded pages, then run it.
It uses only the Python 3 standard library.

- `python3 palette_tools.py extract FILE [FILE ...]` prints every color
  found as JSON with counts, alpha variants, and one example context each.
- `python3 palette_tools.py colors '#0C4FEC' '#ED8F3D'` prints HEX, RGB, and
  HSL per color.
- `python3 palette_tools.py contrast '#0C4FEC' '#FFFFFF'` prints the WCAG
  ratio and grade per foreground and background pair.

```python
#!/usr/bin/env python3
"""Color palette helpers for the website_color_palette skill.

Subcommands:
  extract FILE [FILE ...]   Scan CSS/HTML files, print every color found as JSON
                            with occurrence counts and one example context each.
  colors HEX [HEX ...]      Print HEX, RGB and HSL for each color.
  contrast FG BG [FG BG]    Print the WCAG contrast ratio and grade per pair.

Stdlib only. Colors are normalized to lowercase #rrggbb where possible, with
8-digit hex and rgb() alpha values reported in an "alpha" field.
"""
import colorsys
import json
import re
import sys


def norm_hex(token):
    token = token.lower()
    digits = token[1:]
    if len(digits) in (3, 4):
        digits = "".join(c * 2 for c in digits)
    if len(digits) == 6:
        return "#" + digits, None
    if len(digits) == 8:
        return "#" + digits[:6], round(int(digits[6:], 16) / 255, 3)
    return None, None


def _alpha(text):
    # Alpha is often a CSS variable in framework output, for example
    # rgb(59 130 246 / var(--tw-text-opacity, 1)). That means dynamic, so
    # report None instead of failing.
    text = text.strip()
    try:
        return float(text[:-1]) / 100 if text.endswith("%") else float(text)
    except ValueError:
        return None


def parse_rgb(body):
    body = body.strip()
    alpha = None
    if "/" in body:
        body, a = body.split("/", 1)
        alpha = _alpha(a)
    parts = [p for p in re.split(r"[\s,]+", body.strip()) if p]
    if len(parts) < 3:
        return None, None
    try:
        r, g, b = (int(float(p)) for p in parts[:3])
    except ValueError:
        return None, None
    if len(parts) > 3 and alpha is None:
        alpha = _alpha(parts[3])
    return "#%02x%02x%02x" % (r, g, b), alpha


def extract(paths):
    found = {}
    hex_re = re.compile(r"#[0-9a-fA-F]{3,8}\b")
    rgb_re = re.compile(r"rgba?\(([^)]*)\)")
    for path in paths:
        text = open(path, encoding="utf8", errors="replace").read()
        hits = [(m.start(), m.group(0), "hex") for m in hex_re.finditer(text)]
        hits += [(m.start(), m.group(1), "rgb") for m in rgb_re.finditer(text)]
        for start, token, kind in sorted(hits):
            if kind == "hex":
                color, alpha = norm_hex(token)
            else:
                color, alpha = parse_rgb(token)
            if not color:
                continue
            entry = found.setdefault(color, {"hex": color, "count": 0, "alpha_seen": set(), "context": None})
            entry["count"] += 1
            if alpha is not None:
                entry["alpha_seen"].add(alpha)
            if entry["context"] is None:
                snippet = text[max(0, start - 90):start + 12].replace("\n", " ")
                entry["context"] = f"{path}: ...{snippet.strip()}"
    out = []
    for entry in sorted(found.values(), key=lambda e: -e["count"]):
        entry = dict(entry)
        entry["alpha_seen"] = sorted(entry["alpha_seen"])
        out.append(entry)
    return out


def rgb_of(hex_color):
    h = hex_color.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def hsl_of(hex_color):
    r, g, b = (c / 255 for c in rgb_of(hex_color))
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return [round(h * 360), round(s * 100), round(l * 100)]


def luminance(hex_color):
    def channel(c):
        c = c / 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = rgb_of(hex_color)
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)


def contrast(fg, bg):
    la, lb = luminance(fg), luminance(bg)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def grade(ratio):
    if ratio >= 7:
        return "AAA"
    if ratio >= 4.5:
        return "AA"
    if ratio >= 3:
        return "AA-large"
    return "fail"


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 1
    cmd, args = argv[1], argv[2:]
    if cmd == "extract":
        print(json.dumps(extract(args), indent=1))
    elif cmd == "colors":
        rows = [{"hex": a.lower(), "rgb": list(rgb_of(a)), "hsl": hsl_of(a)} for a in args]
        print(json.dumps(rows, indent=1))
    elif cmd == "contrast":
        if len(args) % 2:
            print("contrast needs FG BG pairs", file=sys.stderr)
            return 1
        rows = []
        for i in range(0, len(args), 2):
            fg, bg = args[i], args[i + 1]
            r = contrast(fg, bg)
            rows.append({"fg": fg.lower(), "bg": bg.lower(), "ratio": round(r, 2), "grade": grade(r)})
        print(json.dumps(rows, indent=1))
    else:
        print(f"unknown subcommand: {cmd}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
```

## Output format

### palette.json schema

```json
{
  "site": "example.com",
  "extracted": "YYYY-MM-DD",
  "sources": ["production CSS bundles", "tailwind.config"],
  "signature": [
    { "name": "Human Blue", "hex": "#0C4FEC", "rgb": [12, 79, 236], "hsl": [222, 90, 49], "role": "Human data series" }
  ],
  "links": [],
  "neutral": [],
  "secondaryRamp": [],
  "contrast": [
    { "fg": "#0C4FEC", "bg": "#FFFFFF", "ratio": 6.28, "grade": "AA", "use": "Chart line, light" }
  ],
  "harmony": "One short paragraph describing the palette structure."
}
```

### Report sections (Markdown)

1. Method and sources, with the extraction date.
2. Signature colors, one row per color with name, HEX, RGB, HSL, and role.
3. Link and interactive colors.
4. The foundation ramp or ramps, one row per step with its typical role.
5. Light and dark mode mapping.
6. Harmony analysis.
7. WCAG contrast results with grades and short notes on weak pairs.
8. Design tokens as CSS variables, ready to paste.
9. Limits of the analysis.

## Rules

- Never report a color, a role, or a ratio that did not come from the
  extraction or the script. If a value is uncertain, say what is unverified.
- State the method and the extraction date in every report. Palettes change
  when a site is redesigned, so an undated palette is a stale palette.
- Distinguish measured facts from interpretation. Harmony and meaning are
  analysis, counts and ratios are measurements.
- Colors generated at runtime in JavaScript or canvas, and colors inside
  images, logos, and artwork, are out of scope unless they were sampled
  separately. Name them as limits instead of guessing them.
- Grade contrast honestly, including failures. A failing pair used at a tiny
  size or as a thin line is still worth reporting with its context.

## Formulas (only when computing by hand)

- Relative luminance (WCAG 2.x): linearize each sRGB channel with
  `c / 12.92` when `c <= 0.03928`, else `((c + 0.055) / 1.055) ^ 2.4`, then
  combine as `L = 0.2126 R + 0.7152 G + 0.0722 B`.
- Contrast ratio: `(Llight + 0.05) / (Ldark + 0.05)`.
- Grades: AAA at 7.0 or above, AA at 4.5 or above, AA for large text and
  essential graphics at 3.0 or above, fail below 3.0.
- Prefer the helper script over these formulas. It implements them and was
  verified against known pairs.
