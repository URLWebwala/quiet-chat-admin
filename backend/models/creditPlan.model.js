const mongoose = require("mongoose");

const creditPlanSchema = new mongoose.Schema(
  {
    credits: { type: Number, default: 0, required: true },
    bonusCredits: { type: Number, default: 0 },
    price: { type: Number, default: 0, required: true },
    actualPrice: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    productId: { type: String, default: "", trim: true },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

creditPlanSchema.index({ credits: 1 });
creditPlanSchema.index({ price: 1 });
creditPlanSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model("CreditPlan", creditPlanSchema);
