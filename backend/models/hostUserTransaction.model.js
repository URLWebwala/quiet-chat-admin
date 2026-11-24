const mongoose = require("mongoose");

const hostUserTransactionSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      enum: [
        "welcome_bonus",
        "chat_message",
        "exclusive_photo",
        "exclusive_video",
        "admin_adjustment",
      ],
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    mediaId: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

hostUserTransactionSchema.index({ hostUserId: 1, createdAt: -1 });
hostUserTransactionSchema.index({ hostSlug: 1, createdAt: -1 });

module.exports = mongoose.model("HostUserTransaction", hostUserTransactionSchema);
