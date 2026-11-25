const express = require("express");
const route = express.Router();
const hostUserController = require("../controllers/hostUser.controller");
const { validateHostUserToken } = require("../middleware/validateHostUserToken.middleware");

// Public authentication & rates routes (per-host persona)
route.get("/rates", hostUserController.getRates);
route.post("/register", hostUserController.register);
route.post("/login", hostUserController.login);

// Authenticated user routes (JWT required)
route.get("/profile", validateHostUserToken, hostUserController.getProfile);
route.patch("/profile", validateHostUserToken, hostUserController.updateProfile);
route.get("/wallet", validateHostUserToken, hostUserController.getWallet);
route.post("/unlock-media", validateHostUserToken, hostUserController.unlockMedia);
route.post("/chat", validateHostUserToken, hostUserController.chat);
route.get("/history", validateHostUserToken, hostUserController.getHistory);
route.post("/reset", validateHostUserToken, hostUserController.resetHistory);

// Payment Gateway & Recharge routes
route.get("/payment-config", hostUserController.getPaymentConfig);
route.post("/create-payment-order", validateHostUserToken, hostUserController.createPaymentOrder);
route.post("/verify-payment", validateHostUserToken, hostUserController.verifyPayment);

module.exports = route;
