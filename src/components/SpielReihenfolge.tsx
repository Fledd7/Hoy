import { useEffect, useState } from 'react'
import { recordVocabAnswer } from '../lib/vocabTracking'
import Button from './Button'


interface Satz {
  satz: string
  uebersetzung: string
}

interface Props {
  etappe: number
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

export default function SpielReihenfolge({ etappe, onFinish }: Props) {
  const [saetze, setSaetze] = useState<Satz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/reihenfolge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ etappe, anzahl: 5 }),
      signal: controller.signal,
    })
      .then(r => r.json())
      .then((data: { saetze: Satz[] }) => {
        setSaetze(data.saetze ?? [])
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
    return () => controller.abort()
  }, [etappe])

  useEffect(() => {
    if (!done) return
    const t = setTimeout(onFinish, 8000)
    return () => clearTimeout(t)
  }, [done, onFinish])

  if (loading) {
    return (
      <div className="flex flex-col gap-4 pt-2">
        <div className="h-5 bg-[#E5E2DD] rounded animate-pulse w-4/5" />
        <div className="h-5 bg-[#E5E2DD] rounded animate-pulse w-full" />
        <div className="h-5 bg-[#E5E2DD] rounded animate-pulse w-2/3" />
      </div>
    )
  }

  if (error || saetze.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 pt-8">
        <p className="text-muted text-center">Konnte die Sätze nicht laden.</p>
        <Button variant="primary" fullWidth onClick={onFinish}>Weiter</Button>
      </div>
    )
  }

  function handleNochmal() {
    setIndex(0)
    setCorrect(0)
    setDone(false)
  }

  if (done) {
    return (
      <div className="fade-in flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <p className="font-serif text-[26px] font-semibold text-text text-center">Schön gespielt.</p>
        <p className="text-[15px] text-muted text-center">
          {correct} von {saetze.length} Sätzen richtig geordnet.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-[320px] mt-2">
          <button
            onClick={handleNochmal}
            className="w-full py-4 rounded-[16px] bg-accent text-white text-[15px] font-semibold tap-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Nochmal
          </button>
          <button
            onClick={onFinish}
            className="w-full py-4 rounded-[16px] border border-accent text-accent text-[15px] font-semibold tap-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Zurück
          </button>
        </div>
      </div>
    )
  }

  return (
    <ReihenfolgeRunde
      key={index}
      satz={saetze[index]}
      roundIndex={index}
      totalRounds={saetze.length}
      onResult={(wasCorrect) => {
        const words = saetze[index].satz.split(' ').filter(Boolean)
        words.forEach(w => recordVocabAnswer(w, wasCorrect))
        if (wasCorrect) setCorrect(c => c + 1)
        if (index + 1 >= saetze.length) {
          setDone(true)
        } else {
          setIndex(i => i + 1)
        }
      }}
    />
  )
}

function ReihenfolgeRunde({
  satz,
  roundIndex,
  totalRounds,
  onResult,
}: {
  satz: Satz
  roundIndex: number
  totalRounds: number
  onResult: (correct: boolean) => void
}) {
  const words = satz.satz.split(' ').filter(Boolean)
  const [pool, setPool] = useState<string[]>(() => shuffle(words))
  const [placed, setPlaced] = useState<string[]>([])
  const [checked, setChecked] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const allPlaced = placed.length === words.length

  function tapFromPool(word: string, idx: number) {
    if (checked) return
    const newPool = [...pool]
    newPool.splice(idx, 1)
    setPool(newPool)
    setPlaced(p => [...p, word])
  }

  function tapFromPlaced(word: string, idx: number) {
    if (checked) return
    const newPlaced = [...placed]
    newPlaced.splice(idx, 1)
    setPlaced(newPlaced)
    setPool(p => [...p, word])
  }

  function handlePruefen() {
    const correct = placed.join(' ') === words.join(' ')
    setIsCorrect(correct)
    setChecked(true)
  }

  return (
    <div className="fade-in flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <p className="text-[13px] text-muted uppercase tracking-wide" style={{ letterSpacing: '0.06em' }}>
          Reihenfolge
        </p>
        <p className="text-[13px] text-muted">{roundIndex + 1} / {totalRounds}</p>
      </div>

      <p className="text-[13px] text-muted italic">{satz.uebersetzung}</p>

      {/* Drop area */}
      <div
        className="min-h-[56px] bg-white border-2 rounded-[16px] px-3 py-3 flex flex-wrap gap-2"
        style={{ borderColor: checked ? (isCorrect ? '#7CA982' : '#C25555') : '#E0DDD8' }}
      >
        {placed.map((word, idx) => (
          <button
            key={idx}
            onClick={() => tapFromPlaced(word, idx)}
            className="px-3 py-1.5 bg-[#FAF7F2] border border-[#E0DDD8] rounded-full text-sm text-text tap-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {word}
          </button>
        ))}
        {placed.length === 0 && (
          <span className="text-muted text-sm">Wörter hier hintippen …</span>
        )}
      </div>

      {/* Word pool */}
      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {pool.map((word, idx) => (
          <button
            key={idx}
            onClick={() => tapFromPool(word, idx)}
            className="px-3 py-1.5 bg-white border border-[#E0DDD8] rounded-full text-sm text-text tap-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {word}
          </button>
        ))}
      </div>

      {checked ? (
        <div className="flex flex-col gap-3 fade-in">
          {!isCorrect && (
            <p className="text-sm text-muted">
              Richtig: <span className="font-semibold text-text">{words.join(' ')}</span>
            </p>
          )}
          <Button variant="primary" fullWidth onClick={() => onResult(isCorrect)}>
            Weiter
          </Button>
        </div>
      ) : (
        <Button variant="primary" fullWidth onClick={handlePruefen} disabled={!allPlaced}>
          Prüfen
        </Button>
      )}
    </div>
  )
}
