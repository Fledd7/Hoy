import type { ChannelData, ResultPayload } from '../../lib/youtube/types'
import ThumbnailGrid from './ThumbnailGrid'

interface Props {
  result: ResultPayload
  channel?: ChannelData | null
  onContinue: () => void
}

export default function ResultPreview({ result, channel, onContinue }: Props) {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <p className="text-xs uppercase tracking-widest text-muted">Deine Einschätzung</p>
      <h2 className="mt-2 font-serif text-3xl leading-snug text-text sm:text-4xl">
        {result.headline}
      </h2>

      {result.dataLine && (
        <p className="mt-4 rounded-card bg-accent/5 px-4 py-3 text-sm text-text">
          {result.dataLine}
        </p>
      )}

      <p className="mt-5 text-base leading-relaxed text-text/90">{result.text}</p>

      {channel && (
        <div className="mt-8">
          <ThumbnailGrid channel={channel} />
        </div>
      )}

      <div className="mt-10 rounded-card border border-black/10 bg-white p-6 shadow-card">
        <p className="font-serif text-lg text-text">{result.cta}</p>
        <p className="mt-2 text-sm text-muted">
          Wenn du magst, schaue ich mir deine Angaben persönlich an und melde mich mit einer
          konkreteren Rückmeldung. Kostenlos und unverbindlich.
        </p>
        <button
          type="button"
          onClick={onContinue}
          className="mt-5 w-full rounded-btn bg-accent px-6 py-3 text-base font-medium text-white shadow-card transition hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
        >
          Persönliche Einschätzung anfragen
        </button>
      </div>
    </div>
  )
}
