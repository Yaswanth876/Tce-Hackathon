# Aqro  – Civic Sanitation Intelligence

**Government of Tamil Nadu**  
**Madurai Municipal Corporation**

## Overview

Aqro  is an official government portal for citizen-driven sanitation reporting and grievance redressal. The system enables real-time waste management monitoring, AI-powered hotspot detection, and workforce allocation for the Madurai Municipal Corporation.

## Features

- **Citizen Complaint Filing**: Geo-tagged image uploads with real-time processing
- **Officer Dashboard**: Comprehensive analytics and monitoring
- **AI-Powered Analysis**: Automated waste detection and classification
- **Hotspot Detection**: Pattern recognition for repeated dumping zones
- **Workforce Management**: Intelligent allocation of sanitation workers
- **Predictive Analytics**: Garbage accumulation forecasting

## Technology Stack

- **Frontend**: React + Vite
- **Backend**: Firebase (Firestore, Storage, Cloud Functions)
- **Styling**: Tailwind CSS v4
- **AI/ML**: Google Gemini API

## Design System

This application follows the official Tamil Nadu Government design guidelines:

- **Primary Color**: Deep Government Blue (#104080)
- **Background**: Subtle Grey (#f4f6f9)
- **Alert Color**: Government Red (#B22222)
- **Typography**: Clean sans-serif (Inter, Noto Sans)
- **Design Philosophy**: Formal, flat design with minimal shadows

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Configuration

Create a `.env` file in the project root:

```
VITE_FUNCTIONS_BASE_URL=https://asia-south1-YOUR_PROJECT_ID.cloudfunctions.net
VITE_GOOGLE_MAPS_API_KEY=YOUR_MAPS_API_KEY
```

## License

© 2026 Madurai Municipal Corporation, Government of Tamil Nadu. All rights reserved.
