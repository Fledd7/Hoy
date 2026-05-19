import { useState } from 'react'
import type { Lesson, QuizQuestion } from '../lib/types'
import { getVocabLevel, recordVocabAnswer } from '../lib/vocabTracking'
import { isCloseMatch } from '../lib/stringUtils'
import VocabTap from './VocabTap'
import Button from './Button'
import Card from './Card'

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

// ─── Tired View ───────────────────────────────────────────────────────────────

function FlipCard({ es, de, onResult }: { es: string; de: string; onResult: (correct: boolean) => void }) {
  const [flipped, setFlipped] = useState(false)
  const [answered, setAnswered] = useState(false)

  function handleFlip() {
    if (!flipped) setFlipped(true)
  }

  function handleAnswer(correct: boolean) {
    if (answered) return
    setAnswered(true)
    recordVocabAnswer(es, correct)
    setTimeout(() => onResult(correct), 400)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="cursor-pointer select-none" onClick={handleFlip} style={{ perspective: '1000px' }}>
        <div
          className="relative min-h-[160px]"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 400ms ease-out',
          }}
        >
          <div
            className="bg-white rounded-[20px] border border-[#E2D7C8]/50 px-6 py-8 min-h-[160px] flex flex-col items-center justify-center shadow-card"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-2xl font-semibold text-text text-center">{es}</p>
            <p className="text-xs text-muted mt-3">Tippe zum Aufdecken</p>
          </div>
          <div
            className="absolute inset-0 bg-white rounded-[20px] border border-[#E2D7C8]/50 px-6 py-8 flex flex-col items-center justify-center shadow-card"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-sm text-muted text-center mb-2">{es}</p>
            <p className="text-2xl font-semibold text-text text-center">{de}</p>
          </div>
        </div>
      </div>
      {flipped && !answered && (
        <div className="flex gap-2 fade-in">
          <button
            onClick={() => handleAnswer(false)}
            className="flex-1 py-3 rounded-btn border border-[#E0DDD8] text-muted text-sm tap-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Nochmal
          </button>
          <button
            onClick={() => handleAnswer(true)}
            className="flex-1 py-3 rounded-btn bg-accent text-white text-sm font-semibold tap-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Gewusst
          </button>
        </div>
      )}
    </div>
  )
}

