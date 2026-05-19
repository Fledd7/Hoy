// Etappen-Daten hier dupliziert, weil Vercel Edge Functions nicht aus src/ importieren können.
// Muss mit src/lib/etappen.ts synchron gehalten werden.

interface ApiConstraints {
  maxWoerterProSatz: number
  erlaubteZeiten: string[]
  verboteneStrukturen: string[]
  satzKomplexitaet: string
  vokabularEbene: string
  erlaubterSubjuntivo?: string
}

type ApiMuedFormat =
  | { typ: 'wortschatz'; anzahlWoerter: number; miniSatz: boolean }
  | { typ: 'kurztext'; saetze: number; vokabeln: number }

type ApiOkayFormat = {
  saetze: number
  fragen: number
  antwortenPerFrage: number
}

type ApiFitFormat =
  | { typ: 'minidialoge'; anzahl: number; zeilenProDialog: number; vokabeln: number }
  | { typ: 'dialog' | 'dialog_oder_monolog' | 'diskussion'; zeilen: number; vokabeln: number }

interface ApiEtappeData {
  name: string
  constraints: ApiConstraints
  muede: ApiMuedFormat
  okay: ApiOkayFormat
  fit: ApiFitFormat
  erzaehl: { saetze: number; maxWoerterProSatz: number; vokabeln: number }
}

const ETAPPEN_DATA: Record<1 | 2 | 3 | 4 | 5, ApiEtappeData> = {
  1: {
    name: 'Erste Schritte (A1)',
    constraints: {
      maxWoerterProSatz: 6,
      erlaubteZeiten: ['presente'],
      verboteneStrukturen: ['reflexive Verben außer me llamo', 'Subjuntivo', 'Konditional', 'Imperfekt', 'Indefinido'],
      satzKomplexitaet: 'nur Hauptsätze, keine Nebensätze',
      vokabularEbene: '200 häufigste Wörter Spanisch',
    },
    muede: { typ: 'wortschatz', anzahlWoerter: 5, miniSatz: true },
    okay: { saetze: 2, fragen: 2, antwortenPerFrage: 2 },
    fit: { typ: 'minidialoge', anzahl: 3, zeilenProDialog: 2, vokabeln: 4 },
    erzaehl: { saetze: 3, maxWoerterProSatz: 4, vokabeln: 4 },
  },
  2: {
    name: 'Mein Alltag (A1–A2)',
    constraints: {
      maxWoerterProSatz: 8,
      erlaubteZeiten: ['presente', 'preterito perfecto'],
      verboteneStrukturen: ['Subjuntivo', 'Konditional'],
      satzKomplexitaet: "einfache Haupt- und Nebensätze mit 'que'",
      vokabularEbene: '500 häufigste Wörter Spanisch',
    },
    muede: { typ: 'kurztext', saetze: 2, vokabeln: 3 },
    okay: { saetze: 4, fragen: 3, antwortenPerFrage: 3 },
    fit: { typ: 'dialog', zeilen: 4, vokabeln: 5 },
    erzaehl: { saetze: 3, maxWoerterProSatz: 7, vokabeln: 5 },
  },
  3: {
    name: 'Mit Menschen reden (A2)',
    constraints: {
      maxWoerterProSatz: 10,
      erlaubteZeiten: ['presente', 'preterito perfecto', 'preterito indefinido'],
      verboteneStrukturen: ['komplexer Subjuntivo'],
      satzKomplexitaet: "Nebensätze mit 'que', 'porque', 'cuando'",
      vokabularEbene: '1000 häufigste Wörter',
      erlaubterSubjuntivo: "nur mit 'ojalá', 'espero que', 'quiero que'",
    },
    muede: { typ: 'kurztext', saetze: 2, vokabeln: 3 },
    okay: { saetze: 5, fragen: 3, antwortenPerFrage: 3 },
    fit: { typ: 'dialog', zeilen: 6, vokabeln: 5 },
    erzaehl: { saetze: 3, maxWoerterProSatz: 9, vokabeln: 5 },
  },
  4: {
    name: 'Geschichten verstehen (A2–B1)',
    constraints: {
      maxWoerterProSatz: 14,
      erlaubteZeiten: ['presente', 'preterito perfecto', 'preterito indefinido', 'preterito imperfecto'],
      verboteneStrukturen: [],
      satzKomplexitaet: 'komplexere Nebensatzstrukturen, Vergleiche',
      vokabularEbene: '2000 häufigste Wörter',
      erlaubterSubjuntivo: 'präsentischer Subjuntivo nach festen Triggern',
    },
    muede: { typ: 'kurztext', saetze: 3, vokabeln: 3 },
    okay: { saetze: 6, fragen: 3, antwortenPerFrage: 3 },
    fit: { typ: 'dialog_oder_monolog', zeilen: 7, vokabeln: 5 },
    erzaehl: { saetze: 3, maxWoerterProSatz: 12, vokabeln: 5 },
  },
  5: {
    name: 'Eigene Meinung haben (B1+)',
    constraints: {
      maxWoerterProSatz: 18,
      erlaubteZeiten: ['alle'],
      verboteneStrukturen: [],
      satzKomplexitaet: 'vollständige Komplexität, idiomatisch',
      vokabularEbene: '4000+ Wörter, idiomatische Wendungen',
      erlaubterSubjuntivo: 'alle Subjuntivo-Formen',
    },
    muede: { typ: 'kurztext', saetze: 3, vokabeln: 3 },
    okay: { saetze: 7, fragen: 3, antwortenPerFrage: 3 },
    fit: { typ: 'diskussion', zeilen: 7, vokabeln: 5 },
    erzaehl: { saetze: 3, maxWoerterProSatz: 16, vokabeln: 5 },
  },
}

