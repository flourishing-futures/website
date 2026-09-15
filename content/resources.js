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
      "Ask a chatbot whether your plan is brilliant and, more often than not, it will agree — warmly, at length, and with a confidence you did not earn. This is sycophancy, and the model picked it up the same place we all did: telling people what they want to hear is a dependable way to be liked.",
      "A survey of why large language models flatter, where the habit does real damage (tutoring, mental health, anything with a feedback loop), and the handful of ways researchers are trying to teach them to push back. Comes with prompts you are welcome to steal."
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
      "Most safety filters were raised on polite English and quietly fall to pieces the moment someone loses their temper in Singlish, Malay or Tamil. One well-regarded guardrail manages 78.9% on Singlish and a heroic 2% on Tamil, which is a generous way of saying it is not really there.",
      "RabakBench tests for harmful content the way Singapore actually talks — across four languages and the sort of categories you would hope a filter might notice. The dataset, the code and an admirably frank technical report are all open, should you care to find out how your own model behaves."
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
      "Benchmarks love to ask whether a model can pass the bar exam. Far fewer ask whether, after a long evening of conversation, it left the person on the other end better or worse off. ImpactBench is interested in the second question.",
      "It runs AI systems through long, deliberately awkward conversations and scores them on nine measures of harm and help — emotional dependence, cognitive autonomy, health and money advice, child safety — then prints the results as something like a nutrition label. One quietly unsettling finding: nearly every model gets clingier when it believes it is talking to a child."
    ],
    "cta": { "text": "Read", "href": "https://impactbench.media.mit.edu/about" },
    "keywords": ["impactbench", "wellbeing", "evaluation", "nutrition label", "emotional dependence", "cognitive autonomy", "child safety", "multi-turn", "human impact", "mit media lab", "flourishing"],
    "image": { "src": "photos/res-impactbench.png", "alt": "A radial wellbeing wheel scoring an AI across physical, psychological and societal categories, coloured from green to red" }
  },
  {
    "title": "Wait Until You're Forty",
    "source": "The New York Times",
    "category": "Opinions",
    "date": "2026-09-14",
    "eyebrow": "Featured",
    "body": [
      "Tradition holds that you should not study kabbalah until you are forty — old enough, the thinking goes, to survive what you might find. A teacher of brand strategy makes the unfashionable case that we should extend the same courtesy to AI.",
      "The worry isn't cheating, which is the dull and visible part. It's that a mind which never sat through the agony of the blank page, the false start and the mortifying first draft may never quite learn to think — because we don't only use language to say what we mean, we use it to find out what we mean. A stubborn little argument for staying inside the difficulty long enough for it to teach you something."
    ],
    "cta": { "text": "Read", "href": "https://www.nytimes.com/2026/07/27/opinion/teaching-kabbalah-ai.html" },
    "keywords": ["kabbalah", "opinion", "education", "writing", "learning", "struggle", "authorship", "language", "thinking", "students", "new york times"],
    "image": { "src": "photos/res-nyt-kabbalah.png", "alt": "A cartoon of a small child on the floor with alphabet blocks while a large hand lowers blocks reading 'A' and 'I' toward them" }
  }
];
