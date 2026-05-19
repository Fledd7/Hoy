import { useRef, useState } from 'react'
import type { Lesson, QuizQuestion, VocabItem } from '../lib/types'
import VocabTap from './VocabTap'
import Button from './Button'
import Card from './Card'
import { getVocabLevel, getAllTrackedVocab, recordVocabAnswer } from '../lib/vocabTracking'
import { isCloseMatch } from '../lib/stringUtils'

interface LessonViewProps {
  lesson: Lesson
  onFinish: () => void
}

export default function LessonView({ lesson, onFinish }: LessonViewProps) {
  if (lesson.mode === 'muede') return <TiredView lesson={lesson} onFinish={onFinish} />
  if (lesson.mode === 'okay') return <OkayView lesson={lesson} onFinish={onFinish} />
  if (lesson.mode === 'fit')  return <FitView lesson={lesson} onFinish={onFinish} />
  return <ErzaehlView lesson={lesson} onFinish={onFinish} />
}

// ─── Inline vocab helpers ────────────────────────────────────────────────────

interface Segment {
  text: string
  de?: string
  key?: string
}

function stripArticle(es: string): string {
  return es.replace(/^(el|la|los|las|un|una)\s+/i, '').trim()
}

function splitTextWithVocab(text: string, vocab: { es: string; de: string }[]): Segment[] {
  const terms = vocab
    .map(v => ({ base: stripArticle(v.es), de: v.de, key: v.es }))
    .sort((a, b) => b.base.length - a.base.length)

  const escapedPatterns = terms.map(t => {
    const words = t.base.split(' ').map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    words[words.length - 1] += '[a-záéíóúüñ]*'
    return words.join(' ')
  })

  const combined = new RegExp(`(${escapedPatterns.join('|')})`, 'gi')
  const parts = text.split(combined)

  return parts
    .filter(p => p.length > 0)
    .map(part => {
      const matched = terms.find(t => {
        const words = t.base.split(' ').map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        words[words.length - 1] += '[a-záéíóúüñ]*'
        return new RegExp(`^${words.join(' ')}$`, 'i').test(part)
      })
      return matched ? { text: part, de: matched.de, key: matched.key } : { text: part }
    })
}

function truncateToTwoSentences(text: string): string {
  const match = text.match(/^[^.!?]*[.!?](?:\s+[^.!?]*[.!?])?/)
  return match ? match[0] : text
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function TranslationToggle({ text, show, onToggle }: { text: string; show: boolean; onToggle: () => void }) {
  return (
    <>
      <button
        onClick={onToggle}
        className="mt-3 text-[14px] text-muted underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
      >
        {show ? 'Übersetzung verbergen' : 'Ich brauche die Übersetzung'}
      </button>
      {show && (
        <p className="text-muted text-base leading-relaxed mt-2 fade-in">{text}</p>
      )}
    </>
  )
}

function LineChevron({ open, onToggle, label }: { open: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      onClick={onToggle}
      aria-label={label}
      className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-muted tap-scale focus-visible:outline-none"
    >
      <span
        className="text-[11px] inline-block transition-transform duration-200"
        style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
      >
        ▼
      </span>
    </button>
  )
}

// ─── Vocab distractor helper ─────────────────────────────────────────────────

const FALLBACK_DISTRACTORS = ['casa', 'agua', 'tiempo', 'bueno', 'amigo', 'trabajar', 'comer', 'hablar']

function getDistractors(correctEs: string): [string, string] {
  const tracking = getAllTrackedVocab()
  const pool = Object.values(tracking)
    .filter(e => e.es !== correctEs)
    .map(e => e.es)

  const result: string[] = []
  const available = [...pool]
  while (result.length < 2 && available.length > 0) {
    const idx = Math.floor(Math.random() * available.length)
    result.push(available[idx])
    available.splice(idx, 1)
  }

  let fi = 0
  while (result.length < 2 && fi < FALLBACK_DISTRACTORS.length) {
    const w = FALLBACK_DISTRACTORS[fi]
    if (w !== correctEs && !result.includes(w)) result.push(w)
    fi++
  }

  return [result[0] ?? 'algo', result[1] ?? 'nada']
}

// ─── Tired Mode Vocab Cards ───────────────────────────────────────────────────

function FlipCard({ item, onNext, isLast, onFinish }: { item: VocabItem; onNext: () => void; isLast: boolean; onFinish: () => void }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div className="flex flex-col gap-4 fade-in">
      <div
        className="cursor-pointer select-none"
        style={{ perspective: '1000px' }}
        onClick={() => { if (!flipped) { navigator.vibrate?.(8); setFlipped(true) } }}
      >
        <div
          className="relative min-h-[180px]"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 350ms ease-out',
          }}
        >
          <div
            className="bg-white rounded-[20px] border border-[#E2D7C8]/50 px-6 py-10 min-h-[180px] flex flex-col items-center justify-center shadow-card"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-2xl font-semibold text-text text-center">{item.es}</p>
            <p className="text-xs text-muted mt-3">Tippe zum Aufdecken</p>
          </div>
          <div
            className="absolute inset-0 bg-white rounded-[20px] border border-[#E2D7C8]/50 px-6 py-10 flex flex-col items-center justify-center shadow-card"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-sm text-muted text-center mb-2">{item.es}</p>
            <p className="text-2xl font-semibold text-text text-center">{item.de}</p>
          </div>
        </div>
      </div>
      {flipped && (
        <Button
          variant={isLast ? 'primary' : 'secondary'}
          fullWidth
          onClick={isLast ? onFinish : onNext}
        >
          {isLast ? 'Fertig' : 'Weiter →'}
        </Button>
      )}
    </div>
  )
}

