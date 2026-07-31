const mongoose = require("mongoose");

const payoutTransactionSchema = new mongoose.Schema(
  {
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "PayoutBatch", required: true },
    withdrawalRequest: { type: mongoose.Schema.Types.ObjectId, ref: "RewardWithdrawalRequest", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    accountDetails: { type: mongoose.Schema.Types.Mixed, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
    utrNumber: { type: String, default: "" },
    failureReason: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

payoutTransactionSchema.index({ batch: 1 });
payoutTransactionSchema.index({ withdrawalRequest: 1 });

module.exports = mongoose.models.PayoutTransaction || mongoose.model("PayoutTransaction", payoutTransactionSchema);
