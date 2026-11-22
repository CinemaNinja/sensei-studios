const jewels = Array.from(document.querySelectorAll(".jewel"));
const stage = document.getElementById("stage");
const caption = document.getElementById("caption");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let angle = 0;
let velocity = reduce ? 0 : 0.00085;
const baseVelocity = velocity;
let dragging = false;
let lastX = 0;
let moved = 0;
let glide = 0;
let seek = null;
let front = -1;
let looking = false;

const look = document.getElementById("look");
const lookImg = document.getElementById("look-img");
const loupe = look.querySelector(".loupe");
const lookKicker = look.querySelector(".look-kicker");

function bring(index) {
  const n = jewels.length;
  const tau = Math.PI * 2;
  const targetBase = -(index / n) * tau;
  let diff = targetBase - angle;
  diff = ((diff % tau) + tau) % tau;
  if (diff > Math.PI) diff -= tau;
  seek = { from: angle, to: angle + diff, t: 0 };
  velocity = 0;
}

function show(index) {
  const el = jewels[index];
  const designer = caption.querySelector(".cap-designer");
  const name = caption.querySelector(".cap-name");
  const meta = caption.querySelector(".cap-meta");
  const link = document.getElementById("cap-link");
  caption.classList.add("is-swapping");
  window.setTimeout(() => {
    designer.textContent = el.dataset.designer;
    name.textContent = el.dataset.name;
    meta.textContent = el.dataset.price
      ? el.dataset.kind + " · " + el.dataset.price
      : el.dataset.kind;
    if (el.dataset.href) {
      link.hidden = false;
      link.href = el.dataset.href;
    } else {
      link.hidden = true;
    }
    caption.classList.remove("is-swapping");
  }, reduce ? 0 : 180);
}

function openLook(el) {
  const img = el.querySelector("img");
  lookImg.src = img.currentSrc || img.src;
  lookImg.alt = img.alt;
  lookKicker.textContent = el.dataset.designer + " · " + el.dataset.name;
  loupe.hidden = true;
  looking = true;
  look.showModal();
}

function placeLoupe(event) {
  const rect = lookImg.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
    loupe.hidden = true;
    return;
  }
  const zoom = 2.7;
  const lift = event.pointerType === "touch" ? -110 : 0;
  loupe.hidden = false;
  loupe.style.left = event.clientX + "px";
  loupe.style.top = (event.clientY + lift) + "px";
  loupe.style.backgroundImage = "url(\"" + lookImg.currentSrc + "\")";
  loupe.style.backgroundSize = (rect.width * zoom) + "px " + (rect.height * zoom) + "px";
  loupe.style.backgroundPosition = (-(x * zoom - 86)) + "px " + (-(y * zoom - 86)) + "px";
}

function frame(now) {
  if (looking) {
    requestAnimationFrame(frame);
    return;
  }
  const n = jewels.length;
  if (seek) {
    seek.t = Math.min(1, seek.t + 0.035);
    const eased = 1 - Math.pow(1 - seek.t, 3);
    angle = seek.from + (seek.to - seek.from) * eased;
    if (seek.t >= 1) seek = null;
  } else if (!dragging) {
    velocity += (baseVelocity - velocity) * 0.04;
    angle += velocity + glide;
    glide *= 0.94;
  }

  const width = stage.clientWidth;
  const radius = Math.min(width * 0.36, 440);
  const lift = Math.min(120, stage.clientHeight * 0.16);
  let best = 0;
  let bestDepth = -2;

  jewels.forEach((el, i) => {
    const a = angle + (i / n) * Math.PI * 2;
    const depth = Math.cos(a);
    const x = Math.sin(a) * radius;
    const bob = reduce ? 0 : Math.sin(now / 900 + i * 1.2) * 10;
    const y = depth * lift + bob;
    const scale = 0.58 + ((depth + 1) / 2) * 0.55;
    if (depth > bestDepth) {
      bestDepth = depth;
      best = i;
    }
    const forward = (depth + 1) / 2;
    const glow = Math.pow(Math.max(0, (forward - 0.32) / 0.68), 1.7);
    const img = el.querySelector("img");
    el.style.left = "calc(50% + " + x.toFixed(2) + "px)";
    el.style.top = "calc(44% + " + y.toFixed(2) + "px)";
    el.style.transform = "translate(-50%, -50%) scale(" + scale.toFixed(3) + ")";
    el.style.zIndex = String(Math.round((depth + 1) * 40));
    el.style.opacity = (0.14 + Math.pow(forward, 1.45) * 0.86).toFixed(3);
    img.style.filter = [
      "brightness(" + (0.72 + forward * 0.38).toFixed(3) + ")",
      "drop-shadow(0 " + (10 + forward * 16).toFixed(1) + "px 16px rgba(0, 0, 0, " + (0.22 + forward * 0.28).toFixed(3) + "))",
      "drop-shadow(0 0 " + (8 + glow * 18).toFixed(1) + "px rgba(212, 175, 55, " + (glow * 0.95).toFixed(3) + "))",
      "drop-shadow(0 0 " + (18 + glow * 36).toFixed(1) + "px rgba(212, 175, 55, " + (glow * 0.72).toFixed(3) + "))"
    ].join(" ");
    el.classList.remove("is-front");
  });

  jewels[best].classList.add("is-front");
  jewels[best].style.zIndex = "80";
  if (best !== front) {
    front = best;
    show(best);
  }
  requestAnimationFrame(frame);
}

