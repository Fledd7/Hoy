interface Props {
  onStart: () => void
}

export default function StartScreen({ onStart }: Props) {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      <p className="mb-4 text-xs uppercase tracking-widest text-muted">YouTube Klarheitscheck</p>
      <h1 className="font-serif text-4xl leading-tight text-text sm:text-5xl">
        Sieh, was deine Zuschauer sehen — bevor sie wegscrollen.
      </h1>
      <p className="mt-5 max-w-xl text-base text-muted sm:text-lg">
        Gib deinen Kanal ein und erhalte in 60 Sekunden eine ehrliche Einschätzung, wie einheitlich
        und klickstark dein Kanal nach außen wirkt.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="mt-10 rounded-btn bg-accent px-7 py-4 text-base font-medium text-white shadow-card transition hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Klarheitscheck starten
      </button>
      <p className="mt-6 text-xs text-muted">
        5 Fragen · keine Anmeldung · keine privaten Analytics
      </p>
    </div>
  )
}
