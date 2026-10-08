/*
 * Resource Hub hero — the cover-flow book behind the featured deck.
 *
 * The art (References/Resource Layers/Group 198.svg) is an open book seen from
 * above: a fan of trapezoid pages hinged on a centre spine, flat covers at the
 * outside, pages standing up more and more toward the middle. Here the pages
 * are drawn live so the fan can move:
 *
 *   - Each page has a tilt from 0° (lying flat on the right) to 180° (flat on
 *     the left). Its drawn width is just the page width × cos(tilt), which
 *     is exactly how the pages in the lockup are spaced.
 *   - Where the book falls open follows the cursor's x position: move right
 *     and pages riffle over from right to left, move left and they come back,
 *     like thumbing through Cover Flow. Middle of the page = the lockup's pose.
 *   - Every time the deck flips to the next card (the 'resdeck:advance' event,
 *     every 3s or on click), the book turns one page with it. The pages are
 *     a looping strip, so it can keep turning forever: a page that lands flat
 *     on the far left quietly reappears flat under the right-hand pile.
 *   - Each page follows its spot on a slightly springy spring with its own
 *     stiffness, so a quick sweep of the mouse fans them out a little unevenly.
 *
 * Touch: sliding a finger across the hero riffles the pages (scrolling isn't
 * blocked), and Android tilt drives it too (js/hero-tilt.js). The loop only
 * runs while the hero is on screen and sleeps once the pages settle. Reduced
 * motion: the book is drawn once in the lockup's pose.
 *
 * The pink brush doodles behind the book are plain <img> layers
 * (.res-hero__layer) with their own cursor parallax in js/render-content.js.
 */
