/* Sensei Studios edge worker: per-chapter share cards, lightweight analytics,
   contact + Peace Protocol signup email, and clean section URLs. */

const SITE_ORIGIN = 'https://senseistudios.com';
const FALLBACK_CONTACT_TO = 'brown@senseistudios.com';

const SECTION_META = {
  film: {
    title: 'Film & Motion | Sensei Studios',
    description:
      'Cinematography, photography, timelapse, drone, editing, and 3D & 2D animation by Daniel Kelly Brown.',
    image: '/assets/og-film.jpg?v=2',
    canonical: '/film'
  },
  wood: {
    title: 'Wood Sculpture | Sensei Studios',
    description:
      'Fine aspen and burl timber sculptures by Daniel Kelly Brown, photographed on location in Colorado. Every piece available on a sliding scale.',
    image: '/assets/og-wood.jpg',
    canonical: '/wood'
  },
  handpan: {
    title: 'Live Handpan | Sensei Studios',
    description:
      'Ethereal handpan for private events, sound baths, weddings, and ceremonies. D Kurd and F Integral scales, pure acoustic resonance.',
    image: '/assets/og-handpan.jpg',
    canonical: '/handpan'
  },
  web: {
    title: 'Web Design & Experiences | Sensei Studios',
    description:
      'High-end websites, living proposals, and pitch decks built with cinematic precision. Fast, on-brand, and built to convert.',
    image: '/assets/og-web.jpg',
    canonical: '/web'
  },
  story: {
    title: 'Story | Sensei Studios',
    description:
      'Part cinematographer, part craftsman. The 25-year journey of Daniel Kelly Brown from Banff honors to Boeing drone light shows.',
    image: '/assets/og-story.jpg',
    canonical: '/story'
  },
  protocol: {
    title: 'Peace Protocol | Sensei Studios',
    description:
      'A civilization prototype on 180 acres in Old Snowmass: free food, free transportation, free shelter, and universal basic income, held together by a new focus on art.',
    image: '/assets/protocol/og-protocol.jpg',
    canonical: '/peace-protocol'
  },
  estimator: {
    title: 'Scope Estimator | Sensei Studios',
    description:
      'Transparent, sliding-scale pricing for film, drone, and web projects. Build a scope and get a real starting point.',
    image: '/assets/og-web.jpg',
    canonical: '/estimator'
  },
  contact: {
    title: 'Book a Project | Sensei Studios',
    description:
      'Video, web design, 3D, drones, sculpture, or handpan: send the vision and get a real reply from Daniel Kelly Brown.',
    image: '/assets/og-cover.jpg',
    canonical: '/contact'
  }
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

const LEGACY_REDIRECTS = {
  '/woodwork': '/wood',
  '/sculptures': '/wood',
  '/work': '/film',
  '/bio': '/story',
  '/protocol': '/peace-protocol',
  '/vision': '/peace-protocol'
};

function json(data, status = 200, extraHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type',
      'access-control-allow-methods': 'POST, GET, OPTIONS',
      ...(extraHeaders || {})
    }
  });
}

function clip(value, max) {
  return String(value == null ? '' : value).slice(0, max);
}

function track(env, blobs) {
  try {
    if (!env.SENSEI_ANALYTICS) return;
    env.SENSEI_ANALYTICS.writeDataPoint({
      blobs: blobs.map((b) => clip(b, 200)),
      doubles: [1],
      indexes: [clip(blobs[1] || blobs[0] || '', 90)]
    });
  } catch (_) {
    /* analytics must never break a request */
  }
}

const PRESENCE_COOKIE = 'ss_protocol_presence';

function isLikelyBot(request) {
  const ua = (request.headers.get('user-agent') || '').toLowerCase();
  if (!ua) return true;
  return /bot|crawl|spider|slurp|wget|curl|python-requests|python-urllib|headless|lighthouse|pagespeed/.test(ua);
}

function hasPresenceCookie(request) {
  const raw = request.headers.get('cookie') || '';
  return new RegExp(`(?:^|;\\s*)${PRESENCE_COOKIE}=1(?:;|$)`).test(raw);
}

function presenceSetCookie(request) {
  const secure = (() => {
    try {
      return new URL(request.url).protocol === 'https:' ? '; Secure' : '';
    } catch (_) {
      return '';
    }
  })();
  return `${PRESENCE_COOKIE}=1; Path=/; Max-Age=86400; SameSite=Lax${secure}`;
}

