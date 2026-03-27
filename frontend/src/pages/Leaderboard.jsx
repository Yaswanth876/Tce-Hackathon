// src/pages/Leaderboard.jsx
// ---------------------------------------------------------------
// Civic Impact Leaderboard — /leaderboard
//
// Features:
//   • Real-time Firestore onSnapshot for live ranking
//   • Top-3 medal highlight cards (gold / silver / bronze)
//   • Full ranked table with current-user row highlight
//   • Loading skeleton  •  Empty state
//   • Government blue theme — Tailwind only
// ---------------------------------------------------------------

import { useEffect, useState } from 'react'
import {
  collection,
  query,
  where,
  limit,
  onSnapshot,
  db,
} from '../localDb'
// MIGRATED: Use MongoDB API
// import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import {
  HiTrophy, HiStar, HiSparkles, HiMapPin,
  HiCheckCircle, HiClipboardDocument, HiCamera, HiTruck,
} from 'react-icons/hi2'

// ── Skeleton rows ─────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3"><div className="h-4 w-6 bg-slate-200 rounded mx-auto" /></td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0" />
          <div className="h-4 w-32 bg-slate-200 rounded" />
        </div>
      </td>
      <td className="px-4 py-3"><div className="h-4 w-14 bg-slate-200 rounded mx-auto" /></td>
      <td className="px-4 py-3"><div className="h-4 w-10 bg-slate-200 rounded mx-auto" /></td>
    </tr>
  )
}

function SkeletonMedalCard() {
  return (
    <div className="animate-pulse rounded-2xl bg-slate-100 border border-slate-200 p-6 flex flex-col items-center gap-3 shadow-sm">
      <div className="w-14 h-14 rounded-full bg-slate-200" />
      <div className="h-4 w-24 bg-slate-200 rounded" />
      <div className="h-6 w-16 bg-slate-200 rounded" />
      <div className="h-3 w-20 bg-slate-200 rounded" />
    </div>
  )
}

// ── Avatar initial badge ──────────────────────────────────────
function Avatar({ name = '?', size = 'sm' }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')

  const sizeClass = size === 'lg'
    ? 'w-14 h-14 text-xl'
    : 'w-8 h-8 text-xs'

  return (
    <div
      className={`${sizeClass} rounded-full bg-[#104080] text-white font-bold
                  flex items-center justify-center flex-shrink-0 select-none`}
    >
      {initials || '?'}
    </div>
  )
}

// Medal config
const MEDALS = [
  {
    rank: 1,
    Icon: HiTrophy,
    iconColor: '#D97706',
    label: '1st Place',
    ring:  'ring-yellow-400',
    bg:    'bg-gradient-to-b from-yellow-50 to-amber-100',
    border:'border-yellow-300',
    text:  'text-yellow-900',
    sub:   'text-yellow-700',
    badge: 'bg-yellow-400 text-yellow-900',
    order: 'order-2 sm:order-1',
    scale: 'scale-100',
  },
  {
    rank: 2,
    Icon: HiTrophy,
    iconColor: '#9CA3AF',
    label: '2nd Place',
    ring:  'ring-slate-400',
    bg:    'bg-gradient-to-b from-slate-50 to-slate-200',
    border:'border-slate-300',
    text:  'text-slate-800',
    sub:   'text-slate-600',
    badge: 'bg-slate-400 text-white',
    order: 'order-1 sm:order-2',
    scale: 'scale-95',
  },
  {
    rank: 3,
    Icon: HiTrophy,
    iconColor: '#CD7F32',
    label: '3rd Place',
    ring:  'ring-orange-400',
    bg:    'bg-gradient-to-b from-orange-50 to-orange-100',
    border:'border-orange-300',
    text:  'text-orange-900',
    sub:   'text-orange-700',
    badge: 'bg-orange-400 text-white',
    order: 'order-3 sm:order-3',
    scale: 'scale-95',
  },
]

// Render top-3 in podium order: 2nd | 1st | 3rd
const PODIUM_ORDER = [1, 0, 2] // index into the top3 array

