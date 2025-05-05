import mongoose from "mongoose";

export const connectDB = () => {
  mongoose.connect(process.env.DATABASE_URL)
    .then(() => console.log("Connected to database"))
    .catch((error) => console.log(error))
}