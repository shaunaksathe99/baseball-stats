# Plate 450 palette for Dugout Diary

Derived from the Plate 450 crest. Every pairing below was checked against
WCAG 2.1; ratios are computed, not estimated. Normal text needs 4.5:1,
large text (24px+, or 19px+ bold) needs 3:1, non-text borders need 3:1.


## Brand core

| Name | Hex | Used for |
|---|---|---|
| Charcoal | `#2C2C2A` | crest ring and disc, light-mode text |
| Mustard gold | `#EF9F27` | the plate, the seams, dark-mode accent |
| Dark brown | `#412402` | numerals, plate outline, text on gold |
| Cream | `#F5EFE0` | the ball, knockouts, dark-mode text |

## Dark theme

| Token | Hex | Used for |
|---|---|---|
| `bg` | `#1A1A18` | page background |
| `surface` | `#242422` | cards, panels |
| `surface-raised` | `#2C2C2A` | modals, raised rows (the brand charcoal) |
| `border` | `#3C3C38` | hairlines, dividers |
| `text` | `#F5EFE0` | primary text |
| `text-secondary` | `#ADA99E` | labels, captions |
| `text-muted` | `#86827A` | hints, metadata |
| `accent` | `#EF9F27` | buttons, progress fill, active tab |
| `on-accent` | `#412402` | text on an accent fill |

## Light theme

| Token | Hex | Used for |
|---|---|---|
| `bg` | `#FBF8F1` | page background |
| `surface` | `#FFFFFF` | cards, panels |
| `surface-sunken` | `#F5EFE0` | wells, inactive rows (the brand cream) |
| `border` | `#DED8C9` | hairlines, dividers |
| `text` | `#2C2C2A` | primary text |
| `text-secondary` | `#5F5E5A` | labels, captions |
| `text-muted` | `#847F75` | hints, metadata |
| `accent` | `#9A5F0F` | accent TEXT and icons only |
| `accent-fill` | `#EF9F27` | accent FILL only, never text |
| `on-accent-fill` | `#412402` | text on an accent fill |

## Semantic

| Name | Light hex | Dark hex | Used for |
|---|---|---|---|
| positive | `#5F7A2B` | `#A3C464` | a goal met, a badge earned |
| negative | `#B3322A` | `#E88D85` | an error, a slump |

## Contrast — dark theme

| Pairing | Ratio | Result |
|---|---|---|
| text on bg | 15.19:1 | AAA |
| text on surface | 13.55:1 | AAA |
| text-secondary on bg | 7.42:1 | AAA |
| text-muted on bg | 4.55:1 | AA |
| accent on bg | 8.02:1 | AAA |
| accent on surface | 7.15:1 | AAA |
| on-accent on accent fill | 6.54:1 | AA |
| border on bg (non-text) | 1.57:1 | FAIL |
| positive on bg | 8.83:1 | AAA |
| negative on bg | 7.12:1 | AAA |

## Contrast — light theme

| Pairing | Ratio | Result |
|---|---|---|
| text on bg | 13.19:1 | AAA |
| text on surface | 13.99:1 | AAA |
| text-secondary on bg | 6.12:1 | AA |
| text-muted on bg | 3.75:1 | AA large only |
| accent text on bg | 4.93:1 | AA |
| raw gold as text on bg | 2.05:1 | FAIL |
| on-accent-fill on accent fill | 6.54:1 | AA |
| border on bg (non-text) | 1.34:1 | FAIL |
| positive on bg | 4.60:1 | AA |
| negative on bg | 5.81:1 | AA |

## The one trap

Mustard gold `#EF9F27` is a **fill colour, not a text colour** in light mode —
as text on a light background it fails badly (see the table above). Light mode
uses `#9A5F0F` for gold text and icons, and keeps `#EF9F27` for fills only,
with `#412402` on top. In dark mode the raw gold is fine for both.

