import mongoose from 'mongoose'

export default async function connectDB() {
  const uri = process.env.MONGO_URI

  if (!uri) {
    console.error('❌ MONGO_URI is not defined in .env')
    process.exit(1)
  }

  try {
    await mongoose.connect(uri)
    console.log('✅ MongoDB connected')
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message)
    process.exit(1)
  }
}
