(() => {
  "use strict";
  const WORKS = window.WORKS || [];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduced) document.body.classList.add("js");
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const IMG = "assets/img/";
  $("#year").textContent = new Date().getFullYear();

  /* ------------------------------------------------------------ nav */
  const nav = $("#nav"), toggle = $("#navToggle");
  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", open);
    nav.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
  };
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  $$("#navLinks a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && nav.classList.contains("is-open")) { setMenu(false); toggle.focus(); } });
  let lastY = window.scrollY;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    nav.classList.toggle("is-solid", y > 40);
    // the bar stays in place while scrolling in either direction
    lastY = y;
  }, { passive: true });

  // letters scramble briefly when a nav link is hovered or focused
  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  $$("[data-scramble]").forEach((a) => {
    const final = a.textContent; let t = 0;
    const run = () => {
      if (reduced) return;
      cancelAnimationFrame(t);
      a.textContent = final; a.style.minWidth = a.offsetWidth + "px";
      const start = performance.now(), dur = 420;
      const step = (now) => {
        const p = Math.min(1, (now - start) / dur), fixed = Math.floor(p * final.length);
        a.textContent = final.split("").map((c, i) => i < fixed || c === " " ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0]).join("");
        if (p < 1) t = requestAnimationFrame(step); else a.textContent = final;
      };
      t = requestAnimationFrame(step);
    };
    a.addEventListener("mouseenter", run);
    a.addEventListener("focus", run);
  });

  /* ------------------------------------------------------------ colour grounds
     Observers start once the cover has opened, so the splash stays on paper. */
  const groundObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) document.body.dataset.ground = e.target.dataset.ground; });
  }, { rootMargin: "-48% 0px -48% 0px" });
  const startGrounds = () => $$("[data-ground]").filter((el) => el !== document.body).forEach((g) => groundObs.observe(g));
  const navLinks = $$("#navLinks a");
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = (e.target.id === "hukaru" || e.target.id === "garden") ? "exhibitions" : e.target.id;
      navLinks.forEach((a) => a.setAttribute("aria-current", a.getAttribute("href") === "#" + id ? "true" : "false"));
    });
  }, { rootMargin: "-48% 0px -48% 0px" });
  $$("main > section[id]").forEach((s) => spy.observe(s));

  /* ------------------------------------------------------------ weave reveal */
  const weaveObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); weaveObs.unobserve(e.target); } });
  }, { threshold: 0.25 });
  $$("[data-weave]").forEach((w) => reduced ? w.classList.add("is-in") : weaveObs.observe(w));

  /* ------------------------------------------------------------ works */
  const grid = $("#workGrid"), filters = $("#workFilters");
  const cats = ["All", ...new Set(WORKS.map((w) => w.cat))];
  filters.innerHTML = cats.map((c, i) => {
    const n = c === "All" ? WORKS.length : WORKS.filter((w) => w.cat === c).length;
    return `<button class="chip" type="button" data-cat="${esc(c)}" aria-pressed="${i === 0}">${esc(c)}<sup>${n}</sup></button>`;
  }).join("");
  grid.innerHTML = WORKS.map((w, i) => {
    if (w.feature) return "";
    const [src, wd, ht, alt] = w.images[0];
    return `<li data-cat="${esc(w.cat)}"><button class="card" type="button" data-work="${i}" aria-label="${esc(w.title)}, ${w.images.length} image${w.images.length > 1 ? "s" : ""}${w.video ? " and a video" : ""}">
      <div class="card__img">${w.video ? '<span class="card__badge">Video</span>' : ""}<img src="${IMG + src}" width="${wd}" height="${ht}" alt="${esc(alt)}" loading="lazy" decoding="async"></div>
      <span class="card__cap"><span class="card__title">${esc(w.title)}</span><span class="card__cat">${esc(w.cat)}</span></span></button></li>`;
  }).join("");
  filters.addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    $$(".chip", filters).forEach((c) => c.setAttribute("aria-pressed", c === b));
    let k = 0;
    const feat = $(".feature");
    if (feat) {
      const on = b.dataset.cat === "All" || feat.dataset.cat === b.dataset.cat;
      feat.hidden = !on;
      if (on && !reduced) { feat.classList.remove("enter"); void feat.offsetWidth; feat.classList.add("enter"); }
    }
    $$("li", grid).forEach((li) => {
      const show = b.dataset.cat === "All" || li.dataset.cat === b.dataset.cat;
      li.classList.toggle("is-hidden", !show);
      li.classList.remove("enter");
      if (show && !reduced) { void li.offsetWidth; li.style.animationDelay = Math.min(k++, 9) * 40 + "ms"; li.classList.add("enter"); }
    });
  });

  /* ------------------------------------------------------------ YouTube film: cover first, player on click */
  $$(".film-yt").forEach((card) => {
    const btn = $(".ytp", card); if (!btn) return;
    btn.addEventListener("click", () => {
      const f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + card.dataset.yt + "?autoplay=1&rel=0&modestbranding=1";
      f.title = btn.getAttribute("aria-label").replace(/^Play the film: /, "");
      f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      f.referrerPolicy = "strict-origin-when-cross-origin";
      f.allowFullscreen = true;
      btn.replaceWith(f);
    });
  });
  if ("IntersectionObserver" in window) {
    const fio = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle("in-view", e.isIntersecting)), { threshold: .25 });
    $$(".film__frame").forEach((f) => fio.observe(f));
  }

  /* ------------------------------------------------------------ back to top */
  const up = $(".up");
  const onUp = () => up.classList.toggle("show", scrollY > innerHeight * 0.9);
  addEventListener("scroll", onUp, { passive: true }); onUp();
  up.addEventListener("click", () => { scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }); $("#nav .nav__name").focus({ preventScroll: true }); });

  /* ------------------------------------------------------------ scroll cue leaves once the visitor scrolls */
  const cue = $(".scrollcue");
  if (cue) addEventListener("scroll", () => cue.classList.toggle("is-gone", scrollY > 60), { passive: true });

  /* ------------------------------------------------------------ nudge once on arrival */
  const nudgeObs = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("is-nudged"); nudgeObs.unobserve(e.target); }
  }), { threshold: .6 });
  $$("[data-nudge]").forEach((el) => nudgeObs.observe(el));

  /* ------------------------------------------------------------ research tabs */
  const tabs = $("#pubTabs");
  tabs.addEventListener("click", (e) => {
    const b = e.target.closest(".tab"); if (!b) return;
    const t = b.dataset.type;
    $$(".tab", tabs).forEach((x) => x.setAttribute("aria-selected", x === b));
    $$(".pub").forEach((li) => li.classList.toggle("is-hidden", t !== "all" && li.dataset.type !== t));
    $$(".pubs__group").forEach((g) => g.classList.toggle("is-hidden", t !== "all" && g.dataset.group !== t));
  });

  /* ------------------------------------------------------------ lightbox */
  const lb = $("#lightbox"), lbImg = $("#lbImg"), lbPrev = $("#lbPrev"), lbNext = $("#lbNext");
  let set = null, idx = 0, opener = null;
  const lbVideo = $("#lbVideo");
  function show(i, instant) {
    const slides = set.slides;
    idx = (i + slides.length) % slides.length;
    const sl = slides[idx];
    if (sl.video) {
      lbImg.hidden = true; lbVideo.hidden = false;
      lbVideo.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(sl.video)}?rel=0&modestbranding=1" title="${esc(set.title)} video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
    } else {
      lbVideo.hidden = true; lbVideo.innerHTML = "";
      lbImg.hidden = false;
      const [src, w, h, alt] = sl;
      const apply = () => { lbImg.src = set.base + src; lbImg.width = w; lbImg.height = h; lbImg.alt = alt; lbImg.classList.remove("is-swapping"); };
      if (instant || reduced) apply(); else { lbImg.classList.add("is-swapping"); setTimeout(apply, 180); }
    }
    const label = sl.video ? "Video" : "Image";
    $("#lbCount").textContent = slides.length > 1 ? `${label} · ${idx + 1} of ${slides.length}` : "";
    $$("#lbThumbs button").forEach((b, k) => b.setAttribute("aria-current", k === idx));
    lbPrev.hidden = lbNext.hidden = slides.length < 2;
  }
  function open(data, from, start = 0) {
    set = data; opener = from;
    $("#lbCat").textContent = data.cat || "";
    $("#lbTitle").textContent = data.title;
    $("#lbText").textContent = data.text || "";
    set.slides = (data.video ? [{ video: data.video }] : []).concat(data.images);
    $("#lbThumbs").innerHTML = set.slides.length > 1 ? set.slides.map((sl, k) => sl.video
      ? `<li><button type="button" class="thumb-video" data-i="${k}" aria-label="Play the video">▶ Video</button></li>`
      : `<li><button type="button" data-i="${k}" aria-label="Show image ${k + 1}: ${esc(sl[3])}"><img src="${data.base + sl[0]}" alt="" loading="lazy"></button></li>`).join("") : "";
    show(start, true);
    lb.showModal();
    document.body.style.overflow = "hidden";
  }
  lb.addEventListener("close", () => { lbVideo.innerHTML = ""; document.body.style.overflow = ""; opener && opener.focus(); });
  grid.addEventListener("click", (e) => {
    const b = e.target.closest("[data-work]"); if (!b) return;
    open({ ...WORKS[+b.dataset.work], base: IMG }, b);
  });
  $$("[data-work-id]").forEach((b) => b.addEventListener("click", () => {
    const w = WORKS.find((x) => x.id === b.dataset.workId);
    // the film already plays beside the card, so the viewer opens on the boards
    if (w) open({ ...w, video: null, base: IMG }, b);
  }));
  const fromShow = (el) => el.closest(".show");
  $$("[data-zoom]").forEach((img) => {
    img.tabIndex = 0; img.setAttribute("role", "button");
    const go = () => { const s = fromShow(img); open({ base: "", title: $(".show__title", s).textContent, cat: $(".show__venue", s).textContent, text: $(".show__by", s).textContent, images: [[img.getAttribute("src"), img.width, img.height, img.alt]] }, img); };
    img.addEventListener("click", go);
    img.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  });
  $$("[data-zoom-src]").forEach((b) => b.addEventListener("click", () => {
    const s = fromShow(b), im = $("img", b);
    open({ base: "", title: $(".show__title", s).textContent, cat: $(".show__venue", s).textContent, text: b.closest("figure").querySelector("figcaption").textContent, images: [[b.dataset.zoomSrc, im.width, im.height, im.alt]] }, b);
  }));
  // poster series: open the whole set at the plate that was clicked
  $$("[data-series]").forEach((b) => b.addEventListener("click", () => {
    const sec = b.closest(".show"), all = $$(`[data-series="${b.dataset.series}"]`);
    const images = all.map((x) => { const im = $("img", x); return [im.getAttribute("src"), im.width, im.height, im.alt]; });
    open({ base: "", title: $(".show__title", sec).textContent, cat: $(".show__venue", sec).textContent,
           text: $(".garden__line", sec).textContent, images }, b, +b.dataset.index);
  }));
  const plateObs = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); plateObs.unobserve(e.target); } }), { threshold: .15 });
  $$(".plates").forEach((p) => reduced ? p.classList.add("is-in") : plateObs.observe(p));
  $("#lbClose").addEventListener("click", () => lb.close());
  lbPrev.addEventListener("click", () => show(idx - 1));
  lbNext.addEventListener("click", () => show(idx + 1));
  $("#lbThumbs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) show(+b.dataset.i); });
  lb.addEventListener("keydown", (e) => {
    if (!set || set.slides.length < 2) return;
    if (e.key === "ArrowRight") show(idx + 1);
    if (e.key === "ArrowLeft") show(idx - 1);
  });
  lb.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });
  let tx = null;
  $(".lb__stage").addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; }, { passive: true });
  $(".lb__stage").addEventListener("touchend", (e) => {
    if (tx === null || !set || set.slides.length < 2) return;
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 45) show(idx + (dx < 0 ? 1 : -1));
    tx = null;
  });


  /* ------------------------------------------------------------ cover, progress, copy */
  const hero = $(".hero");
  let opened = false;
  function openCover() {
    if (opened) return; opened = true;
    // hand the cover colour to the page in one instant, then let grounds fade normally
    const b = document.body;
    b.classList.add("no-trans");
    b.dataset.ground = "black";
    hero.classList.add("is-open");
    void b.offsetWidth;
    b.classList.remove("no-trans", "is-intro");
    startGrounds();
  }
  if (reduced) openCover();
  else {
    requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add("is-ready")));
    hero.addEventListener("animationend", (e) => { if (e.target === hero) openCover(); }, { once: false });
    setTimeout(() => { if (!hero.classList.contains("is-open")) openCover(); }, 1600);
  }
  const prog = $(".prog");
  const onProg = () => { const h = document.documentElement.scrollHeight - innerHeight; prog.style.width = (h > 0 ? Math.min(100, scrollY / h * 100) : 0) + "%"; };
  addEventListener("scroll", onProg, { passive: true }); onProg();
  const cpy = $(".cpy");
  cpy.addEventListener("click", () => {
    const t = cpy.dataset.mail, old = cpy.textContent;
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(
      () => { cpy.textContent = "Copied"; setTimeout(() => (cpy.textContent = old), 1600); },
      () => { cpy.textContent = t; });
  });

  /* ------------------------------------------------------------ pixel dust
     Studied frame by frame from the reference: nothing shows while the
     pointer rests. Moving it throws square grains of dust in the direction
     and at the speed of the gesture; they carry past the cursor on their
     own momentum, slow down with friction, wander slightly and fade. A click
     throws grains outward in every direction, so the ring widens and thins
     as it travels. Grains snap to a 4 px grid and are drawn in whole device
     pixels, which keeps every grain crisp at any screen density.          */
  const cv = $("#dust"), ctx = cv.getContext("2d");
  const CFG = {
    pitch: 4,          // grid spacing of grains, CSS px
    grain: 2.5,        // grain size, CSS px
    max: 34000,        // grains alive at once
    perPx: 2.4,        // grains thrown per pixel of pointer travel
    carry: 0.55,       // share of the pointer's velocity a grain inherits
    spread: 1.3,       // random scatter speed, px per frame
    jitter: 36,        // emission scatter around the pointer path, px
    friction: 0.935,   // trail grains slow down
    ringFriction: 0.982,
    ringCount: 4200,
    ringSpeed: [8, 10.5],
    life: [1200, 2500], // ms
    ringLife: [1800, 2800]
  };
  const TONES = ["rgba(98,98,96,", "rgba(124,124,121,", "rgba(152,151,147,"];
  let W = 0, H = 0, dpr = 1, P = 4, G = 3, Q = 4;
  const N = CFG.max;
  const X = new Float32Array(N), Y = new Float32Array(N), VX = new Float32Array(N), VY = new Float32Array(N);
  const BORN = new Float32Array(N), LIFE = new Float32Array(N), FR = new Float32Array(N);
  const TONE = new Uint8Array(N), ALIVE = new Uint8Array(N), KIND = new Uint8Array(N), SZ = new Uint8Array(N);
  // eddies: short-lived swirls the grains are carried round, like the sky in The Starry Night
  const eddies = [];
  let head = 0, live = 0, raf = 0, running = false, visible = true;
  let last = null;

  function size() {
    W = hero.clientWidth; H = hero.clientHeight;
    dpr = Math.min(devicePixelRatio || 1, 3);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    P = Math.max(2, Math.round(CFG.pitch * dpr)); G = Math.max(1, Math.round(CFG.grain * dpr)); Q = P / dpr;
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

  function emit(x, y, vx, vy, life, fr, kind = 0, sz = 1) {
    const k = head; head = (head + 1) % N;
    if (!ALIVE[k]) live++;
    X[k] = x; Y[k] = y; VX[k] = vx; VY[k] = vy;
    BORN[k] = performance.now(); LIFE[k] = life; FR[k] = fr;
    TONE[k] = (Math.random() * 3) | 0; ALIVE[k] = 1; KIND[k] = kind; SZ[k] = 1;
  }

  function throwDust(x, y, t) {
    if (!last || t - last.t > 140) { last = { x, y, t }; return; }
    const dx = x - last.x, dy = y - last.y, dt = Math.max(8, t - last.t);
    const dist = Math.hypot(dx, dy);
    if (dist < 0.5) return;
    // pointer velocity in px per 16 ms frame
    const pvx = dx / dt * 16, pvy = dy / dt * 16, sp = Math.hypot(pvx, pvy);
    const n = Math.min(320, Math.round(dist * CFG.perPx));
    for (let i = 0; i < n; i++) {
      const f = Math.random();
      const ex = last.x + dx * f + gauss() * CFG.jitter, ey = last.y + dy * f + gauss() * CFG.jitter;
      const c = CFG.carry * rnd(0.3, 1.5);
      const sc = CFG.spread + sp * 0.06;
      emit(ex, ey, pvx * c + gauss() * sc, pvy * c + gauss() * sc, rnd(CFG.life[0], CFG.life[1]), CFG.friction + rnd(-0.01, 0.012));
    }
    last = { x, y, t };
    wake();
  }

  function ripple(x, y, power = 1, sz = 1, density = 1) {
    const n = Math.round(CFG.ringCount * power * density);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = rnd(CFG.ringSpeed[0], CFG.ringSpeed[1]) * power;
      emit(x + Math.cos(a) * 6, y + Math.sin(a) * 6, Math.cos(a) * v, Math.sin(a) * v, rnd(CFG.ringLife[0], CFG.ringLife[1]), CFG.ringFriction + rnd(-0.004, 0.003), 0, sz);
    }
    wake();
  }

  let prev = 0;
  function frame(now) {
    const step = prev ? Math.min(3, (now - prev) / 16.67) : 1; prev = now;
    ctx.clearRect(0, 0, cv.width, cv.height);
    const paths = [new Path2D(), new Path2D(), new Path2D()], aSum = [0, 0, 0], cnt = [0, 0, 0];
    let alive = 0;
    for (let e = eddies.length - 1; e >= 0; e--) {  // eddies swell in, then fade
      const ed = eddies[e], a = (now - ed.t0) / ed.life;
      if (a >= 1) { eddies.splice(e, 1); continue; }
      ed.live = a < .25 ? a / .25 : 1 - (a - .25) / .75;
      ed.x += ed.dx * step; ed.y += ed.dy * step;
    }
    for (let k = 0; k < N; k++) {
      if (!ALIVE[k]) continue;
      const age = now - BORN[k], L = LIFE[k];
      if (age >= L) { ALIVE[k] = 0; live--; continue; }
      alive++;
      const fr = Math.pow(FR[k], step);
      VX[k] = VX[k] * fr + gauss() * 0.06 * step;   // a faint wander, like dust in air
      VY[k] = VY[k] * fr + gauss() * 0.06 * step;
      if (KIND[k] === 1) {                         // wind: long flowing currents over the whole field
        VX[k] += Math.sin(Y[k] * 0.009 + now * 0.0016) * 0.16 * step;
        VY[k] += Math.cos(X[k] * 0.007 - now * 0.0013) * 0.16 * step;
      }
      for (let e = 0; e < eddies.length; e++) {    // carried round any eddy the grain is inside
        const ed = eddies[e], ex = X[k] - ed.x, ey = Y[k] - ed.y, d2 = ex * ex + ey * ey;
        if (d2 > ed.r2) continue;
        const d = Math.sqrt(d2) || 1, f = (1 - d / ed.r) * ed.live * step;
        VX[k] += (-ey / d * ed.s - ex / d * ed.pull) * f;
        VY[k] += ( ex / d * ed.s - ey / d * ed.pull) * f;
      }
      X[k] += VX[k] * step; Y[k] += VY[k] * step;
      const x = X[k], y = Y[k];
      if (x < -4 || y < -4 || x > W + 4 || y > H + 4) continue;
      // brightness: quick fade in, long fade out; grains flicker slightly
      const p = age / L, a = (p < 0.08 ? p / 0.08 : 1 - (p - 0.08) / 0.92);
      if (Math.random() > 0.3 + a * 0.6) continue;
      const t = TONE[k];
      { const z = G * SZ[k] + (SZ[k] > 1 ? (SZ[k] - 1) * (P - G) : 0); paths[t].rect(Math.round(x / Q) * P, Math.round(y / Q) * P, z, z); }
      aSum[t] += a; cnt[t]++;
    }
    for (let t = 0; t < 3; t++) {
      if (!cnt[t]) continue;
      ctx.fillStyle = TONES[t] + (0.3 + 0.45 * aSum[t] / cnt[t]).toFixed(2) + ")";
      ctx.fill(paths[t]);
    }
    if ((alive || eddies.length) && visible) raf = requestAnimationFrame(frame);
    else { running = false; prev = 0; if (!alive) ctx.clearRect(0, 0, cv.width, cv.height); }
  }
  function wake() { if (reduced || running || !visible) return; running = true; raf = requestAnimationFrame(frame); }

  size();
  hero.addEventListener("pointermove", (e) => {
    const r = cv.getBoundingClientRect();
    // touch drags scroll the page, so only a held pen or mouse throws dust while moving
    throwDust(e.clientX - r.left, e.clientY - r.top, performance.now());
  });
  hero.addEventListener("pointerleave", () => { last = null; });
  hero.addEventListener("pointerdown", (e) => {
    if (e.target.closest("a, button")) return;
    const r = cv.getBoundingClientRect(); ripple(e.clientX - r.left, e.clientY - r.top, 1);
  });
  /* intro, once the cover has opened: a wave of dust sweeps diagonally from
     the top left to the bottom right, its front rippling and curling as it
     goes. When it passes the portrait, the portrait bursts: three rings of
     different speed and a spray of sparks that swirl outward.             */
  function eddy(x, y, r, strength, life, drift = 0, pull = 0.04) {
    const a = Math.random() * Math.PI * 2;
    eddies.push({ x, y, r, r2: r * r, s: strength, pull, life, t0: performance.now(), live: 0, dx: Math.cos(a) * drift, dy: Math.sin(a) * drift });
    if (eddies.length > 14) eddies.shift();
  }
  /* the portrait bursts in layers that differ in speed, size and grain:
     a fast fine ring, a slow ring of coarse grains, a sparse ring of large
     grains, and two quieter echoes. Four spiral arms of sparks open out
     and a large eddy turns them, so the whole burst rotates as it grows. */
  function burst(x, y) {
    const rings = [
      { d: 0,   p: 1.35, sz: 1, n: 1.0 },
      { d: 110, p: 0.62, sz: 2, n: 0.9 },
      { d: 240, p: 1.0,  sz: 1, n: 0.6 },
      { d: 380, p: 0.42, sz: 3, n: 0.55 },
      { d: 560, p: 0.8,  sz: 1, n: 0.45 },
      { d: 820, p: 0.3,  sz: 2, n: 0.5 }
    ];
    rings.forEach((r) => setTimeout(() => ripple(x, y, r.p, r.sz, r.n), r.d));
    const turn = Math.random() < .5 ? 1 : -1;
    for (let arm = 0; arm < 4; arm++) {
      const base = arm * Math.PI / 2 + Math.random() * .4;
      for (let i = 0; i < 260; i++) {
        const t = Math.random(), a = base + turn * t * 2.6, v = 3 + t * 13;
        const sz = Math.random() < .12 ? 2 : 1;
        emit(x + Math.cos(a) * 8, y + Math.sin(a) * 8,
             Math.cos(a) * v - turn * Math.sin(a) * v * .45, Math.sin(a) * v + turn * Math.cos(a) * v * .45,
             rnd(900, 2000), 0.955 + rnd(-0.01, 0.01), 2, sz);
      }
    }
    eddy(x, y, 340, 0.55 * turn, 2600, 0, -0.02);
    for (let i = 0; i < 3; i++) {
      const a = Math.random() * Math.PI * 2, d = rnd(140, 260);
      setTimeout(() => eddy(x + Math.cos(a) * d, y + Math.sin(a) * d, rnd(60, 120), rnd(.4, .8) * (Math.random() < .5 ? 1 : -1), 1800, 0.4), 200 + i * 180);
    }
    wake();
  }
  /* the wave: its front is the sum of a long swell, a middle wave and a
     short chop, each travelling at its own speed, so big and small waves
     ride over one another. Crests throw coarser grains further ahead, and
     eddies of different sizes open in its wake and turn the dust in
     spirals, as in the sky of The Starry Night.                          */
  function introWave() {
    const pr = $(".hero__portrait").getBoundingClientRect(), r = cv.getBoundingClientRect();
    const px0 = pr.left - r.left + pr.width / 2, py0 = pr.top - r.top + pr.height / 2;
    const len = Math.hypot(1, 0.48), dx = 1 / len, dy = 0.48 / len, nx = -dy, ny = dx;
    const proj = (x, y) => x * dx + y * dy, side = (x, y) => x * nx + y * ny;
    const corners = [[0, 0], [W, 0], [0, H], [W, H]];
    const sMin = Math.min(...corners.map(([x, y]) => proj(x, y))) - 120, sMax = Math.max(...corners.map(([x, y]) => proj(x, y))) + 60;
    const uMin = Math.min(...corners.map(([x, y]) => side(x, y))), uMax = Math.max(...corners.map(([x, y]) => side(x, y)));
    const sHit = proj(px0, py0), dur = 1900, t0 = performance.now();
    const ph = [Math.random() * 6, Math.random() * 6, Math.random() * 6];
    const swell = (u, now) =>
        Math.sin(u * 0.0042 + now * 0.0021 + ph[0]) * 95      // long swell
      + Math.sin(u * 0.0135 - now * 0.0052 + ph[1]) * 38      // middle wave
      + Math.sin(u * 0.047 + now * 0.011 + ph[2]) * 11;       // chop
    let fired = false, lastEddy = 0;
    const perFrame = Math.round(Math.min(520, (uMax - uMin) * 0.34));
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      const e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const sF = sMin + (sMax - sMin) * e;
      for (let i = 0; i < perFrame; i++) {
        const u = rnd(uMin, uMax), front = sF + swell(u, now);
        // how close this point is to a crest of the long swell
        const crest = Math.max(0, Math.sin(u * 0.0042 + now * 0.0021 + ph[0]));
        const s0 = front - Math.abs(gauss()) * (22 + crest * 34);
        const x = dx * s0 + nx * u, y = dy * s0 + ny * u;
        if (x < -10 || y < -10 || x > W + 10 || y > H + 10) continue;
        const big = Math.random() < 0.05 + crest * 0.18;
        const v = rnd(3, 7) + crest * rnd(2, 6);
        emit(x, y, dx * v + nx * gauss() * 1.4, dy * v + ny * gauss() * 1.4,
             rnd(450, 1100) + crest * 500, 0.945 + rnd(-0.01, 0.01), 1, big ? (Math.random() < .3 ? 3 : 2) : 1);
      }
      // eddies open in the wake: mostly small, now and then a large one
      if (now - lastEddy > 70) {
        lastEddy = now;
        const u = rnd(uMin, uMax), back = sF + swell(u, now) - rnd(30, 140);
        const big = Math.random() < .25, rad = big ? rnd(150, 230) : rnd(45, 110);
        eddy(dx * back + nx * u, dy * back + ny * u, rad, (big ? rnd(.7, 1.0) : rnd(.9, 1.5)) * (Math.random() < .7 ? 1 : -1), rnd(1400, 2300), 0.35, 0.09);
      }
      if (!fired && sF + swell(side(px0, py0), now) >= sHit) { fired = true; burst(px0, py0); }
      wake();
      if (t < 1) requestAnimationFrame(tick); else if (!fired) burst(px0, py0);
    };
    requestAnimationFrame(tick);
  }
  if (!reduced) setTimeout(() => { if (visible && scrollY < innerHeight * 0.5) introWave(); }, 950);
  let rz; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(size, 200); });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) wake(); }).observe(hero);
})();
