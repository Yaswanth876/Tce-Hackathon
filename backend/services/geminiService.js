import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import path from 'path'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

/**
 * Analyzes an image using Google Gemini API
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<Object>} Analysis results including waste type, severity, etc.
 */
export const analyzeWasteImage = async (imagePath) => {
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

    const prompt = `You are an expert waste management consultant. Analyze this image of waste and provide comprehensive information in JSON format:

{
  "waste_type": "primary type: one of plastic, organic, metal, paper, glass, mixed, hazardous, electronic, construction, other",
  "waste_composition": ["list of specific items visible: e.g., plastic bags, bottles, food waste, etc."],
  "estimated_volume": {
    "amount": "number",
    "unit": "cubic meters or kilograms - give realistic estimate",
    "description": "e.g., 'approximately 50 kg of mixed waste, roughly 0.3 cubic meters'"
  },
  "sanitary_workers_needed": {
    "minimum": "minimum number of workers needed",
    "recommended": "recommended number of workers for efficient cleanup",
    "equipment": ["list of equipment needed: e.g., gloves, masks, trucks, bins, etc."]
  },
  "hazards": {
    "immediate_hazards": ["list of immediate health/safety risks visible"],
    "environmental_impact": "description of environmental impact",
    "health_risks": ["list of potential health risks to cleanup workers and public"],
    "contamination_risk": "level: low, medium, high, critical - risk of soil/water contamination"
  },
  "cleanup_priority": "urgency level: low, medium, high, critical",
  "severity_score": "number from 1-10 (1=minimal garbage, 10=severe health hazard)",
  "confidence": "number from 0-100 representing analysis confidence",
  "location_characteristics": "visible area characteristics: e.g., street corner, residential area, near water body, market area, etc.",
  "description": "detailed description of the waste situation and urgency"
}

Be thorough and accurate. Consider:
- Actual volume based on visual comparison (if person/objects visible for scale)
- Team size based on estimated volume and waste type
- All visible hazards (broken glass, sharp objects, chemical spills, bio-hazards)
- Environmental risk (near water, residential area, market)
- Health risks to workers and public
Return valid JSON only.`

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

    // Parse the JSON response
    let analysis = {
      waste_type: 'mixed',
      waste_composition: [],
      estimated_volume: {
        amount: 10,
        unit: 'kg',
        description: 'Unknown amount'
      },
      sanitary_workers_needed: {
        minimum: 2,
        recommended: 3,
        equipment: ['gloves', 'masks', 'safety vests']
      },
      hazards: {
        immediate_hazards: [],
        environmental_impact: 'Unknown',
        health_risks: [],
        contamination_risk: 'medium'
      },
      severity_score: 5,
      urgency_level: 'medium',
      confidence: 50,
      location_characteristics: 'Unknown',
      description: analysisText,
    }

    try {
      // Try to extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0])
        analysis = {
          ...analysis,
          ...parsedData,
          // Ensure values are within valid ranges
          severity_score: Math.min(10, Math.max(1, parseInt(parsedData.severity_score) || 5)),
          confidence: Math.min(100, Math.max(0, parseInt(parsedData.confidence) || 50)),
        }
      }
    } catch (e) {
      console.warn('Failed to parse JSON from Gemini response, using defaults')
    }

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
 * @returns {Promise<Object>} Analysis results
 */
export const analyzeWasteImageFromUrl = async (imageUrl) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = `You are an expert waste management consultant. Analyze this image of waste and provide comprehensive information in JSON format:

{
  "waste_type": "primary type: one of plastic, organic, metal, paper, glass, mixed, hazardous, electronic, construction, other",
  "waste_composition": ["list of specific items visible: e.g., plastic bags, bottles, food waste, etc."],
  "estimated_volume": {
    "amount": "number",
    "unit": "cubic meters or kilograms - give realistic estimate",
    "description": "e.g., 'approximately 50 kg of mixed waste'"
  },
  "sanitary_workers_needed": {
    "minimum": "minimum number of workers needed",
    "recommended": "recommended number of workers",
    "equipment": ["list of equipment needed"]
  },
  "hazards": {
    "immediate_hazards": ["list of immediate risks"],
    "environmental_impact": "description of environmental impact",
    "health_risks": ["list of potential health risks"],
    "contamination_risk": "level: low, medium, high, critical"
  },
  "cleanup_priority": "urgency level: low, medium, high, critical",
  "severity_score": "number from 1-10",
  "confidence": "number from 0-100",
  "location_characteristics": "visible area characteristics",
  "description": "detailed description"
}

Return valid JSON only.`

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

    let analysis = {
      waste_type: 'mixed',
      waste_composition: [],
      estimated_volume: { amount: 10, unit: 'kg' },
      sanitary_workers_needed: { minimum: 2, recommended: 3, equipment: [] },
      hazards: { immediate_hazards: [], environmental_impact: '', health_risks: [], contamination_risk: 'medium' },
      severity_score: 5,
      urgency_level: 'medium',
      confidence: 50,
    }

    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0])
        analysis = { ...analysis, ...parsedData }
      }
    } catch (e) {
      console.warn('Failed to parse JSON from Gemini response')
    }

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
