import mongoose from 'mongoose'

<<<<<<< HEAD
=======
const STATUS_VALUES = ['pending', 'analyzing', 'dispatched', 'cleared']

>>>>>>> 3cf3e3436989c3f348a1475a2bde189aefc35263
const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
<<<<<<< HEAD
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
=======
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    severity: {
      type: String,
      trim: true,
      default: 'medium',
    },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    image_url: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: STATUS_VALUES,
      default: 'pending',
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    ai_analysis: {
      severity_score: { type: Number, default: null }, // 1–10
      waste_type:     { type: String, default: null },
      urgency_level:  { type: String, default: null }, // low | medium | high
    },
  },
  {
    // expose virtual id field and hide __v
    toJSON:   { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
)

// Index for fast latest-first queries
complaintSchema.index({ created_at: -1 })

export default mongoose.model('Complaint', complaintSchema)
>>>>>>> 3cf3e3436989c3f348a1475a2bde189aefc35263
