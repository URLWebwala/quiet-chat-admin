const express = require("express");
const route = express.Router();
const hostManageController = require("../../controllers/admin/hostManage.controller");

// Summary of all AI hosts with total users & chat counts
route.get("/hosts-summary", hostManageController.getHostsSummary);

// Users registered for a specific host
route.get("/users", hostManageController.getHostUsers);

// Full chat history between a specific user and their host
route.get("/user-chats", hostManageController.getUserChatHistory);

// Management actions
route.delete("/user/:hostUserId", hostManageController.deleteHostUser);
route.patch("/user/:hostUserId/toggle-block", hostManageController.toggleBlockHostUser);
route.post("/clear-chats", hostManageController.clearUserChats);

module.exports = route;
