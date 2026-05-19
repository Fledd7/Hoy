import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

interface EnergyButtonProps {
  label: string
  sublabel: string
  onClick: () => void
  icon: ReactNode
  doneToday?: boolean
  recommended?: boolean
  recommendedNote?: string
}

export default function EnergyButton({
  label,
  sublabel,
  onClick,
  icon,
  doneToday = false,
  recommended = false,
  recommendedNote,
}: EnergyButtonProps) {
  function handleClick() {
    navigator.vibrate?.(10)
    onClick()
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className="w-full min-h-[88px] bg-white rounded-[18px] px-5 py-4 text-left tap-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 flex items-center gap-4"
        style={{
          boxShadow: recommended
            ? '0 0 0 2px rgba(194,85,61,0.15), 0 1px 2px rgba(26,26,26,0.04), 0 4px 16px rgba(26,26,26,0.06), 0 12px 32px rgba(26,26,26,0.04)'
            : '0 1px 2px rgba(26,26,26,0.04), 0 4px 16px rgba(26,26,26,0.06), 0 12px 32px rgba(26,26,26,0.04)',
          border: recommended ? '1px solid rgba(194,85,61,0.25)' : '1px solid rgba(226,215,200,0.5)',
        }}
      >
        <span className="text-accent flex-shrink-0">{icon}</span>
        <span className="flex-1 min-w-0">
          <span className="block font-serif text-[22px] font-semibold text-text leading-tight">{label}</span>
          <span className="block text-[13px] text-muted mt-0.5">{sublabel}</span>
        </span>
        {doneToday && (
          <span className="flex items-center gap-1 flex-shrink-0 mr-1">
            <span className="w-2 h-2 rounded-full bg-[#7CA982] flex-shrink-0" />
            <span className="text-[11px] text-muted whitespace-nowrap">Heute gemacht</span>
          </span>
        )}
        <ChevronRight size={18} className="text-muted flex-shrink-0" />
      </button>
      {recommended && recommendedNote && (
        <p className="text-[12px] text-muted mt-1 ml-1">{recommendedNote}</p>
      )}
    </div>
  )
}
