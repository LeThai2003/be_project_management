import express from "express";
import { searchAddMemberToProject, searchAnything, searchMembersInProject } from "../controllers/search.controller.js";
import { authenticateToken } from "../middlewares/authenticate.middleware.js";

const route = express.Router();

route.use(authenticateToken);

route.post("/all-members/:projectId", searchMembersInProject);

route.post("/add-member/:projectId", searchAddMemberToProject);

route.post("/anything", searchAnything);

export default route;