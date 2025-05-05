import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import {connectDB} from "./configs/database.js";
import authRoutes from "./routes/auth.route.js";

dotenv.config();

// connect to database
connectDB();

// config
const app = express();
app.use(express.json());
app.use(cors())

// routes
app.use("/auth", authRoutes);

// resolve err
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    success: false,
    message,
    statusCode
  })
})


app.listen(3003, () => {
  console.log("App run at port 3003")
})