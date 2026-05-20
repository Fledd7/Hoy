export const config = { runtime: 'edge' }

declare const process: { env: Record<string, string | undefined> }

const API = 'https://www.googleapis.com/youtube/v3'

type Parsed =
  | { kind: 'channelId'; value: string }
  | { kind: 'handle'; value: string }
  | { kind: 'username'; value: string }
  | { kind: 'query'; value: string }

function parseInput(raw: string): Parsed {
  const s = raw.trim()
  const ch = s.match(/channel\/(UC[\w-]{20,})/)
  if (ch) return { kind: 'channelId', value: ch[1] }
  if (/^UC[\w-]{20,}$/.test(s)) return { kind: 'channelId', value: s }
  const handle = s.match(/@([A-Za-z0-9._-]+)/)
  if (handle) return { kind: 'handle', value: handle[1] }
  const user = s.match(/user\/([A-Za-z0-9._-]+)/)
  if (user) return { kind: 'username', value: user[1] }
  const c = s.match(/\/c\/([^/?#]+)/)
  if (c) return { kind: 'query', value: decodeURIComponent(c[1]) }
  return { kind: 'query', value: s }
}

async function resolveChannelId(p: Parsed, key: string): Promise<string | null> {
  if (p.kind === 'channelId') return p.value
  if (p.kind === 'handle') {
    const r = await fetch(`${API}/channels?part=id&forHandle=@${encodeURIComponent(p.value)}&key=${key}`)
    const j = (await r.json()) as { items?: Array<{ id: string }> }
    return j.items?.[0]?.id ?? null
  }
  if (p.kind === 'username') {
    const r = await fetch(`${API}/channels?part=id&forUsername=${encodeURIComponent(p.value)}&key=${key}`)
    const j = (await r.json()) as { items?: Array<{ id: string }> }
    return j.items?.[0]?.id ?? null
  }
  const r = await fetch(
    `${API}/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(p.value)}&key=${key}`,
  )
  const j = (await r.json()) as { items?: Array<{ id?: { channelId?: string } }> }
  return j.items?.[0]?.id?.channelId ?? null
}

function median(nums: number[]): number {
  if (!nums.length) return 0
  const s = [...nums].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ ok: false, reason: 'method_not_allowed' }, 405)

  const key = process.env.YOUTUBE_API_KEY
  if (!key) {
    console.error('[channel-check] missing YOUTUBE_API_KEY')
    return json({ ok: false, reason: 'missing_key' }, 500)
  }

  let input: string
  try {
    const body = (await req.json()) as { input?: string }
    if (!body.input || typeof body.input !== 'string') return json({ ok: false, reason: 'error' }, 400)
    input = body.input
  } catch {
    return json({ ok: false, reason: 'error' }, 400)
  }

  try {
    const channelId = await resolveChannelId(parseInput(input), key)
    if (!channelId) return json({ ok: false, reason: 'not_found' })

    const chRes = await fetch(
      `${API}/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${key}`,
    )
    const chJson = (await chRes.json()) as {
      items?: Array<{
        snippet: { title: string; customUrl?: string }
        statistics: { subscriberCount?: string; videoCount?: string }
        contentDetails: { relatedPlaylists: { uploads: string } }
      }>
    }
    const ch = chJson.items?.[0]
    if (!ch) return json({ ok: false, reason: 'not_found' })

    const uploads = ch.contentDetails.relatedPlaylists.uploads

    const plRes = await fetch(
      `${API}/playlistItems?part=contentDetails&maxResults=12&playlistId=${uploads}&key=${key}`,
    )
    const plJson = (await plRes.json()) as {
      items?: Array<{ contentDetails: { videoId: string } }>
    }
    const ids = (plJson.items ?? []).map((i) => i.contentDetails.videoId).join(',')

    let vids: Array<{ title: string; publishedAt: string; views: number; thumbnail: string }> = []
    if (ids) {
      const vRes = await fetch(`${API}/videos?part=snippet,statistics&id=${ids}&key=${key}`)
      const vJson = (await vRes.json()) as {
        items?: Array<{
          snippet: {
            title: string
            publishedAt: string
            thumbnails: { medium?: { url: string }; default?: { url: string }; high?: { url: string } }
          }
          statistics: { viewCount?: string }
        }>
      }
      vids = (vJson.items ?? []).map((v) => ({
        title: v.snippet.title,
        publishedAt: v.snippet.publishedAt,
        views: Number(v.statistics.viewCount ?? 0),
        thumbnail:
          v.snippet.thumbnails.medium?.url ??
          v.snippet.thumbnails.high?.url ??
          v.snippet.thumbnails.default?.url ??
          '',
      }))
    }

    const dates = vids.map((v) => new Date(v.publishedAt).getTime()).sort((a, b) => b - a)
    const gapsDays = dates.slice(1).map((d, i) => (dates[i] - d) / 86_400_000)
    const cadenceDays = Math.round(median(gapsDays))
    const medianViews = Math.round(median(vids.map((v) => v.views)))
    const avgTitleLength = Math.round(median(vids.map((v) => v.title.length)))

    return json({
      ok: true,
      channel: {
        title: ch.snippet.title,
        handle: ch.snippet.customUrl ?? null,
        subs: Number(ch.statistics.subscriberCount ?? 0),
        videoCount: Number(ch.statistics.videoCount ?? 0),
      },
      metrics: {
        cadenceDays,
        medianViews,
        avgTitleLength,
        sampleSize: vids.length,
      },
      thumbnails: vids.map((v) => v.thumbnail).filter(Boolean),
    })
  } catch (err) {
    console.error('[channel-check] error', err instanceof Error ? err.message : String(err))
    return json({ ok: false, reason: 'error' })
  }
}
