interface ThemeChipProps {
  label: string
  selected: boolean
  onClick: () => void
  disabled?: boolean
}

export default function ThemeChip({ label, selected, onClick, disabled = false }: ThemeChipProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled && !selected}
      aria-pressed={selected}
      className={`px-4 py-2 rounded-full text-sm font-medium tap-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors duration-200
        ${selected
          ? 'bg-accent text-white shadow-card'
          : 'bg-white border border-[#E2D7C8]/50 text-text hover:border-accent disabled:opacity-40 disabled:pointer-events-none shadow-[0_1px_3px_rgba(26,26,26,0.06)]'
        }`}
    >
      {label}
    </button>
  )
}
