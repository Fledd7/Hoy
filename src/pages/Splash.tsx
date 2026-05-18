import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isOnboardingDone } from '../lib/storage'

export default function Splash() {
  const navigate = useNavigate()

  useEffect(() => {
    if (isOnboardingDone()) {
      navigate('/heute', { replace: true })
    } else {
      navigate('/onboarding', { replace: true })
    }
  }, [navigate])

  return null
}
