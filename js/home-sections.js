/*
 * Home page sections under the hero.
 *
 * 1. Vision "sun" (References/Sun.svg): three layers turning at their own pace.
 *    At rest it's barely moving (one lap of the rays takes ~4 minutes). Scroll
 *    and it winds up with the scroll speed; stop and it brakes back to that
 *    calm drift within about a second, so the link to the scroll reads clearly. The inner spiral turns the other way, so the sun seems to churn
 *    rather than just rotate. The cursor (or device tilt) also nudges the
 *    whole sun a little, and the rays breathe slightly with the spin speed.
 *
 * 2. "What we do" illustrations (telescope / pencil / community): each drifts
 *    toward the cursor (parallax), or with device tilt on phones
 *    (`ff-tilt-n` from js/hero-tilt.js).
 *
 * 3. While a "What we do" column is being read its illustration fades back
 *    (CSS does it on hover; on touch screens this marks the column crossing
 *    the middle of the screen with .is-reading). Runs under reduced motion too.
 *
 * Each section's loop only runs while that section is on screen; nothing here
 * listens to the sensor directly (hero-tilt.js shares one sensor loop that
 * also pauses when none of its sections are visible). Reduced motion: still.
 */
(function () {
  // --- 3. Fade the "What we do" art behind the column being read (touch) ----
  if (window.matchMedia('(hover: none)').matches && 'IntersectionObserver' in window) {
    var cols = document.querySelectorAll('.things__col');
    var reading = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.classList.toggle('is-reading', e.isIntersecting); });
    }, { rootMargin: '-40% 0px -40% 0px' });   // the middle fifth of the screen
    Array.prototype.forEach.call(cols, function (c) { reading.observe(c); });
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Shared input: the cursor in client px, or tilt as -1..1.
  var mouse = null, tilt = null;
  document.addEventListener('mousemove', function (e) { mouse = { x: e.clientX, y: e.clientY }; }, { passive: true });
  document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) mouse = null; });
  window.addEventListener('ff-tilt-n', function (e) {
    var d = e.detail;
    tilt = d && (d.nx || d.ny) ? d : null;
  });

  // Where the input points, relative to a rect: -1..1 on each axis (null = rest).
  function aim(r) {
    if (tilt) return { x: tilt.nx, y: tilt.ny };
    if (!mouse) return null;
    return {
      x: Math.max(-1.5, Math.min(1.5, (mouse.x - (r.left + r.width / 2)) / (r.width / 2))),
      y: Math.max(-1.5, Math.min(1.5, (mouse.y - (r.top + r.height / 2)) / (r.height / 2)))
    };
  }

  // Runs fn(dt, now) every frame while el is on screen.
  function whileVisible(el, fn) {
    var on = false, running = false, last = 0;
    function loop(now) {
      if (!on || document.hidden) { running = false; return; }
      var dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;
      fn(dt, now / 1000);
      requestAnimationFrame(loop);
    }
    function kick() {
      if (running || !on || document.hidden) return;
      running = true;
      last = performance.now();
      requestAnimationFrame(loop);
    }
    new IntersectionObserver(function (es) { on = es[0].isIntersecting; kick(); }, { rootMargin: '80px 0px' }).observe(el);
    document.addEventListener('visibilitychange', kick);
  }

  // --- 1. Sun ----------------------------------------------------------------
  (function () {
    var section = document.querySelector('.vision');
    var sun = section && section.querySelector('.vision__sun');
    if (!sun) return;
    // Each layer has a light and a dark copy (one is display:none); move both
    // so a mid-session theme switch picks up where the other left off.
    var rays = sun.querySelectorAll('.vision__sun-rays');
    var spiral = sun.querySelectorAll('.vision__sun-spiral');
    function setAll(list, tf) { for (var i = 0; i < list.length; i++) list[i].style.transform = tf; }

    var IDLE    = 1.5;    // deg/s at rest (rays: a lap in 4 minutes)
    var SCROLL  = 0.06;   // deg/s added per px/s of scroll speed
    var MAX     = 90;     // deg/s ceiling, however hard you fling the page
    var SPIN_UP = 0.25;   // s, how quickly it winds up with scrolling
    var SPIN_DN = 0.45;   // s, how quickly it eases off once scrolling stops
    var BRAKE   = 70;     // deg/s², a firm brake on top, so it settles clearly rather than drifting down
    var NUDGE   = 14;     // px the sun leans toward the cursor / tilt

    var speed = IDLE, angle = 0, spin2 = 0, ox = 0, oy = 0, lastSun = '';
    var lastY = window.scrollY, scrollV = 0;

    whileVisible(section, function (dt) {
      // Scroll speed (either direction), smoothed so a trackpad doesn't stutter.
      var y = window.scrollY;
      var v = Math.abs(y - lastY) / Math.max(dt, 1 / 120);
      lastY = y;
      scrollV += (v - scrollV) * Math.min(1, dt / 0.08);

      var goal = Math.min(MAX, IDLE + scrollV * SCROLL);
      if (goal > speed) {
        speed += (goal - speed) * Math.min(1, dt / SPIN_UP);
      } else {
        // Ease + brake: drops off right away when the scroll stops, then
        // settles onto the idle drift (no long coasting tail).
        speed = Math.max(goal, speed - (speed - goal) * Math.min(1, dt / SPIN_DN) - BRAKE * dt);
      }
      angle = (angle + speed * dt) % 360;
      spin2 = (spin2 - speed * 0.6 * dt) % 360;   // the spiral churns the other way

      var a = aim(section.getBoundingClientRect());
      var gx = a ? a.x * NUDGE : 0, gy = a ? a.y * NUDGE : 0;
      ox += (gx - ox) * Math.min(1, dt / 0.6);
      oy += (gy - oy) * Math.min(1, dt / 0.6);

      // Rays swell a touch as it spins faster, like heat coming off it.
      var swell = 1 + Math.min(0.05, (speed - IDLE) / MAX * 0.05);
      var sunTf = 'translate(-50%, -50%) translate3d(' + ox.toFixed(1) + 'px,' + oy.toFixed(1) + 'px,0)';
      if (sunTf !== lastSun) { sun.style.transform = sunTf; lastSun = sunTf; }   // still most of the time
      setAll(rays, 'rotate(' + angle.toFixed(2) + 'deg) scale(' + swell.toFixed(4) + ')');
      setAll(spiral, 'rotate(' + spin2.toFixed(2) + 'deg)');
    });
  })();

  // --- 2. "What we do" illustrations ----------------------------------------
  (function () {
    var section = document.querySelector('.things');
    if (!section) return;
    var wraps = Array.prototype.slice.call(section.querySelectorAll('.things__doodle-wrap'));
    if (!wraps.length) return;
    var MAX = 18;   // px drift
    var state = wraps.map(function () { return { x: 0, y: 0, px: '', py: '' }; });

    whileVisible(section, function (dt) {
      wraps.forEach(function (w, i) {
        // (Only measure when there's an input to aim at: phones without tilt skip it.)
        var a = (mouse || tilt) ? aim(w.getBoundingClientRect()) : null;
        // Tilt moves all three together; the mouse pulls each toward the cursor.
        var gx = a ? Math.max(-1, Math.min(1, a.x)) * MAX : 0;
        var gy = a ? Math.max(-1, Math.min(1, a.y)) * MAX : 0;
        var s = state[i];
        s.x += (gx - s.x) * Math.min(1, dt / 0.25);
        s.y += (gy - s.y) * Math.min(1, dt / 0.25);
        // Only write when it actually moved (once settled, nothing restyles mid-scroll).
        var px = s.x.toFixed(1) + 'px', py = s.y.toFixed(1) + 'px';
        if (px !== s.px) { w.style.setProperty('--px', px); s.px = px; }
        if (py !== s.py) { w.style.setProperty('--py', py); s.py = py; }
      });
    });
  })();
})();
