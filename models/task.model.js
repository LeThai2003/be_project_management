import mongoose, { mongo, Schema } from "mongoose";
import slug from 'mongoose-slug-generator';
// import slug from "mongoose-slug-updater";

// mongoose.plugin(slug);

const subTaskSchema = new mongoose.Schema({
  // sub_task_id: {type: String},
  sub_title: {type: String, required: true},
  isChecked: {type: Boolean, default: false}
});

const taskSchema = new mongoose.Schema({
  title: {type: String, required: true},
  // slugTitle: {type: String, slug: "title"},
  slugTitle: {type: String},
  description: {type: String},
  status: {
    type: String,
    enum: ['To Do', 'Work In Progress', 'Under Review', 'Completed'],
    default: 'To Do'
  },
  priority: {
    type: String,
    enum: ['Backlog', 'Low', 'Medium', 'High', 'Urgent'],
    default: 'Backlog'
  },
  tags: {type: String},
  startDate: {type: Date},
  dueDate: {type: Date},
  imageTask: {type: String},
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project"
  },
  authorUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  assigneeUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  sub_tasks: [subTaskSchema]
}, {
  timestamps: true
});

const Task = mongoose.model("Task", taskSchema, "tasks");

export default Task;