const mongoose = require("mongoose");

const { Schema } = mongoose;

const swipeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    hostId: { type: Schema.Types.ObjectId, ref: "Host", required: true, index: true },
    /** like = heart, skip = next */
    action: { type: String, enum: ["like", "skip"], required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

swipeSchema.index({ userId: 1, hostId: 1 }, { unique: true });

module.exports = mongoose.model("Swipe", swipeSchema);

