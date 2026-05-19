import { buildPrompt } from './prompts'

export const config = { runtime: 'edge' }

// Vercel injects process.env in Edge Functions; declare the subset we use.
declare const process: { env: Record<string, string | undefined> }

interface RequestBody {
  modus: 'muede' | 'okay' | 'fit' | 'erzaehl'
  profil: {
    niveau: string
    themen: string[]
    why: string
    etappenName?: string
    etappenBeschreibung?: string
    etappenNiveau?: string
  }
  userInput?: string
}

interface GeminiResponse {
  candidates?: Array<{
    content: { parts: Array<{ text: string }> }
  }>
}

// Strip optional markdown code fences that some Gemini versions add
// even when responseMimeType is set to application/json.
function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  return fenced ? fenced[1].trim() : raw.trim()
}

async function callGemini(prompt: string, apiKey: string, modus: string): Promise<unknown> {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `gemini-2.5-flash:generateContent?key=${apiKey}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20_000)

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      }),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) {
    const snippet = await res.text().catch(() => '').then(t => t.slice(0, 300))
    console.error(`[hoy/api] stage=gemini_http modus=${modus} status=${res.status} snippet=${snippet}`)
    throw new Error(`gemini_${res.status}`)
  }

  const data = (await res.json()) as GeminiResponse
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) {
    console.error(`[hoy/api] stage=gemini_empty modus=${modus} candidates=${data.candidates?.length ?? 0}`)
    throw new Error('gemini_empty_response')
  }

  try {
    return JSON.parse(extractJson(text)) as unknown
  } catch {
    console.error(`[hoy/api] stage=json_parse_failed modus=${modus} snippet=${text.slice(0, 300)}`)
    throw new Error('gemini_json_parse')
  }
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('[hoy/api] stage=missing_key has_api_key=false')
    return new Response(JSON.stringify({ error: 'fallback', reason: 'missing_api_key' }), { status: 500 })
  }

  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_body' }), { status: 400 })
  }

  const { modus, profil, userInput } = body
  console.error(`[hoy/api] stage=start modus=${modus} has_api_key=true`)
  const prompt = buildPrompt(modus, { ...profil, userInput })

  let lastErr: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await callGemini(prompt, apiKey, modus)
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (err) {
      lastErr = err
      console.error(`[hoy/api] stage=attempt_failed modus=${modus} attempt=${attempt + 1} error=${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const reason = lastErr instanceof Error ? lastErr.message : 'unknown'
  return new Response(JSON.stringify({ error: 'fallback', reason }), { status: 500 })
}

