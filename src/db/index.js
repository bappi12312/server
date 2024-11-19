import mongoose from "mongoose";

const connectDb = async () => {
  try {
    const connectInstance = await mongoose.connect(`${process.env.MONGODB_URI}`)

    console.log(`MongoDB connected !! DB host : ${connectInstance.connection.host}`)
  } catch (error) {
    console.log("MongoDB Error : ",error);
    process.exit(1)
  }
}

export default connectDb