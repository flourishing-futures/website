/*
 * Community hero — "the campfire".
 *
 * The site's shapes (the circle, pill and blob faces plus the star, triangle
 * and hoops) sit in a ring around a little campfire under the headline. How
 * big the fire burns depends on how many of them are gathered round it.
 *
 *   - On first view the fire is a small flicker and the shapes hop in from
 *     both sides, one by one, to take their seats. The fire grows as each
 *     arrives and flares when the circle is complete.
 *   - Bring the cursor close and they shy away from it (a fast pass startles
 *     them more). Take it away and, after a beat, each one hops back to its
 *     seat. Heavy, mellow shapes are slow to leave and slow to return; light
 *     ones dart off and are first back.
 *   - Click (or tap) to scatter everyone. They come back in a new order, the
 *     fire dims while they're away, and it flares when the last one sits down.
 *     The first time that happens, Flofu cheers.
 *   - The faces watch the fire, and glance at the cursor when it comes near.
 *     They blink now and then.
 *
 * The shapes never settle over the copy: the headline block is a soft obstacle
 * they get nudged out of. Android tilt (js/hero-tilt.js) is a breeze that leans
 * the flames and shifts the ring a little. The loop only runs while the hero
 * is on screen, and sleeps once everyone has settled (the flame flicker,
 * embers, idle bob and blinks are CSS, so they cost no script time).
 * Reduced motion: everyone sits round a full fire, still.
 */
