import { buildPrompt } from './prompts'

export const config = { runtime: 'edge' }

interface RequestBody {
  modus: 'muede' | 'okay' | 'fit' | 'erzaehl'
  profil: { niveau: string; themen: string[]; why: string }
  userInput?: string
}

interface GeminiResponse {
  candidates?: Array<{
    content: { parts: Array<{ text: string }> }
  }>
}

async function callGemini(prompt: string, apiKey: string): Promise<unknown> {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `gemini-2.5-flash:generateContent?key=${apiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    }),
  })

  if (!res.ok) throw new Error(`gemini_${res.status}`)

  const data = (await res.json()) as GeminiResponse
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('empty_response')

  return JSON.parse(text) as unknown
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

  const { modus, profil, userInput } = body
  const prompt = buildPrompt(modus, { ...profil, userInput })

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
