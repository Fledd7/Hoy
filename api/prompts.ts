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

// Etappen constraints + formate duplicated here because Vercel Edge Functions
// cannot import from src/. Keep in sync with src/lib/etappen.ts.
interface ApiConstraints {
  maxWoerterProSatz: number
  erlaubteZeiten: string[]
  verboteneStrukturen: string[]
  vokabularEbene: string
}

interface ApiMuedeFormat { format: 'vocabCards' | 'text'; einheitenAnzahl: number; vokabelnAnzahl: number }
interface ApiFitFormat { format: 'miniDialogs' | 'dialog'; dialogZeilenTotal: number; miniDialogsAnzahl: number; vokabelnAnzahl: number }
interface ApiOkayFormat { saetzeAnzahl: number; fragenAnzahl: number }
interface ApiErzaehlFormat { saetzeAnzahl: number; vokabelnAnzahl: number }

interface ApiEtappeData {
  constraints: ApiConstraints
  muede: ApiMuedeFormat
  okay: ApiOkayFormat
  fit: ApiFitFormat
  erzaehl: ApiErzaehlFormat
}

const ETAPPEN_API: Record<1 | 2 | 3 | 4 | 5, ApiEtappeData> = {
  1: {
    constraints: {
      maxWoerterProSatz: 6,
      erlaubteZeiten: ['Präsens'],
      verboteneStrukturen: ['Konjunktiv', 'Relativsätze', 'Nebensätze', 'Passiv'],
      vokabularEbene: 'A1 – häufigste 500 spanische Wörter',
    },
    muede: { format: 'vocabCards', einheitenAnzahl: 5, vokabelnAnzahl: 5 },
    okay: { saetzeAnzahl: 3, fragenAnzahl: 3 },
    fit: { format: 'miniDialogs', dialogZeilenTotal: 6, miniDialogsAnzahl: 3, vokabelnAnzahl: 4 },
    erzaehl: { saetzeAnzahl: 3, vokabelnAnzahl: 4 },
  },
  2: {
    constraints: {
      maxWoerterProSatz: 9,
      erlaubteZeiten: ['Präsens', 'ser/estar', 'hay'],
      verboteneStrukturen: ['Konjunktiv', 'Relativsätze', 'Passiv'],
      vokabularEbene: 'A1–A2 – Alltagswortschatz',
    },
    muede: { format: 'text', einheitenAnzahl: 25, vokabelnAnzahl: 3 },
    okay: { saetzeAnzahl: 4, fragenAnzahl: 3 },
    fit: { format: 'dialog', dialogZeilenTotal: 6, miniDialogsAnzahl: 1, vokabelnAnzahl: 5 },
    erzaehl: { saetzeAnzahl: 3, vokabelnAnzahl: 4 },
  },
  3: {
    constraints: {
      maxWoerterProSatz: 12,
      erlaubteZeiten: ['Präsens', 'Perfekt', 'ser/estar'],
      verboteneStrukturen: ['Konjunktiv', 'Passiv'],
      vokabularEbene: 'A2 – erweiterter Alltagswortschatz',
    },
    muede: { format: 'text', einheitenAnzahl: 35, vokabelnAnzahl: 3 },
    okay: { saetzeAnzahl: 5, fragenAnzahl: 3 },
    fit: { format: 'dialog', dialogZeilenTotal: 8, miniDialogsAnzahl: 1, vokabelnAnzahl: 5 },
    erzaehl: { saetzeAnzahl: 3, vokabelnAnzahl: 5 },
  },
  4: {
    constraints: {
      maxWoerterProSatz: 15,
      erlaubteZeiten: ['Präsens', 'Perfekt', 'Indefinido', 'ser/estar'],
      verboteneStrukturen: ['Konjunktiv'],
      vokabularEbene: 'A2–B1 – narrativer Wortschatz',
    },
    muede: { format: 'text', einheitenAnzahl: 45, vokabelnAnzahl: 3 },
    okay: { saetzeAnzahl: 5, fragenAnzahl: 3 },
    fit: { format: 'dialog', dialogZeilenTotal: 10, miniDialogsAnzahl: 1, vokabelnAnzahl: 5 },
    erzaehl: { saetzeAnzahl: 4, vokabelnAnzahl: 5 },
  },
  5: {
    constraints: {
      maxWoerterProSatz: 20,
      erlaubteZeiten: ['Präsens', 'Perfekt', 'Indefinido', 'Imperfecto', 'Konjunktiv Präsens'],
      verboteneStrukturen: [],
      vokabularEbene: 'B1+ – idiomatischer Wortschatz',
    },
    muede: { format: 'text', einheitenAnzahl: 50, vokabelnAnzahl: 3 },
    okay: { saetzeAnzahl: 6, fragenAnzahl: 3 },
    fit: { format: 'dialog', dialogZeilenTotal: 12, miniDialogsAnzahl: 1, vokabelnAnzahl: 5 },
    erzaehl: { saetzeAnzahl: 5, vokabelnAnzahl: 5 },
  },
}

