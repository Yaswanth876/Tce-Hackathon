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
      raw.severity ??
      raw.severity_score ??
      raw.ai_analysis?.severity_score ??
      (raw.priority === 'high' ? 8 : 5),
    waste_type:
      raw.waste_type ??
      raw.category ??
      raw.ai_analysis?.waste_type ??
      'mixed',
    ai_analysis: raw.ai_analysis ?? {
      severity_score:
        raw.severity_score ??
        raw.severity ??
        5,
      waste_type:
        raw.waste_type ??
        raw.category ??
        'mixed',
      urgency_level:
        raw.urgency_level ??
        (raw.severity >= 8 ? 'critical' : raw.severity >= 6 ? 'high' : 'medium'),
    },
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
    const response = await axios.post(`${API_BASE_URL}/complaints`, body)
    const created = normalizeComplaint(response?.data?.data ?? response?.data ?? body)

    const local = readLocalComplaints()
    writeLocalComplaints([created, ...local.filter((item) => item.id !== created.id)])

    return {
      ...response,
      data: {
        ...(response?.data ?? {}),
        _id: created._id,
        id: created.id,
      },
    }
  } catch {
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
