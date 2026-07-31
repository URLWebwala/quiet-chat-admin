const mongoose = require("mongoose");
const { REWARD_WALLET_CATEGORY } = require("../types/rewardConstant");

const walletTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    wallet: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", required: true },
    type: { type: String, enum: ["credit", "debit"], required: true },
    category: {
      type: String,
      enum: Object.values(REWARD_WALLET_CATEGORY),
      default: REWARD_WALLET_CATEGORY.SURVEY,
    },
    amount: { type: Number, required: true },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    referenceId: { type: String, default: "" }, // Callback TxID or Withdrawal Request ID
    description: { type: String, default: "" },
    status: { type: Number, default: 1 }, // 1: Completed, 0: Failed, 2: Reversed
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

walletTransactionSchema.index({ user: 1, createdAt: -1 });
walletTransactionSchema.index({ referenceId: 1 }, { sparse: true });
walletTransactionSchema.index({ category: 1 });

module.exports = mongoose.models.WalletTransaction || mongoose.model("WalletTransaction", walletTransactionSchema);
