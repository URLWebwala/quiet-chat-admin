const SecurityLog = require("../../models/securityLog.model");
const BlockedIp = require("../../models/blockedIp.model");
const AdminAuditLog = require("../../models/adminAuditLog.model");
const security = require("../../middleware/security.middleware");

// ─── 1. GET SECURITY OVERVIEW ────────────────────────────────────────
exports.getSecurityOverview = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalThreats,
      criticalThreats,
      blockedIpsCount,
      threatsToday,
      recentIncidents,
      topSuspiciousIps,
    ] = await Promise.all([
      SecurityLog.countDocuments(),
      SecurityLog.countDocuments({ severity: { $in: ["HIGH", "CRITICAL"] } }),
      BlockedIp.countDocuments(),
      SecurityLog.countDocuments({ createdAt: { $gte: todayStart } }),
      SecurityLog.find().sort({ createdAt: -1 }).limit(6),
      SecurityLog.aggregate([
        {
          $group: {
            _id: "$ip",
            count: { $sum: 1 },
            lastSeen: { $max: "$createdAt" },
            lastType: { $last: "$type" },
            highestSeverity: { $max: "$severity" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    // Check if suspicious IPs are already blocked
    const formattedSuspicious = topSuspiciousIps.map((item) => ({
      ip: item._id,
      count: item.count,
      lastSeen: item.lastSeen,
      lastType: item.lastType,
      highestSeverity: item.highestSeverity,
      isBlocked: security.blockedIpsSet.has(item._id),
    }));

    return res.status(200).json({
      status: true,
      message: "Security threat overview fetched successfully",
      overview: {
        totalThreats,
        criticalThreats,
        blockedIpsCount,
        threatsToday,
      },
      topSuspiciousIps: formattedSuspicious,
      recentIncidents,
    });
  } catch (err) {
    console.error("❌ Error fetching security overview:", err);
    return res.status(500).json({ status: false, message: err.message });
  }
};

// ─── 2. GET PAGINATED THREAT LOGS ────────────────────────────────────
exports.getSecurityThreats = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { search, type, severity } = req.query;
    const query = {};

    if (search && search.trim() !== "") {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ ip: regex }, { message: regex }, { endpoint: regex }];
    }

    if (type && type !== "ALL") {
      query.type = type;
    }

    if (severity && severity !== "ALL") {
      query.severity = severity;
    }

    const [logs, total] = await Promise.all([
      SecurityLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      SecurityLog.countDocuments(query),
    ]);

    // Attach current blocked status
    const logsWithBlockedStatus = logs.map((log) => ({
      ...log.toObject(),
      isCurrentlyBlocked: security.blockedIpsSet.has(log.ip),
    }));

    return res.status(200).json({
      status: true,
      message: "Security threat logs retrieved successfully",
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      threats: logsWithBlockedStatus,
    });
  } catch (err) {
    console.error("❌ Error fetching security threat logs:", err);
    return res.status(500).json({ status: false, message: err.message });
  }
};

// ─── 3. GET BLOCKED IPS ──────────────────────────────────────────────
exports.getBlockedIps = async (req, res) => {
  try {
    const list = await BlockedIp.find().sort({ createdAt: -1 });
    return res.status(200).json({
      status: true,
      message: "Blocked IPs list fetched successfully",
      totalBlocked: list.length,
      blockedIps: list,
    });
  } catch (err) {
    console.error("❌ Error fetching blocked IPs:", err);
    return res.status(500).json({ status: false, message: err.message });
  }
};

// ─── 4. BLOCK IP ADDRESS ─────────────────────────────────────────────
exports.blockIpAddress = async (req, res) => {
  try {
    const { ip, reason } = req.body;
    if (!ip || !ip.trim()) {
      return res.status(400).json({ status: false, message: "IP address is required." });
    }

    const cleanIp = ip.trim();
    const adminEmail = req.admin?.email || "Admin";

    await security.blockIp(cleanIp, reason || "Manually blocked by administrator", adminEmail);

    // Audit log
    await AdminAuditLog.create({
      adminEmail,
      action: "BLOCK_IP",
      targetEntity: "Firewall",
      targetId: cleanIp,
      details: { reason: reason || "Manual block" },
      ip: security.getClientIp(req),
    });

    return res.status(200).json({
      status: true,
      message: `IP ${cleanIp} has been blocked and added to firewall blocklist.`,
    });
  } catch (err) {
    console.error("❌ Error blocking IP:", err);
    return res.status(500).json({ status: false, message: err.message });
  }
};

// ─── 5. UNBLOCK IP ADDRESS ───────────────────────────────────────────
exports.unblockIpAddress = async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip || !ip.trim()) {
      return res.status(400).json({ status: false, message: "IP address is required." });
    }

    const cleanIp = ip.trim();
    const adminEmail = req.admin?.email || "Admin";

    await security.unblockIp(cleanIp);

    // Audit log
    await AdminAuditLog.create({
      adminEmail,
      action: "UNBLOCK_IP",
      targetEntity: "Firewall",
      targetId: cleanIp,
      details: { unblockedBy: adminEmail },
      ip: security.getClientIp(req),
    });

    return res.status(200).json({
      status: true,
      message: `IP ${cleanIp} has been unblocked.`,
    });
  } catch (err) {
    console.error("❌ Error unblocking IP:", err);
    return res.status(500).json({ status: false, message: err.message });
  }
};

// ─── 6. GET ADMIN AUDIT LOGS ─────────────────────────────────────────
exports.getAdminAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { search, action } = req.query;
    const query = {};

    if (search && search.trim() !== "") {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ adminEmail: regex }, { targetId: regex }, { action: regex }];
    }

    if (action && action !== "ALL") {
      query.action = action;
    }

    const [logs, total] = await Promise.all([
      AdminAuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      AdminAuditLog.countDocuments(query),
    ]);

    return res.status(200).json({
      status: true,
      message: "Admin audit logs retrieved successfully",
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      auditLogs: logs,
    });
  } catch (err) {
    console.error("❌ Error fetching admin audit logs:", err);
    return res.status(500).json({ status: false, message: err.message });
  }
};

// ─── 7. SIMULATE DIAGNOSTIC SECURITY THREAT ──────────────────────────
exports.simulateThreat = async (req, res) => {
  try {
    const threatType = req.body?.type || "INTRUSION_ATTEMPT";
    const sampleIp = req.body?.ip || `198.51.100.${Math.floor(Math.random() * 200 + 1)}`;
    const severity = req.body?.severity || "CRITICAL";

    await security.recordSecurityEvent({
      type: threatType,
      severity,
      ip: sampleIp,
      endpoint: "/api/admin/setting/getPrivateKey",
      method: "POST",
      message: `Diagnostic Intrusion Alert: Unauthorized attempt with forged secret key from IP ${sampleIp}`,
      userAgent: "Security-Scanner-Bot/2.4 (Automated Probe)",
    });

    return res.status(200).json({
      status: true,
      message: "Simulated security threat recorded successfully.",
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};
