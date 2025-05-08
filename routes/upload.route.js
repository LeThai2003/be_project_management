import express from "express";
import multer from "multer";
import { uploadSingle } from "../middlewares/uploadToCloud.middleware.js";
import { uploadImageSingle } from "../controllers/upload.controller.js";

const route = express.Router();
const upload = multer();

route.post("/image-single", upload.single("image"), uploadSingle, uploadImageSingle);

export default route;