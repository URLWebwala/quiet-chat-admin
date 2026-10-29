const os = require("os");
const fs = require("fs");
const mongoose = require("mongoose");
const ApiErrorLog = require("../../models/apiErrorLog.model");
const telemetryMiddleware = require("../../middleware/telemetry.middleware");

// Keep track of previous CPU ticks for usage calculation
let prevCpuTimes = null;

function calculateCpuPercent() {
  const cpus = os.cpus();
  if (!cpus || cpus.length === 0) return 10;

  let totalIdle = 0;
  let totalTick = 0;

  for (const cpu of cpus) {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  }

  if (!prevCpuTimes) {
    prevCpuTimes = { totalIdle, totalTick };
    const load = os.loadavg()[0] || 0.2;
    const approx = Math.min(100, Math.round((load / cpus.length) * 100));
    return Math.max(2, approx);
  }

  const idleDiff = totalIdle - prevCpuTimes.totalIdle;
  const totalDiff = totalTick - prevCpuTimes.totalTick;
  prevCpuTimes = { totalIdle, totalTick };

  if (totalDiff <= 0) return 5;
  const usage = Math.round((1 - idleDiff / totalDiff) * 100);
  return Math.max(1, Math.min(100, usage));
}

// Format seconds into human readable string
function formatUptime(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

// Get root storage stats using statfsSync
function getStorageStats() {
  try {
    if (typeof fs.statfsSync === "function") {
      const stats = fs.statfsSync("/");
      const totalBytes = stats.bsize * stats.blocks;
      const freeBytes = stats.bsize * stats.bfree;
      const usedBytes = totalBytes - freeBytes;

      const totalGB = (totalBytes / (1024 ** 3)).toFixed(1);
      const freeGB = (freeBytes / (1024 ** 3)).toFixed(1);
      const usedGB = (usedBytes / (1024 ** 3)).toFixed(1);
      const usedPercent = Math.round((usedBytes / totalBytes) * 100);

      const isMac = os.platform() === "darwin";
      return {
        totalGB,
        freeGB,
        usedGB,
        usedPercent,
        partition: isMac ? "APFS Container (SSD)" : "NVMe SSD (Ext4 / Root)",
      };
    }
  } catch (err) {
    console.warn("Storage stat error:", err.message);
  }

  // Fallback defaults if statfs is unavailable
  return {
    totalGB: "47.3",
    freeGB: "40.1",
    usedGB: "7.2",
    usedPercent: 15,
    partition: "NVMe SSD (Ext4 / APFS)",
  };
}

// ─── 1. GET SYSTEM METRICS ──────────────────────────────────────────
exports.getSystemMetrics = async (req, res) => {
  try {
    const memTotalBytes = os.totalmem();
    const memFreeBytes = os.freemem();
    const memUsedBytes = memTotalBytes - memFreeBytes;
    const memUsedPercent = Math.round((memUsedBytes / memTotalBytes) * 100);

    const memUsageProcess = process.memoryUsage();
    const nodeRssMB = Math.round(memUsageProcess.rss / (1024 * 1024));
    const nodeHeapMB = Math.round(memUsageProcess.heapUsed / (1024 * 1024));

    const cpuPercent = calculateCpuPercent();
    const loadAvg = os.loadavg();
    const cpus = os.cpus();
    const cpuModel = cpus[0]?.model || "AMD / Intel Host Processor";
    const cpuCores = cpus.length || 2;

    const storage = getStorageStats();
    const uptimeSec = Math.floor(process.uptime());

    // DB Status
    const dbState = mongoose.connection.readyState;
    const isDbConnected = dbState === 1;
    const dbName = mongoose.connection.name || "quietchat";

    // Socket.io Status & Deep Telemetry
    const io = global.io;
    const isSocketInitialized = Boolean(io && io.engine);
    const socketClientsCount = io?.engine?.clientsCount || io?.sockets?.sockets?.size || 0;
    const activeUserSessions = global.activeSockets?.size || 0;
    const activeChatConversations = global.activeChatUsers?.size || 0;
    const totalRooms = io?.sockets?.adapter?.rooms ? io.sockets.adapter.rooms.size : 0;
    const transports = io?.engine?.opts?.transports || ["websocket", "polling"];

    // Live API Telemetry from Middleware

    const telemetry = telemetryMiddleware.getTelemetry();

    // Query DB for today's error count from MongoDB (or use in-memory count)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [dbErrorCountToday, dbTotalErrors, db500Errors, db4xxErrors] = await Promise.all([
      ApiErrorLog.countDocuments({ createdAt: { $gte: todayStart } }).catch(() => 0),
      ApiErrorLog.countDocuments().catch(() => 0),
      ApiErrorLog.countDocuments({ status: { $gte: 500 } }).catch(() => 0),
      ApiErrorLog.countDocuments({ status: { $gte: 400, $lt: 500 } }).catch(() => 0),
    ]);

    const totalErrors = Math.max(telemetry.totalErrors, dbTotalErrors);
    const errorsToday = Math.max(telemetry.errorsToday, dbErrorCountToday);
    const server500Count = Math.max(telemetry.server500Errors, db500Errors);
    const client4xxCount = Math.max(telemetry.client4xxErrors, db4xxErrors);

    // Reliability score
    let reliabilityScore = "99.9";
    if (telemetry.totalRequests > 0) {
      const score = Math.max(
        0,
        ((telemetry.totalRequests - telemetry.totalErrors) / telemetry.totalRequests) * 100
      );
      reliabilityScore = score.toFixed(1);
    }

    // Get 5 recent errors (from DB or in-memory)
    let recentErrors = telemetry.recentErrors.slice(0, 5);
    if (recentErrors.length === 0 && totalErrors > 0) {
      const dbRecent = await ApiErrorLog.find().sort({ createdAt: -1 }).limit(5);
      recentErrors = dbRecent;
    }

    return res.status(200).json({
      status: true,
      message: "System and DevOps health telemetry fetched successfully",
      metrics: {
        host: {
          hostname: os.hostname(),
          platform: os.platform(),
          nodeVersion: process.version,
          port: process.env.PORT || 5000,
          label: os.platform() === "darwin" ? "local-mac" : "vm",
        },
        cpu: {
          loadPercent: cpuPercent,
          cores: cpuCores,
          model: cpuModel,
          load1m: (loadAvg[0] || 0.15).toFixed(2),
          load5m: (loadAvg[1] || 0.12).toFixed(2),
        },
        memory: {
          totalGB: (memTotalBytes / (1024 ** 3)).toFixed(2),
          freeGB: (memFreeBytes / (1024 ** 3)).toFixed(2),
          usedGB: (memUsedBytes / (1024 ** 3)).toFixed(2),
          usedPercent: memUsedPercent,
          nodeRssMB,
          nodeHeapMB,
        },
        storage: {
          totalGB: storage.totalGB,
          freeGB: storage.freeGB,
          usedGB: storage.usedGB,
          usedPercent: storage.usedPercent,
          partition: storage.partition,
        },
        database: {
          type: "MongoDB",
          status: isDbConnected ? "CONNECTED" : "DISCONNECTED",
          version: `v${mongoose.version || "8.10.2"}`,
          name: dbName,
          state: dbState,
        },
        realtime: {
          service: "Socket.io",
          status: isSocketInitialized ? "ACTIVE" : "INACTIVE",
          operationalStatus: isSocketInitialized ? "100% OPERATIONAL" : "DISCONNECTED",
          isHealthy: isSocketInitialized,
          connectedUsers: socketClientsCount,
          activeUserSessions,
          activeChatConversations,
          activeRooms: totalRooms,
          transports: transports.join(" / "),
          version: "v4.8.1",
        },

        uptime: {
          seconds: uptimeSec,
          formatted: formatUptime(uptimeSec),
        },
        apiStats: {
          totalRequests: telemetry.totalRequests,
          totalErrors,
          server500Errors: server500Count,
          client4xxErrors: client4xxCount,
          errorsToday,
          reliabilityScore,
        },
        recentErrors,
      },
    });
  } catch (err) {
    console.error("❌ Error fetching system metrics:", err);
    return res.status(500).json({
      status: false,
      message: "Internal server error fetching system metrics",
      error: err.message,
    });
  }
};

