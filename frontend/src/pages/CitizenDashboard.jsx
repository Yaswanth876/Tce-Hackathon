import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, onSnapshot, signOut, db } from '../localDb'
import { useAuth } from '../context/AuthContext'
import UploadForm from '../components/UploadForm'
import ComplaintCard from '../components/ComplaintCard'
import StatusBadge from '../components/StatusBadge'
import { getCitizenNotifications } from '../api/complaintService'

const STATUS_TABS = ['all', 'pending', 'analyzing', 'dispatched', 'cleared']

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-pulse">
      <div className="h-44 bg-slate-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-1/3" />
        <div className="h-3 bg-slate-100 rounded w-2/3" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    </div>
  )
}

function Avatar({ user, userDoc, size = 'lg' }) {
  const dim = size === 'lg' ? 'w-16 h-16 text-2xl' : 'w-8 h-8 text-sm'
  const initials = (userDoc?.name || user?.displayName || user?.email || '?')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  if (user?.photoURL) {
    return (
      <img
        src={user.photoURL}
        alt={userDoc?.name ?? 'Profile'}
        referrerPolicy="no-referrer"
        className={`${dim} rounded-full object-cover ring-2 ring-white shadow`}
      />
    )
  }
  return (
    <div className={`${dim} rounded-full bg-[#104080] text-white font-bold flex items-center justify-center ring-2 ring-white shadow flex-shrink-0`}>
      {initials}
    </div>
  )
}

