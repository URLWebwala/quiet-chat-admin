const mongoose = require("mongoose");

const surveyProviderSettingSchema = new mongoose.Schema(
  {
    provider: { type: mongoose.Schema.Types.ObjectId, ref: "SurveyProvider", required: true, unique: true },
    allowScreenoutReward: { type: Boolean, default: false },
    screenoutRewardCoins: { type: Number, default: 0 },
    ipCheckEnabled: { type: Boolean, default: true },
    allowedCountries: [{ type: String }],
    customParams: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.models.SurveyProviderSetting || mongoose.model("SurveyProviderSetting", surveyProviderSettingSchema);
