import express from "express";
import { google, login, passwordForgot, passwordOtp, passwordReset, refreshToken, signUp } from "../controllers/auth.controller.js";

const route = express.Router();

route.post("/sign-up", signUp);

route.post("/login", login);

route.post("/google", google);

route.post("/password-forgot", passwordForgot);

route.post("/password-otp", passwordOtp);

route.post("/password-reset", passwordReset);

route.post("/refresh-token", refreshToken);

export default route;