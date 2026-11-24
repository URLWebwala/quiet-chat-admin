const express = require("express");
const route = express.Router();
const hostUserController = require("../controllers/hostUser.controller");
const { validateHostUserToken } = require("../middleware/validateHostUserToken.middleware");

// Public authentication routes (per-host persona)
route.post("/register", hostUserController.register);
route.post("/login", hostUserController.login);

// Authenticated user routes (JWT required)
route.get("/profile", validateHostUserToken, hostUserController.getProfile);
route.patch("/profile", validateHostUserToken, hostUserController.updateProfile);
route.post("/chat", validateHostUserToken, hostUserController.chat);
route.get("/history", validateHostUserToken, hostUserController.getHistory);
route.post("/reset", validateHostUserToken, hostUserController.resetHistory);

module.exports = route;
