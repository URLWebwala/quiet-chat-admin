const mongoose = require("mongoose");

const blockedIpSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true, unique: true, index: true },
    reason: { type: String, default: "Security policy violation" },
    blockedBy: { type: String, default: "System Admin" },
    threatCount: { type: Number, default: 1 },
    expiresAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

blockedIpSchema.index({ createdAt: -1 });

module.exports =
  mongoose.models.BlockedIp || mongoose.model("BlockedIp", blockedIpSchema);
