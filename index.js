import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import {connectDB} from "./configs/database.js";
import http from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.route.js";
import projectRoute from "./routes/project.route.js";
import taskRoute from "./routes/task.route.js";
import uploadRoute from "./routes/upload.route.js";
import searchRoute from "./routes/search.route.js";
import userRoute from "./routes/user.route.js";
import commentRoute from "./routes/comment.route.js";
import { commentSocketHandler } from "./sockets/comments/handleComment.socket.js";

dotenv.config();

// connect to database
connectDB();

const app = express();

const server = http.createServer(app);

// config
app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true                
}));

// CORS cho Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

global._io = io;

io.on("connection", (socket) => {
  
  commentSocketHandler(socket)
});


// routes
app.use("/auth", authRoutes);
app.use("/project", projectRoute);
app.use("/task", taskRoute);
app.use("/upload", uploadRoute);
app.use("/search", searchRoute);
app.use("/user", userRoute);
app.use("/comment", commentRoute);

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


server.listen(3003, () => {
  console.log("App run at port 3003")
})