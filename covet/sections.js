(function () {
  const tabs = document.getElementById("section-tabs");
  const host = document.getElementById("section-rails");
  const caption = document.getElementById("section-caption");
  const kindLine = document.getElementById("section-kind");
  const prev = document.getElementById("section-prev");
  const next = document.getElementById("section-next");
  if (!tabs || !host) return;

  // tab: swap this path when Bridget replaces the category picture.
  const sections = [
    {
      id: "covet-collection",
      label: "Covet Collection",
      tab: "images/covet-collection/dsc06656.png",
      gap: "",
      items: window.COVET_COLLECTION || []
    },
    {
      id: "earrings",
      label: "Earrings",
      tab: "images/catalog/fine-jewelry/oval-3-row-pave-diamond-mini-hoop.jpg",
      gap: "",
      items: []
    },
    {
      id: "rings",
      label: "Rings",
      tab: "images/catalog/fine-jewelry/constellation-ring.jpg",
      gap: "",
      items: []
    },
    {
      id: "necklaces",
      label: "Necklaces",
      tab: "images/catalog/fine-jewelry/opal-geometric-dome-evil-eye-burst-inlay-necklace.png",
      gap: "",
      items: []
    },
    {
      id: "chains",
      label: "Chains",
      tab: "images/catalog/fine-jewelry/round-cable-chain.jpg",
      gap: "",
      items: []
    },
    {
      id: "charms",
      label: "Charms",
      tab: "images/catalog/fine-jewelry/mermaid.jpg",
      gap: "",
      items: []
    },
    {
      id: "leather-goods",
      label: "Leather goods",
      tab: "images/catalog/leather-goods/pouch.jpg",
      gap: "No leather-goods photographs are on this site yet. Handbags from Ling Wu and Lees Pearson are on the shop.",
      items: []
    },
    {
      id: "home",
      label: "Home | Art",
      tab: "images/sections/home-art.png",
      gap: "No home photographs are on this site yet. Throws, ceramics, and objects are on the shop.",
      items: []
    },
    {
      id: "lifestyle",
      label: "Lifestyle",
      tab: "images/catalog/lifestyle/sweet-leaf-python-denim-shirt.jpg",
      gap: "",
      items: []
    }
  ];

  const catalog = window.COVET_CATALOG || [];
  sections.forEach((section) => {
    const fromShop = catalog.filter((item) => item.section === section.id);
    if (fromShop.length) section.items = fromShop;
  });

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mounts = new Map();
  let active = "covet-collection";

  function card(item) {
    const button = document.createElement("div");
    button.className = "leaf" + (item.section === "covet-collection" ? "" : " is-plate");
    button.dataset.designer = item.designer;
    button.dataset.name = item.name;
    button.dataset.kind = item.kind;
    button.dataset.section = item.section;
    if (item.madeToOrder) button.dataset.made = "true";
    if (item.href) button.dataset.href = item.href;
    if (item.price) button.dataset.price = item.price;
    const frames = item.images && item.images.length ? item.images : [item.image];
    if (frames.length) button.dataset.images = frames.join("|");

    const frame = document.createElement("button");
    frame.type = "button";
    frame.className = "leaf-frame";
    const img = document.createElement("img");
    img.className = "leaf-photo";
    img.loading = "lazy";
    img.decoding = "async";
    img.src = frames[0];
    img.alt = item.name + ", " + item.designer;
    frame.appendChild(img);
    button.appendChild(frame);

    if (frames.length > 1) {
      const strip = document.createElement("span");
      strip.className = "micro";
      let shown = 0;
      function showFrame(n) {
        shown = (n + frames.length) % frames.length;
        img.src = frames[shown];
        strip.querySelectorAll("img").forEach((thumb, i) => thumb.classList.toggle("is-on", i === shown));
      }
      frames.forEach((src, n) => {
        const thumb = document.createElement("img");
        thumb.src = src;
        thumb.alt = "";
        thumb.loading = "lazy";
        thumb.decoding = "async";
        if (n === 0) thumb.className = "is-on";
        thumb.addEventListener("pointerdown", (event) => event.stopPropagation());
        thumb.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          showFrame(n);
        });
        strip.appendChild(thumb);
      });
      strip.addEventListener("wheel", (event) => {
        if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
        event.preventDefault();
        event.stopPropagation();
        if (strip.dataset.lock === "1") return;
        strip.dataset.lock = "1";
        showFrame(shown + (event.deltaX > 0 ? 1 : -1));
        window.setTimeout(() => { strip.dataset.lock = ""; }, 260);
      }, { passive: false });
      button.appendChild(strip);
    }

    if (item.href) {
      const buy = document.createElement("button");
      buy.type = "button";
      buy.className = "card-buy";
      buy.textContent = "Buy now";
      button.appendChild(buy);
    }
    return button;
  }

  function paint() {
    sections.forEach((section) => {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "section-tab";
      tab.dataset.section = section.id;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", "false");
      if (section.id !== "covet-collection" && section.id !== "home") tab.classList.add("is-plate");
      const img = document.createElement("img");
      img.src = section.tab;
      img.alt = "";
      const label = document.createElement("span");
      label.textContent = section.label;
      tab.append(img, label);
      tab.addEventListener("click", () => activate(section.id, false));
      tabs.appendChild(tab);

      if (!section.items.length) {
        const note = document.createElement("p");
        note.className = "section-gap";
        note.id = "gap-" + section.id;
        note.hidden = true;
        note.textContent = section.gap;
        host.appendChild(note);
        return;
      }

      const rail = document.createElement("div");
      rail.className = "press-rail section-rail";
      rail.id = "rail-" + section.id;
      rail.tabIndex = 0;
      rail.hidden = true;
      rail.setAttribute("role", "tabpanel");
      rail.setAttribute("aria-label", section.label);
      host.appendChild(rail);
    });
  }

  function mount(rail, items) {
    const n = items.length;
    const STEP = 0.95;
    const HALF = 3;
    const pool = new Map();
    let down = false;
    let startX = 0;
    let lastX = 0;
    let moved = 0;
    let current = 0;
    let spin = 0;
    let target = 0;
    let raf = 0;

    function mod(index) {
      return ((index % n) + n) % n;
    }

    function layout() {
      if (!n) return;
      const front = -spin / STEP;
      const from = Math.floor(front) - HALF;
      const to = Math.ceil(front) + HALF;
      const best = new Map();
      for (let i = from; i <= to; i += 1) {
        const index = mod(i);
        const prev = best.get(index);
        if (prev === undefined || Math.abs(i - front) < Math.abs(prev - front)) best.set(index, i);
      }
      pool.forEach((el, index) => {
        if (!best.has(index)) {
          el.remove();
          pool.delete(index);
        }
      });
      const radius = Math.min(rail.clientWidth * 0.38, 420);
      const lift = 48;
      best.forEach((i, index) => {
        let el = pool.get(index);
        if (!el) {
          el = card(items[index]);
          el.dataset.index = String(index);
          pool.set(index, el);
          rail.appendChild(el);
        }
        const a = i * STEP + spin;
        const depth = Math.cos(a);
        const forward = (depth + 1) / 2;
        const spot = Math.pow(Math.max(0, (forward - 0.62) / 0.38), 2.6);
        const scale = 0.22 + spot * 0.82;
        const blur = (1 - spot) * 14;
        const x = Math.sin(a) * radius;
        const y = (1 - depth) * lift;
        el.style.left = "calc(50% + " + x.toFixed(1) + "px)";
        el.style.top = "calc(42% + " + y.toFixed(1) + "px)";
        el.style.transform = "translate(-50%, -50%) scale(" + scale.toFixed(3) + ")";
        el.style.zIndex = String(10 + Math.round(spot * 40));
        el.style.opacity = spot.toFixed(3);
        el.style.filter = "blur(" + blur.toFixed(2) + "px)";
        el.style.pointerEvents = spot > 0.35 ? "auto" : "none";
        el.classList.toggle("is-on", index === current);
      });
    }

    function tick() {
      spin += (target - spin) * 0.18;
      if (Math.abs(target - spin) < 0.0008) spin = target;
      layout();
      raf = Math.abs(target - spin) > 0.0008 ? requestAnimationFrame(tick) : 0;
    }

    function show(index) {
      current = mod(index);
      const item = items[current];
      if (!item) return;
      caption.textContent = item.designer + "  ·  " + item.name;
      kindLine.textContent = item.madeToOrder
        ? item.kind + " · Made to order"
        : item.kind;
    }

    function go(index, smooth) {
      if (!n) return;
      const delta = index - current;
      current = mod(index);
      target -= delta * STEP;
      show(current);
      if (!smooth || reduce) {
        spin = target;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        layout();
        return;
      }
      if (!raf) raf = requestAnimationFrame(tick);
    }

    rail.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      down = true;
      moved = 0;
      startX = event.clientX;
      lastX = event.clientX;
      rail.classList.add("is-dragging");
      rail.setPointerCapture(event.pointerId);
    });

    rail.addEventListener("pointermove", (event) => {
      if (!down) return;
      const dx = event.clientX - lastX;
      lastX = event.clientX;
      moved += Math.abs(event.clientX - startX);
      spin -= dx * (STEP / 78);
      target = spin;
      layout();
    });

    rail.addEventListener("pointerup", (event) => {
      if (!down) return;
      down = false;
      rail.classList.remove("is-dragging");
      const under = document.elementFromPoint(event.clientX, event.clientY);
      if (moved < 8 && under && under.closest(".card-buy")) {
        const leaf = under.closest(".leaf");
        const photo = leaf && leaf.querySelector(".leaf-photo");
        if (leaf && window.covetCart) {
          window.covetCart.add({
            id: (leaf.dataset.href || "").split("/products/")[1] || leaf.dataset.name,
            name: leaf.dataset.name,
            price: leaf.dataset.price,
            image: photo ? photo.getAttribute("src") : "",
            made: leaf.dataset.made === "true"
          });
        }
      } else if (moved < 8 && under && under.closest(".leaf-frame")) {
        const leaf = under.closest(".leaf");
        if (leaf && leaf.dataset.href) window.openShop(leaf);
        else if (leaf) {
          remember(leaf);
          openLook(leaf);
        }
      }
      if (moved >= 8) {
        const nearest = Math.round(-spin / STEP);
        const dest = -nearest * STEP;
        current = mod(nearest);
        target = dest;
        show(current);
        if (!raf) raf = requestAnimationFrame(tick);
      }
    });

    rail.addEventListener("pointercancel", () => {
      down = false;
      rail.classList.remove("is-dragging");
    });

    rail.addEventListener("wheel", (event) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      if (event.target.closest(".micro")) return;
      event.preventDefault();
      if (rail.dataset.wheel === "1") return;
      rail.dataset.wheel = "1";
      go(current + (event.deltaX > 0 ? 1 : -1), true);
      window.setTimeout(() => { rail.dataset.wheel = ""; }, 280);
    }, { passive: false });

    rail.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        go(current + 1, true);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(current - 1, true);
      }
    });

    return {
      firstCenter: 0,
      go: go,
      current: function () { return current; }
    };
  }

  function activate(id, smooth) {
    active = id;
    const section = sections.find((item) => item.id === id);
    tabs.querySelectorAll(".section-tab").forEach((tab) => {
      const on = tab.dataset.section === id;
      tab.classList.toggle("is-on", on);
      tab.setAttribute("aria-selected", on ? "true" : "false");
    });
    sections.forEach((item) => {
      const rail = document.getElementById("rail-" + item.id);
      const gap = document.getElementById("gap-" + item.id);
      if (rail) rail.hidden = item.id !== id;
      if (gap) gap.hidden = item.id !== id;
    });
    const hasPieces = section.items.length > 1;
    prev.hidden = !hasPieces;
    next.hidden = !hasPieces;
    if (!section.items.length) {
      caption.textContent = section.label;
      kindLine.textContent = section.gap;
      return;
    }
    requestAnimationFrame(() => {
      let mounted = mounts.get(id);
      if (!mounted) {
        mounted = mount(document.getElementById("rail-" + id), section.items);
        mounts.set(id, mounted);
      }
      mounted.go(mounted.current(), smooth);
    });
  }

  prev.addEventListener("click", () => {
    const mounted = mounts.get(active);
    if (mounted) mounted.go(mounted.current() - 1, true);
  });

  next.addEventListener("click", () => {
    const mounted = mounts.get(active);
    if (mounted) mounted.go(mounted.current() + 1, true);
  });

  window.addEventListener("resize", () => {
    const mounted = mounts.get(active);
    if (mounted) mounted.go(mounted.current(), false);
  });

  function remember(el) {
    const images = (el.dataset.images || "").split("|").filter(Boolean);
    const photo = el.querySelector("img");
    const item = {
      name: el.dataset.name || "",
      designer: el.dataset.designer || "",
      kind: el.dataset.kind || "",
      made: el.dataset.made || "",
      price: el.dataset.price || "",
      href: el.dataset.href || "",
      section: el.dataset.section || "",
      plate: el.classList.contains("is-plate"),
      images: images.length ? images : [photo ? (photo.currentSrc || photo.src) : ""]
    };
    if (!item.name || !item.images[0]) return;
    let list = [];
    try { list = JSON.parse(localStorage.getItem("covet-recent") || "[]"); } catch (err) { list = []; }
    const key = item.href || item.name;
    list = list.filter((row) => (row.href || row.name) !== key);
    list.unshift(item);
    list = list.slice(0, 8);
    try { localStorage.setItem("covet-recent", JSON.stringify(list)); } catch (err) { /* private mode */ }
    renderRecent(list);
  }

  function renderRecent(list) {
    const host = document.getElementById("recent");
    const row = document.getElementById("recent-row");
    if (!host || !row) return;
    if (!list) {
      try { list = JSON.parse(localStorage.getItem("covet-recent") || "[]"); } catch (err) { list = []; }
    }
    row.replaceChildren();
    host.hidden = !list.length;
    list.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "recent-card" + (item.plate ? " is-plate" : "");
      button.dataset.name = item.name || "";
      button.dataset.designer = item.designer || "";
      button.dataset.kind = item.kind || "";
      button.dataset.made = item.made || "";
      button.dataset.price = item.price || "";
      button.dataset.href = item.href || "";
      button.dataset.section = item.section || "";
      button.dataset.images = (item.images || []).join("|");
      const img = document.createElement("img");
      img.src = item.images[0];
      img.alt = item.name;
      button.appendChild(img);
      button.addEventListener("click", () => {
        if (button.dataset.href && window.openShop) window.openShop(button);
        else {
          remember(button);
          openLook(button);
        }
      });
      row.appendChild(button);
    });
  }

  function wireShop() {
    const shop = document.getElementById("shop");
    const img = document.getElementById("shop-img");
    const stage = document.getElementById("shop-stage");
    const dots = document.getElementById("shop-dots");
    const price = document.getElementById("shop-price");
    const buy = document.getElementById("shop-buy");
    if (!shop || !img) return;
    let frames = [];
    let index = 0;
    let down = false;
    let startX = 0;
    let dragged = 0;

    function money(value) {
      const amount = Number(value);
      if (!amount) return "";
      return amount.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
    }

    function frame(i) {
      if (!frames.length) return;
      index = (i + frames.length) % frames.length;
      img.src = frames[index];
      dots.querySelectorAll("img").forEach((thumb, n) => thumb.classList.toggle("is-on", n === index));
    }

    window.openShop = function (el) {
      shop.classList.toggle("is-plate", el.classList.contains("is-plate"));
      frames = (el.dataset.images || "").split("|").filter(Boolean);
      if (!frames.length) frames = [el.querySelector("img").src];
      index = 0;
      document.getElementById("shop-kicker").textContent = el.dataset.made === "true"
        ? el.dataset.designer + "  ·  Made to order"
        : el.dataset.designer;
      document.getElementById("shop-name").textContent = el.dataset.name;
      price.textContent = money(el.dataset.price);
      buy.dataset.name = el.dataset.name || "";
      buy.dataset.price = el.dataset.price || "";
      buy.dataset.image = frames[0] || "";
      buy.dataset.made = el.dataset.made || "";
      buy.dataset.handle = (el.dataset.href || "").split("/products/")[1] || el.dataset.name || "";
      buy.hidden = false;
      dots.hidden = frames.length < 2;
      document.getElementById("shop-prev").hidden = frames.length < 2;
      document.getElementById("shop-next").hidden = frames.length < 2;
      dots.replaceChildren();
      remember(el);
      frames.forEach((src, n) => {
        const thumb = document.createElement("img");
        thumb.src = src;
        thumb.alt = "";
        thumb.addEventListener("click", () => frame(n));
        dots.appendChild(thumb);
      });
      frame(0);
      shop.showModal();
    };

    document.getElementById("shop-prev").addEventListener("click", (event) => {
      event.stopPropagation();
      frame(index - 1);
    });
    document.getElementById("shop-next").addEventListener("click", (event) => {
      event.stopPropagation();
      frame(index + 1);
    });
    ["shop-prev", "shop-next"].forEach((id) => {
      document.getElementById(id).addEventListener("pointerdown", (event) => event.stopPropagation());
    });

    stage.addEventListener("pointerdown", (event) => {
      if (frames.length < 2 || event.button !== 0) return;
      down = true;
      dragged = 0;
      startX = event.clientX;
      stage.setPointerCapture(event.pointerId);
    });
    stage.addEventListener("pointermove", (event) => {
      if (!down) return;
      dragged = event.clientX - startX;
    });
    stage.addEventListener("pointerup", () => {
      if (!down) return;
      down = false;
      if (dragged <= -48) frame(index + 1);
      else if (dragged >= 48) frame(index - 1);
    });
    stage.addEventListener("pointercancel", () => { down = false; });

    shop.addEventListener("wheel", (event) => {
      if (!shop.open || frames.length < 2) return;
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      if (shop.dataset.wheel === "1") return;
      shop.dataset.wheel = "1";
      frame(index + (event.deltaX > 0 ? 1 : -1));
      window.setTimeout(() => { shop.dataset.wheel = ""; }, 260);
    }, { passive: false });

    document.getElementById("shop-close").addEventListener("click", () => shop.close());
    shop.addEventListener("click", (event) => {
      if (event.target === shop) shop.close();
    });
    shop.addEventListener("keydown", (event) => {
      if (frames.length < 2) return;
      if (event.key === "ArrowRight") frame(index + 1);
      if (event.key === "ArrowLeft") frame(index - 1);
    });
  }

  function money(value) {
    const amount = Number(value);
    if (!amount) return "";
    return amount.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  }

  function storeTile(item) {
    const el = document.createElement("article");
    el.className = "store-card" + (item.section === "covet-collection" ? "" : " is-plate");
    el.dataset.designer = item.designer || "";
    el.dataset.name = item.name || "";
    el.dataset.kind = item.kind || "";
    el.dataset.section = item.section || "";
    if (item.madeToOrder) el.dataset.made = "true";
    if (item.href) el.dataset.href = item.href;
    if (item.price) el.dataset.price = item.price;
    const frames = item.images && item.images.length ? item.images : [item.image];
    if (frames.length) el.dataset.images = frames.join("|");

    const shot = document.createElement("button");
    shot.type = "button";
    shot.className = "store-shot";
    const img = document.createElement("img");
    img.src = frames[0] || "";
    img.alt = item.name + ", " + item.designer;
    img.loading = "lazy";
    img.decoding = "async";
    shot.appendChild(img);
    shot.addEventListener("click", () => {
      if (el.dataset.href && window.openShop) window.openShop(el);
      else {
        remember(el);
        openLook(el);
      }
    });

    const name = document.createElement("h3");
    name.className = "store-name";
    name.textContent = item.name;

    const meta = document.createElement("p");
    meta.className = "store-meta";
    meta.textContent = item.madeToOrder ? item.designer + "  ·  Made to order" : item.designer;

    const price = document.createElement("p");
    price.className = "store-price";
    price.textContent = money(item.price);

    el.append(shot, name, meta);
    if (price.textContent) el.appendChild(price);
    if (item.href) {
      const buy = document.createElement("button");
      buy.type = "button";
      buy.className = "card-buy";
      buy.textContent = "Buy now";
      buy.addEventListener("click", () => {
        if (!window.covetCart) return;
        window.covetCart.add({
          id: (item.href || "").split("/products/")[1] || item.name,
          name: item.name,
          price: item.price,
          image: frames[0] || "",
          made: !!item.madeToOrder
        });
      });
      el.appendChild(buy);
    }
    return el;
  }

  function mountStore() {
    const grid = document.getElementById("store-grid");
    const filters = document.getElementById("store-filters");
    if (!grid || !filters) return;
    const all = sections.reduce((list, section) => list.concat(section.items), []);
    function show(id) {
      const list = id === "all" ? all : all.filter((item) => item.section === id);
      grid.replaceChildren.apply(grid, list.map(storeTile));
      filters.querySelectorAll("button").forEach((button) => {
        const on = button.dataset.room === id;
        button.classList.toggle("is-on", on);
        button.setAttribute("aria-selected", on ? "true" : "false");
      });
    }
    [{ id: "all", label: "All" }].concat(sections.filter((section) => section.items.length).map((section) => ({
      id: section.id,
      label: section.label
    }))).forEach((room) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.room = room.id;
      button.textContent = room.label;
      button.setAttribute("role", "tab");
      button.addEventListener("click", () => show(room.id));
      filters.appendChild(button);
    });
    show("all");
  }

  function setView(view) {
    const store = view === "store";
    document.body.classList.toggle("is-store", store);
    const panel = document.getElementById("storefront");
    if (panel) panel.hidden = !store;
    document.querySelectorAll(".view-toggle-btn").forEach((button) => {
      const on = button.dataset.view === (store ? "store" : "rooms");
      button.classList.toggle("is-on", on);
      button.setAttribute("aria-pressed", on ? "true" : "false");
    });
    if (!store && location.hash === "#store") history.replaceState(null, "", location.pathname + location.search);
    window.scrollTo(0, 0);
  }

  document.querySelectorAll(".view-toggle-btn").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });
  document.querySelectorAll(".nav a").forEach((link) => {
    link.addEventListener("click", () => setView("rooms"));
  });

  paint();
  wireShop();
  renderRecent();
  mountStore();
  if (location.hash === "#store") setView("store");
  if (document.readyState === "complete") activate(active, false);
  else window.addEventListener("load", () => activate(active, false));
})();
