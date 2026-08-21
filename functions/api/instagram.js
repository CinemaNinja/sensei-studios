const USERNAME = 'danielkellybrown';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=600',
      'access-control-allow-origin': '*'
    }
  });
}

export async function onRequestGet() {
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
    if (!res.ok) {
      return json({ ok: false, error: 'instagram_unavailable' }, 502);
    }
    const raw = await res.json();
    const user = raw?.data?.user;
    if (!user) return json({ ok: false, error: 'instagram_empty' }, 502);

    const edges = user.edge_owner_to_timeline_media?.edges || [];
    const posts = edges.slice(0, 3).map((e) => {
      const n = e.node || {};
      const capEdges = n.edge_media_to_caption?.edges || [];
      const caption = capEdges[0]?.node?.text || '';
      return {
        shortcode: n.shortcode,
        is_video: Boolean(n.is_video),
        thumbnail: n.thumbnail_src || n.display_url,
        caption: String(caption).slice(0, 180),
        url: `https://www.instagram.com/p/${n.shortcode}/`
      };
    });

    return json({
      ok: true,
      username: user.username,
      full_name: user.full_name,
      biography: user.biography || '',
      followers: user.edge_followed_by?.count || 0,
      posts_count: user.edge_owner_to_timeline_media?.count || posts.length,
      profile_pic: user.profile_pic_url_hd || user.profile_pic_url,
      url: `https://www.instagram.com/${USERNAME}/`,
      posts
    });
  } catch {
    return json({ ok: false, error: 'instagram_fetch_failed' }, 502);
  }
}
