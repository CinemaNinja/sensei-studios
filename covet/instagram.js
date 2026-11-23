(function () {
  const grid = document.getElementById("instagram-grid");
  if (!grid) return;

  const statsEl = document.getElementById("instagram-stats");
  const avatarEl = document.querySelector(".instagram-avatar");

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function render(data) {
    if (!data || !Array.isArray(data.posts) || !data.posts.length) return;
    const posts = data.posts.slice(0, 6);
    if (statsEl) statsEl.textContent = "Six frames";
    if (avatarEl && data.profile_pic) avatarEl.src = data.profile_pic;
    grid.innerHTML = posts
      .map((p) => {
        const local = p.shortcode
          ? `images/social/ig-${encodeURIComponent(p.shortcode)}.webp`
          : "";
        const src = local || p.thumbnail || "images/social/instagram-avatar.webp";
        const video = p.is_video ? ' data-video="true"' : "";
        const cap = escapeHtml(p.caption || "A frame from Covet");
        return `<a class="instagram-tile" href="${escapeHtml(p.url)}" target="_blank" rel="noopener noreferrer"${video}>
          <img src="${escapeHtml(src)}" alt="${cap}" width="640" height="800" loading="lazy">
          <span class="instagram-tile-cap">${cap}</span>
        </a>`;
      })
      .join("");
  }

  fetch("data/instagram.json")
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((data) => {
      if (data && Array.isArray(data.posts) && data.posts.length) render(data);
    })
    .catch(() => {});
})();
