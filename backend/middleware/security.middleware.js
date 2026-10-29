const SecurityLog = require("../models/securityLog.model");
const BlockedIp = require("../models/blockedIp.model");

// In-memory Set for O(1) blocked IP lookups
const blockedIpsSet = new Set();

// In-memory rate tracker: ip -> { count, start }
const ipRateMap = new Map();
const RATE_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MIN = 150;

// Malicious scanner URL patterns
const MALICIOUS_PATTERNS = [
  /\/\.env(\b|\/)/i,
  /\/\.git(\b|\/)/i,
  /\/wp-(admin|login|config|includes)/i,
  /\/phpmyadmin/i,
  /\/actuator/i,
  /\/etc\/passwd/i,
  /\/(eval-stdin|solr|autodiscover)/i,
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i,
  /(union\s+select|select\s+.*\s+from|insert\s+into)/i,
];

// Load blocked IPs on startup
async function initBlockedIps() {
  try {
    const list = await BlockedIp.find().select("ip");
    for (const item of list) {
      if (item.ip) blockedIpsSet.add(item.ip.trim());
    }
    console.log(`🛡️ [Security] Loaded ${blockedIpsSet.size} blocked IPs into memory firewall.`);
  } catch (err) {
    console.warn("⚠️ [Security] Could not load blocked IPs on init:", err.message);
  }
}

// Call on startup
initBlockedIps();

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ip = forwarded.split(",")[0].trim();
    if (ip) return ip;
  }
  return req.socket?.remoteAddress || req.ip || "127.0.0.1";
}

// Public helper to record any security event
async function recordSecurityEvent({
  type,
  severity = "MEDIUM",
  ip,
  endpoint,
  method = "GET",
  message,
  userAgent = "",
  payload = null,
}) {
  try {
    const isBlocked = blockedIpsSet.has(ip);
    await SecurityLog.create({
      type,
      severity,
      ip: ip || "127.0.0.1",
      endpoint: endpoint || "/",
      method,
      message,
      userAgent,
      payload,
      blocked: isBlocked,
    });
  } catch (err) {
    console.warn("⚠️ [Security] Failed to write SecurityLog:", err.message);
  }
}

const securityMiddleware = async (req, res, next) => {
  const clientIp = getClientIp(req);
  const rawUrl = req.originalUrl || req.url || "";

  // 1. Check if IP is in Firewall Blocklist
  if (blockedIpsSet.has(clientIp)) {
    return res.status(403).json({
      status: false,
      error: "ACCESS_DENIED_SECURITY_FIREWALL",
      message: "Your IP address has been restricted due to multiple security violations.",
    });
  }

  // 2. Malicious Scanner Probe Detection
  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.test(rawUrl)) {
      recordSecurityEvent({
        type: "MALICIOUS_PROBE",
        severity: "HIGH",
        ip: clientIp,
        endpoint: rawUrl,
        method: req.method,
        message: `Malicious probe or scanner detected matching pattern: ${pattern}`,
        userAgent: req.headers["user-agent"] || "",
      });

      return res.status(403).json({
        status: false,
        error: "FORBIDDEN_PROBE",
        message: "Malicious request rejected by system firewall.",
      });
    }
  }

  // 3. Rate-limiting and Brute-force abuse detection
  const now = Date.now();
  const rateData = ipRateMap.get(clientIp) || { count: 0, start: now };

  if (now - rateData.start > RATE_WINDOW_MS) {
    rateData.count = 1;
    rateData.start = now;
  } else {
    rateData.count++;
  }
  ipRateMap.set(clientIp, rateData);

  // If flooding excessive requests
  if (rateData.count > MAX_REQUESTS_PER_MIN) {
    // Only log once every 50 excess hits
    if (rateData.count === MAX_REQUESTS_PER_MIN + 1) {
      recordSecurityEvent({
        type: "RATE_LIMIT_EXCEEDED",
        severity: "HIGH",
        ip: clientIp,
        endpoint: rawUrl,
        method: req.method,
        message: `Rate limit exceeded: ${rateData.count} requests within 60 seconds.`,
        userAgent: req.headers["user-agent"] || "",
      });
    }

    return res.status(429).json({
      status: false,
      error: "TOO_MANY_REQUESTS",
      message: "Rate limit exceeded. Please wait a moment before sending more requests.",
    });
  }

  next();
};

securityMiddleware.recordSecurityEvent = recordSecurityEvent;
securityMiddleware.getClientIp = getClientIp;
securityMiddleware.blockedIpsSet = blockedIpsSet;

securityMiddleware.blockIp = async (ip, reason = "Security policy violation", blockedBy = "Admin") => {
  const cleanIp = ip.trim();
  blockedIpsSet.add(cleanIp);
  await BlockedIp.findOneAndUpdate(
    { ip: cleanIp },
    { $set: { ip: cleanIp, reason, blockedBy, updatedAt: new Date() }, $inc: { threatCount: 1 } },
    { upsert: true, new: true }
  );
};

securityMiddleware.unblockIp = async (ip) => {
  const cleanIp = ip.trim();
  blockedIpsSet.delete(cleanIp);
  await BlockedIp.deleteOne({ ip: cleanIp });
};

module.exports = securityMiddleware;