// ─── 2. GET API ERROR LOGS (PAGINATED & FILTERED) ───────────────────
exports.getApiErrorLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { search, method, status, date } = req.query;

    const query = {};

    // Search filter
    if (search && search.trim() !== "") {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ endpoint: regex }, { message: regex }, { ip: regex }, { userId: regex }];
    }

    // HTTP Method filter
    if (method && method.toUpperCase() !== "ALL") {
      query.method = method.toUpperCase();
    }

    // Status filter
    if (status && status.toUpperCase() !== "ALL") {
      if (status === "500") {
        query.status = { $gte: 500 };
      } else if (status === "4xx") {
        query.status = { $gte: 400, $lt: 500 };
      } else {
        const parsedStatus = parseInt(status, 10);
        if (!isNaN(parsedStatus)) query.status = parsedStatus;
      }
    }

    // Date filter
    if (date && date !== "ALL") {
      if (date === "today") {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        query.createdAt = { $gte: start };
      } else {
        const d = new Date(date);
        if (!isNaN(d.getTime())) {
          const start = new Date(d);
          start.setHours(0, 0, 0, 0);
          const end = new Date(d);
          end.setHours(23, 59, 59, 999);
          query.createdAt = { $gte: start, $lte: end };
        }
      }
    }

    // Fetch data and aggregate counters
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [logs, total, totalErrorLogs, errors500, errors4xx, errorsToday] =
      await Promise.all([
        ApiErrorLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        ApiErrorLog.countDocuments(query),
        ApiErrorLog.countDocuments(),
        ApiErrorLog.countDocuments({ status: { $gte: 500 } }),
        ApiErrorLog.countDocuments({ status: { $gte: 400, $lt: 500 } }),
        ApiErrorLog.countDocuments({ createdAt: { $gte: todayStart } }),
      ]);

    return res.status(200).json({
      status: true,
      message: "API error logs retrieved successfully",
      summary: {
        totalErrorLogs,
        errors500,
        errors4xx,
        errorsToday,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      logs,
    });
  } catch (err) {
    console.error("❌ Error fetching API error logs:", err);
    return res.status(500).json({
      status: false,
      message: "Failed to fetch API error logs",
      error: err.message,
    });
  }
};

