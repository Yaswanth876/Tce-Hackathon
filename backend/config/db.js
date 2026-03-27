import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      'mongodb://localhost:27017/aqro'

    await mongoose.connect(mongoUri)

    console.log('✅ MongoDB connected successfully')
    return { connected: true, error: null }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message)
    return { connected: false, error: error.message }
  }
}

export default connectDB
