export const THEMEN = [
  'Reisen',
  'Essen',
  'Fitness',
  'Musik',
  'Bücher',
  'Familie',
  'Arbeit',
  'Alltag',
  'Filme',
  'Fußball',
  'Natur',
  'Kultur',
] as const;

export type Thema = (typeof THEMEN)[number];

export const REQUIRED_THEMEN_COUNT = 5;
export const MIN_THEMEN_COUNT = 2;
export const MAX_THEMEN_COUNT = 5;

export const ABSCHLUSS_SAETZE = ['Bis morgen.', 'Hasta luego.', 'Gut gemacht.', 'Auf später.'];

export const DEV_MODE = false;
