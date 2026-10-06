/*
 * Lab page hero: "ideas, dropped in to see what happens".
 *
 * The shapes from across the site (the hero's magnetic shapes, the "What we
 * do" telescope and pencil, the speech bubble, the develop critter…) fall
 * into the Lab one by one and tumble into a pile on the floor, like
 * experiments tipped onto a workbench. Then you can play:
 *
 *   - Grab and throw them (mouse or touch), stack them, knock towers over.
 *   - Combine: push two of the SAME shape together (any sizes) and they merge
 *     into one grown-up version with a little burst, and a fresh idea drops in.
 *     The bench always keeps at least one possible match: if none is left, the
 *     next drop is a twin of a shape already there. It's meant to be easy.
 *   - Click / tap empty space to drop in another idea: the next shape falls
 *     from where you clicked. The oldest quietly fades if the bench gets full.
 *   - The faces (pill, circle, blob) watch the cursor; the pill and blob blink.
 *   - Android phones: tilt the phone and gravity tilts with it (js/hero-tilt.js).
 *   - The headline sits on a slim pane of "glass" they collide with (desktop),
 *     so the copy stays readable; pieces drop in down the sides, at random.
 *
 * Physics: Matter.js (MIT, vendored at js/vendor/). Each body gets a simple
 * convex hull fitted to its art, so they rest and stack believably. The loop
 * only runs while the hero is on screen and pauses when the tab is hidden.
 * Reduced motion: no physics; the shapes sit at rest along the floor.
 */
