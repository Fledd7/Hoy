import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import LessonView from '../components/LessonView'
import Button from '../components/Button'
import {
  getUser,
  addSeenVocab,
  addCompletedModeToday,
  getCompletedModesToday,
  incrementLektionenInEtappe,
  ensureEtappenMigration,
} from '../lib/storage'
import { fetchLektion, clearModeCache } from '../lib/api'
import { ETAPPEN } from '../lib/etappen'
import type { Etappe } from '../lib/etappen'
import type { EnergyMode, Lesson } from '../lib/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ABSCHLUSS_ES = [
  'Hasta mañana.',
  'Hasta luego.',
  'Buen trabajo.',
  'Eso es todo por hoy.',
  'Nos vemos.',
]

const UEBERGANG_SAETZE = ['Sigues adelante.', 'Buen camino.', 'Adelante.']

function extractVocab(lesson: Lesson): { es: string; de: string }[] {
  if (lesson.mode === 'muede') return lesson.vocab
  if (lesson.mode === 'okay') return []
  return lesson.vocab
}

function extractKeyword(lesson: Lesson): { es: string; de: string } | null {
  if (lesson.mode === 'muede') return lesson.vocab[0] ?? null
  if (lesson.mode === 'fit')   return lesson.vocab[0] ?? null
  if (lesson.mode === 'erzaehl') return lesson.vocab[0] ?? null
  const stop = new Set(['el','la','los','las','un','una','en','de','a','y','que',
    'se','su','con','por','para','es','ha','al','del','su','lo'])
  const words = lesson.text.split(/[\s,.:;!?'"()]+/)
  const word = words.find(w => w.length > 4 && !stop.has(w.toLowerCase()))
  return word ? { es: word, de: '' } : null
}

// ─── Etappen-Übergangs-Screen ─────────────────────────────────────────────────

function EtappenUebergangScreen({
  von,
  zu,
  onWeiter,
}: {
  von: Etappe
  zu: Etappe
  onWeiter: () => void
}) {
  const [phase, setPhase] = useState<0 | 1 | 2>(0)
  const [satz] = useState(() => UEBERGANG_SAETZE[Math.floor(Math.random() * UEBERGANG_SAETZE.length)])

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1500)
    const t2 = setTimeout(() => setPhase(2), 3000)
    const t3 = setTimeout(() => onWeiter(), 8000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onWeiter])

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF7F2] items-center justify-center px-8">
      <p
        className="text-[11px] text-muted mb-10"
        style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
      >
        Du gehst weiter.
      </p>

      <div className="w-full max-w-[340px] flex flex-col gap-4">
        {/* Alte Etappe – fades up */}
        <div
          style={{
            opacity: phase >= 1 ? 0 : 1,
            transform: phase >= 1 ? 'translateY(-16px)' : 'translateY(0)',
            transition: 'opacity 500ms ease-out, transform 500ms ease-out',
            height: phase >= 2 ? 0 : 'auto',
            overflow: 'hidden',
          }}
        >
          <div className="bg-white border border-[#E0DDD8] rounded-[16px] px-5 py-4">
            <p className="text-[11px] text-muted mb-1" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              War unterwegs in
            </p>
            <p className="font-serif text-[20px] font-semibold text-text leading-tight">{von.name}</p>
            <p className="text-[13px] text-muted italic mt-0.5">{von.untertitel}</p>
          </div>
        </div>

        {/* Neue Etappe – fades in */}
        <div
          style={{
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 2 ? 'translateY(0) scale(1.01)' : 'translateY(8px) scale(0.98)',
            transition: 'opacity 500ms ease-out, transform 500ms ease-out',
          }}
        >
          <div
            className="bg-white rounded-[16px] px-5 py-4"
            style={{
              border: '1px solid rgba(194,85,61,0.3)',
              boxShadow: '0 0 0 3px rgba(194,85,61,0.08), 0 4px 16px rgba(26,26,26,0.06)',
            }}
          >
            <p className="text-[11px] text-accent font-semibold mb-1" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Neue Etappe
            </p>
            <p className="font-serif text-[22px] font-semibold text-text leading-tight">{zu.name}</p>
            <p className="text-[13px] text-muted italic mt-0.5">{zu.untertitel}</p>
          </div>
        </div>
      </div>

      <p className="text-[15px] text-muted italic mt-10">{satz}</p>

      {phase >= 1 && (
        <button
          onClick={onWeiter}
          className="fade-in mt-8 w-full max-w-[340px] bg-accent text-white rounded-[16px] py-4 text-[16px] font-semibold tap-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Bereit für {zu.name}
        </button>
      )}
    </div>
  )
}

