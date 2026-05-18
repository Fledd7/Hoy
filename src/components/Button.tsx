import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  fullWidth?: boolean
}

export default function Button({
  variant = 'primary',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center min-h-[64px] px-6 text-base font-medium rounded-btn tap-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:bg-[#E5E2DD] disabled:text-[#9B9B9B] disabled:border-transparent disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-accent text-white hover:bg-[#a8442e]',
    secondary: 'bg-white border border-[#E0DDD8] text-text hover:bg-[#F0EDE8]',
    ghost: 'text-muted hover:text-text',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
