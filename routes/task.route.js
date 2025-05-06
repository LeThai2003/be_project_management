import express from "express";
import { authenticateToken } from "../middlewares/authenticate.middleware.js";
import { create, getAll, updateStatus } from "../controllers/task.controller.js";

const route = express.Router();

route.use(authenticateToken);

route.post("/create", create);

route.get("/get-all", getAll);

route.patch("/update-status", updateStatus)

export default route;