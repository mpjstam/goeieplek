import { useEffect, useState } from 'react'
import LocationSearch from './LocationSearch'
import RouteList from './RouteList'
import MapView from './MapView'
import EtappePanel from './EtappePanel'
import TipForm from './TipForm'
import TipList from './TipList'
import { fetchRoute, type GeocodeSuggestion } from './routingApi'
import { loadEtappes, saveEtappe, deleteEtappe } from './etappeStorage'
import { loadTips, addTip, updateTip, deleteTip } from './tipStorage'
import type { Etappe, RouteResult, Tip, Waypoint } from './types'

type Mode = 'route' | 'tips'

function formatDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  return h > 0 ? `${h} u ${m} min` : `${m} min`
}

export default function App() {
  const [mode, setMode] = useState<Mode>('route')
  const [sheetOpen, setSheetOpen] = useState(false)

  const [waypoints, setWaypoints] = useState<Waypoint[]>([])
  const [route, setRoute] = useState<RouteResult | null>(null)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [etappes, setEtappes] = useState<Etappe[]>(() => loadEtappes())

  const [tips, setTips] = useState<Tip[]>(() => loadTips())
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [editingTip, setEditingTip] = useState<Tip | null>(null)
  const [pendingName, setPendingName] = useState<string | undefined>(undefined)
  const [selectedTipId, setSelectedTipId] = useState<string | null>(null)

  useEffect(() => {
    if (waypoints.length < 2) {
      setRoute(null)
      setRouteError(null)
      return
    }
    let cancelled = false
    setCalculating(true)
    setRouteError(null)
    fetchRoute(waypoints)
      .then((result) => {
        if (!cancelled) setRoute(result)
      })
      .catch((err) => {
        if (!cancelled) {
          setRoute(null)
          setRouteError(err instanceof Error ? err.message : 'Onbekende fout')
        }
      })
      .finally(() => {
        if (!cancelled) setCalculating(false)
      })
    return () => {
      cancelled = true
    }
  }, [waypoints])

  function handleAdd(s: GeocodeSuggestion) {
    setWaypoints((prev) => [...prev, { id: `${s.id}-${Date.now()}`, name: s.name, lng: s.lng, lat: s.lat }])
  }

  function handleRemove(id: string) {
    setWaypoints((prev) => prev.filter((wp) => wp.id !== id))
  }

  function handleMove(id: string, direction: -1 | 1) {
    setWaypoints((prev) => {
      const index = prev.findIndex((wp) => wp.id === id)
      const target = index + direction
      if (index === -1 || target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function handleSaveEtappe(name: string) {
    setEtappes(saveEtappe(name, waypoints))
  }

  function handleLoadEtappe(etappe: Etappe) {
    setWaypoints(etappe.waypoints)
  }

  function handleDeleteEtappe(id: string) {
    setEtappes(deleteEtappe(id))
  }

  function handleMapClick(lat: number, lng: number) {
    setPendingLocation({ lat, lng })
    setEditingTip(null)
    setPendingName(undefined)
  }

  function handleTipSearchAdd(s: GeocodeSuggestion) {
    setPendingLocation({ lat: s.lat, lng: s.lng })
    setEditingTip(null)
    setPendingName(s.name.split(',')[0])
  }

  function handleEditTip(tip: Tip) {
    setPendingLocation({ lat: tip.lat, lng: tip.lng })
    setEditingTip(tip)
    setPendingName(undefined)
  }

  function handleSaveTip(data: Omit<Tip, 'id' | 'createdAt'>) {
    if (editingTip) {
      setTips(updateTip(editingTip.id, data))
    } else {
      setTips(addTip(data))
    }
    setPendingLocation(null)
    setEditingTip(null)
    setPendingName(undefined)
  }

  function handleCancelTipForm() {
    setPendingLocation(null)
    setEditingTip(null)
    setPendingName(undefined)
  }

  function handleDeleteTip(id: string) {
    setTips(deleteTip(id))
    if (selectedTipId === id) setSelectedTipId(null)
  }

  function handleSelectTip(tip: Tip) {
    setSelectedTipId(tip.id)
  }

  return (
    <div className={`app${sheetOpen ? ' sheet-open' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Reisplanner</h1>
          <button type="button" className="sheet-close-btn" onClick={() => setSheetOpen(false)} aria-label="Sluit paneel">
            ✕
          </button>
        </div>
        <div className="sheet-handle" />


        <div className="mode-tabs">
          <button type="button" className={mode === 'route' ? 'active' : ''} onClick={() => setMode('route')}>
            Route
          </button>
          <button type="button" className={mode === 'tips' ? 'active' : ''} onClick={() => setMode('tips')}>
            Tips
          </button>
        </div>

        {mode === 'route' ? (
          <>
            <LocationSearch onAdd={handleAdd} />

            <RouteList waypoints={waypoints} onRemove={handleRemove} onMove={handleMove} />

            {calculating && <p className="route-status">Route berekenen...</p>}
            {routeError && <p className="route-status route-error">{routeError}</p>}
            {route && !calculating && (
              <p className="route-summary">
                {formatDistance(route.distanceMeters)} · {formatDuration(route.durationSeconds)}
              </p>
            )}

            <EtappePanel
              canSave={waypoints.length >= 2 && !!route}
              etappes={etappes}
              onSave={handleSaveEtappe}
              onLoad={handleLoadEtappe}
              onDelete={handleDeleteEtappe}
            />
          </>
        ) : (
          <>
            <LocationSearch onAdd={handleTipSearchAdd} />
            <p className="tip-hint">Zoek een plek, of klik direct op de kaart om een tip toe te voegen.</p>

            {pendingLocation && (
              <TipForm
                location={pendingLocation}
                initial={editingTip ?? (pendingName ? { name: pendingName } : undefined)}
                onSave={handleSaveTip}
                onCancel={handleCancelTipForm}
              />
            )}

            <TipList tips={tips} onSelect={handleSelectTip} onEdit={handleEditTip} onDelete={handleDeleteTip} />
          </>
        )}
      </aside>
      <main>
        <MapView
          waypoints={waypoints}
          route={route}
          tips={tips}
          mode={mode}
          pendingLocation={pendingLocation}
          onMapClick={handleMapClick}
          selectedTipId={selectedTipId}
        />
        <button type="button" className="sheet-open-btn" onClick={() => setSheetOpen(true)} aria-label="Open paneel">
          ☰
        </button>
      </main>
    </div>
  )
}
