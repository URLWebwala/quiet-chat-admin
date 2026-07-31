const mongoose = require("mongoose");

const rewardActivityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true }, // e.g., "WALL_OPEN", "SURVEY_CLICK", "WITHDRAWAL_SUBMIT"
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

rewardActivityLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.models.RewardActivityLog || mongoose.model("RewardActivityLog", rewardActivityLogSchema);
