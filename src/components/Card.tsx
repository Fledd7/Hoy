import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  accent?: boolean
}

export default function Card({ children, className = '', accent = false, ...props }: CardProps) {
  const radius = accent ? 'rounded-r-card' : 'rounded-card'
  const border = accent
    ? 'border border-[#E2D7C8]/50 border-l-4 border-l-accent'
    : 'border border-[#E2D7C8]/50'

  return (
    <div
      className={`bg-white ${radius} ${border} shadow-card p-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
