import mongoose from "mongoose";
import Project from "../models/project.model.js";
import { convertToSlug } from "../helpers/convertToSlug.js";
import User from "../models/user.model.js";

// [GET] /search/all-members/:projectId
export const searchMembersInProject = async (req, res, next) => {
  const {projectId} = req.params;
  const userId = new mongoose.Types.ObjectId(req.userId);
  const {search} = req.body;
  try {
    const project = await Project.findOne({_id: projectId})
    .populate({
      path: "authorUserId",
      select: "-password"
    })
    .populate({
      path: "membersId",
      select: "-password"
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
      result.push(project.authorUserId);
    }

    project.membersId?.filter(member => (member.slugName.includes(slugSearch) || member.email.includes(search)))?.forEach(member => result.push(member));

    return res.status(200).json({message: "Get all members of project successfully", members: result});

  } catch (error) {
    next(error);
  }
}


// [GET] /search/add-member/:projectId
export const searchAddMemberToProject = async (req, res, next) => {
  const {projectId} = req.params;
  const userId = new mongoose.Types.ObjectId(req.userId);
  console.log(req.body);
  const {search} = req.body;
  try {

    if("@gmail.com".includes(search))
    {
      return res.status(400).json({message: "Please enter a valid email"});
    }

    const project = await Project.findOne({_id: projectId})
    .populate({
      path: "authorUserId",
      select: "-password"
    })
    .populate({
      path: "membersId",
      select: "-password"
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
    .select("-password");

    const result = [];

    for (const item of users) {
      const user = item.toObject();

      if (user._id.toString() === userId.toString()) 
      {
        user.status = "Creator";
      } 
      else if (project.membersId.includes(user._id.toString())) 
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

