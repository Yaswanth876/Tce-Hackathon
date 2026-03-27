# Developer Quick Reference - Gemini Image Analysis

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                     │
│  User uploads image → Captures GPS location → Submits form  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ multipart/form-data
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Express.js)                      │
│                                                              │
│  1. Receive file & validate                                 │
│  2. Save to /uploads directory                              │
│  3. ────────────────────────────────────┐                   │
│     │                                   │                   │
│     └──→ Send to Gemini AI Vision      │                   │
│            "Analyze this waste image"  │                   │
│     │◄────────────────────────────────┘│                   │
│     │                                   │                   │
│     Response: {                         │                   │
│       waste_type: "plastic",            │                   │
│       severity_score: 8,                │                   │
│       urgency_level: "high",            │                   │
│       confidence: 92                    │                   │
│     }                                   │                   │
│                                                              │
│  4. Save complaint + analysis to MongoDB                    │
│  5. Return response to frontend                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ JSON Response
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    MONGODB Database                          │
│                  (Complaint Documents)                       │
└─────────────────────────────────────────────────────────────┘
```

## Request/Response Examples

### 📤 Upload Image Complaint

```bash
curl -X POST http://localhost:5000/api/complaints \
  -H "Content-Type: multipart/form-data" \
  -F "image=@path/to/garbage.jpg" \
  -F "title=Large waste pile" \
  -F "description=Found near market" \
  -F "category=mixed" \
  -F "location={\"lat\": 28.6139, \"lng\": 77.2090, \"address\": \"New Delhi\"}" \
  -F "createdBy=john_doe" \
  -F "severity=5"
```

### 📥 Response

```json
{
  "success": true,
  "message": "Complaint created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Large waste pile",
    "description": "Found near market",
    "imagePath": "uploads/garbage-1711522112100-123456789.jpg",
    "category": "mixed",
    "location": {
      "lat": 28.6139,
      "lng": 77.2090,
      "address": "New Delhi"
    },
    "severity": 5,
    "createdBy": "john_doe",
    "status": "pending",
    "ai_analysis": {
      "severity_score": 8,
      "waste_type": "plastic",
      "urgency_level": "high",
      "confidence": 94,
      "analyzedAt": "2024-03-27T10:34:20.123Z",
      "rawAnalysis": "This image shows a large accumulation of plastic waste bags and bottles..."
    },
    "createdAt": "2024-03-27T10:34:20.123Z",
    "updatedAt": "2024-03-27T10:34:20.123Z"
  }
}
```

## Gemini Image Analysis Flow

### What Gemini Analyzes

```
Input Image → Gemini Vision API → Analysis Results
```

**Gemini Prompt:**
```
You are a waste management expert. Analyze this image of waste and provide:
{
  "waste_type": "one of: plastic, organic, metal, paper, glass, mixed, hazardous, other",
  "severity_score": "number from 1-10",
  "urgency_level": "one of: low, medium, high, critical",
  "confidence": "number from 0-100",
  "description": "brief description"
}
```

**Example Analysis:**
```json
{
  "waste_type": "plastic",
  "severity_score": 8,
  "urgency_level": "high",
  "confidence": 94,
  "description": "Large accumulation of plastic bags, bottles, and packaging waste",
  "rawAnalysis": "This is a concerning image showing primarily plastic waste..."
}
```

## Severity & Urgency Mapping

### Severity Score (1-10)
```
1-2   → Minimal    (small litter, minimal environmental impact)
3-4   → Low        (some trash, manageable)
5-6   → Medium     (noticeable pile of waste)
7-8   → High       (significant accumulation)
9-10  → Critical   (health hazard, blocking area)
```

### Urgency Level Mapping
```
low       ← severity 1-3
medium    ← severity 4-6
high      ← severity 7-8
critical  ← severity 9-10
```

## Common Waste Types

| Type      | Examples                              |
|-----------|---------------------------------------|
| plastic   | Bags, bottles, packaging              |
| organic   | Food waste, leaves, grass             |
| metal     | Cans, wires, aluminum                 |
| paper     | Cardboard, newspapers, tissues        |
| glass     | Bottles, jars, broken glass           |
| mixed     | Multiple types together               |
| hazardous | Chemicals, batteries, electronics    |
| other     | Unknown or other                      |

## Frontend Integration

### Send File Upload

```javascript
// In your React component
const handleUpload = async (imageFile, locationCoords) => {
  const response = await createComplaint({
    title: 'Image Report',
    description: 'User submitted waste image',
    imageFile: imageFile,  // ← Pass the File object
    location: {
      lat: locationCoords.latitude,
      lng: locationCoords.longitude,
      address: 'Captured location'
    },
    category: 'mixed',
    createdBy: 'citizen_name'
  })
  
  // Analysis results available immediately
  console.log('AI Analysis:', response.data.ai_analysis)
  // Output: {
  //   waste_type: "plastic",
  //   severity_score: 8,
  //   urgency_level: "high",
  //   confidence: 94
  // }
}
```

### Display Analysis Results

```jsx
// Display in complaint card
<div className="ai-analysis">
  <p>🤖 Waste Type: {complaint.ai_analysis.waste_type}</p>
  <p>📊 Severity: {complaint.ai_analysis.severity_score}/10</p>
  <p>⚡ Urgency: {complaint.ai_analysis.urgency_level}</p>
  <p>🎯 Confidence: {complaint.ai_analysis.confidence}%</p>
