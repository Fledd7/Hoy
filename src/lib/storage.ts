import type { UserData } from './types';

const USER_KEY = 'hoy_user';
const LESSON_CACHE_KEY = 'hoy_lessonCache';
const SEEN_VOCAB_KEY = 'hoy_seenVocab';
const MAX_SEEN_VOCAB = 100;

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
    const datum = new Date().toISOString().slice(0, 10);
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
