/*
 * Home hero — device tilt as a "virtual cursor" for touch screens.
 *
 * On phones/tablets (no hover) the hero interactions are driven by tilting the
 * device instead of a mouse. Tilt is turned into a point inside the hero and
 * broadcast every frame as a window `ff-tilt` event:
 *
 *   detail = { x, y }   client px, like a mouse position
 *   detail = null       the device is held level — interactions go back to rest
 *
 * The scene scripts (hero-magnet / hero-reflect / hero-lang) listen for it and
 * treat it like the cursor. A second, normalised `ff-tilt-n` event
 * (detail = { nx, ny }, each -1..1, 0,0 when level) drives the home sections
 * further down (js/home-sections.js) and other pages' [data-tilt] sections (e.g.
 * the About sunrise). The sensor loop only runs while the hero or one of those
 * sections is actually on screen. Holding the phone level is the rest pose; tilt it
 * and the point slides that way (further tilt = further out). The forward/back
 * baseline is taken from how you're holding the phone and slowly re-centres,
 * so you don't have to hold it flat.
 *
 * iOS is deliberately skipped: Safari only gives motion data after a system
 * permission prompt, and how long it remembers the answer isn't reliable, so
 * visitors could be re-asked on later visits. Content comes first, so iPhones
 * and iPads get the touch + ambient versions of each interaction instead, with
 * no prompts. Android needs no prompt, so it gets tilt. Needs HTTPS (the live
 * site is), so it won't fire on a plain-http LAN preview.
 * Skipped entirely under prefers-reduced-motion, and while a finger is down
 * (direct touch wins over tilt).
 */
(function () {
  var hero = document.getElementById('hero');
  if (!(hero || document.querySelector('[data-tilt]')) || !('DeviceOrientationEvent' in window)) return;
  // iOS: tilt would need a permission prompt (see above), so leave it off.
  if (typeof DeviceOrientationEvent.requestPermission === 'function') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: none)').matches) return;   // mouse users keep the mouse

  var RANGE   = 22;     // degrees of tilt to reach the hero's edge
  var DEAD    = 5;      // degrees of tilt that still count as "level"
  var SMOOTH  = 0.09;   // s, low-pass on the raw sensor (kills jitter)
  var RECENTRE = 14;    // s, how slowly the forward/back baseline follows your grip

  var raw = null;              // latest { b, g } (beta, gamma) from the sensor
  var sm = null, base = null;  // smoothed + baseline
  var touching = false, onScreen = true, running = false, last = 0, heroOn = !!hero;

  function onOrient(e) {
    if (e.beta == null || e.gamma == null) return;   // some desktops fire empty events
    raw = { b: e.beta, g: e.gamma };
    if (!running) start();
  }
  function listen() { window.addEventListener('deviceorientation', onOrient); }

  listen();

  // --- Mapping --------------------------------------------------------------
  // Sensor axes are relative to the device, so rotate them to match the screen.
  function screenAxes(b, g) {
    var a = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
    a = ((a % 360) + 360) % 360;
    if (a === 90)  return { x: b,  y: -g };
    if (a === 270) return { x: -b, y: g };
    if (a === 180) return { x: -g, y: -b };
    return { x: g, y: b };
  }

  function start() {
    if (running || !onScreen || document.hidden) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(step);
  }

  function step(now) {
    if (!running) return;
    if (!onScreen || document.hidden) { running = false; return; }
    var dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (raw) {
      var s = screenAxes(raw.b, raw.g);
      if (!sm) { sm = { x: s.x, y: s.y }; base = { x: 0, y: s.y }; }   // left/right level = 0; forward/back = your grip
      var k = 1 - Math.exp(-dt / SMOOTH);
      sm.x += (s.x - sm.x) * k;
      sm.y += (s.y - sm.y) * k;
      base.y += (sm.y - base.y) * (1 - Math.exp(-dt / RECENTRE));

      var tx = sm.x - base.x, ty = sm.y - base.y;
      var mag = Math.sqrt(tx * tx + ty * ty);
      // While a finger is down, stay quiet so the touch position isn't overwritten.
      if (touching) { requestAnimationFrame(step); return; }
      var detail = null, nx = 0, ny = 0;
      if (mag > DEAD) {
        // Ease out of the dead zone so the point doesn't jump.
        var f = (mag - DEAD) / mag;
        nx = Math.max(-1, Math.min(1, tx * f / RANGE));
        ny = Math.max(-1, Math.min(1, ty * f / RANGE));
      }
      window.dispatchEvent(new CustomEvent('ff-tilt-n', { detail: { nx: nx, ny: ny } }));
      // (Skipped while the hero is winding down / asleep on scroll: js/hero-rest.js.)
      if (heroOn && mag > DEAD && !hero.classList.contains('is-resting')) {
        // Map into the part of the hero that's actually on screen.
        var hr = hero.getBoundingClientRect();
        var top = Math.max(hr.top, 0), bot = Math.min(hr.bottom, window.innerHeight);
        if (bot > top) {
          detail = {
            x: hr.left + hr.width / 2 + nx * hr.width / 2 * 0.98,
            y: (top + bot) / 2 + ny * (bot - top) / 2 * 0.98
          };
        }
      }
      window.dispatchEvent(new CustomEvent('ff-tilt', { detail: detail }));
    }
    requestAnimationFrame(step);
  }

  // Direct touch beats tilt while a finger is down.
  window.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') touching = true; }, { passive: true });
  ['pointerup', 'pointercancel'].forEach(function (t) {
    window.addEventListener(t, function () { touching = false; }, { passive: true });
  });
  if ('IntersectionObserver' in window) {
    var seen = new Map();
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { seen.set(e.target, e.isIntersecting); });
      heroOn = !!seen.get(hero);
      onScreen = false;
      seen.forEach(function (v) { if (v) onScreen = true; });
      if (onScreen && raw) start();
    });
    if (hero) io.observe(hero);
    Array.prototype.forEach.call(document.querySelectorAll('[data-tilt]'), function (el) { io.observe(el); });
  }
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && raw) { sm = null; start(); }   // re-grip after coming back
  });
  window.addEventListener('orientationchange', function () { sm = null; });
})();
