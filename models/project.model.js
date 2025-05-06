import mongoose, { Schema } from "mongoose";


const projectShema = new mongoose.Schema({
  name: {type: String, required: true},
  description: {type: String},
  startDate: {type: Date},
  endDate: {type: Date},
  authorUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  membersId: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

const Project = mongoose.model("Project", projectShema, "projects");

export default Project;