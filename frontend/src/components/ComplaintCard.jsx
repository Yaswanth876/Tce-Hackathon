// src/components/ComplaintCard.jsx
// ---------------------------------------------------------------
// Displays a single complaint report.
// Props:
//   report   — Firestore document data
//   isAdmin  — shows extra controls (status dropdown, assign team)
//   onStatusChange(id, newStatus)   — callback for admins
//   onAssign(id, teamName)          — callback for admins
// ---------------------------------------------------------------

import { useState } from 'react'
import StatusBadge from './StatusBadge'
import { HiMapPin, HiCalendar, HiWrenchScrewdriver } from 'react-icons/hi2'

const STATUSES = ['pending', 'analyzing', 'dispatched', 'cleared']

function formatDate(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ComplaintCard({ report, isAdmin = false, onStatusChange, onAssign }) {
  const [assignInput, setAssignInput] = useState(report.assigned_to ?? '')
  const [assigning,   setAssigning]   = useState(false)
  const [statusBusy,  setStatusBusy]  = useState(false)

  async function handleStatusChange(e) {
    setStatusBusy(true)
    await onStatusChange?.(report.id, e.target.value)
    setStatusBusy(false)
  }

  async function handleAssign(e) {
    e.preventDefault()
    if (!assignInput.trim()) return
    setAssigning(true)
    await onAssign?.(report.id, assignInput.trim())
    setAssigning(false)
  }

  return (
    <article className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden
                        hover:shadow-md transition-shadow duration-200">

      {/* Thumbnail */}
      {report.image_url && (
        <div className="relative h-44 bg-slate-100">
          <img src={report.image_url} alt="Complaint site"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute top-2 right-2">
            <StatusBadge status={report.status} />
          </div>
        </div>
      )}

      <div className="p-4 space-y-3">

        {/* Status (no image case) */}
        {!report.image_url && (
          <div className="flex justify-between items-center">
            <StatusBadge status={report.status} />
          </div>
        )}

        {/* Metadata row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          {/* AI Analysis Results */}
          {report.ai_analysis && (
            <>
              {report.ai_analysis.waste_type && (
                <span className="flex items-center gap-1">
                  <span className="text-[#104080] font-medium">🤖 Type:</span>
                  <span className="capitalize">{report.ai_analysis.waste_type}</span>
                </span>
              )}
              {report.ai_analysis.severity_score != null && (
                <span className="flex items-center gap-1">
                  <span className="text-[#104080] font-medium">🔍 Score:</span>
                  <span>{report.ai_analysis.severity_score}/10</span>
                </span>
              )}
              {report.ai_analysis.urgency_level && (
                <span className="flex items-center gap-1">
                  <span className="text-[#104080] font-medium">⚡ Urgency:</span>
                  <span className={`capitalize px-2 py-0.5 rounded text-white text-xs font-semibold ${
                    report.ai_analysis.urgency_level === 'critical' ? 'bg-red-500' :
                    report.ai_analysis.urgency_level === 'high' ? 'bg-orange-500' :
                    report.ai_analysis.urgency_level === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}>
                    {report.ai_analysis.urgency_level}
                  </span>
                </span>
              )}
            </>
          )}
          {/* Fallback to old format */}
          {!report.ai_analysis && report.waste_type && (
            <span className="flex items-center gap-1">
              <span className="text-[#104080] font-medium">Type:</span>
              <span className="capitalize">{report.waste_type}</span>
            </span>
          )}
          {!report.ai_analysis && report.severity_score != null && (
            <span className="flex items-center gap-1">
              <span className="text-[#104080] font-medium">Severity:</span>
              <span>{report.severity_score}/10</span>
            </span>
          )}
          {report.location?.lat && (
            <span title={`${report.location.lat}, ${report.location.lng}`}
              className="flex items-center gap-1">
              <HiMapPin className="w-3.5 h-3.5 text-[#104080]" aria-hidden="true" />
              <span>{Number(report.location.lat).toFixed(4)}, {Number(report.location.lng).toFixed(4)}</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <HiCalendar className="w-3.5 h-3.5 text-[#104080]" aria-hidden="true" />
            <span>{formatDate(report.created_at ?? report.createdAt ?? report.timestamp)}</span>
          </span>
          {report.assigned_to && (
            <span className="flex items-center gap-1">
              <HiWrenchScrewdriver className="w-3.5 h-3.5 text-[#104080]" aria-hidden="true" />
              <span>{report.assigned_to}</span>
            </span>
          )}
        </div>

        {/* Admin controls */}
        {isAdmin && (
          <div className="pt-2 border-t border-slate-100 space-y-3">

            {/* Status selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-[#104080] whitespace-nowrap">
                Update Status
              </label>
              <select
                defaultValue={report.status}
                onChange={handleStatusChange}
                disabled={statusBusy}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs
                           focus:outline-none focus:ring-2 focus:ring-[#104080] disabled:opacity-50 transition"
              >
                {STATUSES.map(s => (
                  <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              {statusBusy && (
                <svg className="animate-spin h-3.5 w-3.5 text-[#104080] flex-shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
            </div>

            {/* Assign team */}
            <form onSubmit={handleAssign} className="flex gap-2">
              <input
                type="text" value={assignInput} onChange={e => setAssignInput(e.target.value)}
                placeholder="Assign team / officer"
                className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs
                           focus:outline-none focus:ring-2 focus:ring-[#104080] placeholder:text-slate-400 transition"
              />
              <button type="submit" disabled={assigning || !assignInput.trim()}
                className="rounded-lg bg-[#104080] hover:bg-[#0d3060] text-white text-xs font-semibold
                           px-3 py-1.5 disabled:opacity-50 transition-colors flex items-center gap-1">
                {assigning ? (
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : 'Assign'}
              </button>
            </form>
          </div>
        )}
      </div>
    </article>
  )
}
