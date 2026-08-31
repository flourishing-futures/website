/*
  Community Events
  -----------------
  Events are sorted by date (newest first) automatically.
  Upcoming vs Past is computed from today's date — no need to set it manually.

  Fields:
    date        — event date in YYYY-MM-DD format (e.g. "2026-08-18")
    title       — event name
    description — one or two sentences about the event
    tags        — array of labels (e.g. ["Workshop", "AI product builders"])
    link        — external URL (e.g. Luma link), or null if none
*/
window.SITE_CONTENT = window.SITE_CONTENT || {};
window.SITE_CONTENT.events = [
  {
    "date": "2026-08-18",
    "title": "Conscious Builders Community — Session 2",
    "description": "Join AI product developers, designers, researchers and ethicists for hands-on workshops, product design clinics and critical conversations about the human impact of the products we build.",
    "tags": ["Workshop", "AI product builders", "designers", "researchers"],
    "link": null
  },
  {
    "date": "2026-06-18",
    "title": "Human-AI Flourishing Workshop: From Framework to Practice",
    "description": "A hands-on workshop translating the Human Flourishing framework into practical design and evaluation methods for AI teams. Over 40 participants explored how the spectrum from Responsible AI to AI for Human Possibility applies to concrete product decisions.",
    "tags": ["Workshop", "AI product teams", "designers", "policymakers"],
    "link": "https://luma.com/bno690jc"
  },
  {
    "date": "2026-05-21",
    "title": "Human-Centred AI: Intentions, Decisions, and Impact",
    "description": "A seminar exploring how design intent shapes AI outcomes — drawing from MIT Media Lab research and the emerging Flourishing Futures framework. Speakers presented research on cognitive offloading, AI confidence signals, and early SG ImpactBench findings.",
    "tags": ["Seminar", "Researchers", "public officers", "AI practitioners"],
    "link": "https://luma.com/7ni74a2k"
  }
];