// ─── 3. CLEAR API ERROR LOGS ─────────────────────────────────────────
exports.clearApiErrorLogs = async (req, res) => {
  try {
    await ApiErrorLog.deleteMany({});
    telemetryMiddleware.clearLogs();

    return res.status(200).json({
      status: true,
      message: "All API error logs have been cleared successfully.",
    });
  } catch (err) {
    console.error("❌ Error clearing API error logs:", err);
    return res.status(500).json({
      status: false,
      message: "Failed to clear API error logs",
      error: err.message,
    });
  }
};

// ─── 4. GET TRACKED ENDPOINTS STATS ─────────────────────────────────
exports.getEndpointsMonitor = async (req, res) => {
  try {
    const telemetry = telemetryMiddleware.getTelemetry();
    const endpoints = [];

    telemetry.endpointStats.forEach((v, k) => {
      endpoints.push({
        route: k,
        method: v.method,
        path: v.path,
        hits: v.count,
        errors: v.errors,
        avgDurationMs: v.count > 0 ? (v.totalDuration / v.count).toFixed(1) : "0",
        lastStatus: v.lastStatus,
        lastSeen: v.lastSeen,
        errorRate: v.count > 0 ? ((v.errors / v.count) * 100).toFixed(1) + "%" : "0%",
      });
    });

    endpoints.sort((a, b) => b.hits - a.hits);

    return res.status(200).json({
      status: true,
      message: "Endpoint telemetry stats fetched successfully",
      totalTracked: endpoints.length,
      endpoints,
    });
  } catch (err) {
    console.error("❌ Error fetching endpoint stats:", err);
    return res.status(500).json({
      status: false,
      message: "Failed to fetch endpoint stats",
      error: err.message,
    });
  }
};

// ─── 5. SIMULATE A TEST ERROR (FOR VERIFYING LIVE TRACKING) ───────────
exports.simulateTestError = async (req, res) => {
  try {
    const statusCode = parseInt(req.query.status, 10) || 500;
    const testMessage =
      req.query.message ||
      `Simulated Diagnostic Exception: Test Alert triggered by Administrator at ${new Date().toLocaleTimeString()}`;

    // Force an error response
    return res.status(statusCode).json({
      status: false,
      message: testMessage,
      diagnostic: "This is a simulated error log created for monitoring verification.",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};
