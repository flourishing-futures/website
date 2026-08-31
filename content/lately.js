/*
  Lately Recap — homepage card deck
  ----------------------------------
  Each entry becomes a card in the flipping deck.
  Keep at least 2 cards for the animation to work.

  Fields:
    heading     — card title (HTML allowed, e.g. <br> for line breaks)
    body        — array of paragraph strings
    cta.text    — button label
    cta.href    — button link
    cta.style   — button colour: "green", "orange", or "pink"
    image.src   — image path relative to site root (use photos/ folder)
    image.alt   — image description for accessibility
*/
window.SITE_CONTENT = window.SITE_CONTENT || {};
window.SITE_CONTENT.lately = [
  {
    "heading": "Conscious Builder Community:<br>Gathering #2",
    "body": [
      "The Conscious Builders Community is a program developed to bring AI developers, designers, researchers and ethicists together to build better products. Here, we share, debate, workshop and design.",
      "Through inspiration sessions and hands-on product garages: we help builders to engage in critical conversations, identify potential risks, imagine better possibilities, and stay inspired and connected to the human impact of working with AI."
    ],
    "cta": { "text": "Find more events", "href": "community.html", "style": "green" },
    "image": { "src": "photos/community-photo.png", "alt": "Conscious Builder Community gathering" }
  },
  {
    "heading": "AIMPACT SG Benchmark",
    "body": [
      "Test highlight",
      "A AI benchmark focused on human impact",
      "another paragraph"
    ],
    "cta": { "text": "Find more events", "href": "community.html", "style": "green" },
    "image": { "src": "design_ai.jpg", "alt": "Design for AI" }
  },
  {
    "heading": "Conscious Builder Community:<br>Gathering #2",
    "body": [
      "The Conscious Builders Community is a program developed to bring AI developers, designers, researchers and ethicists together to build better products. Here, we share, debate, workshop and design.",
      "Through inspiration sessions and hands-on product garages: we help builders to engage in critical conversations, identify potential risks, imagine better possibilities, and stay inspired and connected to the human impact of working with AI."
    ],
    "cta": { "text": "Find more events", "href": "community.html", "style": "green" },
    "image": { "src": "photos/community-photo.png", "alt": "Conscious Builder Community gathering" }
  }
];
