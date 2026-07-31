const express = require("express");
const route = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const rewardAdminController = require("../../controllers/admin/rewardAdmin.controller");

// Dashboard & Analytics
route.get("/dashboard", rewardAdminController.getDashboardStats);

// Wallet Management
route.post("/wallet/manual", rewardAdminController.manualCreditDebitWallet);
route.post("/wallet/freeze", rewardAdminController.freezeUserWallet);

// Survey Provider Management
route.get("/providers", rewardAdminController.getProviders);
route.patch("/provider/:id", rewardAdminController.updateProvider);

// Settings
route.get("/settings", rewardAdminController.getSettings);
route.post("/settings", rewardAdminController.updateSettings);

// Withdrawals Management
route.get("/withdrawals", rewardAdminController.getWithdrawals);
route.patch("/withdrawal/:id/status", rewardAdminController.updateWithdrawalStatus);

// Bulk Payout Management
route.get("/payout/template", rewardAdminController.downloadExcelTemplate);
route.post("/payout/upload-excel", upload.single("file"), rewardAdminController.uploadAndValidateExcel);
route.post("/payout/process", rewardAdminController.processPayoutBatch);

// Reports
route.get("/reports", rewardAdminController.getReports);

module.exports = route;
