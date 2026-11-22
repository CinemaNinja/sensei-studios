const pieces = Array.isArray(window.NECKLACES) ? window.NECKLACES.slice() : [];
const stage = document.getElementById("stage");
const orbit = document.getElementById("orbit");
const caption = document.getElementById("caption");
const hint = document.getElementById("hint");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const finder = document.getElementById("finder");
const query = document.getElementById("query");
const finderCount = document.getElementById("finder-count");
const findButton = document.getElementById("find");

const look = document.getElementById("look");
const lookImg = document.getElementById("look-img");
const loupe = document.getElementById("loupe");

let list = pieces;
let focus = 0;
let velocity = reduce ? 0 : 0.0016;
const baseVelocity = velocity;
let dragging = false;
let lastX = 0;
let moved = 0;
let glide = 0;
let seek = null;
let front = -1;
let looking = false;
let idle = 0;
let scrubbing = false;
let pointer = { x: 0, y: 0 };

const scrub = document.getElementById("scrub");
const scrubber = document.getElementById("scrubber");

const nodes = new Map();

const halo = document.createElement("div");
halo.className = "halo";
halo.setAttribute("aria-hidden", "true");
const haloImg = document.createElement("img");
haloImg.alt = "";
haloImg.draggable = false;
halo.appendChild(haloImg);
orbit.appendChild(halo);

function paintHalo(best, bestAbs) {
  const piece = list[best];
  const node = piece && nodes.get(piece.handle);
  const arrival = Math.max(0, Math.min(1, 1 - bestAbs / 0.85));
  const glow = arrival * arrival * (3 - 2 * arrival);
  if (!node || node.hidden || glow < 0.02) {
    halo.style.opacity = "0";
    return;
  }
  const src = node.querySelector("img").getAttribute("src");
  if (src && haloImg.getAttribute("src") !== src) haloImg.src = src;
  halo.style.width = node.style.width;
  halo.style.height = node.style.height;
  halo.style.transform = node.style.transform;
  halo.style.zIndex = String(Math.max(1, Number(node.style.zIndex) - 1));
  halo.style.opacity = glow.toFixed(3);
}

function mod(value, count) {
  return ((value % count) + count) % count;
}

function shortest(index, origin, count) {
  let delta = index - origin;
  delta = mod(delta, count);
  if (delta > count / 2) delta -= count;
  return delta;
}

function money(value) {
  const amount = Number(value) || 0;
  const hasCents = Math.round(amount * 100) % 100 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(amount);
}

function srcFor(piece) {
  return "images/float/" + piece.handle + ".png";
}

function shopUrl(piece) {
  return "https://jacquieaiche.com/products/" + piece.handle;
}

function ensureNodes() {
  const keep = new Set(list.map((piece) => piece.handle));
  nodes.forEach((node, handle) => {
    if (!keep.has(handle)) node.remove();
  });
  list.forEach((piece) => {
    if (nodes.has(piece.handle)) return;
    const button = document.createElement("button");
    button.className = "jewel";
    button.type = "button";
    button.dataset.handle = piece.handle;
    const img = document.createElement("img");
    img.alt = piece.title;
    img.draggable = false;
    button.hidden = true;
    button.appendChild(img);
    orbit.appendChild(button);
    nodes.set(piece.handle, button);
  });
}

function pad(value) {
  return String(value).padStart(3, "0");
}

function presenceFor(distance, span) {
  const t = Math.min(1, Math.max(0, distance / span));
  const eased = t * t * (3 - 2 * t);
  return Math.pow(1 - eased, 2.4);
}

let captionTimer = 0;
let lastCaptionAt = 0;

function showCaption(index) {
  const piece = list[index];
  if (!piece) return;
  const count = list.length;
  const now = performance.now();
  const quick = now - lastCaptionAt < 420;
  lastCaptionAt = now;
  window.clearTimeout(captionTimer);
  const apply = () => {
    document.getElementById("cap-index").textContent = pad(index + 1);
    document.getElementById("cap-of").textContent = "of " + pad(count);
    document.getElementById("cap-name").textContent = piece.title;
    document.getElementById("cap-type").textContent = piece.type || "Necklace";
    document.getElementById("cap-price").textContent = money(piece.price);
    document.getElementById("cap-ready").textContent = piece.ready ? "Ready to ship" : "";
    document.getElementById("cap-link").href = shopUrl(piece);
    caption.classList.remove("is-swapping");
  };
  if (quick || reduce) {
    apply();
    return;
  }
  caption.classList.add("is-swapping");
  captionTimer = window.setTimeout(apply, 140);
}

