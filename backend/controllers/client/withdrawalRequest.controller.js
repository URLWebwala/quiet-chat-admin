const WithdrawalRequest = require("../../models/withdrawalRequest.model");
const Host = require("../../models/host.model");
const History = require("../../models/history.model");

const mongoose = require("mongoose");

const generateHistoryUniqueId = require("../../util/generateHistoryUniqueId");

const admin = require("../../util/privateKey");

//withdrawal request ( host )
exports.submitWithdrawalRequest = async (req, res) => {
  try {
    if (!settingJSON) {
      return res.status(200).json({ status: false, message: "Withdrawal settings not found." });
    }

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const { paymentGateway, paymentDetails, coin } = req.body;

    if (!paymentGateway || !paymentDetails || !coin) {
      return res.status(200).json({ status: false, message: "Invalid request. Please provide all required fields." });
    }

    const formattedGateway = paymentGateway.trim();
    const requestedCoins = Number(coin);
    const requestAmount = parseFloat(requestedCoins / settingJSON.minCoinsToConvert).toFixed(2);

    const [uniqueId, host] = await Promise.all([
      generateHistoryUniqueId(),
      Host.findOne({ userId: req.user.userId }).select("_id coin fcmToken agencyId").lean(),
    ]);

    if (!host) {
      return res.status(200).json({ status: false, message: "Host account not found." });
    }

    const hostId = host._id;

    const [pendingRequest, declinedRequest, totalEarnings, totalWithdrawnStats] = await Promise.all([
      WithdrawalRequest.findOne({ hostId, status: 1 }).select("_id").lean(), // status 1: pending
      WithdrawalRequest.findOne({ hostId, status: 3 }).select("_id").lean(), // status 3: declined
      History.aggregate([
        { $match: { hostId: hostId, type: { $in: [2, 3, 9, 10, 11, 12, 13, 14] } } },
        { $group: { _id: null, sum: { $sum: "$hostCoin" } } },
      ]),
      WithdrawalRequest.aggregate([
        { $match: { hostId: hostId, status: 2 } }, // status 2: approved
        { $group: { _id: null, sum: { $sum: "$coin" } } },
      ]),
    ]);

    const totalEarned = totalEarnings[0]?.sum || 0;
    const totalWithdrawn = totalWithdrawnStats[0]?.sum || 0;
    const availableBalance = totalEarned - totalWithdrawn;

    if (requestedCoins > availableBalance) {
      return res.status(200).json({ status: false, message: `Insufficient balance. Your total earnings are ${totalEarned} and you have already withdrawn ${totalWithdrawn}. Available: ${availableBalance}` });
    }

    if (requestedCoins > host.coin) {
      return res.status(200).json({ status: false, message: "Insufficient balance to request withdrawal." });
    }

    if (requestedCoins < settingJSON.minCoinsForHostPayout) {
      return res.status(200).json({ status: false, message: `Minimum withdrawal amount is ${settingJSON.minCoinsForHostPayout} coins.` });
    }

    if (pendingRequest) {
      return res.status(200).json({
        status: false,
        message: "You already have a pending withdrawal request under review.",
      });
    }

    const withdrawalData = {
      uniqueId,
      person: 2,
      agencyOwnerId: host.agencyId || null,
      hostId: hostId,
      coin: requestedCoins,
      amount: requestAmount,
      paymentGateway: formattedGateway,
      paymentDetails: paymentDetails,
      requestDate: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    };

    console.log("paymentDetails type:", typeof paymentDetails);
    console.log("paymentDetails value:", paymentDetails);

    const historyData = {
      uniqueId,
      hostId: hostId,
      hostCoin: requestedCoins,
      payoutStatus: 1,
      type: 5,
      date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    };

    if (declinedRequest) {
      await WithdrawalRequest.deleteOne({ _id: declinedRequest._id });
      await Promise.all([WithdrawalRequest.create(withdrawalData), History.create(historyData)]);

      res.status(200).json({
        status: true,
        message: "Previous declined request removed. New withdrawal request submitted successfully.",
      });
    } else {
      await Promise.all([WithdrawalRequest.create(withdrawalData), History.create(historyData)]);

      res.status(200).json({
        status: true,
        message: "Your withdrawal request has been submitted successfully and is under review.",
      });
    }

    if (host.fcmToken) {
      const adminApp = await admin;
      const notificationPayload = {
        token: host.fcmToken,
        data: {
          title: "🔔 Withdrawal Request Submitted",
          body: "We have received your withdrawal request. It will be processed shortly.",
          type: "WITHDRAWREQUEST",
        },
      };

      adminApp
        .messaging()
        .send(notificationPayload)
        .then((response) => {
          console.log("Notification sent successfully:", response);
        })
        .catch((err) => {
          console.error("Notification sending failed:", err);
        });
    }
  } catch (err) {
    console.error("Withdrawal request error:", err);
    return res.status(500).json({ status: false, message: "Internal server error. Please try again later." });
  }
};

//get withdrawal requests ( host )
exports.listPayoutRequests = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const { status } = req.query;

    if (!status) {
      return res.status(200).json({ status: false, message: "Invalid query parameters." });
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";

    let dateFilterQuery = {};
    if (startDate !== "All" && endDate !== "All") {
      const formattedStartDate = new Date(startDate);
      const formattedEndDate = new Date(endDate);
      formattedEndDate.setHours(23, 59, 59, 999);

      dateFilterQuery = {
        createdAt: {
          $gte: formattedStartDate,
          $lte: formattedEndDate,
        },
      };
    }

    let statusQuery = {};
    if (status !== "All") {
      statusQuery.status = parseInt(status);
    }

    const host = await Host.findOne({ userId: req.user.userId }).select("_id").lean();
    if (!host) {
      return res.status(200).json({ status: false, message: "Host account not found." });
    }

    const hostId = host._id;

    const [totalRecords, records] = await Promise.all([
      WithdrawalRequest.countDocuments({ person: 2, hostId: hostId, ...statusQuery, ...dateFilterQuery }),
      WithdrawalRequest.find({ person: 2, hostId: hostId, ...statusQuery, ...dateFilterQuery })
        .populate("hostId", "uniqueId name image")
        .sort({ createdAt: -1 })
        .skip((start - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      status: true,
      message: "Withdrawal requests retrieved successfully.",
      total: totalRecords,
      data: records.length > 0 ? records : [],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
