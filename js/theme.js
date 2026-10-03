/* ------------------------------------------------------------------ *
 * Theme switcher — Default / Dark / Government.
 *
 * A top-right control opens a small popover; picking a theme sets
 * html[data-theme], persists it to localStorage, and plays the site's
 * ink-iris wipe (reused from css/transitions.css) as the colours swap in
 * place (no navigation). First-ever visit = Default; the OS light/dark
 * preference is deliberately ignored (Default is neither).
 *
 * On the home page two switches are built: one in the hero's top-right
 * corner (scrolls away) and one docked in the nav (fades in on scroll),
 * mirroring the wordmark logo. Other pages get just the nav-docked one.
 * Government mode swaps in a whole separate view (js/gov.js); its header
 * gets its own switch so the way back out is always visible.
 *
 * The pre-paint snippet in each page's <head> applies the stored theme
 * before CSS loads (no flash); this file only runs the UI + swap.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';

  var STORE_KEY = 'ff-theme';
  var THEMES = ['default', 'dark', 'gov'];
  var LABELS = { 'default': 'Very Vibrant (Default)', 'dark': 'Very Dark', 'gov': 'Very Official' };
  // Menu heading: makes clear the options restyle the page, not its content.
  var MENU_TITLE = 'Pick a style!';

  // Curtain colour per theme = that theme's hero tone, so the wipe reads as
  // the new palette flooding in.
  var CURTAIN = { 'default': '#E42600', 'dark': '#3D2222', 'gov': '#386FEF' };

  var root = document.documentElement;

  var reduced =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function current() {
    var t = root.getAttribute('data-theme');
    return THEMES.indexOf(t) !== -1 ? t : 'default';
  }

  function store(theme) {
    try { localStorage.setItem(STORE_KEY, theme); } catch (_) {}
  }

  /* ---------- Apply a theme (optionally with the wipe) ---------- */
  function applyTheme(theme) {
    var prev = current();
    if (theme === 'default') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    store(theme);
    // Gov and the playful views have unrelated layouts, so a scroll position
    // in one means nothing in the other — start the new view at the top.
    if (prev !== theme && (prev === 'gov' || theme === 'gov')) {
      window.scrollTo(0, 0);
      // The playful page's scroll/resize-driven layout (e.g. the home page
      // docking Flofu above the footer) was measured while it was hidden under
      // gov, where the footer reads as top:0 — leaving an invisible, clickable
      // Flofu over the theme menu. Make everything re-measure now it's back.
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('scroll'));
    }
    try {
      document.dispatchEvent(new CustomEvent('ff:themechange', { detail: { theme: theme } }));
    } catch (_) {}
    // Home page hero paints its field via inline JS — ask it to repaint.
    if (typeof window.__ffRepaintHero === 'function') {
      try { window.__ffRepaintHero(); } catch (_) {}
    }
    syncMenu();
  }

  function setTheme(theme) {
    if (theme === current()) { closeMenu(); return; }
    if (reduced) { applyTheme(theme); closeMenu(); return; }
    closeMenu();
    playWipe(theme);
  }

  /* ---------- Ink-iris wipe (reuses .ff-vt-* from transitions.css) ---------- *
   * Close the curtain over the current page, swap the theme at the covered
   * mid-point, then open it on the new palette. Mirrors page-transitions.js
   * but stays in place (no navigation). */
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

  function maxRadius(cx, cy, w, h) {
    var dx = Math.max(cx, w - cx);
    var dy = Math.max(cy, h - cy);
    return Math.ceil(Math.sqrt(dx * dx + dy * dy)) + 2;
  }

  function setVars(color, cx, cy, w, h) {
    var m = 0.15; // matches .ff-vt-fill inset:-15%
    root.style.setProperty('--vt-color', color);
    root.style.setProperty('--vt-x', (cx + m * w).toFixed(1) + 'px');
    root.style.setProperty('--vt-y', (cy + m * h).toFixed(1) + 'px');
    root.style.setProperty('--vt-rmax', maxRadius(cx, cy, w, h) + 'px');
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

  var lastX = null, lastY = null;
  document.addEventListener('pointermove', function (e) {
    lastX = e.clientX; lastY = e.clientY;
  }, { passive: true });

  function playWipe(theme) {
    var w = window.innerWidth, h = window.innerHeight;
    var cx = lastX === null ? w / 2 : lastX;
    var cy = lastY === null ? h / 2 : lastY;
    var color = CURTAIN[theme] || '#14110F';

    setVars(color, cx, cy, w, h);
    var closeFill = buildCurtain('close');
    var swapped = false;

    function swapAndOpen() {
      if (swapped) return;
      swapped = true;
      applyTheme(theme);                 // colours change under the covered screen
      removeWrap(closeFill);
      // Open the new palette from the same point.
      root.style.setProperty('--vt-color', color);
      var openFill = buildCurtain('open');
      var openWrap = openFill.parentNode;
      setVars(color, cx, cy, w, h);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { openWrap.classList.add('is-playing'); });
      });
      openFill.addEventListener('animationend', function () { removeWrap(openFill); });
      setTimeout(function () { removeWrap(openFill); }, 2000);
    }

    closeFill.addEventListener('animationend', swapAndOpen);
    setTimeout(swapAndOpen, 900); // fallback if the animation stalls
  }

  /* ---------- Control UI ---------- */
  var ICON =
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<path d="M15.5 8.5H15.51M10.5 7.5H10.51M7.5 11.5H7.51M12 21C7.02944 21 3 16.9706 ' +
      '3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 13.6569 19.6569 15 18 ' +
      '15H17.4C17.0284 15 16.8426 15 16.6871 15.0246C15.8313 15.1602 15.1602 15.8313 15.0246 ' +
      '16.6871C15 16.8426 15 17.0284 15 17.4V18C15 19.6569 13.6569 21 12 21ZM16 8.5C16 8.77614 ' +
      '15.7761 9 15.5 9C15.2239 9 15 8.77614 15 8.5C15 8.22386 15.2239 8 15.5 8C15.7761 8 16 ' +
      '8.22386 16 8.5ZM11 7.5C11 7.77614 10.7761 8 10.5 8C10.2239 8 10 7.77614 10 7.5C10 7.22386 ' +
      '10.2239 7 10.5 7C10.7761 7 11 7.22386 11 7.5ZM8 11.5C8 11.7761 7.77614 12 7.5 12C7.22386 ' +
      '12 7 11.7761 7 11.5C7 11.2239 7.22386 11 7.5 11C7.77614 11 8 11.2239 8 11.5Z" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';

  // There may be more than one switch on a page (e.g. the home page shows one in
  // the hero's top-right corner that scrolls away, plus one docked in the nav
  // that fades in on scroll — mirroring the wordmark logo). Track them all.
  var switches = [];

  function syncMenu() {
    var active = current();
    switches.forEach(function (sw) {
      var opts = sw.querySelectorAll('.theme-switch__opt');
      for (var i = 0; i < opts.length; i++) {
        opts[i].setAttribute('aria-checked', opts[i].dataset.theme === active ? 'true' : 'false');
      }
    });
  }

  function closeMenu() {
    switches.forEach(function (sw) {
      sw.classList.remove('is-open');
      var b = sw.querySelector('.theme-switch__btn');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  }

  // Build one switch instance into `host`. `variant` adds a modifier class so CSS
  // can place it (nav-docked vs hero corner).
  function makeSwitch(host, variant) {
    var sw = document.createElement('div');
    sw.className = 'theme-switch' + (variant ? ' theme-switch--' + variant : '');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-switch__btn';
    btn.setAttribute('aria-label', 'Change colour theme');
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('data-no-transition', '');  // don't trip the page-wipe interceptor
    btn.innerHTML = ICON;
    sw.appendChild(btn);

    var m = document.createElement('div');
    m.className = 'theme-switch__menu';
    m.setAttribute('role', 'menu');
    var title = document.createElement('p');
    title.className = 'theme-switch__label';
    title.id = 'theme-switch-label-' + (switches.length + 1);
    title.setAttribute('role', 'presentation');
    title.textContent = MENU_TITLE;
    m.setAttribute('aria-labelledby', title.id);
    m.appendChild(title);
    THEMES.forEach(function (t) {
      var opt = document.createElement('button');
      opt.type = 'button';
      opt.className = 'theme-switch__opt';
      opt.setAttribute('role', 'menuitemradio');
      opt.dataset.theme = t;
      opt.textContent = LABELS[t];
      opt.addEventListener('click', function () { setTheme(t); });
      m.appendChild(opt);
    });
    sw.appendChild(m);
    host.appendChild(sw);

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var wasOpen = sw.classList.contains('is-open');
      closeMenu();
      if (!wasOpen) {
        sw.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });

    switches.push(sw);
    return sw;
  }

  function build() {
    var navInner = document.querySelector('.site-nav__inner');
    if (!navInner) return;

    // The nav-docked switch (on the home page it fades in with the wordmark once
    // scrolled; on other pages the nav is always visible so it just shows).
    makeSwitch(navInner, 'nav');

    // Home page only: a second switch in the hero's top-right corner, mirroring
    // the hero wordmark — visible on load, scrolls away with the hero.
    var heroLogo = document.querySelector('.hero__logo');
    if (heroLogo && heroLogo.parentNode) {
      var corner = document.createElement('div');
      corner.className = 'theme-switch-corner';
      heroLogo.parentNode.insertBefore(corner, heroLogo.nextSibling);
      makeSwitch(corner, 'corner');
    }

    // Government view header (built by js/gov.js, which loads first).
    var govTools = document.querySelector('.gov-header__tools');
    if (govTools) makeSwitch(govTools, 'gov');

    document.addEventListener('click', function (e) {
      var inside = false;
      switches.forEach(function (sw) { if (sw.contains(e.target)) inside = true; });
      if (!inside) closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    syncMenu();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
