const crypto = require("crypto");

/**
 * Hash password with PBKDF2 + random salt
 */
function hashPassword(password) {
  if (!password || typeof password !== "string") {
    throw new Error("Password must be a non-empty string");
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password.trim(), salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify password against stored salt:hash
 */
function verifyPassword(password, stored) {
  if (!password || !stored || typeof stored !== "string" || !stored.includes(":")) {
    return false;
  }
  const [salt, originalHash] = stored.split(":");
  const testHash = crypto.pbkdf2Sync(password.trim(), salt, 1000, 64, "sha512").toString("hex");
  return testHash === originalHash;
}

module.exports = { hashPassword, verifyPassword };
