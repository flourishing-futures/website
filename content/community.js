/*
  Community page content
  ----------------------
  Powers community.html. Rendered at runtime by js/render-content.js
  (renderCommunity), which fills the "Upcoming" card and both ticker
  carousels, then wires the hero parallax, ticker auto-scroll/drag, and
  scroll reveals.

  Shape: window.SITE_CONTENT.community = { upcoming, gallery, experts }

  upcoming — the single "Upcoming..." event card (Lately-card style):
    title    — event name (HTML allowed, e.g. <br>)
    body     — array of paragraph strings
    when     — human date string (e.g. "21 Oct, 2026")
    where    — location string (e.g. "TBD")
    cta      — { text, href }   (renders a green RSVP-style button)
    image    — optional { src, srcMobile?, fit?, alt }; OMIT to render the
               blue placeholder panel. srcMobile (e.g. a landscape cut) is
               swapped in on narrow screens where the image stacks above the
               text. fit: "contain" shows the whole image (for posters with
               text baked in) instead of cropping to fill.

  gallery — "What we've been up to..." ticker tiles (photos, coming later):
    Each item: { src?, alt, color? }
      src   — photo path (use photos/ folder); omit to show a colour placeholder
      alt   — description for accessibility (also used as placeholder label)
      color — placeholder tile colour (used only when src is omitted)

  experts — "Experts we work with..." ticker cards (portraits, coming later):
    Each item: { img?, name, title, org }
      img   — portrait path; omit to show a neutral placeholder
      name  — expert name (serif)
      title — role (e.g. "Assistant Professor")
      org   — institution (may include commas / long names)
*/
window.SITE_CONTENT = window.SITE_CONTENT || {};
window.SITE_CONTENT.community = {
  "upcoming": {
    // Official listing + graphics: https://luma.com/4i3zx1pt (copy excerpted
    // from the Luma description). The poster carries its own title/date, so
    // it's shown whole (fit: contain): portrait cut beside the text, landscape
    // cut (srcMobile) when the card stacks and the image sits on top.
    "title": "Conscious Builder Community #3:<br>The Design Edition: Principles &amp; Practice",
    "body": [
      "What if human-first AI wasn't just something we believed in, but something we designed?",
      "For our third gathering, we're shifting gears from study and measurement to design and action. Together with Design Practice, we're inviting designers and design-minded product owners and builders to explore what human-first AI could look like in practice.",
      "Come ready to learn, argue, and help shape a more intentional future for AI."
    ],
    "when": "Wed, 2 Dec 2026, 2–5pm",
    "where": "To be announced",
    "cta": { "text": "RSVP", "href": "https://luma.com/4i3zx1pt" },
    "image": {
      "src": "photos/session3-design-portrait.webp",
      "srcMobile": "photos/session3-design-landscape.webp",
      "fit": "contain",
      "alt": "Conscious Builder Community Session 03 — The Design Edition: Principles & Practice. Flourishing Futures × Design Practice, Wednesday 2 December 2026, 2–5pm"
    }
  },

  // Event photos, shown at a fixed height with natural (aspect-preserving)
  // width in the auto-scrolling ticker. Resized copies live in photos/up-to/.
  "gallery": [
    { "src": "photos/up-to/up-01.webp", "alt": "Conscious Builders community session" },
    { "src": "photos/up-to/up-02.webp", "alt": "Conscious Builders community session" },
    { "src": "photos/up-to/up-03.webp", "alt": "Conscious Builders community session" },
    { "src": "photos/up-to/up-04.webp", "alt": "Conscious Builders community session" },
    { "src": "photos/up-to/up-06.webp", "alt": "Conscious Builders community session" },
    { "src": "photos/up-to/up-07.webp", "alt": "Conscious Builders community session" },
    { "src": "photos/up-to/up-08.webp", "alt": "Conscious Builders community session" },
    { "src": "photos/up-to/up-11.webp", "alt": "Conscious Builders community session" },
    { "src": "photos/up-to/up-12.webp", "alt": "Conscious Builders community session" },
    { "src": "photos/up-to/up-13.webp", "alt": "Conscious Builders community session" },
    { "src": "photos/up-to/up-14.webp", "alt": "Conscious Builders community session" },
    { "src": "photos/up-to/up-15.webp", "alt": "Conscious Builders community session" }
  ],

  // Placeholder cards until real portraits are supplied. Add `img` per expert
  // as portraits arrive.
  "experts": [
    { "img": "photos/experts/pat.webp", "name": "Pat Pataranutaporn", "title": "Assistant Professor", "org": "MIT Media Lab" },
    { "img": "photos/experts/kenny.webp", "name": "Kenny Choo", "title": "Assistant Professor", "org": "SUTD" },
    { "img": "photos/experts/renwen.webp", "name": "Zhang Renwen", "title": "Assistant Professor", "org": "NTU, Wee Kim Wee School of Communication and Information" },
    { "img": "photos/experts/rachel.webp", "name": "Rachel Poonsiriwong", "title": "Graduate Researcher", "org": "MIT Media Lab" }
  ]
};