</div>
```

## API Endpoints Cheat Sheet

```bash
# Create complaint with image (AUTO analyzes with Gemini)
POST /api/complaints
  -F image=@file.jpg
  -F title="..."
  -F location="{...}"

# List all complaints
GET /api/complaints
GET /api/complaints?status=pending
GET /api/complaints?category=plastic

# Get single complaint
GET /api/complaints/:id

# Update complaint
PATCH /api/complaints/:id
  -d { "status": "assigned", "assignedTo": "Team A" }

# Delete complaint
DELETE /api/complaints/:id

# Health check
GET /api/health
```

## Error Handling

### File Upload Errors

```json
{
  "success": false,
  "message": "Failed to create complaint",
  "error": "Only JPEG, PNG, and WebP images are allowed"
}
```

### Gemini Analysis Errors

If Gemini fails:
- ✅ Backend continues with default values
- ✅ Complaint is still saved
- ✅ AI analysis may have confidence: 0

```json
{
  "success": true,
  "data": {
    "ai_analysis": {
      "waste_type": "mixed",
      "severity_score": 5,
      "urgency_level": "medium",
      "confidence": 0,
      "error": "Failed to analyze image"
    }
  }
}
```

### MongoDB Errors

```json
{
  "success": false,
  "message": "Failed to create complaint",
  "error": "MongoDB connection refused"
}
```

## Performance Metrics

| Operation | Time | Notes |
|-----------|------|-------|
| Image Upload | 100ms | Depends on file size |
| Gemini Analysis | 2-5s | API latency |
| Database Save | 50ms | Index on status |
| Total Request | 2.5-5.5s | User-perceived |

## Debugging Tips

### Check if Backend is Running
```bash
curl http://localhost:5000/api/health
# Should return: { "status": "Server is running" }
```

### View Uploaded Images
```bash
ls backend/uploads/
# Files like: garbage-1711522112100-123456789.jpg
```

### Check MongoDB Connection
```bash
# In MongoDB shell or MongoDB Atlas
db.complaints.find().limit(1)
```

### Enable Logging
```bash
# In backend/.env
NODE_ENV=development

# Logs include:
# 📷 Image uploaded: filename
# 🔍 Analyzing image with Gemini AI...
# ✅ Image analysis complete: {...}
```

### Test Gemini API Directly
```bash
# Visit https://aistudio.google.com/app/prompts/
# Upload an image and test the prompt
```

## Common Issues & Solutions

### ❌ "Only JPEG, PNG, and WebP images are allowed"
- File type is not supported
- Solution: Convert to JPEG, PNG, or WebP

### ❌ "File too large (6.5 MB). Max 5 MB allowed"
- File exceeds size limit
- Solution: Compress image or adjust MAX_FILE_SIZE

### ❌ "Gemini analysis failed"
- API key is invalid
- API quota exceeded
- Network error
- Solution: Check GEMINI_API_KEY in .env

### ❌ "MongoDB connection error"
- MongoDB not running
- Connection string invalid
- Wrong credentials
- Solution: Check MONGODB_URI and start mongod

## Next Steps

- [ ] Implement authentication
- [ ] Add user dashboard to view their complaints
- [ ] Create admin dashboard with analytics
- [ ] Add complaint status notifications
- [ ] Integrate with worker assignment system
- [ ] Create leaderboard for reporters
