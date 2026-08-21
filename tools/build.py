#!/usr/bin/env python3
"""Assemble Sensei Studios static pages from fragments + sculptures.json."""
from __future__ import annotations

import json
import html
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRAG = ROOT / "fragments"
SCULPT = json.loads((ROOT / "data" / "sculptures.json").read_text())

SITE = "https://senseistudios.com"


def esc(s: str) -> str:
    return html.escape(s, quote=True)


def frag(name: str) -> str:
    return (FRAG / f"{name}.html").read_text()


def nav(active: str) -> str:
    def item(href, key, label):
        cls = ' class="nav-link active"' if active == key else ' class="nav-link"'
        return f'        <li><a href="{href}"{cls}>{label}</a></li>'

    return f'''  <nav class="site-nav" id="site-nav" aria-label="Primary">
    <div class="container nav-container">
      <a href="/" class="nav-brand">
        <img src="/assets/cinema_ninja_logo_nav.webp" alt="Sensei Studios" class="nav-logo-img" width="48" height="48">
        <span class="nav-brand-title">SENSEI STUDIOS</span>
      </a>
      <ul class="nav-links" id="nav-links">
{item("/film/", "film", "Film")}
{item("/wood/", "wood", "Wood")}
{item("/handpan/", "handpan", "Handpan")}
{item("/web/", "web", "Web")}
{item("/film/#arsenal", "arsenal", "Arsenal")}
{item("/story/", "story", "Story")}
{item("/#estimator", "scope", "Scope")}
        <li class="nav-mobile-cta"><a href="#contact" class="nav-link">Book Project</a></li>
      </ul>
      <div class="nav-actions">
        <a href="#contact" class="nav-cta-btn">
          <span class="nav-cta-text">Book Project</span>
          <span class="nav-cta-icon" aria-hidden="true">→</span>
        </a>
        <button class="nav-hamburger" id="nav-hamburger" type="button" aria-label="Toggle menu" aria-expanded="false" aria-controls="nav-links">
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </button>
      </div>
    </div>
  </nav>'''


def head(title: str, description: str, canonical: str, og_image: str = "/assets/og-cover.jpg", jsonld: str | None = None) -> str:
    og_abs = og_image if og_image.startswith("http") else SITE + og_image
    can_abs = canonical if canonical.startswith("http") else SITE + canonical
    extra = f"\n  <script type=\"application/ld+json\">\n{jsonld}\n  </script>" if jsonld else ""
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(description)}">
  <meta name="author" content="Daniel Kelly Brown, Sensei Studios">
  <meta name="theme-color" content="#07090E">
  <link rel="canonical" href="{can_abs}">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(description)}">
  <meta property="og:image" content="{og_abs}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:type" content="website">
  <meta property="og:url" content="{can_abs}">
  <meta property="og:site_name" content="Sensei Studios">
  <meta property="og:locale" content="en_US">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc(title)}">
  <meta name="twitter:description" content="{esc(description)}">
  <meta name="twitter:image" content="{og_abs}">
  <link rel="icon" type="image/png" href="/assets/icons/favicon-32.png">
  <link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="preload" as="image" href="/assets/cinema_ninja_logo.webp" type="image/webp">
  <link rel="stylesheet" href="/assets/fonts/fonts.css">
  <link rel="stylesheet" href="/styles.css">
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": "Sensei Studios",
    "alternateName": "Cinema Ninja",
    "url": "https://senseistudios.com",
    "email": "brown@senseistudios.com",
    "telephone": "+1-303-709-8647",
    "founder": {{
      "@type": "Person",
      "name": "Daniel Kelly Brown",
      "jobTitle": "Cinematographer & Craftsman",
      "address": {{ "@type": "PostalAddress", "addressRegion": "CO", "addressCountry": "US" }}
    }},
    "description": "Colorado cinematography, 8K motion-controlled timelapse, Cinema 4D animation, FPV drones, fine timber sculpture, and live handpan.",
    "areaServed": "Worldwide",
    "address": {{ "@type": "PostalAddress", "addressRegion": "CO", "addressCountry": "US" }},
    "logo": "https://senseistudios.com/assets/logo.png",
    "image": "https://senseistudios.com/assets/og-cover.jpg",
    "sameAs": [
      "https://vimeo.com/danielkellybrown",
      "https://www.youtube.com/@DanielKellyBrown",
      "https://www.instagram.com/danielkellybrown/"
    ]
  }}
  </script>{extra}
