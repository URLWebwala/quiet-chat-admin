const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");
const customTaskController = require("../../controllers/admin/customTask.controller");

route.post("/create", checkAccessWithSecretKey(), customTaskController.createTask);
route.get("/fetch", checkAccessWithSecretKey(), customTaskController.fetchTasks);
route.patch("/update", checkAccessWithSecretKey(), customTaskController.updateTask);
route.delete("/delete", checkAccessWithSecretKey(), customTaskController.deleteTask);

route.get("/submissions", checkAccessWithSecretKey(), customTaskController.fetchSubmissions);
route.post("/verifySubmission", checkAccessWithSecretKey(), customTaskController.verifySubmission);

module.exports = route;
