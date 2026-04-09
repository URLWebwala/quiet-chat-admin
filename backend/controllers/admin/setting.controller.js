const Setting = require("../../models/setting.model");
const { sendOtpViaFast2Sms } = require("../../util/fast2sms");

//scheduleChatJob
const scheduleChatJob = require("../../worker/bullRandomChatJob");

//update setting
exports.updateSetting = async (req, res) => {
  try {
    if (!req.query.settingId) {
      return res.status(200).json({ status: false, message: "SettingId must be required." });
    }

    const setting = await Setting.findById(req.query.settingId);
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

    await setting.save();

    res.status(200).json({
      status: true,
      message: "Setting has been updated.",
      data: setting,
    });

    // Global call/chat rates apply via resolveHostCallRates for hosts with useCustomCallRates !== true (no bulk overwrite).

    global.settingJSON = setting;
    if (shouldRescheduleChatJob) {
      console.log("🔁 Rescheduling chat job...", global?.settingJSON?.messageInitiatedAt);
      await scheduleChatJob();
    }
    updateSettingFile(setting);

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

    const setting = await Setting.findById(req.query.settingId);
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
    } else {
      return res.status(200).json({ status: false, message: "type passed must be valid." });
    }

    await setting.save();

    res.status(200).json({ status: true, message: "Success", data: setting });

    // Keep in-memory settings cache in sync for fetchSettings
    global.settingJSON = setting;

    updateSettingFile(setting);
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

exports.fetchSettings = async (req, res) => {
  try {
    const setting = settingJSON ? settingJSON : null;
    if (!setting) {
      return res.status(200).json({ status: false, message: "Setting does not found." });
    }

    return res.status(200).json({ status: true, message: "Success", data: setting });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
