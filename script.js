/* ==========================================================================
   SENSEI STUDIOS — CINEMATIC ZEN INTERACTIVE ENGINE
   ========================================================================== */

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function senseiTrack(event, section) {
  try {
    const payload = JSON.stringify({
      event: String(event || '').slice(0, 40),
      section: String(section || '').slice(0, 40),
      path: (location.pathname + location.hash).slice(0, 120)
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/event', new Blob([payload], { type: 'application/json' }));
    } else {
      fetch('/api/event', { method: 'POST', body: payload, headers: { 'content-type': 'application/json' }, keepalive: true }).catch(() => {});
    }
  } catch (_) {
    /* analytics must never break the page */
  }
}

const navigationType = (() => {
  const entry = performance.getEntriesByType?.('navigation')?.[0];
  if (entry?.type) return entry.type;
  const legacy = performance.navigation?.type;
  if (legacy === 1) return 'reload';
  if (legacy === 2) return 'back_forward';
  return 'navigate';
})();

if ('scrollRestoration' in history) {
  history.scrollRestoration = navigationType === 'back_forward' ? 'auto' : 'manual';
}

document.addEventListener('DOMContentLoaded', () => {
  applyOpenIntent({ scroll: false });
  initScrollMemory();
  redirectLegacySculptureHash();
  initPreloader();
  initCustomCursor();
  initZenCanvas();
  initTypedText();
  initPortfolioFilters();
  initArsenalFilters();
  initVideoModal();
  initLazyVideos();
  initWoodworkSculptures();
  initEstimatorCalculator();
  initZenAudio();
  initNavigation();
  initSectionDropdowns();
  initChapterRail();
  initEntropyGlyph();
  initContactForm();
  initProtocolSubscribe();
  initProtocolJoinFilm();
  if (typeof initProtocolGlobe === 'function') initProtocolGlobe();
  initPrefillLinks();
  initInquiryTypeToggles();
  initScrollReveals();
  initBackToTop();
  initFooterYear();
  initQueryPrefill();
  initInstagramFeed();
});

/* ==========================================================================
   0. KEEP PLACE ON REFRESH
   ========================================================================== */
function initScrollMemory() {
  const storageKey = 'sensei:scroll';
  const isReload = navigationType === 'reload';
  const locked = () => document.body.classList.contains('loading-lock');

  const pageKey = () => {
    const path = (location.pathname || '/').replace(/\/+$/, '') || '/';
    if (path === '/' || PATH_SECTION[path]) return 'home';
    return path + (location.search || '');
  };

  let holdSaves = isReload;
  let restoring = false;
  let restoreTimer = 0;
  let layoutObserver = null;

  const save = () => {
    if (holdSaves || locked() || restoring) return;
    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          page: pageKey(),
          hash: location.hash,
          open: pageDropdowns().filter((d) => d.open).map((d) => d.id),
          y: Math.round(window.scrollY || window.pageYOffset || 0)
        })
      );
    } catch (_) {
      /* private mode */
    }
  };

  window.addEventListener('pagehide', save);
  window.addEventListener('beforeunload', save);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') save();
  });

  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        save();
        ticking = false;
      });
    },
    { passive: true }
  );

  if (navigationType === 'back_forward') return;

  const scrollInstant = (y) => {
    const html = document.documentElement;
    const previous = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    window.scrollTo({ top: y, left: 0, behavior: 'auto' });
    html.style.scrollBehavior = previous;
  };

  if (!isReload) {
    const afterUnlock = () => {
      jumpToShareTarget();
      requestAnimationFrame(jumpToShareTarget);
    };
    document.addEventListener('sensei:ready', afterUnlock);
    window.addEventListener('load', afterUnlock);
    window.addEventListener('pageshow', (e) => {
      if (!e.persisted) afterUnlock();
    });
    return;
  }

  const readSaved = () => {
    try {
      const data = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
      if (!data || data.page !== pageKey()) return null;
      const y = Number(data.y);
      if (!Number.isFinite(y) || y < 1) return null;
      return data;
    } catch (_) {
      return null;
    }
  };

  const restore = () => {
    if (!restoring || locked()) return;
    const data = readSaved();
    if (!data) return;
    if (Array.isArray(data.open) && data.open.length && typeof setPageDropdownsOpen === 'function') {
      setPageDropdownsOpen(data.open);
    }
    scrollInstant(Number(data.y));
  };

  const stopRestoring = () => {
    restoring = false;
    holdSaves = false;
    if (restoreTimer) {
      clearTimeout(restoreTimer);
      restoreTimer = 0;
    }
    if (layoutObserver) {
      layoutObserver.disconnect();
      layoutObserver = null;
    }
    save();
  };

  const onUserTakeover = () => {
    if (!restoring || locked()) return;
    stopRestoring();
  };

  window.addEventListener('wheel', onUserTakeover, { passive: true });
  window.addEventListener('touchmove', onUserTakeover, { passive: true });
  window.addEventListener('keydown', (e) => {
    if (['PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
      onUserTakeover();
    }
  });

  const scheduleRestore = () => {
    restore();
    requestAnimationFrame(() => {
      restore();
      requestAnimationFrame(restore);
    });
  };

  const armWatch = () => {
    if (!restoring || locked()) return;
    scheduleRestore();
    if (!layoutObserver && 'ResizeObserver' in window) {
      layoutObserver = new ResizeObserver(() => {
        if (!restoring || locked()) return;
        scheduleRestore();
      });
      layoutObserver.observe(document.documentElement);
    }
    if (restoreTimer) clearTimeout(restoreTimer);
    restoreTimer = window.setTimeout(stopRestoring, 2800);
  };

  restoring = true;

  document.addEventListener('sensei:ready', armWatch);
  window.addEventListener('load', armWatch);
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      stopRestoring();
      return;
    }
    armWatch();
  });
  document.fonts?.ready?.then(armWatch);

  if (!document.getElementById('preloader') || !locked()) armWatch();
}

/* ==========================================================================
   1. PRELOADER
   ========================================================================== */
function initPreloader() {
  const preloader = document.getElementById('preloader');
  const body = document.body;
  if (!preloader) return;

  const minShow = prefersReducedMotion() ? 180 : 2400;
  const hardCap = prefersReducedMotion() ? 400 : 4200;
  const started = performance.now();

  function removePreloader() {
    if (preloader.classList.contains('fade-out')) return;
    preloader.classList.add('fade-out');
    body.classList.remove('loading-lock');
    document.dispatchEvent(new Event('sensei:ready'));
    setTimeout(() => {
      preloader.setAttribute('hidden', '');
      preloader.setAttribute('aria-hidden', 'true');
      document.dispatchEvent(new Event('sensei:ready'));
    }, 750);
  }

  function releaseWhenReady() {
    const wait = Math.max(0, minShow - (performance.now() - started));
    setTimeout(removePreloader, wait);
  }

  if (document.readyState === 'complete') {
    releaseWhenReady();
  } else {
    window.addEventListener('load', releaseWhenReady, { once: true });
    setTimeout(removePreloader, hardCap);
  }
}

/* ==========================================================================
   2. CUSTOM CURSOR
   ========================================================================== */
function initCustomCursor() {
  const cursor = document.getElementById('custom-cursor');
  if (!cursor || window.matchMedia('(pointer: coarse)').matches || prefersReducedMotion()) {
    if (cursor) cursor.style.display = 'none';
    return;
  }

  let mouseX = 0;
  let mouseY = 0;
  let cursorX = 0;
  let cursorY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateCursor() {
    cursorX += (mouseX - cursorX) * 0.25;
    cursorY += (mouseY - cursorY) * 0.25;
    cursor.style.left = `${cursorX}px`;
    cursor.style.top = `${cursorY}px`;
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  const selector = 'a, button, .video-card, .checkbox-card, .lane-card, input, select, textarea, .lazy-video-poster';
  document.querySelectorAll(selector).forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
  });
}

/* ==========================================================================
   3. ZEN CANVAS PARTICLES
   ========================================================================== */