function paintScrub() {
  if (!scrubber || !list.length || scrubbing) return;
  const count = list.length;
  const cycle = mod(focus, count);
  const fraction = cycle / count;
  scrubber.value = String(Math.round(fraction * Number(scrubber.max)));
  scrub.style.setProperty("--p", (fraction * 100).toFixed(3) + "%");
  const place = mod(Math.round(cycle), count) + 1;
  scrubber.setAttribute("aria-valuemax", String(count));
  scrubber.setAttribute("aria-valuetext", place + " of " + count);
}

function scrubTo() {
  const count = list.length;
  if (!count) return;
  const fraction = Number(scrubber.value) / Number(scrubber.max);
  focus = fraction * count;
  seek = null;
  glide = 0;
  velocity = 0;
  idle = 0;
  scrub.style.setProperty("--p", (fraction * 100).toFixed(3) + "%");
}

function beginScrub() {
  scrubbing = true;
  scrub.classList.add("is-scrubbing");
  seek = null;
  glide = 0;
  velocity = 0;
  idle = 0;
  hint.classList.add("is-gone");
}

function endScrub() {
  if (!scrubbing) return;
  scrubbing = false;
  scrub.classList.remove("is-scrubbing");
  idle = 0;
}

function bring(index, speed, ease) {
  if (!list.length) return;
  const delta = shortest(index, focus, list.length);
  seek = {
    from: focus,
    to: focus + delta,
    t: 0,
    speed: speed || 0.06,
    ease: ease || "soft",
  };
  velocity = 0;
  glide = 0;
  idle = 0;
}

function seekCurve(t, ease) {
  const power = ease === "burst" ? 3.2 : 4;
  return 1 - Math.pow(1 - t, power);
}

function openLook(piece) {
  lookImg.src = srcFor(piece);
  lookImg.alt = piece.title;
  document.getElementById("look-kicker").textContent = money(piece.price);
  document.getElementById("look-name").textContent = piece.title;
  document.getElementById("look-link").href = shopUrl(piece);
  loupe.hidden = true;
  looking = true;
  look.showModal();
}

const hitCanvas = document.createElement("canvas");
hitCanvas.width = 1;
hitCanvas.height = 1;
const hitCtx = hitCanvas.getContext("2d", { willReadFrequently: true });

function jewelCoversPoint(jewel, x, y) {
  const img = jewel.querySelector("img");
  if (!img || !img.complete || !img.naturalWidth) return false;
  const rect = img.getBoundingClientRect();
  const u = (x - rect.left) / rect.width;
  const v = (y - rect.top) / rect.height;
  if (u < 0 || v < 0 || u > 1 || v > 1) return false;
  const sx = Math.min(img.naturalWidth - 1, Math.max(0, Math.floor(u * img.naturalWidth)));
  const sy = Math.min(img.naturalHeight - 1, Math.max(0, Math.floor(v * img.naturalHeight)));
  hitCtx.clearRect(0, 0, 1, 1);
  try {
    hitCtx.drawImage(img, sx, sy, 1, 1, 0, 0, 1, 1);
  } catch (err) {
    return false;
  }
  return hitCtx.getImageData(0, 0, 1, 1).data[3] > 28;
}

function jewelUnderPoint(x, y) {
  const seen = new Set();
  for (const el of document.elementsFromPoint(x, y)) {
    const jewel = el.closest ? el.closest(".jewel") : null;
    if (!jewel || jewel.hidden || seen.has(jewel)) continue;
    seen.add(jewel);
    if (jewelCoversPoint(jewel, x, y)) return jewel;
  }
  return null;
}

function onJewel(piece) {
  const index = list.indexOf(piece);
  if (index < 0) return;
  const delta = shortest(index, focus, list.length);
  if (Math.abs(delta) >= 0.35) {
    bring(index, 0.026, "burst");
    hint.classList.add("is-gone");
    return;
  }
  openLook(piece);
}

