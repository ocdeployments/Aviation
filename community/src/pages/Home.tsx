import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { TripReport } from '../types'
import { NewsletterForm } from '../../../newsletter/NewsletterForm'

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

export default function Home() {
  const [featured, setFeatured] = useState<TripReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('trip_reports')
      .select('*')
      .eq('status', 'published')
      .order('views', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        setFeatured((data as TripReport[]) || [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center py-16">
        <h1 className="text-5xl font-bold text-white mb-4">Your Flight. <span className="text-blue-400">Your Story.</span></h1>
        <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
          The internet's most honest trip reports. Real flights, real experiences, real advice from passengers who've actually flown.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/reports" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition">Browse Reports</Link>
          <Link to="/submit" className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-3 rounded-xl font-semibold transition">Share Your Flight</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-16">
        {[
          { label: 'Trip Reports', value: '2,400+', icon: '📝' },
          { label: 'Routes Covered', value: '850+', icon: '🛫' },
          { label: 'Airlines', value: '140+', icon: '✈️' },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 rounded-xl p-6 text-center border border-slate-700">
            <div className="text-3xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-slate-400 text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Featured */}
      <h2 className="text-2xl font-bold mb-6">Top Reports This Week</h2>
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featured.map(r => (
            <Link key={r.id} to={`/reports/${r.slug || r.id}`} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-blue-500 transition group">
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${CABIN_COLORS[r.cabin] || 'bg-slate-700'}`}>{r.cabin}</span>
                  <StarRating rating={r.rating} />
                </div>
                <h3 className="font-bold text-white group-hover:text-blue-400 transition mb-2">{r.title}</h3>
                <div className="text-slate-400 text-sm mb-3">{r.airline} · {r.route}</div>
                <div className="text-slate-500 text-xs">By {r.author}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Newsletter CTA */}
      <div className="mt-16 bg-gradient-to-r from-blue-900 to-slate-800 rounded-2xl p-8 text-center border border-blue-700">
        <h2 className="text-2xl font-bold mb-3">The Wing — Weekly Aviation Digest</h2>
        <p className="text-slate-300 mb-6">The best trip reports, fare alerts, and aviation news. Every Wednesday. Free.</p>
        <NewsletterForm className="max-w-md mx-auto" />
      </div>
    </div>
  )
}
