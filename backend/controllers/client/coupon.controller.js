const Coupon = require("../../models/coupon.model");
const User = require("../../models/user.model");
const History = require("../../models/history.model");
const { HISTORY_TYPE } = require("../../types/constant");
const generateHistoryUniqueId = require("../../util/generateHistoryUniqueId");
const sendEarningNotification = require("../../util/sendEarningNotification");
const adminFCM = require("../../util/privateKey");
const mongoose = require("mongoose");

// User claims / redeems a coupon code
exports.redeemCoupon = async (req, res) => {
  try {
    const rawCode = req.body.code || req.query.code;
    if (!rawCode) {
      return res.status(200).json({ status: false, message: "Please enter a coupon code." });
    }

    const code = String(rawCode).trim().toUpperCase();
    const userId = req.user?.userId || req.body?.userId || req.query?.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(200).json({ status: false, message: "User not found or invalid user session." });
    }

    const [user, coupon] = await Promise.all([
      User.findById(userId),
      Coupon.findOne({ code }),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User account not found." });
    }

    if (!coupon) {
      return res.status(200).json({ status: false, message: "Invalid coupon code. Please check and try again." });
    }

    if (!coupon.isActive) {
      return res.status(200).json({ status: false, message: "This coupon is currently inactive." });
    }

    // Expiry check
    if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
      return res.status(200).json({ status: false, message: "This coupon has expired." });
    }

    // Total usage limit check
    if (coupon.maxUsers > 0 && coupon.totalRedeemed >= coupon.maxUsers) {
      return res.status(200).json({ status: false, message: "This coupon has reached its maximum redemption limit." });
    }

    // Per-user limit check
    const userRedemptionCount = (coupon.redeemedUsers || []).filter(
      (r) => r.userId && r.userId.toString() === userId.toString()
    ).length;

    const allowedCount = coupon.perUserLimitCount || 1;
    if (coupon.isPerUserLimit && userRedemptionCount >= allowedCount) {
      return res.status(200).json({
        status: false,
        message: allowedCount > 1
          ? `You have already claimed this coupon ${allowedCount} times.`
          : "You have already redeemed this coupon once.",
      });
    }

    const coinToAdd = coupon.coin;

    // Credit coins, update coupon, and record history
    const uniqueId = await generateHistoryUniqueId();
    await Promise.all([
      User.updateOne(
        { _id: userId },
        { $inc: { coin: coinToAdd } }
      ),
      Coupon.updateOne(
        { _id: coupon._id },
        {
          $inc: { totalRedeemed: 1 },
          $push: {
            redeemedUsers: {
              userId: userId,
              coin: coinToAdd,
              redeemedAt: new Date(),
            },
          },
        }
      ),
      History.create({
        uniqueId: uniqueId,
        type: HISTORY_TYPE.COUPON_REDEEM || 19,
        userId: userId,
        userCoin: coinToAdd,
        reason: `Coupon redeemed: ${coupon.code}`,
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      }),
    ]);

    const updatedUser = await User.findById(userId).select("coin fcmToken").lean();

    // Send Real-Time Push Notification & store in Notification Center
    try {
      sendEarningNotification(
        userId,
        "🎟️ Coupon Redeemed!",
        `Coupon ${coupon.code} redeemed! ${coinToAdd} coins added to your wallet.`
      );

      const targetToken = updatedUser?.fcmToken || user?.fcmToken;
      if (targetToken) {
        const adminInstance = await adminFCM;
        if (adminInstance && adminInstance.messaging) {
          adminInstance.messaging().send({
            token: targetToken,
            notification: {
              title: "🎟️ Coupon Redeemed!",
              body: `Congratulations! ${coinToAdd} coins have been added to your wallet.`,
            },
            data: {
              title: "🎟️ Coupon Redeemed!",
              body: `Congratulations! ${coinToAdd} coins have been added to your wallet.`,
              type: "COUPON_REDEEM",
              coins: String(coinToAdd),
            },
            android: {
              priority: "high",
              notification: {
                sound: "default",
                channelId: "high_importance_channel",
              },
            },
          }).catch((err) => console.error("FCM coupon send error:", err.message));
        }
      }
    } catch (notifErr) {
      console.error("Coupon notification error:", notifErr);
    }

    return res.status(200).json({
      status: true,
      message: `Success! ${coinToAdd} coins added to your wallet.`,
      coinsClaimed: coinToAdd,
      totalCoins: updatedUser?.coin ?? (user.coin + coinToAdd),
      couponCode: coupon.code,
    });
  } catch (error) {
    console.error("Error redeeming coupon:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
