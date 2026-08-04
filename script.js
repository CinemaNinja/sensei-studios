/* ==========================================================================
   SENSEI STUDIOS — CINEMATIC ZEN INTERACTIVE ENGINE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initCustomCursor();
  initZenCanvas();
  initTypedText();
  initPortfolioFilters();
  initVideoModal();
  initWoodworkSculptures();
  initEstimatorCalculator();
  initZenAudio();
  initNavigation();
  initContactForm();
});

/* ==========================================================================
   1. PRELOADER FADE-OUT
   ========================================================================== */
function initPreloader() {
  const preloader = document.getElementById('preloader');
  const body = document.body;

  window.addEventListener('load', removePreloader);
  setTimeout(removePreloader, 1500); // Fallback

  function removePreloader() {
    if (preloader && !preloader.classList.contains('fade-out')) {
      preloader.classList.add('fade-out');
      body.classList.remove('loading-lock');
    }
  }
}

/* ==========================================================================
   2. CUSTOM BLADE CURSOR
   ========================================================================== */
function initCustomCursor() {
  const cursor = document.getElementById('custom-cursor');
  if (!cursor || window.matchMedia('(pointer: coarse)').matches) return;

  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;

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

  // Add hover class on interactive elements
  const interactives = document.querySelectorAll('a, button, .video-card, .checkbox-card, input, select, textarea');
  interactives.forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
  });
}

/* ==========================================================================
   3. ZEN CANVAS PARTICLE BACKGROUND ENGINE
   ========================================================================== */
function initZenCanvas() {
  const canvas = document.getElementById('zen-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const particleCount = Math.min(Math.floor(width / 25), 60);

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 1,
      color: Math.random() > 0.4 ? 'rgba(255, 168, 52, ' : 'rgba(255, 126, 95, ',
      alpha: Math.random() * 0.5 + 0.1,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: -Math.random() * 0.6 - 0.2,
      pulse: Math.random() * 0.02
    });
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach((p) => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.alpha += Math.sin(Date.now() * p.pulse) * 0.005;

      if (p.y < -10) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      if (p.x < -10 || p.x > width + 10) {
        p.x = Math.random() * width;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `${p.color}${Math.max(0, Math.min(1, p.alpha))})`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color + '0.8)';
      ctx.fill();
    });

    requestAnimationFrame(render);
  }

  render();
}

/* ==========================================================================
   4. TYPED TEXT ENGINE
   ========================================================================== */
function initTypedText() {
  const target = document.getElementById('typed-output');
  if (!target) return;

  const phrases = [
    "Master Cinematographer.",
    "3D Motion Graphics Specialist.",
    "8K Timelapse Pioneer.",
    "FPV Drone Hyperlapse Pilot."
  ];

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

    let delay = isDeleting ? 40 : 90;

    if (!isDeleting && charIndex === currentPhrase.length) {
      delay = 2200; // Pause at end
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      delay = 400;
    }

    setTimeout(typeStep, delay);
  }

  typeStep();
}

/* ==========================================================================
   5. PORTFOLIO CATEGORY FILTERING
   ========================================================================== */
function initPortfolioFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const videoCards = document.querySelectorAll('.video-card');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      videoCards.forEach((card) => {
        const categories = card.getAttribute('data-category').split(' ');

        if (filter === 'all' || categories.includes(filter)) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 300);
        }
      });
    });
  });
}

/* ==========================================================================
   6. VIDEO MODAL THEATER PLAYER
   ========================================================================== */
function initVideoModal() {
  const videoCards = document.querySelectorAll('.video-card');
  const modal = document.getElementById('video-modal');
  const modalClose = document.getElementById('modal-close-btn');
  const iframeContainer = document.getElementById('modal-iframe-container');
  const modalTitle = document.getElementById('modal-info-title');

  if (!modal || !iframeContainer) return;

  videoCards.forEach((card) => {
    card.addEventListener('click', () => {
      const videoType = card.getAttribute('data-video-type');
      const videoId = card.getAttribute('data-video-id');
      const title = card.querySelector('.video-title').textContent;

      let embedUrl = '';
      if (videoType === 'vimeo') {
        embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=1&color=00f5d4&title=0&byline=0&portrait=0`;
      } else if (videoType === 'youtube') {
        embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
      }

      iframeContainer.innerHTML = `<iframe src="${embedUrl}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
      modalTitle.textContent = title;
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeModal() {
    modal.classList.remove('active');
    iframeContainer.innerHTML = '';
    document.body.style.overflow = '';
  }

  if (modalClose) modalClose.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

/* ==========================================================================
   7. NINJA SCOPE ESTIMATOR CALCULATOR
   ========================================================================== */
function initEstimatorCalculator() {
  const checkboxes = document.querySelectorAll('.scope-calc');
  const priceDisplay = document.getElementById('estimated-price');
  if (!priceDisplay) return;

  checkboxes.forEach((cb) => {
    const parentCard = cb.closest('.checkbox-card');

    cb.addEventListener('change', () => {
      if (parentCard) {
        if (cb.checked) {
          parentCard.classList.add('selected');
        } else {
          parentCard.classList.remove('selected');
        }
      }
      calculateTotal();
    });
  });

  function calculateTotal() {
    let total = 0;
    checkboxes.forEach((cb) => {
      if (cb.checked) {
        total += parseInt(cb.getAttribute('data-price'), 10);
      }
    });

    animateValue(priceDisplay, total);
  }

  function animateValue(obj, endValue) {
    const startValue = parseInt(obj.textContent.replace(/[^0-9]/g, ''), 10) || 0;
    const duration = 400;
    let startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const currentValue = Math.floor(progress * (endValue - startValue) + startValue);
      obj.textContent = `$${currentValue.toLocaleString()}`;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    }

    window.requestAnimationFrame(step);
  }
}

/* ==========================================================================
   8. ZEN AMBIENT WEB AUDIO SYSTEM
   ========================================================================== */
function initZenAudio() {
  const toggleBtn = document.getElementById('sound-toggle');
  if (!toggleBtn) return;

  let audioCtx = null;
  let isPlaying = false;
  let masterGain = null;

  toggleBtn.addEventListener('click', () => {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);
    }

    if (!isPlaying) {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      playZenChime(audioCtx, masterGain);
      toggleBtn.style.color = 'var(--accent-gold)';
      toggleBtn.style.borderColor = 'var(--accent-gold)';
      isPlaying = true;
    } else {
      toggleBtn.style.color = '';
      toggleBtn.style.borderColor = '';
      isPlaying = false;
    }
  });

  function playZenChime(ctx, destination) {
    const freqs = [432, 528, 639]; // Solfeggio frequencies
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 1 + idx * 0.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 4 + idx);

      osc.connect(gain);
      gain.connect(destination);

      osc.start(ctx.currentTime + idx * 0.2);
      osc.stop(ctx.currentTime + 5 + idx);
    });
  }
}

