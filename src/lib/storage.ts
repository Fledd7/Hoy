import type { UserData, LessonHistoryItem, EnergyMode } from './types';
import { etappeForNiveau } from './etappen';

const USER_KEY = 'hoy_user';
const LESSON_CACHE_KEY = 'hoy_lessonCache';
const SEEN_VOCAB_KEY = 'hoy_seenVocab';
const COMPLETED_LESSONS_KEY = 'hoy_completedLessons';
const COMPLETED_MODES_KEY = 'hoy_completedModes';
const LESSON_HISTORY_KEY = 'hoy_lessonHistory';
const MAX_SEEN_VOCAB = 100;
const MAX_HISTORY = 30;

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export function getUser(): UserData | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserData;
  } catch {
    return null;
  }
}

export function saveUser(data: UserData): void {
  localStorage.setItem(USER_KEY, JSON.stringify(data));
}

export function updateUser(partial: Partial<UserData>): void {
  const current = getUser();
  if (!current) return;
  saveUser({ ...current, ...partial });
}

export function resetAll(): void {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LESSON_CACHE_KEY);
  localStorage.removeItem(SEEN_VOCAB_KEY);
  localStorage.removeItem(COMPLETED_LESSONS_KEY);
  localStorage.removeItem(COMPLETED_MODES_KEY);
  localStorage.removeItem(LESSON_HISTORY_KEY);
}

export function isOnboardingDone(): boolean {
  return getUser()?.onboardingDone === true;
}

export function updateLetztesOeffnen(): void {
  updateUser({ letztesOeffnen: new Date().toISOString() });
}

export function getDaysSinceLastOpen(): number {
  const user = getUser();
  if (!user?.letztesOeffnen) return 0;
  const last = new Date(user.letztesOeffnen);
  const now = new Date();
  const diff = now.getTime() - last.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// ─── Seen Vocab ───────────────────────────────────────────────────────────────

export interface SeenVocabItem {
  es: string;
  de: string;
  datum: string;
}

export function getSeenVocab(): SeenVocabItem[] {
  try {
    const raw = localStorage.getItem(SEEN_VOCAB_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SeenVocabItem[];
  } catch {
    return [];
  }
}

export function addSeenVocab(items: { es: string; de: string }[]): void {
  if (items.length === 0) return;
  try {
    const existing = getSeenVocab();
    const knownEs = new Set(existing.map(v => v.es));
    const datum = todayStr();
    const fresh = items
      .filter(v => !knownEs.has(v.es))
      .map(v => ({ es: v.es, de: v.de, datum }));
    const combined = [...existing, ...fresh];
    const trimmed = combined.slice(Math.max(0, combined.length - MAX_SEEN_VOCAB));
    localStorage.setItem(SEEN_VOCAB_KEY, JSON.stringify(trimmed));
  } catch {
    // storage unavailable – skip silently
  }
}

// ─── Completed Lessons ────────────────────────────────────────────────────────

export function getCompletedLessons(): string[] {
  try {
    const raw = localStorage.getItem(COMPLETED_LESSONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function addCompletedLesson(): void {
  try {
    const today = todayStr();
    const existing = getCompletedLessons();
    if (existing.includes(today)) return;
    localStorage.setItem(COMPLETED_LESSONS_KEY, JSON.stringify([...existing, today]));
  } catch {
    // storage unavailable
  }
}

export function hasCompletedToday(): boolean {
  return getCompletedLessons().includes(todayStr());
}

// ─── Completed Modes (per-mode daily tracking) ────────────────────────────────

type CompletedModesData = Record<string, EnergyMode[]>

export function getCompletedModesToday(): Set<EnergyMode> {
  try {
    const raw = localStorage.getItem(COMPLETED_MODES_KEY);
    if (!raw) return new Set();
    const data = JSON.parse(raw) as CompletedModesData;
    return new Set(data[todayStr()] ?? []);
  } catch {
    return new Set();
  }
}

export function addCompletedModeToday(mode: EnergyMode): void {
  try {
    const raw = localStorage.getItem(COMPLETED_MODES_KEY);
    const data: CompletedModesData = raw ? (JSON.parse(raw) as CompletedModesData) : {};
    const today = todayStr();
    const existing = data[today] ?? [];
    if (existing.includes(mode)) return;
    data[today] = [...existing, mode];
    localStorage.setItem(COMPLETED_MODES_KEY, JSON.stringify(data));
  } catch {
    // storage unavailable
  }
}

// ─── Etappen ─────────────────────────────────────────────────────────────────

// Silently migrates old users who lack etappe/lektionenInEtappe fields.
export function ensureEtappenMigration(): void {
  const user = getUser();
  if (!user || user.etappe !== undefined) return;
  saveUser({ ...user, etappe: etappeForNiveau(user.niveau), lektionenInEtappe: 0 });
}

// Increment counter, advance etappe if threshold reached.
// Returns whether the etappe advanced and which etappe is now active.
export function incrementLektionenInEtappe(): { advanced: boolean; newEtappe: 1 | 2 | 3 | 4 | 5 } {
  const user = getUser();
  if (!user) return { advanced: false, newEtappe: 1 };

  const currentEtappe: 1 | 2 | 3 | 4 | 5 = user.etappe ?? etappeForNiveau(user.niveau);
  const lektionen = (user.lektionenInEtappe ?? 0) + 1;

  const THRESHOLD = 11;
  const advanced = lektionen >= THRESHOLD && currentEtappe < 5;
  const newEtappe: 1 | 2 | 3 | 4 | 5 = advanced
    ? ((currentEtappe + 1) as 1 | 2 | 3 | 4 | 5)
    : currentEtappe;
  const newLektionen = advanced ? 0 : lektionen;

  saveUser({ ...user, etappe: newEtappe, lektionenInEtappe: newLektionen });
  return { advanced, newEtappe };
}

// ─── Lesson History ───────────────────────────────────────────────────────────

export function getLessonHistory(): LessonHistoryItem[] {
  try {
    const raw = localStorage.getItem(LESSON_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LessonHistoryItem[];
  } catch {
    return [];
  }
}

export function addLessonHistory(item: LessonHistoryItem): void {
  try {
    const existing = getLessonHistory();
    // One entry per day+mode avoids duplicates when replaying in DEV_MODE
    const alreadyExists = existing.some(h => h.datum === item.datum && h.modus === item.modus);
    if (alreadyExists) return;
    const updated = [...existing, item];
    const trimmed = updated.slice(Math.max(0, updated.length - MAX_HISTORY));
    localStorage.setItem(LESSON_HISTORY_KEY, JSON.stringify(trimmed));
  } catch {
    // storage unavailable
  }
}
