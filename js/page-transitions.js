/* ------------------------------------------------------------------ *
 * Page transitions — ink iris (aperture) wipe, two phases.
 *
 * Leaving a page:  intercept the click, iris the page window CLOSED to
 *   the click point while THIS page's key colour (ink-edged) fills in
 *   around it, then navigate. Colour + origin stashed in sessionStorage.
 * Arriving on a page:  a same-colour field (built before first paint)
 *   irises OPEN from that same point to reveal the page.
 *
 * The organic edge comes from an SVG turbulence/displacement filter on
 * a wrapper element (see css/transitions.css). Honours reduced motion.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';

  var KEY = 'ff-vt';
  var MARGIN = 0.15; // matches .ff-vt-fill inset:-15%; used for origin math

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

  var root = document.documentElement;

  function keyColor() {
    var parts = location.pathname.split('/');
    var name = parts[parts.length - 1];
    return PAGE_COLORS.hasOwnProperty(name) ? PAGE_COLORS[name] : DEFAULT_COLOR;
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

  /* ---------- Arriving page: iris OPEN to reveal ---------- *
   * Runs during head parse (script not deferred) so the curtain is
   * built and painted before the page's own content — no flash. */
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

    var w = window.innerWidth;
    var h = window.innerHeight;
    var cx = (parseFloat(data.x) / 100) * w;
    var cy = (parseFloat(data.y) / 100) * h;
    setVars(data.color || DEFAULT_COLOR, cx, cy, w, h);

    var fill = buildCurtain('open');
    function cleanup() {
      var wrap = fill.parentNode;
      if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
    }
    fill.addEventListener('animationend', cleanup);
    setTimeout(cleanup, 2000); // safety if animationend never fires
  })();

  /* ---------- Leaving page: iris CLOSED, then navigate ---------- */
  document.addEventListener(
    'click',
    function (e) {
      if (reduced) return;
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
      var xPct = ((e.clientX / w) * 100).toFixed(2) + '%';
      var yPct = ((e.clientY / h) * 100).toFixed(2) + '%';

      setVars(color, e.clientX, e.clientY, w, h);

      // Hand colour + origin (as viewport %) to the arriving page.
      try {
        sessionStorage.setItem(KEY, JSON.stringify({ color: color, x: xPct, y: yPct }));
      } catch (_) {}

      var fill = buildCurtain('close');
      var navigated = false;
      function go() {
        if (navigated) return;
        navigated = true;
        location.href = url.href;
      }
      fill.addEventListener('animationend', go);
      setTimeout(go, 900); // fallback if the animation stalls
    },
    false
  );
})();
