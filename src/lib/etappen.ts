export interface Etappe {
  nummer: 1 | 2 | 3 | 4 | 5
  name: string
  untertitel: string
  beschreibung: string
  niveau: string
  themen: string[]
}

export const ETAPPEN: Etappe[] = [
  {
    nummer: 1,
    name: 'Erste Schritte',
    untertitel: 'Wörter, die du sofort brauchst.',
    beschreibung: 'Grundvokabular, einfache Begrüßungen, sich vorstellen',
    niveau: 'A1',
    themen: ['Begrüßung', 'Zahlen', 'Familie', 'Farben', 'Essen-Basics'],
  },
  {
    nummer: 2,
    name: 'Mein Alltag',
    untertitel: 'Dein Leben auf Spanisch.',
    beschreibung: 'Tagesablauf, Beruf, Wohnen, einfache Aktivitäten',
    niveau: 'A1–A2',
    themen: ['Tagesroutine', 'Arbeit', 'Essen', 'Hobbys'],
  },
  {
    nummer: 3,
    name: 'Mit Menschen reden',
    untertitel: 'Wenn das Gespräch losgeht.',
    beschreibung: 'Dialoge führen, Fragen stellen, Smalltalk',
    niveau: 'A2',
    themen: ['Smalltalk', 'Verabredungen', 'Restaurant', 'Einkaufen'],
  },
  {
    nummer: 4,
    name: 'Geschichten verstehen',
    untertitel: 'Mehr als nur Wörter.',
    beschreibung: 'Vergangenheit, längere Texte, Erzählungen verstehen',
    niveau: 'A2–B1',
    themen: ['Vergangenheit', 'Erzählungen', 'Kultur', 'Reisen'],
  },
  {
    nummer: 5,
    name: 'Eigene Meinung haben',
    untertitel: 'Sag, was du denkst.',
    beschreibung: 'Komplexere Strukturen, Meinungen ausdrücken, Konjunktiv-Anfänge',
    niveau: 'B1+',
    themen: ['Meinungen', 'Diskussionen', 'Hypothesen', 'Gefühle'],
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
