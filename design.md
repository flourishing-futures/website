# Flourishing Futures — Design Decisions

## Typography

- **Display font**: `GT Maru` — a rounded sans typeface, self-hosted via `@font-face` (`fonts/GTMaruRegular.ttf` 400, `GTMaruMedium.ttf` 500, `GTMaruBold.ttf` 700, `GTMaruBlack.ttf` 900). Used for headings, hero text, the logo/wordmark, and UI elements. Exposed as `--font-display: 'GT Maru', 'Nunito', 'Rounded Mplus 1c', system-ui, sans-serif;`
- **Serif**: `Newsreader` — loaded from Google Fonts (`ital,opsz,wght@0,6..72,400;500;600;700`), used where a serif accent is called for (e.g. vision statements). Exposed as `--font-serif: 'Newsreader', Georgia, 'Times New Roman', serif;`
- **Body font**: `Atkinson Hyperlegible Next` — loaded from Google Fonts (weights 300/400/500), used for body copy and legibility-first UI text. Exposed as `--font-body: 'Atkinson Hyperlegible Next', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;`
- **Heading style**: Bold, rounded display type (GT Maru weights up to 900) rather than a serif — headings carry weight/roundness rather than serif elegance
- **Navigation**: Uppercase, spaced lettering, GT Maru / sans

> Note: an earlier direction used `Newsreader` as the primary heading/logo font with a plain system-sans body stack. That direction was superseded — GT Maru is now the primary display face; Newsreader was kept on as a secondary serif accent, and Atkinson Hyperlegible Next was added as the body face.

## Colour Palette

Colours live as CSS custom properties on `:root`. There are two parallel palettes in the codebase, one per stylesheet:

**`css/home.css`** (loads on `index.html`, `about.html` — the recoloured/current set):

| Variable | Value | Notes |
|---|---|---|
| `--red` | `#E42600` | softened from an earlier `#FF2200` so red surfaces are less blinding |
| `--yellow` | `#E9CE00` | mustard |
| `--yellow-soft` | `#FDFF81` | |
| `--green` | `#2EAC00` | |
| `--blue` | `#0066FF` | |
| `--blue-dark` | `#003A91` | |
| `--pink-grad-start` / `--pink-grad-end` | `#FD92FF` → `#00FFEA` | gradient pair |
| `--orange-grad-start` / `--orange-grad-end` | `#FF5900` → `#FDFF81` | gradient pair |
| `--green-grad-start` / `--green-grad-end` | `#8BFF61` → `#FDFF81` | gradient pair |
| `--black` / `--white` | `#000000` / `#FFFFFF` | |

**`css/styles.css`** (loads on `resource-centre.html`, `community.html`, and other subpages — the original/brighter set, not yet recoloured):

| Variable | Value |
|---|---|
| `--red` | `#FF0000` |
| `--yellow` | `#FFFF00` |
| `--green` | `#5EFF24` |
| (all other vars — `--blue`, `--blue-dark`, gradients, `--black`, `--white` — match `home.css`) | |

Per-page hero recolours layered on top of these bases (from recent commits): Resource Hub hero `#1934BE`, Home hero red scene `#E42600`.

- Bold, playful colour use — not corporate/muted
- Colour blocks used as full-width section/hero backgrounds
- Gradients used behind hero scenes and illustration fields (pink→cyan, orange→yellow, green→yellow)

## Art Direction

- **Hand-drawn brush-doodle critters**: full-bleed SVG illustrations (e.g. `Drive Illustration.svg`, `Lately Card Illustration.svg`) used as section backdrops behind copy, cards, and the hero — stacked in layers with per-layer parallax depth (`data-depth`) rather than as static art
- **Flat colour fields**: large, full-width flat colour sections (not gradients or textures) form the base of most layouts, with doodles and gradients layered on top
- **Riso-ish, playful vibe**: bright, saturated, unfussy colour combinations rather than muted/corporate tones
- **Grain/noise overlays were removed site-wide** (design decision, 2026-09-09). `css/styles.css` still defines `.hero__noise`, `.about-hero__noise`, etc. selectors for legacy compatibility, but the associated background-image rules were stripped — grain is no longer part of the current look. Do not reintroduce it without a new decision.

## Logo Treatment

- Typographic logo (no icon/graphic mark), set in GT Maru
- Centered at top of page, within the coloured hero/header zone

## Navigation

- **Labels**: `About` · `The Lab` · `Resource Hub` · `Community`
- Uppercase, GT Maru, spaced letterforms
- Active/hover state: coloured accent

## Layout Principles

- **Full-width colour blocks**: sections use bold background colours (or the palette gradients) spanning the full viewport width
- **Brush-doodle backdrops**: illustration layers sit behind text/cards rather than as isolated images, with subtle parallax on scroll
- **Generous whitespace**: large padding around vision statements and hero text
- **Playful elements**: hand-drawn eye/critter motifs (currently scoped to the Flofu character) used as interactive, cursor-following details rather than a generic smiley motif

## Tone & Feel

- **Playful and opinionated**: bold colours and hand-drawn character balanced with substantive, thoughtful content
- **Not corporate**: avoids the grey/navy government look — deliberately colourful and human
- **Warm**: the red/yellow/pink/green palette conveys warmth, possibility, optimism
- **Accessible**: Atkinson Hyperlegible Next for body copy, high contrast text, clear hierarchy
- **Micro-interactions**: cursor-follow eyes, parallax doodles, page-transition reveals used to make the site feel alive
