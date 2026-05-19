import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Zap, Flame, MessageCircle } from 'lucide-react'
import ProfileIcon from '../components/ProfileIcon'
import EnergyButton from '../components/EnergyButton'
import ReturnBanner from '../components/ReturnBanner'
import { isOnboardingDone, getDaysSinceLastOpen, updateLetztesOeffnen } from '../lib/storage'
import type { EnergyMode } from '../lib/types'

const ENERGIE_BUTTONS: { mode: EnergyMode; label: string; sublabel: string; icon: ReactNode }[] = [
  { mode: 'muede', label: 'Müde', sublabel: 'Kurzer Lese-Snack, 2 Minuten', icon: <BookOpen size={22} /> },
  { mode: 'okay', label: 'Okay', sublabel: 'Lektion mit Verständnisfragen', icon: <Zap size={22} /> },
  { mode: 'fit', label: 'Fit', sublabel: 'Dialog + Vokabeln, zwei Teile', icon: <Flame size={22} /> },
  { mode: 'erzaehl', label: 'Erzähl mir was', sublabel: 'Dein Tag auf Spanisch', icon: <MessageCircle size={22} /> },
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
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F1EB]">
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
            {ENERGIE_BUTTONS.map((btn, idx) => (
              <div key={btn.mode} className="enter-up" style={{ animationDelay: `${idx * 80}ms` }}>
                <EnergyButton
                  label={btn.label}
                  sublabel={btn.sublabel}
                  icon={btn.icon}
                  onClick={() => handleEnergySelect(btn.mode)}
                />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