function withSetCookie(res, cookie) {
  if (!cookie || !res) return res;
  const headers = new Headers(res.headers);
  headers.append('Set-Cookie', cookie);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

function countryCode(request) {
  const code = clip(request.cf && request.cf.country, 8).toUpperCase();
  if (!code || code === 'XX' || code === 'T1') return 'XX';
  return code;
}

async function recordProtocolPresence(request, env) {
  if (!env.PROTOCOL_PRESENCE || isLikelyBot(request)) return;
  const country = countryCode(request);
  const snap = (await env.PROTOCOL_PRESENCE.get('snapshot', { type: 'json' })) || {
    total: 0,
    countries: {}
  };
  snap.total = (Number(snap.total) || 0) + 1;
  snap.countries = snap.countries && typeof snap.countries === 'object' ? snap.countries : {};
  if (country !== 'XX') {
    snap.countries[country] = (Number(snap.countries[country]) || 0) + 1;
  }
  snap.updated = Date.now();
  await env.PROTOCOL_PRESENCE.put('snapshot', JSON.stringify(snap));
}

function queueProtocolPresence(request, env, ctx) {
  if (hasPresenceCookie(request)) return false;
  if (isLikelyBot(request)) return false;
  if (env.PROTOCOL_PRESENCE && ctx && typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(recordProtocolPresence(request, env));
  }
  return true;
}

function isHtmlDocumentRequest(request, path) {
  if (request.method !== 'GET') return false;
  if (/\.[a-z0-9]{2,5}$/i.test(path) && !/\.html?$/i.test(path)) return false;
  const accept = request.headers.get('accept') || '';
  if (accept.includes('text/html')) return true;
  if (path === '/' || PATH_SECTION[path]) return !accept || accept.includes('*/*');
  return false;
}

function stampPresence(request, env, ctx, res, path) {
  if (!res || !isHtmlDocumentRequest(request, path)) return res;
  const recorded = queueProtocolPresence(request, env, ctx);
  return recorded ? withSetCookie(res, presenceSetCookie(request)) : res;
}

const CF_ACCOUNT_ID = 'cd07e1c8dff3eafedb2d534a44c9e556';
const CF_ZONE_TAG = 'e2c15ca55bc56dc98c694fc922727b9d';
const CF_WEB_ANALYTICS_SITE_TAG = 'ac8e716aa0b44369aa153cfce7e8e1e2';
const ANALYTICS_TTL_MS = 15 * 60 * 1000;

function asCountryCode(value) {
  const raw = String(value || '').trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(raw)) return raw;
  return '';
}

function addCountryCount(countries, code, n) {
  const key = asCountryCode(code);
  const count = Number(n) || 0;
  if (!key || key === 'XX' || key === 'T1' || count <= 0) return;
  countries[key] = (Number(countries[key]) || 0) + count;
}

function presencePayload(snap) {
  const countries = Object.entries(snap.countries || {})
    .map(([code, n]) => ({ code: String(code).toUpperCase().slice(0, 8), n: Number(n) || 0 }))
    .filter((row) => row.n > 0 && /^[A-Z]{2}$/.test(row.code) && row.code !== 'XX' && row.code !== 'T1')
    .sort((a, b) => b.n - a.n)
    .slice(0, 120);
  return {
    ok: true,
    total: Number(snap.total) || 0,
    countryCount: countries.length,
    countries,
    source: snap.source || 'cloudflare-web-analytics'
  };
}

function mergePresence(a, b) {
  const countries = { ...(a && a.countries) };
  for (const [code, n] of Object.entries((b && b.countries) || {})) {
    countries[code] = Math.max(Number(countries[code]) || 0, Number(n) || 0);
  }
  return {
    total: Math.max(Number(a && a.total) || 0, Number(b && b.total) || 0),
    countries,
    updated: Math.max(Number(a && a.updated) || 0, Number(b && b.updated) || 0),
    source: (a && a.source) || (b && b.source) || 'cloudflare-web-analytics'
  };
}