</head>
<body class="loading-lock">
  <a class="skip-link" href="#main-content">Skip to content</a>
  <canvas id="zen-canvas" aria-hidden="true"></canvas>
  <div id="custom-cursor" aria-hidden="true"></div>
  <div id="preloader" aria-hidden="true">
    <div class="preloader-enso-wrapper">
      <div class="preloader-enso"></div>
      <img src="/assets/cinema_ninja_logo_nav.webp" alt="" class="preloader-logo" width="70" height="70">
    </div>
    <div class="preloader-title">SENSEI STUDIOS</div>
    <div class="preloader-subtitle">ENTER THE DOJO</div>
  </div>
'''


ORG = '''  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Daniel Kelly Brown",
    "jobTitle": "Cinematographer",
    "url": "https://senseistudios.com/story/",
    "homeLocation": { "@type": "Place", "address": { "@type": "PostalAddress", "addressRegion": "CO", "addressCountry": "US" } },
    "sameAs": ["https://vimeo.com/danielkellybrown", "https://www.youtube.com/@DanielKellyBrown", "https://www.instagram.com/danielkellybrown/"]
  }
  </script>'''


def footer() -> str:
    return '''  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="footer-brand-title">SENSEI STUDIOS</div>
          <p class="footer-tagline">
            Master cinematography, web design, 8K motion-controlled timelapse, Cinema 4D animation, FPV drones, fine timber woodwork, and live handpan. Colorado based. Worldwide capable — however, cross-state is double the cost and cross-country is 3×.
          </p>
          <div class="footer-social">
            <a href="https://www.instagram.com/danielkellybrown/" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="https://www.youtube.com/@DanielKellyBrown" target="_blank" rel="noopener noreferrer">YouTube</a>
            <a href="https://vimeo.com/danielkellybrown" target="_blank" rel="noopener noreferrer">Vimeo</a>
          </div>
        </div>
        <div>
          <h4 class="footer-heading">Navigate</h4>
          <ul class="footer-links">
            <li><a href="/film/">Film &amp; Motion</a></li>
            <li><a href="/wood/">Local Aspen Woodwork</a></li>
            <li><a href="/handpan/">Handpan Music</a></li>
            <li><a href="/web/">Web Design</a></li>
            <li><a href="/film/#arsenal">Equipment Arsenal</a></li>
            <li><a href="/story/">Daniel Kelly Brown</a></li>
            <li><a href="/privacy/">Privacy</a></li>
          </ul>
        </div>
        <div>
          <h4 class="footer-heading">Direct Contact</h4>
          <p class="footer-contact">
            <a href="mailto:brown@senseistudios.com">brown@senseistudios.com</a><br>
            <a href="tel:+13037098647">303-709-8647</a><br>
            Colorado, USA
          </p>
        </div>
      </div>
      <div class="footer-bottom">
        © <span id="footer-year">2026</span> Sensei Studios. All rights reserved.
      </div>
    </div>
  </footer>'''


def chrome_end() -> str:
    return '''  <div class="video-modal" id="video-modal" role="dialog" aria-modal="true" aria-labelledby="modal-info-title" aria-hidden="true" hidden>
    <div class="modal-content-wrapper">
      <button type="button" class="modal-close-btn" id="modal-close-btn" aria-label="Close video">✕</button>
      <div class="modal-iframe-container" id="modal-iframe-container"></div>
      <div class="modal-info-bar">
        <div class="modal-info-title" id="modal-info-title">Sensei Studios Theater</div>
        <span class="modal-quality">HD / 4K</span>
      </div>
    </div>
  </div>

  <div class="sculpture-modal" id="sculpture-qr-modal" role="dialog" aria-modal="true" aria-labelledby="modal-sculpture-title" aria-hidden="true" hidden>
    <div class="sculpture-modal-card">
      <button type="button" class="modal-close-btn" id="sculpture-modal-close" aria-label="Close">✕</button>
      <div class="modal-qr-preview-box">
        <div class="modal-qr-img" id="qr-code-target"></div>
        <div class="modal-qr-label">Gallery piece</div>
        <div class="modal-qr-url" id="qr-direct-link">https://senseistudios.com/wood/</div>
        <p class="lightbox-zoom-hint">Highest-resolution file in the archive</p>
      </div>
      <div class="sculpture-modal-body">
        <span class="woodwork-header-badge" id="modal-sculpture-status"></span>
        <h3 id="modal-sculpture-title"></h3>
        <div class="modal-sculpture-specs" id="modal-sculpture-specs"></div>
        <div class="modal-sculpture-meta">
          <div class="meta-row">
            <span>Acquisition price</span>
            <span class="meta-price" id="modal-sculpture-price"></span>
          </div>
          <div class="meta-row">
            <span>Dimensions</span>
            <span class="meta-dim" id="modal-sculpture-dim"></span>
          </div>
        </div>
        <div id="modal-sculpture-story"></div>
        <button type="button" class="btn btn-gold" id="modal-reserve-btn">Inquire about this piece</button>
        <a class="btn btn-outline" id="modal-piece-link" href="/wood/" style="margin-top:0.75rem;text-align:center;">Open piece page</a>
        <p class="modal-reserve-note">Inquiry goes to Daniel Kelly Brown &amp; Buckhorn Public Arts staff.</p>
      </div>
    </div>
  </div>

  <div class="float-controls">
    <button type="button" class="float-btn" id="sound-toggle" aria-label="Play a chime" aria-pressed="false" title="Play a chime">
      <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c-1.2 2.4-4 4.4-4 8a4 4 0 1 0 8 0c0-3.6-2.8-5.6-4-8zm0 18v-3" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>
    </button>
    <a href="#main-content" class="float-btn float-top" id="back-to-top" aria-label="Back to top" hidden>
      <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m0 0-6 6m6-6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </a>
  </div>

  <div class="sticky-call" aria-label="Quick contact">
    <a class="btn btn-outline" href="tel:+13037098647">Call Daniel</a>
    <a class="btn btn-gold" href="#contact">Inquire</a>
  </div>

  <script src="/sculptures-data.js" defer></script>
  <script src="/script.js" defer></script>
