// src/utils/pointsService.js
// ---------------------------------------------------------------
// Safely awards +10 points to a citizen when their complaint is
// marked as "cleared" by an admin.
//
// Uses a Firestore transaction to guarantee:
//   • No double-awarding (checks points_awarded flag)
//   • Atomic increment of points + cleared_complaints counter
// ---------------------------------------------------------------

import {
  doc,
  runTransaction,
  serverTimestamp,
  increment,
  db,
} from '../localDb'

const POINTS_PER_CLEAR = 10

/**
 * Awards points to the citizen who filed the report when an admin
 * clears it. Safe to call multiple times — idempotent.
 *
 * @param {string} reportId   - Firestore document ID of the report
 * @param {string} citizenUid - UID of the citizen who filed the report
 * @returns {Promise<{ awarded: boolean, points: number }>}
 */
export async function awardPointsForClear(reportId, citizenUid) {
  if (!reportId || !citizenUid) {
    return { awarded: false, points: 0 }
  }

  const reportRef = doc(db, 'reports', reportId)
  const userRef   = doc(db, 'users',   citizenUid)

  try {
    const awarded = await runTransaction(db, async (tx) => {
      const [reportSnap, userSnap] = await Promise.all([
        tx.get(reportRef),
        tx.get(userRef),
      ])

      // Guard: report must exist and points must not have been awarded yet
      if (!reportSnap.exists()) return false
      if (reportSnap.data().points_awarded === true) return false

      // Mark report as points awarded
      tx.update(reportRef, {
        points_awarded: true,
        updated_at:     serverTimestamp(),
      })

      // Only update if the user doc already exists — admin cannot create
      // citizen docs (isOwner check in rules would fail for the admin's uid).
      if (userSnap.exists()) {
        tx.update(userRef, {
          points:              increment(POINTS_PER_CLEAR),
          cleared_complaints:  increment(1),
        })
      }
      // If doc is missing, silently skip points — avoids a permission error.

      return true
    })

    return { awarded, points: awarded ? POINTS_PER_CLEAR : 0 }
  } catch (err) {
    console.error('[pointsService] awardPointsForClear failed:', err)
    return { awarded: false, points: 0 }
  }
}
