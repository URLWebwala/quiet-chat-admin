const mongoose = require("mongoose");
const { BULK_PAYOUT_STATUS } = require("../types/rewardConstant");

const payoutBatchSchema = new mongoose.Schema(
  {
    batchNumber: { type: String, required: true, unique: true },
    filename: { type: String, required: true },
    totalRecords: { type: Number, default: 0 },
    validRecords: { type: Number, default: 0 },
    invalidRecords: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    status: {
      type: Number,
      enum: Object.values(BULK_PAYOUT_STATUS),
      default: BULK_PAYOUT_STATUS.CREATED,
    },
    createdAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    processedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.models.PayoutBatch || mongoose.model("PayoutBatch", payoutBatchSchema);
