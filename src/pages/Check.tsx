import { useReducer, useEffect } from 'react'
import { questions } from '../lib/youtube/questions'
import type {
  Answers,
  ChannelData,
  ChannelCheckResponse,
  QuestionOption,
  ResultPayload,
} from '../lib/youtube/types'
import { buildResult } from '../lib/youtube/results'
import { calcScore, leadClass } from '../lib/youtube/scoring'
import StartScreen from '../components/youtube/StartScreen'
import QuestionStep from '../components/youtube/QuestionStep'
import ChannelLinkStep from '../components/youtube/ChannelLinkStep'
import ProgressBar from '../components/youtube/ProgressBar'
import ResultPreview from '../components/youtube/ResultPreview'
import LeadCaptureForm, { type LeadFormValues } from '../components/youtube/LeadCaptureForm'
import ConfirmationScreen from '../components/youtube/ConfirmationScreen'

type Step = 'start' | 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'link' | 'loading' | 'result' | 'lead' | 'done'

interface State {
  step: Step
  answers: Answers
  channelUrl: string
  channel: ChannelData | null
  result: ResultPayload | null
}

type Action =
  | { type: 'start' }
  | { type: 'answer'; id: keyof Answers; option: QuestionOption }
  | { type: 'back' }
  | { type: 'setLink'; url: string }
  | { type: 'skipLink' }
  | { type: 'channelLoaded'; channel: ChannelData | null }
  | { type: 'toLead' }
  | { type: 'done' }

const ORDER: Step[] = ['start', 'q1', 'q2', 'q3', 'q4', 'q5', 'link', 'loading', 'result', 'lead', 'done']
const Q_IDS: Array<keyof Answers> = ['status', 'goal', 'problem', 'thumbnails', 'support']

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'start':
      return { ...state, step: 'q1' }
    case 'answer': {
      const newAnswers = { ...state.answers, [action.id]: action.option }
      const idx = Q_IDS.indexOf(action.id)
      const nextStep: Step = idx < Q_IDS.length - 1 ? (`q${idx + 2}` as Step) : 'link'
      return { ...state, answers: newAnswers, step: nextStep }
    }
    case 'back': {
      const i = ORDER.indexOf(state.step)
      const prev = ORDER[Math.max(0, i - 1)]
      const safePrev = prev === 'loading' ? 'link' : prev
      return { ...state, step: safePrev }
    }
    case 'setLink':
      return { ...state, channelUrl: action.url, step: 'loading' }
    case 'skipLink':
      return { ...state, channelUrl: '', step: 'result', result: buildResult(state.answers, null) }
    case 'channelLoaded':
      return {
        ...state,
        channel: action.channel,
        step: 'result',
        result: buildResult(state.answers, action.channel),
      }
    case 'toLead':
      return { ...state, step: 'lead' }
    case 'done':
      return { ...state, step: 'done' }
    default:
      return state
  }
}

const initialState: State = {
  step: 'start',
  answers: {},
  channelUrl: '',
  channel: null,
  result: null,
}

export default function Check() {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    if (state.step !== 'loading') return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/channel-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: state.channelUrl }),
        })
        const data = (await res.json()) as ChannelCheckResponse
        if (cancelled) return
        if (data.ok) {
          dispatch({
            type: 'channelLoaded',
            channel: {
              channel: data.channel,
              metrics: data.metrics,
              thumbnails: data.thumbnails,
            },
          })
        } else {
          dispatch({ type: 'channelLoaded', channel: null })
        }
      } catch {
        if (!cancelled) dispatch({ type: 'channelLoaded', channel: null })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [state.step, state.channelUrl])

  const stepIndex = ORDER.indexOf(state.step)
  const showProgress = stepIndex >= 1 && stepIndex <= 6 // q1..link

  async function submitLead(values: LeadFormValues) {
    const score = calcScore({
      answers: state.answers,
      channel: state.channel,
      hasLink: !!state.channelUrl,
      message: values.message,
    })
    const cls = leadClass(score)
    const category = state.result?.category ?? 'A'

    const answersSerialised: Record<string, string> = {}
    for (const q of questions) {
      const a = state.answers[q.id]
      if (a) answersSerialised[q.id] = a.label
    }

    const res = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: values.name,
        email: values.email,
        message: values.message,
        consent: values.consent,
        channelUrl: state.channelUrl || undefined,
        answers: answersSerialised,
        scoreBreakdown: { score, leadClass: cls, category },
        channel: state.channel,
      }),
    })
    if (!res.ok) throw new Error('Senden fehlgeschlagen. Bitte später erneut versuchen.')
    dispatch({ type: 'done' })
  }

  return (
    <div className="min-h-screen bg-background">
      {showProgress && (
        <div className="sticky top-0 z-10 border-b border-black/5 bg-background/90 px-6 py-3 backdrop-blur">
          <div className="mx-auto max-w-xl">
            <ProgressBar
              current={Math.min(stepIndex, 6)}
              total={6}
              label={stepIndex <= 5 ? `Frage ${stepIndex} von 5` : 'Kanal verlinken (optional)'}
            />
          </div>
        </div>
      )}

      <main className="transition-opacity duration-300">
        {state.step === 'start' && <StartScreen onStart={() => dispatch({ type: 'start' })} />}

        {Q_IDS.map((id, i) => {
          const stepName = `q${i + 1}` as Step
          if (state.step !== stepName) return null
          const q = questions[i]
          return (
            <QuestionStep
              key={id}
              question={q}
              selected={state.answers[id]}
              onSelect={(opt) => dispatch({ type: 'answer', id, option: opt })}
              onBack={i > 0 ? () => dispatch({ type: 'back' }) : undefined}
            />
          )
        })}

        {state.step === 'link' && (
          <ChannelLinkStep
            onSubmit={(url) => dispatch({ type: 'setLink', url })}
            onSkip={() => dispatch({ type: 'skipLink' })}
            onBack={() => dispatch({ type: 'back' })}
          />
        )}

        {state.step === 'loading' && (
          <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
            <div
              className="h-10 w-10 animate-spin rounded-full border-2 border-black/10 border-t-accent"
              role="status"
              aria-label="Kanal wird geladen"
            />
            <p className="mt-5 text-sm text-muted">Ich schaue mir deinen Kanal an …</p>
          </div>
        )}

        {state.step === 'result' && state.result && (
          <ResultPreview
            result={state.result}
            channel={state.channel}
            onContinue={() => dispatch({ type: 'toLead' })}
          />
        )}

        {state.step === 'lead' && <LeadCaptureForm onSubmit={submitLead} />}

        {state.step === 'done' && <ConfirmationScreen />}
      </main>
    </div>
  )
}
