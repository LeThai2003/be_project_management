import Project from "../models/project.model.js";

// [POST] /project/create
export const create = async (req, res, next) => {
  const userId = req.userId;
  const {name, description, startDate, endDate} = req.body;
  try {
    const newProject = new Project({
      name,
      description,
      startDate,
      endDate,
      authorUserId: userId
    });

    await newProject.save();

    res.status(200).json({message: "Create a new project successfully"});
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
  try {
    const project = await Project.findOne({_id: id});
    return res.status(200).json({message: "Get a detail project successfully", project: project});
  } catch (error) {
    next(error);
  }
}