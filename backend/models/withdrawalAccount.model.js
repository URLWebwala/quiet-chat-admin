const mongoose = require("mongoose");

const withdrawalAccountSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["bank", "upi", "paypal", "paytm"], required: true },
    accountHolderName: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    ifscCode: { type: String, default: "" },
    bankName: { type: String, default: "" },
    upiId: { type: String, default: "" },
    email: { type: String, default: "" },
    isDefault: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

withdrawalAccountSchema.index({ user: 1 });

module.exports = mongoose.models.WithdrawalAccount || mongoose.model("WithdrawalAccount", withdrawalAccountSchema);
