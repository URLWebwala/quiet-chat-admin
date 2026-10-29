const mongoose = require("mongoose");

const apiErrorLogSchema = new mongoose.Schema(
  {
    method: { type: String, required: true, uppercase: true }, // GET, POST, PUT, DELETE, PATCH
    endpoint: { type: String, required: true, index: true },
    status: { type: Number, required: true, index: true },
    message: { type: String, required: true },
    stackTrace: { type: String, default: "" },
    responseTime: { type: Number, default: 0 }, // ms
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    userId: { type: String, default: "" },
    tenant: { type: String, default: "quietchat" },
    requestBody: { type: mongoose.Schema.Types.Mixed, default: null },
    requestQuery: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

apiErrorLogSchema.index({ createdAt: -1 });
apiErrorLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30-day auto cleanup
apiErrorLogSchema.index({ status: 1 });
apiErrorLogSchema.index({ method: 1 });
apiErrorLogSchema.index({ endpoint: 1 });


module.exports =
  mongoose.models.ApiErrorLog || mongoose.model("ApiErrorLog", apiErrorLogSchema);
