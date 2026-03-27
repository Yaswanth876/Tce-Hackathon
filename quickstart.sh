#!/bin/bash

# 🚀 Aqro - Quick Start Script
# This script helps you set up the complete system

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          AQRO - Waste Management with Gemini AI               ║"
echo "║              Quick Start Setup Script                         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check Node.js
echo "📦 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install from https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js $(node -v) found"

# Check npm
echo "📦 Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js which includes npm"
    exit 1
fi
echo "✅ npm $(npm -v) found"

# Check MongoDB
echo "📦 Checking MongoDB..."
if command -v mongod &> /dev/null; then
    echo "✅ MongoDB found"
else
    echo "⚠️  MongoDB not installed locally"
    echo "   → Download from: https://www.mongodb.com/try/download/community"
    echo "   → OR use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    SETUP STEPS                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Backend dependencies
echo "Step 1️⃣ : Installing backend dependencies..."
cd backend
npm install
echo "✅ Backend dependencies installed"
echo ""

# Step 2: Copy env example
if [ ! -f .env ]; then
    echo "Step 2️⃣ : Creating .env file..."
    cp .env.example .env
    echo "✅ Created backend/.env"
    echo ""
    echo "📋 Please edit backend/.env and add:"
    echo "   - GEMINI_API_KEY from https://aistudio.google.com/app/apikeys"
    echo "   - MONGODB_URI (local or MongoDB Atlas)"
    echo ""
else
    echo "Step 2️⃣ : backend/.env already exists"
    echo ""
fi

# Step 3: Frontend setup
echo "Step 3️⃣ : Setting up frontend..."
cd ../frontend
if [ -f node_modules ]; then
    echo "✅ Frontend dependencies already installed"
else
    npm install
    echo "✅ Frontend dependencies installed"
fi
echo ""

# Step 4: Summary
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    NEXT STEPS                                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "1. 📝 Edit backend/.env with your Gemini API key and MongoDB URI:"
echo "   nano../backend/.env"
echo ""
echo "2. 🗄️  Start MongoDB (in separate terminal):"
echo "   mongod"
echo ""
echo "3. 🚀 Start Backend (in separate terminal):"
echo "   cd backend && npm run dev"
echo "   (Server will run on http://localhost:5000)"
echo ""
echo "4. 🎨 Start Frontend (in separate terminal):"
echo "   cd frontend && npm run dev"
echo "   (Frontend will run on http://localhost:5173)"
echo ""
echo "5. 🌐 Open browser and go to:"
echo "   http://localhost:5173"
echo ""
echo "6. 📸 Upload an image complaint:"
echo "   - Click 'File Complaint'"
echo "   - Select image (JPEG/PNG/WebP)"
echo "   - Click 'Capture Location'"
echo "   - Submit"
echo "   - See AI analysis results!"
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    HELPFUL RESOURCES                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📖 Documentation:"
echo "   • IMPLEMENTATION_SUMMARY.md - Overview of what was built"
echo "   • SETUP_GUIDE.md - Complete configuration guide"
echo "   • GEMINI_INTEGRATION_GUIDE.md - API endpoints & examples"
echo "   • ARCHITECTURE.md - System design & data flow"
echo "   • backend/README.md - Backend-specific setup"
echo ""
echo "🔗 Get API Keys:"
echo "   • Gemini API: https://aistudio.google.com/app/apikeys"
echo "   • MongoDB Atlas: https://www.mongodb.com/cloud/atlas"
echo ""
echo "💡 Tips:"
echo "   • Keep terminals open so services keep running"
echo "   • Check logs in terminal if something doesn't work"
echo "   • Use Ctrl+C to stop services"
echo ""

echo "✨ Happy coding! ✨"
echo ""
