const mongoose = require("mongoose");

const hostUserChatSchema = new mongoose.Schema(
  {
    hostUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HostUser",
      required: true,
      index: true,
    },
    hostSlug: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    sender: {
      type: String,
      enum: ["user", "host"],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    delayMs: {
      type: Number,
      default: 0,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

hostUserChatSchema.index({ hostUserId: 1, createdAt: 1 });
hostUserChatSchema.index({ hostSlug: 1, createdAt: -1 });

module.exports = mongoose.model("HostUserChat", hostUserChatSchema);
