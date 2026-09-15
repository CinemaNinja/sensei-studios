---
name: website-ship-pass
description: Last-pass launch checklist that blocks shipping a website until every required item is designed and ready. Use when the user asks to ship, go live, make it live, push a site, launch, last pass, or pre-launch QA; also when they mention custom 404, robots.txt, sitemap, favicon, Open Graph, cookie banner, privacy policy, or thank you page.
---

# Website ship pass

Hard gate for production. **Do not commit, push, or deploy** a website until every item below is `PASS` or `WAIVED` with a one-line reason. Stubs, placeholders, and “we’ll add it later” are `FAIL`.

If the user already asked to ship, run this pass first, then ship only if the report is green. If anything fails, stop and list the gaps. Do not ship a partial site.

## Required list

Use these names verbatim:

- Custom 404 page
- Meta title on every page
- Meta description on every page
- CTA above the fold
- Favicon set
- robots.txt file
- sitemap.xml
- Open Graph image
- Alt text on every image
- Mobile breakpoints
- Sticky mobile CTA
- Loading states
- Form error states
- Thank you page
- Privacy policy page
- Terms and conditions
- Cookie banner
- Analytics installed
- Real contact address
- Compressed images

## Designed properly

Audit the live or local site. Check routes, HTML, CSS, forms, and a phone-width viewport. Do not trust a file existing if the user never sees a designed result.

| Item | PASS only if |
|---|---|
| Custom 404 page | Unknown URLs return **HTTP 404** (not 200) and a branded page with nav plus a way home or to contact. Plain server text is FAIL. |
| Meta title on every page | Unique `<title>` per indexable URL. Homepage, chapters, nested routes, and legal pages. No “Untitled” or duplicated homepage title on inner pages. |
| Meta description on every page | Unique `<meta name="description">` on every indexable URL. Not empty, not copied site-wide. |
| CTA above the fold | First screen on mobile and desktop has a primary action (book, buy, call, watch). Logo-only heroes FAIL. |
| Favicon set | `rel="icon"` plus apple-touch icon that actually load. Broken `/favicon.ico` FAIL. |
| robots.txt file | Served at `/robots.txt`, allows the public site, points at the sitemap. Accidental `Disallow: /` FAIL. |
| sitemap.xml | Live XML at the robots URL. Every public canonical is listed. Dead paths and slash mismatches FAIL. |
| Open Graph image | `og:image` on every shareable URL, ~1200×630, real file, not a missing asset. Prefer unique images for major chapters. |
| Alt text on every image | Content images have real `alt`. Decorative images use `alt=""`. Missing `alt` attribute FAIL. |
| Mobile breakpoints | Layout holds at ~390px: no horizontal scroll, tap targets usable, type readable. |
| Sticky mobile CTA | A persistent call/inquire/book control on small screens that does not cover the form submit. |
| Loading states | First paint and slow actions show a designed wait (preloader, button spinner, skeleton). Blank hang FAIL. |
| Form error states | Empty required, bad email, and server failure each show a visible message. Silent fail or jump-to-mail-only with no explanation FAIL. Native `reportValidity` is enough for empty/invalid fields if it actually runs. |
| Thank you page | After a successful submit the visitor sees a designed confirmation (own URL **or** in-place success that replaces the form). Mailto fallback is not a thank-you. |
| Privacy policy page | Public page linked from footer and forms. Says what is collected, why, and how to reach you. |
| Terms and conditions | Required if checkout, accounts, paid downloads, or a product ToS. Brochure/contact-only sites may `WAIVE` with that reason. |
| Cookie banner | Required if non-essential / ad / marketing cookies or EU-facing consent. First-party analytics disclosed on the privacy page may `WAIVE` with that reason. A banner that blocks the site with no real choice FAIL. |
| Analytics installed | Working measurement (first-party, Cloudflare, or similar) on production. Dead snippet or localhost-only FAIL. |
| Real contact address | Public email and phone that work. City/region at minimum. Street optional when the studio is a home; city still required. |
| Compressed images | Heroes and galleries in modern compressed formats (WebP/AVIF). No multi-MB page-weight photos. OG JPEG under ~300KB is fine. |

`WAIVE` is allowed only for **Terms and conditions** and **Cookie banner**, and only with a specific reason that matches the site. Everything else must PASS.

## Report then gate

Print this table before any git push or production deploy:

```
Item | Status | Evidence
Custom 404 page | PASS/FAIL/WAIVE | …
…
```

- Any `FAIL` → stop. Do not ship.
- All `PASS` or allowed `WAIVE` → proceed with the project’s normal ship/deploy steps.
- After deploy, spot-check the live homepage, one inner URL, `/robots.txt`, `/sitemap.xml`, a 404, and the contact form path.

Do not “fix later.” Design or implement the failing items, re-run the pass, then ship.
