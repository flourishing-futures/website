/* ------------------------------------------------------------------ *
 * Government theme — a separate, text-only view of each page.
 *
 * The playful pages are built from absolutely-positioned art, so a palette
 * swap can't turn them into a "made with tables" government site. Instead
 * this file renders a second, illustration-free DOM (.gov-view) at the end of
 * <body>, and css/gov.css decides which view shows:
 *   html[data-theme="gov"]  → only .gov-view
 *   anything else           → .gov-view is display:none (Trendy/Grownup untouched)
 *
 * Copy is never duplicated: per-page adapters read it out of the trendy DOM
 * and window.SITE_CONTENT, so editing the HTML or content/*.js updates both
 * views. Every section builder is wrapped so a selector miss just drops that
 * section instead of throwing.
 *
 * Loaded at the end of <body>, BEFORE js/theme.js (which mounts a theme switch
 * into .gov-header__tools).
 * ------------------------------------------------------------------ */
(function () {
  'use strict';

  var root = document.documentElement;
  var data = window.SITE_CONTENT || {};
  var MAIL = 'mailto:hello@flourishingfutures.io';
  var FONT_HREF = 'https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,600&display=swap';

  var PAGES = [
    { href: 'index.html', label: 'Home' },
    { href: 'about.html', label: 'About' },
    { href: 'the-lab.html', label: 'Lab' },
    { href: 'resource-centre.html', label: 'Resource Hub' },
    { href: 'community.html', label: 'Community' }
  ];

  // Home "Key questions" — gov-only copy. Shown as a ticket list that shows
  // QS_VISIBLE rows (CSS --qs-visible; fewer on mobile) and auto-scrolls the rest.
  var QUESTIONS = [
    'How could AI open up new abilities, choices and opportunities?',
    'How might we design for learning, curiosity and judgement in everyday AI products?',
    'When should AI be a tool, collaborator, coach or challenger; and how should those relationships evolve?',
    'How could AI help us question assumptions, explore different perspectives and create approaches we wouldn\u2019t otherwise consider?',
    'Can AI strengthen understanding, collaboration and care between colleagues, citizens and communities?',
    'If AI frees up time and attention, what should we make room for?',
    'What should remain meaningfully human as AI becomes more capable?',
    'How does using AI change our sense of confidence, identity, purpose and pride in our work?',
    'How can people stay authors of their own choices when AI is advising or acting for them?',
    'How could AI make government easier to understand and navigate?',
    'How do we design AI for people with different abilities, languages, resources and levels of confidence?',
    'What makes an AI-enabled public service worthy of trust?',
    'How can citizens and public officers help shape the AI futures they want?',
    'What should we observe over time about capability, agency, relationships and wellbeing, alongside productivity?',
    'What kind of public service (and society) do we want to become with AI?'
  ];
  var QS_MAX_VISIBLE = 4;    // clones appended for a seamless loop
  var QS_INTERVAL = 3000;    // ms between steps
  var USER_IDLE = 1800;      // ms after the last manual scroll/drag before tickers resume

  var TICKER_SPEED = 36;     // px per second, Community photo ticker
  var GALLERY_INTERVAL = 3500; // ms per photo, Merchandise gallery

  // The stat strip reads well but the numbers aren't doing us favours yet.
  var SHOW_STATS = false;

  var reducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Category → tone used by card chips and pills.
  var TONES = { Research: 'blue', Opinions: 'pink', Guides: 'amber', Inspiration: 'violet' };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* ---------- Helpers ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Plain text of a trendy-DOM node, with <br> read as a space.
  function text(sel, ctx) {
    var el = typeof sel === 'string' ? $(sel, ctx) : sel;
    if (!el) return '';
    var c = el.cloneNode(true);
    $$('br', c).forEach(function (b) { b.parentNode.replaceChild(document.createTextNode(' '), b); });
    return c.textContent.replace(/\s+/g, ' ').trim();
  }

  function attr(sel, name) {
    var el = $(sel);
    return el ? el.getAttribute(name) : null;
  }

  // Government eyebrows don't trail off — drop "..." / "…".
  function clean(label) { return String(label || '').replace(/[\s.…]+$/, ''); }

  function noEmoji(s) {
    return String(s || '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').replace(/\s+/g, ' ').trim();
  }

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function fmtDate(d) {
    if (typeof d === 'string') d = new Date(d + 'T00:00:00');
    if (!d || isNaN(d.getTime())) return '';
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }

  function isExternal(href) { return /^https?:/i.test(href || ''); }

  function linkAttrs(href) {
    return 'href="' + esc(href || '#') + '"' +
      (isExternal(href) ? ' target="_blank" rel="noopener"' : '');
  }

  function sortedResources() {
    return (data.resources || []).slice().sort(function (a, b) {
      return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
    });
  }

  /* ---------- Glyphs (UI icons, not illustrations) ---------- */
  var PATHS = {
    calendar: '<path d="M8 2v4M16 2v4M3 10h18"/><rect x="3" y="4" width="18" height="18" rx="2"/>',
    doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    people: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chevron: '<path d="M6 9l6 6 6-6"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>'
  };

  function icon(name, cls) {
    return '<svg class="' + (cls || 'gov-ico') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      PATHS[name] + '</svg>';
  }

  var ARROW =
    '<svg class="gov-arrow" viewBox="0 0 40 16" fill="none" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 8h37M31 1l7 7-7 7"/></svg>';

  /* ---------- Components ---------- */
  function eyebrow(label, muted) {
    if (!label) return '';
    return '<p class="gov-eyebrow' + (muted ? ' gov-eyebrow--muted' : '') + '">' + esc(clean(label)) + '</p>';
  }

  function btn(label, href, mod) {
    return '<a class="gov-btn' + (mod ? ' gov-btn--' + mod : '') + '" ' + linkAttrs(href) + '>' +
      esc(label) + (isExternal(href) ? ' <span aria-hidden="true">↗</span>' : ' <span aria-hidden="true">→</span>') + '</a>';
  }

  function textLink(label, href) {
    return '<a class="gov-link" ' + linkAttrs(href) + '>' + esc(label) + ' <span aria-hidden="true">→</span></a>';
  }

  function crumbs(label) {
    return '<nav class="gov-crumbs" aria-label="Breadcrumb"><ol>' +
      '<li><a href="index.html">Home</a></li>' +
      '<li aria-current="page">' + esc(label) + '</li></ol></nav>';
  }

  // o: { crumb, eyebrow, title, lead: [str], cta: {label, href}, compact, home }
  function hero(o) {
    var leads = (o.lead || []).filter(Boolean).map(function (p) {
      return '<p class="gov-hero__lead">' + esc(p) + '</p>';
    }).join('');
    return '<section class="gov-hero' + (o.compact ? ' gov-hero--compact' : '') + (o.home ? ' gov-hero--home' : '') + '">' +
      '<div class="gov-wrap"><div class="gov-hero__copy">' +
        (o.crumb ? crumbs(o.crumb) : '') +
        eyebrow(o.eyebrow) +
        '<h1 class="gov-hero__title">' + esc(o.title) + '</h1>' +
        leads +
        (o.cta ? '<p class="gov-hero__cta">' + btn(o.cta.label, o.cta.href) + '</p>' : '') +
      '</div></div></section>';
  }

  // Section heading block: eyebrow, H2, optional lead, optional right-aligned aside.
  function head(eb, title, lead, aside) {
    return '<div class="gov-head' + (aside ? ' gov-head--aside' : '') + '"><div class="gov-head__main">' +
      eyebrow(eb) +
      (title ? '<h2 class="gov-h2">' + esc(title) + '</h2>' : '') +
      (lead ? '<p class="gov-lead">' + esc(lead) + '</p>' : '') +
      '</div>' + (aside ? '<div class="gov-head__aside">' + aside + '</div>' : '') + '</div>';
  }

  function section(inner, mod, id) {
    return '<section class="gov-section' + (mod ? ' ' + mod : '') + '"' + (id ? ' id="' + id + '"' : '') + '>' +
      '<div class="gov-wrap">' + inner + '</div></section>';
  }

  // items: [{ n, label }]
  function stats(items) {
    items = items.filter(function (s) { return s.n; });
    if (!items.length) return '';
    return '<section class="gov-stats" aria-label="At a glance"><div class="gov-wrap gov-stats__grid">' +
      items.map(function (s) {
        return '<div class="gov-stat"><p class="gov-stat__num">' + esc(s.n) + '</p>' +
          '<p class="gov-stat__label">' + esc(s.label) + '</p></div>';
      }).join('') + '</div></section>';
  }

  // Full-bleed numbered rows. items: [{ eyebrow, title, body, href, muted }]
  function rows(items) {
    return '<div class="gov-rows">' + items.map(function (r, i) {
      var tag = r.href ? 'a' : 'div';
      return '<' + tag + ' class="gov-row' + (r.href ? ' gov-row--link' : '') + '"' +
          (r.href ? ' ' + linkAttrs(r.href) : '') + '>' +
        '<div class="gov-wrap gov-row__inner">' +
          '<span class="gov-row__num">' + pad(i + 1) + '</span>' +
          '<div class="gov-row__main">' +
            eyebrow(r.eyebrow, r.muted) +
            '<h3 class="gov-row__title">' + esc(r.title) + '</h3>' +
            '<p class="gov-row__body">' + esc(r.body) + '</p>' +
          '</div>' +
          (r.href ? '<span class="gov-row__go">' + ARROW + '</span>' : '') +
        '</div></' + tag + '>';
    }).join('') + '</div>';
  }

  // cols: [label]; body: [{ cells: [html], attrs }]. Cells are pre-escaped HTML.
  function table(cols, body, opts) {
    opts = opts || {};
    return '<div class="gov-table-wrap"><table class="gov-table' + (opts.mod ? ' ' + opts.mod : '') + '"' +
        (opts.id ? ' id="' + opts.id + '"' : '') + '>' +
      (opts.caption ? '<caption class="gov-sr">' + esc(opts.caption) + '</caption>' : '') +
      '<thead><tr>' + cols.map(function (c) { return '<th scope="col">' + esc(c) + '</th>'; }).join('') + '</tr></thead>' +
      '<tbody>' + body.map(function (r) {
        return '<tr' + (r.attrs || '') + '>' + r.cells.map(function (c, i) {
          return '<td data-label="' + esc(cols[i]) + '">' + c + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
  }

  // Key/value table. pairs: [[label, html]]
  function kv(pairs, caption) {
    return '<div class="gov-table-wrap"><table class="gov-table gov-table--kv">' +
      (caption ? '<caption class="gov-sr">' + esc(caption) + '</caption>' : '') + '<tbody>' +
      pairs.map(function (p) {
        return '<tr><th scope="row">' + esc(p[0]) + '</th><td>' + p[1] + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function pill(label, tone) {
    return '<span class="gov-pill gov-pill--' + (tone || 'grey') + '"><i aria-hidden="true"></i>' + esc(label) + '</span>';
  }

  // o: { href, icon, tone, titleHtml, meta: [str], body, tag }
  function card(o) {
    return '<a class="gov-card" ' + linkAttrs(o.href) + '>' +
      '<span class="gov-card__chip gov-tone--' + o.tone + '">' + icon(o.icon) + '</span>' +
      '<h3 class="gov-card__title">' + o.titleHtml + '</h3>' +
      '<p class="gov-card__meta">' + icon('calendar', 'gov-ico gov-ico--sm') +
        o.meta.filter(Boolean).map(esc).join('<span class="gov-dot" aria-hidden="true">·</span>') + '</p>' +
      '<p class="gov-card__body">' + esc(o.body) + '</p>' +
      '<div class="gov-card__foot">' + pill(o.tag, o.tone) + '</div>' +
    '</a>';
  }

  function resourceCard(r) {
    return card({
      href: r.cta && r.cta.href, icon: 'doc', tone: TONES[r.category] || 'blue',
      titleHtml: esc(r.title), meta: [fmtDate(r.date), r.source],
      body: (r.body || [])[0], tag: r.category
    });
  }

  function eventCard(up) {
    return card({
      href: up.cta && up.cta.href, icon: 'people', tone: 'green',
      titleHtml: up.title, meta: [noEmoji(up.when), noEmoji(up.where)],
      body: (up.body || [])[0], tag: 'Event'
    });
  }

  function cards(list) { return '<div class="gov-cards">' + list.join('') + '</div>'; }

  // items: [{ title, body }]
  function accordion(items) {
    return '<div class="gov-acc">' + items.map(function (it) {
      return '<details class="gov-acc__item"><summary class="gov-acc__sum">' +
        '<span>' + esc(it.title) + '</span>' + icon('plus', 'gov-ico gov-acc__icon') + '</summary>' +
        '<div class="gov-acc__body"><p>' + esc(it.body) + '</p></div></details>';
    }).join('') + '</div>';
  }

  function notice(html) {
    return '<div class="gov-notice" role="note">' + icon('info', 'gov-ico gov-notice__icon') +
      '<div class="gov-notice__body">' + html + '</div></div>';
  }

  function ctaBand(title, ctaHtml) {
    return '<section class="gov-band"><div class="gov-wrap gov-band__inner">' +
      '<h2 class="gov-band__title">' + esc(title) + '</h2>' + ctaHtml + '</div></section>';
  }

  /* ---------- Chrome: header + footer ---------- */
  // Banner: two-line wordmark (mirrors the trendy lockup) + actions. Sticky.
  function header() {
    return '<a class="gov-skip" href="#gov-main">Skip to main content</a>' +
      '<header class="gov-header"><div class="gov-wrap gov-header__inner">' +
        '<a class="gov-brand" href="index.html" aria-label="Flourishing Futures: AI for Human Possibilities">' +
          '<span class="gov-brand__l1">Flourishing Futures:</span>' +
          '<span class="gov-brand__l2">AI for Human Possibilities</span></a>' +
        '<div class="gov-header__actions">' +
          '<a class="gov-btn gov-btn--soft" href="community.html">Join the community</a>' +
          '<a class="gov-btn gov-btn--violet" href="' + MAIL + '">Contact us</a>' +
          '<div class="gov-header__tools"></div>' +
        '</div>' +
      '</div></header>';
  }

  // Main navbar. Sits under the banner (or under the hero on Home), rides up
  // and docks beneath the sticky banner.
  function nav(current) {
    return '<nav class="gov-nav" aria-label="Main"><div class="gov-wrap gov-nav__inner">' +
      '<ul class="gov-nav__links">' + PAGES.map(function (p) {
        var on = p.label === current;
        return '<li><a class="gov-nav__link" href="' + p.href + '"' + (on ? ' aria-current="page"' : '') + '>' +
          esc(p.label) + '</a></li>';
      }).join('') + '</ul>' +
    '</div></nav>';
  }

  function footer() {
    var desc = attr('meta[name="description"]', 'content') || '';
    var credit = text('.site-footer__credit') || 'An initiative by the GovTech Innovation Office';
    var updated = fmtDate(new Date(document.lastModified));
    return '<footer class="gov-footer"><div class="gov-wrap">' +
      '<div class="gov-footer__top">' +
        '<div class="gov-footer__about"><p class="gov-footer__name">Flourishing Futures</p>' +
          '<p class="gov-footer__desc">' + esc(desc) + '</p></div>' +
        '<nav class="gov-footer__cols" aria-label="Footer">' +
          '<div><p class="gov-footer__h">Explore</p><ul>' + PAGES.map(function (p) {
            return '<li><a href="' + p.href + '">' + esc(p.label) + '</a></li>';
          }).join('') + '</ul></div>' +
          '<div><p class="gov-footer__h">Contact</p><ul>' +
            '<li><a href="' + MAIL + '">hello@flourishingfutures.io</a></li></ul></div>' +
        '</nav>' +
      '</div>' +
      '<div class="gov-footer__bottom"><p>' + esc(credit) + '</p>' +
        (updated ? '<p>Last updated ' + esc(updated) + '</p>' : '') + '</div>' +
    '</div></footer>';
  }

  /* ---------- Page adapters ---------- */

  function pageHome() {
    var res = sortedResources();
    var cmty = data.community || {};
    var cols = $$('.things__col').map(function (c, i) {
      return {
        eyebrow: c.getAttribute('data-quip'),
        title: text('.things__heading', c),
        body: text('.things__body', c),
        href: ['about.html', 'the-lab.html', 'community.html'][i]
      };
    });
    var logos = $$('.partners .partner-logo img');
    var visionBtn = $('.vision .btn');
    var collab = $('.partners-section .btn');

    return [
      function () {
        return hero({
          eyebrow: 'Flourishing Futures',
          title: 'AI for human possibility.',
          lead: [text('.vision__text')],
          home: true,
          cta: visionBtn ? { label: text(visionBtn), href: visionBtn.getAttribute('href') } : null
        });
      },
      function () {
        if (!SHOW_STATS) return '';
        return stats([
          { n: res.length ? res.length + '+' : '', label: 'Resources published' },
          { n: cols.length ? String(cols.length) : '', label: 'Workstreams' },
          { n: (cmty.experts || []).length ? cmty.experts.length + '+' : '', label: 'Experts in our network' },
          { n: logos.length ? String(logos.length) : '', label: 'Partner organisations' }
        ]);
      },
      function () {
        if (!cols.length) return '';
        return section(head(text('.things__label'), 'What does Flourishing Futures do'), 'gov-section--flush') + rows(cols);
      },
      function () {
        return section(head('Key questions', 'What we are asking') + questionList(), 'gov-section--rule');
      },
      function () {
        var list = [];
        if (cmty.upcoming) list.push(eventCard(cmty.upcoming));
        res.slice(0, cmty.upcoming ? 2 : 3).forEach(function (r) { list.push(resourceCard(r)); });
        if (!list.length) return '';
        return section(
          head(text('.lately__title') || 'Lately', 'Latest updates', '', textLink('View all resources', 'resource-centre.html')) +
          cards(list), 'gov-section--rule');
      },
      function () {
        if (!logos.length) return '';
        var grid = '<ul class="gov-logos">' + logos.map(function (img) {
          return '<li class="gov-logos__cell"><img src="' + esc(img.getAttribute('src')) + '" alt="" loading="lazy" decoding="async">' +
            '<span>' + esc(img.getAttribute('alt')) + '</span></li>';
        }).join('') + '</ul>';
        return section(
          head('Partners', text('.partners-section__title'), '',
            collab ? btn(text(collab), collab.getAttribute('href')) : '') + grid,
          'gov-section--rule');
      }
    ];
  }

  // "Open tickets" list: a table-styled scroll box showing a few rows at a time.
  // It ticks down one row at a time, but it's a real scroller, so the reader can
  // take over (wheel, drag, keys) and it resumes from wherever they leave it.
  // Clones of the first rows are appended so the tick loops seamlessly; under
  // reduced motion there are no clones and no ticking.
  function questionList() {
    var shown = QUESTIONS.map(function (q, i) { return { q: q, n: i + 1 }; });
    if (!reducedMotion) shown = shown.concat(shown.slice(0, QS_MAX_VISIBLE));
    var rowsHtml = shown.map(function (it, k) {
      return '<li class="gov-qs__row"' + (k >= QUESTIONS.length ? ' aria-hidden="true"' : '') + '>' +
        '<span class="gov-num gov-qs__num">' + pad(it.n) + '</span>' +
        '<span class="gov-qs__q">' + esc(it.q) + '</span>' +
        '<span class="gov-qs__status">' + pill('Open', 'green') + '</span></li>';
    }).join('');
    return '<div class="gov-qs' + (reducedMotion ? ' gov-qs--static' : '') + '">' +
      '<div class="gov-qs__head" aria-hidden="true"><span>No.</span><span>Question</span><span>Status</span></div>' +
      '<div class="gov-qs__viewport" tabindex="0" role="region" aria-label="Key questions (scrollable)">' +
        '<ol class="gov-qs__track">' + rowsHtml + '</ol></div>' +
      '<div class="gov-qs__foot"><span>' + QUESTIONS.length + ' open questions · Scroll to browse</span>' +
        (reducedMotion ? '' : '<button type="button" class="gov-pause" aria-pressed="false">Pause</button>') +
      '</div></div>';
  }

  // Pause/Resume toggle shared by the tickers. Returns a getter.
  function pauseToggle(btn) {
    var paused = false;
    if (btn) btn.addEventListener('click', function () {
      paused = !paused;
      btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      btn.textContent = paused ? 'Resume' : 'Pause';
    });
    return function () { return paused; };
  }

  function govActive() { return root.getAttribute('data-theme') === 'gov'; }

  function initQuestions(view) {
    var box = $('.gov-qs', view);
    if (!box) return;
    var vp = $('.gov-qs__viewport', box);
    var rowEls = $$('.gov-qs__row', box);
    var total = QUESTIONS.length;
    var rowH = 0, focused = false;
    var lastUser = -Infinity, lastStep = Date.now(), autoUntil = 0;

    function visible() {
      var v = parseInt(getComputedStyle(box).getPropertyValue('--qs-visible'), 10);
      return v > 0 ? Math.min(v, QS_MAX_VISIBLE) : QS_MAX_VISIBLE;
    }

    // Programmatic scrolls are flagged so the scroll listener can tell them
    // apart from the reader's own.
    function go(index, smooth) {
      autoUntil = Date.now() + (smooth ? 1200 : 80);
      vp.scrollTo({ top: index * rowH, behavior: smooth ? 'smooth' : 'auto' });
    }

    // Equalise row heights (questions wrap differently) so every step is one
    // row and the window always frames whole rows. Skipped while hidden.
    function layout() {
      var at = rowH ? Math.round(vp.scrollTop / rowH) : 0;
      rowEls.forEach(function (r) { r.style.height = ''; });
      var h = 0;
      rowEls.forEach(function (r) { h = Math.max(h, r.offsetHeight); });
      if (!h) return;
      rowH = h;
      rowEls.forEach(function (r) { r.style.height = h + 'px'; });
      vp.style.height = h * visible() + 'px';
      go(at, false);
    }

    if (window.ResizeObserver) new ResizeObserver(layout).observe(box);
    else window.addEventListener('resize', layout);
    document.addEventListener('ff:themechange', layout);
    if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', layout);
    layout();

    if (reducedMotion) return;

    function userActed() { lastUser = Date.now(); }
    vp.addEventListener('scroll', function () { if (Date.now() > autoUntil) userActed(); }, { passive: true });
    ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(function (ev) {
      vp.addEventListener(ev, userActed, { passive: true });
    });
    // Keyboard users parked in the box hold it still; a mouse click (which also
    // focuses it) shouldn't, or it would never resume until they click away.
    vp.addEventListener('focus', function () {
      try { focused = vp.matches(':focus-visible'); } catch (_) { focused = false; }
    });
    vp.addEventListener('blur', function () { focused = false; userActed(); });

    var isPaused = pauseToggle($('.gov-pause', box));

    setInterval(function () {
      if (isPaused() || focused || !rowH || document.hidden || !govActive()) return;
      var now = Date.now();
      if (now - lastUser < USER_IDLE || now - lastStep < QS_INTERVAL) return;
      // Resume from wherever the list is now (the reader may have moved it).
      var i = Math.round(vp.scrollTop / rowH);
      if (i >= total) { i -= total; go(i, false); }   // clone zone → same rows at the top
      go(i + 1, true);
      lastStep = now;
    }, 200);
  }

  // Merchandise gallery: cross-fading hero image, thumbnails + prev/next to
  // jump, auto-advances through the series (holds on hover/focus and for a
  // beat after the reader picks a photo).
  function initProductGallery(view) {
    var g = $('.gov-gallery', view);
    if (!g) return;
    var slides = $$('.gov-gallery__slide', g);
    var thumbs = $$('.gov-gallery__thumb', g);
    var count = $('.gov-gallery__count', g);
    var n = slides.length, i = 0, hover = false, lastMove = Date.now();
    if (n < 2) return;
    var isPaused = pauseToggle($('.gov-pause', g));

    function show(k, byUser) {
      i = (k + n) % n;
      slides.forEach(function (s, j) {
        var on = j === i;
        s.classList.toggle('is-active', on);
        if (on) s.removeAttribute('aria-hidden'); else s.setAttribute('aria-hidden', 'true');
      });
      thumbs.forEach(function (t, j) {
        if (j === i) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
      });
      count.textContent = (i + 1) + ' / ' + n;
      lastMove = Date.now() + (byUser ? USER_IDLE : 0);
    }

    thumbs.forEach(function (t, j) { t.addEventListener('click', function () { show(j, true); }); });
    $('.gov-gallery__nav--prev', g).addEventListener('click', function () { show(i - 1, true); });
    $('.gov-gallery__nav--next', g).addEventListener('click', function () { show(i + 1, true); });
    g.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(i - 1, true); }
      if (e.key === 'ArrowRight') { e.preventDefault(); show(i + 1, true); }
    });
    g.addEventListener('mouseenter', function () { hover = true; });
    g.addEventListener('mouseleave', function () { hover = false; lastMove = Date.now(); });

    if (reducedMotion) return;
    setInterval(function () {
      if (hover || isPaused() || document.hidden || !govActive()) return;
      if (g.contains(document.activeElement) && document.activeElement.matches(':focus-visible')) return;
      if (Date.now() - lastMove >= GALLERY_INTERVAL) show(i + 1, false);
    }, 250);
  }

  // Community photo ticker: a transform-driven strip (two copies of the set, so
  // it loops) that drifts left, and can be dragged or trackpad-swiped by hand.
  function initGallery(view) {
    var tk = $('.gov-ticker', view);
    if (!tk) return;
    var track = $('.gov-ticker__track', tk);
    var items = $$('.gov-ticker__item', track);
    var n = items.length / 2;
    var pos = 0, period = 0, hover = false, drag = null, lastUser = -Infinity, last = 0;
    var isPaused = pauseToggle($('.gov-pause', tk.parentNode));

    function measure() { period = n && items[n] ? items[n].offsetLeft - items[0].offsetLeft : 0; }
    function render() {
      if (period) pos = ((pos % period) + period) % period;
      track.style.transform = 'translate3d(' + (-pos).toFixed(2) + 'px,0,0)';
    }
    function userActed() { lastUser = Date.now(); }

    if (window.ResizeObserver) new ResizeObserver(measure).observe(track);
    measure();

    function frame(t) {
      var dt = last ? Math.min(t - last, 64) : 0;
      last = t;
      if (!reducedMotion && !hover && !drag && !isPaused() && !document.hidden && govActive() &&
          Date.now() - lastUser > USER_IDLE) {
        if (!period) measure();
        pos += TICKER_SPEED * dt / 1000;
        render();
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    tk.addEventListener('mouseenter', function () { hover = true; });
    tk.addEventListener('mouseleave', function () { hover = false; });

    tk.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      drag = { x: e.clientX, pos: pos };
      tk.setPointerCapture(e.pointerId);
      tk.classList.add('is-dragging');
    });
    tk.addEventListener('pointermove', function (e) {
      if (!drag) return;
      pos = drag.pos - (e.clientX - drag.x);
      render();
    });
    function endDrag() {
      if (!drag) return;
      drag = null;
      userActed();
      tk.classList.remove('is-dragging');
    }
    tk.addEventListener('pointerup', endDrag);
    tk.addEventListener('pointercancel', endDrag);

    // Horizontal trackpad swipes / shift+wheel move the strip; a vertical
    // wheel still scrolls the page.
    tk.addEventListener('wheel', function (e) {
      var dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX;
      if (!dx || (!e.shiftKey && Math.abs(dx) < Math.abs(e.deltaY))) return;
      e.preventDefault();
      pos += dx;
      userActed();
      render();
    }, { passive: false });

    tk.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      var step = items[0] ? items[0].offsetWidth + 16 : 200;
      pos += e.key === 'ArrowRight' ? step : -step;
      userActed();
      render();
    });
  }

  function pageAbout() {
    var titleEl = $('.about-hero__title');
    var lead = text('.about-hero__title-lead').replace(/:$/, '');
    var def = '';
    if (titleEl) {
      var c = titleEl.cloneNode(true);
      var l = $('.about-hero__title-lead', c);
      if (l) l.parentNode.removeChild(l);
      def = text(c);
    }
    var paper = $('.about-hero__cta a');

    return [
      function () {
        return hero({
          crumb: 'About', eyebrow: text('.about-hero__label'), title: lead || 'Human flourishing',
          lead: [def, text('.about-hero__body')],
          cta: paper ? { label: text(paper), href: paper.getAttribute('href') } : null
        });
      },
      function () {
        var body = $$('.about-drive__body').map(function (p) {
          return '<p class="gov-prose__p">' + esc(text(p)) + '</p>';
        }).join('');
        return section(
          eyebrow(text('.about-drive__label')) +
          '<p class="gov-statement">' + esc(text('.about-drive__title')) + '</p>' +
          '<div class="gov-prose">' + body + '</div>', 'gov-section--rule');
      },
      function () {
        var items = $$('.about-why__col').map(function (c) {
          var t = $('.about-why__col-title', c);
          return { eyebrow: t && t.getAttribute('data-quip'), title: text(t), body: text('.about-why__col-body', c) };
        });
        if (!items.length) return '';
        return section(head(text('.about-why__label')), 'gov-section--rule gov-section--flush') + rows(items);
      },
      function () {
        var items = $$('.about-shift__item');
        if (!items.length) return '';
        return section(
          head('A shift towards', text('.about-shift__title')) +
          table(['Stage', 'Focus area', 'Key question'], items.map(function (it, i) {
            return { cells: [
              '<span class="gov-num">' + pad(i + 1) + '</span>',
              '<span class="gov-strong">' + esc(text('h3', it)) + '</span>',
              esc(text('p', it))
            ] };
          }), { caption: 'A shift towards a more proactive approach' }),
          'gov-section--rule');
      },
      function () {
        var items = $$('.about-develop__item').map(function (it) {
          return { title: text('.about-develop__item-title', it), body: text('.about-develop__item-desc', it) };
        });
        if (!items.length) return '';
        return section(head(text('.about-develop__label'), 'Intended outcomes') + accordion(items), 'gov-section--rule');
      }
    ];
  }

  function pageLab() {
    var chat = $('.lab-hero__chat');
    var ask = '';
    var ctaEl = $('.lab-hero__cta');
    if (ctaEl) {
      var c = ctaEl.cloneNode(true);
      var a = $('a', c);
      if (a) a.parentNode.removeChild(a);
      ask = text(c);
    }
    var status = text('.lab-hero__soon') || 'Coming soon';

    return [
      function () {
        return hero({ crumb: 'Lab', eyebrow: text('.lab-hero__label'), title: text('.lab-hero__title'), compact: true });
      },
      function () {
        var link = chat ? '<a class="gov-link" href="' + esc(chat.getAttribute('href')) + '">' + esc(text(chat)) + '</a>' : '';
        return section(
          notice('<p><strong>Status: ' + esc(status) + '.</strong> ' + esc(ask) + ' ' + link + '</p>') +
          head('Service details') +
          kv([
            ['Service', 'Flourishing Futures AI Lab'],
            ['Status', pill(status, 'amber')],
            ['Enquiries', esc(ask) + (link ? ' ' + link : '')]
          ], 'Lab service details'),
          'gov-section--rule');
      }
    ];
  }

  function pageCommunity() {
    var cmty = data.community || {};
    var up = cmty.upcoming;
    var collabEl = $('.cmty-collab');
    var collabLink = $('.cmty-collab__link');
    var collabQ = '';
    if (collabEl) {
      var c = collabEl.cloneNode(true);
      var a = $('a', c);
      if (a) a.parentNode.removeChild(a);
      collabQ = text(c);
    }

    return [
      function () {
        return hero({
          crumb: 'Community', eyebrow: text('.cmty-hero__eyebrow'), title: text('.cmty-hero__title'),
          lead: [text('.cmty-hero__intro')],
          cta: up && up.cta ? { label: up.cta.text || 'RSVP', href: up.cta.href } : null
        });
      },
      function () {
        if (!up) return '';
        var body = (up.body || []).map(function (p) { return '<p class="gov-prose__p">' + esc(p) + '</p>'; }).join('');
        return section(
          eyebrow(text('.cmty-upcoming__label') || 'Upcoming') +
          '<h2 class="gov-h2">' + up.title + '</h2>' +
          '<div class="gov-prose">' + body + '</div>' +
          kv([
            ['When', esc(noEmoji(up.when)) || 'To be confirmed'],
            ['Where', esc(noEmoji(up.where)) || 'To be confirmed'],
            ['Registration', up.cta ? btn(up.cta.text || 'RSVP', up.cta.href) : 'To be confirmed']
          ], 'Event details'),
          'gov-section--rule', 'gov-upcoming');
      },
      function () {
        var ex = cmty.experts || [];
        if (!ex.length) return '';
        return section(
          head(text('.cmty-experts__label') || 'Friends of the community') +
          table(['Name', 'Title', 'Organisation'], ex.map(function (e) {
            return { cells: ['<span class="gov-strong">' + esc(e.name) + '</span>', esc(e.title), esc(e.org)] };
          }), { caption: 'Friends of the community' }),
          'gov-section--rule');
      },
      function () {
        var g = (cmty.gallery || []).filter(function (it) { return it.src; });
        if (!g.length) return '';
        // Two copies of the set so the strip loops; the second is aria-hidden.
        var tiles = g.concat(g).map(function (it, k) {
          var clone = k >= g.length;
          return '<li class="gov-ticker__item"' + (clone ? ' aria-hidden="true"' : '') + '>' +
            '<img src="' + esc(it.src) + '" alt="' + (clone ? '' : esc(it.alt)) + '" loading="lazy" decoding="async" draggable="false"></li>';
        }).join('');
        return '<section class="gov-section gov-section--rule gov-section--ticker">' +
          '<div class="gov-wrap">' + head(text('.cmty-gallery__label') || 'Past sessions', 'Past sessions') + '</div>' +
          '<div class="gov-ticker" tabindex="0" role="region" aria-label="Past session photos (drag or use arrow keys)">' +
            '<ul class="gov-ticker__track">' + tiles + '</ul></div>' +
          '<div class="gov-wrap"><div class="gov-ticker__foot"><span>' + g.length + ' photos · Drag to browse</span>' +
            (reducedMotion ? '' : '<button type="button" class="gov-pause" aria-pressed="false">Pause</button>') +
          '</div></div></section>';
      },
      function () {
        var copy = $('.cmty-swag__copy');
        if (!copy) return '';
        var lines = copy.innerHTML.split(/<br\s*\/?>/i).map(function (l) {
          var d = document.createElement('div');
          d.innerHTML = l;
          return noEmoji(d.textContent);
        }).filter(Boolean);
        var status = lines.length > 1 ? lines.pop() : 'Coming soon';
        var desc = lines.join(' ');
        var imgs = $$('.cmty-swag__photo');
        var total = imgs.length;
        var alts = imgs.map(function (img, k) {
          return img.getAttribute('alt') || 'Flourishing Futures community merchandise, photo ' + (k + 1) + ' of ' + total;
        });
        // Product-page template: hero image + thumbnails | product details.
        var gallery = total ? '<div class="gov-gallery" role="region" aria-roledescription="carousel" aria-label="Merchandise photos">' +
            '<div class="gov-gallery__stage">' +
              imgs.map(function (img, k) {
                return '<img class="gov-gallery__slide' + (k ? '' : ' is-active') + '" src="' + esc(img.getAttribute('src')) +
                  '" alt="' + esc(alts[k]) + '"' + (k ? ' aria-hidden="true"' : '') + ' loading="lazy" decoding="async">';
              }).join('') +
              (total > 1 ? '<button type="button" class="gov-gallery__nav gov-gallery__nav--prev" aria-label="Previous photo">' + icon('chevron') + '</button>' +
                '<button type="button" class="gov-gallery__nav gov-gallery__nav--next" aria-label="Next photo">' + icon('chevron') + '</button>' : '') +
              '<span class="gov-gallery__count" aria-live="polite">1 / ' + total + '</span>' +
            '</div>' +
            (total > 1 ? '<div class="gov-gallery__thumbs">' + imgs.map(function (img, k) {
              return '<button type="button" class="gov-gallery__thumb"' + (k ? '' : ' aria-current="true"') +
                ' aria-label="Show photo ' + (k + 1) + ' of ' + total + '">' +
                '<img src="' + esc(img.getAttribute('src')) + '" alt="" loading="lazy" decoding="async"></button>';
            }).join('') + '</div>' : '') +
            (total > 1 && !reducedMotion ? '<div class="gov-gallery__foot"><span>' + total + ' photos</span>' +
              '<button type="button" class="gov-pause" aria-pressed="false">Pause</button></div>' : '') +
          '</div>' : '';
        var info = '<div class="gov-product__info">' +
            eyebrow('Community merchandise') +
            '<h2 class="gov-product__title">' + esc(desc) + '</h2>' +
            kv([['Status', pill(status, 'amber')]], 'Product details') +
          '</div>';
        return section(head('Merchandise') + '<div class="gov-product">' + gallery + info + '</div>', 'gov-section--rule');
      },
      function () {
        if (!collabLink) return '';
        return ctaBand(collabQ, btn(text(collabLink), collabLink.getAttribute('href')));
      }
    ];
  }

  function pageResources() {
    var res = sortedResources();
    var cats = ['Research', 'Opinions', 'Guides', 'Inspiration'];
    var lead = '';
    var t = $('.res-hero__title');
    if (t) lead = text(t).replace(/:\s*$/, '.');

    return [
      function () {
        return hero({ crumb: 'Resource Hub', eyebrow: 'Publications', title: 'Resource Hub', lead: [lead] });
      },
      function () {
        if (!res.length) return '';
        return section(head('Featured', 'Latest publications') + cards(res.slice(0, 3).map(resourceCard)), 'gov-section--rule');
      },
      function () {
        if (!res.length) return '';
        var counts = {};
        res.forEach(function (r) { counts[r.category] = (counts[r.category] || 0) + 1; });
        var controls =
          '<div class="gov-filter" role="search">' +
            '<label class="gov-field gov-field--search"><span class="gov-sr">Search resources</span>' +
              icon('search', 'gov-ico gov-field__icon') +
              '<input id="govResSearch" type="search" placeholder="Search by title, source or keyword" autocomplete="off"></label>' +
            '<label class="gov-field"><span class="gov-sr">Category</span>' +
              '<select id="govResCat"><option value="">All categories</option>' +
              cats.map(function (c) {
                var n = counts[c] || 0;
                return '<option value="' + c + '"' + (n ? '' : ' disabled') + '>' + c + ' (' + n + ')</option>';
              }).join('') + '</select></label>' +
          '</div>' +
          '<p class="gov-count" id="govResCount" aria-live="polite"></p>';
        // Each article is a clickable row followed by a hidden detail row with
        // its blurb and a link out (wired in wireResourceTable).
        var cols = ['Title', 'Source', 'Category', 'Date published'];
        var rowsHtml = res.map(function (r, k) {
          var hay = [r.title, r.source, r.category].concat(r.keywords || [], r.body || []).join(' ').toLowerCase();
          var id = 'govRes' + k;
          var href = r.cta && r.cta.href;
          return '<tr class="gov-res__row" data-cat="' + esc(r.category) + '" data-search="' + esc(hay) + '">' +
              '<td data-label="Title"><button type="button" class="gov-table__title gov-res__toggle" ' +
                'aria-expanded="false" aria-controls="' + id + '">' + esc(r.title) + '</button></td>' +
              '<td data-label="Source">' + esc(r.source) + '</td>' +
              '<td data-label="Category">' + pill(r.category, TONES[r.category]) + '</td>' +
              '<td data-label="Date published"><span class="gov-nowrap">' + esc(fmtDate(r.date)) + '</span></td>' +
              '<td class="gov-res__chev" aria-hidden="true">' + icon('chevron', 'gov-ico') + '</td>' +
            '</tr>' +
            '<tr class="gov-res__detail" id="' + id + '" hidden><td colspan="5"><div class="gov-res__panel">' +
              (r.body || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
              (href ? '<p class="gov-res__cta">' + btn((r.cta.text || 'Read') + ' article', href) +
                '<span class="gov-res__src">' + esc(r.source) + '</span></p>' : '') +
            '</div></td></tr>';
        }).join('');
        var tableHtml = '<div class="gov-table-wrap"><table class="gov-table gov-table--res" id="govResTable">' +
          '<caption class="gov-sr">All resources. Select a row to read its summary.</caption>' +
          '<thead><tr>' + cols.map(function (c) { return '<th scope="col">' + esc(c) + '</th>'; }).join('') +
          '<th scope="col"><span class="gov-sr">Summary</span></th></tr></thead>' +
          '<tbody>' + rowsHtml + '</tbody></table></div>';
        return section(
          head('All resources', 'Browse the library') + controls + tableHtml +
          '<p class="gov-empty" id="govResEmpty" hidden>No resources match your search.</p>',
          'gov-section--rule');
      }
    ];
  }

  function wireResourceTable(view) {
    var input = $('#govResSearch', view);
    var sel = $('#govResCat', view);
    var tbl = $('#govResTable', view);
    if (!input || !sel || !tbl) return;
    var trs = $$('tbody .gov-res__row', tbl);
    var count = $('#govResCount', view);
    var empty = $('#govResEmpty', view);

    function toggle(tr, open) {
      var b = $('.gov-res__toggle', tr);
      if (open === undefined) open = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      tr.classList.toggle('is-open', open);
      tr.nextElementSibling.hidden = !open;
    }
    // Whole row is the hit area; the title <button> carries the semantics and
    // keyboard access (its click bubbles here too).
    $('tbody', tbl).addEventListener('click', function (e) {
      var tr = e.target.closest('.gov-res__row');
      if (tr) toggle(tr);
    });

    function run() {
      var q = input.value.trim().toLowerCase();
      var c = sel.value;
      var n = 0;
      trs.forEach(function (tr) {
        var ok = (!c || tr.getAttribute('data-cat') === c) &&
                 (!q || tr.getAttribute('data-search').indexOf(q) !== -1);
        tr.hidden = !ok;
        if (!ok) toggle(tr, false);
        if (ok) n++;
      });
      count.textContent = 'Showing ' + n + ' of ' + trs.length + ' results';
      empty.hidden = n > 0;
    }
    input.addEventListener('input', run);
    sel.addEventListener('change', run);
    run();
  }

  /* ---------- Page detection (DOM landmarks, so "/" works too) ---------- */
  function detect() {
    if ($('#hero')) return { label: 'Home', build: pageHome };
    if ($('.about-hero')) return { label: 'About', build: pageAbout };
    if ($('.lab-hero')) return { label: 'Lab', build: pageLab };
    if ($('.cmty-hero')) return { label: 'Community', build: pageCommunity };
    if ($('.res-hero')) return { label: 'Resource Hub', build: pageResources };
    return null;
  }

  /* ---------- Inter: only fetched when Government is (about to be) used ---------- */
  function loadFont() {
    if (document.getElementById('gov-font')) return;
    var l = document.createElement('link');
    l.id = 'gov-font';
    l.rel = 'stylesheet';
    l.href = FONT_HREF;
    document.head.appendChild(l);
  }
  if (root.getAttribute('data-theme') === 'gov') loadFont();
  document.addEventListener('ff:themechange', function (e) {
    if (e.detail && e.detail.theme === 'gov') loadFont();
  });
  // Warm it up while the pointer is on the menu option, ahead of the wipe.
  document.addEventListener('pointerover', function (e) {
    if (e.target.closest && e.target.closest('.theme-switch__opt[data-theme="gov"]')) loadFont();
  });

  /* ---------- Build ---------- */
  var page = detect();
  if (!page) return;

  var parts = [];
  var builders = [];
  try { builders = page.build(); } catch (_) {}
  builders.forEach(function (fn) {
    try { parts.push(fn() || ''); } catch (_) {}
  });

  // On Home the navbar sits under the full-screen hero (like the trendy home);
  // elsewhere it sits straight under the banner.
  var isHome = page.label === 'Home';
  var lead = isHome ? parts.shift() : '';

  var view = document.createElement('div');
  view.className = 'gov-view' + (isHome ? ' gov-view--home' : '');
  view.innerHTML = header() + lead + nav(page.label) +
    '<main class="gov-main" id="gov-main" tabindex="-1">' + parts.join('') + '</main>' +
    footer();
  document.body.appendChild(view);

  wireResourceTable(view);
  initQuestions(view);
  initGallery(view);
  initProductGallery(view);

  // Flag the navbar once it has docked under the sticky banner (adds a shadow).
  var navEl = $('.gov-nav', view);
  function checkStuck() {
    var dock = parseFloat(getComputedStyle(navEl).top) || 0;
    navEl.classList.toggle('is-stuck', navEl.getBoundingClientRect().top <= dock + 0.5);
  }
  window.addEventListener('scroll', checkStuck, { passive: true });
  window.addEventListener('resize', checkStuck);
  document.addEventListener('ff:themechange', checkStuck);
  checkStuck();
})();
