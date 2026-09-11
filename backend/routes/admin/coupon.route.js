const express = require("express");
const route = express.Router();
const checkAccessWithSecretKey = require("../../checkAccess");
const CouponController = require("../../controllers/admin/coupon.controller");

// Create coupon
route.post("/createCoupon", checkAccessWithSecretKey(), CouponController.createCoupon);

// Fetch coupons
route.get("/fetchCoupons", checkAccessWithSecretKey(), CouponController.fetchCoupons);

// Modify coupon
route.patch("/modifyCoupon", checkAccessWithSecretKey(), CouponController.modifyCoupon);

// Toggle active status
route.patch("/toggleCouponStatus", checkAccessWithSecretKey(), CouponController.toggleCouponStatus);

// Delete coupon
route.delete("/removeCoupon", checkAccessWithSecretKey(), CouponController.removeCoupon);

// Redemption list for single coupon
route.get("/retrieveCouponRedemptions", checkAccessWithSecretKey(), CouponController.retrieveCouponRedemptions);

// Overall coupon claims history across all coupons
route.get("/fetchAllCouponClaims", checkAccessWithSecretKey(), CouponController.fetchAllCouponClaims);

module.exports = route;
