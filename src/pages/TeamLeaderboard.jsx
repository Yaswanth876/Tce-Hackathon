// src/pages/TeamLeaderboard.jsx
// ---------------------------------------------------------------
// Municipality Performance Leaderboard — /admin/teams-leaderboard
//
// Shows EVERY team that has been dispatched (even if they haven't
// cleared a complaint yet) by merging:
//   1. `teams` collection  — scored teams with points / ratings
//   2. `reports` where status in [dispatched, cleared] — all
//      assigned_to team names as stubs if not yet in teams
//
// Columns: Rank | Team Name | Assigned | Cleared | ⭐ Stars | Points
// ---------------------------------------------------------------

import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getComplaints } from '../api/complaintService'
import { useAuth } from '../context/AuthContext'

// ── Constants ─────────────────────────────────────────────────

const MEDALS = ['🥇', '🥈', '🥉']
const MEDAL_RING  = ['ring-amber-400', 'ring-slate-400', 'ring-amber-700']
const MEDAL_BG    = [
  'bg-gradient-to-br from-amber-50  to-amber-100  border-amber-300',
  'bg-gradient-to-br from-slate-50  to-slate-100  border-slate-300',
  'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300',
]
const MEDAL_LABEL = [
  'text-amber-700',
  'text-slate-600',
  'text-orange-700',
]

// ── Star display ──────────────────────────────────────────────

function StarDisplay({ rating, count }) {
  const r     = rating ?? 0
  const full  = Math.floor(r)
  const half  = r - full >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return (
    <div className="flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-px text-amber-400 leading-none text-base" aria-label={`${r} out of 5 stars`}>
        {'★'.repeat(full)}
        {half && <span className="opacity-60">★</span>}
        <span className="text-slate-300">{'★'.repeat(empty)}</span>
        <span className="ml-1.5 text-xs text-slate-600 font-bold">{r > 0 ? r.toFixed(1) : '—'}</span>
      </span>
      {(count ?? 0) > 0 && (
        <span className="text-[10px] text-slate-400 font-medium">{count} review{count !== 1 ? 's' : ''}</span>
      )}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Podium skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-40 rounded-2xl bg-slate-200" />
        ))}
      </div>
      {/* Table skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex gap-4 px-6 py-4 border-b border-slate-100">
            <div className="h-4 w-8  bg-slate-200 rounded" />
            <div className="h-4 w-40 bg-slate-200 rounded flex-1" />
            <div className="h-4 w-16 bg-slate-100 rounded" />
            <div className="h-4 w-16 bg-slate-100 rounded" />
            <div className="h-4 w-16 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Top-3 Podium card ─────────────────────────────────────────

function PodiumCard({ team, rank }) {
  const idx = rank - 1   // 0 | 1 | 2
  return (
    <div className={`relative rounded-2xl border-2 shadow-sm px-5 py-5 flex flex-col items-center gap-2 ${MEDAL_BG[idx]}`}>
      {/* Medal */}
      <span className="text-4xl leading-none">{MEDALS[idx]}</span>

      {/* Rank ring avatar */}
      <div className={`w-14 h-14 rounded-full bg-white ring-4 flex items-center justify-center shadow-sm ${MEDAL_RING[idx]}`}>
        <span className="text-xl font-black text-[#0a2240]">
          {team.team_name?.slice(0, 1).toUpperCase() ?? '?'}
        </span>
      </div>

      {/* Name */}
      <p className={`text-sm font-bold text-center leading-snug ${MEDAL_LABEL[idx]}`}>
        {team.team_name ?? '—'}
      </p>

      {/* Stars row */}
      <div className="flex items-center gap-1.5">
        <span className="text-amber-400 text-sm leading-none">
          {'★'.repeat(Math.round(team.average_rating ?? 0))}
          <span className="text-slate-300">{'★'.repeat(5 - Math.round(team.average_rating ?? 0))}</span>
        </span>
        <span className="text-[11px] text-slate-600 font-semibold">
          {(team.average_rating ?? 0) > 0 ? (team.average_rating).toFixed(1) : '—'}
        </span>
        {(team.rating_count ?? 0) > 0 && (
          <span className="text-[10px] text-slate-400">({team.rating_count} review{team.rating_count !== 1 ? 's' : ''})</span>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 w-full mt-1 text-center">
        <div>
          <p className="text-lg font-extrabold text-[#0a2240] leading-none">{team.total_points ?? 0}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Points</p>
        </div>
        <div>
          <p className="text-lg font-extrabold text-amber-500 leading-none">
            {(team.average_rating ?? 0) > 0 ? (team.average_rating).toFixed(1) : '—'}
          </p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Avg Rating</p>
        </div>
      </div>
    </div>
  )
}

// ── Table row ─────────────────────────────────────────────────