</body>
</html>
'''


def page(title, description, canonical, active, inner, og_image="/assets/og-cover.jpg", jsonld=None) -> str:
    return (
        head(title, description, canonical, og_image, jsonld)
        + nav(active)
        + '\n  <main id="main-content">\n'
        + inner.rstrip()
        + "\n  </main>\n\n"
        + footer()
        + "\n"
        + chrome_end()
    )


def write(rel: str, content: str) -> None:
    path = ROOT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)
    print("wrote", rel, len(content))


def giving_html(s: dict) -> str:
    if not s.get("giving"):
        return ""
    items = []
    for g in s["giving"]:
        name = g["name"]
        if g.get("url"):
            name = f'<a href="{esc(g["url"])}" target="_blank" rel="noopener noreferrer">{esc(name)}</a>'
        else:
            name = esc(name)
        detail = f' {esc(g["detail"])}' if g.get("detail") else ""
        items.append(f'<li>{esc(g["pct"])} to {name}{detail}</li>')
    intro = f'<p>{esc(s.get("givingIntro", ""))}</p>' if s.get("givingIntro") else ""
    return intro + '<ul class="masterpiece-giving-list">' + "".join(items) + "</ul>"


def piece_jsonld(s: dict) -> str:
    img = s.get("imageFull") or s.get("image") or ""
    img = img.replace("./", "/")
    if img.startswith("/"):
        img = SITE + img
    return json.dumps(
        {
            "@context": "https://schema.org",
            "@type": "VisualArtwork",
            "name": s["title"],
            "creator": {"@type": "Person", "name": "Daniel Kelly Brown"},
            "artMedium": s.get("specs", "Wood sculpture"),
            "description": s.get("desc", ""),
            "image": img,
            "url": f"{SITE}/wood/{s['slug']}/",
            "offers": {
                "@type": "Offer",
                "price": s["price"].replace("$", "").replace(",", ""),
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "url": f"{SITE}/wood/{s['slug']}/",
            },
        },
        indent=2,
    )


HUB_TEASERS = '''
    <section class="film-home-section" id="work">
      <div class="container">
        <article class="video-card featured-card" data-inline="true" data-category="reels" data-video-type="youtube" data-video-id="9G1n3BTHkxw">
          <p class="featured-kicker">Film &amp; motion</p>
          <div class="video-thumbnail-wrapper">
            <img src="/assets/thumbs/yt-9G1n3BTHkxw.webp" alt="" class="video-thumbnail" width="1280" height="720" decoding="async">
            <button type="button" class="video-play-btn home-reel-play" aria-label="Play Official Video Reel">
              <span class="play-icon-btn" aria-hidden="true">▶</span>
            </button>
          </div>
          <div class="video-card-body">
            <h2 class="video-title">Official Video Reel</h2>
            <p class="video-description">Ski gimbal, action sports, documentary, and commercial cinematography — twenty-five years, one cut.</p>
            <a class="btn btn-outline" href="/film/">Open film archive</a>
          </div>
        </article>
      </div>
    </section>
