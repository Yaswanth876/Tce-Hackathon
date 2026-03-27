# Architecture & System Flow

## Complete System Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│                       AQRO - Waste Management System                     │
│                     with Gemini AI Image Analysis                        │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                           │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ File Complaint Page (UploadForm.jsx)                              │ │
│  │                                                                    │ │
│  │  1. User selects image (JPEG/PNG/WebP, max 5MB)                 │ │
│  │  2. Click "Capture Location" → Get GPS coords                   │ │
│  │  3. Submit form                                                  │ │
│  │                                                                    │ │
│  │  ImageFile + Location Coords                                    │ │
│  │         │                                                         │ │
│  │         ▼                                                         │ │
│  │  complaintService.createComplaint()                             │ │
│  │         │                                                         │ │
│  │         ▼                                                         │ │
│  │  FormData (multipart)                                           │ │
│  │  ├─ image: <File>                                               │ │
│  │  ├─ title: "Image Report"                                       │ │
│  │  ├─ location: {lat, lng, address}                               │ │
│  │  └─ category: "mixed"                                           │ │
│  │                                                                    │ │
│  │  POST http://localhost:5000/api/complaints                      │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Complaint Card (ComplaintCard.jsx)                                 │ │
│  │                                                                    │ │
│  │  Display AI Analysis Results:                                    │ │
│  │  🤖 Type: plastic / mixed / organic / etc.                       │ │
│  │  📊 Score: 8/10 (severity)                                       │ │
│  │  ⚡ Urgency: critical / high / medium / low                      │ │
│  │  🎯 Confidence: 92%                                              │ │
│  │                                                                    │ │
│  │  Status Badge: pending / assigned / completed                    │ │
│  │  Location Pin: Latitude, Longitude                               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTP/REST
                                  │ multipart/form-data
                                  │ + JSON
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    BACKEND (Express.js API)                              │
│                    http://localhost:5000/api                             │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Routes: complaints.js                                               │ │
│  │                                                                    │ │
│  │ POST /api/complaints                                              │ │
│  │  │                                                                │ │
│  │  ├─ 1️⃣  Extract form data from request                           │ │
│  │  ├─ 2️⃣  Parse location JSON                                      │ │
│  │  ├─ 3️⃣  Create ComplaintData object                              │ │
│  │  │        {                                                       │ │
│  │  │          title, description, category, location,              │ │
│  │  │          createdBy, ai_analysis: {severity, type}             │ │
│  │  │        }                                                       │ │
│  │  │                                                                │ │
│  │  ├─ 4️⃣  Check if file uploaded or URL provided                  │ │
│  │  │                                                                │ │
│  │  └─ 5️⃣  Call analyzeWasteImage(file.path)  ◄────┐               │ │
│  │                                                  │               │ │
│  │  GET /api/complaints (list)                      │               │ │
│  │  GET /api/complaints/:id (single)                │               │ │
│  │  PATCH /api/complaints/:id (update)              │               │ │
│  │  DELETE /api/complaints/:id (delete)             │               │ │
│  │  GET /api/health (status check)                  │               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Gemini Service: services/geminiService.js                          │ │
│  │                                                                    │ │
│  │ analyzeWasteImage(imagePath)                          ◄─────┐    │ │
│  │  │                                                          │    │ │
│  │  ├─ 1️⃣  Read image file from uploads/                      │    │ │
│  │  │        uploads/garbage-1234567890-xxx.jpg             │    │ │
│  │  │                                                          │    │ │
│  │  ├─ 2️⃣  Convert to base64                                  │    │ │
│  │  │                                                          │    │ │
│  │  ├─ 3️⃣  Call Gemini API:                                  │    │ │
│  │  │        model: gemini-2.0-flash                          │    │ │
│  │  │        content: [image + prompt]                        │    │ │
│  │  │                                                          │    │ │
│  │  │        Prompt: "Analyze waste in this image"            │    │ │
│  │  │        Required: waste_type, severity_score,            │    │ │
│  │  │                  urgency_level, confidence              │    │ │
│  │  │                                                          │    │ │
│  │  ├─ 4️⃣  Parse Gemini response JSON                        │    │ │
│  │  │                                                          │    │ │
│  │  ├─ 5️⃣  Return analysis object:                           │    │ │
│  │  │        {                                                 │    │ │
│  │  │          waste_type: "plastic",                          │    │ │
│  │  │          severity_score: 8,                              │    │ │
│  │  │          urgency_level: "high",                          │    │ │
│  │  │          confidence: 94,                                 │    │ │
│  │  │          rawAnalysis: "Full Gemini response text",       │    │ │
│  │  │          analyzedAt: 2024-03-27T10:30:00Z               │    │ │
│  │  │        }                                                 │    │ │
│  │  │                                                          │    │ │
│  │  └─ 6️⃣  Return to POST handler                            │    │ │
│  │                                                              │    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Models: Complaint.js                                               │ │
│  │                                                                    │ │
│  │ Schema {                                                           │ │
│  │   title: String,                                                  │ │
│  │   description: String,                                            │ │
│  │   imagePath: String,         // Path to uploaded file             │ │
│  │   imageUrl: String,          // External URL                      │ │
│  │   location: { lat, lng, address },                                │ │
│  │   category: String,                                               │ │
│  │   status: String,            // pending, assigned, etc.           │ │
│  │   createdBy: String,                                              │ │
│  │   ai_analysis: {             // ◄─ Results from Gemini            │ │
│  │     severity_score: Number,                                       │ │
│  │     waste_type: String,                                           │ │
│  │     urgency_level: String,                                        │ │
│  │     confidence: Number,                                           │ │
│  │     rawAnalysis: String,                                          │ │
│  │     analyzedAt: Date                                              │ │
│  │   },                                                               │ │
│  │   createdAt: Date,                                                │ │
│  │   updatedAt: Date                                                 │ │
│  │ }                                                                  │ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│      MongoDB Database        │  │   Google Gemini API          │
│                              │  │                              │
│  Database: aqro              │  │  gemini-2.0-flash model      │
│  Collection: complaints      │  │  Vision capabilities         │
│                              │  │  Waste classification        │
│  Document: {                 │  │  Severity analysis           │
│   _id: ObjectId,             │  │                              │
│   title: "...",              │  │  Input: Image + Prompt       │
│   ai_analysis: {             │  │  Output: JSON Analysis       │
│     waste_type: "plastic",   │  │                              │
│     severity_score: 8,       │  │  API Key: GEMINI_API_KEY     │
│     urgency_level: "high",   │  │                              │
│     confidence: 94           │  │                              │
│   }                          │  │                              │
│  }                           │  │                              │
│                              │  │                              │
└──────────────────────────────┘  └──────────────────────────────┘
```

## Data Flow (Step by Step)

### 1. IMAGE UPLOAD
```
User clicks "File Complaint" page
       ↓
