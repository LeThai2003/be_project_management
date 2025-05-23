import Notification from "../models/notification.model.js";

export const getAllNotifications = async (req, res, next) => {
  const userId = req.userId;
  try {
    const notifications = await Notification.find({userId: userId}).sort({createdAt: "desc"});
    return res.status(200).json({message: "Get notifications successfully", notifications});
  } catch (error) {
    next(error);
  }
}

// [PATCH] /notification/update-seen/:id
export const updateSeen = async (req, res, next ) => {
  const {id} = req.params;
  try {
    await Notification.updateOne({
      _id: id
    }, {
      isSeen: true
    });

    return res.status(200).json("Seen All Notifications");
  } catch (error) {
    next(error);
  }
}