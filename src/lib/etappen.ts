export interface EtappenConstraints {
  maxWoerterProSatz: number
  erlaubteZeiten: string[]
  verboteneStrukturen: string[]
  satzKomplexitaet: 'einfach' | 'mittel' | 'komplex'
  vokabularEbene: 'A1' | 'A1-A2' | 'A2' | 'A2-B1' | 'B1+'
}

export interface MuedeModeFormat {
  format: 'vocabCards' | 'text'
  einheitenAnzahl: number
  vokabelnAnzahl: number
}

export interface OkayModeFormat {
  saetzeAnzahl: number
  fragenAnzahl: number
}

export interface FitModeFormat {
  format: 'miniDialogs' | 'dialog'
  dialogZeilenTotal: number
  miniDialogsAnzahl: number
  vokabelnAnzahl: number
}

export interface ErzaehlModeFormat {
  saetzeAnzahl: number
  vokabelnAnzahl: number
}

export interface EtappenFormate {
  muede: MuedeModeFormat
  okay: OkayModeFormat
  fit: FitModeFormat
  erzaehl: ErzaehlModeFormat
}

export interface Etappe {
  nummer: 1 | 2 | 3 | 4 | 5
  name: string
  untertitel: string
  beschreibung: string
  niveau: string
  themen: string[]
  constraints: EtappenConstraints
  formate: EtappenFormate
}

export const ETAPPEN: Etappe[] = [
  {
    nummer: 1,
    name: 'Erste Schritte',
    untertitel: 'Wörter, die du sofort brauchst.',
    beschreibung: 'Grundvokabular, einfache Begrüßungen, sich vorstellen',
    niveau: 'A1',
    themen: ['Begrüßung', 'Zahlen', 'Familie', 'Farben', 'Essen-Basics'],
    constraints: {
      maxWoerterProSatz: 6,
      erlaubteZeiten: ['Präsens'],
      verboteneStrukturen: ['Konjunktiv', 'Relativsätze', 'Nebensätze', 'Passiv'],
      satzKomplexitaet: 'einfach',
      vokabularEbene: 'A1',
    },
    formate: {
      muede: { format: 'vocabCards', einheitenAnzahl: 5, vokabelnAnzahl: 5 },
      okay: { saetzeAnzahl: 3, fragenAnzahl: 3 },
      fit: { format: 'miniDialogs', dialogZeilenTotal: 6, miniDialogsAnzahl: 3, vokabelnAnzahl: 4 },
      erzaehl: { saetzeAnzahl: 3, vokabelnAnzahl: 4 },
    },
  },
  {
    nummer: 2,
    name: 'Mein Alltag',
    untertitel: 'Dein Leben auf Spanisch.',
    beschreibung: 'Tagesablauf, Beruf, Wohnen, einfache Aktivitäten',
    niveau: 'A1–A2',
    themen: ['Tagesroutine', 'Arbeit', 'Essen', 'Hobbys'],
    constraints: {
      maxWoerterProSatz: 9,
      erlaubteZeiten: ['Präsens', 'ser/estar', 'hay'],
      verboteneStrukturen: ['Konjunktiv', 'Relativsätze', 'Passiv'],
      satzKomplexitaet: 'einfach',
      vokabularEbene: 'A1-A2',
    },
    formate: {
      muede: { format: 'text', einheitenAnzahl: 25, vokabelnAnzahl: 3 },
      okay: { saetzeAnzahl: 4, fragenAnzahl: 3 },
      fit: { format: 'dialog', dialogZeilenTotal: 6, miniDialogsAnzahl: 1, vokabelnAnzahl: 5 },
      erzaehl: { saetzeAnzahl: 3, vokabelnAnzahl: 4 },
    },
  },
  {
    nummer: 3,
    name: 'Mit Menschen reden',
    untertitel: 'Wenn das Gespräch losgeht.',
    beschreibung: 'Dialoge führen, Fragen stellen, Smalltalk',
    niveau: 'A2',
    themen: ['Smalltalk', 'Verabredungen', 'Restaurant', 'Einkaufen'],
    constraints: {
      maxWoerterProSatz: 12,
      erlaubteZeiten: ['Präsens', 'Perfekt', 'ser/estar'],
      verboteneStrukturen: ['Konjunktiv', 'Passiv'],
      satzKomplexitaet: 'mittel',
      vokabularEbene: 'A2',
    },
    formate: {
      muede: { format: 'text', einheitenAnzahl: 35, vokabelnAnzahl: 3 },
      okay: { saetzeAnzahl: 5, fragenAnzahl: 3 },
      fit: { format: 'dialog', dialogZeilenTotal: 8, miniDialogsAnzahl: 1, vokabelnAnzahl: 5 },
      erzaehl: { saetzeAnzahl: 3, vokabelnAnzahl: 5 },
    },
  },
  {
    nummer: 4,
    name: 'Geschichten verstehen',
    untertitel: 'Mehr als nur Wörter.',
    beschreibung: 'Vergangenheit, längere Texte, Erzählungen verstehen',
    niveau: 'A2–B1',
    themen: ['Vergangenheit', 'Erzählungen', 'Kultur', 'Reisen'],
    constraints: {
      maxWoerterProSatz: 15,
      erlaubteZeiten: ['Präsens', 'Perfekt', 'Indefinido', 'ser/estar'],
      verboteneStrukturen: ['Konjunktiv'],
      satzKomplexitaet: 'mittel',
      vokabularEbene: 'A2-B1',
    },
    formate: {
      muede: { format: 'text', einheitenAnzahl: 45, vokabelnAnzahl: 3 },
      okay: { saetzeAnzahl: 5, fragenAnzahl: 3 },
      fit: { format: 'dialog', dialogZeilenTotal: 10, miniDialogsAnzahl: 1, vokabelnAnzahl: 5 },
      erzaehl: { saetzeAnzahl: 4, vokabelnAnzahl: 5 },
    },
  },
  {
    nummer: 5,
    name: 'Eigene Meinung haben',
    untertitel: 'Sag, was du denkst.',
    beschreibung: 'Komplexere Strukturen, Meinungen ausdrücken, Konjunktiv-Anfänge',
    niveau: 'B1+',
    themen: ['Meinungen', 'Diskussionen', 'Hypothesen', 'Gefühle'],
    constraints: {
      maxWoerterProSatz: 20,
      erlaubteZeiten: ['Präsens', 'Perfekt', 'Indefinido', 'Imperfecto', 'Konjunktiv Präsens'],
      verboteneStrukturen: [],
      satzKomplexitaet: 'komplex',
      vokabularEbene: 'B1+',
    },
    formate: {
      muede: { format: 'text', einheitenAnzahl: 50, vokabelnAnzahl: 3 },
      okay: { saetzeAnzahl: 6, fragenAnzahl: 3 },
      fit: { format: 'dialog', dialogZeilenTotal: 12, miniDialogsAnzahl: 1, vokabelnAnzahl: 5 },
      erzaehl: { saetzeAnzahl: 5, vokabelnAnzahl: 5 },
    },
  },
]

export function etappeForNiveau(niveau: string): 1 | 2 | 3 | 4 | 5 {
  switch (niveau) {
    case 'anfaenger': return 1
    case 'wiedereinsteiger_schule': return 2
    case 'wiedereinsteiger_a2': return 3
    case 'wiedereinsteiger_b1': return 4
    default: return 1
  }
}