function initZenCanvas() {
  const canvas = document.getElementById('zen-canvas');
  if (!canvas || prefersReducedMotion()) {
    if (canvas) canvas.style.display = 'none';
    return;
  }

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);
  let animId = null;
  let running = true;

  const isMobile = width < 768;
  const particleCount = Math.min(Math.floor(width / (isMobile ? 45 : 28)), isMobile ? 28 : 55);
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 0.8,
      color: Math.random() > 0.4 ? 'rgba(255, 168, 52, ' : 'rgba(255, 126, 95, ',
      alpha: Math.random() * 0.45 + 0.08,
      speedX: (Math.random() - 0.5) * 0.35,
      speedY: -Math.random() * 0.5 - 0.15,
      pulse: Math.random() * 0.02
    });
  }

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) render();
  });

  function render() {
    if (!running) return;
    ctx.clearRect(0, 0, width, height);

    particles.forEach((p) => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.alpha += Math.sin(Date.now() * p.pulse) * 0.004;

      if (p.y < -10) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      if (p.x < -10 || p.x > width + 10) p.x = Math.random() * width;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `${p.color}${Math.max(0.05, Math.min(0.7, p.alpha))})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color + '0.6)';
      ctx.fill();
    });

    animId = requestAnimationFrame(render);
  }

  render();
}

/* ==========================================================================
   4. TYPED TEXT
   ========================================================================== */
function initTypedText() {
  const target = document.getElementById('typed-output');
  if (!target) return;

  const phrases = [
    'Master Cinematographer.',
    'Fine Wood Sculptor.',
    'Handpan Musician.',
    '8K Timelapse Pioneer.',
    'Drone Specialist.',
    'Zen Web Designer.',
    'Motion Graphics Artist.',
    'Peace Protocol Architect.'
  ];

  if (prefersReducedMotion()) {
    target.textContent = phrases[0];
    return;
  }

  let phraseIndex = 0;
  let charIndex = phrases[0].length;
  let isDeleting = true;
  target.textContent = phrases[0];

  function typeStep() {
    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
      charIndex--;
      target.textContent = charIndex > 0 ? currentPhrase.substring(0, charIndex) : '\u00A0';
    } else {
      charIndex++;
      target.textContent = currentPhrase.substring(0, charIndex);
    }

    let delay = isDeleting ? 32 : 75;

    if (!isDeleting && charIndex === currentPhrase.length) {
      delay = 2400;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      delay = 400;
    }

    setTimeout(typeStep, delay);
  }

  // Initial delay before starting delete cycle
  setTimeout(typeStep, 2000);
}

/* ==========================================================================
   5. PORTFOLIO FILTERS
   ========================================================================== */
function initPortfolioFilters() {
  const tablist = document.querySelector('.portfolio-filters');
  const filterBtns = [...document.querySelectorAll('.filter-btn')];
  const videoCards = document.querySelectorAll('#video-grid .video-card');
  if (!filterBtns.length) return;

  function applyFilter(btn) {
    filterBtns.forEach((b) => {
      const on = b === btn;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    });

    const filter = btn.getAttribute('data-filter');
    videoCards.forEach((card) => {
      const categories = (card.getAttribute('data-category') || '').split(' ');
      const show = filter === 'all' || categories.includes(filter);
      if (show) {
        card.hidden = false;
        card.style.display = '';
        requestAnimationFrame(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        });
      } else {
        card.style.opacity = '0';
        card.style.transform = prefersReducedMotion() ? 'none' : 'translateY(16px)';
        setTimeout(() => {
          card.style.display = 'none';
          card.hidden = true;
        }, prefersReducedMotion() ? 0 : 280);
      }
    });
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => applyFilter(btn));
  });

  tablist?.addEventListener('keydown', (e) => {
    const idx = filterBtns.indexOf(document.activeElement);
    if (idx < 0) return;
    let next = idx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % filterBtns.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + filterBtns.length) % filterBtns.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = filterBtns.length - 1;
    else return;
    e.preventDefault();
    filterBtns[next].focus();
    applyFilter(filterBtns[next]);
  });
}

/* ==========================================================================
   5B. ARSENAL GEAR FILTERS
   ========================================================================== */
function initArsenalFilters() {
  const filterBtns = document.querySelectorAll('.arsenal-filter-btn');
  const gearCards = document.querySelectorAll('.tactical-gear-card');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      gearCards.forEach((card) => {
        const cat = card.getAttribute('data-category');
        const show = filter === 'all' || cat === filter;

        if (show) {
          card.classList.remove('hidden');
          requestAnimationFrame(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          });
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(12px)';
          setTimeout(() => {
            card.classList.add('hidden');
          }, 200);
        }
      });
    });
  });
}

/* ==========================================================================
   6. VIDEO MODAL (theater + a11y focus trap)
   ========================================================================== */
function initVideoModal() {
  const modal = document.getElementById('video-modal');
  const modalClose = document.getElementById('modal-close-btn');
  const iframeContainer = document.getElementById('modal-iframe-container');
  const modalTitle = document.getElementById('modal-info-title');
  if (!modal || !iframeContainer) return;

  let lastFocus = null;

  function openVideo(type, id, title) {
    let embedUrl = '';
    if (type === 'vimeo') {
      embedUrl = `https://player.vimeo.com/video/${id}?autoplay=1&color=ffa834&title=0&byline=0&portrait=0`;
    } else if (type === 'youtube') {
      embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
    } else {
      return;
    }

    senseiTrack('video_open', title || id);
    lastFocus = document.activeElement;
    iframeContainer.innerHTML = `<iframe src="${embedUrl}" title="${escapeHtml(title || 'Video')}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
    if (modalTitle) modalTitle.textContent = title || 'Sensei Studios Theater';

    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    modalClose?.focus();
  }

  function closeModal() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    iframeContainer.innerHTML = '';
    document.body.style.overflow = '';
    setTimeout(() => {
      modal.hidden = true;
    }, 350);
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function embedInline(card, type, id, title) {
    const wrap = card.querySelector('.video-thumbnail-wrapper');
    if (!wrap) {
      openVideo(type, id, title);
      return;
    }
    senseiTrack('video_play_inline', title || id);
    let embedUrl = '';
    if (type === 'vimeo') {
      embedUrl = `https://player.vimeo.com/video/${id}?autoplay=1&color=ffa834&title=0&byline=0&portrait=0`;
    } else if (type === 'youtube') {
      embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
    } else {
      return;
    }
    wrap.innerHTML = `<iframe src="${embedUrl}" title="${escapeHtml(title || 'Video')}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
    card.classList.add('is-playing');
  }

  document.querySelectorAll('.video-card').forEach((card) => {
    const activate = () => {
      const type = card.getAttribute('data-video-type');
      const id = card.getAttribute('data-video-id');
      const title = card.querySelector('.video-title')?.textContent;
      if (card.getAttribute('data-inline') === 'true') embedInline(card, type, id, title);
      else openVideo(type, id, title);
    };
    const playBtn = card.querySelector('.video-play-btn');
    if (playBtn) playBtn.addEventListener('click', (e) => { e.stopPropagation(); activate(); });
    else card.addEventListener('click', activate);
  });

  document.getElementById('hero-reel-btn')?.addEventListener('click', (e) => {
    const btn = e.currentTarget;
    openVideo(
      btn.getAttribute('data-video-type'),
      btn.getAttribute('data-video-id'),
      btn.getAttribute('data-video-title')
    );
  });

  document.querySelectorAll('[data-open-video]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openVideo(
        btn.getAttribute('data-video-type') || 'youtube',
        btn.getAttribute('data-video-id'),
        btn.getAttribute('data-video-title')
      );
    });
  });

  modalClose?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    if (e.key === 'Tab' && modal.classList.contains('active')) trapFocus(e, modal);
  });

  // Expose for sculpture / external use
  window.__senseiOpenVideo = openVideo;
}

function trapFocus(e, container) {
  const focusable = container.querySelectorAll(
    'button, [href], iframe, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function assetUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//.test(path) || path.startsWith('/')) return path;
  return '/' + path.replace(/^\.\//, '');
}

function pieceUrl(s) {
  return `/wood/${s.slug || `piece-${s.id}`}/`;
}

function statusClass(status) {
  if (status === 'available') return 'status-available';
  if (status === 'reserved') return 'status-reserved';
  if (status === 'sold') return 'status-sold';
  return 'status-exhibiting';
}

function givingHTML(s) {
  if (!s.giving || !s.giving.length) return '';
  const intro = s.givingIntro
    ? `<p class="modal-sculpture-story">${escapeHtml(s.givingIntro)}</p>`
    : '';
  const items = s.giving
    .map((g) => {
      const name = g.url
        ? `<a href="${escapeHtml(g.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(g.name)}</a>`
        : escapeHtml(g.name);
      const detail = g.detail ? ` ${escapeHtml(g.detail)}` : '';
      return `<li>${escapeHtml(g.pct)} to ${name}${detail}</li>`;
    })
    .join('');
  return `${intro}<ul class="masterpiece-giving-list modal-giving-list">${items}</ul>`;
}

function storyHTML(s) {
  const desc = s.desc ? `<p class="modal-sculpture-story">${escapeHtml(s.desc)}</p>` : '';
  return desc + givingHTML(s);
}

