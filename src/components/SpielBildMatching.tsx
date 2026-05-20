import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { recordVocabAnswer } from '../lib/vocabTracking'
import { ANFAENGER_VOKABULAR } from '../lib/anfaengerVokabular'
import type { AnfaengerVokabel } from '../lib/anfaengerVokabular'

interface Props {
  vocab: AnfaengerVokabel[]
  onFinish: () => void
}

interface GameData {
  rounds: AnfaengerVokabel[]
  optionSets: string[][]
}

function pickGameData(source: AnfaengerVokabel[]): GameData {
  const rounds = source.slice().sort(() => Math.random() - 0.5).slice(0, 8)
  const optionSets = rounds.map((item, i) => {
    const distractors = rounds
      .filter((_, j) => j !== i)
      .map(v => v.es)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
    return [item.es, ...distractors].sort(() => Math.random() - 0.5)
  })
  return { rounds, optionSets }
}

export default function SpielBildMatching({ vocab }: Props) {
  const navigate = useNavigate()
  const [gameData, setGameData] = useState<GameData>(() => pickGameData(vocab))
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [correct, setCorrect] = useState(0)
  const [done, setDone] = useState(false)

  const { rounds, optionSets } = gameData

  function handleNochEineRunde() {
    setGameData(pickGameData(ANFAENGER_VOKABULAR))
    setIndex(0)
    setSelected(null)
    setCorrect(0)
    setDone(false)
  }

  if (done) {
    return (
      <div className="fade-in flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <p className="font-serif text-[26px] font-semibold text-text text-center">Schön gespielt.</p>
        <p className="text-[15px] text-muted text-center">
          Du hast {correct} von {rounds.length} Wörtern richtig erkannt.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-[320px] mt-2">
          <button
            onClick={handleNochEineRunde}
            className="w-full py-4 rounded-[16px] bg-accent text-white text-[15px] font-semibold tap-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Noch eine Runde
          </button>
          <button
            onClick={() => navigate('/wiederholen')}
            className="w-full py-4 rounded-[16px] border border-accent text-accent text-[15px] font-semibold tap-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    )
  }

  const item = rounds[index]
  const options = optionSets[index]

  function handleSelect(idx: number) {
    if (selected !== null) return
    setSelected(idx)
    const isCorrect = options[idx] === item.es
    recordVocabAnswer(item.es, isCorrect)
    if (isCorrect) {
      setTimeout(() => advance(true), 600)
    }
  }

  function advance(wasCorrect: boolean) {
    if (wasCorrect) setCorrect(c => c + 1)
    if (index + 1 >= rounds.length) {
      setDone(true)
    } else {
      setIndex(i => i + 1)
      setSelected(null)
    }
  }

  const isWrong = selected !== null && options[selected] !== item.es

  return (
    <div className="fade-in flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <p className="text-[13px] text-muted uppercase tracking-wide" style={{ letterSpacing: '0.06em' }}>
          Bild-Raten
        </p>
        <p className="text-[13px] text-muted">{index + 1} / {rounds.length}</p>
      </div>

      <div className="flex flex-col items-center justify-center py-6">
        <span style={{ fontSize: 96, lineHeight: 1 }}>{item.emoji}</span>
        <p className="text-[15px] text-muted mt-3">{item.de}</p>
      </div>

      <div className="flex flex-col gap-2">
        {options.map((opt, idx) => {
          const isThis = selected === idx
          const isCorrectOption = opt === item.es
          let cls = 'border border-[#E0DDD8] text-text'
          if (selected !== null) {
            if (isCorrectOption) cls = 'border-2 border-[#7CA982] text-[#4A7A50] bg-[#F0F7F1]'
            else if (isThis) cls = 'border-2 border-[#C25555] text-[#C25555] bg-[#FDF0F0]'
          }
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`w-full text-left px-4 py-3 rounded-btn text-sm tap-scale ${cls} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
            >
              {opt}
            </button>
          )
        })}
      </div>

      {isWrong && (
        <button
          onClick={() => advance(false)}
          className="w-full py-3 rounded-btn bg-white border border-[#E0DDD8] text-muted text-sm tap-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent fade-in"
        >
          Weiter
        </button>
      )}
    </div>
  )
}
