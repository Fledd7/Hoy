import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OnboardingStep from '../components/OnboardingStep'
import Button from '../components/Button'
import ThemeChip from '../components/ThemeChip'
import { saveUser } from '../lib/storage'
import { THEMEN, REQUIRED_THEMEN_COUNT } from '../lib/config'
import { etappeForNiveau } from '../lib/etappen'
import type { UserData } from '../lib/types'

type Step = 'welcome' | 'niveau' | 'wiedereinsteiger' | 'themen' | 'why' | 'fertig'
type NiveauBase = 'anfaenger' | 'wiedereinsteiger'

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('welcome')
  const [niveau, setNiveau] = useState<UserData['niveau'] | null>(null)
  const [themen, setThemen] = useState<string[]>([])
  const [why, setWhy] = useState('')

  function handleNiveauBase(base: NiveauBase) {
    if (base === 'anfaenger') {
      setNiveau('anfaenger')
      setStep('themen')
    } else {
      setStep('wiedereinsteiger')
    }
  }

  function handleWiedereinsteiger(n: UserData['niveau']) {
    setNiveau(n)
    setStep('themen')
  }

  function toggleThema(thema: string) {
    setThemen((prev) =>
      prev.includes(thema)
        ? prev.filter((t) => t !== thema)
        : prev.length < REQUIRED_THEMEN_COUNT
        ? [...prev, thema]
        : prev
    )
  }

  function handleFinish() {
    if (!niveau) return
    const isAnfaenger = niveau === 'anfaenger'
    saveUser({
      niveau,
      themen,
      why,
      onboardingDone: true,
      letztesOeffnen: new Date().toISOString(),
      etappe: etappeForNiveau(niveau),
      lektionenInEtappe: 0,
      anfaengerPfadStart: isAnfaenger ? new Date().toISOString() : null,
      anfaengerPfadAktiv: isAnfaenger,
    })
    navigate('/heute', { replace: true })
  }

  if (step === 'welcome') {
    return (
      <div className="fade-in flex flex-col min-h-screen bg-background">
        <div className="mx-auto w-full max-w-content px-8 flex-1 flex flex-col justify-center pb-[10vh]">
          <h1 className="font-serif text-[36px] font-semibold text-text leading-tight">Hola. Ich bin Hoy.</h1>
          <p className="text-[18px] text-[#6B6B6B] mt-3 leading-snug">Spanisch lernen – ein kleiner Moment am Tag. Kein Druck, kein Stress.</p>
          <div className="mt-16">
            <Button variant="primary" fullWidth onClick={() => setStep('niveau')}>
              Los geht's
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'niveau') {
    return (
      <OnboardingStep
        title="Wo stehst du?"
        subtitle="Das hilft uns, die richtige Lektion für dich zu finden."
      >
        <div className="flex flex-col gap-3 mt-2">
          <Button variant="secondary" fullWidth onClick={() => handleNiveauBase('anfaenger')}>
            Ich fange ganz neu an
          </Button>
          <Button variant="secondary" fullWidth onClick={() => handleNiveauBase('wiedereinsteiger')}>
            Ich kann schon etwas Spanisch
          </Button>
        </div>
      </OnboardingStep>
    )
  }

  if (step === 'wiedereinsteiger') {
    return (
      <OnboardingStep
        title="Wie gut war dein Spanisch?"
        subtitle="Ungefähr reicht völlig."
      >
        <div className="flex flex-col gap-3 mt-2">
          <Button variant="secondary" fullWidth onClick={() => handleWiedereinsteiger('wiedereinsteiger_schule')}>
            Schule liegt lange zurück
          </Button>
          <Button variant="secondary" fullWidth onClick={() => handleWiedereinsteiger('wiedereinsteiger_a2')}>
            Ich verstehe einfache Sätze
          </Button>
          <Button variant="secondary" fullWidth onClick={() => handleWiedereinsteiger('wiedereinsteiger_b1')}>
            Ich kann mich unterhalten
          </Button>
        </div>
      </OnboardingStep>
    )
  }

  if (step === 'themen') {
    const remaining = REQUIRED_THEMEN_COUNT - themen.length
    return (
      <OnboardingStep
        title="Wähle 5 Themen"
        subtitle={
          remaining > 0
            ? `Noch ${remaining} ${remaining === 1 ? 'Thema' : 'Themen'} wählen`
            : 'Super! Du hast deine 5 Themen.'
        }
      >
        <div className="flex flex-wrap gap-2 mt-2">
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
        <div className="mt-auto pt-8">
          <Button
            variant="primary"
            fullWidth
            onClick={() => setStep('why')}
            disabled={themen.length !== REQUIRED_THEMEN_COUNT}
          >
            Weiter
          </Button>
        </div>
      </OnboardingStep>
    )
  }

  if (step === 'why') {
    return (
      <OnboardingStep
        title="Warum lernst du Spanisch?"
        subtitle="Optional – nur für dich."
      >
        <textarea
          value={why}
          onChange={(e) => setWhy(e.target.value)}
          placeholder="Zum Beispiel: Mit der Familie meiner Partnerin reden können."
          rows={4}
          className="w-full bg-white border border-[#E0DDD8] rounded-card px-4 py-3 text-base text-text placeholder:text-muted resize-none focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <div className="mt-auto pt-8 flex flex-col gap-3">
          <Button variant="primary" fullWidth onClick={() => setStep('fertig')}>
            {why.trim() ? 'Weiter' : 'Überspringen'}
          </Button>
        </div>
      </OnboardingStep>
    )
  }

  if (step === 'fertig') {
    return (
      <OnboardingStep
        title="Deine erste Mini-Lektion ist bereit."
        subtitle="Jeden Tag nur ein kleiner Moment – das reicht."
      >
        <div className="mt-auto">
          <Button variant="primary" fullWidth onClick={handleFinish}>
            Zur App
          </Button>
        </div>
      </OnboardingStep>
    )
  }

  return null
}
