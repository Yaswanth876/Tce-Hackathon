import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import path from 'path'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const PRIORITY_VALUES = new Set(['low', 'medium', 'high', 'critical'])

function clamp(value, min, max, fallback) {
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  return Math.min(max, Math.max(min, num))
}

function normalizedPriority(value, fallback = 'medium') {
  const normalized = String(value || '').toLowerCase().trim()
  return PRIORITY_VALUES.has(normalized) ? normalized : fallback
}

function buildContextBlock(context = {}) {
  const contextPayload = {
    title: context.title || '',
    description: context.description || '',
    category: context.category || '',
    severity: context.severity || '',
    location: {
      lat: context?.location?.lat ?? null,
      lng: context?.location?.lng ?? null,
      address: context?.location?.address || '',
    },
    createdBy: context.createdBy || '',
  }

  return JSON.stringify(contextPayload, null, 2)
}

function defaultAnalysis(rawText = '') {
  return {
    waste_type: 'mixed',
    waste_composition: [],
    estimated_volume: {
      amount: 10,
      unit: 'kg',
      description: 'Estimated from limited visual/context data',
    },
    sanitary_workers_needed: {
      minimum: 2,
      recommended: 3,
      equipment: ['gloves', 'masks', 'safety vests'],
    },
    hazards: {
      immediate_hazards: [],
      environmental_impact: 'Not enough detail to estimate confidently',
      health_risks: [],
      contamination_risk: 'medium',
    },
    cleanup_priority: 'medium',
    severity_score: 5,
    urgency_level: 'medium',
    confidence: 50,
    location_characteristics: 'Unknown',
    officer_summary: 'Perform on-site verification and prioritize safe cleanup.',
    officer_actions: [
      'Verify site access and hazards before dispatch.',
      'Deploy basic PPE and collection tools.',
      'Update complaint status after first field inspection.',
    ],
    citizen_summary: 'Your complaint has been reviewed by AI and sent for officer action.',
    citizen_advice: [
      'Avoid direct contact with the waste until cleanup is complete.',
      'Keep children and pets away from the area.',
    ],
    rawAnalysis: rawText,
  }
}

function normalizeAnalysis(parsed, rawText) {
  const base = defaultAnalysis(rawText)
  const merged = {
    ...base,
    ...(parsed || {}),
    estimated_volume: {
      ...base.estimated_volume,
      ...(parsed?.estimated_volume || {}),
    },
    sanitary_workers_needed: {
      ...base.sanitary_workers_needed,
      ...(parsed?.sanitary_workers_needed || {}),
    },
    hazards: {
      ...base.hazards,
      ...(parsed?.hazards || {}),
    },
  }

  merged.severity_score = clamp(merged.severity_score, 1, 10, 5)
  merged.confidence = clamp(merged.confidence, 0, 100, 50)
  merged.cleanup_priority = normalizedPriority(merged.cleanup_priority, 'medium')
  merged.urgency_level = normalizedPriority(merged.urgency_level, 'medium')
  merged.hazards.contamination_risk = normalizedPriority(
    merged?.hazards?.contamination_risk,
    'medium'
  )
  merged.sanitary_workers_needed.minimum = Math.max(
    1,
    Math.round(clamp(merged?.sanitary_workers_needed?.minimum, 1, 500, 2))
  )
  merged.sanitary_workers_needed.recommended = Math.max(
    merged.sanitary_workers_needed.minimum,
    Math.round(clamp(merged?.sanitary_workers_needed?.recommended, 1, 500, 3))
  )
  merged.estimated_volume.amount = Math.max(
    0,
    Number(clamp(merged?.estimated_volume?.amount, 0, 100000, 10).toFixed(2))
  )
  merged.waste_composition = Array.isArray(merged.waste_composition)
    ? merged.waste_composition.slice(0, 12)
    : []
  merged.sanitary_workers_needed.equipment = Array.isArray(merged.sanitary_workers_needed.equipment)
    ? merged.sanitary_workers_needed.equipment.slice(0, 12)
    : []
  merged.hazards.immediate_hazards = Array.isArray(merged.hazards.immediate_hazards)
    ? merged.hazards.immediate_hazards.slice(0, 12)
    : []
  merged.hazards.health_risks = Array.isArray(merged.hazards.health_risks)
    ? merged.hazards.health_risks.slice(0, 12)
    : []
  merged.officer_actions = Array.isArray(merged.officer_actions)
    ? merged.officer_actions.slice(0, 8)
    : []
  merged.citizen_advice = Array.isArray(merged.citizen_advice)
    ? merged.citizen_advice.slice(0, 8)
    : []

  return merged
}

function parseGeminiAnalysisText(analysisText) {
  const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return defaultAnalysis(analysisText)
  }

  try {
    const parsedData = JSON.parse(jsonMatch[0])
    return normalizeAnalysis(parsedData, analysisText)
  } catch {
    return defaultAnalysis(analysisText)
  }
}

