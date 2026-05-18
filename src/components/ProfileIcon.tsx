import { useNavigate } from 'react-router-dom'

export default function ProfileIcon() {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate('/profil')}
      aria-label="Profil öffnen"
      className="w-10 h-10 rounded-full bg-[#EDE9E3] flex items-center justify-center tap-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#6B6B6B"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    </button>
  )
}
