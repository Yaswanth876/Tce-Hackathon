// src/api/complaintService.js
// ---------------------------------------------------------------
// Complaint service — unified to use localDb 'reports' collection
// Both citizen and admin read/write to the same "reports" collection.
// The shape is future-compatible with a MongoDB backend.
// ---------------------------------------------------------------

import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  db,
} from '../localDb'

const PRIMARY_COLLECTION = 'reports'
const LEGACY_COLLECTION = 'complaints'

function nowIso() {
  return new Date().toISOString()
}

function asNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function clamp(value, min, max, fallback) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

function normalizePriority(value, fallback = 'medium') {
  const v = String(value ?? '').toLowerCase()
  return ['low', 'medium', 'high', 'critical'].includes(v) ? v : fallback
}

function normalizedAnalysis(raw = {}) {
  const source = raw.ai_analysis ?? raw
  const severityScore = Math.round(
    clamp(
      source?.severity_score ?? raw.severity_score ?? raw.severity,
      1,
      10,
      5
    )
  )

  return {
    waste_type: source?.waste_type ?? raw.waste_type ?? raw.category ?? 'mixed',
    waste_composition: Array.isArray(source?.waste_composition) ? source.waste_composition : [],
    estimated_volume: {
      amount: clamp(source?.estimated_volume?.amount, 0, 100000, 0),
      unit: source?.estimated_volume?.unit ?? 'kg',
      description: source?.estimated_volume?.description ?? '',
    },
    sanitary_workers_needed: {
      minimum: Math.max(1, Math.round(clamp(source?.sanitary_workers_needed?.minimum, 1, 500, 1))),
      recommended: Math.max(
        Math.round(clamp(source?.sanitary_workers_needed?.minimum, 1, 500, 1)),
        Math.round(clamp(source?.sanitary_workers_needed?.recommended, 1, 500, 2))
      ),
      equipment: Array.isArray(source?.sanitary_workers_needed?.equipment)
        ? source.sanitary_workers_needed.equipment
        : [],
    },
    hazards: {
      immediate_hazards: Array.isArray(source?.hazards?.immediate_hazards)
        ? source.hazards.immediate_hazards
        : [],
      environmental_impact: source?.hazards?.environmental_impact ?? '',
      health_risks: Array.isArray(source?.hazards?.health_risks)
        ? source.hazards.health_risks
        : [],
      contamination_risk: normalizePriority(source?.hazards?.contamination_risk),
    },
    severity_score: severityScore,
    urgency_level: normalizePriority(source?.urgency_level),
    cleanup_priority: normalizePriority(source?.cleanup_priority),
    confidence: Math.round(clamp(source?.confidence, 0, 100, 0)),
    location_characteristics: source?.location_characteristics ?? '',
    officer_summary: source?.officer_summary ?? '',
    officer_actions: Array.isArray(source?.officer_actions) ? source.officer_actions : [],
    citizen_summary: source?.citizen_summary ?? '',
    citizen_advice: Array.isArray(source?.citizen_advice) ? source.citizen_advice : [],
    rawAnalysis: source?.rawAnalysis ?? '',
    analyzedAt: source?.analyzedAt ?? null,
  }
}

/**
 * Normalize a raw complaint/report object into a standardized shape.
 * This ensures a consistent structure regardless of the data source.
 */
