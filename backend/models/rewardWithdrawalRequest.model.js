const mongoose = require("mongoose");
const { REWARD_WITHDRAWAL_STATUS } = require("../types/rewardConstant");

const rewardWithdrawalRequestSchema = new mongoose.Schema(
  {
    requestNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    coins: { type: Number, required: true },
    amountCurrency: { type: Number, required: true }, // Equivalent cash amount
    currency: { type: String, default: "USD" },
    payoutType: { type: String, enum: ["bank", "upi", "paypal", "paytm"], default: "bank" },
    accountDetails: { type: mongoose.Schema.Types.Mixed, required: true },
    status: {
      type: Number,
      enum: Object.values(REWARD_WITHDRAWAL_STATUS),
      default: REWARD_WITHDRAWAL_STATUS.PENDING,
    },
    adminComment: { type: String, default: "" },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "PayoutBatch", default: null },
    processedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

rewardWithdrawalRequestSchema.index({ user: 1, createdAt: -1 });
rewardWithdrawalRequestSchema.index({ status: 1 });
rewardWithdrawalRequestSchema.index({ batchId: 1 });

module.exports = mongoose.models.RewardWithdrawalRequest || mongoose.model("RewardWithdrawalRequest", rewardWithdrawalRequestSchema);
