const mongoose = require("mongoose");

const Host = require("../../models/host.model");
const Swipe = require("../../models/swipe.model");
const UserMatch = require("../../models/userMatch.model");
const presenceStore = require("../../util/presenceStore");

const DAY_MS = 24 * 60 * 60 * 1000;

function deriveHostOnlineStatus(host) {
  if (!host) return "offline";
  if (host.isLive) return "live";
  if (host.isBusy) return "busy";
  if (host.isOnline) return "online";
  return "offline";
}

// POST /api/client/host/recordSwipe
exports.recordSwipe = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const { hostId, action } = req.body;

    if (!hostId || !mongoose.Types.ObjectId.isValid(hostId)) {
      return res.status(200).json({ status: false, message: "hostId is required." });
    }

    if (!["like", "skip"].includes(action)) {
      return res.status(200).json({ status: false, message: "action must be like or skip." });
    }

    const hostObjectId = new mongoose.Types.ObjectId(hostId);

    const host = await Host.findOne({ _id: hostObjectId, status: 2 }).select("_id").lean();
    if (!host) {
      return res.status(200).json({ status: false, message: "Host not found." });
    }

    await Swipe.findOneAndUpdate(
      { userId, hostId: hostObjectId },
      { $set: { action } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return res.status(200).json({ status: true, message: "Swipe recorded." });
  } catch (error) {
    console.error("recordSwipe error:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// GET /api/client/host/discover
exports.discoverHosts = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const { genderPreference, limit } = req.query;

    const take = Math.max(1, Math.min(Number(limit) || 20, 50));

    const now = Date.now();
    const since = new Date(now - DAY_MS);

    const recentSwipes = await Swipe.find({
      userId,
      createdAt: { $gte: since },
    })
      .select("hostId")
      .lean();

    const excludedHostIds = recentSwipes.map((s) => s.hostId);

    const hostQuery = {
      status: 2,
      isBlock: false,
      isFake: false,
    };

    if (genderPreference && String(genderPreference).trim().toLowerCase() !== "all") {
      hostQuery.gender = String(genderPreference).toLowerCase().trim();
    }

    if (excludedHostIds.length) {
      hostQuery._id = { $nin: excludedHostIds };
    }

    const hosts = await Host.find(hostQuery)
      .select("_id name gender image country countryFlagImage isOnline isBusy isLive lastActiveAt")
      .sort({ isOnline: -1, lastActiveAt: -1, createdAt: -1 })
      .limit(take)
      .lean();

    const merged = hosts.map((h) => {
      const presence = presenceStore.getHostPresence(h._id.toString());
      const onlineStatus = presence ? presence.status : deriveHostOnlineStatus(h);
      return {
        ...h,
        onlineStatus,
      };
    });

    return res.status(200).json({
      status: true,
      message: "Hosts discovered successfully.",
      data: merged,
    });
  } catch (error) {
    console.error("discoverHosts error:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// POST /api/client/host/checkMatch
exports.checkMatch = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const { hostId } = req.body;

    if (!hostId || !mongoose.Types.ObjectId.isValid(hostId)) {
      return res.status(200).json({ status: false, message: "hostId is required." });
    }

    const hostObjectId = new mongoose.Types.ObjectId(hostId);

    const [host, swipe] = await Promise.all([
      Host.findOne({ _id: hostObjectId, status: 2 }).select("_id isOnline isBusy isLive").lean(),
      Swipe.findOne({ userId, hostId: hostObjectId, action: "like" }).lean(),
    ]);

    if (!host) {
      return res.status(200).json({ status: false, message: "Host not found." });
    }

    if (!swipe) {
      return res.status(200).json({ status: false, message: "No like recorded for this host yet." });
    }

    const presence = presenceStore.getHostPresence(host._id.toString());
    const isOnline = presence ? presence.isOnline || presence.status === "Online" || presence.status === "Live" : host.isOnline;

    if (!isOnline) {
      await Swipe.findOneAndUpdate(
        { userId, hostId: hostObjectId },
        { $set: { action: "like" } },
        { upsert: true },
      );
      return res.status(200).json({
        status: true,
        isMatch: false,
        chatId: null,
        message: "Host is offline. Like saved for later.",
      });
    }

    const match = await UserMatch.findOneAndUpdate(
      { userId, hostId: hostObjectId },
      {},
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return res.status(200).json({
      status: true,
      isMatch: true,
      chatId: null,
      matchId: match._id,
    });
  } catch (error) {
    console.error("checkMatch error:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

