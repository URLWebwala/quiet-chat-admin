const Notification = require("../../models/notification.model");
const mongoose = require("mongoose");

// Get notification list for client (User or Host)
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const hostId = req.hostId || req.host?._id;

    const query = { $or: [] };

    if (userId) {
      query.$or.push(
        { user: new mongoose.Types.ObjectId(userId) },
        { user: null, host: null, notificationPersonType: { $in: [1, 3] } }
      );
    } else if (hostId) {
      query.$or.push(
        { host: new mongoose.Types.ObjectId(hostId) },
        { user: null, host: null, notificationPersonType: { $in: [2, 3] } }
      );
    } else {
      query.$or.push({ user: null, host: null });
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(60)
      .lean();

    return res.status(200).json({
      status: true,
      message: "Notifications fetched successfully",
      data: notifications,
    });
  } catch (error) {
    console.error("getNotifications error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Failed to fetch notifications",
    });
  }
};

// Clear / delete all notifications for client
exports.clearAllNotifications = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const hostId = req.hostId || req.host?._id;

    if (userId) {
      await Notification.deleteMany({ user: new mongoose.Types.ObjectId(userId) });
    } else if (hostId) {
      await Notification.deleteMany({ host: new mongoose.Types.ObjectId(hostId) });
    }

    return res.status(200).json({
      status: true,
      message: "All notifications cleared successfully",
    });
  } catch (error) {
    console.error("clearAllNotifications error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Failed to clear notifications",
    });
  }
};
