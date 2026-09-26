const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");
const validateUserToken = require("../../middleware/validateUserToken.middleware");
const NotificationController = require("../../controllers/client/notification.controller");

route.get("/list", validateUserToken, checkAccessWithSecretKey(), NotificationController.getNotifications);
route.post("/clearAll", validateUserToken, checkAccessWithSecretKey(), NotificationController.clearAllNotifications);

// Notification analytics metrics (delivered & opened)
route.put("/history/delivered/:historyId", checkAccessWithSecretKey(), NotificationController.markPushNotificationDelivered);
route.put("/history/opened/:historyId", checkAccessWithSecretKey(), NotificationController.markPushNotificationOpened);

module.exports = route;
