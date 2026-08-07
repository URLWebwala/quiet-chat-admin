const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    privacyPolicyLink: { type: String, default: "PRIVACY POLICY LINK" },
    termsOfUsePolicyLink: { type: String, default: "TERMS OF USE POLICY LINK" },

    googlePlayEnabled: { type: Boolean, default: false },
    googlePayIosEnabled: { type: Boolean, default: false },

    stripeEnabled: { type: Boolean, default: false },
    stripeIosEnabled: { type: Boolean, default: false },
    stripePublishableKey: { type: String, default: "STRIPE PUBLISHABLE KEY" },
    stripeSecretKey: { type: String, default: "STRIPE SECRET KEY" },

    razorpayEnabled: { type: Boolean, default: false },
    razorpayIosEnabled: { type: Boolean, default: false },
    razorpayId: { type: String, default: "RAZOR PAY ID" },
    razorpaySecretKey: { type: String, default: "RAZOR SECRET KEY" },
    /** RazorpayX: business bank account number registered in dashboard (source of payouts) */
    razorpayXFromAccountNumber: { type: String, default: "" },
    /** Optional; falls back to razorpaySecretKey for payout webhooks if empty */
    razorpayXPayoutWebhookSecret: { type: String, default: "" },

    flutterwaveEnabled: { type: Boolean, default: false },
    flutterwaveIosEnabled: { type: Boolean, default: false },
    flutterwaveId: { type: String, default: "FLUTTER WAVE ID" },

    paystackAndroidEnabled: { type: Boolean, default: false },
    paystackIosEnabled: { type: Boolean, default: false },
    paystackPublicKey: { type: String, default: "PAYSTACK PUBLIC KEY" },
    paystackSecretKey: { type: String, default: "PAYSTACK SECRET KEY" },

    cashfreeAndroidEnabled: { type: Boolean, default: false },
    cashfreeIosEnabled: { type: Boolean, default: false },
    /** Legacy single-pair fields (kept for backward compatibility/fallback). */
    cashfreeClientId: { type: String, default: "CASHFREE CLIENT ID" },
    cashfreeClientSecret: { type: String, default: "CASHFREE CLIENT SECRET" },
    /** Preferred: separate credentials by environment. */
    cashfreeTestClientId: { type: String, default: "" },
    cashfreeTestClientSecret: { type: String, default: "" },
    cashfreeProdClientId: { type: String, default: "" },
    cashfreeProdClientSecret: { type: String, default: "" },
    /** Current active mode: "sandbox" or "production" (saved from Admin Panel) */
    cashfreeSelectedEnv: { type: String, default: "sandbox" },

    paypalAndroidEnabled: { type: Boolean, default: false },
    paypalIosEnabled: { type: Boolean, default: false },
    paypalClientId: { type: String, default: "PAYPAL CLIENT ID" },
    paypalSecretKey: { type: String, default: "PAYPAL SECRET KEY" },

    agoraAppId: { type: String, default: "AGORA APP ID" },
    agoraAppCertificate: { type: String, default: "AGORA APP CERTIFICATE" },

    loginBonus: { type: Number, default: 0 },
    isDemoData: { type: Boolean, default: false },

    isAppEnabled: { type: Boolean, default: true },
    isAutoRefreshEnabled: { type: Boolean, default: false },

    androidMinVersionCode: { type: Number, default: 16 },
    androidLatestVersionCode: { type: Number, default: 16 },
    androidUpdateUrl: { type: String, default: "https://play.google.com/store/apps/details?id=com.quietchat.video.live" },
    iosMinVersionCode: { type: Number, default: 0 },
    iosLatestVersionCode: { type: Number, default: 0 },
    iosUpdateUrl: { type: String, default: "" },

    currency: {
      name: { type: String, default: "" },
      symbol: { type: String, default: "" },
      countryCode: { type: String, default: "" },
      currencyCode: { type: String, default: "" },
      isDefault: { type: Boolean, default: false },
    }, //default currency

    privateKey: { type: Object, default: {} }, //firebase.json handle notification

    generalRandomCallRate: { type: Number, default: 0 },
    femaleRandomCallRate: { type: Number, default: 0 },
    maleRandomCallRate: { type: Number, default: 0 },
    videoPrivateCallRate: { type: Number, default: 0 },
    audioPrivateCallRate: { type: Number, default: 0 },

    maxFreeChatMessages: { type: Number, default: 0 }, //maximum free messages allowed
    chatInteractionRate: { type: Number, default: 0 },

    messageInitiatedAt: { type: Number, default: 0 }, //in min
    callInitiatedAt: { type: Number, default: 0 }, //in min

    adminCommissionRate: { type: Number, default: 0 }, //in %
    minCoinsToConvert: { type: Number, default: 0 }, //min coin requried for convert coin to default currency i.e., 1000 coin = 1 $

    minCoinsForHostPayout: { type: Number, default: 0 }, //for host
    minCoinsForAgencyPayout: { type: Number, default: 0 }, //for agency

    /** Fast2SMS — phone OTP when Firebase SMS/APNs is unavailable. Docs: https://docs.fast2sms.com/reference/authorization */
    fast2smsEnabled: { type: Boolean, default: false },
    fast2smsApiKey: { type: String, default: "" },
    fast2smsSenderId: { type: String, default: "" },
    /** "otp" (Fast2SMS OTP route) or "dlt" (DLT template; requires fast2smsDltMessage with {#var#}) */
    fast2smsRoute: { type: String, default: "otp" },
    /** DLT-approved template, e.g. "Your OTP is {#var#}." — only used when fast2smsRoute is "dlt" */
    fast2smsDltMessage: { type: String, default: "" },
    /** 0 = normal SMS, 1 = flash */
    fast2smsFlash: { type: Number, default: 0 },

    /**
     * Fast2SMS WhatsApp (WABA) template OTP — sent in addition to SMS when enabled.
     * message_id & phone_number_id: https://docs.fast2sms.com/reference/get-waba-template-details
     * send: https://docs.fast2sms.com/reference/sendwhatsappmessage
     * Optional separate Authorization key for WhatsApp-only APIs; if empty, fast2smsApiKey is used.
     */
    fast2smsWhatsappApiKey: { type: String, default: "" },
    fast2smsWhatsappOtpEnabled: { type: Boolean, default: false },
    /** WABA Phone Number ID from Fast2SMS (same for all templates on that sender) */
    fast2smsWhatsappPhoneNumberId: { type: String, default: "" },
    /** Fast2SMS template message_id (e.g. authentication template `otp`) */
    fast2smsWhatsappMessageId: { type: Number, default: 0 },
    /**
     * Body variable count for variables_values (pipe-separated). 0 = omit variables_values.
     * 1 = OTP only; 2 = OTP|minutes (minutes = server OTP TTL, rounded up).
     */
    fast2smsWhatsappVariableCount: { type: Number, default: 1 },

    /** Ads Watch — earn pending points per ad, claim converts points to wallet coins */
    adsWatchEnabled: { type: Boolean, default: false },
    adsWatchUserCoinPerAd: { type: Number, default: 10 },
    adsWatchHostCoinPerAd: { type: Number, default: 10 },
    adsWatchUserDailyLimit: { type: Number, default: 10 },
    adsWatchHostDailyLimit: { type: Number, default: 5 },
    adsWatchMinCoinsToClaim: { type: Number, default: 100 },
    adsWatchPointsPerCoin: { type: Number, default: 1 },
    adsWatchClaimFrequencyHours: { type: Number, default: 24 },
    adsWatchFullWatchBonus: { type: Number, default: 0 },
    adsWatchRewardedAdsEnabled: { type: Boolean, default: true },
    adsWatchInterstitialAdsEnabled: { type: Boolean, default: true },
    adsWatchBannerAdsEnabled: { type: Boolean, default: true },
    adsWatchFraudProtectionEnabled: { type: Boolean, default: true },
    adsWatchMaxAdsPerDevicePerDay: { type: Number, default: 35 },
    adsWatchHostBonusMultiplier: { type: Number, default: 1 },
    adsWatchVipBonusPoints: { type: Number, default: 0 },

    /** AdMob / AdSense — platform ad unit IDs for mobile & web apps */
    adsWatchAndroidAppId: { type: String, default: "" },
    adsWatchAndroidBannerAdUnitId: { type: String, default: "" },
    adsWatchAndroidInterstitialAdUnitId: { type: String, default: "" },
    adsWatchAndroidRewardedAdUnitId: { type: String, default: "" },
    adsWatchAndroidAdsEnabled: { type: Boolean, default: false },

    adsWatchIosAppId: { type: String, default: "" },
    adsWatchIosBannerAdUnitId: { type: String, default: "" },
    adsWatchIosInterstitialAdUnitId: { type: String, default: "" },
    adsWatchIosRewardedAdUnitId: { type: String, default: "" },
    adsWatchIosAdsEnabled: { type: Boolean, default: false },

    adsWatchWebAdsenseClientId: { type: String, default: "" },
    adsWatchWebAdSlotId: { type: String, default: "" },
    adsWatchWebAdsEnabled: { type: Boolean, default: false },

    userMinWithdrawLimit: { type: Number, default: 100 },
    userMaxWithdrawLimit: { type: Number, default: 10000 },
    pointsPerRupee: { type: Number, default: 10 },
    bitlabsEnabled: { type: Boolean, default: false },
    bitlabsPointsPerSurvey: { type: Number, default: 50 },
    cpxEnabled: { type: Boolean, default: false },
    cpxPointsPerSurvey: { type: Number, default: 50 },
    unityAdsEnabled: { type: Boolean, default: true },
    unityPointsPerAd: { type: Number, default: 25 },
    unityGameIdAndroid: { type: String, default: "5749102" },
    unityPlacementIdAndroid: { type: String, default: "Rewarded_Android" },
    unityGameIdIos: { type: String, default: "5749102" },
    unityPlacementIdIos: { type: String, default: "Rewarded_iOS" },

    isAutoCallEnabled: { type: Boolean, default: true },
    isAutoMessageEnabled: { type: Boolean, default: true },

    /** Global toggle — when false, users cannot see any hosts in the app */
    isHostEnabled: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

settingSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Setting", settingSchema);
