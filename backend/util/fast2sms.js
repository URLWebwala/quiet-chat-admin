const axios = require("axios");

/** Official path uses capital V — lowercase bulkv2 returns HTTP 404. */
const BULK_V2_URL = "https://www.fast2sms.com/dev/bulkV2";

/** WABA numbers & approved templates — docs: https://docs.fast2sms.com/reference/get-waba-template-details */
const WABA_MANAGER_URL = "https://www.fast2sms.com/dev/dlt_manager/whatsapp";

/** Simple WhatsApp template send — docs: https://docs.fast2sms.com/reference/sendwhatsappmessage */
const WHATSAPP_SEND_URL = "https://www.fast2sms.com/dev/whatsapp";

/**
 * Fast2SMS expects 10-digit Indian numbers without +91 (per dashboard examples).
 */
/**
 * Build `variables_values` for OTP-style templates: Var1 = code, Var2+ default to validity minutes.
 * @param {number} variableCount 0 = omit variables; 1+ = pipe-separated
 * @param {string} otpCode
 * @param {number} otpTtlMs
 * @returns {string|undefined}
 */
function buildWhatsappOtpVariablesValues(variableCount, otpCode, otpTtlMs) {
  let vc = Math.floor(Number(variableCount));
  if (!Number.isFinite(vc)) vc = 1;
  vc = Math.min(10, Math.max(0, vc));
  // Typical AUTH templates (e.g. otp with {{1}}) need at least one variable; 0 would omit variables_values.
  if (vc === 0) vc = 1;
  const ttl = Number(otpTtlMs) > 0 ? Number(otpTtlMs) : 5 * 60 * 1000;
  const minutes = Math.max(1, Math.ceil(ttl / 60000));
  const parts = [String(otpCode)];
  for (let i = 1; i < vc; i += 1) parts.push(String(minutes));
  return parts.join("|");
}

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

/**
 * @param {object} opts
 * @param {string} opts.apiKey
 * @param {"number"|"template"} opts.type
 * @returns {Promise<any>} Fast2JSON body (e.g. { success, data })
 */
async function fetchFast2SmsWabaWhatsapp(opts) {
  const key = String(opts.apiKey || "").trim();
  if (!key) throw new Error("Fast2SMS API key is not configured.");

  const type = opts.type === "template" ? "template" : "number";
  const res = await axios.get(WABA_MANAGER_URL, {
    params: { authorization: key, type },
    timeout: 30000,
    validateStatus: () => true,
  });
  const data = res.data;
  if (res.status >= 400) {
    throw new Error(data?.message || `Fast2SMS WABA HTTP ${res.status}`);
  }
  if (data && data.success === false) {
    throw new Error(data.message || "Fast2SMS WABA request failed.");
  }
  return data;
}

/**
 * Fast2SMS "Send WhatsApp Message" expects Meta Cloud API phone_number_id (digits only),
 * not JWT / system user tokens from Meta.
 */
function assertFast2smsWhatsappPhoneNumberId(pnidRaw) {
  const pnid = String(pnidRaw || "").trim();
  if (!pnid) {
    throw new Error("Fast2SMS WhatsApp phone_number_id is not configured.");
  }
  if (!/^\d{8,24}$/.test(pnid)) {
    throw new Error(
      'phone_number_id must be digits only — copy the "Phone Number ID" column from Fast2SMS → WhatsApp Manager (e.g. 1018278628043971). Do not paste Meta access tokens or long random strings.',
    );
  }
  return pnid;
}

/**
 * Fast2SMS template row uses a small integer message_id. Meta template_id is a much longer number;
 * pasting template_id causes HTTP 400 from Fast2SMS.
 */
function assertFast2smsWhatsappMessageId(messageIdRaw) {
  const mid = Number(messageIdRaw);
  if (!mid || Number.isNaN(mid)) {
    throw new Error("Invalid Fast2SMS WhatsApp message_id.");
  }
  // Meta template_id values are typically 12+ digits; Fast2SMS's row message_id stays much smaller.
  if (mid >= 100_000_000_000) {
    throw new Error(
      'message_id looks like a Meta template_id. Use Fast2SMS\'s own "message_id" for the template (small integer from the Templates list or WABA API JSON, e.g. 18204) — not the long Meta / template_id field.',
    );
  }
  return mid;
}

function formatFast2smsWhatsappHttpError(status, data) {
  if (data && typeof data === "object") {
    const m = data.message || data.error || data.msg;
    if (m) return `${m} (HTTP ${status})`;
    try {
      const compact = JSON.stringify(data);
      if (compact.length < 400) return `${compact} (HTTP ${status})`;
    } catch (_) {
      /* ignore */
    }
  }
  return `Fast2SMS WhatsApp HTTP ${status}`;
}

/**
 * @param {object} opts
 * @param {string} opts.apiKey
 * @param {number|string} opts.messageId — Fast2SMS template message_id from panel or WABA API
 * @param {string|number} opts.phoneNumberId — WABA phone_number_id
 * @param {string} opts.phoneE164OrLocal — destination (Indian mobile normalized to 10 digits)
 * @param {string} [opts.variablesValues] — pipe-separated for {{1}}, {{2}}, … (omit if template has no variables)
 */
async function sendWhatsappTemplateViaFast2Sms(opts) {
  const {
    apiKey,
    messageId,
    phoneNumberId,
    phoneE164OrLocal,
    variablesValues,
  } = opts;

  const numbers = toFast2SmsNumber(phoneE164OrLocal);
  if (!numbers || numbers.length < 10) {
    throw new Error("Invalid phone number for WhatsApp.");
  }

  const key = String(apiKey || "").trim();
  if (!key) throw new Error("Fast2SMS API key is not configured.");

  const mid = assertFast2smsWhatsappMessageId(messageId);
  const pnid = assertFast2smsWhatsappPhoneNumberId(phoneNumberId);

  const params = {
    authorization: key,
    message_id: mid,
    phone_number_id: pnid,
    numbers,
  };
  if (variablesValues !== undefined && variablesValues !== null && String(variablesValues).trim() !== "") {
    params.variables_values = String(variablesValues).trim();
  }

  const res = await axios.get(WHATSAPP_SEND_URL, {
    params,
    timeout: 30000,
    validateStatus: () => true,
  });

  const data = res.data;
  if (res.status >= 400) {
    throw new Error(formatFast2smsWhatsappHttpError(res.status, data));
  }
  if (data && (data.status === false || data.return === false)) {
    throw new Error(data.message || "Fast2SMS WhatsApp rejected the request.");
  }

  return data;
}

module.exports = {
  BULK_V2_URL,
  WABA_MANAGER_URL,
  WHATSAPP_SEND_URL,
  toFast2SmsNumber,
  buildWhatsappOtpVariablesValues,
  sendOtpViaFast2Sms,
  fetchFast2SmsWabaWhatsapp,
  sendWhatsappTemplateViaFast2Sms,
  assertFast2smsWhatsappPhoneNumberId,
  assertFast2smsWhatsappMessageId,
};
