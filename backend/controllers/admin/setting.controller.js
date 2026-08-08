const axios = require("axios");
const https = require("https");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);
const Setting = require("../../models/setting.model");
const SurveyProvider = require("../../models/surveyProvider.model");
const SurveyHistory = require("../../models/surveyHistory.model");
const {
  sendOtpViaFast2Sms,
  fetchFast2SmsWabaWhatsapp,
  sendWhatsappTemplateViaFast2Sms,
  buildWhatsappOtpVariablesValues,
} = require("../../util/fast2sms");
const phoneOtpStore = require("../../util/phoneOtpStore");

function toPlainSetting(setting) {
  if (!setting) return null;
  return typeof setting.toObject === "function" ? setting.toObject() : { ...setting };
}

async function getLatestSetting(requestedId) {
  const setting = await Setting.findOne().sort({ createdAt: -1 });
  if (!setting) return null;
  if (requestedId && String(setting._id) !== String(requestedId)) {
    console.warn(
      `[Setting] Requested settingId ${requestedId} but using latest document ${setting._id}`
    );
  }
  return setting;
}

async function reloadSettingPlain(settingId) {
  return Setting.findById(settingId).lean();
}

//scheduleChatJob
const scheduleChatJob = require("../../worker/bullRandomChatJob");

function validateCashfreePair(clientId, clientSecret, envLabel) {
  const id = String(clientId || "").trim();
  const secret = String(clientSecret || "").trim();
  if (!id && !secret) return null;
  if (!id || !secret) {
    return `${envLabel}: both Client Id and Client Secret are required.`;
  }
  const idLower = id.toLowerCase();
  const secretLower = secret.toLowerCase();
  if (idLower.startsWith("cfsk_")) {
    return `${envLabel}: Client Id looks like a Secret key (starts with cfsk_). Please swap fields.`;
  }
  if (!secretLower.startsWith("cfsk_")) {
    return `${envLabel}: Client Secret must start with cfsk_.`;
  }
  if (envLabel === "Sandbox / Testing" && secretLower.includes("_prod_")) {
    return `${envLabel}: production secret detected (cfsk...prod...). Use cfsk...test...`;
  }
  if (envLabel === "Production / Live" && secretLower.includes("_test_")) {
    return `${envLabel}: test secret detected (cfsk...test...). Use cfsk...prod...`;
  }
  return null;
}

