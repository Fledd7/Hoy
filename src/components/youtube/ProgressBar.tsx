interface Props {
  current: number
  total: number
  label?: string
}

export default function ProgressBar({ current, total, label }: Props) {
  const pct = Math.max(0, Math.min(100, Math.round((current / total) * 100)))
  return (
    <div className="w-full">
      <div className="mb-2 flex justify-between text-xs text-muted">
        <span aria-current="step">{label ?? `Schritt ${current} von ${total}`}</span>
        <span>{pct}%</span>
      </div>
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-black/5"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-accent transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
