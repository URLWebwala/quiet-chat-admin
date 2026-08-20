const AdsWatchProgress = require("../../models/adsWatchProgress.model");
const AdsWatchLog = require("../../models/adsWatchLog.model");
const CustomTaskSubmission = require("../../models/customTaskSubmission.model");
const SurveyHistory = require("../../models/surveyHistory.model");

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
    const sortBy = String(req.query.sortBy || "latest").toLowerCase();

    let sortOptions = { updatedAt: -1, createdAt: -1 };
    if (sortBy === "earned") {
      sortOptions = { totalEarned: -1, updatedAt: -1 };
    } else if (sortBy === "watches") {
      sortOptions = { totalWatches: -1, updatedAt: -1 };
    }

    const matchQuery = { personType };

    const [total, records] = await Promise.all([
      AdsWatchProgress.countDocuments(matchQuery),
      AdsWatchProgress.find(matchQuery)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate("userId", "name uniqueId image")
        .populate("hostId", "name uniqueId image")
        .lean(),
    ]);

    const recordsWithBreakdown = await Promise.all(
      records.map(async (rec) => {
        const query = {};
        if (rec.personType === "host" && rec.hostId) {
          query.hostId = rec.hostId._id || rec.hostId;
        } else if (rec.userId) {
          query.userId = rec.userId._id || rec.userId;
        }

        const logs = await AdsWatchLog.aggregate([
          { $match: { ...query, action: { $ne: "claim" } } },
          {
            $group: {
              _id: "$adType",
              count: { $sum: 1 },
              points: { $sum: "$coins" },
            },
          },
        ]);

        let admobWatches = 0, admobPoints = 0;
        let unityWatches = 0, unityPoints = 0;
        let bitlabsSurveys = 0, bitlabsPoints = 0;
        let cpxSurveys = 0, cpxPoints = 0;
        let adgemOffers = 0, adgemPoints = 0;
        let theoremreachSurveys = 0, theoremreachPoints = 0;
        let customTasks = 0, customTaskPoints = 0;

        logs.forEach((item) => {
          const type = String(item._id || "").toLowerCase();
          if (type === "unity") {
            unityWatches = item.count;
            unityPoints = item.points;
          } else if (type === "bitlabs") {
            bitlabsSurveys = item.count;
            bitlabsPoints = item.points;
          } else if (type === "cpx") {
            cpxSurveys = item.count;
            cpxPoints = item.points;
          } else if (type === "adgem") {
            adgemOffers = item.count;
            adgemPoints = item.points;
          } else if (type === "theoremreach") {
            theoremreachSurveys = item.count;
            theoremreachPoints = item.points;
          } else if (type === "custom_task" || type === "customtask" || type === "task") {
            customTasks = item.count;
            customTaskPoints = item.points;
          } else {
            admobWatches += item.count;
            admobPoints += item.points;
          }
        });

        const uid = rec.personType === "host" ? (rec.hostId?._id || rec.hostId) : (rec.userId?._id || rec.userId);

        if (customTasks === 0 && uid) {
          const subStats = await CustomTaskSubmission.aggregate([
            { $match: { userId: uid, status: "approved" } },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                points: { $sum: "$rewardPoints" },
              },
            },
          ]);
          if (subStats.length > 0) {
            customTasks = subStats[0].count || 0;
            customTaskPoints = subStats[0].points || 0;
          }
        }

        if (uid && (cpxSurveys === 0 || bitlabsSurveys === 0 || adgemOffers === 0 || theoremreachSurveys === 0)) {
          const surveyStats = await SurveyHistory.aggregate([
            { $match: { user: uid, status: "completed" } },
            {
              $group: {
                _id: "$provider",
                count: { $sum: 1 },
                points: { $sum: "$coins" },
              },
            },
          ]);
          surveyStats.forEach((s) => {
            const p = String(s._id || "").toLowerCase();
            if (p === "cpx" && cpxSurveys === 0) {
              cpxSurveys = s.count || 0;
              cpxPoints = s.points || 0;
            } else if (p === "bitlabs" && bitlabsSurveys === 0) {
              bitlabsSurveys = s.count || 0;
              bitlabsPoints = s.points || 0;
            } else if (p === "adgem" && adgemOffers === 0) {
              adgemOffers = s.count || 0;
              adgemPoints = s.points || 0;
            } else if (p === "theoremreach" && theoremreachSurveys === 0) {
              theoremreachSurveys = s.count || 0;
              theoremreachPoints = s.points || 0;
            }
          });
        }

        return {
          ...rec,
          admobWatches,
          admobPoints,
          unityWatches,
          unityPoints,
          bitlabsSurveys,
          bitlabsPoints,
          cpxSurveys,
          cpxPoints,
          adgemOffers,
          adgemPoints,
          theoremreachSurveys,
          theoremreachPoints,
          customTasks,
          customTaskPoints,
        };
      })
    );

    return res.status(200).json({
      status: true,
      message: "Ads watch activity fetched successfully.",
      total,
      data: recordsWithBreakdown,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

exports.fetchRecentLogs = async (req, res) => {
  try {
    const personTypeParam = String(req.query.personType || "all").toLowerCase();
    const start = req.query.start ? parseInt(req.query.start, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
    const skip = (start - 1) * limit;

    const matchQuery = {};
    if (personTypeParam === "host" || personTypeParam === "user") {
      matchQuery.personType = personTypeParam;
    }
    if (req.query.userId) {
      matchQuery.userId = req.query.userId;
    }
    if (req.query.hostId) {
      matchQuery.hostId = req.query.hostId;
    }
    if (req.query.adType) {
      matchQuery.adType = String(req.query.adType).toLowerCase();
    }

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
