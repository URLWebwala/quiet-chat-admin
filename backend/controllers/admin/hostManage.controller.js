const Host = require("../../models/host.model");
const HostUser = require("../../models/hostUser.model");
const HostUserChat = require("../../models/hostUserChat.model");
const { DATING_AI_BASE_URL, createAIHeaders } = require("../../util/aiConfig");

/**
 * 1. Get overview of all AI hosts with user & chat statistics
 * GET /api/admin/host-manage/hosts-summary
 */
exports.getHostsSummary = async (req, res) => {
  try {
    // 1. Fetch AI hosts from MongoDB
    const dbHosts = await Host.find({ isFake: true })
      .select("name image flavor gender age bio country isBlock createdAt")
      .lean();

    // 2. Also attempt to fetch live AI host personas from AI server
    let aiServerHosts = [];
    try {
      const targetBase = (DATING_AI_BASE_URL || "https://adminai.quietchat.in").replace(/\/api\/?$/, "");
      const headers = createAIHeaders("GET", "/api/hosts");
      const resp = await fetch(`${targetBase}/api/hosts`, { method: "GET", headers });
      if (resp.ok) {
        aiServerHosts = (await resp.json()) || [];
      }
    } catch (e) {
      console.warn("AI server hosts fetch note:", e.message);
    }

    // 3. Aggregate user counts per hostSlug from HostUser
    const userAgg = await HostUser.aggregate([
      {
        $group: {
          _id: "$hostSlug",
          totalUsers: { $sum: 1 },
          lastUserJoined: { $max: "$createdAt" },
        },
      },
    ]);
    const userMap = new Map(userAgg.map((u) => [u._id, u]));

    // 4. Aggregate chat counts per hostSlug from HostUserChat
    const chatAgg = await HostUserChat.aggregate([
      {
        $group: {
          _id: "$hostSlug",
          totalMessages: { $sum: 1 },
          lastChatAt: { $max: "$createdAt" },
        },
      },
    ]);
    const chatMap = new Map(chatAgg.map((c) => [c._id, c]));

    // Merge everything by slug
    const hostMap = new Map();

    // Add AI Server Hosts first (these have official personas and slugs)
    aiServerHosts.forEach((ah) => {
      const slug = ah.slug || (ah.name ? ah.name.toLowerCase() : "");
      if (!slug) return;
      hostMap.set(slug, {
        id: ah.id || ah._id,
        name: ah.name,
        slug: slug,
        flavor: ah.flavor || "Sweet & Romantic",
        image: ah.avatar || ah.image || "",
        gender: ah.gender || "female",
        age: ah.age || 22,
        city: ah.home_place || ah.city || "Mumbai",
        tagline: ah.tagline || ah.status || "",
        bio: ah.bio || "",
        isBlock: false,
        source: "ai-persona",
      });
    });

    // Merge or add DB Hosts
    dbHosts.forEach((dh) => {
      const slug = (dh.name || "").toLowerCase().replace(/\s+/g, "-");
      if (!slug) return;
      if (hostMap.has(slug)) {
        const existing = hostMap.get(slug);
        if (!existing.image && dh.image) existing.image = dh.image;
        if (dh._id) existing.dbHostId = dh._id;
      } else {
        hostMap.set(slug, {
          id: dh._id,
          name: dh.name,
          slug: slug,
          flavor: dh.flavor || "General Persona",
          image: dh.image || "",
          gender: dh.gender || "female",
          age: dh.age || 22,
          city: dh.country || "India",
          tagline: dh.bio || "",
          bio: dh.bio || "",
          isBlock: dh.isBlock || false,
          source: "database",
        });
      }
    });

    // Ensure Shanaya is always represented if not yet added
    if (!hostMap.has("shanaya-prototype") && !hostMap.has("shanaya")) {
      hostMap.set("shanaya-prototype", {
        id: "shanaya_proto_default",
        name: "Shanaya",
        slug: "shanaya-prototype",
        flavor: "Glamorous & Flirty",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop",
        gender: "female",
        age: 23,
        city: "Bandra, Mumbai",
        tagline: "High fashion, late night gossip, and sparkling vibe ✨",
        bio: "Fashion blogger and aesthetic enthusiast who loves spontaneous midnight chats.",
        isBlock: false,
        source: "custom-prototype",
      });
    }

    // Attach aggregated stats to each host card
    const hostCards = Array.from(hostMap.values()).map((h) => {
      const uStats = userMap.get(h.slug);
      const cStats = chatMap.get(h.slug);
      return {
        ...h,
        totalUsers: uStats?.totalUsers || 0,
        totalMessages: cStats?.totalMessages || 0,
        lastActive: cStats?.lastChatAt || uStats?.lastUserJoined || null,
      };
    });

    // Global summary
    const totalRegisteredUsers = await HostUser.countDocuments();
    const totalMessages = await HostUserChat.countDocuments();

    return res.status(200).json({
      status: true,
      totalHosts: hostCards.length,
      totalRegisteredUsers,
      totalMessages,
      hosts: hostCards,
    });
  } catch (error) {
    console.error("HostManage getHostsSummary Error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

/**
 * 2. Get registered users for a specific host
 * GET /api/admin/host-manage/users?hostSlug=xyz&search=abc
 */
exports.getHostUsers = async (req, res) => {
  try {
    const { hostSlug, search, page = 1, limit = 50 } = req.query || {};

    if (!hostSlug) {
      return res.status(400).json({ status: false, message: "hostSlug query parameter is required" });
    }

    const query = { hostSlug: hostSlug.toLowerCase().trim() };

    if (search && search.trim()) {
      const reg = new RegExp(search.trim(), "i");
      query.$or = [{ name: reg }, { email: reg }];
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const users = await HostUser.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await HostUser.countDocuments(query);

    // Attach message counts and last message date for each user
    const userIds = users.map((u) => u._id);
    const userChatAgg = await HostUserChat.aggregate([
      { $match: { hostUserId: { $in: userIds } } },
      {
        $group: {
          _id: "$hostUserId",
          chatCount: { $sum: 1 },
          lastMessageAt: { $max: "$createdAt" },
        },
      },
    ]);

    const chatMap = new Map(userChatAgg.map((c) => [c._id.toString(), c]));

    const enrichedUsers = users.map((u) => {
      const stats = chatMap.get(u._id.toString());
      return {
        ...u,
        totalMessages: stats?.chatCount || 0,
        lastMessageAt: stats?.lastMessageAt || null,
      };
    });

    return res.status(200).json({
      status: true,
      total,
      users: enrichedUsers,
    });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

/**
 * 3. Get full chat history between a specific user and their host
 * GET /api/admin/host-manage/user-chats?hostUserId=xyz
 */
exports.getUserChatHistory = async (req, res) => {
  try {
    const { hostUserId } = req.query || {};
    if (!hostUserId) {
      return res.status(400).json({ status: false, message: "hostUserId is required" });
    }

    const user = await HostUser.findById(hostUserId).select("-password").lean();
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    const chats = await HostUserChat.find({ hostUserId })
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      status: true,
      user,
      hostSlug: user.hostSlug,
      totalChats: chats.length,
      chats,
    });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

/**
 * 4. Delete host user and all their chat messages
 * DELETE /api/admin/host-manage/user/:hostUserId
 */
exports.deleteHostUser = async (req, res) => {
  try {
    const { hostUserId } = req.params;
    if (!hostUserId) {
      return res.status(400).json({ status: false, message: "hostUserId is required" });
    }

    await HostUser.findByIdAndDelete(hostUserId);
    await HostUserChat.deleteMany({ hostUserId });

    return res.status(200).json({
      status: true,
      message: "Host user account and all chat history deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

/**
 * 5. Toggle block / suspend status of a host user
 * PATCH /api/admin/host-manage/user/:hostUserId/toggle-block
 */
exports.toggleBlockHostUser = async (req, res) => {
  try {
    const { hostUserId } = req.params;
    const user = await HostUser.findById(hostUserId);
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    user.isBlock = !user.isBlock;
    await user.save();

    return res.status(200).json({
      status: true,
      message: `User ${user.isBlock ? "suspended" : "activated"} successfully`,
      isBlock: user.isBlock,
    });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

/**
 * 6. Clear chat history for a specific user
 * POST /api/admin/host-manage/clear-chats
 * Body: { hostUserId }
 */
exports.clearUserChats = async (req, res) => {
  try {
    const { hostUserId } = req.body || {};
    if (!hostUserId) {
      return res.status(400).json({ status: false, message: "hostUserId is required" });
    }

    const result = await HostUserChat.deleteMany({ hostUserId });
    return res.status(200).json({
      status: true,
      message: `Cleared ${result.deletedCount} chat messages for user.`,
    });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};
