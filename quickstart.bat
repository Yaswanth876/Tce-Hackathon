@echo off
REM 🚀 Aqro - Quick Start Script for Windows
REM This script helps you set up the complete system

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║          AQRO - Waste Management with Gemini AI               ║
echo ║              Quick Start Setup Script                         ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Check Node.js
echo 📦 Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% found
echo.

REM Check npm
echo 📦 Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm not found. Please install Node.js which includes npm
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm %NPM_VERSION% found
echo.

REM Check MongoDB
echo 📦 Checking MongoDB...
where mongod >nul 2>&1
if errorlevel 1 (
    echo ⚠️  MongoDB not installed locally
    echo    ^→ Download from: https://www.mongodb.com/try/download/community
    echo    ^→ OR use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas
) else (
    echo ✅ MongoDB found
)
echo.

echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    SETUP STEPS                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Step 1: Backend dependencies
echo Step 1️⃣ : Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 goto :error
echo ✅ Backend dependencies installed
echo.

REM Step 2: Copy env example
if not exist .env (
    echo Step 2️⃣ : Creating .env file...
    copy .env.example .env
    echo ✅ Created backend\.env
    echo.
    echo 📋 Please edit backend\.env and add:
    echo    - GEMINI_API_KEY from https://aistudio.google.com/app/apikeys
    echo    - MONGODB_URI (local or MongoDB Atlas)
    echo.
) else (
    echo Step 2️⃣ : backend\.env already exists
    echo.
)

REM Step 3: Frontend setup
echo Step 3️⃣ : Setting up frontend...
cd ..\frontend
if exist node_modules (
    echo ✅ Frontend dependencies already installed
) else (
    call npm install
    echo ✅ Frontend dependencies installed
)
echo.

REM Step 4: Summary
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    NEXT STEPS                                 ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo 1. 📝 Edit backend\.env with your keys:
echo    - Open backend\.env in a text editor
echo    - Add GEMINI_API_KEY from https://aistudio.google.com/app/apikeys
echo    - Add MONGODB_URI (local or Atlas)
echo.
echo 2. 🗄️  Start MongoDB (in separate Command Prompt):
echo    mongod
echo.
echo 3. 🚀 Start Backend (in separate Command Prompt):
echo    cd backend
echo    npm run dev
echo    (Server will run on http://localhost:5000)
echo.
echo 4. 🎨 Start Frontend (in separate Command Prompt):
echo    cd frontend
echo    npm run dev
echo    (Frontend will run on http://localhost:5173)
echo.
echo 5. 🌐 Open browser and go to:
echo    http://localhost:5173
echo.
echo 6. 📸 Upload an image complaint:
echo    - Click 'File Complaint'
echo    - Select image (JPEG/PNG/WebP)
echo    - Click 'Capture Location'
echo    - Submit
echo    - See AI analysis results!
echo.

echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    HELPFUL RESOURCES                          ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo 📖 Documentation:
echo    - IMPLEMENTATION_SUMMARY.md ... Overview
echo    - SETUP_GUIDE.md ............. Configuration
echo    - GEMINI_INTEGRATION_GUIDE.md  API reference
echo    - ARCHITECTURE.md ............ System design
echo    - backend\README.md .......... Backend setup
echo.
echo 🔗 Get API Keys:
echo    - Gemini API: https://aistudio.google.com/app/apikeys
echo    - MongoDB Atlas: https://www.mongodb.com/cloud/atlas
echo.
echo 💡 Tips:
echo    - Keep Command Prompts open so services keep running
echo    - Check logs in terminal if something doesn't work
echo    - Press Ctrl+C to stop services
echo.

echo ✨ Happy coding! ✨
echo.

pause
exit /b 0

:error
echo ❌ Setup failed. Please check the error message above.
pause
exit /b 1
