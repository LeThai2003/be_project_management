import express from "express";
import { login, passwordForgot, passwordOtp, passwordReset, signUp } from "../controllers/auth.controller.js";

const route = express.Router();

route.post("/sign-up", signUp);

route.post("/login", login);

route.post("/password-forgot", passwordForgot);

route.post("/password-otp", passwordOtp);

route.post("/password-reset", passwordReset);

export default route;