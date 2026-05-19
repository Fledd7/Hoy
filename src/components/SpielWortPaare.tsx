import { useEffect, useRef, useState } from 'react'
import type { VocabEntry } from '../lib/vocabTracking'
import { recordVocabAnswer } from '../lib/vocabTracking'
import Button from './Button'

interface Props {
  vocab: VocabEntry[]
  onNochmal: () => void
  onZurueck: () => void
}

interface Card {
  id: number
  pairKey: string
  lang: 'es' | 'de'
  text: string
  state: 'hidden' | 'revealed' | 'matched'
}

function buildCards(vocab: VocabEntry[]): Card[] {
  const selected = [...vocab].sort(() => Math.random() - 0.5).slice(0, 6)
  const cards: Card[] = []
  selected.forEach((v, i) => {
    cards.push({ id: i * 2,     pairKey: v.es, lang: 'es', text: v.es, state: 'hidden' })
    cards.push({ id: i * 2 + 1, pairKey: v.es, lang: 'de', text: v.de, state: 'hidden' })
  })
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]]
  }
  return cards
}

export default function SpielWortPaare({ vocab, onNochmal, onZurueck }: Props) {
  const [cards, setCards] = useState<Card[]>(() => buildCards(vocab))
  const [revealed, setRevealed] = useState<number[]>([])
  const [locked, setLocked] = useState(false)
  const [glowIds, setGlowIds] = useState<number[]>([])
  const [foundCount, setFoundCount] = useState(0)
  const [done, setDone] = useState(false)
  const autoRedirectRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const totalPairs = new Set(cards.map(c => c.pairKey)).size

  useEffect(() => {
    return () => {
      if (autoRedirectRef.current) clearTimeout(autoRedirectRef.current)
    }
  }, [])

  function handleTap(id: number) {
    if (locked) return
    const card = cards.find(c => c.id === id)
    if (!card || card.state !== 'hidden') return
    if (revealed.includes(id)) return

    const newRevealed = [...revealed, id]

    if (newRevealed.length === 1) {
      setRevealed(newRevealed)
      return
    }

    // Show both cards before evaluating the pair
    setRevealed(newRevealed)
    setLocked(true)

    const [firstId, secondId] = newRevealed
    const first = cards.find(c => c.id === firstId)!
    const second = cards.find(c => c.id === secondId)!

    const isMatch =
      first.pairKey === second.pairKey &&
      first.lang !== second.lang

    if (isMatch) {
      setGlowIds([firstId, secondId])
      recordVocabAnswer(first.pairKey, true)
      setTimeout(() => {
        setCards(prev =>
          prev.map(c =>
            c.id === firstId || c.id === secondId ? { ...c, state: 'matched' } : c,
          ),
        )
        setGlowIds([])
        setRevealed([])
        setLocked(false)
        const next = foundCount + 1
        setFoundCount(next)
        if (next === totalPairs) {
          setDone(true)
          autoRedirectRef.current = setTimeout(onZurueck, 8000)
        }
      }, 400)
    } else {
      // Wrong pair – both cards visible for 1s, then flip back
      setTimeout(() => {
        setRevealed([])
        setLocked(false)
      }, 1000)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F1EB] items-center justify-center px-8 gap-4 fade-in">
        <p className="font-serif text-[28px] font-semibold text-text text-center">Schön gespielt.</p>
        <p className="text-[16px] text-muted text-center">Du hast {totalPairs} Paare gefunden.</p>
        <div className="flex flex-col gap-3 w-full max-w-[340px] mt-4">
          <Button variant="primary" fullWidth onClick={() => {
            if (autoRedirectRef.current) clearTimeout(autoRedirectRef.current)
            onNochmal()
          }}>
            Nochmal
          </Button>
          <Button variant="secondary" fullWidth onClick={() => {
            if (autoRedirectRef.current) clearTimeout(autoRedirectRef.current)
            onZurueck()
          }}>
            Zurück
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F1EB] max-w-content mx-auto px-4 pt-5 pb-10">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-serif text-[22px] font-semibold text-text">Wort-Paare</h1>
        <span className="text-[13px] text-muted">{foundCount} von {totalPairs} gefunden</span>
      </div>

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(4, 1fr)' }}
      >
        {cards.map(card => {
          const isRevealed = revealed.includes(card.id) || card.state === 'matched'
          const isGlowing = glowIds.includes(card.id)
          const isMatched = card.state === 'matched'

          return (
            <button
              key={card.id}
              onClick={() => handleTap(card.id)}
              disabled={isMatched}
              className="relative flex items-center justify-center rounded-[12px] text-center tap-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              style={{
                height: 80,
                background: isMatched ? '#F5F1EB' : isRevealed ? 'white' : 'white',
                border: isMatched
                  ? '1px solid #E0DDD8'
                  : isGlowing
                  ? '2px solid #7CA982'
                  : isRevealed
                  ? '2px solid #C2553D'
                  : '1px solid #E2D7C8',
                boxShadow: isMatched
                  ? 'none'
                  : isGlowing
                  ? '0 0 0 3px rgba(124,169,130,0.2)'
                  : '0 1px 4px rgba(26,26,26,0.06)',
                opacity: isMatched ? 0.4 : 1,
                transition: 'border 200ms, opacity 400ms, box-shadow 200ms',
              }}
            >
              {isRevealed ? (
                <span
                  className={`px-2 text-center leading-tight break-words ${
                    card.lang === 'es'
                      ? 'font-serif text-[15px] font-semibold text-text'
                      : 'text-[14px] text-text'
                  }`}
                  style={{ maxWidth: '90%' }}
                >
                  {card.text}
                </span>
              ) : (
                <span
                  className="w-2 h-2 rounded-full bg-accent/30"
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
