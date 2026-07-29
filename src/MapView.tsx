import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { TIP_CATEGORIES } from './tipCategories'
import type { RouteResult, Tip, Waypoint } from './types'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const ROUTE_SOURCE_ID = 'route'
const ROUTE_LAYER_ID = 'route-line'

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

function shortName(name: string) {
  return name.split(',')[0]
}

function buildPinElement(role: 'start' | 'end' | 'via', name: string): HTMLElement {
  if (role === 'via') {
    const span = document.createElement('span')
    span.className = 'route-marker-dot'
    span.style.background = '#0969da'
    return span
  }

  const wrapper = document.createElement('div')
  wrapper.className = `map-pin-wrapper map-pin-${role}`
  wrapper.innerHTML = `<div class="map-pin"><span class="map-pin-name" title="${escapeHtml(name)}">${escapeHtml(shortName(name))}</span></div>`
  return wrapper
}

function buildTipElement(tip: Tip): HTMLElement {
  const meta = TIP_CATEGORIES[tip.category] ?? TIP_CATEGORIES.overig
  const wrapper = document.createElement('div')
  wrapper.className = 'tip-marker-wrapper'
  wrapper.innerHTML = `<div class="tip-marker" style="background:${meta.color}"><span class="tip-marker-emoji">${meta.icon}</span></div>`
  return wrapper
}

function tipPopupHtml(tip: Tip) {
  const meta = TIP_CATEGORIES[tip.category] ?? TIP_CATEGORIES.overig
  const tags = tip.tags.map((t) => `<span class="tip-popup-tag">${escapeHtml(t)}</span>`).join('')
  return `
    <div class="tip-popup">
      <div class="tip-popup-title">${meta.icon} ${escapeHtml(tip.name)}</div>
      ${tip.description ? `<div class="tip-popup-desc">${escapeHtml(tip.description)}</div>` : ''}
      ${tags ? `<div class="tip-popup-tags">${tags}</div>` : ''}
    </div>
  `
}

interface Props {
  waypoints: Waypoint[]
  route: RouteResult | null
  tips: Tip[]
  mode: 'route' | 'tips'
  pendingLocation: { lat: number; lng: number } | null
  onMapClick: (lat: number, lng: number) => void
  selectedTipId: string | null
}

export default function MapView({
  waypoints,
  route,
  tips,
  mode,
  pendingLocation,
  onMapClick,
  selectedTipId,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const tipMarkersRef = useRef<mapboxgl.Marker[]>([])
  const pendingMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const onMapClickRef = useRef(onMapClick)
  onMapClickRef.current = onMapClick
  const modeRef = useRef(mode)
  modeRef.current = mode

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [5.2913, 52.1326],
      zoom: 6.5,
    })
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.on('click', (e) => {
      if (modeRef.current === 'tips') onMapClickRef.current(e.lngLat.lat, e.lngLat.lng)
    })
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = waypoints.map((wp, i) => {
      const role = i === 0 ? 'start' : i === waypoints.length - 1 ? 'end' : 'via'
      const popup = new mapboxgl.Popup({ offset: 12 }).setText(wp.name)
      return new mapboxgl.Marker({ element: buildPinElement(role, wp.name), anchor: role === 'via' ? 'center' : 'top-left' })
        .setLngLat([wp.lng, wp.lat])
        .setPopup(popup)
        .addTo(map)
    })

    if (waypoints.length > 0) {
      const bounds = waypoints.reduce(
        (b, wp) => b.extend([wp.lng, wp.lat]),
        new mapboxgl.LngLatBounds([waypoints[0].lng, waypoints[0].lat], [waypoints[0].lng, waypoints[0].lat]),
      )
      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 500 })
    }
  }, [waypoints])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    function applyRoute() {
      const source = map!.getSource(ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined
      const data: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        properties: {},
        geometry: route?.geometry ?? { type: 'LineString', coordinates: [] },
      }

      if (source) {
        source.setData(data)
      } else {
        map!.addSource(ROUTE_SOURCE_ID, { type: 'geojson', data })
        map!.addLayer({
          id: ROUTE_LAYER_ID,
          type: 'line',
          source: ROUTE_SOURCE_ID,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#0969da', 'line-width': 4, 'line-opacity': 0.8 },
        })
      }
    }

    if (map.isStyleLoaded()) {
      applyRoute()
    } else {
      map.once('load', applyRoute)
    }
  }, [route])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    tipMarkersRef.current.forEach((m) => m.remove())
    tipMarkersRef.current = tips.map((tip) => {
      const popup = new mapboxgl.Popup({ offset: 20 }).setHTML(tipPopupHtml(tip))
      return new mapboxgl.Marker({ element: buildTipElement(tip), anchor: 'top-left' })
        .setLngLat([tip.lng, tip.lat])
        .setPopup(popup)
        .addTo(map)
    })
  }, [tips])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (pendingMarkerRef.current) {
      pendingMarkerRef.current.remove()
      pendingMarkerRef.current = null
    }

    if (pendingLocation) {
      const el = document.createElement('div')
      el.className = 'pending-marker-wrapper'
      el.innerHTML = `<div class="pending-marker"></div>`
      pendingMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: 'top-left' })
        .setLngLat([pendingLocation.lng, pendingLocation.lat])
        .addTo(map)
    }
  }, [pendingLocation])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedTipId) return
    const index = tips.findIndex((t) => t.id === selectedTipId)
    if (index === -1) return
    const tip = tips[index]
    map.flyTo({ center: [tip.lng, tip.lat], zoom: Math.max(map.getZoom(), 14), duration: 600 })
    const marker = tipMarkersRef.current[index]
    const popup = marker?.getPopup()
    if (popup && !popup.isOpen()) marker.togglePopup()
  }, [selectedTipId, tips])

  return (
    <div className={`map-container-outer map-mode-${mode}`}>
      <div ref={containerRef} className="map-container" />
    </div>
  )
}
