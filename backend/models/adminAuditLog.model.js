const mongoose = require("mongoose");

const adminAuditLogSchema = new mongoose.Schema(
  {
    adminEmail: { type: String, default: "Admin" },
    adminId: { type: String, default: "" },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetEntity: { type: String, default: "System" },
    targetId: { type: String, default: "" },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: "127.0.0.1" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

adminAuditLogSchema.index({ createdAt: -1 });
adminAuditLogSchema.index({ action: 1 });

module.exports =
  mongoose.models.AdminAuditLog || mongoose.model("AdminAuditLog", adminAuditLogSchema);
