import type { RouteResult, Waypoint } from './types'

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

export interface PlaceSuggestion {
  id: string
  name: string
}

export interface GeocodeSuggestion {
  id: string
  name: string
  lng: number
  lat: number
}

export function createSearchSession(): string {
  return crypto.randomUUID()
}

export async function searchPlaces(query: string, sessionToken: string): Promise<PlaceSuggestion[]> {
  if (!query.trim()) return []
  const url = new URL('https://api.mapbox.com/search/searchbox/v1/suggest')
  url.searchParams.set('q', query)
  url.searchParams.set('access_token', TOKEN)
  url.searchParams.set('session_token', sessionToken)
  url.searchParams.set('language', 'nl')
  url.searchParams.set('limit', '5')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Zoeken mislukt (${res.status})`)
  const data = await res.json()

  return (data.suggestions ?? []).map((s: any) => ({
    id: s.mapbox_id,
    name: [s.name, s.place_formatted].filter(Boolean).join(', '),
  }))
}

export async function retrievePlace(mapboxId: string, sessionToken: string): Promise<GeocodeSuggestion> {
  const url = new URL(`https://api.mapbox.com/search/searchbox/v1/retrieve/${mapboxId}`)
  url.searchParams.set('access_token', TOKEN)
  url.searchParams.set('session_token', sessionToken)

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Locatie ophalen mislukt (${res.status})`)
  const data = await res.json()
  const feature = data.features?.[0]
  if (!feature) throw new Error('Locatie niet gevonden')

  const [lng, lat] = feature.geometry.coordinates
  return {
    id: mapboxId,
    name: [feature.properties.name, feature.properties.place_formatted].filter(Boolean).join(', '),
    lng,
    lat,
  }
}

export async function fetchRoute(waypoints: Waypoint[]): Promise<RouteResult> {
  const coords = waypoints.map((w) => `${w.lng},${w.lat}`).join(';')
  const url = new URL(`https://api.mapbox.com/directions/v5/mapbox/driving/${coords}`)
  url.searchParams.set('access_token', TOKEN)
  url.searchParams.set('geometries', 'geojson')
  url.searchParams.set('overview', 'full')
  url.searchParams.set('alternatives', 'false')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Route berekenen mislukt (${res.status})`)
  const data = await res.json()

  if (!data.routes || data.routes.length === 0) {
    throw new Error('Geen route gevonden tussen deze locaties')
  }

  const route = data.routes[0]
  return {
    geometry: route.geometry,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
  }
}
