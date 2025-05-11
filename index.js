import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import {connectDB} from "./configs/database.js";
import authRoutes from "./routes/auth.route.js";
import projectRoute from "./routes/project.route.js";
import taskRoute from "./routes/task.route.js";
import uploadRoute from "./routes/upload.route.js"
import searchRoute from "./routes/search.route.js"

dotenv.config();

// connect to database
connectDB();

// config
const app = express();
app.use(express.json());
app.use(cors())

// routes
app.use("/auth", authRoutes);
app.use("/project", projectRoute);
app.use("/task", taskRoute);
app.use("/upload", uploadRoute);
app.use("/search", searchRoute);

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