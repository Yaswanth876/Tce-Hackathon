import axios from 'axios'
import { API_BASE_URL } from '../config'

const STORAGE_KEY = 'aqro_mock_complaints'

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

function normalizeComplaint(raw = {}) {
  const id = raw.id ?? raw._id ?? raw.complaintId ?? `cmp-${Date.now()}-${Math.floor(Math.random() * 10000)}`
  const lat = asNumber(raw.lat ?? raw.latitude ?? raw.location?.lat ?? raw.location?.latitude)
  const lng = asNumber(raw.lng ?? raw.longitude ?? raw.location?.lng ?? raw.location?.longitude)

  return {
    ...raw,
    id,
    _id: raw._id ?? id,
    complaintId: raw.complaintId ?? id,
    status: raw.status ?? 'pending',
    image_url: raw.image_url ?? raw.imageUrl ?? raw.photoURL ?? '',
    address: raw.address ?? raw.location?.address ?? '',
    created_at: raw.created_at ?? raw.createdAt ?? nowIso(),
    updated_at: raw.updated_at ?? raw.updatedAt ?? nowIso(),
    lat,
    lng,
    location: raw.location ?? (lat != null && lng != null ? { lat, lng } : undefined),
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

function readLocalComplaints() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed.map(normalizeComplaint) : []
  } catch {
    return []
  }
}

function writeLocalComplaints(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export async function getComplaints() {
  try {
    const response = await axios.get(`${API_BASE_URL}/complaints`)
    const payload = response?.data
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.complaints)
          ? payload.complaints
          : []

    const normalized = list.map(normalizeComplaint)
    writeLocalComplaints(normalized)
    return normalized
  } catch {
    return readLocalComplaints()
  }
}

export async function createComplaint(input = {}) {
  const body = {
    ...input,
    title: input.title ?? input.description ?? 'Civic complaint',
    description: input.description ?? '',
    status: input.status ?? 'pending',
    created_at: nowIso(),
    updated_at: nowIso(),
  }

  try {
    // If imageFile is provided, use FormData for multipart request
    let response
    if (input.imageFile instanceof File) {
      const formData = new FormData()
      formData.append('image', input.imageFile)
      formData.append('title', body.title)
      formData.append('description', body.description)
      formData.append('category', input.category || 'mixed')
      formData.append('createdBy', input.createdBy || 'anonymous')
      if (input.location) {
        formData.append('location', JSON.stringify(input.location))
      }
      if (input.severity !== undefined) {
        formData.append('severity', input.severity)
      }

      response = await axios.post(`${API_BASE_URL}/complaints`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    } else {
      // For URL-based images or no image
      response = await axios.post(`${API_BASE_URL}/complaints`, body)
    }

    const created = normalizeComplaint(response?.data?.data ?? response?.data ?? body)

    const local = readLocalComplaints()
    writeLocalComplaints([created, ...local.filter((item) => item.id !== created.id)])

    return {
      ...response,
      data: {
        ...(response?.data ?? {}),
        _id: created._id,
        id: created.id,
        complaint: created,
        ai_analysis: created.ai_analysis,
      },
    }
  } catch (error) {
    console.error('Create complaint error:', error)
    const created = normalizeComplaint({
      ...body,
      _id: `mock-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    })

    const local = readLocalComplaints()
    writeLocalComplaints([created, ...local])

    return {
      data: {
        _id: created._id,
        id: created.id,
        complaint: created,
        ai_analysis: created.ai_analysis,
      },
    }
  }
}

export async function updateComplaint(complaintId, updates = {}) {
  const body = {
    ...updates,
    updated_at: nowIso(),
  }

  try {
    const response = await axios.patch(`${API_BASE_URL}/complaints/${complaintId}`, body)
    const updated = normalizeComplaint(response?.data?.data ?? response?.data ?? { id: complaintId, ...body })

    const local = readLocalComplaints()
    writeLocalComplaints(local.map((item) => (item.id === complaintId ? { ...item, ...updated } : item)))

    return updated
  } catch {
    const local = readLocalComplaints()
    const next = local.map((item) =>
      item.id === complaintId || item._id === complaintId
        ? normalizeComplaint({ ...item, ...body, id: item.id ?? complaintId, _id: item._id ?? complaintId })
        : item
    )
    writeLocalComplaints(next)
    return next.find((item) => item.id === complaintId || item._id === complaintId) ?? normalizeComplaint({ id: complaintId, ...body })
  }
}
