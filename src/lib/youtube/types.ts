export type Tag = 'packaging' | 'design' | 'system' | 'strategy' | 'audit' | 'retainer'

export interface QuestionOption {
  label: string
  score: number
  tag?: Tag
}

export interface Question {
  id: 'status' | 'goal' | 'problem' | 'thumbnails' | 'support'
  question: string
  options: QuestionOption[]
}

export type Answers = Partial<Record<Question['id'], QuestionOption>>

export interface ChannelData {
  channel: {
    title: string
    handle: string | null
    subs: number
    videoCount: number
  }
  metrics: {
    cadenceDays: number
    medianViews: number
    avgTitleLength: number
    sampleSize: number
  }
  thumbnails: string[]
}

export type ChannelCheckResponse =
  | ({ ok: true } & ChannelData)
  | { ok: false; reason?: 'not_found' | 'error' | 'missing_key' }

export type ResultCategory = 'A' | 'B' | 'C' | 'D'

export interface ResultPayload {
  category: ResultCategory
  headline: string
  text: string
  cta: string
  dataLine?: string
}

export type LeadClass = 'top' | 'good' | 'mid' | 'weak'

export interface LeadInput {
  name: string
  email: string
  message?: string
  consent: boolean
  channelUrl?: string
  answers: Record<string, string>
  scoreBreakdown: {
    score: number
    leadClass: LeadClass
    category: ResultCategory
  }
  channel?: ChannelData | null
}