function redirectLegacySculptureHash() {
  const hash = window.location.hash || '';
  const match = hash.match(/^#sculpture-(\d+)/);
  if (!match) return;
  const sculptures = window.__SENSEI_SCULPTURES__ || [];
  const piece = sculptures.find((s) => String(s.id) === match[1]);
  if (piece) window.location.replace(pieceUrl(piece));
}

/* ==========================================================================
   7. LAZY YOUTUBE EMBEDS (handpan)
   ========================================================================== */
function initLazyVideos() {
  document.querySelectorAll('.lazy-video').forEach((card) => {
    const poster = card.querySelector('.lazy-video-poster');
    if (!poster) return;

    poster.addEventListener('click', () => {
      const id = card.getAttribute('data-youtube-id');
      const title = card.getAttribute('data-title') || 'Handpan performance';
      if (!id) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'handpan-iframe-wrapper';
      wrapper.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0" title="${escapeHtml(title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      poster.replaceWith(wrapper);
    });
  });
}

/* ==========================================================================
   8. ESTIMATOR → CONTACT HANDOFF
   ========================================================================== */
function initEstimatorCalculator() {
  const checkboxes = document.querySelectorAll('.scope-calc');
  const travelRadios = document.querySelectorAll('.travel-calc');
  const priceDisplay = document.getElementById('estimated-price');
  const selectedList = document.getElementById('estimator-selected-list');
  const travelLine = document.getElementById('estimator-travel-line');
  const lockBtn = document.getElementById('lock-scope-btn');
  if (!priceDisplay) return;

  function getTravel() {
    const picked = [...travelRadios].find((r) => r.checked);
    const multiplier = parseFloat(picked?.value) || 1;
    const label = picked?.getAttribute('data-label') || 'Colorado / local';
    return { multiplier, label };
  }

  function getSelection() {
    const services = [];
    let base = 0;
    checkboxes.forEach((cb) => {
      if (cb.checked) {
        base += parseInt(cb.getAttribute('data-price'), 10) || 0;
        services.push(cb.getAttribute('data-label') || 'Service');
      }
    });
    const travel = getTravel();
    const total = Math.round(base * travel.multiplier);
    return { base, total, services, travel };
  }

  function render() {
    const { total, services, travel } = getSelection();
    animateValue(priceDisplay, total);

    if (travelLine) {
      const extra = travel.multiplier > 1
        ? `${travel.label} · ${travel.multiplier}× (negotiable)`
        : `${travel.label} · 1×`;
      travelLine.textContent = extra;
    }

    if (selectedList) {
      selectedList.innerHTML = services.length
        ? services.map((s) => `<li>${escapeHtml(s)}</li>`).join('')
        : '<li class="muted">No services selected</li>';
    }

    checkboxes.forEach((cb) => {
      const parent = cb.closest('.checkbox-card');
      if (parent) parent.classList.toggle('selected', cb.checked);
    });
    travelRadios.forEach((r) => {
      const parent = r.closest('.travel-card');
      if (parent) parent.classList.toggle('selected', r.checked);
    });
  }

  checkboxes.forEach((cb) => {
    cb.addEventListener('change', render);
  });
  travelRadios.forEach((r) => {
    r.addEventListener('change', render);
  });

  lockBtn?.addEventListener('click', () => {
    const { total, services, travel } = getSelection();
    const totalField = document.getElementById('field-estimator-total');
    const servicesField = document.getElementById('field-estimator-services');
    const notes = document.getElementById('project-notes');
    const projectType = document.getElementById('project-type');
    const budget = document.getElementById('budget-tier');

    if (totalField) totalField.value = `$${total.toLocaleString()}`;
    if (servicesField) servicesField.value = services.join(', ');

    if (notes) {
      const userPart = notes.value.split('--- Scope Estimator ---')[0].trim();
      const scopeBlock = `--- Scope Estimator ---\nEstimated total: $${total.toLocaleString()}\nTravel: ${travel.label} (${travel.multiplier}×, negotiable depending on the job)\nServices: ${services.join(', ') || 'None'}`;
      notes.value = userPart ? `${userPart}\n\n${scopeBlock}` : scopeBlock;
    }

    if (projectType && services.length) {
      if (services.some((s) => /Proposal|Pitch/i.test(s))) {
        projectType.value = 'Web Design / Proposal Site';
      } else if (services.some((s) => /Website|Web Design/i.test(s))) {
        projectType.value = 'Web Design / Website';
      } else if (services.some((s) => /Handpan/i.test(s))) {
        projectType.value = 'Live Handpan Event Performance';
      } else if (services.some((s) => /3D/i.test(s))) {
        projectType.value = '3D Product Animation';
      } else if (services.some((s) => /FPV|Drone/i.test(s))) {
        projectType.value = 'FPV Drone & Hyperlapse';
      } else if (services.some((s) => /Timelapse/i.test(s))) {
        projectType.value = '8K Motion Timelapse';
      } else {
        projectType.value = 'Full Video & 3D Package';
      }
    }

    if (budget) {
      if (total < 5000) budget.value = '$3,000 - $5,000';
      else if (total < 10000) budget.value = '$5,000 - $10,000';
      else budget.value = '$10,000 - $25,000+';
    }

    document.getElementById('contact')?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth'
    });
    setTimeout(() => document.getElementById('client-name')?.focus(), 400);
  });

  render();

  function animateValue(obj, endValue) {
    if (prefersReducedMotion()) {
      obj.textContent = `$${endValue.toLocaleString()}`;
      return;
    }
    const startValue = parseInt(obj.textContent.replace(/[^0-9]/g, ''), 10) || 0;
    const duration = 400;
    let startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const currentValue = Math.floor(progress * (endValue - startValue) + startValue);
      obj.textContent = `$${currentValue.toLocaleString()}`;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
}

/* ==========================================================================
   9. ZEN CHIME (one-shot intentional)
   ========================================================================== */
function initZenAudio() {
  const toggleBtn = document.getElementById('sound-toggle');
  if (!toggleBtn) return;

  let audioCtx = null;

  toggleBtn.addEventListener('click', async () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') await audioCtx.resume();

    playZenChime(audioCtx);
    toggleBtn.setAttribute('aria-pressed', 'true');
    toggleBtn.classList.add('active');
    setTimeout(() => {
      toggleBtn.setAttribute('aria-pressed', 'false');
      toggleBtn.classList.remove('active');
    }, 4500);
  });

  function playZenChime(ctx) {
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.1, ctx.currentTime);
    master.connect(ctx.destination);

    [432, 528, 639].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.8 + idx * 0.25);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.5 + idx);
      osc.connect(gain);
      gain.connect(master);
      osc.start(ctx.currentTime + idx * 0.15);
      osc.stop(ctx.currentTime + 4.5 + idx);
    });
  }
}

/* ==========================================================================
   9B. IN-PAGE SECTION DROPDOWNS
   ========================================================================== */
const SECTION_ALIASES = {
  film: 'work',
  work: 'work',
  arsenal: 'arsenal',
  wood: 'woodwork',
  woodwork: 'woodwork',
  sculptures: 'woodwork',
  handpan: 'handpan',
  web: 'web',
  story: 'bio',
  bio: 'bio',
  protocol: 'protocol',
  vision: 'protocol',
  'peace-protocol': 'protocol',
  estimator: 'estimator',
  scope: 'estimator',
  contact: 'contact'
};

const PATH_SECTION = {
  '/film': 'film',
  '/wood': 'wood',
  '/handpan': 'handpan',
  '/web': 'web',
  '/story': 'story',
  '/peace-protocol': 'protocol',
  '/protocol': 'protocol',
  '/vision': 'protocol',
  '/estimator': 'estimator',
  '/scope': 'estimator',
  '/contact': 'contact'
};

const SECTION_SHARE_PATH = {
  work: '/film',
  woodwork: '/wood',
  handpan: '/handpan',
  web: '/web',
  bio: '/story',
  protocol: '/peace-protocol',
  estimator: '/estimator',
  contact: '/contact',
  arsenal: '/film#arsenal'
};

function sharePathFor(id) {
  return SECTION_SHARE_PATH[id] || '/';
}

