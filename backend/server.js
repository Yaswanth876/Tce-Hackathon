import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
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
    },
  })
})

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
})

export default app
