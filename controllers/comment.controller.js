import mongoose from "mongoose";
import Project from "../models/project.model.js";
import Task from "../models/task.model.js";
import { errorHandler } from "../utils/handleError.js";
import Comment from "../models/comment.model.js";


export const create = async (req, res, next) => {
  const userId = new mongoose.Types.ObjectId(req.userId);
  const {taskId} = req.params;
  try {
    const task = await Task.findOne({_id: taskId});
    if(!task) return next(errorHandler(400, "Task is not exist"));
    const project = await Project.findOne({_id: task.projectId});
    if(!project.authorUserId.equals(userId) && !project.membersId.some(id => id == userId))
    {
      return next(errorHandler(400, "You can't comment in this task"));
    }

    if(!req.body?.message && !req.body?.image && !req.body?.file)
    {
      return next(errorHandler(400, "Please enter content"));
    }

    req.body.userId = userId;
    req.body.taskId = taskId;
    // req.body.createdAt = new Date(Date.now() + 7 * 60 * 60 * 1000);

    const comment = new Comment(req.body);
    await comment.save();

    const record = await Comment.findOne({_id: comment._doc._id})
    .populate({
      path: "userId",
      select: "-password"
    })

    return res.status(200).json({message: "Commented successfully", comment: record});

  } catch (error) {
    next(error);
  }
}

// [GET] /comment/:taskId
export const getAll = async (req, res, next) => {
  const userId = new mongoose.Types.ObjectId(req.userId);
  const {taskId} = req.params;
  try {
    const task = await Task.findOne({_id: taskId});
    if(!task) return next(errorHandler(400, "Task is not exist"));
    const project = await Project.findOne({_id: task.projectId});
    if(!project.authorUserId.equals(userId) && !project.membersId.some(id => id == userId))
    {
      return next(errorHandler(400, "You can't watch comments in this task"));
    }

    const comments = await Comment.find({taskId: taskId})
    .populate({
      path: "userId",
      select: "-password"
    });

    return res.status(200).json({message: "Get comments successfully", comments: comments});

  } catch (error) {
    next(error);
  }
}

// [PATCH] /comment/:id 
export const updateComment = async (req, res, next) => {
  const {id} = req.params;
  const userId = new mongoose.Types.ObjectId(req.userId);
  try {
    const comment = await Comment.findOne({_id: id});

    if(!comment.userId.equals(userId))
    {
      return next(errorHandler(400, "You can't change this comment"));
    }

    if(!req.body?.message && !req.body?.image && !req.body?.file)
    {
      return next(errorHandler(400, "Please enter content"));
    }

    await Comment.updateOne({_id: id}, req.body);

    const commentUpdate = await Comment.findOne({_id: id})
    .populate({
      path: "userId",
      select: "-password"
    });

    return res.status(200).json({message: "Updated successfully", comment: commentUpdate});

  } catch (error) {
    next(error);
  }
}

// [DELETE] /comment/:id
export const deleteComment = async (req, res, next) => {
  const {id} = req.params;
  const userId = new mongoose.Types.ObjectId(req.userId);
  try {
    const comment = await Comment.findOne({_id: id});

    if(!comment.userId.equals(userId))
    {
      return next(errorHandler(400, "You can't delete this comment"));
    }

    await Comment.deleteMany({
      $or: [
        {_id: id},
        {parentId: id}
      ]
    });

    return res.status(200).json({message: "Deleted successfully"});

  } catch (error) {
    next(error);
  }
}