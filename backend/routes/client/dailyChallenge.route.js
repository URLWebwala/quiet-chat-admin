const express = require("express");
const route = express.Router();
const checkAccess = require("../../checkAccess");
const dailyChallengeController = require("../../controllers/dailyChallenge.controller");

route.get("/getToday", checkAccess(), dailyChallengeController.getTodayChallenge);
route.post("/claimBonus", checkAccess(), dailyChallengeController.claimDailyBonus);

module.exports = route;
