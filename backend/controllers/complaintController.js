import Complaint from '../models/Complaint.js'

// ── Helpers ──────────────────────────────────────────────────

const STATUS_TRANSITIONS = {
  pending:    ['analyzing'],
  analyzing:  ['dispatched'],
  dispatched: ['cleared'],
  cleared:    [], // terminal state
}

const WASTE_TYPES = [
  'Mixed Municipal Solid Waste',
  'Organic / Food Waste',
  'Construction Debris',
  'Plastic & Packaging',
  'Hazardous Waste',
  'Electronic Waste',
]

function mockAiAnalysis(severity = 'medium') {
  const severityToScore = { low: [1, 4], medium: [4, 7], high: [7, 10] }
  const [min, max] = severityToScore[severity] ?? [1, 10]
  const severityScore = Math.floor(Math.random() * (max - min + 1)) + min

  const urgencyLevel =
    severityScore >= 7 ? 'high' : severityScore >= 4 ? 'medium' : 'low'

  return {
    severity_score: severityScore,
    waste_type:     WASTE_TYPES[Math.floor(Math.random() * WASTE_TYPES.length)],
    urgency_level:  urgencyLevel,
  }
}

// ── Controller functions ──────────────────────────────────────

/**
 * POST /api/complaints
 * Creates a new complaint with optional image upload and mock AI analysis.
 */
export async function createComplaint(req, res) {
  try {
    const { title, category, severity, lat, lng } = req.body

    if (!title) {
      return res.status(400).json({ error: 'title is required' })
    }

    const image_url = req.file
      ? `/uploads/${req.file.filename}`
      : null

    const ai_analysis = mockAiAnalysis(severity)

    const complaint = await Complaint.create({
      title:      title.trim(),
      category:   category ?? 'General',
      severity:   severity  ?? 'medium',
      location: {
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
      },
      image_url,
      status:     'pending',
      ai_analysis,
      created_at: new Date(),
    })

    return res.status(201).json({ success: true, data: complaint })
  } catch (err) {
    console.error('[createComplaint]', err.message)
    return res.status(500).json({ error: 'Failed to create complaint' })
  }
}

/**
 * GET /api/complaints
 * Returns all complaints sorted latest-first.
 * Optional query: ?status=pending|analyzing|dispatched|cleared
 */
export async function getComplaints(req, res) {
  try {
    const filter  = {}

    if (req.query.status) {
      filter.status = req.query.status
    }
    if (req.query.category) {
      filter.category = req.query.category
    }

    const complaints = await Complaint.find(filter).sort({ created_at: -1 })

    return res.json({ success: true, count: complaints.length, data: complaints })
  } catch (err) {
    console.error('[getComplaints]', err.message)
    return res.status(500).json({ error: 'Failed to fetch complaints' })
  }
}

/**
 * GET /api/complaints/:id
 * Returns a single complaint by ID.
 */
export async function getComplaintById(req, res) {
  try {
    const complaint = await Complaint.findById(req.params.id)

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' })
    }

    return res.json({ success: true, data: complaint })
  } catch (err) {
    console.error('[getComplaintById]', err.message)
    return res.status(500).json({ error: 'Failed to fetch complaint' })
  }
}

/**
 * PATCH /api/complaints/:id
 * Updates a complaint's status (with transition validation) or any other fields.
 */
export async function updateComplaint(req, res) {
  try {
    const complaint = await Complaint.findById(req.params.id)

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' })
    }

    const { status, ...otherFields } = req.body

    // Validate status transition if status is being changed
    if (status && status !== complaint.status) {
      const allowed = STATUS_TRANSITIONS[complaint.status] ?? []
      if (!allowed.includes(status)) {
        return res.status(400).json({
          error: `Invalid status transition: ${complaint.status} → ${status}. Allowed: ${allowed.join(', ') || 'none'}`,
        })
      }
      complaint.status = status
    }

    // Apply any other updatable fields (title, category, severity, etc.)
    Object.entries(otherFields).forEach(([key, value]) => {
      if (key !== '_id' && key !== 'created_at') {
        complaint[key] = value
      }
    })

    await complaint.save()

    return res.json({ success: true, data: complaint })
  } catch (err) {
    console.error('[updateComplaint]', err.message)
    return res.status(500).json({ error: 'Failed to update complaint' })
  }
}

/**
 * DELETE /api/complaints/:id
 * Permanently removes a complaint (admin only use-case).
 */
export async function deleteComplaint(req, res) {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id)

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' })
    }

    return res.json({ success: true, message: 'Complaint deleted' })
  } catch (err) {
    console.error('[deleteComplaint]', err.message)
    return res.status(500).json({ error: 'Failed to delete complaint' })
  }
}
