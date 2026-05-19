import { useNavigate } from 'react-router-dom'
import { User } from 'lucide-react'
import { getUser } from '../lib/storage'

export default function ProfileIcon() {
  const navigate = useNavigate()
  const user = getUser()
  const initial = user?.why?.trim().charAt(0).toUpperCase() || null

  function handleClick() {
    navigator.vibrate?.(8)
    navigate('/profil')
  }

  return (
    <button
      onClick={handleClick}
      aria-label="Profil öffnen"
      className="w-11 h-11 rounded-full bg-white flex items-center justify-center tap-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      style={{ border: '1px solid #E0DBD6' }}
    >
      {initial ? (
        <span className="font-serif text-[18px] font-semibold text-accent leading-none select-none">{initial}</span>
      ) : (
        <User size={20} color="#6B6B6B" aria-hidden="true" />
      )}
    </button>
  )
}
