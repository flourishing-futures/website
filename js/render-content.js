(function () {
  var data = window.SITE_CONTENT;
  if (!data) return;

  if (data.lately) renderLately(data.lately);
  if (data.resources) renderResources(data.resources);
  if (data.events) renderEvents(data.events);

  /* --- Lately cards (index.html) ------------------------------------ */
  function renderLately(items) {
    var stack = document.querySelector('.lately__stack');
    if (!stack || items.length < 2) return;

    var html = '';
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var bodyHtml = '';
      for (var j = 0; j < item.body.length; j++) {
        bodyHtml += '<p class="lately-card__body">' + item.body[j] + '</p>';
      }
      html +=
        '<article class="lately-card" data-pos="' + i + '">' +
          '<div class="lately-card__content">' +
            '<h2 class="lately-card__heading">' + item.heading + '</h2>' +
            bodyHtml +
            '<div><a href="' + item.cta.href + '" class="btn btn--' + item.cta.style + '">' + item.cta.text + '</a></div>' +
          '</div>' +
          '<div class="lately-card__image">' +
            '<img src="' + item.image.src + '" alt="' + item.image.alt + '">' +
          '</div>' +
        '</article>';
    }
    stack.innerHTML = html;

    if (items.length > 3) injectLatelyPositionCSS(items.length);
  }

  function injectLatelyPositionCSS(count) {
    var style = document.createElement('style');
    var rules = '';
    for (var i = 3; i < count; i++) {
      rules +=
        '.lately-card[data-pos="' + i + '"]{' +
          'transform:translate(' + (i * 16) + 'px,' + (i * 20) + 'px) rotate(' + (i * 1.6) + 'deg);' +
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
        imageHtml = '<img src="' + item.image.src + '" alt="' + (item.image.alt || '') + '">';
      } else {
        imageClass += ' res-deck-card__image--blue';
      }

      html +=
        '<article class="res-deck-card" data-pos="' + i + '">' +
          '<div class="res-deck-card__content">' +
            '<p class="res-deck-card__eyebrow">' + eyebrow + '</p>' +
            '<h2 class="res-deck-card__title">' + item.title + '</h2>' +
            '<div class="res-deck-card__body">' + bodyHtml + '</div>' +
            '<div><a class="btn btn--green" href="' + item.cta.href + '">' + item.cta.text + '</a></div>' +
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

    var timer = window.setInterval(advance, 3000);
    deck.addEventListener('click', function () {
      advance();
      window.clearInterval(timer);
      timer = window.setInterval(advance, 3000);
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
    for (var i = 0; i < cats.length; i++) {
      html += '<button class="res-stream__tag" data-cat="' + cats[i] + '">' + cats[i] + '</button>';
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
      ? '<img src="' + item.image.src + '" alt="' + (item.image.alt || '') + '">'
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

  /* Ripple parallax: the three red slices drift by different amounts (and
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

  /* --- Events (community.html) -------------------------------------- */
  function renderEvents(items) {
    var card = document.querySelector('.comm-events .about-develop__card');
    if (!card) return;

    items.sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var html = '';

    for (var i = 0; i < items.length; i++) {
      var ev = items[i];
      var eventDate = new Date(ev.date);
      var isUpcoming = eventDate >= today;
      var isLast = i === items.length - 1;

      var classes = 'about-develop__item about-develop__item--expanded';
      if (isLast) classes += ' about-develop__item--last';

      var badgeClass = isUpcoming ? 'comm-events__badge' : 'comm-events__badge comm-events__badge--past';
      var badgeText = isUpcoming ? 'Upcoming' : 'Past';

      var linkHtml = '';
      if (ev.link) {
        linkHtml = '<a href="' + ev.link + '" target="_blank" rel="noopener" class="comm-events__link">View on Luma →</a>';
      }

      var tagsHtml = '';
      if (ev.tags && ev.tags.length) {
        tagsHtml = '<p class="comm-events__format">' + ev.tags.join(' · ') + '</p>';
      }

      html +=
        '<div class="' + classes + '">' +
          '<div class="comm-events__meta">' +
            '<span class="' + badgeClass + '">' + badgeText + '</span>' +
            '<span class="comm-events__date">' + formatDate(ev.date) + '</span>' +
          '</div>' +
          '<h3 class="about-develop__item-title">' + ev.title + '</h3>' +
          '<p class="about-develop__item-desc">' + ev.description + '</p>' +
          tagsHtml +
          linkHtml +
        '</div>';
    }

    card.innerHTML = html;
  }

  function formatDate(iso) {
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var parts = iso.split('-');
    var day = parseInt(parts[2], 10);
    var month = months[parseInt(parts[1], 10) - 1];
    var year = parts[0];
    return day + ' ' + month + ' ' + year;
  }
})();
