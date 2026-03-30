import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

// ─── Supabase (anon key for public reads) ────────────────────────────────────
const SUPABASE_URL = 'https://stxanozxvkerwfvbruzr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0eGFub3p4dmtlcndmdmJydXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4ODQzMzMsImV4cCI6MjA5MDQ2MDMzM30.Re9XtQo5SoeqJIOxjXiomDsXXLR19qGQmiXYUAH3PBc'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─── Formspree endpoint (same pattern as newsletter — replace with real form ID) ──
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Incident {
  id: string
  type: string
  date: string
  flight: string
  airline: string
  aircraft: string
  route: string
  summary: string
  severity: string
  source: string
  created_at: string
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error'

interface FormState {
  date: string
  airline: string
  flight: string
  aircraft: string
  route: string
  incidentType: string
  description: string
  name: string
  email: string
}

// ─── Severity badge color ─────────────────────────────────────────────────────
function severityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'fatal':       return 'bg-red-900 text-red-300 border-red-700'
    case 'serious':      return 'bg-orange-900 text-orange-300 border-orange-700'
    case 'minor':        return 'bg-yellow-900 text-yellow-300 border-yellow-700'
    case 'none':
    default:             return 'bg-slate-800 text-slate-300 border-slate-700'
  }
}

// ─── Incident type options ────────────────────────────────────────────────────
const INCIDENT_TYPES = [
  { value: 'engine_failure',    label: 'Engine Failure' },
  { value: 'bird_strike',       label: 'Bird Strike' },
  { value: 'turbulence_injury', label: 'Turbulence / Injury' },
  { value: 'system_malfunction',label: 'System Malfunction' },
  { value: 'emergency_landing', label: 'Emergency Landing' },
  { value: 'other',             label: 'Other' },
]

