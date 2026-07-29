import type { Tip } from './types'

const STORAGE_KEY = 'route-planner-tips'

export function loadTips(): Tip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Tip[]) : []
  } catch {
    return []
  }
}

function persist(tips: Tip[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tips))
  return tips
}

export function addTip(tip: Omit<Tip, 'id' | 'createdAt'>): Tip[] {
  const newTip: Tip = { ...tip, id: `${Date.now()}`, createdAt: new Date().toISOString() }
  return persist([...loadTips(), newTip])
}

export function updateTip(id: string, changes: Omit<Tip, 'id' | 'createdAt'>): Tip[] {
  const next = loadTips().map((t) => (t.id === id ? { ...t, ...changes } : t))
  return persist(next)
}

export function deleteTip(id: string): Tip[] {
  return persist(loadTips().filter((t) => t.id !== id))
}
