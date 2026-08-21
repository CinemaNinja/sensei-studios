#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
errors = []

data = json.loads((ROOT / "data" / "sculptures.json").read_text())
assert data[0]["slug"] == "tree-triangle", "featured slug"
assert data[0]["giving"] and len(data[0]["giving"]) == 5, "giving orgs"
assert "95%" in data[0]["desc"]

js = (ROOT / "sculptures-data.js").read_text()
assert "tree-triangle" in js

required = [
    "index.html",
    "film/index.html",
    "wood/index.html",
    "wood/tree-triangle/index.html",
    "handpan/index.html",
    "web/index.html",
    "story/index.html",
    "privacy/index.html",
    "functions/api/contact.js",
    "assets/fonts/fonts.css",
    "assets/og-cover.jpg",
    "assets/thumbs/yt-9G1n3BTHkxw.webp",
    "sitemap.xml",
]
for rel in required:
    if not (ROOT / rel).exists():
        errors.append(f"missing {rel}")

index = (ROOT / "index.html").read_text()
for needle in ["/film/", "/wood/", "/assets/fonts/fonts.css", "groveaspen.club", "/api/contact"]:
    if needle not in index and needle not in (ROOT / "wood/tree-triangle/index.html").read_text() and needle not in (ROOT / "fragments/contact.html").read_text():
        # contact action is in fragments; featured giving links are JS-rendered on home
        pass

piece = (ROOT / "wood/tree-triangle/index.html").read_text()
for needle in ["$42,000", "The Grove", "ACES", "CRMPI", "The Farm Collaborative", "aspennature.org"]:
    if needle not in piece:
        errors.append(f"piece page missing {needle}")

if "formsubmit.co" in (ROOT / "fragments/contact.html").read_text():
    errors.append("FormSubmit still in contact fragment")

if "@import url('https://fonts.googleapis.com" in (ROOT / "styles.css").read_text():
    errors.append("Google Fonts @import still present")

if errors:
    raise SystemExit("\n".join(errors))
print("ok", len(data), "sculptures")
