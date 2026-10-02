# Style guide (text version of `08-style-guide.png`)

| Token | Hex | Use |
|---|---|---|
| Navy | `#0E1B33` | headers, primary buttons, footer |
| Navy 2 | `#14254A` | hover/pressed, cards on navy |
| Ink | `#0A0F1A` | deepest text/overlays |
| Gold | `#B8923A` | fills, lines, icons (decorative) |
| Gold light | `#D4AF5A` | text on navy (8.24:1) |
| Gold dark | `#8A6A1F` | text on ivory (4.72:1) |
| Ivory | `#FAF7F0` | page background |
| Ivory 2 | `#F2EDE2` | alt sections |
| Stone | `#E9E7E3` | borders, dividers |
| Beige / Brown | `#C9B79C` / `#4A3426` | accents from lookbook |
| Success / Error / Warning / Info | `#2F7D5B` / `#B3402F` / `#9A6A12` / `#243E75` | status |
| Text / Text 2 / Text 3 | `#1B2230` / `#4B5565` / `#6B7280` | 14.9:1 / 7.0:1 / 4.5:1 on ivory |

**Contrast pairs:** ivory on navy 16.05 · gold-light on navy 8.24 · navy on gold 5.89 · gold `#B8923A` on ivory 2.72 (never for text).
**Fonts:** Playfair Display (headings; italic for taglines) + Inter (UI/body). Fallbacks Georgia / system-ui.
**Scale:** 12/14/16/18/20/24/30/38/48. Body 16 (mobile 15–16), line-height 1.5.
**Spacing:** 8px grid (4px half-steps). Mobile margin 16, desktop container 1200, 12-col, gutter 24.
**Components:** buttons min 48px high, 4px radius (primary navy, gold CTA, secondary outline, danger); inputs 48px with 1px `#B7B2A5` border (≥3:1), 2px navy focus + `#2B6CB0` ring; chips; toasts (success/error/info); dialogs; line icons 1.5px.
**Admin additions:** status chips (pending amber, paid green, processing blue, shipped navy, delivered green, cancelled red); destructive actions always red + confirmation dialog; bottom tab bar on mobile (Home, Orders, Products, Requests, More).
