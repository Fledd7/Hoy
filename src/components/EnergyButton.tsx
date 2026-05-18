interface EnergyButtonProps {
  label: string
  sublabel: string
  onClick: () => void
}

export default function EnergyButton({ label, sublabel, onClick }: EnergyButtonProps) {
  function handleClick() {
    navigator.vibrate?.(10)
    onClick()
  }

  return (
    <button
      onClick={handleClick}
      className="w-full min-h-[72px] bg-white rounded-card border border-[#E2D7C8]/50 px-5 py-4 text-left tap-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 shadow-card"
    >
      <span className="block text-base font-semibold text-text">{label}</span>
      <span className="block text-sm text-muted mt-0.5">{sublabel}</span>
    </button>
  )
}
