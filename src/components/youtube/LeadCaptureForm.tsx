import { useState } from 'react'

export interface LeadFormValues {
  name: string
  email: string
  message: string
  consent: boolean
}

interface Props {
  onSubmit: (values: LeadFormValues) => Promise<void> | void
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default function LeadCaptureForm({ onSubmit }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const valid = name.trim().length >= 2 && emailRe.test(email) && consent

  return (
    <div className="mx-auto w-full max-w-xl px-6 py-10">
      <h2 className="font-serif text-2xl leading-snug text-text sm:text-3xl">
        Persönliche Einschätzung anfragen
      </h2>
      <p className="mt-3 text-base text-muted">
        Das war die kurze Einschätzung. Wenn du magst, schaue ich mir deine Angaben — und deinen
        Kanal — persönlich an und melde mich mit einer konkreteren Rückmeldung. Kostenlos und
        unverbindlich.
      </p>

      <form
        className="mt-6 flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault()
          if (!valid || submitting) return
          setSubmitting(true)
          setError(null)
          try {
            await onSubmit({ name: name.trim(), email: email.trim(), message: message.trim(), consent })
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Senden fehlgeschlagen.')
            setSubmitting(false)
          }
        }}
      >
        <label className="flex flex-col gap-1 text-sm text-text">
          Name
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-btn border border-black/10 bg-white px-4 py-3 text-base shadow-sm focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            autoComplete="name"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-text">
          E-Mail
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-btn border border-black/10 bg-white px-4 py-3 text-base shadow-sm focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            autoComplete="email"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-text">
          Nachricht <span className="text-muted">(optional)</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="resize-y rounded-btn border border-black/10 bg-white px-4 py-3 text-base shadow-sm focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            placeholder="Worum geht es konkret? Was hast du schon versucht?"
          />
        </label>

        <label className="flex items-start gap-3 text-sm text-text">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-4 w-4 accent-accent"
          />
          <span className="text-muted">
            Deine Angaben nutze ich ausschließlich, um deine Anfrage einzuschätzen und dir zu
            antworten. Keine Weitergabe an Dritte, keine Veröffentlichung.
          </span>
        </label>

        {error && <p className="text-sm text-accent">{error}</p>}

        <button
          type="submit"
          disabled={!valid || submitting}
          className="mt-2 rounded-btn bg-accent px-6 py-3 text-base font-medium text-white shadow-card transition hover:bg-accent/90 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {submitting ? 'Wird gesendet …' : 'Einschätzung anfragen'}
        </button>
      </form>
    </div>
  )
}
