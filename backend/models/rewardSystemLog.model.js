const mongoose = require("mongoose");

const rewardSystemLogSchema = new mongoose.Schema(
  {
    level: { type: String, enum: ["info", "warn", "error"], default: "info" },
    source: { type: String, required: true }, // e.g. "BitLabsWebhook", "CPXWebhook", "BulkPayoutProcessor"
    message: { type: String, required: true },
    stackTrace: { type: String, default: "" },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

rewardSystemLogSchema.index({ createdAt: -1 });
rewardSystemLogSchema.index({ level: 1 });

module.exports = mongoose.models.RewardSystemLog || mongoose.model("RewardSystemLog", rewardSystemLogSchema);
