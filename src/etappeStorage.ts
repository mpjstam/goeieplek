import type { Etappe, Waypoint } from './types'

const STORAGE_KEY = 'route-planner-etappes'

export function loadEtappes(): Etappe[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Etappe[]) : []
  } catch {
    return []
  }
}

export function saveEtappe(name: string, waypoints: Waypoint[]): Etappe[] {
  const etappes = loadEtappes()
  const etappe: Etappe = {
    id: `${Date.now()}`,
    name,
    waypoints,
    createdAt: new Date().toISOString(),
  }
  const next = [...etappes, etappe]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function deleteEtappe(id: string): Etappe[] {
  const next = loadEtappes().filter((e) => e.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}
