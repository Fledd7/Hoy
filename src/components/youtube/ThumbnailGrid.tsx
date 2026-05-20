import type { ChannelData } from '../../lib/youtube/types'

interface Props {
  channel: ChannelData
}

export default function ThumbnailGrid({ channel }: Props) {
  const { thumbnails, metrics, channel: ch } = channel
  if (!thumbnails.length) return null

  return (
    <div className="rounded-card border border-black/5 bg-white p-4 shadow-card sm:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-serif text-lg text-text">Deine letzten {thumbnails.length} Thumbnails</h3>
        {ch.handle && <span className="text-xs text-muted">{ch.handle}</span>}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {thumbnails.map((src, i) => (
          <div key={i} className="aspect-video overflow-hidden rounded-lg bg-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted">
        {metrics.cadenceDays > 0
          ? `Upload-Rhythmus: ca. alle ${metrics.cadenceDays} Tage`
          : 'Upload-Rhythmus: nicht erkennbar'}
        {metrics.medianViews > 0 &&
          ` · Median-Aufrufe: ${metrics.medianViews.toLocaleString('de-DE')}`}
        {ch.subs > 0 && ` · ${ch.subs.toLocaleString('de-DE')} Abonnent:innen`}
      </p>
      <p className="mt-2 text-xs text-muted">
        Sieh dir die Reihe als Ganzes an: Gibt es eine erkennbare visuelle Linie?
      </p>
    </div>
  )
}
