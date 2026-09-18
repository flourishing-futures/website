/* ------------------------------------------------------------------ *
 * Page transitions — ink iris (aperture) wipe, two phases.
 *
 * Leaving a page:  intercept the click, iris the page window CLOSED to
 *   the click point while THIS page's key colour (ink-edged) fills in
 *   around it, then navigate. The LATEST cursor position (tracked
 *   through the close) + colour are stashed in sessionStorage.
 * Arriving on a page:  a same-colour field is built fully closed, then
 *   irises OPEN from wherever the cursor is NOW — the first pointer move
 *   on the new page wins; if the pointer is still, it falls back to the
 *   handed-off position after a short beat.
 *
 * Organic edge = SVG turbulence/displacement filter (css/transitions.css).
 * Honours prefers-reduced-motion.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';

  var KEY = 'ff-vt';
  var MARGIN = 0.15;      // matches .ff-vt-fill inset:-15%; used for origin math
  var OPEN_FALLBACK = 140; // ms to wait for a pointer move before opening from stored

  // Key colour of the page you're LEAVING → the curtain colour.
  var PAGE_COLORS = {
    '': '#E42600',
    'index.html': '#E42600',
    'about.html': '#E42600',
    'the-lab.html': '#1D8949',
    'resource-centre.html': '#1934BE',
    'community.html': '#FFFF00',
  };
  var DEFAULT_COLOR = '#14110F';

  var reduced =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Touch / no-cursor devices have no pointer to iris from, so the aperture
  // just flashed from a stale/degenerate point. On these, always iris from the
  // centre of the screen (both the close on leave and the open on arrival).
  var coarse =
    window.matchMedia &&
    window.matchMedia('(hover: none), (pointer: coarse)').matches;

  var root = document.documentElement;

  function keyColor() {
    var parts = location.pathname.split('/');
    var name = parts[parts.length - 1];
    return PAGE_COLORS.hasOwnProperty(name) ? PAGE_COLORS[name] : DEFAULT_COLOR;
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  // Distance from (cx,cy) to the farthest viewport corner — the radius
  // the aperture must reach so the page is fully revealed.
  function maxRadius(cx, cy, w, h) {
    var dx = Math.max(cx, w - cx);
    var dy = Math.max(cy, h - cy);
    return Math.ceil(Math.sqrt(dx * dx + dy * dy)) + 2;
  }

  // The .ff-vt-fill box is inset by -MARGIN on each side, so the mask
  // origin (in that box's coordinates) is offset from the viewport point.
  function setVars(color, cx, cy, w, h) {
    root.style.setProperty('--vt-color', color);
    root.style.setProperty('--vt-x', (cx + MARGIN * w).toFixed(1) + 'px');
    root.style.setProperty('--vt-y', (cy + MARGIN * h).toFixed(1) + 'px');
    root.style.setProperty('--vt-rmax', maxRadius(cx, cy, w, h) + 'px');
  }

  // Inject the ink filter once. baseFrequency = wobble scale; feDisplacement
  // scale = how far the edge is pushed (bigger = inkier/rougher).
  function ensureFilter() {
    if (document.getElementById('ff-vt-ink')) return;
    var host = document.createElement('div');
    host.className = 'ff-vt-defs';
    host.setAttribute('aria-hidden', 'true');
    host.innerHTML =
      '<svg width="0" height="0">' +
        '<filter id="ff-vt-ink" x="-25%" y="-25%" width="150%" height="150%" ' +
                'color-interpolation-filters="sRGB">' +
          '<feTurbulence type="fractalNoise" baseFrequency="0.009 0.013" ' +
                        'numOctaves="2" seed="4" result="n"/>' +
          '<feDisplacementMap in="SourceGraphic" in2="n" scale="46" ' +
                             'xChannelSelector="R" yChannelSelector="G"/>' +
        '</filter>' +
      '</svg>';
    (document.body || root).appendChild(host);
  }

  function buildCurtain(mode) {
    ensureFilter();
    var wrap = document.createElement('div');
    wrap.className = 'ff-vt-wrap ff-vt-wrap--' + mode;
    var fill = document.createElement('div');
    fill.className = 'ff-vt-fill';
    wrap.appendChild(fill);
    (document.body || root).appendChild(wrap);
    return fill;
  }

  function removeWrap(fill) {
    var wrap = fill && fill.parentNode;
    if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
  }

  /* ---------- Arriving page: iris OPEN from the current cursor ---------- *
   * Runs during head parse (script not deferred) so the curtain is built
   * and painted (fully closed) before the page's own content — no flash. */
  (function playArrival() {
    if (reduced) {
      try { sessionStorage.removeItem(KEY); } catch (_) {}
      return;
    }
    var data;
    try {
      data = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      sessionStorage.removeItem(KEY);
    } catch (_) {
      data = null;
    }
    if (!data) return;

    var color = data.color || DEFAULT_COLOR;
    root.style.setProperty('--vt-color', color); // keep the closed field the right colour
    var fill = buildCurtain('open');              // starts fully closed (--vt-r:0)
    var wrap = fill.parentNode;

    var played = false;
    function open(cx, cy) {
      if (played) return;
      played = true;
      document.removeEventListener('pointermove', onMove, true);
      document.removeEventListener('mousemove', onMove, true);
      clearTimeout(fallbackId);

      var w = window.innerWidth;
      var h = window.innerHeight;
      setVars(color, clamp(cx, 0, w), clamp(cy, 0, h), w, h);

      // Let the origin/colour vars apply, then trigger the reveal.
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          wrap.classList.add('is-playing');
        });
      });
    }

    function onMove(e) {
      open(e.clientX, e.clientY); // truest "where the mouse is now"
    }

    var fallbackId;
    if (coarse) {
      // No cursor: iris open from the centre once the closed field has painted.
      var wc = window.innerWidth, hc = window.innerHeight;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { open(wc / 2, hc / 2); });
      });
    } else {
      document.addEventListener('pointermove', onMove, true);
      document.addEventListener('mousemove', onMove, true); // older-browser safety

      // No pointer movement (still mouse / keyboard) → open from the last
      // cursor position handed off by the page we came from.
      var w0 = window.innerWidth, h0 = window.innerHeight;
      var fx = (parseFloat(data.x) / 100) * w0;
      var fy = (parseFloat(data.y) / 100) * h0;
      fallbackId = setTimeout(function () { open(fx, fy); }, OPEN_FALLBACK);
    }

    fill.addEventListener('animationend', function () { removeWrap(fill); });
    setTimeout(function () { removeWrap(fill); }, OPEN_FALLBACK + 2500); // safety
  })();

  /* ---------- Leaving page: track the pointer, iris CLOSED, navigate ---------- */
  if (!reduced) {
    var lastX = null, lastY = null;
    function track(e) { lastX = e.clientX; lastY = e.clientY; }
    document.addEventListener('pointermove', track, { passive: true });
    document.addEventListener('mousemove', track, { passive: true });

    document.addEventListener(
      'click',
      function (e) {
        if (e.defaultPrevented || e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        var a = e.target.closest && e.target.closest('a[href]');
        if (!a) return;
        if (a.target === '_blank' || a.hasAttribute('download')) return;
        if (a.hasAttribute('data-no-transition')) return;

        var url;
        try {
          url = new URL(a.getAttribute('href'), location.href);
        } catch (_) {
          return;
        }
        if (url.origin !== location.origin) return;
        if (url.pathname === location.pathname && !url.search && url.hash) return; // in-page anchor
        if (url.href === location.href) return;

        e.preventDefault();

        var w = window.innerWidth;
        var h = window.innerHeight;
        var color = keyColor();

        // Close irises to the click point on pointer devices; from the centre
        // on touch (no cursor to aim at, and taps land wherever the link is).
        var ox = coarse ? w / 2 : e.clientX;
        var oy = coarse ? h / 2 : e.clientY;
        setVars(color, ox, oy, w, h);
        // Seed the handoff: centre on touch, else the click point if still.
        if (coarse) { lastX = w / 2; lastY = h / 2; }
        else if (lastX === null) { lastX = e.clientX; lastY = e.clientY; }

        var fill = buildCurtain('close');
        var navigated = false;
        function go() {
          if (navigated) return;
          navigated = true;
          // Hand off colour + the LATEST cursor position (as viewport %),
          // so the next page opens from where the mouse ended up.
          var xPct = (clamp(lastX, 0, w) / w * 100).toFixed(2) + '%';
          var yPct = (clamp(lastY, 0, h) / h * 100).toFixed(2) + '%';
          try {
            sessionStorage.setItem(KEY, JSON.stringify({ color: color, x: xPct, y: yPct }));
          } catch (_) {}
          location.href = url.href;
        }
        fill.addEventListener('animationend', go);
        setTimeout(go, 900); // fallback if the animation stalls
      },
      false
    );
  }
})();
