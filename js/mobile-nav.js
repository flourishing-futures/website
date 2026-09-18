/* ============================================================
   Mobile navigation — bottom bar hamburger + full-screen
   "liquid glass" menu. Shared across all pages.

   Loaded as a plain end-of-body script (after the nav markup
   exists in the DOM). Independent of SITE_CONTENT / render-content.

   The toggle is a <button> (never an <a>) so it does NOT trip the
   synchronous page-transition click interceptor. The menu LINKS
   stay <a href> so tapping one still plays the iris transition into
   the next page — we only close the menu, then let the click proceed.
   ============================================================ */
(function () {
  'use strict';

  var nav    = document.getElementById('siteNav') || document.querySelector('.site-nav');
  var burger = document.getElementById('navBurger');
  var menu   = document.getElementById('mobileMenu');
  if (!nav || !burger || !menu) return;

  var lastFocus = null;

  // On mobile the bar is fixed to the bottom, so reserve exactly its height at
  // the foot of the page — matching the measured height (not a guess) means the
  // footer sits flush against the bar with no white gap showing between them.
  function syncBottomInset() {
    var mobile = window.matchMedia('(max-width: 768px)').matches;
    document.body.style.paddingBottom = mobile ? nav.offsetHeight + 'px' : '';
  }
  syncBottomInset();
  window.addEventListener('resize', syncBottomInset);
  window.addEventListener('load', syncBottomInset);

  function isOpen() {
    return menu.classList.contains('is-open');
  }

  function open() {
    if (isOpen()) return;
    lastFocus = document.activeElement;
    menu.classList.add('is-open');
    nav.classList.add('menu-open');
    menu.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('menu-open-lock');
    // Move focus into the menu for keyboard/screen-reader users.
    var first = menu.querySelector('a');
    if (first) first.focus();
  }

  function close() {
    if (!isOpen()) return;
    menu.classList.remove('is-open');
    nav.classList.remove('menu-open');
    menu.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('menu-open-lock');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function toggle() {
    isOpen() ? close() : open();
  }

  burger.addEventListener('click', function (e) {
    e.preventDefault();
    toggle();
  });

  // Esc closes.
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) close();
  });

  // Tapping a menu link: close the overlay, then let the navigation /
  // page-transition proceed normally (do NOT preventDefault).
  menu.addEventListener('click', function (e) {
    var link = e.target.closest('a');
    if (link) close();
    // Tap on the glass backdrop itself (not a link) also closes.
    else if (e.target === menu) close();
  });

  // If the viewport grows back to desktop while the menu is open, reset.
  window.addEventListener('resize', function () {
    if (isOpen() && window.innerWidth > 768) close();
  });
})();
