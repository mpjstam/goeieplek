import { useMemo, useState } from 'react'
import { TIP_CATEGORIES, TIP_CATEGORY_LIST } from './tipCategories'
import type { Tip, TipCategory } from './types'

interface Props {
  tips: Tip[]
  onSelect: (tip: Tip) => void
  onEdit: (tip: Tip) => void
  onDelete: (id: string) => void
}

export default function TipList({ tips, onSelect, onEdit, onDelete }: Props) {
  const [activeCategories, setActiveCategories] = useState<Set<TipCategory>>(
    () => new Set(TIP_CATEGORY_LIST),
  )
  const [search, setSearch] = useState('')

  function toggleCategory(cat: TipCategory) {
    setActiveCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tips.filter((tip) => {
      if (!activeCategories.has(tip.category)) return false
      if (!q) return true
      return (
        tip.name.toLowerCase().includes(q) ||
        tip.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    })
  }, [tips, activeCategories, search])

  if (tips.length === 0) {
    return <p className="empty-hint">Klik op de kaart om je eerste reistip toe te voegen.</p>
  }

  return (
    <div className="tip-list-panel">
      <div className="tip-category-filters">
        {TIP_CATEGORY_LIST.map((cat) => {
          const meta = TIP_CATEGORIES[cat]
          const active = activeCategories.has(cat)
          return (
            <button
              key={cat}
              type="button"
              className={`tip-category-chip${active ? ' active' : ''}`}
              style={active ? { background: meta.color, borderColor: meta.color } : undefined}
              onClick={() => toggleCategory(cat)}
            >
              {meta.icon} {meta.label}
            </button>
          )
        })}
      </div>

      <input
        type="text"
        className="tip-search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Zoek op naam of tag..."
      />

      {filtered.length === 0 ? (
        <p className="empty-hint">Geen tips gevonden.</p>
      ) : (
        <ul className="tip-list">
          {filtered.map((tip) => {
            const meta = TIP_CATEGORIES[tip.category] ?? TIP_CATEGORIES.overig
            return (
              <li key={tip.id} className="tip-card" style={{ borderLeftColor: meta.color }}>
                <button type="button" className="tip-card-main" onClick={() => onSelect(tip)}>
                  <span className="tip-card-title">
                    {meta.icon} {tip.name}
                  </span>
                  {tip.description && <span className="tip-card-desc">{tip.description}</span>}
                  {tip.tags.length > 0 && (
                    <span className="tip-card-tags">
                      {tip.tags.map((tag) => (
                        <span key={tag} className="tip-tag">
                          {tag}
                        </span>
                      ))}
                    </span>
                  )}
                </button>
                <span className="tip-card-actions">
                  <button type="button" onClick={() => onEdit(tip)} aria-label={`Bewerk ${tip.name}`}>
                    ✎
                  </button>
                  <button type="button" onClick={() => onDelete(tip.id)} aria-label={`Verwijder ${tip.name}`}>
                    ✕
                  </button>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