'''


def build() -> None:
    fallback = "/* auto-embedded sculpture fallback */\nwindow.__SENSEI_SCULPTURES__ = " + json.dumps(SCULPT, indent=2) + ";\n"
    (ROOT / "sculptures-data.js").write_text(fallback)

    write(
        "index.html",
        page(
            "Sensei Studios | Cinematography, Wood Sculpture, Handpan & Web",
            "Colorado-based cinematography, 8K motion-controlled timelapse, Cinema 4D, FPV drones, fine aspen wood sculpture, and live handpan by Daniel Kelly Brown.",
            "/",
            "home",
            frag("hero") + frag("proof") + HUB_TEASERS + frag("woodwork").replace(
                'id="sculpture-grid" aria-live="polite">\n          <p class="sculpture-loading">Loading gallery…</p>\n        </div>\n        <div class="gallery-more" id="gallery-more" hidden>',
                'id="sculpture-grid" hidden></div>\n        <div class="gallery-more" id="gallery-more" hidden>',
            )
            + '''
        <div class="container" style="text-align:center;margin:-2rem 0 4rem;">
          <a class="btn btn-gold" href="/wood/">View all sculptures</a>
        </div>
'''
            + frag("handpan")
            + frag("web")
            + frag("bio")
            + frag("instagram")
            + frag("estimator")
            + frag("contact"),
        ),
    )

    write(
        "film/index.html",
        page(
            "Film & Motion | Sensei Studios",
            "Director reel, 8K motion-controlled timelapse, FPV drone, Cinema 4D, and the equipment arsenal of Daniel Kelly Brown.",
            "/film/",
            "film",
            frag("portfolio")
            + frag("arsenal")
            + frag("estimator")
            + frag("contact"),
        ),
    )

    write(
        "wood/index.html",
        page(
            "Aspen Wood Sculpture | Sensei Studios",
            "Hand-milled aspen sculptures and the Tree>Triangle Great Horned Owl mural, exhibiting at The Grove in Aspen.",
            "/wood/",
            "wood",
            frag("woodwork")
            + frag("contact"),
            og_image="/assets/sculptures/tree-triangle-mural.webp",
        ),
    )

    write(
        "handpan/index.html",
        page(
            "Handpan Performances | Sensei Studios",
            "Live handpan for events, sound baths, and weddings in Colorado and beyond. Request a date.",
            "/handpan/",
            "handpan",
            frag("handpan")
            + frag("contact"),
        ),
    )

    write(
        "web/index.html",
        page(
            "Web Design | Sensei Studios",
            "Brand websites and interactive proposal sites by Sensei Studios — cinematic, fast, built to convert.",
            "/web/",
            "web",
            frag("web")
            + frag("contact"),
        ),
    )

    write(
        "story/index.html",
        page(
            "Daniel Kelly Brown | Sensei Studios",
            "Colorado cinematographer and craftsman — 25 years of camera, robots, FPV, timber, and handpan.",
            "/story/",
            "story",
            frag("bio")
            + frag("instagram")
            + frag("contact"),
        ),
    )

    write(
        "privacy/index.html",
        page(
            "Privacy | Sensei Studios",
            "How Sensei Studios handles inquiry information.",
            "/privacy/",
            "home",
            '''    <article class="privacy-page" id="hero">
      <div class="container">
        <h1 class="section-title">Privacy</h1>
        <p>Inquiries sent through this website go to brown@senseistudios.com so Daniel can reply about a project or sculpture.</p>
        <p>We collect the name, email, and message you submit, plus optional phone, project type, budget, sculpture title, and event details. We do not sell this information. We keep it only as long as needed to respond and archive the job.</p>
        <p>The site is hosted on Cloudflare. Analytics are not loaded by default. Third-party players (YouTube, Vimeo, Instagram) may set cookies if you press play or open a post preview.</p>
        <p>Questions: <a href="mailto:brown@senseistudios.com">brown@senseistudios.com</a>.</p>
      </div>
    </article>
