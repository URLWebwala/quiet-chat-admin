const mongoose = require("mongoose");

const notificationLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    category: { type: String, enum: ["reward", "withdrawal", "system", "broadcast"], default: "reward" },
    status: { type: String, enum: ["sent", "failed"], default: "sent" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

notificationLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.models.NotificationLog || mongoose.model("NotificationLog", notificationLogSchema);
