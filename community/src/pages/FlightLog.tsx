import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { FlightLog } from '../types'

export default function FlightLog() {
  const [log, setLog] = useState<FlightLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ flight_number: '', origin: '', destination: '', airline: '', aircraft: '', cabin: '', distance_km: '' })

  const addFlight = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('flight_log_entries').insert({
      log_id: log?.id,
      flight_number: form.flight_number,
      origin: form.origin,
      destination: form.destination,
      airline: form.airline,
      aircraft: form.aircraft,
      cabin: form.cabin,
      distance_km: Number(form.distance_km) || null,
    })
    if (!error) {
      setForm({ flight_number: '', origin: '', destination: '', airline: '', aircraft: '', cabin: '', distance_km: '' })
      setShowForm(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Flight Log</h1>
          <p className="text-slate-400 mt-1">Track every flight you've taken. Build your aviation resume.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition">
          + Log Flight
        </button>
      </div>

      {showForm && (
        <form onSubmit={addFlight} className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-8">
          <h3 className="font-bold mb-4">Log a New Flight</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <input value={form.flight_number} onChange={e => setForm({...form, flight_number: e.target.value})} placeholder="Flight # (e.g. UA123)" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
            <input value={form.origin} onChange={e => setForm({...form, origin: e.target.value.toUpperCase().slice(0,3)})} placeholder="From (e.g. SFO)" maxLength={3} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono" />
            <input value={form.destination} onChange={e => setForm({...form, destination: e.target.value.toUpperCase().slice(0,3)})} placeholder="To (e.g. JFK)" maxLength={3} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono" />
            <input value={form.airline} onChange={e => setForm({...form, airline: e.target.value})} placeholder="Airline" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
            <input value={form.aircraft} onChange={e => setForm({...form, aircraft: e.target.value})} placeholder="Aircraft (e.g. B-777)" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
            <input value={form.distance_km} onChange={e => setForm({...form, distance_km: e.target.value})} placeholder="Distance (km)" type="number" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition">Save Flight</button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-medium transition">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
        <div className="text-4xl mb-2">✈️</div>
        <h3 className="text-xl font-bold mb-2">Start Your Log</h3>
        <p className="text-slate-400 mb-4">Log in to track your flights and compete with other travelers on routes flown.</p>
        <p className="text-slate-500 text-sm">Sign-up coming soon. For now, click "Log Flight" above to add entries.</p>
      </div>

      <div className="mt-8 text-center text-slate-500 text-sm">
        <p>Flight log stores {log?.total_flights || 0} flights · {log?.total_distance_km?.toLocaleString() || 0} km flown</p>
      </div>
    </div>
  )
}
