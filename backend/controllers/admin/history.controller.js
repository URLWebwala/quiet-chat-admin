const History = require("../../models/history.model");
const User = require("../../models/user.model");
const Host = require("../../models/host.model");
const LiveBroadcastHistory = require("../../models/liveBroadcastHistory.model");
const WithdrawalRequest = require("../../models/withdrawalRequest.model");

//mongoose
const mongoose = require("mongoose");
const ExcelJS = require("exceljs");

// Guardrail for broken call records (e.g. 21h stuck calls).
// Only valid call durations up to 3 hours are counted in totalDuration.
const MAX_VALID_CALL_SECONDS = 3 * 60 * 60;

// Host wallet summary (admin)
// Source of truth for available: Host.coin (current wallet).
// Lifetime earned = Host.coin + Host.redeemedCoins (redeemed tracked on Host).
exports.getHostWalletSummary = async (req, res) => {
  try {
    const hostIdRaw = req.query.hostId;
    if (!hostIdRaw || !mongoose.Types.ObjectId.isValid(String(hostIdRaw))) {
      return res.status(200).json({ status: false, message: "Invalid hostId. Please provide a valid ObjectId." });
    }
    const hostId = new mongoose.Types.ObjectId(String(hostIdRaw));

    const host = await Host.findById(hostId).select("_id coin redeemedCoins redeemedAmount name uniqueId isFake").lean();
    if (!host) return res.status(200).json({ status: false, message: "Host not found." });

    const [pendingAgg, acceptedAgg, historyAgg] = await Promise.all([
      WithdrawalRequest.aggregate([
        { $match: { person: 2, hostId, status: 1 } },
        { $group: { _id: null, coins: { $sum: { $ifNull: ["$coin", 0] } }, count: { $sum: 1 } } },
      ]),
      WithdrawalRequest.aggregate([
        { $match: { person: 2, hostId, status: 2 } },
        { $group: { _id: null, coins: { $sum: { $ifNull: ["$coin", 0] } }, count: { $sum: 1 } } },
      ]),
      // Net delta from History, excluding withdrawals (type 5) because withdrawals are handled from Host.coin / WithdrawalRequest.
      // This is useful for debugging mismatches in reports.
      History.aggregate([
        {
          $match: {
            hostId,
            type: { $in: [2, 3, 9, 10, 11, 12, 13, 14, 15] },
          },
        },
        {
          $group: {
            _id: null,
            hostCoinNet: { $sum: { $ifNull: ["$hostCoin", 0] } },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const pendingCoins = Number(pendingAgg?.[0]?.coins || 0);
    const pendingCount = Number(pendingAgg?.[0]?.count || 0);
    const acceptedCoins = Number(acceptedAgg?.[0]?.coins || 0);
    const acceptedCount = Number(acceptedAgg?.[0]?.count || 0);

    const walletAvailable = Number(host.coin || 0);
    const walletAvailableAfterPending = walletAvailable - pendingCoins;

    const redeemedCoins = Number(host.redeemedCoins || 0);
    const lifetimeEarnedCoins = walletAvailable + redeemedCoins;

    const historyHostCoinNet = Number(historyAgg?.[0]?.hostCoinNet || 0);
    const historyRowCount = Number(historyAgg?.[0]?.count || 0);

    return res.status(200).json({
      status: true,
      message: "Host wallet summary retrieved.",
      data: {
        host: {
          _id: host._id,
          name: host.name || "",
          uniqueId: host.uniqueId || "",
          isFake: Boolean(host.isFake),
        },
        wallet: {
          availableCoins: walletAvailable,
          redeemedCoins,
          lifetimeEarnedCoins,
          availableAfterPendingCoins: walletAvailableAfterPending,
        },
        withdrawals: {
          pending: { count: pendingCount, coins: pendingCoins },
          accepted: { count: acceptedCount, coins: acceptedCoins },
        },
        debug: {
          historyNetHostCoinExcludingWithdrawals: historyHostCoinNet,
          historyRowsCount: historyRowCount,
          note:
            "If admin panel 'total earning' differs from wallet, check date filters and which History types are included. Wallet available is Host.coin.",
        },
      },
    });
  } catch (error) {
    console.error("getHostWalletSummary error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get coin history ( user )
exports.getCoinTransactionHistory = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "Invalid details." });
    }

    if (req.query.userId && !mongoose.Types.ObjectId.isValid(req.query.userId)) {
      return res.status(200).json({ status: false, message: "Invalid userId. Please provide a valid ObjectId." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";

    let dateFilterQuery = {};
    if (startDate !== "All" && endDate !== "All") {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      if (!Number.isNaN(startDateObj.getTime()) && !Number.isNaN(endDateObj.getTime())) {
        endDateObj.setHours(23, 59, 59, 999);
        dateFilterQuery = {
          createdAt: {
            $gte: startDateObj,
            $lte: endDateObj,
          },
        };
      }
    }

    const [user, total, transactionHistory, incomeStats] = await Promise.all([
      User.findOne({ _id: userId }).select("_id").lean(),
      History.countDocuments({
        ...dateFilterQuery,
        type: { $nin: [5] },
        userId: userId,
        userCoin: { $ne: 0 },
      }),
      History.aggregate([
        {
          $match: {
            ...dateFilterQuery,
            type: { $nin: [5] },
            userId: userId,
            userCoin: { $ne: 0 },
          },
        },
        {
          $lookup: {
            from: "hosts",
            localField: "hostId",
            foreignField: "_id",
            as: "receiver",
          },
        },
        {
          $unwind: {
            path: "$receiver",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            typeDescription: {
              $switch: {
                branches: [
                  { case: { $eq: ["$type", 1] }, then: "Login Bonus" },
                  { case: { $eq: ["$type", 2] }, then: "Live Gift" },
                  { case: { $eq: ["$type", 3] }, then: "Video Call Gift" },
                  { case: { $eq: ["$type", 6] }, then: "Daily Check-in Reward" },
                  { case: { $eq: ["$type", 7] }, then: "Purchased Coin Plan" },
                  { case: { $eq: ["$type", 8] }, then: "VIP Plan Purchase" },
                  { case: { $eq: ["$type", 9] }, then: "Chat with Host" },
                  { case: { $eq: ["$type", 10] }, then: "Chat Gift" },
                  { case: { $eq: ["$type", 11] }, then: "Private Audio Call" },
                  { case: { $eq: ["$type", 12] }, then: "Private Video Call" },
                  { case: { $eq: ["$type", 13] }, then: "Random Video Call" },
                  { case: { $eq: ["$type", 14] }, then: "Admin Add Coin" },
                  { case: { $eq: ["$type", 15] }, then: "Admin Deduct Coin" },
                ],
                default: "❓ Unknown Type",
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            uniqueId: 1,
            type: 1,
            typeDescription: 1,
            userCoin: 1,
            adminCoin: 1,
            hostCoin: 1,
            agencyCoin: 1,
            payoutStatus: 1,
            createdAt: 1,
            receiverName: { $ifNull: ["$receiver.name", ""] },
            isIncome: {
              $cond: {
                if: { $in: ["$type", [1, 6, 7, 8, 14]] },
                then: true,
                else: {
                  $cond: {
                    if: {
                      $in: ["$type", [2, 3, 10, 11, 12, 13, 15]],
                    },
                    then: false,
                    else: false,
                  },
                },
              },
            },
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: (start - 1) * limit },
        { $limit: limit },
      ]),
      History.aggregate([
        {
          $match: {
            ...dateFilterQuery,
            type: { $nin: [5] },
            userId: userId,
            userCoin: { $ne: 0 },
          },
        },
        {
          $addFields: {
            isIncome: {
              $cond: {
                if: { $in: ["$type", [1, 6, 7, 8, 14]] },
                then: true,
                else: {
                  $cond: {
                    if: {
                      $in: ["$type", [2, 3, 10, 11, 12, 13, 15]],
                    },
                    then: false,
                    else: false,
                  },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalIncome: {
              $sum: {
                $cond: [{ $eq: ["$isIncome", true] }, "$userCoin", 0],
              },
            },
            totalOutgoing: {
              $sum: {
                $cond: [{ $eq: ["$isIncome", false] }, "$userCoin", 0],
              },
            },
          },
        },
      ]),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    const totalIncome = incomeStats.length ? incomeStats[0].totalIncome : 0;
    const totalOutgoing = incomeStats.length ? incomeStats[0].totalOutgoing : 0;

    return res.status(200).json({
      status: true,
      message: "Transaction history fetch successfully.",
      totalIncome,
      totalOutgoing,
      total: total,
      data: transactionHistory,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Something went wrong. Please try again later." });
  }
};

//get call history ( user )
exports.fetchCallTransactionHistory = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "❌ Invalid details." });
    }

    if (req.query.userId && !mongoose.Types.ObjectId.isValid(req.query.userId)) {
      return res.status(200).json({ status: false, message: "Invalid userId. Please provide a valid ObjectId." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";

    let dateFilterQuery = {};
    if (startDate !== "All" && endDate !== "All") {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);

      dateFilterQuery = {
        createdAt: {
          $gte: startDateObj,
          $lte: endDateObj,
        },
      };
    }

    const callMatch = {
      ...dateFilterQuery,
      type: { $in: [11, 12, 13] },
      userId: userId,
      userCoin: { $ne: 0 },
    };

    const [user, total, transactionHistory, callDurations] = await Promise.all([
      User.findOne({ _id: userId }).select("_id").lean(),
      History.countDocuments(callMatch),
      History.aggregate([
        {
          $match: callMatch,
        },
        {
          $lookup: {
            from: "hosts",
            localField: "hostId",
            foreignField: "_id",
            as: "receiver",
          },
        },
        {
          $unwind: {
            path: "$receiver",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            typeDescription: {
              $switch: {
                branches: [
                  { case: { $eq: ["$type", 11] }, then: "Private Audio Call" },
                  { case: { $eq: ["$type", 12] }, then: "Private Video Call" },
                  { case: { $eq: ["$type", 13] }, then: "Random Video Call" },
                ],
                default: "❓ Unknown Type",
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            uniqueId: 1,
            type: 1,
            typeDescription: 1,
            userCoin: 1,
            adminCoin: 1,
            hostCoin: 1,
            agencyCoin: 1,
            callType: 1,
            isRandom: 1,
            isPrivate: 1,
            callStartTime: 1,
            callEndTime: 1,
            duration: 1,
            createdAt: 1,
            receiverName: { $ifNull: ["$receiver.name", ""] },
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: (start - 1) * limit },
        { $limit: limit },
      ]),
      History.find(callMatch).select("duration").lean(),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "👤 User not found." });
    }

    const durationToSeconds = (duration = "") => {
      const parts = String(duration).split(":").map((v) => Number(v));
      if (parts.length !== 3) return 0;
      if (parts.some((v) => !Number.isFinite(v) || v < 0)) return 0;
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    };

    const totalSeconds = (callDurations || []).reduce((sum, item) => sum + durationToSeconds(item?.duration), 0);
    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
    const totalRemainingSeconds = totalSeconds % 60;
    const totalDuration = `${String(totalHours).padStart(2, "0")}:${String(totalMinutes).padStart(2, "0")}:${String(totalRemainingSeconds).padStart(2, "0")}`;

    return res.status(200).json({
      status: true,
      message: "✅ Transaction history fetched successfully.",
      total: total,
      totalDuration,
      data: transactionHistory,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "🚨 Something went wrong. Please try again later.",
    });
  }
};

//get gift history ( user )
exports.retrieveGiftTransactionHistory = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "❌ Invalid details." });
    }

    if (req.query.userId && !mongoose.Types.ObjectId.isValid(req.query.userId)) {
      return res.status(200).json({ status: false, message: "Invalid userId. Please provide a valid ObjectId." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";

    let dateFilterQuery = {};
    if (startDate !== "All" && endDate !== "All") {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);

      dateFilterQuery = {
        createdAt: {
          $gte: startDateObj,
          $lte: endDateObj,
        },
      };
    }

    const [user, total, transactionHistory] = await Promise.all([
      User.findOne({ _id: userId }).select("_id").lean(),
      History.countDocuments({
        ...dateFilterQuery,
        type: { $in: [2, 3, 10] },
        userId: userId,
        userCoin: { $ne: 0 },
      }),
      History.aggregate([
        {
          $match: {
            ...dateFilterQuery,
            type: { $in: [2, 3, 10] },
            userId: userId,
            userCoin: { $ne: 0 },
          },
        },
        {
          $lookup: {
            from: "hosts",
            localField: "hostId",
            foreignField: "_id",
            as: "receiver",
          },
        },
        {
          $unwind: {
            path: "$receiver",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            typeDescription: {
              $switch: {
                branches: [
                  { case: { $eq: ["$type", 2] }, then: "Live Gift" },
                  { case: { $eq: ["$type", 3] }, then: "Video Call Gift" },
                  { case: { $eq: ["$type", 10] }, then: "Chat Gift" },
                ],
                default: "❓ Unknown Type",
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            uniqueId: 1,
            type: 1,
            typeDescription: 1,
            userCoin: 1,
            adminCoin: 1,
            hostCoin: 1,
            agencyCoin: 1,
            createdAt: 1,
            receiverName: { $ifNull: ["$receiver.name", ""] },
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: (start - 1) * limit },
        { $limit: limit },
      ]),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "👤 User not found." });
    }

    return res.status(200).json({
      status: true,
      message: "✅ Transaction history fetched successfully.",
      total: total,
      data: transactionHistory,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "🚨 Something went wrong. Please try again later.",
    });
  }
};

//get vipPlan purchase history ( user )
exports.getVIPPlanTransactionHistory = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "Invalid details." });
    }

    if (req.query.userId && !mongoose.Types.ObjectId.isValid(req.query.userId)) {
      return res.status(200).json({ status: false, message: "Invalid userId. Please provide a valid ObjectId." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";

    let dateFilterQuery = {};
    if (startDate !== "All" && endDate !== "All") {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);

      dateFilterQuery = {
        createdAt: {
          $gte: startDateObj,
          $lte: endDateObj,
        },
      };
    }

    const [user, total, transactionHistory] = await Promise.all([
      User.findOne({ _id: userId }).select("_id").lean(),
      History.countDocuments({
        ...dateFilterQuery,
        type: 8,
        userId: userId,
        userCoin: { $ne: 0 },
      }),
      History.aggregate([
        {
          $match: {
            ...dateFilterQuery,
            type: 8,
            userId: userId,
            userCoin: { $ne: 0 },
          },
        },
        {
          $project: {
            _id: 1,
            uniqueId: 1,
            type: 1,
            userCoin: 1,
            validity: 1,
            validityType: 1,
            price: 1,
            paymentGateway: 1,
            createdAt: 1,
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: (start - 1) * limit },
        { $limit: limit },
      ]),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    return res.status(200).json({
      status: true,
      message: "Transaction history fetch successfully.",
      total: total,
      data: transactionHistory,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Something went wrong. Please try again later." });
  }
};

//get coinplan purchase history ( user )
exports.fetchCoinPlanTransactionHistory = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "Invalid details." });
    }

    if (req.query.userId && !mongoose.Types.ObjectId.isValid(req.query.userId)) {
      return res.status(200).json({ status: false, message: "Invalid userId. Please provide a valid ObjectId." });
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const startDate = req?.query?.startDate || "All";
    const endDate = req?.query?.endDate || "All";

    let dateFilterQuery = {};
    if (startDate !== "All" && endDate !== "All") {
      const formatStartDate = new Date(startDate);
      const formatEndDate = new Date(endDate);
      formatEndDate.setHours(23, 59, 59, 999);

      dateFilterQuery.createdAt = {
        $gte: formatStartDate,
        $lte: formatEndDate,
      };
    }

    const baseFilter = {
      ...dateFilterQuery,
      type: 7,
      userCoin: { $exists: true, $ne: 0 },
      price: { $exists: true, $ne: 0 },
      userId: new mongoose.Types.ObjectId(req.query.userId),
    };

    const [history] = await Promise.all([
      History.aggregate([
        { $match: baseFilter },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $unwind: {
            path: "$userDetails",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $group: {
            _id: "$userDetails._id",
            name: { $first: "$userDetails.name" },
            name: { $first: "$userDetails.uniqueId" },
            isVip: { $first: "$userDetails.isVip" },
            image: { $first: "$userDetails.image" },
            totalPlansPurchased: { $sum: 1 },
            totalPriceSpent: { $sum: "$price" },
            coinPlanPurchase: {
              $push: {
                uniqueId: "$uniqueId",
                coin: "$userCoin",
                bonusCoins: "$bonusCoins",
                price: "$price",
                paymentGateway: "$paymentGateway",
                date: "$date",
              },
            },
          },
        },
        { $sort: { totalPlansPurchased: -1 } },
        { $skip: (start - 1) * limit },
        { $limit: limit },
      ]).then((result) => result.map((doc) => ({ ...doc, _id: doc._id.toString() }))),
    ]);

    return res.status(200).json({
      status: true,
      message: "User coin plan transactions retrieved successfully.",
      total: history.length || 0,
      data: history || [],
    });
  } catch (error) {
    console.error("Error fetching coin plan transactions:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

//get coin history ( host )
exports.fetchCoinTransactionHistory = async (req, res) => {
  try {
    if (!req.query.hostId) {
      return res.status(200).json({ status: false, message: "Invalid details." });
    }

    const hostId = new mongoose.Types.ObjectId(req.query.hostId);

    if (req.query.hostId && !mongoose.Types.ObjectId.isValid(req.query.hostId)) {
      return res.status(200).json({ status: false, message: "Invalid hostId. Please provide a valid ObjectId." });
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";

    let dateFilterQuery = {};
    if (startDate !== "All" && endDate !== "All") {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);

      dateFilterQuery = {
        createdAt: {
          $gte: startDateObj,
          $lte: endDateObj,
        },
      };
    }

    const baseMatch = {
      ...dateFilterQuery,
      type: { $in: [2, 3, 5, 9, 10, 11, 12, 13, 14, 15] },
      hostId: hostId,
      hostCoin: { $ne: 0 },
    };

    const [host, total, transactionHistory, totalsAgg] = await Promise.all([
      Host.findOne({ _id: hostId }).select("_id").lean(),
      History.countDocuments({
        ...baseMatch,
      }),
      History.aggregate([
        {
          $match: baseMatch,
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "sender",
          },
        },
        {
          $unwind: {
            path: "$sender",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            typeDescription: {
              $switch: {
                branches: [
                  { case: { $eq: ["$type", 2] }, then: "Live Gift" },
                  { case: { $eq: ["$type", 3] }, then: "Video Call Gift" },
                  { case: { $eq: ["$type", 5] }, then: "Withdrawal by Host" },
                  { case: { $eq: ["$type", 9] }, then: "Chat with Host" },
                  { case: { $eq: ["$type", 10] }, then: "Chat Gift" },
                  { case: { $eq: ["$type", 11] }, then: "Private Audio Call" },
                  { case: { $eq: ["$type", 12] }, then: "Private Video Call" },
                  { case: { $eq: ["$type", 13] }, then: "Random Video Call" },
                  { case: { $eq: ["$type", 14] }, then: "Admin Add Coin" },
                  { case: { $eq: ["$type", 15] }, then: "Admin Deduct Coin" },
                ],
                default: "❓ Unknown Type",
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            uniqueId: 1,
            type: 1,
            typeDescription: 1,
            userCoin: 1,
            adminCoin: 1,
            // Fix: Withdrawal rows should not inflate earnings.
            // - Pending/Declined withdrawal: show 0 coin impact
            // - Accepted withdrawal: show negative (debit)
            hostCoin: {
              $cond: [
                { $eq: ["$type", 5] },
                {
                  $cond: [
                    { $eq: ["$payoutStatus", 2] },
                    { $multiply: [{ $abs: { $ifNull: ["$hostCoin", 0] } }, -1] },
                    0,
                  ],
                },
                "$hostCoin",
              ],
            },
            agencyCoin: 1,
            payoutStatus: 1,
            createdAt: 1,
            senderName: { $ifNull: ["$sender.name", ""] },
            isIncome: {
              $cond: {
                if: { $in: ["$type", [2, 3, 9, 10, 11, 12, 13, 14]] },
                then: true,
                else: {
                  $cond: {
                    if: {
                      $and: [{ $eq: ["$type", 5] }, { $eq: ["$payoutStatus", 2] }],
                    },
                    then: false,
                    else: false,
                  },
                },
              },
            },
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: (start - 1) * limit },
        { $limit: limit },
      ]),
      History.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: null,
            totalHostCoin: {
              $sum: {
                $cond: [
                  { $eq: ["$type", 5] },
                  {
                    $cond: [
                      { $eq: ["$payoutStatus", 2] },
                      { $multiply: [{ $abs: { $ifNull: ["$hostCoin", 0] } }, -1] },
                      0,
                    ],
                  },
                  { $ifNull: ["$hostCoin", 0] },
                ],
              },
            },
          },
        },
      ]),
    ]);

    if (!host) {
      return res.status(200).json({ status: false, message: "Host does not found." });
    }

    return res.status(200).json({
      status: true,
      message: "Transaction history fetch successfully.",
      total: total,
      totalEarning: Number(totalsAgg?.[0]?.totalHostCoin || 0),
      data: transactionHistory,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Something went wrong. Please try again later." });
  }
};

//get call history ( host )
exports.listCallTransactions = async (req, res) => {
  try {
    if (!req.query.hostId) {
      return res.status(200).json({ status: false, message: "Invalid details." });
    }

    if (req.query.hostId && !mongoose.Types.ObjectId.isValid(req.query.hostId)) {
      return res.status(200).json({ status: false, message: "Invalid hostId. Please provide a valid ObjectId." });
    }

    const hostId = new mongoose.Types.ObjectId(req.query.hostId);

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const startDate = (req.query.startDate && String(req.query.startDate).trim()) || "All";
    const endDate = (req.query.endDate && String(req.query.endDate).trim()) || "All";
    const isAllTime = [startDate, endDate].every((d) => !d || d === "All" || String(d).toLowerCase() === "all");

    let dateFilterQuery = {};
    if (!isAllTime && startDate && endDate) {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      if (!isNaN(startDateObj.getTime()) && !isNaN(endDateObj.getTime())) {
        endDateObj.setHours(23, 59, 59, 999);
        dateFilterQuery = {
          createdAt: { $gte: startDateObj, $lte: endDateObj },
        };
      }
    }

    // Count and list ALL calls (type 11,12,13) so total matches app; no hostCoin filter
    const [host, total, transactionHistory] = await Promise.all([
      Host.findOne({ _id: hostId }).select("_id").lean(),
      History.countDocuments({
        ...dateFilterQuery,
        type: { $in: [11, 12, 13] },
        hostId: hostId,
      }),
      History.aggregate([
        {
          $match: {
            ...dateFilterQuery,
            type: { $in: [11, 12, 13] },
            hostId: hostId,
          },
        },
        {
          $addFields: {
            durationInSecondsRaw: {
              $cond: [
                {
                  $regexMatch: {
                    input: { $trim: { input: { $ifNull: ["$duration", ""] } } },
                    regex: /^\d{1,3}:\d{1,2}:\d{1,2}$/,
                  },
                },
                {
                  $add: [
                    {
                      $multiply: [
                        { $toInt: { $arrayElemAt: [{ $split: [{ $trim: { input: { $ifNull: ["$duration", ""] } } }, ":"] }, 0] } },
                        3600,
                      ],
                    },
                    {
                      $multiply: [
                        { $toInt: { $arrayElemAt: [{ $split: [{ $trim: { input: { $ifNull: ["$duration", ""] } } }, ":"] }, 1] } },
                        60,
                      ],
                    },
                    { $toInt: { $arrayElemAt: [{ $split: [{ $trim: { input: { $ifNull: ["$duration", ""] } } }, ":"] }, 2] } },
                  ],
                },
                0
              ]
            },
            durationInSeconds: {
              $cond: [
                {
                  $and: [
                    { $gt: ["$durationInSecondsRaw", 0] },
                    { $lte: ["$durationInSecondsRaw", MAX_VALID_CALL_SECONDS] },
                  ],
                },
                "$durationInSecondsRaw",
                0,
              ],
            }
          }
        },
        {
          $facet: {
            data: [
              {
                $lookup: {
                  from: "users",
                  localField: "userId",
                  foreignField: "_id",
                  as: "sender",
                },
              },
              { $unwind: { path: "$sender", preserveNullAndEmptyArrays: true } },

              {
                $addFields: {
                  typeDescription: {
                    $switch: {
                      branches: [
                        { case: { $eq: ["$type", 11] }, then: "Private Audio Call" },
                        { case: { $eq: ["$type", 12] }, then: "Private Video Call" },
                        { case: { $eq: ["$type", 13] }, then: "Random Video Call" },
                      ],
                      default: "❓ Unknown Type",
                    },
                  },
                },
              },

              {
                $project: {
                  _id: 1,
                  uniqueId: 1,
                  type: 1,
                  typeDescription: 1,
                  userCoin: 1,
                  adminCoin: 1,
                  hostCoin: 1,
                  agencyCoin: 1,
                  callType: 1,
                  isRandom: 1,
                  isPrivate: 1,
                  callStartTime: 1,
                  callEndTime: 1,
                  duration: 1,
                  createdAt: 1,
                  senderName: { $ifNull: ["$sender.name", ""] },
                },
              },

              { $sort: { createdAt: -1 } },
              { $skip: (start - 1) * limit },
              { $limit: limit },
            ],

            durationSummary: [
              {
                $group: {
                  _id: null,
                  totalSeconds: {
                    $sum: {
                      $let: {
                        vars: {
                          d: { $trim: { input: { $ifNull: ["$duration", ""] } } },
                        },
                        in: {
                          $cond: [
                            { $regexMatch: { input: "$$d", regex: /^\d{1,3}:\d{1,2}:\d{1,2}$/ } },
                            {
                              $let: {
                                vars: {
                                  s: {
                                    $add: [
                                      { $multiply: [{ $toInt: { $arrayElemAt: [{ $split: ["$$d", ":"] }, 0] } }, 3600] },
                                      { $multiply: [{ $toInt: { $arrayElemAt: [{ $split: ["$$d", ":"] }, 1] } }, 60] },
                                      { $toInt: { $arrayElemAt: [{ $split: ["$$d", ":"] }, 2] } },
                                    ],
                                  },
                                },
                                in: {
                                  $cond: [
                                    { $and: [{ $gt: ["$$s", 0] }, { $lte: ["$$s", MAX_VALID_CALL_SECONDS] }] },
                                    "$$s",
                                    0,
                                  ],
                                },
                              },
                            },
                            0,
                          ],
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      ])
    ]);

    if (!host) {
      return res.status(200).json({ status: false, message: "Host does not found." });
    }

    const data = transactionHistory[0]?.data || [];
    const totalSeconds =
      transactionHistory[0]?.durationSummary[0]?.totalSeconds || 0;

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const totalDuration =
      `${String(hours).padStart(2, "0")}:` +
      `${String(minutes).padStart(2, "0")}:` +
      `${String(seconds).padStart(2, "0")}`;

    return res.status(200).json({
      status: true,
      message: "✅ Transaction history fetched successfully.",
      total: total,
      totalDuration,
      totalValidMinutes: Math.floor(totalSeconds / 60),
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "🚨 Something went wrong. Please try again later.",
    });
  }
};

//get gift history ( host )
exports.fetchGiftTransactionHistory = async (req, res) => {
  try {
    if (!req.query.hostId) {
      return res.status(200).json({ status: false, message: "Invalid details." });
    }

    if (req.query.hostId && !mongoose.Types.ObjectId.isValid(req.query.hostId)) {
      return res.status(200).json({ status: false, message: "Invalid hostId. Please provide a valid ObjectId." });
    }

    const hostId = new mongoose.Types.ObjectId(req.query.hostId);

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";

    let dateFilterQuery = {};
    if (startDate !== "All" && endDate !== "All") {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);

      dateFilterQuery = {
        createdAt: {
          $gte: startDateObj,
          $lte: endDateObj,
        },
      };
    }

    const [host, total, transactionHistory] = await Promise.all([
      Host.findOne({ _id: hostId }).select("_id").lean(),
      History.countDocuments({
        ...dateFilterQuery,
        type: { $in: [2, 3, 10] },
        hostId: hostId,
        hostCoin: { $ne: 0 },
      }),
      History.aggregate([
        {
          $match: {
            ...dateFilterQuery,
            type: { $in: [2, 3, 10] },
            hostId: hostId,
            hostCoin: { $ne: 0 },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "sender",
          },
        },
        {
          $unwind: {
            path: "$sender",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            typeDescription: {
              $switch: {
                branches: [
                  { case: { $eq: ["$type", 2] }, then: "Live Gift" },
                  { case: { $eq: ["$type", 3] }, then: "Video Call Gift" },
                  { case: { $eq: ["$type", 10] }, then: "Chat Gift" },
                ],
                default: "❓ Unknown Type",
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            uniqueId: 1,
            type: 1,
            typeDescription: 1,
            userCoin: 1,
            adminCoin: 1,
            hostCoin: 1,
            agencyCoin: 1,
            createdAt: 1,
            senderName: { $ifNull: ["$sender.name", ""] },
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: (start - 1) * limit },
        { $limit: limit },
      ]),
    ]);

    if (!host) {
      return res.status(200).json({ status: false, message: "Host does not found." });
    }

    return res.status(200).json({
      status: true,
      message: "✅ Transaction history fetched successfully.",
      total: total,
      data: transactionHistory,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "🚨 Something went wrong. Please try again later.",
    });
  }
};

//get chat history ( host )
exports.fetchChatTransactionHistory = async (req, res) => {
  try {
    if (!req.query.hostId) {
      return res.status(200).json({ status: false, message: "Invalid details." });
    }

    if (req.query.hostId && !mongoose.Types.ObjectId.isValid(req.query.hostId)) {
      return res.status(200).json({ status: false, message: "Invalid hostId. Please provide a valid ObjectId." });
    }

    const hostId = new mongoose.Types.ObjectId(req.query.hostId);
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";

    let dateFilterQuery = {};
    if (startDate !== "All" && endDate !== "All") {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);

      dateFilterQuery = {
        createdAt: {
          $gte: startDateObj,
          $lte: endDateObj,
        },
      };
    }

    const baseMatch = {
      ...dateFilterQuery,
      type: 9,
      hostId,
      hostCoin: { $ne: 0 },
    };

    const [host, total, transactionHistory, summary] = await Promise.all([
      Host.findOne({ _id: hostId }).select("_id").lean(),
      History.countDocuments(baseMatch),
      History.aggregate([
        { $match: baseMatch },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "sender",
          },
        },
        {
          $unwind: {
            path: "$sender",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            uniqueId: 1,
            type: 1,
            typeDescription: { $literal: "Chat with Host" },
            userCoin: 1,
            hostCoin: 1,
            adminCoin: 1,
            agencyCoin: 1,
            createdAt: 1,
            senderName: { $ifNull: ["$sender.name", ""] },
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: (start - 1) * limit },
        { $limit: limit },
      ]),
      History.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: null,
            totalChatCount: { $sum: 1 },
            totalHostCoin: { $sum: { $ifNull: ["$hostCoin", 0] } },
            totalUserCoin: { $sum: { $ifNull: ["$userCoin", 0] } },
          },
        },
      ]),
    ]);

    if (!host) {
      return res.status(200).json({ status: false, message: "Host does not found." });
    }

    return res.status(200).json({
      status: true,
      message: "Chat history fetched successfully.",
      total,
      totalChatCount: Number(summary?.[0]?.totalChatCount || 0),
      totalHostChatEarning: Number(summary?.[0]?.totalHostCoin || 0),
      totalUserChatSpent: Number(summary?.[0]?.totalUserCoin || 0),
      data: transactionHistory,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Something went wrong. Please try again later." });
  }
};

const durationToSecondsSafe = (duration = "") => {
  const parts = String(duration).split(":").map((v) => Number(v));
  if (parts.length !== 3) return 0;
  if (parts.some((v) => !Number.isFinite(v) || v < 0)) return 0;
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
};

const secondsToHms = (totalSeconds = 0) => {
  const s = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = Math.floor(s % 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

// Export agency -> hosts earnings report (Excel)
// Format matches provided sheet:
// Agency | Host | Coin total available | Audio duration + coins | Video duration + coins | Live duration + coins
exports.exportAgencyHostEarnings = async (req, res) => {
  try {
    const agencyIdRaw = req.query.agencyId;
    if (!agencyIdRaw || !mongoose.Types.ObjectId.isValid(String(agencyIdRaw))) {
      return res.status(200).json({ status: false, message: "Invalid agencyId. Please provide a valid ObjectId." });
    }

    const agencyId = new mongoose.Types.ObjectId(String(agencyIdRaw));
    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";

    let dateFilterQuery = {};
    if (startDate !== "All" && endDate !== "All") {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      if (!Number.isNaN(startDateObj.getTime()) && !Number.isNaN(endDateObj.getTime())) {
        endDateObj.setHours(23, 59, 59, 999);
        dateFilterQuery = {
          createdAt: {
            $gte: startDateObj,
            $lte: endDateObj,
          },
        };
      }
    }

    const hosts = await Host.find({ agencyId }).select("_id name uniqueId coin agencyId").populate("agencyId", "name").lean();
    if (!hosts?.length) {
      return res.status(200).json({ status: false, message: "No hosts found for this agency." });
    }

    const hostIds = hosts.map((h) => h._id);

    // Coins + call durations from History
    // - Audio calls: type 11
    // - Video calls: type 12,13
    // - Live gift coins: type 2 (duration comes from LiveBroadcastHistory)
    const historyAgg = await History.aggregate([
      {
        $match: {
          ...dateFilterQuery,
          hostId: { $in: hostIds },
          type: { $in: [2, 11, 12, 13] },
        },
      },
      {
        $addFields: {
          category: {
            $switch: {
              branches: [
                { case: { $eq: ["$type", 11] }, then: "audio" },
                { case: { $in: ["$type", [12, 13]] }, then: "video" },
                { case: { $eq: ["$type", 2] }, then: "live" },
              ],
              default: "other",
            },
          },
          durationInSeconds: {
            $cond: [
              { $regexMatch: { input: "$duration", regex: /^\d{2}:\d{2}:\d{2}$/ } },
              {
                $add: [
                  { $multiply: [{ $toInt: { $arrayElemAt: [{ $split: ["$duration", ":"] }, 0] } }, 3600] },
                  { $multiply: [{ $toInt: { $arrayElemAt: [{ $split: ["$duration", ":"] }, 1] } }, 60] },
                  { $toInt: { $arrayElemAt: [{ $split: ["$duration", ":"] }, 2] } },
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $group: {
          _id: { hostId: "$hostId", category: "$category" },
          totalDurationSeconds: { $sum: "$durationInSeconds" },
          hostCoin: { $sum: { $ifNull: ["$hostCoin", 0] } },
          adminCoin: { $sum: { $ifNull: ["$adminCoin", 0] } },
          agencyCoin: { $sum: { $ifNull: ["$agencyCoin", 0] } },
        },
      },
    ]);

    const liveDurationAgg = await LiveBroadcastHistory.aggregate([
      {
        $match: {
          ...dateFilterQuery,
          hostId: { $in: hostIds },
        },
      },
      {
        $addFields: {
          durationInSeconds: {
            $cond: [
              { $regexMatch: { input: "$duration", regex: /^\d{2}:\d{2}:\d{2}$/ } },
              {
                $add: [
                  { $multiply: [{ $toInt: { $arrayElemAt: [{ $split: ["$duration", ":"] }, 0] } }, 3600] },
                  { $multiply: [{ $toInt: { $arrayElemAt: [{ $split: ["$duration", ":"] }, 1] } }, 60] },
                  { $toInt: { $arrayElemAt: [{ $split: ["$duration", ":"] }, 2] } },
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $group: {
          _id: "$hostId",
          totalDurationSeconds: { $sum: "$durationInSeconds" },
        },
      },
    ]);

    const byHost = new Map();
    for (const h of hosts) {
      byHost.set(String(h._id), {
        agencyName: h?.agencyId?.name || "-",
        hostName: h?.name || "-",
        hostUniqueId: h?.uniqueId || "",
        coinTotalAvailable: h?.coin ?? 0,
        audio: { durationSeconds: 0, hostCoin: 0, adminCoin: 0, agencyCoin: 0 },
        video: { durationSeconds: 0, hostCoin: 0, adminCoin: 0, agencyCoin: 0 },
        live: { durationSeconds: 0, hostCoin: 0, adminCoin: 0, agencyCoin: 0 },
      });
    }

    for (const row of historyAgg) {
      const hostIdStr = String(row?._id?.hostId);
      const category = row?._id?.category;
      const rec = byHost.get(hostIdStr);
      if (!rec || !["audio", "video", "live"].includes(category)) continue;
      rec[category].durationSeconds = Number(row?.totalDurationSeconds || 0);
      rec[category].hostCoin = Number(row?.hostCoin || 0);
      rec[category].adminCoin = Number(row?.adminCoin || 0);
      rec[category].agencyCoin = Number(row?.agencyCoin || 0);
    }

    for (const row of liveDurationAgg) {
      const hostIdStr = String(row?._id);
      const rec = byHost.get(hostIdStr);
      if (!rec) continue;
      rec.live.durationSeconds = Number(row?.totalDurationSeconds || 0);
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "QuietChat Admin";
    const sheet = workbook.addWorksheet("Agency Host Earnings");

    sheet.columns = [
      { header: "Agency", key: "agency", width: 22 },
      { header: "Host", key: "host", width: 26 },
      { header: "Coin total available", key: "coinTotal", width: 20 },

      { header: "Call history Audio Total Duration", key: "audioDuration", width: 26 },
      { header: "Host Coin", key: "audioHostCoin", width: 12 },
      { header: "Admin Coin", key: "audioAdminCoin", width: 12 },
      { header: "Agency Coin", key: "audioAgencyCoin", width: 12 },

      { header: "Call history Video Total Duration", key: "videoDuration", width: 26 },
      { header: "Host Coin", key: "videoHostCoin", width: 12 },
      { header: "Admin Coin", key: "videoAdminCoin", width: 12 },
      { header: "Agency Coin", key: "videoAgencyCoin", width: 12 },

      { header: "Live history Total Duration", key: "liveDuration", width: 22 },
      { header: "Host Coin", key: "liveHostCoin", width: 12 },
      { header: "Admin Coin", key: "liveAdminCoin", width: 12 },
      { header: "Agency Coin", key: "liveAgencyCoin", width: 12 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: "frozen", ySplit: 1 }];

    for (const [_, rec] of byHost) {
      const hostLabel = rec.hostUniqueId ? `${rec.hostName} (${rec.hostUniqueId})` : rec.hostName;
      sheet.addRow({
        agency: rec.agencyName,
        host: hostLabel,
        coinTotal: rec.coinTotalAvailable,

        audioDuration: secondsToHms(rec.audio.durationSeconds),
        audioHostCoin: rec.audio.hostCoin,
        audioAdminCoin: rec.audio.adminCoin,
        audioAgencyCoin: rec.audio.agencyCoin,

        videoDuration: secondsToHms(rec.video.durationSeconds),
        videoHostCoin: rec.video.hostCoin,
        videoAdminCoin: rec.video.adminCoin,
        videoAgencyCoin: rec.video.agencyCoin,

        liveDuration: secondsToHms(rec.live.durationSeconds),
        liveHostCoin: rec.live.hostCoin,
        liveAdminCoin: rec.live.adminCoin,
        liveAgencyCoin: rec.live.agencyCoin,
      });
    }

    const safeStart = startDate === "All" ? "All" : String(startDate);
    const safeEnd = endDate === "All" ? "All" : String(endDate);
    const filename = `agency-host-earnings_${String(agencyIdRaw)}_${safeStart}_to_${safeEnd}.xlsx`.replace(/[:/\\]/g, "-");

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Something went wrong. Please try again later." });
  }
};

// Export ALL hosts earnings report (Excel)
exports.exportAllHostsEarnings = async (req, res) => {
  try {
    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";

    let dateFilterQuery = {};
    if (startDate !== "All" && endDate !== "All") {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      if (!Number.isNaN(startDateObj.getTime()) && !Number.isNaN(endDateObj.getTime())) {
        endDateObj.setHours(23, 59, 59, 999);
        dateFilterQuery = {
          createdAt: {
            $gte: startDateObj,
            $lte: endDateObj,
          },
        };
      }
    }

    const hosts = await Host.find({ status: 2, isFake: false })
      .select("_id name uniqueId coin agencyId")
      .populate("agencyId", "name")
      .lean();

    if (!hosts?.length) {
      return res.status(200).json({ status: false, message: "No hosts found." });
    }

    const hostIds = hosts.map((h) => h._id);

    const historyAgg = await History.aggregate([
      {
        $match: {
          ...dateFilterQuery,
          hostId: { $in: hostIds },
          type: { $in: [2, 11, 12, 13] },
        },
      },
      {
        $addFields: {
          category: {
            $switch: {
              branches: [
                { case: { $eq: ["$type", 11] }, then: "audio" },
                { case: { $in: ["$type", [12, 13]] }, then: "video" },
                { case: { $eq: ["$type", 2] }, then: "live" },
              ],
              default: "other",
            },
          },
          durationInSeconds: {
            $cond: [
              { $regexMatch: { input: "$duration", regex: /^\d{2}:\d{2}:\d{2}$/ } },
              {
                $add: [
                  { $multiply: [{ $toInt: { $arrayElemAt: [{ $split: ["$duration", ":"] }, 0] } }, 3600] },
                  { $multiply: [{ $toInt: { $arrayElemAt: [{ $split: ["$duration", ":"] }, 1] } }, 60] },
                  { $toInt: { $arrayElemAt: [{ $split: ["$duration", ":"] }, 2] } },
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $group: {
          _id: { hostId: "$hostId", category: "$category" },
          totalDurationSeconds: { $sum: "$durationInSeconds" },
          hostCoin: { $sum: { $ifNull: ["$hostCoin", 0] } },
          adminCoin: { $sum: { $ifNull: ["$adminCoin", 0] } },
          agencyCoin: { $sum: { $ifNull: ["$agencyCoin", 0] } },
        },
      },
    ]);

    const liveDurationAgg = await LiveBroadcastHistory.aggregate([
      {
        $match: {
          ...dateFilterQuery,
          hostId: { $in: hostIds },
        },
      },
      {
        $addFields: {
          durationInSeconds: {
            $cond: [
              { $regexMatch: { input: "$duration", regex: /^\d{2}:\d{2}:\d{2}$/ } },
              {
                $add: [
                  { $multiply: [{ $toInt: { $arrayElemAt: [{ $split: ["$duration", ":"] }, 0] } }, 3600] },
                  { $multiply: [{ $toInt: { $arrayElemAt: [{ $split: ["$duration", ":"] }, 1] } }, 60] },
                  { $toInt: { $arrayElemAt: [{ $split: ["$duration", ":"] }, 2] } },
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $group: {
          _id: "$hostId",
          totalDurationSeconds: { $sum: "$durationInSeconds" },
        },
      },
    ]);

    const byHost = new Map();
    for (const h of hosts) {
      byHost.set(String(h._id), {
        agencyName: h?.agencyId?.name || "-",
        hostName: h?.name || "-",
        hostUniqueId: h?.uniqueId || "",
        coinTotalAvailable: h?.coin ?? 0,
        audio: { durationSeconds: 0, hostCoin: 0, adminCoin: 0, agencyCoin: 0 },
        video: { durationSeconds: 0, hostCoin: 0, adminCoin: 0, agencyCoin: 0 },
        live: { durationSeconds: 0, hostCoin: 0, adminCoin: 0, agencyCoin: 0 },
      });
    }

    for (const row of historyAgg) {
      const hostIdStr = String(row?._id?.hostId);
      const category = row?._id?.category;
      const rec = byHost.get(hostIdStr);
      if (!rec || !["audio", "video", "live"].includes(category)) continue;
      rec[category].durationSeconds = Number(row?.totalDurationSeconds || 0);
      rec[category].hostCoin = Number(row?.hostCoin || 0);
      rec[category].adminCoin = Number(row?.adminCoin || 0);
      rec[category].agencyCoin = Number(row?.agencyCoin || 0);
    }

    for (const row of liveDurationAgg) {
      const hostIdStr = String(row?._id);
      const rec = byHost.get(hostIdStr);
      if (!rec) continue;
      rec.live.durationSeconds = Number(row?.totalDurationSeconds || 0);
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "QuietChat Admin";
    const sheet = workbook.addWorksheet("All Hosts Earnings");

    sheet.columns = [
      { header: "Agency", key: "agency", width: 22 },
      { header: "Host", key: "host", width: 26 },
      { header: "Coin total available", key: "coinTotal", width: 20 },

      { header: "Call history Audio Total Duration", key: "audioDuration", width: 26 },
      { header: "Host Coin", key: "audioHostCoin", width: 12 },
      { header: "Admin Coin", key: "audioAdminCoin", width: 12 },
      { header: "Agency Coin", key: "audioAgencyCoin", width: 12 },

      { header: "Call history Video Total Duration", key: "videoDuration", width: 26 },
      { header: "Host Coin", key: "videoHostCoin", width: 12 },
      { header: "Admin Coin", key: "videoAdminCoin", width: 12 },
      { header: "Agency Coin", key: "videoAgencyCoin", width: 12 },

      { header: "Live history Total Duration", key: "liveDuration", width: 22 },
      { header: "Host Coin", key: "liveHostCoin", width: 12 },
      { header: "Admin Coin", key: "liveAdminCoin", width: 12 },
      { header: "Agency Coin", key: "liveAgencyCoin", width: 12 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: "frozen", ySplit: 1 }];

    for (const [_, rec] of byHost) {
      const hostLabel = rec.hostUniqueId ? `${rec.hostName} (${rec.hostUniqueId})` : rec.hostName;
      sheet.addRow({
        agency: rec.agencyName,
        host: hostLabel,
        coinTotal: rec.coinTotalAvailable,

        audioDuration: secondsToHms(rec.audio.durationSeconds),
        audioHostCoin: rec.audio.hostCoin,
        audioAdminCoin: rec.audio.adminCoin,
        audioAgencyCoin: rec.audio.agencyCoin,

        videoDuration: secondsToHms(rec.video.durationSeconds),
        videoHostCoin: rec.video.hostCoin,
        videoAdminCoin: rec.video.adminCoin,
        videoAgencyCoin: rec.video.agencyCoin,

        liveDuration: secondsToHms(rec.live.durationSeconds),
        liveHostCoin: rec.live.hostCoin,
        liveAdminCoin: rec.live.adminCoin,
        liveAgencyCoin: rec.live.agencyCoin,
      });
    }

    const safeStart = startDate === "All" ? "All" : String(startDate);
    const safeEnd = endDate === "All" ? "All" : String(endDate);
    const filename = `all-hosts-earnings_${safeStart}_to_${safeEnd}.xlsx`.replace(/[:/\\]/g, "-");

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Something went wrong. Please try again later." });
  }
};
