const security = require("./middleware/security.middleware");

module.exports = () => {
  return (req, res, next) => {
    const key = req.headers.key || req.body?.key || req.query?.key;

    if (key && key === process.env?.secretKey) {
      return next();
    }

    const clientIp = security.getClientIp(req);
    const endpoint = req.originalUrl || req.path || "/";

    // Record intrusion attempt to SecurityLog
    security.recordSecurityEvent({
      type: key ? "INVALID_KEY" : "INTRUSION_ATTEMPT",
      severity: "CRITICAL",
      ip: clientIp,
      endpoint,
      method: req.method,
      message: key
        ? "Unauthorized request with forged or invalid secretKey"
        : "Unauthenticated request missing required secretKey header",
      userAgent: req.headers["user-agent"] || "",
    });

    return res.status(400).json({ status: false, error: "Unpermitted infiltration" });
  };
};

