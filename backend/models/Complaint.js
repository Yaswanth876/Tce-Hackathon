import mongoose from 'mongoose'

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
    },
    imagePath: {
      type: String, // Local file path for uploaded images
    },
    location: {
      lat: Number,
      lng: Number,
      address: String,
    },
    severity: {
      type: Number,
      min: 0,
      max: 10,
      default: 5,
    },
    category: {
      type: String,
      enum: [
        'plastic',
        'organic',
        'metal',
        'paper',
        'glass',
        'mixed',
        'hazardous',
        'other',
      ],
      default: 'mixed',
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in-progress', 'completed', 'rejected'],
      default: 'pending',
    },
    createdBy: {
      type: String,
      default: 'anonymous',
    },
    assignedTo: String,
    notes: String,
    // AI Analysis Results
    ai_analysis: {
      waste_type: String,
      waste_composition: [String],  // List of waste items identified
      estimated_volume: {
        amount: Number,
        unit: String,  // kg, m³, etc.
        description: String,
      },
      sanitary_workers_needed: {
        minimum: Number,
        recommended: Number,
        equipment: [String],
      },
      hazards: {
        immediate_hazards: [String],
        environmental_impact: String,
        health_risks: [String],
        contamination_risk: {
          type: String,
          enum: ['low', 'medium', 'high', 'critical'],
        },
      },
      severity_score: Number,
      urgency_level: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
      },
      cleanup_priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
      },
      location_characteristics: String,  // e.g., "near residential area", "market area"
      confidence: Number,  // 0-100
      rawAnalysis: String,  // Full Gemini response
      analyzedAt: Date,
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
    },
    updatedAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  { timestamps: true }
)

const Complaint = mongoose.model('Complaint', complaintSchema)
export default Complaint
