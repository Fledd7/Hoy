export const config = { runtime: 'edge' }

declare const process: { env: Record<string, string | undefined> }

interface LeadBody {
  name?: string
  email?: string
  message?: string
  consent?: boolean
  channelUrl?: string
  answers?: Record<string, string>
  scoreBreakdown?: {
    score: number
    leadClass: 'top' | 'good' | 'mid' | 'weak'
    category: 'A' | 'B' | 'C' | 'D'
  }
  channel?: {
    channel: { title: string; handle: string | null; subs: number; videoCount: number }
    metrics: { cadenceDays: number; medianViews: number; avgTitleLength: number; sampleSize: number }
    thumbnails: string[]
  } | null
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const LEAD_CLASS_LABEL: Record<NonNullable<LeadBody['scoreBreakdown']>['leadClass'], string> = {
  top: 'Top-Lead — binnen 24 h melden',
  good: 'Guter Lead — prüfen',
  mid: 'Mittlerer Lead — Guide / Follow-up',
  weak: 'Schwacher Lead — freundlich, nicht priorisieren',
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildHtml(body: LeadBody): string {
  const sb = body.scoreBreakdown
  const ch = body.channel
  const answersRows = Object.entries(body.answers ?? {})
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#6B6B6B">${escapeHtml(k)}</td><td style="padding:4px 0">${escapeHtml(v)}</td></tr>`,
    )
    .join('')

  const channelBlock = ch
    ? `
      <h3 style="font-family:Georgia,serif;margin:24px 0 8px">Kanaldaten</h3>
      <table style="font-size:14px;border-collapse:collapse">
        <tr><td style="padding:4px 12px 4px 0;color:#6B6B6B">Titel</td><td>${escapeHtml(ch.channel.title)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6B6B6B">Handle</td><td>${escapeHtml(ch.channel.handle ?? '—')}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6B6B6B">Abos</td><td>${ch.channel.subs.toLocaleString('de-DE')}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6B6B6B">Videos gesamt</td><td>${ch.channel.videoCount.toLocaleString('de-DE')}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6B6B6B">Upload-Rhythmus</td><td>alle ${ch.metrics.cadenceDays} Tage</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6B6B6B">Median-Views</td><td>${ch.metrics.medianViews.toLocaleString('de-DE')}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6B6B6B">Sample</td><td>${ch.metrics.sampleSize} Videos</td></tr>
      </table>
      <h3 style="font-family:Georgia,serif;margin:24px 0 8px">Letzte Thumbnails</h3>
      <div>
        ${ch.thumbnails
          .map(
            (t) =>
              `<img src="${escapeHtml(t)}" alt="" width="160" style="border-radius:8px;margin:4px;display:inline-block" />`,
          )
          .join('')}
      </div>`
    : '<p style="color:#6B6B6B;margin-top:16px"><em>Kein Kanal verlinkt — reine Selbsteinschätzung.</em></p>'

  return `<!doctype html><html><body style="font-family:Inter,Arial,sans-serif;color:#1A1A1A;max-width:640px">
    <h2 style="font-family:Georgia,serif">Neue Anfrage — Klarheitscheck</h2>
    ${
      sb
        ? `<p><strong>${escapeHtml(LEAD_CLASS_LABEL[sb.leadClass])}</strong><br>
           Score: ${sb.score}/100 · Kategorie: ${sb.category}</p>`
        : ''
    }
    <h3 style="font-family:Georgia,serif;margin:24px 0 8px">Kontakt</h3>
    <table style="font-size:14px;border-collapse:collapse">
      <tr><td style="padding:4px 12px 4px 0;color:#6B6B6B">Name</td><td>${escapeHtml(body.name ?? '')}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#6B6B6B">E-Mail</td><td><a href="mailto:${escapeHtml(body.email ?? '')}">${escapeHtml(body.email ?? '')}</a></td></tr>
      ${body.channelUrl ? `<tr><td style="padding:4px 12px 4px 0;color:#6B6B6B">Kanal</td><td>${escapeHtml(body.channelUrl)}</td></tr>` : ''}
    </table>
    ${
      body.message
        ? `<h3 style="font-family:Georgia,serif;margin:24px 0 8px">Nachricht</h3>
           <p style="white-space:pre-wrap">${escapeHtml(body.message)}</p>`
        : ''
    }
    <h3 style="font-family:Georgia,serif;margin:24px 0 8px">Antworten</h3>
    <table style="font-size:14px;border-collapse:collapse">${answersRows}</table>
    ${channelBlock}
  </body></html>`
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ ok: false, reason: 'method_not_allowed' }, 405)

  let body: LeadBody
  try {
    body = (await req.json()) as LeadBody
  } catch {
    return json({ ok: false, reason: 'invalid_body' }, 400)
  }

  const name = (body.name ?? '').trim()
  const email = (body.email ?? '').trim()
  if (name.length < 2) return json({ ok: false, reason: 'invalid_name' }, 400)
  if (!EMAIL_RE.test(email)) return json({ ok: false, reason: 'invalid_email' }, 400)
  if (body.consent !== true) return json({ ok: false, reason: 'consent_required' }, 400)

  const resendKey = process.env.RESEND_API_KEY
  const toEmail = process.env.LEAD_TO_EMAIL
  const fromEmail = process.env.LEAD_FROM_EMAIL

  if (!resendKey || !toEmail || !fromEmail) {
    console.error('[lead] missing resend config')
    return json({ ok: false, reason: 'missing_config' }, 500)
  }

  const sbClass = body.scoreBreakdown?.leadClass ?? 'mid'
  const subject = `Klarheitscheck · ${LEAD_CLASS_LABEL[sbClass]} · ${escapeHtml(name)}`

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: email,
        subject,
        html: buildHtml(body),
      }),
    })
    if (!r.ok) {
      const t = await r.text().catch(() => '')
      console.error('[lead] resend failed', r.status, t.slice(0, 300))
      return json({ ok: false, reason: 'send_failed' }, 502)
    }
    return json({ ok: true })
  } catch (err) {
    console.error('[lead] error', err instanceof Error ? err.message : String(err))
    return json({ ok: false, reason: 'send_failed' }, 502)
  }
}
