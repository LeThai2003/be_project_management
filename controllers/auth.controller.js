import ForgotPassword from "../models/forgot-password.model.js";
import User from "../models/user.model.js";
import { generateRandomNumber, generateRandomString } from "../utils/generate.js";
import { errorHandler } from "../utils/handleError.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendMail } from "../utils/sendMail.js";
import { convertToSlug } from "../helpers/convertToSlug.js";


// [POST] /auth/sign-up
export const signUp = async (req, res, next) => {
  const {fullname, email, password, profileImageUrl} = req.body;
  try {

    const emailExist = await User.findOne({email: email});
    if(emailExist)
    {
      return(next(errorHandler(409, "Email already exists")));
    }
    const hashPassword = bcryptjs.hashSync(password, 10);
    const newUser = new User({
      fullname,
      slugName: convertToSlug(fullname),
      email,
      password: hashPassword,
      profilePicture: profileImageUrl
    });

    await newUser.save();

    res.status(200).json({message: "User created succesfully"});

  } catch (error) {
    next(error);
  }
}


// [POST] /auth/login
export const login = async (req, res, next) => {
  const {email, password} = req.body;
  try {
    const userExist = await User.findOne({email: email});

    if(!userExist)
    {
      return next(errorHandler(400, "Email not exist"));
    }

    const validPassword = bcryptjs.compareSync(password, userExist.password);
    if(!validPassword)
    {
      return next(errorHandler(400, "wrong password"));
    }

    const token = jwt.sign({id: userExist._id}, process.env.SECRET_ACCESS_TOKEN, {expiresIn: "1h"});
    const refreshToken = jwt.sign({id: userExist._id}, process.env.SECRET_REFRESH_TOKEN, {expiresIn: "365d"});

    await User.updateOne({email: email}, {refreshToken: refreshToken});

    const user = userExist.toObject();
    delete user.password;
    delete user.refreshToken;

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true, // Ngăn JavaScript trên trình duyệt truy cập cookie — tăng bảo mật.
      path: "/",  // Đường dẫn mà cookie được gửi. "/" là toàn bộ ứng dụng.
      // secure: false, // Cookie chỉ được gửi qua HTTPS nếu là true. Khi dev trên localhost, nên để false.
      // sameSite: "none"  // Chống tấn công CSRF. Cookie chỉ được gửi nếu request đến từ cùng site. --> lax
      maxAge: 365 * 24 * 60 * 60 * 1000
    })

    return res.status(200).json({message: "Login successful", user, accessToken: token});

  } catch (error) {
    next(error);
  }
}


// [POST] /auth/password-forgot
export const passwordForgot = async (req, res, next) => {
  const {email} = req.body;
  try {
    const emailExist = await User.findOne({email: email});
    if(!emailExist)
    {
      return next(errorHandler(400, "Email not exist"));
    }

    await ForgotPassword.deleteMany({email: email});

    const otp = generateRandomNumber(8);

    const objectPassword = {
      email: email,
      otp: otp,
    };

    const record = new ForgotPassword(objectPassword);
    await record.save();

    const subject = `The OTP code for forgot password`;
    const content = `Your otp code is <b className="text-red-500">${otp}</b> <br> Please not share with anyone. <br> <i>The code expires in 5 minutes</i>`;

    sendMail(email, subject, content);

    return res.status(200).json({message: "Send the OTP code to email successfully"});
  } catch (error) {
    next(error);
  }
}


// [POST] /auth/password-otp
export const passwordOtp = async (req, res, next) => {
  const {otp, email} = req.body;
  try {
    const recordExit = await ForgotPassword.findOne({email, otp});
    if(!recordExit)
    {
      return next(errorHandler(400, "The otp code or email not valid"));
    }

    await ForgotPassword.deleteOne({otp});

    const token = jwt.sign({email, type: "reset"}, process.env.SECRET_ACCESS_TOKEN, {expiresIn: "1h"});

    res.status(200).json({message: "Enter the otp code successfully", accessToken: token});

  } catch (error) {
    next(error);
  }
}

// [POST] /auth/password-reset
export const passwordReset = async (req, res, next) => {
  const {newPassword, accessToken} = req.body;
  try {
    const decoded = jwt.verify(accessToken, process.env.SECRET_ACCESS_TOKEN);
    const {email, type} = decoded;

    if(type != "reset")
    {
      return next(errorHandler(401, "Token not valid"));
    }

    const emailExist = await User.findOne({email});
    if(!emailExist)
    {
      return next(errorHandler(401, "Token not valid - email"));
    }

    const hashPassword = bcryptjs.hashSync(newPassword, 10);
    await User.updateOne({email}, {password: hashPassword});

    return res.status(200).json({message: "Reset password successfully"});

  } catch (error){
    next(error);
  }
}

