/* ------------------------------------------------------------------ *
 * Merch page (drops.html, at /drops): the photo reels, colourway swatches, the
 * "drag" cursor and the on-scroll reveals.
 *
 * Each design's reel drifts slowly left on its own and loops seamlessly
 * (its photos are cloned once). You can grab it and drag (mouse) or swipe
 * (touch); a flick keeps gliding and eases back into the drift. Clicking a
 * colourway swatch glides the reel FORWARD to the next photo in that
 * colour, holds there for a moment, then drifts on. The swatch for the
 * colour in view wears a ring.
 *
 * Clicking (or tapping) a photo opens that design's print artwork in a
 * lightbox you can zoom (scroll / pinch / click / the − + buttons) and
 * pan (drag). Click outside it, the × or Esc to close. A sharper copy
 * of the artwork is fetched the first time you zoom in.
 *
 * Every reel's loop stops when it's off screen or the tab is hidden.
 * Reduced motion: no drift and no glides (a swatch jumps straight there),
 * drag still works.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';

  // ---- Tunables ----
  var SPEED = 24;            // px/s the reels drift by themselves (desktop)
  var SPEED_TOUCH = 16;      // px/s on phones (narrower photos, so slower)
  var RAMP = 0.9;            // s: how gently the drift eases back up to speed (time constant)
  var FRICTION = 0.93;       // per-frame (60fps) decay of a flick's glide; lower = shorter
  var FLING_MIN = 80;        // px/s: let go slower than this and the reel just stays put
  var HOLD_AFTER_PICK = 2.8; // s a swatch pick (or arrow key) holds still before drifting on
  var HOLD_AFTER_DRAG = 1.0; // s a dropped reel holds still before drifting on
  var GLIDE_MIN = 0.65;      // s: shortest swatch glide...
  var GLIDE_PER_PX = 0.00028; // ...plus this many seconds per px travelled...
  var GLIDE_MAX = 1.5;       // ...up to this long
  var SPRING_K = 140;        // the reel trails the glide on a spring: stiffness...
  var SPRING_C = 17;         // ...and damping (a touch under critical, so it settles with a tiny overshoot)
  var CURRENT_AT = 0.3;      // a photo counts as "in view" once it covers this point of the reel (0 = left edge)
  var CURSOR_FOLLOW = 0.32;  // how tightly the drag cursor trails the mouse (1 = glued to it)
  var TAP_SLOP = 6;          // px a press may wander and still count as a click (not a drag)
  var LB_TAP_ZOOM = 2.5;     // lightbox: clicking the artwork zooms to this
  var LB_STEP = 1.6;         // lightbox: each − / + press zooms by this factor
  var LB_MAX = 8;            // lightbox: deepest zoom (also capped by the image's real resolution)
  var LB_SHARP_AT = 1.5;     // lightbox: past this zoom, swap in the sharper artwork
  var LB_RUBBER = 0.35;      // lightbox: how far you can pull past an edge (0 = hard stop); springs back on release

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var touchish = window.matchMedia && window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
  var root = document.documentElement;

  /* ---------- Visible height under the sticky nav (CSS --merch-nav) ---------- */
  var nav = document.getElementById('siteNav');
  var lastNavH = -1;
  function syncNav() {
    var h = nav ? nav.offsetHeight : 0;
    if (h === lastNavH) return;
    lastNavH = h;
    root.style.setProperty('--merch-nav', h + 'px');
  }
  syncNav();
  window.addEventListener('resize', syncNav, { passive: true });
  window.addEventListener('load', syncNav);

  /* ---------- Reveals (one-way: things rise in once and stay) ---------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        rio.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    Array.prototype.forEach.call(revealEls, function (el) { rio.observe(el); });
  } else {
    Array.prototype.forEach.call(revealEls, function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Reels ---------- */
  function easeInOut(u) { return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }

  function initReel(section) {
    var reel = section.querySelector('.merch-reel');
    var track = reel && reel.querySelector('.merch-reel__track');
    if (!track) return;
    var swatches = Array.prototype.slice.call(section.querySelectorAll('.merch-swatch'));

    // Clone the photos once so the strip can loop without a seam.
    var originals = Array.prototype.slice.call(track.children);
    var n = originals.length;
    if (!n) return;
    originals.forEach(function (s) {
      var c = s.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.setAttribute('data-clone', '');
      var im = c.querySelector('img');
      if (im) im.alt = '';
      track.appendChild(c);
    });
    var colours = originals.map(function (s) { return s.getAttribute('data-colour'); });

    var base = reduce ? 0 : (touchish ? SPEED_TOUCH : SPEED);

    // Layout, measured on resize only (never inside the frame loop).
    var starts = [];   // left edge of each original photo, in track px
    var half = 0;      // one full loop = where the first clone starts
    var viewW = 0;     // reel width

    var x = 0;         // track offset (≤ 0), wrapped into (-half, 0]
    var v = -base;     // px/s (negative = drifting left)
    var mode = 'drift';   // drift | drag | fling | glide | hold
    var holdUntil = 0;
    var glide = null;     // { from, to, t0, dur }
    var curColour = null;
    var lastWritten = null;

    function measure() {
      var first = track.children[0], clone = track.children[n];
      var h = clone.offsetLeft - first.offsetLeft;
      viewW = reel.clientWidth;
      if (!h) return;   // hidden (Government view) or not laid out yet; ResizeObserver calls back
      if (half) x = x * h / half;   // keep the same spot through a resize
      half = h;
      for (var i = 0; i < n; i++) starts[i] = track.children[i].offsetLeft - first.offsetLeft;
      wrap();
      write();
      updateCurrent();
    }

    function wrap() {
      if (!half) return;
      while (x <= -half) { x += half; if (glide) { glide.from += half; glide.to += half; } }
      while (x > 0) { x -= half; if (glide) { glide.from -= half; glide.to -= half; } }
    }

    function write() {
      var r = Math.round(x * 2) / 2;   // half-pixel steps; skip identical writes
      if (r === lastWritten) return;
      lastWritten = r;
      track.style.transform = 'translate3d(' + r + 'px,0,0)';
    }

    // Which photo covers the "in view" point → ring its colour's swatch.
    function updateCurrent() {
      if (!half) return;
      var p = (-x + viewW * CURRENT_AT) % half;
      var i = n - 1;
      while (i > 0 && starts[i] > p) i--;
      var c = colours[i];
      if (c === curColour) return;
      curColour = c;
      swatches.forEach(function (s) {
        s.classList.toggle('is-current', s.getAttribute('data-colour') === c);
      });
    }

    // Glide to absolute track offset `to` (may be past -half; wrap() shifts it along).
    function glideTo(to, now) {
      if (reduce) {
        x = to; v = 0; wrap(); write(); updateCurrent();
        mode = 'hold'; holdUntil = Infinity;   // no drift under reduced motion anyway
        return;
      }
      var dist = Math.abs(to - x);
      glide = { from: x, to: to, t0: now, dur: Math.min(GLIDE_MAX, GLIDE_MIN + dist * GLIDE_PER_PX) };
      mode = 'glide';
      wake();
    }

    // Forward (leftward) to the next photo of `colour` that isn't already at the left edge.
    function goToColour(colour) {
      if (!half) return;
      var L = -x, best = Infinity;
      for (var k = 0; k < 2; k++) {
        for (var i = 0; i < n; i++) {
          if (colours[i] !== colour) continue;
          var t = starts[i] + k * half;
          if (t > L + 2 && t < best) best = t;
        }
      }
      if (best < Infinity) glideTo(-best, performance.now());
    }

    // Arrow keys: step one photo either way.
    function step(dir) {
      if (!half) return;
      var L = -x, t;
      if (dir > 0) {
        t = Infinity;
        for (var k = 0; k < 2; k++) for (var i = 0; i < n; i++) {
          var a = starts[i] + k * half;
          if (a > L + 2 && a < t) t = a;
        }
      } else {
        t = -Infinity;
        for (var k2 = -1; k2 < 1; k2++) for (var j = 0; j < n; j++) {
          var b = starts[j] + k2 * half;
          if (b < L - 2 && b > t) t = b;
        }
      }
      if (isFinite(t)) glideTo(-t, performance.now());
    }

    swatches.forEach(function (s) {
      s.addEventListener('click', function () { goToColour(s.getAttribute('data-colour')); });
    });
    reel.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(section, reel); }
    });

    /* ----- Frame loop: runs only while on screen and the tab is visible ----- */
    var visible = false, running = false, lastT = 0;

    function wake() {
      if (running || !visible || document.hidden || lbOpen) return;
      running = true;
      lastT = 0;
      requestAnimationFrame(frame);
    }

    function frame(now) {
      if (!visible || document.hidden || lbOpen) { running = false; return; }
      var dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 1 / 60;
      lastT = now;
      var idle = false;

      if (mode === 'glide' && glide) {
        // The target slides along an eased path; the reel follows it on a spring,
        // so it starts from its drift smoothly and settles with a little give.
        var u = Math.min(1, (now - glide.t0) / (glide.dur * 1000));
        var target = glide.from + (glide.to - glide.from) * easeInOut(u);
        v += (SPRING_K * (target - x) - SPRING_C * v) * dt;
        x += v * dt;
        if (u >= 1 && Math.abs(glide.to - x) < 0.5 && Math.abs(v) < 4) {
          x = glide.to; v = 0; glide = null;
          mode = 'hold'; holdUntil = now + HOLD_AFTER_PICK * 1000;
        }
      } else if (mode === 'fling') {
        v *= Math.pow(FRICTION, dt * 60);
        x += v * dt;
        if (Math.abs(v) <= Math.max(base, 6)) mode = 'drift';
      } else if (mode === 'hold') {
        if (now >= holdUntil) mode = 'drift';
        else idle = true;
      } else if (mode === 'drift') {
        v += (-base - v) * (1 - Math.exp(-dt / RAMP));
        if (Math.abs(v + base) < 0.05) v = -base;
        x += v * dt;
        if (!base && !v) idle = true;
      }
      // (drag: pointermove sets x directly)

      if (mode !== 'drag') { wrap(); write(); updateCurrent(); }

      // Nothing can change until the next input: sleep instead of spinning.
      if (idle && (mode !== 'hold' || holdUntil === Infinity)) { running = false; return; }
      requestAnimationFrame(frame);
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        wake();
      }, { threshold: 0 }).observe(reel);

      // Start fetching this reel's photos a screen before it arrives, so they're
      // ready by the time they drift into view (lazy-loading alone waits until
      // each photo is on screen, which shows as blank slots in a moving strip).
      var pre = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return;
        Array.prototype.forEach.call(track.querySelectorAll('img'), function (im) { im.loading = 'eager'; });
        if (section.dataset.art) new Image().src = section.dataset.art;   // so the lightbox opens instantly
        pre.disconnect();
      }, { rootMargin: '100% 0px 100% 0px' });
      pre.observe(reel);
    } else {
      visible = true;
    }
    document.addEventListener('visibilitychange', wake);
    reelWakers.push(wake);

    if (window.ResizeObserver) new ResizeObserver(measure).observe(reel);
    window.addEventListener('load', measure);
    measure();

    /* ----- Drag / swipe ----- */
    var pid = null, startPX = 0, startX = 0, lastPX = 0, lastPT = 0, vel = 0;
    var downY = 0, downT = 0, wander = 0;

    reel.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (!half) return;
      pid = e.pointerId;
      mode = 'drag'; glide = null; v = 0; vel = 0;
      startPX = lastPX = e.clientX; startX = x; lastPT = e.timeStamp;
      downY = e.clientY; downT = e.timeStamp; wander = 0;
      reel.classList.add('is-dragging');
      try { reel.setPointerCapture(pid); } catch (_) {}
      if (e.pointerType === 'mouse') e.preventDefault();   // no text/image selection
    });

    reel.addEventListener('pointermove', function (e) {
      if (e.pointerId !== pid) return;
      var dt = Math.max(1, e.timeStamp - lastPT) / 1000;
      vel = 0.75 * vel + 0.25 * ((e.clientX - lastPX) / dt);   // smoothed px/s
      lastPX = e.clientX; lastPT = e.timeStamp;
      wander = Math.max(wander, Math.abs(e.clientX - startPX) + Math.abs(e.clientY - downY));
      x = startX + (e.clientX - startPX);
      // Keep the drag anchored while wrapping round the loop.
      var before = x; wrap(); startX += x - before;
      write(); updateCurrent();
    });

    function endDrag(e) {
      if (e.pointerId !== pid) return;
      pid = null;
      reel.classList.remove('is-dragging');
      // Barely moved and let go quickly: that was a click on a photo, not a drag.
      if (e.type === 'pointerup' && wander < TAP_SLOP && e.timeStamp - downT < 600) {
        v = 0; mode = 'hold'; holdUntil = performance.now() + HOLD_AFTER_PICK * 1000;
        openLightbox(section, reel);
        return;
      }
      // A pause between the last move and letting go means "put it down here".
      if (e.timeStamp - lastPT > 90) vel = 0;
      if (!reduce && Math.abs(vel) > FLING_MIN) {
        v = Math.max(-6000, Math.min(6000, vel));
        mode = 'fling';
      } else {
        v = 0;
        mode = 'hold';
        holdUntil = reduce ? Infinity : performance.now() + HOLD_AFTER_DRAG * 1000;
      }
      wake();
    }
    reel.addEventListener('pointerup', endDrag);
    reel.addEventListener('pointercancel', endDrag);   // e.g. a phone decided this was a vertical scroll
    reel.addEventListener('lostpointercapture', endDrag);
  }

  var lbOpen = false;
  var reelWakers = [];
  Array.prototype.forEach.call(document.querySelectorAll('.merch-item'), initReel);

  /* ---------- Lightbox: the design's print artwork, zoomable ---------- */
  var lb = null;   // built on first open

  function buildLightbox() {
    var el = document.createElement('div');
    el.className = 'merch-lb';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'merchLbTitle');
    el.hidden = true;
    el.innerHTML =
      '<div class="merch-lb__bar">' +
        '<p class="merch-lb__title" id="merchLbTitle"><span class="merch-lb__num"></span><span class="merch-lb__name"></span></p>' +
        '<button type="button" class="merch-lb__btn merch-lb__close" aria-label="Close artwork">' +
          '<img src="img/icon-close.svg?v=20261006" alt="" aria-hidden="true" draggable="false"></button>' +
      '</div>' +
      '<div class="merch-lb__stage"><img class="merch-lb__img" alt="" draggable="false"></div>' +
      '<div class="merch-lb__tools">' +
        '<button type="button" class="merch-lb__btn merch-lb__zoom" data-zoom="out" aria-label="Zoom out">' +
          '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.5 10.2c3.6-.4 7.4-.3 11 0"/></svg></button>' +
        '<p class="merch-lb__hint">' + (touchish ? 'Pinch or tap to zoom' : 'Scroll or click to zoom · drag to look around') + '</p>' +
        '<button type="button" class="merch-lb__btn merch-lb__zoom" data-zoom="in" aria-label="Zoom in">' +
          '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.5 10.2c3.6-.4 7.4-.3 11 0M10.1 4.4c.3 3.8.2 7.4-.1 11.2"/></svg></button>' +
      '</div>';
    document.body.appendChild(el);

    var stage = el.querySelector('.merch-lb__stage');
    var img = el.querySelector('.merch-lb__img');
    var btnOut = el.querySelector('[data-zoom="out"]');
    var btnIn = el.querySelector('[data-zoom="in"]');
    var closeBtn = el.querySelector('.merch-lb__close');

    var st = {
      el: el, img: img, stage: stage,
      s: 1, tx: 0, ty: 0,          // zoom and pan (px, relative to the fitted position)
      fw: 0, fh: 0, ox: 0, oy: 0,  // fitted size + offset inside the stage
      sw: 0, sh: 0,                // stage size
      artW: 1, artH: 1, maxS: LB_MAX,
      sharpUrl: '', sharpDone: false,
      opener: null, inerted: [], closeTimer: 0
    };

    function apply(ease) {
      img.classList.toggle('is-easing', ease === 'ease');
      img.classList.toggle('is-wheel', ease === 'wheel');
      img.style.transform = 'translate(' + st.tx.toFixed(1) + 'px,' + st.ty.toFixed(1) + 'px) scale(' + st.s.toFixed(4) + ')';
      el.classList.toggle('is-zoomed', st.s > 1.01);
      var had = document.activeElement;
      btnOut.disabled = st.s <= 1.001;
      btnIn.disabled = st.s >= st.maxS - 0.001;
      // A button that just disabled itself drops focus: hand it to its partner.
      if (had && had.disabled) (had === btnOut ? btnIn : btnOut).focus({ preventScroll: true });
      if (st.s > LB_SHARP_AT) sharpen();
    }

    // Fit the artwork inside the stage (contain), centred.
    function fit() {
      st.sw = stage.clientWidth; st.sh = stage.clientHeight;
      var k = Math.min(st.sw / st.artW, st.sh / st.artH);
      st.fw = st.artW * k; st.fh = st.artH * k;
      st.ox = (st.sw - st.fw) / 2; st.oy = (st.sh - st.fh) / 2;
      img.style.width = st.fw + 'px'; img.style.height = st.fh + 'px';
      img.style.left = st.ox + 'px'; img.style.top = st.oy + 'px';
      // Never zoom past ~1.5 screen px per real pixel of the sharp image.
      var sharpW = touchish ? st.artW * 4000 / st.artH : st.artW;
      st.maxS = Math.max(2, Math.min(LB_MAX, sharpW / st.fw * 1.5));
    }

    // Allowed pan range at zoom s: centred if the image is smaller than the stage.
    function range(s, axis) {
      var size = (axis === 'x' ? st.fw : st.fh) * s, view = axis === 'x' ? st.sw : st.sh, o = axis === 'x' ? st.ox : st.oy;
      if (size <= view) { var c = (view - size) / 2 - o; return [c, c]; }
      return [view - size - o, -o];
    }
    function clampTo(v, r) { return v < r[0] ? r[0] : v > r[1] ? r[1] : v; }
    function rubber(v, r) {   // past an edge, only follow a fraction of the way
      if (v < r[0]) return r[0] + (v - r[0]) * LB_RUBBER;
      if (v > r[1]) return r[1] + (v - r[1]) * LB_RUBBER;
      return v;
    }

    // Zoom to s keeping the stage point (px, py) still under the finger/cursor.
    function zoomAt(s, px, py, ease, soft) {
      var lo = soft ? 0.8 : 1, hi = soft ? st.maxS * 1.15 : st.maxS;
      s = Math.max(lo, Math.min(hi, s));
      var lx = (px - st.ox - st.tx) / st.s, ly = (py - st.oy - st.ty) / st.s;
      st.tx = px - st.ox - lx * s; st.ty = py - st.oy - ly * s; st.s = s;
      var f = soft ? rubber : clampTo;
      st.tx = f(st.tx, range(s, 'x')); st.ty = f(st.ty, range(s, 'y'));
      apply(ease);
    }

    // Spring back inside the limits after a gesture.
    function settle() {
      var s = Math.max(1, Math.min(st.maxS, st.s));
      if (s !== st.s) { zoomAt(s, st.sw / 2, st.sh / 2, 'ease'); return; }
      var tx = clampTo(st.tx, range(s, 'x')), ty = clampTo(st.ty, range(s, 'y'));
      if (tx !== st.tx || ty !== st.ty) { st.tx = tx; st.ty = ty; apply('ease'); }
    }

    // First real zoom: fetch the sharp copy and swap it in once decoded (same box, so no jump).
    function sharpen() {
      if (st.sharpDone || !st.sharpUrl) return;
      st.sharpDone = true;
      var url = st.sharpUrl, pre = new Image();
      pre.src = url;
      (pre.decode ? pre.decode() : Promise.resolve()).then(function () {
        if (st.sharpUrl === url) img.src = url;
      }, function () {});
    }

    function stagePoint(e) {
      var r = stage.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    }

    /* Pointer gestures: one finger/mouse pans (when zoomed), two pinch.
       A press that barely moves is a click: on the artwork it zooms in
       (or back out), anywhere else it closes the lightbox. */
    var pts = {}, nPts = 0, g = null, tap = null;
    function pinchInfo() {
      var ids = Object.keys(pts), a = pts[ids[0]], b = pts[ids[1]];
      return { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
    }
    function startGesture() {
      if (nPts === 2) {
        var p = pinchInfo();
        g = { type: 'pinch', d0: p.d, s0: st.s, mx0: p.mx, my0: p.my, tx0: st.tx, ty0: st.ty };
      } else if (nPts === 1) {
        var id = Object.keys(pts)[0];
        g = { type: 'pan', x0: pts[id].x, y0: pts[id].y, tx0: st.tx, ty0: st.ty };
      } else g = null;
    }

    stage.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      var p = stagePoint(e);
      pts[e.pointerId] = { x: p[0], y: p[1] }; nPts++;
      try { stage.setPointerCapture(e.pointerId); } catch (_) {}
      tap = nPts === 1 ? { x: p[0], y: p[1], t: e.timeStamp, onImg: e.target === img } : null;
      startGesture();
      e.preventDefault();
    });
    stage.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId]) return;
      var p = stagePoint(e);
      pts[e.pointerId].x = p[0]; pts[e.pointerId].y = p[1];
      if (tap && Math.abs(p[0] - tap.x) + Math.abs(p[1] - tap.y) > TAP_SLOP) tap = null;
      if (!g) return;
      if (g.type === 'pinch') {
        var q = pinchInfo();
        // Zoom about where the pinch started, then follow the fingers' midpoint.
        var s = Math.max(0.8, Math.min(st.maxS * 1.15, g.s0 * q.d / g.d0));
        var lx = (g.mx0 - st.ox - g.tx0) / g.s0, ly = (g.my0 - st.oy - g.ty0) / g.s0;
        st.s = s;
        st.tx = rubber(q.mx - st.ox - lx * s, range(s, 'x'));
        st.ty = rubber(q.my - st.oy - ly * s, range(s, 'y'));
        apply();
      } else if (st.s > 1.001) {
        stage.classList.add('is-panning');
        st.tx = rubber(g.tx0 + p[0] - g.x0, range(st.s, 'x'));
        st.ty = rubber(g.ty0 + p[1] - g.y0, range(st.s, 'y'));
        apply();
      }
    });
    function pointerEnd(e) {
      if (!pts[e.pointerId]) return;
      delete pts[e.pointerId]; nPts--;
      stage.classList.remove('is-panning');
      if (nPts > 0) { startGesture(); return; }   // pinch → one finger left: carry on panning from here
      g = null;
      var t = tap; tap = null;
      if (e.type === 'pointerup' && t && e.timeStamp - t.t < 500) {
        if (!t.onImg) { closeLightbox(); return; }
        if (st.s > 1.01) zoomAt(1, t.x, t.y, 'ease');
        else zoomAt(LB_TAP_ZOOM, t.x, t.y, 'ease');
        return;
      }
      settle();
    }
    stage.addEventListener('pointerup', pointerEnd);
    stage.addEventListener('pointercancel', pointerEnd);

    // Wheel: a trackpad pinch (ctrl+wheel) or a mouse wheel zooms; a trackpad
    // two-finger scroll pans once zoomed in (and zooms while still fitted).
    var wheelTimer = 0;
    stage.addEventListener('wheel', function (e) {
      e.preventDefault();
      var p = stagePoint(e);
      var dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY, dx = e.deltaMode === 1 ? e.deltaX * 16 : e.deltaX;
      var mouseWheel = e.deltaMode === 1 || (dx === 0 && Math.abs(dy) >= 50 && dy % 1 === 0);
      if (e.ctrlKey) zoomAt(st.s * Math.exp(-dy * 0.012), p[0], p[1]);
      else if (mouseWheel || st.s <= 1.001) zoomAt(st.s * Math.exp(Math.max(-0.35, Math.min(0.35, -dy * 0.0025))), p[0], p[1], mouseWheel ? 'wheel' : '');
      else {
        st.tx = clampTo(st.tx - dx, range(st.s, 'x'));
        st.ty = clampTo(st.ty - dy, range(st.s, 'y'));
        apply();
      }
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(settle, 160);
    }, { passive: false });

    // Clicks on the dark surround (outside the stage) close it too.
    el.addEventListener('click', function (e) {
      if (e.target === el || e.target.classList.contains('merch-lb__bar') || e.target.classList.contains('merch-lb__tools')) closeLightbox();
    });
    closeBtn.addEventListener('click', closeLightbox);
    btnIn.addEventListener('click', function () { zoomAt(st.s * LB_STEP, st.sw / 2, st.sh / 2, 'ease'); });
    btnOut.addEventListener('click', function () { zoomAt(st.s / LB_STEP, st.sw / 2, st.sh / 2, 'ease'); });

    // On the document (not the dialog) so keys still work if focus has slipped to <body>.
    document.addEventListener('keydown', function (e) {
      if (!lbOpen) return;
      var k = e.key;
      if (k === 'Escape') { e.preventDefault(); closeLightbox(); }
      else if (k === '+' || k === '=') { e.preventDefault(); btnIn.click(); }
      else if (k === '-' || k === '_') { e.preventDefault(); btnOut.click(); }
      else if (k === '0') { e.preventDefault(); zoomAt(1, st.sw / 2, st.sh / 2, 'ease'); }
      else if (/^Arrow/.test(k) && st.s > 1.001) {
        e.preventDefault();
        var d = 90;
        st.tx = clampTo(st.tx + (k === 'ArrowLeft' ? d : k === 'ArrowRight' ? -d : 0), range(st.s, 'x'));
        st.ty = clampTo(st.ty + (k === 'ArrowUp' ? d : k === 'ArrowDown' ? -d : 0), range(st.s, 'y'));
        apply('ease');
      } else if (k === 'Tab') {   // keep focus inside the dialog
        var f = Array.prototype.filter.call(el.querySelectorAll('button'), function (b) { return !b.disabled; });
        var i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });

    window.addEventListener('resize', function () {
      if (!lbOpen) return;
      fit(); settle();
      st.tx = clampTo(st.tx, range(st.s, 'x')); st.ty = clampTo(st.ty, range(st.s, 'y'));
      apply();
    });

    st.fit = fit; st.apply = apply; st.closeBtn = closeBtn;
    return st;
  }

  function openLightbox(section, opener) {
    if (lbOpen || !section.dataset.art) return;
    lb = lb || buildLightbox();
    clearTimeout(lb.closeTimer);
    lbOpen = true;
    lb.opener = opener || document.activeElement;
    lb.artW = +section.dataset.artW || 1;
    lb.artH = +section.dataset.artH || 1;
    lb.sharpUrl = (touchish && section.dataset.artHi) || section.dataset.artFull || '';
    lb.sharpDone = false;
    var num = section.querySelector('.merch-panel__num'), title = section.querySelector('.merch-panel__title');
    var name = title ? title.textContent.replace(/\s+/g, ' ').trim() : '';
    lb.el.querySelector('.merch-lb__num').textContent = num ? num.textContent : '';
    lb.el.querySelector('.merch-lb__name').textContent = name;
    lb.img.alt = name + ': the print artwork';
    lb.img.src = section.dataset.art;

    // Lock the page behind it (keeping the scrollbar's space so nothing shifts),
    // and take it out of reach of the keyboard and screen readers.
    var sbw = window.innerWidth - root.clientWidth;
    root.classList.add('merch-lb-open');
    if (sbw > 0) document.body.style.paddingRight = sbw + 'px';
    lb.inerted = Array.prototype.filter.call(document.body.children, function (c) {
      return c !== lb.el && !c.inert && c.tagName !== 'SCRIPT';
    });
    lb.inerted.forEach(function (c) { c.inert = true; });
    if (cursorOff) cursorOff();

    lb.el.hidden = false;
    lb.fit();
    lb.s = 1; lb.tx = 0; lb.ty = 0;
    lb.apply();
    void lb.el.offsetWidth;   // so the entrance transition runs
    lb.el.classList.add('is-open');
    lb.closeBtn.focus({ preventScroll: true });
  }

  function closeLightbox() {
    if (!lbOpen) return;
    lbOpen = false;
    lb.el.classList.remove('is-open');
    lb.inerted.forEach(function (c) { c.inert = false; });
    lb.inerted = [];
    root.classList.remove('merch-lb-open');
    document.body.style.paddingRight = '';
    lb.closeTimer = setTimeout(function () {
      lb.el.hidden = true;
      lb.img.removeAttribute('src');
    }, reduce ? 0 : 260);
    if (lb.opener && lb.opener.focus) lb.opener.focus({ preventScroll: true });
    reelWakers.forEach(function (w) { w(); });
  }

  var cursorOff = null;   // set below when the drag cursor exists

  /* ---------- The "drag" cursor (mouse/trackpad only; phones just swipe) ---------- */
  if (!fine) return;
  root.classList.add('has-merch-cursor');

  var cur = document.createElement('div');
  cur.className = 'merch-cursor';
  cur.setAttribute('aria-hidden', 'true');
  var chevron = function (d) {
    return '<svg class="merch-cursor__arrow merch-cursor__arrow--' + d + '" width="8" height="12" viewBox="0 0 8 12" fill="none">' +
      '<path d="' + (d === 'l' ? 'M6.5 1.5L2 6l4.5 4.5' : 'M1.5 1.5L6 6l-4.5 4.5') + '" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  };
  cur.innerHTML = '<div class="merch-cursor__dot"><span class="merch-cursor__main">' + chevron('l') + 'Drag' + chevron('r') +
    '</span><span class="merch-cursor__sub">or click to zoom</span></div>';
  document.body.appendChild(cur);

  var mx = 0, my = 0, cx = 0, cy = 0, on = false, curRunning = false;
  var follow = reduce ? 1 : CURSOR_FOLLOW;

  function placeCursor() {
    cur.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
  }
  function curFrame() {
    cx += (mx - cx) * follow;
    cy += (my - cy) * follow;
    placeCursor();
    if (on || Math.abs(mx - cx) + Math.abs(my - cy) > 0.3) requestAnimationFrame(curFrame);
    else curRunning = false;
  }
  function curWake() {
    if (curRunning) return;
    curRunning = true;
    requestAnimationFrame(curFrame);
  }

  window.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    mx = e.clientX; my = e.clientY;
    if (on) curWake();
  }, { passive: true });

  Array.prototype.forEach.call(document.querySelectorAll('.merch-reel'), function (reel) {
    reel.addEventListener('pointerenter', function (e) {
      if (e.pointerType !== 'mouse' || lbOpen) return;
      if (!on) { mx = cx = e.clientX; my = cy = e.clientY; placeCursor(); }   // appear under the mouse, not fly in
      on = true;
      cur.classList.add('is-on');
      curWake();
    });
    reel.addEventListener('pointerleave', function (e) {
      if (e.pointerType !== 'mouse') return;
      on = false;
      cur.classList.remove('is-on', 'is-down');
    });
    reel.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') cur.classList.add('is-down');
    });
  });
  window.addEventListener('pointerup', function () { cur.classList.remove('is-down'); });
  // Leaving the window entirely (e.g. to another app) shouldn't strand the bubble.
  document.addEventListener('mouseleave', function () { on = false; cur.classList.remove('is-on', 'is-down'); });
  cursorOff = function () { on = false; cur.classList.remove('is-on', 'is-down'); };
})();
