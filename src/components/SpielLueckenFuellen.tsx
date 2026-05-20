import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { recordVocabAnswer } from '../lib/vocabTracking'
import { isCloseMatch } from '../lib/stringUtils'
import { fetchLuecken } from '../lib/api'
import type { LueckeItem } from '../lib/api'
import Button from './Button'
import LoadingWords from './LoadingWords'

interface VocabPair {
  es: string
  de: string
}

interface Props {
  vocab: VocabPair[]
  etappe: number
  onFinish: () => void
}

export default function SpielLueckenFuellen({ vocab, etappe, onFinish }: Props) {
  const navigate = useNavigate()
  const [luecken, setLuecken] = useState<LueckeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [done, setDone] = useState(false)
  const [fetchCount, setFetchCount] = useState(0)

  const usedVocab = vocab.slice(0, 5)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(false)
    const load = async () => {
      try {
        const data = await fetchLuecken(usedVocab, etappe, undefined, fetchCount > 0)
        if (mounted) {
          setLuecken(data.saetze ?? [])
          setLoading(false)
        }
      } catch {
        if (mounted) { setError(true); setLoading(false) }
      }
    }
    void load()
    return () => { mounted = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchCount])

  if (loading) {
    return <LoadingWords />
  }

  if (error || luecken.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 pt-8">
        <p className="text-muted text-center">Konnte die Lücken nicht laden.</p>
        <Button variant="primary" fullWidth onClick={onFinish}>Weiter</Button>
      </div>
    )
  }

  if (done) {
    return (
      <div className="fade-in flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <p className="font-serif text-[26px] font-semibold text-text text-center">Schön gespielt.</p>
        <p className="text-[15px] text-muted text-center">
          Du hast {correct} von {luecken.length} Lücken richtig gefüllt.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-[320px] mt-2">
          <button
            onClick={() => {
              setIndex(0)
              setCorrect(0)
              setDone(false)
              setFetchCount(c => c + 1)
            }}
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
    <LueckeRunde
      key={index}
      luecke={luecken[index]}
      roundIndex={index}
      totalRounds={luecken.length}
      vocabEs={usedVocab[index]?.es ?? ''}
      onResult={(wasCorrect) => {
        const key = luecken[index]?.loesung || usedVocab[index]?.es
        if (key) recordVocabAnswer(key, wasCorrect)
        if (wasCorrect) setCorrect(c => c + 1)
        if (index + 1 >= luecken.length) {
          setDone(true)
        } else {
          setIndex(i => i + 1)
        }
      }}
    />
  )
}

function LueckeRunde({
  luecke,
  roundIndex,
  totalRounds,
  onResult,
}: {
  luecke: LueckeItem
  roundIndex: number
  totalRounds: number
  vocabEs: string
  onResult: (correct: boolean) => void
}) {
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [correct, setCorrect] = useState(false)

  const parts = luecke.satz.split('___')

  function handleSubmit() {
    if (submitted) return
    const isCorrect = isCloseMatch(input.trim(), luecke.loesung)
    setCorrect(isCorrect)
    setSubmitted(true)
  }

  return (
    <div className="fade-in flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <p className="text-[13px] text-muted uppercase tracking-wide" style={{ letterSpacing: '0.06em' }}>
          Lücken füllen
        </p>
        <p className="text-[13px] text-muted">{roundIndex + 1} / {totalRounds}</p>
      </div>

      <div className="bg-white border border-[#E2D7C8]/50 rounded-[20px] px-5 py-5 shadow-card">
        <p className="text-[13px] text-muted mb-2">{luecke.hilfe_de}</p>
        <p className="text-lg text-text font-medium leading-relaxed">
          {parts[0]}
          <span
            className={`inline-block border-b-2 px-1 font-semibold ${
              submitted
                ? correct
                  ? 'border-[#7CA982] text-[#4A7A50]'
                  : 'border-[#C25555] text-[#C25555] line-through'
                : 'border-accent text-accent'
            }`}
            style={{ minWidth: 60 }}
          >
            {submitted ? (correct ? input : input) : input || '___'}
          </span>
          {parts[1]}
        </p>
        {submitted && !correct && (
          <p className="text-sm text-muted mt-2 fade-in">
            Richtig: <span className="font-semibold text-text">{luecke.loesung}</span>
          </p>
        )}
      </div>

      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !submitted) handleSubmit() }}
        disabled={submitted}
        placeholder="Fehlende Wörter eingeben …"
        autoFocus
        className={`w-full border rounded-card px-4 py-3 text-base text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent ${
          submitted
            ? correct
              ? 'border-[#7CA982] bg-[#F0F7F1]'
              : 'border-[#C25555] bg-[#FDF0F0]'
            : 'border-[#E0DDD8] bg-white'
        }`}
      />

      {!submitted ? (
        <Button variant="primary" fullWidth onClick={handleSubmit} disabled={!input.trim()}>
          Prüfen
        </Button>
      ) : (
        <Button variant="primary" fullWidth onClick={() => onResult(correct)}>
          Weiter
        </Button>
      )}
    </div>
  )
}
