const MAX = { nom: 120, email: 160, entreprise: 160, profil: 80, lieu: 80, periode: 80, zone: 120, debut: 20, message: 3000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('origin');
  if (env.ALLOWED_ORIGIN && origin !== env.ALLOWED_ORIGIN) return json({ ok: false }, 403);

  let data;
  try { data = await request.json(); } catch { return json({ ok: false }, 400); }
  if (data.website) return json({ ok: true });

  const f = {};
  for (const k of Object.keys(MAX)) f[k] = String(data[k] || '').trim().slice(0, MAX[k]);
  if (!f.nom || !EMAIL_RE.test(f.email)) return json({ ok: false }, 422);

  const rows = [['Nom', f.nom], ['E-mail', f.email], ['Entreprise', f.entreprise], ['Activité', f.profil], ['Lieu', f.lieu], ['Période', f.periode], ['Zone', f.zone], ['Début', f.debut]];
  const html = '<table>' + rows.map(([a, b]) => `<tr><td><b>${esc(a)}</b></td><td>${esc(b || '-')}</td></tr>`).join('') + '</table><p style="white-space:pre-wrap">' + esc(f.message) + '</p>';
  const text = rows.map(([a, b]) => `${a}: ${b || '-'}`).join('\n') + '\n\n' + f.message;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.FROM_EMAIL,
      to: [env.TO_EMAIL],
      reply_to: f.email,
      subject: `Demande de devis — ${f.nom}`.replace(/[\r\n]/g, ' '),
      html,
      text
    })
  });
  return res.ok ? json({ ok: true }) : json({ ok: false }, 502);
}

export const onRequest = () => json({ ok: false }, 405);
