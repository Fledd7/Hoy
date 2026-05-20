export default function ConfirmationScreen() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center px-6 py-10 text-center">
      <p className="text-xs uppercase tracking-widest text-muted">Anfrage gesendet</p>
      <h2 className="mt-3 font-serif text-3xl leading-snug text-text sm:text-4xl">
        Danke.
      </h2>
      <p className="mt-5 max-w-md text-base text-muted">
        Ich sehe mir deine Angaben in den nächsten Tagen persönlich an und melde mich mit einer
        konkreten Einschätzung.
      </p>
    </div>
  )
}
