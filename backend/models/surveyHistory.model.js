const mongoose = require("mongoose");

const surveyHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    provider: { type: String, required: true }, // "bitlabs", "cpx"
    surveyId: { type: String, default: "" },
    status: { type: String, enum: ["completed", "screenout", "quota_full", "rejected"], default: "completed" },
    coins: { type: Number, default: 0 },
    payoutUsd: { type: Number, default: 0 },
    transactionId: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

surveyHistorySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.models.SurveyHistory || mongoose.model("SurveyHistory", surveyHistorySchema);
