import mongoose from 'mongoose'

const STATUS_VALUES = ['pending', 'analyzing', 'dispatched', 'cleared']

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type:     String,
      required: [true, 'Title is required'],
      trim:     true,
      maxlength: 200,
    },
    category: {
      type:    String,
      trim:    true,
      default: 'General',
    },
    severity: {
      type:    String,
      trim:    true,
      default: 'medium',
    },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    image_url: {
      type:    String,
      default: null,
    },
    status: {
      type:    String,
      enum:    STATUS_VALUES,
      default: 'pending',
    },
    created_at: {
      type:    Date,
      default: Date.now,
    },
    ai_analysis: {
      severity_score: { type: Number, default: null }, // 1–10
      waste_type:     { type: String, default: null },
      urgency_level:  { type: String, default: null }, // low | medium | high
    },
  },
  {
    toJSON:   { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
)

// Fast latest-first queries
complaintSchema.index({ created_at: -1 })

export default mongoose.model('Complaint', complaintSchema)
