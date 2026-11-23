/* The canvas: every piece as a small cutout on one surface, zoomed like a map.
   Cutouts come from canvas-data.js (written by tools/canvas_build.py).
   Rooms and the piece dialogs come from sections.js. */
(function () {
  const section = document.getElementById("canvas");
  const map = document.getElementById("cv-map");
  const world = document.getElementById("cv-world");
  if (!section || !map || !world) return;

  const chips = document.getElementById("cv-rooms");
  const metalChips = document.getElementById("cv-metal");
  const count = document.getElementById("cv-count");
  const caption = document.getElementById("cv-caption");
  const topBar = section.querySelector(".cv-top");
  const data = window.COVET_CANVAS || { pieces: {} };
  const atlasUrl = data.atlas ? data.atlas + "?v=" + data.version : "";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  // World units. One piece sits in a CELL square; a room is a block of cells.
  const CELL = 100;
  const GAP_X = 14;
  const GAP_Y = 30;
  const ROOM_GAP_X = 72;
  const ROOM_GAP_Y = 56;
  const NEAR = 128;        // a cell this many pixels wide shows its name and price
  const SHARPEN = 1.5;     // swap in the larger cutout once the tiny one is stretched this far
  const KEEP = 120;        // larger cutouts held in memory before old ones are dropped

  const hint = coarse
    ? "Pinch to zoom · drag to move · tap a piece"
    : "Scroll to zoom · drag to move · click a piece";

  let rooms = [];
  let pieces = [];
  let built = false;
  let groupMode = "rooms"; // "rooms" | "metal"
  let size = { w: 0, h: 0 };
  let pad = { t: 0, r: 0, b: 0, l: 0 };
  let extent = { w: 1, h: 1 };
  let kFit = 1;
  let kMin = 0.1;
  let kMax = 8;
  const cam = { x: 0, y: 0, k: 1 };
  const goal = { x: 0, y: 0, k: 1 };
  let raf = 0;
  let shownK = 0;
  let lastSharpen = 0;
  let activeRoom = "all";
  const sharp = [];

  function metalOf(item) {
    const listed = String(item && item.metal || "").toLowerCase();
    if (listed === "gold" || listed === "silver") return listed;
    const blob = [
      item && item.name,
      item && item.image,
      item && item.images && item.images.join(" "),
      item && item.href,
      item && item.kind
    ].filter(Boolean).join(" ").toLowerCase();
    if (/\bsterling\b|\bsilver\b|oxidized|\b92b\b|-92b|_92b/.test(blob)) return "silver";
    if (/\bgold\b|\b18k\b|\b14k\b|-14[ykb]\b/.test(blob)) return "gold";
    if (item && item.section === "covet-collection") return "gold";
    if (item && /earrings|rings|necklaces|chains|locks|charms/.test(item.section || "")) return "gold";
    return "";
  }

  function clamp(value, low, high) {
    return Math.min(high, Math.max(low, value));
  }

  function money(value) {
    const amount = Number(value);
    if (!amount) return "";
    return amount.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  }

  /* ---------- pieces ---------- */

  function makePiece(item) {
    const photo = String(item.image || (item.images && item.images[0]) || "").split("?")[0];
    const cut = data.pieces[photo] || null;
    const el = document.createElement("button");
    el.type = "button";
    el.className = "cv-piece";
    const price = money(item.price);
    el.setAttribute("aria-label", [item.name, item.designer, price].filter(Boolean).join(", "));

    if (cut) {
      el.style.backgroundSize = (data.width / cut.w * 100) + "% " + (data.height / cut.h * 100) + "%";
      el.style.backgroundPosition =
        (cut.x / (data.width - cut.w) * 100) + "% " + (cut.y / (data.height - cut.h) * 100) + "%";
    } else {
      // Not in canvas-data.js yet: show the plain photo until the build is run again.
      el.classList.add("is-plain");
      const img = document.createElement("img");
      img.src = photo;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.draggable = false;
      el.appendChild(img);
    }

    const tag = document.createElement("span");
    tag.className = "cv-tag";
    const name = document.createElement("span");
    name.className = "cv-tag-name";
    name.textContent = item.name || "";
    const meta = document.createElement("span");
    meta.className = "cv-tag-meta";
    meta.textContent = price || item.designer || "";
    tag.append(name, meta);
    el.appendChild(tag);

    const ratio = cut ? cut.w / cut.h : 1;
    return {
      item: item,
      el: el,
      tag: tag,
      cut: cut,
      w: ratio >= 1 ? CELL : CELL * ratio,
      h: ratio >= 1 ? CELL / ratio : CELL,
      x: 0,
      y: 0,
      img: null,
      tries: 0,
      failed: false
    };
  }

  function roomSources() {
    return (window.covetRooms || []).map((source) => ({
      id: source.id,
      label: source.label,
      items: source.items.slice()
    }));
  }

  function metalSources() {
    const gold = [];
    const silver = [];
    roomSources().forEach((source) => {
      source.items.forEach((item) => {
        const metal = metalOf(item);
        if (metal === "silver") silver.push(item);
        else if (metal === "gold") gold.push(item);
      });
    });
    return [
      { id: "gold", label: "Gold", items: gold },
      { id: "silver", label: "Silver", items: silver }
    ].filter((source) => source.items.length);
  }

  function clearSurface() {
    while (world.firstChild) world.removeChild(world.firstChild);
    rooms = [];
    pieces = [];
    sharp.length = 0;
    activeRoom = "all";
  }

  function mountRooms(sources) {
    rooms = sources.map((source) => {
      const label = document.createElement("div");
      label.className = "cv-room";
      const name = document.createElement("span");
      name.className = "cv-room-name";
      name.textContent = source.label;
      const total = document.createElement("span");
      total.className = "cv-room-count";
      total.textContent = String(source.items.length);
      label.append(name, total);
      world.appendChild(label);

      const room = { id: source.id, label: source.label, el: label, pieces: source.items.map(makePiece), x: 0, y: 0, w: 0, h: 0 };
      room.pieces.forEach((piece) => {
        piece.el.dataset.at = String(pieces.length);
        pieces.push(piece);
        world.appendChild(piece.el);
      });
      return room;
    });
    if (count) count.textContent = "The canvas  ·  " + pieces.length + " pieces";
  }

  function paintRoomChips() {
    if (!chips) return;
    chips.querySelectorAll("button").forEach((chip) => {
      const on = groupMode === "rooms" && chip.dataset.room === activeRoom;
      chip.classList.toggle("is-on", on);
      chip.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function paintMetalChips(active) {
    if (!metalChips) return;
    metalChips.querySelectorAll("button").forEach((chip) => {
      const on = groupMode === "metal" && chip.dataset.metal === active;
      chip.classList.toggle("is-on", on);
      chip.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function showGroup(mode, focusId) {
    const next = mode === "metal" ? metalSources() : roomSources();
    if (!next.length) return;
    groupMode = mode === "metal" ? "metal" : "rooms";
    clearSurface();
    mountRooms(next);
    measure();
    layout();
    const target = focusId && rooms.find((room) => room.id === focusId);
    if (target) {
      activeRoom = target.id;
      flyTo(target, true);
    } else {
      activeRoom = "all";
      fit(true);
    }
    paintRoomChips();
    paintMetalChips(groupMode === "metal" ? (focusId || "gold") : "");
  }

  function build() {
    built = true;
    if (atlasUrl) world.style.setProperty("--cv-atlas", 'url("' + atlasUrl + '")');
    if (caption) caption.textContent = hint;

    mountRooms(roomSources());

    if (chips) {
      chips.innerHTML = "";
      [{ id: "all", label: "All" }].concat(rooms).forEach((room) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.dataset.room = room.id;
        chip.textContent = room.label;
        chip.setAttribute("aria-pressed", room.id === "all" ? "true" : "false");
        if (room.id === "all") chip.className = "is-on";
        chip.addEventListener("click", () => {
          const id = chip.dataset.room;
          if (groupMode !== "rooms") {
            showGroup("rooms", id === "all" ? "" : id);
            return;
          }
          activeRoom = id;
          paintRoomChips();
          paintMetalChips("");
          if (id === "all") fit(true);
          else {
            const target = rooms.find((entry) => entry.id === id);
            if (target) flyTo(target, true);
          }
        });
        chips.appendChild(chip);
      });
    }

    if (metalChips) {
      metalChips.querySelectorAll("button").forEach((chip) => {
        chip.addEventListener("click", () => {
          showGroup("metal", chip.dataset.metal);
        });
      });
    }

    if (!atlasUrl) {
      section.classList.add("is-ready");
      return;
    }
    const atlas = new Image();
    atlas.onload = atlas.onerror = () => section.classList.add("is-ready");
    atlas.src = atlasUrl;
  }

  /* ---------- layout ---------- */

  // On-screen size of a room name, held between 16px and 34px at any zoom.
  function labelSize(k) {
    return clamp(34 * k, 16, 34) / k;
  }

  // Rooms flow left to right in bands, each room `rows` cells tall, wrapping
  // once a band is `wrap` cells wide.
  function pack(rows, wrap, k) {
    const font = labelSize(k);
    const head = font * 1.55;
    const wrapWidth = wrap * CELL + (wrap - 1) * GAP_X;
    const bands = [];
    let band = null;
    rooms.forEach((room) => {
      const n = room.pieces.length;
      let cols = Math.min(Math.ceil(n / rows), wrap);
      const deep = Math.ceil(n / cols);
      cols = Math.ceil(n / deep);
      const grid = cols * CELL + (cols - 1) * GAP_X;
      const w = Math.max(grid, font * (room.label.length * 0.47 + 2.2));
      const h = head + deep * CELL + (deep - 1) * GAP_Y;
      if (!band || band.w + ROOM_GAP_X + w > wrapWidth) {
        band = { w: 0, h: 0, rooms: [] };
        bands.push(band);
      }
      const x = band.rooms.length ? band.w + ROOM_GAP_X : 0;
      band.rooms.push({ room: room, x: x, w: w, h: h, cols: cols });
      band.w = x + w;
      band.h = Math.max(band.h, h);
    });
    const w = Math.max.apply(null, bands.map((item) => item.w));
    const h = bands.reduce((sum, item) => sum + item.h, 0) + (bands.length - 1) * ROOM_GAP_Y;
    return { bands: bands, w: w, h: h, head: head };
  }

  function fitScale(w, h) {
    return Math.min((size.w - pad.l - pad.r) / w, (size.h - pad.t - pad.b) / h);
  }

  // Try every band shape and keep the one that shows the pieces largest.
  function layout() {
    if (!rooms.length) return;
    let k = 0.5;
    let best = null;
    for (let pass = 0; pass < 3; pass += 1) {
      best = null;
      for (let rows = 1; rows <= 14; rows += 1) {
        for (let wrap = 3; wrap <= 64; wrap += 1) {
          const plan = pack(rows, wrap, k);
          plan.k = fitScale(plan.w, plan.h);
          if (!best || plan.k > best.k) best = plan;
        }
      }
      k = best.k;
    }

    extent = { w: best.w, h: best.h };
    let y = 0;
    best.bands.forEach((band) => {
      const left = (best.w - band.w) / 2;
      band.rooms.forEach((slot) => {
        const room = slot.room;
        room.x = left + slot.x;
        room.y = y;
        room.w = slot.w;
        room.h = slot.h;
        room.el.style.left = room.x + "px";
        room.el.style.top = room.y + "px";
        room.el.style.height = best.head + "px";
        room.pieces.forEach((piece, i) => {
          const cellX = room.x + (i % slot.cols) * (CELL + GAP_X);
          const cellY = room.y + best.head + Math.floor(i / slot.cols) * (CELL + GAP_Y);
          piece.x = cellX + (CELL - piece.w) / 2;
          piece.y = cellY + (CELL - piece.h) / 2;
          piece.el.style.left = piece.x + "px";
          piece.el.style.top = piece.y + "px";
          piece.el.style.width = piece.w + "px";
          piece.el.style.height = piece.h + "px";
          piece.tag.style.top = (piece.h + (CELL - piece.h) / 2) + "px";
        });
      });
      y += band.h + ROOM_GAP_Y;
    });

    kFit = fitScale(extent.w, extent.h);
    kMin = kFit * 0.8;
    kMax = Math.max(kFit * 6, Math.min(size.w, size.h) * 0.62 / CELL);
  }

  function measure() {
    const nav = document.getElementById("nav");
    const navHeight = nav ? nav.offsetHeight : 0;
    section.style.setProperty("--cv-nav", navHeight + "px");
    size = { w: map.clientWidth, h: map.clientHeight };
    const side = Math.max(14, size.w * 0.03);
    pad = { t: navHeight + (topBar ? topBar.offsetHeight : 0) + 10, r: side, b: 68, l: side };
  }

  /* ---------- camera ---------- */

  function limit() {
    goal.k = clamp(goal.k, kMin, kMax);
    const midX = (pad.l + size.w - pad.r) / 2;
    const midY = (pad.t + size.h - pad.b) / 2;
    goal.x = clamp(goal.x, midX - extent.w * goal.k, midX);
    goal.y = clamp(goal.y, midY - extent.h * goal.k, midY);
  }

  function frame(rect, smooth) {
    const w = size.w - pad.l - pad.r;
    const h = size.h - pad.t - pad.b;
    goal.k = clamp(Math.min(w / rect.w, h / rect.h), kMin, kMax);
    goal.x = pad.l + (w - rect.w * goal.k) / 2 - rect.x * goal.k;
    goal.y = pad.t + (h - rect.h * goal.k) / 2 - rect.y * goal.k;
    limit();
    move(smooth);
  }

  function fit(smooth) {
    frame({ x: 0, y: 0, w: extent.w, h: extent.h }, smooth);
  }

  function flyTo(room, smooth) {
    const margin = 26;
    frame({ x: room.x - margin, y: room.y - margin, w: room.w + margin * 2, h: room.h + margin * 2 }, smooth);
  }

  function zoomAt(factor, sx, sy, smooth) {
    const k = clamp(goal.k * factor, kMin, kMax);
    const wx = (sx - goal.x) / goal.k;
    const wy = (sy - goal.y) / goal.k;
    goal.k = k;
    goal.x = sx - wx * k;
    goal.y = sy - wy * k;
    limit();
    move(smooth);
  }

  function move(smooth) {
    if (!smooth || reduce) {
      cam.x = goal.x;
      cam.y = goal.y;
      cam.k = goal.k;
    }
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function tick(now) {
    raf = 0;
    cam.x += (goal.x - cam.x) * 0.2;
    cam.y += (goal.y - cam.y) * 0.2;
    cam.k += (goal.k - cam.k) * 0.2;
    const still = Math.abs(goal.x - cam.x) < 0.3 && Math.abs(goal.y - cam.y) < 0.3 &&
      Math.abs(goal.k - cam.k) < cam.k * 0.0008;
    if (still) {
      cam.x = goal.x;
      cam.y = goal.y;
      cam.k = goal.k;
    }
    paint();
    if (still || now - lastSharpen > 220) {
      lastSharpen = now;
      sharpen();
      markRoom();
    }
    if (!still) raf = requestAnimationFrame(tick);
  }

  function paint() {
    world.style.transform = "translate(" + cam.x.toFixed(2) + "px," + cam.y.toFixed(2) + "px) scale(" + cam.k.toFixed(5) + ")";

    // Dots on the surface, so there is something to feel move under the hand.
    let step = 40 * cam.k;
    while (step < 26) step *= 2;
    while (step > 52) step /= 2;
    map.style.backgroundSize = step.toFixed(2) + "px " + step.toFixed(2) + "px";
    map.style.backgroundPosition = cam.x.toFixed(2) + "px " + cam.y.toFixed(2) + "px";

    if (Math.abs(cam.k - shownK) > shownK * 0.004) {
      shownK = cam.k;
      world.style.setProperty("--cv-k", cam.k.toFixed(4));
      world.style.setProperty("--cv-label", labelSize(cam.k).toFixed(2));
      world.classList.toggle("is-near", CELL * cam.k >= NEAR);
    }
  }

  /* ---------- detail ---------- */

  function inView(piece, margin) {
    const x0 = (-margin - cam.x) / cam.k;
    const y0 = (-margin - cam.y) / cam.k;
    const x1 = (size.w + margin - cam.x) / cam.k;
    const y1 = (size.h + margin - cam.y) / cam.k;
    return piece.x < x1 && piece.x + piece.w > x0 && piece.y < y1 && piece.y + piece.h > y0;
  }

  // Zoomed in far enough that the tiny cutout would look soft: load the larger one.
  function sharpen() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    pieces.forEach((piece) => {
      if (!piece.cut || piece.img || piece.failed) return;
      const shown = Math.max(piece.w, piece.h) * cam.k * dpr;
      if (shown < Math.max(piece.cut.w, piece.cut.h) * SHARPEN) return;
      if (!inView(piece, 120)) return;
      const img = document.createElement("img");
      img.alt = "";
      img.decoding = "async";
      img.draggable = false;
      img.onload = () => {
        if (piece.img === img) piece.el.classList.add("is-sharp");
      };
      img.onerror = () => {
        // The tiny cutout stays in place. Try once more on a later pass, then leave it.
        piece.tries += 1;
        piece.failed = piece.tries >= 2;
        piece.img = null;
        img.remove();
        const at = sharp.indexOf(piece);
        if (at >= 0) sharp.splice(at, 1);
      };
      img.src = piece.cut.src + "?v=" + data.version;
      piece.img = img;
      piece.el.insertBefore(img, piece.tag);
      sharp.push(piece);
    });

    if (sharp.length <= KEEP) return;
    for (let i = 0; i < sharp.length && sharp.length > KEEP * 0.6; i += 1) {
      const piece = sharp[i];
      if (inView(piece, 400)) continue;
      piece.el.classList.remove("is-sharp");
      if (piece.img) piece.img.remove();
      piece.img = null;
      sharp.splice(i, 1);
      i -= 1;
    }
  }

  function markRoom() {
    let id = "all";
    if (cam.k > kFit * 1.2) {
      const x = ((pad.l + size.w - pad.r) / 2 - cam.x) / cam.k;
      const y = ((pad.t + size.h - pad.b) / 2 - cam.y) / cam.k;
      let nearest = Infinity;
      rooms.forEach((room) => {
        const dx = Math.max(room.x - x, 0, x - room.x - room.w);
        const dy = Math.max(room.y - y, 0, y - room.y - room.h);
        const far = Math.hypot(dx, dy);
        if (far < nearest) {
          nearest = far;
          id = room.id;
        }
      });
    }
    if (id === activeRoom) return;
    activeRoom = id;
    if (groupMode === "metal") {
      if (id === "gold" || id === "silver") paintMetalChips(id);
      paintRoomChips();
      return;
    }
    if (!chips) return;
    chips.querySelectorAll("button").forEach((chip) => {
      const on = chip.dataset.room === id;
      chip.classList.toggle("is-on", on);
      chip.setAttribute("aria-pressed", on ? "true" : "false");
      if (on && chips.scrollWidth > chips.clientWidth) {
        chips.scrollTo({ left: chip.offsetLeft - (chips.clientWidth - chip.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" });
      }
    });
  }

  function pieceOf(target) {
    const el = target && target.closest ? target.closest(".cv-piece") : null;
    return el ? pieces[Number(el.dataset.at)] : null;
  }

  function say(piece) {
    if (!caption) return;
    caption.classList.toggle("is-piece", !!piece);
    if (!piece) {
      caption.textContent = hint;
      return;
    }
    const item = piece.item;
    caption.textContent = [item.designer, item.name, money(item.price)].filter(Boolean).join("  ·  ");
  }

  /* ---------- hands ---------- */

  const touches = new Map();
  let dragged = false;
  let speed = { x: 0, y: 0 };
  let lastMove = 0;

  function point(event) {
    const box = map.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }

  map.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    // A first finger or the mouse starts clean, even if an earlier release was missed.
    if (event.isPrimary) touches.clear();
    touches.set(event.pointerId, point(event));
    if (touches.size === 1) {
      dragged = false;
      speed = { x: 0, y: 0 };
      lastMove = event.timeStamp;
      // Stop any glide where it is.
      goal.x = cam.x;
      goal.y = cam.y;
      goal.k = cam.k;
    } else {
      dragged = true;
      touches.forEach((_, id) => {
        try { map.setPointerCapture(id); } catch (err) { /* pointer already gone */ }
      });
    }
  });

  map.addEventListener("pointermove", (event) => {
    const held = touches.get(event.pointerId);
    if (!held) return;
    const now = point(event);

    if (touches.size === 1) {
      const dx = now.x - held.x;
      const dy = now.y - held.y;
      if (!dragged) {
        if (Math.hypot(dx, dy) < 6) return;
        dragged = true;
        map.classList.add("is-dragging");
        try { map.setPointerCapture(event.pointerId); } catch (err) { /* pointer already gone */ }
      }
      const dt = Math.max(1, event.timeStamp - lastMove);
      lastMove = event.timeStamp;
      speed.x = speed.x * 0.4 + (dx / dt) * 0.6;
      speed.y = speed.y * 0.4 + (dy / dt) * 0.6;
      held.x = now.x;
      held.y = now.y;
      goal.x += dx;
      goal.y += dy;
      limit();
      move(false);
      return;
    }

    if (touches.size === 2) {
      const pair = Array.from(touches.values());
      const spread = Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y);
      const midX = (pair[0].x + pair[1].x) / 2;
      const midY = (pair[0].y + pair[1].y) / 2;
      held.x = now.x;
      held.y = now.y;
      const spreadNow = Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y);
      const midXNow = (pair[0].x + pair[1].x) / 2;
      const midYNow = (pair[0].y + pair[1].y) / 2;
      goal.x += midXNow - midX;
      goal.y += midYNow - midY;
      zoomAt(spread > 0 ? spreadNow / spread : 1, midXNow, midYNow, false);
    }
  });

  function release(event) {
    if (!touches.has(event.pointerId)) return;
    touches.delete(event.pointerId);
    if (touches.size) return;
    map.classList.remove("is-dragging");
    if (dragged && !reduce && event.type === "pointerup" && event.timeStamp - lastMove < 70) {
      goal.x += clamp(speed.x * 150, -520, 520);
      goal.y += clamp(speed.y * 150, -520, 520);
      limit();
      move(true);
    }
  }
  map.addEventListener("pointerup", release);
  map.addEventListener("pointercancel", release);

  map.addEventListener("wheel", (event) => {
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 33 : event.deltaMode === 2 ? 400 : 1;
    const turn = event.deltaY * unit;
    const at = point(event);
    zoomAt(clamp(Math.exp(-turn * (event.ctrlKey ? 0.012 : 0.0024)), 0.5, 2), at.x, at.y, true);
  }, { passive: false });

  // Safari on a trackpad reports a pinch this way instead of as a wheel.
  let pinchFrom = 1;
  map.addEventListener("gesturestart", (event) => {
    event.preventDefault();
    pinchFrom = 1;
  });
  map.addEventListener("gesturechange", (event) => {
    event.preventDefault();
    if (touches.size) return;
    const at = point(event);
    zoomAt(event.scale / pinchFrom, at.x, at.y, false);
    pinchFrom = event.scale;
  });

  map.addEventListener("dblclick", (event) => {
    if (pieceOf(event.target)) return;
    const at = point(event);
    zoomAt(2, at.x, at.y, true);
  });

  world.addEventListener("click", (event) => {
    const piece = pieceOf(event.target);
    if (!piece) return;
    // A click that ends a drag is not a choice. A key press (detail 0) always is.
    if (dragged && event.detail > 0) return;
    if (window.covetOpenPiece) window.covetOpenPiece(piece.item);
  });

  world.addEventListener("pointerover", (event) => {
    if (event.pointerType === "touch") return;
    const piece = pieceOf(event.target);
    if (piece) say(piece);
  });
  world.addEventListener("pointerout", (event) => {
    if (pieceOf(event.target) && !pieceOf(event.relatedTarget)) say(null);
  });

  world.addEventListener("focusin", (event) => {
    const piece = pieceOf(event.target);
    if (!piece) return;
    say(piece);
    if (!piece.el.matches(":focus-visible")) return;
    // Reached by keyboard: bring it into the open part of the surface.
    const left = piece.x * goal.k + goal.x;
    const top = piece.y * goal.k + goal.y;
    const right = left + piece.w * goal.k;
    const bottom = top + piece.h * goal.k;
    if (left >= pad.l && right <= size.w - pad.r && top >= pad.t && bottom <= size.h - pad.b) return;
    goal.x += (pad.l + size.w - pad.r) / 2 - (left + right) / 2;
    goal.y += (pad.t + size.h - pad.b) / 2 - (top + bottom) / 2;
    limit();
    move(true);
  });
  world.addEventListener("focusout", () => say(null));

  // A focused piece must never scroll the surface out from under the camera.
  map.addEventListener("scroll", () => {
    map.scrollLeft = 0;
    map.scrollTop = 0;
  });

  function zoomCentre(factor) {
    zoomAt(factor, (pad.l + size.w - pad.r) / 2, (pad.t + size.h - pad.b) / 2, true);
  }

  map.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const step = 120;
    const key = event.key;
    if (key === "+" || key === "=") zoomCentre(1.5);
    else if (key === "-" || key === "_") zoomCentre(1 / 1.5);
    else if (key === "0") fit(true);
    else if (key === "ArrowLeft") { goal.x += step; limit(); move(true); }
    else if (key === "ArrowRight") { goal.x -= step; limit(); move(true); }
    else if (key === "ArrowUp") { goal.y += step; limit(); move(true); }
    else if (key === "ArrowDown") { goal.y -= step; limit(); move(true); }
    else return;
    event.preventDefault();
  });

  document.getElementById("cv-in").addEventListener("click", () => zoomCentre(1.6));
  document.getElementById("cv-out").addEventListener("click", () => zoomCentre(1 / 1.6));
  document.getElementById("cv-fit").addEventListener("click", () => fit(true));

  let resizing = 0;
  window.addEventListener("resize", () => {
    if (section.hidden || !built) return;
    window.clearTimeout(resizing);
    resizing = window.setTimeout(() => {
      // Keep the visitor's place unless the surface itself changed size.
      if (map.clientWidth === size.w && map.clientHeight === size.h) return;
      measure();
      layout();
      fit(false);
    }, 120);
  });

  // Start fetching the atlas as soon as the pointer heads for the Canvas button.
  if (atlasUrl) {
    document.querySelectorAll('button[data-view="canvas"]').forEach((button) => {
      ["pointerenter", "focus", "touchstart"].forEach((type) => {
        button.addEventListener(type, () => { new Image().src = atlasUrl; }, { once: true, passive: true });
      });
    });
  }

  window.covetCanvas = {
    open: function () {
      if (!built) build();
      measure();
      layout();
      fit(false);
    }
  };
})();
