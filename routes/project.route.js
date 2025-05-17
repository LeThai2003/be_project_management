import express from "express";
import { addMemberToProject, confirmInvite, create, dataChart, getAll, getDetail, percentCompleted, updateProject } from "../controllers/project.controller.js";
import { authenticateToken } from "../middlewares/authenticate.middleware.js";

const route = express.Router();

route.get("/invite/confirm", confirmInvite);

route.use(authenticateToken);

route.post("/create", create);

route.patch("/update", updateProject);

route.get("/get-all", getAll);

route.get("/get-percent-completed", percentCompleted);

route.get("/:id", getDetail);

route.post("/:id/add-member", addMemberToProject);

route.get("/data/chart", dataChart);

export default route;