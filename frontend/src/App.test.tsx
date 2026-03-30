import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App.tsx'

const API = 'http://localhost:3001'

// ─── Mock fetch globally ──────────────────────────────────────────────────
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

beforeEach(() => {
  vi.clearAllMocks()
})
afterEach(() => {
  vi.restoreAllMocks()
})

// ─── Fixtures ─────────────────────────────────────────────────────────────
const flightsFixture = {
  total: 2,
  flights: [
    {
      icao24: 'a1b2c3',
      callsign: 'UAL123',
      origin_country: 'United States',
      latitude: 40.7128,
      longitude: -74.006,
      baro_altitude: 10668,
      on_ground: false,
      velocity: 850,
      true_track: 90,
    },
    {
      icao24: 'b2c3d4',
      callsign: 'DAL456',
      origin_country: 'United States',
      latitude: 33.9425,
      longitude: -118.4081,
      baro_altitude: 0,
      on_ground: true,
      velocity: 0,
      true_track: 0,
    },
  ],
}

const airportsFixture = {
  airports: [
    {
      id: 1,
      ident: 'KJFK',
      type: 'large_airport',
      name: 'John F Kennedy International Airport',
      elevation_ft: 13,
      continent: 'NA',
      country: 'United States',
      region: 'NY',
      municipality: 'New York',
      latitude: 40.6413,
      longitude: -73.7781,
    },
  ],
}

const incidentsFixture = {
  total: 2,
  incidents: [
    {
      airport: 'JFK',
      date: '2023-01-01',
      operator: 'United Airlines',
      aircraft: 'B737',
      species: 'Bird',
      damage: 'Minor',
    },
    {
      airport: 'LAX',
      date: '2023-01-02',
      operator: 'American Airlines',
      aircraft: 'A320',
      species: 'Bird',
      damage: 'Destroyed',
    },
  ],
}

// ─── Tests ─────────────────────────────────────────────────────────────────
describe('App — Header', () => {
  it('renders the AviationHub title', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => flightsFixture,
    })
    await act(async () => {
      render(<App />)
    })
    expect(screen.getByText(/AviationHub/)).toBeTruthy()
  })

  it('renders Flights, Airports, and Incidents nav buttons', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => flightsFixture,
    })
    await act(async () => {
      render(<App />)
    })
    expect(screen.getByRole('button', { name: /Flights/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Airports/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Incidents/i })).toBeTruthy()
  })
})

describe('App — Flights Tab (default)', () => {
  it('fetches /api/flights on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => flightsFixture,
    })
    await act(async () => {
      render(<App />)
    })
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(`${API}/api/flights`)
    })
  })

  it('displays callsigns in the table', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => flightsFixture,
    })
    await act(async () => {
      render(<App />)
    })
    await waitFor(() => {
      expect(screen.getByText('UAL123')).toBeTruthy()
      expect(screen.getByText('DAL456')).toBeTruthy()
    })
  })

  it('displays country of origin for each flight', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => flightsFixture,
    })
    await act(async () => {
      render(<App />)
    })
    await waitFor(() => {
      expect(screen.getAllByText('United States')).toHaveLength(2)
    })
  })

  it('displays live count stat card', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => flightsFixture,
    })
    await act(async () => {
      render(<App />)
    })
    await waitFor(() => {
      expect(screen.getByText('2')).toBeTruthy()
    })
  })

  it('renders search input and button', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => flightsFixture,
    })
    await act(async () => {
      render(<App />)
    })
    expect(screen.getByPlaceholderText(/Search callsign/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Search/i })).toBeTruthy()
  })

  it('displays empty state when flights array is empty', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ total: 0, flights: [] }),
    })
    await act(async () => {
      render(<App />)
    })
    await waitFor(() => {
      expect(screen.getByText(/No flights found/i)).toBeTruthy()
    })
  })
})

