import type { TipCategory } from './types'

interface CategoryMeta {
  label: string
  color: string
  icon: string
}

export const TIP_CATEGORIES: Record<TipCategory, CategoryMeta> = {
  eten: { label: 'Eten & Drinken', color: '#bc4c00', icon: '🍴' },
  slapen: { label: 'Slapen', color: '#8250df', icon: '🛏️' },
  bezienswaardigheid: { label: 'Bezienswaardigheid', color: '#0969da', icon: '🏛️' },
  activiteit: { label: 'Activiteit', color: '#1a7f37', icon: '🥾' },
  vervoer: { label: 'Vervoer', color: '#57606a', icon: '🚉' },
  overig: { label: 'Overig', color: '#6e40c9', icon: '📍' },
}

export const TIP_CATEGORY_LIST = Object.keys(TIP_CATEGORIES) as TipCategory[]
