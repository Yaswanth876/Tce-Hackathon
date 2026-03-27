import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import connectDB from './config/db.js'
import complaintRoutes from './routes/complaints.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = Number(process.env.PORT) || 5000

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

app.use('/api/complaints', complaintRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() })
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

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Aqro backend running at http://localhost:${PORT}`)
      console.log(`Gemini configured: ${Boolean(process.env.GEMINI_API_KEY)}`)
    })
  })
  .catch((error) => {
    console.error('Failed to start server:', error.message)
    process.exit(1)
  })

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...')
  process.exit(0)
})

export default app
