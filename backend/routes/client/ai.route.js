const express = require("express");
const route = express.Router();
const aiController = require("../../controllers/client/ai.controller");
const validateUserToken = require("../../middleware/validateUserToken.middleware");

// Get all AI dating profiles with their chat rates
route.get("/profiles", aiController.getAiProfiles);

// Get all AI topic advisors / experts (§4.9)
route.get("/experts", aiController.getAiExperts);

// Get all virtual gifts catalog
route.get("/gifts", aiController.getAiGifts);

// Send message to AI host or expert (deducts coins)
route.post("/chat", validateUserToken, aiController.sendAiMessage);

module.exports = route;
