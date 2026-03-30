import { useState } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

export type DealType = 'mistake' | 'sale' | 'points' | 'credit-card'

export interface Deal {
  id: string
  type: DealType
  route: string
  origin: string
  originCode: string
  destination: string
  destinationCode: string
  price: number
  originalPrice?: number
  airline: string
  cabin: string
  expiresAt?: string
  badge?: string
  bookUrl: string
  note?: string
  // Credit card specific
  cardName?: string
  annualFee?: number
  signupBonus?: string
  cardUrl?: string
}

// ─── Static Data ─────────────────────────────────────────────────────────────

const DEALS: Deal[] = [
  // MISTAKE FARES
  {
    id: 'mf-1',
    type: 'mistake',
    route: 'NYC → Dubai',
    origin: 'New York (JFK)',
    originCode: 'JFK',
    destination: 'Dubai (DXB)',
    destinationCode: 'DXB',
    price: 299,
    originalPrice: 1200,
    airline: 'Emirates',
    cabin: 'Economy',
    expiresAt: '2026-04-05',
    badge: 'MISTAKE FARE',
    bookUrl: buildSkyscannerUrl('JFK', 'DXB'),
    note: 'Pricing error — confirmed valid at check-in',
  },
  {
    id: 'mf-2',
    type: 'mistake',
    route: 'LAX → Tokyo',
    origin: 'Los Angeles (LAX)',
    originCode: 'LAX',
    destination: 'Tokyo (NRT)',
    destinationCode: 'NRT',
    price: 349,
    originalPrice: 980,
    airline: 'ANA',
    cabin: 'Economy',
    expiresAt: '2026-04-07',
    badge: 'MISTAKE FARE',
    bookUrl: buildSkyscannerUrl('LAX', 'NRT'),
    note: 'Glitch fare — gone in hours typically',
  },
  {
    id: 'mf-3',
    type: 'mistake',
    route: 'Chicago → Paris',
    origin: 'Chicago (ORD)',
    originCode: 'ORD',
    destination: 'Paris (CDG)',
    destinationCode: 'CDG',
    price: 199,
    originalPrice: 750,
    airline: 'Air France',
    cabin: 'Economy',
    expiresAt: '2026-04-03',
    badge: 'MISTAKE FARE',
    bookUrl: buildSkyscannerUrl('ORD', 'CDG'),
    note: 'Fuel dump error — book immediately',
  },
  {
    id: 'mf-4',
    type: 'mistake',
    route: 'Miami → London',
    origin: 'Miami (MIA)',
    originCode: 'MIA',
    destination: 'London (LHR)',
    destinationCode: 'LHR',
    price: 259,
    originalPrice: 890,
    airline: 'British Airways',
    cabin: 'Economy',
    expiresAt: '2026-04-10',
    badge: 'MISTAKE FARE',
    bookUrl: buildSkyscannerUrl('MIA', 'LHR'),
  },
  // SALE FARES
  {
    id: 'sf-1',
    type: 'sale',
    route: 'USA → Europe (All)',
    origin: 'Multiple US Cities',
    originCode: 'NYC',
    destination: 'Europe (Major)',
    destinationCode: 'PAR',
    price: 399,
    originalPrice: 699,
    airline: 'United',
    cabin: 'Economy',
    badge: 'SALE',
    bookUrl: buildSkyscannerUrl('NYC', 'PAR'),
    note: 'Round-trip, book by Apr 15',
  },
  {
    id: 'sf-2',
    type: 'sale',
    route: 'NYC → Milan',
    origin: 'New York (JFK)',
    originCode: 'JFK',
    destination: 'Milan (MXP)',
    destinationCode: 'MXP',
    price: 549,
    originalPrice: 1100,
    airline: 'Delta',
    cabin: 'Economy',
    badge: 'SALE',
    bookUrl: buildSkyscannerUrl('JFK', 'MXP'),
    note: 'Summer travel included',
  },
  {
    id: 'sf-3',
    type: 'sale',
    route: 'NYC → Frankfurt',
    origin: 'New York (JFK)',
    originCode: 'JFK',
    destination: 'Frankfurt (FRA)',
    destinationCode: 'FRA',
    price: 699,
    originalPrice: 1450,
    airline: 'Lufthansa',
    cabin: 'Business',
    badge: 'SALE',
    bookUrl: buildSkyscannerUrl('JFK', 'FRA'),
    note: 'Lie-flat seats, summer dates',
  },
  {
    id: 'sf-4',
    type: 'sale',
    route: 'Boston → Barcelona',
    origin: 'Boston (BOS)',
    originCode: 'BOS',
    destination: 'Barcelona (BCN)',
    destinationCode: 'BCN',
    price: 449,
    originalPrice: 980,
    airline: 'Iberia',
    cabin: 'Economy',
    badge: 'SALE',
    bookUrl: buildSkyscannerUrl('BOS', 'BCN'),
    note: 'Via Madrid, summer dates',
  },
  {
    id: 'sf-5',
    type: 'sale',
    route: 'Seattle → Singapore',
    origin: 'Seattle (SEA)',
    originCode: 'SEA',
    destination: 'Singapore (SIN)',
    destinationCode: 'SIN',
    price: 899,
    originalPrice: 1800,
    airline: 'Singapore Airlines',
    cabin: 'Business',
    badge: 'SALE',
    bookUrl: buildSkyscannerUrl('SEA', 'SIN'),
    note: 'Flagship Suite available on A350',
  },
  // POINTS/MILES OFFERS
  {
    id: 'pt-1',
    type: 'points',
    route: 'USA → Middle East',
    origin: 'USA (Major)',
    originCode: 'JFK',
    destination: 'Middle East',
    destinationCode: 'DXB',
    price: 45000,
    originalPrice: 120000,
    airline: 'Emirates',
    cabin: 'Business',
    badge: 'POINTS',
    bookUrl: 'https://www.emirates.com/us/english/book/emirates-skywards/',
    note: 'Round-trip in Business Class',
  },
  {
    id: 'pt-2',
    type: 'points',
    route: 'USA → Europe',
    origin: 'USA (Major)',
    originCode: 'JFK',
    destination: 'Europe (Major)',
    destinationCode: 'LHR',
    price: 30000,
    originalPrice: 60000,
    airline: 'British Airways',
    cabin: 'Business',
    badge: 'POINTS',
    bookUrl: 'https://www.britishairways.com/travel/clubs-offers/public/en_us',
    note: 'Off-peak dates save 20%',
  },
  {
    id: 'pt-3',
    type: 'points',
    route: 'USA → Asia',
    origin: 'USA (West Coast)',
    originCode: 'LAX',
    destination: 'Asia (Major)',
    destinationCode: 'NRT',
    price: 55000,
    originalPrice: 120000,
    airline: 'ANA',
    cabin: 'Business',
    badge: 'POINTS',
    bookUrl: 'https://www.ana.co.jp/en/us/promo/',
    note: 'Super Seat availability opens May',
  },
]

