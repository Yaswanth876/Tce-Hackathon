// src/components/ReviewModal.jsx
// ---------------------------------------------------------------
// Star-rating review modal for resolved complaints.
// Saves to Firestore `reviews` collection.
// ---------------------------------------------------------------

import { useState } from 'react'
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, db } from '../localDb'
// MIGRATED: Use MongoDB API
// import { db } from '../firebase'
import { awardTeamRatingBonus } from '../utils/teamScoreService'

function StarRating({ rating, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={rating === star}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          disabled={readonly}
          onClick={() => !readonly && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`text-3xl transition-transform ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} focus:outline-none`}
        >
          <span className={
            (hovered || rating) >= star
              ? 'text-amber-400'
              : 'text-slate-300'
          }>
            ★
          </span>
        </button>
      ))}
    </div>
  )
}

const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
}

export default function ReviewModal({ notification, user, onClose, onSubmitted }) {
  const [rating,    setRating]    = useState(0)
  const [feedback,  setFeedback]  = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error,     setError]     = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (rating === 0) { setError('Please select a star rating before submitting.'); return }

    setSubmitting(true)
    setError(null)

    try {
      await addDoc(collection(db, 'reviews'), {
        complaint_id: notification.complaint_id,
        team_name:    notification.team_name ?? '',
        rating,
        feedback:     feedback.trim(),
        user_id:      user.uid,
        created_at:   serverTimestamp(),
      })
      // Award rating bonus points to the team
      if (notification.team_name) {
        await awardTeamRatingBonus(notification.team_name, rating)
      }

      // ── Rating < 3: reopen the complaint ──────────────────────────────────────
      // The citizen is unsatisfied — reopen to 'analyzing' so the admin
      // can re-dispatch a team. Also:
      //   • Reset team_points_awarded so the base +20 is re-awarded properly
      //     when the complaint is cleared a second time.
      //   • Deduct 1 from total_cleared and 20 pts from the team's score.
      if (rating < 3 && notification.complaint_id) {
        const reportRef = doc(db, 'reports', notification.complaint_id)
        await updateDoc(reportRef, {
          status:              'analyzing',
          team_points_awarded: false,   // allow re-award on next clear
          notification_sent:   false,   // allow new notification on next clear
          reopened_at:         serverTimestamp(),
          updated_at:          serverTimestamp(),
        })
        // Adjust team score: remove the clear credit that is now invalidated
        if (notification.team_name) {
          const teamRef = doc(db, 'teams', notification.team_name)
          await updateDoc(teamRef, {
            total_cleared: increment(-1),
            total_points:  increment(-20),
            updated_at:    serverTimestamp(),
          }).catch(() => {}) // best-effort — don't block on score adjustment
        }
      }

      onSubmitted()
    } catch (err) {
      console.error('Review submit error:', err)
      setError('Failed to submit review. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">

        {/* Modal header */}
        <div className="bg-gradient-to-r from-[#0a2240] to-[#104080] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 id="review-modal-title" className="text-white font-bold text-base leading-tight">
              Rate the Resolution
            </h2>
            <p className="text-blue-200 text-xs mt-0.5">
              Complaint #{notification.complaint_id?.slice(-8).toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-white/70 hover:text-white text-xl leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Team badge */}
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-3 flex items-center gap-2">
          <span className="text-lg">🏗️</span>
          <div>
            <p className="text-xs text-slate-500 leading-none">Resolved by</p>
            <p className="text-sm font-semibold text-[#0a2240] mt-0.5">
              {notification.team_name || 'Municipal Team'}
            </p>
          </div>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

          {/* Stars */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[#0a2240]">
              How satisfied are you with the resolution?
            </label>
            <StarRating rating={rating} onChange={r => { setRating(r); setError(null) }} />
            {rating > 0 && (
              <p className="text-xs font-medium text-amber-600">{RATING_LABELS[rating]}</p>
            )}
          </div>

          {/* Feedback textarea */}
          <div className="space-y-1.5">
            <label htmlFor="feedback-text" className="block text-sm font-semibold text-[#0a2240]">
              Additional Feedback <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="feedback-text"
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Share your experience with the cleanup team…"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400
                         focus:outline-none focus:ring-2 focus:ring-[#104080]/30 focus:border-[#104080] resize-none
                         transition-colors"
            />
            <p className="text-right text-xs text-slate-400">{feedback.length}/500</p>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-300 text-slate-600 text-sm font-semibold py-2.5
                         hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="flex-1 rounded-xl bg-[#104080] text-white text-sm font-semibold py-2.5
                         hover:bg-[#0a2240] disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors shadow-sm"
            >
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
