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
    "category": "Research",
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
    "category": "Research",
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
  },
  {
    "title": "AI, Help Me Think — But for Myself",
    "source": "Microsoft Research",
    "category": "Research",
    "date": "2025-05-01",
    "body": [
      "What if AI helped us think, rather than simply telling us what to do? This study compares an AI that gives recommendations with one that first builds on the user’s own reasoning — suggesting that seemingly small interaction choices can change how much agency and thought remains with the human."
    ],
    "cta": { "text": "Read", "href": "https://www.microsoft.com/en-us/research/publication/ai-help-me-think-but-for-myself-assisting-people-in-complex-decision-making-by-providing-different-kinds-of-cognitive-support/" },
    "keywords": ["microsoft research", "chi 2025", "cognitive support", "decision making", "human agency", "recommendations", "reasoning", "interaction design", "critical thinking"],
    "image": { "src": "photos/res-help-me-think.webp", "alt": "A flat illustration of a blue human-head profile holding up an open hand, from which a glowing yellow lightbulb rises, ringed by orbit lines and colourful stars" }
  },
  {
    "title": "The Impact of Generative AI on Critical Thinking",
    "source": "Microsoft Research",
    "category": "Research",
    "date": "2025-04-01",
    "body": [
      "AI doesn't necessarily remove critical thinking — but it may quietly change where and when we do it. Looking at hundreds of real workplace uses, this research found that greater confidence in AI was associated with less critical-thinking effort, raising an important design question: how might our tools encourage people to stay actively engaged?"
    ],
    "cta": { "text": "Read", "href": "https://www.microsoft.com/en-us/research/publication/the-impact-of-generative-ai-on-critical-thinking-self-reported-reductions-in-cognitive-effort-and-confidence-effects-from-a-survey-of-knowledge-workers/" },
    "keywords": ["microsoft research", "chi 2025", "critical thinking", "cognitive effort", "knowledge workers", "generative ai", "confidence", "cognitive offloading", "workplace"],
    "image": { "src": "photos/res-critical-thinking.webp", "alt": "An illustration of a human head in profile against a green grid, the top of the skull open like a cup, surrounded by floating chat windows, charts and network diagrams" }
  },
  {
    "title": "Future You",
    "source": "MIT Media Lab",
    "category": "Research",
    "date": "2025-02-26",
    "body": [
      "What if AI were designed around a human quality we actually wanted to strengthen? “Future You” lets people converse with an AI-generated version of their older selves; after a brief interaction, participants reported greater connection with their future selves and reduced anxiety. It's a lovely example of starting with the human outcome first, then asking what AI might make possible."
    ],
    "cta": { "text": "Read", "href": "https://www.media.mit.edu/publications/future-you-a-conversation-with-an-ai-generated-future-self-reduces-anxiety-negative-emotions-and-increases-future-self-continuity/" },
    "keywords": ["mit media lab", "future self", "future self continuity", "anxiety", "wellbeing", "generative ai", "conversation", "human outcome", "psychology"],
    "image": { "src": "photos/res-future-you.webp", "alt": "A tablet on a stand showing a 'FUTURE YOU — Get Started' welcome screen, with a wall photo of two people embracing in the background" }
  },
  {
    "title": "I Teach Creative Writing. This Is What A.I. Is Doing to Students",
    "source": "The New York Times",
    "category": "Opinions",
    "date": "2025-07-18",
    "body": [
      "A wonderfully conflicted account of what it actually feels like to let AI into your life. O'Rourke finds that it can give her back time, energy and even agency... but also notices the moment its suggestions begin crowding out her own thought. A much more human question than “is AI good or bad?”: what should we happily hand over, and what do we want to remain ours?"
    ],
    "cta": { "text": "Read", "href": "https://www.nytimes.com/2025/07/18/opinion/ai-chatgpt-school.html" },
    "keywords": ["new york times", "opinion", "creative writing", "students", "education", "meghan o'rourke", "authorship", "human agency", "thinking", "chatgpt"],
    "image": { "src": "photos/res-creative-writing.webp", "alt": "A woman's face dissolving into a page of looping handwritten cursive, one hand raised to her chin, with a New York Times 'Published 2025' badge" }
  },
  {
    "title": "The People Outsourcing Their Thinking to AI",
    "source": "The Atlantic",
    "category": "Opinions",
    "date": "2025-12-02",
    "body": [
      "Some people aren't just using AI to write emails or find information — they're beginning to consult it about almost everything. Through everyday stories of people outsourcing decisions, reflection and emotional labour, this piece shows that “cognitive offloading” isn't an abstract research concept, but a new relationship we're slowly learning to live with."
    ],
    "cta": { "text": "Read", "href": "https://www.theatlantic.com/technology/2025/12/people-outsourcing-their-thinking-ai/685093/" },
    "keywords": ["the atlantic", "cognitive offloading", "outsourcing thinking", "decisions", "emotional labour", "dependence", "everyday ai", "human agency"],
    "image": { "src": "photos/res-outsourcing.webp", "alt": "A glossy iridescent 3D human head in profile with a pixelated grid bar masking the eyes, set against a soft gradient circle" }
  },
  {
    "title": "What It's Like to Brainstorm with a Bot",
    "source": "The New Yorker",
    "category": "Opinions",
    "date": "2025-08-09",
    "body": [
      "A more optimistic picture of AI: not a machine that gives you the answer, but something you can genuinely think alongside. Following researchers using AI at the edges of problems they don't yet know how to solve, the piece asks what new forms of creativity might emerge when the machine becomes a provocateur rather than an oracle."
    ],
    "cta": { "text": "Read", "href": "https://www.newyorker.com/culture/the-weekend-essay/what-its-like-to-brainstorm-with-a-bot" },
    "keywords": ["the new yorker", "brainstorm", "creativity", "thinking alongside", "research", "provocateur", "collaboration", "ideation", "weekend essay"],
    "image": { "src": "photos/res-brainstorm.webp", "alt": "A psychedelic symmetrical illustration of two facing human profiles in pink, orange, blue and olive, rippling with concentric patterned lines" }
  },
  {
    "title": "A.I. Is Coming for Culture",
    "source": "The New Yorker",
    "category": "Opinions",
    "date": "2025-09-01",
    "body": [
      "We've spent years worrying about algorithms deciding what culture we see; generative AI introduces a stranger possibility — algorithms increasingly helping make the culture itself. This essay asks what abundance, recommendation and machine-generated creativity might do to taste, imagination and the value we attach to human-made things."
    ],
    "cta": { "text": "Read", "href": "https://www.newyorker.com/magazine/2025/09/01/ai-is-coming-for-culture/" },
    "keywords": ["the new yorker", "culture", "taste", "imagination", "generative ai", "recommendation", "creativity", "human-made", "abundance"],
    "image": { "src": "photos/res-culture.webp", "alt": "A lone figure in a blue coat standing at the edge of a vast funnel-shaped pit whose walls are plastered with framed art, records and photographs descending into darkness" }
  }
];
