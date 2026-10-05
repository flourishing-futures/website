/*
 * Home hero — Interaction 2: "reflective ripples" (prototype).
 *
 * The cloud character is split down the divider: a flat red shape (human) and
 * a hand-drawn brush version (machine). Around each, "thought wave" rings sit
 * like concentric ripples. It's meant to feel meditative rather than reactive:
 *
 *   - Cursor x is a balance point. Lean left and the human side's rings spread
 *     outward while the machine side's draw in close; lean right, the reverse.
 *     Dead centre = both sides still and close. Everything eases slowly.
 *   - The rings breathe on a slow ~7s cycle, a swell that travels outward
 *     ring by ring. With no cursor the balance drifts gently on its own.
 *   - Moving the cursor sends a soft ripple out through the side it's on; a
 *     click drops a "stone" and rings ripple out on both sides.
 *   - The two cloud halves parallax separately, on different delays, so they
 *     feel like the same character at two different moments.
 *
 * Design: References/Hero_Interaction_2.jpg · assets: References/Interaction_2 Assets
 * (each thought-wave file was split into one img/hero-reflect-wave-*.svg per ring).
 * Reduced motion: everything sits at its designed rest pose.
 */
(function () {
  var root = document.getElementById('heroReflect');
  if (!root) return;
  var hero = document.getElementById('hero');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Each half is laid out on a 1000×1264 artboard (half of the 2000×1264 design
  // frame), scaled to cover its half and anchored to the divider (CSS). Rings:
  // x/y/w = box in artboard units, ar = h/w, ux/uy = unit vector pointing away
  // from the cloud's centre (the direction it ripples), k = order outward.
  var ART_W = 1000, ART_H = 1264;
  var RINGS = {
    l: [
      { src: 'l0', x: 177.8, y: 16.8,   w: 763.8, ar: 1.5948, ux: -0.991, uy:  0.134, k: 0 },
      { src: 'l1', x: 353.6, y: 34.8,   w: 400.9, ar: 0.7783, ux: -0.747, uy: -0.665, k: 1 },
      { src: 'l2', x: 77.7,  y: 385.3,  w: 390.3, ar: 2.0557, ux: -0.952, uy:  0.305, k: 2 },
      { src: 'l5', x: 65.3,  y: 7.5,    w: 532.6, ar: 0.9475, ux: -0.894, uy: -0.448, k: 3 },
      { src: 'l3', x: 68.4,  y: 934.1,  w: 303.9, ar: 0.9243, ux: -0.885, uy:  0.465, k: 4 },
      { src: 'l6', x: 60.9,  y: 22.4,   w: 308.9, ar: 0.8753, ux: -0.864, uy: -0.503, k: 5 },
      { src: 'l4', x: 38.5,  y: 1024.2, w: 211.9, ar: 1.0821, ux: -0.847, uy:  0.531, k: 6 },
      { src: 'l7', x: 24.9,  y: 40.4,   w: 98.2,  ar: 1.2785, ux: -0.873, uy: -0.487, k: 7 }
    ],
    r: [
      { src: 'r0', x: 321.9, y: 23.0,   w: 647.0, ar: 0.7493, ux: 0.904, uy: -0.427, k: 0 },
      { src: 'r1', x: 513.4, y: 604.1,  w: 466.1, ar: 1.3653, ux: 0.896, uy:  0.444, k: 1 },
      { src: 'r5', x: 519.0, y: 25.5,   w: 441.9, ar: 0.7693, ux: 0.885, uy: -0.465, k: 2 },
      { src: 'r2', x: 730.9, y: 868.2,  w: 223.7, ar: 1.6222, ux: 0.910, uy:  0.415, k: 3 },
      { src: 'r6', x: 687.4, y: 34.8,   w: 286.5, ar: 0.9241, ux: 0.886, uy: -0.464, k: 4 },
      { src: 'r3', x: 863.3, y: 985.1,  w: 101.9, ar: 2.2683, ux: 0.882, uy:  0.470, k: 5 },
      { src: 'r7', x: 873.2, y: 23.0,   w: 97.6,  ar: 1.3503, ux: 0.854, uy: -0.520, k: 6 },
      { src: 'r4', x: 930.4, y: 1124.9, w: 54.1,  ar: 1.9540, ux: 0.873, uy:  0.487, k: 7 }
    ]
  };
  // Cloud halves (the cloud SVG is widened past its flat edge so it can drift
  // without opening a gap at the divider; the overflow is clipped).
  var PIECES = {
    cloud: { x: 267.9, y: 64.6, w: 783.1, ar: 1831 / 1260 },
    drawn: { x: 13.7,  y: 51.0, w: 912.4, ar: 1858 / 1468 },
    eye:   { x: 13.7,  y: 51.0, w: 912.4, ar: 1858 / 1468 }
  };

  // Feel (artboard units / seconds).
  var REST     = 0.12;   // resting spread each side, so the rings are never fully still
  var SPREAD   = 16;     // outward travel per unit spread, per ring step outward (+ base)
  var BREATH_T = 7;      // seconds per breath
  var BREATH_A = 7;      // breath swell (artboard units, outer rings)
  var EASE_S   = 1.1;    // seconds for the spread to catch up with the cursor (slow = calm)
  var PULSE_V  = 4.2;    // ring steps per second a ripple travels outward
  var PULSE_A  = 26;     // ripple push (artboard units)

  // --- Build ---------------------------------------------------------------
  function place(el, d) {
    el.style.left = (d.x / ART_W * 100) + '%';
    el.style.top = (d.y / ART_H * 100) + '%';
    el.style.width = (d.w / ART_W * 100) + '%';
  }
  var rings = [];
  Array.prototype.forEach.call(root.querySelectorAll('.reflect__waves'), function (host) {
    var side = host.getAttribute('data-side');
    (RINGS[side] || []).forEach(function (d) {
      var el = document.createElement('img');
      el.className = 'reflect__ring';
      el.src = 'img/hero-reflect-wave-' + d.src + '.svg';
      el.alt = '';
      el.decoding = 'async';
      place(el, d);
      host.appendChild(el);
      rings.push({ el: el, d: d, side: side, f: d.k / 7 });   // f: 0 inner → 1 outer
    });
  });
  var pieces = {};
  Array.prototype.forEach.call(root.querySelectorAll('.reflect__piece'), function (el) {
    var name = el.getAttribute('data-piece');
    if (!PIECES[name]) return;
    place(el, PIECES[name]);
    pieces[name] = { el: el, x: 0, y: 0 };
  });

  if (reduce) return;

  // --- State -----------------------------------------------------------------
  var spread = { l: REST, r: REST };   // eased
  var pulses = [];                     // { side, t0, a }
  var target = null;                   // { nx: -1..1, ny: -1..1 } or null (idle)
  var lastPulse = { l: 0, r: 0 }, travel = { l: 0, r: 0 }, lastX = null;
  var unit = 1;                        // screen px per artboard unit

  function active() { return root.classList.contains('is-active'); }
  function measure() {
    var art = root.querySelector('.reflect__art');
    unit = art ? art.clientWidth / ART_W : 1;
  }

  function pulse(side, a) {
    pulses.push({ side: side, t0: performance.now() / 1000, a: a });
    if (pulses.length > 12) pulses.shift();
  }

  window.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' && e.buttons === 0) return;
    var hr = hero.getBoundingClientRect();
    if (e.clientY < hr.top || e.clientY > hr.bottom) { target = null; lastX = null; return; }
    var nx = (e.clientX - hr.left) / hr.width * 2 - 1;
    target = { nx: nx, ny: (e.clientY - hr.top) / hr.height * 2 - 1 };
    // Movement sends a soft ripple out through whichever side the cursor is on.
    if (lastX !== null && active()) {
      var side = nx < 0 ? 'l' : 'r', now = performance.now() / 1000;
      travel[side] += Math.abs(e.clientX - lastX) + Math.abs(e.movementY || 0);
      if (travel[side] > 220 && now - lastPulse[side] > 0.9) {
        pulse(side, 0.55);
        lastPulse[side] = now; travel[side] = 0;
      }
    }
    lastX = e.clientX;
  }, { passive: true });
  function idle() { target = null; lastX = null; }
  document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) idle(); });
  window.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') idle(); });
  window.addEventListener('blur', idle);
  // Phones: tilt left/right is the balance point (js/hero-tilt.js); sweeping
  // the tilt sends a soft ripple through that side. Level = gentle idle drift.
  var tiltX = null;
  window.addEventListener('ff-tilt', function (e) {
    var d = e.detail;
    if (!d) { idle(); tiltX = null; return; }
    var hr = hero.getBoundingClientRect();
    var nx = (d.x - hr.left) / hr.width * 2 - 1;
    target = { nx: nx, ny: (d.y - hr.top) / hr.height * 2 - 1 };
    if (tiltX !== null && active()) {
      var side = nx < 0 ? 'l' : 'r', now = performance.now() / 1000;
      travel[side] += Math.abs(d.x - tiltX);
      if (travel[side] > 160 && now - lastPulse[side] > 1.2) {
        pulse(side, 0.5);
        lastPulse[side] = now; travel[side] = 0;
      }
    }
    tiltX = d.x;
  });
  window.addEventListener('pointerdown', function (e) {
    if (!active() || e.button !== 0 || e.target.closest('a, button, .theme-switch')) return;
    var hr = hero.getBoundingClientRect();
    if (e.clientY < hr.top || e.clientY > hr.bottom) return;
    // A stone in the pond: ripples on both sides, stronger on the side clicked.
    var left = e.clientX < hr.left + hr.width / 2;
    pulse('l', left ? 1 : 0.6);
    pulse('r', left ? 0.6 : 1);
  }, { passive: true });
  window.addEventListener('resize', measure, { passive: true });

  // --- Loop (only while this scene is showing and on screen) ---------------
  var running = false, onScreen = true, last = 0;
  function sync() {
    var want = onScreen && !document.hidden && active();
    if (want && !running) {
      running = true;
      measure();
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
  // Scene rotation toggles .is-active. Arriving: the rings start drawn in tight
  // around the cloud and breathe out, with a first ripple to set it going.
  var wasActive = active();
  new MutationObserver(function () {
    var on = active();
    if (on && !wasActive) {
      spread.l = spread.r = -0.45;   // drawn in close (outer rings tuck in most)
      pulse('l', 0.8); pulse('r', 0.8);
    }
    wasActive = on;
    sync();
  }).observe(root, { attributes: true, attributeFilter: ['class'] });

  function step(nowMs) {
    if (!running) return;
    var now = nowMs / 1000;
    var dt = Math.min((nowMs - last) / 1000, 1 / 30);
    last = nowMs;

    // Balance point: the cursor, or a slow drift of its own when idle.
    var nx, ny;
    if (target) { nx = target.nx; ny = target.ny; }
    else { nx = 0.55 * Math.sin(now * 0.33); ny = 0.25 * Math.sin(now * 0.21 + 1); }
    var lean = Math.max(-1, Math.min(1, nx * 1.25));
    var goal = {
      l: REST + Math.max(0, -lean) - 0.35 * Math.max(0, lean),
      r: REST + Math.max(0, lean) - 0.35 * Math.max(0, -lean)
    };
    var e = 1 - Math.exp(-dt / EASE_S);
    spread.l += (goal.l - spread.l) * e;
    spread.r += (goal.r - spread.r) * e;

    // Drop finished ripples.
    while (pulses.length && now - pulses[0].t0 > 4) pulses.shift();

    var breathPhase = now / BREATH_T * Math.PI * 2;
    for (var i = 0; i < rings.length; i++) {
      var r = rings[i], d = r.d, s = spread[r.side];
      // How far out along its own direction: spread (outer rings travel further,
      // so the gaps between them open up), plus the outward-travelling breath.
      var out = s * SPREAD * (1.5 + d.k * 1.6);
      out += BREATH_A * (0.4 + r.f) * Math.sin(breathPhase - d.k * 0.55);
      // Ripples: a soft bump that passes each ring in turn.
      for (var p = 0; p < pulses.length; p++) {
        var pu = pulses[p];
        if (pu.side !== r.side) continue;
        var front = (now - pu.t0) * PULSE_V - d.k;
        if (front < -1.5 || front > 3) continue;
        out += PULSE_A * pu.a * Math.exp(-front * front * 1.4) * (1 - (now - pu.t0) / 4);
      }
      var tx = d.ux * out * unit, ty = d.uy * out * unit;
      var sc = 1 + Math.max(-0.06, s) * 0.025 * (1 + d.k * 0.5);
      // Outer rings fade a touch as they spread, like ripples losing energy.
      var op = Math.max(0.35, Math.min(1, 1 - Math.max(0, s - REST) * r.f * 0.55));
      var tilt = 0.8 * Math.sin(now * 0.4 + d.k * 0.9) * (r.side === 'l' ? 1 : -1);
      r.el.style.transform = 'translate3d(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px,0) rotate(' +
        tilt.toFixed(2) + 'deg) scale(' + sc.toFixed(4) + ')';
      r.el.style.opacity = op.toFixed(3);
    }

    // The two cloud halves: same character, different moments. The flat half
    // follows the cursor quickly; the drawn half drifts after it, later and
    // the other way, and its eye floats a little further. Both breathe, out of step.
    movePiece(pieces.cloud, nx * 10, ny * 12, 0.35, dt);
    movePiece(pieces.drawn, -nx * 14, ny * 16, 1.4, dt);
    movePiece(pieces.eye, -nx * 24, ny * 24, 1.0, dt);
    var b1 = 1 + 0.012 * Math.sin(breathPhase), b2 = 1 + 0.012 * Math.sin(breathPhase + Math.PI * 0.8);
    paintPiece(pieces.cloud, b1);
    paintPiece(pieces.drawn, b2);
    paintPiece(pieces.eye, b2);

    requestAnimationFrame(step);
  }

  function movePiece(p, gx, gy, lag, dt) {
    if (!p) return;
    var e = 1 - Math.exp(-dt / lag);
    p.x += (gx - p.x) * e;
    p.y += (gy - p.y) * e;
  }
  function paintPiece(p, sc) {
    if (!p) return;
    p.el.style.transform = 'translate3d(' + (p.x * unit).toFixed(1) + 'px,' + (p.y * unit).toFixed(1) +
      'px,0) scale(' + sc.toFixed(4) + ')';
  }

  sync();
})();
