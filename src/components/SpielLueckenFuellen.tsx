import { useEffect, useRef, useState } from 'react'
import type { VocabEntry } from '../lib/vocabTracking'
import { recordVocabAnswer } from '../lib/vocabTracking'
import { isCloseMatch } from '../lib/stringUtils'
import Button from './Button'
import Card from './Card'

interface Props {
  vocab: VocabEntry[]
  etappe: number
  onNochmal: () => void
  onZurueck: () => void
}

interface Lueckensatz {
  satz: string
  loesung: string
  hilfe_de: string
  vocabEs: string
}

interface ApiResponse {
  saetze: Array<{ satz: string; loesung: string; hilfe_de: string }>
}

type LoadState = 'loading' | 'ready' | 'error'

export default function SpielLueckenFuellen({ vocab, etappe, onNochmal, onZurueck }: Props) {
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [saetze, setSaetze] = useState<Lueckensatz[]>([])
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [result, setResult] = useState<'correct' | 'close' | 'wrong' | null>(null)
  const [richtigCount, setRichtigCount] = useState(0)
  const [done, setDone] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const autoRedirectRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selected = vocab.slice(0, 5)

  useEffect(() => {
    void fetchSaetze()
    return () => {
      if (autoRedirectRef.current) clearTimeout(autoRedirectRef.current)
    }
  }, [])

  async function fetchSaetze() {
    setLoadState('loading')
    try {
      const res = await fetch('/api/luecken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vokabeln: selected.map(v => ({ es: v.es, de: v.de })),
          etappe,
        }),
      })
      if (!res.ok) throw new Error('api_error')
      const data = (await res.json()) as ApiResponse
      if (!Array.isArray(data.saetze) || data.saetze.length === 0) throw new Error('invalid')
      setSaetze(
        data.saetze.slice(0, 5).map((s, i) => ({
          ...s,
          vocabEs: selected[i]?.es ?? '',
        })),
      )
      setLoadState('ready')
    } catch {
      setLoadState('error')
    }
  }

  function handleSubmit() {
    if (!input.trim() || result !== null) return
    const satz = saetze[index]
    const trimmed = input.trim()
    const exact = isCloseMatch(trimmed, satz.loesung)
    const res = exact ? 'correct' : isCloseMatch(trimmed, satz.loesung.split(' ').pop() ?? satz.loesung) ? 'close' : 'wrong'
    setResult(res)
    recordVocabAnswer(satz.vocabEs, res === 'correct' || res === 'close')
    if (res === 'correct' || res === 'close') setRichtigCount(c => c + 1)
    navigator.vibrate?.(res === 'correct' ? 10 : 5)
  }

  function handleWeiter() {
    const next = index + 1
    if (next >= saetze.length) {
      setDone(true)
      autoRedirectRef.current = setTimeout(onZurueck, 8000)
    } else {
      setIndex(next)
      setInput('')
      setResult(null)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  function renderSatzWithGap(satz: string, loesung: string, revealed: boolean) {
    const parts = satz.split('___')
    return (
      <p className="font-serif text-[20px] text-text text-center leading-relaxed">
        {parts[0]}
        <span
          className="inline-block rounded-[6px] px-2 py-0.5 mx-1 min-w-[60px] text-center align-baseline"
          style={{ background: '#F3E8E5', borderBottom: '2px solid #C2553D' }}
        >
          {revealed ? loesung : '___'}
        </span>
        {parts[1] ?? ''}
      </p>
    )
  }

  if (loadState === 'loading') {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F1EB] items-center justify-center px-6 gap-4">
        <div className="flex flex-col gap-3 w-full max-w-[340px]">
          <div className="h-6 bg-[#E5E2DD] rounded animate-pulse w-3/4 mx-auto" />
          <div className="h-6 bg-[#E5E2DD] rounded animate-pulse w-full mx-auto" />
          <div className="h-12 bg-[#E5E2DD] rounded-btn animate-pulse w-full mt-4" />
        </div>
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F1EB] items-center justify-center px-6 gap-4">
        <p className="text-muted text-center">Konnte keine Übung laden. Versuch es nochmal.</p>
        <div className="flex flex-col gap-3 w-full max-w-[340px]">
          <Button variant="primary" fullWidth onClick={() => void fetchSaetze()}>Nochmal versuchen</Button>
          <Button variant="ghost" fullWidth onClick={onZurueck}>Zurück</Button>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F1EB] items-center justify-center px-8 gap-4 fade-in">
        <p className="font-serif text-[28px] font-semibold text-text text-center">Schön gespielt.</p>
        <p className="text-[16px] text-muted text-center">
          Du hast {richtigCount} von {saetze.length} Lücken richtig gefüllt.
        </p>
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

  const satz = saetze[index]
  const isLastRound = index === saetze.length - 1

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F1EB] max-w-content mx-auto px-5 pt-5 pb-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-[22px] font-semibold text-text">Lücken füllen</h1>
        <span className="text-[13px] text-muted">Runde {index + 1} von {saetze.length}</span>
      </div>

      <div className="flex justify-center gap-1.5 mb-6">
        {saetze.map((_, i) => (
          <span
            key={i}
            className={`rounded-full transition-all duration-200 ${
              i === index ? 'w-5 h-2 bg-accent' : i < index ? 'w-2 h-2 bg-[#C2553D]/30' : 'w-2 h-2 bg-[#E0DDD8]'
            }`}
          />
        ))}
      </div>

      <Card className="fade-in" key={index}>
        <div className="flex flex-col items-center gap-4 py-2">
          {renderSatzWithGap(satz.satz, satz.loesung, result !== null)}
          <p className="text-[13px] text-muted italic">{satz.hilfe_de}</p>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {result === null ? (
            <>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
                placeholder="Auf Spanisch tippen…"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                className="w-full bg-white border border-[#E0DDD8] rounded-btn px-4 py-3 text-base text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                style={{
                  borderColor: result === null ? undefined : '#C2553D',
                }}
              />
              <Button variant="primary" fullWidth onClick={handleSubmit} disabled={!input.trim()}>
                Prüfen
              </Button>
            </>
          ) : (
            <>
              <div
                className={`rounded-btn px-4 py-3 text-sm font-medium ${
                  result === 'wrong'
                    ? 'bg-[#F5F1EB] text-muted border border-[#E0DDD8]'
                    : 'bg-[#FBF0EE] text-accent border border-accent/30'
                }`}
              >
                {result === 'correct' && <span>Richtig: <span className="font-semibold">{satz.loesung}</span></span>}
                {result === 'close' && <span>Fast! Die Antwort: <span className="font-semibold">{satz.loesung}</span></span>}
                {result === 'wrong' && <span>Die Antwort: <span className="font-semibold text-text">{satz.loesung}</span></span>}
              </div>
              <Button variant={isLastRound ? 'primary' : 'secondary'} fullWidth onClick={handleWeiter}>
                {isLastRound ? 'Fertig' : 'Weiter →'}
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