function placeLoupe(event) {
  const rect = lookImg.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
    loupe.hidden = true;
    return;
  }
  const zoom = 2.6;
  const lift = event.pointerType === "touch" ? -120 : 0;
  loupe.hidden = false;
  loupe.style.left = event.clientX + "px";
  loupe.style.top = (event.clientY + lift) + "px";
  loupe.style.transform = "translate(-50%, -50%)";
  loupe.style.backgroundImage = "url(\"" + lookImg.currentSrc + "\")";
  loupe.style.backgroundSize = (rect.width * zoom) + "px " + (rect.height * zoom) + "px";
  loupe.style.backgroundPosition = (-(x * zoom - 84)) + "px " + (-(y * zoom - 84)) + "px";
}

function frame(now) {
  requestAnimationFrame(frame);
  if (!list.length || looking) return;

  const count = list.length;
  if (seek) {
    seek.t = Math.min(1, seek.t + (reduce ? 1 : (seek.speed || 0.06)));
    const eased = seekCurve(seek.t, seek.ease);
    focus = seek.from + (seek.to - seek.from) * eased;
    if (seek.t >= 1) {
      focus = seek.to;
      seek = null;
    }
  } else if (!dragging && !scrubbing) {
    idle += 1;
    const drift = idle > 90 ? baseVelocity : 0;
    velocity += (drift - velocity) * 0.04;
    focus += velocity + glide;
    glide *= 0.94;
  }

  const width = stage.clientWidth;
  const height = stage.clientHeight;
  const radius = Math.min(width * 0.34, 430);
  const spread = count < 6 ? Math.PI / Math.max(count, 1) : 0.46;
  const windowSize = count < 8 ? count : (width < 720 ? 4 : 7);
  const maxH = height * (width < 720 ? 0.72 : 0.84);
  let best = 0;
  let bestAbs = Infinity;

  list.forEach((piece, index) => {
    const node = nodes.get(piece.handle);
    const delta = shortest(index, focus, count);
    const abs = Math.abs(delta);
    if (abs < bestAbs) {
      bestAbs = abs;
      best = index;
    }
    const img = node.querySelector("img");
    if (abs < windowSize + 2 && !img.getAttribute("src")) img.src = srcFor(piece);
    const presence = abs >= windowSize ? 0 : presenceFor(abs, windowSize);
    if (presence === 0) {
      node.hidden = true;
      node.style.opacity = "0";
      return;
    }
    node.hidden = false;

    const angle = delta * spread;
    const depth = Math.cos(Math.max(-1.2, Math.min(1.2, angle)));
    const x = Math.sin(angle) * radius + pointer.x;
    const bob = reduce ? 0 : Math.sin(now / 1100 + index) * (4 + depth * 5);
    const y = (1 - depth) * 28 + bob + pointer.y * 0.4;
    const fit = Math.min(maxH / piece.h, (width * 0.5) / piece.w);
    const base = Math.max(fit, 0.0001);
    node.style.width = Math.round(piece.w * base) + "px";
    node.style.height = Math.round(piece.h * base) + "px";
    const scale = 0.42 + ((depth + 1) / 2) * 0.58;
    const forward = Math.max(0, Math.min(1, (depth + 1) / 2));
    const sway = reduce ? 0 : Math.sin(now / 1400 + index * 0.7) * 1.1 * forward;
    node.style.transform =
      "translate(-50%, -50%) translate(" + x.toFixed(1) + "px, " + y.toFixed(1) + "px) scale(" +
      scale.toFixed(3) + ") rotate(" + (delta * -7 + sway).toFixed(2) + "deg)";
    node.style.zIndex = String(100 + Math.round((1 - abs / windowSize) * 80));
    node.style.opacity = presence.toFixed(3);
    node.style.pointerEvents = "auto";
    const shadow = (0.04 + forward * 0.16) * presence;
    img.style.filter =
      "drop-shadow(0 " + (16 + forward * 8).toFixed(1) + "px " + (36 + forward * 20).toFixed(1) +
      "px rgba(25, 25, 25, " + (shadow * 0.35).toFixed(3) + "))";
    node.classList.toggle("is-front", abs < 0.35);
  });

  paintHalo(best, bestAbs);

  if (best !== front) {
    front = best;
    showCaption(best);
  }
  paintScrub();
}

scrubber.addEventListener("pointerdown", beginScrub);
scrubber.addEventListener("input", () => {
  beginScrub();
  scrubTo();
});
scrubber.addEventListener("change", endScrub);
window.addEventListener("pointerup", endScrub);
window.addEventListener("pointercancel", endScrub);

