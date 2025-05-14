import mongoose from "mongoose";
import Project from "../models/project.model.js";
import { errorHandler } from "../utils/handleError.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { sendMail } from "../utils/sendMail.js";
import moment from "moment";
import { convertToSlug } from "../helpers/convertToSlug.js";


// [POST] /project/create
export const create = async (req, res, next) => {
  const userId = req.userId;
  const {projectName, description, startDate, endDate} = req.body;
  try {
    const newProject = new Project({
      name: projectName,
      slugName: convertToSlug(projectName),
      description,
      startDate,
      endDate,
      authorUserId: userId
    });

    await newProject.save();

    const record = await Project.findOne({_id: newProject._id})
    .populate({
      path: "authorUserId",
      select: "-password"
    })
    .populate({
      path: "membersId",
      select: "-password"
    });

    res.status(200).json({message: "Create a new project successfully", project: record});
  } catch (error) {
    next(error);
  }
}

// [PATCH] /project/update
export const updateProject = async (req, res, next) => {
  const userId =new mongoose.Types.ObjectId(req.userId);
  const {projectId, projectName, description, startDate, endDate} = req.body;
  try {
    const project = await Project.findOne({_id: projectId});
    if(!project.authorUserId.equals(userId))
    {
      return next(errorHandler(400, "You couldn't change the information of project"));
    }

    await Project.updateOne({_id: projectId}, {
      name: projectName,
      description,
      startDate,
      endDate
    })

    const record = await Project.findOne({_id: projectId})
    .populate({
      path: "authorUserId",
      select: "-password"
    })
    .populate({
      path: "membersId",
      select: "-password"
    });

    

    res.status(200).json({message: "Create a new project successfully", project: record});
  } catch (error) {
    next(error);
  }
}

// [GET] /project/get-all
export const getAll = async (req, res, next) => {
  const userId = req.userId;
  try {
    const projects = await Project.find({
      $or: [
        {authorUserId: userId},
        {membersId: userId}
      ]
    })
    .populate({
      path: "authorUserId",
      select: "-password"
    })
    .populate({
      path: "membersId",
      select: "-password"
    });

    res.status(200).json({message: "Get list projects successfully", projects: projects});
    
  } catch (error) {
    next(error);
  }
}

// [GET] /project/:id
export const getDetail = async (req, res, next) => {
  const {id} = req.params;
  const userId = new mongoose.Types.ObjectId(req.userId);
  try {
    const project = await Project.findOne({_id: id})
    .populate({
      path: "authorUserId",
      select: "-password"
    })
    .populate({
      path: "membersId",
      select: "-password"
    });
    if(!project.authorUserId._id.equals(userId) && !project.membersId.some(m => m._id == userId))
    {
      return next(errorHandler(400, "You couldn't watch the information of project"))
    }
    return res.status(200).json({message: "Get a detail project successfully", project: project});
  } catch (error) {
    next(error);
  }
}

// [POST] /project/:id/add-member
export const addMemberToProject = async (req, res, next) => {
  const userId = new mongoose.Types.ObjectId(req.userId);
  const {id} = req.params;
  const {memberId} = req.body;
  try {
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ message: "Invalid memberId format" });
    }

    const member = await User.findOne({_id: memberId}).select("-password");

    if(!member)
    {
      return next(errorHandler(404, "Not find member"));
    }
    
    const project = await Project.findOne({_id: id});

    if(!project.authorUserId.equals(userId) && !project.membersId.some(id => id.equals(member._id)))
    {
      return next(errorHandler(400, "You couldn't add member to project"))
    }

    const user = await User.findOne({_id: userId.toString()}).select("-password");

    if(project.authorUserId.equals(member._id) || project.membersId.some(id => id.equals(member._id)) || project.invitations.some(inv => inv.email == member.email))
    {
      return next(errorHandler(400, "User is not valid"));
    }

    const token = jwt.sign({email: member.email, memberId: member._id, type: "invite", projectId: id}, process.env.SECRET_ACCESS_TOKEN, {expiresIn: "300s"});

    const objectInvite = {
      email: member.email,
      token: token
    }

    await Project.updateOne({
      _id: id
    }, {
      $push: {invitations: objectInvite}
    });


    const subject = "[PROJECT MANAGEMENT WEBSITE] Group invitation";
    const content = `
      <p>Hi</p>
      <p>You are invited to participate in <strong>${project.name}</strong> on Project Management Website by <Strong><i>${user.fullname}</i></Strong></p>
      <p>Please click on the link included below to join</p>
      <a href="http://localhost:3003/project/invite/confirm?token=${token}">Accept to participate</a>
      <p><i>Note: Invitation will expire in <strong>10 minutes</strong></i></p>
    `;

    sendMail(member.email, subject, content);

    return res.status(200).json({message: "Invited successfull"});

  } catch (error) {
    next(error);
  }
}

// [GET] /project/invite/confirm?token
export const confirmInvite = async (req, res, next) => {
  const {token} = req.query;
  try {
    const decode = jwt.verify(token, process.env.SECRET_ACCESS_TOKEN);
    const {email, memberId, projectId, type} = decode;

    const project = await Project.findOne({_id: projectId});
    if((project.authorUserId.equals(memberId) || project.membersId.some(id => id.equals(memberId))) && !project.invitations.some(inv => inv.email == email))
    {
      return res.status(400).json("User not valid");
    }

    if(type == "invite")
    {
      await Project.updateOne({
        _id: projectId
      }, {
        $push: {membersId: memberId},
        $pull: {invitations: {email: email}}
      });

      return res.status(200).json({message: "Add member successfully"});
    }
    
    return res.status(400).json({message: "Token not valid"});
  } catch (error) {
    next(error);
  }
}