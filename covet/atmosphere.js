(function () {
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  function light(x, y) {
    root.style.setProperty("--lx", x + "%");
    root.style.setProperty("--ly", y + "%");
  }

  const ring = document.querySelector(".cursor-ring");
  let rx = window.innerWidth * 0.68;
  let ry = window.innerHeight * 0.24;
  let tx = rx;
  let ty = ry;
  let ringOn = false;

  function tickRing() {
    rx += (tx - rx) * (reduce ? 1 : 0.18);
    ry += (ty - ry) * (reduce ? 1 : 0.18);
    if (ring) ring.style.transform = "translate(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px)";
    if (!reduce) requestAnimationFrame(tickRing);
  }

  if (!coarse && ring) {
    ring.hidden = false;
    requestAnimationFrame(tickRing);
  }

  const film = document.querySelectorAll(".runway video");
  if (reduce) film.forEach((clip) => {
    clip.removeAttribute("autoplay");
    clip.pause();
  });

  const feather = document.querySelector(".logo-feather");
  if (feather && !reduce) {
    const duration = 4400;
    const started = performance.now();
    feather.style.opacity = "0";
    function fall(now) {
      const t = Math.min(1, (now - started) / duration);
      const drop = 1 - Math.pow(1 - t, 2.8);
      const calm = Math.pow(1 - t, 1.55);
      const phase = t * Math.PI * 2 * 1.55;
      const x = Math.sin(phase) * 12 * calm;
      const y = -58 * (1 - drop);
      const tilt = Math.cos(phase) * 8 * calm;
      feather.style.opacity = Math.min(1, t / 0.16).toFixed(3);
      feather.style.transform = "translate3d(" + x.toFixed(2) + "%, " + y.toFixed(2) + "vh, 0) rotate(" + tilt.toFixed(2) + "deg)";
      if (t < 1) requestAnimationFrame(fall);
      else {
        feather.style.opacity = "";
        feather.style.transform = "";
      }
    }
    requestAnimationFrame(fall);
  }

  if (!reduce) {
    window.addEventListener("pointermove", (event) => {
      light((event.clientX / window.innerWidth) * 100, (event.clientY / window.innerHeight) * 100);
      tx = event.clientX;
      ty = event.clientY;
      if (ring && !ringOn) {
        ringOn = true;
        ring.classList.add("is-on");
      }
    }, { passive: true });

    window.addEventListener("deviceorientation", (event) => {
      if (event.gamma == null) return;
      const x = Math.min(92, Math.max(8, 50 + event.gamma * 1.1));
      const y = Math.min(88, Math.max(8, 42 + (event.beta - 40) * 0.7));
      light(x, y);
    });
  }

  const nav = document.getElementById("nav");
  const toggle = document.getElementById("nav-toggle");
  const panel = document.getElementById("site-nav");
  function closeMenu() {
    if (!nav || !toggle) return;
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  }
  if (toggle && nav && panel) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    panel.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
  }

  const links = new Map();
  document.querySelectorAll(".nav nav a").forEach((link) => {
    const id = (link.getAttribute("href") || "").slice(1);
    if (id) links.set(id, link);
  });
  if ("IntersectionObserver" in window && links.size) {
    const watch = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => link.classList.remove("is-here"));
        const current = links.get(entry.target.id);
        if (current) current.classList.add("is-here");
      });
    }, { rootMargin: "-40% 0px -45% 0px", threshold: 0.01 });
    links.forEach((link, id) => {
      const section = document.getElementById(id);
      if (section) watch.observe(section);
    });
  }

  const chapters = [
    { id: "drift", label: "Drift" },
    { id: "edit", label: "Edit" },
    { id: "house", label: "House" },
    { id: "collections", label: "Collections" },
    { id: "press", label: "Press" },
    { id: "visit", label: "Visit" }
  ].map((item) => ({ ...item, el: document.getElementById(item.id) })).filter((item) => item.el);

  if (chapters.length > 2 && !document.querySelector(".chapter-rail")) {
    const ringLength = 2 * Math.PI * 11;
    const rail = document.createElement("nav");
    rail.className = "chapter-rail";
    rail.setAttribute("aria-label", "Sections");
    const progress = document.createElement("span");
    progress.className = "chapter-rail-progress";
    progress.innerHTML = '<span class="chapter-rail-progress-track" aria-hidden="true"></span><span class="chapter-rail-progress-bar" aria-hidden="true"></span><span class="chapter-rail-progress-ember" aria-hidden="true"></span>';
    rail.appendChild(progress);

    const items = chapters.map((chapter, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chapter-rail-btn";
      btn.setAttribute("aria-label", chapter.label);
      if (!reduce) btn.style.animationDelay = (0.15 + i * 0.08) + "s";
      btn.innerHTML = '<span class="chapter-rail-ring" aria-hidden="true"><svg viewBox="0 0 34 34"><circle cx="17" cy="17" r="11"></circle></svg></span><span class="chapter-rail-dot" aria-hidden="true"></span><span class="chapter-rail-label">' + chapter.label + "</span>";
      btn.addEventListener("click", () => {
        chapter.el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      });
      rail.appendChild(btn);
      return { btn: btn, el: chapter.el, circle: btn.querySelector("circle") };
    });
    document.body.appendChild(rail);

    const bar = progress.querySelector(".chapter-rail-progress-bar");
    const ember = progress.querySelector(".chapter-rail-progress-ember");
    let ticking = false;

    function paint() {
      const railRect = rail.getBoundingClientRect();
      const first = items[0].btn.getBoundingClientRect();
      const last = items[items.length - 1].btn.getBoundingClientRect();
      progress.style.top = Math.max(0, first.top + first.height / 2 - railRect.top) + "px";
      progress.style.bottom = Math.max(0, railRect.bottom - (last.top + last.height / 2)) + "px";

      const n = items.length;
      const marker = window.scrollY + window.innerHeight * 0.38;
      const starts = items.map((item) => item.el.getBoundingClientRect().top + window.scrollY);
      const lastEnd = starts[n - 1] + Math.max(items[n - 1].el.offsetHeight, window.innerHeight * 0.5);
      let index = 0;
      for (; index < n - 1; index += 1) {
        if (marker < starts[index + 1]) break;
      }
      const end = index < n - 1 ? starts[index + 1] : lastEnd;
      const local = Math.min(1, Math.max(0, (marker - starts[index]) / Math.max(1, end - starts[index])));
      const pct = Math.min(1, (index + local) / (n - 1));
      const filled = ringLength * pct;
      if (bar) bar.style.height = (pct * 100) + "%";
      if (ember) {
        ember.style.top = (pct * 100) + "%";
        ember.style.opacity = pct > 0.02 ? "1" : "0";
      }
      items.forEach((item, i) => {
        item.btn.classList.toggle("is-reached", pct >= i / Math.max(1, n - 1) - 0.02);
        item.btn.classList.toggle("is-active", i === index);
        if (item.circle) item.circle.style.strokeDasharray = filled.toFixed(2) + " " + (ringLength - filled).toFixed(2);
      });
      ticking = false;
    }

    function requestPaint() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(paint);
    }

    const hero = document.getElementById("top");
    if (hero && "IntersectionObserver" in window) {
      const vis = new IntersectionObserver(([entry]) => {
        rail.classList.toggle("is-visible", !entry.isIntersecting);
        requestPaint();
      }, { threshold: 0.55 });
      vis.observe(hero);
    } else {
      rail.classList.add("is-visible");
    }

    window.addEventListener("scroll", requestPaint, { passive: true });
    window.addEventListener("resize", requestPaint, { passive: true });
    paint();
  }
})();
