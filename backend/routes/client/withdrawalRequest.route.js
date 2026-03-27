//express
const express = require("express");
const route = express.Router();

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");

//auth
const validateUserToken = require("../../middleware/validateUserToken.middleware");

//controller
const WithdrawalRequestController = require("../../controllers/client/withdrawalRequest.controller");

//withdrawal request ( host )
route.post("/submitWithdrawalRequest", validateUserToken, checkAccessWithSecretKey(), WithdrawalRequestController.submitWithdrawalRequest);

//get withdrawal requests ( host )
route.get("/listPayoutRequests", validateUserToken, checkAccessWithSecretKey(), WithdrawalRequestController.listPayoutRequests);

module.exports = route;
