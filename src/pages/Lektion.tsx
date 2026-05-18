import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import LessonView from '../components/LessonView'
import Button from '../components/Button'
import { ABSCHLUSS_SAETZE } from '../lib/config'
import { getUser } from '../lib/storage'
import { fetchLektion } from '../lib/api'
import type { EnergyMode, Lesson } from '../lib/types'

function getDailyIndex(arr: unknown[]): number {
  const today = new Date()
  const seed =
    today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  return seed % arr.length
}

type PageState =
  | { kind: 'erzaehl_input' }
  | { kind: 'loading' }
  | { kind: 'ready'; lesson: Lesson }
  | { kind: 'error' }

const BACK_BTN =
  'text-muted text-sm tap-scale self-start mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded'

const PAGE_WRAP =
  'flex flex-col min-h-screen bg-background max-w-content mx-auto px-5 pt-5 pb-10'

export default function Lektion() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [abschluss, setAbschluss] = useState(false)
  const [erzaehlInput, setErzaehlInput] = useState('')

  const rawMode = searchParams.get('mode')
  const mode: EnergyMode | null =
    rawMode === 'muede' || rawMode === 'okay' || rawMode === 'fit' || rawMode === 'erzaehl'
      ? rawMode
      : null

  const [pageState, setPageState] = useState<PageState>(
    mode === 'erzaehl' ? { kind: 'erzaehl_input' } : { kind: 'loading' },
  )

  const abschlussSatz = ABSCHLUSS_SAETZE[getDailyIndex(ABSCHLUSS_SAETZE)]

  const loadLektion = useCallback(
    async (m: EnergyMode, userInput?: string) => {
      setPageState({ kind: 'loading' })
      const user = getUser()
      if (!user) { navigate('/onboarding', { replace: true }); return }
      try {
        const lesson = await fetchLektion(
          m,
          { niveau: user.niveau, themen: user.themen, why: user.why },
          userInput,
        )
        setPageState({ kind: 'ready', lesson })
      } catch {
        setPageState({ kind: 'error' })
      }
    },
    [navigate],
  )

  useEffect(() => {
    if (!mode || mode === 'erzaehl') return
    void loadLektion(mode)
  }, [mode, loadLektion])

  const handleFinish = useCallback(() => {
    setAbschluss(true)
    const duration = mode === 'muede' ? 1200 : 800
    setTimeout(() => navigate('/heute', { replace: true }), duration)
  }, [navigate, mode])

  // ─── invalid mode ──────────────────────────────────────────────────────────
  if (!mode) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center px-6 gap-4">
        <p className="text-muted text-center">Lektion nicht gefunden.</p>
        <Button variant="ghost" onClick={() => navigate('/heute')}>Zurück</Button>
      </div>
    )
  }

  // ─── abschluss screen ──────────────────────────────────────────────────────
  if (abschluss) {
    const isMuede = mode === 'muede'
    const text = isMuede ? 'Gut. Mehr muss heute nicht sein.' : abschlussSatz
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center fade-in px-6">
        <p className={`text-center text-text ${isMuede ? 'text-[18px]' : 'text-2xl font-semibold'}`}>
          {text}
        </p>
      </div>
    )
  }

  const backBtn = (
    <button
      onClick={() => navigate('/heute')}
      aria-label="Zurück zur Hauptseite"
      className={BACK_BTN}
    >
      ← Zurück
    </button>
  )

  // ─── erzähl input ──────────────────────────────────────────────────────────
  if (pageState.kind === 'erzaehl_input') {
    return (
      <div className={PAGE_WRAP}>
        {backBtn}
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-[20px] text-text font-semibold">Was war heute so?</h2>
            <p className="text-[14px] text-muted mt-1">
              Beschreib kurz deinen Tag – auf Deutsch reicht.
            </p>
          </div>
          <textarea
            value={erzaehlInput}
            onChange={(e) => setErzaehlInput(e.target.value)}
            placeholder="Z.B. Krafttraining, Pizza gegessen, Schwester angerufen"
            rows={4}
            className="w-full bg-white border border-[#E0DDD8] rounded-card px-4 py-3 text-base text-text placeholder:text-muted resize-none focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <Button
            variant="primary"
            fullWidth
            disabled={!erzaehlInput.trim()}
            onClick={() => void loadLektion('erzaehl', erzaehlInput.trim())}
          >
            Daraus lernen
          </Button>
        </div>
      </div>
    )
  }

  // ─── loading skeleton ─────────────────────────────────────────────────────
  if (pageState.kind === 'loading') {
    return (
      <div className={PAGE_WRAP}>
        {backBtn}
        <div className="flex flex-col gap-4 pt-2">
          <div className="h-5 bg-[#E5E2DD] rounded animate-pulse w-4/5" />
          <div className="h-5 bg-[#E5E2DD] rounded animate-pulse w-full" />
          <div className="h-5 bg-[#E5E2DD] rounded animate-pulse w-2/3" />
        </div>
      </div>
    )
  }

  // ─── error ────────────────────────────────────────────────────────────────
  if (pageState.kind === 'error') {
    return (
      <div className={PAGE_WRAP}>
        {backBtn}
        <div className="flex flex-col items-center text-center gap-4 pt-8">
          <p className="text-muted text-base">
            Die Lektion konnte nicht geladen werden. Versuch es später nochmal.
          </p>
          <Button
            variant="secondary"
            onClick={() =>
              void loadLektion(mode, mode === 'erzaehl' ? erzaehlInput.trim() : undefined)
            }
          >
            Nochmal versuchen
          </Button>
        </div>
      </div>
    )
  }

  // ─── lesson ready ─────────────────────────────────────────────────────────
  return (
    <div className={PAGE_WRAP}>
      {backBtn}
      <LessonView lesson={pageState.lesson} onFinish={handleFinish} />
    </div>
  )
}