//update setting
exports.updateSetting = async (req, res) => {
  try {
    if (!req.query.settingId) {
      return res.status(200).json({ status: false, message: "SettingId must be required." });
    }

    const setting = await getLatestSetting(req.query.settingId);
    if (!setting) {
      return res.status(200).json({ status: false, message: "Setting not found." });
    }

    let shouldRescheduleChatJob = false;

    // ====== PAYSTACK ======
    setting.paystackPublicKey = req.body.paystackPublicKey?.trim() ?? setting.paystackPublicKey;
    setting.paystackSecretKey = req.body.paystackSecretKey?.trim() ?? setting.paystackSecretKey;

    // ====== PAYPAL ======
    setting.paypalClientId = req.body.paypalClientId?.trim() ?? setting.paypalClientId;
    setting.paypalSecretKey = req.body.paypalSecretKey?.trim() ?? setting.paypalSecretKey;

    // ====== CASHFREE ======
    setting.cashfreeClientId = req.body.cashfreeClientId?.trim() ?? setting.cashfreeClientId;
    setting.cashfreeClientSecret = req.body.cashfreeClientSecret?.trim() ?? setting.cashfreeClientSecret;
    if (req.body.cashfreeTestClientId !== undefined) {
      setting.cashfreeTestClientId = String(req.body.cashfreeTestClientId).trim();
    }
    if (req.body.cashfreeTestClientSecret !== undefined) {
      setting.cashfreeTestClientSecret = String(req.body.cashfreeTestClientSecret).trim();
    }
    if (req.body.cashfreeProdClientId !== undefined) {
      setting.cashfreeProdClientId = String(req.body.cashfreeProdClientId).trim();
    }
    if (req.body.cashfreeProdClientSecret !== undefined) {
      setting.cashfreeProdClientSecret = String(req.body.cashfreeProdClientSecret).trim();
    }

    setting.agoraAppId = req.body.agoraAppId?.trim() ?? setting.agoraAppId;
    setting.agoraAppCertificate = req.body.agoraAppCertificate?.trim() ?? setting.agoraAppCertificate;
    setting.privacyPolicyLink = req.body.privacyPolicyLink?.trim() ?? setting.privacyPolicyLink;
    setting.termsOfUsePolicyLink = req.body.termsOfUsePolicyLink?.trim() ?? setting.termsOfUsePolicyLink;
    setting.stripePublishableKey = req.body.stripePublishableKey?.trim() ?? setting.stripePublishableKey;
    setting.stripeSecretKey = req.body.stripeSecretKey?.trim() ?? setting.stripeSecretKey;
    setting.razorpayId = req.body.razorpayId?.trim() ?? setting.razorpayId;
    setting.razorpaySecretKey = req.body.razorpaySecretKey?.trim() ?? setting.razorpaySecretKey;
    setting.razorpayXFromAccountNumber =
      req.body.razorpayXFromAccountNumber !== undefined
        ? String(req.body.razorpayXFromAccountNumber).trim()
        : setting.razorpayXFromAccountNumber;
    setting.razorpayXPayoutWebhookSecret =
      req.body.razorpayXPayoutWebhookSecret !== undefined
        ? String(req.body.razorpayXPayoutWebhookSecret).trim()
        : setting.razorpayXPayoutWebhookSecret;
    setting.flutterwaveId = req.body.flutterwaveId?.trim() ?? setting.flutterwaveId;
    setting.loginBonus = req.body.loginBonus ? Number(req.body.loginBonus) : setting.loginBonus;
    setting.adminCommissionRate = req.body.adminCommissionRate ? Number(req.body.adminCommissionRate) : setting.adminCommissionRate;
    setting.minCoinsToConvert = req.body.minCoinsToConvert ? Number(req.body.minCoinsToConvert) : setting.minCoinsToConvert;
    setting.minCoinsForHostPayout = req.body.minCoinsForHostPayout ? Number(req.body.minCoinsForHostPayout) : setting.minCoinsForHostPayout;
    setting.minCoinsForAgencyPayout = req.body.minCoinsForAgencyPayout ? Number(req.body.minCoinsForAgencyPayout) : setting.minCoinsForAgencyPayout;
    setting.maxFreeChatMessages = req.body.maxFreeChatMessages ? Number(req.body.maxFreeChatMessages) : setting.maxFreeChatMessages;

    if (req.body.messageInitiatedAt !== undefined) {
      const newVal = Number(req.body.messageInitiatedAt);
      if (newVal !== setting.messageInitiatedAt) {
        shouldRescheduleChatJob = true;
        setting.messageInitiatedAt = newVal;
      }
    }

    if (req.body.callInitiatedAt !== undefined) {
      setting.callInitiatedAt = Number(req.body.callInitiatedAt);
    }

    if (req.body.privateKey) {
      setting.privateKey = typeof req.body.privateKey === "string" ? JSON.parse(req.body.privateKey.trim()) : req.body.privateKey;
    }

    setting.generalRandomCallRate = req.body.generalRandomCallRate !== undefined ? Number(req.body.generalRandomCallRate) : setting.generalRandomCallRate;
    setting.femaleRandomCallRate = req.body.femaleRandomCallRate !== undefined ? Number(req.body.femaleRandomCallRate) : setting.femaleRandomCallRate;
    setting.maleRandomCallRate = req.body.maleRandomCallRate !== undefined ? Number(req.body.maleRandomCallRate) : setting.maleRandomCallRate;
    setting.videoPrivateCallRate = req.body.videoPrivateCallRate !== undefined ? Number(req.body.videoPrivateCallRate) : setting.videoPrivateCallRate;
    setting.audioPrivateCallRate = req.body.audioPrivateCallRate !== undefined ? Number(req.body.audioPrivateCallRate) : setting.audioPrivateCallRate;
    setting.chatInteractionRate = req.body.chatInteractionRate !== undefined ? Number(req.body.chatInteractionRate) : setting.chatInteractionRate;

    if (req.body.androidMinVersionCode !== undefined) {
      setting.androidMinVersionCode = Number(req.body.androidMinVersionCode);
    }
    if (req.body.androidLatestVersionCode !== undefined) {
      setting.androidLatestVersionCode = Number(req.body.androidLatestVersionCode);
    }
    if (req.body.androidUpdateUrl !== undefined) {
      setting.androidUpdateUrl = req.body.androidUpdateUrl?.trim() || setting.androidUpdateUrl;
    }

    // ====== Fast2SMS (phone OTP) ======
    if (req.body.fast2smsApiKey !== undefined) {
      setting.fast2smsApiKey = String(req.body.fast2smsApiKey).trim();
    }
    if (req.body.fast2smsSenderId !== undefined) {
      setting.fast2smsSenderId = String(req.body.fast2smsSenderId).trim();
    }
    if (req.body.fast2smsRoute !== undefined) {
      const r = String(req.body.fast2smsRoute).toLowerCase().trim();
      setting.fast2smsRoute = r === "dlt" ? "dlt" : "otp";
    }
    if (req.body.fast2smsDltMessage !== undefined) {
      setting.fast2smsDltMessage = String(req.body.fast2smsDltMessage);
    }
    if (req.body.fast2smsFlash !== undefined) {
      setting.fast2smsFlash = Number(req.body.fast2smsFlash) === 1 ? 1 : 0;
    }
    if (req.body.fast2smsWhatsappApiKey !== undefined) {
      setting.fast2smsWhatsappApiKey = String(req.body.fast2smsWhatsappApiKey).trim();
    }
    if (req.body.fast2smsWhatsappPhoneNumberId !== undefined) {
      setting.fast2smsWhatsappPhoneNumberId = String(req.body.fast2smsWhatsappPhoneNumberId).trim();
    }
    if (req.body.fast2smsWhatsappMessageId !== undefined) {
      const mid = Number(req.body.fast2smsWhatsappMessageId);
      setting.fast2smsWhatsappMessageId = Number.isFinite(mid) && mid > 0 ? mid : 0;
    }
    if (req.body.fast2smsWhatsappVariableCount !== undefined) {
      const vc = Number(req.body.fast2smsWhatsappVariableCount);
      if (Number.isFinite(vc)) {
        setting.fast2smsWhatsappVariableCount = Math.min(10, Math.max(0, Math.floor(vc)));
      }
    }

    // ====== Ads Watch ======
    if (req.body.adsWatchUserCoinPerAd !== undefined) {
      setting.adsWatchUserCoinPerAd = Number(req.body.adsWatchUserCoinPerAd) || 0;
    }
    if (req.body.adsWatchHostCoinPerAd !== undefined) {
      setting.adsWatchHostCoinPerAd = Number(req.body.adsWatchHostCoinPerAd) || 0;
    }
    if (req.body.adsWatchUserDailyLimit !== undefined) {
      setting.adsWatchUserDailyLimit = Number(req.body.adsWatchUserDailyLimit) || 0;
    }
    if (req.body.adsWatchHostDailyLimit !== undefined) {
      setting.adsWatchHostDailyLimit = Number(req.body.adsWatchHostDailyLimit) || 0;
    }
    if (req.body.adsWatchMinCoinsToClaim !== undefined) {
      setting.adsWatchMinCoinsToClaim = Number(req.body.adsWatchMinCoinsToClaim) || 0;
    }
    if (req.body.adsWatchPointsPerCoin !== undefined) {
      setting.adsWatchPointsPerCoin = Number(req.body.adsWatchPointsPerCoin) || 1;
    }
    if (req.body.adsWatchClaimFrequencyHours !== undefined) {
      setting.adsWatchClaimFrequencyHours = Number(req.body.adsWatchClaimFrequencyHours) || 0;
    }
    if (req.body.adsWatchFullWatchBonus !== undefined) {
      setting.adsWatchFullWatchBonus = Number(req.body.adsWatchFullWatchBonus) || 0;
    }
    if (req.body.adsWatchMaxAdsPerDevicePerDay !== undefined) {
      setting.adsWatchMaxAdsPerDevicePerDay = Number(req.body.adsWatchMaxAdsPerDevicePerDay) || 0;
    }
    if (req.body.adsWatchHostBonusMultiplier !== undefined) {
      setting.adsWatchHostBonusMultiplier = Number(req.body.adsWatchHostBonusMultiplier) || 1;
    }
    if (req.body.adsWatchVipBonusPoints !== undefined) {
      setting.adsWatchVipBonusPoints = Number(req.body.adsWatchVipBonusPoints) || 0;
    }
    if (req.body.adsWatchEnabled !== undefined) {
      setting.adsWatchEnabled = !!req.body.adsWatchEnabled;
    }
    if (req.body.adsWatchRewardedAdsEnabled !== undefined) {
      setting.adsWatchRewardedAdsEnabled = !!req.body.adsWatchRewardedAdsEnabled;
    }
    if (req.body.adsWatchInterstitialAdsEnabled !== undefined) {
      setting.adsWatchInterstitialAdsEnabled = !!req.body.adsWatchInterstitialAdsEnabled;
    }
    if (req.body.adsWatchBannerAdsEnabled !== undefined) {
      setting.adsWatchBannerAdsEnabled = !!req.body.adsWatchBannerAdsEnabled;
    }
    if (req.body.adsWatchFraudProtectionEnabled !== undefined) {
      setting.adsWatchFraudProtectionEnabled = !!req.body.adsWatchFraudProtectionEnabled;
    }

    // ====== Ads Watch — AdMob / AdSense / Unity API keys ======
    const adsApiStringFields = [
      "adsWatchAndroidAppId",
      "adsWatchAndroidBannerAdUnitId",
      "adsWatchAndroidInterstitialAdUnitId",
      "adsWatchAndroidRewardedAdUnitId",
      "adsWatchIosAppId",
      "adsWatchIosBannerAdUnitId",
      "adsWatchIosInterstitialAdUnitId",
      "adsWatchIosRewardedAdUnitId",
      "adsWatchWebAdsenseClientId",
      "adsWatchWebAdSlotId",
      "unityGameIdAndroid",
      "unityPlacementIdAndroid",
      "unityGameIdIos",
      "unityPlacementIdIos",
      "unityOrganizationId",
      "unityApiKey",
    ];
    adsApiStringFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        setting[field] = String(req.body[field]).trim();
      }
    });
    if (req.body.adsWatchAndroidAdsEnabled !== undefined) {
      setting.adsWatchAndroidAdsEnabled = !!req.body.adsWatchAndroidAdsEnabled;
    }
    if (req.body.adsWatchIosAdsEnabled !== undefined) {
      setting.adsWatchIosAdsEnabled = !!req.body.adsWatchIosAdsEnabled;
    }
    if (req.body.adsWatchWebAdsEnabled !== undefined) {
      setting.adsWatchWebAdsEnabled = !!req.body.adsWatchWebAdsEnabled;
    }
    if (req.body.unityAdsEnabled !== undefined) {
      setting.unityAdsEnabled = !!req.body.unityAdsEnabled;
    }
    if (req.body.unityPointsPerAd !== undefined) {
      setting.unityPointsPerAd = Number(req.body.unityPointsPerAd) || 25;
    }

    const cashfreeTouched =
      req.body.cashfreeClientId !== undefined ||
      req.body.cashfreeClientSecret !== undefined ||
      req.body.cashfreeTestClientId !== undefined ||
      req.body.cashfreeTestClientSecret !== undefined ||
      req.body.cashfreeProdClientId !== undefined ||
      req.body.cashfreeProdClientSecret !== undefined;

    if (cashfreeTouched) {
      const selectedEnv = String(req.body.cashfreeSelectedEnv || "").toLowerCase().trim();
      const envToValidate = selectedEnv === "sandbox" ? "sandbox" : "production";

      setting.cashfreeSelectedEnv = envToValidate;

      if (envToValidate === "sandbox") {
        const sandboxError = validateCashfreePair(
          setting.cashfreeTestClientId,
          setting.cashfreeTestClientSecret,
          "Sandbox / Testing",
        );
        if (sandboxError) {
          return res.status(200).json({ status: false, message: sandboxError });
        }
      } else {
        const productionError = validateCashfreePair(
          setting.cashfreeProdClientId,
          setting.cashfreeProdClientSecret,
          "Production / Live",
        );
        if (productionError) {
          return res.status(200).json({ status: false, message: productionError });
        }
      }

      // Legacy fallback pair remains optional, but if provided then validate structure.
      const legacyError = validateCashfreePair(
        setting.cashfreeClientId,
        setting.cashfreeClientSecret,
        "Cashfree legacy pair",
      );
      if (legacyError) {
        return res.status(200).json({ status: false, message: legacyError });
      }
    }

    if (req.body.userMinWithdrawLimit !== undefined) {
      setting.userMinWithdrawLimit = Number(req.body.userMinWithdrawLimit) || 0;
    }
    if (req.body.userMaxWithdrawLimit !== undefined) {
      setting.userMaxWithdrawLimit = Number(req.body.userMaxWithdrawLimit) || 0;
    }
    if (req.body.pointsPerRupee !== undefined) {
      setting.pointsPerRupee = Number(req.body.pointsPerRupee) || 10;
    }
    if (req.body.bitlabsEnabled !== undefined) {
      setting.bitlabsEnabled = !!req.body.bitlabsEnabled;
    }
    if (req.body.bitlabsPointsPerSurvey !== undefined) {
      setting.bitlabsPointsPerSurvey = Number(req.body.bitlabsPointsPerSurvey) || 0;
    }
    if (req.body.cpxEnabled !== undefined) {
      setting.cpxEnabled = !!req.body.cpxEnabled;
    }
    if (req.body.cpxPointsPerSurvey !== undefined) {
      setting.cpxPointsPerSurvey = Number(req.body.cpxPointsPerSurvey) || 0;
    }
    if (req.body.cpxAppId !== undefined) {
      setting.cpxAppId = String(req.body.cpxAppId).trim();
    }
    if (req.body.cpxSecretKey !== undefined) {
      setting.cpxSecretKey = String(req.body.cpxSecretKey).trim();
    }
    if (req.body.cpxServerKey !== undefined) {
      setting.cpxServerKey = String(req.body.cpxServerKey).trim();
    }

    // Sync CPX credentials with SurveyProvider model
    if (req.body.cpxAppId !== undefined || req.body.cpxSecretKey !== undefined || req.body.cpxServerKey !== undefined) {
      await SurveyProvider.findOneAndUpdate(
        { name: "cpx" },
        {
          $set: {
            appId: setting.cpxAppId,
            secretKey: setting.cpxSecretKey,
            serverKey: setting.cpxServerKey,
            isActive: setting.cpxEnabled,
          },
        },
        { upsert: true, new: true }
      );
    }

    if (req.body.isAutoCallEnabled !== undefined) {
      setting.isAutoCallEnabled = req.body.isAutoCallEnabled === true || req.body.isAutoCallEnabled === 'true';
    }
    if (req.body.isAutoMessageEnabled !== undefined) {
      setting.isAutoMessageEnabled = req.body.isAutoMessageEnabled === true || req.body.isAutoMessageEnabled === 'true';
    }
    if (req.body.isHostEnabled !== undefined) {
      setting.isHostEnabled = req.body.isHostEnabled === true || req.body.isHostEnabled === 'true';
    }

    await setting.save();

    const plainSetting = await reloadSettingPlain(setting._id);
    if (!plainSetting) {
      return res.status(200).json({ status: false, message: "Setting not found after save." });
    }

    res.status(200).json({
      status: true,
      message: "Setting has been updated.",
      data: plainSetting,
    });

    // Global call/chat rates apply via resolveHostCallRates for hosts with useCustomCallRates !== true (no bulk overwrite).

    global.settingJSON = plainSetting;
    if (shouldRescheduleChatJob) {
      console.log("🔁 Rescheduling chat job...", global?.settingJSON?.messageInitiatedAt);
      await scheduleChatJob();
    }
    updateSettingFile(plainSetting);

    // if (req.body.privateKey) {
    //   try {
    //     setTimeout(() => {
    //       console.log("🔐 Private key updated, restarting server...");
    //       process.exit(0);
    //     }, 500); // 0.5s delay
    //     return;
    //   } catch (err) {
    //     console.error("Failed to update privateKey:", err);
    //   }
    // }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//update setting switch
