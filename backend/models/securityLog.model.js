const mongoose = require("mongoose");

const securityLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "INTRUSION_ATTEMPT",
        "INVALID_KEY",
        "BRUTE_FORCE",
        "MALICIOUS_PROBE",
        "RATE_LIMIT_EXCEEDED",
        "ADMIN_AUTH_FAILED",
      ],
      index: true,
    },
    severity: {
      type: String,
      required: true,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
      index: true,
    },
    ip: { type: String, required: true, index: true },
    endpoint: { type: String, required: true },
    method: { type: String, default: "GET" },
    message: { type: String, required: true },
    userAgent: { type: String, default: "" },
    payload: { type: mongoose.Schema.Types.Mixed, default: null },
    blocked: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

securityLogSchema.index({ createdAt: -1 });
securityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 }); // 60-day auto cleanup
securityLogSchema.index({ ip: 1, type: 1 });

module.exports =

  mongoose.models.SecurityLog || mongoose.model("SecurityLog", securityLogSchema);
