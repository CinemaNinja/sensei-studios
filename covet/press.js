(function () {
  const rail = document.getElementById("press-rail");
  if (!rail) return;

  const leaves = Array.from(rail.querySelectorAll(".leaf"));
  const caption = document.getElementById("press-caption");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let down = false;
  let settling = false;
  let startX = 0;
  let startScroll = 0;
  let moved = 0;
  let current = 0;
  let scrollAnim = 0;
  let timer = 0;
  let paused = reduce;
  let seen = false;

  const maxStart = Math.max(0, leaves.length - 3);

  function clearSpace() {
    rail.style.paddingLeft = "0px";
    rail.style.paddingRight = "0px";
    leaves.forEach((el) => {
      el.style.marginLeft = "";
      el.style.marginRight = "";
    });
  }

  function place(start) {
    const end = Math.min(start + 2, leaves.length - 1);
    clearSpace();
    const group = leaves[end].getBoundingClientRect().right - leaves[start].getBoundingClientRect().left;
    const pad = Math.max(0, (rail.clientWidth - group) / 2);
    leaves[start].style.marginLeft = pad + "px";
    leaves[end].style.marginRight = pad + "px";
    return { end, pad };
  }

  function nearest() {
    const mid = rail.getBoundingClientRect().left + rail.clientWidth / 2;
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i <= maxStart; i++) {
      const a = leaves[i].getBoundingClientRect();
      const b = leaves[Math.min(i + 2, leaves.length - 1)].getBoundingClientRect();
      const d = Math.abs((a.left + b.right) / 2 - mid);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  const firstCenter = leaves.length > 2 ? 1 : 0;
  const lastCenter = maxStart + firstCenter;

  function show(index) {
    current = index;
    leaves.forEach((el, i) => el.classList.toggle("is-on", i === index));
    const el = leaves[index];
    caption.textContent = el.dataset.designer + "  ·  " + el.dataset.name;
  }

  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function scrollToLeft(left, smooth) {
    cancelAnimationFrame(scrollAnim);
    const target = Math.max(0, left);
    if (!smooth || reduce) {
      rail.scrollLeft = target;
      settling = false;
      return;
    }
    const from = rail.scrollLeft;
    const delta = target - from;
    if (Math.abs(delta) < 1) {
      settling = false;
      return;
    }
    const duration = 1200;
    const started = performance.now();
    settling = true;
    function frame(now) {
      const t = Math.min(1, (now - started) / duration);
      rail.scrollLeft = from + delta * easeInOut(t);
      if (t < 1) scrollAnim = requestAnimationFrame(frame);
      else settling = false;
    }
    scrollAnim = requestAnimationFrame(frame);
  }

  function arm() {
    window.clearTimeout(timer);
    if (paused || !seen || reduce) return;
    timer = window.setTimeout(() => {
      go(current + 1, true);
    }, 5000);
  }

  function go(index, smooth) {
    let center = index;
    if (center > lastCenter) center = firstCenter;
    if (center < firstCenter) center = lastCenter;
    const start = center - firstCenter;
    place(start);
    const end = Math.min(start + 2, leaves.length - 1);
    const railBox = rail.getBoundingClientRect();
    const groupMid = (leaves[start].getBoundingClientRect().left + leaves[end].getBoundingClientRect().right) / 2;
    const left = rail.scrollLeft + groupMid - (railBox.left + railBox.width / 2);
    scrollToLeft(left, smooth);
    show(center);
    arm();
  }

  rail.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    down = true;
    moved = 0;
    startX = event.clientX;
    startScroll = rail.scrollLeft;
    rail.classList.add("is-dragging");
    rail.setPointerCapture(event.pointerId);
  });

  rail.addEventListener("pointermove", (event) => {
    if (!down) return;
    moved = Math.abs(event.clientX - startX);
    rail.scrollLeft = startScroll - (event.clientX - startX);
  });

  rail.addEventListener("pointerup", (event) => {
    if (!down) return;
    down = false;
    rail.classList.remove("is-dragging");
    const leaf = event.target.closest(".leaf");
    if (moved < 8 && leaf) openLook(leaf);
    go(nearest() + firstCenter, moved >= 8);
  });

  rail.addEventListener("pointercancel", () => {
    down = false;
    rail.classList.remove("is-dragging");
  });

  rail.addEventListener("scroll", () => {
    if (settling) return;
    show(nearest() + firstCenter);
  }, { passive: true });

  document.getElementById("press-prev").addEventListener("click", () => go(current - 1, true));
  document.getElementById("press-next").addEventListener("click", () => go(current + 1, true));

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

  const stage = rail.closest(".press-stage") || rail;
  stage.addEventListener("pointerenter", () => { paused = true; window.clearTimeout(timer); });
  stage.addEventListener("pointerleave", () => { if (!down) { paused = reduce; arm(); } });

  document.addEventListener("visibilitychange", () => {
    if (!seen) return;
    paused = document.hidden || reduce;
    if (paused) window.clearTimeout(timer);
    else arm();
  });

  const watch = new IntersectionObserver((entries) => {
    seen = entries.some((entry) => entry.isIntersecting);
    paused = !seen || reduce;
    if (paused) window.clearTimeout(timer);
    else arm();
  }, { threshold: 0.45 });
  watch.observe(document.getElementById("press") || rail);

  window.addEventListener("load", () => go(firstCenter, false));
  window.addEventListener("resize", () => go(current, false));
  show(firstCenter);
})();
