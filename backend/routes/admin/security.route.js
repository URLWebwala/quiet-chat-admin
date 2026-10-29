const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");
const securityController = require("../../controllers/admin/securityMonitor.controller");

// Security threat overview and counters
route.get("/overview", checkAccessWithSecretKey(), securityController.getSecurityOverview);

// Paginated security threat events
route.get("/threats", checkAccessWithSecretKey(), securityController.getSecurityThreats);

// List blocked IPs
route.get("/blocked-ips", checkAccessWithSecretKey(), securityController.getBlockedIps);

// Block an IP
route.post("/block-ip", checkAccessWithSecretKey(), securityController.blockIpAddress);

// Unblock an IP
route.post("/unblock-ip", checkAccessWithSecretKey(), securityController.unblockIpAddress);

// Admin audit logs
route.get("/audit-logs", checkAccessWithSecretKey(), securityController.getAdminAuditLogs);

// Simulate test security threat
route.post("/simulate-threat", checkAccessWithSecretKey(), securityController.simulateThreat);

module.exports = route;
