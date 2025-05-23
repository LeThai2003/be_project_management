import mongoose from "mongoose";
import Project from "../models/project.model.js";
import { errorHandler } from "../utils/handleError.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { sendMail } from "../utils/sendMail.js";
import moment from "moment";
import { convertToSlug } from "../helpers/convertToSlug.js";
import Task from "../models/task.model.js";
import Notification from "../models/notification.model.js";


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
      select: "-password -refreshToken"
    })
    .populate({
      path: "membersId",
      select: "-password -refreshToken"
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
      select: "-password -refreshToken"
    })
    .populate({
      path: "membersId",
      select: "-password -refreshToken"
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
      select: "-password -refreshToken"
    })
    .populate({
      path: "membersId",
      select: "-password -refreshToken"
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
      select: "-password -refreshToken"
    })
    .populate({
      path: "membersId",
      select: "-password -refreshToken"
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

    const member = await User.findOne({_id: memberId}).select("-password -refreshToken");

    if(!member)
    {
      return next(errorHandler(404, "Not find member"));
    }
    
    const project = await Project.findOne({_id: id});

    if(!project.authorUserId.equals(userId) && !project.membersId.some(id => id.equals(member._id)))
    {
      return next(errorHandler(400, "You couldn't add member to project"))
    }

    const user = await User.findOne({_id: userId.toString()}).select("-password -refreshToken");

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

    const project = await Project.findOne({_id: projectId})
    .populate({
      path: "authorUserId",
      select: "-password -refreshToken"
    })
    .populate({
      path: "membersId",
      select: "-password -refreshToken"
    });

    if((project.authorUserId._id.equals(memberId) || project.membersId?.some(m => m._id.equals(memberId))) && !project.invitations.some(inv => inv.email == email))
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


      const infoMember = await User.findOne({_id: memberId}).select("-password");

      _io.emit("ADD_MEMBER_TO_PROJECT", {
        project: project,
        member: infoMember
      });

      const object = {
        type: "member",
        title: `${infoMember.fullname} has accepted to participate in the ${project.name} project`,
        projectId: project._id,
        userId: project.authorUserId._id
      };

      // console.log(object);

      const newNotify = new Notification(object);
      await newNotify.save();

      _io.emit("MEMBER_ACCEPT_JOIN_PROJECT", {
        notification: newNotify._doc,
      })

      return res.status(200).json({message: "Add member successfully"});
    }
    
    return res.status(400).json({message: "Token not valid"});
  } catch (error) {
    next(error);
  }
}

// [GET] /project/data/chart
export const dataChart = async (req, res, next) => {
  const userId = req.userId;
  try {
    const projects = await Project.find({
      $or: [
        {authorUserId: userId},
        {membersId: userId}
      ]
    });

    let data = [];
    let countCompleted = 0;
    let countUnCompleted = 0;

    if(projects.length > 0)
    {
      for (const project of projects) {
        const task = await Task.findOne({
          $and: [
            {projectId: project._id},
            {status: {$in: ["To Do", "Work In Progress", "Under Review"]}}
          ]
        });

        if(task) countUnCompleted += 1;
        else countCompleted += 1;
      }
    };

    data.push({
      type: "Completed",
      percent: projects.length > 0 ? Math.round(countCompleted / projects.length * 100) : 0
    });

    data.push({
      type: "UnCompleted",
      percent: projects.length > 0 ? Math.round(countUnCompleted / projects.length * 100) : 0
    });

    return res.status(200).json({message: "Get data projects for chart successfully", data: data, total: projects?.length || 0});

  } catch (error) {
    next(error);
  }
}

export const percentCompleted = async (req, res, next) => {
  const userId = req.userId;
  try {
    const projects = await Project.find({
      $or: [
        {authorUserId: userId},
        {membersId: userId}
      ]
    });

    const arrScore = [
      {
        status: "To Do",
        score: 1
      },
      {
        status: "Work In Progress",
        score: 2
      },
      {
        status: "Under Review",
        score: 3
      },
      {
        status: "Completed",
        score: 4
      },
    ];

    let result = [];

    if(projects.length > 0)
    {
      for (const project of projects) {
        const tasks = await Task.find({projectId: project._id});
        let totalScore = tasks.length * 4;
        if(tasks.length > 0)
        {
          let finalScore = 0;
          for (const task of tasks) {
            const score = arrScore.find(item => item.status == task.status).score;
            finalScore += score; 
          }
          result.push({
            projectId: project._id,
            percent: Math.round(finalScore / totalScore * 100)
          }) 
        }
        else
        {
          result.push({
            projectId: project._id,
            percent: 100
          })          
        }
      }
    }

    return res.status(200).json({message: "Get percent completed successfully", result})

  } catch (error) {
    next(error);
  }
}