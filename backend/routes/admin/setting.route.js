//express
const express = require("express");
const route = express.Router();

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const SettingController = require("../../controllers/admin/setting.controller");

//update setting
route.patch("/updateSetting", checkAccessWithSecretKey(), SettingController.updateSetting);

//update setting switch
route.patch("/updateSettingToggle", checkAccessWithSecretKey(), SettingController.updateSettingToggle);

//get setting
route.get("/fetchSettings", checkAccessWithSecretKey(), SettingController.fetchSettings);

// Fast2SMS test (body: { phone })
route.post("/testFast2Sms", checkAccessWithSecretKey(), SettingController.testFast2Sms);

// Fast2SMS WhatsApp WABA (query: settingId, type=number|template)
route.get("/fast2smsWhatsappDetails", checkAccessWithSecretKey(), SettingController.fast2smsWhatsappDetails);

// Fast2SMS WhatsApp template test (body: { phone })
route.post("/testFast2smsWhatsapp", checkAccessWithSecretKey(), SettingController.testFast2smsWhatsapp);

// Unity Ads Analytics
route.get("/unityAnalytics", checkAccessWithSecretKey(), SettingController.getUnityAnalytics);

// CPX Research Analytics
route.get("/cpxAnalytics", checkAccessWithSecretKey(), SettingController.getCpxAnalytics);

// Ads Watch Activity Logs
const AdsWatchController = require("../../controllers/admin/adsWatch.controller");
route.get("/adsWatchLogs", checkAccessWithSecretKey(), AdsWatchController.fetchRecentLogs);

module.exports = route;
