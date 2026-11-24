const CreditPlan = require("../../models/creditPlan.model");

// Create a new credit plan
exports.createCreditPlan = async (req, res) => {
  try {
    const { credits, bonusCredits, price, actualPrice, discount, productId, isFeatured } = req.body;

    if (!credits || price === undefined || price === null) {
      return res.status(200).json({ status: false, message: "Credits and price are required." });
    }

    const numPrice = Number(price);
    const numActualPrice = actualPrice !== undefined && Number(actualPrice) > 0 ? Number(actualPrice) : numPrice;
    let numDiscount = discount !== undefined ? Number(discount) : 0;
    if (numDiscount === 0 && numActualPrice > numPrice) {
      numDiscount = Math.round(((numActualPrice - numPrice) / numActualPrice) * 100);
    }

    const plan = new CreditPlan({
      credits: Number(credits),
      bonusCredits: Number(bonusCredits) || 0,
      price: numPrice,
      actualPrice: numActualPrice,
      discount: numDiscount,
      productId: (productId || "").trim().toLowerCase(),
      isFeatured: Boolean(isFeatured),
      isActive: true,
    });
    await plan.save();

    return res.status(200).json({ status: true, message: "Credit plan created successfully.", data: plan });
  } catch (error) {
    console.error("Create credit plan error:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Update an existing credit plan
exports.modifyCreditPlan = async (req, res) => {
  try {
    const creditPlanId = req.body.creditPlanId || req.body._id;
    if (!creditPlanId) {
      return res.status(200).json({ status: false, message: "creditPlanId is required." });
    }

    const plan = await CreditPlan.findById(creditPlanId);
    if (!plan) {
      return res.status(200).json({ status: false, message: "Credit plan not found." });
    }

    if (req.body.credits !== undefined) plan.credits = Number(req.body.credits);
    if (req.body.bonusCredits !== undefined) plan.bonusCredits = Number(req.body.bonusCredits);
    if (req.body.price !== undefined) plan.price = Number(req.body.price);
    if (req.body.actualPrice !== undefined) plan.actualPrice = Number(req.body.actualPrice);
    if (req.body.discount !== undefined) plan.discount = Number(req.body.discount);
    if (req.body.productId !== undefined) plan.productId = String(req.body.productId).trim().toLowerCase();
    if (req.body.isFeatured !== undefined) plan.isFeatured = Boolean(req.body.isFeatured);
    if (req.body.isActive !== undefined) plan.isActive = Boolean(req.body.isActive);

    await plan.save();
    return res.status(200).json({ status: true, message: "Credit plan updated successfully.", data: plan });
  } catch (error) {
    console.error("Modify credit plan error:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Toggle credit plan status (isActive or isFeatured)
exports.toggleCreditPlanStatus = async (req, res) => {
  try {
    const { creditPlanId, field } = req.query;
    if (!creditPlanId || !["isActive", "isFeatured"].includes(field)) {
      return res.status(200).json({ status: false, message: "Valid creditPlanId and field (isActive or isFeatured) are required." });
    }

    const plan = await CreditPlan.findById(creditPlanId);
    if (!plan) {
      return res.status(200).json({ status: false, message: "Credit plan not found." });
    }

    if (field === "isActive") plan.isActive = !plan.isActive;
    if (field === "isFeatured") plan.isFeatured = !plan.isFeatured;

    await plan.save();
    return res.status(200).json({ status: true, message: "Credit plan status updated successfully.", data: plan });
  } catch (error) {
    console.error("Toggle credit plan status error:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Delete a credit plan
exports.removeCreditPlan = async (req, res) => {
  try {
    const creditPlanId = req.query.creditPlanId || req.body?.creditPlanId;
    if (!creditPlanId) {
      return res.status(200).json({ status: false, message: "creditPlanId is required." });
    }

    await CreditPlan.findByIdAndDelete(creditPlanId);
    return res.status(200).json({ status: true, message: "Credit plan deleted successfully." });
  } catch (error) {
    console.error("Remove credit plan error:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Retrieve all credit plans (Admin)
exports.fetchCreditPlans = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;

    const [total, creditPlans] = await Promise.all([
      CreditPlan.countDocuments(),
      CreditPlan.find()
        .sort({ credits: 1, price: 1 })
        .skip((start - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({ status: true, message: "Credit plans retrieved successfully.", total, data: creditPlans });
  } catch (error) {
    console.error("Fetch credit plans error:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Client / Public: Get active credit packages for frontend & prototype
exports.getCreditPackage = async (req, res) => {
  try {
    const packages = await CreditPlan.find({ isActive: true })
      .sort({ credits: 1, price: 1 })
      .lean();

    return res.status(200).json({ status: true, creditPlan: packages, packages });
  } catch (error) {
    console.error("Get credit package error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
