// Fallback for force-update fields (when DB has no value / old doc)
const FORCE_UPDATE_DEFAULTS = {
  // 0 = no force update until admin sets real values from panel
  androidMinVersionCode: 0,
  androidLatestVersionCode: 0,
  androidUpdateUrl: "https://play.google.com/store/apps/details?id=com.quietchat.video.live",
  iosMinVersionCode: 0,
  iosLatestVersionCode: 0,
  iosUpdateUrl: "",
};

//get setting
exports.retrieveAppSettings = async (req, res) => {
  try {
    const setting = settingJSON ? settingJSON : null;
    if (!setting) {
      return res.status(200).json({ status: false, message: "Setting does not found." });
    }

    const data = typeof setting.toObject === "function" ? setting.toObject() : { ...setting };
    data.androidMinVersionCode = data.androidMinVersionCode ?? FORCE_UPDATE_DEFAULTS.androidMinVersionCode;
    data.androidLatestVersionCode = data.androidLatestVersionCode ?? FORCE_UPDATE_DEFAULTS.androidLatestVersionCode;
    data.androidUpdateUrl = data.androidUpdateUrl ?? FORCE_UPDATE_DEFAULTS.androidUpdateUrl;
    data.iosMinVersionCode = data.iosMinVersionCode ?? FORCE_UPDATE_DEFAULTS.iosMinVersionCode;
    data.iosLatestVersionCode = data.iosLatestVersionCode ?? FORCE_UPDATE_DEFAULTS.iosLatestVersionCode;
    data.iosUpdateUrl = data.iosUpdateUrl ?? FORCE_UPDATE_DEFAULTS.iosUpdateUrl;

    return res.status(200).json({ status: true, message: "Success", data });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get setting
exports.getSystemConfiguration = async (req, res) => {
  try {
    const setting = settingJSON ? settingJSON : null;
    if (!setting) {
      return res.status(200).json({ status: false, message: "Setting does not found." });
    }

    const filteredData = {
      privacyPolicyLink: setting.privacyPolicyLink,
      termsOfUsePolicyLink: setting.termsOfUsePolicyLink,
    };

    return res.status(200).json({ status: true, message: "Success", data: filteredData });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
