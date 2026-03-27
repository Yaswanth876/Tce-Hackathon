import { Router } from 'express'
import upload from '../middleware/uploadMiddleware.js'
import {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
} from '../controllers/complaintController.js'

const router = Router()

// POST   /api/complaints          — file upload (optional) + create
router.post('/',     upload.single('image'), createComplaint)

// GET    /api/complaints          — list all (supports ?status= & ?category=)
router.get('/',      getComplaints)

// GET    /api/complaints/:id      — get one by ID
router.get('/:id',   getComplaintById)

// PATCH  /api/complaints/:id      — update status / fields
router.patch('/:id', updateComplaint)

// DELETE /api/complaints/:id      — remove complaint
router.delete('/:id', deleteComplaint)

export default router
