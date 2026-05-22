const AdsWatchProgress = require("../../models/adsWatchProgress.model");
const AdsWatchLog = require("../../models/adsWatchLog.model");

exports.fetchStats = async (req, res) => {
  try {
    const [progressStats, logStats] = await Promise.all([
      AdsWatchProgress.aggregate([
        {
          $group: {
            _id: null,
            totalPending: { $sum: "$pendingCoins" },
            totalClaimed: { $sum: "$totalClaimed" },
            totalEarned: { $sum: "$totalEarned" },
            totalWatches: { $sum: "$totalWatches" },
          },
        },
      ]),
      AdsWatchLog.aggregate([
        {
          $group: {
            _id: "$action",
            totalCoins: { $sum: "$coins" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const stats = progressStats[0] || {
      totalPending: 0,
      totalClaimed: 0,
      totalEarned: 0,
      totalWatches: 0,
    };

    return res.status(200).json({
      status: true,
      message: "Ads watch stats fetched successfully.",
      data: {
        totalPoints: stats.totalEarned || 0,
        totalClaimed: stats.totalClaimed || 0,
        totalPending: stats.totalPending || 0,
        totalWatches: stats.totalWatches || 0,
        logBreakdown: logStats,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

exports.fetchActivity = async (req, res) => {
  try {
    const personType = String(req.query.personType || "user").toLowerCase() === "host" ? "host" : "user";
    const start = req.query.start ? parseInt(req.query.start, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
    const skip = (start - 1) * limit;

    const matchQuery = { personType };

    const [total, records] = await Promise.all([
      AdsWatchProgress.countDocuments(matchQuery),
      AdsWatchProgress.find(matchQuery)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name uniqueId image")
        .populate("hostId", "name uniqueId image")
        .lean(),
    ]);

    return res.status(200).json({
      status: true,
      message: "Ads watch activity fetched successfully.",
      total,
      data: records,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

exports.fetchRecentLogs = async (req, res) => {
  try {
    const personType = String(req.query.personType || "user").toLowerCase() === "host" ? "host" : "user";
    const start = req.query.start ? parseInt(req.query.start, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
    const skip = (start - 1) * limit;

    const matchQuery = { personType };

    const [total, records] = await Promise.all([
      AdsWatchLog.countDocuments(matchQuery),
      AdsWatchLog.find(matchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name uniqueId image")
        .populate("hostId", "name uniqueId image")
        .lean(),
    ]);

    return res.status(200).json({
      status: true,
      message: "Ads watch logs fetched successfully.",
      total,
      data: records,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
