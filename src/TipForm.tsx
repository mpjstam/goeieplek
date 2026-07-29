import { useState, type FormEvent } from 'react'
import { TIP_CATEGORIES, TIP_CATEGORY_LIST } from './tipCategories'
import type { Tip, TipCategory } from './types'

interface InitialTipData {
  name?: string
  description?: string
  category?: TipCategory
  tags?: string[]
}

interface Props {
  location: { lat: number; lng: number }
  initial?: InitialTipData
  onSave: (data: Omit<Tip, 'id' | 'createdAt'>) => void
  onCancel: () => void
}

function parseTags(text: string): string[] {
  const seen = new Set<string>()
  for (const raw of text.split(',')) {
    const tag = raw.trim()
    if (tag) seen.add(tag)
  }
  return Array.from(seen)
}

export default function TipForm({ location, initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [category, setCategory] = useState<TipCategory>(initial?.category ?? 'overig')
  const [tagsText, setTagsText] = useState(initial?.tags?.join(', ') ?? '')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onSave({
      name: trimmed,
      description: description.trim(),
      category,
      tags: parseTags(tagsText),
      lng: location.lng,
      lat: location.lat,
    })
  }

  return (
    <form className="tip-form" onSubmit={handleSubmit}>
      <p className="tip-form-location">
        📍 {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
      </p>

      <label>
        Naam
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Naam van deze plek..."
          autoFocus
        />
      </label>

      <label>
        Beschrijving
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Waarom is dit een aanrader?"
          rows={3}
        />
      </label>

      <label>
        Categorie
        <select value={category} onChange={(e) => setCategory(e.target.value as TipCategory)}>
          {TIP_CATEGORY_LIST.map((cat) => (
            <option key={cat} value={cat}>
              {TIP_CATEGORIES[cat].icon} {TIP_CATEGORIES[cat].label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Tags
        <input
          type="text"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          placeholder="bijv. gezinsvriendelijk, budget, uitzicht"
        />
      </label>

      <div className="tip-form-actions">
        <button type="button" className="tip-form-cancel" onClick={onCancel}>
          Annuleren
        </button>
        <button type="submit" className="tip-form-save" disabled={!name.trim()}>
          Tip opslaan
        </button>
      </div>
    </form>
  )
}