function constraintBlock(c: ApiConstraints): string {
  const verboten = c.verboteneStrukturen.length > 0
    ? `VERBOTEN: ${c.verboteneStrukturen.join(', ')}.\n`
    : ''
  return (
    `GRAMMATIK-REGELN (strikt einhalten):\n` +
    `- Wortschatz: ${c.vokabularEbene}\n` +
    `- Max. ${c.maxWoerterProSatz} Wörter pro Satz\n` +
    `- Erlaubte Zeiten: ${c.erlaubteZeiten.join(', ')}\n` +
    verboten
  )
}

function buildMuedePrompt(themen: string, e: ApiEtappeData): string {
  if (e.muede.format === 'vocabCards') {
    return (
      `Erstelle genau ${e.muede.vokabelnAnzahl} spanische Vokabeln zum Thema aus: ${themen}.\n` +
      `Jede Vokabel: ein einzelnes Wort oder eine kurze Phrase (max. 3 Wörter), Nomen mit Artikel.\n` +
      `Für text_es: einen einzigen einfachen Satz (max. ${e.constraints.maxWoerterProSatz} Wörter) ` +
      `der das Thema benennt. Für text_de: direkte Übersetzung dieses Satzes.\n` +
      `JSON-Schema: {"text_es":"string","text_de":"string","vokabeln":[{"es":"string","de":"string"}]}\n` +
      `Genau ${e.muede.vokabelnAnzahl} Objekte in vokabeln.`
    )
  }
  return (
    `Erstelle einen kurzen Lese-Text (ca. ${e.muede.einheitenAnzahl} Wörter, ` +
    `max. ${e.muede.einheitenAnzahl + 10} Wörter) auf Spanisch über ein Thema aus: ${themen}.\n` +
    `Markiere ${e.muede.vokabelnAnzahl} wichtige Vokabeln aus dem Text.\n` +
    `JSON-Schema: {"text_es":"string","text_de":"string","vokabeln":[{"es":"string","de":"string"}]}\n` +
    `Genau ${e.muede.vokabelnAnzahl} Objekte in vokabeln.`
  )
}

function buildOkayPrompt(themen: string, e: ApiEtappeData): string {
  return (
    `Erstelle einen spanischen Text (genau ${e.okay.saetzeAnzahl} Sätze, ` +
    `je max. ${e.constraints.maxWoerterProSatz} Wörter) über ein Thema aus: ${themen}.\n` +
    `Erstelle genau ${e.okay.fragenAnzahl} Verständnisfragen auf Deutsch zum Text, ` +
    `jede mit genau 3 Antwortoptionen und dem 0-basierten Index der richtigen Antwort.\n` +
    `JSON-Schema: {"text_es":"string","text_de":"string","fragen":[{"frage":"string","antworten":["string","string","string"],"richtig":0}]}\n` +
    `Genau ${e.okay.fragenAnzahl} Objekte in fragen.`
  )
}

function buildFitPrompt(themen: string, e: ApiEtappeData): string {
  if (e.fit.format === 'miniDialogs') {
    return (
      `Erstelle genau ${e.fit.miniDialogsAnzahl} kurze Mini-Dialoge über ein Thema aus: ${themen}.\n` +
      `Jeder Mini-Dialog besteht aus genau 2 Zeilen (eine Frage, eine Antwort).\n` +
      `Verwende zwei spanische Sprechernamen (z.B. Ana und Pablo) konsistent durch alle Dialoge.\n` +
      `Das dialog-Array hat genau ${e.fit.dialogZeilenTotal} Einträge ` +
      `(${e.fit.miniDialogsAnzahl} × 2 Zeilen, abwechselnd Frage/Antwort).\n` +
      `Ergänze genau ${e.fit.vokabelnAnzahl} einfache Vokabeln aus den Dialogen.\n` +
      `JSON-Schema: {"dialog":[{"sprecher":"string","es":"string","de":"string"}],"vokabeln":[{"es":"string","de":"string"}]}\n` +
      `Genau ${e.fit.dialogZeilenTotal} Objekte in dialog, genau ${e.fit.vokabelnAnzahl} in vokabeln.`
    )
  }
  return (
    `Erstelle einen alltagsnahen Dialog (genau ${e.fit.dialogZeilenTotal} Zeilen) ` +
    `zwischen zwei Personen über ein Thema aus: ${themen}.\n` +
    `Verwende natürliche spanische Sprechernamen.\n` +
    `Ergänze ${e.fit.vokabelnAnzahl} wichtige Vokabeln aus dem Dialog.\n` +
    `JSON-Schema: {"dialog":[{"sprecher":"string","es":"string","de":"string"}],"vokabeln":[{"es":"string","de":"string"}]}\n` +
    `Genau ${e.fit.dialogZeilenTotal} Objekte in dialog, genau ${e.fit.vokabelnAnzahl} in vokabeln.`
  )
}

