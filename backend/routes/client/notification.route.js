const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");
const validateUserToken = require("../../middleware/validateUserToken.middleware");
const NotificationController = require("../../controllers/client/notification.controller");

route.get("/list", validateUserToken, checkAccessWithSecretKey(), NotificationController.getNotifications);
route.post("/clearAll", validateUserToken, checkAccessWithSecretKey(), NotificationController.clearAllNotifications);

module.exports = route;
