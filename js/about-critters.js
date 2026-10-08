/*
 * About page, "We work to develop…": three blob critters behind the outcomes
 * box (green top-left, blue right, orange bottom-left), with the hand-drawn
 * green squiggle painted over them.
 *
 *   - Each critter floats on its own slow bob, out of step with the others.
 *   - They're curious: each one drifts a little toward the cursor (or with an
 *     Android phone's tilt) on a soft spring, so they wobble and settle
 *     rather than slide. The closer the cursor, the more that critter leans in.
 *   - Their eyes look at the cursor, and they blink now and then.
 *   - Move fast past one and it gets a little startled: a quick squash-hop.
 *   - The squiggle drifts the other way, very slightly, for depth.
 *
 * Only runs while the section is on screen. Reduced motion: still.
 */
(function () {
  var section = document.querySelector('.about-develop');
  if (!section) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var squiggle = section.querySelector('.about-develop__art');

  // Per critter: drift range (px), spring stiffness + damping, float period (s),
  // phase, and how far the eyes slide toward the cursor (px on screen).
  var FEEL = {
    green:  { reach: 26, k: 30, z: 0.32, period: 6.2, phase: 0.0, look: 9 },
    blue:   { reach: 22, k: 22, z: 0.28, period: 7.4, phase: 2.1, look: 8 },
    orange: { reach: 30, k: 36, z: 0.36, period: 5.6, phase: 4.0, look: 9 }
  };

  var critters = Array.prototype.map.call(section.querySelectorAll('.dev-critter'), function (el) {
    var name = (el.className.match(/dev-critter--(\w+)/) || [])[1];
    return {
      el: el, bob: el.querySelector('.dev-critter__bob'),
      eyes: el.querySelector('.dev-critter__eyes'),
      svg: el.querySelector('svg'),
      f: FEEL[name] || FEEL.green,
      x: 0, y: 0, vx: 0, vy: 0, sq: 0, sqv: 0, ex: 0, ey: 0
    };
  });
  if (!critters.length) return;

  var mouse = null, tilt = null, speed = 0, lastM = null;
  document.addEventListener('mousemove', function (e) {
    if (lastM) speed = Math.max(speed, Math.hypot(e.clientX - lastM.x, e.clientY - lastM.y));
    lastM = { x: e.clientX, y: e.clientY };
    mouse = lastM;
  }, { passive: true });
  document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) { mouse = null; lastM = null; } });
  window.addEventListener('ff-tilt-n', function (e) {
    var d = e.detail;
    tilt = d && (d.nx || d.ny) ? d : null;
  });

  // Blinks: one critter at a time, every few seconds.
  function blink() {
    var c = critters[Math.floor(Math.random() * critters.length)];
    if (c && c.eyes && on) {
      c.eyes.classList.remove('is-blinking');
      void c.eyes.getBoundingClientRect();
      c.eyes.classList.add('is-blinking');
    }
    window.setTimeout(blink, 2200 + Math.random() * 3200);
  }
  critters.forEach(function (c) {
    if (c.eyes) c.eyes.addEventListener('animationend', function () { c.eyes.classList.remove('is-blinking'); });
  });

  // The scroll position, kept up to date from the scroll event: reading
  // window.scrollY inside a frame, after another script has just moved
  // something, makes the browser recompute every style first.
  var pageY = window.scrollY;
  window.addEventListener('scroll', function () { pageY = window.scrollY; }, { passive: true });

  // Where the section and each critter's face sit on the page, measured up
  // front (and on resize) rather than every frame: reading layout right after
  // the transform writes forced a full style pass each frame. The faces are
  // measured on the un-animated wrapper; the bob's own drift is added back.
  var sec = { top: 0, left: 0, width: 1, height: 1 };
  function measure() {
    var r = section.getBoundingClientRect();
    sec = { top: r.top + window.scrollY, left: r.left, width: r.width, height: r.height };
    critters.forEach(function (c) {
      var e = c.el.getBoundingClientRect();
      c.home = { x: e.left, y: e.top + window.scrollY, w: e.width, h: c.bob.offsetHeight };
    });
  }
  measure();
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  // (The body, not the section: anything above growing moves the section down.)
  if (window.ResizeObserver) new ResizeObserver(measure).observe(document.body);

  var on = false, running = false, last = 0, sqX = 0, sqY = 0;
  function loop(nowMs) {
    if (!on || document.hidden) { running = false; return; }
    var now = nowMs / 1000;
    var dt = Math.min((nowMs - last) / 1000, 1 / 30);
    last = nowMs;
    var sy = pageY;
    var sr = { top: sec.top - sy, bottom: sec.top + sec.height - sy, left: sec.left, width: sec.width, height: sec.height };
    var inside = mouse && mouse.y >= sr.top && mouse.y <= sr.bottom;
    var flick = speed; speed *= 0.6;   // how fast the cursor just moved (px/frame)

    critters.forEach(function (c) {
      var f = c.f;
      var r = { left: c.home.x + c.x, top: c.home.y - sy + c.y, width: c.home.w, height: c.home.h };
      // Eyes are the critter's "face": aim from there.
      if (c.fx == null) { c.fx = parseFloat(c.el.style.getPropertyValue('--fx')); c.fy = parseFloat(c.el.style.getPropertyValue('--fy')); }
      var fx = r.left + r.width * c.fx;
      var fy = r.top + r.height * c.fy;
      var gx = 0, gy = 0, look = null;
      if (tilt) {
        gx = tilt.nx * f.reach; gy = tilt.ny * f.reach;
        look = { x: tilt.nx, y: tilt.ny };
      } else if (inside) {
        var vx = mouse.x - fx, vy = mouse.y - fy, d = Math.hypot(vx, vy) || 1;
        // Lean in more the closer you are (fades out by ~70% of the section width).
        var near = Math.max(0, 1 - d / (sr.width * 0.7));
        gx = vx / d * f.reach * (0.35 + near);
        gy = vy / d * f.reach * (0.35 + near);
        look = { x: vx / d * Math.min(1, d / 160), y: vy / d * Math.min(1, d / 160) };
        // Startle: a fast pass close by makes it hop.
        if (flick > 40 && d < r.width * 0.6 && c.sq > -0.02) c.sqv -= 0.9;
      }
      // Soft spring toward the goal (underdamped: a little wobble on arrival).
      var cz = 2 * Math.sqrt(f.k) * f.z;
      c.vx += ((gx - c.x) * f.k - c.vx * cz) * dt;
      c.vy += ((gy - c.y) * f.k - c.vy * cz) * dt;
      c.x += c.vx * dt; c.y += c.vy * dt;
      // Squash: driven by the hop, plus a little from vertical speed.
      c.sqv += (-c.sq * 140 - c.sqv * 8) * dt;
      c.sq += c.sqv * dt;
      var squash = Math.max(-0.12, Math.min(0.12, c.sq + c.vy * 0.0015));

      // Idle float on top: a slow bob and sway.
      var t = now * Math.PI * 2 / f.period + f.phase;
      var fy2 = Math.sin(t) * 9, fx2 = Math.cos(t * 0.7) * 5, rot = Math.sin(t * 0.8) * 2.2 + c.vx * 0.02;
      c.bob.style.transform = 'translate3d(' + (c.x + fx2).toFixed(1) + 'px,' + (c.y + fy2).toFixed(1) + 'px,0) rotate(' +
        rot.toFixed(2) + 'deg) scale(' + (1 - squash).toFixed(4) + ',' + (1 + squash).toFixed(4) + ')';

      // Eyes: slide toward the cursor, in the SVG's own units.
      if (c.eyes && c.svg) {
        var vb = c.svg.viewBox.baseVal, scale = vb.width / (r.width || 1);
        var tx = look ? look.x * f.look : 0, ty = look ? look.y * f.look : 0;
        c.ex += (tx - c.ex) * Math.min(1, dt * 8);
        c.ey += (ty - c.ey) * Math.min(1, dt * 8);
        // Half-pixel steps, and only when they moved: each write repaints the critter.
        var etf = 'translate(' + (Math.round(c.ex * 2) / 2 * scale).toFixed(1) + ' ' + (Math.round(c.ey * 2) / 2 * scale).toFixed(1) + ')';
        if (etf !== c.etf) { c.eyes.setAttribute('transform', etf); c.etf = etf; }
      }
    });

    // Squiggle: a slight counter-drift for depth.
    if (squiggle) {
      var gx2 = 0, gy2 = 0;
      if (tilt) { gx2 = -tilt.nx * 10; gy2 = -tilt.ny * 8; }
      else if (inside) {
        gx2 = -((mouse.x - (sr.left + sr.width / 2)) / (sr.width / 2)) * 10;
        gy2 = -((mouse.y - (sr.top + sr.height / 2)) / (sr.height / 2)) * 8;
      }
      sqX += (gx2 - sqX) * Math.min(1, dt / 0.5);
      sqY += (gy2 - sqY) * Math.min(1, dt / 0.5);
      squiggle.style.transform = 'scale(1.04) translate(' + sqX.toFixed(1) + 'px,' + sqY.toFixed(1) + 'px)';
    }
    requestAnimationFrame(loop);
  }
  function kick() {
    if (running || !on || document.hidden) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }
  new IntersectionObserver(function (es) { on = es[0].isIntersecting; kick(); }, { rootMargin: '80px 0px' }).observe(section);
  document.addEventListener('visibilitychange', kick);
  window.setTimeout(blink, 2500);
})();