export interface PromptContext {
  niveau: string
  themen: string[]
  why: string
  userInput?: string
  etappeNummer?: 1 | 2 | 3 | 4 | 5
  etappenName?: string
  etappenBeschreibung?: string
  etappenNiveau?: string
}

function buildConstraintBlock(c: ApiConstraints): string {
  const zeiten = c.erlaubteZeiten.join(', ')
  const verboten = c.verboteneStrukturen.length > 0
    ? `- VERBOTEN: ${c.verboteneStrukturen.join(', ')}\n`
    : ''
  const subjuntivo = c.erlaubterSubjuntivo
    ? `- Erlaubter Subjuntivo: ${c.erlaubterSubjuntivo}\n`
    : ''
  return (
    `GRAMMATIK-CONSTRAINTS (strikt, keine Ausnahmen):\n` +
    `- Maximale Wörter pro Satz: ${c.maxWoerterProSatz}\n` +
    `- Erlaubte Zeiten: ${zeiten}\n` +
    verboten +
    subjuntivo +
    `- Satzkomplexität: ${c.satzKomplexitaet}\n` +
    `- Wortschatzebene: ${c.vokabularEbene}`
  )
}

function buildMuedeTask(fmt: ApiMuedFormat, themen: string): string {
  const schema = '{"text_es":"string","text_de":"string","vokabeln":[{"es":"string","de":"string"}]}'
  if (fmt.typ === 'wortschatz') {
    return (
      `Erstelle einen einzigen einfachen spanischen Satz (max. ${fmt.anzahlWoerter} Wörter) ` +
      `als Mini-Einleitung zu einem Thema aus: ${themen}.\n` +
      `Erstelle danach genau ${fmt.anzahlWoerter} einzelne Vokabeln (Nomen mit Artikel, Verben im Infinitiv ` +
      `oder Adjektive) passend zu diesem Thema.\n` +
      `Schreibe text_es = der eine Satz, text_de = deutsche Übersetzung des Satzes.\n` +
      `JSON: ${schema}\n` +
      `Genau ${fmt.anzahlWoerter} Objekte in vokabeln.`
    )
  }
  return (
    `Erstelle einen spanischen Kurztext mit genau ${fmt.saetze} Sätzen ` +
    `über ein Thema aus: ${themen}.\n` +
    `Markiere ${fmt.vokabeln} wichtige Vokabeln aus dem Text.\n` +
    `JSON: ${schema}\n` +
    `Genau ${fmt.vokabeln} Objekte in vokabeln.`
  )
}