Select image file (JPEG/PNG/WebP, <5MB)
       ↓
Click "Capture Location" button
       ↓
Browser requests GPS permission
       ↓
Coordinates captured (lat, lng)
       ↓
User clicks "Submit" button
```

### 2. SUBMIT TO BACKEND
```
complaintService.createComplaint({
  imageFile: File,           // Binary file object
  location: {lat, lng},      // GPS coordinates
  title: "Image Report",     // Default
  category: "mixed"          // Default
})
       ↓
Creates FormData object:
  image: imageFile
  title: "Image Report"
  location: JSON string
       ↓
POST /api/complaints (multipart/form-data)
```

### 3. BACKEND PROCESSES FILE
```
Express receives request
       ↓
Multer middleware:
  - Validates file type (image/jpeg, image/png, image/webp)
  - Validates file size (<5MB)
  - Saves to uploads/ directory
       ↓
req.file.path = "uploads/image-1234567890-xxx.jpg"
```

### 4. GEMINI AI ANALYSIS
```
analyzeWasteImage(imagePath)
       ↓
Read file and encode to base64
       ↓
Call GoogleGenerativeAI (gemini-2.0-flash)
       ↓
Send prompt:
  "Analyze this waste image and return JSON with:
   - waste_type: (plastic/organic/metal/etc.)
   - severity_score: (1-10)
   - urgency_level: (low/medium/high/critical)
   - confidence: (0-100)"
       ↓
Gemini processes image with vision model
       ↓
Gemini returns analysis JSON
{
  "waste_type": "plastic",
  "severity_score": 8,
  "urgency_level": "high",
  "confidence": 94,
  "description": "Large accumulation of plastic bags..."
}
```

### 5. SAVE TO DATABASE
```
Create Complaint document with:
  - title, description, location
  - imagePath: "uploads/..."
  - category: "mixed"
  - ai_analysis: {
      waste_type: "plastic",
      severity_score: 8,
      urgency_level: "high",
      confidence: 94,
      analyzedAt: Date.now()
    }
       ↓
Save to MongoDB (aqro.complaints collection)
       ↓
Generate _id (ObjectId)
```

### 6. RETURN TO FRONTEND
```
Response JSON:
{
  "success": true,
  "message": "Complaint created successfully",
  "data": {
    "_id": "507f1f77...",
    "ai_analysis": {
      "waste_type": "plastic",
      "severity_score": 8,
      ...
    }
  }
}
       ↓
Frontend displays success message
       ↓
Shows AI analysis results
       ↓
Redirects to complaint detail view
```

## Failure Handling

```
If image analysis fails:
  - Complaint still created
  - ai_analysis.confidence = 0
  - Uses default values:
    waste_type: "mixed"
    severity_score: 5
    urgency_level: "medium"
  - error field populated with reason

If MongoDB fails:
  - Frontend fallback to localStorage
  - User can retry later

If Gemini API fails:
  - Server logs error
  - Complaint saved without analysis
  - Admin can manually review later
```

## Performance Timeline

```
User uploads: 0ms
Server receives: 100ms
Gemini analysis: 2000-5000ms  ← Network dependent
Database save: 50ms
Response to frontend: 2150-5150ms total

Typical: ~3-4 seconds for user
```

## Environment Configuration

```
frontend (.env):
  VITE_API_BASE_URL=http://localhost:5000/api

backend (.env):
  MONGODB_URI=mongodb://localhost:27017/aqro
  GEMINI_API_KEY=sk-proj-xxx...xxx
  PORT=5000
  CORS_ORIGIN=http://localhost:5173
  MAX_FILE_SIZE=5242880
  UPLOAD_DIR=./uploads
```

## Files Generated/Modified

```
Created Files:
- backend/server.js
- backend/config/db.js
- backend/config/multer.js
- backend/models/Complaint.js
- backend/services/geminiService.js
- backend/routes/complaints.js
- backend/package.json
- backend/.env.example

Modified Files:
- frontend/src/api/complaintService.js (FormData support)
- frontend/src/components/UploadForm.jsx (Send actual file)
- frontend/src/components/ComplaintCard.jsx (Show AI results)

Documentation:
- backend/README.md
- SETUP_GUIDE.md
- GEMINI_INTEGRATION_GUIDE.md
- ARCHITECTURE.md (this file)
```
