import type { Question, QuestionOption } from '../../lib/youtube/types'
import OptionCard from './OptionCard'

interface Props {
  question: Question
  selected?: QuestionOption
  onSelect: (opt: QuestionOption) => void
  onBack?: () => void
}

export default function QuestionStep({ question, selected, onSelect, onBack }: Props) {
  return (
    <div className="mx-auto w-full max-w-xl px-6 py-10">
      <h2 className="font-serif text-2xl leading-snug text-text sm:text-3xl">{question.question}</h2>
      <div className="mt-8 flex flex-col gap-3">
        {question.options.map((opt) => (
          <OptionCard
            key={opt.label}
            label={opt.label}
            selected={selected?.label === opt.label}
            onClick={() => onSelect(opt)}
          />
        ))}
      </div>
      {onBack && (
        <div className="mt-8">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-muted underline-offset-4 hover:text-text hover:underline focus:outline-none focus-visible:underline"
          >
            Zurück
          </button>
        </div>
      )}
    </div>
  )
}
