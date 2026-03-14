const crypto = require("crypto");
const axios = require("axios");
const mongoose = require("mongoose");
const History = require("../../models/history.model");
const User = require("../../models/user.model");
const CoinPlan = require("../../models/coinPlan.model");
const generateHistoryUniqueId = require("../../util/generateHistoryUniqueId");

/**
 * Razorpay webhook - record payment when payment.captured fires.
 * Use raw body for signature verification (mount this route with express.raw()).
 * App must pass notes: { userId, coinPlanId } when creating Razorpay order.
 */
exports.handleRazorpayWebhook = async (req, res) => {
  try {
    const rawBody = req.body; // Buffer when using express.raw({ type: 'application/json' })
    const signature = req.headers["x-razorpay-signature"];
    const secret = global.settingJSON?.razorpaySecretKey;

    if (!secret || !signature) {
      console.warn("[Razorpay Webhook] Missing secret or signature");
      return res.status(400).send("Bad request");
    }

    const expectedSign = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    if (expectedSign !== signature) {
      console.warn("[Razorpay Webhook] Invalid signature");
      return res.status(400).send("Invalid signature");
    }

    const payload = typeof rawBody === "string" ? JSON.parse(rawBody) : JSON.parse(rawBody.toString("utf8"));
    if (payload.event !== "payment.captured") {
      return res.status(200).send("OK");
    }

    const payment = payload.payload?.payment?.entity;
    if (!payment || !payment.id) {
      return res.status(200).send("OK");
    }

    const paymentId = payment.id;
    const orderId = payment.order_id;
    const amountPaise = payment.amount || 0;

    const existing = await History.findOne({ razorpayPaymentId: paymentId }).select("_id").lean();
    if (existing) {
      return res.status(200).send("OK");
    }

    let notes = payment.notes || {};
    if ((!notes.userId || !notes.coinPlanId) && orderId) {
      try {
        const key = global.settingJSON?.razorpayId;
        const keySecret = global.settingJSON?.razorpaySecretKey;
        if (key && keySecret) {
          const auth = Buffer.from(`${key}:${keySecret}`).toString("base64");
          const orderRes = await axios.get(`https://api.razorpay.com/v1/orders/${orderId}`, {
            headers: { Authorization: `Basic ${auth}` },
          });
          notes = orderRes.data?.notes || notes;
        }
      } catch (err) {
        console.error("[Razorpay Webhook] Order fetch error:", err.message);
      }
    }

    const userId = notes.userId || notes.user_id;
    const coinPlanId = notes.coinPlanId || notes.coin_plan_id;
    if (!userId || !coinPlanId || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(coinPlanId)) {
      console.warn("[Razorpay Webhook] Missing userId/coinPlanId in notes for payment:", paymentId);
      return res.status(200).send("OK");
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const coinPlanObjectId = new mongoose.Types.ObjectId(coinPlanId);

    const [uniqueId, user, coinPlan] = await Promise.all([
      generateHistoryUniqueId(),
      User.findById(userObjectId).select("_id isVip").lean(),
      CoinPlan.findById(coinPlanObjectId).select("_id coins bonusCoins price").lean(),
    ]);

    if (!user || !coinPlan) {
      console.warn("[Razorpay Webhook] User or CoinPlan not found for payment:", paymentId);
      return res.status(200).send("OK");
    }

    const totalCoins = user.isVip ? coinPlan.coins + (coinPlan.bonusCoins || 0) : coinPlan.coins;
    const price = coinPlan.price != null ? coinPlan.price : amountPaise / 100;

    await Promise.all([
      User.updateOne({ _id: userObjectId }, { $inc: { coin: totalCoins, rechargedCoins: totalCoins } }),
      History.create({
        uniqueId,
        type: 7,
        userId: user._id,
        userCoin: totalCoins,
        bonusCoins: user.isVip ? (coinPlan.bonusCoins || 0) : 0,
        price,
        paymentGateway: "razorpay",
        razorpayPaymentId: paymentId,
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      }),
    ]);

    console.log("[Razorpay Webhook] Recorded payment:", paymentId, "user:", userId, "coins:", totalCoins);
    return res.status(200).send("OK");
  } catch (error) {
    console.error("[Razorpay Webhook] Error:", error);
    return res.status(500).send("Error");
  }
};