function sectionIdFromKey(key) {
  const raw = String(key || '')
    .trim()
    .replace(/^#/, '')
    .toLowerCase();
  if (!raw) return '';
  return SECTION_ALIASES[raw] || raw;
}

function dropdownFor(el) {
  if (!el) return null;
  if (el.matches?.('details.page-dropdown')) return el;
  return el.closest?.('details.page-dropdown') || null;
}

function syncDropdownAria(details) {
  const summary = details.querySelector(':scope > .page-dropdown-summary');
  if (!summary) return;
  summary.setAttribute('aria-expanded', String(details.open));
}

/* ── Enso fill: each circle reflects how many chapters are open ──
   Circumference = 2π·12 ≈ 75.4  (stroke-dasharray 78 in CSS gives a
   tiny visual cap).  Each enso fills a fraction = openCount / total.
   Its *own* chapter being open is shown by a brighter stroke + glow;
   the arc length is always the global ratio so every circle reads like
   a consistent gauge.                                                */
function syncEnsoFill() {
  const all = pageDropdowns();
  if (!all.length) return;
  const total    = all.length;
  const openCount = all.filter(d => d.open).length;
  const C = 78;                       // matches stroke-dasharray in CSS
  const filled = C * (openCount / total);
  const gap    = C - filled;

  all.forEach(d => {
    const circle = d.querySelector('.page-dropdown-enso circle');
    if (!circle) return;

    // Arc length = filled portion; gap = remainder
    circle.style.strokeDasharray  = `${filled} ${gap}`;
    circle.style.strokeDashoffset = '0';

    // Brighter when this chapter is open
    if (d.open) {
      circle.style.stroke  = 'var(--accent-gold-bright)';
      circle.style.filter  = 'drop-shadow(0 0 8px rgba(255,215,0,0.6))';
      circle.style.opacity = '1';
    } else {
      circle.style.stroke  = 'var(--accent-gold)';
      circle.style.filter  = 'drop-shadow(0 0 4px rgba(255,177,66,0.3))';
      circle.style.opacity = '0.55';
    }
  });
}

function scrollToSectionEl(el) {
  if (!el) return;
  const reduce = prefersReducedMotion();
  const html = document.documentElement;
  const previous = html.style.scrollBehavior;
  html.style.scrollBehavior = reduce ? 'auto' : '';
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  html.style.scrollBehavior = previous;
}

function pageDropdowns() {
  return [...document.querySelectorAll('details.page-dropdown')];
}

function setPageDropdownsOpen(keys) {
  const wanted = new Set((keys || []).map((k) => sectionIdFromKey(k)));
  pageDropdowns().forEach((details) => {
    const shouldOpen = wanted.size === 0 ? true : wanted.has(details.id);
    if (details.open !== shouldOpen) details.open = shouldOpen;
    syncDropdownAria(details);
  });
}

function allChapterKeys() {
  return pageDropdowns().map((details) => details.id);
}

function initialChapterKeys() {
  return allChapterKeys();
}

function jumpToShareTarget() {
  const { key } = homeOpenIntent();
  if (!key) return false;
  const id = sectionIdFromKey(key);
  const el = document.getElementById(id);
  if (!el) return false;
  openHomeSection(id, { scroll: false, exclusive: false, updateUrl: false });
  const html = document.documentElement;
  const previous = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  el.scrollIntoView({ behavior: 'auto', block: 'start' });
  requestAnimationFrame(() => el.scrollIntoView({ behavior: 'auto', block: 'start' }));
  setTimeout(() => el.scrollIntoView({ behavior: 'auto', block: 'start' }), 120);
  setTimeout(() => el.scrollIntoView({ behavior: 'auto', block: 'start' }), 480);
  html.style.scrollBehavior = previous;
  return true;
}

function homeOpenIntent() {
  const params = new URLSearchParams(location.search);
  const open = params.get('open') || params.get('section');
  const hash = (location.hash || '').replace('#', '');
  const meta = document.querySelector('meta[name="sensei:section"]')?.getAttribute('content') || '';
  const path = (location.pathname || '/').replace(/\/+$/, '') || '/';
  const pathKey = PATH_SECTION[path] || '';
  return { open, hash, key: open || hash || meta || pathKey };
}

function scheduleDropdownBootReveal() {
  if (prefersReducedMotion()) return;
  if (document.documentElement.classList.contains('dropdowns-boot')) return;

  const run = () => {
    if (document.documentElement.classList.contains('dropdowns-boot')) return;
    pageDropdowns().forEach((details, i) => {
      details.style.setProperty('--dropdown-stagger', `${i * 140}ms`);
    });
    document.documentElement.classList.add('dropdowns-boot');
  };

  const preloader = document.getElementById('preloader');
  if (preloader && !preloader.hasAttribute('hidden') && !preloader.classList.contains('fade-out')) {
    document.addEventListener('sensei:ready', run, { once: true });
    return;
  }
  run();
}

function openHomeSection(key, { scroll = true, exclusive = false, updateUrl = false } = {}) {
  const id = sectionIdFromKey(key);
  if (!id) return false;
  const target = document.getElementById(id);
  if (!target) return false;

  const dropdown = dropdownFor(target);
  if (exclusive) {
    pageDropdowns().forEach((d) => {
      if (d !== dropdown && d.open) {
        d.open = false;
        syncDropdownAria(d);
      }
    });
  }
  if (dropdown && !dropdown.open) {
    dropdown.open = true;
    syncDropdownAria(dropdown);
  }

  // If opening Arsenal (or another nested details), expand it
  const nested = target.matches?.('details.arsenal-dropdown') ? target : target.closest?.('details.arsenal-dropdown');
  if (nested && !nested.open) {
    nested.open = true;
    const nestedSummary = nested.querySelector(':scope > summary');
    if (nestedSummary) nestedSummary.setAttribute('aria-expanded', 'true');
  }

  if (updateUrl) {
    const next = sharePathFor(id);
    if ((location.pathname + location.hash) !== next) {
      history.pushState({ section: id }, '', next);
    }
    senseiTrack('chapter_open', key);
  }

  if (scroll) {
    requestAnimationFrame(() => {
      scrollToSectionEl(target);
      setTimeout(() => scrollToSectionEl(target), 80);
    });
  }
  return true;
}

function applyOpenIntent({ scroll = false } = {}) {
  if (!document.querySelector('details.page-dropdown')) return false;
  const { open, key } = homeOpenIntent();
  if (!key) return false;
  const ok = openHomeSection(key, { scroll, exclusive: false, updateUrl: false });
  if (ok) {
    const id = sectionIdFromKey(key);
    const next = sharePathFor(id);
    if (id && (location.search || (location.pathname + location.hash) !== next)) {
      history.replaceState(null, '', next);
    }
  }
  return ok;
}

function sectionKeyFromHref(href) {
  try {
    const url = new URL(href, location.origin);
    if (url.origin !== location.origin) return '';
    const open = url.searchParams.get('open') || url.searchParams.get('section');
    if (open) return open;
    const hash = (url.hash || '').replace('#', '');
    if (hash && (SECTION_ALIASES[hash] || document.getElementById(hash))) return hash;
    const path = (url.pathname || '/').replace(/\/+$/, '') || '/';
    if (PATH_SECTION[path]) {
      return hash === 'arsenal' ? 'arsenal' : PATH_SECTION[path];
    }
  } catch (_) {
    /* ignore */
  }
  return '';
}

function initSectionDropdowns() {
  const dropdowns = pageDropdowns();
  if (!dropdowns.length) return;

  dropdowns.forEach((details) => {
    const summary = details.querySelector(':scope > .page-dropdown-summary');
    if (summary) {
      if (!summary.id) summary.id = details.id + '-summary';
      summary.setAttribute('aria-expanded', String(details.open));
      summary.setAttribute('aria-controls', details.id + '-panel');
    }
    const panel = details.querySelector(':scope > .page-dropdown-panel');
    if (panel && !panel.id) panel.id = details.id + '-panel';

    details.addEventListener('toggle', () => {
      syncDropdownAria(details);
      syncEnsoFill();
    });
  });

  // Initial enso fill on load
  syncEnsoFill();

  // Track Arsenal sub-dropdown
  const arsenalDropdown = document.getElementById('arsenal');
  if (arsenalDropdown && arsenalDropdown.tagName === 'DETAILS') {
    const summary = arsenalDropdown.querySelector(':scope > summary');
    if (summary) {
      summary.setAttribute('aria-expanded', String(arsenalDropdown.open));
    }
    arsenalDropdown.addEventListener('toggle', () => {
      if (summary) summary.setAttribute('aria-expanded', String(arsenalDropdown.open));
    });
  }

  setPageDropdownsOpen(initialChapterKeys());
  scheduleDropdownBootReveal();

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link || link.target === '_blank') return;
    const key = sectionKeyFromHref(link.getAttribute('href'));
    if (!key) return;
    if (!document.getElementById(sectionIdFromKey(key))) return;
    e.preventDefault();
    openHomeSection(key, { scroll: true, exclusive: false, updateUrl: true });
    document.getElementById('nav-links')?.classList.remove('mobile-open');
    document.getElementById('nav-hamburger')?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
  });

  window.addEventListener('hashchange', () => {
    const key = (location.hash || '').replace('#', '');
    if (key) openHomeSection(key, { scroll: true, exclusive: false, updateUrl: false });
  });

  window.addEventListener('popstate', () => {
    applyOpenIntent({ scroll: true });
  });

  document.addEventListener('sensei:ready', () => {
    if (navigationType === 'reload') return;
    jumpToShareTarget();
  });
}

/* ==========================================================================
   9B. CHAPTER RAIL (sticky side nav + scroll progress)
   ========================================================================== */