function McqVocabCard({ item, onNext, isLast, onFinish }: { item: VocabItem; onNext: () => void; isLast: boolean; onFinish: () => void }) {
  const [distractors] = useState(() => getDistractors(item.es))
  const [options] = useState<string[]>(() => {
    const opts = [item.es, distractors[0], distractors[1]]
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]]
    }
    return opts
  })
  const [selected, setSelected] = useState<number | null>(null)

  const answered = selected !== null

  function handleSelect(idx: number) {
    if (answered) return
    const correct = options[idx] === item.es
    navigator.vibrate?.(correct ? 10 : 5)
    setSelected(idx)
    recordVocabAnswer(item.es, correct)
  }

  return (
    <Card className="fade-in flex flex-col gap-4">
      <p className="text-[13px] text-muted uppercase tracking-wide">Wie heißt das auf Spanisch?</p>
      <p className="text-xl font-semibold text-text">{item.de}</p>
      <div className="flex flex-col gap-2">
        {options.map((opt, idx) => {
          const isCorrect = opt === item.es
          let style = 'border border-[#E0DDD8] text-text'
          if (answered) {
            if (isCorrect) style = 'border-2 border-accent text-accent bg-[#FBF0EE]'
            else if (idx === selected) style = 'border border-[#E0DDD8] text-muted line-through'
          } else if (idx === selected) {
            style = 'border-2 border-accent text-accent bg-[#FBF0EE]'
          }
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`w-full text-left px-4 py-3 rounded-btn text-sm tap-scale ${style} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
            >
              {opt}
            </button>
          )
        })}
      </div>
      {answered && (
        <Button
          variant={isLast ? 'primary' : 'secondary'}
          fullWidth
          onClick={isLast ? onFinish : onNext}
        >
          {isLast ? 'Fertig' : 'Weiter →'}
        </Button>
      )}
    </Card>
  )
}

function TypeVocabCard({ item, onNext, isLast, onFinish }: { item: VocabItem; onNext: () => void; isLast: boolean; onFinish: () => void }) {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<'correct' | 'close' | 'wrong' | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const targetBase = stripArticle(item.es)

  function handleSubmit() {
    if (!input.trim()) return
    const trimmed = input.trim()
    const exact = isCloseMatch(trimmed, item.es) || isCloseMatch(trimmed, targetBase)
    const close = !exact && (
      isCloseMatch(trimmed, item.es.split(' ').pop() ?? item.es) ||
      isCloseMatch(trimmed, targetBase.split(' ').pop() ?? targetBase)
    )
    const res = exact ? 'correct' : close ? 'close' : 'wrong'
    setResult(res)
    recordVocabAnswer(item.es, res === 'correct' || res === 'close')
    navigator.vibrate?.(res === 'correct' ? 10 : 5)
  }

  return (
    <Card className="fade-in flex flex-col gap-4">
      <p className="text-[13px] text-muted uppercase tracking-wide">Wie heißt das auf Spanisch?</p>
      <p className="text-xl font-semibold text-text">{item.de}</p>
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
          />
          <Button variant="primary" fullWidth onClick={handleSubmit} disabled={!input.trim()}>
            Prüfen
          </Button>
        </>
      ) : (
        <>
          <div className={`rounded-btn px-4 py-3 text-sm font-medium ${result === 'correct' ? 'bg-[#FBF0EE] text-accent border border-accent/30' : result === 'close' ? 'bg-[#FBF0EE] text-accent border border-accent/30' : 'bg-[#F5F1EB] text-muted border border-[#E0DDD8]'}`}>
            {result === 'correct' && <span>Richtig: <span className="font-semibold">{item.es}</span></span>}
            {result === 'close' && <span>Fast! Die Antwort: <span className="font-semibold">{item.es}</span></span>}
            {result === 'wrong' && <span>Die Antwort: <span className="font-semibold text-text">{item.es}</span></span>}
          </div>
          <Button
            variant={isLast ? 'primary' : 'secondary'}
            fullWidth
            onClick={isLast ? onFinish : onNext}
          >
            {isLast ? 'Fertig' : 'Weiter →'}
          </Button>
        </>
      )}
    </Card>
  )
}

function TiredVocabStep({ vocab, onFinish }: { vocab: VocabItem[]; onFinish: () => void }) {
  const [index, setIndex] = useState(0)

  if (vocab.length === 0) {
    return (
      <Button variant="primary" fullWidth onClick={onFinish}>
        Fertig
      </Button>
    )
  }

  if (index >= vocab.length) {
    return (
      <div className="flex flex-col gap-3 fade-in">
        <p className="text-xs text-muted text-center">Alle Vokabeln durch</p>
        <Button variant="primary" fullWidth onClick={() => { navigator.vibrate?.(10); onFinish() }}>
          Fertig
        </Button>
      </div>
    )
  }

  const item = vocab[index]
  const level = getVocabLevel(item.es)
  const isLast = index === vocab.length - 1
  const cardProps = { item, onNext: () => setIndex(i => i + 1), isLast, onFinish }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center gap-1.5 items-center">
        {vocab.map((_, i) => (
          <span
            key={i}
            className={`rounded-full transition-all duration-200 ${
              i === index ? 'w-5 h-2 bg-accent' : i < index ? 'w-2 h-2 bg-[#C2553D]/30' : 'w-2 h-2 bg-[#E0DDD8]'
            }`}
          />
        ))}
      </div>
      {level === 'vertraut' ? (
        <TypeVocabCard {...cardProps} />
      ) : level === 'lerntief' ? (
        <McqVocabCard {...cardProps} />
      ) : (
        <FlipCard {...cardProps} />
      )}
    </div>
  )
}

// ─── Views ───────────────────────────────────────────────────────────────────

function TiredView({ lesson, onFinish }: { lesson: Extract<Lesson, { mode: 'muede' }>; onFinish: () => void }) {
  const [step, setStep] = useState<1 | 2>(1)
  const [showTranslation, setShowTranslation] = useState(false)
  const truncatedText = truncateToTwoSentences(lesson.text)
  const truncatedTranslation = truncateToTwoSentences(lesson.translation)
  const segments = splitTextWithVocab(truncatedText, lesson.vocab)
  const hasVocab = lesson.vocab.length > 0

  if (step === 2) {
    return (
      <div className="fade-in flex flex-col gap-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-accent uppercase tracking-wide">Schritt 2 von 2</span>
          <span className="text-xs text-muted">Vokabeln</span>
        </div>
        <TiredVocabStep vocab={lesson.vocab} onFinish={onFinish} />
      </div>
    )
  }

  return (
    <div className="fade-in flex flex-col gap-6">
      <div>
        {hasVocab && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-accent uppercase tracking-wide">Schritt 1 von 2</span>
            <span className="text-xs text-muted">Text</span>
          </div>
        )}
        <h2 className="text-[20px] text-text font-semibold">Heute ganz leicht</h2>
        <p className="text-[14px] text-muted mt-1">
          Lies den Text. Tippe auf markierte Wörter für die Übersetzung.
        </p>
      </div>
      <Card accent className="enter-up" style={{ animationDelay: '40ms' }}>
        <div className="text-lg leading-relaxed text-text font-medium">
          {segments.map((seg, i) =>
            seg.de && seg.key ? (
              <VocabTap key={i} es={seg.text} de={seg.de} />
            ) : (
              <span key={i}>{seg.text}</span>
            )
          )}
        </div>
        <TranslationToggle
          text={truncatedTranslation}
          show={showTranslation}
          onToggle={() => setShowTranslation(s => !s)}
        />
      </Card>
      <Button
        variant="primary"
        fullWidth
        onClick={hasVocab ? () => setStep(2) : onFinish}
        className="enter-up"
        style={{ animationDelay: '120ms' }}
      >
        {hasVocab ? 'Weiter zu den Vokabeln' : 'Reicht für heute'}
      </Button>
    </div>
  )
}

function OkayView({ lesson, onFinish }: { lesson: Extract<Lesson, { mode: 'okay' }>; onFinish: () => void }) {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [checked, setChecked] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)

  const allAnswered = lesson.questions.every((_, i) => answers[i] !== undefined)

  function handleCheck() {
    if (allAnswered) setChecked(true)
  }

  function handleFinish() {
    navigator.vibrate?.(10)
    onFinish()
  }

  return (
    <div className="fade-in flex flex-col gap-6">
      <Card accent className="enter-up" style={{ animationDelay: '40ms' }}>
        <p className="text-lg leading-relaxed text-text font-medium">{lesson.text}</p>
        <TranslationToggle
          text={lesson.translation}
          show={showTranslation}
          onToggle={() => setShowTranslation(s => !s)}
        />
      </Card>
      <div className="flex flex-col gap-5">
        {lesson.questions.map((q, qi) => (
          <QuizCard
            key={qi}
            question={q}
            selected={answers[qi]}
            checked={checked}
            onSelect={(idx) => {
              if (checked) return
              setAnswers((a) => ({ ...a, [qi]: idx }))
            }}
            style={{ animationDelay: `${(qi + 1) * 80}ms` }}
          />
        ))}
      </div>
      {!checked ? (
        <Button variant="primary" fullWidth onClick={handleCheck} disabled={!allAnswered}>
          Auswerten
        </Button>
      ) : (
        <Button variant="primary" fullWidth onClick={handleFinish}>
          Fertig
        </Button>
      )}
    </div>
  )
}

function QuizCard({
  question,
  selected,
  checked,
  onSelect,
  style,
}: {
  question: QuizQuestion
  selected: number | undefined
  checked: boolean
  onSelect: (idx: number) => void
  style?: React.CSSProperties
}) {
  function handleOptionClick(idx: number) {
    if (checked) return
    navigator.vibrate?.(8)
    onSelect(idx)
  }

  return (
    <Card className="enter-up" style={style}>
      <p className="text-base font-medium text-text mb-3">{question.question}</p>
      <div className="flex flex-col gap-2">
        {question.options.map((opt, idx) => {
          let optStyle = 'border border-[#E0DDD8] text-text'

          if (checked) {
            if (idx === question.correctIndex) {
              optStyle = 'border-2 border-accent text-accent bg-[#FBF0EE] correct-glow'
            } else if (idx === selected) {
              optStyle = 'border border-[#E0DDD8] text-muted line-through'
            }
          } else if (idx === selected) {
            optStyle = 'border-2 border-accent text-accent bg-[#FBF0EE]'
          }

          return (
            <button
              key={idx}
              onClick={() => handleOptionClick(idx)}
              className={`w-full text-left px-4 py-3 rounded-btn text-sm tap-scale ${optStyle} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </Card>
  )
}

// ─── Fit Dialog Card ──────────────────────────────────────────────────────────

function FitDialogCard({ dialog }: { dialog: { speaker: string; es: string; de: string }[] }) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set())

  const allVisible = revealed.size === dialog.length

  function toggleLine(i: number) {
    setRevealed(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  function toggleAll() {
    setRevealed(allVisible ? new Set() : new Set(dialog.map((_, i) => i)))
  }

  return (
    <Card accent className="enter-up" style={{ animationDelay: '40ms' }}>
      <div className="flex justify-end mb-3">
        <button
          onClick={toggleAll}
          className="text-[12px] text-muted underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          {allVisible ? 'Übersetzungen verbergen' : 'Alle Übersetzungen zeigen'}
        </button>
      </div>
      <div className="flex flex-col gap-4">
        {dialog.map((line, i) => (
          <div key={i}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-accent uppercase tracking-wide">{line.speaker}</span>
                <p className="text-base text-text mt-0.5">{line.es}</p>
              </div>
              <LineChevron
                open={revealed.has(i)}
                onToggle={() => toggleLine(i)}
                label={revealed.has(i) ? 'Übersetzung verbergen' : 'Übersetzung zeigen'}
              />
            </div>
            {revealed.has(i) && (
              <p className="text-sm text-muted mt-1 fade-in">{line.de}</p>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── Fit Vocab Input ──────────────────────────────────────────────────────────

function FitVocabInput({ vocab, onFinish }: { vocab: VocabItem[]; onFinish: () => void }) {
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [result, setResult] = useState<'correct' | 'close' | 'wrong' | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const done = index >= vocab.length

  function advance() {
    setIndex(i => i + 1)
    setInput('')
    setResult(null)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleSubmit() {
    if (!input.trim() || result !== null) return
    const item = vocab[index]
    const trimmed = input.trim()
    const targetBase = stripArticle(item.es)
    const exact = isCloseMatch(trimmed, item.es) || isCloseMatch(trimmed, targetBase)
    const close = !exact && (
      isCloseMatch(trimmed, item.es.split(' ').pop() ?? item.es) ||
      isCloseMatch(trimmed, targetBase.split(' ').pop() ?? targetBase)
    )
    const res = exact ? 'correct' : close ? 'close' : 'wrong'
    setResult(res)
    recordVocabAnswer(item.es, res === 'correct' || res === 'close')
    navigator.vibrate?.(res === 'correct' ? 10 : 5)
  }

  if (done) {
    return (
      <div className="flex flex-col gap-3 fade-in">
        <p className="text-xs text-muted text-center">Alle Vokabeln geübt</p>
        <Button variant="primary" fullWidth onClick={() => { navigator.vibrate?.(10); onFinish() }}>
          Fertig
        </Button>
      </div>
    )
  }

  const item = vocab[index]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center gap-1.5 items-center">
        {vocab.map((_, i) => (
          <span
            key={i}
            className={`rounded-full transition-all duration-200 ${
              i === index ? 'w-5 h-2 bg-accent' : i < index ? 'w-2 h-2 bg-[#C2553D]/30' : 'w-2 h-2 bg-[#E0DDD8]'
            }`}
          />
        ))}
      </div>

      <Card className="fade-in" key={index}>
        <p className="text-[13px] text-muted uppercase tracking-wide mb-2">Wie heißt das auf Spanisch?</p>
        <p className="text-xl font-semibold text-text mb-4">{item.de}</p>

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
              className="w-full bg-white border border-[#E0DDD8] rounded-btn px-4 py-3 text-base text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent mb-3"
            />
            <Button variant="primary" fullWidth onClick={handleSubmit} disabled={!input.trim()}>
              Prüfen
            </Button>
          </>
        ) : (
          <>
            <div className={`rounded-btn px-4 py-3 text-sm font-medium mb-3 ${result === 'correct' || result === 'close' ? 'bg-[#FBF0EE] text-accent border border-accent/30' : 'bg-[#F5F1EB] text-muted border border-[#E0DDD8]'}`}>
              {result === 'correct' && <span>Richtig: <span className="font-semibold">{item.es}</span></span>}
              {result === 'close' && <span>Fast! Die Antwort: <span className="font-semibold">{item.es}</span></span>}
              {result === 'wrong' && <span>Die Antwort: <span className="font-semibold text-text">{item.es}</span></span>}
            </div>
            <Button
              variant={index === vocab.length - 1 ? 'primary' : 'secondary'}
              fullWidth
              onClick={index === vocab.length - 1 ? () => { navigator.vibrate?.(10); onFinish() } : advance}
            >
              {index === vocab.length - 1 ? 'Fertig' : 'Weiter →'}
            </Button>
          </>
        )}
      </Card>
    </div>
  )
}

function FitView({ lesson, onFinish }: { lesson: Extract<Lesson, { mode: 'fit' }>; onFinish: () => void }) {
  const [step, setStep] = useState<1 | 2>(1)

  return (
    <div className="fade-in flex flex-col gap-6">
      {step === 1 ? (
        <>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-accent uppercase tracking-wide">Schritt 1 von 2</span>
            <span className="text-xs text-muted">Dialog</span>
          </div>
          <FitDialogCard dialog={lesson.dialog} />
          <Button
            variant="primary"
            fullWidth
            onClick={() => setStep(2)}
            className="enter-up"
            style={{ animationDelay: '120ms' }}
          >
            Weiter zu den Vokabeln
          </Button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-accent uppercase tracking-wide">Schritt 2 von 2</span>
            <span className="text-xs text-muted">Vokabeln</span>
          </div>
          <FitVocabInput vocab={lesson.vocab} onFinish={onFinish} />
        </>
      )}
    </div>
  )
}

function ErzaehlView({ lesson, onFinish }: { lesson: Extract<Lesson, { mode: 'erzaehl' }>; onFinish: () => void }) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set())

  const allVisible = revealed.size === lesson.saetze.length

  function toggleLine(i: number) {
    setRevealed(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  function handleFinish() {
    navigator.vibrate?.(10)
    onFinish()
  }

  return (
    <div className="fade-in flex flex-col gap-6">
      <Card accent className="enter-up" style={{ animationDelay: '40ms' }}>
        <div className="flex justify-end mb-3">
          <button
            onClick={() => setRevealed(allVisible ? new Set() : new Set(lesson.saetze.map((_, i) => i)))}
            className="text-[12px] text-muted underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            {allVisible ? 'Übersetzungen verbergen' : 'Alle Übersetzungen zeigen'}
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {lesson.saetze.map((s, i) => (
            <div key={i}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-base text-text font-medium flex-1 min-w-0">{s.es}</p>
                <LineChevron
                  open={revealed.has(i)}
                  onToggle={() => toggleLine(i)}
                  label={revealed.has(i) ? 'Übersetzung verbergen' : 'Übersetzung zeigen'}
                />
              </div>
              {revealed.has(i) && (
                <p className="text-sm text-muted mt-0.5 fade-in">{s.de}</p>
              )}
            </div>
          ))}
        </div>
      </Card>
      <Button
        variant="primary"
        fullWidth
        onClick={handleFinish}
        className="enter-up"
        style={{ animationDelay: '120ms' }}
      >
        Fertig
      </Button>
    </div>
  )
}
