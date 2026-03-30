import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
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
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <span key={n} className={`text-2xl ${n <= rating ? 'text-yellow-400' : 'text-slate-600'}`}>&#9733;</span>
      ))}
    </div>
  )
}

export default function ReportDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [report, setReport] = useState<TripReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) { setLoading(false); return }
    const col = isNaN(Number(slug)) ? 'slug' : 'id'
    const val = isNaN(Number(slug)) ? slug : Number(slug)
    supabase
      .from('trip_reports')
      .select('*')
      .eq(col, val)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true) }
        else {
          setReport(data as TripReport)
          // Increment view count (fire and forget)
          supabase.from('trip_reports').update({ views: (data as TripReport).views! + 1 }).eq('id', (data as TripReport).id).then(() => {})
        }
        setLoading(false)
      })
  }, [slug])

  if (loading) return <div className="text-center py-20 text-slate-400">Loading...</div>
  if (notFound || !report) return <div className="text-center py-20"><h2 className="text-2xl font-bold mb-3">Report not found</h2><Link to="/reports" className="text-blue-400 hover:underline">Back to reports</Link></div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/reports" className="text-slate-400 hover:text-white text-sm mb-6 inline-flex items-center gap-1">← Back to Reports</Link>
      
      <article>
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`text-sm font-medium px-3 py-1 rounded ${CABIN_COLORS[report.cabin] || 'bg-slate-700'}`}>{report.cabin}</span>
            <span className="text-slate-400">{report.airline}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-300 font-mono">{report.route}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{report.title}</h1>
          <div className="flex items-center gap-4 flex-wrap">
            <StarRating rating={report.rating} />
            <div className="text-slate-400 text-sm">By <span className="text-white">{report.author}</span></div>
            <div className="text-slate-500 text-sm">{new Date(report.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </header>

        {/* SEO Structured Data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Review',
            itemReviewed: { '@type': 'Product', name: `${report.airline} ${report.cabin}` },
            reviewRating: { '@type': 'Rating', ratingValue: report.rating },
            author: { '@type': 'Person', name: report.author },
            reviewBody: report.content,
          })
        }} />

        <div className="prose prose-invert prose-slate max-w-none">
          <div className="bg-slate-800 rounded-xl p-6 md:p-8 border border-slate-700 leading-relaxed text-slate-300">
            {report.content.split('\n').map((p, i) => <p key={i} className="mb-4">{p}</p>)}
          </div>
        </div>

        {/* Route info */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Airline', value: report.airline },
            { label: 'Route', value: report.route },
            { label: 'Cabin', value: report.cabin },
            { label: 'Rating', value: `${report.rating}/5 ⭐` },
          ].map(item => (
            <div key={item.label} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">{item.label}</div>
              <div className="font-semibold text-white">{item.value}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 bg-blue-900/30 border border-blue-700 rounded-xl p-6 text-center">
          <p className="text-slate-300 mb-4">Have you flown this route? Share your experience.</p>
          <Link to="/submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition inline-block">Write a Trip Report</Link>
        </div>
      </article>
    </div>
  )
}