(function () {
  var hero = document.querySelector('.res-hero');
  var svg = hero && hero.querySelector('.res-book');
  if (!svg) return;
  var title = hero.querySelector('.res-hero__title');
  var deck = hero.querySelector('.res-deck__deck');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Tunables ---------------------------------------------------------------
  var PAGES   = 16;     // pages in the looping strip (~11 visibly fanned + a few flat underneath)
  var STEP    = 7.8;    // deg: how much more each page leans than the one nearer the spine
  var FLOP    = 10.8;   // how quickly the outer pages fall flat (matches the lockup's covers)
  var FLOP_AT = 3.5;    // pages out from the spine before they start falling flat
  var RANGE   = 2.6;    // pages turned by moving the cursor from the middle to either edge
  var TURN_S  = 0.35;   // s: how long a deck-synced page turn takes to glide over
  var STIFF   = 95;     // page spring stiffness (higher = snappier)
  var DAMP    = 0.68;   // damping ratio (< 1 = a small overshoot before settling)
  var WOBBLE  = 0.14;   // ± variation in stiffness between pages, so they don't move in lockstep
  var ASPECT  = 0.725;  // page width ÷ page height in the lockup
  var SPINE_H = 0.5625; // the spine edge's height ÷ the outer edge's height (perspective)
  var TOP_PAD = 10;     // px: the book's top edge sits this far above the headline
  var SIDE    = 70;     // px: on wide screens the open book reaches at least this far past the deck

  var NS = 'http://www.w3.org/2000/svg';
  var pages = [];
  for (var i = 0; i < PAGES; i++) {
    var el = document.createElementNS(NS, 'path');
    el.setAttribute('class', 'res-book__page');
    svg.appendChild(el);
    pages.push({
      el: el, a: 90, v: 0, wrap: null, side: 0, d: '',
      k: STIFF * (1 + WOBBLE * Math.sin(i * 2.39996))   // golden-angle spread of temperaments
    });
  }

  // How far (deg) a page leans away from upright, by how many pages it sits
  // from the spine. Even steps near the middle, then the outer pages flop flat.
  function lean(x) {
    var d = x < 0.5 ? x * STEP * 2 : STEP * (x + 0.5);
    if (x > FLOP_AT) d += FLOP * (x - FLOP_AT) * (x - FLOP_AT);
    return Math.min(90, d);
  }

  // --- Layout: size the book around the deck -----------------------------------
  var G = null;
  function measure() {
    var hr = hero.getBoundingClientRect();
    if (!hr.width) return;
    var dr = deck ? deck.getBoundingClientRect() : hr;
    var tr = title ? title.getBoundingClientRect() : dr;
    var cx = dr.left + dr.width / 2 - hr.left;
    var cy = dr.top + dr.height / 2 - hr.top;
    var ho = Math.max(120, cy - (tr.top - hr.top) + TOP_PAD);   // outer edge half-height
    var w = Math.min(Math.max(ho * 2 * ASPECT, dr.width / 2 + SIDE), hr.width / 2 - 12);
    G = { cx: cx, cy: cy, ho: ho, hs: ho * SPINE_H, dy: ho * 0.012, w: w, s: w * 0.01, left: hr.left, width: hr.width };
    svg.setAttribute('viewBox', '0 0 ' + hr.width.toFixed(0) + ' ' + hr.height.toFixed(0));
  }

  function f1(n) { return Math.round(n * 10) / 10; }
  function draw(pg) {
    var c = Math.cos(pg.a * Math.PI / 180);
    var hinge = G.cx - G.s * c;   // right-hand pages hinge a hair left of centre, and vice versa, so the spine never gaps
    var out = hinge + G.w * c;
    var dy = G.dy * Math.max(-1, Math.min(1, c * 6));   // and sit a hair lower (left-hand ones a hair higher)
    var d = 'M' + f1(hinge) + ' ' + f1(G.cy + dy - G.hs) +
            'L' + f1(out) + ' ' + f1(G.cy - G.ho) +
            'L' + f1(out) + ' ' + f1(G.cy + G.ho) +
            'L' + f1(hinge) + ' ' + f1(G.cy + dy + G.hs) + 'Z';
    if (d !== pg.d) { pg.el.setAttribute('d', d); pg.d = d; }
    var side = c >= 0 ? 1 : -1;   // the gradient runs green at the outer edge → blue at the spine
    if (side !== pg.side) { pg.el.setAttribute('fill', side > 0 ? 'url(#resBookR)' : 'url(#resBookL)'); pg.side = side; }
  }

  // Flatter pages lie underneath; the more upright a page, the higher it sits.
  var order = '';
  function restack() {
    var idx = pages.map(function (_, j) { return j; });
    idx.sort(function (a, b) { return Math.abs(pages[b].a - 90) - Math.abs(pages[a].a - 90); });
    var key = idx.join(',');
    if (key === order) return;
    order = key;
    for (var j = 0; j < idx.length; j++) svg.appendChild(pages[idx[j]].el);
  }

  // Where page j sits in the strip (pages from the spine; + = right) for a given
  // opening point p, plus which lap of the loop it's on (to catch wraps).
  function slot(j, p) {
    var u = j - p, lap = Math.floor((u + PAGES / 2) / PAGES);
    return { u: u - lap * PAGES, lap: lap };
  }
  function target(u) { return u >= 0 ? 90 - lean(u) : 90 + lean(-u); }

  // The lockup's pose: pages sit half a page either side of the spine.
  var P0 = 0.5;

  function settleAll(p) {
    for (var j = 0; j < PAGES; j++) {
      var s = slot(j, p);
      pages[j].a = target(s.u); pages[j].v = 0; pages[j].wrap = s.lap;
      draw(pages[j]);
    }
    restack();
  }

  measure();
  if (!G) return;
  settleAll(P0);

  if (reduced) {
    window.addEventListener('resize', function () { measure(); if (G) settleAll(P0); });
    return;
  }

  // --- Input --------------------------------------------------------------------
  var mouseX = null, touchX = null, tiltX = null;
  // Mouse only: the fake mouse events phones fire after a tap would otherwise leave the book stuck open.
  document.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    mouseX = e.clientX; kick();
  }, { passive: true });
  document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) { mouseX = null; kick(); } });
  hero.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; kick(); }, { passive: true });
  hero.addEventListener('touchmove', function (e) { touchX = e.touches[0].clientX; kick(); }, { passive: true });
  hero.addEventListener('touchend', function () { touchX = null; kick(); }, { passive: true });
  hero.addEventListener('touchcancel', function () { touchX = null; kick(); }, { passive: true });
  window.addEventListener('ff-tilt-n', function (e) {
    var d = e.detail;
    tiltX = d && d.nx ? d.nx : null;
    kick();
  });

  // -1 (left edge) … 1 (right edge), from whichever input is live.
  function pointer() {
    if (touchX != null || mouseX != null) {
      var r = G;   // the hero's left + width only change with the layout (measure())
      var x = touchX != null ? touchX : mouseX;
      return Math.max(-1, Math.min(1, (x - (r.left + r.width / 2)) / (r.width / 2)));
    }
    return tiltX != null ? tiltX : 0;
  }

  // Deck-synced page turns. Only counted while you can see the book, so a
  // backgrounded tab doesn't bank up a flurry of turns for when you return.
  var turns = 0, turned = 0;
  document.addEventListener('resdeck:advance', function () {
    if (!on || document.hidden) return;
    turns += 1;
    kick();
  });

  // --- Loop ---------------------------------------------------------------------
  var on = false, running = false, last = 0, calm = 0;
  var zeta = 2 * DAMP;
  function loop(nowMs) {
    if (!on || document.hidden) { running = false; return; }
    var dt = Math.min((nowMs - last) / 1000, 1 / 30);
    last = nowMs;

    turned += (turns - turned) * Math.min(1, dt / TURN_S);
    if (Math.abs(turns - turned) < 0.002) turned = turns;
    var p = P0 + turned + RANGE * pointer();

    var moving = turned !== turns;
    for (var j = 0; j < PAGES; j++) {
      var pg = pages[j], s = slot(j, p), goal = target(s.u);
      if (s.lap !== pg.wrap) {
        // Fell off one end of the strip (flat) and comes back flat on the other.
        pg.wrap = s.lap; pg.a = goal; pg.v = 0;
      } else {
        // Two half-steps keep the springs steady at low frame rates.
        for (var h = 0; h < 2; h++) {
          var st = dt / 2;
          pg.v += (pg.k * (goal - pg.a) - zeta * Math.sqrt(pg.k) * pg.v) * st;
          pg.a += pg.v * st;
        }
      }
      if (Math.abs(goal - pg.a) > 0.05 || Math.abs(pg.v) > 0.05) moving = true;
      draw(pg);
    }
    restack();

    // Sleep once everything has been still for a moment; input wakes it.
    calm = moving ? 0 : calm + dt;
    if (calm > 0.3) { running = false; return; }
    requestAnimationFrame(loop);
  }
  function kick() {
    if (running || !on || document.hidden) return;
    running = true; calm = 0;
    last = performance.now();
    requestAnimationFrame(loop);
  }

  new IntersectionObserver(function (es) { on = es[0].isIntersecting; kick(); }).observe(hero);
  document.addEventListener('visibilitychange', kick);

  // Re-fit when the hero or deck changes size (fonts loading, deck height pinning, resizes).
  function refit() {
    measure();
    if (!G) return;
    for (var j = 0; j < PAGES; j++) { pages[j].d = ''; draw(pages[j]); }
    kick();
  }
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(refit);
    ro.observe(hero);
    if (deck) ro.observe(deck);
  } else {
    window.addEventListener('resize', refit);
    window.addEventListener('load', refit);
  }
})();
