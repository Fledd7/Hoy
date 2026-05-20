import { DEV_MODE } from './config'
import { tiredLessons, okayLessons, fitLessons, erzaehlDummy } from './dummy'
import type { EnergyMode, Lesson, VocabItem } from './types'

// ─── Lesson Cache (primary, one per mode per day) ────────────────────────────

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

// ─── Extra Lesson Cache (second+ visit same day) ──────────────────────────────
// Stores the last generated lesson per mode per day so rapid back-and-forth
// doesn't trigger a new API call every time.

const EXTRA_CACHE_KEY = 'hoy_extraLessonCache'

type ExtraLessonCache = Record<string, Partial<Record<CacheableMode, Lesson>>>

function getExtraCached(modus: EnergyMode): Lesson | null {
  if (modus === 'erzaehl') return null
  try {
    const raw = localStorage.getItem(EXTRA_CACHE_KEY)
    if (!raw) return null
    const cache = JSON.parse(raw) as ExtraLessonCache
    return cache[todayKey()]?.[modus as CacheableMode] ?? null
  } catch {
    return null
  }
}

function setExtraCache(modus: EnergyMode, lesson: Lesson): void {
  if (modus === 'erzaehl') return
  try {
    const raw = localStorage.getItem(EXTRA_CACHE_KEY)
    const cache: ExtraLessonCache = raw ? (JSON.parse(raw) as ExtraLessonCache) : {}
    const today = todayKey()
    cache[today] = { ...cache[today], [modus as CacheableMode]: lesson }
    localStorage.setItem(EXTRA_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // storage unavailable
  }
}

// ─── Game Content Cache (luecken + reihenfolge, per day) ─────────────────────

const GAME_CACHE_KEY = 'hoy_gameCache'

interface GameCacheEntry {
  data: unknown
  date: string
}

type GameCache = Record<string, GameCacheEntry>

function getGameCached(key: string): unknown | null {
  try {
    const raw = localStorage.getItem(GAME_CACHE_KEY)
    if (!raw) return null
    const cache = JSON.parse(raw) as GameCache
    const entry = cache[key]
    if (!entry || entry.date !== todayKey()) return null
    return entry.data
  } catch {
    return null
  }
}

function setGameCache(key: string, data: unknown): void {
  try {
    const raw = localStorage.getItem(GAME_CACHE_KEY)
    const cache: GameCache = raw ? (JSON.parse(raw) as GameCache) : {}
    cache[key] = { data, date: todayKey() }
    localStorage.setItem(GAME_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // storage unavailable
  }
}

// ─── Backoff fetch helper ─────────────────────────────────────────────────────

const BACKOFF_DELAYS_MS = [2_000, 4_000, 8_000]

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isRateLimit(reason: string): boolean {
  return reason === 'gemini_429' || reason.includes('429')
}

// Fetches `url` with 15s per-attempt timeout and exponential backoff on 429.
// Calls `onRetry` before each retry so the UI can show a waiting message.
async function fetchWithRetry(
  url: string,
  body: unknown,
  onRetry?: () => void,
): Promise<unknown> {
  for (let attempt = 0; attempt <= BACKOFF_DELAYS_MS.length; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15_000)

    let res: Response
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') throw new Error('timeout')
      throw err
    } finally {
      clearTimeout(timeoutId)
    }

    let raw: unknown
    try {
      raw = await res.json()
    } catch {
      throw new Error(`api_error_${res.status}`)
    }

    if (typeof raw === 'object' && raw !== null && 'error' in raw) {
      const r = raw as { error: string; reason?: string }
      const reason = r.reason ?? r.error

      if (isRateLimit(reason) && attempt < BACKOFF_DELAYS_MS.length) {
        onRetry?.()
        await sleep(BACKOFF_DELAYS_MS[attempt])
        continue
      }

      throw new Error(reason)
    }

    if (!res.ok) throw new Error(`api_error_${res.status}`)

    return raw
  }
  // Unreachable: the loop always either returns or throws above
  throw new Error('max_retries')
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
  onRetry?: () => void,
): Promise<Lesson> {
  if (DEV_MODE) return dummyForMode(modus)

  const cached = getCached(modus)
  if (cached) return cached

  // On second+ visit same day (primary was cleared by caller): serve extra cache
  // to avoid an API call for rapid back-and-forth navigation.
  const extra = getExtraCached(modus)
  if (extra) return extra

  const raw = await fetchWithRetry('/api/lektion', { modus, profil, userInput }, onRetry)
  const lesson = mapToLesson(modus, raw)
  setCache(modus, lesson)
  setExtraCache(modus, lesson)
  return lesson
}

// ─── Game content API ─────────────────────────────────────────────────────────

export interface LueckeItem {
  satz: string
  loesung: string
  hilfe_de: string
}

export interface LueckeResult {
  saetze: LueckeItem[]
}

export async function fetchLuecken(
  vokabeln: { es: string; de: string }[],
  etappe: number,
  onRetry?: () => void,
  forceRefresh?: boolean,
): Promise<LueckeResult> {
  const cacheKey = `luecken_${etappe}_${vokabeln.map(v => v.es).sort().join(',')}`
  if (!forceRefresh) {
    const cached = getGameCached(cacheKey)
    if (cached) return cached as LueckeResult
  }

  const raw = await fetchWithRetry('/api/luecken', { vokabeln, etappe }, onRetry)
  const result = raw as LueckeResult
  setGameCache(cacheKey, result)
  return result
}

export interface ReihenfolgeSatz {
  satz: string
  uebersetzung: string
}

export interface ReihenfolgeResult {
  saetze: ReihenfolgeSatz[]
}

export async function fetchReihenfolge(
  etappe: number,
  anzahl: number,
  onRetry?: () => void,
  forceRefresh?: boolean,
): Promise<ReihenfolgeResult> {
  const cacheKey = `reihenfolge_${etappe}_${anzahl}`
  if (!forceRefresh) {
    const cached = getGameCached(cacheKey)
    if (cached) return cached as ReihenfolgeResult
  }

  const raw = await fetchWithRetry('/api/reihenfolge', { etappe, anzahl }, onRetry)
  const result = raw as ReihenfolgeResult
  setGameCache(cacheKey, result)
  return result
}
