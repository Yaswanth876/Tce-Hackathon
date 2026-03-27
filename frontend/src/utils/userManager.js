// src/utils/userManager.js
// ---------------------------------------------------------------
// User Management Utilities for Citizen Participation Tracking
// Handles user document creation and token increment logic
// ---------------------------------------------------------------

import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, db } from '../localDb'

/**
 * Ensures user document exists in Firestore
 * Creates new document if user doesn't exist
 * @param {string} uid - User identifier (email, phone, or Firebase Auth UID)
 * @param {Object} userData - User information (name, email, etc.)
 * @returns {Promise<void>}
 */
export async function ensureUserDocument(uid, userData) {
    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
        await setDoc(userRef, {
            uid,
            name: userData.name || 'Anonymous',
            email: userData.email || '',
            phone: userData.phone || '',
            tokens: 0,
            total_complaints: 0,
            role: 'citizen',
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
        })
    }
}

/**
 * Increments user's token count and complaint count atomically
 * Called after successful complaint submission
 * @param {string} uid - User identifier
 * @returns {Promise<void>}
 */
export async function incrementUserTokens(uid) {
    const userRef = doc(db, 'users', uid)
    
    await updateDoc(userRef, {
        tokens: increment(1),
        total_complaints: increment(1),
        updated_at: serverTimestamp()
    })
}

/**
 * Gets user data from Firestore
 * @param {string} uid - User identifier
 * @returns {Promise<Object|null>} User data or null if not found
 */
export async function getUserData(uid) {
    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)
    
    if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() }
    }
    return null
}

/**
 * Creates a unique user identifier from user data
 * Uses phone as primary identifier for citizen complaints
 * @param {Object} userData - User data containing phone/email
 * @returns {string} User identifier
 */
export function createUserIdentifier(userData) {
    if (userData.phone) {
        return `phone_${userData.phone}`
    }
    if (userData.email) {
        return `email_${userData.email}`
    }
    throw new Error('User must have either phone or email')
}
