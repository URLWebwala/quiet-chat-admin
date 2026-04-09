//express
const express = require("express");
const route = express.Router();

//middleware
const checkAccessWithSecretKey = require("../../checkAccess");
const validateUserToken = require("../../middleware/validateUserToken.middleware");

//controller
const SwipeController = require("../../controllers/client/swipe.controller");

// record like / skip for a host
route.post("/recordSwipe", validateUserToken, checkAccessWithSecretKey(), SwipeController.recordSwipe);

// discover hosts for Smart Connect
route.get("/discover", validateUserToken, checkAccessWithSecretKey(), SwipeController.discoverHosts);

// check match (heart tap)
route.post("/checkMatch", validateUserToken, checkAccessWithSecretKey(), SwipeController.checkMatch);

module.exports = route;

