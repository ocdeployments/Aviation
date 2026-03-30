import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { TripReport } from '../types'

const CABIN_COLORS: Record<string, string> = {
  'First': 'bg-yellow-900 text-yellow-300',
  'Business': 'bg-blue-900 text-blue-300',
  'Premium Economy': 'bg-purple-900 text-purple-300',
  'Economy': 'bg-slate-700 text-slate-300',
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <span key={n} className={n <= rating ? 'text-yellow-400' : 'text-slate-600'}>&#9733;</span>
      ))}
    </div>
  )
}

const AIRLINES = ['All', 'British Airways', 'Qatar Airways', 'Emirates', 'Singapore Airlines', 'Delta Air Lines', 'Southwest Airlines', 'Air France', 'American Airlines']

export default function Reports() {
  const [reports, setReports] = useState<TripReport[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [cabinFilter, setCabinFilter] = useState('All')
  const [sortBy, setSortBy] = useState<'views' | 'rating' | 'created_at'>('views')

  useEffect(() => {
    let q = supabase.from('trip_reports').select('*').eq('status', 'published')
    if (filter !== 'All') q = q.eq('airline', filter)
    if (cabinFilter !== 'All') q = q.eq('cabin', cabinFilter)
    q.order(sortBy === 'created_at' ? 'created_at' : sortBy, { ascending: false })
      .then(({ data }) => {
        setReports((data as TripReport[]) || [])
        setLoading(false)
      })
  }, [filter, cabinFilter, sortBy])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Trip Reports</h1>
        <Link to="/submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition">+ Submit Report</Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Airline</label>
          <select value={filter} onChange={e => setFilter(e.target.value)} className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
            {AIRLINES.map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Cabin</label>
          <select value={cabinFilter} onChange={e => setCabinFilter(e.target.value)} className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
            {['All', 'First', 'Business', 'Premium Economy', 'Economy'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Sort by</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as 'views' | 'rating' | 'created_at')} className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
            <option value="views">Most Read</option>
            <option value="rating">Highest Rated</option>
            <option value="created_at">Newest</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading reports...</div>
      ) : (
        <div className="space-y-4">
          {reports.length === 0 && <div className="text-center py-16 text-slate-500">No reports found. <Link to="/submit" className="text-blue-400 hover:underline">Be the first!</Link></div>}
          {reports.map(r => (
            <Link key={r.id} to={`/reports/${r.slug || r.id}`} className="block bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-blue-500 transition group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${CABIN_COLORS[r.cabin] || 'bg-slate-700'}`}>{r.cabin}</span>
                    <span className="text-slate-500 text-xs">{r.airline}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400 text-sm font-mono">{r.route}</span>
                  </div>
                  <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition mb-1">{r.title}</h3>
                  <p className="text-slate-400 text-sm line-clamp-2 mb-3">{r.content.slice(0, 150)}...</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>By {r.author}</span>
                    <span>·</span>
                    <span>{new Date(r.created_at).toLocaleDateString()}</span>
                    <span>·</span>
                    <span>{r.views?.toLocaleString() || 0} views</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <StarRating rating={r.rating} />
                  <div className="text-xs text-slate-500 mt-1">{r.rating}/5</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
