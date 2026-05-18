import { useState } from 'react'

interface VocabTapProps {
  es: string
  de: string
}

export default function VocabTap({ es, de }: VocabTapProps) {
  const [revealed, setRevealed] = useState(false)

  return (
    <button
      onClick={() => setRevealed((r) => !r)}
      aria-label={revealed ? `${es}: ${de}` : `Übersetzung zeigen für ${es}`}
      className="w-full text-left bg-white border border-[#E0DDD8] rounded-card px-4 py-3 tap-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span className="block text-base font-medium text-text">{es}</span>
      {revealed ? (
        <span className="block text-sm text-muted mt-0.5 transition-opacity duration-200">
          {de}
        </span>
      ) : (
        <span className="block text-xs text-muted mt-0.5">Tippen zum Aufdecken</span>
      )}
    </button>
  )
}
