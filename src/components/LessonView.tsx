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

function TiredView({ lesson, onFinish }: { lesson: Extract<Lesson, { mode: 'muede' }>; onFinish: () => void }) {
  return (
    <div className="fade-in flex flex-col gap-6">
      <Card>
        <p className="text-lg leading-relaxed text-text font-medium">{lesson.text}</p>
        <p className="text-muted text-base leading-relaxed mt-4">{lesson.translation}</p>
      </Card>
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-muted uppercase tracking-wide">Vokabeln</p>
        {lesson.vocab.map((v) => (
          <VocabTap key={v.es} es={v.es} de={v.de} />
        ))}
      </div>
      <Button variant="primary" fullWidth onClick={onFinish}>
        Fertig
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