function initChapterRail() {
  const dropdowns = pageDropdowns();
  if (dropdowns.length < 3 || document.querySelector('.chapter-rail')) return;

  const C = 2 * Math.PI * 11; // ring circumference for r=11

  const rail = document.createElement('nav');
  rail.className = 'chapter-rail';
  rail.setAttribute('aria-label', 'Chapters');

  const progress = document.createElement('span');
  progress.className = 'chapter-rail-progress';
  progress.innerHTML =
    '<span class="chapter-rail-progress-track" aria-hidden="true"></span>' +
    '<span class="chapter-rail-progress-bar" aria-hidden="true"></span>' +
    '<span class="chapter-rail-progress-ember" aria-hidden="true"></span>';
  rail.appendChild(progress);

  const items = dropdowns.map((d, i) => {
    const key = d.getAttribute('data-section') || d.id;
    const label = d.querySelector('.page-dropdown-title')?.textContent?.trim() || key;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chapter-rail-btn';
    btn.setAttribute('data-chapter', d.id);
    btn.setAttribute('aria-label', label);
    if (!prefersReducedMotion()) {
      btn.style.animationDelay = `${1.4 + i * 0.1}s`;
    }
    btn.innerHTML =
      '<span class="chapter-rail-ring" aria-hidden="true">' +
        '<svg viewBox="0 0 34 34"><circle cx="17" cy="17" r="11" /></svg>' +
      '</span>' +
      '<span class="chapter-rail-dot" aria-hidden="true"></span>' +
      `<span class="chapter-rail-label">${escapeHtml(label)}</span>`;
    btn.addEventListener('click', () => {
      openHomeSection(key, { scroll: true, exclusive: false, updateUrl: true });
    });
    rail.appendChild(btn);
    return { btn, id: d.id, circle: btn.querySelector('circle') };
  });

  document.body.appendChild(rail);
  let requestPaint = () => {};

  /* ── Sync ring arcs to global open ratio + per-chapter state ── */
  function syncRailRings() {
    const total = dropdowns.length;
    const openCount = dropdowns.filter(d => d.open).length;
    const filled = C * (openCount / total);
    const gap = C - filled;
    items.forEach(({ btn, id, circle }) => {
      const d = document.getElementById(id);
      const isOpen = d?.open;
      btn.classList.toggle('is-chapter-open', !!isOpen);
      if (circle) {
        circle.style.strokeDasharray = `${filled} ${gap}`;
      }
    });
  }

  dropdowns.forEach(d => {
    d.addEventListener('toggle', syncRailRings);
  });
  syncRailRings();

  /* ── Scroll-linked active chapter via IntersectionObserver ── */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const match = items.find((item) => item.id === entry.target.id);
          if (!match) return;
          items.forEach((item) => item.btn.classList.toggle('is-active', item === match));
          requestPaint();
        });
      },
      { rootMargin: '-30% 0px -55% 0px' }
    );
    dropdowns.forEach((d) => io.observe(d));
  }

  /* ── Show rail only after scrolling past the hero ── */
  const heroEnd = document.querySelector('details.page-dropdown');
  if (heroEnd && 'IntersectionObserver' in window) {
    const visObs = new IntersectionObserver(
      ([entry]) => {
        rail.classList.toggle('is-visible', entry.isIntersecting || entry.boundingClientRect.top < 0);
        requestPaint();
      },
      { rootMargin: '0px 0px 200px 0px', threshold: 0 }
    );
    visObs.observe(heroEnd);
  } else {
    rail.classList.add('is-visible');
  }

  /* ── Chapter-linked progress: fill reaches the current section, not page % ── */
  const bar = progress.querySelector('.chapter-rail-progress-bar');
  const ember = progress.querySelector('.chapter-rail-progress-ember');
  let ticking = false;

  const layoutTrack = () => {
    const first = items[0]?.btn;
    const last = items[items.length - 1]?.btn;
    if (!first || !last) return;
    const railRect = rail.getBoundingClientRect();
    const a = first.getBoundingClientRect();
    const b = last.getBoundingClientRect();
    const top = a.top + a.height / 2 - railRect.top;
    const bottom = railRect.bottom - (b.top + b.height / 2);
    progress.style.top = `${Math.max(0, top)}px`;
    progress.style.bottom = `${Math.max(0, bottom)}px`;
  };

  const chapterProgress = () => {
    const n = dropdowns.length;
    if (n < 2) return 0;
    const marker = window.scrollY + window.innerHeight * 0.38;
    const starts = dropdowns.map((d) => d.getBoundingClientRect().top + window.scrollY);
    const lastEnd = starts[n - 1] + Math.max(dropdowns[n - 1].offsetHeight || 0, window.innerHeight * 0.5);

    let i = 0;
    for (; i < n - 1; i++) {
      if (marker < starts[i + 1]) break;
    }
    const start = starts[i];
    const end = i < n - 1 ? starts[i + 1] : lastEnd;
    const span = Math.max(1, end - start);
    const local = Math.min(1, Math.max(0, (marker - start) / span));
    return Math.min(1, (i + local) / (n - 1));
  };

  const paintProgress = () => {
    layoutTrack();
    const pct = chapterProgress();
    rail.style.setProperty('--rail-progress', String(pct));
    if (bar) bar.style.height = `${pct * 100}%`;
    if (ember) {
      ember.style.top = `${pct * 100}%`;
      ember.style.opacity = pct > 0.02 ? '1' : '0';
    }
    items.forEach((item, i) => {
      const reached = pct >= i / Math.max(1, items.length - 1) - 0.02;
      item.btn.classList.toggle('is-reached', reached);
    });
  };

  requestPaint = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      paintProgress();
    });
  };

  window.addEventListener('scroll', requestPaint, { passive: true });
  window.addEventListener('resize', requestPaint, { passive: true });
  dropdowns.forEach((d) => d.addEventListener('toggle', requestPaint));
  paintProgress();
}

/* ==========================================================================
   9C. ENTROPY GLYPH (pixels drip off the word, then the white rebuilds)
   ========================================================================== */