(function () {
  var hero = document.querySelector('.cmty-hero');
  var camp = hero && hero.querySelector('.cmty-camp');
  if (!camp) return;
  var spot = hero.querySelector('.cmty-camp__spot');
  var copy = hero.querySelector('.cmty-hero__inner');
  var fireEl = camp.querySelector('.cmty-fire');
  var flamesEl = camp.querySelector('.cmty-fire__flames');
  var embersEl = camp.querySelector('.cmty-fire__embers');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Tunables ---------------------------------------------------------------
  // Seats round the fire, in degrees (0 = right, 90 = straight in front). The
  // front-middle is left empty so the fire stays in view.
  var SEATS = [0, 52, 128, 180, 232, 308];

  // Each shape's temperament.
  //   size  – drawn width × the base shape size (the circle's art has padding)
  //   ar    – art height ÷ width
  //   mass  – how hard pushes and the click scatter move it
  //   flee  – how strongly it shies from the cursor
  //   home  – spring back to its seat (1/s²); higher = snappier
  //   zeta  – damping on the way home; low = overshoots its seat and bounces
  //   shy   – seconds it waits after a fright before heading back
  //   hop   – how high it hops while travelling
  //   squish – stretch with speed
  //   lean  – how far it tilts into its direction of travel
  var SHAPES = {
    // Sleepy and heavy: barely moves for the cursor, ambles back last.
    circle:   { size: 1.30, ar: 1,          mass: 2.6, flee: 0.55, home: 5,  zeta: 0.8,  shy: 1.3,  hop: 0.45, squish: 0.35, lean: 0.5 },
    // Curious: darts off, first back, bobs at its seat.
    pill:     { size: 1.02, ar: 987 / 1241, mass: 0.9, flee: 1.1,  home: 15, zeta: 0.5,  shy: 0.35, hop: 1.0,  squish: 0.5,  lean: 0.9 },
    // Floppy: lazy, then jelly-wobbles into its seat.
    blob:     { size: 1.10, ar: 1099 / 1380, mass: 1.2, flee: 0.9, home: 7,  zeta: 0.38, shy: 0.8,  hop: 0.75, squish: 1.0,  lean: 0.7 },
    // Twitchy: the first to bolt and the first to come back.
    star:     { size: 0.86, ar: 916 / 858,  mass: 1,   flee: 1.4,  home: 17, zeta: 0.42, shy: 0.2,  hop: 1.2,  squish: 0.3,  lean: 1.3 },
    // Stiff and tippy: hardly squashes, leans a lot.
    triangle: { size: 0.86, ar: 966 / 875,  mass: 1.5, flee: 1.0,  home: 10, zeta: 0.5,  shy: 0.6,  hop: 0.7,  squish: 0.12, lean: 1.8 },
    // Rubber bands: springiest, overshoots and boings.
    hoops:    { size: 0.96, ar: 968 / 1097, mass: 0.7, flee: 1.2,  home: 20, zeta: 0.25, shy: 0.3,  hop: 1.4,  squish: 0.9,  lean: 1.0 }
  };

  var FLEE      = 9000;  // px/s²: push from the cursor at point-blank range (mass 1)
  var FLEE_R    = 1.7;   // cursor reach, × the shape size (plus 30px)
  var STARTLE   = 1500;  // px/s of cursor speed that doubles the push
  var SCATTER   = 1500;  // px/s: click fling for a mass-1 shape right next to it
  var SCATTER_WAIT = 0.5;  // s: extra pause after a click before they regroup
  var RAMP      = 0.8;   // s: how gently the pull home fades in
  var FRICTION  = 2.4;   // 1/s: how quickly a fleeing shape coasts to a stop
  var MAX_V     = 2400;  // px/s speed cap
  var HOME_V    = 760;   // px/s: walking pace on the way back (light shapes go a bit faster)
  var GLASS     = 90;    // 1/s²: soft push out from behind the copy
  var SETTLE    = 6;     // 1/s: extra brake on the last little sway in the seat...
  var SETTLE_V  = 60;    // px/s: ...once it's moving slower than this
  var K_ROT     = 60, Z_ROT = 0.3;   // tilt spring: a slightly wobbly pendulum
  var HEAT_UP   = 0.9;   // s: fire grows back this slowly as shapes return...
  var HEAT_DOWN = 0.35;  // s: ...and dims this quickly when they leave
  var LOOK_R    = 4.5;   // the faces glance at the cursor within this × shape size
  var ARRIVE_GAP = 0.28; // s between each shape hopping in on first view
  var HOP_LEN   = 2.2;   // distance covered per hop, × the shape size
  var CHEERS    = ['Everyone’s back!', 'Group hug!', 'The gang’s all here.'];

  // --- Shapes -----------------------------------------------------------------
  var pals = [];
  Array.prototype.forEach.call(camp.querySelectorAll('.cmty-pal'), function (el, i) {
    var def = SHAPES[el.getAttribute('data-shape')];
    if (!def) return;
    var svg = el.querySelector('svg');
    pals.push({
      el: el, def: def, seat: i, svg: svg,
      pupils: el.querySelectorAll('.pal-pupil'), looks: el.querySelectorAll('.pal-look'),
      x: 0, y: 0, vx: 0, vy: 0, ang: 0, av: 0,
      calmAt: 0, ready: 1, travel: 0, hopAmt: 0, w: 0, h: 0,
      sx: 0, sy: 0, tf: '', z: -1, seated: 0
    });
  });
  if (!pals.length) return;

  // --- Layout (measured on resize, never inside the loop) ----------------------
  var W = 0, H = 0, S = 0, cx = 0, cy = 0, rx = 0, ry = 0, F = 0;
  var heroTop = 0, heroLeft = 0, glass = null;
  var scrollY = window.scrollY;
  window.addEventListener('scroll', function () { scrollY = window.scrollY; }, { passive: true });

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smooth(a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

  function measure() {
    var r = hero.getBoundingClientRect();
    if (!r.width || !r.height) return false;   // hidden (e.g. the Government theme)
    scrollY = window.scrollY;
    W = r.width; H = r.height;
    heroTop = r.top + scrollY; heroLeft = r.left + window.scrollX;
    var c = copy.getBoundingClientRect(), s = spot.getBoundingClientRect();
    glass = { l: c.left - r.left, t: c.top - r.top, r: c.right - r.left, b: c.bottom - r.top };
    S  = clamp(Math.min(s.height * 0.36, W * 0.13), 52, 118);
    rx = Math.min(W * 0.42 - S / 2, S * 3.9);
    ry = Math.max(rx * 0.26, S * 0.55);
    F  = S * 1.55;
    cx = W / 2;
    // The ring's back row must clear the copy.
    cy = Math.max(s.top - r.top + s.height * 0.58, glass.b + ry + S * 0.95);
    var fh = F * 1.125;
    fireEl.style.width = F.toFixed(1) + 'px';
    fireEl.style.height = fh.toFixed(1) + 'px';
    fireEl.style.transform = 'translate3d(' + (cx - F / 2).toFixed(1) + 'px,' + (cy - fh * 0.87).toFixed(1) + 'px,0)';
    embersEl.style.setProperty('--rise', (-fh * 0.9).toFixed(0) + 'px');
    pals.forEach(function (p) {
      p.w = S * p.def.size; p.h = p.w * p.def.ar;
      p.el.style.width = p.w.toFixed(1) + 'px';
      p.el.style.height = p.h.toFixed(1) + 'px';
      p.el.style.marginLeft = (-p.w / 2).toFixed(1) + 'px';
      p.el.style.marginTop = (-p.h / 2).toFixed(1) + 'px';
    });
    camp.classList.add('is-ready');
    return true;
  }

  // Shapes higher up the hero are "further away", so they draw a little smaller.
  function depth(y) { return clamp(0.84 + 0.26 * (y - (cy - ry)) / (2 * ry), 0.72, 1.18); }

  var wind = 0;   // -1..1 from Android tilt
  function seatOf(p) {
    var a = SEATS[p.seat] * Math.PI / 180;
    var gx = cx + Math.cos(a) * rx + wind * S * 0.25;
    var gy = cy + Math.sin(a) * ry;
    // Sit on the ground: centre is half a (scaled) shape above the seat.
    return { x: gx, y: gy - p.h * depth(gy) * 0.45 };
  }

  // --- Input ------------------------------------------------------------------
  var ptr = null, ptrSpeed = 0, lastMove = null;
  function local(cxp, cyp) { return { x: cxp - heroLeft + window.scrollX, y: cyp + scrollY - heroTop }; }
  function inGlass(q) { return glass && q.x > glass.l && q.x < glass.r && q.y > glass.t && q.y < glass.b; }

  function scatter(q, strength) {
    var order = SEATS.map(function (_, i) { return i; });
    for (var i = order.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = order[i]; order[i] = order[j]; order[j] = t; }
    pals.forEach(function (p, k) {
      var dx = p.x - q.x, dy = p.y - q.y, d = Math.hypot(dx, dy) || 1;
      var f = SCATTER * strength / (1 + d / (S * 4)) / Math.sqrt(p.def.mass);
      var tang = (Math.random() - 0.5) * 0.6;
      p.vx += (dx / d - dy / d * tang) * f;
      p.vy += (dy / d + dx / d * tang) * f - f * 0.25;   // a little upward pop
      p.av += (Math.random() - 0.5) * 9 * strength;
      p.calmAt = clock + p.def.shy + SCATTER_WAIT + Math.random() * 0.5;
      p.seat = order[k];
    });
    scattered = true;
    puff(4);
    wake();
  }

  if (!reduce) {
    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var q = local(e.clientX, e.clientY), now = performance.now();
      if (lastMove) {
        var dt = Math.max((now - lastMove.t) / 1000, 0.008);
        ptrSpeed = Math.max(ptrSpeed * 0.7, Math.hypot(q.x - lastMove.x, q.y - lastMove.y) / dt);
      }
      lastMove = { x: q.x, y: q.y, t: now };
      ptr = q;
      wake();
    });
    hero.addEventListener('pointerleave', function (e) {
      if (e.pointerType !== 'mouse') return;
      ptr = null; lastMove = null; wake();
    });
    // click, not pointerdown, so a finger that starts a scroll doesn't scatter them.
    hero.addEventListener('click', function (e) {
      var q = local(e.clientX, e.clientY);
      if (inGlass(q)) return;   // leave the copy free for selecting text
      scatter(q, 1);
    });
    // A finger pushes them about while it's down (scrolling isn't blocked).
    hero.addEventListener('touchmove', function (e) {
      var t = e.touches[0]; ptr = local(t.clientX, t.clientY); ptrSpeed = 0; wake();
    }, { passive: true });
    ['touchend', 'touchcancel'].forEach(function (n) {
      hero.addEventListener(n, function () { ptr = null; wake(); }, { passive: true });
    });
    window.addEventListener('ff-tilt-n', function (e) {
      var nx = e.detail ? e.detail.nx : 0;
      if (Math.abs(nx - wind) > 0.01) { wind = nx; wake(); }
    });
  }

  // --- Fire -------------------------------------------------------------------
  var heat = 0.15, heatW = -1, emberW = -1, windW = 0, scattered = false, cheered = false, cold = true;

  function puff(n) {
    for (var i = 0; i < n; i++) {
      var s = document.createElement('i');
      s.className = 'cmty-spark';
      s.style.setProperty('--dx', ((Math.random() - 0.5) * F * 0.9).toFixed(0) + 'px');
      s.style.setProperty('--dy', (-(0.5 + Math.random() * 0.6) * F).toFixed(0) + 'px');
      s.style.animationDelay = (i * 0.05).toFixed(2) + 's';
      embersEl.appendChild(s);
      setTimeout(function (el) { el.remove(); }.bind(null, s), 1300);
    }
  }
  function flare() {
    flamesEl.classList.remove('is-flaring'); void flamesEl.offsetWidth; flamesEl.classList.add('is-flaring');
    puff(8);
    if (scattered && !cheered && window.__ffSayQuip) {
      cheered = true;
      window.__ffSayQuip(CHEERS[Math.floor(Math.random() * CHEERS.length)], 2400);
    }
  }
  flamesEl.addEventListener('animationend', function () { flamesEl.classList.remove('is-flaring'); });

  function drawFire() {
    var s = 0.42 + 0.58 * heat, lean = (wind * -7).toFixed(1);
    if (Math.abs(s - heatW) > 0.002 || lean !== windW) {
      heatW = s; windW = lean;
      flamesEl.style.transform = 'skewX(' + lean + 'deg) scale(' + s.toFixed(3) + ')';
    }
    var o = (heat * heat).toFixed(2);
    if (o !== emberW) { emberW = o; embersEl.style.opacity = o; }
  }

  // --- Faces ------------------------------------------------------------------
  // Pupils move inside their sockets; whole "look" groups (the closed eyes,
  // the blob's eyes) shift a touch. The target is turned into the shape's own
  // rotated art space so they look the right way however it has tipped.
  function aimEyes(p, dz, tx, ty) {
    if (!p.svg) return;
    var vb = p.svg.viewBox.baseVal, k = vb.width / (p.w * dz);
    var c = Math.cos(-p.ang), s = Math.sin(-p.ang);
    var dx = tx - p.x, dy = ty - p.y;
    var vx = (dx * c - dy * s) * k, vy = (dx * s + dy * c) * k;
    var q = 2 / k;   // snap to half a screen pixel, in art units
    Array.prototype.forEach.call(p.pupils, function (el) {
      var rx0 = +el.getAttribute('data-cx'), ry0 = +el.getAttribute('data-cy');
      var px = +el.getAttribute('data-px'), py = +el.getAttribute('data-py'), max = +el.getAttribute('data-max');
      var ex = vx - (rx0 - vb.width / 2), ey = vy - (ry0 - vb.height / 2), d = Math.hypot(ex, ey) || 1;
      var reach = Math.min(max, d * 0.2);
      var ox = ex / d * reach - (px - rx0), oy = ey / d * reach - (py - ry0);
      var tf = 'translate(' + (Math.round(ox * q) / q).toFixed(1) + ' ' + (Math.round(oy * q) / q).toFixed(1) + ')';
      if (tf !== el._tf) { el.setAttribute('transform', tf); el._tf = tf; }
    });
    Array.prototype.forEach.call(p.looks, function (g) {
      var max = +g.getAttribute('data-max'), d = Math.hypot(vx, vy) || 1, r = Math.min(max, d * 0.08);
      var tf = 'translate(' + (Math.round(vx / d * r * q) / q).toFixed(1) + ' ' + (Math.round(vy / d * r * q) / q).toFixed(1) + ')';
      if (tf !== g._tf) { g.setAttribute('transform', tf); g._tf = tf; }
    });
  }

  function blink() {
    if (on && !reduce) {
      var faces = pals.filter(function (p) { return p.el.querySelector('.pal-eye'); });
      var f = faces[Math.floor(Math.random() * faces.length)];
      if (f) {
        f.el.classList.remove('is-blinking'); void f.el.offsetWidth; f.el.classList.add('is-blinking');
        setTimeout(function () { f.el.classList.remove('is-blinking'); }, 260);
      }
    }
    setTimeout(blink, 1800 + Math.random() * 2600);
  }

  // --- Simulation -------------------------------------------------------------
  var clock = 0;

  function step(dt) {
    var reach = S * FLEE_R + 30;
    var startle = 1 + Math.min(ptrSpeed / STARTLE, 1.5);
    var seatedSum = 0;
    for (var i = 0; i < pals.length; i++) {
      var p = pals[i], d = p.def, seat = seatOf(p);
      var ax = 0, ay = 0;

      // Shy away from the cursor.
      if (ptr) {
        var dx = p.x - ptr.x, dy = p.y - ptr.y, dist = Math.hypot(dx, dy) || 1;
        if (dist < reach) {
          var f = FLEE * d.flee * startle / d.mass * Math.pow(1 - dist / reach, 2);
          ax += dx / dist * f; ay += dy / dist * f;
          // A real fright (close, or a moving cursor) puts off going home. A
          // cursor held still just keeps them at a polite distance.
          if (f > 1500 || (f > 200 && ptrSpeed > 40)) p.calmAt = Math.max(p.calmAt, clock + d.shy);
        }
      }

      // Head home once calm: the pull fades in gently, and fades out quickly
      // (not instantly) when they're startled again.
      var want = clock >= p.calmAt ? 1 : 0;
      p.ready += (want - p.ready) * (1 - Math.exp(-dt / (want ? RAMP * 0.5 : 0.12)));
      var ready = smooth(0, 1, p.ready);
      var hx = seat.x - p.x, hy = seat.y - p.y;
      if (ready > 0) {
        var k = d.home * ready, damp = 2 * d.zeta * Math.sqrt(d.home) * ready;
        // Once it's slow and nearly in its seat, brake the last little sway
        // so it settles instead of rocking for ages.
        if (Math.abs(p.vx) + Math.abs(p.vy) < SETTLE_V && Math.abs(hx) + Math.abs(hy) < S * 0.3) damp += SETTLE * ready;
        ax += hx * k - p.vx * damp; ay += hy * k - p.vy * damp;
      }
      var fr = Math.exp(-FRICTION * (1 - ready) * dt);
      p.vx *= fr; p.vy *= fr;

      // The copy is soft glass they get nudged out from behind. There are no
      // walls: a hard scatter can send someone off the edge, and they hop back.
      if (glass) {
        var gl = glass.l - p.w * 0.45, gr = glass.r + p.w * 0.45, gt = glass.t - p.h * 0.45, gb = glass.b + p.h * 0.45;
        if (p.x > gl && p.x < gr && p.y > gt && p.y < gb) {
          var pl = p.x - gl, pr = gr - p.x, pt = p.y - gt, pb = gb - p.y, mn = Math.min(pl, pr, pt, pb);
          if (mn === pb) ay += pb * GLASS; else if (mn === pt) ay -= pt * GLASS;
          else if (mn === pl) ax -= pl * GLASS; else ax += pr * GLASS;
        }
      }

      // Don't stack on top of each other.
      for (var j = i + 1; j < pals.length; j++) {
        var o = pals[j], ox = p.x - o.x, oy = p.y - o.y, od = Math.hypot(ox, oy) || 1;
        var gap = (p.w + o.w) * 0.42 - od;
        if (gap > 0) {
          var push = gap * 30 / od;
          ax += ox * push / d.mass; ay += oy * push / d.mass;
          o.vx -= ox * push / o.def.mass * dt; o.vy -= oy * push / o.def.mass * dt;
        }
      }

      p.vx += ax * dt; p.vy += ay * dt;
      var sp = Math.hypot(p.vx, p.vy);
      // Walk home at a sensible pace rather than rocketing back.
      var cap = ready > 0.5 && !ptr ? HOME_V * (0.8 + 0.4 / d.mass) : MAX_V;
      if (sp > cap) { p.vx *= cap / sp; p.vy *= cap / sp; sp = cap; }
      p.x += p.vx * dt; p.y += p.vy * dt;

      // Lean into the direction of travel; a scatter can set it spinning.
      var target = clamp(p.vx / 1000 * d.lean * 0.35 + wind * 0.12, -0.6, 0.6);
      p.av += (-K_ROT * (p.ang - target) - 2 * Z_ROT * Math.sqrt(K_ROT) * p.av) * dt;
      p.ang += p.av * dt;

      // Hop while travelling.
      p.travel += sp * dt;
      var hopGoal = clamp((sp - 60) / 400, 0, 1) * d.hop;
      p.hopAmt += (hopGoal - p.hopAmt) * (1 - Math.exp(-dt / 0.15));

      var hd = Math.hypot(hx, hy);
      p.seated = 1 - smooth(S * 0.35, S * 2.5, hd);
      seatedSum += p.seated;
    }
    // Fire follows how gathered everyone is.
    var goal = seatedSum / pals.length;
    heat += (goal - heat) * (1 - Math.exp(-dt / (goal > heat ? HEAT_UP : HEAT_DOWN)));
    if (heat < 0.6) cold = true;
    else if (cold && heat > 0.97) { cold = false; flare(); }
    ptrSpeed *= Math.exp(-dt * 6);
  }

  function draw() {
    var order = pals.slice().sort(function (a, b) { return a.y - b.y; });
    var lookFire = { x: cx, y: cy - F * 0.45 };
    for (var r = 0; r < order.length; r++) {
      var p = order[r], d = p.def, dz = depth(p.y);
      var sp = Math.hypot(p.vx, p.vy);
      var hopY = -Math.abs(Math.sin(p.travel / (S * HOP_LEN) * Math.PI)) * S * 0.2 * p.hopAmt;
      var st = Math.min(0.22, sp / 2200) * d.squish;
      var dir = Math.atan2(p.vy, p.vx) - p.ang;
      var tf = 'translate3d(' + p.x.toFixed(1) + 'px,' + (p.y + hopY).toFixed(1) + 'px,0) scale(' + dz.toFixed(3) + ') rotate(' + p.ang.toFixed(3) + 'rad)';
      if (st > 0.004) tf += ' rotate(' + dir.toFixed(2) + 'rad) scale(' + (1 + st).toFixed(3) + ',' + (1 - st * 0.7).toFixed(3) + ') rotate(' + (-dir).toFixed(2) + 'rad)';
      if (tf !== p.tf) { p.el.style.transform = tf; p.tf = tf; }
      // Behind the fire or in front of it, then back-to-front among themselves.
      var z = (p.y + p.h * dz * 0.45 < cy - 2 ? 10 : 30) + r;
      if (z !== p.z) { p.el.style.zIndex = z; p.z = z; }
      var t = ptr && Math.hypot(ptr.x - p.x, ptr.y - p.y) < S * LOOK_R ? ptr : lookFire;
      aimEyes(p, dz, t.x, t.y);
    }
    drawFire();
  }

  function settled() {
    if (ptrSpeed > 5) return false;
    var goal = 0;
    for (var i = 0; i < pals.length; i++) {
      var p = pals[i], s = seatOf(p);
      if (Math.abs(p.vx) + Math.abs(p.vy) > 3 || Math.abs(p.av) > 0.01 || Math.abs(p.ang) > 0.004 && !wind) return false;
      if (p.ready < 0.999 && clock < p.calmAt + 4) return false;
      if (Math.abs(p.x - s.x) + Math.abs(p.y - s.y) > 1 && clock < p.calmAt + RAMP + 4) return false;
      goal += p.seated;
    }
    goal /= pals.length;
    if (Math.abs(goal - heat) > 0.02) return false;
    heat = goal; draw();   // close enough: land the fire on its final size
    return true;
  }

  // --- Loop: only while on screen, asleep once settled -------------------------
  var on = false, running = false, last = 0, started = false;
  function wake() {
    if (running || !on || document.hidden || reduce || !W) return;
    running = true; last = performance.now();
    requestAnimationFrame(frame);
  }
  function frame(now) {
    if (!on || document.hidden) { running = false; return; }
    var dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    var n = Math.ceil(dt / (1 / 120)), h = dt / n;
    for (var i = 0; i < n; i++) { clock += h; step(h); }
    draw();
    if (settled()) { running = false; return; }
    requestAnimationFrame(frame);
  }

  // First view: everyone hops in from the side nearest their seat.
  function arrive() {
    started = true;
    var order = pals.slice().sort(function (a, b) { return SEATS[a.seat] % 180 - SEATS[b.seat] % 180; });
    order.forEach(function (p, i) {
      var s = seatOf(p), left = s.x < cx;
      var off = p.w * (1 + i * 0.7);   // queued up off stage, so they don't start on top of each other
      p.x = left ? -off : W + off;
      p.y = cy + ry * (0.2 + 0.15 * (i % 3));
      p.calmAt = clock + 0.25 + i * ARRIVE_GAP; p.ready = 0;
    });
  }
  function sitAll() {
    pals.forEach(function (p) { var s = seatOf(p); p.x = s.x; p.y = s.y; p.vx = p.vy = p.av = p.ang = 0; p.seated = 1; p.ready = 1; });
  }

  function relayout() {
    var was = W;
    if (!measure()) return;
    if (reduce) { sitAll(); heat = 1; draw(); return; }
    if (!was && !started && on) arrive();
    draw();
    wake();
  }

  if (window.IntersectionObserver) {
    new IntersectionObserver(function (es) {
      on = es[es.length - 1].isIntersecting;
      camp.classList.toggle('is-paused', !on);
      if (on && !started && !reduce && W) arrive();
      wake();
    }).observe(hero);
  } else { on = true; }
  document.addEventListener('visibilitychange', function () {
    camp.classList.toggle('is-paused', document.hidden || !on);
    wake();
  });

  window.addEventListener('resize', relayout, { passive: true });
  window.addEventListener('load', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  if (window.ResizeObserver) new ResizeObserver(relayout).observe(hero);
  // The copy fades up into place; re-measure the glass once it has landed.
  setTimeout(relayout, 1400);

  measure();
  if (reduce) { sitAll(); heat = 1; }
  else { pals.forEach(function (p) { p.x = -9999; p.y = cy; }); }
  draw();
  if (!reduce) setTimeout(blink, 2500);
})();
