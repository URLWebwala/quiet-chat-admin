const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");
const validateUserToken = require("../../middleware/validateUserToken.middleware");
const AdsWatchController = require("../../controllers/client/adsWatch.controller");

route.get("/getStatus", validateUserToken, checkAccessWithSecretKey(), AdsWatchController.getStatus);
route.post("/watchAd", validateUserToken, checkAccessWithSecretKey(), AdsWatchController.watchAd);
route.post("/claimCoins", validateUserToken, checkAccessWithSecretKey(), AdsWatchController.claimCoins);
route.post("/claimRupees", validateUserToken, checkAccessWithSecretKey(), AdsWatchController.claimRupees);
route.get("/fetchRewards", validateUserToken, checkAccessWithSecretKey(), AdsWatchController.fetchRewards);
route.post("/redeemReward", validateUserToken, checkAccessWithSecretKey(), AdsWatchController.redeemReward);

module.exports = route;
