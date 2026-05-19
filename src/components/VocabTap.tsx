import { useEffect, useRef, useState } from 'react'

interface VocabTapProps {
  es: string
  de: string
}

export default function VocabTap({ es, de }: VocabTapProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLSpanElement>(null)

  // Capture-phase listener: close if click lands outside this component.
  // Capture fires before stopPropagation on nested buttons, so other open
  // bubbles close correctly when a different word is tapped.
  useEffect(() => {
    if (!open) return
    function handleDocClick(e: Event) {
      if (containerRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('click', handleDocClick, true)
    return () => document.removeEventListener('click', handleDocClick, true)
  }, [open])

  // Auto-close after 4 seconds
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => setOpen(false), 4000)
    return () => clearTimeout(t)
  }, [open])

  function handleTap() {
    if (!open) navigator.vibrate?.(8)
    setOpen(o => !o)
  }

  return (
    <span ref={containerRef} className="relative inline-block">
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
          className="bubble-in absolute bottom-full left-0 z-20 mb-2 whitespace-nowrap bg-white border border-[#E0DBD6] rounded-[8px] px-[10px] py-[6px] text-[13px] text-text shadow-[0_4px_12px_rgba(0,0,0,0.08)] pointer-events-none select-none"
        >
          {de}
          {/* Downward arrow */}
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: '-5px',
              left: '10px',
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid white',
            }}
          />
        </span>
      )}
    </span>
  )
}
