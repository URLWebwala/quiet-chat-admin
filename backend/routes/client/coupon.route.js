const express = require("express");
const route = express.Router();
const checkAccessWithSecretKey = require("../../checkAccess");
const validateUserToken = require("../../middleware/validateUserToken.middleware");
const CouponController = require("../../controllers/client/coupon.controller");

// User claims coupon
route.post("/redeemCoupon", checkAccessWithSecretKey(), validateUserToken, CouponController.redeemCoupon);

module.exports = route;
