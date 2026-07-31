const mongoose = require("mongoose");

const rewardTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: "SurveyProvider" },
    providerName: { type: String, required: true }, // "bitlabs", "cpx"
    surveyId: { type: String, default: "" },
    transactionId: { type: String, required: true, unique: true },
    coinsEarned: { type: Number, required: true },
    usdAmount: { type: Number, default: 0 },
    payoutAmount: { type: Number, default: 0 },
    status: { type: Number, default: 2 }, // 2: Success, 1: Pending, 3: Rejected
    completedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

rewardTransactionSchema.index({ user: 1, createdAt: -1 });
rewardTransactionSchema.index({ providerName: 1 });

module.exports = mongoose.models.RewardTransaction || mongoose.model("RewardTransaction", rewardTransactionSchema);
