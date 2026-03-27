import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
<<<<<<< HEAD
import connectDB from './config/db.js'
import complaintRoutes from './routes/complaints.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'))

// Connect to MongoDB
connectDB()

// Routes
app.use('/api/complaints', complaintRoutes)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() })
})

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Aqro Backend API',
    version: '1.0.0',
    endpoints: {
      complaints: '/api/complaints',
      health: '/api/health',
=======
import path from 'path'
import { fileURLToPath } from 'url'
import connectDB from './config/db.js'
import complaintRoutes from './routes/complaintRoutes.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

const app  = express()
const PORT = process.env.PORT || 5000

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin:      process.env.FRONTEND_ORIGIN || '*',
  methods:     ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Serve uploaded images as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ─── Root route ───────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    message:   '🚀 Aqro Backend API is running',
    version:   '1.0.0',
    endpoints: {
      complaints: '/api/complaints',
      health:     '/api/health',
>>>>>>> 2f4de1a0f4533244ae9e8a4be8766706c9fd0536
    },
  })
})

<<<<<<< HEAD
// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message)
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  })
})

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 Aqro Backend Server Started!   ║
╠════════════════════════════════════════╣
║ Server: http://localhost:${PORT}        ║
║ API:    http://localhost:${PORT}/api    ║
╚════════════════════════════════════════╝
  `)
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`)
  console.log(`GEMINI_API configured: ${!!process.env.GEMINI_API_KEY}`)
})

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  server.close(() => {
    console.log('HTTP server closed')
    process.exit(0)
  })
=======
// ─── API Routes ───────────────────────────────────────────────
app.use('/api/complaints', complaintRoutes)

// ─── Health check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── 404 handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' })
})

// ─── Global error handler ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err.message)
  res.status(err.status || 500).json({ success: false, error: err.message || 'Internal server error' })
})

// ─── Connect DB then start server ─────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════╗')
    console.log('║   ✅ Aqro Backend Server Started!      ║')
    console.log(`║   http://localhost:${PORT}                 ║`)
    console.log('╚════════════════════════════════════════╝')
  })
})

// ─── Graceful shutdown ────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('SIGTERM received — shutting down...')
  process.exit(0)
>>>>>>> 2f4de1a0f4533244ae9e8a4be8766706c9fd0536
})

export default app
