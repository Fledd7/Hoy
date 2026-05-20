import type { Question } from './types'

export const questions: readonly Question[] = [
  {
    id: 'status',
    question: 'Wo stehst du gerade mit deinem YouTube-Kanal?',
    options: [
      { label: 'Ich veröffentliche regelmäßig', score: 15 },
      { label: 'Ich veröffentliche, aber unregelmäßig', score: 10 },
      { label: 'Kanal ist da, aber kaum aktiv', score: 5 },
      { label: 'Ich plane gerade den Start', score: 3 },
    ],
  },
  {
    id: 'goal',
    question: 'Was soll dein Kanal vor allem erreichen?',
    options: [
      { label: 'Mehr Kundenanfragen', score: 15 },
      { label: 'Expertenstatus aufbauen', score: 15 },
      { label: 'Reichweite / Bekanntheit', score: 8 },
      { label: 'Community aufbauen', score: 8 },
      { label: 'Inhalte monetarisieren', score: 6 },
      { label: 'Noch nicht ganz klar', score: 0 },
    ],
  },
  {
    id: 'problem',
    question: 'Was ist gerade dein größtes Problem mit deinem YouTube-Auftritt?',
    options: [
      { label: 'Zu wenig Klicks', score: 10, tag: 'packaging' },
      { label: 'Thumbnails wirken unprofessionell', score: 10, tag: 'design' },
      { label: 'Kanal wirkt uneinheitlich', score: 10, tag: 'system' },
      { label: 'Ich weiß nicht, was aufs Thumbnail soll', score: 8, tag: 'system' },
      { label: 'Titel und Thumbnail passen nicht zusammen', score: 10, tag: 'packaging' },
      { label: 'Meine Ideen sind schwer visuell darzustellen', score: 6, tag: 'strategy' },
      { label: 'Keine klare Richtung', score: 4, tag: 'strategy' },
    ],
  },
  {
    id: 'thumbnails',
    question: 'Wie würdest du deine aktuellen Thumbnails beschreiben?',
    options: [
      { label: 'Einheitlich und professionell', score: 4 },
      { label: 'Teilweise gut, aber ohne klares System', score: 15, tag: 'system' },
      { label: 'Sehr unterschiedlich', score: 12, tag: 'system' },
      { label: 'Eher schnell zusammengebaut', score: 10 },
      { label: 'Noch keine eigenen', score: 5 },
      { label: 'Bin unsicher', score: 3 },
    ],
  },
  {
    id: 'support',
    question: 'Welche Unterstützung wäre für dich am wertvollsten?',
    options: [
      { label: 'Ein klares Thumbnail-System für meinen Kanal', score: 20, tag: 'system' },
      { label: 'Strategie für Ideen, Titel & Thumbnails', score: 20, tag: 'strategy' },
      { label: 'Ein Audit meines aktuellen Kanals', score: 18, tag: 'audit' },
      { label: 'Laufende Betreuung pro Monat', score: 20, tag: 'retainer' },
      { label: 'Bessere einzelne Thumbnails', score: 5 },
      { label: 'Weiß noch nicht', score: 2 },
    ],
  },
] as const
