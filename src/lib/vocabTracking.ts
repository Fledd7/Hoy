import { isCloseMatch } from './stringUtils'

export type VocabLevel = 'neu' | 'lerntief' | 'vertraut'

export interface VocabEntry {
  es: string
  de: string
  timesSeen: number
  timesCorrect: number
  firstSeen: string
  lastSeen: string
  level: VocabLevel
}

const VOCAB_TRACKING_KEY = 'hoy_vocabTracking'

function computeLevel(entry: VocabEntry): VocabLevel {
  if (entry.timesSeen <= 1) return 'neu'
  if (entry.timesSeen >= 5 && entry.timesCorrect / entry.timesSeen >= 0.7) return 'vertraut'
  return 'lerntief'
}

function loadAll(): VocabEntry[] {
  try {
    const raw = localStorage.getItem(VOCAB_TRACKING_KEY)
    if (!raw) return []
    return JSON.parse(raw) as VocabEntry[]
  } catch {
    return []
  }
}

function saveAll(entries: VocabEntry[]): void {
  try {
    localStorage.setItem(VOCAB_TRACKING_KEY, JSON.stringify(entries))
  } catch {
    // storage unavailable
  }
}

export function recordVocabSeen(items: { es: string; de: string }[]): void {
  if (items.length === 0) return
  const entries = loadAll()
  const now = new Date().toISOString()
  const map = new Map(entries.map(e => [e.es, e]))

  for (const item of items) {
    const existing = map.get(item.es)
    if (existing) {
      existing.timesSeen += 1
      existing.lastSeen = now
      existing.level = computeLevel(existing)
    } else {
      const newEntry: VocabEntry = {
        es: item.es,
        de: item.de,
        timesSeen: 1,
        timesCorrect: 0,
        firstSeen: now,
        lastSeen: now,
        level: 'neu',
      }
      map.set(item.es, newEntry)
    }
  }

  saveAll(Array.from(map.values()))
}

export function recordVocabAnswer(es: string, correct: boolean): void {
  const entries = loadAll()
  const now = new Date().toISOString()
  const entry = entries.find(e => isCloseMatch(e.es, es) || e.es === es)
  if (!entry) return
  entry.timesCorrect += correct ? 1 : 0
  entry.lastSeen = now
  entry.level = computeLevel(entry)
  saveAll(entries)
}

export function getVocabLevel(es: string): VocabLevel {
  const entries = loadAll()
  const entry = entries.find(e => e.es === es)
  return entry?.level ?? 'neu'
}

export function getReviewableCount(): number {
  const entries = loadAll()
  const cutoff = Date.now() - 12 * 60 * 60 * 1000
  return entries.filter(e => e.timesSeen >= 1 && new Date(e.lastSeen).getTime() <= cutoff).length
}

export function getVocabForReview(maxCount: number): VocabEntry[] {
  const entries = loadAll()
  const cutoff = Date.now() - 12 * 60 * 60 * 1000
  const reviewable = entries.filter(e => e.timesSeen >= 1 && new Date(e.lastSeen).getTime() <= cutoff)
  reviewable.sort((a, b) => {
    const ratioA = a.timesSeen > 0 ? a.timesCorrect / a.timesSeen : 0
    const ratioB = b.timesSeen > 0 ? b.timesCorrect / b.timesSeen : 0
    if (ratioA !== ratioB) return ratioA - ratioB
    return new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime()
  })
  return reviewable.slice(0, maxCount)
}

export const VOCAB_TRACKING_STORAGE_KEY = VOCAB_TRACKING_KEY
