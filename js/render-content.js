(function () {
  var data = window.SITE_CONTENT;
  if (!data) return;

  // The homepage "Lately..." deck is derived, not authored: its first card is
  // the latest Upcoming event from the Community page, and the rest are the
  // highlighted articles from the Resource Hub — each keeping its own CTA and
  // link (RSVP for the event, Read for the articles).
  if (document.querySelector('.lately__stack')) renderLately(data);
  if (data.resources) renderResources(data.resources);
  if (data.community) renderCommunity(data.community);

  /* --- Lately cards (index.html) ------------------------------------ */
  function renderLately(data) {
    var stack = document.querySelector('.lately__stack');
    if (!stack) return;

    var items = buildLatelyItems(data);
    if (items.length < 2) return;

    var html = '';
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var bodyHtml = '';
      for (var j = 0; j < item.body.length; j++) {
        bodyHtml += '<p class="lately-card__body">' + item.body[j] + '</p>';
      }
      var imageHtml = (item.image && item.image.src)
        ? '<div class="lately-card__image"><img src="' + item.image.src + '" loading="lazy" decoding="async" alt="' + (item.image.alt || '') + '"></div>'
        : '<div class="lately-card__image lately-card__image--blue"></div>';
      html +=
        '<article class="lately-card" data-pos="' + i + '">' +
          '<div class="lately-card__content">' +
            '<h2 class="lately-card__heading">' + item.heading + '</h2>' +
            bodyHtml +
            '<div><a href="' + item.cta.href + '"' + extAttr(item.cta.href) + ' class="btn btn--' + item.cta.style + '">' + item.cta.text + '</a></div>' +
          '</div>' +
          imageHtml +
        '</article>';
    }
    stack.innerHTML = html;

    injectLatelyPositionCSS(items.length);
  }

  // Builds the Lately deck from the shared content: the Community page's
  // Upcoming event first, then the Resource Hub's featured (3 newest) articles.
  function buildLatelyItems(data) {
    var items = [];

    var up = data.community && data.community.upcoming;
    if (up) {
      items.push({
        heading: up.title,
        body: up.body || [],
        cta: {
          text: (up.cta && up.cta.text) || 'RSVP',
          href: (up.cta && up.cta.href) || '#',
          style: 'green'
        },
        image: up.image
      });
    }

    if (data.resources && data.resources.length) {
      var sorted = data.resources.slice().sort(function (a, b) {
        if (a.date < b.date) return 1;
        if (a.date > b.date) return -1;
        return 0;
      });
      var styles = ['orange', 'pink', 'green'];
      var featured = sorted.slice(0, 3);
      for (var i = 0; i < featured.length; i++) {
        var r = featured[i];
        items.push({
          heading: r.title,
          body: r.body || [],
          cta: {
            text: (r.cta && r.cta.text) || 'Read',
            href: (r.cta && r.cta.href) || '#',
            style: styles[i % styles.length]
          },
          image: r.image
        });
      }
    }

    return items;
  }

  // Position the stacked back cards as a *diminishing* fan: each deeper card
  // peeks a little less than the one in front of it, so the deck stays tidy at
  // any count. (A linear step made the 4th card jut out past the others and
  // over-rotate.) The front card (pos 0) keeps its transform from CSS so the
  // .is-flipping lift still works — we only set its z-index here.
  function injectLatelyPositionCSS(count) {
    var style = document.createElement('style');
    var rules = '.lately-card[data-pos="0"]{z-index:' + count + ';}';
    var x = 0, y = 0, r = 0, stepX = 13, stepY = 17, stepR = 1.3, decay = 0.68;
    for (var i = 1; i < count; i++) {
      x += stepX; y += stepY; r += stepR;
      stepX *= decay; stepY *= decay; stepR *= decay;
      rules +=
        '.lately-card[data-pos="' + i + '"]{' +
          'transform:translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + r.toFixed(2) + 'deg);' +
          'z-index:' + (count - i) + ';' +
        '}';
    }
    style.textContent = rules;
    document.head.appendChild(style);
  }

  /* --- Resource Hub (resource-centre.html) --------------------------- */
  /* Builds two pieces from window.SITE_CONTENT.resources: a rotating
     flip-deck of the 3 newest items (.res-deck__stack) and a searchable/
     filterable thumbnail stream of the rest (.res-stream__inner). */
  function renderResources(items) {
    var deckStack = document.querySelector('.res-deck__stack');
    var streamInner = document.querySelector('.res-stream__inner');
    if (!deckStack || !streamInner) return;

    var sorted = items.slice().sort(function (a, b) {
      if (a.date < b.date) return 1;
      if (a.date > b.date) return -1;
      return 0;
    });

    var featured = sorted.slice(0, 3);
    // The stream below is the full browseable archive — it includes the items
    // the deck spotlights, so nothing "disappears" just for being featured.
    var stream = sorted;

    renderResourceDeck(deckStack, featured);
    renderResourceStream(streamInner, stream);
    initHeroRotator();
    initHeroParallax();
  }

  function renderResourceDeck(stack, items) {
    if (!items.length) return;

    var html = '';
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var eyebrow = item.eyebrow || 'Featured';
      var bodyHtml = '';
      for (var j = 0; j < item.body.length; j++) {
        bodyHtml += '<p>' + item.body[j] + '</p>';
      }
      var imageClass = 'res-deck-card__image';
      var imageHtml = '';
      if (item.image) {
        imageHtml = '<img src="' + item.image.src + '" decoding="async" alt="' + (item.image.alt || '') + '">';
      } else {
        imageClass += ' res-deck-card__image--blue';
      }

      html +=
        '<article class="res-deck-card" data-pos="' + i + '">' +
          '<div class="res-deck-card__content">' +
            '<p class="res-deck-card__eyebrow">' + eyebrow + '</p>' +
            '<h2 class="res-deck-card__title">' + item.title + '</h2>' +
            '<div class="res-deck-card__body">' + bodyHtml + '</div>' +
            '<div><a class="btn btn--green" href="' + item.cta.href + '"' + extAttr(item.cta.href) + '>' + item.cta.text + '</a></div>' +
          '</div>' +
          '<div class="' + imageClass + '">' + imageHtml + '</div>' +
        '</article>';
    }
    stack.innerHTML = html;

    if (items.length > 3) injectDeckPositionCSS(items.length);

    var deck = document.getElementById('resDeck');
    if (deck) initDeckRotation(deck);
  }

  function injectDeckPositionCSS(count) {
    var style = document.createElement('style');
    var rules = '';
    for (var i = 3; i < count; i++) {
      rules +=
        '.res-deck-card[data-pos="' + i + '"]{' +
          'transform:translate(' + (i * 16) + 'px,' + (i * 20) + 'px) rotate(' + (i * 1.6) + 'deg);' +
          'z-index:' + (count - i) + ';' +
        '}';
    }
    style.textContent = rules;
    document.head.appendChild(style);
  }

  /* Flip-deck rotation: front card (data-pos="0") lifts and cycles to the
     back every 3s, or immediately on click (resetting the timer). Ported
     from the Lately deck on index.html. */
  function initDeckRotation(deck) {
    var stack = deck.querySelector('.res-deck__stack');
    var cards = Array.prototype.slice.call(deck.querySelectorAll('.res-deck-card'));
    if (cards.length < 2) return;
    var animating = false;

    function fitStack() {
      stack.style.height = '';
      var max = 0;
      for (var i = 0; i < cards.length; i++) {
        if (cards[i].scrollHeight > max) max = cards[i].scrollHeight;
      }
      if (max) stack.style.height = max + 'px';
    }
    fitStack();
    window.addEventListener('load', fitStack);
    window.addEventListener('resize', fitStack);

    function advance() {
      if (animating) return;
      animating = true;
      // Tie the hero's headline swap to the exact moment the deck flips.
      document.dispatchEvent(new CustomEvent('resdeck:advance'));
      var front = null;
      for (var i = 0; i < cards.length; i++) {
        if (cards[i].getAttribute('data-pos') === '0') { front = cards[i]; break; }
      }
      if (!front) { animating = false; return; }
      front.classList.add('is-flipping');
      window.setTimeout(function () {
        for (var i = 0; i < cards.length; i++) {
          var c = cards[i];
          var pos = parseInt(c.getAttribute('data-pos'), 10);
          c.setAttribute('data-pos', String((pos + cards.length - 1) % cards.length));
        }
        front.classList.remove('is-flipping');
        animating = false;
      }, 360);
    }

    // Auto-flips only while the deck is on screen and the tab is visible.
    var seen = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { seen = es[0].isIntersecting; }).observe(deck);
    }
    function tick() { if (seen && !document.hidden) advance(); }
    var timer = window.setInterval(tick, 3000);
    deck.addEventListener('click', function () {
      advance();
      window.clearInterval(timer);
      timer = window.setInterval(tick, 3000);
    });
  }

  function renderResourceStream(container, items) {
    var html =
      '<div class="res-stream__search">' +
        '<svg class="res-stream__search-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">' +
          '<circle cx="13" cy="13" r="10" stroke="currentColor" stroke-width="2.5"/>' +
          '<line x1="20.5" y1="20.5" x2="29" y2="29" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
        '</svg>' +
        '<input id="res-search" class="res-stream__search-input" type="search" placeholder="These are the articles you’re looking for">' +
      '</div>';

    html += '<div class="res-stream__tags">';
    // Browse-by label and Clear-all share one grid slot (see CSS): swapping
    // between them keeps the tag row from shifting.
    html += '<span class="res-stream__lead">' +
              '<span class="res-stream__tags-label">Browse by:</span>' +
              '<button class="res-stream__tag res-stream__tag--clear">✕ Clear all</button>' +
            '</span>';
    var cats = ['Research', 'Opinions', 'Guides', 'Inspiration'];
    // Count what each category actually holds so empty ones can be dimmed and
    // made unclickable (the chip stays in the row for consistency, but reads as
    // "nothing here yet" rather than filtering to an empty grid).
    var counts = {};
    for (var c = 0; c < items.length; c++) {
      counts[items[c].category] = (counts[items[c].category] || 0) + 1;
    }
    for (var i = 0; i < cats.length; i++) {
      var isEmpty = !counts[cats[i]];
      html += '<button class="res-stream__tag' + (isEmpty ? ' res-stream__tag--empty' : '') +
              '" data-cat="' + cats[i] + '"' +
              (isEmpty ? ' disabled aria-disabled="true" title="Nothing here yet"' : '') +
              '>' + cats[i] + '</button>';
    }
    html += '</div>';

    html += '<div class="res-stream__grid" id="res-grid">';
    for (var i = 0; i < items.length; i++) {
      html += buildResourceStreamCard(items[i]);
    }
    html += '</div>';

    html += '<p class="res-stream__empty" hidden>No resources match your search.</p>';

    container.innerHTML = html;

    wireResourceFilters(container);
  }

  function buildResourceStreamCard(item) {
    var href = item.cta.href;
    var external = href.indexOf('http') === 0;
    var target = external ? ' target="_blank" rel="noopener"' : '';
    var bodyHtml = '';
    for (var j = 0; j < item.body.length; j++) {
      bodyHtml += '<p>' + item.body[j] + '</p>';
    }
    var imageHtml = item.image
      ? '<img src="' + item.image.src + '" loading="lazy" decoding="async" alt="' + (item.image.alt || '') + '">'
      : '';
    var haystack = (
      item.title + ' ' + item.source + ' ' + item.body.join(' ') + ' ' +
      (item.keywords || []).join(' ') + ' ' + item.category
    ).toLowerCase();

    return (
      '<article class="res-stream-card" data-cat="' + item.category + '"' +
        ' data-href="' + escAttr(href) + '"' + (external ? ' data-external="1"' : '') +
        ' data-search="' + escAttr(haystack) + '">' +
        '<div class="res-stream-card__image">' + imageHtml + '</div>' +
        '<div class="res-stream-card__content">' +
          '<h3 class="res-stream-card__title"><a href="' + href + '"' + target + '>' + item.title + '</a></h3>' +
          '<p class="res-stream-card__author">by ' + item.source + '</p>' +
          '<div class="res-stream-card__body">' + bodyHtml + '</div>' +
          '<div><a class="btn btn--green" href="' + href + '"' + target + '>Read</a></div>' +
        '</div>' +
      '</article>'
    );
  }

  function escAttr(s) {
    return String(s).replace(/"/g, '&quot;');
  }

  // Outbound (http/https) links open in a new tab; internal pages and mailto:
  // links stay in the current tab.
  function extAttr(href) {
    return (href && href.indexOf('http') === 0) ? ' target="_blank" rel="noopener"' : '';
  }

  function wireResourceFilters(container) {
    var searchInput = container.querySelector('#res-search');
    var tagButtons = container.querySelectorAll('.res-stream__tag[data-cat]');
    var lead = container.querySelector('.res-stream__lead');
    var clearBtn = container.querySelector('.res-stream__tag--clear');
    var grid = container.querySelector('#res-grid');
    var emptyMsg = container.querySelector('.res-stream__empty');
    var activeCats = [];
    var flipGen = 0;
    var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function shouldShow(card, query) {
      var cat = card.getAttribute('data-cat');
      var haystack = card.getAttribute('data-search') || '';
      var matchesCat = activeCats.length === 0 || activeCats.indexOf(cat) !== -1;
      var matchesQuery = !query || haystack.indexOf(query) !== -1;
      return matchesCat && matchesQuery;
    }

    // Animation timings (ms) + shared easing (matches the About accordion).
    var OUT_MS = 200, MOVE_MS = 460, IN_MS = 360;
    var CURVE = 'cubic-bezier(0.65, 0, 0.35, 1)';

    function baseline(c) {
      c.style.transition = '';
      c.style.transform = '';
      c.style.opacity = '';
      c.style.pointerEvents = '';
    }

    /* Re-filter the grid gracefully and CONSISTENTLY: leaving cards fade+scale
       out, then the remaining cards FLIP-glide to close the gaps while entering
       cards fade in. The invert→play step forces a single synchronous reflow
       (void grid.offsetWidth) instead of relying on rAF, so every card animates
       every time (rAF sometimes batched invert+play into one frame → snap).
       A generation token cancels an in-flight run on rapid typing/clicks. */
    function filter() {
      flipGen++;
      var myGen = flipGen;
      var query = (searchInput.value || '').toLowerCase();
      var cards = Array.prototype.slice.call(grid.querySelectorAll('.res-stream-card'));

      cards.forEach(baseline); // clear any in-flight inline animation styles

      var willShow = cards.map(function (c) { return shouldShow(c, query); });
      var visibleCount = 0;
      for (var v = 0; v < willShow.length; v++) if (willShow[v]) visibleCount++;

      lead.classList.toggle('is-filtering', activeCats.length > 0 || !!query);

      if (reduceMotion) {
        cards.forEach(function (c, idx) { c.style.display = willShow[idx] ? '' : 'none'; });
        emptyMsg.hidden = visibleCount !== 0;
        return;
      }

      var leaving = [], entering = [], staying = [];
      cards.forEach(function (c, idx) {
        var visibleNow = c.style.display !== 'none';
        if (willShow[idx] && visibleNow) staying.push(c);
        else if (willShow[idx] && !visibleNow) entering.push(c);
        else if (!willShow[idx] && visibleNow) leaving.push(c);
      });

      // Clear inline styles after an animation ONLY if no newer filter has
      // started (otherwise the newer run owns these cards).
      function settle(list, ms) {
        window.setTimeout(function () {
          if (myGen !== flipGen) return;
          list.forEach(baseline);
        }, ms + 60);
      }

      function reflow() {
        if (myGen !== flipGen) return;

        // FIRST: positions of the staying cards (leaving still in flow).
        var firsts = staying.map(function (c) { return c.getBoundingClientRect(); });

        // Pull leaving out of flow; drop entering in, pre-hidden for fade-in.
        leaving.forEach(function (c) { c.style.display = 'none'; baseline(c); });
        entering.forEach(function (c) {
          c.style.transition = 'none';
          c.style.opacity = '0';
          c.style.transform = 'scale(0.94)';
          c.style.display = '';
        });

        // LAST: measure stayers in their new slots and INVERT them.
        var movers = [];
        staying.forEach(function (c, k) {
          var last = c.getBoundingClientRect();
          var f = firsts[k];
          var dx = f.left - last.left, dy = f.top - last.top;
          if (dx || dy) {
            c.style.transition = 'none';
            c.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
            movers.push(c);
          }
        });

        // One synchronous reflow so every inverted/pre-in state is committed…
        void grid.offsetWidth;

        // …then PLAY them all to rest in the same frame — reliably tweened.
        movers.forEach(function (c) {
          c.style.transition = 'transform ' + MOVE_MS + 'ms ' + CURVE;
          c.style.transform = '';
        });
        entering.forEach(function (c) {
          c.style.transition = 'opacity ' + IN_MS + 'ms ease, transform ' + MOVE_MS + 'ms ' + CURVE;
          c.style.opacity = '';
          c.style.transform = '';
        });

        settle(movers.concat(entering), MOVE_MS);
        emptyMsg.hidden = visibleCount !== 0;
      }

      if (leaving.length) {
        leaving.forEach(function (c) {
          c.style.pointerEvents = 'none';
          c.style.transition = 'none';
        });
        void grid.offsetWidth; // commit the pre-out state before transitioning
        leaving.forEach(function (c) {
          c.style.transition = 'opacity ' + OUT_MS + 'ms ease, transform ' + OUT_MS + 'ms ' + CURVE;
          c.style.opacity = '0';
          c.style.transform = 'scale(0.92)';
        });
        window.setTimeout(reflow, OUT_MS + 20);
      } else {
        reflow();
      }
    }

    function popTag(btn) {
      btn.classList.remove('res-stream__tag--pop');
      void btn.offsetWidth; // restart the keyframe
      btn.classList.add('res-stream__tag--pop');
    }

    searchInput.addEventListener('input', filter);

    for (var t = 0; t < tagButtons.length; t++) {
      tagButtons[t].addEventListener('click', function () {
        var cat = this.getAttribute('data-cat');
        var idx = activeCats.indexOf(cat);
        if (idx === -1) {
          activeCats.push(cat);
          this.classList.add('res-stream__tag--active');
          popTag(this);
        } else {
          activeCats.splice(idx, 1);
          this.classList.remove('res-stream__tag--active');
          this.classList.remove('res-stream__tag--pop');
        }
        filter();
      });
    }

    clearBtn.addEventListener('click', function () {
      activeCats.length = 0;
      for (var j = 0; j < tagButtons.length; j++) {
        tagButtons[j].classList.remove('res-stream__tag--active');
        tagButtons[j].classList.remove('res-stream__tag--pop');
      }
      searchInput.value = '';
      filter();
    });

    // Make the whole card clickable — but let the real <a>/<button> inside it
    // handle their own clicks (so middle-click / modifiers / the CTA still work).
    var allCards = grid.querySelectorAll('.res-stream-card');
    for (var n = 0; n < allCards.length; n++) {
      allCards[n].addEventListener('click', function (e) {
        if (e.target.closest('a') || e.target.closest('button')) return;
        var href = this.getAttribute('data-href');
        if (!href || href === '#') return;
        if (this.getAttribute('data-external') === '1') window.open(href, '_blank', 'noopener');
        else window.location.href = href;
      });
    }
  }

  /* Type the hero's front half ("Care about" → …) on a blinking caret while
     "humans?" stays put. Driven by the deck's 'resdeck:advance' event so the
     headline and the card flip move on the exact same beat. */
  function initHeroRotator() {
    var el = document.querySelector('.res-hero__rotate');
    if (!el) return;
    var prefixes = [
      'Care about',
      'Designing for',
      'Big on',
      'Developing for',
      'Curious about',
      'Anxious about'
    ];
    var reduce = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var i = 0;
    var gen = 0;

    function typeTo(text) {
      gen++;
      var myGen = gen;
      if (reduce) { el.textContent = text; return; }
      function erase() {
        if (myGen !== gen) return;
        var cur = el.textContent;
        if (cur.length) {
          el.textContent = cur.slice(0, -1);
          window.setTimeout(erase, 30);
        } else {
          typeIn(1);
        }
      }
      function typeIn(n) {
        if (myGen !== gen) return;
        el.textContent = text.slice(0, n);
        if (n < text.length) window.setTimeout(function () { typeIn(n + 1); }, 55);
      }
      erase();
    }

    document.addEventListener('resdeck:advance', function () {
      i = (i + 1) % prefixes.length;
      typeTo(prefixes[i]);
    });
  }

  /* Ripple parallax: the three pink doodle slices (behind the js/res-book.js
     book) drift by different amounts (and
     alternating directions) as the cursor moves across the hero, so the
     strokes shear against each other like water. */
  function initHeroParallax() {
    var hero = document.querySelector('.res-hero');
    if (!hero) return;
    var layers = Array.prototype.slice.call(hero.querySelectorAll('.res-hero__layer'));
    if (!layers.length) return;
    if (window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var tx = 0, ty = 0, raf = null;

    function apply() {
      raf = null;
      for (var i = 0; i < layers.length; i++) {
        var d = parseFloat(layers[i].getAttribute('data-depth')) || 0;
        var dir = (i % 2 === 0) ? 1 : -1;
        var x = tx * d * dir;
        var y = ty * d * dir * 0.6;
        layers[i].style.transform = 'scale(1.04) translate(' + x + 'px,' + y + 'px)';
      }
    }

    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(apply);
    });
    hero.addEventListener('mouseleave', function () {
      tx = 0; ty = 0;
      if (!raf) raf = requestAnimationFrame(apply);
    });
  }

  /* --- Community hub (community.html) -------------------------------- */
  /* Builds the "Upcoming" spotlight card, the gallery photo ticker, and
     the experts ticker from window.SITE_CONTENT.community, then wires up
     the hero parallax, scroll reveals, and the auto-scrolling/draggable
     ticker tracks. */
  function renderCommunity(c) {
    if (c.upcoming) renderCmtyUpcoming(c.upcoming);
    if (c.gallery) renderCmtyGallery(c.gallery);
    if (c.experts) renderCmtyExperts(c.experts);

    initCmtyReveals();
    initCmtyRotator();
    initCmtySwag();

    var tickers = document.querySelectorAll('[data-ticker]');
    for (var i = 0; i < tickers.length; i++) initTicker(tickers[i]);
  }

  // Swag teaser: gently cross-fade the stacked photos every 3s. Skipped under
  // reduced-motion (the first photo stays put) and when there's only one.
  function initCmtySwag() {
    var wrap = document.getElementById('cmtySwagSlides');
    if (!wrap || wrap.dataset.swagInit === '1') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var slides = Array.prototype.slice.call(wrap.querySelectorAll('.cmty-swag__photo'));
    if (slides.length < 2) return;
    wrap.dataset.swagInit = '1';

    var current = 0, seen = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { seen = es[0].isIntersecting; }).observe(wrap);
    }
    window.setInterval(function () {
      if (!seen || document.hidden) return;   // (a blurred cross-fade off screen is wasted work)
      slides[current].classList.remove('is-active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('is-active');
    }, 3000);
  }

  function renderCmtyUpcoming(item) {
    var mount = document.getElementById('cmtyUpcoming');
    if (!mount) return;

    var bodyHtml = '';
    for (var i = 0; i < item.body.length; i++) {
      bodyHtml += '<p class="lately-card__body">' + item.body[i] + '</p>';
    }

    var imageHtml = item.image
      ? '<div class="lately-card__image"><img src="' + item.image.src + '" alt="' + (item.image.alt || '') + '"></div>'
      : '<div class="lately-card__image lately-card__image--blue"></div>';

    var href = item.cta && item.cta.href ? item.cta.href : '#';

    mount.innerHTML =
      '<article class="lately-card cmty-card" data-href="' + href + '">' +
        '<div class="lately-card__content">' +
          '<h2 class="lately-card__heading">' + item.title + '</h2>' +
          bodyHtml +
          '<p class="cmty-card__meta"><strong>When:</strong> ' + item.when + '<br><strong>Where:</strong> ' + item.where + '</p>' +
          '<div><a href="' + href + '"' + extAttr(href) + ' class="btn btn--green">' + item.cta.text + '</a></div>' +
        '</div>' +
        imageHtml +
      '</article>';

    // Whole card is clickable, but let the inner CTA <a> handle its own clicks
    // (so modifiers / middle-click still work). Mirrors the resource stream cards.
    var card = mount.querySelector('.cmty-card');
    if (card) {
      card.addEventListener('click', function (e) {
        if (e.target.closest('a') || e.target.closest('button')) return;
        var h = this.getAttribute('data-href');
        if (!h || h === '#') return;
        // Outbound links open in a new tab, mirroring the resource stream cards.
        if (h.indexOf('http') === 0) window.open(h, '_blank', 'noopener');
        else window.location.href = h;
      });
    }
  }

  function renderCmtyGallery(items) {
    var track = document.getElementById('cmtyGalleryTrack');
    if (!track) return;

    var html = '';
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      // Real photos: fixed-height <img>, natural width (sized via CSS).
      // Fallback (no src, only a swatch color) keeps the old colored box.
      var innerHtml = item.src
        ? '<img class="cmty-ticker__img" src="' + item.src + '" decoding="async" alt="' + (item.alt || '') + '" draggable="false">'
        : '<div class="cmty-ticker__media" style="background:' + item.color + '" role="img" aria-label="' + (item.alt || '') + '"></div>';

      html +=
        '<figure class="cmty-ticker__card cmty-ticker__card--photo">' +
          innerHtml +
        '</figure>';
    }
    track.innerHTML = html;
  }

  function renderCmtyExperts(items) {
    var track = document.getElementById('cmtyExpertsTrack');
    if (!track) return;

    var html = '';
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var photoHtml = item.img
        ? '<div class="cmty-expert__photo"><img src="' + item.img + '" loading="lazy" decoding="async" alt="' + item.name + '" draggable="false"></div>'
        : '<div class="cmty-expert__photo" aria-hidden="true"></div>';

      html +=
        '<figure class="cmty-ticker__card cmty-ticker__card--expert">' +
          photoHtml +
          '<figcaption class="cmty-expert__caption">' +
            '<p class="cmty-expert__name">' + item.name + '</p>' +
            '<p class="cmty-expert__title">' + item.title + '</p>' +
            '<p class="cmty-expert__org">' + item.org + '</p>' +
          '</figcaption>' +
        '</figure>';
    }
    track.innerHTML = html;
  }

  /* Types the hero eyebrow's rotating phrase in and out, cycling through a
     fixed list on its own timer — unlike the Resource Hub's rotator, the
     community hero has no deck to sync against, so this just holds each
     phrase for ~3.2s and advances. Reuses the same erase-then-type
     technique as initHeroRotator's typeTo. */
  function initCmtyRotator() {
    var el = document.querySelector('.cmty-hero__rotate');
    if (!el) return;
    var phrases = [
      'Design for humans',
      'Build responsible AI',
      'Understand humans better',
      'Unlock human possibility',
      'Create better futures'
    ];
    var reduce = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // The element already shows phrases[0] as static markup, so start the
    // index there and let the first tick advance to phrases[1] rather than
    // immediately retyping phrases[0].
    var i = 0;
    var gen = 0;

    function typeTo(text) {
      gen++;
      var myGen = gen;
      if (reduce) { el.textContent = text; return; }
      function erase() {
        if (myGen !== gen) return;
        var cur = el.textContent;
        if (cur.length) {
          el.textContent = cur.slice(0, -1);
          window.setTimeout(erase, 30);
        } else {
          typeIn(1);
        }
      }
      function typeIn(n) {
        if (myGen !== gen) return;
        el.textContent = text.slice(0, n);
        if (n < text.length) window.setTimeout(function () { typeIn(n + 1); }, 55);
      }
      erase();
    }

    var seen = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { seen = es[0].isIntersecting; }).observe(el);
    }
    window.setInterval(function () {
      if (!seen || document.hidden) return;   // retyping off screen restyles the page for nothing
      i = (i + 1) % phrases.length;
      typeTo(phrases[i]);
    }, 3200);
  }

  /* Scroll-triggered reveals for [data-reveal] elements on community.html.
     Mirrors the inline observer other pages set up directly in markup —
     render-content.js has none yet, so the community sections own it here. */
  function initCmtyReveals() {
    var targets = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    if (!targets.length) return;

    var reduce = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      for (var i = 0; i < targets.length; i++) targets[i].classList.add('is-in');
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        if (entry.isIntersecting) entry.target.classList.add('is-in');
        else entry.target.classList.remove('is-in');
      }
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    for (var j = 0; j < targets.length; j++) observer.observe(targets[j]);
  }

  /* Ticker entry point: the two community carousels ("gallery" and
     "experts") now behave differently, so this just reads the mode off the
     container and hands off to the right implementation. Each implementation
     owns its own closured state so multiple tickers never share a loop or
     a position. */
  function initTicker(container) {
    var track = container.querySelector('.cmty-ticker__track');
    if (!track) return;

    var mode = container.getAttribute('data-ticker');

    if (mode === 'experts') {
      initStaticDragTicker(container, track);
    } else {
      initGalleryTicker(container, track);
    }
  }

  /* Gallery mode: duplicates the track's cards once for a seamless
     right-to-left loop, auto-scrolls at a gentle base speed, and lets a
     pointer drag take over — flicking it imparts momentum that decays
     (friction) back down into the base auto-scroll, in whichever direction
     it was flung. */
  function initGalleryTicker(container, track) {
    var reduce = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Duplicate the current cards once so the strip can wrap seamlessly.
    var originals = Array.prototype.slice.call(track.children);
    var originalCount = originals.length;
    for (var i = 0; i < originalCount; i++) {
      track.appendChild(originals[i].cloneNode(true));
    }

    var x = 0;
    var half = 0;
    var speed = 0.5;
    var dragging = false;
    var momentum = false; // true while a post-flick glide is decaying
    var mv = 0;           // momentum velocity, px/frame, decays via friction
    var vel = 0;          // smoothed pointer velocity, tracked during drag
    var lastX = 0;
    var startPointerX = 0;
    var startX = 0;
    var resizeTimer = null;

    function wrap() {
      if (!half) return;
      while (x <= -half) x += half;
      while (x > 0) x -= half;
    }

    // The true loop period is the offset of the first cloned card relative
    // to the first original card — that span includes the trailing
    // inter-item gap, so card (originalCount + 1) lands exactly where card 1
    // started and the wrap is seamless. (track.scrollWidth / 2 was off by
    // half a gap.)
    function measureHalf() {
      var cloneStart = track.children[originalCount];
      if (!cloneStart || !track.firstElementChild) return 0;
      return cloneStart.offsetLeft - track.firstElementChild.offsetLeft;
    }

    function recomputeHalf() {
      var next = measureHalf();
      if (!next) {
        // Layout isn't ready yet (images still loading, or the page is hidden
        // under the Government view): the ResizeObserver below calls back as
        // soon as the strip gets a size. (Retrying every frame here used to
        // spin forever under gov, once per photo.)
        return;
      }
      half = next;
      // Re-normalize the current position into the new period so a live
      // recompute (an image finishing load, a resize) never causes a
      // visible jump.
      wrap();
      track.style.transform = 'translateX(' + x + 'px)';
    }
    recomputeHalf();

    // Gallery cards are real <img>s now and load asynchronously, which can
    // shift the track's layout (and therefore `half`) after our first
    // measurement — recompute per-image-load, plus once more on window
    // 'load' as a backstop, and on resize as before.
    var imgs = track.querySelectorAll('img');
    for (var m = 0; m < imgs.length; m++) {
      imgs[m].addEventListener('load', recomputeHalf);
    }
    window.addEventListener('load', recomputeHalf);
    if (window.ResizeObserver) new ResizeObserver(function () { recomputeHalf(); }).observe(track);

    window.addEventListener('resize', function () {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(recomputeHalf, 150);
    });

    // Only run while the carousel is actually on screen and the tab is
    // visible: off screen the loop stops asking for frames at all.
    var visible = false, running = false;
    function wake() {
      if (running || reduce || !visible || document.hidden) return;
      running = true;
      requestAnimationFrame(frame);
    }
    var io = new IntersectionObserver(function (es) { visible = es[0].isIntersecting; wake(); }, { threshold: 0 });
    io.observe(container);
    document.addEventListener('visibilitychange', wake);

    // Three effective states, mutually exclusive: dragging (transform set
    // directly in pointermove, this loop no-ops), momentum (decaying mv),
    // auto (base speed). Auto never runs while dragging or gliding.
    function frame() {
      if (!visible || document.hidden) { running = false; return; }
      if (!dragging) {
        if (momentum) {
          x += mv;
          mv *= 0.94;
          wrap();
          track.style.transform = 'translateX(' + x + 'px)';
          if (Math.abs(mv) < speed) momentum = false;
        } else {
          x -= speed;
          if (half && x <= -half) x += half;
          track.style.transform = 'translateX(' + x + 'px)';
        }
      }
      requestAnimationFrame(frame);
    }

    container.addEventListener('pointerdown', function (e) {
      dragging = true;
      momentum = false;
      vel = 0;
      lastX = e.clientX;
      container.classList.add('is-dragging');
      if (container.setPointerCapture) container.setPointerCapture(e.pointerId);
      startPointerX = e.clientX;
      startX = x;
      e.preventDefault();
    });

    container.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX;
      vel = 0.8 * vel + 0.2 * dx; // smoothed pointer velocity
      lastX = e.clientX;
      x = startX + (e.clientX - startPointerX);
      wrap();
      track.style.transform = 'translateX(' + x + 'px)';
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      container.classList.remove('is-dragging');
      // Reduced motion: just stop — no glide, no auto-scroll resume.
      if (!reduce && vel) {
        mv = vel;
        momentum = true;
      }
    }
    container.addEventListener('pointerup', endDrag);
    container.addEventListener('pointercancel', endDrag);
    container.addEventListener('lostpointercapture', endDrag);
  }

  /* Experts mode: only ~4 cards, so this never moves on its own — no clone,
     no auto-scroll, no momentum. Pure drag, clamped so you can't pull past
     either end of the (finite) track. */
  function initStaticDragTicker(container, track) {
    var x = 0;
    var dragging = false;
    var startPointerX = 0;
    var startX = 0;
    var minX = 0;
    var resizeTimer = null;

    function recomputeMinX() {
      minX = Math.min(0, container.clientWidth - track.scrollWidth);
    }
    recomputeMinX();
    // Layout might not be ready yet (images still loading, or hidden under the
    // Government view): re-measure whenever the strip's size changes.
    if (window.ResizeObserver) new ResizeObserver(recomputeMinX).observe(track);

    window.addEventListener('resize', function () {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(recomputeMinX, 150);
    });

    function clamp(val) {
      if (val > 0) return 0;
      if (val < minX) return minX;
      return val;
    }

    container.addEventListener('pointerdown', function (e) {
      dragging = true;
      container.classList.add('is-dragging');
      if (container.setPointerCapture) container.setPointerCapture(e.pointerId);
      startPointerX = e.clientX;
      startX = x;
      e.preventDefault();
    });

    container.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      x = clamp(startX + (e.clientX - startPointerX));
      track.style.transform = 'translateX(' + x + 'px)';
    });

    function endDrag() {
      dragging = false;
      container.classList.remove('is-dragging');
    }
    container.addEventListener('pointerup', endDrag);
    container.addEventListener('pointercancel', endDrag);
    container.addEventListener('lostpointercapture', endDrag);
  }
})();
