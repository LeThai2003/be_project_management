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
  }],
  invitations: [{
    email: {type: String, required: true},
    invitedAt: {type: Date, default: Date.now},
    token: {type: String, required: true},
    expireAt: { type: Date, default: Date.now, expires: 10 * 60}
  }]
});

const Project = mongoose.model("Project", projectShema, "projects");

export default Project;