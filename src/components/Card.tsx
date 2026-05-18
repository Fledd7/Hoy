import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export default function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-card shadow-[0_2px_4px_rgba(0,0,0,0.06)] p-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
