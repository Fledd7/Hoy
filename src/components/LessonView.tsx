import { useState } from 'react'
import type { Lesson, QuizQuestion } from '../lib/types'
import VocabTap from './VocabTap'
import Button from './Button'
import Card from './Card'

interface LessonViewProps {
  lesson: Lesson
  onFinish: () => void
}

export default function LessonView({ lesson, onFinish }: LessonViewProps) {
  if (lesson.mode === 'muede') {
    return <TiredView lesson={lesson} onFinish={onFinish} />
  }
  if (lesson.mode === 'okay') {
    return <OkayView lesson={lesson} onFinish={onFinish} />
  }
  return <FitView lesson={lesson} onFinish={onFinish} />
}

// ─── Inline vocab helpers for TiredView ──────────────────────────────────────

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

function InlineVocabWord({
  text,
  de,
  revealed,
  onTap,
}: {
  text: string
  de: string
  revealed: boolean
  onTap: () => void
}) {
  return (
    <span className="inline-flex flex-col items-start align-baseline">
      <button
        onClick={onTap}
        className="text-text bg-[#F3E8E5] rounded-[4px] px-1 tap-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {text}
      </button>
      {revealed && (
        <span className="bg-white border border-[#E0DBD6] rounded-[8px] px-2 py-1 text-[13px] text-text mt-1 leading-snug">
          {de}
        </span>
      )}
    </span>
  )
}

// ─── Views ───────────────────────────────────────────────────────────────────

function TiredView({ lesson, onFinish }: { lesson: Extract<Lesson, { mode: 'muede' }>; onFinish: () => void }) {
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const truncatedText = truncateToTwoSentences(lesson.text)
  const truncatedTranslation = truncateToTwoSentences(lesson.translation)
  const segments = splitTextWithVocab(truncatedText, lesson.vocab)

  return (
    <div className="fade-in flex flex-col gap-6">
      <div>
        <h2 className="text-[20px] text-text font-semibold">Heute ganz leicht</h2>
        <p className="text-[14px] text-muted mt-1">
          Lies nur den kleinen Text. Tippe auf markierte Wörter, wenn du magst.
        </p>
      </div>
      <Card>
        <div className="text-lg leading-relaxed text-text font-medium">
          {segments.map((seg, i) =>
            seg.de && seg.key ? (
              <InlineVocabWord
                key={i}
                text={seg.text}
                de={seg.de}
                revealed={revealed.has(seg.key)}
                onTap={() => setRevealed(prev => new Set([...prev, seg.key!]))}
              />
            ) : (
              <span key={i}>{seg.text}</span>
            )
          )}
        </div>
        <p className="text-muted text-base leading-relaxed mt-4">{truncatedTranslation}</p>
      </Card>
      <Button variant="primary" fullWidth onClick={onFinish}>
        Reicht für heute
      </Button>
    </div>
  )
}

function OkayView({ lesson, onFinish }: { lesson: Extract<Lesson, { mode: 'okay' }>; onFinish: () => void }) {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [checked, setChecked] = useState(false)

  const allAnswered = lesson.questions.every((_, i) => answers[i] !== undefined)

  function handleCheck() {
    if (allAnswered) setChecked(true)
  }

  return (
    <div className="fade-in flex flex-col gap-6">
      <Card>
        <p className="text-lg leading-relaxed text-text font-medium">{lesson.text}</p>
        <p className="text-muted text-base leading-relaxed mt-4">{lesson.translation}</p>
      </Card>
      <div className="flex flex-col gap-5">
        {lesson.questions.map((q, qi) => (
          <QuizCard
            key={qi}
            question={q}
            selected={answers[qi]}
            checked={checked}
            onSelect={(idx) => !checked && setAnswers((a) => ({ ...a, [qi]: idx }))}
          />
        ))}
      </div>
      {!checked ? (
        <Button variant="primary" fullWidth onClick={handleCheck} disabled={!allAnswered}>
          Auswerten
        </Button>
      ) : (
        <Button variant="primary" fullWidth onClick={onFinish}>
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
}: {
  question: QuizQuestion
  selected: number | undefined
  checked: boolean
  onSelect: (idx: number) => void
}) {
  return (
    <Card>
      <p className="text-base font-medium text-text mb-3">{question.question}</p>
      <div className="flex flex-col gap-2">
        {question.options.map((opt, idx) => {
          let style = 'border border-[#E0DDD8] text-text'
          if (checked) {
            if (idx === question.correctIndex) style = 'border-2 border-accent text-accent bg-[#FBF0EE]'
            else if (idx === selected) style = 'border border-[#E0DDD8] text-muted line-through'
          } else if (idx === selected) {
            style = 'border-2 border-accent text-accent bg-[#FBF0EE]'
          }
          return (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              className={`w-full text-left px-4 py-3 rounded-btn text-sm tap-scale ${style} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </Card>
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
          <Card>
            <div className="flex flex-col gap-4">
              {lesson.dialog.map((line, i) => (
                <div key={i}>
                  <span className="text-xs font-semibold text-accent uppercase tracking-wide">{line.speaker}</span>
                  <p className="text-base text-text mt-0.5">{line.es}</p>
                  <p className="text-sm text-muted mt-0.5">{line.de}</p>
                </div>
              ))}
            </div>
          </Card>
          <Button variant="primary" fullWidth onClick={() => setStep(2)}>
            Weiter zu den Vokabeln
          </Button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-accent uppercase tracking-wide">Schritt 2 von 2</span>
            <span className="text-xs text-muted">Vokabeln</span>
          </div>
          <p className="text-xs text-muted -mt-3">Tippe auf eine Vokabel zum Aufdecken</p>
          <div className="flex flex-col gap-3">
            {lesson.vocab.map((v) => (
              <VocabTap key={v.es} es={v.es} de={v.de} />
            ))}
          </div>
          <Button variant="primary" fullWidth onClick={onFinish}>
            Fertig
          </Button>
        </>
      )}
    </div>
  )
}