function buildErzaehlPrompt(userInput: string, e: ApiEtappeData): string {
  return (
    `Der Nutzer beschreibt seinen Tag auf Deutsch: "${userInput}".\n` +
    `Formuliere daraus genau ${e.erzaehl.saetzeAnzahl} einfache spanische Sätze, ` +
    `die diese Aktivitäten beschreiben (je max. ${e.constraints.maxWoerterProSatz} Wörter).\n` +
    `Jeder Satz mit direkter deutscher Übersetzung.\n` +
    `Ergänze genau ${e.erzaehl.vokabelnAnzahl} nützliche Vokabeln aus den Sätzen.\n` +
    `JSON-Schema: {"saetze":[{"es":"string","de":"string"}],"vokabeln":[{"es":"string","de":"string"}]}\n` +
    `Genau ${e.erzaehl.saetzeAnzahl} Objekte in saetze, genau ${e.erzaehl.vokabelnAnzahl} in vokabeln.`
  )
}

export function buildPrompt(modus: string, ctx: PromptContext): string {
  const themen = ctx.themen.join(', ')
  const etappeData = ctx.etappeNummer ? ETAPPEN_API[ctx.etappeNummer] : null

  const systemLines: string[] = [
    'Du erstellst Spanisch-Lernmaterial für deutschsprachige Lernende.',
    'Sprich natürliches, modernes Castellano.',
    'Antworte AUSSCHLIESSLICH mit validem JSON ohne Markdown-Blöcke.',
  ]

  if (etappeData) {
    systemLines.push(`Lernetappe: ${ctx.etappenName ?? ''} – ${ctx.etappenBeschreibung ?? ''} (${ctx.etappenNiveau ?? ''}).`)
    systemLines.push(constraintBlock(etappeData.constraints))
  } else {
    systemLines.push(`Sprachniveau: ${ctx.niveau}. Themen: ${themen}. Lernziel: ${ctx.why || 'nicht angegeben'}.`)
  }

  if (ctx.why) {
    systemLines.push(`Lernziel des Nutzers: ${ctx.why}.`)
  }

  const system = systemLines.join('\n')

  let task: string
  if (etappeData) {
    switch (modus) {
      case 'muede':  task = buildMuedePrompt(themen, etappeData); break
      case 'okay':   task = buildOkayPrompt(themen, etappeData); break
      case 'fit':    task = buildFitPrompt(themen, etappeData); break
      case 'erzaehl': task = buildErzaehlPrompt(ctx.userInput ?? '', etappeData); break
      default:       task = ''
    }
  } else {
    // Fallback prompts (no etappe context)
    const SCHEMAS: Record<string, string> = {
      muede: '{"text_es":"string","text_de":"string","vokabeln":[{"es":"string","de":"string"}]}',
      okay: '{"text_es":"string","text_de":"string","fragen":[{"frage":"string","antworten":["string","string","string"],"richtig":0}]}',
      fit: '{"dialog":[{"sprecher":"string","es":"string","de":"string"}],"vokabeln":[{"es":"string","de":"string"}]}',
      erzaehl: '{"saetze":[{"es":"string","de":"string"}],"vokabeln":[{"es":"string","de":"string"}]}',
    }
    const schema = SCHEMAS[modus] ?? ''
    const fallbacks: Record<string, string> = {
      muede: `Erstelle eine kurze Mini-Lektion (2 Sätze, max 30 Wörter) über ein Thema aus ${themen}. Markiere 3 Vokabeln. JSON: ${schema}`,
      okay: `Erstelle einen Text (4-5 Sätze) über ${themen}. 3 Verständnisfragen mit je 3 Antworten. JSON: ${schema}`,
      fit: `Erstelle einen Dialog (6 Zeilen) über ${themen}. 5 Vokabeln. JSON: ${schema}`,
      erzaehl: `Nutzer: "${ctx.userInput ?? ''}". 3 spanische Sätze + 5 Vokabeln. JSON: ${schema}`,
    }
    task = fallbacks[modus] ?? ''
  }

  return `${system}\n\n${task}`
}