export const google = async (req, res, next) => {
  const {email, fullname, photo} = req.body;
  try {
    const userExist = await User.findOne({email: email});
    if(userExist)
    {
      const token = jwt.sign({id: userExist._id}, process.env.SECRET_ACCESS_TOKEN, {expiresIn: "1h"});
      const refreshToken = jwt.sign({id: userExist._id}, process.env.SECRET_REFRESH_TOKEN, {expiresIn: "365d"});

      await User.updateOne({email: email}, {refreshToken: refreshToken});

      const user = userExist.toObject();
      delete user.password;
      delete user.refreshToken;

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true, // Ngăn JavaScript trên trình duyệt truy cập cookie — tăng bảo mật.
        path: "/",  // Đường dẫn mà cookie được gửi. "/" là toàn bộ ứng dụng.
        // secure: false, // Cookie chỉ được gửi qua HTTPS nếu là true. Khi dev trên localhost, nên để false.
        // sameSite: "none"  // Chống tấn công CSRF. Cookie chỉ được gửi nếu request đến từ cùng site. --> lax
        maxAge: 365 * 24 * 60 * 60 * 1000
      })
  
      return res.status(200).json({message: "Login successful", user, accessToken: token});
    }
    else
    {
      const randomNumber = generateRandomString(15);
      const hashedPassword = bcryptjs.hashSync(randomNumber, 10);
    
      const newUser = new User({
        fullname,
        slugName: convertToSlug(fullname),
        email,
        profilePicture: photo,
        password: hashedPassword,
      });

      await newUser.save();

      const user = newUser.toObject();
      delete user.password;

      const token = jwt.sign({id: user._id}, process.env.SECRET_ACCESS_TOKEN, {expiresIn: "1h"});
  
      return res.status(200).json({message: "Sign up successful", user, accessToken: token});
    }
  } catch (error) {
    next(error);
  }
}


// [POST] /auth/refresh-token
export const refreshToken = async (req, res, next) => {
  // console.log("refresh token");
  console.log(req.cookies);
  const refreshToken = req.cookies.refreshToken;
  if(!refreshToken)
  {
    return next(errorHandler(401, "You are not authenticated"));
  }
  try {
    const userExsit = await User.findOne({refreshToken: refreshToken});
    if(!userExsit)
    {
      return next(errorHandler(403, "Refresh token is not valid"));
    }
    jwt.verify(refreshToken, process.env.SECRET_REFRESH_TOKEN, async (err, payload) => {
      if(err)
      {
        console.log(err);
        return next(errorHandler(400, "Error: " + err));
      }
      console.log(payload);
      // create a new accessToken
      const newAccessToken = jwt.sign({id: payload.id}, process.env.SECRET_ACCESS_TOKEN, {expiresIn: "1h"});
      const newRefreshToken = jwt.sign({id: payload.id}, process.env.SECRET_REFRESH_TOKEN, {expiresIn: "365d"});

      await User.updateOne({_id: payload.id}, {refreshToken: newRefreshToken});

      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true, // Ngăn JavaScript trên trình duyệt truy cập cookie — tăng bảo mật.
        path: "/",  // Đường dẫn mà cookie được gửi. "/" là toàn bộ ứng dụng.
        // secure: false, // Cookie chỉ được gửi qua HTTPS nếu là true. Khi dev trên localhost, nên để false.
        // sameSite: "none"  // Chống tấn công CSRF. Cookie chỉ được gửi nếu request đến từ cùng site.
        maxAge: 365 * 24 * 60 * 60 * 1000
      })

      return res.status(200).json({message: "Refresh Token Successfully", accessToken: newAccessToken});
    })

  } catch (error) {
    next(error);
  }
}

// [POST] /auth/logout
export const logout = async (req, res) => {
  const userId = req.userId;
  // console.log(userId);
  const {refreshToken} = req.cookies;
  // console.log(refreshToken);
  try {
    const user = await User.findOne({_id: userId});
    if(user.refreshToken != refreshToken) return next(errorHandler(401, "Refresh token is not valid"));

    res.clearCookie("refreshToken");

    return res.status(200).json("Logut successfully");

  } catch (error) {
    next(error);
  }
}