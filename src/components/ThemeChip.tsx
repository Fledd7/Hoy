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
      className={`px-4 py-2 rounded-full text-sm font-medium tap-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors duration-200
        ${selected
          ? 'bg-accent text-white'
          : 'bg-white border border-[#E0DDD8] text-text hover:border-accent disabled:opacity-40 disabled:pointer-events-none'
        }`}
    >
      {label}
    </button>
  )
}
