import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { recordVocabAnswer } from '../lib/vocabTracking'
import { ANFAENGER_VOKABULAR } from '../lib/anfaengerVokabular'
import type { AnfaengerVokabel } from '../lib/anfaengerVokabular'

interface VocabPair {
  es: string
  de: string
}

interface Card {
  id: number
  text: string
  lang: 'es' | 'de'
  pairKey: string
}

interface Props {
  vocab: VocabPair[]
  onFinish: () => void
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickCards(source: AnfaengerVokabel[]): Card[] {
  const pairs = source.slice().sort(() => Math.random() - 0.5).slice(0, 6)
  return shuffle([
    ...pairs.map((p, i) => ({ id: i * 2,     text: p.es, lang: 'es' as const, pairKey: p.es })),
    ...pairs.map((p, i) => ({ id: i * 2 + 1, text: p.de, lang: 'de' as const, pairKey: p.es })),
  ])
}

export default function SpielWortPaare({ vocab }: Props) {
  const navigate = useNavigate()
  const [cards, setCards] = useState<Card[]>(() => {
    const pairs = vocab.slice(0, 6)
    return shuffle([
      ...pairs.map((p, i) => ({ id: i * 2,     text: p.es, lang: 'es' as const, pairKey: p.es })),
      ...pairs.map((p, i) => ({ id: i * 2 + 1, text: p.de, lang: 'de' as const, pairKey: p.es })),
    ])
  })

  const totalPairs = new Set(cards.map(c => c.pairKey)).size

  const [revealed, setRevealed] = useState<number[]>([])
  const [matched, setMatched]   = useState<string[]>([])
  const [locked, setLocked]     = useState(false)
  const [done, setDone]         = useState(false)

  function handleTap(card: Card) {
    if (locked) return
    if (matched.includes(card.pairKey)) return
    if (revealed.includes(card.id)) return
    if (revealed.length >= 2) return

    const newRevealed = [...revealed, card.id]
    setRevealed(newRevealed)

    if (newRevealed.length < 2) return

    setLocked(true)
    const [idA, idB] = newRevealed
    const cardA = cards.find(c => c.id === idA)!
    const cardB = cards.find(c => c.id === idB)!

    if (cardA.pairKey === cardB.pairKey) {
      recordVocabAnswer(cardA.pairKey, true)
      const newMatched = [...matched, cardA.pairKey]
      setMatched(newMatched)
      setRevealed([])
      setLocked(false)
      if (newMatched.length >= totalPairs) {
        setDone(true)
      }
    } else {
      setTimeout(() => {
        setRevealed([])
        setLocked(false)
      }, 1000)
    }
  }

  function handleNochEineRunde() {
    setCards(pickCards(ANFAENGER_VOKABULAR))
    setRevealed([])
    setMatched([])
    setLocked(false)
    setDone(false)
  }

  if (done) {
    return (
      <div className="fade-in flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <p className="font-serif text-[26px] font-semibold text-text text-center">Alle Paare gefunden!</p>
        <div className="flex flex-col gap-3 w-full max-w-[320px] mt-2">
          <button
            onClick={handleNochEineRunde}
            className="w-full py-4 rounded-[16px] bg-accent text-white text-[15px] font-semibold tap-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Noch eine Runde
          </button>
          <button
            onClick={() => navigate('/wiederholen')}
            className="w-full py-4 rounded-[16px] border border-accent text-accent text-[15px] font-semibold tap-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in flex flex-col gap-6">
      <p className="text-[13px] text-muted uppercase tracking-wide text-center" style={{ letterSpacing: '0.06em' }}>
        Wort-Paare finden
      </p>
      <div className="grid grid-cols-3 gap-2">
        {cards.map(card => {
          const isRevealed = revealed.includes(card.id)
          const isMatched  = matched.includes(card.pairKey)
          return (
            <button
              key={card.id}
              onClick={() => handleTap(card)}
              className={`rounded-[14px] px-2 py-4 text-sm font-medium text-center tap-scale transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isMatched
                  ? 'bg-[#F0F7F1] border-2 border-[#7CA982] text-[#4A7A50]'
                  : isRevealed
                  ? 'bg-white border-2 border-accent text-accent shadow-sm'
                  : 'bg-white border border-[#E0DDD8] text-text'
              }`}
              style={{ minHeight: 72 }}
            >
              {isRevealed || isMatched ? card.text : ''}
            </button>
          )
        })}
      </div>
      <p className="text-[12px] text-muted text-center">
        {matched.length} / {totalPairs} Paare gefunden
      </p>
    </div>
  )
}
