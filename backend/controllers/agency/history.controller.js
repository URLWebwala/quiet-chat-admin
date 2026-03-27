const History = require("../../models/history.model");
const Host = require("../../models/host.model");
const Agency = require("../../models/agency.model");

//mongoose
const mongoose = require("mongoose");

// Guardrail for broken call records (e.g. very long stuck calls).
// Only valid durations up to 3 hours are counted in totalDuration.
const MAX_VALID_CALL_SECONDS = 3 * 60 * 60;

//get coin history ( host )
exports.getCoinTransactions = async (req, res) => {
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
      type: { $in: [2, 3, 5, 9, 10, 11, 12, 13] },
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
            adminCoin: 1,
            payoutStatus: 1,
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
exports.getCallTransactions = async (req, res) => {
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
        type: { $in: [11, 12, 13] },
        hostId: hostId,
        hostCoin: { $ne: 0 },
      }),
      History.aggregate([
        {
          $match: {
            ...dateFilterQuery,
            type: { $in: [11, 12, 13] },
            hostId,
            hostCoin: { $ne: 0 },
          },
        },

        // HH:MM:SS → seconds
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
                0,
              ],
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
            },
          },
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
              {
                $unwind: {
                  path: "$sender",
                  preserveNullAndEmptyArrays: false,
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
                  hostCoin: 1,
                  adminCoin: 1,
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

            // total duration (NOT paginated)
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
      ]),
    ]);

    if (!host) {
      return res.status(200).json({ status: false, message: "Host does not found." });
    }

    const data = transactionHistory[0]?.data || [];
    const totalSeconds = transactionHistory[0]?.durationSummary[0]?.totalSeconds || 0;

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
exports.getGiftTransactions = async (req, res) => {
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
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $addFields: {
            typeDescription: {
              $switch: {
                branches: [
                  { case: { $eq: ["$type", 2] }, then: "🎁 Live Gift" },
                  { case: { $eq: ["$type", 3] }, then: "🎥 Video Call Gift" },
                  { case: { $eq: ["$type", 10] }, then: "💬 Chat Gift" },
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
            hostCoin: 1,
            adminCoin: 1,
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
exports.getChatTransactions = async (req, res) => {
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

//get agency's earnings
exports.retrieveAgencyEarnings = async (req, res) => {
  try {
    if (!req.agency || !req.agency._id) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const agencyObjectId = new mongoose.Types.ObjectId(req.agency._id);
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

    const [agency, summary, transactionHistory] = await Promise.all([
      Agency.findOne({ _id: agencyObjectId }).select("_id isBlock").lean(),
      History.aggregate([
        {
          $match: {
            ...dateFilterQuery,
            agencyId: agencyObjectId,
            type: { $in: [2, 3, 9, 10, 11, 12, 13] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            totalAgencyEarnings: { $sum: "$agencyCoin" },
          },
        },
      ]),
      History.aggregate([
        {
          $match: {
            ...dateFilterQuery,
            agencyId: agencyObjectId,
            type: { $in: [2, 3, 9, 10, 11, 12, 13] },
            agencyCoin: { $ne: 0 },
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
            preserveNullAndEmptyArrays: false,
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
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $addFields: {
            typeDescription: {
              $switch: {
                branches: [
                  { case: { $eq: ["$type", 2] }, then: "Live Gift" },
                  { case: { $eq: ["$type", 3] }, then: "Video Call Gift" },
                  { case: { $eq: ["$type", 9] }, then: "Chat with Host" },
                  { case: { $eq: ["$type", 10] }, then: "Chat Gift" },
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
            hostCoin: 1,
            adminCoin: 1,
            agencyCoin: 1,
            callStartTime: 1,
            callEndTime: 1,
            duration: 1,
            createdAt: 1,
            senderName: { $ifNull: ["$sender.name", ""] },
            receiverName: { $ifNull: ["$receiver.name", ""] },
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: (start - 1) * limit },
        { $limit: limit },
      ]),
    ]);

    if (!agency) {
      return res.status(200).json({ status: false, message: "Agency not found." });
    }

    if (agency.isBlock) {
      return res.status(200).json({ status: false, message: "Agency is currently inactive." });
    }

    const total = summary.length > 0 ? summary[0].total : 0;
    const totalAgencyEarnings = summary.length > 0 ? Number(summary[0].totalAgencyEarnings.toFixed(2)) : 0;

    return res.status(200).json({
      status: true,
      message: "Transaction history fetch successfully.",
      total,
      totalAgencyEarnings,
      data: transactionHistory,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Something went wrong. Please try again later." });
  }
};
