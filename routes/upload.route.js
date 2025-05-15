import express from "express";
import multer from "multer";
import { uploadFileds, uploadSingle } from "../middlewares/uploadToCloud.middleware.js";
import { uploadImages, uploadImageSingle } from "../controllers/upload.controller.js";

const route = express.Router();
const upload = multer();

route.post("/image-single", upload.single("image"), uploadSingle, uploadImageSingle);

route.post("/images", upload.fields([{name: "gallery", maxCount: 5}]), uploadFileds, uploadImages);

export default route;