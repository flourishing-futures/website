/*
 * Home hero — "winding down" on phones.
 *
 * On a phone the hero stays partly on screen for the whole first swipe, and
 * running its scene alongside the scroll (plus the Vision sun coming in) is
 * what made scrolling lag. So on touch / narrow screens, as soon as the page
 * starts to scroll, the hero winds down like a record slowing to a stop: its
 * scene keeps moving but slower and slower over WIND seconds, then sleeps
 * (no frames at all). The question stops rotating too. Scroll back to the top
 * and it eases back up to speed from exactly where it stopped, so nothing jumps.
 *
 * This file sets .is-resting on #hero and fires a window `ff-hero-rest` event
 * when that changes. Each scene script (hero-magnet / hero-reflect / hero-lang)
 * gets its own pacer from window.__ffHeroPacer(): every frame it calls
 * pacer.tick(dt), which returns dt scaled by the current pace (1 → 0 while
 * winding down, 0 → 1 while waking), and stops its loop once !pacer.awake().
 * Desktop is untouched (there's headroom there, and the cursor lives in the hero).
 * Load before the scene scripts.
 */
(function () {
  var hero = document.getElementById('hero');
  if (!hero) return;

  var REST_AT = 24;    // px scrolled before the hero winds down
  var WAKE_AT = 8;     // px from the top where it wakes again (a little lower, so it can't flicker)
  var WIND    = 0.7;   // s to wind down to a stop (and to come back up to speed)
  var PHONE   = window.matchMedia('(hover: none), (max-width: 768px)');

  function resting() { return hero.classList.contains('is-resting'); }

  function check() {
    var y = window.scrollY;
    var want = PHONE.matches && (resting() ? y > WAKE_AT : y > REST_AT);
    if (want === resting()) return;
    hero.classList.toggle('is-resting', want);
    window.dispatchEvent(new Event('ff-hero-rest'));
  }
  window.addEventListener('scroll', check, { passive: true });   // only reads scrollY: no layout
  if (PHONE.addEventListener) PHONE.addEventListener('change', check);
  check();   // e.g. a reload part-way down the page starts already asleep

  window.__ffHeroPacer = function () {
    var ramp = resting() ? 0 : 1;
    var pacer = {
      pace: ramp,
      // Still has frames to run: not resting, or resting but not yet stopped.
      awake: function () { return !resting() || pacer.pace > 0; },
      tick: function (dt) {
        ramp = Math.max(0, Math.min(1, ramp + (resting() ? -dt : dt) / WIND));
        pacer.pace = ramp * ramp * (3 - 2 * ramp);   // eased at both ends, so it settles rather than stops
        return dt * pacer.pace;
      }
    };
    return pacer;
  };
})();
