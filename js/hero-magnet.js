/*
 * Home hero — Interaction 1: "magnetic shapes" (prototype).
 *
 * The hero is split down the middle (human | machine). Every shape is pulled
 * toward the cursor, but the centre divider is a wall: shapes can't cross into
 * the other half, so they pile up against it. Cursor dead-centre = both sets
 * press together from either side. When the cursor leaves the hero (or on
 * touch, when the finger lifts) they spring back to their rest layout.
 *
 * Each shape has its own temperament (see SHAPES): weight, springiness, how
 * late it reacts, whether it hangs below the cursor or floats above it, how
 * much it squashes and wobbles. On top of that they idle-float, stretch along
 * their direction of travel, jelly-wobble when they hit the wall or each
 * other, and scatter when you click. The pill's eyes follow the cursor (the
 * Flofu pupil logic, shared from index.html as window.__ffPlaceEyes) and blink.
 *
 * Design: References/Hero_Interaction_1.jpg · assets: References/Interaction_1 Assets.
 * Portrait screens split top | bottom instead (the wall turns horizontal).
 * Reduced motion: shapes just sit at rest (the pill's eyes still look around).
 */
(function () {
  var hero = document.getElementById('hero');
  var root = document.getElementById('heroMagnet');
  if (!hero || !root) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PORTRAIT = window.matchMedia('(max-aspect-ratio: 1/1)');

  // Rest layout, measured off the design (a 2000×1264 frame, so each half is a
  // 1000×1264 artboard). x/y = shape centre within its half and w = rendered
  // width, in artboard px; ar = asset height/width. r = collision radius (× w);
  // ex/ey = half-extent the wall stops at (× w / × h).
  //
  // Temperament:
  //   mass   – collision weight + how hard a click flings it
  //   pull   – spring stiffness toward the cursor (1/s²); higher = snappier
  //   zeta   – damping ratio; low = overshoots and bounces around the cursor
  //   lag    – reaction delay (s) before it notices where the cursor went
  //   sag    – artboard px it hangs below the cursor (negative = floats above)
  //   squish – how much it stretches with speed / squashes on impact
  //   lean   – how far it tilts into its direction of travel
  //   float  – idle drift (artboard px)
  //   jelly  – wobble stiffness after an impact; jzeta = how long it wobbles
  var SHAPES = {
    // Heavy and mellow: slow to get going, hangs lowest.
    circle:   { x: 465, y: 645, w: 929, ar: 1,          r: 0.26, ex: 0.40, ey: 0.40,
                mass: 3,   pull: 7,  zeta: 0.8,  lag: 0.22, sag: 110, squish: 0.45, lean: 0.5, float: 8,  jelly: 70,  jzeta: 0.25 },
    // Hard and tippy: barely squashes, leans a lot.
    triangle: { x: 728, y: 950, w: 535, ar: 966 / 875,  r: 0.30, ex: 0.50, ey: 0.50,
                mass: 1.5, pull: 13, zeta: 0.5,  lag: 0.1,  sag: 40,  squish: 0.12, lean: 1.8, float: 10, jelly: 160, jzeta: 0.3 },
    // Rubber bands: springiest, overshoots and jiggles, floats up top.
    hoops:    { x: 700, y: 257, w: 737, ar: 889 / 1097, r: 0.24, ex: 0.40, ey: 0.38,
                mass: 0.7, pull: 26, zeta: 0.22, lag: 0.03, sag: -70, squish: 0.9,  lean: 1.0, float: 14, jelly: 120, jzeta: 0.12 },
    // Eager: first to arrive, a little twitchy.
    star:     { x: 267, y: 375, w: 530, ar: 916 / 858,  r: 0.32, ex: 0.50, ey: 0.50,
                mass: 1,   pull: 22, zeta: 0.42, lag: 0,    sag: -20, squish: 0.3,  lean: 1.4, float: 9,  jelly: 200, jzeta: 0.3 },
    // A floppy scribble: lazy, then jelly-wobbles when it lands.
    blotch:   { x: 736, y: 632, w: 527, ar: 950 / 851,  r: 0.32, ex: 0.50, ey: 0.50,
                mass: 1.2, pull: 6,  zeta: 0.32, lag: 0.3,  sag: 60,  squish: 1.2,  lean: 0.7, float: 16, jelly: 55,  jzeta: 0.1 },
    // Light and curious: quick, bobs just above the cursor, watching it.
    pill:     { x: 330, y: 961, w: 647, ar: 997 / 1241, r: 0.30, ex: 0.50, ey: 0.50,
                mass: 0.9, pull: 18, zeta: 0.55, lag: 0.06, sag: -50, squish: 0.55, lean: 0.9, float: 12, jelly: 140, jzeta: 0.2 }
  };
  var ART_W = 1000, ART_H = 1264;

  var K_HOME   = 9;      // spring back to rest (shared, so the collage reassembles together)
  var Z_HOME   = 0.6;
  var MAX_V    = 3000;   // px/s speed cap
  var BOUNCE   = 0.3;    // restitution off the wall and edges
  var K_ROT    = 70;     // tilt spring; low damping = a pendulum wobble
  var Z_ROT    = 0.28;
  var SCATTER  = 1500;   // click fling (px/s for a mass-1 shape right next to the cursor)

  var halves = Array.prototype.slice.call(root.querySelectorAll('.split__half'));
  var bodies = [];
  halves.forEach(function (half, side) {
    Array.prototype.forEach.call(half.querySelectorAll('.magnet__shape'), function (el) {
      var def = SHAPES[el.getAttribute('data-shape')];
      if (!def) return;
      var n = bodies.length;
      bodies.push({
        el: el, def: def, side: side,
        x: 0, y: 0, vx: 0, vy: 0,        // position (centre, in half px) + velocity
        lx: 0, ly: 0,                    // lagged target it's actually chasing
        hx: 0, hy: 0, w: 0, h: 0,        // rest spot + rendered size
        rot: 0, rv: 0,                   // tilt (deg) + its angular velocity
        st: 0, va: 0,                    // stretch along travel + travel angle (deg)
        j: 0, jv: 0, ja: 0,              // impact jelly: squash, its velocity, axis (deg)
        cx: false, cy: false,            // touching a wall/edge last frame (per axis)
        // Idle-float phases / rates, spread so nothing moves in step.
        p1: n * 1.7, p2: n * 2.3 + 1, p3: n * 0.9 + 2,
        w1: 0.55 + n * 0.07, w2: 0.43 + n * 0.05, w3: 0.9 + n * 0.11
      });
    });
  });
  if (!bodies.length) return;

  var portrait = null;
  var scale = 1;                                // artboard px → screen px
  var size = [{ w: 0, h: 0 }, { w: 0, h: 0 }];   // each half's box
  var pointer = null;   // { x, y } in client px while it should pull, else null
  var clock = 0;        // the scene's own time (s): slows with the pacer, so the idle float winds down too
  var look = null;      // where the pill's eyes look

  // The scroll position, kept up to date from the scroll event: reading
  // window.scrollY inside a frame, after another script has just moved
  // something, makes the browser recompute every style first.
  var pageY = window.scrollY;
  window.addEventListener('scroll', function () { pageY = window.scrollY; }, { passive: true });

  // Where the hero and each half sit on the PAGE (measured with the layout,
  // not every frame: the hero is the first thing on the page, so only a
  // resize moves them). rectOf() turns one back into a screen rect.
  var heroAt = null, halfAt = [];
  function pageBox(el) { var r = el.getBoundingClientRect(); return { left: r.left, top: r.top + window.scrollY, width: r.width, height: r.height }; }
  function rectOf(b) { var t = b.top - pageY; return { left: b.left, right: b.left + b.width, top: t, bottom: t + b.height, width: b.width, height: b.height }; }

  function layout() {
    var wasPortrait = portrait;
    portrait = PORTRAIT.matches;   // same query as the CSS: halves stack top | bottom
    var old = [size[0], size[1]];
    size = halves.map(function (h) { return { w: h.clientWidth, h: h.clientHeight }; });
    heroAt = pageBox(hero); halfAt = halves.map(pageBox);
    // Positions stretch with the half; sizes scale uniformly by the geometric
    // mean of the two axes, so shapes don't shrink to nothing on wide screens.
    scale = Math.sqrt((size[0].w / ART_W) * (size[0].h / ART_H));
    bodies.forEach(function (b) {
      var d = b.def, box = size[b.side];
      b.w = d.w * scale;
      b.h = b.w * d.ar;
      b.el.style.width = b.w.toFixed(1) + 'px';
      b.hx = d.x / ART_W * box.w;
      b.hy = d.y / ART_H * box.h;
      if (wasPortrait === null || wasPortrait !== portrait || !old[b.side].w) {
        b.x = b.lx = b.hx; b.y = b.ly = b.hy; b.vx = b.vy = 0;   // first run / flipped: snap to rest
      } else {
        var fx = box.w / old[b.side].w, fy = box.h / old[b.side].h;   // keep relative spot
        b.x *= fx; b.lx *= fx; b.y *= fy; b.ly *= fy;
      }
      clamp(b);
    });
    render(clock);
  }

  // Kick a body's impact jelly: squash along axis `deg` (0 = flattened sideways).
  function splat(b, speed, deg) {
    b.jv -= Math.min(2.2, speed * b.def.squish * 0.0009);
    b.ja = deg;
  }

  // Keep a body inside its half. The divider side stops the shape's edge (so it
  // presses flat against the wall); the outer edges only stop its centre.
  function clamp(b) {
    var box = size[b.side];
    var exX = b.def.ex * b.w, exY = b.def.ey * b.h;
    var minX = 0, maxX = box.w, minY = 0, maxY = box.h;
    if (!portrait) { if (b.side === 0) maxX -= exX; else minX += exX; }
    else           { if (b.side === 0) maxY -= exY; else minY += exY; }
    var hitX = 0, hitY = 0;
    if (b.x < minX) { b.x = minX; if (b.vx < 0) { hitX = -b.vx; b.vx *= -BOUNCE; } }
    if (b.x > maxX) { b.x = maxX; if (b.vx > 0) { hitX = b.vx; b.vx *= -BOUNCE; } }
    if (b.y < minY) { b.y = minY; if (b.vy < 0) { hitY = -b.vy; b.vy *= -BOUNCE; } }
    if (b.y > maxY) { b.y = maxY; if (b.vy > 0) { hitY = b.vy; b.vy *= -BOUNCE; } }
    // Thud: squash flat against what it hit, and knock it off-tilt a little —
    // only on first contact, so a shape held against the wall doesn't judder.
    if (hitX > 120 && !b.cx) { splat(b, hitX, 0);  b.rv += b.vy * 0.04 * b.def.lean; }
    if (hitY > 120 && !b.cy) { splat(b, hitY, 90); b.rv -= b.vx * 0.04 * b.def.lean; }
    b.cx = hitX > 0; b.cy = hitY > 0;
  }

  // Soft circle-vs-circle separation within one half, so pulled shapes bunch up
  // around the cursor rather than collapsing onto one point. Only applied while
  // pulling — the rest layout overlaps on purpose (it's the designed collage).
  function collide() {
    for (var i = 0; i < bodies.length; i++) {
      for (var k = i + 1; k < bodies.length; k++) {
        var a = bodies[i], c = bodies[k];
        if (a.side !== c.side) continue;
        var dx = c.x - a.x, dy = c.y - a.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var minD = a.def.r * a.w + c.def.r * c.w;
        if (dist >= minD) continue;
        if (dist < 0.01) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; dist = Math.sqrt(dx * dx + dy * dy); }
        var nx = dx / dist, ny = dy / dist;
        var wa = 1 / a.def.mass, wc = 1 / c.def.mass, wt = wa + wc;   // lighter gets shoved more
        var push = (minD - dist) / wt;
        a.x -= nx * push * wa; a.y -= ny * push * wa;
        c.x += nx * push * wc; c.y += ny * push * wc;
        var vn = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;   // closing speed
        if (vn < 0) {
          var imp = -vn * 1.2 / wt;
          a.vx -= nx * imp * wa; a.vy -= ny * imp * wa;
          c.vx += nx * imp * wc; c.vy += ny * imp * wc;
          if (vn < -150) {
            var deg = Math.atan2(ny, nx) * 180 / Math.PI;
            splat(a, -vn * 0.6, deg); splat(c, -vn * 0.6, deg);
          }
        }
      }
    }
  }

  // Squash/stretch along an axis, volume-preserving.
  function along(deg, s) {
    if (Math.abs(s) < 0.002) return '';
    var k = 1 + s;
    return ' rotate(' + deg.toFixed(1) + 'deg) scale(' + k.toFixed(3) + ',' + (1 / k).toFixed(3) +
      ') rotate(' + (-deg).toFixed(1) + 'deg)';
  }

  function render(t) {
    // The pill's pupils look at the cursor (Flofu's clamp-in-socket logic).
    // Done before this frame's moves so reading the pill's spot doesn't force
    // a fresh style pass (it's a frame behind, which can't be seen).
    if (window.__ffPlaceEyes) window.__ffPlaceEyes(root, look ? look.x : null, look ? look.y : null);
    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i], d = b.def;
      // Idle float + a slow breath, layered on top of the physics.
      var amp = reduce ? 0 : d.float * scale;
      var fx = amp * Math.sin(t * b.w1 + b.p1);
      var fy = amp * Math.cos(t * b.w2 + b.p2);
      var fr = reduce ? 0 : 1.6 * Math.sin(t * b.w3 + b.p3);
      var breathe = reduce ? 1 : 1 + 0.012 * Math.sin(t * b.w3 * 1.3 + b.p1);
      b.el.style.transform = 'translate3d(' + (b.x + fx - b.w / 2).toFixed(1) + 'px,' +
        (b.y + fy - b.h / 2).toFixed(1) + 'px,0)' +
        along(b.va, b.st) + along(b.ja, b.j) +
        ' rotate(' + (b.rot + fr).toFixed(2) + 'deg) scale(' + breathe.toFixed(4) + ')';
    }
  }

  // --- Pointer -----------------------------------------------------------
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch' && !e.isPrimary) return;
    if (e.pointerType !== 'mouse' && e.buttons === 0) return;   // touch/pen: only while pressed
    pointer = look = { x: e.clientX, y: e.clientY };
    if (reduce) render(0);
  }, { passive: true });
  window.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse') { pointer = look = { x: e.clientX, y: e.clientY }; return; }
    if (!reduce && active() && e.button === 0 && !e.target.closest('a, button, .theme-switch')) scatter(e.clientX, e.clientY);
  }, { passive: true });
  function release() { pointer = look = null; if (reduce) render(0); }
  window.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') release(); });
  window.addEventListener('pointercancel', release);
  document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) release(); });
  window.addEventListener('blur', release);
  window.addEventListener('resize', layout, { passive: true });
  // Phones: tilting the device pulls the shapes (js/hero-tilt.js). Level = rest.
  window.addEventListener('ff-tilt', function (e) {
    pointer = look = e.detail ? { x: e.detail.x, y: e.detail.y } : null;
  });

  if (reduce) {
    layout();
    root.classList.add('is-in');
    return;
  }

  // Click: everything on screen pops away from the cursor, then gets reeled
  // back in (the pull is eased off for a beat so they actually fly).
  var scatterUntil = 0;
  function scatter(cx, cy) {
    var hr = hero.getBoundingClientRect();
    if (cy < hr.top || cy > hr.bottom) return;
    var rects = halves.map(function (h) { return h.getBoundingClientRect(); });
    bodies.forEach(function (b) {
      var dx = b.x - (cx - rects[b.side].left), dy = b.y - (cy - rects[b.side].top);
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      var f = SCATTER / b.def.mass / (1 + dist / (400 * scale));
      b.vx += dx / dist * f; b.vy += dy / dist * f;
      b.rv += (Math.random() - 0.5) * 600 / b.def.mass;
      splat(b, f, Math.atan2(dy, dx) * 180 / Math.PI + 90);   // stretch outward as it flies
    });
    scatterUntil = performance.now() + 380;
    blink();
  }

  // The pill blinks now and then (and when startled by a click).
  var blinker = root.querySelector('[data-shape="pill"]');
  function blink() {
    if (!blinker) return;
    blinker.classList.remove('is-blinking');
    void blinker.offsetWidth;   // reflow so the blink replays
    blinker.classList.add('is-blinking');
  }
  if (blinker) {
    blinker.addEventListener('animationend', function () { blinker.classList.remove('is-blinking'); });
    (function nextBlink() {
      window.setTimeout(function () { if (running) blink(); nextBlink(); }, 2400 + Math.random() * 3800);
    })();
  }

  // --- Simulation loop -----------------------------------------------------
  // The shapes are always gently alive, so the loop runs whenever this scene
  // is showing, the hero is on screen and the tab is visible, and pauses
  // otherwise (incl. the gov view, which display:none's the hero — the
  // observer reports that as off-screen).
  var running = false, onScreen = true, last = 0;
  // Phones: winds down to a stop once the page scrolls (js/hero-rest.js).
  var pacer = window.__ffHeroPacer ? window.__ffHeroPacer() : { pace: 1, awake: function () { return true; }, tick: function (dt) { return dt; } };
  function active() { return root.classList.contains('is-active'); }
  function sync() {
    var want = onScreen && !document.hidden && active() && pacer.awake();
    if (want && !running) {
      running = true;
      if (size[0].w !== halves[0].clientWidth) layout();   // e.g. just switched back from the gov view
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
  window.addEventListener('ff-hero-rest', sync);
  // Scene rotation toggles .is-active. On the way back in, the shapes start
  // scattered and drift home, and the entrance pop replays.
  var wasActive = active();
  new MutationObserver(function () {
    var on = active();
    if (on && !wasActive) {
      bodies.forEach(function (b) {
        b.vx = (Math.random() - 0.5) * 900 / b.def.mass;
        b.vy = (Math.random() - 0.5) * 900 / b.def.mass;
        b.rv = (Math.random() - 0.5) * 300;
      });
      root.classList.remove('is-in');
      void root.offsetWidth;
      root.classList.add('is-in');
    }
    wasActive = on;
    sync();
  }).observe(root, { attributes: true, attributeFilter: ['class'] });

  function step(now) {
    if (!running) return;
    var dt = pacer.tick(Math.min((now - last) / 1000, 1 / 30));
    last = now;
    clock += dt;
    var hr = rectOf(heroAt);
    var pull = pointer && pointer.y >= hr.top && pointer.y <= hr.bottom &&
      pointer.x >= hr.left && pointer.x <= hr.right;
    var rects = pull ? halfAt.map(rectOf) : null;
    var stunned = now < scatterUntil ? 0.12 : 1;

    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i], d = b.def, tx, ty, k, z;
      if (pull) {
        tx = pointer.x - rects[b.side].left;
        ty = pointer.y - rects[b.side].top + d.sag * scale;
        k = d.pull * stunned; z = d.zeta;
      } else {
        tx = b.hx; ty = b.hy; k = K_HOME * stunned; z = Z_HOME;
      }
      // Chase a lagged copy of the target, so each shape reacts in its own time.
      var a = d.lag > 0 ? 1 - Math.exp(-dt / d.lag) : 1;
      b.lx += (tx - b.lx) * a;
      b.ly += (ty - b.ly) * a;

      var c = 2 * Math.sqrt(k) * z;
      b.vx += ((b.lx - b.x) * k - b.vx * c) * dt;
      b.vy += ((b.ly - b.y) * k - b.vy * c) * dt;
      var sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if (sp > MAX_V) { b.vx *= MAX_V / sp; b.vy *= MAX_V / sp; sp = MAX_V; }
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Stretch along the direction of travel (eased so it doesn't flicker).
      if (sp > 40) b.va = Math.atan2(b.vy, b.vx) * 180 / Math.PI;
      var st = Math.min(0.22, sp * d.squish * 0.00009);
      b.st += (st - b.st) * Math.min(1, dt * 12);
    }
    if (pull) { collide(); collide(); }
    for (i = 0; i < bodies.length; i++) {
      b = bodies[i]; d = b.def;
      clamp(b);
      // Tilt into the direction of travel on a loose spring, so it swings and settles.
      var lean = Math.max(-18, Math.min(18, b.vx * 0.006 * d.lean));
      b.rv += ((lean - b.rot) * K_ROT - b.rv * 2 * Math.sqrt(K_ROT) * Z_ROT) * dt;
      b.rot += b.rv * dt;
      // Impact jelly: a squash that wobbles back out.
      b.jv += (-b.j * d.jelly - b.jv * 2 * Math.sqrt(d.jelly) * d.jzeta) * dt;
      b.j = Math.max(-0.3, Math.min(0.3, b.j + b.jv * dt));
    }
    render(clock);
    if (!pacer.awake()) { running = false; return; }   // wound down: sleep until the page is back at the top
    requestAnimationFrame(step);
  }

  layout();
  // Entrance: shapes pop in, staggered (the scale/fade lives on the inner art).
  bodies.forEach(function (b, i) {
    var art = b.el.firstElementChild;
    if (art) art.style.transitionDelay = (120 + i * 70) + 'ms';
  });
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { root.classList.add('is-in'); });
  });
  sync();
})();
