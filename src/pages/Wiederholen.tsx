import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser } from '../lib/storage'
import { getVocabForReview } from '../lib/vocabTracking'
import { ANFAENGER_VOKABULAR } from '../lib/anfaengerVokabular'
import SpielWortPaare from '../components/SpielWortPaare'
import SpielLueckenFuellen from '../components/SpielLueckenFuellen'
import SpielBildMatching from '../components/SpielBildMatching'
import SpielReihenfolge from '../components/SpielReihenfolge'

type SpielId = 'wort_paare' | 'luecken' | 'bild_matching' | 'reihenfolge'

const SPIELE: { id: SpielId; label: string; beschreibung: string }[] = [
  { id: 'wort_paare',     label: 'Wort-Paare',        beschreibung: 'Spanisch und Deutsch verbinden' },
  { id: 'luecken',        label: 'Lücken füllen',     beschreibung: 'Fehlende Wörter ergänzen' },
  { id: 'bild_matching',  label: 'Bild-Raten',         beschreibung: 'Emoji dem Wort zuordnen' },
  { id: 'reihenfolge',    label: 'Reihenfolge',        beschreibung: 'Sätze in die richtige Reihenfolge' },
]

export default function Wiederholen() {
  const navigate = useNavigate()
  const user = getUser()
  const etappe = user?.etappe ?? 1

  const reviewVocab = getVocabForReview(8)
  const vocabForGames = reviewVocab.length >= 4
    ? reviewVocab
    : ANFAENGER_VOKABULAR.slice().sort(() => Math.random() - 0.5).slice(0, 8)

  const anfaengerVocabForBild = ANFAENGER_VOKABULAR.slice().sort(() => Math.random() - 0.5).slice(0, 8)

  const [activeSpiel, setActiveSpiel] = useState<SpielId | null>(null)

  function handleSpielFinish() {
    setActiveSpiel(null)
  }

  if (activeSpiel === 'wort_paare') {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F1EB] max-w-content mx-auto px-5 pt-5 pb-10">
        <button
          onClick={() => setActiveSpiel(null)}
          className="text-muted text-sm tap-scale self-start mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          ← Zurück
        </button>
        <SpielWortPaare vocab={vocabForGames.slice(0, 6)} onFinish={handleSpielFinish} />
      </div>
    )
  }

  if (activeSpiel === 'luecken') {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F1EB] max-w-content mx-auto px-5 pt-5 pb-10">
        <button
          onClick={() => setActiveSpiel(null)}
          className="text-muted text-sm tap-scale self-start mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          ← Zurück
        </button>
        <SpielLueckenFuellen vocab={vocabForGames.slice(0, 5)} etappe={etappe} onFinish={handleSpielFinish} />
      </div>
    )
  }

  if (activeSpiel === 'bild_matching') {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F1EB] max-w-content mx-auto px-5 pt-5 pb-10">
        <button
          onClick={() => setActiveSpiel(null)}
          className="text-muted text-sm tap-scale self-start mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          ← Zurück
        </button>
        <SpielBildMatching vocab={anfaengerVocabForBild} onFinish={handleSpielFinish} />
      </div>
    )
  }

  if (activeSpiel === 'reihenfolge') {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F1EB] max-w-content mx-auto px-5 pt-5 pb-10">
        <button
          onClick={() => setActiveSpiel(null)}
          className="text-muted text-sm tap-scale self-start mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          ← Zurück
        </button>
        <SpielReihenfolge etappe={etappe} onFinish={handleSpielFinish} />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F1EB] max-w-content mx-auto px-5 pt-5 pb-10">
      <button
        onClick={() => navigate('/heute')}
        aria-label="Zurück zur Hauptseite"
        className="text-muted text-sm tap-scale self-start mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
      >
        ← Zurück
      </button>

      <h1 className="font-serif text-[28px] font-semibold text-text leading-tight mb-2">Wiederholen</h1>
      <p className="text-[14px] text-muted mb-8">Wähle ein Spiel zum Üben.</p>

      <div className="grid grid-cols-2 gap-3">
        {SPIELE.map(spiel => (
          <button
            key={spiel.id}
            onClick={() => setActiveSpiel(spiel.id)}
            className="bg-white border border-[#E0DDD8] rounded-[16px] px-4 py-5 text-left tap-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            style={{ boxShadow: '0 1px 4px rgba(26,26,26,0.04)' }}
          >
            <p className="font-semibold text-[15px] text-text leading-tight">{spiel.label}</p>
            <p className="text-[12px] text-muted mt-1">{spiel.beschreibung}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