// ─── Main component ────────────────────────────────────────────────────────────
export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading]     = useState(true)
  const [fetchError, setFetchError] = useState('')

  const [form, setForm] = useState<FormState>({
    date: '', airline: '', flight: '', aircraft: '', route: '',
    incidentType: '', description: '', name: '', email: '',
  })
  const [formStatus, setFormStatus] = useState<FormStatus>('idle')

  // ─── Fetch published/pending incidents ──────────────────────────────────
  const fetchIncidents = useCallback(async () => {
    setLoading(true)
    setFetchError('')
    const { data, error } = await supabase
      .from('incidents')
      .select('id, type, date, flight, airline, aircraft, route, summary, severity, source, created_at')
      .in('status', ['pending', 'published'])
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      if (error.code === 'PGRST204' || String(error.message).includes('does not exist')) {
        setFetchError('incidents')
      } else {
        setFetchError(error.message)
      }
    } else {
      setIncidents(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchIncidents() }, [fetchIncidents])

  // ─── Form handlers ───────────────────────────────────────────────────────
  const update = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.date || !form.airline || !form.route || !form.incidentType || !form.description || !form.name || !form.email) {
      setFormStatus('error')
      return
    }

    setFormStatus('loading')

    const incidentTypeLabel =
      INCIDENT_TYPES.find(t => t.value === form.incidentType)?.label ?? form.incidentType

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          incident_type: incidentTypeLabel,
          date: form.date,
          airline: form.airline,
          flight_number: form.flight,
          aircraft_type: form.aircraft,
          route: form.route,
          description: form.description,
          reporter_name: form.name,
          reporter_email: form.email,
        }),
      })

      if (res.ok) {
        setFormStatus('success')
        setForm({ date: '', airline: '', flight: '', aircraft: '', route: '', incidentType: '', description: '', name: '', email: '' })
      } else {
        setFormStatus('error')
      }
    } catch {
      setFormStatus('error')
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="text-4xl mb-2">⚠️</div>
        <h1 className="text-4xl font-bold text-white mb-2">Report an Incident</h1>
        <p className="text-slate-400 text-lg max-w-2xl">
          Spotted an engine failure, bird strike, turbulence injury, or safety concern?
          Submit it here. Reports are reviewed by moderators before publishing.
          Your contact info is never displayed.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* ── Submission Form (3/5 width) ──────────────────────────────── */}
        <div className="lg:col-span-3">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Submit a Report</h2>

            {formStatus === 'success' ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-white mb-2">Report Submitted!</h3>
                <p className="text-slate-400 mb-6">
                  Thank you. Your report has been received and will be reviewed by our moderation team within 24–48 hours.
                </p>
                <button
                  onClick={() => setFormStatus('idle')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
                >
                  Submit Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Date of Incident <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={update('date')}
                    required
                    max={new Date().toISOString().slice(0, 10)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                {/* Airline + Flight */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Airline / Operator <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.airline}
                      onChange={update('airline')}
                      placeholder="e.g. American Airlines"
                      required
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Flight Number <span className="text-slate-500">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.flight}
                      onChange={update('flight')}
                      placeholder="e.g. AA 1234"
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                {/* Aircraft + Route */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Aircraft Type <span className="text-slate-500">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.aircraft}
                      onChange={update('aircraft')}
                      placeholder="e.g. B-737-800, A-320"
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Route <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.route}
                      onChange={update('route')}
                      placeholder="e.g. LAX → SFO"
                      required
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                {/* Incident Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Incident Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.incidentType}
                    onChange={update('incidentType')}
                    required
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition appearance-none cursor-pointer"
                  >
                    <option value="">Select incident type…</option>
                    {INCIDENT_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Brief Description <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={update('description')}
                    placeholder="What happened? Include phase of flight, altitude, any damage or injuries, and what the crew did."
                    required
                    rows={4}
                    maxLength={1000}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition resize-none"
                  />
                  <p className="text-slate-500 text-xs mt-1 text-right">{form.description.length}/1000</p>
                </div>

                {/* Name + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Your Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={update('name')}
                      placeholder="Your name"
                      required
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={update('email')}
                      placeholder="your@email.com"
                      required
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <p className="text-slate-500 text-xs">
                  🔒 Your name and email are used for moderation follow-up only and are never displayed publicly.
                </p>

                {formStatus === 'error' && (
                  <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-4 py-2">
                    Something went wrong. Please check your inputs and try again.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={formStatus === 'loading'}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-900 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition"
                >
                  {formStatus === 'loading' ? 'Submitting…' : 'Submit Incident Report'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── Recent Reports sidebar (2/5 width) ────────────────────────── */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-white mb-4">Recent Reports</h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 p-4 animate-pulse">
                  <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-slate-700 rounded w-1/2 mb-1" />
                  <div className="h-3 bg-slate-700 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : fetchError === 'incidents' ? (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 text-center">
              <div className="text-3xl mb-3">📊</div>
              <p className="text-slate-400 text-sm mb-3">
                Incident database is being set up.
              </p>
              <p className="text-slate-500 text-xs">
                Run the NTSB seeding script to populate initial data.
              </p>
            </div>
          ) : fetchError ? (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 text-red-400 text-sm">
              Could not load incidents: {fetchError}
            </div>
          ) : incidents.length === 0 ? (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 text-center">
              <div className="text-3xl mb-3">🛫</div>
              <p className="text-slate-400 text-sm">No incidents reported yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incidents.map(inc => (
                <div key={inc.id} className="bg-slate-800 rounded-xl border border-slate-700 p-4 hover:border-slate-600 transition">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-sm font-semibold text-white">{inc.type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${severityColor(inc.severity)}`}>
                      {inc.severity}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mb-1">
                    {inc.date}
                    {inc.airline  ? ` · ${inc.airline}`  : ''}
                    {inc.route     ? ` · ${inc.route}`   : ''}
                  </div>
                  {inc.summary && (
                    <p className="text-xs text-slate-400 line-clamp-3">{inc.summary}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
