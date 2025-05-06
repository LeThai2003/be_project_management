import express from "express";
import { create, getAll, getDetail } from "../controllers/project.controller.js";
import { authenticateToken } from "../middlewares/authenticate.middleware.js";

const route = express.Router();

route.use(authenticateToken);

route.post("/create", create);

route.get("/get-all", getAll);

route.get("/:id", getDetail);

export default route;