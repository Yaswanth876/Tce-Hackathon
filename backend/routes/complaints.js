import express from 'express'
import Complaint from '../models/Complaint.js'
import { analyzeWasteImage, analyzeWasteImageFromUrl } from '../services/geminiService.js'
import upload from '../config/multer.js'

const router = express.Router()

function clampSeverityScore(input) {
  const value = Number(input)
  if (!Number.isFinite(value)) return 5
  return Math.max(1, Math.min(10, Math.round(value)))
}

function toCleanedNotification(complaint) {
  return {
    complaint_id: complaint._id,
    before_image: complaint.image_url || complaint.imageUrl || '',
    after_image: complaint.cleaned_image_url || '',
    team_name: complaint.assignedTo || '',
    cleared_at: complaint.cleared_at,
    review_submitted: complaint.citizen_review?.state === 'submitted',
    message:
      complaint.notification?.message ||
      `Your complaint has been resolved by Team ${complaint.assignedTo || 'Municipal'}.`,
    location: complaint.location?.address || '',
    dismissed: Boolean(complaint.notification?.dismissed),
  }
}

/**
 * GET /api/complaints/notifications/:userId
 * Fetch notifications for a citizen from complaints table.
 */
router.get('/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const complaints = await Complaint.find({
      createdBy: userId,
      'notification.sent': true,
      'notification.dismissed': { $ne: true },
      status: { $in: ['cleared', 'completed'] },
    }).sort({ cleared_at: -1, updatedAt: -1 })

    res.json({
      success: true,
      data: complaints.map(toCleanedNotification),
      count: complaints.length,
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message,
    })
  }
})

/**
 * POST /api/complaints/:id/review
 * Save citizen rating/comment state.
 */
router.post('/:id/review', async (req, res) => {
  try {
    const { rating, comment = '' } = req.body
    const parsedRating = Number(rating)

    if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'rating must be between 1 and 5',
      })
    }

    const complaint = await Complaint.findById(req.params.id)
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      })
    }

    complaint.citizen_review = {
      rating: parsedRating,
      comment: String(comment).trim(),
      state: 'submitted',
      submitted_at: new Date(),
    }

    await complaint.save()

    res.json({
      success: true,
      message: 'Review saved successfully',
      data: toCleanedNotification(complaint),
    })
  } catch (error) {
    console.error('Save review error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to save review',
      error: error.message,
    })
  }
})

/**
 * PATCH /api/complaints/:id/notification/dismiss
 * Hide a citizen notification after review.
 */
router.patch('/:id/notification/dismiss', async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      })
    }

    complaint.notification = {
      ...(complaint.notification || {}),
      dismissed: true,
      dismissed_at: new Date(),
    }

    await complaint.save()

    res.json({
      success: true,
      message: 'Notification dismissed',
      data: { complaint_id: complaint._id },
    })
  } catch (error) {
    console.error('Dismiss notification error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to dismiss notification',
      error: error.message,
    })
  }
})