// ─── Types ───────────────────────────────────────────────────────────────────

type PageState =
  | { kind: 'erzaehl_input' }
  | { kind: 'loading' }
  | { kind: 'ready'; lesson: Lesson }
  | { kind: 'error' }

const BACK_BTN =
  'text-muted text-sm tap-scale self-start mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded'

const PAGE_WRAP =
  'flex flex-col min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F1EB] max-w-content mx-auto px-5 pt-5 pb-10'

// ─── Component ───────────────────────────────────────────────────────────────

export default function Lektion() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [abschluss, setAbschluss] = useState(false)
  const [fadingOut, setFadingOut] = useState(false)
  const [erzaehlInput, setErzaehlInput] = useState('')
  const [etappenUebergang, setEtappenUebergang] = useState<{ von: Etappe; zu: Etappe } | null>(null)

  const rawMode = searchParams.get('mode')
  const mode: EnergyMode | null =
    rawMode === 'muede' || rawMode === 'okay' || rawMode === 'fit' || rawMode === 'erzaehl'
      ? rawMode
      : null

  const [pageState, setPageState] = useState<PageState>(
    mode === 'erzaehl' ? { kind: 'erzaehl_input' } : { kind: 'loading' },
  )

  const [signOff] = useState(
    () => ABSCHLUSS_ES[Math.floor(Math.random() * ABSCHLUSS_ES.length)],
  )

  const loadLektion = useCallback(
    async (m: EnergyMode, userInput?: string) => {
      setPageState({ kind: 'loading' })
      ensureEtappenMigration()
      const user = getUser()
      if (!user) { navigate('/onboarding', { replace: true }); return }

      const etappe = user.etappe !== undefined
        ? ETAPPEN.find(e => e.nummer === user.etappe)
        : undefined

      try {
        const lesson = await fetchLektion(
          m,
          {
            niveau: user.niveau,
            themen: user.themen,
            why: user.why,
            etappenName: etappe?.name,
            etappenBeschreibung: etappe?.beschreibung,
            etappenNiveau: etappe?.niveau,
          },
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
    if (getCompletedModesToday().has(mode)) {
      clearModeCache(mode)
    }
    void loadLektion(mode)
  }, [mode, loadLektion])

  // Abschluss timing: 1800ms total, fade-out starts at 1600ms
  useEffect(() => {
    if (!abschluss) return
    const t1 = setTimeout(() => setFadingOut(true), 1600)
    const t2 = setTimeout(() => navigate('/heute', { replace: true }), 1800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [abschluss, navigate])

  const handleWeiter = useCallback(() => {
    navigate('/heute', { replace: true })
  }, [navigate])

  const handleFinish = useCallback(() => {
    if (pageState.kind === 'ready') {
      addSeenVocab(extractVocab(pageState.lesson))
    }
    if (mode) addCompletedModeToday(mode)

    const { advanced, newEtappe } = incrementLektionenInEtappe()
    if (advanced) {
      const von = ETAPPEN[newEtappe - 2]
      const zu = ETAPPEN[newEtappe - 1]
      setEtappenUebergang({ von, zu })
    } else {
      setAbschluss(true)
    }
  }, [pageState, mode])

  // ─── Etappen-Übergang ─────────────────────────────────────────────────────
  if (etappenUebergang) {
    return (
      <EtappenUebergangScreen
        von={etappenUebergang.von}
        zu={etappenUebergang.zu}
        onWeiter={handleWeiter}
      />
    )
  }

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
    const lesson = pageState.kind === 'ready' ? pageState.lesson : null
    const keyword = lesson ? extractKeyword(lesson) : null

    return (
      <div className={`flex flex-col min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F1EB] items-center justify-center px-8 gap-3 ${fadingOut ? 'fade-out' : 'fade-in'}`}>
        {keyword?.es && (
          <p className="font-serif text-[48px] font-semibold text-text text-center leading-tight">
            {keyword.es}
          </p>
        )}
        {keyword?.de && (
          <p className="text-[18px] text-muted text-center">{keyword.de}</p>
        )}
        <p className="absolute bottom-10 text-sm text-muted">{signOff}</p>
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
