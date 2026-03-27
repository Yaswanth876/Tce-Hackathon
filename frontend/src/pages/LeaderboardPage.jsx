// src/pages/LeaderboardPage.jsx
import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, onSnapshot, where, db } from '../localDb'

import { createUserIdentifier } from '../utils/userManager'
import {
  HiTrophy, HiStar, HiInformationCircle, HiUserGroup,
} from 'react-icons/hi2'

// ── Rank badge ────────────────────────────────────────────────
function RankBadge({ rank }) {
  const medals = {
    1: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
    2: { bg: '#F3F4F6', border: '#9CA3AF', text: '#374151' },
    3: { bg: '#FEE2E2', border: '#CD7F32', text: '#9A3412' },
  }
  const m = medals[rank]
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 flex-shrink-0"
      style={m
        ? { backgroundColor: m.bg, borderColor: m.border, color: m.text }
        : { backgroundColor: 'var(--color-gov-50)', borderColor: 'var(--color-border)', color: 'var(--color-gov-700)' }}
    >
      {rank}
    </div>
  )
}

// ── Table row ─────────────────────────────────────────────────
function LeaderboardRow({ rank, user, isCurrentUser }) {
  return (
    <tr className={`border-b border-[var(--color-border)] transition-colors ${isCurrentUser ? 'bg-[var(--color-gov-50)]' : 'hover:bg-[var(--color-surface)]'}`}>
      <td className="px-4 py-3">
        <div className="flex justify-center">
          <RankBadge rank={rank} />
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="font-semibold text-[var(--color-text)] text-sm">
          {user.name}
        </span>
        {isCurrentUser && (
          <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide bg-[var(--color-gov-100)] text-[var(--color-gov-700)] px-2 py-0.5 rounded-full">
            You
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-center text-sm text-[var(--color-muted)]">
        {user.total_complaints || 0}
      </td>
      <td className="px-4 py-3 text-center">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--color-gov-700)] text-white rounded-full text-xs font-bold">
          <HiStar className="w-3.5 h-3.5" />
          {user.tokens || 0}
        </span>
      </td>
    </tr>
  )
}

// ── Your rank card ────────────────────────────────────────────
function YourRankCard({ rank, tokens, complaints }) {
  return (
    <div className="gov-card bg-[var(--color-gov-50)] p-5 mb-6 flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-soft)] mb-1">Your Rank</p>
        <p className="text-4xl font-extrabold text-[var(--color-text)]">#{rank}</p>
      </div>
      <div className="flex gap-6 text-right">
        <div>
          <p className="text-2xl font-extrabold text-[var(--color-text)]">{tokens}</p>
          <p className="text-xs text-[var(--color-muted)]">tokens</p>
        </div>
        <div>
          <p className="text-2xl font-extrabold text-[var(--color-text)]">{complaints}</p>
          <p className="text-xs text-[var(--color-muted)]">reports</p>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────
export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUserData, setCurrentUserData] = useState(null)
  const [currentUserRank, setCurrentUserRank] = useState(null)

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'citizen'),
      orderBy('tokens', 'desc'),
      limit(20)
    )

    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setLeaderboard(users)
      setLoading(false)

      const phone = sessionStorage.getItem('userPhone')
      const email = sessionStorage.getItem('userEmail')
      if (phone || email) {
        try {
          const uid = createUserIdentifier({ phone, email })
          const idx = users.findIndex((u) => u.id === uid)
          if (idx !== -1) {
            setCurrentUserData(users[idx])
            setCurrentUserRank(idx + 1)
          }
        } catch (_) {}
      }
    })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[var(--color-gov-700)] border-t-transparent mb-3" />
          <p className="text-sm text-[var(--color-muted)]">Loading leaderboard&hellip;</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <HiTrophy className="w-6 h-6 text-[var(--color-gov-700)]" />
            <h1 className="text-2xl font-extrabold text-[var(--color-text)]">Leaderboard</h1>
          </div>
          <p className="text-sm text-[var(--color-muted)]">
            Top civic contributors ranked by participation tokens &mdash; Madurai Clean City Initiative.
          </p>
        </div>

        {/* Your rank (if logged in) */}
        {currentUserData && currentUserRank && (
          <YourRankCard
            rank={currentUserRank}
            tokens={currentUserData.tokens || 0}
            complaints={currentUserData.total_complaints || 0}
          />
        )}

        {/* Info bar */}
        <div className="flex items-start gap-2 px-4 py-3 bg-[var(--color-gov-50)] border border-[var(--color-gov-100)] border-l-4 border-l-[var(--color-gov-700)] mb-6 text-xs text-[var(--color-text-soft)]">  
          <HiInformationCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Each verified complaint earns 1 token. Rankings update in real-time. Officer accounts are excluded.</span>
        </div>

        {/* Table */}
        <div className="gov-card overflow-hidden">
          {leaderboard.length === 0 ? (
            <div className="py-16 text-center">
              <HiUserGroup className="w-12 h-12 text-[var(--color-border)] mx-auto mb-3" />
              <p className="text-sm text-[var(--color-muted)]">No participants yet. Be the first to report and earn tokens!</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-[var(--color-gov-700)] text-white text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-center w-16">Rank</th>
                  <th className="px-4 py-3 text-left">Citizen</th>
                  <th className="px-4 py-3 text-center">Reports</th>
                  <th className="px-4 py-3 text-center">Tokens</th>
                </tr>
              </thead>
              <tbody className="bg-[var(--color-card)]">
                {leaderboard.map((user, i) => (
                  <LeaderboardRow
                    key={user.id}
                    rank={i + 1}
                    user={user}
                    isCurrentUser={currentUserData?.id === user.id}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  )
}

