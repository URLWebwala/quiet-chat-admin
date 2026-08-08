const mongoose = require("mongoose");

const cpxDailyAnalyticsSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true }, // Format: YYYY-MM-DD
    clicks: { type: Number, default: 0 },
    completes: { type: Number, default: 0 },
    screenouts: { type: Number, default: 0 },
    revenueUsd: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    syncedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.models.CpxDailyAnalytics || mongoose.model("CpxDailyAnalytics", cpxDailyAnalyticsSchema);