/* ==========================================================================
   9. ZEN NAVIGATION — INK-SPREAD, ACTIVE TRACKING, ENTRANCE ANIMATION
   ========================================================================== */
function initNavigation() {
  const nav = document.getElementById('site-nav');
  const hamburger = document.getElementById('nav-hamburger');
  const navLinks = document.getElementById('nav-links');
  const links = document.querySelectorAll('.nav-link');

  if (!nav) return;

  /* --- Scroll: frosted glass reveal --- */
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });

  /* --- Mouse-tracking ink glow on each link --- */
  links.forEach((link) => {
    link.addEventListener('mousemove', (e) => {
      const rect = link.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      link.style.setProperty('--mx', x + '%');
      link.style.setProperty('--my', y + '%');
    });
  });

  /* --- Stagger-in entrance animation --- */
  links.forEach((link, i) => {
    link.style.opacity = '0';
    link.style.transform = 'translateY(-8px)';
    setTimeout(() => {
      link.style.transition = 'opacity 0.5s ease, transform 0.5s ease, color 0.35s ease';
      link.style.opacity = '1';
      link.style.transform = 'translateY(0)';
    }, 600 + i * 90);
  });

  /* --- Active section highlighting via IntersectionObserver --- */
  const sections = document.querySelectorAll('section[id]');
  if (sections.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          links.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });

    sections.forEach((section) => observer.observe(section));
  }

  /* --- Mobile hamburger --- */
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('mobile-open');
      hamburger.setAttribute('aria-expanded', isOpen);
    });

    // Close mobile menu when a link is clicked
    links.forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('mobile-open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }
}

/* ==========================================================================
   10. CONTACT FORM SUBMISSION
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('sensei-contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('client-name').value;
    alert(`⚡ Thank you, ${name}! Your transmission has been received by Sensei Studios. We will respond within 24 hours.`);

    form.reset();
  });
}

/* ==========================================================================
   11. ASPEN WOODWORK & SCULPTURES QR FRAMEWORK
   ========================================================================== */
function initWoodworkSculptures() {
  const qrTriggers = document.querySelectorAll('.btn-qr-trigger');
  const modal = document.getElementById('sculpture-qr-modal');
  const modalClose = document.getElementById('sculpture-modal-close');
  const qrTarget = document.getElementById('qr-code-target');
  const qrDirectLink = document.getElementById('qr-direct-link');
  const modalTitle = document.getElementById('modal-sculpture-title');
  const modalSpecs = document.getElementById('modal-sculpture-specs');
  const modalPrice = document.getElementById('modal-sculpture-price');
  const modalDim = document.getElementById('modal-sculpture-dim');
  const modalStatus = document.getElementById('modal-sculpture-status');

  if (!modal) return;

  qrTriggers.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.sculpture-card');
      if (card) openSculptureModal(card);
    });
  });

  function openSculptureModal(card) {
    const id = card.getAttribute('data-sculpture-id');
    const title = card.getAttribute('data-title');
    const price = card.getAttribute('data-price');
    const specs = card.getAttribute('data-specs');
    const dim = card.getAttribute('data-dim');
    const status = card.getAttribute('data-status');

    // Build unique deep link URL for Aspen gallery QR code plaque
    const targetUrl = `${window.location.origin}${window.location.pathname}#sculpture-${id}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(targetUrl)}`;

    qrTarget.innerHTML = `<img src="${qrApiUrl}" alt="QR Code for ${title}" style="width:100%; height:100%; object-fit:contain;">`;
    qrDirectLink.textContent = targetUrl;
    modalTitle.textContent = title;
    modalSpecs.textContent = specs;
    modalPrice.textContent = price;
    modalDim.textContent = dim;
    modalStatus.textContent = status || 'EXHIBITING AT ASPEN GALLERY';

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSculptureModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (modalClose) modalClose.addEventListener('click', closeSculptureModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeSculptureModal();
  });

  // Handle URL hash deep-linking (e.g. scanning QR code in Aspen gallery opens #sculpture-7)
  function handleHashLink() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#sculpture-')) {
      const targetCard = document.querySelector(hash);
      if (targetCard) {
        setTimeout(() => {
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetCard.style.borderColor = 'var(--accent-gold-bright)';
          targetCard.style.boxShadow = '0 0 30px rgba(212, 175, 55, 0.6)';
          openSculptureModal(targetCard);
        }, 500);
      }
    }
  }

  window.addEventListener('hashchange', handleHashLink);
  handleHashLink();
}

