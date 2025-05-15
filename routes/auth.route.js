import express from "express";
import { google, login, logout, passwordForgot, passwordOtp, passwordReset, refreshToken, signUp } from "../controllers/auth.controller.js";
import { authenticateToken } from "../middlewares/authenticate.middleware.js";

const route = express.Router();

route.post("/sign-up", signUp);

route.post("/login", login);

route.post("/logout", authenticateToken, logout);

route.post("/google", google);

route.post("/password-forgot", passwordForgot);

route.post("/password-otp", passwordOtp);

route.post("/password-reset", passwordReset);

route.post("/refresh-token", refreshToken);

export default route;