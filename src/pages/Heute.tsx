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
  { mode: 'erzaehl', label: 'Erzähl mir was', sublabel: 'Bald verfügbar' },
]

export default function Heute() {
  const navigate = useNavigate()
  const [showBanner, setShowBanner] = useState(false)

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
          <h1 className="text-2xl font-semibold text-text mb-8 leading-snug">
            Wie geht's dir heute?
          </h1>
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
