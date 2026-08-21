const EMAIL_TO = 'brown@senseistudios.com';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type',
      'access-control-allow-methods': 'POST, OPTIONS'
    }
  });
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, 400);
  }

  if (body.company || body.website || body._gotcha) {
    return json({ ok: true, ignored: true });
  }

  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const message = String(body.message || body.notes || '').trim();
  const phone = String(body.phone || '').trim();
  const projectType = String(body.project_type || body.projectType || '').trim();
  const budget = String(body.budget || '').trim();
  const piece = String(body.piece || '').trim();
  const eventDate = String(body.event_date || body.eventDate || '').trim();
  const eventLocation = String(body.event_location || body.eventLocation || '').trim();
  const estimator = String(body.estimator_total || '').trim();
  const services = String(body.estimator_services || '').trim();

  if (!name || !email || !message) {
    return json({ ok: false, error: 'Name, email, and message are required.' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: 'Please enter a valid email.' }, 400);
  }

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
    : 'Sensei Studios — New Project Inquiry';

  const key = env && env.RESEND_API_KEY;
  if (key) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM || 'Sensei Studios <studio@senseistudios.com>',
        to: [env.CONTACT_TO || EMAIL_TO],
        reply_to: email,
        subject,
        text
      })
    });
    if (!res.ok) {
      const err = await res.text();
      return json({ ok: false, error: 'Email provider rejected the message.', detail: err }, 502);
    }
    return json({ ok: true, via: 'resend' });
  }

  return json({
    ok: false,
    fallback: 'mailto',
    mailto: {
      to: EMAIL_TO,
      subject,
      body: text
    }
  }, 200);
}
