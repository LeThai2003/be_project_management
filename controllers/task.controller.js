import Task from "../models/task.model.js";
import { generateRandomNumber } from "../utils/generate.js";
import { errorHandler } from "../utils/handleError.js";
import mongoose from "mongoose";

export const create = async (req, res, next) => {
  const userId = req.userId;
  const {title, description, status, priority, tags, startDate, dueDate, imageTask, projectId, sub_tasks} = req.body;
  try {
    const objectTask = {
      title,
      description,
      status,
      priority,
      tags,
      startDate,
      dueDate,
      imageTask,
      projectId,
      sub_tasks,
      authorUserId: userId,
    };
    const newTask = new Task(objectTask);
    await newTask.save();

    const task = await Task.find({_id: newTask._id})
    .populate({
      path: "authorUserId",
      select: "-password"
    });

    return res.status(200).json({message: "Create a new task successfully", task: task});
  } catch (error) {
    next(error);
  }
} 

// [GET] /task/get-all
export const getAll = async (req, res, next) => {
  const projectId = req.query.projectId;
  try {
    const tasks = await Task.find({projectId: projectId})
    .populate({
      path: "authorUserId",
      select: "-password"
    });

    res.status(200).json({message: "Get tasks successfully", tasks: tasks});

  } catch (error) {
    next(error);
  }
}

// [PATCH] /task/update-status
export const updateStatus = async (req, res, next) => {
  const userId = new mongoose.Types.ObjectId(req.userId);
  const {toStatus, taskId} = req.body;
  try {
    const task = await Task.findOne({_id: taskId});
    if(!task.authorUserId.equals(userId) && !task.assignedUserId.equals(userId))
    {
      return next(errorHandler(400, "You couldn't change the status this task"));
    }
    await Task.updateOne({_id: taskId}, {status: toStatus});

    const taskUpdated = await Task.findOne({_id: taskId})
    .populate({
      path: "authorUserId",
      select: "-password"
    });;
    return res.status(200).json({message: "Change status of task successfully", task: taskUpdated });
  } catch (error) {
    next(error);
  }
}

// [PATCH] /task/update/:taskId
export const updateTask = async (req, res, next) => {
  const userId = new mongoose.Types.ObjectId(req.userId);
  const {taskId} = req.params;
  // console.log(taskId);
  // console.log(req.body);
  try {
    const task = await Task.findOne({_id: taskId});
    if(!task.authorUserId.equals(userId) && !task.assignedUserId.equals(userId))
    {
      return next(errorHandler(400, "You couldn't change the status this task"));
    }
    await Task.updateOne({_id: taskId}, req.body);
    const taskUpdated = await Task.findOne({_id: taskId})
    .populate({
      path: "authorUserId",
      select: "-password"
    });
    return res.status(200).json({message: "Update task successfully", task: taskUpdated});
  } catch (error) {
    next(error);
  }
}

// [DELETE] /task/delete/:taskId
export const deleteTask = async (req, res, next) => {
  const {taskId} = req.params;
  const userId = new mongoose.Types.ObjectId(req.userId);
  try {
    const task = await Task.findOne({_id: taskId});
    if(!task.authorUserId.equals(userId))
    {
      return next(errorHandler(400, "You couldn't delete this task"));
    }
    await Task.deleteOne({_id: taskId});
    return res.status(200).json({message: "Delete task successfully"});
  } catch (error) {
    next(error);
  }
}