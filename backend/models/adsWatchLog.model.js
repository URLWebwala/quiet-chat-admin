const mongoose = require("mongoose");

const adsWatchLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: "Host", default: null },
    personType: { type: String, enum: ["user", "host"], required: true },
    action: { type: String, enum: ["watch", "claim"], required: true },
    coins: { type: Number, default: 0 },
    adType: { type: String, default: "rewarded" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

adsWatchLogSchema.index({ personType: 1, createdAt: -1 });
adsWatchLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("AdsWatchLog", adsWatchLogSchema);
