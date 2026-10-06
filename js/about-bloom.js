/*
 * About page, "We work to drive…": a succulent that blooms.
 *
 * Seen from above, the plant opens from its centre outward as the section
 * scrolls into view: the core swells first, then the inner rosette, then the
 * petals, then the long leaves unfurl last. The two hand-drawn brush outlines
 * open just after the vector shapes they trace, a beat out of step with them
 * (and the petals' outline twists the other way), so the drawn line and the
 * flat shape read as two layers rather than one. Each petal is staggered around the
 * circle, so it opens in a slow spiral rather than all at once. It's tied to
 * scroll progress (scroll back up and it gently closes again) and eased, so it
 * never snaps.
 *
 * Once open it keeps growing very quietly: a slow breath and a lazy turn.
 * Moving the cursor across it (or tilting a phone, js/hero-tilt.js) makes the
 * nearest petals lean toward you and lift slightly, like the plant turning
 * toward light. Each ring answers at its own pace: the leaves are slow and
 * heavy, the inner petals quick.
 *
 * Only runs while the section is on screen. Reduced motion: shown fully open.
 */
(function () {
  var section = document.querySelector('.about-drive');
  var svg = section && section.querySelector('.succ');
  if (!svg) return;
  var CX = 2591.5, CY = 2591;   // the plant's centre in the SVG's user units

  // Per ring: when it opens (fraction of the bloom), how closed it starts
  // (scale + twist), how far it leans toward the cursor, and how fast it follows.
  var RINGS = {
    core:     { at: 0.00, len: 0.35, s0: 0.30, twist: 0,   lean: 0.010, follow: 0.35, lift: 0.04 },
    scribble: { at: 0.10, len: 0.40, s0: 0.20, twist: -40, lean: 0.012, follow: 0.45, lift: 0.03 },
    rosette:  { at: 0.12, len: 0.42, s0: 0.35, twist: 30,  lean: 0.030, follow: 0.55, lift: 0.06 },
    outline:  { at: 0.36, len: 0.45, s0: 0.30, twist: 30,  lean: 0.032, follow: 0.90, lift: 0.07 },
    petal:    { at: 0.28, len: 0.45, s0: 0.25, twist: -35, lean: 0.035, follow: 0.80, lift: 0.07 },
    leaf:     { at: 0.45, len: 0.55, s0: 0.15, twist: 25,  lean: 0.020, follow: 1.40, lift: 0.05 }
  };
  var SPIRAL = 0.12;   // how much each petal's start is delayed around the circle
  var TURN   = 0.6;    // deg/s: the plant's lazy resting turn

  var parts = Array.prototype.map.call(svg.querySelectorAll('.succ__part'), function (g) {
    var ring = RINGS[g.getAttribute('data-ring')] || RINGS.petal;
    var ang = parseFloat(g.getAttribute('data-angle')) || 0;
    // Spiral order: start from the top and go clockwise.
    var turn = (((ang + 90) % 360) + 360) % 360 / 360;
    return { g: g, ring: ring, ang: ang * Math.PI / 180, delay: turn * SPIRAL, lean: 0, lift: 0 };
  });

  function smooth(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function paint(bloom, now, aim, dt) {
    var spin = reduce ? 0 : (now * TURN) % 360;
    var breathe = reduce ? 1 : 1 + 0.012 * Math.sin(now * 0.7);
    svg.style.transform = 'rotate(' + spin.toFixed(2) + 'deg) scale(' + breathe.toFixed(4) + ')';
    parts.forEach(function (p) {
      var r = p.ring;
      var open = smooth((bloom - r.at - p.delay * (r.at > 0 ? 1 : 0)) / r.len);
      var sc = r.s0 + (1 - r.s0) * open;
      var tw = r.twist * (1 - open);
      // Lean: how much this petal faces the cursor's direction (1 = right at it).
      var face = aim ? Math.max(0, Math.cos(p.ang - aim.a)) * aim.m : 0;
      var goal = face * r.lean;
      // Each ring follows at its own pace (leaves slow, inner petals quick).
      var k = Math.min(1, dt / r.follow);
      p.lean += (goal - p.lean) * k;
      p.lift += (face * r.lift - p.lift) * k;
      var dx = Math.cos(p.ang) * p.lean * 5182, dy = Math.sin(p.ang) * p.lean * 5182;
      var tf = 'translate(' + (CX + dx).toFixed(1) + ' ' + (CY + dy).toFixed(1) + ') rotate(' + tw.toFixed(2) + ') scale(' +
        (sc * (1 + p.lift)).toFixed(4) + ') translate(' + (-CX) + ' ' + (-CY) + ')';
      var op = Math.min(1, open * 1.6).toFixed(3);
      // Only touch the DOM when a petal actually changed (once open and still,
      // that's none of them, so the frame costs almost nothing).
      if (tf !== p.tf) { p.g.setAttribute('transform', tf); p.tf = tf; }
      if (op !== p.op) { p.g.style.opacity = op; p.op = op; }
    });
  }

  if (reduce) { paint(1.5, 0, null, 1); return; }

  var mouse = null, tilt = null;
  document.addEventListener('mousemove', function (e) { mouse = { x: e.clientX, y: e.clientY }; }, { passive: true });
  document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) mouse = null; });
  window.addEventListener('ff-tilt-n', function (e) {
    var d = e.detail;
    tilt = d && (d.nx || d.ny) ? d : null;
  });

  var bloom = 0, on = false, running = false, last = 0;
  function loop(nowMs) {
    if (!on || document.hidden) { running = false; return; }
    var dt = Math.min((nowMs - last) / 1000, 1 / 20);
    last = nowMs;
    var r = section.getBoundingClientRect(), vh = window.innerHeight;
    // 0 as the section's top enters the bottom of the screen → 1 once it fills
    // most of the view (with headroom so every ring has finished opening).
    var goal = Math.max(0, Math.min(1.3, (vh - r.top) / (vh * 0.95)));
    bloom += (goal - bloom) * Math.min(1, dt / 0.9);   // calm, never snappy

    // Where the cursor/tilt is, as an angle around the plant's centre.
    var aim = null, sr = svg.getBoundingClientRect();
    if (tilt) {
      aim = { a: Math.atan2(tilt.ny, tilt.nx), m: Math.min(1, Math.sqrt(tilt.nx * tilt.nx + tilt.ny * tilt.ny)) };
    } else if (mouse && mouse.y >= r.top && mouse.y <= r.bottom) {
      var vx = mouse.x - (sr.left + sr.width / 2), vy = mouse.y - (sr.top + sr.height / 2);
      // The SVG is turning, so measure the angle in its own (rotated) frame.
      var spin = ((nowMs / 1000) * TURN) * Math.PI / 180;
      aim = { a: Math.atan2(vy, vx) - spin, m: Math.min(1, Math.sqrt(vx * vx + vy * vy) / (sr.width * 0.35)) };
    }
    paint(bloom, nowMs / 1000, aim, dt);
    requestAnimationFrame(loop);
  }
  function kick() {
    if (running || !on || document.hidden) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }
  paint(0, 0, null, 1);   // start closed
  new IntersectionObserver(function (es) { on = es[0].isIntersecting; kick(); }, { rootMargin: '120px 0px' }).observe(section);
  document.addEventListener('visibilitychange', kick);
})();
