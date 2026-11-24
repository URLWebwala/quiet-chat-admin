const mongoose = require("mongoose");

const hostUserSchema = new mongoose.Schema(
  {
    hostSlug: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    hostName: {
      type: String,
      default: "",
      trim: true,
    },
    name: {
      type: String,
      default: "User",
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "male",
    },
    avatar: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    isBlock: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Unique compound index: email is unique PER host persona
// e.g., rahul@gmail.com can exist independently for 'shanaya-prototype' and 'aisha-sweet'
hostUserSchema.index({ hostSlug: 1, email: 1 }, { unique: true });
hostUserSchema.index({ hostSlug: 1, createdAt: -1 });

module.exports = mongoose.model("HostUser", hostUserSchema);
