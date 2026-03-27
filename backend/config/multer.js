import multer from 'multer'
import path from 'path'
import fs from 'fs'

const uploadDir = process.env.UPLOAD_DIR || './uploads'

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    const name = path.basename(file.originalname, ext)
    cb(null, `${name}-${uniqueSuffix}${ext}`)
  },
})

// File filter - accept only images
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp']
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp']

  const ext = path.extname(file.originalname).toLowerCase()
  const mimeAllowed = allowedMimes.includes(file.mimetype)
  const extAllowed = allowedExts.includes(ext)

  if (mimeAllowed && extAllowed) {
    cb(null, true)
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false)
  }
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024, // 5 MB
  },
})

export default upload
