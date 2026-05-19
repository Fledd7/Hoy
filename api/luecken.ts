export const config = { runtime: 'edge' }

declare const process: { env: Record<string, string | undefined> }

interface VocabItem {
  es: string
  de: string
}

interface RequestBody {
  vokabeln: VocabItem[]
  etappe: number
}

interface LueckenSatz {
  satz: string
  loesung: string
  hilfe_de: string
}

export interface LueckenResponse {
  saetze: LueckenSatz[]
}

interface GeminiResponse {
  candidates?: Array<{
    content: { parts: Array<{ text: string }> }
  }>
}

const ETAPPEN_NIVEAU: Record<number, string> = {
  1: 'A1 – max 6 Wörter pro Satz, nur Präsens',
  2: 'A1–A2 – max 8 Wörter pro Satz, einfache Strukturen',
  3: 'A2 – max 10 Wörter pro Satz, alltagsnah',
  4: 'A2–B1 – max 12 Wörter pro Satz',
  5: 'B1+ – max 15 Wörter pro Satz',
}

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  return fenced ? fenced[1].trim() : raw.trim()
}

async function callGemini(prompt: string, apiKey: string): Promise<unknown> {
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
    throw new Error(`gemini_${res.status}`)
  }

  const data = (await res.json()) as GeminiResponse
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('gemini_empty_response')

  return JSON.parse(extractJson(text)) as unknown
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'fallback' }), { status: 500 })
  }

  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_body' }), { status: 400 })
  }

  const { vokabeln, etappe } = body
  if (!Array.isArray(vokabeln) || vokabeln.length === 0) {
    return new Response(JSON.stringify({ error: 'invalid_body' }), { status: 400 })
  }

  const niveau = ETAPPEN_NIVEAU[etappe] ?? ETAPPEN_NIVEAU[1]
  const vokabelListe = vokabeln.map(v => `${v.es} (${v.de})`).join(', ')

  const schema = '{"saetze":[{"satz":"string mit ___ als Lücke","loesung":"string","hilfe_de":"string"}]}'

  const prompt =
    `Du erstellst Spanisch-Übungen für deutschsprachige Lernende. ` +
    `Niveau: ${niveau}. ` +
    `Erstelle für jede der folgenden Vokabeln genau einen einfachen spanischen Satz, ` +
    `in dem die Vokabel als Lücke ___ erscheint. ` +
    `Die Lücke soll genau die Vokabel (oder ihre Flexion) ersetzen. ` +
    `"hilfe_de" ist die deutsche Übersetzung der Lückenvokabel als Hinweis. ` +
    `Vokabeln: ${vokabelListe}. ` +
    `Antworte AUSSCHLIESSLICH mit validem JSON ohne Markdown-Blöcke. ` +
    `JSON-Schema: ${schema}`

  let lastErr: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await callGemini(prompt, apiKey)
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (err) {
      lastErr = err
    }
  }

  void lastErr
  return new Response(JSON.stringify({ error: 'fallback' }), { status: 500 })
}