function buildOkayTask(fmt: ApiOkayFormat, themen: string): string {
  const schema = '{"text_es":"string","text_de":"string","fragen":[{"frage":"string","antworten":["string"],"richtig":0}]}'
  return (
    `Erstelle einen spanischen Text mit genau ${fmt.saetze} Sätzen ` +
    `über ein Thema aus: ${themen}.\n` +
    `Erstelle genau ${fmt.fragen} Verständnisfragen auf Deutsch zum spanischen Text.\n` +
    `Jede Frage hat genau ${fmt.antwortenPerFrage} Antwortoptionen und einen korrekten Index (0-basiert).\n` +
    `JSON: ${schema}\n` +
    `Genau ${fmt.fragen} Objekte in fragen, je ${fmt.antwortenPerFrage} Einträge in antworten.`
  )
}

function buildFitTask(fmt: ApiFitFormat, themen: string): string {
  const schema = '{"dialog":[{"sprecher":"string","es":"string","de":"string"}],"vokabeln":[{"es":"string","de":"string"}]}'
  if (fmt.typ === 'minidialoge') {
    const total = fmt.anzahl * fmt.zeilenProDialog
    return (
      `Erstelle genau ${fmt.anzahl} kurze Mini-Dialoge (je ${fmt.zeilenProDialog} Zeilen) ` +
      `über ein Thema aus: ${themen}.\n` +
      `Verwende zwei konsistente spanische Sprechernamen (z.B. Ana und Pablo) durch alle Dialoge.\n` +
      `Das dialog-Array enthält genau ${total} Einträge: ` +
      `${fmt.anzahl}x abwechselnd Frage (${fmt.zeilenProDialog === 2 ? 'Zeile 1' : 'ungerade'}) ` +
      `und Antwort (${fmt.zeilenProDialog === 2 ? 'Zeile 2' : 'gerade'}).\n` +
      `Ergänze genau ${fmt.vokabeln} Vokabeln.\n` +
      `JSON: ${schema}\n` +
      `Genau ${total} Objekte in dialog, genau ${fmt.vokabeln} in vokabeln.`
    )
  }
  const label = fmt.typ === 'diskussion' ? 'Diskussion' : 'Dialog'
  return (
    `Erstelle einen alltagsnahen ${label} mit genau ${fmt.zeilen} Zeilen ` +
    `zwischen zwei Personen über ein Thema aus: ${themen}.\n` +
    `Verwende natürliche spanische Sprechernamen.\n` +
    `Ergänze genau ${fmt.vokabeln} Vokabeln.\n` +
    `JSON: ${schema}\n` +
    `Genau ${fmt.zeilen} Objekte in dialog, genau ${fmt.vokabeln} in vokabeln.`
  )
}

function buildErzaehlTask(
  fmt: { saetze: number; maxWoerterProSatz: number; vokabeln: number },
  userInput: string,
): string {
  const schema = '{"saetze":[{"es":"string","de":"string"}],"vokabeln":[{"es":"string","de":"string"}]}'
  return (
    `Der Nutzer beschreibt seinen Tag auf Deutsch: "${userInput}".\n` +
    `Formuliere daraus genau ${fmt.saetze} einfache spanische Sätze ` +
    `(je max. ${fmt.maxWoerterProSatz} Wörter) mit deutschen Übersetzungen.\n` +
    `Ergänze genau ${fmt.vokabeln} nützliche Vokabeln aus den Sätzen.\n` +
    `JSON: ${schema}\n` +
    `Genau ${fmt.saetze} Objekte in saetze, genau ${fmt.vokabeln} in vokabeln.`
  )
}