const CREDIT_CARDS: Deal[] = [
  {
    id: 'cc-1',
    type: 'credit-card',
    route: 'Amex Gold',
    origin: '',
    originCode: '',
    destination: '',
    destinationCode: '',
    price: 0,
    cardName: 'American Express® Gold Card',
    annualFee: 325,
    signupBonus: '60,000 Membership Rewards® after $6K spend',
    cardUrl: 'https://www.americanexpress.com/en-us/card-benefits/gold/',
    airline: 'Best for: Dining & Travel',
    cabin: 'No annual fee first year sometimes',
    bookUrl: 'https://www.americanexpress.com/en-us/credit-cards/',
  },
  {
    id: 'cc-2',
    type: 'credit-card',
    route: 'Chase Sapphire Reserve',
    origin: '',
    originCode: '',
    destination: '',
    destinationCode: '',
    price: 0,
    cardName: 'Chase Sapphire Reserve®',
    annualFee: 550,
    signupBonus: '60,000 Chase Points after $4K spend',
    cardUrl: 'https://www.chase.com/card-details/reserve/',
    airline: 'Best for: Airline transfers + 3x travel',
    cabin: '$300 annual travel credit included',
    bookUrl: 'https://www.chase.com/',
  },
  {
    id: 'cc-3',
    type: 'credit-card',
    route: 'Capital One Venture X',
    origin: '',
    originCode: '',
    destination: '',
    destinationCode: '',
    price: 0,
    cardName: 'Capital One Venture X Rewards',
    annualFee: 395,
    signupBonus: '75,000 miles after $4K spend',
    cardUrl: 'https://www.capitalone.com/credit-cards/venture-x/',
    airline: 'Best for: Flat-rate miles + Priority Pass',
    cabin: '$300 travel credit + 10K anniversary miles',
    bookUrl: 'https://www.capitalone.com/',
  },
  {
    id: 'cc-4',
    type: 'credit-card',
    route: 'Amex Platinum',
    origin: '',
    originCode: '',
    destination: '',
    destinationCode: '',
    price: 0,
    cardName: 'American Express® Platinum Card',
    annualFee: 695,
    signupBonus: '80,000 Membership Rewards® after $8K spend',
    cardUrl: 'https://www.americanexpress.com/en-us/credit-cards/',
    airline: 'Best for: Lounge access + Centurion perks',
    cabin: '$200 airline fee credit annually',
    bookUrl: 'https://www.americanexpress.com/en-us/credit-cards/',
  },
]

