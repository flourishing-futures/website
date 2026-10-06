/*
 * About page hero — the sunrise.
 *
 * Same sun as the home page's Vision section (img/vision-sun-*.svg), but here
 * it rises rather than spins:
 *
 *   - On arrival the sun climbs up from below the fold into place over ~3s,
 *     easing out like a real sunrise. The rays start folded in tight and fan
 *     open as it climbs; the sky (the section's red) warms up behind it.
 *   - Scrolling down sets it again: the sun sinks as the section leaves, so
 *     coming back up is a second, smaller sunrise.
 *   - Once risen, it breathes very slightly and the rays turn very slowly
 *     (a lap every ~6 minutes), just enough that it never looks frozen.
 *   - The cursor (or device tilt on phones, via js/hero-tilt.js) lifts the
 *     sun a touch toward it, as if you're coaxing it up.
 *
 * The loop only runs while the section is on screen. Reduced motion: the sun
 * just sits in its risen pose.
 */
(function () {
  var section = document.querySelector('.about-hero');
  var sun = section && section.querySelector('.about-hero__sun');
  if (!sun) return;
  var rays = sun.querySelector('.about-hero__sun-rays');
  var spiral = sun.querySelector('.about-hero__sun-spiral');

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    section.classList.add('is-risen');
    return;
  }

  var RISE_S  = 3.2;    // seconds for the opening sunrise
  var DROP    = 0.55;   // how far below its risen spot it starts (× sun size)
  var SET     = 0.35;   // how far it sinks by the time the section scrolls away
  var LIFT    = 0.03;   // how far the cursor / tilt can coax it up or down (× sun size)
  var SWAY    = 0.02;   // and sideways
  var DRIFT   = 1;      // deg/s: the rays' slow resting turn

  var t0 = null, angle = 0, ox = 0, oy = 0, scrollSet = 0;
  var mouse = null, tilt = null;
  document.addEventListener('mousemove', function (e) { mouse = { x: e.clientX, y: e.clientY }; }, { passive: true });
  document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) mouse = null; });
  window.addEventListener('ff-tilt-n', function (e) {
    var d = e.detail;
    tilt = d && (d.nx || d.ny) ? d : null;
  });

  // Ease-out with a soft landing (no overshoot: suns don't bounce).
  function easeOut(t) { return 1 - Math.pow(1 - t, 3.4); }

  var on = false, running = false, last = 0;
  function loop(nowMs) {
    if (!on || document.hidden) { running = false; return; }
    var now = nowMs / 1000;
    var dt = Math.min((nowMs - last) / 1000, 1 / 20);
    last = nowMs;
    if (t0 === null) t0 = now + 0.35;   // a beat for the arrival curtain to clear

    var size = sun.offsetWidth;
    var rise = easeOut(Math.max(0, Math.min(1, (now - t0) / RISE_S)));   // 0 → 1 once

    // Scroll: 0 with the section at the top of the window → 1 as it leaves.
    var r = section.getBoundingClientRect();
    var goalSet = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height)));
    scrollSet += (goalSet - scrollSet) * Math.min(1, dt / 0.35);   // a touch of lag

    var a = null;
    if (tilt) a = { x: tilt.nx, y: tilt.ny };
    else if (mouse) a = {
      x: Math.max(-1, Math.min(1, (mouse.x - (r.left + r.width / 2)) / (r.width / 2))),
      y: Math.max(-1, Math.min(1, (mouse.y - (r.top + r.height / 2)) / (r.height / 2)))
    };
    var gx = a ? a.x * SWAY : 0, gy = a ? a.y * LIFT : 0;
    ox += (gx - ox) * Math.min(1, dt / 0.9);
    oy += (gy - oy) * Math.min(1, dt / 0.9);

    // Height above its resting spot: below the fold before rising, sinking with scroll.
    var y = (1 - rise) * DROP + scrollSet * SET + oy;
    var breathe = 1 + 0.008 * Math.sin(now * 0.9);
    sun.style.transform = 'translate(-50%, 0) translate3d(' + (ox * size).toFixed(1) + 'px,' +
      (y * size).toFixed(1) + 'px,0) scale(' + breathe.toFixed(4) + ')';

    // Rays fan open as it climbs (and fold a little as it sets).
    var fan = 0.82 + 0.18 * rise - 0.06 * scrollSet;
    angle = (angle + DRIFT * dt) % 360;
    rays.style.transform = 'rotate(' + (angle - (1 - rise) * 24).toFixed(2) + 'deg) scale(' + fan.toFixed(4) + ')';
    spiral.style.transform = 'rotate(' + (-angle * 0.6).toFixed(2) + 'deg)';

    // The sky warms as the sun comes up (CSS reads --rise).
    section.style.setProperty('--rise', (rise * (1 - scrollSet * 0.6)).toFixed(3));

    requestAnimationFrame(loop);
  }
  function kick() {
    if (running || !on || document.hidden) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }
  new IntersectionObserver(function (es) { on = es[0].isIntersecting; kick(); }).observe(section);
  document.addEventListener('visibilitychange', kick);
})();
