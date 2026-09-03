/* Peace Protocol presence globe: country lights gathering toward Old Snowmass. */
(function () {
  const VALLEY = { lat: 39.331, lng: -106.845, label: 'Old Snowmass' };
  const CENTROIDS = {
    AD: [42.5, 1.6], AE: [24.0, 54.0], AF: [33.0, 66.0], AL: [41.1, 20.2], AM: [40.4, 44.9],
    AO: [-12.5, 18.5], AR: [-34.0, -64.0], AT: [47.6, 14.1], AU: [-25.0, 134.0], AZ: [40.3, 47.6],
    BA: [44.2, 17.8], BD: [23.8, 90.3], BE: [50.6, 4.7], BG: [42.7, 25.3], BH: [26.0, 50.5],
    BO: [-16.7, -64.9], BR: [-10.8, -53.1], BY: [53.7, 27.9], BZ: [17.2, -88.7],
    CA: [56.1, -106.3], CH: [46.8, 8.2], CL: [-35.7, -71.5], CM: [5.7, 12.7], CN: [35.9, 104.2],
    CO: [4.6, -74.3], CR: [9.9, -84.1], CU: [21.5, -78.0], CY: [35.0, 33.2], CZ: [49.8, 15.5],
    DE: [51.2, 10.4], DK: [56.0, 10.0], DO: [18.7, -70.2], DZ: [28.0, 2.6],
    EC: [-1.4, -78.2], EE: [58.6, 25.0], EG: [26.8, 30.8], ES: [40.4, -3.7], ET: [9.1, 40.5],
    FI: [64.0, 26.0], FR: [46.2, 2.2], GB: [54.0, -2.0], GE: [42.3, 43.4], GH: [7.9, -1.2],
    GR: [39.1, 22.9], GT: [15.7, -90.2], HK: [22.4, 114.1], HN: [15.2, -86.2], HR: [45.1, 15.2],
    HU: [47.2, 19.5], ID: [-2.2, 118.0], IE: [53.3, -8.2], IL: [31.4, 35.0], IN: [22.4, 79.0],
    IQ: [33.2, 43.7], IR: [32.4, 53.7], IS: [65.0, -18.6], IT: [42.8, 12.6],
    JM: [18.1, -77.3], JO: [31.2, 36.5], JP: [36.2, 138.3], KE: [0.4, 37.9], KG: [41.2, 74.8],
    KH: [12.5, 105.0], KR: [36.4, 127.9], KW: [29.3, 47.9], KZ: [48.0, 67.0],
    LA: [18.2, 104.9], LB: [33.9, 35.9], LK: [7.6, 80.7], LT: [55.2, 23.9], LU: [49.8, 6.1],
    LV: [56.9, 24.6], MA: [31.8, -7.1], MX: [23.6, -102.5], MY: [4.2, 109.7], MZ: [-18.7, 35.5],
    NG: [9.1, 8.7], NL: [52.1, 5.3], NO: [62.5, 10.3], NP: [28.3, 84.1], NZ: [-41.8, 172.9],
    OM: [21.5, 55.9], PA: [8.5, -80.3], PE: [-9.2, -75.0], PH: [12.9, 121.8], PK: [30.4, 69.3],
    PL: [52.0, 19.1], PR: [18.2, -66.5], PT: [39.6, -8.0], PY: [-23.4, -58.4],
    QA: [25.3, 51.2], RO: [45.9, 25.0], RS: [44.0, 20.8], RU: [61.5, 105.3], RW: [-1.9, 29.9],
    SA: [24.0, 45.0], SE: [62.1, 15.3], SG: [1.4, 103.8], SI: [46.1, 14.8], SK: [48.7, 19.7],
    SN: [14.5, -14.5], SV: [13.8, -88.9], TH: [15.9, 101.0], TJ: [38.9, 71.0], TM: [39.0, 59.6],
    TN: [34.0, 9.5], TR: [39.0, 35.2], TW: [23.7, 121.0], TZ: [-6.4, 34.9],
    UA: [49.0, 32.0], UG: [1.3, 32.3], US: [39.8, -98.6], UY: [-32.5, -55.8], UZ: [41.4, 64.6],
    VE: [6.4, -66.6], VN: [16.2, 107.8], ZA: [-29.0, 25.0], ZM: [-13.1, 27.8], ZW: [-19.0, 29.9]
  };

  const GOLD = [255, 215, 0];
  const TEAL = [56, 248, 212];

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function toRad(d) {
    return (d * Math.PI) / 180;
  }

  function latLngToVec(lat, lng) {
    const phi = toRad(lat);
    const lam = toRad(lng);
    const cosPhi = Math.cos(phi);
    return {
      x: cosPhi * Math.sin(lam),
      y: Math.sin(phi),
      z: cosPhi * Math.cos(lam)
    };
  }

  function rotateY(v, a) {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return { x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c };
  }

  function rotateX(v, a) {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return { x: v.x, y: v.y * c - v.z * s, z: v.y * s + v.z * c };
  }

  function project(v, rotY, rotX, cx, cy, r) {
    const p = rotateX(rotateY(v, rotY), rotX);
    return { x: cx + p.x * r, y: cy - p.y * r, z: p.z, v: p };
  }

  function splitRingAntimeridian(ring) {
    const parts = [];
    let cur = [ring[0]];
    for (let i = 1; i < ring.length; i++) {
      const prev = cur[cur.length - 1];
      if (Math.abs(ring[i][1] / 10 - prev[1] / 10) > 180) {
        if (cur.length >= 3) parts.push(cur);
        cur = [ring[i]];
      } else {
        cur.push(ring[i]);
      }
    }
    if (cur.length >= 3) parts.push(cur);
    return parts.length ? parts : [ring];
  }

  function buildLandTexture(rings) {
    const w = 1024;
    const h = 512;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const g = canvas.getContext('2d');
    if (!g) return null;
    g.fillStyle = 'rgba(122, 160, 172, 0.92)';
    g.strokeStyle = 'rgba(214, 244, 232, 0.35)';
    g.lineWidth = 1;
    g.lineJoin = 'round';
    (rings || []).forEach((ring) => {
      splitRingAntimeridian(ring).forEach((part) => {
        g.beginPath();
        for (let i = 0; i < part.length; i++) {
          const x = ((part[i][1] / 10 + 180) / 360) * w;
          const y = ((90 - part[i][0] / 10) / 180) * h;
          if (i === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
        g.closePath();
        g.fill();
        g.stroke();
      });
    });
    return g.getImageData(0, 0, w, h);
  }

  function createLandPainter() {
    const view = document.createElement('canvas');
    const viewCtx = view.getContext('2d');
    let pixels = null;
    let res = 0;
    return function drawLand(ctx, map, rotY, rotX, cx, cy, r) {
      if (!map || !viewCtx) return;
      const next = Math.max(148, Math.min(200, Math.round(r * 1.85)));
      if (res !== next) {
        res = next;
        view.width = res;
        view.height = res;
        pixels = viewCtx.createImageData(res, res);
      }
      const out = pixels.data;
      out.fill(0);
      const src = map.data;
      const sw = map.width;
      const sh = map.height;
      const cr = (res - 1) * 0.5;
      const cX = Math.cos(rotX);
      const sX = Math.sin(rotX);
      const cY = Math.cos(rotY);
      const sY = Math.sin(rotY);
      for (let py = 0; py < res; py++) {
        const ny = (cr - py) / cr;
        const ny2 = ny * ny;
        for (let px = 0; px < res; px++) {
          const nx = (px - cr) / cr;
          const n2 = nx * nx + ny2;
          if (n2 > 0.992) continue;
          const nz = Math.sqrt(1 - n2);
          const y1 = ny * cX + nz * sX;
          const z1 = -ny * sX + nz * cX;
          const x0 = nx * cY - z1 * sY;
          const z0 = nx * sY + z1 * cY;
          const lat = Math.asin(Math.max(-1, Math.min(1, y1)));
          const lng = Math.atan2(x0, z0);
          let mx = Math.floor(((lng / Math.PI + 1) * 0.5) * sw);
          let my = Math.floor(((0.5 - lat / Math.PI) * sh));
          if (my < 0 || my >= sh) continue;
          mx = ((mx % sw) + sw) % sw;
          const si = (my * sw + mx) * 4;
          const a = src[si + 3];
          if (a < 10) continue;
          const shade = 0.42 + nz * 0.58;
          const di = (py * res + px) * 4;
          out[di] = src[si] * shade;
          out[di + 1] = src[si + 1] * shade;
          out[di + 2] = src[si + 2] * shade;
          out[di + 3] = a * (0.72 + nz * 0.28);
        }
      }
      viewCtx.putImageData(pixels, 0, 0);
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(view, cx - r, cy - r, r * 2, r * 2);
      ctx.restore();
    };
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function slerp(a, b, t) {
    const dot = Math.min(1, Math.max(-1, a.x * b.x + a.y * b.y + a.z * b.z));
    const omega = Math.acos(dot);
    if (omega < 1e-4) return { x: a.x, y: a.y, z: a.z };
    const sinOmega = Math.sin(omega);
    const w1 = Math.sin((1 - t) * omega) / sinOmega;
    const w2 = Math.sin(t * omega) / sinOmega;
    return { x: a.x * w1 + b.x * w2, y: a.y * w1 + b.y * w2, z: a.z * w1 + b.z * w2 };
  }

  function greatArc(from, to, steps) {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const p = slerp(from, to, t);
      const lift = Math.sin(t * Math.PI) * 0.16;
      const m = 1 + lift;
      pts.push({ x: p.x * m, y: p.y * m, z: p.z * m });
    }
    return pts;
  }

  function formatCount(n) {
    const num = Number(n) || 0;
    return num.toLocaleString('en-US');
  }

  function animateCount(el, target) {
    if (!el) return;
    el.textContent = formatCount(Number(target) || 0);
  }

  function buildStars(n) {
    const stars = [];
    for (let i = 0; i < n; i++) {
      stars.push({
        a: Math.random() * Math.PI * 2,
        r: 0.58 + Math.random() * 0.46,
        s: 0.4 + Math.random() * 1.4,
        tw: Math.random() * Math.PI * 2
      });
    }
    return stars;
  }

  function drawSphere(ctx, cx, cy, r) {
    const shade = ctx.createRadialGradient(cx - r * 0.32, cy - r * 0.38, r * 0.08, cx, cy, r * 1.05);
    shade.addColorStop(0, 'rgba(38, 56, 78, 0.96)');
    shade.addColorStop(0.22, 'rgba(12, 20, 34, 0.98)');
    shade.addColorStop(0.62, 'rgba(5, 9, 16, 0.99)');
    shade.addColorStop(1, 'rgba(1, 3, 7, 1)');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = shade;
    ctx.fill();

    const spec = ctx.createRadialGradient(cx - r * 0.28, cy - r * 0.42, 0, cx - r * 0.28, cy - r * 0.42, r * 0.55);
    spec.addColorStop(0, 'rgba(255, 236, 190, 0.22)');
    spec.addColorStop(0.35, 'rgba(255, 215, 0, 0.06)');
    spec.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = spec;
    ctx.fill();
  }

  function drawAtmosphere(ctx, cx, cy, r) {
    const glow = ctx.createRadialGradient(cx, cy, r * 0.86, cx, cy, r * 1.28);
    glow.addColorStop(0, 'rgba(56, 248, 212, 0)');
    glow.addColorStop(0.55, 'rgba(56, 248, 212, 0.08)');
    glow.addColorStop(0.78, 'rgba(255, 177, 66, 0.16)');
    glow.addColorStop(1, 'rgba(255, 177, 66, 0)');
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.28, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, r + 1.2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 248, 212, 0.35)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4.5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.12)';
    ctx.lineWidth = 6;
    ctx.stroke();
  }

  function drawArc(ctx, pts, rotY, rotX, cx, cy, r, t) {
    const projected = pts.map((p) => project(p, rotY, rotX, cx, cy, r));
    ctx.lineCap = 'round';
    for (let i = 1; i < projected.length; i++) {
      const a = projected[i - 1];
      const b = projected[i];
      if (a.z < 0 && b.z < 0) continue;
      const u = i / projected.length;
      const pulse = 0.55 + 0.45 * Math.max(0, Math.sin((u - (t % 1)) * Math.PI * 2));
      const alpha = Math.max(0.12, Math.min(a.z, b.z, 1) * 0.75) * (0.45 + pulse * 0.7);
      const g = lerp(TEAL[1], GOLD[1], u);
      ctx.strokeStyle = `rgba(${lerp(TEAL[0], GOLD[0], u)}, ${g}, ${lerp(TEAL[2], GOLD[2], u)}, ${alpha})`;
      ctx.lineWidth = 1.4 + pulse * 1.8;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  function glowDot(ctx, x, y, radius, rgb, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius * 4.2);
    g.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`);
    g.addColorStop(0.28, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha * 0.35})`);
    g.addColorStop(1, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, radius * 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255, 255, 245, ${Math.min(1, alpha + 0.25)})`;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(1.1, radius * 0.55), 0, Math.PI * 2);
    ctx.fill();
  }

  function initProtocolGlobe() {
    const canvas = document.getElementById('protocol-globe');
    const stage = document.querySelector('.protocol-globe-stage');
    const pin = document.getElementById('protocol-globe-pin');
    const totalEl = document.getElementById('protocol-presence-total');
    const countriesEl = document.getElementById('protocol-presence-countries');
    if (!canvas || !stage) return;

    const reduced = prefersReducedMotion();
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const valley = latLngToVec(VALLEY.lat, VALLEY.lng);
    const stars = buildStars(90);
    const points = [];
    const arcs = [];
    const drawLand = createLandPainter();
    let landMap = null;
    let rotY = -toRad(VALLEY.lng);
    let rotX = 0.38;
    let velY = 0;
    let dragging = false;
    let lastX = 0;
    let lastTs = 0;
    let visible = true;
    let raf = 0;

    function layout() {
      const frame = canvas.parentElement;
      const host = stage.getBoundingClientRect();
      const size = Math.max(260, Math.min(host.width, 520));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (frame) {
        frame.style.width = `${size}px`;
        frame.style.height = `${size}px`;
      }
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return size;
    }

    let size = layout();

    function applyData(data) {
      points.length = 0;
      arcs.length = 0;
      const rows = Array.isArray(data && data.countries) ? data.countries : [];
      const maxN = rows.reduce((m, row) => Math.max(m, Number(row.n) || 0), 1);
      rows.forEach((row) => {
        const ll = CENTROIDS[row.code];
        if (!ll) return;
        const vec = latLngToVec(ll[0], ll[1]);
        const n = Number(row.n) || 1;
        points.push({
          vec,
          n,
          radius: 2.2 + Math.sqrt(n / maxN) * 4.6,
          phase: Math.random() * Math.PI * 2
        });
        arcs.push(greatArc(vec, valley, 28));
      });
      animateCount(totalEl, data && data.total);
      animateCount(countriesEl, data && data.countryCount);
    }

    function frame(ts) {
      raf = 0;
      const dt = lastTs ? Math.min(48, ts - lastTs) : 16;
      lastTs = ts;
      const t = ts * 0.001;
      size = parseFloat(canvas.style.width) || size;
      const cx = size / 2;
      const cy = size / 2;
      const r = size * 0.36;

      if (!dragging && !reduced) {
        rotY += 0.00022 * dt + velY;
        velY *= 0.94;
      } else if (dragging) {
        velY *= 0.82;
      }

      ctx.clearRect(0, 0, size, size);

      stars.forEach((star) => {
        const tw = reduced ? 0.45 : 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * 1.8 + star.tw));
        const x = cx + Math.cos(star.a + rotY * 0.15) * star.r * size * 0.48;
        const y = cy + Math.sin(star.a * 1.3 - rotY * 0.1) * star.r * size * 0.48;
        ctx.fillStyle = `rgba(230, 245, 255, ${tw * 0.55})`;
        ctx.fillRect(x, y, star.s, star.s);
      });

      drawAtmosphere(ctx, cx, cy, r);
      drawSphere(ctx, cx, cy, r);
      drawLand(ctx, landMap, rotY, rotX, cx, cy, r);

      const night = ctx.createRadialGradient(cx + r * 0.45, cy + r * 0.1, r * 0.2, cx, cy, r);
      night.addColorStop(0, 'rgba(0, 0, 0, 0)');
      night.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = night;
      ctx.fill();

      arcs.forEach((arc) => drawArc(ctx, arc, rotY, rotX, cx, cy, r, reduced ? 0.25 : t * 0.08));

      points.forEach((pt) => {
        const p = project(pt.vec, rotY, rotX, cx, cy, r);
        if (p.z < 0.02) return;
        const pulse = reduced ? 1 : 0.72 + 0.28 * Math.sin(t * 2.2 + pt.phase);
        glowDot(ctx, p.x, p.y, pt.radius * pulse, TEAL, 0.42 + p.z * 0.5);
      });

      const home = project(valley, rotY, rotX, cx, cy, r);
      if (home.z > 0) {
        const beat = reduced ? 1 : 0.8 + 0.2 * Math.sin(t * 2.6);
        if (!reduced) {
          ctx.beginPath();
          ctx.arc(home.x, home.y, 10 + (t % 2) * 16, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 215, 0, ${0.22 - (t % 2) * 0.1})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        glowDot(ctx, home.x, home.y, 4.2 * beat, GOLD, 0.9);
      }
      if (pin) {
        const inFront = home.z > 0.08;
        const inFrame = home.y > 18 && home.y < size - 36 && home.x > 40 && home.x < size - 40;
        if (inFront && inFrame) {
          pin.hidden = false;
          pin.style.transform = `translate(${home.x}px, ${home.y - 18}px) translate(-50%, -100%)`;
        } else {
          pin.hidden = true;
        }
      }

      if (visible && (!reduced || dragging)) {
        raf = requestAnimationFrame(frame);
      }
    }

    function startLoop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      lastTs = 0;
      frame(performance.now());
    }

    canvas.addEventListener('pointerdown', (e) => {
      dragging = true;
      lastX = e.clientX;
      canvas.setPointerCapture(e.pointerId);
      startLoop();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      rotY += dx * 0.008;
      velY = dx * 0.00035;
    });
    const endDrag = () => {
      dragging = false;
      startLoop();
    };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('pointerleave', () => {
      if (dragging) return;
    });

    window.addEventListener('resize', () => {
      layout();
      startLoop();
    });

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          visible = entries.some((entry) => entry.isIntersecting);
          if (visible) startLoop();
        },
        { threshold: 0.12 }
      );
      io.observe(stage);
    }

    startLoop();

    fetch('/data/world-land.json', { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        landMap = buildLandTexture(data && data.rings);
        startLoop();
      })
      .catch(() => {});

    fetch('/api/protocol-presence', { headers: { Accept: 'application/json' }, cache: 'no-cache' })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (data && data.ok) {
          applyData(data);
          startLoop();
        }
      })
      .catch(() => {});
  }

  window.initProtocolGlobe = initProtocolGlobe;
})();
