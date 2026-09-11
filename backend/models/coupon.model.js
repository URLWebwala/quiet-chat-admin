const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    coin: {
      type: Number,
      required: true,
      min: 1,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    isPerUserLimit: {
      type: Boolean,
      default: true,
    },
    perUserLimitCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    maxUsers: {
      type: Number,
      default: 0, // 0 means unlimited total redemptions
      min: 0,
    },
    totalRedeemed: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    redeemedUsers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        redeemedAt: {
          type: Date,
          default: Date.now,
        },
        coin: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

couponSchema.index({ isActive: 1 });
couponSchema.index({ expiryDate: 1 });
couponSchema.index({ "redeemedUsers.userId": 1 });

module.exports = mongoose.model("Coupon", couponSchema);
