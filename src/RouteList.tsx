import type { Waypoint } from './types'

interface Props {
  waypoints: Waypoint[]
  onRemove: (id: string) => void
  onMove: (id: string, direction: -1 | 1) => void
}

function shortName(name: string) {
  return name.split(',')[0]
}

function roleFor(index: number, total: number): 'start' | 'end' | 'via' {
  if (index === 0) return 'start'
  if (index === total - 1) return 'end'
  return 'via'
}

const ROLE_LABEL: Record<'start' | 'end' | 'via', string> = {
  start: 'Start',
  end: 'Bestemming',
  via: 'Via',
}

export default function RouteList({ waypoints, onRemove, onMove }: Props) {
  if (waypoints.length === 0) {
    return <p className="empty-hint">Voeg hierboven locaties toe om een route te plotten.</p>
  }

  return (
    <ol className="route-list">
      {waypoints.map((wp, i) => {
        const role = roleFor(i, waypoints.length)
        return (
          <li key={wp.id} className={`route-pill route-pill-${role}`}>
            <span className="route-pill-badge">{ROLE_LABEL[role]}</span>
            <span className="route-pill-name" title={wp.name}>
              {shortName(wp.name)}
            </span>
            <span className="route-list-actions">
              <button
                type="button"
                onClick={() => onMove(wp.id, -1)}
                disabled={i === 0}
                aria-label="Omhoog verplaatsen"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => onMove(wp.id, 1)}
                disabled={i === waypoints.length - 1}
                aria-label="Omlaag verplaatsen"
              >
                ↓
              </button>
              <button type="button" onClick={() => onRemove(wp.id)} aria-label="Verwijderen">
                ✕
              </button>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
