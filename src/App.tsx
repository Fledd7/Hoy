import { Routes, Route, Navigate } from 'react-router-dom'
import Splash from './pages/Splash'
import Onboarding from './pages/Onboarding'
import Heute from './pages/Heute'
import Lektion from './pages/Lektion'
import Profil from './pages/Profil'

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/heute" element={<Heute />} />
        <Route path="/lektion" element={<Lektion />} />
        <Route path="/profil" element={<Profil />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
