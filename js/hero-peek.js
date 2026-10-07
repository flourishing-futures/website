/*
 * Home hero — "there's more below" hint.
 *
 * The hero fills the screen (and on phones the nav sits along its bottom edge),
 * so nothing says the page carries on. Every so often, while you're sat at the
 * top, the Vision sun from the next section peeks up over the hero's bottom
 * edge, gives a little hop, and sinks back: a glimpse of what's below, like a
 * sunrise over the horizon. No arrow, nothing on screen the rest of the time.
 *
 * A tiny ring of "Explore More —" in GT Maru circles the sun so it reads as
 * something to tap rather than part of the picture. This file draws that ring
 * to fit (repeats the phrase so it closes exactly, sized in px however big the
 * sun is).
 *
 * Once you've scrolled, it's done its job and stops for the visit. Tapping it
 * while it's up scrolls to the next section. Reduced motion: it simply rests
 * half-risen at the bottom edge.
 *
 * The rise/hop/sink itself is a CSS animation (.hero-peek.is-peeking in
 * home.css); this file only decides WHEN, so nothing runs between peeks.
 */
(function () {
  var hero = document.getElementById('hero');
  var peek = hero && hero.querySelector('.hero-peek');
  if (!peek) return;

  var FIRST   = 3.5;   // s after landing before the first peek (the question has settled in)
  var EVERY   = 11;    // s between peeks after that...
  var BACKOFF = 1.35;  // ...each gap a bit longer than the last, so it doesn't nag
  var MAX_GAP = 30;    // s, the longest it'll wait between peeks
  var FOUND   = 40;    // px scrolled = they've found the rest of the page; stop hinting
  var TOP     = 8;     // px; only peek while the page is at (or very near) the top

  var PHRASE   = 'Explore More';
  // " — " between repeats. Non-breaking spaces: SVG text drops a trailing
  // plain space, which closed the ring up as "—Explore" where it meets itself.
  var SEP      = '\u00A0\u2014\u00A0';
  var RING     = 73.5;   // ring radius, in % of the sun's disc diameter (the rays reach ~70)
  var TEXT_PX  = 11;     // type size on a laptop...
  var TEXT_SM  = 10;     // ...and on a phone (still legible, still quiet)

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nav = document.getElementById('siteNav');
  var found = false, onScreen = true, pressed = false, gap = EVERY, timer = null;

  // On phones the nav is a fixed bar over the hero's bottom edge: rise from
  // the bar's top instead (it becomes the horizon).
  function floor() {
    var fixed = nav && window.getComputedStyle(nav).position === 'fixed';
    hero.style.setProperty('--peek-floor', fixed ? nav.offsetHeight + 'px' : '0px');
  }
  floor();
  window.addEventListener('resize', floor, { passive: true });
  window.addEventListener('load', floor);

  // --- The "Explore More —" ring ------------------------------------------
  // One SVG circle path with the phrase on it, drawn into both halves of
  // .hero-peek__ring (each half is clipped to its side of the hero's divider
  // and takes that side's ink in CSS). Units: 100 = the disc's diameter, so
  // the type size is converted from px each time the sun's size changes.
  var NS = 'http://www.w3.org/2000/svg';
  var halves = peek.querySelectorAll('.hero-peek__half');
  var sun = peek.querySelector('.hero-peek__sun');
  var lastD = 0;

  function el(name, attrs) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }
  function ring() {
    var d = sun.offsetWidth;
    if (!d || d === lastD) return;
    lastD = d;
    var size = (window.innerWidth <= 768 ? TEXT_SM : TEXT_PX) * 100 / d;   // px -> ring units
    var C = 2 * Math.PI * RING;

    // Measure one phrase (+ separator) in the real font; estimate if we can't.
    var probe = el('svg', { viewBox: '-85 -85 170 170' });
    var t = el('text', { 'class': 'hero-peek__text', 'font-size': size.toFixed(2) });
    t.textContent = PHRASE + SEP;
    probe.appendChild(t);
    halves[0].textContent = '';
    halves[0].appendChild(probe);
    var unit = 0, word = 0;
    try {
      unit = t.getComputedTextLength();
      t.textContent = PHRASE;
      word = t.getComputedTextLength();
    } catch (e) {}
    if (!unit) { unit = (PHRASE + SEP).length * size * 0.66; word = PHRASE.length * size * 0.66; }

    // Repeat it a whole number of times so the ring closes, and stretch the
    // spacing by the leftover (a few %) so there's no seam.
    var n = Math.max(2, Math.round(C / unit));
    var text = '';
    for (var i = 0; i < n; i++) text += PHRASE + SEP;
    // Turn the ring so a dash sits at the top, on the divider, and an
    // "Explore More" reads whole on each side of it.
    var a0 = -(((unit + word) / 2) * (C / (n * unit))) / C * 360;
    peek.style.setProperty('--ring-a0', a0.toFixed(2) + 'deg');

    Array.prototype.forEach.call(halves, function (h, k) {
      var svg = el('svg', { viewBox: '-85 -85 170 170', 'aria-hidden': 'true', focusable: 'false' });
      var id = 'heroPeekRing' + k;
      // Clockwise from the top, so the letters stand on the outside of the ring.
      svg.appendChild(el('path', { id: id, fill: 'none',
        d: 'M0,' + (-RING) + 'A' + RING + ',' + RING + ' 0 1 1 0,' + RING + 'A' + RING + ',' + RING + ' 0 1 1 0,' + (-RING) }));
      var tx = el('text', { 'class': 'hero-peek__text', 'font-size': size.toFixed(2) });
      var tp = el('textPath', { href: '#' + id, textLength: C.toFixed(2), lengthAdjust: 'spacing' });
      tp.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + id);
      tp.textContent = text;
      tx.appendChild(tp);
      svg.appendChild(tx);
      h.textContent = '';
      h.appendChild(svg);
    });
  }
  ring();
  // Re-measure once GT Maru has actually loaded (it may still be swapping in).
  if (document.fonts && document.fonts.load) {
    document.fonts.load('500 11px "GT Maru"').then(function () { lastD = 0; ring(); }, function () {});
  }
  var ringT = null;
  window.addEventListener('resize', function () {
    window.clearTimeout(ringT);
    ringT = window.setTimeout(ring, 150);
  }, { passive: true });

  // Tap/click while it's up: glide down to where the next section starts.
  peek.addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({ top: hero.offsetHeight, behavior: reduce ? 'auto' : 'smooth' });
  });

  if (reduce) { peek.classList.add('is-still'); return; }

  function canPeek() {
    return !found && onScreen && !pressed && !document.hidden &&
      window.scrollY <= TOP && !document.body.classList.contains('menu-open-lock');
  }

  function schedule(s) {
    window.clearTimeout(timer);
    timer = window.setTimeout(function () {
      if (found) return;
      if (canPeek()) {
        peek.classList.remove('is-leaving');
        peek.classList.add('is-peeking');
        schedule(gap);
        gap = Math.min(MAX_GAP, gap * BACKOFF);
      } else {
        schedule(4);   // not a good moment (mid-drag, tab hidden...): look again shortly
      }
    }, s * 1000);
  }

  peek.addEventListener('animationend', function (e) {
    if (e.target === peek.firstElementChild) peek.classList.remove('is-peeking');
  });

  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    // Started scrolling mid-peek: fade it out rather than snapping it away.
    if (y > TOP && peek.classList.contains('is-peeking')) peek.classList.add('is-leaving');
    if (y > FOUND && !found) { found = true; window.clearTimeout(timer); }
  }, { passive: true });

  // Don't pop up while someone's mid-drag on a hero toy.
  window.addEventListener('pointerdown', function () { pressed = true; }, { passive: true });
  window.addEventListener('pointerup', function () { pressed = false; }, { passive: true });
  window.addEventListener('pointercancel', function () { pressed = false; }, { passive: true });
  window.addEventListener('blur', function () { pressed = false; });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; }).observe(hero);
  }

  if (window.scrollY > FOUND) found = true;   // reloaded part-way down the page
  else schedule(FIRST);
})();