function initEntropyGlyph() {
  const term = document.querySelector('.protocol-entropy-term');
  const word = term?.querySelector('.protocol-entropy-word');
  if (!term || !word) return;
  if (term.dataset.entropyGlyph === '1') return;
  if (prefersReducedMotion()) return;
  term.dataset.entropyGlyph = '1';

  let canvas = term.querySelector('.protocol-entropy-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.className = 'protocol-entropy-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    term.appendChild(canvas);
  }
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const off = document.createElement('canvas');
  const octx = off.getContext('2d', { willReadFrequently: true, alpha: true });
  if (!octx) return;

  let dpr = 1;
  let w = 0;
  let h = 0;
  let textH = 0;
  let source = null;
  let live = null;
  let glyphs = [];
  let stolen = [];
  let particles = [];
  let phase = 'hold';
  let phaseUntil = 0;
  let running = false;
  let raf = 0;

  const now = () => performance.now();

  const indexOf = (x, y) => (y * w + x) * 4;

  const rebuildGlyphIndex = () => {
    glyphs = [];
    if (!source) return;
    for (let y = 0; y < textH; y++) {
      for (let x = 0; x < w; x++) {
        const i = indexOf(x, y);
        if (source[i + 3] > 140) {
          const below = y + 1 >= textH ? 0 : source[indexOf(x, y + 1) + 3];
          glyphs.push({ i, x, y, edge: below < 80 });
        }
      }
    }
  };

  const paintWord = () => {
    const cs = getComputedStyle(word);
    const rect = word.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return false;

    dpr = Math.min(2, window.devicePixelRatio || 1);
    textH = Math.ceil(rect.height * dpr);
    const dripRoom = Math.ceil(rect.height * 0.85 * dpr);
    w = Math.ceil(rect.width * dpr);
    h = textH + dripRoom;

    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${h / dpr}px`;
    off.width = w;
    off.height = textH;

    octx.clearRect(0, 0, w, textH);
    octx.fillStyle = '#ffffff';
    octx.font = cs.font;
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    octx.letterSpacing = cs.letterSpacing;
    octx.scale(dpr, dpr);
    octx.fillText((word.textContent || 'ENTROPY').trim().toUpperCase(), rect.width / 2, rect.height / 2);
    octx.setTransform(1, 0, 0, 1, 0, 0);

    const img = octx.getImageData(0, 0, w, textH);
    source = new Uint8ClampedArray(img.data);
    live = new Uint8ClampedArray(img.data);
    stolen = [];
    particles = [];
    rebuildGlyphIndex();
    term.classList.add('is-glyph-live');
    phase = 'hold';
    phaseUntil = now() + 1400;
    return glyphs.length > 40;
  };

  const stealPixel = (g) => {
    if (live[g.i + 3] < 40) return;
    stolen.push({
      i: g.i,
      r: source[g.i],
      g: source[g.i + 1],
      b: source[g.i + 2],
      a: source[g.i + 3],
    });
    live[g.i] = 0;
    live[g.i + 1] = 0;
    live[g.i + 2] = 0;
    live[g.i + 3] = 0;
    for (const n of glyphs) {
      if (n.i === g.i) continue;
      if (Math.abs(n.x - g.x) > 1 || Math.abs(n.y - g.y) > 1) continue;
      if (live[n.i + 3] < 40) continue;
      stolen.push({
        i: n.i,
        r: source[n.i],
        g: source[n.i + 1],
        b: source[n.i + 2],
        a: source[n.i + 3],
      });
      live[n.i] = live[n.i + 1] = live[n.i + 2] = live[n.i + 3] = 0;
    }
    particles.push({
      x: g.x + 0.5,
      y: g.y + 0.5,
      vx: (Math.random() - 0.5) * 0.12,
      vy: 0.28 + Math.random() * 0.4,
      life: 0,
      max: 46 + Math.random() * 32,
      r: 255,
      g: 255,
      b: 255,
      s: 1.4 + Math.random() * 1.3,
    });
  };

  const pickGlyph = () => {
    if (!glyphs.length) return null;
    const bias = Math.random();
    if (bias < 0.88) {
      const edges = glyphs.filter((g) => g.edge && live[g.i + 3] > 40);
      if (edges.length) return edges[(Math.random() * edges.length) | 0];
    }
    const liveGlyphs = glyphs.filter((g) => live[g.i + 3] > 40);
    if (!liveGlyphs.length) return null;
    liveGlyphs.sort((a, b) => b.y - a.y);
    const tail = liveGlyphs.slice(0, Math.max(8, (liveGlyphs.length * 0.35) | 0));
    return tail[(Math.random() * tail.length) | 0];
  };

  const hasLiveNeighbor = (i) => {
    const pixel = i / 4;
    const x = pixel % w;
    const y = (pixel / w) | 0;
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        if (!ox && !oy) continue;
        const nx = x + ox;
        const ny = y + oy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= textH) continue;
        if (live[indexOf(nx, ny) + 3] > 120) return true;
      }
    }
    return false;
  };

  const tick = (t) => {
    if (!running || !live || !source) {
      raf = 0;
      return;
    }

    if (t >= phaseUntil) {
      if (phase === 'hold') {
        phase = 'dissolve';
        phaseUntil = t + 5200;
      } else if (phase === 'dissolve') {
        phase = 'rebuild';
        phaseUntil = t + 3200;
      } else {
        phase = 'hold';
        phaseUntil = t + 1600;
      }
    }

    if (phase === 'dissolve') {
      const budget = 2 + ((Math.random() * 3) | 0);
      const maxStolen = (glyphs.length * 0.16) | 0;
      for (let n = 0; n < budget && stolen.length < maxStolen; n++) {
        const g = pickGlyph();
        if (g) stealPixel(g);
      }
    }

    if (phase === 'rebuild' && stolen.length) {
      stolen.sort((a, b) => {
        const an = hasLiveNeighbor(a.i) ? 0 : 1;
        const bn = hasLiveNeighbor(b.i) ? 0 : 1;
        return an - bn;
      });
      const restore = Math.min(stolen.length, 14 + ((Math.random() * 10) | 0));
      for (let n = 0; n < restore; n++) {
        const p = stolen.shift();
        live[p.i] = p.r;
        live[p.i + 1] = p.g;
        live[p.i + 2] = p.b;
        live[p.i + 3] = p.a;
      }
    }

    ctx.clearRect(0, 0, w, h);
    const img = octx.createImageData(w, textH);
    img.data.set(live);
    octx.putImageData(img, 0, 0);
    ctx.drawImage(off, 0, 0);

    const next = [];
    for (const p of particles) {
      p.life += 1;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.045;
      const k = 1 - p.life / p.max;
      if (k <= 0 || p.y > h) continue;
      ctx.globalAlpha = Math.max(0, k * 0.95);
      ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
      const rw = Math.max(1.6, dpr * p.s);
      const rh = rw * (1.8 + (1 - k) * 1.4);
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, rw, rh, 0, 0, Math.PI * 2);
      ctx.fill();
      next.push(p);
    }
    particles = next;
    ctx.globalAlpha = 1;

    raf = requestAnimationFrame(tick);
  };

  const start = () => {
    if (running) return;
    running = true;
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const stop = () => {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  const boot = () => {
    if (!paintWord()) {
      term.classList.remove('is-glyph-live');
      return;
    }
    start();
  };

  const fontsReady = document.fonts?.ready || Promise.resolve();
  fontsReady.then(() => requestAnimationFrame(boot));

  let resizeWait = 0;
  const onResize = () => {
    clearTimeout(resizeWait);
    resizeWait = setTimeout(boot, 160);
  };
  window.addEventListener('resize', onResize, { passive: true });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) start();
        else stop();
      },
      { rootMargin: '80px 0px' }
    );
    io.observe(term);
  }
}

/* ==========================================================================
   9D. PEACE PROTOCOL MOVEMENT SIGNUP
   ========================================================================== */
function initProtocolJoinFilm() {
  const video = document.getElementById('protocol-join-video');
  if (!video || prefersReducedMotion()) return;

  const playSafe = () => {
    const play = video.play();
    if (play && typeof play.catch === 'function') play.catch(() => {});
  };

  if (!('IntersectionObserver' in window)) {
    playSafe();
    return;
  }

  const stage = video.closest('.protocol-join-film') || video;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) playSafe();
        else video.pause();
      });
    },
    { threshold: 0.25, rootMargin: '80px 0px' }
  );
  observer.observe(stage);
}

function initProtocolSubscribe() {
  const form = document.getElementById('protocol-join-form');
  if (!form) return;
  const input = document.getElementById('protocol-join-email');
  const btn = document.getElementById('protocol-join-btn');
  const note = document.getElementById('protocol-join-note');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = input?.value.trim() || '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      input?.focus();
      if (note) note.textContent = 'Enter a valid email to follow the pilot.';
      return;
    }

    const label = btn?.querySelector('.btn-label');
    const loading = btn?.querySelector('.btn-loading');
    if (btn) btn.disabled = true;
    if (label) label.hidden = true;
    if (loading) loading.hidden = false;

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          email,
          source: 'protocol-section',
          company: form.querySelector('[name="company"]')?.value || ''
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!data.ok) throw new Error('subscribe failed');
      form.classList.add('is-done');
      if (note) note.textContent = 'Welcome aboard. Field notes from the pilot will find you.';
      if (input) input.value = '';
    } catch (_) {
      if (note) note.textContent = 'Something glitched on our end. Try again in a moment.';
    } finally {
      if (btn) btn.disabled = false;
      if (label) label.hidden = false;
      if (loading) loading.hidden = true;
    }
  });
}

/* ==========================================================================
   10. NAVIGATION
   ========================================================================== */
function initNavigation() {
  const nav = document.getElementById('site-nav');
  const hamburger = document.getElementById('nav-hamburger');
  const navLinks = document.getElementById('nav-links');
  const links = document.querySelectorAll('.nav-link');
  if (!nav) return;

  window.addEventListener(
    'scroll',
    () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    },
    { passive: true }
  );

  links.forEach((link) => {
    link.addEventListener('mousemove', (e) => {
      const rect = link.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      link.style.setProperty('--mx', x + '%');
      link.style.setProperty('--my', y + '%');
    });
  });

  const sections = document.querySelectorAll('details.page-dropdown[id], section[id], #arsenal');
  if (sections.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            links.forEach((link) => {
              const href = link.getAttribute('href') || '';
              const hash = href.includes('#') ? href.slice(href.indexOf('#')) : '';
              const open = link.getAttribute('data-open');
              const mapped = open ? SECTION_ALIASES[open] : '';
              link.classList.toggle('active', hash === '#' + id || mapped === id);
            });
          }
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    sections.forEach((section) => observer.observe(section));
  }

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('mobile-open');
      hamburger.setAttribute('aria-expanded', String(isOpen));
      document.body.classList.toggle('nav-open', isOpen);
    });

    links.forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('mobile-open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
      });
    });
  }
}

/* ==========================================================================
   11. CONTACT FORM (FormSubmit AJAX)
   ========================================================================== */
function payloadFromForm(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  return {
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    project_type: data.project_type || '',
    budget: data.budget || '',
    piece: data.piece || '',
    event_date: data.event_date || '',
    event_location: data.event_location || '',
    estimator_total: data.estimator_total || '',
    estimator_services: data.estimator_services || '',
    message: data.message || '',
    company: data.company || ''
  };
}

function mailtoFallback(payload) {
  const subject = encodeURIComponent(
    payload.piece
      ? `Sensei Studios — Sculpture inquiry: ${payload.piece}`
      : 'Sensei Studios — Project Inquiry'
  );
  const body = encodeURIComponent(
    [
      `Name: ${payload.name}`,
      `Email: ${payload.email}`,
      `Phone: ${payload.phone || '—'}`,
      `Type: ${payload.project_type || '—'}`,
      `Budget: ${payload.budget || '—'}`,
      payload.piece ? `Piece: ${payload.piece}` : null,
      payload.event_date ? `Event date: ${payload.event_date}` : null,
      payload.event_location ? `Event location: ${payload.event_location}` : null,
      '',
      payload.message
    ]
      .filter((line) => line !== null)
      .join('\n')
  );
  window.location.href = `mailto:brown@senseistudios.com?subject=${subject}&body=${body}`;
}

function initContactForm() {
  const form = document.getElementById('sensei-contact-form');
  const success = document.getElementById('form-success');
  const resetBtn = document.getElementById('form-success-reset');
  const submitBtn = document.getElementById('form-submit-btn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('client-name');
    const email = document.getElementById('client-email');
    const notes = document.getElementById('project-notes');

    if (!name?.value.trim() || !email?.value.trim() || !notes?.value.trim()) {
      form.reportValidity();
      return;
    }

    const label = submitBtn?.querySelector('.btn-label');
    const loading = submitBtn?.querySelector('.btn-loading');
    if (submitBtn) submitBtn.disabled = true;
    if (label) label.hidden = true;
    if (loading) loading.hidden = false;

    const payload = payloadFromForm(form);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));

      if (data.ok) {
        form.hidden = true;
        if (success) {
          success.hidden = false;
          success.focus?.();
        }
        form.reset();
        return;
      }

      if (data.fallback === 'mailto' && data.mailto) {
        const m = data.mailto;
        window.location.href = `mailto:${m.to}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.body)}`;
        return;
      }

      throw new Error(data.error || 'Submit failed');
    } catch (err) {
      mailtoFallback(payload);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (label) label.hidden = false;
      if (loading) loading.hidden = true;
    }
  });

  resetBtn?.addEventListener('click', () => {
    if (success) success.hidden = true;
    form.hidden = false;
  });
}

function setInquiryType(type) {
  const projectType = document.getElementById('project-type');
  if (type && projectType) projectType.value = type;
  const isSculpture = /sculpture/i.test(type || projectType?.value || '');
  const isHandpan = /handpan/i.test(type || projectType?.value || '');
  document.getElementById('piece-field-wrap')?.toggleAttribute('hidden', !isSculpture);
  document.getElementById('event-date-wrap')?.toggleAttribute('hidden', !isHandpan);
  document.getElementById('event-location-wrap')?.toggleAttribute('hidden', !isHandpan);
  if (isSculpture) {
    const budget = document.getElementById('budget-tier');
    if (budget) budget.value = 'Sculpture acquisition';
  }
}

function initInquiryTypeToggles() {
  const projectType = document.getElementById('project-type');
  if (!projectType) return;
  projectType.addEventListener('change', () => setInquiryType(projectType.value));
  setInquiryType(projectType.value);
}

function initPrefillLinks() {
  document.querySelectorAll('[data-prefill-type], [data-prefill-message], [data-prefill-piece]').forEach((el) => {
    el.addEventListener('click', () => {
      const type = el.getAttribute('data-prefill-type');
      const message = el.getAttribute('data-prefill-message');
      const piece = el.getAttribute('data-prefill-piece');
      const projectType = document.getElementById('project-type');
      const notes = document.getElementById('project-notes');
      const pieceField = document.getElementById('piece-name');
      if (type && projectType) projectType.value = type;
      setInquiryType(type || projectType?.value);
      if (piece && pieceField) pieceField.value = piece;
      if (message && notes) notes.value = message;
    });
  });
}

function initQueryPrefill() {
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type');
  const piece = params.get('piece');
  if (type) setInquiryType(decodeURIComponent(type));
  if (piece) {
    const field = document.getElementById('piece-name');
    if (field) field.value = decodeURIComponent(piece);
    setInquiryType('Fine Wood Sculpture Inquiry');
  }
}

/* ==========================================================================
   12. WOODWORK FROM JSON
   ========================================================================== */
function initWoodworkSculptures() {
  const grid = document.getElementById('sculpture-grid');
  const featuredMount = document.getElementById('woodwork-featured');
  const modal = document.getElementById('sculpture-qr-modal');
  if (!modal || (!grid && !featuredMount)) return;

  const modalClose = document.getElementById('sculpture-modal-close');
  const qrTarget = document.getElementById('qr-code-target');
  const qrDirectLink = document.getElementById('qr-direct-link');
  const modalTitle = document.getElementById('modal-sculpture-title');
  const modalSpecs = document.getElementById('modal-sculpture-specs');
  const modalPrice = document.getElementById('modal-sculpture-price');
  const modalDim = document.getElementById('modal-sculpture-dim');
  const modalStatus = document.getElementById('modal-sculpture-status');
  const modalStory = document.getElementById('modal-sculpture-story');
  const modalPieceLink = document.getElementById('modal-piece-link');
  const reserveBtn = document.getElementById('modal-reserve-btn');

  let lastFocus = null;
  let currentPiece = null;
  let sculptures = [];

  const fallback = window.__SENSEI_SCULPTURES__ || [];

  fetch('/data/sculptures.json')
    .then((r) => {
      if (!r.ok) throw new Error('load failed');
      return r.json();
    })
    .then((data) => {
      sculptures = Array.isArray(data) && data.length ? data : fallback;
      paint(sculptures);
    })
    .catch(() => {
      sculptures = fallback;
      paint(sculptures);
    });

  function paint(items) {
    renderFeatured(items.find((s) => s.isFeatured) || items[0]);
    if (grid) renderGrid(items);
    renderSlideshow(items);
    bindCards();
  }

  function renderFeatured(s) {
    if (!featuredMount || !s) return;
    const card = assetUrl(s.image);
    const full = assetUrl(s.imageFull || s.image);
    featuredMount.innerHTML = `
      <article class="woodwork-hero-masterpiece reveal reveal-visible sculpture-card" id="sculpture-${s.id}"
        data-sculpture-id="${s.id}"
        data-slug="${escapeHtml(s.slug || '')}"
        data-title="${escapeHtml(s.title)}"
        data-price="${escapeHtml(s.price)}"
        data-specs="${escapeHtml(s.specs)}"
        data-dim="${escapeHtml(s.dim)}"
        data-status="${escapeHtml(s.statusLabel || s.status)}"
        data-image-full="${escapeHtml(full)}">
        <div class="masterpiece-img-wrapper">
          <img src="${escapeHtml(full)}" srcset="${escapeHtml(card)} 1024w, ${escapeHtml(full)} 1600w"
            sizes="(max-width: 992px) 100vw, 55vw"
            alt="${escapeHtml(s.title)} — mural by Daniel Kelly Brown" class="masterpiece-img" width="1024" height="448" decoding="async">
        </div>
        <div class="masterpiece-content">
          <div class="masterpiece-badge">Masterpiece mural · featured artwork</div>
          <h3 class="masterpiece-title">${escapeHtml(s.title)}</h3>
          <div class="masterpiece-price-row">
            <span class="masterpiece-price">${escapeHtml(s.price)}</span>
            <span class="masterpiece-status">${escapeHtml(s.statusLabel || '')}</span>
          </div>
          <div class="masterpiece-desc">
            ${storyHTML(s)}
          </div>
          <div class="masterpiece-specs-box">
            <div class="masterpiece-specs-item">
              <span class="masterpiece-spec-label">Specs</span>
              <span class="masterpiece-spec-value">${escapeHtml(s.specs)}</span>
            </div>
            <div class="masterpiece-specs-item" style="margin-top:0.4rem;">
              <span class="masterpiece-spec-label">Craftsmanship</span>
              <span class="masterpiece-spec-value gold">32 demanding days of handcut precision</span>
            </div>
          </div>
          <div class="masterpiece-actions">
            <button type="button" class="btn-qr-trigger btn btn-gold" data-id="${s.id}" aria-label="View ${escapeHtml(s.title)}">View piece</button>
            <a class="btn btn-outline" href="${escapeHtml(pieceUrl(s))}">Piece page</a>
            <button type="button" class="btn btn-outline btn-inquire" data-id="${s.id}">Inquire / reserve</button>
          </div>
        </div>
      </article>`;
  }

  function cardHTML(s) {
    const img = assetUrl(s.image || '/assets/woodwork_hero.webp');
    const full = assetUrl(s.imageFull || img);
    return `
      <article class="sculpture-card reveal reveal-visible" id="sculpture-${s.id}"
        data-sculpture-id="${s.id}"
        data-slug="${escapeHtml(s.slug || '')}"
        data-title="${escapeHtml(s.title)}"
        data-price="${escapeHtml(s.price)}"
        data-specs="${escapeHtml(s.specs)}"
        data-dim="${escapeHtml(s.dim)}"
        data-status="${escapeHtml(s.statusLabel || s.status)}"
        data-image-full="${escapeHtml(full)}">
        <div class="sculpture-img-wrapper">
          <img src="${escapeHtml(img)}"
            srcset="${escapeHtml(img)} 506w, ${escapeHtml(full)} 787w"
            sizes="(max-width: 700px) 100vw, 320px"
            alt="${escapeHtml(s.title)}"
            class="sculpture-img"
            width="506" height="900"
            loading="lazy" decoding="async">
          <span class="sculpture-price-tag">${escapeHtml(s.price)}</span>
          <span class="sculpture-number-badge">Piece #${String(s.id).padStart(2, '0')}</span>
        </div>
        <div class="sculpture-card-body">
          <h3 class="sculpture-title">${escapeHtml(s.title)}</h3>
          <span class="sculpture-status-badge ${statusClass(s.status)}">${escapeHtml(s.statusLabel || s.status)}</span>
          <div class="sculpture-meta">${escapeHtml(s.specs)}</div>
          <p class="sculpture-desc">${escapeHtml(s.desc || '')}</p>
          <div class="sculpture-specs-row">
            <span class="sculpture-dim">${escapeHtml(s.dim)}</span>
            <div class="sculpture-actions">
              <button type="button" class="btn-qr-trigger" data-id="${s.id}" aria-label="View ${escapeHtml(s.title)}">View</button>
              <a class="btn btn-outline btn-sm" href="${escapeHtml(pieceUrl(s))}">Page</a>
              <button type="button" class="btn btn-outline btn-sm btn-inquire" data-id="${s.id}">Inquire</button>
            </div>
          </div>
        </div>
      </article>`;
  }

  function renderGrid(items) {
    if (!grid) return;
    const rest = items.filter((s) => !s.isFeatured);
    grid.innerHTML = rest.map(cardHTML).join('');
  }

  function renderSlideshow(items) {
    const root = document.getElementById('woodwork-slideshow');
    const stage = document.getElementById('wood-show-stage');
    if (!root || !stage || !items.length) return;

    root.hidden = false;
    stage.tabIndex = 0;
    const reduce = prefersReducedMotion();
    const intervalMs = 5600;
    let index = 0;
    let timer = 0;
    let paused = false;

    stage.innerHTML = `
      <div class="wood-show-track">
        ${items.map((s, i) => {
          const img = assetUrl(s.imageFull || s.image);
          const card = assetUrl(s.image || s.imageFull);
          return `
            <article class="wood-show-slide${i === 0 ? ' is-active' : ''}" data-slide-index="${i}" aria-hidden="${i === 0 ? 'false' : 'true'}">
              <a class="wood-show-frame" href="${escapeHtml(pieceUrl(s))}">
                <img src="${escapeHtml(card)}" srcset="${escapeHtml(card)} 800w, ${escapeHtml(img)} 1600w"
                  sizes="(max-width: 900px) 100vw, 70vw"
                  alt="${escapeHtml(s.title)}"
                  width="800" height="1200"
                  ${i === 0 ? '' : 'loading="lazy"'} decoding="async">
              </a>
              <div class="wood-show-caption">
                <div class="wood-show-copy">
                  <span class="wood-show-kicker">Piece ${String(s.id).padStart(2, '0')} · ${escapeHtml(s.statusLabel || 'Exhibiting')}</span>
                  <h4 class="wood-show-title">${escapeHtml(s.title)}</h4>
                  <p class="wood-show-meta">${escapeHtml(s.specs || '')}${s.dim ? ` · ${escapeHtml(s.dim)}` : ''}</p>
                </div>
                <div class="wood-show-aside">
                  <span class="wood-show-price">${escapeHtml(s.price)}</span>
                  <span class="wood-show-price-note">Suggested · sliding scale</span>
                  <div class="wood-show-actions">
                    <a class="btn btn-outline btn-sm" href="${escapeHtml(pieceUrl(s))}">Piece page</a>
                    <button type="button" class="btn btn-gold btn-sm wood-show-inquire" data-title="${escapeHtml(s.title)}" data-price="${escapeHtml(s.price)}">Inquire</button>
                  </div>
                </div>
              </div>
            </article>`;
        }).join('')}
      </div>
      <div class="wood-show-progress" aria-hidden="true"><span class="wood-show-progress-bar"></span></div>
      <button type="button" class="wood-show-arrow wood-show-prev" aria-label="Previous sculpture">‹</button>
      <button type="button" class="wood-show-arrow wood-show-next" aria-label="Next sculpture">›</button>
      <div class="wood-show-dots" role="tablist" aria-label="Sculpture slides">
        ${items.map((s, i) => `
          <button type="button" class="wood-show-dot${i === 0 ? ' is-active' : ''}" role="tab" aria-label="${escapeHtml(s.title)} · ${escapeHtml(s.price)}" aria-selected="${i === 0 ? 'true' : 'false'}" data-index="${i}"></button>
        `).join('')}
      </div>`;

    const slides = [...stage.querySelectorAll('.wood-show-slide')];
    const dots = [...stage.querySelectorAll('.wood-show-dot')];
    const bar = stage.querySelector('.wood-show-progress-bar');

    const go = (next) => {
      index = (next + items.length) % items.length;
      slides.forEach((slide, i) => {
        const on = i === index;
        slide.classList.toggle('is-active', on);
        slide.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      dots.forEach((dot, i) => {
        const on = i === index;
        dot.classList.toggle('is-active', on);
        dot.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      restartProgress();
    };

    const restartProgress = () => {
      if (!bar) return;
      bar.classList.remove('is-running');
      void bar.offsetWidth;
      if (!reduce && !paused) {
        bar.style.setProperty('--wood-show-duration', `${intervalMs}ms`);
        bar.classList.add('is-running');
      }
    };

    const play = () => {
      if (reduce || paused || items.length < 2) return;
      clearInterval(timer);
      timer = window.setInterval(() => go(index + 1), intervalMs);
      restartProgress();
    };

    const stop = () => {
      clearInterval(timer);
      timer = 0;
      bar?.classList.remove('is-running');
    };

    stage.querySelector('.wood-show-prev')?.addEventListener('click', () => {
      go(index - 1);
      play();
    });
    stage.querySelector('.wood-show-next')?.addEventListener('click', () => {
      go(index + 1);
      play();
    });
    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        go(Number(dot.getAttribute('data-index')) || 0);
        play();
      });
    });
    stage.querySelectorAll('.wood-show-inquire').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        inquireSculpture({
          getAttribute: (k) => ({
            'data-title': btn.getAttribute('data-title'),
            'data-price': btn.getAttribute('data-price')
          }[k])
        });
      });
    });

    stage.addEventListener('mouseenter', () => {
      paused = true;
      stop();
    });
    stage.addEventListener('mouseleave', () => {
      paused = false;
      play();
    });
    stage.addEventListener('focusin', () => {
      paused = true;
      stop();
    });
    stage.addEventListener('focusout', (e) => {
      if (stage.contains(e.relatedTarget)) return;
      paused = false;
      play();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else if (!paused) play();
    });
    stage.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(index - 1);
        play();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(index + 1);
        play();
      }
    });

    play();
  }

  function bindCards() {
    document.querySelectorAll('.btn-qr-trigger').forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const card = btn.closest('.sculpture-card');
        if (card) openSculptureModal(card);
      };
    });
    document.querySelectorAll('.btn-inquire').forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const card = btn.closest('.sculpture-card');
        if (card) inquireSculpture(card);
      };
    });
    document.querySelectorAll('.sculpture-card').forEach((card) => {
      card.onclick = (e) => {
        if (e.target.closest('button, a')) return;
        openSculptureModal(card);
      };
    });
  }

  function openSculptureModal(card) {
    const id = card.getAttribute('data-sculpture-id');
    const title = card.getAttribute('data-title');
    const price = card.getAttribute('data-price');
    const specs = card.getAttribute('data-specs');
    const dim = card.getAttribute('data-dim');
    const status = card.getAttribute('data-status');
    const imageFull = assetUrl(card.getAttribute('data-image-full'));
    const slug = card.getAttribute('data-slug');
    const piece = sculptures.find((s) => String(s.id) === String(id));

    currentPiece = { id, title, price, specs, dim, status, slug };
    lastFocus = document.activeElement;

    const targetUrl = `${window.location.origin}${pieceUrl(piece || { slug, id })}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(targetUrl)}`;

    if (qrTarget) {
      qrTarget.innerHTML = `
        <div class="modal-sculpture-photo">
          <img src="${escapeHtml(imageFull || '')}" alt="${escapeHtml(title)}" width="787" height="1400">
        </div>
        <div class="modal-qr-code-wrap">
          <img src="${qrApiUrl}" alt="QR code linking to ${escapeHtml(title)}" width="160" height="160">
        </div>`;
    }
    if (qrDirectLink) qrDirectLink.textContent = targetUrl;
    if (modalTitle) modalTitle.textContent = title;
    if (modalSpecs) modalSpecs.textContent = specs;
    if (modalPrice) modalPrice.textContent = price;
    if (modalDim) modalDim.textContent = dim;
    if (modalStatus) modalStatus.textContent = status || 'Exhibiting at The Grove';
    if (modalStory) modalStory.innerHTML = piece ? storyHTML(piece) : '';
    if (modalPieceLink) modalPieceLink.href = pieceUrl(piece || { slug, id });

    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    modalClose?.focus();
  }

  function closeSculptureModal() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => {
      modal.hidden = true;
    }, 350);
    if (lastFocus?.focus) lastFocus.focus();
  }

  function inquireSculpture(card) {
    const title = card.getAttribute('data-title');
    const price = card.getAttribute('data-price');
    setInquiryType('Fine Wood Sculpture Inquiry');
    const pieceField = document.getElementById('piece-name');
    const notes = document.getElementById('project-notes');
    if (pieceField) pieceField.value = title || '';
    if (notes) {
      notes.value = `Hello Daniel — I am interested in acquiring "${title}" (${price}). Please share availability, install, and next steps.\n`;
    }
    closeSculptureModal();
    document.getElementById('contact')?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth'
    });
    setTimeout(() => document.getElementById('client-name')?.focus(), 400);
  }

  reserveBtn?.addEventListener('click', () => {
    if (!currentPiece) return;
    inquireSculpture({
      getAttribute: (k) => ({
        'data-title': currentPiece.title,
        'data-price': currentPiece.price
      }[k])
    });
  });

  modalClose?.addEventListener('click', closeSculptureModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeSculptureModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeSculptureModal();
    if (e.key === 'Tab' && modal.classList.contains('active')) trapFocus(e, modal);
  });
}

/* ==========================================================================
   13. SCROLL REVEALS
   ========================================================================== */
function initScrollReveals() {
  const els = [...document.querySelectorAll('.reveal')];
  if (!els.length) return;

  const show = (el) => el.classList.add('reveal-visible');

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    els.forEach(show);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          show(entry.target);
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '120px 0px 120px 0px', threshold: 0.01 }
  );

  function paint() {
    const vh = window.innerHeight;
    els.forEach((el) => {
      if (el.classList.contains('reveal-visible')) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < vh + 160 && rect.bottom > -80) {
        show(el);
        io.unobserve(el);
      }
    });
  }

  els.forEach((el) => io.observe(el));
  paint();
  window.addEventListener('load', paint);
  window.addEventListener('scroll', paint, { passive: true });
  document.addEventListener('sensei:ready', paint);
}

/* ==========================================================================
   14. BACK TO TOP + YEAR
   ========================================================================== */
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener(
    'scroll',
    () => {
      btn.hidden = window.scrollY < 600;
    },
    { passive: true }
  );
}

function initFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = String(new Date().getFullYear());
}

/* ==========================================================================
   15. INSTAGRAM FEED
   ========================================================================== */
function initInstagramFeed() {
  const grid = document.getElementById('instagram-grid');
  if (!grid) return;

  const statsEl = document.getElementById('instagram-stats');
  const avatarEl = document.querySelector('.instagram-avatar');

  function formatCount(n) {
    const num = Number(n) || 0;
    if (num >= 10000) return `${Math.round(num / 100) / 10}k`;
    return num.toLocaleString();
  }

  function render(data) {
    if (!data || !Array.isArray(data.posts) || !data.posts.length) return;
    const posts = data.posts.slice(0, 6);
    if (statsEl) {
      const bits = [`Latest ${posts.length} posts`];
      if (data.followers) bits.unshift(`${formatCount(data.followers)} followers`);
      statsEl.textContent = bits.join(' · ');
    }
    if (avatarEl && data.profile_pic && !String(data.profile_pic).includes('cdninstagram')) {
      avatarEl.src = data.profile_pic;
    }
    grid.innerHTML = posts
      .map((p) => {
        const local = p.shortcode ? `/assets/social/ig-${escapeHtml(p.shortcode)}.webp` : '';
        const thumb = local || p.thumbnail || '/assets/social/instagram-avatar.webp';
        const live = p.thumbnail && String(p.thumbnail).startsWith('http') ? p.thumbnail : '';
        const video = p.is_video ? ' data-video="true"' : '';
        const cap = escapeHtml((p.caption || 'Instagram post').slice(0, 90));
        const src = live || thumb;
        return `<a class="instagram-tile" href="${escapeHtml(p.url)}" target="_blank" rel="noopener noreferrer"${video}>
          <img src="${escapeHtml(src)}" alt="${cap}" width="640" height="640" loading="lazy"${local ? ` onerror="this.onerror=null;this.src='${local}'"` : ''}>
          <span class="instagram-tile-cap">${cap}</span>
        </a>`;
      })
      .join('');
  }

  const apply = (data) => {
    if (data && Array.isArray(data.posts) && data.posts.length) {
      render(data);
      return true;
    }
    return false;
  };

  fetch('/api/instagram')
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((data) => {
      if (!apply(data)) return Promise.reject();
    })
    .catch(() => {
      fetch('/data/instagram.json')
        .then((r) => r.json())
        .then(apply)
        .catch(() => {});
    });
}
