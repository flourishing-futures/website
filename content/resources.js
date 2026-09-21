/*
  Resources
  ----------
  Powers the Resource Hub (resource-centre.html): the newest 3 entries
  (by `date`) are pulled into the hero deck, the rest stream into the
  searchable/filterable grid below. Rendered at runtime by js/render-content.js.

  Fields:
    title    — resource name
    source   — who published it (e.g. "MIT Media Lab"); rendered as "by …"
    category — exactly one of: "Research" | "Opinions" | "Guides" | "Inspiration"
    date     — "YYYY-MM-DD"; drives ordering (newest 3 → deck)
    eyebrow  — optional small label above the title (deck cards default to
               "Featured" if omitted)
    body     — array of paragraph strings
    cta      — { text: "Download" | "Read" | …, href: "#" }
    keywords — optional array of extra searchable terms
    image    — optional { src, alt }; omit to use a gradient placeholder
*/
window.SITE_CONTENT = window.SITE_CONTENT || {};
window.SITE_CONTENT.resources = [
  {
    "title": "Yes, You're Absolutely Right, Right?",
    "source": "ai@govtech",
    "category": "Inspiration",
    "date": "2026-09-14",
    "eyebrow": "Featured",
    "body": [
      "Ask a chatbot whether your plan is brilliant and, more often than not, it will agree: warmly, at length, and with a confidence you did not earn. This is a survey of why large language models flatter, where the habit does real damage (tutoring, mental health, anything with a feedback loop), and the handful of ways researchers are trying to teach them to push back. Comes with prompts you are welcome to steal."
    ],
    "cta": { "text": "Read", "href": "https://blog.ai.gov.sg/yes-youre-absolutely-right-right-a-mini-survey-on-llm-sycophancy/" },
    "keywords": ["sycophancy", "flattery", "rlhf", "alignment", "reward hacking", "chatbots", "llm behaviour", "govtech"],
    "image": { "src": "photos/res-sycophancy.webp", "alt": "An illustration of a fawning robot trailing love-hearts, groveling at the heels of a person striding away" }
  },
  {
    "title": "RabakBench: Safety, Made Local",
    "source": "ai@govtech",
    "category": "Inspiration",
    "date": "2026-09-14",
    "eyebrow": "Featured",
    "body": [
      "Most safety filters were raised on polite English and fail when someone loses their temper in Singlish, Malay or Tamil. RabakBench tests for harmful content the way Singapore actually talks, across four languages and the sort of categories you would hope a filter might notice. The dataset, the code and technical report are open, should you care to find out how your own model behaves."
    ],
    "cta": { "text": "Read", "href": "https://blog.ai.gov.sg/rabakbench-multilingual-ai-safety-evaluation-made-local/" },
    "keywords": ["rabakbench", "safety", "guardrails", "multilingual", "singlish", "tamil", "malay", "chinese", "content moderation", "benchmark", "red-teaming", "govtech", "sutd"],
    "image": { "src": "photos/res-rabakbench.webp", "alt": "An illustration of an online scene turning toxic — phones, harsh symbols and jeering speech bubbles around a distressed figure" }
  },
  {
    "title": "ImpactBench: A Nutrition Label for AI",
    "source": "MIT Media Lab",
    "category": "Research",
    "date": "2026-09-14",
    "eyebrow": "Featured",
    "body": [
      "Most benchmarks ask whether a model can pass the bar exam. Far fewer ask whether it left the person on the other end better or worse off. ImpactBench runs AI systems through long, awkward conversations and scores them on nine measures of harm and help (emotional dependence, cognitive autonomy, health and money advice, child safety), then prints the results as something like a nutrition label. The finding that sticks: nearly every model gets clingier when it believes it is talking to a child."
    ],
    "cta": { "text": "Read", "href": "https://impactbench.media.mit.edu/about" },
    "keywords": ["impactbench", "wellbeing", "evaluation", "nutrition label", "emotional dependence", "cognitive autonomy", "child safety", "multi-turn", "human impact", "mit media lab", "flourishing"],
    "image": { "src": "photos/res-impactbench.webp", "alt": "A radial wellbeing wheel scoring an AI across physical, psychological and societal categories, coloured from green to red" }
  },
  {
    "title": "You Can AI When You're Forty",
    "source": "The New York Times",
    "category": "Opinions",
    "date": "2026-09-14",
    "eyebrow": "Featured",
    "body": [
      "Tradition holds that you should not study kabbalah until you are forty, old enough to survive what you might find, and a teacher of brand strategy makes the unfashionable case for extending AI the same courtesy. Cheating is the dull and visible worry. The deeper one is that a mind which never sat through the agony of the blank page and the mortifying first draft may never learn to think, since we use language to work out what we mean and not only to report it."
    ],
    "cta": { "text": "Read", "href": "https://www.nytimes.com/2026/07/27/opinion/teaching-kabbalah-ai.html" },
    "keywords": ["kabbalah", "opinion", "education", "writing", "learning", "struggle", "authorship", "language", "thinking", "students", "new york times"],
    "image": { "src": "photos/res-nyt-kabbalah.webp", "alt": "A cartoon of a small child on the floor with alphabet blocks while a large hand lowers blocks reading 'A' and 'I' toward them" }
  },
  {
    "title": "Education as an AI Safety Area",
    "source": "Ruxandra Teslo",
    "category": "Opinions",
    "date": "2026-09-18",
    "eyebrow": "Featured",
    "body": [
      "The lurid version of AI risk involves a sudden takeover, a machine that decides one afternoon that it no longer needs us. This essay worries about something slower and more embarrassing: that we hand our thinking over a piece at a time and forget how it was done, right up until the moment we need it to govern the very systems we outsourced it to. Reformers once dropped knowledge and memorisation and expected 'critical thinking' to survive; we are now asked to hand off thinking itself and trust that agency will carry on regardless. It will not, because our purposes are braided into what we know and what we practise."
    ],
    "cta": { "text": "Read", "href": "https://www.writingruxandrabio.com/p/education-as-an-ai-safety-area" },
    "keywords": ["opinion", "education", "ai safety", "human agency", "critical thinking", "knowledge", "cognitive offloading", "learning", "judgment", "ruxandra teslo", "substack"],
    "image": { "src": "photos/res-agency.webp", "alt": "An illustration of a large blue robot in profile with a small child perched on its shoulder, reaching toward a warm glow of school supplies — a book, pencils, ruler and notebook — cupped in its open hand" }
  }
];
