// src/utils/teamScoreService.js
// ---------------------------------------------------------------
// Awards team performance points in Firestore when a complaint
// is cleared by an assigned team.
//
// Points logic:
//   • +20 points per cleared complaint
//   • +rating bonus (rating * 5) — applied separately via
//     awardTeamRatingBonus() when a citizen review is submitted
//
// Uses a Firestore transaction to guarantee idempotency via the
// "team_points_awarded" flag on the report document.
//
// teams/{teamName} shape:
//   team_name:      string
//   total_cleared:  number
//   total_points:   number
//   average_rating: number   (recomputed on each review submission)
//   rating_sum:     number   (running sum for average calculation)
//   rating_count:   number   (number of rated reviews)
// ---------------------------------------------------------------

import {
  doc,
  runTransaction,
  serverTimestamp,
  increment,
  db,
} from '../localDb'

const POINTS_PER_CLEAR  = 20
const POINTS_PER_RATING = 5          // multiplied by star rating (1-5)

/**
 * Awards +20 base points to the team assigned to a cleared complaint.
 * Idempotent — safe to call multiple times for the same report.
 *
 * @param {string} reportId  - Firestore document ID of the report
 * @param {string} teamName  - Name of the assigned team (assigned_to field)
 * @returns {Promise<{ awarded: boolean, points: number }>}
 */
export async function awardTeamPointsForClear(reportId, teamName) {
  if (!reportId || !teamName?.trim()) return { awarded: false, points: 0 }

  const reportRef = doc(db, 'reports', reportId)
  const teamRef   = doc(db, 'teams', teamName.trim())

  try {
    const awarded = await runTransaction(db, async (tx) => {
      const reportSnap = await tx.get(reportRef)

      if (!reportSnap.exists()) return false
      // Guard against double-awarding
      if (reportSnap.data().team_points_awarded === true) return false

      // Mark flag on the report
      tx.update(reportRef, {
        team_points_awarded: true,
        updated_at:          serverTimestamp(),
      })

      // Upsert the team document (setDoc with merge so it's created if missing)
      // We cannot use tx.set with merge inside transaction easily in all SDK versions,
      // so we read the team doc first and then set/update.
      const teamSnap = await tx.get(teamRef)
      if (teamSnap.exists()) {
        tx.update(teamRef, {
          total_cleared: increment(1),
          total_points:  increment(POINTS_PER_CLEAR),
          updated_at:    serverTimestamp(),
        })
      } else {
        tx.set(teamRef, {
          team_name:      teamName.trim(),
          total_cleared:  1,
          total_points:   POINTS_PER_CLEAR,
          average_rating: 0,
          rating_sum:     0,
          rating_count:   0,
          created_at:     serverTimestamp(),
          updated_at:     serverTimestamp(),
        })
      }

      return true
    })

    return { awarded, points: awarded ? POINTS_PER_CLEAR : 0 }
  } catch (err) {
    console.error('[teamScoreService] awardTeamPointsForClear failed:', err)
    return { awarded: false, points: 0 }
  }
}

/**
 * Applies a rating bonus to a team's score after a citizen submits a review.
 * Updates total_points, average_rating, rating_sum, rating_count atomically.
 *
 * @param {string} teamName  - Name of the team being reviewed
 * @param {number} rating    - Star rating (1–5)
 * @returns {Promise<{ applied: boolean, bonus: number }>}
 */
export async function awardTeamRatingBonus(teamName, rating) {
  if (!teamName?.trim() || !rating || rating < 1 || rating > 5) {
    return { applied: false, bonus: 0 }
  }

  const bonus   = Math.round(rating * POINTS_PER_RATING)
  const teamRef = doc(db, 'teams', teamName.trim())

  try {
    await runTransaction(db, async (tx) => {
      const teamSnap = await tx.get(teamRef)
      if (!teamSnap.exists()) {
        // Auto-create team doc if it doesn't exist yet
        tx.set(teamRef, {
          team_name:      teamName.trim(),
          total_cleared:  0,
          total_points:   bonus,
          average_rating: rating,
          rating_sum:     rating,
          rating_count:   1,
          created_at:     serverTimestamp(),
          updated_at:     serverTimestamp(),
        })
        return
      }

      const data         = teamSnap.data()
      const newSum       = (data.rating_sum   ?? 0) + rating
      const newCount     = (data.rating_count ?? 0) + 1
      const newAvg       = Math.round((newSum / newCount) * 10) / 10  // 1 decimal

      tx.update(teamRef, {
        total_points:   increment(bonus),
        rating_sum:     newSum,
        rating_count:   newCount,
        average_rating: newAvg,
        updated_at:     serverTimestamp(),
      })
    })

    return { applied: true, bonus }
  } catch (err) {
    console.error('[teamScoreService] awardTeamRatingBonus failed:', err)
    return { applied: false, bonus: 0 }
  }
}