(function () {
  var hero = document.querySelector('.lab-hero');
  var stage = hero && hero.querySelector('.lab-toys');
  if (!stage) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Each shape: art, w (fraction of the stage's short side), ar (h/w) and a
  // convex hull as 0..1 fractions of its art box.
  var SHAPES = {
    hoops:     { src: 'lab-toy-hoops.svg',     w: 0.30, ar: 0.8824, hull: [0.067,0.195,0.181,0.120,0.450,0.164,0.650,0.261,0.886,0.463,0.931,0.551,0.931,0.793,0.833,0.875,0.544,0.831,0.369,0.749,0.186,0.617,0.067,0.434] },
    pill:      { tpl: 'labToy-pill',      w: 0.30, ar: 0.7953, hull: [0.003,0.290,0.061,0.126,0.172,0.010,0.325,0.028,0.889,0.433,0.989,0.576,0.994,0.705,0.936,0.870,0.825,0.985,0.669,0.967,0.106,0.562,0.031,0.479] },
    pencil:    { src: 'lab-toy-pencil.svg',    w: 0.22, ar: 1.3098, hull: [0.193,0.575,0.557,0.031,0.600,0.019,0.699,0.031,0.906,0.103,0.975,0.161,0.964,0.247,0.597,0.731,0.360,0.856,0.287,0.858,0.200,0.822,0.182,0.781] },
    circle:    { tpl: 'labToy-circle',    w: 0.32, ar: 1.0000, circle: 0.36 },
    bubble:    { src: 'lab-toy-bubble.svg',    w: 0.36, ar: 0.5063, hull: [0.000,0.538,0.081,0.208,0.142,0.132,0.386,0.060,0.789,0.000,0.931,0.137,0.997,0.340,0.969,0.543,0.914,0.603,0.192,0.987,0.119,0.960,0.017,0.686] },
    blob:      { tpl: 'labToy-blob',      w: 0.32, ar: 0.7964, hull: [0.000,0.802,0.214,0.227,0.381,0.073,0.578,0.010,0.781,0.003,0.931,0.056,0.992,0.209,0.786,0.764,0.617,0.924,0.419,0.987,0.217,0.994,0.067,0.942] },
    telescope: { src: 'lab-toy-telescope.svg', w: 0.24, ar: 1.2385, hull: [0.110,0.239,0.451,0.133,0.784,0.061,0.881,0.069,0.932,0.128,0.950,0.183,0.950,0.239,0.781,0.936,0.440,0.978,0.244,0.967,0.237,0.947,0.072,0.292] },
    star:      { src: 'lab-toy-star.svg',      w: 0.24, ar: 1.0676, hull: [0.006,0.361,0.300,0.050,0.486,0.000,0.623,0.033,0.910,0.247,0.988,0.350,0.967,0.564,0.824,0.908,0.697,0.994,0.555,0.986,0.139,0.894,0.015,0.725] },
    triangle:  { src: 'lab-toy-triangle.svg',  w: 0.24, ar: 1.1040, hull: [0.003,0.467,0.163,0.281,0.432,0.078,0.592,0.000,0.715,0.039,0.846,0.303,0.984,0.772,0.997,0.922,0.905,0.997,0.423,0.881,0.074,0.758,0.009,0.667] },
    scribble:  { src: 'lab-toy-scribble.svg',  w: 0.24, ar: 1.0845, hull: [0.021,0.247,0.443,0.008,0.672,0.033,0.825,0.158,0.907,0.275,0.997,0.628,0.982,0.803,0.913,0.961,0.843,0.997,0.289,0.942,0.102,0.683,0.015,0.492] }
  };
  // The opening drop, in order, then click-drops cycle through all of them.
  var ORDER = ['circle', 'pill', 'star', 'telescope', 'bubble', 'triangle', 'pencil', 'blob', 'scribble', 'hoops'];
  // Phones / low-power: fewer bodies and lighter solver passes (the pile still
  // stacks fine; it just costs far less per frame on a mid-range phone).
  var LITE = window.matchMedia('(max-width: 768px), (hover: none)').matches ||
    (navigator.connection && navigator.connection.saveData) || (navigator.hardwareConcurrency || 8) <= 4;
  var MAX_TOYS = LITE ? 11 : 18;   // beyond this, the oldest fades out as new ones drop
  var DROP_GAP = 300;    // ms between shapes in the opening drop
  var SCALE    = 0.24;   // overall size, × the stage's short side × each shape's w
  var GROW     = 1.32;   // size step per merge level
  var MAX_LVL  = 3;      // a level-3 shape is fully grown and won't merge again
  // The opening set holds two of a few shapes, so a first match is findable.
  var OPENING = ['circle', 'pill', 'star', 'telescope', 'bubble', 'star', 'triangle',
    'pencil', 'pill', 'blob', 'scribble', 'hoops'];

  var M = window.Matter;
  function img(name) {
    var s = SHAPES[name];
    if (s.tpl) {
      var t = document.getElementById(s.tpl);
      if (t && t.content) return t.content.firstElementChild.cloneNode(true);
    }
    var el = document.createElement('img');
    el.src = 'img/' + (s.src || 'lab-toy-' + name + '.svg') + '?v=20261006';
    el.alt = ''; el.decoding = 'async'; el.draggable = false;
    return el;
  }

  // --- Reduced motion / no physics: a still line-up along the floor. -------
  if (reduce || !M) {
    var x = 6;
    ORDER.slice(0, 6).forEach(function (n, i) {
      var el = document.createElement('div');
      el.className = 'lab-toy is-static';
      el.style.left = x + '%';
      el.style.width = (SHAPES[n].w * 38) + '%';
      el.style.transform = 'rotate(' + ((i % 2 ? 1 : -1) * (6 + i * 3)) + 'deg)';
      el.appendChild(img(n));
      stage.appendChild(el);
      x += SHAPES[n].w * 30;
    });
    return;
  }

  var E = M.Engine, B = M.Bodies, Bo = M.Body, C = M.Composite, V = M.Vertices;
  var engine = E.create({ enableSleeping: true });
  engine.gravity.y = 1;
  engine.positionIterations = LITE ? 5 : 8;
  engine.velocityIterations = LITE ? 4 : 6;
  var world = engine.world;

  var W = 0, H = 0, unit = 1, walls = [], glass = null, glassBox = null, toys = [];

  function bounds() {
    W = stage.clientWidth; H = stage.clientHeight;
    unit = Math.min(W, H * 1.4) * SCALE;
  }

  // Floor, side walls, a high ceiling (so throws come back), plus the headline "glass".
  function buildWalls() {
    walls.forEach(function (w) { C.remove(world, w); });
    var t = 200;
    walls = [
      B.rectangle(W / 2, H + t / 2, W * 3, t, { isStatic: true }),
      B.rectangle(-t / 2, H / 2 - H, t, H * 4, { isStatic: true }),
      B.rectangle(W + t / 2, H / 2 - H, t, H * 4, { isStatic: true }),
      B.rectangle(W / 2, -H * 1.6, W * 3, t, { isStatic: true })
    ];
    // The glass hugs just the HEADLINE (the label and the small CTA lines can
    // have shapes drift over them, and the CSS halo keeps them legible), inset a
    // little so it's forgiving: shapes slide off its rounded ends rather than
    // all getting stuck on top of the copy.
    var kids = hero.querySelectorAll('.lab-hero__inner .lab-hero__title');
    var sr = stage.getBoundingClientRect(), l = Infinity, t2 = Infinity, r2 = -Infinity, b2 = -Infinity;
    Array.prototype.forEach.call(kids, function (k) {
      var cr = k.getBoundingClientRect();
      if (!cr.width) return;
      l = Math.min(l, cr.left); t2 = Math.min(t2, cr.top); r2 = Math.max(r2, cr.right); b2 = Math.max(b2, cr.bottom);
    });
    // Only on wide screens: there the copy leaves room either side, so the glass
    // works as a shelf. On narrow screens the copy spans the width, so the glass
    // would catch everything up top; instead the shapes fall to the floor behind
    // the text, which sits on a soft field-coloured backing (CSS) to stay readable.
    var wide = W > 760 && (r2 - l) < W * 0.75;
    hero.classList.toggle('is-narrow-bench', !wide);
    if (wide && l < Infinity) {
      var gw = (r2 - l) * 0.86, gh = (b2 - t2) * 0.8;
      glass = B.rectangle((l + r2) / 2 - sr.left, (t2 + b2) / 2 - sr.top, gw, gh,
        { isStatic: true, chamfer: { radius: Math.min(gh / 2, 60) }, friction: 0.05 });
      glassBox = { l: (l + r2) / 2 - sr.left - gw / 2, r: (l + r2) / 2 - sr.left + gw / 2 };
      walls.push(glass);
    } else {
      glassBox = null;
    }
    C.add(world, walls);
  }

  function makeBody(name, x, y, lvl) {
    var s = SHAPES[name], w = unit * s.w * 2.2 * Math.pow(GROW, (lvl || 1) - 1), h = w * s.ar;
    var opts = { restitution: 0.22, friction: 0.6, frictionStatic: 0.8, frictionAir: 0.018, density: 0.0016, sleepThreshold: 30 };
    var body;
    if (s.circle) {
      body = B.circle(x, y, w * s.circle, opts);
    } else {
      var pts = [];
      for (var i = 0; i < s.hull.length; i += 2) pts.push({ x: (s.hull[i] - 0.5) * w, y: (s.hull[i + 1] - 0.5) * h });
      body = B.fromVertices(x, y, [pts], opts);
    }
    // fromVertices re-centres on the hull's centroid; remember the offset so the art lines up.
    var c = s.circle ? { x: 0, y: 0 } : V.centre(body.vertices.map(function (v) { return { x: v.x - x, y: v.y - y }; }));
    return { body: body, w: w, h: h, ox: -c.x, oy: -c.y };
  }

  var dropIdx = 0;
  function drop(name, x, y, spin, lvl) {
    lvl = lvl || 1;
    var made = makeBody(name, x, y, lvl);
    var el = document.createElement('div');
    el.className = 'lab-toy lab-toy--lvl' + lvl;
    el.style.width = made.w.toFixed(1) + 'px';
    el.style.height = made.h.toFixed(1) + 'px';
    el.appendChild(img(name));
    stage.appendChild(el);
    Bo.setAngle(made.body, (Math.random() - 0.5) * 1.2);
    Bo.setAngularVelocity(made.body, spin != null ? spin : (Math.random() - 0.5) * 0.12);
    C.add(world, made.body);
    var toy = { name: name, lvl: lvl, el: el, body: made.body, w: made.w, h: made.h, ox: made.ox, oy: made.oy,
      svg: el.querySelector('svg'), pupils: el.querySelectorAll('.lab-pupil'), looks: el.querySelectorAll('.lab-look'),
      born: performance.now() };
    made.body.plugin = { toy: toy };
    toys.push(toy);
    // Too many on the bench: the oldest fades and is removed.
    if (toys.length > MAX_TOYS) retire(toys.shift());
    wake();
    return toy;
  }
  function retire(t) {
    t.gone = true;
    t.el.classList.add('is-leaving');
    window.setTimeout(function () { C.remove(world, t.body); t.el.remove(); }, 600);
  }

  // Where a new idea drops from: a random lane down either side (never over
  // the headline), just above the top of the stage.
  function lane() {
    var edge = unit * 0.5;
    if (glassBox) {
      var leftW = glassBox.l - edge, rightW = W - edge - glassBox.r;
      var goLeft = Math.random() * (leftW + rightW) < leftW;
      return goLeft ? edge + Math.random() * Math.max(0, leftW - edge)
                    : glassBox.r + edge + Math.random() * Math.max(0, rightW - edge);
    }
    return edge + Math.random() * (W - edge * 2);
  }

  // --- Combine: two of the same SHAPE (any sizes) touching → one grown one. ---
  // Sizes don't need to match (it's a toy, not a puzzle): the result is one
  // size up from the bigger of the two, capped at MAX_LVL. Two fully grown
  // ones still combine (into one), which frees up room on the bench.
  M.Events.on(engine, 'collisionStart', function (ev) {
    ev.pairs.forEach(function (pr) {
      var a = pr.bodyA.plugin && pr.bodyA.plugin.toy, b = pr.bodyB.plugin && pr.bodyB.plugin.toy;
      if (!a || !b || a.gone || b.gone || a.name !== b.name) return;
      // Only merges YOU make: one of the pair is being held, or was just thrown
      // (so the pile settling on its own never steals a match from you).
      var t = performance.now();
      var handled = function (x) { return (grab && grab.toy === x) || t - (x.touched || -1e9) < 2500; };
      if (!handled(a) && !handled(b)) return;
      queueMerge(a, b);
    });
  });
  var pending = [];
  function queueMerge(a, b) { a.gone = b.gone = true; pending.push([a, b]); }
  function doMerges() {
    while (pending.length) {
      var pr = pending.shift(), a = pr[0], b = pr[1];
      var x = (a.body.position.x + b.body.position.x) / 2, y = (a.body.position.y + b.body.position.y) / 2;
      var vx = (a.body.velocity.x + b.body.velocity.x) / 2, vy = (a.body.velocity.y + b.body.velocity.y) / 2;
      [a, b].forEach(function (t) {
        C.remove(world, t.body); t.el.remove();
        var i = toys.indexOf(t); if (i >= 0) toys.splice(i, 1);
      });
      if (grab && (grab.toy === a || grab.toy === b)) letGo();
      var g = drop(a.name, x, y - unit * 0.1, 0, Math.min(MAX_LVL, Math.max(a.lvl, b.lvl) + 1));
      g.touched = performance.now();   // so it can chain straight into another match
      Bo.setVelocity(g.body, { x: vx, y: vy - 3 });   // a little hop as it forms
      g.el.classList.add('is-born');
      burst(x, y, g.w);
      // A fresh idea tops the bench back up.
      setTimeout(function () { drop(nextName(), lane(), -unit * 0.8); }, 450);
      if (window.__ffSayQuip) window.__ffSayQuip(MERGE_QUIPS[mergeCount++ % MERGE_QUIPS.length]);
    }
  }
  var mergeCount = 0;
  var MERGE_QUIPS = ['Ooh, a combo.', 'Bigger idea!', 'Now we\'re cooking.', 'Synergy, but real.', 'Eureka-ish.'];
  // A ring of soft dots that pops outward where two ideas combined.
  function burst(x, y, size) {
    var el = document.createElement('div');
    el.className = 'lab-burst';
    el.style.left = x + 'px'; el.style.top = y + 'px';
    el.style.setProperty('--s', (size * 1.1).toFixed(0) + 'px');
    for (var i = 0; i < 8; i++) {
      var d = document.createElement('i');
      d.style.setProperty('--a', (i * 45) + 'deg');
      el.appendChild(d);
    }
    stage.appendChild(el);
    setTimeout(function () { el.remove(); }, 900);
  }
  if (window.__labTest) { window.__labToys = toys; window.__labWake = function () { wake(); }; }   // headless physics check hook (inert on the site)
  // What drops next. Mostly the next in line, but it always keeps a match on
  // the bench: if no shape currently has a partner, the next drop is a twin of
  // something already there (preferring a shape that isn't fully grown).
  function nextName() {
    var live = toys.filter(function (t) { return !t.gone; });
    var count = {};
    live.forEach(function (t) { count[t.name] = (count[t.name] || 0) + 1; });
    var hasPair = Object.keys(count).some(function (n) { return count[n] >= 2; });
    if (!hasPair && live.length) {
      var pool = live.filter(function (t) { return t.lvl < MAX_LVL; });
      if (!pool.length) pool = live;
      return pool[Math.floor(Math.random() * pool.length)].name;
    }
    return ORDER[dropIdx++ % ORDER.length];
  }

  function render() {
    for (var i = 0; i < toys.length; i++) {
      var t = toys[i], b = t.body;
      var c = Math.cos(b.angle), s = Math.sin(b.angle);
      // Art centre = body position + its centroid offset, rotated with the body.
      var x = b.position.x + t.ox * c - t.oy * s - t.w / 2;
      var y = b.position.y + t.ox * s + t.oy * c - t.h / 2;
      // Held: a soft squish, stretching along the way it's being pulled.
      var sq = '';
      if (t.squish > 0.001 || (grab && grab.toy === t)) {
        var goal = grab && grab.toy === t ? 0.07 + Math.min(0.1, Math.hypot(b.velocity.x, b.velocity.y) * 0.006) : 0;
        t.squishV = (t.squishV || 0) + ((goal - (t.squish || 0)) * 0.28 - (t.squishV || 0) * 0.32);
        t.squish = Math.max(0, (t.squish || 0) + t.squishV);
        var dir = Math.atan2(b.velocity.y, b.velocity.x) - b.angle;
        if (Math.hypot(b.velocity.x, b.velocity.y) < 0.4) dir = Math.PI / 2 - b.angle;   // still: squash down
        sq = ' rotate(' + dir.toFixed(3) + 'rad) scale(' + (1 + t.squish).toFixed(3) + ',' + (1 - t.squish * 0.8).toFixed(3) + ') rotate(' + (-dir).toFixed(3) + 'rad)';
      }
      t.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + b.angle.toFixed(4) + 'rad)' + sq;
      if (t.svg && (t.pupils.length || t.looks.length)) aimEyes(t, b);
    }
  }

  // Faces watch the cursor. The cursor is turned into the shape's own (rotated)
  // art space, so the eyes look the right way however the shape has tumbled.
  var eyeTarget = null;
  function aimEyes(t, b) {
    var vb = t.svg.viewBox.baseVal, k = vb.width / t.w;   // art units per px
    var c = Math.cos(-b.angle), s = Math.sin(-b.angle);
    function toArt(cx, cy) {
      if (!eyeTarget) return null;
      var dx = eyeTarget.x - b.position.x, dy = eyeTarget.y - b.position.y;
      return { x: (dx * c - dy * s) * k, y: (dx * s + dy * c) * k };
    }
    var v = toArt();
    Array.prototype.forEach.call(t.pupils, function (p) {
      var rx = +p.getAttribute('data-cx'), ry = +p.getAttribute('data-cy');
      var px = +p.getAttribute('data-px'), py = +p.getAttribute('data-py'), max = +p.getAttribute('data-max');
      var ox = px - rx, oy = py - ry;   // rest offset from the socket centre
      if (v) {
        // Socket centre relative to the art centre, then the direction to the cursor.
        var sx = rx - vb.width / 2, sy = ry - vb.height / 2;
        var dx = v.x - sx, dy = v.y - sy, d = Math.hypot(dx, dy) || 1;
        var reach = Math.min(max, d * 0.2);
        ox = dx / d * reach; oy = dy / d * reach;
      }
      p.setAttribute('transform', 'translate(' + (ox - (px - rx)).toFixed(1) + ' ' + (oy - (py - ry)).toFixed(1) + ')');
    });
    Array.prototype.forEach.call(t.looks, function (g) {
      var max = +g.getAttribute('data-max'), ox = 0, oy = 0;
      if (v) { var d = Math.hypot(v.x, v.y) || 1, r = Math.min(max, d * 0.08); ox = v.x / d * r; oy = v.y / d * r; }
      g.setAttribute('transform', 'translate(' + ox.toFixed(1) + ' ' + oy.toFixed(1) + ')');
    });
  }
  // Blinks: every few seconds a random face blinks (the closed-eyed circle can't).
  function blink() {
    if (on) {
      var faces = toys.filter(function (t) { return !t.gone && t.el.querySelector('.lab-eye'); });
      var f = faces[Math.floor(Math.random() * faces.length)];
      if (f) {
        f.el.classList.remove('is-blinking'); void f.el.offsetWidth; f.el.classList.add('is-blinking');
        setTimeout(function () { f.el.classList.remove('is-blinking'); }, 260);
      }
    }
    setTimeout(blink, 1800 + Math.random() * 2600);
  }
  setTimeout(blink, 2500);

  // --- Grab, throw, drop -----------------------------------------------------
  var grab = null;   // { toy, constraint, px, py, moved }
  function local(e) {
    var r = stage.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function toyAt(p) {
    var bodies = toys.map(function (t) { return t.body; });
    var hit = M.Query.point(bodies, p)[0];
    if (!hit) return null;
    for (var i = 0; i < toys.length; i++) if (toys[i].body === hit) return toys[i];
    return null;
  }
  hero.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 || e.target.closest('a, button, .theme-switch, .site-nav')) return;
    var p = local(e), t = toyAt(p);
    if (t) {
      e.preventDefault();
      M.Sleeping.set(t.body, false);
      var c = M.Constraint.create({
        pointA: { x: p.x, y: p.y }, bodyB: t.body,
        pointB: { x: p.x - t.body.position.x, y: p.y - t.body.position.y },
        stiffness: 0.18, damping: 0.08, length: 0
      });
      C.add(world, c);
      grab = { toy: t, c: c, id: e.pointerId };
      t.touched = performance.now();
      t.el.classList.add('is-held');
      hero.classList.add('is-grabbing');
      try { hero.setPointerCapture(e.pointerId); } catch (_) {}
      wake();
    } else if (!e.target.closest('.lab-hero__inner')) {
      // Empty space: drop the next idea in from above the click.
      // (over the headline's glass, it falls from the nearest side instead)
      var dx = glassBox && p.x > glassBox.l && p.x < glassBox.r ? lane() : p.x;
      drop(nextName(), dx, Math.min(p.y, H * 0.25) - unit * 0.6);
    }
  });
  hero.addEventListener('pointermove', function (e) {
    if (grab && e.pointerId === grab.id) {
      var p = local(e);
      grab.c.pointA = { x: p.x, y: p.y };
      wake();
    } else if (!grab) {
      hero.classList.toggle('is-over-toy', !!toyAt(local(e)));
    }
    eyeTarget = local(e);
    if (!running) render();   // eyes follow even while the pile is asleep
  });
  hero.addEventListener('pointerleave', function () { eyeTarget = null; render(); });
  function letGo(e) {
    if (!grab || (e && e.pointerId != null && e.pointerId !== grab.id)) return;
    C.remove(world, grab.c);
    grab.toy.touched = performance.now();   // still "yours" for a moment after you let go
    grab.toy.el.classList.remove('is-held');
    hero.classList.remove('is-grabbing');
    grab = null;
  }
  hero.addEventListener('pointerup', letGo);
  hero.addEventListener('pointercancel', letGo);
  // Touch: only stop the page scrolling while actually holding a shape.
  hero.addEventListener('touchmove', function (e) { if (grab) e.preventDefault(); }, { passive: false });

  // Android tilt: gravity follows the phone (gently, and never fully upside down).
  window.addEventListener('ff-tilt-n', function (e) {
    var d = e.detail;
    var gx = d ? d.nx * 0.9 : 0, gy = d ? 1 + Math.max(-0.6, d.ny * 0.6) : 1;
    if (Math.abs(engine.gravity.x - gx) > 0.02 || Math.abs(engine.gravity.y - gy) > 0.02) {
      engine.gravity.x = gx; engine.gravity.y = gy;
      toys.forEach(function (t) { M.Sleeping.set(t.body, false); });
      wake();
    }
  });

  // --- Loop: runs while the hero is visible and anything is awake ------------
  var on = false, running = false, last = 0, stillFrames = 0, acc = 0, STEP = 1000 / 60;
  function wake() { stillFrames = 0; kick(); }
  function kick() {
    if (running || !on || document.hidden) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }
  function loop(now) {
    if (!on || document.hidden) { running = false; return; }
    var dt = Math.min(now - last, 1000 / 20);
    last = now;
    // Fixed 1/60s sub-steps keep stacking stable on any refresh rate.
    acc += dt;
    while (acc >= STEP) { E.update(engine, STEP); acc -= STEP; }
    if (pending.length) doMerges();
    render();
    // Everything asleep and nothing held: stop the loop until something changes.
    var awake = grab || toys.some(function (t) { return !t.body.isSleeping; });
    stillFrames = awake ? 0 : stillFrames + 1;
    if (stillFrames > 30) { running = false; return; }
    requestAnimationFrame(loop);
  }
  new IntersectionObserver(function (es) { on = es[0].isIntersecting; if (on) wake(); }).observe(hero);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) wake(); });

  // Resize: rebuild the walls and glass, nudge anything now out of bounds back in.
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      bounds(); buildWalls();
      toys.forEach(function (t) {
        var p = t.body.position;
        Bo.setPosition(t.body, { x: Math.max(t.w / 2, Math.min(W - t.w / 2, p.x)), y: Math.min(p.y, H - t.h / 2) });
        M.Sleeping.set(t.body, false);
      });
      wake();
    }, 150);
  }, { passive: true });

  // --- Opening drop: once the hero is first seen, ideas tumble in. -----------
  bounds(); buildWalls();
  var started = false;
  new IntersectionObserver(function (es, io) {
    if (!es[0].isIntersecting || started) return;
    started = true; io.disconnect();
    // Fonts settle the headline's size: rebuild the glass once they're in.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { buildWalls(); wake(); });
    (LITE ? OPENING.slice(0, 9) : OPENING).forEach(function (name, i) {
      setTimeout(function () {
        drop(name, lane(), -unit * (0.8 + Math.random() * 0.8));
      }, 500 + i * DROP_GAP + Math.random() * 120);
    });
  }, { threshold: 0.2 }).observe(hero);
})();