describe('App — Flight search', () => {
  it('calls /api/flights/search with query on button click', async () => {
    const user = userEvent.setup()
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => flightsFixture,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      })

    await act(async () => {
      render(<App />)
    })
    await waitFor(() => expect(mockFetch).toHaveBeenCalled())

    await user.type(screen.getByPlaceholderText(/Search callsign/i), 'UAL')
    await user.click(screen.getByRole('button', { name: /Search/i }))

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/flights/search?q=UAL')
    )
  })

  it('calls search on Enter keypress', async () => {
    const user = userEvent.setup()
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => flightsFixture,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      })

    await act(async () => {
      render(<App />)
    })
    await waitFor(() => expect(mockFetch).toHaveBeenCalled())

    await user.type(screen.getByPlaceholderText(/Search callsign/i), 'DAL{Enter}')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/flights/search?q=DAL')
    )
  })
})

describe('App — Airport tab', () => {
  it('switches to airports tab and fetches /api/airports', async () => {
    const user = userEvent.setup()
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => flightsFixture,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => airportsFixture,
      })

    await act(async () => {
      render(<App />)
    })
    await user.click(screen.getByRole('button', { name: /Airports/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(`${API}/api/airports?limit=30`)
    })
  })

  it('displays airport ident codes', async () => {
    const user = userEvent.setup()
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => flightsFixture,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => airportsFixture,
      })

    await act(async () => {
      render(<App />)
    })
    await user.click(screen.getByRole('button', { name: /Airports/i }))

    await waitFor(() => {
      expect(screen.getByText('KJFK')).toBeTruthy()
    })
  })

  it('displays airport type badge', async () => {
    const user = userEvent.setup()
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => flightsFixture,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => airportsFixture,
      })

    await act(async () => {
      render(<App />)
    })
    await user.click(screen.getByRole('button', { name: /Airports/i }))

    await waitFor(() => {
      expect(screen.getByText('large_airport')).toBeTruthy()
    })
  })

  it('shows empty state when airports array is empty', async () => {
    const user = userEvent.setup()
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => flightsFixture,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ airports: [] }),
      })

    await act(async () => {
      render(<App />)
    })
    await user.click(screen.getByRole('button', { name: /Airports/i }))

    await waitFor(() => {
      expect(screen.getByText(/No airports found/i)).toBeTruthy()
    })
  })
})

describe('App — Incidents tab', () => {
  it('switches to incidents tab and fetches /api/incidents', async () => {
    const user = userEvent.setup()
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => flightsFixture,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => incidentsFixture,
      })

    await act(async () => {
      render(<App />)
    })
    await user.click(screen.getByRole('button', { name: /Incidents/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(`${API}/api/incidents`)
    })
  })

  it('displays airport column in incidents table', async () => {
    const user = userEvent.setup()
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => flightsFixture,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => incidentsFixture,
      })

    await act(async () => {
      render(<App />)
    })
    await user.click(screen.getByRole('button', { name: /Incidents/i }))

    await waitFor(() => {
      expect(screen.getByText('JFK')).toBeTruthy()
    })
  })

  it('displays species column', async () => {
    const user = userEvent.setup()
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => flightsFixture,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => incidentsFixture,
      })

    await act(async () => {
      render(<App />)
    })
    await user.click(screen.getByRole('button', { name: /Incidents/i }))

    await waitFor(() => {
      expect(screen.getAllByText('Bird')).toHaveLength(2)
    })
  })
})

describe('App — Data Sources footer', () => {
  it('shows OpenSky Network source', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => flightsFixture,
    })
    await act(async () => {
      render(<App />)
    })
    // OpenSky Network appears twice (stat card + footer); check at least one
    expect(screen.getAllByText(/OpenSky Network/).length).toBeGreaterThan(0)
  })

  it('shows Supabase DB source', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => flightsFixture,
    })
    await act(async () => {
      render(<App />)
    })
    expect(screen.getByText(/Supabase DB/)).toBeTruthy()
  })

  it('shows FAA Bird Strike DB source', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => flightsFixture,
    })
    await act(async () => {
      render(<App />)
    })
    expect(screen.getByText(/FAA Bird Strike DB/)).toBeTruthy()
  })
})
