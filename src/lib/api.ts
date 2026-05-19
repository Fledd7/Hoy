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

interface MuedeResponse {
  text_es: string
  text_de: string
  vokabeln: VocabItem[]
}

interface OkayFrage {
  frage: string
  antworten: string[]
  richtig: number
}

interface OkayResponse {
  text_es: string
  text_de: string
  fragen: OkayFrage[]
}

interface FitDialogLine {
  sprecher: string
  es: string
  de: string
}

interface FitResponse {
  dialog: FitDialogLine[]
  vokabeln: VocabItem[]
}

interface ErzaehlResponse {
  saetze: { es: string; de: string }[]
  vokabeln: VocabItem[]
}

function mapToLesson(modus: EnergyMode, raw: unknown): Lesson {
  if (modus === 'muede') {
    const d = raw as MuedeResponse
    if (!d.text_es || !d.text_de || !Array.isArray(d.vokabeln)) throw new Error('invalid muede')
    return { mode: 'muede', text: d.text_es, translation: d.text_de, vocab: d.vokabeln }
  }
  if (modus === 'okay') {
    const d = raw as OkayResponse
    if (!d.text_es || !d.text_de || !Array.isArray(d.fragen)) throw new Error('invalid okay')
    return {
      mode: 'okay',
      text: d.text_es,
      translation: d.text_de,
      questions: d.fragen.map(f => ({ question: f.frage, options: f.antworten, correctIndex: f.richtig })),
    }
  }
  if (modus === 'fit') {
    const d = raw as FitResponse
    if (!Array.isArray(d.dialog) || !Array.isArray(d.vokabeln)) throw new Error('invalid fit')
    return {
      mode: 'fit',
      dialog: d.dialog.map(l => ({ speaker: l.sprecher, es: l.es, de: l.de })),
      vocab: d.vokabeln,
    }
  }
  // erzaehl
  const d = raw as ErzaehlResponse
  if (!Array.isArray(d.saetze) || !Array.isArray(d.vokabeln)) throw new Error('invalid erzaehl')
  return { mode: 'erzaehl', saetze: d.saetze, vocab: d.vokabeln }
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
}

export async function fetchLektion(
  modus: EnergyMode,
  profil: LessonProfil,
  userInput?: string,
): Promise<Lesson> {
  if (DEV_MODE) return dummyForMode(modus)

  const cached = getCached(modus)
  if (cached) return cached

  const res = await fetch('/api/lektion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modus, profil, userInput }),
  })

  // Parse JSON regardless of status code so we can distinguish error types.
  // Non-JSON responses (e.g. network proxy errors) are caught below.
  let raw: unknown
  try {
    raw = await res.json()
  } catch {
    throw new Error(`api_error_${res.status}`)
  }

  if (typeof raw === 'object' && raw !== null && 'error' in raw) {
    throw new Error('fallback')
  }

  if (!res.ok) throw new Error(`api_error_${res.status}`)

  const lesson = mapToLesson(modus, raw)
  setCache(modus, lesson)
  return lesson
}
