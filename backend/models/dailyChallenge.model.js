const mongoose = require("mongoose");

const dailyChallengeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    date: { type: String, required: true, trim: true }, // Format: YYYY-MM-DD
    startTime: { type: Date },
    endTime: { type: Date },
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "CustomTask" }],
    bonusCoins: { type: Number, default: 50, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

dailyChallengeSchema.index({ date: 1 });

module.exports = mongoose.model("DailyChallenge", dailyChallengeSchema);
