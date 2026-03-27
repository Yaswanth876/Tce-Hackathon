# 🚀 Aqro - Complete Setup Guide

This guide walks you through setting up the entire Aqro platform with Gemini AI image analysis for waste complaints.

## Project Structure

```
Tce-Hackathon/
├── frontend/          # React + Vite UI
├── backend/           # Express.js + MongoDB API (NEW!)
├── voice bot/         # Next.js voice bot
└── README.md
```

## Prerequisites

Install globally:
- **Node.js 16+** - [Download](https://nodejs.org/)
- **MongoDB** - [Download Community Edition](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **npm** - Comes with Node.js

## Quick Start (5 minutes)

### Step 1: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and add:
# - MongoDB connection string
# - Gemini API key (from https://aistudio.google.com/app/apikeys)
```

**Update backend/.env:**
```
MONGODB_URI=mongodb://localhost:27017/aqro
GEMINI_API_KEY=your_actual_gemini_key_here
PORT=5000
CORS_ORIGIN=http://localhost:5173
```

**Start MongoDB:**
```bash
# Windows - if you have MongoDB Community Edition installed:
mongod

# Or use MongoDB Atlas (cloud)
```

**Start Backend Server:**
```bash
npm run dev
# Server runs on http://localhost:5000
```

### Step 2: Frontend Setup

```bash
cd frontend

# Install dependencies (skip if already done)
npm install

# Create .env file (if needed)
cp .env.example .env

# Start development server
npm run dev
# Frontend runs on http://localhost:5173
```

## API Usage

### Upload a Complaint with Image

The system automatically:
1. ✅ Saves the uploaded image
2. ✅ Analyzes it with Google Gemini AI
3. ✅ Extracts waste type and severity
4. ✅ Stores results in MongoDB

**Frontend Flow:**
```
User uploads image → 
Click "Capture Location" → 
Submit form → 
Backend receives file → 
Gemini analyzes → 
Results stored → 
Success message
```

### Example Response

```json
{
  "success": true,
  "message": "Complaint created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Garbage pile at market",
    "imagePath": "uploads/garbage-1234567.jpg",
    "ai_analysis": {
      "waste_type": "mixed",
      "severity_score": 8,
      "urgency_level": "high",
      "confidence": 92,
      "analyzedAt": "2024-03-27T10:30:00Z"
    },
    "location": {
      "lat": 28.6139,
      "lng": 77.2090
    }
  }
}
```

## Features

### 🎯 For Citizens
- ✅ Upload image of waste complaint
- ✅ Automatic location capture
- ✅ AI analyzes severity automatically
- ✅ Real-time feedback

### 🔧 For Admins
- ✅ View all complaints with AI analysis
- ✅ Filter by status, category, date
- ✅ Assign teams to complaints
- ✅ Update complaint status

### 🤖 AI Features
- ✅ **Waste Type Detection**: plastic, organic, metal, paper, glass, hazardous, mixed
- ✅ **Severity Scoring**: 1-10 scale (1=minimal, 10=critical)
- ✅ **Urgency Classification**: low, medium, high, critical
- ✅ **Confidence Scoring**: 0-100% confidence in analysis

## Troubleshooting

### MongoDB not connecting?
```bash
# Check if MongoDB is running
mongo

# If not running, start it:
mongod

# Or use MongoDB Atlas cloud service
```

### Gemini API not working?
```
1. Visit: https://aistudio.google.com/app/apikeys
2. Create new API key
3. Copy to backend/.env as GEMINI_API_KEY
4. Restart backend server
```

### Images not uploading?
```bash
# Check that uploads directory exists
mkdir -p backend/uploads

# Check file permissions
# File size should be < 5MB
# Supported formats: JPEG, PNG, WebP
```

### CORS errors?
```
frontend: http://localhost:5173
backend: http://localhost:5000

Update backend/.env:
CORS_ORIGIN=http://localhost:5173
```

## Environment Files

### backend/.env
```
MONGODB_URI=mongodb://localhost:27017/aqro
GEMINI_API_KEY=your_key_here
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads
```

### frontend/.env
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=your_maps_key (optional)
```

## Database Schema

**Complaints Collection:**
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  imagePath: String,           // Uploaded file location
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  ai_analysis: {               // Gemini results
    waste_type: String,        // "plastic", "mixed", etc.
    severity_score: Number,    // 1-10
    urgency_level: String,     // "high", "critical", etc.
    confidence: Number,        // 0-100
    analyzedAt: Date
  },
  status: String,              // "pending", "assigned", etc.
  createdBy: String,
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

```
GET  /api/complaints              → List all complaints
GET  /api/complaints/:id          → Get single complaint
POST /api/complaints              → Create (with file upload)
PATCH /api/complaints/:id         → Update status/notes
DELETE /api/complaints/:id        → Delete complaint
GET  /api/health                  → Health check
```

## Testing

### Test the Backend

```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Get all complaints
curl http://localhost:5000/api/complaints

# Create complaint (with image upload)
curl -X POST http://localhost:5000/api/complaints \
  -F "image=@path/to/image.jpg" \
  -F "title=Test complaint" \
  -F "description=Test" \
  -F "location={\"lat\": 28.6, \"lng\": 77.2}"
```

### Test the Frontend

1. Open http://localhost:5173
2. Navigate to "File Complaint"
3. Upload an image
4. Click "Capture Location"
5. Submit the form
6. Check MongoDB for the complaint with AI analysis

## Performance Notes

- **Image Analysis**: 2-5 seconds per image (depends on Gemini API)
- **Database**: Handles thousands of complaints efficiently
- **File Size**: Optimized for images under 3MB

## Production Deployment

### For Production, Update:

**backend/.env:**
```
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
GEMINI_API_KEY=your_production_key
CORS_ORIGIN=https://your-frontend-domain.com
```

**frontend/.env:**
```
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

Additional steps:
- [ ] Enable HTTPS/TLS
- [ ] Set up authentication middleware
- [ ] Implement rate limiting
- [ ] Add input validation and sanitization
- [ ] Monitor logs and errors
- [ ] Set up database backups
- [ ] Use environment variable management tool

## Support

For help with:
- **Gemini API**: [AI Studio Help](https://support.google.com/aistudio)
- **MongoDB**: [MongoDB Docs](https://docs.mongodb.com/)
- **Express**: [Express.js Guide](https://expressjs.com/)
- **React**: [React Docs](https://react.dev/)

## What's Next?

After setup, you can:
- [ ] Implement authentication system
- [ ] Add admin dashboard filters
- [ ] Create worker assignment system
- [ ] Build predictive analytics
- [ ] Integrate payment system for rewards
- [ ] Add mobile app
