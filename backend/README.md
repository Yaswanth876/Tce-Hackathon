# Aqro Backend - Complaint Management System with AI Image Analysis

A Node.js/Express backend service for the Aqro waste management platform that analyzes complaint images using Google Gemini AI.

## Features

✅ **Express.js REST API** - Simple and consistent endpoints
✅ **MongoDB Integration** - Persistent complaint storage
✅ **File Upload Handling** - Secure image uploads with validation
✅ **Google Gemini AI Integration** - Automatic waste classification and severity analysis
✅ **CORS Support** - Frontend integration ready
✅ **Error Handling** - Comprehensive error responses

## Prerequisites

- Node.js 16+ and npm
- MongoDB server running locally or remote connection string
- Google Gemini API key (free tier available)

## Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and update with your values:

```bash
cp .env.example .env
```

Edit `.env` with:

```
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/aqro

# Gemini API - Get from: https://aistudio.google.com/app/apikeys
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads
```

### 3. Get Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikeys)
2. Click "Create API Key"
3. Copy the key and paste into `.env`

### 4. Start MongoDB

Make sure MongoDB is running:

```bash
# On Windows (if using MongoDB Community Edition):
mongod

# Or use MongoDB Atlas (cloud):
# Update MONGODB_URI in .env with your connection string
```

## Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Get All Complaints

```http
GET /api/complaints
```

Query parameters:
- `status` - Filter by status (pending, assigned, in-progress, completed, rejected)
- `category` - Filter by category (plastic, organic, metal, paper, glass, mixed, hazardous, other)
- `createdBy` - Filter by creator

Response:
```json
{
  "success": true,
  "data": [...],
  "count": 42
}
```

### Get Single Complaint

```http
GET /api/complaints/:id
```

Response:
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Garbage pile at market",
    "description": "Large accumulation of waste",
    "imagePath": "uploads/garbage-12345.jpg",
    "location": {
      "lat": 28.6139,
      "lng": 77.2090,
      "address": "New Delhi"
    },
    "ai_analysis": {
      "waste_type": "mixed",
      "severity_score": 8,
      "urgency_level": "high",
      "confidence": 92,
      "analyzedAt": "2024-03-27T10:30:00Z"
    },
    "status": "pending",
    "createdAt": "2024-03-27T10:30:00Z"
  }
}
```

### Create Complaint with Image Upload

```http
POST /api/complaints
Content-Type: multipart/form-data

image: <binary image file>
title: "Complaint title"
description: "Complaint description"
category: "mixed"
location: {"lat": 28.6139, "lng": 77.2090, "address": "Location"}
createdBy: "citizen_name"
severity: 5
```

**The backend will automatically:**
1. Save the uploaded image
2. Analyze it using Google Gemini AI
3. Extract waste type and severity
4. Store the analysis in the database

Response:
```json
{
  "success": true,
  "message": "Complaint created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Complaint title",
    "ai_analysis": {
      "waste_type": "plastic",
      "severity_score": 7,
      "urgency_level": "high",
      "confidence": 95
    }
  }
}
```

### Update Complaint

```http
PATCH /api/complaints/:id
Content-Type: application/json

{
  "status": "assigned",
  "notes": "Team dispatched",
  "assignedTo": "Team A",
  "severity": 6
}
```

### Delete Complaint

```http
DELETE /api/complaints/:id
```

### Health Check

```http
GET /api/health
```

## AI Image Analysis Details

When a complaint is filed with an image, the backend:

1. **Receives** the image file via multipart upload
2. **Validates** file type (JPEG, PNG, WebP) and size (max 5MB)
3. **Analyzes** with Gemini AI using vision capabilities
4. **Extracts** from Gemini response:
   - `waste_type` - one of: plastic, organic, metal, paper, glass, mixed, hazardous, other
   - `severity_score` - 1-10 scale
   - `urgency_level` - low, medium, high, critical
   - `confidence` - 0-100% confidence in the analysis
5. **Stores** analysis results in MongoDB with the complaint
6. **Returns** full analysis immediately in the response

### Example Gemini Analysis Output

```json
{
  "waste_type": "plastic",
  "severity_score": 8,
  "urgency_level": "high",
  "confidence": 94,
  "description": "Large accumulation of plastic waste bags and bottles..."
}
```

## Database Schema

### Complaint Model

```javascript
{
  _id: ObjectId,                    // MongoDB ID
  title: String,
  description: String,
  imagePath: String,                // Path to uploaded file
  imageUrl: String,                 // External URL (if no upload)
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  severity: Number,                 // 1-10
  category: String,                 // mixed, plastic, etc.
  status: String,                   // pending, assigned, etc.
  createdBy: String,
  assignedTo: String,
  notes: String,
  ai_analysis: {
    severity_score: Number,
    waste_type: String,
    urgency_level: String,
    confidence: Number,
    rawAnalysis: String,
    analyzedAt: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling

Errors are returned with appropriate HTTP status codes:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common status codes:
- `201` - Created successfully
- `400` - Bad request (validation error)
- `404` - Resource not found
- `500` - Server error

## Troubleshooting

### MongoDB Connection Error
```
❌ MongoDB connection error: connect ECONNREFUSED
```
- Ensure MongoDB is running: `mongod`
- Check `MONGODB_URI` in `.env`
- Verify connection string syntax

### Gemini API Error
```
Error calling Gemini API
```
- Verify `GEMINI_API_KEY` is in `.env`
- Check that key is valid and not expired
- Ensure proper API enable in Google Cloud Console

### File Upload Error
```
File too large (6.5 MB). Max 5 MB allowed.
```
- Reduce image size before uploading
- Or increase `MAX_FILE_SIZE` in `.env`

### CORS Error
```
Access to XMLHttpRequest has been blocked by CORS policy
```
- Check `CORS_ORIGIN` in `.env` matches your frontend URL
- Default: `http://localhost:5173` (Vite frontend)

## Development

### Project Structure

```
backend/
├── config/
│   ├── db.js          # MongoDB connection
│   └── multer.js      # File upload configuration
├── models/
│   └── Complaint.js   # MongoDB schema
├── routes/
│   └── complaints.js  # API endpoints
├── services/
│   └── geminiService.js  # Gemini AI integration
├── uploads/           # Uploaded images (gitignored)
├── server.js          # Express app setup
├── package.json
├── .env              # Configuration (gitignored)
└── .env.example      # Configuration template
```

## Logging

The server logs important events:

```
📷 Image uploaded: garbage-1711522000000-123456789.jpg
🔍 Analyzing image with Gemini AI...
✅ Image analysis complete: { severity_score: 8, waste_type: 'mixed', ... }
✅ Complaint created with ID: 507f1f77bcf86cd799439011
```

## Performance Notes

- **Image Processing**: Usually completes in 2-5 seconds per image
- **Database**: Indexes are created on `status`, `category`, `createdBy`
- **File Size**: Optimal performance with images under 3MB

## Security Considerations

⚠️ **For Production:**
- Use HTTPS/TLS
- Implement authentication/authorization
- Rate limit API endpoints
- Secure MongoDB with credentials
- Use environment variable management tools
- Validate and sanitize all inputs
- Implement CSRF protection

## Support

For issues with:
- **Gemini API**: Visit [AI Studio Help](https://support.google.com/aistudio)
- **MongoDB**: Check [MongoDB Docs](https://docs.mongodb.com/)
- **Express**: See [Express.js Guide](https://expressjs.com/)

## License

ISC
