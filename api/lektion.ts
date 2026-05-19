import { buildPrompt } from './prompts'

export const config = { runtime: 'edge' }

// Vercel injects process.env in Edge Functions; declare the subset we use.
declare const process: { env: Record<string, string | undefined> }

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

interface ErrorDetails {
  hasApiKey: boolean
  apiKeyLength: number
  stage: 'fetch' | 'parse' | 'validate'
  message: string
  geminiStatus?: number
  geminiResponse?: string
}

async function callGemini(
  prompt: string,
  apiKey: string,
): Promise<{ result: unknown; details?: never } | { result?: never; details: ErrorDetails }> {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `gemini-2.5-flash:generateContent?key=${apiKey}`

  const baseDetails: Pick<ErrorDetails, 'hasApiKey' | 'apiKeyLength'> = {
    hasApiKey: true,
    apiKeyLength: apiKey.length,
  }

  // Stage: fetch
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
    })
  } catch (err) {
    return {
      details: {
        ...baseDetails,
        stage: 'fetch',
        message: err instanceof Error ? err.message : String(err),
      },
    }
  }

  if (!res.ok) {
    let snippet = ''
    try {
      const text = await res.text()
      snippet = text.slice(0, 200)
    } catch { /* ignore */ }
    return {
      details: {
        ...baseDetails,
        stage: 'fetch',
        message: `gemini_${res.status}`,
        geminiStatus: res.status,
        geminiResponse: snippet,
      },
    }
  }

  // Stage: parse
  let data: GeminiResponse
  let rawText = ''
  try {
    rawText = await res.text()
    data = JSON.parse(rawText) as GeminiResponse
  } catch (err) {
    return {
      details: {
        ...baseDetails,
        stage: 'parse',
        message: err instanceof Error ? err.message : String(err),
        geminiStatus: res.status,
        geminiResponse: rawText.slice(0, 200),
      },
    }
  }

  // Stage: validate
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    return {
      details: {
        ...baseDetails,
        stage: 'validate',
        message: 'empty_response',
        geminiStatus: res.status,
        geminiResponse: rawText.slice(0, 200),
      },
    }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text) as unknown
  } catch (err) {
    return {
      details: {
        ...baseDetails,
        stage: 'parse',
        message: err instanceof Error ? err.message : String(err),
        geminiStatus: res.status,
        geminiResponse: text.slice(0, 200),
      },
    }
  }

  return { result: parsed }
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: 'fallback',
        details: {
          hasApiKey: false,
          apiKeyLength: 0,
          stage: 'fetch',
          message: 'GEMINI_API_KEY not set',
        } satisfies ErrorDetails,
      }),
      { status: 500 },
    )
  }

  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_body' }), { status: 400 })
  }

  const { modus, profil, userInput } = body
  const prompt = buildPrompt(modus, { ...profil, userInput })

  let lastDetails: ErrorDetails | undefined
  for (let attempt = 0; attempt < 2; attempt++) {
    const outcome = await callGemini(prompt, apiKey)
    if ('result' in outcome && outcome.result !== undefined) {
      return new Response(JSON.stringify(outcome.result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    lastDetails = outcome.details
  }

  return new Response(
    JSON.stringify({ error: 'fallback', details: lastDetails }),
    { status: 500 },
  )
}
