const mongoose = require("mongoose");

const pushNotificationHistorySchema = new mongoose.Schema(
  {
    title: { type: String },
    message: { type: String },
    image: { type: String },
    notificationType: { type: String, enum: ["User", "Host", "Both"] },
    totalSent: { type: Number, default: 0 },
    totalDelivered: { type: Number, default: 0 },
    totalOpened: { type: Number, default: 0 },
    date: { type: String },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("PushNotificationHistory", pushNotificationHistorySchema);
