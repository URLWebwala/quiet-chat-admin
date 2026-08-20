const crypto = require("crypto");

function getAiBaseUrl() {
  return process.env.DATING_AI_BASE_URL || "http://localhost:8000";
}

function getAiSecret() {
  return process.env.DATING_AI_SECRET || process.env.secretKey || "default_secret";
}

function createAIHeaders(method, path, body = null, query = "") {
  const secret = getAiSecret();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = Date.now().toString();

  const bodyString = body ? JSON.stringify(body) : "";
  const bodyHash = crypto.createHash("sha256").update(bodyString, "utf8").digest("hex");

  const target = query ? `${path}?${query}` : path;
  const canonical = [method.toUpperCase(), target, timestamp, nonce, bodyHash].join("\n");

  const signature = crypto.createHmac("sha256", secret).update(canonical, "utf8").digest("hex");

  return {
    "x-timestamp": timestamp,
    "x-nonce": nonce,
    "x-signature": signature,
    "x-api-key": secret,
    "Content-Type": "application/json",
  };
}

module.exports = {
  get DATING_AI_BASE_URL() {
    return getAiBaseUrl();
  },
  createAIHeaders,
};

