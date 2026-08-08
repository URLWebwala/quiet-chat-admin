const express = require("express");
const route = express.Router();
const dailyChallengeController = require("../../controllers/dailyChallenge.controller");

route.post("/create", dailyChallengeController.createDailyChallenge);
route.get("/list", dailyChallengeController.getDailyChallenges);
route.put("/update", dailyChallengeController.updateDailyChallenge);
route.delete("/delete", dailyChallengeController.deleteDailyChallenge);

module.exports = route;
