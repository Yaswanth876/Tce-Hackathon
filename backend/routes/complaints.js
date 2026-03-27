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
    const { title, description, imageUrl, location, category, createdBy, severity } =
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
    const { status, notes, assignedTo, severity } = req.body

    const updateData = {}
    if (status !== undefined) updateData.status = status
    if (notes !== undefined) updateData.notes = notes
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo
    if (severity !== undefined) {
      updateData.severity = severity
      updateData['ai_analysis.severity_score'] = clampSeverityScore(severity)
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
