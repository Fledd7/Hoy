import { DEV_MODE } from './config'
import { tiredLessons, okayLessons, fitLessons, erzaehlDummy } from './dummy'
import type { EnergyMode, Lesson, VocabItem } from './types'

// ─── Cache ────────────────────────────────────────────────────────────────────

const LESSON_CACHE_KEY = 'hoy_lessonCache'

type CacheableMode = Exclude<EnergyMode, 'erzaehl'>
type DayCache = Partial<Record<CacheableMode, Lesson>>
type LessonCache = Record<string, DayCache>

function todayKey(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function getCached(modus: EnergyMode): Lesson | null {
  if (modus === 'erzaehl') return null
  try {
    const raw = localStorage.getItem(LESSON_CACHE_KEY)
    if (!raw) return null
    const cache = JSON.parse(raw) as LessonCache
    return cache[todayKey()]?.[modus as CacheableMode] ?? null
  } catch {
    return null
  }
}

function setCache(modus: EnergyMode, lesson: Lesson): void {
  if (modus === 'erzaehl') return
  try {
    const raw = localStorage.getItem(LESSON_CACHE_KEY)
    const cache: LessonCache = raw ? (JSON.parse(raw) as LessonCache) : {}
    const today = todayKey()
    cache[today] = { ...cache[today], [modus as CacheableMode]: lesson }
    localStorage.setItem(LESSON_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // storage unavailable – continue without caching
  }
}

// ─── DEV fallback ─────────────────────────────────────────────────────────────

function dailyIndex(arr: unknown[]): number {
  const d = new Date()
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
  return seed % arr.length
}

function dummyForMode(modus: EnergyMode): Lesson {
  switch (modus) {
    case 'muede': return tiredLessons[dailyIndex(tiredLessons)]
    case 'okay':  return okayLessons[dailyIndex(okayLessons)]
    case 'fit':   return fitLessons[dailyIndex(fitLessons)]
    case 'erzaehl': return erzaehlDummy
  }
}

// ─── API response types ───────────────────────────────────────────────────────

interface WithSchluesselwort {
  schluesselwort?: { es: string; de: string }
}

interface MuedeResponse extends WithSchluesselwort {
  text_es: string
  text_de: string
  vokabeln: VocabItem[]
}

interface OkayFrage {
  frage: string
  antworten: string[]
  richtig: number
}

interface OkayResponse extends WithSchluesselwort {
  text_es: string
  text_de: string
  fragen: OkayFrage[]
}

interface FitDialogLine {
  sprecher: string
  es: string
  de: string
}

interface FitResponse extends WithSchluesselwort {
  dialog: FitDialogLine[]
  vokabeln: VocabItem[]
}

interface ErzaehlResponse extends WithSchluesselwort {
  saetze: { es: string; de: string }[]
  vokabeln: VocabItem[]
}

function extractSchluesselwort(raw: WithSchluesselwort): VocabItem | undefined {
  if (raw.schluesselwort?.es && raw.schluesselwort?.de) return raw.schluesselwort
  return undefined
}

function mapToLesson(modus: EnergyMode, raw: unknown): Lesson {
  if (typeof raw !== 'object' || raw === null) throw new Error('invalid_response_not_object')

  if (modus === 'muede') {
    const d = raw as MuedeResponse
    if (!d.text_es || !d.text_de) throw new Error('invalid_muede_missing_text')
    const vocab = Array.isArray(d.vokabeln) ? d.vokabeln : []
    return { mode: 'muede', text: d.text_es, translation: d.text_de, vocab, schluesselwort: extractSchluesselwort(d) }
  }
  if (modus === 'okay') {
    const d = raw as OkayResponse
    if (!d.text_es || !d.text_de) throw new Error('invalid_okay_missing_text')
    if (!Array.isArray(d.fragen) || d.fragen.length === 0) throw new Error('invalid_okay_missing_fragen')
    return {
      mode: 'okay',
      text: d.text_es,
      translation: d.text_de,
      // Gemini may return `richtig` as a string — coerce to number defensively
      questions: d.fragen.map(f => ({
        question: f.frage,
        options: Array.isArray(f.antworten) ? f.antworten : [],
        correctIndex: Number(f.richtig) || 0,
      })),
      schluesselwort: extractSchluesselwort(d),
    }
  }
  if (modus === 'fit') {
    const d = raw as FitResponse
    if (!Array.isArray(d.dialog) || d.dialog.length === 0) throw new Error('invalid_fit_missing_dialog')
    const vocab = Array.isArray(d.vokabeln) ? d.vokabeln : []
    return {
      mode: 'fit',
      dialog: d.dialog.map(l => ({ speaker: l.sprecher, es: l.es, de: l.de })),
      vocab,
      schluesselwort: extractSchluesselwort(d),
    }
  }
  // erzaehl
  const d = raw as ErzaehlResponse
  if (!Array.isArray(d.saetze) || d.saetze.length === 0) throw new Error('invalid_erzaehl_missing_saetze')
  const vocab = Array.isArray(d.vokabeln) ? d.vokabeln : []
  return { mode: 'erzaehl', saetze: d.saetze, vocab, schluesselwort: extractSchluesselwort(d) }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function hasTodayCache(modus: CacheableMode): boolean {
  return getCached(modus) !== null
}

export function clearModeCache(modus: CacheableMode): void {
  try {
    const raw = localStorage.getItem(LESSON_CACHE_KEY)
    if (!raw) return
    const cache = JSON.parse(raw) as LessonCache
    const today = todayKey()
    if (cache[today]) {
      delete cache[today][modus]
      localStorage.setItem(LESSON_CACHE_KEY, JSON.stringify(cache))
    }
  } catch {
    // storage unavailable
  }
}

export interface LessonProfil {
  niveau: string
  themen: string[]
  why: string
  etappenName?: string
  etappenBeschreibung?: string
  etappenNiveau?: string
}

export async function fetchLektion(
  modus: EnergyMode,
  profil: LessonProfil,
  userInput?: string,
): Promise<Lesson> {
  if (DEV_MODE) return dummyForMode(modus)

  const cached = getCached(modus)
  if (cached) return cached

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 25_000)

  let res: Response
  try {
    res = await fetch('/api/lektion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modus, profil, userInput }),
      signal: controller.signal,
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw new Error('timeout')
    throw err
  } finally {
    clearTimeout(timeoutId)
  }

  // Parse JSON regardless of status code so we can distinguish error types.
  // Non-JSON responses (e.g. network proxy errors) are caught below.
  let raw: unknown
  try {
    raw = await res.json()
  } catch {
    throw new Error(`api_error_${res.status}`)
  }

  if (typeof raw === 'object' && raw !== null && 'error' in raw) {
    const r = raw as { error: string; reason?: string }
    throw new Error(r.reason ?? r.error)
  }

  if (!res.ok) throw new Error(`api_error_${res.status}`)

  const lesson = mapToLesson(modus, raw)
  setCache(modus, lesson)
  return lesson
}
