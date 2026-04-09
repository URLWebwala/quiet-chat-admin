/** In-memory OTP store (per server process). For multi-instance production use Redis. */

const store = new Map();

const OTP_TTL_MS = 5 * 60 * 1000;
// Fast2SMS has its own anti-spam rules; keep server cooldown a bit higher than 60s
// so we block retries before provider rejects them.
// Resend only after OTP TTL to avoid provider spam detection.
const RESEND_INTERVAL_MS = OTP_TTL_MS;
// When provider rejects due to spam, temporarily block longer (provider lockouts can be 5–15 min).
const PROVIDER_SPAM_BLOCK_MS = 15 * 60 * 1000;

function markRequest(phoneKey) {
  const now = Date.now();
  const prev = store.get(phoneKey) || {};
  store.set(phoneKey, {
    ...prev,
    lastRequestAt: now,
  });
}

function blockProviderSpam(phoneKey) {
  const now = Date.now();
  const prev = store.get(phoneKey) || {};
  const blockedUntil = now + PROVIDER_SPAM_BLOCK_MS;
  store.set(phoneKey, {
    ...prev,
    lastRequestAt: now,
    blockedUntil,
  });
  return blockedUntil;
}

function setOtp(phoneKey, code) {
  const now = Date.now();
  const prev = store.get(phoneKey) || {};
  store.set(phoneKey, {
    ...prev,
    code: String(code),
    expiresAt: now + OTP_TTL_MS,
    lastRequestAt: prev.lastRequestAt || now,
  });
}

function getEntry(phoneKey) {
  return store.get(phoneKey);
}

function canRequest(phoneKey) {
  const row = store.get(phoneKey);
  if (!row) return true;
  if (row.blockedUntil && Date.now() < row.blockedUntil) return false;
  return Date.now() - row.lastRequestAt >= RESEND_INTERVAL_MS;
}

function getRetryAfterSeconds(phoneKey) {
  const row = store.get(phoneKey);
  if (!row) return 0;
  const now = Date.now();
  if (row.blockedUntil && now < row.blockedUntil) {
    return Math.ceil((row.blockedUntil - now) / 1000);
  }
  const elapsed = now - (row.lastRequestAt || 0);
  const left = RESEND_INTERVAL_MS - elapsed;
  return left > 0 ? Math.ceil(left / 1000) : 0;
}

function verifyAndConsume(phoneKey, inputCode) {
  const row = store.get(phoneKey);
  if (!row) return false;
  if (Date.now() > row.expiresAt) {
    store.delete(phoneKey);
    return false;
  }
  if (String(inputCode).trim() !== row.code) return false;
  store.delete(phoneKey);
  return true;
}

module.exports = {
  OTP_TTL_MS,
  RESEND_INTERVAL_MS,
  markRequest,
  blockProviderSpam,
  setOtp,
  getEntry,
  canRequest,
  getRetryAfterSeconds,
  verifyAndConsume,
};
