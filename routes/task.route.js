import express from "express";
import { authenticateToken } from "../middlewares/authenticate.middleware.js";
import { create, deleteTask, getAll, taskDetail, updateCompleted, updateStatus, updateTask } from "../controllers/task.controller.js";

const route = express.Router();

route.use(authenticateToken);

route.post("/create", create);

route.get("/get-all", getAll);

route.patch("/update-status", updateStatus);

route.patch("/update/:taskId", updateTask);

route.delete("/delete/:taskId", deleteTask);

route.get("/:taskId", taskDetail);

route.patch("/update-completed/:taskId", updateCompleted)

export default route;