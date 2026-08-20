const express = require("express");
const route = express.Router();
const aiController = require("../../controllers/client/ai.controller");
const validateUserToken = require("../../middleware/validateUserToken.middleware");

// Get all AI profiles with their chat rates
route.get("/profiles", aiController.getAiProfiles);

// Send message to AI host (deducts coins)
route.post("/chat", validateUserToken, aiController.sendAiMessage);

module.exports = route;