function MedalCard({ citizen, medal, isCurrentUser }) {
  if (!citizen) return null
  return (
    <div
      className={`relative rounded-2xl border shadow-md p-6 flex flex-col items-center gap-2
                  transition-transform hover:-translate-y-1 duration-200
                  ${medal.bg} ${medal.border} ${medal.scale} ${medal.order}
                  ${isCurrentUser ? 'ring-4 ring-[#104080]' : `ring-2 ${medal.ring}`}`}
    >
      {/* Rank badge */}
      <span className={`absolute -top-3 rounded-full px-3 py-0.5 text-xs font-extrabold shadow ${medal.badge}`}>
        {medal.label}
      </span>

      {/* Medal icon */}
      <medal.Icon className="w-10 h-10 mt-2 flex-shrink-0" style={{ color: medal.iconColor }} aria-hidden="true" />

      {/* Avatar */}
      <Avatar name={citizen.name ?? citizen.email} size="lg" />

      {/* Name */}
      <p className={`text-sm font-bold text-center leading-tight mt-1 max-w-[160px] truncate ${medal.text}`}>
        {citizen.name ?? citizen.email ?? 'Citizen'}
      </p>

      {isCurrentUser && (
        <span className="text-[10px] font-semibold bg-[#104080] text-white rounded-full px-2 py-0.5">
          You
        </span>
      )}

      {/* Points */}
      <p className={`text-3xl font-extrabold ${medal.text}`}>
        {(citizen.points ?? 0).toLocaleString()}
        <span className="text-xs font-semibold ml-1">pts</span>
      </p>

      {/* Cleared count */}
      <p className={`text-xs font-medium flex items-center gap-1 ${medal.sub}`}>
        <HiCheckCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
        {citizen.cleared_complaints ?? 0} cleared
      </p>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function Leaderboard() {
  const { user } = useAuth()
  const [citizens, setCitizens] = useState([])
  const [loading,  setLoading]  = useState(true)

  // Real-time listener — no orderBy in query to avoid composite index requirement;
  // sorting is done client-side.
  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'citizen'),
      limit(200),
    )

    const unsub = onSnapshot(
      q,
      snap => {
        const sorted = snap.docs
          .map(d => ({ uid: d.id, ...d.data() }))
          .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
          .slice(0, 50)
        setCitizens(sorted)
        setLoading(false)
      },
      (err) => {
        console.error('[Leaderboard] onSnapshot error:', err)
        setLoading(false)
      },
    )

    return unsub
  }, [])

  const top3   = citizens.slice(0, 3)
  const rest   = citizens.slice(3)
  const myUid  = user?.uid

  // Find current user's rank
  const myRankIndex = citizens.findIndex(c => c.uid === myUid)

  return (
    <div className="min-h-screen bg-[var(--color-surface,#f0f4fa)]">

      {/* ── Hero Header ── */}
      <section
        className="relative w-full overflow-hidden py-14 sm:py-20"
        style={{
          background: 'linear-gradient(135deg, #0a1f44 0%, #104080 55%, #1a5ca0 100%)',
        }}
      >
        {/* Tricolor stripe top */}
        <div className="absolute top-0 left-0 right-0 flex h-1.5" aria-hidden="true">
          <div className="flex-1" style={{ background: '#FF9933' }} />
          <div className="flex-1 bg-white" />
          <div className="flex-1" style={{ background: '#138808' }} />
        </div>

        {/* Decorative blobs */}
        <div aria-hidden="true" className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10 bg-white" />
        <div aria-hidden="true" className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-10 bg-[#FF9933]" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20
                          px-4 py-1.5 text-xs font-semibold text-white/80 tracking-wide mb-5">
            <HiTrophy className="w-3.5 h-3.5" aria-hidden="true" />
            <span>SWACHH BHARAT MISSION — MADURAI</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Civic Impact<br className="sm:hidden" />{' '}
            <span style={{ color: '#FF9933' }}>Leaderboard</span>
          </h1>

          <p className="max-w-xl mx-auto text-base sm:text-lg text-blue-200 leading-relaxed">
            Recognising active citizens improving Madurai through civic reporting.
            Earn <strong className="text-white">10 points</strong> every time your complaint is resolved.
          </p>

          {/* User's own rank pill */}
          {myRankIndex >= 0 && !loading && (
            <div className="inline-flex items-center gap-2 mt-6 rounded-full bg-[#FF9933]/20 border border-[#FF9933]/40
                            px-5 py-2 text-sm font-semibold text-white">
              <HiMapPin className="w-4 h-4" aria-hidden="true" />
              <span>Your rank:</span>
              <span className="font-extrabold text-[#FF9933]">#{myRankIndex + 1}</span>
              <span className="opacity-70">·</span>
              <span>{citizens[myRankIndex]?.points ?? 0} pts</span>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">

        {/* ── Top 3 Podium ── */}
        <section aria-labelledby="podium-heading">
          <h2
            id="podium-heading"
            className="text-xs font-bold uppercase tracking-widest text-[#104080] mb-6 text-center flex items-center justify-center gap-1.5"
          >
            <HiStar className="w-3.5 h-3.5" aria-hidden="true" /> Top Civic Champions
          </h2>

          {loading ? (
            <div className="grid grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonMedalCard key={i} />)}
            </div>
          ) : top3.length === 0 ? null : (
            <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end">
              {PODIUM_ORDER.map(idx => {
                const citizen = top3[idx]
                if (!citizen) return <div key={idx} />
                return (
                  <MedalCard
                    key={citizen.uid}
                    citizen={citizen}
                    medal={MEDALS[idx]}
                    isCurrentUser={citizen.uid === myUid}
                  />
                )
              })}
            </div>
          )}
        </section>

        {/* ── Full Rankings Table ── */}
        <section aria-labelledby="table-heading">
          <div className="flex items-center justify-between mb-4">
            <h2
              id="table-heading"
              className="text-xs font-bold uppercase tracking-widest text-[#104080] flex items-center gap-1.5"
            >
              <HiClipboardDocument className="w-3.5 h-3.5" aria-hidden="true" /> Full Rankings
            </h2>
            <span className="text-xs text-slate-400">
              Top {Math.min(citizens.length, 50)} citizens
            </span>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="grid" aria-label="Citizen leaderboard">
                <thead>
                  <tr className="bg-[#0a2240] text-white">
                    <th scope="col" className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider w-14">
                      Rank
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                      Citizen
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">
                      Points
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                      Cleared
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : citizens.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-3">
                          <HiSparkles className="w-12 h-12 text-slate-300" aria-hidden="true" />
                          <p className="font-semibold text-slate-600">No rankings yet</p>
                          <p className="text-xs max-w-xs">
                            Be the first! File a complaint and earn points when it gets resolved.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    citizens.map((citizen, index) => {
                      const rank       = index + 1
                      const isMe       = citizen.uid === myUid
                      const isTopThree = rank <= 3
                      const medalIcon  = rank <= 3 ? MEDALS[rank - 1] : null

                      return (
                        <tr
                          key={citizen.uid}
                          aria-current={isMe ? 'true' : undefined}
                          className={[
                            'transition-colors duration-150',
                            isMe
                              ? 'bg-[#104080]/8 border-l-4 border-[#104080]'
                              : isTopThree
                              ? 'bg-amber-50/60 hover:bg-amber-50'
                              : 'hover:bg-slate-50',
                          ].join(' ')}
                        >
                          {/* Rank */}
                          <td className="px-4 py-3 text-center">
                            {medalIcon ? (
                              <medalIcon.Icon
                                className="w-5 h-5 mx-auto"
                                style={{ color: medalIcon.iconColor }}
                                aria-label={`Rank ${rank}`}
                              />
                            ) : (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full
                                               bg-slate-100 text-slate-600 text-xs font-bold">
                                {rank}
                              </span>
                            )}
                          </td>

                          {/* Name */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar name={citizen.name ?? citizen.email} />
                              <div className="min-w-0">
                                <p className={`font-semibold leading-tight truncate max-w-[180px]
                                              ${isMe ? 'text-[#104080]' : 'text-slate-800'}`}>
                                  {citizen.name ?? 'Citizen'}
                                </p>
                                {isMe && (
                                  <span className="text-[10px] bg-[#104080] text-white rounded-full px-2 py-0.5 font-semibold">
                                    You
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Points */}
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-baseline gap-1
                                             ${isMe ? 'text-[#104080] font-extrabold' : 'text-slate-700 font-bold'}`}>
                              {(citizen.points ?? 0).toLocaleString()}
                              <span className="text-[10px] font-medium text-slate-400">pts</span>
                            </span>
                          </td>

                          {/* Cleared complaints */}
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50
                                             text-emerald-700 text-xs font-semibold px-2.5 py-1">
                              <HiCheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
                              {citizen.cleared_complaints ?? 0}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Point system explainer ── */}
        <section className="rounded-2xl border border-[#104080]/20 bg-[#104080]/5 p-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#104080]">
            How Points Work
          </h3>
          <div className="grid sm:grid-cols-3 gap-4 text-sm text-slate-700">
            <div className="flex items-start gap-3">
              <HiCamera className="w-6 h-6 flex-shrink-0 text-[#104080] mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold">File a Complaint</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Report a waste or sanitation issue in your ward.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <HiTruck className="w-6 h-6 flex-shrink-0 text-[#104080] mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold">Municipality Acts</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  A team is dispatched and the issue is resolved.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <HiTrophy className="w-6 h-6 flex-shrink-0 text-[#104080] mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold">Earn +10 Points</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Points are awarded once your complaint is marked cleared.
                </p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