stage.addEventListener("pointerdown", (event) => {
  dragging = true;
  lastX = event.clientX;
  moved = 0;
  seek = null;
  stage.setPointerCapture(event.pointerId);
});

stage.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  const dx = event.clientX - lastX;
  lastX = event.clientX;
  moved += Math.abs(dx);
  angle += dx * 0.005;
  glide = dx * 0.00035;
});

function endDrag() {
  dragging = false;
}

function shop(el) {
  if (el.dataset.href) {
    window.open(el.dataset.href, "_blank", "noopener");
    return;
  }
  openLook(el);
}

stage.addEventListener("pointerup", endDrag);
stage.addEventListener("pointercancel", endDrag);

stage.addEventListener("wheel", (event) => {
  if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
  event.preventDefault();
  seek = null;
  angle += event.deltaX * 0.005;
  glide = event.deltaX * 0.00035;
}, { passive: false });

jewels.forEach((el) => {
  el.addEventListener("click", () => {
    if (moved > 8) return;
    shop(el);
  });
});

lookImg.addEventListener("pointermove", placeLoupe);
lookImg.addEventListener("pointerleave", () => { loupe.hidden = true; });
look.querySelector(".look-close").addEventListener("click", () => look.close());
look.addEventListener("click", (event) => {
  if (event.target === look || event.target.classList.contains("look-stage")) look.close();
});
look.addEventListener("close", () => {
  looking = false;
  loupe.hidden = true;
});

document.getElementById("prev").addEventListener("click", (event) => {
  event.stopPropagation();
  bring((front - 1 + jewels.length) % jewels.length);
});

document.getElementById("next").addEventListener("click", (event) => {
  event.stopPropagation();
  bring((front + 1) % jewels.length);
});

stage.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") bring((front + 1) % jewels.length);
  if (event.key === "ArrowLeft") bring((front - 1 + jewels.length) % jewels.length);
  if (event.key === "Enter" && front >= 0) shop(jewels[front]);
});

const layers = Array.from(document.querySelectorAll(".layer"));
const nav = document.getElementById("nav");

function onScroll() {
  nav.classList.toggle("is-solid", window.scrollY > 24);
  if (reduce) return;
  layers.forEach((layer) => {
    const parent = layer.closest("section");
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const speed = Number(layer.dataset.speed || 0);
    const shift = rect.top * speed * (parent.classList.contains("hero") ? 0.65 : 1);
    layer.style.transform = "translate3d(0, " + shift.toFixed(1) + "px, 0)";
  });
  const hero = document.querySelector(".hero");
  const jewel = document.querySelector(".hero-jewel");
  if (hero && jewel) {
    jewel.style.transform = "translate3d(0, " + (hero.getBoundingClientRect().top * -0.04).toFixed(1) + "px, 0)";
  }
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();
requestAnimationFrame(frame);
