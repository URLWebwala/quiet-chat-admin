const mongoose = require("mongoose");

const { Schema } = mongoose;

const userMatchSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    hostId: { type: Schema.Types.ObjectId, ref: "Host", required: true, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userMatchSchema.index({ userId: 1, hostId: 1 }, { unique: true });

module.exports = mongoose.model("UserMatch", userMatchSchema);

