const MAX = { nom: 120, email: 160, entreprise: 160, profil: 80, lieu: 80, periode: 80, zone: 120, debut: 20, message: 3000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const CONFIRM = {
  fr: { subject: 'Votre demande a bien été reçue', hello: (n) => `Bonjour ${n},`, body: 'Nous avons bien reçu votre demande et nous reviendrons vers vous par e-mail avec une proposition adaptée.', reply: 'Vous pouvez répondre directement à ce message pour compléter votre demande.', recap: 'Votre message :' },
  nl: { subject: 'Uw aanvraag is goed ontvangen', hello: (n) => `Goedendag ${n},`, body: 'Wij hebben uw aanvraag goed ontvangen en komen per e-mail bij u terug met een aangepast voorstel.', reply: 'U kunt rechtstreeks op dit bericht antwoorden om uw aanvraag aan te vullen.', recap: 'Uw bericht:' },
  en: { subject: 'Your request has been received', hello: (n) => `Hello ${n},`, body: 'We have received your request and will get back to you by e-mail with a tailored proposal.', reply: 'You can reply directly to this message to add to your request.', recap: 'Your message:' }
};
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
  if (!res.ok) {
    console.error('resend', res.status, (await res.text()).slice(0, 300));
    return json({ ok: false }, 502);
  }

  const c = CONFIRM[data.lang] || CONFIRM.fr;
  const quote = f.message ? `<p>${esc(c.recap)}</p><blockquote style="white-space:pre-wrap;margin:0 0 16px;padding-left:12px;border-left:3px solid #ccc">${esc(f.message)}</blockquote>` : '';
  try {
    const ack = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: env.FROM_EMAIL,
        to: [f.email],
        reply_to: env.TO_EMAIL,
        subject: c.subject,
        headers: { 'Auto-Submitted': 'auto-generated' },
        html: `<p>${esc(c.hello(f.nom))}</p><p>${esc(c.body)}</p>${quote}<p>${esc(c.reply)}</p><p>B&amp;K Consulting</p>`,
        text: `${c.hello(f.nom)}\n\n${c.body}\n\n${f.message ? c.recap + '\n' + f.message + '\n\n' : ''}${c.reply}\n\nB&K Consulting`
      })
    });
    if (!ack.ok) console.error('resend ack', ack.status, (await ack.text()).slice(0, 300));
  } catch (e) { console.error('resend ack', String(e)); }
  return json({ ok: true });
}

export const onRequest = () => json({ ok: false }, 405);
