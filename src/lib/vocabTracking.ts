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

type VocabTracking = Record<string, VocabEntry>

const VOCAB_TRACKING_KEY = 'hoy_vocabTracking'

function computeLevel(entry: VocabEntry): VocabLevel {
  if (entry.timesSeen <= 1) return 'neu'
  if (entry.timesSeen >= 5 && entry.timesCorrect / entry.timesSeen >= 0.7) return 'vertraut'
  return 'lerntief'
}

function load(): VocabTracking {
  try {
    const raw = localStorage.getItem(VOCAB_TRACKING_KEY)
    return raw ? (JSON.parse(raw) as VocabTracking) : {}
  } catch {
    return {}
  }
}

function save(tracking: VocabTracking): void {
  try {
    localStorage.setItem(VOCAB_TRACKING_KEY, JSON.stringify(tracking))
  } catch {
    // storage unavailable
  }
}

export function recordVocabSeen(es: string, de: string): void {
  const tracking = load()
  const now = new Date().toISOString()
  const existing = tracking[es]
  if (existing) {
    existing.timesSeen += 1
    existing.lastSeen = now
    existing.level = computeLevel(existing)
  } else {
    tracking[es] = {
      es,
      de,
      timesSeen: 1,
      timesCorrect: 0,
      firstSeen: now,
      lastSeen: now,
      level: 'neu',
    }
  }
  save(tracking)
}

export function recordVocabAnswer(es: string, wasCorrect: boolean): void {
  const tracking = load()
  const entry = tracking[es]
  if (!entry) return
  if (wasCorrect) entry.timesCorrect += 1
  entry.level = computeLevel(entry)
  save(tracking)
}

export function getVocabLevel(es: string): VocabLevel {
  return load()[es]?.level ?? 'neu'
}

export function getAllTrackedVocab(): VocabTracking {
  return load()
}

export function getVocabForReview(maxCount: number): VocabEntry[] {
  const tracking = load()
  const threshold = Date.now() - 24 * 60 * 60 * 1000
  return Object.values(tracking)
    .filter(e => new Date(e.lastSeen).getTime() < threshold && e.timesSeen < 8)
    .slice(0, maxCount)
}
