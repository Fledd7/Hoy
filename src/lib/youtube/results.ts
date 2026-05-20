import type { Answers, ChannelData, ResultPayload, ResultCategory } from './types'

function pickCategory(answers: Answers): ResultCategory {
  const problemTag = answers.problem?.tag
  const goalLabel = answers.goal?.label
  const statusLabel = answers.status?.label
  const thumbTag = answers.thumbnails?.tag
  const supportTag = answers.support?.tag

  if (problemTag === 'strategy' || goalLabel === 'Noch nicht ganz klar') return 'C'
  if (statusLabel === 'Ich plane gerade den Start' || statusLabel === 'Kanal ist da, aber kaum aktiv') return 'D'
  if (thumbTag === 'system' || supportTag === 'system' || supportTag === 'retainer') return 'B'
  return 'A'
}

const CATEGORIES: Record<ResultCategory, Omit<ResultPayload, 'category' | 'dataLine'>> = {
  A: {
    headline: 'Klar im Kanal — schwach in der Verpackung',
    text:
      'Deine Richtung steht — aber deine Verpackung transportiert sie noch nicht. Hier lohnt sich ein klares Thumbnail-System.',
    cta: 'Lass uns aus deinem klaren Kanal ein klares Thumbnail-System machen.',
  },
  B: {
    headline: 'Potenzial da — aber kein wiederholbares System',
    text:
      'Du veröffentlichst genug, aber dein Kanal hat noch keine wiederholbare visuelle Linie. Wiedererkennung entsteht durch einen konsequenten Stil — nicht durch Einzel-Thumbnails.',
    cta: 'Lass uns eine visuelle Linie entwickeln, die du jede Woche wiederholen kannst.',
  },
  C: {
    headline: 'Strategie vor Design',
    text:
      'Dein Engpass liegt nicht beim Bild, sondern davor — bei Richtung, Idee und Titel. Bevor wir gestalten, muss klar sein, was verpackt wird.',
    cta: 'Lass uns zuerst deine Kanalrichtung und dein Packaging schärfen.',
  },
  D: {
    headline: 'Guter Moment — noch früh genug, es richtig aufzusetzen',
    text:
      'Genau jetzt ist der beste Moment, von Anfang an professionell zu verpacken — bevor sich ein uneinheitlicher Stil einschleift.',
    cta: 'Lass uns deinen Start visuell klar aufsetzen.',
  },
}

function dataLine(category: ResultCategory, channel: ChannelData): string {
  const { cadenceDays, medianViews, sampleSize } = channel.metrics
  const cadence =
    cadenceDays > 0
      ? `Du lädst im Schnitt alle ${cadenceDays} Tage hoch`
      : `Bei den letzten ${sampleSize} Videos ist kein klarer Rhythmus erkennbar`
  const views = medianViews > 0 ? `, im Median rund ${medianViews.toLocaleString('de-DE')} Aufrufe pro Video` : ''

  switch (category) {
    case 'A':
      return `${cadence}${views} — aber die Verpackung holt nicht heraus, was im Kanal steckt.`
    case 'B':
      return `${cadence}${views}. Deine Thumbnails haben aber keine erkennbare gemeinsame Linie.`
    case 'C':
      return `${cadence}${views}. Bevor wir am Bild arbeiten, lohnt sich der Blick auf Idee, Titel und Richtung.`
    case 'D':
      return `Dein Kanal ist noch im Aufbau (${sampleSize} Videos sichtbar). Jetzt ist der richtige Zeitpunkt für ein System.`
  }
}

export function buildResult(answers: Answers, channel?: ChannelData | null): ResultPayload {
  const category = pickCategory(answers)
  const base = CATEGORIES[category]
  return {
    category,
    ...base,
    dataLine: channel ? dataLine(category, channel) : undefined,
  }
}
