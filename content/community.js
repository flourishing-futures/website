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
    image    — optional { src, alt }; OMIT to render the blue placeholder panel

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
    // "Arts" is struck through so it reads "Defense Against the Dark Patterns".
    "title": "Series 3: Defense Against the Dark <s>Arts</s> Patterns",
    "body": [
      "What is the role human should play in AI systems? Are we becoming a reviewer and approval while AI does the job? How do we retain human judgement, creativity and autonomy in professional context?"
    ],
    "when": "Early November",
    "where": "Stay tuned 👀",
    "cta": { "text": "RSVP", "href": "https://luma.com/user/usr-kAIM5FsLgmlSWBx" },
    "image": { "src": "photos/session3.webp", "alt": "Conscious Builders Series 3 session" }
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
    { "img": "photos/experts/pat.webp", "name": "Pat Pataranutaporn", "title": "Assistant Professor", "org": "MIT Media Labs" },
    { "img": "photos/experts/kenny.webp", "name": "Kenny Choo", "title": "Assistant Professor", "org": "SUTD" },
    { "img": "photos/experts/renwen.webp", "name": "Zhang Renwen", "title": "Assistant Professor", "org": "NTU, Wee Kim Wee School of Communication and Information" },
    { "img": "photos/experts/rachel.webp", "name": "Rachel Poonsiriwong", "title": "Graduate Researcher", "org": "MIT Media Labs" }
  ]
};
