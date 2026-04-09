const axios = require("axios");

/** Official path uses capital V — lowercase bulkv2 returns HTTP 404. */
const BULK_V2_URL = "https://www.fast2sms.com/dev/bulkV2";

/**
 * Fast2SMS expects 10-digit Indian numbers without +91 (per dashboard examples).
 */
function toFast2SmsNumber(e164OrLocal) {
  let p = String(e164OrLocal || "").replace(/\s/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  if (p.startsWith("91") && p.length === 12) p = p.slice(2);
  return p.replace(/\D/g, "");
}

/**
 * @param {object} opts
 * @param {string} opts.apiKey — Authorization header value (see Fast2SMS docs)
 * @param {"otp"|"dlt"} opts.route
 * @param {string} [opts.senderId]
 * @param {string} [opts.dltMessage] — template with {#var#} for DLT
 * @param {number} [opts.flash]
 * @param {string} opts.phoneE164OrLocal
 * @param {string} opts.otpCode
 */
async function sendOtpViaFast2Sms(opts) {
  const {
    apiKey,
    route,
    senderId = "",
    dltMessage = "",
    flash = 0,
    phoneE164OrLocal,
    otpCode,
  } = opts;

  const numbers = toFast2SmsNumber(phoneE164OrLocal);
  if (!numbers || numbers.length < 10) {
    throw new Error("Invalid phone number for SMS.");
  }

  const key = String(apiKey || "").trim();
  if (!key) throw new Error("Fast2SMS API key is not configured.");

  let body;
  const r = String(route || "otp").toLowerCase();
  if (r === "dlt") {
    const msg = String(dltMessage || "").trim();
    if (!msg || !msg.includes("{#var#}")) {
      throw new Error('DLT route requires fast2smsDltMessage containing {#var#}.');
    }
    if (!String(senderId || "").trim()) {
      throw new Error("DLT route requires fast2smsSenderId.");
    }
    body = {
      route: "dlt",
      sender_id: String(senderId).trim(),
      message: msg,
      variables_values: String(otpCode),
      numbers,
      flash: Number(flash) === 1 ? 1 : 0,
    };
  } else {
    body = {
      route: "otp",
      variables_values: String(otpCode),
      numbers,
    };
  }

  const res = await axios.post(BULK_V2_URL, body, {
    headers: {
      Authorization: key,
      "Content-Type": "application/json",
    },
    timeout: 20000,
    validateStatus: () => true,
  });

  const data = res.data;
  if (res.status >= 400) {
    throw new Error(data?.message || `Fast2SMS HTTP ${res.status}`);
  }
  if (data && data.return === false) {
    throw new Error(data.message || "Fast2SMS rejected the request.");
  }

  return data;
}

module.exports = {
  BULK_V2_URL,
  toFast2SmsNumber,
  sendOtpViaFast2Sms,
};
