# Flourishing Futures 🌱
### *AI for Human Possibilities*

The landing site for **Flourishing Futures**, a programme by the **GovTech Innovation Office** asking a deceptively simple question:

> Not just *can* AI do this — but should it, and does it leave people **more capable, more human, and more free**?

Most of the conversation around AI is about adoption, efficiency and cost. This programme designs for the quieter stuff — agency, judgement, care and trust — and tries to shape the good defaults *before* the technology hardens into place.

---

## 🎨 The vibe

This is not a greyscale enterprise deck. Expect:

- **Loose, hand-drawn brush doodles** over big, bold pop-colour fields
- **Newsreader** serif for the thinking-out-loud headlines, **GT Maru** for punchy labels, **Atkinson Hyperlegible** for readable body copy
- Playful micro-interactions: characters that **bob when you hover** and **eyes that follow your cursor**, an outcomes list that **unfurls like an accordion**, and parallax that (mostly) knows when to sit still
- **Finch** 🐤 — the little floating assistant in the corner who tracks your cursor and occasionally has opinions

## 🗺️ The pages

| Page | What lives there |
|------|------------------|
| `index.html` | Home — the rotating hero and the pitch |
| `about.html` | Why here, why now, and the outcomes we're chasing |
| `the-lab.html` | The Lab — experiments and prototypes |
| `resource-centre.html` | The resource hub |
| `community.html` | Community & events |

## 🛠️ Under the hood

Refreshingly boring, on purpose:

- **Plain HTML + CSS + vanilla JS.** No framework, no bundler, **no build step.**
- Styles live in `css/` (`home.css` powers the home + about redesign; `styles.css` serves the other subpages).
- Per-page behaviour is inline `<script>` at the bottom of each page — small IIFEs, each guarded by `prefers-reduced-motion`.
- Illustrations are SVGs in `img/`; a few are inlined into the page so their innards (eyes!) can be animated.

### Run it locally

No install required — just serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

> Tip: open it *through the server* rather than double-clicking the file, so the fetch-y and inline-SVG bits behave.

### Deploy

Pushed to `main` → **Vercel** does the rest. It's a static site, so a deploy is really just "serve these files, but faster and everywhere."

---

*An initiative by the GovTech Innovation Office · 2026* ✨
