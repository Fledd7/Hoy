import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Grid3X3, Pencil } from 'lucide-react'
import { getVocabForReview } from '../lib/vocabTracking'
import type { VocabEntry } from '../lib/vocabTracking'
import { getUser } from '../lib/storage'
import SpielWortPaare from '../components/SpielWortPaare'
import SpielLueckenFuellen from '../components/SpielLueckenFuellen'
import Button from '../components/Button'

type Screen = 'auswahl' | 'wortpaare' | 'luecken'

const MIN_VOCAB = 5
const MAX_VOCAB = 8

export default function Wiederholen() {
  const navigate = useNavigate()
  const user = getUser()
  const etappe = user?.etappe ?? 1

  const [screen, setScreen] = useState<Screen>('auswahl')
  const [vocab, setVocab] = useState<VocabEntry[]>(() => {
    const all = getVocabForReview(MAX_VOCAB)
    // Shuffle to randomize each session
    return [...all].sort(() => Math.random() - 0.5).slice(0, MAX_VOCAB)
  })

  function refreshVocab() {
    const all = getVocabForReview(MAX_VOCAB)
    setVocab([...all].sort(() => Math.random() - 0.5).slice(0, MAX_VOCAB))
  }

  function handleNochmal() {
    refreshVocab()
    setScreen('auswahl')
  }

  if (screen === 'wortpaare') {
    return (
      <SpielWortPaare
        vocab={vocab}
        onNochmal={handleNochmal}
        onZurueck={() => setScreen('auswahl')}
      />
    )
  }

  if (screen === 'luecken') {
    return (
      <SpielLueckenFuellen
        vocab={vocab}
        etappe={etappe}
        onNochmal={handleNochmal}
        onZurueck={() => setScreen('auswahl')}
      />
    )
  }

  // ─── Spiel-Auswahl ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F1EB] max-w-content mx-auto px-5 pt-5 pb-10">
      <button
        onClick={() => navigate('/heute')}
        aria-label="Zurück zur Hauptseite"
        className="text-muted text-sm tap-scale self-start mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
      >
        ← Zurück
      </button>

      <h1 className="font-serif text-[28px] font-semibold text-text leading-tight mb-1">Wiederholen</h1>
      <p className="text-[14px] text-muted mb-8">Spiel dich durch deine Wörter.</p>

      {vocab.length < MIN_VOCAB ? (
        <div className="flex flex-col items-center text-center gap-4 pt-8">
          <p className="text-muted text-base leading-relaxed">
            Komm später wieder. Du brauchst mehr gelernte Wörter, bevor du wiederholen kannst.
          </p>
          <Button variant="secondary" onClick={() => navigate('/heute')}>
            Zurück
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <SpielKarte
            icon={<Grid3X3 size={24} className="text-accent" />}
            titel="Wort-Paare"
            beschreibung="Finde zusammengehörende Wörter"
            onClick={() => setScreen('wortpaare')}
          />
          <SpielKarte
            icon={<Pencil size={24} className="text-accent" />}
            titel="Lücken füllen"
            beschreibung="Vervollständige die Sätze"
            onClick={() => setScreen('luecken')}
          />
        </div>
      )}
    </div>
  )
}

function SpielKarte({
  icon,
  titel,
  beschreibung,
  onClick,
}: {
  icon: React.ReactNode
  titel: string
  beschreibung: string
  onClick: () => void
}) {
  return (
    <button
      onClick={() => { navigator.vibrate?.(10); onClick() }}
      className="w-full bg-white rounded-[18px] px-5 py-5 text-left tap-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 flex items-center gap-4"
      style={{
        border: '1px solid rgba(226,215,200,0.5)',
        boxShadow: '0 1px 2px rgba(26,26,26,0.04), 0 4px 16px rgba(26,26,26,0.06)',
      }}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block font-serif text-[20px] font-semibold text-text leading-tight">{titel}</span>
        <span className="block text-[13px] text-muted mt-0.5">{beschreibung}</span>
      </span>
    </button>
  )
}
