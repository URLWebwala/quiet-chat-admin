const mongoose = require("mongoose");

const customTaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    actionUrl: { type: String, default: "", trim: true },
    rewardPoints: { type: Number, default: 50, min: 1 },
    requireProof: { type: Boolean, default: true },
    icon: { type: String, default: "" },
    maxCompletionsPerUser: { type: Number, default: 1, min: 1 },
    totalCompletions: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CustomTask", customTaskSchema);
