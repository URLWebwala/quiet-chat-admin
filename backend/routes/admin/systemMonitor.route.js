const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");
const systemMonitorController = require("../../controllers/admin/systemMonitor.controller");

// System and hardware telemetry metrics
route.get("/metrics", checkAccessWithSecretKey(), systemMonitorController.getSystemMetrics);

// Paginated API Error logs
route.get("/logs", checkAccessWithSecretKey(), systemMonitorController.getApiErrorLogs);

// Clear error logs
route.delete("/logs", checkAccessWithSecretKey(), systemMonitorController.clearApiErrorLogs);

// Endpoints and latency monitor
route.get("/endpoints", checkAccessWithSecretKey(), systemMonitorController.getEndpointsMonitor);

// Simulate test error (for validation)
route.get("/test-error", checkAccessWithSecretKey(), systemMonitorController.simulateTestError);

module.exports = route;
