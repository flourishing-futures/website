/*
 * Home hero — Interaction 3: "language reels" (prototype).
 *
 * Each half is a reel of speech bubbles, like a slot machine but calmer.
 * Each side has its own colours (its own "language"), and the shapes are what
 * they say. Get the same SHAPE to land in the middle on both sides and the two
 * speakers are saying the same thing in different languages: the bubbles
 * lean in toward each other and each one says "hello" in its own tongue.
 *
 *   - Idle: each reel ticks on one bubble every few seconds (opposite ways).
 *   - Move over a side and that reel spins; the deeper into the half (away
 *     from the divider), the faster. Hold still or move off and it slows and
 *     lands on the next bubble with a little overshoot, like a slot reel.
 *   - Click/tap a side to step it on by one.
 *   - Tails point outward on both sides (as in the design), so the bubbles
 *     read as two people facing each other across the divider.
 *
 * Bubbles come from the inline <symbol> sprite in index.html (fill-less, so
 * they're coloured with CSS `color` and flipped with scaleX(-1)).
 *
 * Design: References/Hero_Interaction_3.jpg · assets: References/Interaction_3_Assets.
 * Reduced motion: the reels sit still; a click still steps them (no glide).
 */
(function () {
  var root = document.getElementById('heroLang');
  if (!root) return;
  var hero = document.getElementById('hero');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PORTRAIT = window.matchMedia('(max-aspect-ratio: 1/1)');
  var SVGNS = 'http://www.w3.org/2000/svg';

  // The four bubble shapes. ar = height/width of the art; w = width as a
  // fraction of the half; cy = where the bubble's BODY centre sits in its art
  // (0..1 down), so bodies (not tails) land on the middle line; tail = which
  // side the tail is on as authored. hollow = an outline, so text sits on the field.
  var SHAPES = {
    pill:    { id: 'lang-pill',    ar: 606 / 1414, w: 0.86, cy: 0.41, tail: 'l' },
    tri:     { id: 'lang-tri',     ar: 569 / 1421, w: 0.86, cy: 0.37, tail: 'r' },
    brush:   { id: 'lang-brush',   ar: 662 / 1480, w: 0.90, cy: 0.39, tail: 'l' },
    outline: { id: 'lang-outline', ar: 724 / 1396, w: 0.84, cy: 0.40, tail: 'l', hollow: true }
  };
  // Bubble colours (the design's hues) + the ink for text on them.
  var COLOURS = {
    purple: { fill: '#7E5BFF', ink: '#F3F3F3' },
    yellow: { fill: '#EBF900', ink: '#1B1B1B' },
    white:  { fill: '#FFFFFF', ink: '#1B1B1B' },
    blue:   { fill: '#0066FF', ink: '#F3F3F3' },
    red:    { fill: '#FF0900', ink: '#F3F3F3' },
    pink:   { fill: '#FE1A87', ink: '#F3F3F3' }
  };
  // Reel strips: each side's own palette (the right side carries the white
  // title, so it only gets colours white text reads on). Each strip has every
  // shape twice; neighbours always differ in shape AND colour.
  var STRIPS = {
    l: [['pill', 'purple'], ['brush', 'yellow'], ['outline', 'white'], ['tri', 'blue'],
        ['pill', 'yellow'], ['brush', 'white'], ['tri', 'purple'], ['outline', 'blue']],
    r: [['pill', 'blue'], ['tri', 'pink'], ['brush', 'red'], ['outline', 'purple'],
        ['pill', 'red'], ['brush', 'blue'], ['tri', 'purple'], ['outline', 'pink']]
  };
  // What a matched pair says: the same greeting, in two languages.
  var HELLOS = [['hello', 'kia ora'], ['hola', 'bonjour'], ['こんにちは', 'ciao'], ['你好', 'salaam'],
    ['olá', 'namaste'], ['hallo', '안녕하세요'], ['merhaba', 'jambo'], ['xin chào', 'hej'],
    ['привет', 'talofa'], ['sawubona', 'mabuhay']];

  var GAP       = 0.07;   // gap between bubbles (× half height)
  var SPIN_V    = 5.5;    // slots/s at full lean (cursor at the half's outer edge)
  var SPIN_MIN  = 1.2;    // slots/s just past the divider
  var SPIN_EASE = 4;      // how fast a reel spins up under the cursor (1/s)
  var STILL_MS  = 380;    // a cursor held this still stops spinning its reel
  var TICK      = 3.2;    // idle: seconds between ticks
  var LAND_K    = 30;     // landing spring (stiffness, damping ratio)
  var LAND_Z    = 0.55;
  var DWELL     = 2.8;    // seconds a match holds before idling on

  // --- Build ---------------------------------------------------------------
  var reels = [];
  Array.prototype.forEach.call(root.querySelectorAll('.lang__reel'), function (host) {
    var side = host.getAttribute('data-side');
    var strip = STRIPS[side];
    if (!strip) return;
    var items = [];
    // Two copies of the strip so the reel wraps seamlessly.
    for (var copy = 0; copy < 2; copy++) {
      strip.forEach(function (pair, i) {
        var sh = SHAPES[pair[0]], col = COLOURS[pair[1]];
        var el = document.createElement('div');
        el.className = 'lang__bubble';
        el.setAttribute('data-colour', pair[1]);
        el.style.color = col.fill;
        var vbH = Math.round(1000 * sh.ar);
        var svg = document.createElementNS(SVGNS, 'svg');
        svg.setAttribute('viewBox', '0 0 1000 ' + vbH);
        // Tails point outward (toward this side's outer edge).
        svg.setAttribute('class', 'lang__art' + (sh.tail !== side ? ' is-flipped' : ''));
        var use = document.createElementNS(SVGNS, 'use');
        use.setAttribute('href', '#' + sh.id);
        use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + sh.id);
        use.setAttribute('width', '1000');
        use.setAttribute('height', String(vbH));
        svg.appendChild(use);
        el.appendChild(svg);
        var say = document.createElement('span');
        say.className = 'lang__say';
        say.style.top = (sh.cy * 100) + '%';
        say.style.color = sh.hollow ? '' : col.ink;
        el.appendChild(say);
        host.appendChild(el);
        items.push({ el: el, say: say, sh: sh, shape: pair[0], slot: i, y: 0, w: 0, h: 0, lean: 0 });
      });
    }
    var n = strip.length;
    reels.push({
      host: host, side: side, items: items, n: n,
      dir: side === 'l' ? 1 : -1,   // opposite roll directions
      pos: side === 'l' ? 0 : 1,    // start on different shapes (pill | tri)
      v: 0, target: null, spin: 0, nextTick: 0, H: 0, total: 0, offs: []
    });
  });
  if (reels.length < 2) return;

  function layout() {
    reels.forEach(function (r) {
      var W = r.host.clientWidth, H = r.host.clientHeight;
      r.H = H;
      var y = 0;
      r.offs = [];
      for (var k = 0; k < r.n; k++) {
        var a = r.items[k], b = r.items[k + r.n];
        var w = Math.min(W * a.sh.w, H * 0.62 / a.sh.ar);   // keep a bubble under ~60% of a short half
        var h = w * a.sh.ar;
        [a, b].forEach(function (it) {
          it.w = w; it.h = h;
          it.el.style.width = w.toFixed(1) + 'px';
          it.el.style.left = ((W - w) / 2).toFixed(1) + 'px';
          it.say.style.fontSize = (w * 0.085).toFixed(1) + 'px';
        });
        a.y = y;
        r.offs.push(y + h * a.sh.cy);   // slot k's body centre, from the strip top
        y += h + H * GAP;
      }
      r.total = y;
      for (k = 0; k < r.n; k++) r.items[k + r.n].y = r.items[k].y + r.total;
    });
    render();
  }

  // Fractional slot → strip offset that puts it on the middle line. Slot
  // centres are interpolated, so roll speed is even across bubble heights.
  function stripY(r, pos) {
    var n = r.n, p = ((pos % n) + n) % n;
    var a = Math.floor(p), f = p - a;
    var ya = r.offs[a], yb = a + 1 < n ? r.offs[a + 1] : r.offs[0] + r.total;
    return ya + (yb - ya) * f;
  }

  function render() {
    reels.forEach(function (r) {
      if (!r.total) return;
      var off = stripY(r, r.pos) - r.H / 2;
      var span = r.total * 2, pad = r.H * 0.6;
      r.items.forEach(function (it) {
        var y = ((it.y - off + pad) % span + span) % span - pad;   // wrap into view
        var c = (y + it.h * it.sh.cy - r.H / 2) / r.H;             // body offset from middle
        var sc = 0.9 + 0.1 * Math.max(0, 1 - Math.abs(c) * 2.2);   // centre bubble slightly larger
        it.el.style.transform = 'translate3d(' + it.lean.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + sc.toFixed(3) + ')';
      });
    });
  }

  function slotOf(r) { return ((Math.round(r.pos) % r.n) + r.n) % r.n; }
  function landed(r) { return r.target === null && r.spin === 0 && Math.abs(r.pos - Math.round(r.pos)) < 0.01; }

  // --- Matching ------------------------------------------------------------
  var match = null;       // { until, slots: [l, r] }
  var touchedAt = -1e9;   // last time the user rolled a reel (only they win)
  var helloIdx = 0;
  function checkMatch(now) {
    if (match || now - touchedAt > 6) return;
    if (!landed(reels[0]) || !landed(reels[1])) return;
    var sl = slotOf(reels[0]), sr = slotOf(reels[1]);
    if (reels[0].items[sl].shape !== reels[1].items[sr].shape) return;
    match = { until: now + DWELL, slots: [sl, sr] };
    touchedAt = -1e9;   // one celebration per win
    var words = HELLOS[helloIdx++ % HELLOS.length];
    reels.forEach(function (r, idx) {
      r.nextTick = now + DWELL + TICK * 0.5;
      [r.items[match.slots[idx]], r.items[match.slots[idx] + r.n]].forEach(function (it) {
        it.say.textContent = words[idx];
        it.el.classList.add('is-matched');
      });
    });
    root.classList.add('is-match');
  }
  function endMatch() {
    reels.forEach(function (r) {
      r.items.forEach(function (it) { it.el.classList.remove('is-matched'); });
    });
    root.classList.remove('is-match');
    match = null;
  }

  // --- Pointer -------------------------------------------------------------
  var pointer = null;
  function active() { return root.classList.contains('is-active'); }
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' && e.buttons === 0) return;
    pointer = { x: e.clientX, y: e.clientY, t: performance.now() };
  }, { passive: true });
  function release() { pointer = null; }
  document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) release(); });
  window.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') release(); });
  window.addEventListener('blur', release);
  // Phones: tilt toward a side to spin that reel (js/hero-tilt.js). Unlike a
  // parked mouse, a held tilt keeps spinning; level the phone and it lands.
  window.addEventListener('ff-tilt', function (e) {
    if (e.detail) {
      pointer = { x: e.detail.x, y: e.detail.y, t: performance.now() };
      touchedAt = performance.now() / 1000;
    } else if (pointer && pointer.tilt) {
      pointer = null;
    }
    if (pointer && e.detail) pointer.tilt = true;
  });
  // Which reel (0 human / 1 machine) a client point is over, or -1.
  function reelAt(x, y) {
    var hr = hero.getBoundingClientRect();
    if (y < hr.top || y > hr.bottom || x < hr.left || x > hr.right) return -1;
    return PORTRAIT.matches ? (y < hr.top + hr.height / 2 ? 0 : 1) : (x < hr.left + hr.width / 2 ? 0 : 1);
  }
  window.addEventListener('pointerdown', function (e) {
    if (!active() || e.button !== 0 || e.target.closest('a, button, .theme-switch')) return;
    var i = reelAt(e.clientX, e.clientY);
    if (i < 0) return;
    var r = reels[i], now = performance.now() / 1000;
    if (match) endMatch();
    touchedAt = now;
    r.target = (r.target !== null ? r.target : Math.round(r.pos)) + r.dir;
    r.nextTick = now + TICK * 1.5;
    if (reduce) { r.pos = r.target; r.target = null; render(); checkMatch(now); }
  }, { passive: true });
  window.addEventListener('resize', layout, { passive: true });

  // --- Loop ----------------------------------------------------------------
  var running = false, onScreen = true, last = 0;
  function sync() {
    var want = onScreen && !document.hidden && active();
    if (want && !running) {
      if (reels[0].H !== reels[0].host.clientHeight) layout();
      if (reduce) return;
      running = true;
      last = performance.now();
      requestAnimationFrame(step);
    } else if (!want) {
      running = false;
    }
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; sync(); }).observe(hero);
  }
  document.addEventListener('visibilitychange', sync);
  var wasActive = active();
  new MutationObserver(function () {
    var on = active();
    if (on && !wasActive) {
      // Arrival: both reels whirr round a couple of bubbles and land.
      var now = performance.now() / 1000;
      if (match) endMatch();
      reels.forEach(function (r) {
        r.target = Math.round(r.pos) + r.dir * 3;
        r.nextTick = now + TICK;
      });
    }
    wasActive = on;
    sync();
  }).observe(root, { attributes: true, attributeFilter: ['class'] });

  function step(nowMs) {
    if (!running) return;
    var now = nowMs / 1000;
    var dt = Math.min((nowMs - last) / 1000, 1 / 30);
    last = nowMs;
    if (match && now > match.until) endMatch();

    var hr = hero.getBoundingClientRect();
    var moving = pointer && nowMs - pointer.t < STILL_MS;
    var over = moving ? reelAt(pointer.x, pointer.y) : -1;

    reels.forEach(function (r, idx) {
      // Depth into this half: 0 at the divider → 1 at the outer edge.
      var depth = 0;
      if (over === idx) {
        var t = PORTRAIT.matches ? (pointer.y - hr.top) / hr.height : (pointer.x - hr.left) / hr.width;
        depth = idx === 0 ? 1 - t * 2 : t * 2 - 1;
        depth = Math.max(0, Math.min(1, depth));
      }
      var spinGoal = over === idx && !match ? SPIN_MIN + (SPIN_V - SPIN_MIN) * depth : 0;

      if (spinGoal > 0) {
        r.spin += (spinGoal - r.spin) * Math.min(1, dt * SPIN_EASE);
        // Spinning freely under the cursor.
        r.target = null;
        r.v = r.dir * r.spin;
        r.pos += r.v * dt;
        touchedAt = now;
        r.nextTick = now + TICK;
      } else {
        // Coasting: pick the slot it will land on (further if it's moving fast).
        // (It keeps its momentum; the spring below brings it home.)
        if (r.target === null && (r.spin > 0 || Math.abs(r.pos - Math.round(r.pos)) > 0.001)) {
          var ahead = r.dir > 0 ? Math.ceil(r.pos - 0.05) : Math.floor(r.pos + 0.05);
          r.target = ahead + r.dir * Math.floor(Math.abs(r.v) / 3);
        }
        r.spin = 0;
        // Idle tick.
        if (r.target === null && !match && now > r.nextTick) {
          r.target = Math.round(r.pos) + r.dir;
          r.nextTick = now + TICK + (idx ? TICK * 0.5 : 0) * Math.random();
        }
        if (r.target !== null) {
          // Spring onto the slot: a soft overshoot, like a reel clunking home.
          r.v += ((r.target - r.pos) * LAND_K - r.v * 2 * Math.sqrt(LAND_K) * LAND_Z) * dt;
          r.pos += r.v * dt;
          if (Math.abs(r.target - r.pos) < 0.003 && Math.abs(r.v) < 0.03) {
            r.pos = r.target; r.v = 0; r.target = null;
          }
        }
      }
      // The strip repeats every n slots; keep pos small.
      if (Math.abs(r.pos) > r.n * 20) {
        var wrap = r.n * Math.round(r.pos / r.n);
        r.pos -= wrap; if (r.target !== null) r.target -= wrap;
      }

      // A matched pair leans in toward the divider, like a conversation.
      var leanPx = PORTRAIT.matches ? 0 : (idx === 0 ? 1 : -1) * r.host.clientWidth * 0.05;
      r.items.forEach(function (it) {
        var goal = match && it.slot === match.slots[idx] ? leanPx : 0;
        it.lean += (goal - it.lean) * Math.min(1, dt * 5);
      });
    });

    render();
    checkMatch(now);
    requestAnimationFrame(step);
  }

  layout();
  reels.forEach(function (r) { r.nextTick = performance.now() / 1000 + TICK; });
  sync();
})();
