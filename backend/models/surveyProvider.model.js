const mongoose = require("mongoose");

const surveyProviderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // "bitlabs", "cpx"
    title: { type: String, required: true }, // "BitLabs Surveys", "CPX Research"
    appId: { type: String, default: "" },
    secretKey: { type: String, default: "" },
    serverKey: { type: String, default: "" },
    icon: { type: String, default: "" },
    postbackUrl: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    conversionRate: { type: Number, default: 100 }, // Coins per 1 USD/currency unit
    dailyCap: { type: Number, default: 0 }, // 0 = unlimited
    monthlyCap: { type: Number, default: 0 },
    priority: { type: Number, default: 1 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.models.SurveyProvider || mongoose.model("SurveyProvider", surveyProviderSchema);
