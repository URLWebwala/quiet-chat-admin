const mongoose = require("mongoose");

const adsWatchRewardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    target: { type: String, enum: ["user", "host"], required: true },
    coinValue: { type: Number, required: true, min: 1 },
    requiredPoints: { type: Number, required: true, min: 1 },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

adsWatchRewardSchema.index({ target: 1, isActive: 1 });
adsWatchRewardSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AdsWatchReward", adsWatchRewardSchema);
