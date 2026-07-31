const mongoose = require("mongoose");

const rewardRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true }, // "DAILY_STREAK", "FIRST_SURVEY_BONUS", "SURVEY_MULTIPLIER"
    description: { type: String, default: "" },
    multiplier: { type: Number, default: 1.0 },
    bonusCoins: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    validFrom: { type: Date, default: null },
    validTo: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.models.RewardRule || mongoose.model("RewardRule", rewardRuleSchema);
