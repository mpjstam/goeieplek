import { useState } from 'react'
import type { Etappe } from './types'

interface Props {
  canSave: boolean
  etappes: Etappe[]
  onSave: (name: string) => void
  onLoad: (etappe: Etappe) => void
  onDelete: (id: string) => void
}

export default function EtappePanel({ canSave, etappes, onSave, onLoad, onDelete }: Props) {
  const [name, setName] = useState('')

  function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) return
    onSave(trimmed)
    setName('')
  }

  return (
    <div className="etappe-panel">
      {canSave && (
        <div className="etappe-save">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Naam van deze etappe..."
            aria-label="Naam van deze etappe"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <button type="button" onClick={handleSave} disabled={!name.trim()}>
            Opslaan als etappe
          </button>
        </div>
      )}

      {etappes.length > 0 && (
        <div className="etappe-list">
          <h2>Opgeslagen etappes</h2>
          <ul>
            {etappes.map((e) => (
              <li key={e.id}>
                <button type="button" className="etappe-load" onClick={() => onLoad(e)}>
                  {e.name}
                </button>
                <button
                  type="button"
                  className="etappe-delete"
                  onClick={() => onDelete(e.id)}
                  aria-label={`Verwijder etappe ${e.name}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
