import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const CABINS = ['Economy', 'Premium Economy', 'Business', 'First']

export default function Submit() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', airline: '', route: '', origin: '', destination: '',
    cabin: 'Economy', rating: '4', content: '', author: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.airline || !form.route || !form.content || !form.author) {
      setError('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    setError('')

    // Generate slug from title
    const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const { error: err } = await supabase.from('trip_reports').insert({
      title: form.title,
      slug,
      airline: form.airline,
      route: `${form.origin}-${form.destination}`,
      origin: form.origin,
      destination: form.destination,
      cabin: form.cabin,
      rating: Number(form.rating),
      content: form.content,
      author: form.author,
      status: 'published',
    })

    if (err) {
      setError(err.message)
      setSubmitting(false)
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/reports'), 2000)
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold text-white mb-3">Report Submitted!</h1>
        <p className="text-slate-400 mb-6">Thank you for sharing your flight experience. Redirecting...</p>
        <Link to="/reports" className="text-blue-400 hover:underline">View all reports</Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Share Your Trip Report</h1>
      <p className="text-slate-400 mb-8">Real flights, honest reviews. Help other travelers make better decisions.</p>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 mb-6 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Report Title *</label>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Emirates A380 Dubai to London First Class" className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Airline *</label>
            <input value={form.airline} onChange={e => setForm({ ...form, airline: e.target.value })} placeholder="e.g. Qatar Airways" className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Route *</label>
            <input value={form.route} onChange={e => setForm({ ...form, route: e.target.value })} placeholder="e.g. DOH-JFK" className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Origin (IATA)</label>
            <input value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value.toUpperCase().slice(0,3) })} placeholder="e.g. DOH" maxLength={3} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Destination (IATA)</label>
            <input value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value.toUpperCase().slice(0,3) })} placeholder="e.g. JFK" maxLength={3} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Cabin</label>
            <select value={form.cabin} onChange={e => setForm({ ...form, cabin: e.target.value })} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500">
              {CABINS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Your Rating</label>
          <div className="flex gap-2">
            {[1,2,3,4,5].map(n => (
              <button key={n} type="button" onClick={() => setForm({ ...form, rating: String(n) })}
                className={`text-3xl transition ${n <= Number(form.rating) ? 'text-yellow-400' : 'text-slate-600 hover:text-yellow-300'}`}>
                &#9733;
              </button>
            ))}
            <span className="text-slate-400 text-sm py-2">{form.rating}/5</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Your Experience * (min 100 characters)</label>
          <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={8}
            placeholder="Share the details that matter: seat comfort, food quality, crew service, amenities, and anything that surprised you (good or bad)..."
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none leading-relaxed" />
          <div className="text-xs text-slate-500 mt-1 text-right">{form.content.length} chars</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Your Name *</label>
          <input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="e.g. Sarah K." className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
        </div>

        <button type="submit" disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-400 text-white py-3 rounded-xl font-semibold transition">
          {submitting ? 'Submitting...' : 'Publish Trip Report'}
        </button>
      </form>
    </div>
  )
}
