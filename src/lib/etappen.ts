export interface EtappenConstraints {
  maxWoerterProSatz: number
  erlaubteZeiten: string[]
  verboteneStrukturen: string[]
  satzKomplexitaet: string
  vokabularEbene: string
  erlaubterSubjuntivo?: string
}

export interface MuedFormatWortschatz {
  typ: 'wortschatz'
  anzahlWoerter: number
  miniSatz: boolean
}

export interface MuedFormatKurztext {
  typ: 'kurztext'
  saetze: number
  vokabeln: number
}

export type MuedFormat = MuedFormatWortschatz | MuedFormatKurztext

export interface OkayFormatMinitext {
  typ: 'minitext'
  saetze: number
  fragen: number
  antwortenPerFrage: number
}

export interface OkayFormatKurztext {
  typ: 'kurztext'
  saetze: number
  fragen: number
  antwortenPerFrage: number
}

export interface OkayFormatText {
  typ: 'text'
  saetze: number
  fragen: number
  antwortenPerFrage: number
}

export type OkayFormat = OkayFormatMinitext | OkayFormatKurztext | OkayFormatText

export interface FitFormatMinidialoge {
  typ: 'minidialoge'
  anzahl: number
  zeilenProDialog: number
  vokabeln: number
}

export interface FitFormatDialog {
  typ: 'dialog'
  zeilen: number
  vokabeln: number
}

export interface FitFormatDialogOderMonolog {
  typ: 'dialog_oder_monolog'
  zeilen: number
  vokabeln: number
}

export interface FitFormatDiskussion {
  typ: 'diskussion'
  zeilen: number
  vokabeln: number
}

export type FitFormat =
  | FitFormatMinidialoge
  | FitFormatDialog
  | FitFormatDialogOderMonolog
  | FitFormatDiskussion

export interface ErzaehlFormat {
  saetze: number
  maxWoerterProSatz: number
  vokabeln: number
}

export interface EtappenFormate {
  muede: MuedFormat
  okay: OkayFormat
  fit: FitFormat
  erzaehl: ErzaehlFormat
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
      erlaubteZeiten: ['presente'],
      verboteneStrukturen: ['reflexive Verben außer me llamo', 'Subjuntivo', 'Konditional', 'Imperfekt', 'Indefinido'],
      satzKomplexitaet: 'nur Hauptsätze, keine Nebensätze',
      vokabularEbene: '200 häufigste Wörter Spanisch',
    },
    formate: {
      muede: { typ: 'wortschatz', anzahlWoerter: 5, miniSatz: true },
      okay: { typ: 'minitext', saetze: 2, fragen: 2, antwortenPerFrage: 2 },
      fit: { typ: 'minidialoge', anzahl: 3, zeilenProDialog: 2, vokabeln: 4 },
      erzaehl: { saetze: 3, maxWoerterProSatz: 4, vokabeln: 4 },
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
      maxWoerterProSatz: 8,
      erlaubteZeiten: ['presente', 'preterito perfecto'],
      verboteneStrukturen: ['Subjuntivo', 'Konditional'],
      satzKomplexitaet: "einfache Haupt- und Nebensätze mit 'que'",
      vokabularEbene: '500 häufigste Wörter Spanisch',
    },
    formate: {
      muede: { typ: 'kurztext', saetze: 2, vokabeln: 3 },
      okay: { typ: 'kurztext', saetze: 4, fragen: 3, antwortenPerFrage: 3 },
      fit: { typ: 'dialog', zeilen: 4, vokabeln: 5 },
      erzaehl: { saetze: 3, maxWoerterProSatz: 7, vokabeln: 5 },
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
      maxWoerterProSatz: 10,
      erlaubteZeiten: ['presente', 'preterito perfecto', 'preterito indefinido'],
      verboteneStrukturen: ['komplexer Subjuntivo'],
      satzKomplexitaet: "Nebensätze mit 'que', 'porque', 'cuando'",
      vokabularEbene: '1000 häufigste Wörter',
      erlaubterSubjuntivo: "nur mit 'ojalá', 'espero que', 'quiero que'",
    },
    formate: {
      muede: { typ: 'kurztext', saetze: 2, vokabeln: 3 },
      okay: { typ: 'text', saetze: 5, fragen: 3, antwortenPerFrage: 3 },
      fit: { typ: 'dialog', zeilen: 6, vokabeln: 5 },
      erzaehl: { saetze: 3, maxWoerterProSatz: 9, vokabeln: 5 },
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
      maxWoerterProSatz: 14,
      erlaubteZeiten: ['presente', 'preterito perfecto', 'preterito indefinido', 'preterito imperfecto'],
      verboteneStrukturen: [],
      satzKomplexitaet: 'komplexere Nebensatzstrukturen, Vergleiche',
      vokabularEbene: '2000 häufigste Wörter',
      erlaubterSubjuntivo: 'präsentischer Subjuntivo nach festen Triggern',
    },
    formate: {
      muede: { typ: 'kurztext', saetze: 3, vokabeln: 3 },
      okay: { typ: 'text', saetze: 6, fragen: 3, antwortenPerFrage: 3 },
      fit: { typ: 'dialog_oder_monolog', zeilen: 7, vokabeln: 5 },
      erzaehl: { saetze: 3, maxWoerterProSatz: 12, vokabeln: 5 },
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
      maxWoerterProSatz: 18,
      erlaubteZeiten: ['alle'],
      verboteneStrukturen: [],
      satzKomplexitaet: 'vollständige Komplexität, idiomatisch',
      vokabularEbene: '4000+ Wörter, idiomatische Wendungen',
      erlaubterSubjuntivo: 'alle Subjuntivo-Formen',
    },
    formate: {
      muede: { typ: 'kurztext', saetze: 3, vokabeln: 3 },
      okay: { typ: 'text', saetze: 7, fragen: 3, antwortenPerFrage: 3 },
      fit: { typ: 'diskussion', zeilen: 7, vokabeln: 5 },
      erzaehl: { saetze: 3, maxWoerterProSatz: 16, vokabeln: 5 },
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
