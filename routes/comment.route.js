import express from "express";
import { authenticateToken } from "../middlewares/authenticate.middleware.js";
import { create, deleteComment, getAll, updateComment } from "../controllers/comment.controller.js";

const route = express.Router();

route.use(authenticateToken);

route.post("/:taskId", create);

route.get("/:taskId", getAll);

route.patch("/:id", updateComment);

route.delete("/:id", deleteComment);


export default route;