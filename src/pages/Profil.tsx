import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import ThemeChip from '../components/ThemeChip'
import { getUser, saveUser, resetAll } from '../lib/storage'
import { THEMEN, REQUIRED_THEMEN_COUNT } from '../lib/config'
import type { UserData } from '../lib/types'

const NIVEAU_LABELS: Record<UserData['niveau'], string> = {
  anfaenger: 'Anfänger',
  wiedereinsteiger_schule: 'Wiedereinsteiger – Schule liegt zurück',
  wiedereinsteiger_a2: 'Wiedereinsteiger – A2',
  wiedereinsteiger_b1: 'Wiedereinsteiger – B1+',
}

export default function Profil() {
  const navigate = useNavigate()
  const user = getUser()

  const [themen, setThemen] = useState<string[]>(user?.themen ?? [])
  const [why, setWhy] = useState(user?.why ?? '')
  const [saved, setSaved] = useState(false)

  if (!user) {
    navigate('/onboarding', { replace: true })
    return null
  }

  function toggleThema(thema: string) {
    setThemen((prev) =>
      prev.includes(thema)
        ? prev.filter((t) => t !== thema)
        : prev.length < REQUIRED_THEMEN_COUNT
        ? [...prev, thema]
        : prev
    )
    setSaved(false)
  }

  function handleSave() {
    if (!user || themen.length !== REQUIRED_THEMEN_COUNT) return
    saveUser({ ...user, themen, why })
    setSaved(true)
  }

  function handleReset() {
    resetAll()
    navigate('/onboarding', { replace: true })
  }

  const canSave = themen.length === REQUIRED_THEMEN_COUNT

  return (
    <div className="flex flex-col min-h-screen bg-background max-w-content mx-auto px-5 pt-5 pb-16">
      <button
        onClick={() => navigate('/heute')}
        aria-label="Zurück zur Hauptseite"
        className="text-muted text-sm tap-scale self-start mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
      >
        ← Zurück
      </button>
      <h1 className="text-2xl font-semibold text-text mb-8">Profil</h1>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Niveau</h2>
        <p className="text-base text-text bg-white border border-[#E0DDD8] rounded-card px-4 py-3">
          {NIVEAU_LABELS[user.niveau]}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
          Deine Themen ({themen.length}/{REQUIRED_THEMEN_COUNT})
        </h2>
        <div className="flex flex-wrap gap-2">
          {THEMEN.map((t) => (
            <ThemeChip
              key={t}
              label={t}
              selected={themen.includes(t)}
              onClick={() => toggleThema(t)}
              disabled={themen.length >= REQUIRED_THEMEN_COUNT}
            />
          ))}
        </div>
        {themen.length !== REQUIRED_THEMEN_COUNT && (
          <p className="text-sm text-muted mt-2">
            Bitte wähle genau {REQUIRED_THEMEN_COUNT} Themen.
          </p>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
          Warum lernst du Spanisch?
        </h2>
        <textarea
          value={why}
          onChange={(e) => { setWhy(e.target.value); setSaved(false) }}
          placeholder="Zum Beispiel: Mit der Familie meiner Partnerin reden können."
          rows={3}
          className="w-full bg-white border border-[#E0DDD8] rounded-card px-4 py-3 text-base text-text placeholder:text-muted resize-none focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </section>

      <Button
        variant="primary"
        fullWidth
        onClick={handleSave}
        disabled={!canSave}
        className="mb-4"
      >
        {saved ? 'Gespeichert ✓' : 'Änderungen speichern'}
      </Button>

      <div className="mt-auto pt-16">
        <Button
          variant="ghost"
          fullWidth
          onClick={handleReset}
          className="text-muted hover:text-[#C2553D]"
        >
          Alle Daten zurücksetzen
        </Button>
        <p className="text-center text-[12px] text-[#9B9B9B] mt-8">Hoy v0.3</p>
      </div>
    </div>
  )
}
