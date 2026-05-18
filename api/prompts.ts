export interface PromptContext {
  niveau: string
  themen: string[]
  why: string
  userInput?: string
}

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

export function buildPrompt(modus: string, ctx: PromptContext): string {
  const niveauLabel = NIVEAU_MAP[ctx.niveau] ?? ctx.niveau
  const themenStr = ctx.themen.join(', ')
  const whyStr = ctx.why || 'nicht angegeben'
  const schema = SCHEMAS[modus] ?? ''

  const system =
    `Du erstellst Spanisch-Lektionen für deutschsprachige Lernende. ` +
    `Sprich natürliches, modernes Castellano. ` +
    `Niveau anpassen an: ${niveauLabel}. ` +
    `Themen einbeziehen: ${themenStr}. ` +
    `Lernkontext: ${whyStr}. ` +
    `Antworte AUSSCHLIESSLICH mit validem JSON ohne Markdown-Blöcke.`

  const modusPrompts: Record<string, string> = {
    muede:
      `Erstelle eine sehr kurze Mini-Lektion (2 Sätze, max 30 Wörter) ` +
      `über ein Thema aus ${themenStr}. ` +
      `Markiere danach 2-3 wichtige Vokabeln aus dem Text. ` +
      `JSON-Schema: ${schema}`,
    okay:
      `Erstelle eine kurze Lektion (4-5 Sätze, max 70 Wörter) ` +
      `über ein Thema aus ${themenStr}. ` +
      `Erstelle genau 3 Multiple-Choice-Verständnisfragen auf Deutsch zum spanischen Text, ` +
      `mit jeweils 3 Antwortoptionen und korrektem Index (0-basiert). ` +
      `JSON-Schema: ${schema}`,
    fit:
      `Erstelle einen kurzen alltagsnahen Dialog (5-6 Zeilen) zwischen zwei Personen ` +
      `über ein Thema aus ${themenStr}. ` +
      `Verwende natürliche spanische Sprechernamen. ` +
      `Ergänze 5 wichtige Vokabeln aus dem Dialog. ` +
      `JSON-Schema: ${schema}`,
    erzaehl:
      `Der Nutzer hat eingegeben: "${ctx.userInput ?? ''}". ` +
      `Erstelle daraus 3 einfache spanische Sätze, die diese Aktivitäten beschreiben, ` +
      `mit deutscher Übersetzung je Satz. ` +
      `Ergänze 5 nützliche Vokabeln aus den Sätzen. ` +
      `JSON-Schema: ${schema}`,
  }

  return `${system}\n\n${modusPrompts[modus] ?? ''}`
}
