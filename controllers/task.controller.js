import { convertToSlug } from "../helpers/convertToSlug.js";
import Project from "../models/project.model.js";
import Task from "../models/task.model.js";
import { generateRandomNumber } from "../utils/generate.js";
import { errorHandler } from "../utils/handleError.js";
import mongoose from "mongoose";

export const create = async (req, res, next) => {
  const userId = req.userId;
  let {title, description, status, priority, tags, startDate, dueDate, imageTask, projectId, sub_tasks, assigneeUserId} = req.body;
  try {

    console.log(assigneeUserId);

    if(assigneeUserId == "") assigneeUserId = null

    const objectTask = {
      title,
      slugTitle: convertToSlug(title),
      description,
      status: status || 'To Do',
      priority: priority || 'Backlog',
      tags,
      startDate: startDate || new Date(),
      dueDate: dueDate || new Date(),
      imageTask,
      projectId,
      sub_tasks,
      authorUserId: userId,
      assigneeUserId
    };
    const newTask = new Task(objectTask);
    await newTask.save();

    const task = await Task.findOne({_id: newTask._id})
    .populate({
      path: "authorUserId",
      select: "-password"
    })
    .populate({
      path: "assigneeUserId",
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
  const userId = new mongoose.Types.ObjectId(req.userId);
  try {
    const tasks = await Task.find({projectId: projectId})
    .populate({
      path: "authorUserId",
      select: "-password"
    })
    .populate({
      path: "assigneeUserId",
      select: "-password"
    });

    const project = await Project.findOne({_id: projectId});
    if(!project.authorUserId.equals(userId) && !project.membersId?.some(id => id.equals(userId)))
    {
      return next(errorHandler(400, "You can't watch tasks of this project"));
    }

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
    if(!task.authorUserId.equals(userId) && !task.assigneeUserId.equals(userId))
    {
      return next(errorHandler(400, "You couldn't change the status this task"));
    }

    const subTasks = task.sub_tasks;

    if(subTasks.length > 0)
    {
      if(toStatus == "Under Review" || toStatus == "Completed")
      {
        for (const item of task.sub_tasks) {
          item.isChecked = true;
        }
      }
      else if(toStatus == "To Do")
      {
        for (const item of task.sub_tasks) {
          item.isChecked = false;
        }
      }
      else if((task.status == "Under Review" || task.status == "Completed") && (toStatus == "To Do" || toStatus == "Work In Progress"))
      {
        for (const item of task.sub_tasks) {
          item.isChecked = false;
        }
      }
    }

    await Task.updateOne({_id: taskId}, {status: toStatus, sub_tasks: task.sub_tasks});

    const taskUpdated = await Task.findOne({_id: taskId})
    .populate({
      path: "authorUserId",
      select: "-password"
    })
    .populate({
      path: "assigneeUserId",
      select: "-password"
    });
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
    if(!task.authorUserId.equals(userId) && !task.assigneeUserId.equals(userId))
    {
      return next(errorHandler(401, "You couldn't change the status this task"));
    }

    if(req.body.assigneeUserId == "") req.body.assigneeUserId = null
    
    let status = task.status;
    const subTasks = req.body.sub_tasks;
    if(subTasks.length > 0)
    {
      if(req.body.status == "Under Review" || req.body.status == "Completed")
      {
        for (const item of req.body.sub_tasks) {
          item.isChecked = true;
        }
      }
      else if(req.body.status == "To Do")
      {
        for (const item of req.body.sub_tasks) {
          item.isChecked = false;
        }
      }
      else if((task.status == "Under Review" || task.status == "Completed") && (req.body.status == "To Do" || req.body.status == "Work In Progress"))
      {
        for (const item of req.body.sub_tasks) {
          item.isChecked = false;
        }
      }
    }

    await Task.updateOne({_id: taskId}, req.body);
    const taskUpdated = await Task.findOne({_id: taskId})
    .populate({
      path: "authorUserId",
      select: "-password"
    })
    .populate({
      path: "assigneeUserId",
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

// [GET] /task/:taskId
export const taskDetail = async (req, res, next) => {
  const {taskId} = req.params;
  const userId = new mongoose.Types.ObjectId(req.userId);
  try {
    const task = await Task.findOne({_id: taskId})
    .populate(
      "projectId"
    )
    .populate({
      path: "authorUserId",
      select: "-password"
    })
    .populate({
      path: "assigneeUserId",
      select: "-password"
    });

    // console.log(task);

    let isJustView = false;

    if(!task.projectId.authorUserId.equals(userId) && !task.projectId.membersId?.some(id => id.equals(userId)))
    {
      return next(errorHandler(400, "You couldn't watch this task"));
    }

    if(!task.authorUserId.equals(userId) && !task.assigneeUserId?.equals(userId))
    {
      isJustView = true;
    }

    return res.status(200).json({message: "Get task detail successfully", task: {...task._doc, isJustView}});

  } catch (error) {
    next(error);
  }
}

// [PATCH] /task/update-completed/:taskId
export const updateCompleted = async (req, res, next) => {
  const {listCheck} = req.body;
  const userId = new mongoose.Types.ObjectId(req.userId);
  const {taskId} = req.params;
  try {
    const task = await Task.findOne({_id: taskId});
    if(!task.authorUserId.equals(userId) && !task.assigneeUserId?.equals(userId))
    {
      return next(errorHandler(400, "You couldn't change sub list tasks"));
    }

    let status = task.status;

    if(listCheck.length > 0 && !listCheck.includes("completed"))
    {
      for (const item of task.sub_tasks) {
        if(listCheck.includes(item._id.toString())) 
          item.isChecked = true;
        else 
          item.isChecked = false;
      }
  
      if(listCheck.length == task.sub_tasks.length)
      {
        status = "Under Review";
      }
      else
      {
        status = "Work In Progress"
      }
  
      await Task.updateOne({
        _id: taskId
      }, {
        sub_tasks: task.sub_tasks,
        status: status
      });
    }
    else if(listCheck.length > 0 && listCheck.includes("completed"))
    {
      await Task.updateOne({
        _id: taskId
      }, {
        status: "Under Review"
      });
    }
    else  // listCheck == 0
    {
      status = "To Do";
      for (const item of task.sub_tasks) {
        item.isChecked = false;
      }
      await Task.updateOne({
        _id: taskId
      }, {
        status: status
      });
    }

    const taskUpdated = await Task.findOne({_id: taskId})
    .populate({
      path: "authorUserId",
      select: "-password"
    })
    .populate({
      path: "assigneeUserId",
      select: "-password"
    });

    return res.json({message: "Update successfully", task: taskUpdated});
  } catch (error) {
    next(error);
  }
}