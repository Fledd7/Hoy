import { useEffect, useState } from 'react'

const WORDS = [
  { es: 'paciencia',   de: 'Geduld' },
  { es: 'tranquilo',   de: 'ruhig' },
  { es: 'poco a poco', de: 'nach und nach' },
  { es: 'respira',     de: 'atme' },
  { es: 'ya casi',     de: 'fast geschafft' },
  { es: 'un momento',  de: 'einen Moment' },
  { es: 'calma',       de: 'Ruhe' },
  { es: 'sin prisa',   de: 'ohne Eile' },
]

export default function LoadingWords() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * WORDS.length))
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      const timer = setTimeout(() => {
        setIdx(i => (i + 1) % WORDS.length)
        setVisible(true)
      }, 300)
      return () => clearTimeout(timer)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const word = WORDS[idx]

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2">
      <div style={{ opacity: visible ? 1 : 0, transition: 'opacity 300ms ease' }}>
        <p className="font-serif text-[28px] font-semibold text-text text-center leading-tight">
          {word.es}
        </p>
        <p className="text-[16px] text-[#6B6B6B] text-center mt-1">{word.de}</p>
      </div>
      <span
        className="w-2 h-2 rounded-full bg-accent mt-2"
        style={{ animation: 'pulseDot 1.5s ease-in-out infinite' }}
      />
    </div>
  )
}