async function queryCloudflareWebAnalytics(env) {
  const token = env.CF_ANALYTICS_TOKEN;
  if (!token) return null;
  const accountId = env.CF_ACCOUNT_ID || CF_ACCOUNT_ID;
  const siteTag = env.CF_WEB_ANALYTICS_SITE_TAG || CF_WEB_ANALYTICS_SITE_TAG;
  const zoneTag = env.CF_ZONE_TAG || CF_ZONE_TAG;
  const rumStart = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();
  const zoneStart = new Date(Date.now() - 23 * 3600 * 1000).toISOString();
  const end = new Date().toISOString();
  const query = `query($accountTag: string!, $zoneTag: string!, $rumStart: Time!, $zoneStart: Time!, $end: Time!, $siteTag: string) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        totals: rumPageloadEventsAdaptiveGroups(
          limit: 1
          filter: { datetime_geq: $rumStart, datetime_lt: $end, AND: [{ siteTag: $siteTag }] }
        ) { count sum { visits } }
        rumCountries: rumPageloadEventsAdaptiveGroups(
          limit: 200
          filter: { datetime_geq: $rumStart, datetime_lt: $end, AND: [{ siteTag: $siteTag }] }
        ) { count sum { visits } dimensions { countryName } }
      }
      zones(filter: { zoneTag: $zoneTag }) {
        zoneCountries: httpRequestsAdaptiveGroups(
          limit: 200
          filter: { datetime_geq: $zoneStart, datetime_lt: $end, requestSource: "eyeball" }
          orderBy: [count_DESC]
        ) { count sum { visits } dimensions { clientCountryName } }
      }
    }
  }`;
  try {
    const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        variables: { accountTag: accountId, zoneTag, rumStart, zoneStart, end, siteTag }
      })
    });
    if (!res.ok) return null;
    const body = await res.json();
    const viewer = body && body.data && body.data.viewer;
    const acct = viewer && viewer.accounts && viewer.accounts[0];
    const zone = viewer && viewer.zones && viewer.zones[0];
    const totalRow = acct && acct.totals && acct.totals[0];
    const total = Number(totalRow && totalRow.sum && totalRow.sum.visits) || Number(totalRow && totalRow.count) || 0;
    const countries = {};
    for (const row of (acct && acct.rumCountries) || []) {
      const n = Number(row.sum && row.sum.visits) || Number(row.count) || 0;
      addCountryCount(countries, row.dimensions && row.dimensions.countryName, n);
    }
    for (const row of (zone && zone.zoneCountries) || []) {
      const visits = Number(row.sum && row.sum.visits) || 0;
      const requests = Number(row.count) || 0;
      addCountryCount(countries, row.dimensions && row.dimensions.clientCountryName, Math.max(visits, requests));
    }
    return {
      total,
      countries,
      updated: Date.now(),
      source: 'cloudflare-web-analytics'
    };
  } catch (_) {
    return null;
  }
}

async function handleProtocolPresence(env, ctx) {
  if (!env.PROTOCOL_PRESENCE) {
    return json({ ok: true, total: 0, countryCount: 0, countries: [] });
  }
  const analytics = await env.PROTOCOL_PRESENCE.get('analytics', { type: 'json' });
  const snapshot = await env.PROTOCOL_PRESENCE.get('snapshot', { type: 'json' });
  let snap = mergePresence(analytics, snapshot);
  const stale = !snap.updated || Date.now() - Number(snap.updated) > ANALYTICS_TTL_MS;
  if (stale && env.CF_ANALYTICS_TOKEN) {
    const fresh = await queryCloudflareWebAnalytics(env);
    if (fresh) {
      snap = mergePresence(fresh, snapshot);
      const write = env.PROTOCOL_PRESENCE.put('analytics', JSON.stringify(fresh));
      if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(write);
      else await write;
    }
  }
  return json(presencePayload(snap), 200, { 'cache-control': 'public, max-age=15' });
}

function publicOrigin(request) {
  try {
    const host = new URL(request.url).hostname;
    if (host === 'www.senseistudios.com' || host === 'senseistudios.com') {
      return `https://${host}`;
    }
  } catch (_) {
    /* fall through */
  }
  return SITE_ORIGIN;
}

class SectionMeta {
  constructor(meta, origin) {
    this.title = meta.title;
    this.description = meta.description;
    this.image = origin + meta.image;
    this.canonical = origin + meta.canonical;
  }
  element(e) {
    const name = (e.getAttribute('name') || e.getAttribute('property') || '').toLowerCase();
    switch (name) {
      case 'description':
        e.setAttribute('content', this.description);
        break;
      case 'og:title':
      case 'twitter:title':
        e.setAttribute('content', this.title);
        break;
      case 'og:description':
      case 'twitter:description':
        e.setAttribute('content', this.description);
        break;
      case 'og:image':
      case 'og:image:secure_url':
      case 'twitter:image':
        e.setAttribute('content', this.image);
        break;
      case 'og:image:alt':
        e.setAttribute('content', this.title);
        break;
      case 'og:url':
        e.setAttribute('content', this.canonical);
        break;
      default:
        break;
    }
  }
}

