interface Props {
  label: string
  selected?: boolean
  onClick: () => void
}

export default function OptionCard({ label, selected, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        'w-full rounded-card border px-5 py-4 text-left text-base transition',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        selected
          ? 'border-accent bg-accent/5 text-text shadow-card'
          : 'border-black/10 bg-white text-text hover:border-accent/60 hover:shadow-card',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