export function buildPrompt(modus: string, ctx: PromptContext): string {
  const themen = ctx.themen.join(', ')

  // ─── Etappen-gestützter Pfad ──────────────────────────────────────────────
  if (ctx.etappeNummer) {
    const etappe = ETAPPEN_DATA[ctx.etappeNummer]
    const systemLines = [
      'Du erstellst Spanisch-Lernmaterial für deutschsprachige Lernende.',
      'Sprich natürliches, modernes Castellano.',
      `Aktuelle Lernetappe: ${etappe.name}.`,
      `Themen des Lernenden: ${themen}.`,
      ctx.why ? `Lernziel: ${ctx.why}.` : '',
      '',
      buildConstraintBlock(etappe.constraints),
      '',
      'Antworte AUSSCHLIESSLICH mit validem JSON, kein Markdown, keine Erklärungen, keine Code-Fences.',
      'Überschreite NIEMALS die Constraints, auch wenn dir das einfacher erscheint.',
    ].filter(l => l !== undefined)

    const system = systemLines.join('\n')

    let task: string
    switch (modus) {
      case 'muede':
        task = buildMuedeTask(etappe.muede, themen)
        break
      case 'okay':
        task = buildOkayTask(etappe.okay, themen)
        break
      case 'fit':
        task = buildFitTask(etappe.fit, themen)
        break
      case 'erzaehl':
        task = buildErzaehlTask(etappe.erzaehl, ctx.userInput ?? '')
        break
      default:
        task = ''
    }

    return `${system}\n\n${task}`
  }

  // ─── Fallback ohne Etappen-Kontext ────────────────────────────────────────
  const NIVEAU_MAP: Record<string, string> = {
    anfaenger: 'A1 – einfachste Strukturen, Präsens, Grundwortschatz',
    wiedereinsteiger_schule: 'A2 – etwas Vergangenheit, alltagsnah',
    wiedereinsteiger_a2: 'A2-B1 – mehr Flexibilität, alltagsnahe Themen',
    wiedereinsteiger_b1: 'B1-B2 – idiomatischer, längere Sätze',
  }

  const SCHEMAS: Record<string, string> = {
    muede: '{"text_es":"string","text_de":"string","vokabeln":[{"es":"string","de":"string"}]}',
    okay: '{"text_es":"string","text_de":"string","fragen":[{"frage":"string","antworten":["string","string","string"],"richtig":0}]}',
    fit: '{"dialog":[{"sprecher":"string","es":"string","de":"string"}],"vokabeln":[{"es":"string","de":"string"}]}',
    erzaehl: '{"saetze":[{"es":"string","de":"string"}],"vokabeln":[{"es":"string","de":"string"}]}',
  }

  const etappenHinweis = ctx.etappenName
    ? `Aktuelle Lernetappe: ${ctx.etappenName} – ${ctx.etappenBeschreibung ?? ''} (${ctx.etappenNiveau ?? ''}).\n`
    : ''

  const system =
    `Du erstellst Spanisch-Lektionen für deutschsprachige Lernende. ` +
    `Sprich natürliches, modernes Castellano. ` +
    etappenHinweis +
    `Niveau: ${NIVEAU_MAP[ctx.niveau] ?? ctx.niveau}. ` +
    `Themen: ${themen}. ` +
    `Lernkontext: ${ctx.why || 'nicht angegeben'}. ` +
    `Antworte AUSSCHLIESSLICH mit validem JSON, kein Markdown, keine Erklärungen, keine Code-Fences.`

  const schema = SCHEMAS[modus] ?? ''
  const fallbacks: Record<string, string> = {
    muede: `Erstelle eine kurze Mini-Lektion (2 Sätze, max 30 Wörter) über ein Thema aus ${themen}. Markiere 3 Vokabeln. JSON: ${schema}`,
    okay: `Erstelle einen Text (4-5 Sätze) über ${themen}. 3 Verständnisfragen mit je 3 Antworten. JSON: ${schema}`,
    fit: `Erstelle einen Dialog (6 Zeilen) über ${themen}. 5 Vokabeln. JSON: ${schema}`,
    erzaehl: `Nutzer: "${ctx.userInput ?? ''}". 3 spanische Sätze + 5 Vokabeln. JSON: ${schema}`,
  }

  return `${system}\n\n${fallbacks[modus] ?? ''}`
}