''',
        ),
    )

    for s in SCULPT:
        img = (s.get("imageFull") or s["image"]).replace("./", "/")
        story = f"<p>{esc(s['desc'])}</p>" + giving_html(s)
        layout = "piece-layout piece-layout--mural" if s.get("isFeatured") else "piece-layout"
        img_w, img_h = ("1024", "448") if s.get("isFeatured") else ("787", "1400")
        inner = f'''    <article class="piece-page" id="hero" data-piece-slug="{esc(s["slug"])}">
      <div class="container {layout}">
        <div class="piece-photo">
          <img src="{esc(img)}" alt="{esc(s["title"])} by Daniel Kelly Brown" width="{img_w}" height="{img_h}">
        </div>
        <div class="piece-copy">
          <a class="piece-back" href="/wood/">← All sculptures</a>
          <span class="status-pill {esc(s.get("status") or "exhibiting")}">{esc(s.get("statusLabel") or s.get("status") or "")}</span>
          <h1 class="masterpiece-title">{esc(s["title"])}</h1>
          <div class="masterpiece-price-row">
            <span class="masterpiece-price">{esc(s["price"])}</span>
          </div>
          <div class="masterpiece-desc">{story}</div>
          <div class="masterpiece-specs-box">
            <div class="masterpiece-specs-item">
              <span class="masterpiece-spec-label">Specs</span>
              <span class="masterpiece-spec-value">{esc(s["specs"])}</span>
            </div>
            <div class="masterpiece-specs-item" style="margin-top:0.4rem;">
              <span class="masterpiece-spec-label">Dimensions</span>
              <span class="masterpiece-spec-value gold">{esc(s["dim"])}</span>
            </div>
          </div>
          <div class="masterpiece-actions">
            <a class="btn btn-gold" href="#contact" data-prefill-type="Fine Wood Sculpture Inquiry" data-prefill-piece="{esc(s["title"])}" data-prefill-message="Hello Daniel — I am interested in acquiring &quot;{esc(s["title"])}&quot; ({esc(s["price"])}). Please share availability, install, and next steps.">Inquire / reserve</a>
          </div>
        </div>
      </div>
    </article>
'''
        write(
            f"wood/{s['slug']}/index.html",
            page(
                f"{s['title']} | Sensei Studios",
                s["desc"][:160],
                f"/wood/{s['slug']}/",
                "wood",
                inner + frag("contact"),
                og_image=img,
                jsonld=piece_jsonld(s),
            ),
        )

    urls = [
        "/",
        "/film/",
        "/wood/",
        "/handpan/",
        "/web/",
        "/story/",
        "/privacy/",
    ] + [f"/wood/{s['slug']}/" for s in SCULPT]
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        sm += ["  <url>", f"    <loc>{SITE}{u}</loc>", "    <changefreq>weekly</changefreq>", "  </url>"]
    sm.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(sm) + "\n")
    print("sitemap", len(urls), "urls")


if __name__ == "__main__":
    build()
