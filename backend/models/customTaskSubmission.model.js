const mongoose = require("mongoose");

const customTaskSubmissionSchema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomTask", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    personType: { type: String, enum: ["user", "host"], default: "user" },
    proofImage: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    rewardPoints: { type: Number, default: 0 },
    rejectionReason: { type: String, default: "" },
    submittedAt: { type: Date, default: Date.now },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

customTaskSubmissionSchema.index({ taskId: 1, userId: 1 });
customTaskSubmissionSchema.index({ status: 1 });

module.exports = mongoose.model("CustomTaskSubmission", customTaskSubmissionSchema);
