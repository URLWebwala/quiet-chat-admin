const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");
const verifyAdminAuthToken = require("../../middleware/verifyAdminAuthToken.middleware");
const customTaskController = require("../../controllers/admin/customTask.controller");

route.post("/create", verifyAdminAuthToken, checkAccessWithSecretKey(), customTaskController.createTask);
route.get("/fetch", verifyAdminAuthToken, checkAccessWithSecretKey(), customTaskController.fetchTasks);
route.patch("/update", verifyAdminAuthToken, checkAccessWithSecretKey(), customTaskController.updateTask);
route.delete("/delete", verifyAdminAuthToken, checkAccessWithSecretKey(), customTaskController.deleteTask);

route.get("/submissions", verifyAdminAuthToken, checkAccessWithSecretKey(), customTaskController.fetchSubmissions);
route.post("/verifySubmission", verifyAdminAuthToken, checkAccessWithSecretKey(), customTaskController.verifySubmission);

module.exports = route;
