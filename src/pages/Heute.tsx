import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Zap, Flame, MessageCircle } from 'lucide-react'
import ProfileIcon from '../components/ProfileIcon'
import EnergyButton from '../components/EnergyButton'
import ReturnBanner from '../components/ReturnBanner'
import {
  isOnboardingDone,
  getDaysSinceLastOpen,
  updateLetztesOeffnen,
  getCompletedModesToday,
  ensureEtappenMigration,
  getUser,
} from '../lib/storage'
import { ETAPPEN } from '../lib/etappen'
import type { EnergyMode, UserData } from '../lib/types'

const ENERGIE_BUTTONS: { mode: EnergyMode; label: string; sublabel: string; icon: ReactNode }[] = [
  { mode: 'muede',   label: 'Müde',          sublabel: 'Kurzer Lese-Snack, 2 Minuten',  icon: <BookOpen size={22} /> },
  { mode: 'okay',    label: 'Okay',           sublabel: 'Lektion mit Verständnisfragen', icon: <Zap size={22} /> },
  { mode: 'fit',     label: 'Fit',            sublabel: 'Dialog + Vokabeln, zwei Teile', icon: <Flame size={22} /> },
  { mode: 'erzaehl', label: 'Erzähl mir was', sublabel: 'Dein Tag auf Spanisch',         icon: <MessageCircle size={22} /> },
]

const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
const MONTHS   = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

function formatDate(): string {
  const d = new Date()
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}`
}

const TIME_GREETINGS: { es: string; de: string; hours: [number, number] }[] = [
  { es: 'Buenos días.',   de: 'Guten Morgen.',     hours: [5, 12] },
  { es: 'Buenas tardes.', de: 'Guten Nachmittag.', hours: [12, 18] },
  { es: 'Buenas noches.', de: 'Guten Abend.',       hours: [18, 5] },
]

const RANDOM_GREETINGS: { es: string; de: string }[] = [
  { es: '¿Listo para aprender?', de: 'Bereit zum Lernen?' },
  { es: '¿Qué tal?',             de: 'Wie läuft\'s?' },
  { es: 'Hola de nuevo.',        de: 'Hallo nochmal.' },
  { es: '¿Cómo estás hoy?',      de: 'Wie geht\'s dir heute?' },
  { es: 'Un poco cada día.',     de: 'Ein bisschen jeden Tag.' },
]

function pickGreeting(): { es: string; de: string } {
  const hour = new Date().getHours()
  const timeMatch = TIME_GREETINGS.find(g => {
    const [from, to] = g.hours
    return from < to ? hour >= from && hour < to : hour >= from || hour < to
  })
  if (timeMatch && new Date().getMinutes() % 2 === 0) return timeMatch
  return RANDOM_GREETINGS[Math.floor(Math.random() * RANDOM_GREETINGS.length)]
}

export default function Heute() {
  const navigate = useNavigate()
  const [showBanner, setShowBanner] = useState(false)
  const [greeting] = useState(pickGreeting)
  const [doneToday, setDoneToday] = useState<Set<EnergyMode>>(new Set())
  const [user, setUser] = useState<UserData | null>(null)

  useEffect(() => {
    if (!isOnboardingDone()) {
      navigate('/onboarding', { replace: true })
      return
    }
    ensureEtappenMigration()
    const days = getDaysSinceLastOpen()
    setShowBanner(days > 3)
    updateLetztesOeffnen()
    setDoneToday(getCompletedModesToday())
    setUser(getUser())
  }, [navigate])

  function handleEnergySelect(mode: EnergyMode) {
    navigate(`/lektion?mode=${mode}`)
  }

  const etappe = user?.etappe !== undefined ? ETAPPEN[user.etappe - 1] : null
  const lektionen = Math.min(user?.lektionenInEtappe ?? 0, 10)

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F1EB]">
      <div className="w-full max-w-content mx-auto px-6 pt-6 pb-8 flex flex-col">

        <header className="flex items-center justify-between mb-6">
          <span className="font-serif text-[28px] font-bold text-text">Hoy</span>
          <ProfileIcon />
        </header>

        {/* Etappen-Indikator */}
        {etappe && (
          <button
            onClick={() => navigate('/profil')}
            className="mb-6 w-full text-left tap-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[12px]"
          >
            <p
              className="text-[11px] text-muted mb-1"
              style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              Deine Etappe
            </p>
            <div className="flex items-center justify-between gap-3">
              <p className="font-serif text-[22px] font-semibold text-text leading-tight">
                {etappe.name}
              </p>
              <div className="flex items-center gap-[3px] flex-shrink-0">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span
                    key={i}
                    className="rounded-full"
                    style={{
                      width: 16,
                      height: 2,
                      backgroundColor: i < lektionen ? '#C2553D' : '#E0DBD6',
                    }}
                  />
                ))}
              </div>
            </div>
            <p className="text-[13px] text-muted italic mt-0.5">{etappe.untertitel}</p>
          </button>
        )}

        <div className="mb-12">
          <p
            className="text-[13px] text-muted mb-3"
            style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            {formatDate()}
          </p>
          <p className="font-serif text-[28px] font-semibold text-text leading-tight greeting-in">{greeting.es}</p>
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
                doneToday={doneToday.has(btn.mode)}
                onClick={() => handleEnergySelect(btn.mode)}
              />
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
