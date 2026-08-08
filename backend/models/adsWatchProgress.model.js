const mongoose = require("mongoose");

const adsWatchProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: "Host", default: null },
    personType: { type: String, enum: ["user", "host"], required: true },
    pendingCoins: { type: Number, default: 0 },
    watchesToday: { type: Number, default: 0 },
    unityWatchesToday: { type: Number, default: 0 },
    bitlabsCompletedToday: { type: Number, default: 0 },
    cpxCompletedToday: { type: Number, default: 0 },
    lastWatchDate: { type: String, default: "" },
    totalWatches: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    totalClaimed: { type: Number, default: 0 },
    lastClaimAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

adsWatchProgressSchema.index({ userId: 1, personType: 1 }, { unique: true });
adsWatchProgressSchema.index({ personType: 1, pendingCoins: -1 });
adsWatchProgressSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AdsWatchProgress", adsWatchProgressSchema);
