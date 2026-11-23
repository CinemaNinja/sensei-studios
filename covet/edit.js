(function () {
  const stage = document.getElementById("edit-stage");
  if (!stage) return;

  const slides = [...stage.querySelectorAll(".edit-slide")];
  const caption = document.getElementById("edit-caption");
  const dots = document.getElementById("edit-dots");
  const prev = stage.querySelector(".edit-arrow.prev");
  const next = stage.querySelector(".edit-arrow.next");
  if (!slides.length || !dots) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dwell = 7600;
  let index = Math.max(0, slides.findIndex((slide) => slide.classList.contains("is-on")));
  let timer = 0;
  let paused = reduce;
  let seen = false;

  slides.forEach((slide, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-label", slide.dataset.caption || "Image " + (i + 1));
    button.addEventListener("click", () => show(i, true));
    dots.appendChild(button);
  });

  function paint(user) {
    slides.forEach((slide, i) => {
      const on = i === index;
      slide.classList.toggle("is-on", on);
      slide.setAttribute("aria-hidden", on ? "false" : "true");
    });
    [...dots.children].forEach((button, i) => {
      button.setAttribute("aria-selected", i === index ? "true" : "false");
    });
    if (caption) {
      caption.textContent = slides[index].dataset.caption || "";
      if (user) {
        caption.classList.remove("is-swap");
        void caption.offsetWidth;
        caption.classList.add("is-swap");
      }
    }
    stage.classList.remove("is-playing");
    if (!paused && seen) {
      void stage.offsetWidth;
      stage.classList.add("is-playing");
    }
  }

  function show(nextIndex, user) {
    index = (nextIndex + slides.length) % slides.length;
    paint(user);
    arm();
  }

  function arm() {
    window.clearTimeout(timer);
    if (paused || !seen) return;
    timer = window.setTimeout(() => show(index + 1, false), dwell);
  }

  function setPaused(value) {
    paused = value || reduce;
    if (paused) {
      window.clearTimeout(timer);
      stage.classList.remove("is-playing");
    } else {
      paint(false);
      arm();
    }
  }

  prev && prev.addEventListener("click", () => show(index - 1, true));
  next && next.addEventListener("click", () => show(index + 1, true));

  stage.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") show(index + 1, true);
    if (event.key === "ArrowLeft") show(index - 1, true);
  });

  stage.addEventListener("mouseenter", () => setPaused(true));
  stage.addEventListener("mouseleave", () => setPaused(false));
  stage.addEventListener("focusin", () => setPaused(true));
  stage.addEventListener("focusout", (event) => {
    if (!stage.contains(event.relatedTarget)) setPaused(false);
  });

  let startX = 0;
  stage.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    startX = event.clientX;
  });
  stage.addEventListener("pointerup", (event) => {
    if (!startX || event.target.closest("button")) return;
    const delta = event.clientX - startX;
    startX = 0;
    if (Math.abs(delta) > 48) show(index + (delta < 0 ? 1 : -1), true);
  });

  document.addEventListener("visibilitychange", () => {
    if (!seen) return;
    setPaused(document.hidden);
  });

  const watch = new IntersectionObserver((entries) => {
    seen = entries.some((entry) => entry.isIntersecting);
    setPaused(!seen);
  }, { threshold: 0.4 });
  watch.observe(stage);

  paint(false);
})();
