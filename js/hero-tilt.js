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
 * treat it like the cursor. Holding the phone level is the rest pose; tilt it
 * and the point slides that way (further tilt = further out). The forward/back
 * baseline is taken from how you're holding the phone and slowly re-centres,
 * so you don't have to hold it flat.
 *
 * iOS needs a permission prompt, and that has to come from a tap, so iOS
 * gets a small "tilt to play" button in the hero; once allowed, later visits
 * re-enable it silently on the first touch. Android just works. Needs HTTPS
 * (the live site is), so it won't fire on a plain-http LAN preview.
 * Skipped entirely under prefers-reduced-motion, and while a finger is down
 * (direct touch wins over tilt).
 */
(function () {
  var hero = document.getElementById('hero');
  if (!hero || !('DeviceOrientationEvent' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: none)').matches) return;   // mouse users keep the mouse

  var RANGE   = 22;     // degrees of tilt to reach the hero's edge
  var DEAD    = 5;      // degrees of tilt that still count as "level"
  var SMOOTH  = 0.09;   // s, low-pass on the raw sensor (kills jitter)
  var RECENTRE = 14;    // s, how slowly the forward/back baseline follows your grip
  var STORE   = 'ff-tilt';

  var raw = null;              // latest { b, g } (beta, gamma) from the sensor
  var sm = null, base = null;  // smoothed + baseline
  var touching = false, onScreen = true, running = false, last = 0;

  function onOrient(e) {
    if (e.beta == null || e.gamma == null) return;   // some desktops fire empty events
    raw = { b: e.beta, g: e.gamma };
    if (!running) start();
  }
  function listen() { window.addEventListener('deviceorientation', onOrient); }

  // --- iOS permission ---------------------------------------------------------
  var needsAsk = typeof DeviceOrientationEvent.requestPermission === 'function';
  if (!needsAsk) {
    listen();
  } else {
    var btn = null;
    var ask = function () {
      return DeviceOrientationEvent.requestPermission().then(function (state) {
        if (state !== 'granted') return;
        try { localStorage.setItem(STORE, 'on'); } catch (_) {}
        listen();
        if (btn) { btn.remove(); btn = null; }
      }).catch(function () {});
    };
    var opted = false;
    try { opted = localStorage.getItem(STORE) === 'on'; } catch (_) {}
    if (opted) {
      // Already allowed on an earlier visit: re-enable on the first tap (iOS
      // resolves without prompting again).
      var once = function () { window.removeEventListener('touchend', once); ask(); };
      window.addEventListener('touchend', once, { passive: true });
    } else {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'hero-tilt';
      btn.setAttribute('data-no-transition', '');
      btn.innerHTML = '<span class="hero-tilt__icon" aria-hidden="true"></span>tilt to play';
      btn.addEventListener('click', ask);
      hero.appendChild(btn);
    }
  }

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
      var detail = null;
      if (mag > DEAD) {
        // Ease out of the dead zone so the point doesn't jump.
        var f = (mag - DEAD) / mag;
        var nx = Math.max(-1, Math.min(1, tx * f / RANGE));
        var ny = Math.max(-1, Math.min(1, ty * f / RANGE));
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
    new IntersectionObserver(function (es) {
      onScreen = es[0].isIntersecting;
      if (onScreen && raw) start();
    }).observe(hero);
  }
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && raw) { sm = null; start(); }   // re-grip after coming back
  });
  window.addEventListener('orientationchange', function () { sm = null; });
})();
