import { getUser } from './storage'
import type { EnergyMode } from './types'

export type AnfaengerPhase = 'phase1' | 'phase2' | 'phase3' | 'inactive'

export interface ModusKonfiguration {
  verfuegbar: boolean
  sublabel: string
}

export function getAnfaengerPhase(): AnfaengerPhase {
  const user = getUser()
  if (!user) return 'inactive'
  if (!user.anfaengerPfadAktiv || (user.etappe ?? 1) > 1) return 'inactive'
  if (!user.anfaengerPfadStart) return 'inactive'

  const start = new Date(user.anfaengerPfadStart).getTime()
  const daysSince = (Date.now() - start) / (1000 * 60 * 60 * 24)

  if (daysSince < 3) return 'phase1'
  if (daysSince < 7) return 'phase2'
  return 'phase3'
}

export function getDayInPfad(): number {
  const user = getUser()
  if (!user?.anfaengerPfadStart) return 1
  const start = new Date(user.anfaengerPfadStart).getTime()
  return Math.min(14, Math.max(1, Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24)) + 1))
}

export function isErzaehlModusVerfuegbar(): boolean {
  const phase = getAnfaengerPhase()
  return phase !== 'phase1'
}

export function getModusKonfiguration(modus: EnergyMode, phase: AnfaengerPhase): ModusKonfiguration {
  if (phase === 'inactive' || phase === 'phase3') {
    const defaultLabels: Record<EnergyMode, string> = {
      muede: 'Kurzer Lese-Snack, 2 Minuten',
      okay: 'Lektion mit Verständnisfragen',
      fit: 'Dialog + Vokabeln, zwei Teile',
      erzaehl: 'Dein Tag auf Spanisch',
    }
    return { verfuegbar: true, sublabel: defaultLabels[modus] }
  }

  if (phase === 'phase1') {
    const configs: Record<EnergyMode, ModusKonfiguration> = {
      muede: { verfuegbar: true, sublabel: 'Erstes Spanisch – ganz sanft' },
      okay: { verfuegbar: true, sublabel: 'Wörter lernen + kleines Spiel' },
      fit: { verfuegbar: true, sublabel: 'Vokabeln mit Bildern kennenlernen' },
      erzaehl: { verfuegbar: false, sublabel: 'Noch nicht freigeschaltet' },
    }
    return configs[modus]
  }

  // phase2
  const configs: Record<EnergyMode, ModusKonfiguration> = {
    muede: { verfuegbar: true, sublabel: 'Kurzer Lese-Snack, 2 Minuten' },
    okay: { verfuegbar: true, sublabel: 'Lektion + Wörter in Reihenfolge' },
    fit: { verfuegbar: true, sublabel: 'Dialog + Vokabeln üben' },
    erzaehl: { verfuegbar: true, sublabel: 'Dein Tag auf Spanisch' },
  }
  return configs[modus]
}
