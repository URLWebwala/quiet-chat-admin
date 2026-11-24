const express = require("express");
const route = express.Router();
const checkAccessWithSecretKey = require("../../checkAccess");
const CreditPlanController = require("../../controllers/admin/creditPlan.controller");

// Create a new credit plan
route.post("/createCreditPlan", checkAccessWithSecretKey(), CreditPlanController.createCreditPlan);

// Update an existing credit plan
route.patch("/modifyCreditPlan", checkAccessWithSecretKey(), CreditPlanController.modifyCreditPlan);

// Toggle credit plan status
route.patch("/toggleCreditPlanStatus", checkAccessWithSecretKey(), CreditPlanController.toggleCreditPlanStatus);

// Delete a credit plan
route.delete("/removeCreditPlan", checkAccessWithSecretKey(), CreditPlanController.removeCreditPlan);

// Retrieve all credit plans
route.get("/fetchCreditPlans", checkAccessWithSecretKey(), CreditPlanController.fetchCreditPlans);

module.exports = route;
