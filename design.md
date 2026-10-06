# Flourishing Futures: Design & Interaction Guide

How the site looks, moves and behaves, and the reasons behind it. Read this before adding a section, an illustration or an interaction. The CSS (`css/home.css`, `css/styles.css`) is the source of truth for exact values; this file is the source of truth for intent.

Last updated October 2026, after the Home, About and Lab rebuilds.

---

## 1. Character

- **Playful, human, anti-corporate.** Bold, saturated colour fields and hand-drawn character, paired with serious, thoughtful copy. It deliberately avoids the grey and navy government look. (A sober, text-only "Government" theme exists for people who want that.)
- **Every section has something alive in it.** Each major section gets one interaction that expresses what the section is *about*, not a generic effect.
- **Content comes first.** Nothing gets in the way of reading. No pop-ups, permission prompts or gates.

## 2. Art direction

- **Hand-drawn over vector is the signature.** Loose brush and scribble layers sit over flat vector shapes. Keep both: never drop a hand-drawn layer from an illustration. When animating, move the drawn line and the flat shape slightly out of step so they read as two layers.
- **Flat, full-bleed colour fields** form the base of every section. Wireframe colours are eyedropped and used as given.
- **Characters with eyes.** Blobs, pills and critters with eyes appear across the site. **The eyes are their personality** (see section 5).
- **No drop shadows, glows or grain**, anywhere. "Lifted" or "held" states use a scale squish instead of a shadow.

## 3. Colour

The canonical swatch lives in `:root` in **both** stylesheets. Keep the two in sync.

| Token | Value | Use |
|---|---|---|
| `--red` | `#E42600` | fields |
| `--yellow` | `#FFCC00` | fields (was `#E4B103`, which read as muddy) |
| `--green` | `#009D3C` | fields |
| `--blue` | `#1934BE` | fields |
| `--black` | `#1B1B1B` | body ink, borders |
| `--white` | `#F3F3F3` | cards, nav, title ink |
| `--lime` | `#5FFF84` | button fill accent |

- Backgrounds, borders and text use the tokens. Illustrations keep their own baked hues.
- Section-specific field colours from wireframes are used literally (e.g. the About hero `#D23C20`, the succulent blue `#081EDC`, the hero split pairs).
- **White text is reserved for titles and statements.** Secondary or decorative text uses palette colours instead (e.g. the reel greetings use yellow or deep blue).
- Body copy over a busy illustration gets a contrasting ink (e.g. `#003615` dark green over the succulent).

## 4. Typography

| Role | Face | Notes |
|---|---|---|
| Statements, titles, nav | **Newsreader** (serif, Google Fonts) | hero questions, section statements |
| Playful labels, buttons, UI-ish text | **GT Maru** (self-hosted WOFF2 + TTF fallback) | eyebrows ("We work to drive…"), buttons, in-illustration text |
| Body | **Atkinson Hyperlegible Next** (Google Fonts) | legibility first |

- Hero question size is `clamp(2.2rem, 5.6vw, 7rem)`. Bigger read as "a tad huge".
- Text placed *inside* an illustration (e.g. speech-bubble greetings) uses GT Maru so it doesn't clash with a nearby serif title.
- Greetings and multilingual content favour **Singapore's languages (Chinese, Malay, Tamil, English) plus Japanese and Hindi**, in their own scripts. Avoid European or anglicised filler.

## 5. Interaction principles

### Each interaction expresses its section's idea

| Section | Idea | Interaction |
|---|---|---|
| Home hero 1: "bring different shapes together" | coming together | shapes are magnetically pulled to the cursor; the centre divider is a wall |
| Home hero 2: "be more reflective" | calm reflection | thought-wave rings ripple and breathe, balanced by the cursor's position |
| Home hero 3: "share the same language" | finding common ground | slot-machine speech-bubble reels; match a shape and they say hello |
| Home "We work to drive…" | momentum | a sun that idles slowly and winds up as you scroll |
| Home "What we do" | exploration | illustrations drift toward the cursor |
| About hero "What matters most" | a new day | a sunrise on arrival; it sets as you scroll away |
| About "We work to drive…" | growth | a succulent that blooms outward as you scroll |
| About "We work to develop…" | curiosity | blob critters that float, lean in and watch you |
| Lab | experimenting | a physics workbench; combine two alike shapes to grow a new one |

### Match the tone of the copy

- **Thoughtful sections are calm**: slow, eased, breathing (the sun, ripples, succulent).
- **Playful sections are springy and toy-like** (magnets, critters, the Lab).
- Never frantic or "intense". A slot machine, but "less intense".

### Make it feel alive

- Give shapes a **temperament**: their own weight, springiness, reaction lag, squish and wobble, so a group never moves in lockstep.
- Add an **idle life**: a slow float, a breath, a lazy turn. Nothing is ever completely frozen.
- Use **slightly underdamped springs**: shapes overshoot a touch and settle. Avoid linear motion and hard stops.

