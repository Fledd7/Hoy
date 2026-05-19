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

interface GeminiResponse {
  candidates?: Array<{
    content: { parts: Array<{ text: string }> }
  }>
}

const ETAPPEN_NIVEAU: Record<number, string> = {
  1: 'A1 – max 6 einfache Wörter pro Satz, nur Präsens',
  2: 'A1–A2 – kurze alltagsnahe Sätze',
  3: 'A2 – etwas komplexere Strukturen',
  4: 'A2–B1 – alltagsnahe Sätze mit Vergangenheit',
  5: 'B1+ – natürlichere, längere Sätze',
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
        generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
      }),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) throw new Error(`gemini_${res.status}`)

  const data = (await res.json()) as GeminiResponse
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('gemini_empty')

  return JSON.parse(extractJson(text))
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
  const niveau = ETAPPEN_NIVEAU[etappe] ?? ETAPPEN_NIVEAU[1]
  const schema = '{"saetze":[{"satz":"string mit ___ für die Lücke","loesung":"string","hilfe_de":"string"}]}'

  const prompt =
    `Du erstellst Spanisch-Lückentext-Übungen für deutschsprachige Lernende.\n` +
    `Niveau: ${niveau}.\n` +
    `Antworte AUSSCHLIESSLICH mit validem JSON ohne Markdown-Blöcke.\n\n` +
    `Erstelle für jedes der folgenden spanischen Wörter einen kurzen Satz (max 8 Wörter), ` +
    `in dem das Wort durch ___ ersetzt ist. Gib auch die deutsche Übersetzungshilfe für den Kontext an.\n` +
    `Wörter: ${vokabeln.map(v => `${v.es} (${v.de})`).join(', ')}.\n` +
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
