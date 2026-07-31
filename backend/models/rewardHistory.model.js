const mongoose = require("mongoose");

const rewardHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    source: { type: String, required: true }, // "bitlabs", "cpx", "daily_bonus", "admin_grant"
    coins: { type: Number, required: true },
    type: { type: Number, default: 1 }, // 1: Credit, 2: Debit
    date: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

rewardHistorySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.models.RewardHistory || mongoose.model("RewardHistory", rewardHistorySchema);
