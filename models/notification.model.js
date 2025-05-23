import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    type: String,
    title: String,
    userId: String,
    taskId: String,   // danh cho comment
    projectId: String,   // danh cho them thanh vien
    commentId: String,  // comment
    isSeen: {type: Boolean, default: false},
    expireAt: { type: Date, default: Date.now, expires: 7 * 24 * 3600 }  // 7 ngay
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model("Notification", NotificationSchema);

export default Notification;