// ─── URL Builder ──────────────────────────────────────────────────────────────

function buildSkyscannerUrl(origin: string, destination: string): string {
  const base = 'https://www.skyscanner.com/transport/flights/'
  const params = new URLSearchParams({
    adultsv2: '1',
    cabinclass: 'economy',
    childrenv2: '',
    destination: destination,
    inboundaltsenabled: 'false',
    infantsv2: '',
    origin: origin,
    outboundaltsenabled: 'false',
    preferDirects: 'false',
    ref: 'home',
  })
  return `${base}?${params.toString()}`
}

function buildGoogleFlightsUrl(origin: string, destination: string): string {
  return `https://www.google.com/travel/flights/search?tfs=CBwQAhooagwIAxIIL2cvMTF0eGoxEgoyMDI2LTAzLTMxKABqDAgDEggvZy8xMXR4ajESAggB&curr=USD&q=flights+from+${origin}+to+${destination}`
}

// ─── SVG Route Map ────────────────────────────────────────────────────────────

const CITY_POSITIONS: Record<string, { x: number; y: number; label: string }> = {
  'JFK': { x: 248, y: 145, label: 'New York' },
  'LAX': { x: 120, y: 160, label: 'Los Angeles' },
  'ORD': { x: 195, y: 140, label: 'Chicago' },
  'MIA': { x: 235, y: 195, label: 'Miami' },
  'BOS': { x: 258, y: 135, label: 'Boston' },
  'SEA': { x: 110, y: 100, label: 'Seattle' },
  'DXB': { x: 590, y: 175, label: 'Dubai' },
  'LHR': { x: 460, y: 115, label: 'London' },
  'CDG': { x: 475, y: 125, label: 'Paris' },
  'FRA': { x: 495, y: 120, label: 'Frankfurt' },
  'NRT': { x: 780, y: 155, label: 'Tokyo' },
  'SIN': { x: 720, y: 220, label: 'Singapore' },
  'MXP': { x: 495, y: 135, label: 'Milan' },
  'BCN': { x: 465, y: 148, label: 'Barcelona' },
  'PAR': { x: 472, y: 125, label: 'Paris' },
}

