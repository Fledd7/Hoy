import { useRef, useState } from 'react'
import type { Lesson, QuizQuestion } from '../lib/types'
import VocabTap from './VocabTap'
import Button from './Button'
import Card from './Card'

interface LessonViewProps {
  lesson: Lesson
  onFinish: () => void
  etappeNummer?: number
}

export default function LessonView({ lesson, onFinish, etappeNummer }: LessonViewProps) {
  if (lesson.mode === 'muede') return <TiredView lesson={lesson} onFinish={onFinish} etappeNummer={etappeNummer} />
  if (lesson.mode === 'okay') return <OkayView lesson={lesson} onFinish={onFinish} />
  if (lesson.mode === 'fit')  return <FitView lesson={lesson} onFinish={onFinish} etappeNummer={etappeNummer} />
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

// ─── Views ───────────────────────────────────────────────────────────────────

function TiredView({
  lesson,
  onFinish,
  etappeNummer,
}: {
  lesson: Extract<Lesson, { mode: 'muede' }>
  onFinish: () => void
  etappeNummer?: number
}) {
  const [showTranslation, setShowTranslation] = useState(false)

  // Etappe 1: Vokabel-Karten statt Lesetext
  if (etappeNummer === 1) {
    return (
      <div className="fade-in flex flex-col gap-6">
        <div>
          <h2 className="text-[20px] text-text font-semibold">Neue Vokabeln</h2>
          <p className="text-[14px] text-muted mt-1">
            Tippe auf die Karte, um die Übersetzung zu sehen.
          </p>
        </div>
        {lesson.text && (
          <p className="font-serif text-[18px] text-text text-center italic">{lesson.text}</p>
        )}
        <FitVocabSwipe vocab={lesson.vocab} onFinish={onFinish} />
      </div>
    )
  }

  const truncatedText = truncateToTwoSentences(lesson.text)
  const truncatedTranslation = truncateToTwoSentences(lesson.translation)
  const segments = splitTextWithVocab(truncatedText, lesson.vocab)

  function handleFinish() {
    navigator.vibrate?.(10)
    onFinish()
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
        onClick={handleFinish}
        className="enter-up"
        style={{ animationDelay: '120ms' }}
      >
        Reicht für heute
      </Button>
    </div>
  )
}

// ─── MCQ micro-reward constants ───────────────────────────────────────────────

const CORRECT_TEXTS = ['¡bien!', '¡perfecto!', '¡muy bien!', '¡exacto!', '¡eso es!']

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
  const [microReward, setMicroReward] = useState<{ idx: number; text: string; isCorrect: boolean } | null>(null)

  function handleOptionClick(idx: number) {
    onSelect(idx)
    if (checked || microReward !== null) return
    const isCorrect = idx === question.correctIndex
    navigator.vibrate?.(isCorrect ? 10 : 5)
    const text = isCorrect ? CORRECT_TEXTS[Math.floor(Math.random() * CORRECT_TEXTS.length)] : ''
    setMicroReward({ idx, text, isCorrect })
    setTimeout(() => setMicroReward(null), isCorrect ? 600 : 400)
  }

  return (
    <Card className="enter-up relative overflow-visible" style={style}>
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

          // Micro-reward overlay styles (before auswerten)
          if (!checked && microReward?.idx === idx) {
            if (microReward.isCorrect) {
              extraClass += ' correct-glow'
            } else {
              extraClass += ' wrong-flash'
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleOptionClick(idx)}
              className={`w-full text-left px-4 py-3 rounded-btn text-sm tap-scale ${optStyle} ${extraClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
            >
              {opt}
            </button>
          )
        })}
      </div>
      {microReward?.isCorrect && (
        <span className="bubble-in absolute -top-3 right-3 z-10 bg-accent text-white text-[12px] font-semibold px-3 py-1 rounded-full pointer-events-none whitespace-nowrap shadow-[0_2px_8px_rgba(194,85,61,0.4)]">
          {microReward.text}
        </span>
      )}
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

// ─── Fit Vocab Swipe with 3D flip ─────────────────────────────────────────────

function FitVocabSwipe({ vocab, onFinish }: { vocab: { es: string; de: string }[]; onFinish: () => void }) {
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [offset, setOffset] = useState(0)
  const [animDir, setAnimDir] = useState<'left' | 'right' | null>(null)

  const startXRef = useRef<number | null>(null)
  const dragXRef = useRef(0)
  const hasDraggedRef = useRef(false)

  const done = index >= vocab.length

  // direction: 'left' = next card, 'right' = previous card
  function advance(dir: 'left' | 'right') {
    if (dir === 'right' && index === 0) return // can't go before first card
    setAnimDir(dir)
    setTimeout(() => {
      setIndex(i => dir === 'left' ? i + 1 : i - 1)
      setRevealed(false)
      setOffset(0)
      setAnimDir(null)
    }, 250)
  }

  function handleTouchStart(e: React.TouchEvent) {
    startXRef.current = e.touches[0].clientX
    dragXRef.current = 0
    hasDraggedRef.current = false
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (startXRef.current === null || animDir !== null) return
    const dx = e.touches[0].clientX - startXRef.current
    dragXRef.current = dx
    if (Math.abs(dx) > 8) hasDraggedRef.current = true
    // Clamp visual feedback to 80px
    setOffset(Math.max(-80, Math.min(80, dx)))
  }

  function handleTouchEnd() {
    if (animDir !== null) return
    if (hasDraggedRef.current && Math.abs(dragXRef.current) > 50) {
      // swipe left (dx < 0) = next, swipe right (dx > 0) = previous
      advance(dragXRef.current < 0 ? 'left' : 'right')
    } else {
      setOffset(0)
    }
    startXRef.current = null
  }

  function handleTap() {
    if (hasDraggedRef.current) { hasDraggedRef.current = false; return }
    if (!revealed) {
      setRevealed(true)
      navigator.vibrate?.(8)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col gap-3 fade-in">
        <p className="text-xs text-muted text-center">Alle Vokabeln gesehen</p>
        <Button variant="primary" fullWidth onClick={() => { navigator.vibrate?.(10); onFinish() }}>
          Fertig
        </Button>
      </div>
    )
  }

  const card = vocab[index]

  // Swipe translate for the outer (drag) layer
  let swipeTransform: string
  let swipeTransition: string
  if (animDir !== null) {
    swipeTransform = `translateX(${animDir === 'left' ? '-110%' : '110%'})`
    swipeTransition = 'transform 250ms ease-out'
  } else if (offset !== 0) {
    swipeTransform = `translateX(${offset}px)`
    swipeTransition = 'none'
  } else {
    swipeTransform = 'translateX(0)'
    swipeTransition = 'transform 150ms ease-out'
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Clip the swipe slide */}
      <div className="overflow-hidden rounded-[20px]">
        {/* key triggers fade-in when card changes */}
        <div
          key={index}
          className="cursor-pointer select-none fade-in"
          style={{ transform: swipeTransform, transition: swipeTransition }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleTap}
        >
          {/* Perspective wrapper for 3D flip */}
          <div style={{ perspective: '1000px' }}>
            <div
              className="relative min-h-[200px]"
              style={{
                transformStyle: 'preserve-3d',
                transform: revealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
                transition: 'transform 400ms ease-out',
              }}
            >
              {/* Front face */}
              <div
                className="bg-white rounded-[20px] border border-[#E2D7C8]/50 px-6 py-10 min-h-[200px] flex flex-col items-center justify-center shadow-card"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <p className="text-2xl font-semibold text-text text-center">{card.es}</p>
                <p className="text-xs text-muted mt-4">Tippe zum Aufdecken</p>
              </div>
              {/* Back face */}
              <div
                className="absolute inset-0 bg-white rounded-[20px] border border-[#E2D7C8]/50 px-6 py-10 flex flex-col items-center justify-center shadow-card"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <p className="text-sm text-muted text-center mb-2">{card.es}</p>
                <p className="text-2xl font-semibold text-text text-center">{card.de}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dot indicators */}
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

      {revealed && (
        <Button
          variant={index === vocab.length - 1 ? 'primary' : 'secondary'}
          fullWidth
          onClick={() => {
            if (index === vocab.length - 1) { navigator.vibrate?.(10); onFinish() }
            else advance('left')
          }}
        >
          {index === vocab.length - 1 ? 'Fertig' : 'Weiter →'}
        </Button>
      )}
    </div>
  )
}

// ─── Mini-Dialog-Karte (Etappe 1) ────────────────────────────────────────────

function MiniDialogCard({
  lines,
  index,
}: {
  lines: { speaker: string; es: string; de: string }[]
  index: number
}) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set())

  return (
    <div
      className="bg-white rounded-[16px] px-4 py-3 enter-up"
      style={{
        border: '1px solid rgba(224,219,214,0.8)',
        boxShadow: '0 1px 4px rgba(26,26,26,0.04)',
        animationDelay: `${index * 60}ms`,
      }}
    >
      <p
        className="text-[10px] text-muted mb-2"
        style={{ textTransform: 'uppercase', letterSpacing: '0.07em' }}
      >
        Mini-Dialog {index + 1}
      </p>
      <div className="flex flex-col gap-3">
        {lines.map((line, i) => (
          <div key={i}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold text-accent uppercase tracking-wide">
                  {line.speaker}
                </span>
                <p className="text-[15px] text-text mt-0.5">{line.es}</p>
              </div>
              <LineChevron
                open={revealed.has(i)}
                onToggle={() =>
                  setRevealed(prev => {
                    const next = new Set(prev)
                    if (next.has(i)) next.delete(i)
                    else next.add(i)
                    return next
                  })
                }
                label={revealed.has(i) ? 'Übersetzung verbergen' : 'Übersetzung zeigen'}
              />
            </div>
            {revealed.has(i) && (
              <p className="text-[13px] text-muted mt-1 fade-in">{line.de}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function FitView({
  lesson,
  onFinish,
  etappeNummer,
}: {
  lesson: Extract<Lesson, { mode: 'fit' }>
  onFinish: () => void
  etappeNummer?: number
}) {
  const [step, setStep] = useState<1 | 2>(1)

  // Etappe 1: Dialog-Array in 3 Mini-Karten à 2 Zeilen aufteilen
  const isMiniDialogs = etappeNummer === 1
  const miniGroups: { speaker: string; es: string; de: string }[][] = isMiniDialogs
    ? [lesson.dialog.slice(0, 2), lesson.dialog.slice(2, 4), lesson.dialog.slice(4, 6)]
    : []

  return (
    <div className="fade-in flex flex-col gap-6">
      {step === 1 ? (
        <>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-accent uppercase tracking-wide">Schritt 1 von 2</span>
            <span className="text-xs text-muted">Dialog</span>
          </div>
          {isMiniDialogs ? (
            <div className="flex flex-col gap-2">
              {miniGroups.map((lines, i) => (
                <MiniDialogCard key={i} lines={lines} index={i} />
              ))}
            </div>
          ) : (
            <FitDialogCard dialog={lesson.dialog} />
          )}
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
          <FitVocabSwipe vocab={lesson.vocab} onFinish={onFinish} />
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
