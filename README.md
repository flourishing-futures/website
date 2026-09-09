# Flourishing Futures
### AI for Human Possibilities

The website for **Flourishing Futures**, a programme run by the **GovTech Innovation Office**.

Most talk about AI is about speed, cost, and how much of it you can cram into a workflow. This programme is more interested in whether people come out of the deal better off: still able to think, decide, and do their jobs well. The site is where we try to explain that without sounding like a white paper.

## The look

It's colourful and hand-drawn on purpose. Big flat colour, wobbly brush doodles, serif headlines that act like they're mid-thought. There are a few small toys built in:

- Characters that bob a little when you hover them
- Two of them whose eyes follow your cursor around the green section
- An outcomes list on the About page that opens like an accordion
- Finch, the bird in the corner, who watches your cursor and pops up now and then

None of it is essential. That's sort of the point.

## The pages

| Page | What's on it |
|------|--------------|
| `index.html` | Home, and the rotating hero |
| `about.html` | Why the programme exists and what it's aiming for |
| `the-lab.html` | The Lab: experiments and prototypes |
| `resource-centre.html` | The resource hub |
| `community.html` | Community and events |

## How it's built

Plainly. It's HTML, CSS, and vanilla JavaScript. No framework, no bundler, no build step, nothing to `npm install`.

- CSS lives in `css/`. `home.css` runs the home and about pages; `styles.css` covers the rest.
- Each page's JavaScript sits in a `<script>` tag at the bottom, in small chunks that behave themselves and respect `prefers-reduced-motion`.
- Illustrations are SVGs in `img/`. A couple are pasted straight into the page so their eyes can move.

### Running it

Serve the folder:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Open it through the server rather than double-clicking the file, or a couple of the moving parts will sulk.

### Deploying

Push to `main` and Vercel takes it from there. It's a static site, so deploying mostly means putting the same files somewhere faster.

---

*A GovTech Innovation Office initiative, 2026.*
