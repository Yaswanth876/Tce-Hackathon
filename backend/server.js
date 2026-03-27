import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import http from 'http'
import mongoose from 'mongoose'
import { fileURLToPath } from 'url'
import connectDB from './config/db.js'
import complaintRoutes from './routes/complaints.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const INITIAL_PORT = Number(process.env.PORT) || 5000
const MAX_PORT_ATTEMPTS = Number(process.env.PORT_RETRY_LIMIT) || 10
const dbStatus = {
  connected: false,
  error: null,
}

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  })
)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.get('/', (_req, res) => {
  res.json({
    message: 'Aqro Backend API is running',
    version: '1.0.0',
    endpoints: {
      complaints: '/api/complaints',
      health: '/api/health',
    },
  })
})

app.use('/api/complaints', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      error: 'Database is unavailable. Please try again in a few moments.',
    })
  }
  return next()
})
app.use('/api/complaints', complaintRoutes)

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    db: {
      connected: dbStatus.connected,
      error: dbStatus.error,
    },
    timestamp: new Date().toISOString(),
  })
})

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' })
})

app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err)
  res.status(err?.status || 500).json({
    success: false,
    error: err?.message || 'Internal server error',
  })
})

function startServer(startPort) {
  let attempts = 0

  const tryListen = (port) => {
    const server = http.createServer(app)

    server.once('error', (err) => {
      if (err?.code === 'EADDRINUSE' && attempts < MAX_PORT_ATTEMPTS) {
        attempts += 1
        const nextPort = port + 1
        console.warn(`Port ${port} is busy. Retrying on ${nextPort}...`)
        return tryListen(nextPort)
      }

      console.error('[Startup Error]', err)
      process.exit(1)
    })

    server.listen(port, () => {
      console.log(`Aqro backend running at http://localhost:${port}`)
      console.log(`Gemini configured: ${Boolean(process.env.GEMINI_API_KEY)}`)
      console.log(`MongoDB connected: ${dbStatus.connected}`)
      if (!dbStatus.connected && dbStatus.error) {
        console.warn(`MongoDB startup warning: ${dbStatus.error}`)
      }
    })
  }

  tryListen(startPort)
}

connectDB()
  .then((connectionState) => {
    dbStatus.connected = Boolean(connectionState?.connected)
    dbStatus.error = connectionState?.error ?? null

    startServer(INITIAL_PORT)
  })
  .catch((err) => {
    dbStatus.connected = false
    dbStatus.error = err?.message || 'Failed to connect to database'
    console.error('[DB Startup Error]', dbStatus.error)

    // Keep API available even if DB is down. /api/complaints already returns 503.
    startServer(INITIAL_PORT)
  })

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...')
  process.exit(0)
})

export default app
