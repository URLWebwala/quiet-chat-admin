const express = require("express");
const route = express.Router();
const checkAccessWithSecretKey = require("../../checkAccess");
const OfferWallController = require("../../controllers/client/offerWall.controller");

// Get Random Active Offer for Popup Modal
route.get(
  "/random",
  checkAccessWithSecretKey(),
  OfferWallController.getRandomOffer
);

// Get All Active Offers
route.get(
  "/list",
  checkAccessWithSecretKey(),
  OfferWallController.getActiveOffers
);

// Track View / Impression
route.post(
  "/track-impression",
  checkAccessWithSecretKey(),
  OfferWallController.trackImpression
);

// Track Click
route.post(
  "/track-click",
  checkAccessWithSecretKey(),
  OfferWallController.trackClick
);

module.exports = route;
