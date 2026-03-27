// src/components/ReviewModal.jsx
// ---------------------------------------------------------------
// Star-rating review modal for resolved complaints.
// Saves via parent callback to backend complaint API.
// ---------------------------------------------------------------

import { useState } from 'react'

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
      await onSubmitted({
        rating,
        comment: feedback.trim(),
        user_id: user?.uid ?? '',
      })
    } catch (err) {
      console.error('Review submit error:', err)
      setError('Failed to submit review. Please try again.')
    } finally {
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