class CanonicalLink {
  constructor(href) {
    this.href = href;
  }
  element(e) {
    e.setAttribute('href', this.href);
  }
}

class HeadSectionTag {
  constructor(section) {
    this.section = section;
  }
  element(e) {
    e.append(`<meta name="sensei:section" content="${this.section}">`, { html: true });
  }
}

async function serveSection(request, env, section) {
  const meta = SECTION_META[section];
  const origin = publicOrigin(request);
  const indexUrl = new URL(request.url);
  indexUrl.pathname = '/';
  indexUrl.search = '';
  indexUrl.hash = '';
  const res = await env.ASSETS.fetch(new Request(indexUrl.toString(), {
    method: 'GET',
    headers: request.headers
  }));
  if (!res.ok || !meta) return res;
  return new HTMLRewriter()
    .on('title', { element(e) { e.setInnerContent(meta.title); } })
    .on('meta[name="description"], meta[property^="og:"], meta[name^="twitter:"]', new SectionMeta(meta, origin))
    .on('link[rel="canonical"]', new CanonicalLink(origin + meta.canonical))
    .on('head', new HeadSectionTag(section))
    .transform(res);
}

async function handleEvent(request, env) {
  let body = {};
  try {
    body = await request.json();
  } catch (_) {
    return json({ ok: false }, 400);
  }
  const event = clip(body.event, 40);
  if (!event) return json({ ok: false }, 400);
  const section = clip(body.section, 40);
  track(env, [
    'event',
    event,
    section,
    clip(body.path, 120)
  ]);
  return json({ ok: true });
}

