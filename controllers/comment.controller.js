import mongoose from "mongoose";
import Project from "../models/project.model.js";
import Task from "../models/task.model.js";
import { errorHandler } from "../utils/handleError.js";
import Comment from "../models/comment.model.js";
import { onlineUsers, userTaskMap } from "../sockets/comments/handleComment.socket.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";




export const create = async (req, res, next) => {
  const userId = new mongoose.Types.ObjectId(req.userId);
  const {taskId} = req.params;
  try {
    const task = await Task.findOne({_id: taskId});
    if(!task) return next(errorHandler(400, "Task is not exist"));
    const project = await Project.findOne({_id: task.projectId});
    if(!project.authorUserId.equals(userId) && !project.membersId.some(id => id.equals(userId)))
    {
      return next(errorHandler(400, "You can't comment in this task"));
    }

    if(!req.body?.message && !req.body?.imagesUrl?.length > 0 && !req.body?.file)
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
      select: "-password -refreshToken"
    });

    const user = await User.findOne({_id: req.userId}).select("fullname");

    // ----------------socket--------------------
    // console.log("..............................", req.body.parentId);
    if(req.body.parentId)
    {
      _io.to(`task-${taskId}`).emit(`SERVER_SEND_REP_COMMENT`, {
        comment: record
      });
    }
    else
    {
      _io.to(`task-${taskId}`).emit(`SERVER_SEND_NEW_COMMENT`, {
        comment: record
      });
    }

    // Tìm người tạo task và assignee để gửi thông báo
    // console.log(task);

    const relatedUsers = [task.authorUserId];
    if(task.assigneeUserId) relatedUsers.push(task.assigneeUserId);

    for (const targetUserId of relatedUsers) {
      if (targetUserId == userId.toString) continue;

      const viewingTask = userTaskMap.get(targetUserId.toString());
      if (!viewingTask || (viewingTask !== taskId)) {

        const object = {
          type: "comment",
          title: `${user.fullname} commented on task ${task.title}`,
          commentId: record._id,
          taskId: taskId,
          userId: targetUserId
        };

        const newNotify = new Notification(object);
        await newNotify.save();

        _io.emit("NOTIFICATION", {
          notification: newNotify._doc
        });

      }
    }

    // --------------end socket------------------

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
    if(!project.authorUserId.equals(userId) && !project.membersId.some(id => id.equals(userId)))
    {
      return next(errorHandler(400, "You can't watch comments in this task"));
    }

    // ----------------socket--------------------
    
    // --------------end socket------------------

    const comments = await Comment.find({taskId: taskId})
    .populate({
      path: "userId",
      select: "-password -refreshToken"
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

    if(!req.body?.message && !req.body?.imagesUrl?.length > 0 && !req.body?.file)
    {
      return next(errorHandler(400, "Please enter content"));
    }

    await Comment.updateOne({_id: id}, req.body);

    const commentUpdate = await Comment.findOne({_id: id})
    .populate({
      path: "userId",
      select: "-password -refreshToken"
    });


    // ----------------socket--------------------
    _io.to(`task-${commentUpdate.taskId}`).emit(`SERVER_SEND_UPDATE_COMMENT`, {
      comment: commentUpdate
    });
    // --------------end socket------------------

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

    // ----------------socket--------------------
    _io.to(`task-${comment.taskId}`).emit(`SERVER_DELETE_COMMENT`, {commentId: comment._id});

    const notifications = await Notification.find({commentId: id});
    if(notifications.length > 0)
    {
      for (const item of notifications) {
        _io.emit(`NOTIFY_SERVER_DELETE_COMMENT`, {commentId: item.commentId, userId: item.userId});
      }
    }
    // --------------end socket------------------

    await Comment.deleteMany({
      $or: [
        {_id: id},
        {parentId: id}
      ]
    });

    await Notification.deleteMany({commentId: id});
    


    return res.status(200).json({message: "Deleted successfully"});

  } catch (error) {
    next(error);
  }
}

// [PATCH] /comment/like/:id
export const updateLike = async (req, res, next) => {
  const {id} = req.params;
  const userId = new mongoose.Types.ObjectId(req.userId);
  try {
    const comment = await Comment.findOne({_id: id}).populate("taskId");

    if(!comment) return next(errorHandler(400, "Comment is not exist"));
    
    const project = await Project.findOne({_id: comment.taskId.projectId});
    if(!project.authorUserId.equals(userId) && !project.membersId?.some(id => id.equals(userId)))
    {
      return next(errorHandler(400, "You are not a member"));
    }

    // console.log(comment.like);

    if(comment.like?.some(id => id.equals(userId)))
    {
      await Comment.updateOne({_id: id}, {$pull: {like: userId}});
    }
    else
    {
      await Comment.updateOne({_id: id}, {$push: {like: userId}});
    }

    // ----------------socket--------------------
    _io.to(`task-${comment.taskId._id}`).emit(`SERVER_UPDATE_LIKE_COMMENT`, {commentId: comment._id, userId: userId.toString()});
    // --------------end socket------------------

    return res.status(200).json({message: "Updated like successfully"});

  } catch (error) {
    next(error);
  }
}