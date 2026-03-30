import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route, Link } from 'react-router-dom'
import './index.css'
import Home from './pages/Home'
import Reports from './pages/Reports'
import ReportDetail from './pages/ReportDetail'
import Submit from './pages/Submit'
import FlightLog from './pages/FlightLog'
import Newsletter from './pages/Newsletter'

function Nav() {
  return (
    <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold text-blue-400">✈️ AviationHub</Link>
        <div className="flex gap-4 text-sm">
          <Link to="/reports" className="text-slate-300 hover:text-white transition">Trip Reports</Link>
          <Link to="/flight-log" className="text-slate-300 hover:text-white transition">Flight Log</Link>
          <Link to="/newsletter" className="text-slate-300 hover:text-white transition">Newsletter</Link>
          <Link to="/submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-medium transition">Submit Report</Link>
        </div>
      </div>
    </nav>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <div className="min-h-screen bg-slate-900 text-white">
        <Nav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/:slug" element={<ReportDetail />} />
          <Route path="/submit" element={<Submit />} />
          <Route path="/flight-log" element={<FlightLog />} />
          <Route path="/newsletter" element={<Newsletter />} />
        </Routes>
        <footer className="border-t border-slate-800 mt-16 py-8 text-center text-slate-500 text-sm">
          AviationHub Community · Powered by OpenSky Network · $0 hosting
        </footer>
      </div>
    </HashRouter>
  </React.StrictMode>
)
