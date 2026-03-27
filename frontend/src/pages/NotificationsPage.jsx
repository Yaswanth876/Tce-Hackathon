// src/pages/NotificationsPage.jsx
// ---------------------------------------------------------------
// Citizen notifications — shows cleared complaint cards with
// before/after images and a star-rating review flow.
//
// Data source: MongoDB backend complaint APIs.
// ---------------------------------------------------------------

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getCitizenNotifications,
  submitComplaintReview,
  dismissComplaintNotification,
} from '../api/complaintService'

import { useAuth } from '../context/AuthContext'
import ReviewModal from '../components/ReviewModal'

// ── Helpers ───────────────────────────────────────────────────

function formatDate(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Lightbox ──────────────────────────────────────────────────

function Lightbox({ src, label, onClose }) {
  // Close on backdrop click or Escape key
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative max-w-4xl w-full">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/70 hover:text-white text-3xl font-bold leading-none transition-colors"
          aria-label="Close fullscreen"
        >✕</button>

        {/* Image */}
        <img
          src={src}
          alt={label}
          className="w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
        />

        {/* Label pill */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <span className="bg-black/60 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
            {label}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-pulse">
      <div className="grid grid-cols-2 h-52 bg-slate-100">
        <div className="bg-slate-200 border-r border-slate-200" />
        <div className="bg-slate-100" />
      </div>
      <div className="p-5 space-y-3">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="h-3 bg-slate-100 rounded w-2/3" />
        <div className="h-9 bg-slate-100 rounded-xl w-32 mt-4" />
      </div>
    </div>
  )
}

// ── Image cell ────────────────────────────────────────────────

function ImageCell({ src, label, placeholder, onClick }) {
  const [errored, setErrored] = useState(false)

  if (!src || errored) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-100 text-slate-400 gap-1 p-3">
        <span className="text-3xl">{placeholder}</span>
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
        <span className="text-[10px]">Image not available</span>
      </div>
    )
  }

  return (
    <div
      className="relative h-full overflow-hidden group cursor-zoom-in"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? `View ${label} image fullscreen` : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
    >
      <img
        src={src}
        alt={label}
        onError={() => setErrored(true)}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent py-2 px-3 flex items-end justify-between">
        <span className="text-white text-[11px] font-bold uppercase tracking-wider">{label}</span>
        {onClick && (
          <span className="text-white/70 text-[10px] group-hover:text-white transition-colors">⛶ expand</span>
        )}
      </div>
    </div>
  )
}

// ── Single notification card ──────────────────────────────────