function buildContactEmail(body) {
  const name = clip(body.name, 120).trim();
  const email = clip(body.email, 160).trim();
  const message = clip(body.message || body.notes, 4000).trim();
  const phone = clip(body.phone, 60).trim();
  const projectType = clip(body.project_type || body.projectType, 120).trim();
  const budget = clip(body.budget, 120).trim();
  const piece = clip(body.piece, 160).trim();
  const eventDate = clip(body.event_date || body.eventDate, 80).trim();
  const eventLocation = clip(body.event_location || body.eventLocation, 160).trim();
  const estimator = clip(body.estimator_total, 60).trim();
  const services = clip(body.estimator_services, 400).trim();

  if (!name || !email || !message) return { error: 'Name, email, and message are required.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Please enter a valid email.' };

  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || '—'}`,
    `Type: ${projectType || '—'}`,
    `Budget: ${budget || '—'}`,
    piece ? `Piece: ${piece}` : null,
    eventDate ? `Event date: ${eventDate}` : null,
    eventLocation ? `Event location: ${eventLocation}` : null,
    estimator ? `Estimator total: ${estimator}` : null,
    services ? `Estimator services: ${services}` : null,
    '',
    message
  ]
    .filter((line) => line !== null)
    .join('\n');

  const subject = piece
    ? `Sensei Studios — Sculpture inquiry: ${piece}`
    : projectType
      ? `Sensei Studios — ${projectType}`
      : 'Sensei Studios — New Project Inquiry';

  return { name, email, subject, text };
}

async function sendViaResend(env, { subject, text, replyTo }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM || 'Sensei Studios <studio@senseistudios.com>',
      to: [env.CONTACT_TO || FALLBACK_CONTACT_TO],
      reply_to: replyTo,
      subject,
      text
    })
  });
  if (!res.ok) throw new Error('resend rejected');
}

async function sendViaBinding(env, { subject, text, replyTo }) {
  await env.EMAIL.send({
    to: env.CONTACT_TO || FALLBACK_CONTACT_TO,
    from: { email: 'studio@senseistudios.com', name: 'Sensei Studios Website' },
    replyTo,
    subject,
    text
  });
}

async function handleContact(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (_) {
    return json({ ok: false, error: 'Invalid JSON' }, 400);
  }

  if (body.company || body.website || body._gotcha) {
    return json({ ok: true, ignored: true });
  }

  const built = buildContactEmail(body);
  if (built.error) return json({ ok: false, error: built.error }, 400);

  track(env, ['event', 'contact_submit', clip(body.project_type || body.projectType, 40), '']);

  if (env.EMAIL) {
    try {
      await sendViaBinding(env, { subject: built.subject, text: built.text, replyTo: built.email });
      return json({ ok: true, via: 'email-binding' });
    } catch (_) {
      /* fall through to resend/mailto */
    }
  }

  if (env.RESEND_API_KEY) {
    try {
      await sendViaResend(env, { subject: built.subject, text: built.text, replyTo: built.email });
      return json({ ok: true, via: 'resend' });
    } catch (_) {
      return json({ ok: false, error: 'Email provider rejected the message.' }, 502);
    }
  }

  return json({
    ok: false,
    fallback: 'mailto',
    mailto: { to: env.CONTACT_TO || FALLBACK_CONTACT_TO, subject: built.subject, body: built.text }
  });
}

async function handleSubscribe(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (_) {
    return json({ ok: false, error: 'Invalid JSON' }, 400);
  }

  if (body.company || body.website || body._gotcha) {
    return json({ ok: true, ignored: true });
  }

  const email = clip(body.email, 160).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: 'Please enter a valid email.' }, 400);
  }

  track(env, ['subscribe', email, 'protocol', clip(body.source, 60)]);

  if (env.EMAIL) {
    try {
      await env.EMAIL.send({
        to: env.CONTACT_TO || FALLBACK_CONTACT_TO,
        from: { email: 'protocol@senseistudios.com', name: 'Peace Protocol' },
        subject: 'Peace Protocol — new movement subscriber',
        text: `New Peace Protocol follower:\n\n${email}\n\nSource: ${clip(body.source, 60) || 'protocol section'}\nTime: ${new Date().toISOString()}`
      });
    } catch (_) {
      /* signup is still captured in analytics */
    }
  }

  return json({ ok: true });
}

async function handleInstagram() {
  const USERNAME = 'danielkellybrown';
  try {
    const res = await fetch(
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${USERNAME}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'X-IG-App-ID': '936619743392459'
        }
      }
    );
    if (!res.ok) return json({ ok: false, error: 'instagram_unavailable' }, 502);
    const raw = await res.json();
    const user = raw?.data?.user;
    if (!user) return json({ ok: false, error: 'instagram_empty' }, 502);

    const edges = user.edge_owner_to_timeline_media?.edges || [];
    const posts = edges.slice(0, 6).map((e) => {
      const n = e.node || {};
      const capEdges = n.edge_media_to_caption?.edges || [];
      return {
        shortcode: n.shortcode,
        is_video: Boolean(n.is_video),
        thumbnail: n.thumbnail_src || n.display_url,
        caption: String(capEdges[0]?.node?.text || '').slice(0, 180),
        url: `https://www.instagram.com/p/${n.shortcode}/`
      };
    });

    return json({
      ok: true,
      username: user.username,
      full_name: user.full_name,
      followers: user.edge_followed_by?.count || 0,
      posts_count: user.edge_owner_to_timeline_media?.count || posts.length,
      profile_pic: user.profile_pic_url_hd || user.profile_pic_url,
      url: `https://www.instagram.com/${USERNAME}/`,
      posts
    });
  } catch (_) {
    return json({ ok: false, error: 'instagram_fetch_failed' }, 502);
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (url.pathname === '/api/event' && request.method === 'POST') return handleEvent(request, env);
    if (url.pathname === '/api/contact' && request.method === 'POST') return handleContact(request, env);
    if (url.pathname === '/api/subscribe' && request.method === 'POST') return handleSubscribe(request, env);
    if (url.pathname === '/api/instagram' && request.method === 'GET') return handleInstagram();
    if ((url.pathname === '/api/protocol-presence' || path === '/api/protocol-presence') && request.method === 'GET') {
      return handleProtocolPresence(env, ctx);
    }
    if (url.pathname.startsWith('/api/') && request.method === 'OPTIONS') return json({ ok: true });

    if (request.method === 'GET' || request.method === 'HEAD') {
      const legacy = LEGACY_REDIRECTS[path];
      if (legacy) return Response.redirect(publicOrigin(request) + legacy, 301);

      const section = PATH_SECTION[path];
      const acceptsHtml = (request.headers.get('accept') || '').includes('text/html');
      if (request.method === 'GET' && acceptsHtml) {
        track(env, [
          'pageview',
          path,
          clip(request.headers.get('referer'), 180),
          clip(request.cf && request.cf.country, 8)
        ]);
      }
      if (section) {
        const page = await serveSection(request, env, section);
        if (request.method === 'HEAD') {
          return new Response(null, { status: page.status, headers: page.headers });
        }
        return stampPresence(request, env, ctx, page, path);
      }
    }

    const asset = await env.ASSETS.fetch(request);
    return stampPresence(request, env, ctx, asset, path);
  }
};
