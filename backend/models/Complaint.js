import mongoose from 'mongoose'

const STATUS_VALUES = [
  'pending',
  'analyzing',
  'dispatched',
  'cleared',
  'assigned',
  'in-progress',
  'completed',
  'rejected',
]

const PRIORITY_VALUES = ['low', 'medium', 'high', 'critical']

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: 'mixed',
    },
    severity: {
      type: mongoose.Schema.Types.Mixed,
      default: 'medium',
    },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      address: { type: String, default: '' },
    },
    imageUrl: {
      type: String,
      default: null,
    },
    imagePath: {
      type: String,
      default: null,
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
    createdBy: {
      type: String,
      default: 'anonymous',
    },
    assignedTo: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
    ai_analysis: {
      waste_type: { type: String, default: 'mixed' },
      waste_composition: { type: [String], default: [] },
      estimated_volume: {
        amount: { type: Number, default: 0 },
        unit: { type: String, default: 'kg' },
        description: { type: String, default: '' },
      },
      sanitary_workers_needed: {
        minimum: { type: Number, default: 1 },
        recommended: { type: Number, default: 2 },
        equipment: { type: [String], default: [] },
      },
      hazards: {
        immediate_hazards: { type: [String], default: [] },
        environmental_impact: { type: String, default: '' },
        health_risks: { type: [String], default: [] },
        contamination_risk: {
          type: String,
          enum: PRIORITY_VALUES,
          default: 'medium',
        },
      },
      severity_score: { type: Number, min: 1, max: 10, default: 5 },
      urgency_level: {
        type: String,
        enum: PRIORITY_VALUES,
        default: 'medium',
      },
      cleanup_priority: {
        type: String,
        enum: PRIORITY_VALUES,
        default: 'medium',
      },
      location_characteristics: { type: String, default: '' },
      confidence: { type: Number, min: 0, max: 100, default: 0 },
      officer_summary: { type: String, default: '' },
      officer_actions: { type: [String], default: [] },
      citizen_summary: { type: String, default: '' },
      citizen_advice: { type: [String], default: [] },
      rawAnalysis: { type: String, default: '' },
      analyzedAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
)

// Fast latest-first queries
complaintSchema.index({ created_at: -1 })

export default mongoose.model('Complaint', complaintSchema)
