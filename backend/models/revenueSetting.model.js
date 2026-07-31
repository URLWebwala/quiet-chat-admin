const mongoose = require("mongoose");

const revenueSettingSchema = new mongoose.Schema(
  {
    coinToCurrencyRate: { type: Number, default: 100 }, // e.g. 100 coins = $1.00
    currencySymbol: { type: String, default: "$" },
    currencyCode: { type: String, default: "USD" },
    userSharePercentage: { type: Number, default: 70 }, // 70% to user
    adminSharePercentage: { type: Number, default: 30 }, // 30% commission
    minWithdrawalCoins: { type: Number, default: 500 }, // Min coins required to cash out
    maxDailyWithdrawalCoins: { type: Number, default: 50000 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.models.RevenueSetting || mongoose.model("RevenueSetting", revenueSettingSchema);
