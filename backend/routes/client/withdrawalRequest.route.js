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

// user withdrawal
route.post("/submitUserWithdrawal", validateUserToken, checkAccessWithSecretKey(), WithdrawalRequestController.submitUserWithdrawalRequest);
route.get("/getUserWithdrawalHistory", validateUserToken, checkAccessWithSecretKey(), WithdrawalRequestController.getUserWithdrawalHistory);

module.exports = route;
