// Shared types and utilities for Aviation
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  total?: number
  results?: T[]
}

export function createSuccess<T>(data: T): ApiResponse<T> {
  return { data }
}

export function createError(message: string): ApiResponse {
  return { error: message }
}

// OpenSky Network flight state
export interface FlightState {
  icao24: string
  callsign: string
  origin_country: string
  latitude: number | null
  longitude: number | null
  baro_altitude: number | null
  on_ground: boolean
  velocity: number | null
  true_track: number | null
  vertical_rate: number | null
  last_contact: number
}

// Airport type
export interface Airport {
  id: number
  ident: string
  type: string
  name: string
  elevation_ft: number | null
  continent: string
  country: string
  region: string
  municipality: string
  latitude: number | null
  longitude: number | null
}
