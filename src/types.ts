export interface Waypoint {
  id: string
  name: string
  lng: number
  lat: number
}

export interface RouteResult {
  geometry: GeoJSON.LineString
  distanceMeters: number
  durationSeconds: number
}

export interface Etappe {
  id: string
  name: string
  waypoints: Waypoint[]
  createdAt: string
}

export type TipCategory = 'eten' | 'slapen' | 'bezienswaardigheid' | 'activiteit' | 'vervoer' | 'overig'

export interface Tip {
  id: string
  name: string
  description: string
  category: TipCategory
  tags: string[]
  lng: number
  lat: number
  createdAt: string
}
