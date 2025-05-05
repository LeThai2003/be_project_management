import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullname: {type: String, required: true},
  email: {type: String, required: true, unique: true},
  password: {type: String, required: true},
  profilePicture: {
    type: String,
    default: 'https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg',
  },
  major: {type: String},
  description: {type: String}
}, {
  timestamps: true
});

const User = mongoose.model("User", userSchema, "users");

export default User;