function buildVisionPrompt(context = {}) {
  return `You are an expert municipal waste-management analyst.

Analyze the complaint image and complaint metadata together. Return only valid JSON with this exact structure:

{
  "waste_type": "one of plastic, organic, metal, paper, glass, mixed, hazardous, electronic, construction, other",
  "waste_composition": ["specific visible waste items"],
  "estimated_volume": {
    "amount": "number",
    "unit": "kg or m3",
    "description": "brief explanation"
  },
  "sanitary_workers_needed": {
    "minimum": "number",
    "recommended": "number",
    "equipment": ["required tools and PPE"]
  },
  "hazards": {
    "immediate_hazards": ["immediate risks"],
    "environmental_impact": "short paragraph",
    "health_risks": ["health risks to public/workers"],
    "contamination_risk": "low|medium|high|critical"
  },
  "cleanup_priority": "low|medium|high|critical",
  "severity_score": "integer 1..10",
  "urgency_level": "low|medium|high|critical",
  "confidence": "0..100",
  "location_characteristics": "site characteristics inferred from image/context",
  "officer_summary": "2-3 sentence operational summary for municipal officer",
  "officer_actions": ["4-6 prioritized operational actions for officers"],
  "citizen_summary": "1-2 sentence update understandable for citizen",
  "citizen_advice": ["2-4 practical safety tips for nearby citizens"]
}

Complaint metadata:
${buildContextBlock(context)}

Rules:
- Severity score must be from 1 to 10 only.
- Keep priorities realistic based on visible risk and context.
- Include both officer-facing and citizen-facing guidance.
- Output JSON only. No markdown.`
}

/**
 * Analyzes an image using Google Gemini API
 * @param {string} imagePath - Path to the image file
 * @param {Object} complaintContext - complaint metadata (title/description/location/severity)
 * @returns {Promise<Object>} Analysis results including waste type, severity, etc.
 */
export const analyzeWasteImage = async (imagePath, complaintContext = {}) => {
  try {
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`)
    }

    // Read the image file and convert to base64
    const imageData = fs.readFileSync(imagePath)
    const base64Image = imageData.toString('base64')

    // Determine the media type based on file extension
    const ext = path.extname(imagePath).toLowerCase()
    let mimeType = 'image/jpeg'
    if (ext === '.png') mimeType = 'image/png'
    else if (ext === '.webp') mimeType = 'image/webp'
    else if (ext === '.gif') mimeType = 'image/gif'

    // Call Gemini Vision API
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = buildVisionPrompt(complaintContext)

    const response = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
      prompt,
    ])

    const analysisText = response.response.text()
    const analysis = parseGeminiAnalysisText(analysisText)

    return {
      success: true,
      waste_type: analysis.waste_type,
      waste_composition: analysis.waste_composition || [],
      estimated_volume: analysis.estimated_volume || {},
      sanitary_workers_needed: analysis.sanitary_workers_needed || {},
      hazards: analysis.hazards || {},
      severity_score: analysis.severity_score,
      urgency_level: analysis.urgency_level || 'medium',
      confidence: analysis.confidence,
      location_characteristics: analysis.location_characteristics,
      cleanup_priority: analysis.cleanup_priority,
      officer_summary: analysis.officer_summary,
      officer_actions: analysis.officer_actions,
      citizen_summary: analysis.citizen_summary,
      citizen_advice: analysis.citizen_advice,
      rawAnalysis: analysisText,
      analyzedAt: new Date(),
    }
  } catch (error) {
    console.error('Gemini analysis error:', error.message)
    return {
      success: false,
      error: error.message,
      waste_type: 'mixed',
      severity_score: 5,
      urgency_level: 'medium',
      confidence: 0,
    }
  }
}

/**
 * Analyzes waste from a URL (for external images)
 * @param {string} imageUrl - URL of the image
 * @param {Object} complaintContext - complaint metadata (title/description/location/severity)
 * @returns {Promise<Object>} Analysis results
 */
export const analyzeWasteImageFromUrl = async (imageUrl, complaintContext = {}) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = buildVisionPrompt(complaintContext)

    const response = await model.generateContent([
      {
        fileData: {
          mimeType: 'image/jpeg',
          fileUri: imageUrl,
        },
      },
      prompt,
    ])

    const analysisText = response.response.text()
    const analysis = parseGeminiAnalysisText(analysisText)

    return {
      success: true,
      waste_type: analysis.waste_type,
      waste_composition: analysis.waste_composition || [],
      estimated_volume: analysis.estimated_volume || {},
      sanitary_workers_needed: analysis.sanitary_workers_needed || {},
      hazards: analysis.hazards || {},
      severity_score: analysis.severity_score,
      urgency_level: analysis.urgency_level,
      confidence: analysis.confidence,
      location_characteristics: analysis.location_characteristics,
      cleanup_priority: analysis.cleanup_priority,
      officer_summary: analysis.officer_summary,
      officer_actions: analysis.officer_actions,
      citizen_summary: analysis.citizen_summary,
      citizen_advice: analysis.citizen_advice,
      rawAnalysis: analysisText,
      analyzedAt: new Date(),
    }
  } catch (error) {
    console.error('Gemini URL analysis error:', error.message)
    return {
      success: false,
      error: error.message,
      waste_type: 'mixed',
      severity_score: 5,
      urgency_level: 'medium',
      confidence: 0,
    }
  }
}
