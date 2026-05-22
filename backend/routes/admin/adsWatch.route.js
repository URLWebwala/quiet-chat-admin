const express = require("express");
const route = express.Router();

const AdsWatchController = require("../../controllers/admin/adsWatch.controller");
const AdsWatchRewardController = require("../../controllers/admin/adsWatchReward.controller");
const checkAccessWithSecretKey = require("../../checkAccess");

route.get("/fetchStats", AdsWatchController.fetchStats);
route.get("/fetchActivity", AdsWatchController.fetchActivity);
route.get("/fetchRecentLogs", AdsWatchController.fetchRecentLogs);

route.post("/reward/createReward", checkAccessWithSecretKey(), AdsWatchRewardController.createReward);
route.patch("/reward/updateReward", checkAccessWithSecretKey(), AdsWatchRewardController.updateReward);
route.get("/reward/fetchRewards", checkAccessWithSecretKey(), AdsWatchRewardController.fetchRewards);
route.patch("/reward/toggleRewardStatus", checkAccessWithSecretKey(), AdsWatchRewardController.toggleRewardStatus);
route.delete("/reward/removeReward", checkAccessWithSecretKey(), AdsWatchRewardController.removeReward);

module.exports = route;
