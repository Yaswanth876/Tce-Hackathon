import mongoose from 'mongoose'

<<<<<<< HEAD
const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      'mongodb://localhost:27017/aqro'

    await mongoose.connect(mongoUri)

    console.log('✅ MongoDB connected successfully')
    return mongoose.connection
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message)
    process.exit(1)
  }
}

export default connectDB
=======
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
>>>>>>> 2f4de1a0f4533244ae9e8a4be8766706c9fd0536
