const mongoose = require("mongoose");

const rewardLimitSchema = new mongoose.Schema(
  {
    maxDailyCoinsPerUser: { type: Number, default: 10000 },
    maxSurveysPerDay: { type: Number, default: 20 },
    ipVelocityCheckEnabled: { type: Boolean, default: true },
    maxAccountsPerIp: { type: Number, default: 3 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.models.RewardLimit || mongoose.model("RewardLimit", rewardLimitSchema);
