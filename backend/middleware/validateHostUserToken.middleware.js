const jwt = require("jsonwebtoken");
const HostUser = require("../models/hostUser.model");

const JWT_SECRET = process.env.JWT_SECRET || "quietchat_host_user_secret_2026";

const validateHostUserToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ status: false, message: "Authorization token required" });
    }

    const token = authHeader.split("Bearer ")[1].trim();
    if (!token) {
      return res.status(401).json({ status: false, message: "Invalid authorization format" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({ status: false, message: "Invalid or expired token" });
    }

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ status: false, message: "Invalid token payload" });
    }

    const user = await HostUser.findById(decoded.userId).select("-password").lean();
    if (!user) {
      return res.status(401).json({ status: false, message: "Host user account not found" });
    }

    if (user.isBlock) {
      return res.status(403).json({ status: false, message: "User account is suspended" });
    }

    req.hostUser = user;
    next();
  } catch (error) {
    return res.status(500).json({ status: false, message: "Authentication error: " + error.message });
  }
};

module.exports = { validateHostUserToken, JWT_SECRET };