function TableRow({ team, rank, isTop3 }) {
  const hasRating = (team.average_rating ?? 0) > 0
  return (
    <tr className={`border-b border-slate-100 transition-colors hover:bg-slate-50 ${isTop3 ? 'bg-blue-50/30' : ''}`}>
      {/* Rank */}
      <td className="px-4 py-3 text-center">
        {rank <= 3 ? (
          <span className="text-base leading-none">{MEDALS[rank - 1]}</span>
        ) : (
          <span className="text-sm font-bold text-slate-500">#{rank}</span>
        )}
      </td>
      {/* Team name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#0a2240] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {team.team_name?.slice(0, 1).toUpperCase() ?? '?'}
            </span>
          </div>
          <span className="text-sm font-semibold text-[#0a2240]">{team.team_name ?? '—'}</span>
        </div>
      </td>
      {/* Rating + review count */}
      <td className="px-4 py-3">
        {hasRating ? (
          <StarDisplay rating={team.average_rating} count={team.rating_count ?? 0} />
        ) : (
          <span className="text-xs text-slate-400 italic">No reviews yet</span>
        )}
      </td>
      {/* Points */}
      <td className="px-4 py-3 text-center">
        <span className={`inline-block rounded-lg text-xs font-extrabold px-3 py-1 tracking-wide
          ${(team.total_points ?? 0) > 0 ? 'bg-[#0a2240] text-white' : 'bg-slate-100 text-slate-400'}`}>
          {(team.total_points ?? 0).toLocaleString('en-IN')}
        </span>
      </td>
    </tr>
  )
}

// ── Sort button helper ────────────────────────────────────────

