const Host = require("../../models/host.model");
const User = require("../../models/user.model");
const History = require("../../models/history.model");
const generateHistoryUniqueId = require("../../util/generateHistoryUniqueId");
const mongoose = require("mongoose");
const { DATING_AI_BASE_URL, createAIHeaders } = require("../../util/aiConfig");
const { resolveHostCallRates } = require("../../util/resolveHostCallRates");

// 1. Fetch AI Dating Profiles
exports.getAiProfiles = async (req, res) => {
  try {
    const genderQuery = req.query.gender ? `&gender=${encodeURIComponent(req.query.gender)}` : "";
    const queryString = `is_active=true${genderQuery}`;
    const headers = createAIHeaders("GET", "/api/profiles", null, queryString);
    const aiRes = await fetch(`${DATING_AI_BASE_URL}/api/profiles?${queryString}`, {
      method: "GET",
      headers,
    });

    if (!aiRes.ok) {
      return res.status(500).json({ status: false, message: "Failed to fetch AI profiles from AI server." });
    }

    const aiProfiles = await aiRes.json();

    const names = aiProfiles.map((p) => p.name);
    const hosts = await Host.find({ name: { $in: names }, isFake: true, isBlock: { $ne: true } })
      .lean()
      .select("name chatRate _id image isBlock useCustomCallRates");

    const activeHostMap = new Map(hosts.map((h) => [h.name.toLowerCase().trim(), h]));

    const profilesWithRates = aiProfiles
      .filter((profile) => activeHostMap.has(profile.name.toLowerCase().trim()))
      .map((profile) => {
        const dbHost = activeHostMap.get(profile.name.toLowerCase().trim());
        const effectiveRates = resolveHostCallRates(dbHost, global.settingJSON);
        return {
          ...profile,
          chatRate: effectiveRates.chatRate,
          chat_rate: effectiveRates.chatRate,
          hostId: dbHost?._id || null,
          image: dbHost?.image || profile.avatar_url,
        };
      });

    return res.status(200).json({
      status: true,
      message: "AI profiles fetched successfully",
      data: profilesWithRates,
    });
  } catch (error) {
    console.error("getAiProfiles error:", error);
    return res.status(500).json({ status: false, message: error.message || "Server Error" });
  }
};

// 2. Fetch AI Experts (Disabled for client app - Admin only)
exports.getAiExperts = async (req, res) => {
  return res.status(200).json({
    status: true,
    message: "AI experts are currently not available in app",
    data: [],
  });
};

// 3. Fetch AI Gifts Catalog
exports.getAiGifts = async (req, res) => {
  try {
    const genderQuery = req.query.gender ? `gender=${encodeURIComponent(req.query.gender)}&` : "";
    const queryString = `${genderQuery}is_active=true`;
    const headers = createAIHeaders("GET", "/api/gifts", null, queryString);
    const aiRes = await fetch(`${DATING_AI_BASE_URL}/api/gifts?${queryString}`, {
      method: "GET",
      headers,
    });

    if (!aiRes.ok) {
      return res.status(500).json({ status: false, message: "Failed to fetch AI gifts from AI server." });
    }

    const gifts = await aiRes.json();

    return res.status(200).json({
      status: true,
      message: "AI gifts fetched successfully",
      data: gifts,
    });
  } catch (error) {
    console.error("getAiGifts error:", error);
    return res.status(500).json({ status: false, message: error.message || "Server Error" });
  }
};

// 4. Send message to AI Host / Expert
exports.sendAiMessage = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const { hostId, aiProfileId, message, conversationId, expertId } = req.body;
    if (!message) {
      return res.status(200).json({ status: false, message: "message is required." });
    }

    const senderId = new mongoose.Types.ObjectId(req.user.userId);
    const sender = await User.findById(senderId).select("name gender coin spentCoins");
    if (!sender) {
      return res.status(200).json({ status: false, message: "Sender not found." });
    }

    let receiver = null;
    let chatRate = 0;

    if (hostId) {
      const receiverId = new mongoose.Types.ObjectId(hostId);
      receiver = await Host.findById(receiverId).select("name chatRate agencyId coin useCustomCallRates");
      if (receiver) {
        const effectiveRates = resolveHostCallRates(receiver, global.settingJSON);
        chatRate = effectiveRates.chatRate;
      }
    }

    // Coin Deduction logic
    if (chatRate > 0) {
      if (sender.coin < chatRate) {
        return res.status(200).json({ status: false, message: "Insufficient coins to send message to AI." });
      }

      const adminCommissionRate = global.settingJSON?.adminCommissionRate || 10;
      const adminShare = (chatRate * adminCommissionRate) / 100;
      const hostEarnings = chatRate - adminShare;
      const uniqueId = await generateHistoryUniqueId();

      await Promise.all([
        User.updateOne({ _id: sender._id, coin: { $gte: chatRate } }, { $inc: { coin: -chatRate, spentCoins: chatRate } }),
        receiver ? Host.updateOne({ _id: receiver._id }, { $inc: { coin: hostEarnings } }) : Promise.resolve(),
        History.create({
          uniqueId: uniqueId,
          type: 9,
          userId: senderId,
          hostId: receiver?._id || null,
          agencyId: receiver?.agencyId,
          userCoin: chatRate,
          hostCoin: hostEarnings,
          adminCoin: adminShare,
          date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        }),
      ]);
    }

    // Step A: Ensure conversation exists
    let activeConversationId = conversationId;
    const targetProfileId = aiProfileId || expertId || receiver?.name;

    if (!activeConversationId && targetProfileId) {
      const createConvPayload = {
        profile_id: targetProfileId,
        user_name: sender.name || "User",
        user_gender: (sender.gender || "male").toLowerCase() === "female" ? "female" : "male",
        external_user_id: sender._id.toString(),
      };
      const createHeaders = createAIHeaders("POST", "/api/conversations", createConvPayload);
      const convRes = await fetch(`${DATING_AI_BASE_URL}/api/conversations`, {
        method: "POST",
        headers: createHeaders,
        body: JSON.stringify(createConvPayload),
      });

      if (convRes.ok) {
        const convData = await convRes.json();
        activeConversationId = convData.conversation_id;
      }
    }

    if (!activeConversationId) {
      return res.status(200).json({ status: false, message: "Failed to establish AI conversation." });
    }

    // Step B: Send message to conversation
    const msgPayload = { message: String(message).trim() };
    const msgPath = `/api/conversations/${activeConversationId}/messages`;
    const msgHeaders = createAIHeaders("POST", msgPath, msgPayload);

    const aiRes = await fetch(`${DATING_AI_BASE_URL}${msgPath}`, {
      method: "POST",
      headers: msgHeaders,
      body: JSON.stringify(msgPayload),
    });

    if (!aiRes.ok) {
      return res.status(200).json({ status: false, message: "Failed to get reply from AI." });
    }

    const aiResponseData = await aiRes.json();

    return res.status(200).json({
      status: true,
      message: "Message sent successfully",
      conversation_id: activeConversationId,
      reply: aiResponseData,
    });
  } catch (error) {
    console.error("sendAiMessage error:", error);
    return res.status(500).json({ status: false, message: error.message || "Server Error" });
  }
};
