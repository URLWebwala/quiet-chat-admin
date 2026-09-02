const mongoose = require("mongoose");

const offerWallSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    image: { type: String, required: true, trim: true },
    buttonText: { type: String, default: "START EARNING TODAY!", trim: true },
    actionUrl: { type: String, default: "", trim: true },
    actionType: {
      type: String,
      enum: ["link", "in_app", "survey", "custom_task", "ad_watch"],
      default: "link",
    },
    durationDays: { type: Number, default: 7 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
    impressionCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
    priority: { type: Number, default: 1 },
  },
  { timestamps: true }
);

offerWallSchema.index({ isActive: 1, isDelete: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model("OfferWall", offerWallSchema);
