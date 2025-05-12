import express from "express";
import multer from "multer";
import { authenticateToken } from "../middlewares/authenticate.middleware.js";
import { updateAccount, updateProfile } from "../controllers/user.controller.js";
import { uploadSingle } from "../middlewares/uploadToCloud.middleware.js";

const route = express.Router();
const upload = multer();

route.use(authenticateToken);

route.post("/update-profile/:id", upload.single("image"), uploadSingle, updateProfile);

route.post("/update-account/:id", updateAccount);

export default route;