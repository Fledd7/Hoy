import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProfileIcon from '../components/ProfileIcon'
import EnergyButton from '../components/EnergyButton'
import ReturnBanner from '../components/ReturnBanner'
import { isOnboardingDone, getDaysSinceLastOpen, updateLetztesOeffnen } from '../lib/storage'
import type { EnergyMode } from '../lib/types'

const ENERGIE_BUTTONS: { mode: EnergyMode; label: string; sublabel: string }[] = [
  { mode: 'muede', label: 'Müde', sublabel: 'Kurzer Lese-Snack, 2 Minuten' },
  { mode: 'okay', label: 'Okay', sublabel: 'Lektion mit Verständnisfragen' },
  { mode: 'fit', label: 'Fit', sublabel: 'Dialog + Vokabeln, zwei Teile' },
  { mode: 'erzaehl', label: 'Erzähl mir was', sublabel: 'Dein Tag auf Spanisch' },
]

const TIME_GREETINGS: { es: string; de: string; hours: [number, number] }[] = [
  { es: 'Buenos días.', de: 'Guten Morgen.', hours: [5, 12] },
  { es: 'Buenas tardes.', de: 'Guten Nachmittag.', hours: [12, 18] },
  { es: 'Buenas noches.', de: 'Guten Abend.', hours: [18, 5] },
]

const RANDOM_GREETINGS: { es: string; de: string }[] = [
  { es: '¿Listo para aprender?', de: 'Bereit zum Lernen?' },
  { es: '¿Qué tal?', de: 'Wie läuft\'s?' },
  { es: 'Hola de nuevo.', de: 'Hallo nochmal.' },
  { es: '¿Cómo estás hoy?', de: 'Wie geht\'s dir heute?' },
  { es: 'Un poco cada día.', de: 'Ein bisschen jeden Tag.' },
]

function pickGreeting(): { es: string; de: string } {
  const hour = new Date().getHours()
  const timeMatch = TIME_GREETINGS.find(g => {
    const [from, to] = g.hours
    return from < to ? hour >= from && hour < to : hour >= from || hour < to
  })
  // Alternate between time-based and random using current minute parity
  if (timeMatch && new Date().getMinutes() % 2 === 0) return timeMatch
  const random = RANDOM_GREETINGS[Math.floor(Math.random() * RANDOM_GREETINGS.length)]
  return random
}

export default function Heute() {
  const navigate = useNavigate()
  const [showBanner, setShowBanner] = useState(false)
  const [greeting] = useState(pickGreeting)

  useEffect(() => {
    if (!isOnboardingDone()) {
      navigate('/onboarding', { replace: true })
      return
    }
    const days = getDaysSinceLastOpen()
    setShowBanner(days > 3)
    updateLetztesOeffnen()
  }, [navigate])

  function handleEnergySelect(mode: EnergyMode) {
    navigate(`/lektion?mode=${mode}`)
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="w-full max-w-content mx-auto px-5 pt-5 pb-8 flex flex-col h-screen">
        <header className="flex items-center justify-between mb-8">
          <span className="text-xl font-semibold text-text">Hoy</span>
          <ProfileIcon />
        </header>
        <main className="flex flex-col flex-1 justify-center">
          <div className="mb-8">
            <p className="font-serif text-[28px] font-semibold text-text leading-tight">{greeting.es}</p>
            <p className="text-[14px] text-muted mt-1">{greeting.de}</p>
          </div>
          <ReturnBanner visible={showBanner} />
          <div className="flex flex-col gap-3">
            {ENERGIE_BUTTONS.map((btn) => (
              <EnergyButton
                key={btn.mode}
                label={btn.label}
                sublabel={btn.sublabel}
                onClick={() => handleEnergySelect(btn.mode)}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
