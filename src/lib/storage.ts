import type { UserData } from './types';

const USER_KEY = 'hoy_user';
const LESSON_CACHE_KEY = 'hoy_lessonCache';

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