function McqVocabCard({ es, de, allVocab, onResult }: {
  es: string; de: string
  allVocab: { es: string; de: string }[]
  onResult: (correct: boolean) => void
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)

  const distractors = allVocab.filter(v => v.es !== es).map(v => v.de)
  const shuffledDistractors = distractors.sort(() => Math.random() - 0.5).slice(0, 2)
  const [options] = useState<{ de: string; correct: boolean }[]>(() => {
    const opts = [{ de, correct: true }, ...shuffledDistractors.map(d => ({ de: d, correct: false }))]
    return opts.sort(() => Math.random() - 0.5)
  })

  function handleSelect(idx: number) {
    if (checked) return
    setSelected(idx)
    setChecked(true)
    const correct = options[idx].correct
    recordVocabAnswer(es, correct)
    setTimeout(() => onResult(correct), 800)
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xl font-semibold text-text text-center py-4">{es}</p>
      <div className="flex flex-col gap-2">
        {options.map((opt, idx) => {
          let cls = 'border border-[#E0DDD8] text-text'
          if (checked) {
            if (opt.correct) cls = 'border-2 border-accent text-accent bg-[#FBF0EE]'
            else if (idx === selected) cls = 'border border-[#E0DDD8] text-muted line-through'
          } else if (idx === selected) {
            cls = 'border-2 border-accent text-accent bg-[#FBF0EE]'
          }
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`w-full text-left px-4 py-3 rounded-btn text-sm tap-scale ${cls} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
            >
              {opt.de}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TypeVocabCard({ es, de, onResult }: { es: string; de: string; onResult: (correct: boolean) => void }) {
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [correct, setCorrect] = useState(false)

  function handleSubmit() {
    if (submitted) return
    const isCorrect = isCloseMatch(input.trim(), es)
    setCorrect(isCorrect)
    setSubmitted(true)
    recordVocabAnswer(es, isCorrect)
    if (isCorrect) setTimeout(() => onResult(true), 800)
  }

  function handleGiveUp() {
    if (submitted) return
    setCorrect(false)
    setSubmitted(true)
    recordVocabAnswer(es, false)
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xl font-semibold text-text text-center py-4">{de}</p>
      <p className="text-sm text-muted text-center">Schreib das spanische Wort</p>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
        disabled={submitted}
        placeholder="Deine Antwort..."
        className={`w-full border rounded-card px-4 py-3 text-base text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent ${
          submitted
            ? correct
              ? 'border-accent bg-[#FBF0EE]'
              : 'border-red-300 bg-red-50'
            : 'border-[#E0DDD8] bg-white'
        }`}
      />
      {submitted && !correct && (
        <p className="text-sm text-muted fade-in">Richtig: <span className="font-semibold text-text">{es}</span></p>
      )}
      {!submitted && (
        <>
          <Button variant="primary" fullWidth onClick={handleSubmit} disabled={!input.trim()}>
            Prüfen
          </Button>
          <button
            onClick={handleGiveUp}
            className="text-sm text-[#6B6B6B] underline underline-offset-2 text-center mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            Ich weiß es nicht
          </button>
        </>
      )}
      {submitted && !correct && (
        <Button variant="primary" fullWidth onClick={() => onResult(false)}>
          Weiter
        </Button>
      )}
    </div>
  )
}

function TiredVocabStep({ vocab, onFinish }: { vocab: { es: string; de: string }[]; onFinish: () => void }) {
  const [index, setIndex] = useState(0)

  function handleResult(_correct: boolean) {
    if (index + 1 >= vocab.length) {
      onFinish()
    } else {
      setIndex(i => i + 1)
    }
  }

  if (vocab.length === 0) {
    return (
      <Button variant="primary" fullWidth onClick={() => { navigator.vibrate?.(10); onFinish() }}>
        Reicht für heute
      </Button>
    )
  }

  const item = vocab[index]
  const level = getVocabLevel(item.es)

  return (
    <div className="flex flex-col gap-4 fade-in">
      <div className="flex justify-between items-center">
        <p className="text-[13px] text-muted">Vokabeln {index + 1} / {vocab.length}</p>
      </div>
      {level === 'neu' ? (
        <FlipCard key={item.es} es={item.es} de={item.de} onResult={handleResult} />
      ) : level === 'lerntief' ? (
        <McqVocabCard key={item.es} es={item.es} de={item.de} allVocab={vocab} onResult={handleResult} />
      ) : (
        <TypeVocabCard key={item.es} es={item.es} de={item.de} onResult={handleResult} />
      )}
    </div>
  )
}

function TiredView({ lesson, onFinish }: { lesson: Extract<Lesson, { mode: 'muede' }>; onFinish: () => void }) {
  const [step, setStep] = useState<1 | 2>(1)
  const [showTranslation, setShowTranslation] = useState(false)
  const truncatedText = truncateToTwoSentences(lesson.text)
  const truncatedTranslation = truncateToTwoSentences(lesson.translation)
  const segments = splitTextWithVocab(truncatedText, lesson.vocab)

  if (step === 2) {
    return (
      <div className="fade-in flex flex-col gap-6">
        <TiredVocabStep vocab={lesson.vocab} onFinish={() => { navigator.vibrate?.(10); onFinish() }} />
      </div>
    )
  }

  return (
    <div className="fade-in flex flex-col gap-6">
      <div>
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
        onClick={() => setStep(2)}
        className="enter-up"
        style={{ animationDelay: '120ms' }}
      >
        Weiter zu den Vokabeln
      </Button>
    </div>
  )
}

// ─── Okay View ────────────────────────────────────────────────────────────────

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
  return (
    <Card className="enter-up" style={style}>
      <p className="text-base font-medium text-text mb-3">{question.question}</p>
      <div className="flex flex-col gap-2">
        {question.options.map((opt, idx) => {
          let optStyle = 'border border-[#E0DDD8] text-text'
          let extraClass = ''

          if (checked) {
            if (idx === question.correctIndex) {
              optStyle = 'border-2 border-accent text-accent bg-[#FBF0EE]'
              extraClass = 'correct-glow'
            } else if (idx === selected) {
              optStyle = 'border border-[#E0DDD8] text-muted line-through'
            }
          } else if (idx === selected) {
            optStyle = 'border-2 border-accent text-accent bg-[#FBF0EE]'
          }

          return (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              className={`w-full text-left px-4 py-3 rounded-btn text-sm tap-scale ${optStyle} ${extraClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </Card>
  )
}

// ─── Fit View ─────────────────────────────────────────────────────────────────

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

function FitVocabInput({ vocab, onFinish }: { vocab: { es: string; de: string }[]; onFinish: () => void }) {
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [correct, setCorrect] = useState(false)

  const done = index >= vocab.length

  function handleSubmit() {
    if (submitted) return
    const item = vocab[index]
    const isCorrect = isCloseMatch(input.trim(), item.de)
    setCorrect(isCorrect)
    setSubmitted(true)
    recordVocabAnswer(item.es, isCorrect)
  }

  function handleGiveUp() {
    if (submitted) return
    const item = vocab[index]
    setCorrect(false)
    setSubmitted(true)
    recordVocabAnswer(item.es, false)
  }

  function handleNext() {
    if (index + 1 >= vocab.length) {
      navigator.vibrate?.(10)
      onFinish()
    } else {
      setIndex(i => i + 1)
      setInput('')
      setSubmitted(false)
      setCorrect(false)
    }
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
      <div className="flex justify-center gap-1.5 items-center mb-1">
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
        <p className="text-xl font-semibold text-text text-center pb-2">{item.es}</p>
        <p className="text-sm text-muted text-center mb-4">Wie heißt das auf Deutsch?</p>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !submitted) handleSubmit() }}
          disabled={submitted}
          placeholder="Deine Antwort..."
          autoFocus
          className={`w-full border rounded-card px-4 py-3 text-base text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent ${
            submitted
              ? correct
                ? 'border-accent bg-[#FBF0EE]'
                : 'border-red-300 bg-red-50'
              : 'border-[#E0DDD8] bg-white'
          }`}
        />
        {submitted && !correct && (
          <p className="text-sm text-muted mt-2 fade-in">Richtig: <span className="font-semibold text-text">{item.de}</span></p>
        )}
      </Card>
      {!submitted ? (
        <>
          <Button variant="primary" fullWidth onClick={handleSubmit} disabled={!input.trim()}>
            Prüfen
          </Button>
          <button
            onClick={handleGiveUp}
            className="text-sm text-[#6B6B6B] underline underline-offset-2 text-center mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            Ich weiß es nicht
          </button>
        </>
      ) : (
        <Button variant={index === vocab.length - 1 ? 'primary' : 'secondary'} fullWidth onClick={handleNext}>
          {index === vocab.length - 1 ? 'Fertig' : 'Weiter →'}
        </Button>
      )}
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

// ─── Erzähl View ──────────────────────────────────────────────────────────────

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