function NotificationCard({ notification, user, onReviewSubmitted, onDeleted }) {
  const [modal,     setModal]     = useState(false)
  const [lightbox,  setLightbox]  = useState(null)   // { src, label }
  const [deleting,  setDeleting]  = useState(false)

  async function handleReviewSubmitted(reviewPayload) {
    try {
      await submitComplaintReview(notification.complaint_id, reviewPayload)
      setModal(false)
      onReviewSubmitted?.()
    } catch (err) {
      console.error('Failed to submit review:', err)
      throw err
    }
  }

  async function handleDelete() {
    if (!window.confirm('Remove this notification? This cannot be undone.'))
      return
    setDeleting(true)
    try {
      await dismissComplaintNotification(notification.complaint_id)
      onDeleted?.()
    } catch (err) {
      console.error('Failed to delete notification:', err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {/* Fullscreen lightbox */}
      {lightbox && (
        <Lightbox
          src={lightbox.src}
          label={lightbox.label}
          onClose={() => setLightbox(null)}
        />
      )}

      <article className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-slate-200
                           overflow-hidden transition-shadow duration-200">

        {/* Before / After images */}
        <div className="grid grid-cols-2 h-52">
          <div className="border-r border-slate-200">
            <ImageCell
              src={notification.before_image}
              label="Before"
              placeholder="📷"
              onClick={notification.before_image
                ? () => setLightbox({ src: notification.before_image, label: 'Before' })
                : undefined
              }
            />
          </div>
          <div>
            <ImageCell
              src={notification.after_image}
              label="After"
              placeholder="✅"
              onClick={notification.after_image
                ? () => setLightbox({ src: notification.after_image, label: 'After' })
                : undefined
              }
            />
          </div>
        </div>

        {/* Divider with status pill */}
        <div className="relative flex items-center justify-center -mt-3 z-10">
          <span className="bg-green-500 text-white text-[10px] font-bold uppercase tracking-widest
                           px-3 py-0.5 rounded-full shadow-md border-2 border-white">
            ✓ Cleared
          </span>
        </div>

        {/* Card body */}
        <div className="px-5 py-4 space-y-3">

          {/* Message */}
          <p className="text-sm font-semibold text-[#0a2240] leading-snug">
            {notification.message ||
              `Your complaint has been resolved by Team ${notification.team_name || 'Municipal'}.`}
          </p>

          {/* Meta info */}
          <dl className="grid grid-cols-1 gap-1.5 text-xs text-slate-500">
            {notification.team_name && (
              <div className="flex items-center gap-1.5">
                <span className="text-base leading-none">🏗️</span>
                <dt className="sr-only">Team</dt>
                <dd className="font-medium text-slate-600">{notification.team_name}</dd>
              </div>
            )}
            {notification.cleared_at && (
              <div className="flex items-center gap-1.5">
                <span className="text-base leading-none">🕐</span>
                <dt className="sr-only">Cleared at</dt>
                <dd>{formatDate(notification.cleared_at)}</dd>
              </div>
            )}
            {notification.location && (
              <div className="flex items-start gap-1.5">
                <span className="text-base leading-none mt-px">📍</span>
                <dt className="sr-only">Location</dt>
                <dd className="line-clamp-2">{notification.location}</dd>
              </div>
            )}
          </dl>

          {/* Complaint ID badge */}
          <p className="text-[11px] text-slate-400 font-mono bg-slate-50 rounded-lg px-2 py-1 inline-block">
            ID: {notification.complaint_id?.slice(-10).toUpperCase() ?? '—'}
          </p>

          {/* Review CTA */}
          <div className="pt-2 space-y-2">
            {notification.review_submitted ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                  <span className="text-base">⭐</span>
                  Review Submitted
                </div>
                {/* Delete notification — only available after review */}
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  title="Remove this notification"
                  className="rounded-lg border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600
                             disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold
                             px-3 py-1.5 transition-colors flex items-center gap-1"
                >
                  {deleting ? (
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                  ) : '🗑️'} Delete
                </button>
              </div>
            ) : (
              <button
                onClick={() => setModal(true)}
                className="w-full sm:w-auto rounded-xl bg-[#104080] hover:bg-[#0a2240] text-white
                           text-sm font-semibold px-5 py-2.5 transition-colors shadow-sm"
              >
                Rate & Review
              </button>
            )}
          </div>
        </div>
      </article>

      {modal && (
        <ReviewModal
          notification={notification}
          user={user}
          onClose={() => setModal(false)}
          onSubmitted={handleReviewSubmitted}
        />
      )}
    </>
  )
}

// ── Empty state ───────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-4xl mb-5 shadow-sm">
        🔔
      </div>
      <h3 className="text-lg font-bold text-[#0a2240] mb-2">No notifications yet</h3>
      <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
        When your complaints are resolved, you'll receive a notification here with before &amp; after
        images from the cleanup team.
      </p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { user } = useAuth()
  const navigate  = useNavigate()

  const [notifications, setNotifications] = useState([])
  const [loading,       setLoading]       = useState(true)

  async function loadNotifications() {
    if (!user?.uid) {
      setNotifications([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const docs = await getCitizenNotifications(user.uid)
      const sorted = docs.sort((a, b) => {
        const ta = a.cleared_at?.toDate?.() ?? new Date(a.cleared_at ?? 0)
        const tb = b.cleared_at?.toDate?.() ?? new Date(b.cleared_at ?? 0)
        return tb - ta
      })
      setNotifications(sorted)
    } catch (err) {
      console.error('Notifications fetch error:', err)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [user?.uid])

  const unreviewed = notifications.filter(n => !n.review_submitted).length

  return (
    <div className="min-h-screen bg-[#f0f4f8]">

      {/* Page header */}
      <header className="bg-[#104080] text-white shadow-md">
        <div className="flex h-1">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-[#138808]" />
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/citizen')}
              aria-label="Back to dashboard"
              className="rounded-lg bg-white/10 hover:bg-white/20 p-2 transition-colors"
            >
              <span className="text-white text-sm font-bold">← Back</span>
            </button>
            <div>
              <p className="text-xs opacity-70 uppercase tracking-wider">AQRO Portal</p>
              <h1 className="text-base font-bold leading-tight">Your Complaint Updates</h1>
            </div>
          </div>

          {/* Unreviewed badge */}
          {!loading && unreviewed > 0 && (
            <span className="flex items-center gap-1.5 bg-amber-400 text-amber-900 text-xs font-bold
                             px-3 py-1.5 rounded-full shadow-sm">
              <span className="text-base leading-none">⭐</span>
              {unreviewed} pending review{unreviewed > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Summary bar */}
        {!loading && notifications.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-4 py-3 flex items-center gap-3">
              <span className="text-2xl">🔔</span>
              <div>
                <p className="text-xl font-bold text-[#0a2240] leading-none">{notifications.length}</p>
                <p className="text-xs text-slate-500 mt-0.5">Total Updates</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-4 py-3 flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-xl font-bold text-green-600 leading-none">
                  {notifications.filter(n => n.review_submitted).length}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Reviewed</p>
              </div>
            </div>
            {unreviewed > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-amber-200 px-4 py-3 flex items-center gap-3">
                <span className="text-2xl">⭐</span>
                <div>
                  <p className="text-xl font-bold text-amber-500 leading-none">{unreviewed}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Pending Review</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => <NotificationSkeleton key={i} />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <EmptyState />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {notifications.map(n => (
              <NotificationCard
                key={n.id}
                notification={n}
                user={user}
                onReviewSubmitted={loadNotifications}
                onDeleted={loadNotifications}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
