import { useState } from 'react'

interface Props {
  onSubmit: (link: string) => void
  onSkip: () => void
  onBack?: () => void
}

export default function ChannelLinkStep({ onSubmit, onSkip, onBack }: Props) {
  const [value, setValue] = useState('')

  return (
    <div className="mx-auto w-full max-w-xl px-6 py-10">
      <h2 className="font-serif text-2xl leading-snug text-text sm:text-3xl">
        Möchtest du deinen Kanal verlinken?
      </h2>
      <p className="mt-4 text-base text-muted">
        Mit Link schaue ich mir deine öffentlichen Daten an und ergänze die Einschätzung um deine
        letzten 12 Thumbnails. Ohne Link bekommst du eine reine Selbsteinschätzung.
      </p>
      <p className="mt-3 text-xs text-muted">
        Ich sehe nur öffentliche Daten — nicht deine internen Zahlen wie Klickrate.
      </p>

      <form
        className="mt-6"
        onSubmit={(e) => {
          e.preventDefault()
          if (value.trim()) onSubmit(value.trim())
        }}
      >
        <label htmlFor="channel" className="sr-only">
          Kanal-Link oder @handle
        </label>
        <input
          id="channel"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://youtube.com/@deinkanal"
          className="w-full rounded-btn border border-black/10 bg-white px-4 py-3 text-base text-text shadow-sm placeholder:text-muted/70 focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          autoComplete="off"
          inputMode="url"
        />
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={!value.trim()}
            className="rounded-btn bg-accent px-6 py-3 text-base font-medium text-white shadow-card transition hover:bg-accent/90 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Mit Kanal weitermachen
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="rounded-btn border border-black/10 bg-white px-6 py-3 text-base text-text transition hover:border-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Ohne Link weitermachen
          </button>
        </div>
      </form>

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
