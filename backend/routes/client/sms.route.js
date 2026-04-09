const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");
const SmsOtpController = require("../../controllers/client/smsOtp.controller");

/** No Firebase ID token — app uses static API key only for these pre-login calls */
route.post("/requestOtp", checkAccessWithSecretKey(), SmsOtpController.requestOtp);
route.post("/verifyOtp", checkAccessWithSecretKey(), SmsOtpController.verifyOtp);

module.exports = route;
