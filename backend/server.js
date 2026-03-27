import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import connectDB from './config/db.js'
import complaintRoutes from './routes/complaintRoutes.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

// ─── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded images as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/complaints', complaintRoutes)

// ─── Health check ────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── 404 handler ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ─── Global error handler ────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err.message)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

// ─── Start ───────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Aqro backend running on http://localhost:${PORT}`)
  })
})
