const mongoose = require("mongoose");

const hostPostSchema = new mongoose.Schema(
  {
    hostSlug: { type: String, required: true, lowercase: true, trim: true },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    mediaUrl: { type: String, required: true },
    type: { type: String, enum: ["photo", "video"], default: "photo" },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

hostPostSchema.index({ hostSlug: 1, isActive: 1, createdAt: -1 });

module.exports = mongoose.model("HostPost", hostPostSchema);
