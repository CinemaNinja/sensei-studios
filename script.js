/* ==========================================================================
   SENSEI STUDIOS — CINEMATIC ZEN INTERACTIVE ENGINE
   ========================================================================== */

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initCustomCursor();
  initZenCanvas();
  initTypedText();
  initPortfolioFilters();
  initVideoModal();
  initLazyVideos();
  initWoodworkSculptures();
  initEstimatorCalculator();
  initZenAudio();
  initHandpanSample();
  initNavigation();
  initContactForm();
  initPrefillLinks();
  initScrollReveals();
  initBackToTop();
  initFooterYear();
});

/* ==========================================================================
   1. PRELOADER
   ========================================================================== */
function initPreloader() {
  const preloader = document.getElementById('preloader');
  const body = document.body;
  if (!preloader) return;

  const maxWait = prefersReducedMotion() ? 200 : 900;

  function removePreloader() {
    if (preloader.classList.contains('fade-out')) return;
    preloader.classList.add('fade-out');
    body.classList.remove('loading-lock');
    setTimeout(() => {
      preloader.setAttribute('hidden', '');
      preloader.setAttribute('aria-hidden', 'true');
    }, 700);
  }

  if (document.readyState === 'complete') {
    setTimeout(removePreloader, maxWait);
  } else {
    window.addEventListener('load', () => setTimeout(removePreloader, maxWait * 0.4));
    setTimeout(removePreloader, maxWait + 400);
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
    'Acoustic Handpan Musician.',
    '8K Motion-Controlled Timelapse.',
    'Fine Wood Sculptor.',
    'Drone Hyperlapse Timelapse Pioneer.',
    'Elegant Zen Webdesign.',
    '2D & 3D Motion Graphics.',
    'Events and Commercial Videos.',
    'Experienced Video Editor.'
  ];

  if (prefersReducedMotion()) {
    target.textContent = phrases[0];
    return;
  }

  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function typeStep() {
    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
      target.textContent = currentPhrase.substring(0, charIndex - 1);
      charIndex--;
    } else {
      target.textContent = currentPhrase.substring(0, charIndex + 1);
      charIndex++;
    }

    let delay = isDeleting ? 36 : 85;

    if (!isDeleting && charIndex === currentPhrase.length) {
      delay = 2000;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      delay = 350;
    }

    setTimeout(typeStep, delay);
  }

  typeStep();
}

/* ==========================================================================
   5. PORTFOLIO FILTERS
   ========================================================================== */
function initPortfolioFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const videoCards = document.querySelectorAll('.video-card');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const filter = btn.getAttribute('data-filter');

      videoCards.forEach((card) => {
        const categories = (card.getAttribute('data-category') || '').split(' ');
        const show = filter === 'all' || categories.includes(filter);

        if (show) {
          card.hidden = false;
          card.style.display = 'flex';
          requestAnimationFrame(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          });
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(16px)';
          setTimeout(() => {
            card.style.display = 'none';
            card.hidden = true;
          }, 280);
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

  document.querySelectorAll('.video-card').forEach((card) => {
    const activate = () => {
      openVideo(
        card.getAttribute('data-video-type'),
        card.getAttribute('data-video-id'),
        card.querySelector('.video-title')?.textContent
      );
    };
    card.addEventListener('click', activate);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      }
    });
  });

  document.getElementById('hero-reel-btn')?.addEventListener('click', (e) => {
    const btn = e.currentTarget;
    openVideo(
      btn.getAttribute('data-video-type'),
      btn.getAttribute('data-video-id'),
      btn.getAttribute('data-video-title')
    );
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
  const priceDisplay = document.getElementById('estimated-price');
  const selectedList = document.getElementById('estimator-selected-list');
  const lockBtn = document.getElementById('lock-scope-btn');
  if (!priceDisplay) return;

  function getSelection() {
    const services = [];
    let total = 0;
    checkboxes.forEach((cb) => {
      if (cb.checked) {
        total += parseInt(cb.getAttribute('data-price'), 10) || 0;
        services.push(cb.getAttribute('data-label') || 'Service');
      }
    });
    return { total, services };
  }

  function render() {
    const { total, services } = getSelection();
    animateValue(priceDisplay, total);

    if (selectedList) {
      selectedList.innerHTML = services.length
        ? services.map((s) => `<li>${escapeHtml(s)}</li>`).join('')
        : '<li class="muted">No services selected</li>';
    }

    checkboxes.forEach((cb) => {
      const parent = cb.closest('.checkbox-card');
      if (parent) parent.classList.toggle('selected', cb.checked);
    });
  }

  checkboxes.forEach((cb) => {
    cb.addEventListener('change', render);
  });

  lockBtn?.addEventListener('click', () => {
    const { total, services } = getSelection();
    const totalField = document.getElementById('field-estimator-total');
    const servicesField = document.getElementById('field-estimator-services');
    const notes = document.getElementById('project-notes');
    const projectType = document.getElementById('project-type');
    const budget = document.getElementById('budget-tier');

    if (totalField) totalField.value = `$${total.toLocaleString()}`;
    if (servicesField) servicesField.value = services.join(', ');

    if (notes) {
      const userPart = notes.value.split('--- Scope Estimator ---')[0].trim();
      const scopeBlock = `--- Scope Estimator ---\nEstimated total: $${total.toLocaleString()}\nServices: ${services.join(', ') || 'None'}`;
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

function initHandpanSample() {
  const btn = document.getElementById('handpan-sample-btn');
  if (!btn) return;

  let audioCtx = null;
  let playing = false;

  btn.addEventListener('click', async () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') await audioCtx.resume();

    if (playing) return;
    playing = true;
    btn.setAttribute('aria-pressed', 'true');
    btn.classList.add('playing');

    // Soft handpan-like harmonic stack (approximation)
    const master = audioCtx.createGain();
    master.gain.value = 0.09;
    master.connect(audioCtx.destination);

    const base = 293.66; // D
    [1, 1.5, 2, 2.5, 3].forEach((ratio, i) => {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = base * ratio;
      g.gain.setValueAtTime(0, audioCtx.currentTime);
      g.gain.linearRampToValueAtTime(0.05 / (i + 1), audioCtx.currentTime + 0.4 + i * 0.1);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 5);
      osc.connect(g);
      g.connect(master);
      osc.start();
      osc.stop(audioCtx.currentTime + 5.2);
    });

    setTimeout(() => {
      playing = false;
      btn.setAttribute('aria-pressed', 'false');
      btn.classList.remove('playing');
    }, 5200);
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

  const sections = document.querySelectorAll('section[id]');
  if (sections.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            links.forEach((link) => {
              const href = link.getAttribute('href');
              link.classList.toggle('active', href === '#' + id);
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

    const formData = new FormData(form);
    // FormSubmit AJAX endpoint
    const action = form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/');

    try {
      const res = await fetch(action, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' }
      });

      if (!res.ok) throw new Error('Submit failed');

      form.hidden = true;
      if (success) {
        success.hidden = false;
        success.focus?.();
      }
      form.reset();
    } catch (err) {
      // Fallback: open mailto so the lead is never lost
      const subject = encodeURIComponent('Sensei Studios — Project Inquiry');
      const body = encodeURIComponent(
        [
          `Name: ${name.value}`,
          `Email: ${email.value}`,
          `Phone: ${document.getElementById('client-phone')?.value || '—'}`,
          `Type: ${document.getElementById('project-type')?.value || '—'}`,
          `Budget: ${document.getElementById('budget-tier')?.value || '—'}`,
          '',
          notes.value
        ].join('\n')
      );
      window.location.href = `mailto:brown@senseistudios.com?subject=${subject}&body=${body}`;
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

function initPrefillLinks() {
  document.querySelectorAll('[data-prefill-type], [data-prefill-message]').forEach((el) => {
    el.addEventListener('click', () => {
      const type = el.getAttribute('data-prefill-type');
      const message = el.getAttribute('data-prefill-message');
      const projectType = document.getElementById('project-type');
      const notes = document.getElementById('project-notes');
      if (type && projectType) projectType.value = type;
      if (message && notes && !notes.value.trim()) notes.value = message;
    });
  });
}

/* ==========================================================================
   12. WOODWORK FROM JSON
   ========================================================================== */
function initWoodworkSculptures() {
  const grid = document.getElementById('sculpture-grid');
  const modal = document.getElementById('sculpture-qr-modal');
  if (!grid || !modal) return;

  const modalClose = document.getElementById('sculpture-modal-close');
  const qrTarget = document.getElementById('qr-code-target');
  const qrDirectLink = document.getElementById('qr-direct-link');
  const modalTitle = document.getElementById('modal-sculpture-title');
  const modalSpecs = document.getElementById('modal-sculpture-specs');
  const modalPrice = document.getElementById('modal-sculpture-price');
  const modalDim = document.getElementById('modal-sculpture-dim');
  const modalStatus = document.getElementById('modal-sculpture-status');
  const reserveBtn = document.getElementById('modal-reserve-btn');

  let lastFocus = null;
  let currentPiece = null;
  let sculptures = [];

  const fallback = window.__SENSEI_SCULPTURES__ || [];

  fetch('./data/sculptures.json')
    .then((r) => {
      if (!r.ok) throw new Error('load failed');
      return r.json();
    })
    .then((data) => {
      sculptures = Array.isArray(data) && data.length ? data : fallback;
      renderGrid(sculptures);
      handleHashLink();
    })
    .catch(() => {
      sculptures = fallback;
      renderGrid(sculptures);
      handleHashLink();
    });

  function statusClass(status) {
    if (status === 'available') return 'status-available';
    if (status === 'reserved') return 'status-reserved';
    if (status === 'sold') return 'status-sold';
    return 'status-exhibiting';
  }

  function renderGrid(items) {
    const gridItems = items.filter((s) => s.id !== 1);
    grid.innerHTML = gridItems
      .map((s) => {
        const img = s.image || './assets/woodwork_hero.webp';
        const full = s.imageFull || img;
        return `
      <article class="sculpture-card reveal reveal-visible" id="sculpture-${s.id}"
        data-sculpture-id="${s.id}"
        data-title="${escapeHtml(s.title)}"
        data-price="${escapeHtml(s.price)}"
        data-specs="${escapeHtml(s.specs)}"
        data-dim="${escapeHtml(s.dim)}"
        data-status="${escapeHtml(s.statusLabel || s.status)}"
        data-desc="${escapeHtml(s.desc || '')}"
        data-image-full="${escapeHtml(full)}">
        <div class="sculpture-img-wrapper">
          <img src="${escapeHtml(img)}"
            alt="${escapeHtml(s.title)}"
            class="sculpture-img"
            width="506" height="900"
            loading="lazy" decoding="async">
          <span class="sculpture-price-tag">${escapeHtml(s.price)}</span>
          <span class="sculpture-number-badge">Piece #${String(s.id).padStart(2, '0')}</span>
          <span class="sculpture-status-badge ${statusClass(s.status)}">${escapeHtml(s.statusLabel || s.status)}</span>
        </div>
        <div class="sculpture-card-body">
          <h3 class="sculpture-title">${escapeHtml(s.title)}</h3>
          <div class="sculpture-meta">${escapeHtml(s.specs)}</div>
          <p class="sculpture-desc">${escapeHtml(s.desc || '')}</p>
          <div class="sculpture-specs-row">
            <span class="sculpture-dim">${escapeHtml(s.dim)}</span>
            <div class="sculpture-actions">
              <button type="button" class="btn-qr-trigger" data-id="${s.id}" aria-label="QR code for ${escapeHtml(s.title)}">QR Code</button>
              <button type="button" class="btn btn-outline btn-sm btn-inquire" data-id="${s.id}">Inquire</button>
            </div>
          </div>
        </div>
      </article>`;
      })
      .join('');

    document.querySelectorAll('.btn-qr-trigger').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.sculpture-card');
        if (card) openSculptureModal(card);
      });
    });

    document.querySelectorAll('.btn-inquire').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.sculpture-card');
        if (card) inquireSculpture(card);
      });
    });

    document.querySelectorAll('.sculpture-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        openSculptureModal(card);
      });
    });
  }

  function openSculptureModal(card) {
    const id = card.getAttribute('data-sculpture-id');
    const title = card.getAttribute('data-title');
    const price = card.getAttribute('data-price');
    const specs = card.getAttribute('data-specs');
    const dim = card.getAttribute('data-dim');
    const status = card.getAttribute('data-status');
    const imageFull = card.getAttribute('data-image-full');

    currentPiece = { id, title, price, specs, dim, status };
    lastFocus = document.activeElement;

    const targetUrl = `${window.location.origin}${window.location.pathname}#sculpture-${id}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(targetUrl)}`;

    if (qrTarget) {
      qrTarget.innerHTML = `
        <div class="modal-sculpture-photo">
          <img src="${escapeHtml(imageFull || '')}" alt="${escapeHtml(title)}" width="400" height="711" loading="lazy">
        </div>
        <div class="modal-qr-code-wrap">
          <img src="${qrApiUrl}" alt="QR code linking to ${escapeHtml(title)}" width="160" height="160" loading="lazy">
        </div>`;
    }
    if (qrDirectLink) qrDirectLink.textContent = targetUrl;
    if (modalTitle) modalTitle.textContent = title;
    if (modalSpecs) modalSpecs.textContent = specs;
    if (modalPrice) modalPrice.textContent = price;
    if (modalDim) modalDim.textContent = dim;
    if (modalStatus) modalStatus.textContent = status || 'Exhibiting at The Grove';

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
    const projectType = document.getElementById('project-type');
    const budget = document.getElementById('budget-tier');
    const notes = document.getElementById('project-notes');

    if (projectType) projectType.value = 'Fine Wood Sculpture Inquiry';
    if (budget) budget.value = 'Sculpture acquisition';
    if (notes) {
      notes.value = `Hello Daniel — I am interested in acquiring "${title}" (${price}). Please share availability and next steps.\n`;
    }

    closeSculptureModal();
    document.getElementById('contact')?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth'
    });
    setTimeout(() => document.getElementById('client-name')?.focus(), 400);
  }

  reserveBtn?.addEventListener('click', () => {
    if (!currentPiece) return;
    const fakeCard = {
      getAttribute: (k) => {
        const map = {
          'data-title': currentPiece.title,
          'data-price': currentPiece.price
        };
        return map[k];
      }
    };
    inquireSculpture(fakeCard);
  });

  modalClose?.addEventListener('click', closeSculptureModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeSculptureModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeSculptureModal();
    if (e.key === 'Tab' && modal.classList.contains('active')) trapFocus(e, modal);
  });

  function handleHashLink() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#sculpture-')) {
      const targetCard = document.querySelector(hash);
      if (targetCard) {
        setTimeout(() => {
          targetCard.scrollIntoView({
            behavior: prefersReducedMotion() ? 'auto' : 'smooth',
            block: 'center'
          });
          targetCard.classList.add('sculpture-highlight');
          openSculptureModal(targetCard);
        }, 400);
      }
    }
  }

  window.addEventListener('hashchange', handleHashLink);
}

/* ==========================================================================
   13. SCROLL REVEALS
   ========================================================================== */
function initScrollReveals() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('reveal-visible'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );

  els.forEach((el) => io.observe(el));
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