/**
 * GET /api/complaints
 * Fetch all complaints with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { status, category, createdBy } = req.query
    const filter = {}

    if (status) filter.status = status
    if (category) filter.category = category
    if (createdBy) filter.createdBy = createdBy

    const complaints = await Complaint.find(filter).sort({ createdAt: -1 })
    res.json({
      success: true,
      data: complaints,
      count: complaints.length,
    })
  } catch (error) {
    console.error('Get complaints error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaints',
      error: error.message,
    })
  }
})

/**
 * GET /api/complaints/:id
 * Fetch a single complaint by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      })
    }
    res.json({
      success: true,
      data: complaint,
    })
  } catch (error) {
    console.error('Get complaint error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaint',
      error: error.message,
    })
  }
})

/**
 * POST /api/complaints
 * Create a new complaint with image upload
 * Analyzes the image using Gemini API
 */
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title, description, imageUrl, location, category, createdBy, severity, lat, lng, address } =
      req.body

    // Parse location JSON if it's a string
    let parsedLocation = location
    if (typeof location === 'string') {
      try {
        parsedLocation = JSON.parse(location)
      } catch (e) {
        parsedLocation = {}
      }
    }

    if (!parsedLocation || typeof parsedLocation !== 'object') {
      parsedLocation = {}
    }

    if (lat !== undefined && lng !== undefined) {
      const parsedLat = Number(lat)
      const parsedLng = Number(lng)
      parsedLocation.lat = Number.isFinite(parsedLat) ? parsedLat : null
      parsedLocation.lng = Number.isFinite(parsedLng) ? parsedLng : null
    }
    if (address) {
      parsedLocation.address = address
    }

    const complaintContext = {
      title,
      description,
      category,
      severity,
      location: parsedLocation,
      createdBy,
    }

    // Create complaint object
    const complaintData = {
      title,
      description,
      category: category || 'mixed',
      createdBy: createdBy || 'anonymous',
      location: parsedLocation || {},
      severity: severity || 'medium',
      status: 'pending',
      ai_analysis: {
        severity_score: clampSeverityScore(severity),
        waste_type: category || 'mixed',
        urgency_level: 'medium',
        cleanup_priority: 'medium',
        confidence: 0,
        officer_summary: 'Initial complaint received. Awaiting AI verification.',
        officer_actions: ['Validate complaint evidence and assign field team.'],
        citizen_summary: 'Complaint received. Analysis and assignment are in progress.',
        citizen_advice: ['Avoid direct contact with the waste until cleaned.'],
      },
    }

    // Handle image - either uploaded file or external URL
    if (req.file) {
      complaintData.imagePath = req.file.path
      complaintData.imageUrl = `/uploads/${req.file.filename}`
      complaintData.image_url = complaintData.imageUrl
      console.log(`📷 Image uploaded: ${req.file.filename}`)

      // Analyze the uploaded image with Gemini
      console.log(`🔍 Analyzing image with Gemini AI...`)
      const analysis = await analyzeWasteImage(req.file.path, complaintContext)

      if (analysis.success) {
        complaintData.ai_analysis = {
          waste_type: analysis.waste_type,
          waste_composition: analysis.waste_composition,
          estimated_volume: analysis.estimated_volume,
          sanitary_workers_needed: analysis.sanitary_workers_needed,
          hazards: analysis.hazards,
          severity_score: analysis.severity_score,
          urgency_level: analysis.urgency_level,
          cleanup_priority: analysis.cleanup_priority,
          location_characteristics: analysis.location_characteristics,
          confidence: analysis.confidence,
          officer_summary: analysis.officer_summary,
          officer_actions: analysis.officer_actions,
          citizen_summary: analysis.citizen_summary,
          citizen_advice: analysis.citizen_advice,
          rawAnalysis: analysis.rawAnalysis,
          analyzedAt: analysis.analyzedAt,
        }
        console.log(`✅ Image analysis complete:`, {
          waste_type: analysis.waste_type,
          severity_score: analysis.severity_score,
          workers_needed: analysis.sanitary_workers_needed.recommended,
          hazards: analysis.hazards.immediate_hazards,
        })
      } else {
        console.warn(`⚠️  Image analysis failed:`, analysis.error)
      }
    } else if (imageUrl) {
      complaintData.imageUrl = imageUrl
      complaintData.image_url = imageUrl
      console.log(`📷 External URL provided: ${imageUrl}`)

      // Optionally analyze external image
      const analysis = await analyzeWasteImageFromUrl(imageUrl, complaintContext)
      if (analysis.success) {
        complaintData.ai_analysis = {
          waste_type: analysis.waste_type,
          waste_composition: analysis.waste_composition,
          estimated_volume: analysis.estimated_volume,
          sanitary_workers_needed: analysis.sanitary_workers_needed,
          hazards: analysis.hazards,
          severity_score: analysis.severity_score,
          urgency_level: analysis.urgency_level,
          cleanup_priority: analysis.cleanup_priority,
          location_characteristics: analysis.location_characteristics,
          confidence: analysis.confidence,
          officer_summary: analysis.officer_summary,
          officer_actions: analysis.officer_actions,
          citizen_summary: analysis.citizen_summary,
          citizen_advice: analysis.citizen_advice,
          rawAnalysis: analysis.rawAnalysis,
          analyzedAt: analysis.analyzedAt,
        }
      }
    }

    // Create and save the complaint
    const complaint = new Complaint(complaintData)
    await complaint.save()

    console.log(`✅ Complaint created with ID: ${complaint._id}`)

    res.status(201).json({
      success: true,
      message: 'Complaint created successfully',
      data: complaint,
    })
  } catch (error) {
    console.error('Create complaint error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create complaint',
      error: error.message,
    })
  }
})

/**
 * PATCH /api/complaints/:id
 * Update a complaint
 */
router.patch('/:id', async (req, res) => {
  try {
    const { status, notes, assignedTo, severity, cleaned_image_url, location } = req.body

    const updateData = {}
    if (status !== undefined) updateData.status = status
    if (notes !== undefined) updateData.notes = notes
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo
    if (cleaned_image_url !== undefined) updateData.cleaned_image_url = cleaned_image_url
    if (location !== undefined) updateData.location = location
    if (severity !== undefined) {
      updateData.severity = severity
      updateData['ai_analysis.severity_score'] = clampSeverityScore(severity)
    }

    if (status === 'cleared' || status === 'completed') {
      updateData.cleared_at = new Date()
      updateData['notification.sent'] = true
      updateData['notification.dismissed'] = false
      updateData['notification.sent_at'] = new Date()
      updateData['notification.dismissed_at'] = null
      updateData['notification.message'] =
        'Your complaint has been resolved. Please review the cleaned image.'
      updateData['citizen_review.state'] = 'pending'
      updateData['citizen_review.rating'] = null
      updateData['citizen_review.comment'] = ''
      updateData['citizen_review.submitted_at'] = null
    }

    updateData.updatedAt = new Date()

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      })
    }

    console.log(`✅ Complaint updated: ${req.params.id}`)

    res.json({
      success: true,
      message: 'Complaint updated successfully',
      data: complaint,
    })
  } catch (error) {
    console.error('Update complaint error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update complaint',
      error: error.message,
    })
  }
})

/**
 * DELETE /api/complaints/:id
 * Delete a complaint
 */
router.delete('/:id', async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id)

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      })
    }

    console.log(`✅ Complaint deleted: ${req.params.id}`)

    res.json({
      success: true,
      message: 'Complaint deleted successfully',
      data: complaint,
    })
  } catch (error) {
    console.error('Delete complaint error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete complaint',
      error: error.message,
    })
  }
})

export default router
