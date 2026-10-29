const ApiErrorLog = require("../models/apiErrorLog.model");

// In-memory aggregates for high-speed dashboard telemetry
const inMemoryTelemetry = {
  totalRequests: 0,
  totalErrors: 0,
  server500Errors: 0,
  client4xxErrors: 0,
  currentDay: new Date().toISOString().slice(0, 10),
  requestsToday: 0,
  errorsToday: 0,
  recentErrors: [],
  endpointStats: new Map(), // key: "METHOD /path", val: { count, totalDuration, errors, lastStatus, lastSeen }
  maxRecentErrors: 50,
};

// Check date rollover
function checkDateRollover() {
  const today = new Date().toISOString().slice(0, 10);
  if (inMemoryTelemetry.currentDay !== today) {
    inMemoryTelemetry.currentDay = today;
    inMemoryTelemetry.requestsToday = 0;
    inMemoryTelemetry.errorsToday = 0;
  }
}

// Sanitize payload (strip sensitive keys)
function sanitizeData(data) {
  if (!data || typeof data !== "object") return data;
  const clone = Array.isArray(data) ? [...data] : { ...data };
  const sensitiveKeys = [
    "password",
    "token",
    "secret",
    "privateKey",
    "authorization",
    "key",
    "pin",
    "otp",
  ];
  for (const k of Object.keys(clone)) {
    if (sensitiveKeys.some((s) => k.toLowerCase().includes(s))) {
      clone[k] = "******";
    } else if (typeof clone[k] === "object" && clone[k] !== null) {
      clone[k] = sanitizeData(clone[k]);
    }
  }
  return clone;
}

// Normalize path to avoid high cardinality (replace mongo ObjectIds and numeric IDs with :id)
function normalizeEndpoint(pathname) {
  if (!pathname) return "/";
  return pathname
    .replace(/\/[0-9a-fA-F]{24}(\b|\/)/g, "/:id$1")
    .replace(/\/\d+(\b|\/)/g, "/:id$1");
}

const telemetryMiddleware = (req, res, next) => {
  // Only monitor API calls or routes
  if (req.originalUrl.startsWith("/storage") || req.originalUrl === "/favicon.ico") {
    return next();
  }

  checkDateRollover();
  inMemoryTelemetry.totalRequests++;
  inMemoryTelemetry.requestsToday++;

  const startHr = process.hrtime();
  const endpointPath = req.originalUrl ? req.originalUrl.split("?")[0] : req.path;
  const normalizedPath = normalizeEndpoint(endpointPath);
  const routeKey = `${req.method.toUpperCase()} ${normalizedPath}`;

  // Capture response payload for error messages
  let capturedMessage = "";
  const originalJson = res.json;
  const originalSend = res.send;

  res.json = function (body) {
    if (body && typeof body === "object") {
      if (body.message) {
        capturedMessage = Array.isArray(body.message)
          ? body.message.join(", ")
          : String(body.message);
      } else if (body.error) {
        capturedMessage = typeof body.error === "string" ? body.error : JSON.stringify(body.error);
      }
    }
    return originalJson.apply(this, arguments);
  };

  res.send = function (body) {
    if (!capturedMessage && typeof body === "string") {
      try {
        const parsed = JSON.parse(body);
        if (parsed.message) capturedMessage = String(parsed.message);
        else if (parsed.error) capturedMessage = String(parsed.error);
      } catch (e) {
        if (res.statusCode >= 400 && body.length < 300) {
          capturedMessage = body;
        }
      }
    }
    return originalSend.apply(this, arguments);
  };

  res.on("finish", () => {
    const diff = process.hrtime(startHr);
    const durationMs = Math.round((diff[0] * 1e3 + diff[1] * 1e-6) * 10) / 10;
    const statusCode = res.statusCode;

    // Track endpoint stats
    const existing = inMemoryTelemetry.endpointStats.get(routeKey) || {
      method: req.method.toUpperCase(),
      path: normalizedPath,
      count: 0,
      totalDuration: 0,
      errors: 0,
      lastStatus: statusCode,
      lastSeen: new Date(),
    };
    existing.count++;
    existing.totalDuration += durationMs;
    existing.lastStatus = statusCode;
    existing.lastSeen = new Date();

    // Check if error
    const isError = statusCode >= 400;
    if (isError) {
      existing.errors++;
      inMemoryTelemetry.totalErrors++;
      inMemoryTelemetry.errorsToday++;

      if (statusCode >= 500) {
        inMemoryTelemetry.server500Errors++;
      } else {
        inMemoryTelemetry.client4xxErrors++;
      }

      const errorMessage =
        capturedMessage ||
        res.statusMessage ||
        (statusCode >= 500 ? "Internal Server Error" : `HTTP ${statusCode} Error`);

      const clientIp =
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.ip ||
        "127.0.0.1";

      const userId = req.headers["x-admin-uid"] || req.user?._id || req.body?.userId || "";

      const errorPayload = {
        _id: String(Date.now()) + Math.random().toString(36).substring(2, 6),
        method: req.method.toUpperCase(),
        endpoint: req.originalUrl,
        status: statusCode,
        message: errorMessage,
        responseTime: durationMs,
        ip: clientIp,
        userAgent: req.headers["user-agent"] || "",
        userId: userId ? String(userId) : "Anonymous",
        tenant: "quietchat",
        createdAt: new Date(),
      };

      // Add to in-memory ring buffer
      inMemoryTelemetry.recentErrors.unshift(errorPayload);
      if (inMemoryTelemetry.recentErrors.length > inMemoryTelemetry.maxRecentErrors) {
        inMemoryTelemetry.recentErrors.pop();
      }

      // Persist to MongoDB asynchronously without awaiting
      try {
        ApiErrorLog.create({
          method: errorPayload.method,
          endpoint: errorPayload.endpoint,
          status: errorPayload.status,
          message: errorPayload.message,
          responseTime: errorPayload.responseTime,
          ip: errorPayload.ip,
          userAgent: errorPayload.userAgent,
          userId: errorPayload.userId,
          tenant: errorPayload.tenant,
          requestBody: sanitizeData(req.body),
          requestQuery: sanitizeData(req.query),
        }).catch((err) => {
          console.warn("⚠️ [Telemetry] Failed to persist ApiErrorLog to MongoDB:", err.message);
        });
      } catch (e) {
        // Safe guard
      }
    }

    inMemoryTelemetry.endpointStats.set(routeKey, existing);
  });

  next();
};

// Helper methods for controller
telemetryMiddleware.getTelemetry = () => inMemoryTelemetry;

telemetryMiddleware.clearLogs = () => {
  inMemoryTelemetry.recentErrors = [];
  inMemoryTelemetry.totalErrors = 0;
  inMemoryTelemetry.server500Errors = 0;
  inMemoryTelemetry.client4xxErrors = 0;
  inMemoryTelemetry.errorsToday = 0;
};

module.exports = telemetryMiddleware;
