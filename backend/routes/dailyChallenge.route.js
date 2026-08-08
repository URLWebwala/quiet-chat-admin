const express = require("express");
const router = express.Router();
const checkAccess = require("../checkAccess");
const dailyChallengeController = require("../controllers/dailyChallenge.controller");

// Admin routes
router.post("/create", checkAccess(), dailyChallengeController.createDailyChallenge);
router.get("/list", checkAccess(), dailyChallengeController.getDailyChallenges);
router.put("/update", checkAccess(), dailyChallengeController.updateDailyChallenge);
router.delete("/delete", checkAccess(), dailyChallengeController.deleteDailyChallenge);

// Client App routes
router.get("/getToday", checkAccess(), dailyChallengeController.getTodayChallenge);
router.post("/claimBonus", checkAccess(), dailyChallengeController.claimDailyBonus);

module.exports = router;