function SortBtn({ field, current, onSort, children }) {
  const active = current === field
  return (
    <button
      onClick={() => onSort(field)}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
        active
          ? 'bg-[#0a2240] text-white shadow'
          : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
      }`}
    >
      {children}
      {active && <span className="ml-1 opacity-70">↓</span>}
    </button>
  )
}

// ── Empty state ───────────────────────────────────────────────

function EmptyState({ search }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <span className="text-5xl mb-4">🏆</span>
      <h3 className="text-base font-bold text-[#0a2240] mb-1">
        {search ? 'No teams match your search' : 'No teams dispatched yet'}
      </h3>
      <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
        {search
          ? 'Try a different search term.'
          : 'Teams appear here once complaints are assigned to a dispatch team.'}
      </p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────

export default function TeamLeaderboard() {
  const { userDoc } = useAuth()
  const navigate    = useNavigate()

  const [teams,   setTeams]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [sortBy,  setSortBy]  = useState('total_points')

  // Compute team scores from complaint data (frontend-only mode).
  // Firebase listeners were removed along with backend code.
  useEffect(() => {
    function mkTeam(name) {
      return { id: name, team_name: name, dispatched_count: 0, total_cleared: 0,
               total_points: 0, rating_sum: 0, rating_count: 0, average_rating: 0 }
    }

    let alive = true
    ;(async () => {
      try {
        const complaints = await getComplaints()
        if (!alive) return

        const teamMap = new Map()

        // Base points: +20 per cleared complaint; include dispatched teams.
        complaints.forEach((r) => {
          const name = r.assigned_to
          if (!name) return
          if (!teamMap.has(name)) teamMap.set(name, mkTeam(name))
          const t = teamMap.get(name)

          const status = String(r.status ?? '').toLowerCase()
          if (status === 'dispatched' || status === 'cleared') {
            t.dispatched_count += 1
          }
          if (status === 'cleared' || status === 'resolved') {
            t.total_cleared += 1
            t.total_points += 20
          }
        })

        setTeams(Array.from(teamMap.values()))
      } catch (err) {
        console.error('[Leaderboard] failed to load teams:', err)
        if (alive) setTeams([])
      } finally {
        if (alive) setLoading(false)
      }
    })()

    return () => { alive = false }
  }, [])

  // Client-side filter + sort
  const displayed = useMemo(() => {
    let list = search.trim()
      ? teams.filter(t => t.team_name?.toLowerCase().includes(search.toLowerCase()))
      : [...teams]

    if (sortBy === 'total_points')      list.sort((a, b) => (b.total_points      ?? 0) - (a.total_points      ?? 0))
    else if (sortBy === 'average_rating')   list.sort((a, b) => (b.average_rating    ?? 0) - (a.average_rating    ?? 0))
    else if (sortBy === 'total_cleared')    list.sort((a, b) => (b.total_cleared     ?? 0) - (a.total_cleared     ?? 0))
    else if (sortBy === 'dispatched_count') list.sort((a, b) => (b.dispatched_count  ?? 0) - (a.dispatched_count  ?? 0))
    return list
  }, [teams, search, sortBy])

  // Top 3 from full points-sorted list
  const top3 = useMemo(
    () => [...teams].sort((a, b) => (b.total_points ?? 0) - (a.total_points ?? 0)).slice(0, 3),
    [teams],
  )

  const roleBadge = userDoc?.role === 'municipality'
    ? { label: 'Municipality Officer', color: 'bg-blue-500/20 text-blue-200 ring-blue-400/30' }
    : { label: 'Admin', color: 'bg-[#FF9933]/20 text-[#FF9933] ring-[#FF9933]/30' }

  const totalCleared = teams.reduce((s, t) => s + (t.total_cleared ?? 0), 0)
  const totalPoints  = teams.reduce((s, t) => s + (t.total_points  ?? 0), 0)
  const totalReviews = teams.reduce((s, t) => s + (t.rating_count  ?? 0), 0)

  return (
    <div className="min-h-screen bg-[#f0f4f8]">

      {/* ── Header ── */}
      <header className="bg-[#0a2240] text-white shadow-md sticky top-0 z-30">
        <div className="flex h-1">
          <div className="flex-1" style={{ background: '#FF9933' }} />
          <div className="flex-1 bg-white" />
          <div className="flex-1" style={{ background: '#138808' }} />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 ring-1 ring-white/20 transition-colors"
            >
              ← Back
            </button>
            <div>
              <p className="text-xs opacity-60 uppercase tracking-wider font-medium">Aqro · Municipality</p>
              <h1 className="text-sm sm:text-base font-bold leading-tight">Municipality Performance Leaderboard</h1>
            </div>
          </div>
          <span className={`rounded-full text-xs font-bold px-2.5 py-0.5 ring-1 whitespace-nowrap ${roleBadge.color}`}>
            {roleBadge.label}
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {loading ? (
          <Skeleton />
        ) : (
          <>
            {/* ── Summary stats ── */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-4 py-4">
                <p className="text-2xl font-extrabold text-[#0a2240]">{teams.length}</p>
                <p className="text-xs text-slate-500 mt-0.5">Teams Dispatched</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-4 py-4">
                <p className="text-2xl font-extrabold text-green-600">{totalCleared.toLocaleString('en-IN')}</p>
                <p className="text-xs text-slate-500 mt-0.5">Total Cleared</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-4 py-4">
                <p className="text-2xl font-extrabold text-amber-500">{totalReviews.toLocaleString('en-IN')}</p>
                <p className="text-xs text-slate-500 mt-0.5">⭐ Reviews Received</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-4 py-4">
                <p className="text-2xl font-extrabold text-[#104080]">{totalPoints.toLocaleString('en-IN')}</p>
                <p className="text-xs text-slate-500 mt-0.5">Total Points Awarded</p>
              </div>
            </section>

            {/* ── Top 3 Podium ── */}
            {top3.length > 0 && top3.some(t => (t.total_points ?? 0) > 0) && (
              <section>
                <h2 className="text-sm font-bold text-[#0a2240] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>🏆</span> Top Performers
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Render 2nd first on mobile for visual podium effect on sm+ */}
                  {[top3[1], top3[0], top3[2]].map((team, i) => {
                    if (!team) return null
                    // Map visual slot back to real rank
                    const realRank = i === 0 ? 2 : i === 1 ? 1 : 3
                    return (
                      <div key={team.id} className={i === 1 ? 'sm:-mt-4' : ''}>
                        <PodiumCard team={team} rank={realRank} />
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ── Search + Sort toolbar ── */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs font-semibold text-slate-500 self-center mr-1">Sort:</span>
                <SortBtn field="total_points"    current={sortBy} onSort={setSortBy}>Points</SortBtn>
                <SortBtn field="average_rating"  current={sortBy} onSort={setSortBy}>Rating</SortBtn>
              </div>
              <div className="flex-1" />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search team name…"
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm w-full sm:w-56
                           focus:outline-none focus:ring-2 focus:ring-[#104080] placeholder:text-slate-400 transition"
              />
            </div>

            {/* ── Table ── */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

              {/* Point system legend */}
              <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                <span className="font-semibold text-[#0a2240]">Point System:</span>
                <span>✅ +20 pts per complaint cleared</span>
                <span>⭐ +rating × 5 pts per citizen review</span>
                <span>🔁 −20 pts if rating &lt; 3 (reopened)</span>
              </div>

              {displayed.length === 0 ? (
                <EmptyState search={search} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[540px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-14">Rank</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Team Name</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">⭐ Rating</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayed.map((team, idx) => (
                        <TableRow
                          key={team.id}
                          team={team}
                          rank={idx + 1}
                          isTop3={idx < 3 && !search}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Footer note */}
              {displayed.length > 0 && (
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400 text-right">
                  Showing {displayed.length} of {teams.length} team{teams.length !== 1 ? 's' : ''} · Live updates enabled
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