exports.updateSettingToggle = async (req, res) => {
  try {
    if (!req.query.settingId || !req.query.type) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const setting = await getLatestSetting(req.query.settingId);
    if (!setting) {
      return res.status(200).json({ status: false, message: "Setting does not found." });
    }

    const type = req.query.type.trim();

    if (type === "googlePlayEnabled") {
      setting.googlePlayEnabled = !setting.googlePlayEnabled;
    } else if (type === "stripeEnabled") {
      setting.stripeEnabled = !setting.stripeEnabled;
    } else if (type === "razorpayEnabled") {
      setting.razorpayEnabled = !setting.razorpayEnabled;
    } else if (type === "flutterwaveEnabled") {
      setting.flutterwaveEnabled = !setting.flutterwaveEnabled;
    } else if (type === "isDemoData") {
      setting.isDemoData = !setting.isDemoData;
    } else if (type === "isAppEnabled") {
      setting.isAppEnabled = !setting.isAppEnabled;
    } else if (type === "isAutoRefreshEnabled") {
      setting.isAutoRefreshEnabled = !setting.isAutoRefreshEnabled;
    } else if (type === "paystackAndroidEnabled") {
      setting.paystackAndroidEnabled = !setting.paystackAndroidEnabled;
    } else if (type === "paystackIosEnabled") {
      setting.paystackIosEnabled = !setting.paystackIosEnabled;
    } else if (type === "paypalAndroidEnabled") {
      setting.paypalAndroidEnabled = !setting.paypalAndroidEnabled;
    } else if (type === "paypalIosEnabled") {
      setting.paypalIosEnabled = !setting.paypalIosEnabled;
    } else if (type === "cashfreeAndroidEnabled") {
      setting.cashfreeAndroidEnabled = !setting.cashfreeAndroidEnabled;
    } else if (type === "cashfreeIosEnabled") {
      setting.cashfreeIosEnabled = !setting.cashfreeIosEnabled;
    } else if (type === "googlePayIosEnabled") {
      setting.googlePayIosEnabled = !setting.googlePayIosEnabled;
    } else if (type === "stripeIosEnabled") {
      setting.stripeIosEnabled = !setting.stripeIosEnabled;
    } else if (type === "razorpayIosEnabled") {
      setting.razorpayIosEnabled = !setting.razorpayIosEnabled;
    } else if (type === "flutterwaveIosEnabled") {
      setting.flutterwaveIosEnabled = !setting.flutterwaveIosEnabled;
    } else if (type === "fast2smsEnabled") {
      setting.fast2smsEnabled = !setting.fast2smsEnabled;
    } else if (type === "fast2smsWhatsappOtpEnabled") {
      setting.fast2smsWhatsappOtpEnabled = !setting.fast2smsWhatsappOtpEnabled;
    } else if (type === "adsWatchEnabled") {
      setting.adsWatchEnabled = !setting.adsWatchEnabled;
    } else if (type === "adsWatchRewardedAdsEnabled") {
      setting.adsWatchRewardedAdsEnabled = !setting.adsWatchRewardedAdsEnabled;
    } else if (type === "adsWatchInterstitialAdsEnabled") {
      setting.adsWatchInterstitialAdsEnabled = !setting.adsWatchInterstitialAdsEnabled;
    } else if (type === "adsWatchFraudProtectionEnabled") {
      setting.adsWatchFraudProtectionEnabled = !setting.adsWatchFraudProtectionEnabled;
    } else if (type === "adsWatchAndroidAdsEnabled") {
      setting.adsWatchAndroidAdsEnabled = !setting.adsWatchAndroidAdsEnabled;
    } else if (type === "adsWatchIosAdsEnabled") {
      setting.adsWatchIosAdsEnabled = !setting.adsWatchIosAdsEnabled;
    } else if (type === "adsWatchWebAdsEnabled") {
      setting.adsWatchWebAdsEnabled = !setting.adsWatchWebAdsEnabled;
    } else if (type === "isAutoCallEnabled") {
      setting.isAutoCallEnabled = !setting.isAutoCallEnabled;
    } else if (type === "isAutoMessageEnabled") {
      setting.isAutoMessageEnabled = !setting.isAutoMessageEnabled;
    } else if (type === "isHostEnabled") {
      setting.isHostEnabled = !setting.isHostEnabled;
    } else {
      return res.status(200).json({ status: false, message: "type passed must be valid." });
    }

    await setting.save();

    const plainSetting = await reloadSettingPlain(setting._id);
    if (!plainSetting) {
      return res.status(200).json({ status: false, message: "Setting not found after save." });
    }

    res.status(200).json({ status: true, message: "Success", data: plainSetting });

    // Keep in-memory settings cache in sync for fetchSettings
    global.settingJSON = plainSetting;

    updateSettingFile(plainSetting);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get setting
/** POST body: { phone: "+91..." } — sends a test OTP using current Fast2SMS settings */
exports.testFast2Sms = async (req, res) => {
  try {
    if (!req.query.settingId) {
      return res.status(200).json({ status: false, message: "settingId query param is required." });
    }

    const setting = await Setting.findById(req.query.settingId);
    if (!setting) {
      return res.status(200).json({ status: false, message: "Setting not found." });
    }

    const phone = String(req.body?.phone || "").trim();
    if (!phone) {
      return res.status(200).json({ status: false, message: "phone is required." });
    }

    const apiKey = String(setting.fast2smsApiKey || "").trim();
    if (!apiKey) {
      return res.status(200).json({ status: false, message: "Configure fast2smsApiKey first." });
    }

    const testOtp = String(Math.floor(100000 + Math.random() * 900000));
    await sendOtpViaFast2Sms({
      apiKey,
      route: setting.fast2smsRoute || "otp",
      senderId: setting.fast2smsSenderId,
      dltMessage: setting.fast2smsDltMessage,
      flash: setting.fast2smsFlash,
      phoneE164OrLocal: phone,
      otpCode: testOtp,
    });

    return res.status(200).json({
      status: true,
      message: "Test SMS sent. Check the handset for the OTP.",
    });
  } catch (error) {
    console.error("testFast2Sms:", error);
    return res.status(200).json({ status: false, message: error?.message || "Failed to send test SMS." });
  }
};

/** GET ?settingId=&type=number|template — proxies Fast2SMS WABA / template list */
exports.fast2smsWhatsappDetails = async (req, res) => {
  try {
    if (!req.query.settingId) {
      return res.status(200).json({ status: false, message: "settingId query param is required." });
    }
    const setting = await Setting.findById(req.query.settingId);
    if (!setting) {
      return res.status(200).json({ status: false, message: "Setting not found." });
    }
    const apiKey = String(setting.fast2smsApiKey || "").trim();
    const waKey = String(setting.fast2smsWhatsappApiKey || "").trim();
    const keyForWa = waKey || apiKey;
    if (!keyForWa) {
      return res.status(200).json({ status: false, message: "Configure fast2smsApiKey (or WhatsApp API key) first." });
    }
    const t = String(req.query.type || "template").toLowerCase() === "number" ? "number" : "template";
    const data = await fetchFast2SmsWabaWhatsapp({ apiKey: keyForWa, type: t });
    return res.status(200).json({ status: true, message: "Success", data });
  } catch (error) {
    console.error("fast2smsWhatsappDetails:", error);
    return res.status(200).json({ status: false, message: error?.message || "Failed to fetch WABA details." });
  }
};

/** POST body: { phone } — sends test WhatsApp template (same fields as production OTP send) */
exports.testFast2smsWhatsapp = async (req, res) => {
  try {
    if (!req.query.settingId) {
      return res.status(200).json({ status: false, message: "settingId query param is required." });
    }
    const setting = await Setting.findById(req.query.settingId);
    if (!setting) {
      return res.status(200).json({ status: false, message: "Setting not found." });
    }
    const phone = String(req.body?.phone || "").trim();
    if (!phone) {
      return res.status(200).json({ status: false, message: "phone is required." });
    }
    const apiKey = String(setting.fast2smsApiKey || "").trim();
    const waKey = String(setting.fast2smsWhatsappApiKey || "").trim();
    const keyForWa = waKey || apiKey;
    if (!keyForWa) {
      return res.status(200).json({ status: false, message: "Configure fast2smsApiKey (or WhatsApp API key) first." });
    }
    const phoneNumberId = String(setting.fast2smsWhatsappPhoneNumberId || "").trim();
    const messageId = Number(setting.fast2smsWhatsappMessageId);
    if (!phoneNumberId || !messageId) {
      return res.status(200).json({
        status: false,
        message: "Set fast2smsWhatsappPhoneNumberId and fast2smsWhatsappMessageId (from WABA template API) first.",
      });
    }
    const testOtp = String(Math.floor(100000 + Math.random() * 900000));
    const variablesValues = buildWhatsappOtpVariablesValues(
      setting.fast2smsWhatsappVariableCount,
      testOtp,
      phoneOtpStore.OTP_TTL_MS,
    );
    await sendWhatsappTemplateViaFast2Sms({
      apiKey: keyForWa,
      messageId,
      phoneNumberId,
      phoneE164OrLocal: phone,
      variablesValues,
    });
    return res.status(200).json({
      status: true,
      message: "Test WhatsApp template sent. Check WhatsApp on the device.",
    });
  } catch (error) {
    console.error("testFast2smsWhatsapp:", error);
    return res.status(200).json({ status: false, message: error?.message || "Failed to send test WhatsApp." });
  }
};

exports.fetchSettings = async (req, res) => {
  try {
    const setting = await Setting.findOne().sort({ createdAt: -1 }).lean();
    if (!setting) {
      return res.status(200).json({ status: false, message: "Setting does not found." });
    }

    global.settingJSON = setting;

    return res.status(200).json({ status: true, message: "Success", data: setting });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Fetch Unity Ads Performance & Revenue Analytics via Unity Monetization API
exports.getUnityAnalytics = async (req, res) => {
  try {
    const setting = await Setting.findOne().sort({ createdAt: -1 });
    if (!setting) {
      return res.status(200).json({ status: false, message: "Settings not found." });
    }

    const { unityOrganizationId, unityApiKey } = setting;
    if (!unityOrganizationId || !unityApiKey) {
      return res.status(200).json({
        status: false,
        isConfigured: false,
        message: "Unity Organization ID and Reporting API Key are not configured. Please set them in Ad API Settings.",
      });
    }

    const daysRaw = parseInt(req.query.days);
    const days = isNaN(daysRaw) ? 7 : Math.max(0, Math.min(90, daysRaw));
    const endDate = new Date();
    const startDate = new Date();

    if (days === 0) {
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate.setDate(endDate.getDate() - days);
    }

    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    const cleanOrgId = unityOrganizationId.trim();
    const cleanApiKey = unityApiKey.trim();

    const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    const candidateConfigs = [
      {
        url: `https://stats.unityads.unity3d.com/api/v1/reports?organizationId=${cleanOrgId}&start=${startStr}&end=${endStr}&apikey=${cleanApiKey}`,
        headers: { "User-Agent": userAgent, Accept: "application/json, text/csv, */*" },
      },
      {
        url: `https://stats.unityads.unity3d.com/api/v1/reports?organizationId=${cleanOrgId}&start=${startStr}&end=${endStr}`,
        headers: { "User-Agent": userAgent, apikey: cleanApiKey, Accept: "application/json, text/csv, */*" },
      },
      {
        url: `https://monetization.api.unity.com/v1/organizations/${cleanOrgId}/reports?start=${startStr}&end=${endStr}&scale=day&fields=requests,impressions,revenue,ecpm`,
        headers: { "User-Agent": userAgent, apikey: cleanApiKey, Authorization: `Bearer ${cleanApiKey}`, "Secret-Token": cleanApiKey },
      },
      {
        url: `https://monetization.api.unity.com/v1/operands/reporting/reports?organizationId=${cleanOrgId}&start=${startStr}&end=${endStr}&scale=day`,
        headers: { "User-Agent": userAgent, apikey: cleanApiKey, Authorization: `Bearer ${cleanApiKey}`, "Secret-Token": cleanApiKey },
      },
      {
        url: `https://operate.api.unity.com/v1/organizations/${cleanOrgId}/reports?start=${startStr}&end=${endStr}&scale=day`,
        headers: { "User-Agent": userAgent, Authorization: `Bearer ${cleanApiKey}`, apikey: cleanApiKey },
      },
    ];

    let unityRes = null;
    let lastApiErr = null;

    const httpsAgent = new https.Agent({
      keepAlive: false,
      rejectUnauthorized: false,
      minVersion: "TLSv1",
    });

    for (const config of candidateConfigs) {
      try {
        const res = await axios.get(config.url, {
          headers: config.headers,
          httpsAgent,
          timeout: 15000,
        });
        if (res && res.data) {
          unityRes = res;
          break;
        }
      } catch (err) {
        lastApiErr = err;
      }
    }

    if (!unityRes) {
      // System curl fallback to bypass Node TLS socket reset issues
      for (const config of candidateConfigs) {
        try {
          let headerStr = "";
          for (const [k, v] of Object.entries(config.headers)) {
            headerStr += ` -H "${k}: ${v}"`;
          }
          const cmd = `curl -s -L --max-time 15 ${headerStr} "${config.url}"`;
          const { stdout } = await execPromise(cmd);
          if (stdout && stdout.trim() && !stdout.toLowerCase().includes("not found")) {
            unityRes = { data: stdout.trim() };
            break;
          }
        } catch (curlErr) {
          console.error("curl fallback error:", curlErr.message);
        }
      }
    }

    if (!unityRes) {
      console.error("Unity Reporting API Error:", lastApiErr?.response?.data || lastApiErr?.message);
      return res.status(200).json({
        status: false,
        isConfigured: true,
        message:
          lastApiErr?.response?.data?.message ||
          (lastApiErr?.response?.status === 404
            ? "Invalid Unity Organization ID or API Key. Please verify Organization core ID and Monetization Stats API Key."
            : lastApiErr?.message) ||
          "Failed to fetch analytics from Unity API.",
      });
    }

    let rows = [];
    if (typeof unityRes.data === "string") {
      const lines = unityRes.data.trim().split("\n");
      if (lines.length > 1) {
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
        const dateIdx = headers.findIndex((h) => h.includes("date") || h.includes("timestamp"));
        const reqIdx = headers.findIndex((h) => h.includes("request"));
        const impIdx = headers.findIndex((h) => h.includes("impression"));
        const revIdx = headers.findIndex((h) => h.includes("revenue"));
        const ecpmIdx = headers.findIndex((h) => h.includes("ecpm"));

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map((c) => c.trim().replace(/"/g, ""));
          if (cols.length >= 2) {
            rows.push({
              date: dateIdx >= 0 ? cols[dateIdx] : cols[0],
              requests: reqIdx >= 0 ? cols[reqIdx] : 0,
              impressions: impIdx >= 0 ? cols[impIdx] : 0,
              revenue: revIdx >= 0 ? cols[revIdx] : 0,
              ecpm: ecpmIdx >= 0 ? cols[ecpmIdx] : 0,
            });
          }
        }
      }
    } else if (Array.isArray(unityRes.data)) {
      rows = unityRes.data;
    } else if (unityRes.data && Array.isArray(unityRes.data.data)) {
      rows = unityRes.data.data;
    }

      let totalRevenue = 0;
      let totalImpressions = 0;
      let totalRequests = 0;
      let totalEcpmSum = 0;
      let count = 0;

      const dailyList = rows.map((row) => {
        const revenue = parseFloat(row.revenue || 0);
        const impressions = parseInt(row.impressions || 0);
        const requests = parseInt(row.requests || 0);
        const ecpm = parseFloat(row.ecpm || 0);

        totalRevenue += revenue;
        totalImpressions += impressions;
        totalRequests += requests;
        totalEcpmSum += ecpm;
        count++;

        return {
          date: row.timestamp || row.date || row.day || row.time,
          revenue: parseFloat(revenue.toFixed(2)),
          impressions,
          requests,
          ecpm: parseFloat(ecpm.toFixed(2)),
          fillRate: requests > 0 ? parseFloat(((impressions / requests) * 100).toFixed(1)) : 0,
        };
      });

      const avgEcpm = count > 0 ? parseFloat((totalEcpmSum / count).toFixed(2)) : 0;
      const fillRate = totalRequests > 0 ? parseFloat(((totalImpressions / totalRequests) * 100).toFixed(1)) : 0;

      return res.status(200).json({
        status: true,
        isConfigured: true,
        summary: {
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          totalImpressions,
          totalRequests,
          avgEcpm,
          fillRate,
        },
        dailyList,
      });
  } catch (error) {
    console.error("Get Unity Analytics error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Fetch CPX Research Performance & Survey Analytics
exports.getCpxAnalytics = async (req, res) => {
  try {
    const daysRaw = parseInt(req.query.days);
    const days = isNaN(daysRaw) ? 7 : Math.max(0, Math.min(90, daysRaw));
    const endDate = new Date();
    const startDate = new Date();

    if (days === 0) {
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate.setDate(endDate.getDate() - days);
    }

    const cpxProvider = await SurveyProvider.findOne({ name: "cpx" }).lean();
    const appId = cpxProvider?.appId?.trim() || "";
    const secretKey = cpxProvider?.secretKey?.trim() || "";

    let liveReportFetched = false;
    let dailyList = [];
    let summary = {
      totalRevenue: 0,
      totalClicks: 0,
      totalCompletes: 0,
      totalScreenouts: 0,
      conversionRate: 0,
    };

    // Try CPX Publisher Reporting API if App ID & Secret Key exist
    if (appId && secretKey) {
      try {
        const startStr = startDate.toISOString().split("T")[0];
        const endStr = endDate.toISOString().split("T")[0];
        const cpxUrl = `https://publisher.cpx-research.com/api/v1/statistics?app_id=${appId}&secure_hash=${secretKey}&start_date=${startStr}&end_date=${endStr}`;
        const cpxRes = await axios.get(cpxUrl, { timeout: 10000 });
        if (cpxRes?.data?.status === "success" && Array.isArray(cpxRes.data.data)) {
          liveReportFetched = true;
          dailyList = cpxRes.data.data.map((row) => {
            const clicks = Number(row.clicks || 0);
            const completes = Number(row.completes || 0);
            const screenouts = Number(row.screenouts || 0);
            const revenueUsd = parseFloat(row.revenue_usd || row.revenue || 0);
            summary.totalClicks += clicks;
            summary.totalCompletes += completes;
            summary.totalScreenouts += screenouts;
            summary.totalRevenue += revenueUsd;
            return {
              date: row.date || row.day,
              clicks,
              completes,
              screenouts,
              revenueUsd: parseFloat(revenueUsd.toFixed(2)),
              conversionRate: clicks > 0 ? parseFloat(((completes / clicks) * 100).toFixed(1)) : 0,
            };
          });
        }
      } catch (cpxErr) {
        console.warn("CPX Publisher API fetch failed, falling back to local database stats:", cpxErr.message);
      }
    }

    // Fallback: Aggregate from local SurveyHistory database
    if (!liveReportFetched) {
      const historyItems = await SurveyHistory.find({
        provider: "cpx",
        createdAt: { $gte: startDate, $lte: endDate },
      }).lean();

      const groupedByDate = {};
      historyItems.forEach((item) => {
        const dateStr = new Date(item.createdAt).toISOString().split("T")[0];
        if (!groupedByDate[dateStr]) {
          groupedByDate[dateStr] = { date: dateStr, clicks: 0, completes: 0, screenouts: 0, revenueUsd: 0 };
        }
        groupedByDate[dateStr].clicks += 1;
        if (item.status === "completed") {
          groupedByDate[dateStr].completes += 1;
          summary.totalCompletes += 1;
        } else if (item.status === "screenout" || item.status === "quota_full") {
          groupedByDate[dateStr].screenouts += 1;
          summary.totalScreenouts += 1;
        }
        const payout = Number(item.payoutUsd) || 0;
        groupedByDate[dateStr].revenueUsd += payout;
        summary.totalClicks += 1;
        summary.totalRevenue += payout;
      });

      dailyList = Object.values(groupedByDate).map((row) => ({
        ...row,
        revenueUsd: parseFloat(row.revenueUsd.toFixed(2)),
        conversionRate: row.clicks > 0 ? parseFloat(((row.completes / row.clicks) * 100).toFixed(1)) : 0,
      }));
    }

    summary.totalRevenue = parseFloat(summary.totalRevenue.toFixed(2));
    summary.conversionRate = summary.totalClicks > 0 ? parseFloat(((summary.totalCompletes / summary.totalClicks) * 100).toFixed(1)) : 0;

    return res.status(200).json({
      status: true,
      isConfigured: !!(appId && secretKey),
      summary,
      dailyList,
    });
  } catch (error) {
    console.error("Get CPX Analytics error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