### Make cause and effect obvious

- When motion is tied to an input, it should **respond quickly and settle quickly**. The sun brakes back to idle within about 0.75s after scrolling stops; a long coast made the link to scrolling unclear.

### Leave breathing room

- Soft limits beat hard boundaries. Hard screen-edge walls on the hero shapes felt "cramped and jittery" and were removed. Keep hard walls only where they carry meaning (the hero's human | machine divider).

### Games are generous

- "It's just a fun interaction." Never let a game dead-end or feel hard.
  - Reels: a near-miss gets drawn onto the match, and if no match has happened before the scene moves on, the reels find one themselves.
  - Lab: two of the same shape combine at any size, and the bench always keeps at least one possible match.

### Faces and eyes

- Anything with eyes should **follow the cursor and/or blink**.
- **Keep the eyes in frame and never hidden behind UI.** Position characters by their eyes, not their bodies (see the About critters).
- Keep the eyes in Dark mode too (see section 6).

### Readability over motion

- Moving art must never cover text in a way that makes it hard to read. Options: treat the copy as a solid "glass" the art collides with (Lab, desktop), arrange the art around the copy, add a soft field-coloured halo behind the text, or use a contrasting ink.

### Extra flourishes

- One small surprise beyond the obvious interaction is welcome (click to scatter the shapes, the mascot Flofu cheering a Lab merge), as long as it's easy to remove.

## 6. Themes

- **Default**: the vibrant palette above.
- **Dark**: a warm deep-brown palette, not neutral black. **Never flatten an illustration into a single brown silhouette.** Give each paint its own brown (hand-mapped `-dark.svg` copies or per-class fills) so brush lines stay distinct from block shapes. Faces keep their eyes, cut out in the field colour.
- **Government**: a separate text-only view (`js/gov.js`, `css/gov.css`). No illustrations or interactions.

## 7. Mobile & input

- **Touch is a full input**, not an afterthought: drag shapes, tap to step a reel, tap to drop or scatter.
- **Device tilt is Android-only.** iOS requires a permission prompt, which we won't show: it gets in the way of content, iOS doesn't reliably remember the answer, and every iOS browser behaves the same way. iPhone and iPad visitors get touch plus all the ambient motion. Do not add an iOS permission flow.
  - `js/hero-tilt.js` turns tilt into events (`ff-tilt` in screen pixels, `ff-tilt-n` normalised −1..1). A section opts in with a `data-tilt` attribute.
- Phones and low-power devices get **lighter versions** where it matters (e.g. the Lab uses fewer pieces and cheaper physics).

## 8. Accessibility

- `prefers-reduced-motion`: show a **pleasant, finished still state** (sun risen, plant open, shapes resting along the floor). Don't hide the art.
- Decorative art is `aria-hidden`. Interactive copy and links keep working above any moving layer.
- Atkinson Hyperlegible for body text, high contrast, clear hierarchy.

## 9. Building interactions: technical conventions

- **Static site, no build step.** Files stay hand-editable.
- **One script per interaction** in `js/` (`hero-magnet.js`, `hero-reflect.js`, `hero-lang.js`, `home-sections.js`, `about-sunrise.js`, `about-bloom.js`, `about-critters.js`, `lab-toys.js`). Each has a **settings table at the top**, commented in plain words, so the feel can be tuned without reading the logic.
- **Every animation loop stops when its element is off screen or the tab is hidden** (IntersectionObserver plus `visibilitychange`), and sleeps when nothing is moving.
- **Inline SVG only where parts must move or recolour** (eyes, petals, Dark-mode faces). Otherwise use `<img>` so the browser can cache it.
- Keep SVG path coordinates rounded (1 decimal place is plenty; whole units for the mascot) to keep pages light.
- **Third-party code is vendored** into `js/vendor/` (e.g. Matter.js, MIT), not loaded from a CDN.
- Avoid `will-change` on many small elements or on SVG groups. Skip DOM writes when a value hasn't changed.
- **Cache-bust** changed CSS, JS and images with `?v=YYYYMMDD<tag>`, including image paths that scripts build at runtime. Note `img/hero-reflect-wave-*.svg` is referenced *only* from such a path, so a search for unused files won't find it.
- Images are WebP or SVG; fonts are WOFF2 first.

## 10. Navigation & components

- **Nav**: Home · About · Lab · Resource Hub · Community, set in Newsreader. Each link's hover and active colour is the key colour of the page it leads to (Home blue, About red, Lab green, Resource Hub blue, Community yellow).
- **Buttons**: GT Maru, lime pill (`--lime`, blue text). Hover shows a flowing rainbow fill.
- **Borders and rules**: 1.5px everywhere.
- **Flofu**: the corner mascot (two eels). Its eye follows the cursor, the eels bob when petted, and it offers quips. It can cheer site interactions via `window.__ffSayQuip` (Lab page).
