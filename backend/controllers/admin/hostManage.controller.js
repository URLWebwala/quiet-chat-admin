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

    // 5 Official Baseline AI Models
    const OFFICIAL_AI_MODELS = [
      {
        id: "6af7f908ed36e58e3830f6b0",
        name: "Aisha",
        surname: "Sen",
        slug: "aisha-sweet",
        flavor: "Sweet & Romantic",
        gender: "female",
        age: 22,
        city: "South Delhi",
        tagline: "Late night talks and soft melodies. Tell me your day.",
        bio: "A hopeless romantic who loves slow acoustic songs, old love letters, and deep conversations under the stars.",
        chatRate: 5,
      },
      {
        id: "6af7f908ed36e58e3830f6b1",
        name: "Riya",
        surname: "Kapoor",
        slug: "riya-playful",
        flavor: "Playful & Teasing",
        gender: "female",
        age: 23,
        city: "Bandra, Mumbai",
        tagline: "Don't take life too seriously! Dare to challenge me?",
        bio: "Full of witty comebacks, fun dares, and unstoppable laughter.",
        chatRate: 5,
      },
      {
        id: "6af7f908ed36e58e3830f6b2",
        name: "Sanya",
        surname: "Malhotra",
        slug: "sanya-bold",
        flavor: "Bold & Sassy",
        gender: "female",
        age: 24,
        city: "Cyber Hub, Gurugram",
        tagline: "Know your worth and add tax. Speak your mind or move aside.",
        bio: "Fierce, ambitious corporate powerhouse who speaks her mind with unshakeable confidence.",
        chatRate: 5,
      },
      {
        id: "6af7f908ed36e58e3830f6b3",
        name: "Tara",
        surname: "Khanna",
        slug: "tara-cute",
        flavor: "Cute & Bubbly",
        gender: "female",
        age: 21,
        city: "Koregaon Park, Pune",
        tagline: "Spreading sunshine, smiles and endless chitchat! ✨",
        bio: "Endless positivity, cute habits, and a bubbly persona that lights up any conversation.",
        chatRate: 3,
      },
      {
        id: "6af7f908ed36e58e3830f6b4",
        name: "Shanaya",
        surname: "Joshi",
        slug: "shanaya-prototype",
        flavor: "Caring & Supportive",
        gender: "female",
        age: 25,
        city: "Indiranagar, Bengaluru",
        tagline: "A safe space to unwind. You did your best today.",
        bio: "Mindfulness counselor and late-night listening host. Calm, grounded, and deeply compassionate.",
        chatRate: 2,
      },
    ];

    // Merge everything by slug - AI Models only (never dump random non-AI fake hosts)
    const hostMap = new Map();

    const baseList = aiServerHosts && aiServerHosts.length > 0 ? aiServerHosts : OFFICIAL_AI_MODELS;

    baseList.forEach((ah) => {
      let slug = ah.slug || (ah.name ? ah.name.toLowerCase() : "");
      let name = ah.name || "AI Model";
      // Ensure Shanaya is named Shanaya
      if (slug === "meera-caring" || name.toLowerCase() === "meera") {
        name = "Shanaya";
        if (!slug || slug === "meera-caring") slug = "shanaya-prototype";
      }
      if (!slug) return;

      hostMap.set(slug, {
        id: ah.id || ah._id,
        name: name,
        surname: ah.surname || "",
        slug: slug,
        flavor: ah.flavor || "Sweet & Romantic",
        image: ah.avatar || ah.image || "",
        gender: ah.gender || "female",
        age: ah.age || 22,
        city: ah.home_place || ah.city || "Mumbai",
        tagline: ah.tagline || ah.status || "",
        bio: ah.bio || "",
        chatRate: ah.chatRate || ah.chat_rate || 5,
        isBlock: false,
        source: "ai-persona",
      });
    });

    // Match DB Hosts ONLY to augment official AI models with MongoDB images / media / rates
    // (Never add non-AI fake hosts to the AI Model list)
    dbHosts.forEach((dh) => {
      const dbName = (dh.name || "").toLowerCase().trim();
      for (const [slug, m] of hostMap.entries()) {
        const mName = (m.name || "").toLowerCase().trim();
        if (dbName === mName || slug.includes(dbName)) {
          if (!m.image && dh.image) m.image = dh.image;
          if (dh._id) m.dbHostId = dh._id;
          if (dh.chatRate) m.chatRate = dh.chatRate;
          break;
        }
      }
    });

    // Helper to get stats for a slug (with aliases, e.g. Shanaya)
    const getStatsForSlug = (slug) => {
      const slugsToSum = [slug];
      if (slug.includes("shanaya") || slug === "meera-caring") {
        slugsToSum.push("shanaya", "shanaya-prototype", "meera-caring", "shanaya-caring");
      }
      let totalUsers = 0;
      let totalMessages = 0;
      let lastActive = null;

      slugsToSum.forEach((s) => {
        const u = userMap.get(s);
        const c = chatMap.get(s);
        if (u) {
          totalUsers += u.totalUsers || 0;
          if (!lastActive || (u.lastUserJoined && u.lastUserJoined > lastActive)) {
            lastActive = u.lastUserJoined;
          }
        }
        if (c) {
          totalMessages += c.totalMessages || 0;
          if (!lastActive || (c.lastChatAt && c.lastChatAt > lastActive)) {
            lastActive = c.lastChatAt;
          }
        }
      });

      return { totalUsers, totalMessages, lastActive };
    };

    // Attach aggregated stats to each official host card
    const hostCards = Array.from(hostMap.values()).map((h) => {
      const stats = getStatsForSlug(h.slug);
      return {
        ...h,
        totalUsers: stats.totalUsers,
        totalMessages: stats.totalMessages,
        lastActive: stats.lastActive,
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

    const cleanSlug = hostSlug.toLowerCase().trim();
    const query = cleanSlug.includes("shanaya") || cleanSlug === "meera-caring"
      ? { hostSlug: { $in: ["shanaya", "shanaya-prototype", "meera-caring", "shanaya-caring"] } }
      : { hostSlug: cleanSlug };

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
