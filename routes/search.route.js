import express from "express";
import { searchAddMemberToProject, searchMembersInProject } from "../controllers/search.controller.js";
import { authenticateToken } from "../middlewares/authenticate.middleware.js";

const route = express.Router();

route.use(authenticateToken);

route.get("/all-members/:projectId", searchMembersInProject);

route.get("/add-member/:projectId", searchAddMemberToProject);

export default route;