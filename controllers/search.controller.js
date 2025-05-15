import mongoose from "mongoose";
import Project from "../models/project.model.js";
import { convertToSlug } from "../helpers/convertToSlug.js";
import User from "../models/user.model.js";
import Task from "../models/task.model.js";

// [POST] /search/all-members/:projectId
export const searchMembersInProject = async (req, res, next) => {
  const {projectId} = req.params;
  const userId = new mongoose.Types.ObjectId(req.userId);
  const {search, tasks} = req.body;
  try {
    const project = await Project.findOne({_id: projectId})
    .populate({
      path: "authorUserId",
      select: "-password -refreshToken"
    })
    .populate({
      path: "membersId",
      select: "-password -refreshToken"
    });

    if(!project.authorUserId._id.equals(userId) && !project.membersId.some(member => member._id.equals(userId)))
    {
      return next(errorHandler(401, "You couldn't watch members this project"));
    }


    const slugSearch = convertToSlug(search);

    // console.log(slugSearch);

    let result = [];

    if(project.authorUserId.slugName.includes(slugSearch) || project.authorUserId.email.includes(search))
    {
      result.push({...project.authorUserId._doc, creator: true, totalCreate: 0, totalAssign: 0});
    }

    project.membersId?.filter(member => (member.slugName.includes(slugSearch) || member.email.includes(search)))?.forEach(member => result.push({...member._doc, totalCreate: 0, totalAssign: 0}));


    if(tasks.length > 0)
    {
      for (const task of tasks) {
        const member = result.find(m => m._id == task.authorUserId._id);
        if(member)
        {
          member.totalCreate += 1;
        }
      }
    }

    return res.status(200).json({message: "Get all members of project successfully", members: result});

  } catch (error) {
    next(error);
  }
}


// [POST] /search/add-member/:projectId
export const searchAddMemberToProject = async (req, res, next) => {
  const {projectId} = req.params;
  const userId = new mongoose.Types.ObjectId(req.userId);
  // console.log(req.body);
  const {search} = req.body;
  try {

    if("@gmail.com".includes(search))
    {
      return res.status(400).json({message: "Please enter a valid email"});
    }

    const project = await Project.findOne({_id: projectId})
    .populate({
      path: "authorUserId",
      select: "-password -refreshToken"
    })
    .populate({
      path: "membersId",
      select: "-password -refreshToken"
    });

    if(!project.authorUserId._id.equals(userId) && !project.membersId.some(member => member._id.equals(userId)))
    {
      return next(errorHandler(401, "You couldn't add members into project"));
    }

    const slugSearch = convertToSlug(search);

    const users = await User.find({
      $or: [
        { slugName: {$regex: slugSearch}},
        { email: {$regex: search, $options: "i"}}
      ]
    })
    .select("-password -refreshToken");

    const result = [];

    for (const item of users) {
      const user = item.toObject();

      if (user._id.toString() === userId.toString()) 
      {
        user.status = "Creator";
      } 
      else if (project.membersId.some(member => member._id.equals(user._id))) 
      {
        user.status = "Member";
      } 
      else if (project.invitations.some(inv => inv.email === user.email)) 
      {
        user.status = "Inviting";
      } 
      else 
      {
        user.status = "User";
      }

      result.push(user);
    }

    return res.status(200).json({message: "Get users successfully", users: result})

  } catch (error) {
    next(error);
  }
}

// [POST] /search/anything
export const searchAnything = async (req, res, next) => {
  const userId = req.userId;
  const {search} = req.body;
  try {
    const slugSearch = convertToSlug(search);

    const projects = await Project.find({
      $and: [
        { 
          $or: [
            { authorUserId: userId },
            { membersId: userId }
          ]
        },
        {
          $or: [
            { slugName: {$regex: slugSearch}},
            { description: {$regex: search, $options: "i"}}
          ]
        }
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

    const tasks = await Task.find({
      $and: [
        { 
          $or: [
            { authorUserId: userId },
            { assigneeUserId: userId }
          ]
        },
        {
          $or: [
            { slugTitle: {$regex: slugSearch}},
            { description: {$regex: search, $options: "i"}},
            { tags: {$regex: search, $options: "i"}}
          ]
        }
      ]
      
    })
    .populate({
      path: "authorUserId",
      select: "-password -refreshToken"
    })
    .populate({
      path: "assigneeUserId",
      select: "-password -refreshToken"
    });

    let users = [];

    if(!"@gmail.com".includes(search))
    {
      users = await User.find({
        $or: [
          { slugName: {$regex: slugSearch}},
          { email: {$regex: search, $options: "i"}}
        ]
      })
      .select("-password -refreshToken");
    }
    

    return res.status(200).json({message: "Search successfully", projects, tasks, users});

  } catch (error) {
    next(error);
  }
}