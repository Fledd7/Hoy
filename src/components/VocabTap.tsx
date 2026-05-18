import { useEffect, useState } from 'react'

interface VocabTapProps {
  es: string
  de: string
}

export default function VocabTap({ es, de }: VocabTapProps) {
  const [open, setOpen] = useState(false)

  // Close on any click outside this component
  useEffect(() => {
    if (!open) return
    function handleDocClick() { setOpen(false) }
    document.addEventListener('click', handleDocClick)
    return () => document.removeEventListener('click', handleDocClick)
  }, [open])

  function handleTap(e: React.MouseEvent) {
    e.stopPropagation()
    if (!open) navigator.vibrate?.(8)
    setOpen(o => !o)
  }

  return (
    <span className="relative inline-block">
      <button
        onClick={handleTap}
        aria-label={open ? `${es}: ${de}` : `Übersetzung zeigen für ${es}`}
        aria-expanded={open}
        className="bg-[#F3E8E5] rounded-[4px] px-[4px] py-[1px] text-text tap-scale focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
      >
        {es}
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-0 z-20 mb-1.5 whitespace-nowrap bg-white border border-[#E0DBD6] rounded-[8px] px-[10px] py-[6px] text-[13px] text-text shadow-[0_4px_12px_rgba(0,0,0,0.08)] pointer-events-none select-none"
        >
          {de}
        </span>
      )}
    </span>
  )
}
