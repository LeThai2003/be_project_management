import { convertToSlug } from "../helpers/convertToSlug.js";
import Notification from "../models/notification.model.js";
import Project from "../models/project.model.js";
import Task from "../models/task.model.js";
import User from "../models/user.model.js";
import { generateRandomNumber } from "../utils/generate.js";
import { errorHandler } from "../utils/handleError.js";
import mongoose from "mongoose";

export const create = async (req, res, next) => {
  const userId = req.userId;
  let {title, description, status, priority, tags, startDate, dueDate, imageTask, projectId, sub_tasks, assigneeUserId} = req.body;
  try {

    // console.log(assigneeUserId);
    const project = await Project.findOne({_id: projectId});
    const memberIds = [project.authorUserId, ...(project.membersId || [])].map(id => id.toString());

    console.log(memberIds);
    console.log(userId);

    if(!memberIds.includes(userId))
    {
      return next(errorHandler(400, "You can't create a new task"));
    }

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
      select: "-password  -refreshToken"
    })
    .populate({
      path: "assigneeUserId",
      select: "-password  -refreshToken"
    });

    const relatedUserNotify = memberIds.filter(id => id != userId);
    console.log(relatedUserNotify);
    if(relatedUserNotify.length > 0)
    {
      const userInfo = await User.findOne({_id: userId}).select("fullname");

      for (const id of relatedUserNotify) {
        const object = {
          type: "task",
          title: `${userInfo.fullname} adds task ${title} to project ${project.name}`,
          projectId: projectId,
          userId: id,
          taskId: task._id
        };

        // console.log(object);

        const newNotify = new Notification(object);
        await newNotify.save();
      }

      _io.emit("NOTIFY_CREATE_NEW_TASK", {
        notification: {
          type: "task",
          title: `${userInfo.fullname} adds task ${title} to project ${project.name}`,
          projectId: projectId,
          taskId: task._id
        },
        relatedUserNotify
      })

      _io.emit("SERVER_RETURN_NEW_TASK", {
        task,
        relatedUserNotify
      })
    }

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
      select: "-password -refreshToken"
    })
    .populate({
      path: "assigneeUserId",
      select: "-password -refreshToken"
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
      select: "-password -refreshToken"
    })
    .populate({
      path: "assigneeUserId",
      select: "-password -refreshToken"
    });

    const project = await Project.findOne({_id: task.projectId});
    const memberIds = [project.authorUserId, ...(project.membersId || [])].map(id => id.toString());

    const relatedUserNotify = memberIds.filter(id => id != userId);

    _io.emit("UPDATE_TASK_DRAG_DROP", {
      task: taskUpdated,
      relatedUserNotify
    })

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
      select: "-password -refreshToken"
    })
    .populate({
      path: "assigneeUserId",
      select: "-password -refreshToken"
    });

    const project = await Project.findOne({_id: task.projectId});
    const memberIds = [project.authorUserId, ...(project.membersId || [])].map(id => id.toString());

    const relatedUserNotify = memberIds.filter(id => id != userId);

    _io.emit("UPDATE_TASK", {
      task: taskUpdated,
      relatedUserNotify
    })

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

    const notifications = await Notification.find({taskId: taskId});
    if(notifications.length > 0)
    {
      for (const item of notifications) {
        _io.emit(`NOTIFY_SERVER_DELETE_TASK`, {taskId: item.taskId, userId: item.userId});
      }
    }

    await Notification.deleteMany({taskId: taskId});

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
      select: "-password  -refreshToken"
    })
    .populate({
      path: "assigneeUserId",
      select: "-password  -refreshToken"
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
      select: "-password  -refreshToken"
    })
    .populate({
      path: "assigneeUserId",
      select: "-password  -refreshToken"
    });

    return res.json({message: "Update successfully", task: taskUpdated});
  } catch (error) {
    next(error);
  }
}


export const deleteTasks = async (req, res, next) => {
  await Task.deleteMany();
}

// [GET] /task/data-chart
export const dataChart = async (req, res, next) => {
  // console.log("--------")
  const userId = req.userId;
  try {
    const tasks = await Task.find({
      $or: [
        {authorUserId: userId},
        {assigneeUserId: userId}
      ]
    });

    const data = [];
    const arrStatus = ["To Do", "Work In Progress", "Under Review", "Completed"];

    for (const status of arrStatus) {
      const count = tasks?.filter(task => task.status == status).length || 0;
      data.push({
        status: status,
        count: count
      })
    }

    return res.status(200).json({message: "Get data tasks for chart successfully", data: data, total: tasks?.length || 0});

  } catch (error) {
    next(error);
  }
}

// [GET] /task/priority/:priority
export const tasksPriority = async (req, res, next) => {
  const userId = req.userId;
  const {priority} = req.params;
  try {
    const arrPriority = ['Backlog', 'Low', 'Medium', 'High', 'Urgent'];
    if(!arrPriority.includes(priority))
    {
      return next(errorHandler(400, "Priority not valid"));
    }

    const projects = await Project.find({
      $or: [
        {authorUserId: userId},
        {membersId: userId}
      ]
    });

    const tasks = await Task.find({
      $and: [
        {
          $or: [
            {authorUserId: userId},
            {assigneeUserId: userId}
          ]
        },
        {priority: priority}
      ]
    })
    .populate({
      path: "authorUserId",
      select: "fullname profilePicture"
    })
    .populate({
      path: "assigneeUserId",
      select: "fullname profilePicture"
    })
    .select("-sub_tasks");

    let dataResult = [];

    if(tasks.length > 0)
    {
      for (const project of projects) {
        const tasksResult = tasks.filter(task => new mongoose.Types.ObjectId(task.projectId).equals(project._id));
        if(tasksResult.length > 0)
        {
          dataResult.push({
            project: {
              id: project._id,
              name: project.name
            },
            tasks: tasksResult
          })
        }
      }
    }

    return res.status(200).json({message: "Get tasks priority successfully", dataPriorityTasks: dataResult});

  } catch (error) {
    next(error);
  }
}