stage.addEventListener("pointerdown", (event) => {
  if (event.target.closest(".nudge") || event.target.closest(".scrub")) return;
  dragging = true;
  lastX = event.clientX;
  moved = 0;
  seek = null;
  velocity = 0;
  idle = 0;
  try { stage.setPointerCapture(event.pointerId); } catch (err) { /* already released */ }
  hint.classList.add("is-gone");
});

stage.addEventListener("pointermove", (event) => {
  pointer.x = (event.clientX / window.innerWidth - 0.5) * 14;
  pointer.y = (event.clientY / window.innerHeight - 0.5) * 8;
  if (!dragging) return;
  const dx = event.clientX - lastX;
  lastX = event.clientX;
  moved += Math.abs(dx);
  focus += dx * 0.0048;
  glide = dx * 0.00042;
});

function endDrag(event) {
  const travel = moved;
  dragging = false;
  if (!event || travel > 8 || event.type === "pointercancel") return;
  const jewel = jewelUnderPoint(event.clientX, event.clientY);
  if (!jewel) return;
  const piece = list.find((item) => item.handle === jewel.dataset.handle);
  if (piece) onJewel(piece);
}

stage.addEventListener("pointerup", endDrag);
stage.addEventListener("pointercancel", endDrag);

stage.addEventListener("wheel", (event) => {
  event.preventDefault();
  seek = null;
  idle = 0;
  const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  focus += delta * 0.0016;
  glide = delta * 0.00012;
  hint.classList.add("is-gone");
}, { passive: false });

stage.addEventListener("keydown", (event) => {
  if (!list.length) return;
  if (event.key === "ArrowRight") bring(mod(Math.round(focus) + 1, list.length));
  if (event.key === "ArrowLeft") bring(mod(Math.round(focus) - 1, list.length));
  if (event.key === "Enter" && front >= 0) openLook(list[front]);
});

document.getElementById("prev").addEventListener("click", (event) => {
  event.stopPropagation();
  if (!list.length) return;
  bring(mod(Math.round(focus) - 1, list.length));
});

document.getElementById("next").addEventListener("click", (event) => {
  event.stopPropagation();
  if (!list.length) return;
  bring(mod(Math.round(focus) + 1, list.length));
});

findButton.addEventListener("click", () => {
  const open = finder.hidden;
  finder.hidden = !open;
  findButton.setAttribute("aria-expanded", String(open));
  if (open) query.focus();
});

function applyQuery() {
  const term = query.value.trim().toLowerCase();
  list = term
    ? pieces.filter((piece) => piece.title.toLowerCase().includes(term))
    : pieces.slice();
  finderCount.textContent = term ? list.length + (list.length === 1 ? " piece" : " pieces") : "";
  focus = 0;
  front = -1;
  seek = null;
  glide = 0;
  ensureNodes();
  if (!list.length) {
    document.getElementById("cap-name").textContent = "Nothing under that name.";
    document.getElementById("cap-type").textContent = "";
    document.getElementById("cap-price").textContent = "";
    document.getElementById("cap-ready").textContent = "";
  }
}

query.addEventListener("input", applyQuery);
finder.addEventListener("submit", (event) => event.preventDefault());

window.addEventListener("keydown", (event) => {
  if (event.key === "/" && document.activeElement !== query) {
    event.preventDefault();
    finder.hidden = false;
    findButton.setAttribute("aria-expanded", "true");
    query.focus();
  }
  if (event.key === "Escape" && !finder.hidden && !looking) {
    query.value = "";
    applyQuery();
    finder.hidden = true;
    findButton.setAttribute("aria-expanded", "false");
    stage.focus();
  }
});

lookImg.addEventListener("pointermove", placeLoupe);
lookImg.addEventListener("pointerleave", () => { loupe.hidden = true; });
document.getElementById("look-close").addEventListener("click", () => look.close());
look.addEventListener("click", (event) => {
  if (event.target === look) look.close();
});
look.addEventListener("close", () => {
  looking = false;
  loupe.hidden = true;
});

if (!pieces.length) {
  document.getElementById("cap-name").textContent = "The necklaces are still being cut out.";
} else {
  ensureNodes();
  requestAnimationFrame(frame);
}
