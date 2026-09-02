const express = require("express");
const route = express.Router();
const checkAccessWithSecretKey = require("../../checkAccess");
const OfferWallController = require("../../controllers/admin/offerWall.controller");

const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

// Add Offer Wall Banner
route.post(
  "/addOfferWall",
  checkAccessWithSecretKey(),
  upload.fields([{ name: "image", maxCount: 1 }]),
  OfferWallController.addOfferWall
);

// Modify Offer Wall Banner
route.patch(
  "/updateOfferWall",
  checkAccessWithSecretKey(),
  upload.fields([{ name: "image", maxCount: 1 }]),
  OfferWallController.modifyOfferWall
);

// Toggle Status (Active / Closed)
route.patch(
  "/toggleStatus",
  checkAccessWithSecretKey(),
  OfferWallController.toggleStatus
);

// Retrieve List
route.get(
  "/list",
  checkAccessWithSecretKey(),
  OfferWallController.retrieveOfferWallList
);

// Delete Banner
route.delete(
  "/delete",
  checkAccessWithSecretKey(),
  OfferWallController.discardOfferWall
);

module.exports = route;
