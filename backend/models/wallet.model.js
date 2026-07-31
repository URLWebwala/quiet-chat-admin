const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    coinBalance: { type: Number, default: 0, min: 0 },
    lockedBalance: { type: Number, default: 0, min: 0 },
    totalEarned: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },
    isFrozen: { type: Boolean, default: false },
    freezeReason: { type: String, default: "" },
    status: { type: Number, default: 1 }, // 1: Active, 0: Suspended
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

walletSchema.index({ isFrozen: 1 });

module.exports = mongoose.models.Wallet || mongoose.model("Wallet", walletSchema);
