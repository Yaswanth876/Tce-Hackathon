import mongoose from 'mongoose'

<<<<<<< HEAD
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aqro'

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

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
>>>>>>> 3cf3e3436989c3f348a1475a2bde189aefc35263
