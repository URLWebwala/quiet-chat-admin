const mongoose = require("mongoose");

const dailyChallengeProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    dailyChallengeId: { type: mongoose.Schema.Types.ObjectId, ref: "DailyChallenge", required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    completedTaskIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "CustomTask" }],
    isBonusClaimed: { type: Boolean, default: false },
    claimedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

dailyChallengeProgressSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DailyChallengeProgress", dailyChallengeProgressSchema);
