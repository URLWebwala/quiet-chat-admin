const express = require("express");
const route = express.Router();
const walletController = require("../../controllers/client/wallet.controller");
const webhooksController = require("../../controllers/webhooks/surveyWebhooks.controller");
const checkAccessWithSecretKey = require("../../checkAccess");
const validateUserToken = require("../../middleware/validateUserToken.middleware");

// Wallet routes
route.get("/wallet", walletController.getWallet);
route.get("/wallet/history", walletController.getWalletHistory);
route.post("/withdraw", walletController.requestWithdrawal);
route.get("/withdraw/history", walletController.getWithdrawalHistory);
route.post("/bank-account", walletController.saveWithdrawalAccount);
route.get("/providers", walletController.getSurveyProviders);

// Survey Provider Webhooks & Sandbox Simulator (Open Webhooks validated by signature/hash)
route.all("/bitlabs/webhook", webhooksController.handleBitLabsWebhook);
route.all("/cpx/webhook", webhooksController.handleCPXWebhook);
route.post("/survey/test-callback", webhooksController.handleTestCallback);

module.exports = route;
