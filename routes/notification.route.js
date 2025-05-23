import express from "express";
import { getAllNotifications, updateSeen } from "../controllers/notification.controller.js";
import { authenticateToken } from "../middlewares/authenticate.middleware.js";

const route = express.Router();

route.use(authenticateToken);

route.get("", getAllNotifications);

route.patch("/update-seen/:id", updateSeen);  // notification id

export default route;