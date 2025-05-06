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
      sub_tasks
    };
    const newTask = new Task(objectTask);
    await newTask.save();

    // if(sub_tasks.length > 0)
    // {
    //   const record = newTask.toObject();
    //   const taskId = record._id;
    //   for (const task of sub_tasks) {
    //     const randomNumber = generateRandomNumber(10);
    //     task["sub_task_id"] = `${taskId}-${randomNumber}`;
    //   }

    //   await Task.updateOne({_id: taskId}, {sub_tasks: sub_tasks});
    // }

    return res.status(200).json("Create a new task successfully");
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

// [GET] /task/update-status
export const updateStatus = async (req, res, next) => {
  const userId = new mongoose.Types.ObjectId(req.userId);
  const {toStatus, taskId} = req.body;
  console.log(toStatus, taskId);
  try {
    const task = await Task.findOne({_id: taskId});
    if(!task.authorUserId.equals(userId) && !task.assignedUserId.equals(userId))
    {
      return next(errorHandler(400, "You couldn't change the status this task"));
    }
    await Task.updateOne({_id: taskId}, {status: toStatus});
    return res.status(200).json({message: "Change status of task successfully"});
  } catch (error) {
    next(error);
  }
}