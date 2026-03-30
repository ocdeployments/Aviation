import { motion } from 'framer-motion'
import { useState } from 'react'

export default function Landing() {
  const [hovered, setHovered] = useState<'nerd' | 'hunter' | null>(null)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{
      background: 'radial-gradient(ellipse at 50% 0%, #0f1a2e 0%, #080c14 60%, #050810 100%)',
    }}>
      {/* ── Logo / Title ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <div className="text-5xl mb-2">✈️</div>
        <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
          AviationHub
        </h1>
        <p className="text-slate-400 text-sm">
          Live flight data · 58,000 airports · Community insights
        </p>
      </motion.div>

      {/* ── Chooser ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-center"
      >
        <p className="text-slate-400 text-sm mb-6 uppercase tracking-widest font-semibold">
          Choose your experience
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">

          {/* ── Data Nerd ──────────────────────────────────── */}
          <motion.a
            href="#/flights"
            onMouseEnter={() => setHovered('nerd')}
            onMouseLeave={() => setHovered(null)}
            className="group relative w-72 p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer"
            style={{
              background: hovered === 'nerd'
                ? 'rgba(59, 130, 246, 0.12)'
                : 'rgba(15, 26, 46, 0.8)',
              borderColor: hovered === 'nerd' ? '#3b82f6' : 'rgba(59, 130, 246, 0.25)',
              boxShadow: hovered === 'nerd'
                ? '0 0 30px rgba(59, 130, 246, 0.2), 0 0 60px rgba(59, 130, 246, 0.1)'
                : 'none',
            }}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-4xl mb-4">🛫</div>
            <h2 className="text-xl font-bold text-white mb-1">Data Nerd Mode</h2>
            <p className="text-slate-400 text-sm mb-4">Live flights, airports, incidents, 3D globe — real data, no fluff</p>
            <div className="flex flex-wrap gap-2">
              {['🌍 Live Flights', '🛬 58K Airports', '⚠️ Incidents', '3D Globe'].map(tag => (
                <span key={tag} className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-full">{tag}</span>
              ))}
            </div>
            <div className="mt-4 text-blue-400 text-sm font-medium group-hover:text-blue-300 transition">
              Enter →
            </div>
          </motion.a>

          {/* ── Hunter Mode ─────────────────────────────────── */}
          <motion.a
            href="#/community"
            onMouseEnter={() => setHovered('hunter')}
            onMouseLeave={() => setHovered(null)}
            className="group relative w-72 p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer"
            style={{
              background: hovered === 'hunter'
                ? 'rgba(16, 185, 129, 0.12)'
                : 'rgba(15, 26, 46, 0.8)',
              borderColor: hovered === 'hunter' ? '#10b981' : 'rgba(16, 185, 129, 0.25)',
              boxShadow: hovered === 'hunter'
                ? '0 0 30px rgba(16, 185, 129, 0.2), 0 0 60px rgba(16, 185, 129, 0.1)'
                : 'none',
            }}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-4xl mb-4">🎯</div>
            <h2 className="text-xl font-bold text-white mb-1">Hunter Mode</h2>
            <p className="text-slate-400 text-sm mb-4">Trip reports, deal alerts, flight challenges — find your next adventure</p>
            <div className="flex flex-wrap gap-2">
              {['💰 Deal Alerts', '📝 Trip Reports', '🏆 Challenges', '🎮 Gamified'].map(tag => (
                <span key={tag} className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-full">{tag}</span>
              ))}
            </div>
            <div className="mt-4 text-emerald-400 text-sm font-medium group-hover:text-emerald-300 transition">
              Enter →
            </div>
          </motion.a>

        </div>
      </motion.div>

      {/* ── Stats bar ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-16 flex gap-8 text-center"
      >
        {[
          { value: '25,000+', label: 'Live flights tracked' },
          { value: '58,000', label: 'Airports worldwide' },
          { value: '35', label: 'Recent incidents' },
        ].map(stat => (
          <div key={stat.label}>
            <div className="text-2xl font-bold text-white font-mono">{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </div>
        ))}
      </motion.div>

      {/* ── Footer ────────────────────────────────────────── */}
      <div className="mt-16 text-slate-600 text-xs">
        Powered by OpenSky Network · Supabase · Open-Meteo
      </div>
    </div>
  )
}
