import { describe, it, expect } from 'vitest'
import { createSuccess, createError } from './index.js'
import type { ApiResponse, FlightState, Airport } from './index.js'

describe('@aviation/shared', () => {
  describe('createSuccess', () => {
    it('returns ApiResponse with data field', () => {
      const result = createSuccess({ foo: 'bar' })
      expect(result).toEqual({ data: { foo: 'bar' } })
      expect(result).not.toHaveProperty('error')
    })

    it('handles null data', () => {
      const result = createSuccess(null)
      expect(result).toHaveProperty('data', null)
    })

    it('handles array data', () => {
      const flights: FlightState[] = [
        {
          icao24: 'a1b2c3',
          callsign: 'UAL123',
          origin_country: 'United States',
          latitude: 40.7128,
          longitude: -74.006,
          baro_altitude: 10000,
          on_ground: false,
          velocity: 850,
          true_track: 90,
          vertical_rate: 5,
          last_contact: 1700000000,
        },
      ]
      const result = createSuccess(flights)
      expect(result.data).toHaveLength(1)
      expect(result.data?.[0].callsign).toBe('UAL123')
    })
  })

  describe('createError', () => {
    it('returns ApiResponse with error field', () => {
      const result = createError('Something went wrong')
      expect(result).toEqual({ error: 'Something went wrong' })
      expect(result).not.toHaveProperty('data')
    })

    it('handles empty string error', () => {
      const result = createError('')
      expect(result).toHaveProperty('error', '')
    })
  })

  describe('ApiResponse type structure', () => {
    it('createSuccess produces valid ApiResponse shape', () => {
      const response: ApiResponse<string> = createSuccess('test')
      expect(response).toHaveProperty('data', 'test')
    })

    it('createError produces valid ApiResponse shape without data', () => {
      const response: ApiResponse = createError('fail')
      expect(response).toHaveProperty('error', 'fail')
    })
  })

  describe('FlightState interface', () => {
    it('can construct a full FlightState object', () => {
      const flight: FlightState = {
        icao24: 'abc123',
        callsign: 'DAL456',
        origin_country: 'United States',
        latitude: 35.0,
        longitude: -80.0,
        baro_altitude: 35000,
        on_ground: false,
        velocity: 900,
        true_track: 180,
        vertical_rate: 0,
        last_contact: 1700000000,
      }
      expect(flight.callsign).toBe('DAL456')
      expect(flight.baro_altitude).toBe(35000)
      expect(flight.on_ground).toBe(false)
    })

    it('allows null for optional geo fields', () => {
      const flight: FlightState = {
        icao24: 'xyz999',
        callsign: '???',
        origin_country: 'Unknown',
        latitude: null,
        longitude: null,
        baro_altitude: null,
        on_ground: true,
        velocity: null,
        true_track: null,
        vertical_rate: null,
        last_contact: 0,
      }
      expect(flight.latitude).toBeNull()
      expect(flight.velocity).toBeNull()
    })
  })

  describe('Airport interface', () => {
    it('can construct a full Airport object', () => {
      const airport: Airport = {
        id: 1,
        ident: 'KJFK',
        type: 'large_airport',
        name: 'John F Kennedy International Airport',
        elevation_ft: 13,
        continent: 'NA',
        country: 'United States',
        region: 'NY',
        municipality: 'New York',
        latitude: 40.6413111,
        longitude: -73.7781391,
      }
      expect(airport.ident).toBe('KJFK')
      expect(airport.elevation_ft).toBe(13)
    })

    it('allows null elevation', () => {
      const airport: Airport = {
        id: 2,
        ident: 'KLAX',
        type: 'large_airport',
        name: 'Los Angeles International Airport',
        elevation_ft: null,
        continent: 'NA',
        country: 'United States',
        region: 'CA',
        municipality: 'Los Angeles',
        latitude: 33.9425,
        longitude: -118.4081,
      }
      expect(airport.elevation_ft).toBeNull()
    })
  })
})