function ProfileCard({ user, userDoc, complaints }) {
  function formatJoined(ts) {
    if (!ts) return '-'
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  const cleared  = complaints.filter(c => c.status === 'cleared').length
  const total    = complaints.length
  const rate     = total > 0 ? Math.round((cleared / total) * 100) : 0
  const provider = user?.providerData?.[0]?.providerId === 'google.com' ? 'Google' : 'Email'

  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="h-20 bg-gradient-to-r from-[#0a2240] via-[#104080] to-[#1557a0]" />
      <div className="px-6 pb-6">
        <div className="-mt-8 mb-3 flex items-end justify-between">
          <Avatar user={user} userDoc={userDoc} size="lg" />
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-[#104080] border border-blue-200 self-end mb-1">
            Citizen
          </span>
        </div>
        <h2 className="text-lg font-bold text-[#0a2240] leading-tight">
          {userDoc?.name || user?.displayName || 'Citizen'}
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">{user?.email}</p>
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span>&#128273;</span> Signed in via {provider}
          </span>
          <span className="flex items-center gap-1">
            <span>&#128197;</span> Joined {formatJoined(userDoc?.created_at)}
          </span>
        </div>
        <div className="border-t border-slate-100 mt-4 pt-4 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xl font-bold text-[#0a2240]">{total}</p>
            <p className="text-xs text-slate-500">Complaints</p>
          </div>
          <div>
            <p className="text-xl font-bold text-green-600">{cleared}</p>
            <p className="text-xs text-slate-500">Cleared</p>
          </div>
          <div>
            <p className="text-xl font-bold text-[#104080]">{rate}%</p>
            <p className="text-xs text-slate-500">Rate</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function CitizenDashboard() {
  const { user, userDoc } = useAuth()
  const navigate = useNavigate()
  const [complaints,       setComplaints]       = useState([])
  const [loading,          setLoading]          = useState(true)
  const [activeTab,        setActiveTab]        = useState('all')
  const [view,             setView]             = useState('profile')
  const [unreadCount,      setUnreadCount]      = useState(0)

  useEffect(() => {
    if (!user?.uid) return
    // No orderBy — avoids composite index requirement; sort client-side below
    const q = query(
      collection(db, 'reports'),
      where('created_by', '==', user.uid),
    )
    const unsub = onSnapshot(q,
      snap => {
        // Sort newest-first on the client
        const docs = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const ta = a.created_at?.toDate?.() ?? new Date(a.created_at ?? 0)
            const tb = b.created_at?.toDate?.() ?? new Date(b.created_at ?? 0)
            return tb - ta
          })
        setComplaints(docs)
        setLoading(false)
      },
      err => {
        console.error('[CitizenDashboard] complaints query error:', err)
        setLoading(false)
      },
    )
    return unsub
  }, [user?.uid])

  // Fetch unread notification count from backend complaint API
  useEffect(() => {
    let alive = true

    async function loadUnread() {
      if (!user?.uid) {
        if (alive) setUnreadCount(0)
        return
      }

      try {
        const notifications = await getCitizenNotifications(user.uid)
        if (alive) {
          setUnreadCount(notifications.filter(n => !n.review_submitted).length)
        }
      } catch {
        if (alive) setUnreadCount(0)
      }
    }

    loadUnread()
    return () => {
      alive = false
    }
  }, [user?.uid])

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  const filtered = activeTab === 'all' ? complaints : complaints.filter(c => c.status === activeTab)
  const stats = STATUS_TABS.slice(1).map(s => ({ status: s, count: complaints.filter(c => c.status === s).length }))

  const TABS = [
    { key: 'list',    label: 'My Complaints' },
    { key: 'file',    label: '+ File Complaint' },
    { key: 'profile', label: 'My Profile' },
  ]

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <header className="bg-[#104080] text-white shadow-md">
        <div className="flex h-1">
          <div className="flex-1" style={{ background: '#FF9933' }} />
          <div className="flex-1 bg-white" />
          <div className="flex-1" style={{ background: '#138808' }} />
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs opacity-70 uppercase tracking-wider">Aqro  Portal</p>
            <h1 className="text-base font-bold leading-tight">Citizen Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setView('profile')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              title="View profile">
              <Avatar user={user} userDoc={userDoc} size="sm" />
              <span className="hidden sm:block text-sm opacity-90 font-medium">
                {userDoc?.name || user?.displayName || user?.email}
              </span>
            </button>
            <button onClick={handleSignOut}
              className="rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 ring-1 ring-white/20 transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(({ status, count }) => (
            <div key={status} className="bg-white rounded-xl shadow-sm border border-slate-200 px-4 py-4 flex flex-col gap-1.5">
              <StatusBadge status={status} />
              <span className="text-2xl font-bold text-[#0a2240] mt-1">{count}</span>
            </div>
          ))}
        </section>

        <div className="flex gap-2 flex-wrap">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setView(key)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                view === key ? 'bg-[#104080] text-white shadow' : 'bg-white text-[#104080] border border-slate-300 hover:bg-slate-50'
              }`}>
              {label}
            </button>
          ))}
          {/* Monitoring Map button */}
          <button
            onClick={() => navigate('/map')}
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors bg-white text-[#104080] border border-slate-300 hover:bg-slate-50 flex items-center gap-2"
          >
            <span>🗺️</span>
            Monitoring Map
          </button>
          {/* Notifications shortcut */}
          <button
            onClick={() => navigate('/notifications')}
            className="relative rounded-lg px-4 py-2 text-sm font-semibold transition-colors bg-white text-[#104080] border border-slate-300 hover:bg-slate-50 flex items-center gap-2"
          >
            <span>🔔</span>
            Notifications
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 shadow">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {view === 'profile' && (
          <ProfileCard user={user} userDoc={userDoc} complaints={complaints} />
        )}

        {view === 'file' && (
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-[#0a2240] mb-4">Submit a New Complaint</h2>
            <UploadForm createdBy={user?.uid} />
          </section>
        )}

        {view === 'list' && (
          <section>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {STATUS_TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                    activeTab === tab ? 'bg-[#104080] text-white' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                  }`}>
                  {tab}
                </button>
              ))}
            </div>
            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 py-16 text-center text-slate-400">
                <p className="text-4xl mb-3">&#128205;</p>
                <p className="font-semibold text-slate-600">No complaints found</p>
                {activeTab !== 'all'
                  ? <p className="text-sm mt-1">No complaints with status "{activeTab}"</p>
                  : <p className="text-sm mt-1">File your first complaint using the button above.</p>}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(report => (
                  <ComplaintCard key={report.id} report={report} isAdmin={false} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}