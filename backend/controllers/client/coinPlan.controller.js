const CoinPlan = require("../../models/coinPlan.model");

//import model
const User = require("../../models/user.model");
const History = require("../../models/history.model");

//mongoose
const mongoose = require("mongoose");

//generateHistoryUniqueId
const generateHistoryUniqueId = require("../../util/generateHistoryUniqueId");

/** Canonical value stored in history when purchase is Apple IAP (app may send any listed alias). */
const GATEWAY_IN_APP_PURCHASE = "In App Purchase";

const IAP_GATEWAY_ALIASES = new Set([
  "in app purchase",
  "in_app_purchase",
  "inapppurchase",
  "iap",
  "apple iap",
  "apple",
  "app store",
  "appstore",
  "ios",
  "ios_iap",
  "ios in app purchase",
]);

function normalizePaymentGateway(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  const lower = s.toLowerCase().replace(/\s+/g, " ").trim();
  const compact = lower.replace(/[\s_-]/g, "");
  if (IAP_GATEWAY_ALIASES.has(lower) || IAP_GATEWAY_ALIASES.has(compact)) {
    return GATEWAY_IN_APP_PURCHASE;
  }
  return s;
}

function productIdsMatchCaseInsensitive(dbId, clientId) {
  const a = String(dbId || "").trim();
  const b = String(clientId || "").trim();
  if (!a || !b) return true;
  return a.toLowerCase() === b.toLowerCase();
}

function pickParams(req) {
  const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
  return { ...req.query, ...body };
}

//get coinPlan
exports.getCoinPackage = async (req, res) => {
  try {
    const coinPlan = await CoinPlan.find({ isActive: true }).sort({ coins: 1, price: 1 }).lean();

    return res.status(200).json({
      status: true,
      message: "Retrive CoinPlan Successfully",
      data: coinPlan,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server error" });
  }
};

//purchase coinPlan ( coinPlan history )
exports.recordCoinPlanPurchase = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const params = pickParams(req);
    const { coinPlanId, paymentGateway, paymentId, productId, storeProductId } = params;

    if (!coinPlanId || !paymentGateway) {
      return res.json({ status: false, message: "Oops! Invalid details." });
    }

    const userObjectId = new mongoose.Types.ObjectId(req.user.userId);
    const coinPlanObjectId = new mongoose.Types.ObjectId(coinPlanId);
    const canonicalGateway = normalizePaymentGateway(paymentGateway);

    const storePid = String(storeProductId || productId || "").trim();

    const [user, coinPlan] = await Promise.all([
      User.findById(userObjectId).select("_id isVip coin").lean(),
      CoinPlan.findById(coinPlanObjectId).select("_id coins bonusCoins price productId").lean(),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "user does not found." });
    }

    if (!coinPlan) {
      return res.status(200).json({ status: false, message: "CoinPlan does not found." });
    }

    const planProductId = String(coinPlan.productId || "").trim();
    if (canonicalGateway === GATEWAY_IN_APP_PURCHASE && planProductId && storePid) {
      if (!productIdsMatchCaseInsensitive(planProductId, storePid)) {
        return res.status(200).json({
          status: false,
          message: "Product ID does not match this plan. Use the exact Product ID from admin (case must match App Store Connect).",
          expectedProductId: planProductId,
        });
      }
    }

    const trimmedPaymentId = paymentId && String(paymentId).trim() ? String(paymentId).trim() : "";
    if (trimmedPaymentId) {
      const existing = await History.findOne({
        type: 7,
        userId: user._id,
        razorpayPaymentId: trimmedPaymentId,
      })
        .select("_id")
        .lean();
      if (existing) {
        const fresh = await User.findById(userObjectId).select("coin").lean();
        return res.status(200).json({
          status: true,
          message: "Purchase already recorded.",
          totalCoins: fresh?.coin ?? user.coin ?? 0,
          duplicate: true,
        });
      }
    }

    const totalCoins = user.isVip ? coinPlan.coins + coinPlan.bonusCoins : coinPlan.coins;
    const uniqueId = await generateHistoryUniqueId();

    const historyData = {
      uniqueId: uniqueId,
      type: 7,
      userId: user._id,
      userCoin: totalCoins,
      bonusCoins: user.isVip ? coinPlan.bonusCoins : 0,
      price: coinPlan?.price,
      paymentGateway: canonicalGateway,
      date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    };
    if (trimmedPaymentId) {
      historyData.razorpayPaymentId = trimmedPaymentId;
    }

    await Promise.all([
      User.updateOne({ _id: userObjectId }, { $inc: { coin: totalCoins, rechargedCoins: totalCoins } }),
      History.create(historyData),
    ]);

    const after = await User.findById(userObjectId).select("coin").lean();

    return res.status(200).json({
      status: true,
      message: "Coin plan purchased successfully.",
      totalCoins: after?.coin ?? user.coin + totalCoins,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

