const mongoose = require("mongoose");

const surveyCallbackSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true }, // "bitlabs", "cpx"
    transactionId: { type: String, required: true },
    userId: { type: String, required: true },
    rawPayload: { type: mongoose.Schema.Types.Mixed, default: {} },
    signature: { type: String, default: "" },
    isValid: { type: Boolean, default: false },
    processed: { type: Boolean, default: false },
    processedAt: { type: Date, default: null },
    errorReason: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

surveyCallbackSchema.index({ provider: 1, transactionId: 1 }, { unique: true });
surveyCallbackSchema.index({ userId: 1 });

module.exports = mongoose.models.SurveyCallback || mongoose.model("SurveyCallback", surveyCallbackSchema);
