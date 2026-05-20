import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import Button from '../components/Button'
import ThemeChip from '../components/ThemeChip'
import { getUser, saveUser, resetAll, getSeenVocab, ensureEtappenMigration } from '../lib/storage'
import { THEMEN, MIN_THEMEN_COUNT, MAX_THEMEN_COUNT } from '../lib/config'
import { ETAPPEN } from '../lib/etappen'
import type { UserData } from '../lib/types'

const NIVEAU_LABELS: Record<UserData['niveau'], string> = {
  anfaenger: 'Ich fange ganz neu an',
  wiedereinsteiger_schule: 'Etwas Schulspanisch ist da',
  wiedereinsteiger_a2: 'Ich verstehe einfache Sätze',
  wiedereinsteiger_b1: 'Ich kann mich unterhalten',
}

function VocabChip({ es, de }: { es: string; de: string }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <button
      onClick={() => setRevealed(r => !r)}
      className="bg-white border border-[#E0DDD8] rounded-full px-3 py-1.5 text-sm text-text tap-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent text-left"
    >
      <span className="font-medium">{es}</span>
      {revealed && <span className="text-muted ml-1">– {de}</span>}
    </button>
  )
}

export default function Profil() {
  const navigate = useNavigate()
  ensureEtappenMigration()
  const user = getUser()
  const seenVocab = getSeenVocab()

  const [themen, setThemen] = useState<string[]>(user?.themen ?? [])
  const [why, setWhy] = useState(user?.why ?? '')
  const [saved, setSaved] = useState(false)
  const [expandedEtappe, setExpandedEtappe] = useState<number | null>(user?.etappe ?? null)

  if (!user) {
    navigate('/onboarding', { replace: true })
    return null
  }

  const currentEtappe = user.etappe ?? 1

  function toggleThema(thema: string) {
    setThemen((prev) =>
      prev.includes(thema)
        ? prev.filter((t) => t !== thema)
        : prev.length < MAX_THEMEN_COUNT
        ? [...prev, thema]
        : prev
    )
    setSaved(false)
  }

  function handleSave() {
    if (!user || themen.length < MIN_THEMEN_COUNT) return
    saveUser({ ...user, themen, why })
    setSaved(true)
  }

  function handleReset() {
    resetAll()
    navigate('/onboarding', { replace: true })
  }

  const canSave = themen.length >= MIN_THEMEN_COUNT

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F1EB] max-w-content mx-auto px-5 pt-5 pb-16">
      <button
        onClick={() => navigate('/heute')}
        aria-label="Zurück zur Hauptseite"
        className="text-muted text-sm tap-scale self-start mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
      >
        ← Zurück
      </button>
      <h1 className="font-serif text-[32px] font-semibold text-text mb-8 leading-tight">Profil</h1>

      {/* ─── Etappen-Journey ─────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="font-serif text-[24px] font-semibold text-text leading-tight">Deine Reise</h2>
        <p className="text-[14px] text-muted mt-1 mb-4">Wo du gerade unterwegs bist.</p>

        <div className="flex flex-col gap-2">
          {ETAPPEN.map((etappe) => {
            const isPast = etappe.nummer < currentEtappe
            const isCurrent = etappe.nummer === currentEtappe
            const isFuture = etappe.nummer > currentEtappe
            const isExpanded = expandedEtappe === etappe.nummer && !isFuture

            function handleEtappeClick() {
              if (isFuture) return
              setExpandedEtappe(isExpanded ? null : etappe.nummer)
            }

            return (
              <div
                key={etappe.nummer}
                className="bg-white rounded-[16px] px-4 py-3 transition-opacity"
                style={{
                  border: isCurrent
                    ? '1px solid rgba(194,85,61,0.25)'
                    : '1px solid rgba(224,219,214,0.8)',
                  boxShadow: isCurrent
                    ? '0 0 0 2px rgba(194,85,61,0.06), 0 2px 8px rgba(26,26,26,0.04)'
                    : '0 1px 4px rgba(26,26,26,0.04)',
                  opacity: isFuture ? 0.6 : 1,
                }}
              >
                <button
                  onClick={handleEtappeClick}
                  disabled={isFuture}
                  className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[8px]"
                >
                  <div className="flex items-center gap-3">
                    {/* Nummer-Kreis */}
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] font-semibold"
                      style={{
                        backgroundColor: isCurrent
                          ? '#C2553D'
                          : isPast
                          ? '#1A1A1A'
                          : 'transparent',
                        border: isFuture ? '1.5px solid #C0BAB4' : 'none',
                        color: isFuture ? '#9B9B9B' : 'white',
                      }}
                    >
                      {etappe.nummer}
                    </span>

                    {/* Name + Untertitel */}
                    <span className="flex-1 min-w-0">
                      <span className="block text-[15px] font-semibold text-text leading-tight">
                        {etappe.name}
                      </span>
                      <span className="block text-[12px] text-muted italic mt-0.5">
                        {etappe.untertitel}
                      </span>
                    </span>

                    {/* Status */}
                    <span className="flex-shrink-0 flex items-center gap-1">
                      {isCurrent && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-accent" />
                          <span className="text-[11px] text-accent font-medium">Hier bist du</span>
                        </>
                      )}
                      {isPast && (
                        <Check size={16} className="text-[#1A1A1A]" />
                      )}
                    </span>
                  </div>
                </button>

                {/* Aufgeklappte Themen */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-[#F0EDE8] fade-in">
                    <p className="text-[11px] text-muted mb-2" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Themen dieser Etappe
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {etappe.themen.map(t => (
                        <span
                          key={t}
                          className="text-[12px] text-text bg-[#F5F1EB] rounded-full px-3 py-1"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {currentEtappe === 5 && (
          <p className="text-[13px] text-muted mt-3 text-center">
            Du bist in der letzten Etappe angekommen. Hier kannst du frei weiterlernen.
          </p>
        )}
      </section>

      {/* ─── Niveau ──────────────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Niveau</h2>
        <p className="text-base text-text bg-white border border-[#E0DDD8] rounded-card px-4 py-3">
          {NIVEAU_LABELS[user.niveau]}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
          Deine Themen ({themen.length}/{MAX_THEMEN_COUNT})
        </h2>
        <div className="flex flex-wrap gap-2">
          {THEMEN.map((t) => (
            <ThemeChip
              key={t}
              label={t}
              selected={themen.includes(t)}
              onClick={() => toggleThema(t)}
              disabled={themen.length >= MAX_THEMEN_COUNT}
            />
          ))}
        </div>
        {themen.length < MIN_THEMEN_COUNT && (
          <p className="text-sm text-muted mt-2">
            Bitte wähle mindestens {MIN_THEMEN_COUNT} Themen.
          </p>
        )}
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-[20px] font-semibold text-text mb-1 leading-tight">Deine Wörter</h2>
        <p className="text-[14px] text-muted mb-3">Alle Vokabeln, die du bisher gesehen hast.</p>
        {seenVocab.length === 0 ? (
          <p className="text-sm text-muted">Noch keine Wörter gelernt.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {[...seenVocab].reverse().map((v) => (
              <VocabChip key={v.es} es={v.es} de={v.de} />
            ))}
          </div>
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
        <p className="text-center text-[12px] text-[#9B9B9B] mt-8">Hoy v1.1.3</p>
      </div>
    </div>
  )
}
