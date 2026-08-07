const User = require("../models/user.model");
const Notification = require("../models/notification.model");
const admin = require("./privateKey");

/**
 * Sends real-time FCM Push Notification to user upon earning points/coins across any channel.
 * @param {String|ObjectId} userId
 * @param {String} title
 * @param {String} message
 */
const sendEarningNotification = async (userId, title, message) => {
  try {
    if (!userId || !title || !message) return;

    const user = await User.findById(userId).select("_id fcmToken").lean();
    if (!user || !user.fcmToken) {
      // Still log notification record in database for app notification center
      await new Notification({
        user: userId,
        notificationPersonType: 1, // User
        title: title.trim(),
        message: message.trim(),
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      }).save();
      return;
    }

    const notificationPayload = {
      token: user.fcmToken,
      data: {
        title: title.trim(),
        body: message.trim(),
      },
      notification: {
        title: title.trim(),
        body: message.trim(),
      },
    };

    const adminPromise = await admin;
    if (adminPromise && adminPromise.messaging) {
      adminPromise
        .messaging()
        .send(notificationPayload)
        .then(async () => {
          await new Notification({
            user: user._id,
            notificationPersonType: 1,
            title: title.trim(),
            message: message.trim(),
            date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
          }).save();
        })
        .catch(async (err) => {
          console.log("Error sending FCM earning push notification:", err.message);
          await new Notification({
            user: user._id,
            notificationPersonType: 1,
            title: title.trim(),
            message: message.trim(),
            date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
          }).save();
        });
    }
  } catch (error) {
    console.error("sendEarningNotification exception:", error);
  }
};

module.exports = sendEarningNotification;
