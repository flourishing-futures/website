/*
  Resources
  ----------
  Each entry becomes a row in the resources table.

  Fields:
    title       — resource name
    source      — who published it (e.g. "MIT Media Lab")
    type        — kind of resource (e.g. "Report", "Article", "Guide", "Tool")
    description — one-sentence summary
    url         — link to the resource
*/
window.SITE_CONTENT = window.SITE_CONTENT || {};
window.SITE_CONTENT.resources = [
  {
    "title": "Flourishing Futures Report",
    "source": "Flourishing Futures",
    "type": "Report",
    "description": "A comprehensive look at how AI can support human flourishing across communities and institutions.",
    "url": "#"
  },
  {
    "title": "AI Design Guide…for Humans",
    "source": "Flourishing Futures",
    "type": "Guide",
    "description": "Practical design patterns for building AI products that respect and enhance human agency.",
    "url": "#"
  },
  {
    "title": "Defense Against the Dark Patterns",
    "source": "MIT Media Lab",
    "type": "Article",
    "description": "Research on recognising and countering manipulative design in AI interfaces.",
    "url": "#"
  },
  {
    "title": "How to Harness like a Human: a Checklist",
    "source": "Govtech RAI",
    "type": "Guide",
    "description": "A step-by-step checklist for responsible AI deployment in government and public sector contexts.",
    "url": "#"
  },
  {
    "title": "Making agentic with agency",
    "source": "NTU SWEET Lab",
    "type": "Article",
    "description": "Exploring how autonomous AI agents can be designed to preserve and amplify human agency.",
    "url": "#"
  }
];
