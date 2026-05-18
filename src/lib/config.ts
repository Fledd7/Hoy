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

export const ABSCHLUSS_SAETZE = ['Bis morgen.', 'Hasta luego.', 'Gut gemacht.', 'Auf später.'];
