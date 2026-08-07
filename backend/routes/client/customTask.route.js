const express = require("express");
const route = express.Router();
const multer = require("multer");

const storage = require("../../util/multer");
const upload = multer({ storage });

const checkAccessWithSecretKey = require("../../checkAccess");
const validateUserToken = require("../../middleware/validateUserToken.middleware");
const customTaskController = require("../../controllers/client/customTask.controller");

route.get("/list", validateUserToken, checkAccessWithSecretKey(), customTaskController.getTaskList);
route.post("/submitProof", validateUserToken, checkAccessWithSecretKey(), upload.single("proofImage"), customTaskController.submitTaskProof);

module.exports = route;
