import express from "express";
import { authenticateToken } from "../middlewares/authenticate.middleware.js";
import { create, deleteTask, getAll, updateStatus, updateTask } from "../controllers/task.controller.js";

const route = express.Router();

route.use(authenticateToken);

route.post("/create", create);

route.get("/get-all", getAll);

route.patch("/update-status", updateStatus);

route.patch("/update/:taskId", updateTask);

route.delete("/delete/:taskId", deleteTask);

export default route;