const User = require("../../models/user.model");
const {
  sendOtpViaFast2Sms,
  sendWhatsappTemplateViaFast2Sms,
  buildWhatsappOtpVariablesValues,
} = require("../../util/fast2sms");
const phoneOtpStore = require("../../util/phoneOtpStore");
const adminInit = require("../../util/privateKey");

const LOGIN_TYPE_PHONE = 4;

function normalizePhone(phone) {
  let p = String(phone || "").trim().replace(/\s/g, "");
  if (!p) return null;
  if (!p.startsWith("+")) {
    if (/^91\d{10}$/.test(p)) p = `+${p}`;
    else if (/^\d{10}$/.test(p)) p = `+91${p}`;
  }
  return p;
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * POST /api/client/sms/requestOtp
 * Body: { "phone": "+919876543210" }
 */
exports.requestOtp = async (req, res) => {
  let phoneKey = null;
  try {
    const s = global.settingJSON;
    if (!s?.fast2smsEnabled) {
      return res.status(200).json({ status: false, message: "SMS OTP is not enabled on the server." });
    }

    const phone = normalizePhone(req.body?.phone);
    if (!phone) {
      return res.status(200).json({ status: false, message: "Valid phone is required." });
    }

    phoneKey = phone;

    if (!phoneOtpStore.canRequest(phoneKey)) {
      return res.status(200).json({
        status: false,
        message: "Please wait before requesting another OTP.",
        retryAfterSeconds: phoneOtpStore.getRetryAfterSeconds(phoneKey) || 60,
      });
    }

    const apiKey = String(s.fast2smsApiKey || "").trim();
    if (!apiKey) {
      return res.status(200).json({ status: false, message: "Fast2SMS API key is not configured." });
    }

    const otp = generateOtp();
    // Reserve cooldown immediately to prevent parallel/retry spam
    phoneOtpStore.markRequest(phoneKey);

    const wPid = String(s.fast2smsWhatsappPhoneNumberId || "").trim();
    const wMid = Number(s.fast2smsWhatsappMessageId);
    const waApiKey = String(s.fast2smsWhatsappApiKey || "").trim() || apiKey;
    const canSendWhatsApp = !!s.fast2smsWhatsappOtpEnabled && !!wPid && !!wMid;

    let smsError = null;
    let waError = null;
    let sentSms = false;
    let sentWa = false;

    try {
      await sendOtpViaFast2Sms({
        apiKey,
        route: s.fast2smsRoute || "otp",
        senderId: s.fast2smsSenderId,
        dltMessage: s.fast2smsDltMessage,
        flash: s.fast2smsFlash,
        phoneE164OrLocal: phone,
        otpCode: otp,
      });
      sentSms = true;
    } catch (err) {
      smsError = err;
      console.warn("requestOtp: SMS send failed:", err?.message || err);
    }

    if (canSendWhatsApp) {
      try {
        const variablesValues = buildWhatsappOtpVariablesValues(
          s.fast2smsWhatsappVariableCount,
          otp,
          phoneOtpStore.OTP_TTL_MS,
        );
        await sendWhatsappTemplateViaFast2Sms({
          apiKey: waApiKey,
          messageId: wMid,
          phoneNumberId: wPid,
          phoneE164OrLocal: phone,
          variablesValues,
        });
        sentWa = true;
      } catch (err) {
        waError = err;
        console.warn("requestOtp: WhatsApp send failed:", err?.message || err);
      }
    } else if (s.fast2smsWhatsappOtpEnabled) {
      console.warn(
        "requestOtp: fast2smsWhatsappOtpEnabled is on but fast2smsWhatsappPhoneNumberId or fast2smsWhatsappMessageId is missing.",
      );
    }

    if (!sentSms && !sentWa) {
      throw smsError || waError || new Error("Failed to send OTP.");
    }

    // Store OTP only after at least one channel accepts the send
    phoneOtpStore.setOtp(phoneKey, otp);

    const channelLabel = sentSms && sentWa ? "SMS and WhatsApp" : sentWa ? "WhatsApp" : "SMS";
    return res.status(200).json({
      status: true,
      message: `OTP sent successfully via ${channelLabel}.`,
      expiresInSeconds: Math.floor(phoneOtpStore.OTP_TTL_MS / 1000),
      channel: channelLabel,
    });
  } catch (error) {
    const msg = String(error?.message || "");
    const isProviderSpam = /spamming detected/i.test(msg);
    if (isProviderSpam) console.warn("requestOtp: provider blocked OTP send");
    else console.error("requestOtp:", msg || error);

    // Fast2SMS sometimes blocks repeated sends to same number for longer than our cooldown.
    // Convert provider spam errors into a consistent cooldown response for the app.
    if (isProviderSpam) {
      if (phoneKey) phoneOtpStore.blockProviderSpam(phoneKey);
      return res.status(200).json({
        status: false,
        message: "Please wait before requesting another OTP.",
        retryAfterSeconds:
          (phoneKey ? phoneOtpStore.getRetryAfterSeconds(phoneKey) : 0) ||
          Math.ceil(phoneOtpStore.RESEND_INTERVAL_MS / 1000),
      });
    }
    return res.status(200).json({
      status: false,
      message: msg || "Failed to send OTP.",
    });
  }
};

/**
 * POST /api/client/sms/verifyOtp
 * Body: { "phone": "+919876543210", "otp": "123456" }
 * Returns Firebase custom token — app should signInWithCustomToken then call signInOrSignUp as today.
 */
exports.verifyOtp = async (req, res) => {
  try {
    const s = global.settingJSON;
    if (!s?.fast2smsEnabled) {
      return res.status(200).json({ status: false, message: "SMS OTP is not enabled on the server." });
    }

    const phone = normalizePhone(req.body?.phone);
    const otp = req.body?.otp;
    if (!phone || otp === undefined || otp === null || String(otp).trim() === "") {
      return res.status(200).json({ status: false, message: "phone and otp are required." });
    }

    const phoneKey = phone;
    if (!phoneOtpStore.verifyAndConsume(phoneKey, String(otp).trim())) {
      return res.status(200).json({ status: false, message: "Invalid or expired OTP." });
    }

    const dbUser = await User.findOne({ phone, loginType: LOGIN_TYPE_PHONE }).select("firebaseUid").lean();

    const firebaseAdmin = await adminInit;

    let firebaseUid = dbUser?.firebaseUid || null;

    if (firebaseUid) {
      try {
        await firebaseAdmin.auth().getUser(firebaseUid);
      } catch (_) {
        firebaseUid = null;
      }
    }

    if (!firebaseUid) {
      try {
        const byPhone = await firebaseAdmin.auth().getUserByPhoneNumber(phone);
        firebaseUid = byPhone.uid;
      } catch (_) {
        const created = await firebaseAdmin.auth().createUser({ phoneNumber: phone });
        firebaseUid = created.uid;
      }
    }

    // Signed with the same service account as privateKey (Firebase Admin) — valid for this project only.
    const customToken = await firebaseAdmin.auth().createCustomToken(firebaseUid);

    await User.updateOne(
      { phone, loginType: LOGIN_TYPE_PHONE },
      { $set: { firebaseUid } },
    );

    return res.status(200).json({
      status: true,
      message: "Phone verified.",
      firebaseUid,
      customToken,
    });
  } catch (error) {
    console.error("verifyOtp:", error?.message || error);
    return res.status(200).json({
      status: false,
      message: error?.message || "Verification failed.",
    });
  }
};