function RouteMap({ origin, destination }: { origin: string; destination: string }) {
  const orig = CITY_POSITIONS[origin]
  const dest = CITY_POSITIONS[destination]

  if (!orig || !dest) {
    return (
      <div className="bg-slate-700/50 rounded-lg h-24 flex items-center justify-center text-slate-500 text-xs">
        Route map
      </div>
    )
  }

  const mx = (orig.x + dest.x) / 2
  const my = (orig.y + dest.y) / 2 - 30

  // Curved path using quadratic bezier
  const d = `M${orig.x},${orig.y} Q${mx},${my} ${dest.x},${dest.y}`

  return (
    <div className="bg-slate-700/30 rounded-lg p-2 overflow-hidden">
      <svg viewBox="0 0 880 260" className="w-full h-20">
        {/* Background dots */}
        <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#334155" opacity="0.5" />
        </pattern>
        <rect width="880" height="260" fill="url(#dots)" />

        {/* Route arc */}
        <path d={d} stroke="#22c55e" strokeWidth="2" fill="none" opacity="0.7" strokeDasharray="6,3" />

        {/* Origin dot */}
        <circle cx={orig.x} cy={orig.y} r="5" fill="#3b82f6" />
        <text x={orig.x} y={orig.y - 10} textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">
          {origin}
        </text>

        {/* Destination dot */}
        <circle cx={dest.x} cy={dest.y} r="5" fill="#22c55e" />
        <text x={dest.x} y={dest.y - 10} textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">
          {destination}
        </text>

        {/* Plane icon midpoint */}
        <text x={mx} y={my - 5} textAnchor="middle" fontSize="12" fill="#22c55e" opacity="0.8">✈</text>
      </svg>
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────

const BADGE_STYLES: Record<DealType, string> = {
  mistake: 'bg-red-900/80 text-red-300 border border-red-700',
  sale: 'bg-blue-900/80 text-blue-300 border border-blue-700',
  points: 'bg-amber-900/80 text-amber-300 border border-amber-700',
  'credit-card': 'bg-slate-700 text-slate-300 border border-slate-600',
}

function DealBadge({ type, label }: { type: DealType; label?: string }) {
  const text = label || (type === 'mistake' ? 'MISTAKE FARE' : type === 'sale' ? 'SALE' : type === 'points' ? 'POINTS' : '')
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded ${BADGE_STYLES[type]}`}>
      {text}
    </span>
  )
}

// ─── Expiry ───────────────────────────────────────────────────────────────────

function Expiry({ date }: { date: string }) {
  const d = new Date(date)
  const now = new Date()
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const urgent = diff <= 2
  return (
    <span className={`text-xs ${urgent ? 'text-red-400 font-semibold' : 'text-slate-400'}`}>
      {diff > 0 ? `Expires in ${diff}d` : 'Expiring soon'}
    </span>
  )
}

// ─── Search Widget ───────────────────────────────────────────────────────────

const POPULAR_ROUTES = [
  { orig: 'JFK', dest: 'LHR' },
  { orig: 'LAX', dest: 'NRT' },
  { orig: 'ORD', dest: 'CDG' },
  { orig: 'JFK', dest: 'DXB' },
  { orig: 'MIA', dest: 'LHR' },
  { orig: 'BOS', dest: 'BCN' },
  { orig: 'SEA', dest: 'SIN' },
  { orig: 'LAX', dest: 'MXP' },
]

const AIRPORT_CODES = [
  'JFK', 'LAX', 'ORD', 'DFW', 'DEN', 'ATL', 'MIA', 'BOS', 'SEA', 'SFO',
  'LHR', 'CDG', 'FRA', 'DXB', 'SIN', 'NRT', 'HKG', 'MXP', 'BCN', 'AMS',
]

function SearchWidget() {
  const [origin, setOrigin] = useState('JFK')
  const [dest, setDest] = useState('LHR')

  const skyscannerUrl = buildSkyscannerUrl(origin, dest)
  const googleUrl = buildGoogleFlightsUrl(origin, dest)

  const swap = () => setOrigin(prev => { const o = dest; setDest(prev); return o })

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-10">
      <h2 className="text-lg font-bold text-white mb-4">🔍 Search Flights</h2>
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="flex-1 w-full">
          <label className="text-xs text-slate-400 mb-1 block">From</label>
          <select
            value={origin}
            onChange={e => setOrigin(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
          >
            {AIRPORT_CODES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <button
          onClick={swap}
          className="mt-5 text-slate-400 hover:text-white transition text-xl px-2"
          title="Swap routes"
        >
          ⇄
        </button>

        <div className="flex-1 w-full">
          <label className="text-xs text-slate-400 mb-1 block">To</label>
          <select
            value={dest}
            onChange={e => setDest(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
          >
            {AIRPORT_CODES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="mt-5 flex gap-2">
          <a
            href={skyscannerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition whitespace-nowrap"
          >
            Skyscanner
          </a>
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-600 hover:bg-slate-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition whitespace-nowrap"
          >
            Google Flights
          </a>
        </div>
      </div>

      {/* Popular routes */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="text-xs text-slate-500 mr-1">Popular:</span>
        {POPULAR_ROUTES.map(r => (
          <button
            key={`${r.orig}-${r.dest}`}
            onClick={() => { setOrigin(r.orig); setDest(r.dest) }}
            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded transition"
          >
            {r.orig} → {r.dest}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Deal Card ────────────────────────────────────────────────────────────────

function isPointsDeal(deal: Deal) {
  return deal.type === 'points' || deal.type === 'credit-card'
}

function DealCard({ deal }: { deal: Deal }) {
  const isPoints = isPointsDeal(deal)
  const savingsPct = deal.originalPrice
    ? Math.round((1 - deal.price / deal.originalPrice) * 100)
    : null

  if (deal.type === 'credit-card') {
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-amber-600 transition flex flex-col">
        <div className="p-5 flex-1">
          <div className="flex items-start justify-between mb-3">
            <DealBadge type="credit-card" />
          </div>
          <h3 className="font-bold text-white text-lg mb-1">{deal.cardName}</h3>
          <p className="text-amber-400 text-sm font-medium mb-3">{deal.signupBonus}</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Annual Fee</span>
              <span className="font-semibold">${deal.annualFee}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Perk</span>
              <span className="font-medium text-right">{deal.airline}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Note</span>
              <span className="font-medium text-right">{deal.cabin}</span>
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-700/50 border-t border-slate-700">
          <a
            href={deal.cardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-amber-600 hover:bg-amber-700 text-white text-center py-2.5 rounded-lg text-sm font-semibold transition"
          >
            Apply Now →
          </a>
          <p className="text-slate-500 text-xs text-center mt-2">Terms apply · Not affiliated with AviationHub</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-green-600/50 transition flex flex-col">
      {deal.originCode && deal.destinationCode && (
        <div className="px-5 pt-4 pb-0">
          <RouteMap origin={deal.originCode} destination={deal.destinationCode} />
        </div>
      )}
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between mb-3">
          <DealBadge type={deal.type} label={deal.badge} />
          {deal.expiresAt && <Expiry date={deal.expiresAt} />}
        </div>

        <h3 className="font-bold text-white text-lg mb-1">{deal.route}</h3>
        <p className="text-slate-400 text-sm mb-3">{deal.airline} · {deal.cabin}</p>

        {deal.note && (
          <p className="text-slate-400 text-xs italic mb-3">💬 {deal.note}</p>
        )}

        <div className="flex items-end gap-2">
          <div className="text-green-400 font-bold text-2xl">
            {isPoints ? `${deal.price.toLocaleString()} pts` : `$${deal.price}`}
          </div>
          {deal.originalPrice && (
            <div className="text-slate-500 text-sm line-through mb-0.5">
              {isPoints ? `${deal.originalPrice.toLocaleString()} pts` : `$${deal.originalPrice}`}
            </div>
          )}
          {savingsPct && (
            <div className="text-green-500 text-xs font-semibold mb-1">
              Save {savingsPct}%
            </div>
          )}
        </div>
      </div>
      <div className="p-4 bg-slate-700/50 border-t border-slate-700">
        <a
          href={deal.bookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-green-600 hover:bg-green-700 text-white text-center py-2.5 rounded-lg text-sm font-semibold transition"
        >
          Book Now →
        </a>
        <div className="flex justify-center gap-3 mt-2">
          <a
            href={buildGoogleFlightsUrl(deal.originCode || 'JFK', deal.destinationCode || 'LHR')}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-slate-300 text-xs transition"
          >
            Compare on Google
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function DealsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'mistake' | 'sale' | 'points' | 'cards'>('all')

  const tabs = [
    { key: 'all', label: 'All Deals', icon: '🔥' },
    { key: 'mistake', label: 'Mistake Fares', icon: '⚠️' },
    { key: 'sale', label: 'Fare Sales', icon: '🏷️' },
    { key: 'points', label: 'Points Deals', icon: '🎯' },
    { key: 'cards', label: 'Credit Cards', icon: '💳' },
  ] as const

  const filtered = DEALS.filter(d => {
    if (activeTab === 'all') return true
    if (activeTab === 'mistake') return d.type === 'mistake'
    if (activeTab === 'sale') return d.type === 'sale'
    if (activeTab === 'points') return d.type === 'points'
    return false
  })

  const visibleCards = activeTab === 'cards' ? CREDIT_CARDS : filtered

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Flight Deals <span className="text-green-400">Finder</span>
        </h1>
        <p className="text-slate-400 max-w-xl">
          Error fares, fare sales, and points deals — curated daily. Book direct via Skyscanner or Google Flights (affiliate links; no extra cost to you).
        </p>
        <div className="flex gap-3 mt-3 text-xs text-slate-500">
          <span>🔗 Skyscanner affiliate</span>
          <span>·</span>
          <span>Free to join: <a href="https://partners.skyscanner.net/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">partners.skyscanner.net</a></span>
        </div>
      </div>

      {/* Search Widget */}
      <SearchWidget />

      {/* Disclaimer Banner */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-2.5 text-xs text-slate-400 mb-6 flex items-center gap-2">
        <span>ℹ️</span>
        <span>
          Deals are curated manually and updated regularly. Prices are subject to change. 
          Some links are affiliate links (Skyscanner) — you pay nothing extra. 
          Credit card offers are from issuers directly. Always verify directly before booking.
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Deals Grid */}
      {visibleCards.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          No deals in this category right now. Check back soon.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleCards.map(deal => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}

      {/* Affiliate CTA */}
      <div className="mt-12 bg-gradient-to-r from-slate-800 to-slate-800/60 rounded-2xl p-6 border border-slate-700 text-center">
        <h3 className="text-lg font-bold text-white mb-2">Want to support AviationHub?</h3>
        <p className="text-slate-400 text-sm mb-4 max-w-md mx-auto">
          Join the Skyscanner affiliate program for free and earn commissions when your followers or community book flights.
        </p>
        <a
          href="https://partners.skyscanner.net/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition"
        >
          Join Skyscanner Partners (Free) →
        </a>
      </div>

      {/* Last Updated */}
      <p className="text-center text-slate-600 text-xs mt-6">
        Last updated: March 30, 2026 · Deals refresh daily · Follow @AviationHub for real-time alerts
      </p>
    </div>
  )
}
