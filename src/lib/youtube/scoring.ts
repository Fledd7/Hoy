import type { Answers, ChannelData, LeadClass } from './types'

export interface ScoreInput {
  answers: Answers
  channel?: ChannelData | null
  hasLink: boolean
  message?: string
}

export function calcScore({ answers, channel, hasLink, message }: ScoreInput): number {
  let score = 0
  for (const opt of Object.values(answers)) {
    if (opt) score += opt.score
  }
  if (hasLink && channel) score += 5
  if (channel && channel.metrics.cadenceDays > 0 && channel.metrics.cadenceDays <= 10) score += 5
  if (message && message.trim().length > 20) score += 2
  return Math.min(100, score)
}

export function leadClass(score: number): LeadClass {
  if (score >= 75) return 'top'
  if (score >= 50) return 'good'
  if (score >= 30) return 'mid'
  return 'weak'
}

export function leadClassLabel(c: LeadClass): string {
  switch (c) {
    case 'top':
      return 'Top-Lead — binnen 24 h melden'
    case 'good':
      return 'Guter Lead — prüfen'
    case 'mid':
      return 'Mittlerer Lead — Guide / Follow-up'
    case 'weak':
      return 'Schwacher Lead — freundlich, nicht priorisieren'
  }
}
