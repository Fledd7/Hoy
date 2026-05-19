import { useState } from 'react'

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

export default function SpielWortPaare({ vocab, onFinish }: Props) {
  const pairs = vocab.slice(0, 6)

  const [cards] = useState<Card[]>(() =>
    shuffle([
      ...pairs.map((p, i) => ({ id: i * 2,     text: p.es, lang: 'es' as const, pairKey: p.es })),
      ...pairs.map((p, i) => ({ id: i * 2 + 1, text: p.de, lang: 'de' as const, pairKey: p.es })),
    ]),
  )

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
      const newMatched = [...matched, cardA.pairKey]
      setMatched(newMatched)
      setRevealed([])
      setLocked(false)
      if (newMatched.length >= totalPairs) {
        setDone(true)
        setTimeout(() => onFinish(), 800)
      }
    } else {
      setTimeout(() => {
        setRevealed([])
        setLocked(false)
      }, 1000)
    }
  }

  if (done) {
    return (
      <div className="fade-in flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="font-serif text-[26px] font-semibold text-text text-center">Alle Paare gefunden!</p>
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
