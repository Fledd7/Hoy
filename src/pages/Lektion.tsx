import { useCallback, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import LessonView from '../components/LessonView'
import Button from '../components/Button'
import { tiredLessons, okayLessons, fitLessons } from '../lib/dummy'
import { ABSCHLUSS_SAETZE } from '../lib/config'
import type { EnergyMode, Lesson } from '../lib/types'

function getDailyIndex(arr: unknown[]): number {
  const today = new Date()
  const seed =
    today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  return seed % arr.length
}

function getLessonForMode(mode: EnergyMode): Lesson | null {
  switch (mode) {
    case 'muede':
      return tiredLessons[getDailyIndex(tiredLessons)]
    case 'okay':
      return okayLessons[getDailyIndex(okayLessons)]
    case 'fit':
      return fitLessons[getDailyIndex(fitLessons)]
    default:
      return null
  }
}

export default function Lektion() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [abschluss, setAbschluss] = useState(false)

  const rawMode = searchParams.get('mode')
  const mode: EnergyMode | null =
    rawMode === 'muede' || rawMode === 'okay' || rawMode === 'fit' || rawMode === 'erzaehl'
      ? rawMode
      : null

  const abschlussSatz = ABSCHLUSS_SAETZE[getDailyIndex(ABSCHLUSS_SAETZE)]

  const handleFinish = useCallback(() => {
    setAbschluss(true)
    setTimeout(() => navigate('/heute', { replace: true }), 800)
  }, [navigate])

  if (!mode) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center px-6 gap-4">
        <p className="text-muted text-center">Lektion nicht gefunden.</p>
        <Button variant="ghost" onClick={() => navigate('/heute')}>
          Zurück
        </Button>
      </div>
    )
  }

  if (mode === 'erzaehl') {
    return (
      <div className="flex flex-col min-h-screen bg-background max-w-content mx-auto px-5 pt-5 pb-8">
        <button
          onClick={() => navigate('/heute')}
          aria-label="Zurück zur Hauptseite"
          className="text-muted text-sm tap-scale self-start mb-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          ← Zurück
        </button>
        <div className="flex flex-col items-center justify-center flex-1 text-center gap-4">
          <p className="text-4xl" aria-hidden="true">🔜</p>
          <h2 className="text-xl font-semibold text-text">Dieser Modus kommt bald</h2>
          <p className="text-muted text-base max-w-xs">
            Wir arbeiten daran. Probiere in der Zwischenzeit einen der anderen Modi.
          </p>
          <Button variant="secondary" onClick={() => navigate('/heute')}>
            Zurück
          </Button>
        </div>
      </div>
    )
  }

  const lesson = getLessonForMode(mode)

  if (!lesson) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center px-6 gap-4">
        <p className="text-muted text-center">Keine Lektion verfügbar.</p>
        <Button variant="ghost" onClick={() => navigate('/heute')}>
          Zurück
        </Button>
      </div>
    )
  }

  if (abschluss) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center fade-in">
        <p className="text-2xl font-semibold text-text">{abschlussSatz}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background max-w-content mx-auto px-5 pt-5 pb-10">
      <button
        onClick={() => navigate('/heute')}
        aria-label="Zurück zur Hauptseite"
        className="text-muted text-sm tap-scale self-start mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
      >
        ← Zurück
      </button>
      <LessonView lesson={lesson} onFinish={handleFinish} />
    </div>
  )
}
