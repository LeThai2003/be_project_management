import User from "../models/user.model.js";
import { errorHandler } from "../utils/handleError.js";
import bcryptjs from "bcryptjs";

// [POST] /user/update-profile/:id      userId
export const updateProfile = async (req, res, next) => {
  const {id} = req.params;
  const userId = req.userId;
  // console.log(req.body);
  try {
    if(id !== userId) return next(errorHandler(401, "You are not allowed to change profile information"));

    const user = await User.findOne({_id: userId}).select("-password -refreshToken");

    if(user.email !== req.body.email)
    {
      const emailExist = await User.findOne({_id: req.body.email});
      if(emailExist ) return next(errorHandler(409, "Email already exists"));
    }

    await User.updateOne({_id: id}, req.body);

    const userUpdate = await User.findOne({_id: id}).select("-password -refreshToken");

    return res.status(200).json({message: "Update profile successfully", user: userUpdate});
  } catch (error) {
    next(error);
  }
}

// [POST] /user/update-account/:id 
export const updateAccount = async (req, res, next) => {
  const {id} = req.params;
  const userId = req.userId;
  // console.log(req.body);
  try {

    if(req.body.newPassword !== req.body.confirmNewPassword)
    {
      return next(errorHandler(400, "Confirm password wrong"))
    }

    if(id !== userId) return next(errorHandler(401, "You are not allowed to change account information"));

    const user = await User.findOne({_id: userId});

    const validPassword = bcryptjs.compareSync(req.body.oldPassword, user.password);

    if(!validPassword)
    {
      return next(errorHandler(400, "Wrong password"));
    }

    const hashPassword = bcryptjs.hashSync(req.body.newPassword, 10);

    await User.updateOne({_id: id}, {password: hashPassword});

    return res.status(200).json({message: "Update account successfully"});
  } catch (error) {
    next(error);
  }
}