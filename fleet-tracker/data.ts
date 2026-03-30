export interface AircraftCategory {
  category: 'narrowbody' | 'widebody'
  aircraft: string
  variant: string
  totalOrdered: number
  delivered: number
  upcomingDeliveries: { year: number; count: number }[]
  unitCostM: number // millions USD
}

export interface AirlineFleet {
  airline: string
  iata: string
  country: string
  narrowbody: AircraftCategory[]
  widebody: AircraftCategory[]
}

// Realistic fleet data based on Boeing/Airbus published orders as of 2024-2025
// Sources: Boeing commercial market outlook, Airbus orders & deliveries
export const fleetData: AirlineFleet[] = [
  {
    airline: 'United Airlines',
    iata: 'UA',
    country: 'United States',
    narrowbody: [
      {
        category: 'narrowbody',
        aircraft: 'Boeing 737 MAX 8',
        variant: '737 MAX 8',
        totalOrdered: 100,
        delivered: 79,
        upcomingDeliveries: [
          { year: 2025, count: 12 },
          { year: 2026, count: 9 },
        ],
        unitCostM: 64.5,
      },
      {
        category: 'narrowbody',
        aircraft: 'Boeing 737 MAX 9',
        variant: '737 MAX 9',
        totalOrdered: 60,
        delivered: 48,
        upcomingDeliveries: [
          { year: 2025, count: 7 },
          { year: 2026, count: 5 },
        ],
        unitCostM: 70.0,
      },
      {
        category: 'narrowbody',
        aircraft: 'Airbus A320neo',
        variant: 'A321neo',
        totalOrdered: 70,
        delivered: 0,
        upcomingDeliveries: [
          { year: 2026, count: 10 },
          { year: 2027, count: 20 },
          { year: 2028, count: 25 },
          { year: 2029, count: 15 },
        ],
        unitCostM: 82.0,
      },
    ],
    widebody: [
      {
        category: 'widebody',
        aircraft: 'Boeing 787-9 Dreamliner',
        variant: '787-9',
        totalOrdered: 38,
        delivered: 38,
        upcomingDeliveries: [],
        unitCostM: 169.3,
      },
      {
        category: 'widebody',
        aircraft: 'Boeing 777-300ER',
        variant: '777-300ER',
        totalOrdered: 19,
        delivered: 19,
        upcomingDeliveries: [],
        unitCostM: 197.8,
      },
      {
        category: 'widebody',
        aircraft: 'Airbus A350-900',
        variant: 'A350-900',
        totalOrdered: 35,
        delivered: 22,
        upcomingDeliveries: [
          { year: 2025, count: 8 },
          { year: 2026, count: 5 },
        ],
        unitCostM: 218.4,
      },
    ],
  },
  {
    airline: 'American Airlines',
    iata: 'AA',
    country: 'United States',
    narrowbody: [
      {
        category: 'narrowbody',
        aircraft: 'Boeing 737 MAX 8',
        variant: '737 MAX 8',
        totalOrdered: 80,
        delivered: 71,
        upcomingDeliveries: [{ year: 2025, count: 9 }],
        unitCostM: 64.5,
      },
      {
        category: 'narrowbody',
        aircraft: 'Airbus A321neo',
        variant: 'A321neo',
        totalOrdered: 85,
        delivered: 55,
        upcomingDeliveries: [
          { year: 2025, count: 15 },
          { year: 2026, count: 10 },
          { year: 2027, count: 5 },
        ],
        unitCostM: 82.0,
      },
      {
        category: 'narrowbody',
        aircraft: 'Airbus A320neo',
        variant: 'A320neo',
        totalOrdered: 30,
        delivered: 22,
        upcomingDeliveries: [{ year: 2025, count: 8 }],
        unitCostM: 60.0,
      },
    ],
    widebody: [
      {
        category: 'widebody',
        aircraft: 'Boeing 787-8 Dreamliner',
        variant: '787-8',
        totalOrdered: 22,
        delivered: 22,
        upcomingDeliveries: [],
        unitCostM: 152.2,
      },
      {
        category: 'widebody',
        aircraft: 'Boeing 777-300ER',
        variant: '777-300ER',
        totalOrdered: 15,
        delivered: 15,
        upcomingDeliveries: [],
        unitCostM: 197.8,
      },
      {
        category: 'widebody',
        aircraft: 'Airbus A350-1000',
        variant: 'A350-1000',
        totalOrdered: 10,
        delivered: 4,
        upcomingDeliveries: [
          { year: 2025, count: 3 },
          { year: 2026, count: 3 },
        ],
        unitCostM: 287.5,
      },
    ],
  },
  {
    airline: 'Delta Air Lines',
    iata: 'DL',
    country: 'United States',
    narrowbody: [
      {
        category: 'narrowbody',
        aircraft: 'Airbus A321neo',
        variant: 'A321neo',
        totalOrdered: 125,
        delivered: 92,
        upcomingDeliveries: [
          { year: 2025, count: 20 },
          { year: 2026, count: 13 },
        ],
        unitCostM: 82.0,
      },
      {
        category: 'narrowbody',
        aircraft: 'Airbus A320neo',
        variant: 'A320neo',
        totalOrdered: 45,
        delivered: 38,
        upcomingDeliveries: [{ year: 2025, count: 7 }],
        unitCostM: 60.0,
      },
      {
        category: 'narrowbody',
        aircraft: 'Boeing 737 MAX 10',
        variant: '737 MAX 10',
        totalOrdered: 100,
        delivered: 0,
        upcomingDeliveries: [
          { year: 2026, count: 20 },
          { year: 2027, count: 30 },
          { year: 2028, count: 30 },
          { year: 2029, count: 20 },
        ],
        unitCostM: 74.0,
      },
    ],
    widebody: [
      {
        category: 'widebody',
        aircraft: 'Airbus A330-900neo',
        variant: 'A330-900neo',
        totalOrdered: 26,
        delivered: 26,
        upcomingDeliveries: [],
        unitCostM: 136.4,
      },
      {
        category: 'widebody',
        aircraft: 'Boeing 787-9 Dreamliner',
        variant: '787-9',
        totalOrdered: 30,
        delivered: 28,
        upcomingDeliveries: [{ year: 2025, count: 2 }],
        unitCostM: 169.3,
      },
      {
        category: 'widebody',
        aircraft: 'Airbus A350-900',
        variant: 'A350-900',
        totalOrdered: 25,
        delivered: 15,
        upcomingDeliveries: [
          { year: 2025, count: 6 },
          { year: 2026, count: 4 },
        ],
        unitCostM: 218.4,
      },
    ],
  },
  {
    airline: 'Emirates',
    iata: 'EK',
    country: 'United Arab Emirates',
    narrowbody: [],
    widebody: [
      {
        category: 'widebody',
        aircraft: 'Boeing 777-300ER',
        variant: '777-300ER',
        totalOrdered: 140,
        delivered: 140,
        upcomingDeliveries: [],
        unitCostM: 197.8,
      },
      {
        category: 'widebody',
        aircraft: 'Airbus A380-800',
        variant: 'A380-800',
        totalOrdered: 123,
        delivered: 123,
        upcomingDeliveries: [],
        unitCostM: 295.0,
      },
      {
        category: 'widebody',
        aircraft: 'Boeing 787-9 Dreamliner',
        variant: '787-9',
        totalOrdered: 40,
        delivered: 24,
        upcomingDeliveries: [
          { year: 2025, count: 8 },
          { year: 2026, count: 8 },
        ],
        unitCostM: 169.3,
      },
      {
        category: 'widebody',
        aircraft: 'Airbus A350-900',
        variant: 'A350-900',
        totalOrdered: 65,
        delivered: 0,
        upcomingDeliveries: [
          { year: 2026, count: 15 },
          { year: 2027, count: 25 },
          { year: 2028, count: 25 },
        ],
        unitCostM: 218.4,
      },
    ],
  },
  {
    airline: 'Lufthansa',
    iata: 'LH',
    country: 'Germany',
    narrowbody: [
      {
        category: 'narrowbody',
        aircraft: 'Airbus A320neo',
        variant: 'A320neo',
        totalOrdered: 72,
        delivered: 55,
        upcomingDeliveries: [
          { year: 2025, count: 10 },
          { year: 2026, count: 7 },
        ],
        unitCostM: 60.0,
      },
      {
        category: 'narrowbody',
        aircraft: 'Airbus A321neo',
        variant: 'A321neo',
        totalOrdered: 40,
        delivered: 18,
        upcomingDeliveries: [
          { year: 2025, count: 12 },
          { year: 2026, count: 10 },
        ],
        unitCostM: 82.0,
      },
      {
        category: 'narrowbody',
        aircraft: 'Boeing 737 MAX 10',
        variant: '737 MAX 10',
        totalOrdered: 20,
        delivered: 0,
        upcomingDeliveries: [
          { year: 2027, count: 10 },
          { year: 2028, count: 10 },
        ],
        unitCostM: 74.0,
      },
    ],
    widebody: [
      {
        category: 'widebody',
        aircraft: 'Airbus A350-900',
        variant: 'A350-900',
        totalOrdered: 45,
        delivered: 23,
        upcomingDeliveries: [
          { year: 2025, count: 10 },
          { year: 2026, count: 12 },
        ],
        unitCostM: 218.4,
      },
      {
        category: 'widebody',
        aircraft: 'Boeing 787-9 Dreamliner',
        variant: '787-9',
        totalOrdered: 20,
        delivered: 0,
        upcomingDeliveries: [
          { year: 2026, count: 5 },
          { year: 2027, count: 10 },
          { year: 2028, count: 5 },
        ],
        unitCostM: 169.3,
      },
      {
        category: 'widebody',
        aircraft: 'Airbus A380-800',
        variant: 'A380-800',
        totalOrdered: 8,
        delivered: 8,
        upcomingDeliveries: [],
        unitCostM: 295.0,
      },
    ],
  },
  {
    airline: 'Singapore Airlines',
    iata: 'SQ',
    country: 'Singapore',
    narrowbody: [],
    widebody: [
      {
        category: 'widebody',
        aircraft: 'Airbus A350-900',
        variant: 'A350-900',
        totalOrdered: 67,
        delivered: 63,
        upcomingDeliveries: [{ year: 2025, count: 4 }],
        unitCostM: 218.4,
      },
      {
        category: 'widebody',
        aircraft: 'Boeing 787-10 Dreamliner',
        variant: '787-10',
        totalOrdered: 30,
        delivered: 21,
        upcomingDeliveries: [
          { year: 2025, count: 5 },
          { year: 2026, count: 4 },
        ],
        unitCostM: 178.9,
      },
      {
        category: 'widebody',
        aircraft: 'Airbus A380-800',
        variant: 'A380-800',
        totalOrdered: 24,
        delivered: 24,
        upcomingDeliveries: [],
        unitCostM: 295.0,
      },
      {
        category: 'widebody',
        aircraft: 'Boeing 777-9',
        variant: '777-9',
        totalOrdered: 31,
        delivered: 0,
        upcomingDeliveries: [
          { year: 2026, count: 5 },
          { year: 2027, count: 13 },
          { year: 2028, count: 13 },
        ],
        unitCostM: 218.0,
      },
    ],
  },
  {
    airline: 'Qatar Airways',
    iata: 'QR',
    country: 'Qatar',
    narrowbody: [],
    widebody: [
      {
        category: 'widebody',
        aircraft: 'Airbus A350-1000',
        variant: 'A350-1000',
        totalOrdered: 60,
        delivered: 52,
        upcomingDeliveries: [
          { year: 2025, count: 5 },
          { year: 2026, count: 3 },
        ],
        unitCostM: 287.5,
      },
      {
        category: 'widebody',
        aircraft: 'Boeing 777-300ER',
        variant: '777-300ER',
        totalOrdered: 30,
        delivered: 30,
        upcomingDeliveries: [],
        unitCostM: 197.8,
      },
      {
        category: 'widebody',
        aircraft: 'Airbus A380-800',
        variant: 'A380-800',
        totalOrdered: 10,
        delivered: 10,
        upcomingDeliveries: [],
        unitCostM: 295.0,
      },
      {
        category: 'widebody',
        aircraft: 'Boeing 787-9 Dreamliner',
        variant: '787-9',
        totalOrdered: 30,
        delivered: 10,
        upcomingDeliveries: [
          { year: 2025, count: 8 },
          { year: 2026, count: 7 },
          { year: 2027, count: 5 },
        ],
        unitCostM: 169.3,
      },
    ],
  },
  {
    airline: 'British Airways',
    iata: 'BA',
    country: 'United Kingdom',
    narrowbody: [
      {
        category: 'narrowbody',
        aircraft: 'Airbus A320neo',
        variant: 'A320neo',
        totalOrdered: 50,
        delivered: 35,
        upcomingDeliveries: [
          { year: 2025, count: 10 },
          { year: 2026, count: 5 },
        ],
        unitCostM: 60.0,
      },
      {
        category: 'narrowbody',
        aircraft: 'Airbus A321neo',
        variant: 'A321neo',
        totalOrdered: 35,
        delivered: 20,
        upcomingDeliveries: [
          { year: 2025, count: 8 },
          { year: 2026, count: 7 },
        ],
        unitCostM: 82.0,
      },
    ],
    widebody: [
      {
        category: 'widebody',
        aircraft: 'Airbus A350-1000',
        variant: 'A350-1000',
        totalOrdered: 18,
        delivered: 14,
        upcomingDeliveries: [{ year: 2025, count: 4 }],
        unitCostM: 287.5,
      },
      {
        category: 'widebody',
        aircraft: 'Boeing 787-9 Dreamliner',
        variant: '787-9',
        totalOrdered: 18,
        delivered: 18,
        upcomingDeliveries: [],
        unitCostM: 169.3,
      },
      {
        category: 'widebody',
        aircraft: 'Airbus A380-800',
        variant: 'A380-800',
        totalOrdered: 12,
        delivered: 12,
        upcomingDeliveries: [],
        unitCostM: 295.0,
      },
    ],
  },
  {
    airline: 'Air France',
    iata: 'AF',
    country: 'France',
    narrowbody: [
      {
        category: 'narrowbody',
        aircraft: 'Airbus A320neo',
        variant: 'A320neo',
        totalOrdered: 55,
        delivered: 40,
        upcomingDeliveries: [
          { year: 2025, count: 10 },
          { year: 2026, count: 5 },
        ],
        unitCostM: 60.0,
      },
      {
        category: 'narrowbody',
        aircraft: 'Airbus A321neo',
        variant: 'A321neo',
        totalOrdered: 30,
        delivered: 12,
        upcomingDeliveries: [
          { year: 2025, count: 10 },
          { year: 2026, count: 8 },
        ],
        unitCostM: 82.0,
      },
    ],
    widebody: [
      {
        category: 'widebody',
        aircraft: 'Airbus A350-900',
        variant: 'A350-900',
        totalOrdered: 38,
        delivered: 20,
        upcomingDeliveries: [
          { year: 2025, count: 10 },
          { year: 2026, count: 8 },
        ],
        unitCostM: 218.4,
      },
      {
        category: 'widebody',
        aircraft: 'Boeing 787-9 Dreamliner',
        variant: '787-9',
        totalOrdered: 10,
        delivered: 10,
        upcomingDeliveries: [],
        unitCostM: 169.3,
      },
    ],
  },
  {
    airline: 'Japan Airlines',
    iata: 'JL',
    country: 'Japan',
    narrowbody: [
      {
        category: 'narrowbody',
        aircraft: 'Airbus A321neo',
        variant: 'A321neo',
        totalOrdered: 50,
        delivered: 30,
        upcomingDeliveries: [
          { year: 2025, count: 12 },
          { year: 2026, count: 8 },
        ],
        unitCostM: 82.0,
      },
      {
        category: 'narrowbody',
        aircraft: 'Boeing 737 MAX 8',
        variant: '737 MAX 8',
        totalOrdered: 30,
        delivered: 20,
        upcomingDeliveries: [
          { year: 2025, count: 6 },
          { year: 2026, count: 4 },
        ],
        unitCostM: 64.5,
      },
    ],
    widebody: [
      {
        category: 'widebody',
        aircraft: 'Boeing 787-9 Dreamliner',
        variant: '787-9',
        totalOrdered: 40,
        delivered: 32,
        upcomingDeliveries: [
          { year: 2025, count: 5 },
          { year: 2026, count: 3 },
        ],
        unitCostM: 169.3,
      },
      {
        category: 'widebody',
        aircraft: 'Airbus A350-900',
        variant: 'A350-900',
        totalOrdered: 28,
        delivered: 8,
        upcomingDeliveries: [
          { year: 2025, count: 10 },
          { year: 2026, count: 10 },
        ],
        unitCostM: 218.4,
      },
    ],
  },
  {
    airline: 'Cathay Pacific',
    iata: 'CX',
    country: 'Hong Kong',
    narrowbody: [],
    widebody: [
      {
        category: 'widebody',
        aircraft: 'Airbus A350-900',
        variant: 'A350-900',
        totalOrdered: 48,
        delivered: 36,
        upcomingDeliveries: [
          { year: 2025, count: 7 },
          { year: 2026, count: 5 },
        ],
        unitCostM: 218.4,
      },
      {
        category: 'widebody',
        aircraft: 'Boeing 777-300ER',
        variant: '777-300ER',
        totalOrdered: 39,
        delivered: 39,
        upcomingDeliveries: [],
        unitCostM: 197.8,
      },
      {
        category: 'widebody',
        aircraft: 'Airbus A350-1000',
        variant: 'A350-1000',
        totalOrdered: 18,
        delivered: 0,
        upcomingDeliveries: [
          { year: 2027, count: 9 },
          { year: 2028, count: 9 },
        ],
        unitCostM: 287.5,
      },
    ],
  },
  {
    airline: 'Alaska Airlines',
    iata: 'AS',
    country: 'United States',
    narrowbody: [
      {
        category: 'narrowbody',
        aircraft: 'Boeing 737 MAX 9',
        variant: '737 MAX 9',
        totalOrdered: 52,
        delivered: 42,
        upcomingDeliveries: [
          { year: 2025, count: 7 },
          { year: 2026, count: 3 },
        ],
        unitCostM: 70.0,
      },
      {
        category: 'narrowbody',
        aircraft: 'Airbus A321neo',
        variant: 'A321neo',
        totalOrdered: 30,
        delivered: 18,
        upcomingDeliveries: [
          { year: 2025, count: 8 },
          { year: 2026, count: 4 },
        ],
        unitCostM: 82.0,
      },
    ],
    widebody: [],
  },
]

// Totals helpers
export function totalOrdered(airline: AirlineFleet): number {
  const nb = airline.narrowbody.reduce((s, a) => s + a.totalOrdered, 0)
  const wb = airline.widebody.reduce((s, a) => s + a.totalOrdered, 0)
  return nb + wb
}

export function totalDelivered(airline: AirlineFleet): number {
  const nb = airline.narrowbody.reduce((s, a) => s + a.delivered, 0)
  const wb = airline.widebody.reduce((s, a) => s + a.delivered, 0)
  return nb + wb
}

export function totalUpcoming(airline: AirlineFleet): number {
  return [...airline.narrowbody, ...airline.widebody].reduce(
    (sum, a) => sum + a.upcomingDeliveries.reduce((s, d) => s + d.count, 0),
    0,
  )
}
