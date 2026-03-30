export interface TripReport {
  id: number
  title: string
  slug: string | null
  airline: string
  route: string
  origin: string | null
  destination: string | null
  cabin: string
  rating: number
  content: string
  author: string
  created_at: string
  views?: number
}

export interface FlightLog {
  id: number
  user_id: string
  user_name: string | null
  total_flights: number
  total_distance_km: number
  countries_visited: number
  created_at: string
}

export interface FlightLogEntry {
  id: number
  log_id: number
  date: string
  airline: string
  flight_number: string
  origin: string
  destination: string
  aircraft: string | null
  cabin: string | null
  distance_km: number | null
}

export interface SpottingPhoto {
  id: number
  photographer: string
  aircraft_reg: string | null
  airline: string | null
  aircraft_type: string | null
  airport: string | null
  image_url: string | null
  description: string | null
  created_at: string
}