export function normalizeComplaint(raw = {}) {
  const id = raw.id ?? raw._id ?? raw.complaintId ?? `cmp-${Date.now()}-${Math.floor(Math.random() * 10000)}`
  const lat = asNumber(raw.lat ?? raw.latitude ?? raw.location?.lat ?? raw.location?.latitude)
  const lng = asNumber(raw.lng ?? raw.longitude ?? raw.location?.lng ?? raw.location?.longitude)
  const createdAt = raw.createdAt ?? raw.created_at ?? nowIso()
  const location = raw.location ?? (lat != null && lng != null ? { lat, lng } : undefined)
  const image = raw.image ?? raw.image_url ?? raw.imageUrl ?? raw.photoURL ?? raw.photo ?? ''

  return {
    ...raw,
    id,
    _id: raw._id ?? id,
    complaintId: raw.complaintId ?? id,
    status: raw.status ?? 'pending',
    title: raw.title ?? raw.description ?? 'Civic complaint',
    image,
    image_url: image,
    address: raw.address ?? raw.location?.address ?? '',
    createdAt,
    created_at: createdAt,
    created_by: raw.created_by ?? raw.createdBy ?? '',
    updated_at: raw.updated_at ?? raw.updatedAt ?? nowIso(),
    lat,
    lng,
    location,
    severity:
      clamp(
        raw.severity ??
        raw.severity_score ??
        raw.ai_analysis?.severity_score ??
        (raw.priority === 'high' ? 8 : 5),
        1,
        10,
        5
      ),
    waste_type:
      raw.waste_type ??
      raw.category ??
      raw.ai_analysis?.waste_type ??
      'mixed',
    ai_analysis: normalizedAnalysis(raw),
  }
}

/**
 * Fetch all complaints from the localDb 'reports' collection.
 * This is the single source of truth used by both citizen and admin views.
 */
export async function getComplaints() {
  try {
    const [primarySnapshot, legacySnapshot] = await Promise.all([
      getDocs(query(collection(db, PRIMARY_COLLECTION), orderBy('created_at', 'desc'))),
      getDocs(query(collection(db, LEGACY_COLLECTION), orderBy('createdAt', 'desc'))),
    ])

    const normalized = [
      ...primarySnapshot.docs.map(d => normalizeComplaint({ id: d.id, ...d.data() })),
      ...legacySnapshot.docs.map(d => normalizeComplaint({ id: d.id, ...d.data() })),
    ]

    const deduped = new Map()
    normalized.forEach((complaint) => {
      deduped.set(complaint.id, complaint)
    })

    return Array.from(deduped.values()).sort((a, b) => {
      const aTs = new Date(a.createdAt ?? a.created_at ?? 0).getTime()
      const bTs = new Date(b.createdAt ?? b.created_at ?? 0).getTime()
      return bTs - aTs
    })
  } catch (err) {
    console.error('[complaintService] getComplaints error:', err)
    return []
  }
}

/**
 * Create a new complaint in the localDb 'reports' collection.
 * The complaint is immediately available to all dashboards.
 */
export async function createComplaint(input = {}) {
  const now = serverTimestamp()
  const status = input.status ?? 'pending'
  const title = input.title ?? input.description ?? 'Civic complaint'
  const image = input.image ?? input.image_url ?? input.imageUrl ?? input.photo ?? ''
  const location = input.location ?? null

  const complaintData = {
    title,
    description: input.description ?? '',
    category: input.category ?? 'mixed',
    severity: input.severity ?? 'medium',
    status,
    waste_type: input.waste_type ?? input.category ?? 'mixed',
    image,
    image_url: image,
    location,
    address: location?.address ?? input.address ?? '',
    lat: location?.lat ?? null,
    lng: location?.lng ?? null,
    created_by: input.createdBy ?? input.created_by ?? '',
    createdAt: now,
    created_at: now,
    updated_at: now,
  }

  try {
    const result = await addDoc(collection(db, PRIMARY_COLLECTION), complaintData)
    const created = normalizeComplaint({ ...complaintData, id: result.id })

    return {
      data: {
        _id: created.id,
        id: created.id,
        complaint: created,
        ai_analysis: created.ai_analysis,
      },
    }
  } catch (err) {
    console.error('[complaintService] createComplaint error:', err)
    throw err
  }
}

/**
 * Update a complaint in the localDb 'reports' collection.
 * Used by admin to change status, assign teams, etc.
 */
export async function updateComplaint(complaintId, updates = {}) {
  try {
    const patch = {
      ...updates,
      updated_at: serverTimestamp(),
    }

    await updateDoc(doc(db, 'reports', complaintId), patch)

    // Return the merged result
    return normalizeComplaint({ id: complaintId, ...patch })
  } catch (err) {
    console.error('[complaintService] updateComplaint error:', err)
    throw err
  }
}
