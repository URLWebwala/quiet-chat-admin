const Host = require("../../models/host.model");
const User = require("../../models/user.model");
const History = require("../../models/history.model");
const generateHistoryUniqueId = require("../../util/generateHistoryUniqueId");
const mongoose = require("mongoose");
const { DATING_AI_BASE_URL, generateHmacSignature } = require("../../util/aiConfig");

exports.getAiProfiles = async (req, res) => {
  try {
    // 1. Fetch profiles from Dating AI backend
    const signature = generateHmacSignature();
    const aiRes = await fetch(`${DATING_AI_BASE_URL}/api/profiles?is_active=true`, {
      method: "GET",
      headers: {
        "x-hmac-signature": signature,
      },
    });

    if (!aiRes.ok) {
      return res.status(500).json({ status: false, message: "Failed to fetch AI profiles from AI server." });
    }

    const aiProfiles = await aiRes.json();

    // 2. Fetch our Host models that correspond to these AI profiles.
    // For now, matching by name. In a robust system, an aiProfileId should be saved.
    const names = aiProfiles.map((p) => p.name);
    const hosts = await Host.find({ name: { $in: names }, isFake: true }).lean().select("name chatRate _id image");

    // 3. Map the chatRate
    const profilesWithRates = aiProfiles.map((profile) => {
      const dbHost = hosts.find((h) => h.name === profile.name);
      return {
        ...profile,
        chatRate: dbHost?.chatRate || 0,
        hostId: dbHost?._id || null, // So the mobile app knows the DB hostId
        image: dbHost?.image || profile.avatar_url,
      };
    });

    return res.status(200).json({
      status: true,
      message: "AI profiles fetched successfully",
      data: profilesWithRates,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Server Error" });
  }
};

exports.sendAiMessage = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const { hostId, aiProfileId, message, conversationId } = req.body;
    if (!hostId || !message) {
      return res.status(200).json({ status: false, message: "hostId and message are required." });
    }

    const senderId = new mongoose.Types.ObjectId(req.user.userId);
    const receiverId = new mongoose.Types.ObjectId(hostId);

    const [uniqueId, sender, receiver] = await Promise.all([
      generateHistoryUniqueId(),
      User.findById(senderId).select("name coin spentCoins"),
      Host.findById(receiverId).select("name chatRate agencyId coin"),
    ]);

    if (!sender) {
      return res.status(200).json({ status: false, message: "Sender not found." });
    }
    if (!receiver) {
      return res.status(200).json({ status: false, message: "AI Host not found." });
    }

    const chatRate = receiver.chatRate || 0;

    // Coin Deduction logic
    if (chatRate > 0) {
      if (sender.coin < chatRate) {
        return res.status(200).json({ status: false, message: "Insufficient coins to send message to AI." });
      }

      const adminCommissionRate = global.settingJSON?.adminCommissionRate || 10;
      const adminShare = (chatRate * adminCommissionRate) / 100;
      const hostEarnings = chatRate - adminShare;

      // Update balances
      await Promise.all([
        User.updateOne({ _id: sender._id, coin: { $gte: chatRate } }, { $inc: { coin: -chatRate, spentCoins: chatRate } }),
        Host.updateOne({ _id: receiver._id }, { $inc: { coin: hostEarnings } }),
        History.create({
          uniqueId: uniqueId,
          type: 9, // Chat deduction
          userId: senderId,
          hostId: receiverId,
          agencyId: receiver?.agencyId,
          userCoin: chatRate,
          hostCoin: hostEarnings,
          adminCoin: adminShare,
          date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        }),
      ]);
    }

    // Proxy the message to the AI backend
    const payload = {
      profile_id: aiProfileId || receiver.name, // The AI Server expects profile_id, we default to name if aiProfileId isn't passed
      message: message,
      user_id: sender._id.toString(), // To keep context in the AI server
      conversation_id: conversationId || undefined,
    };

    const signature = generateHmacSignature(payload);

    const aiRes = await fetch(`${DATING_AI_BASE_URL}/api/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hmac-signature": signature,
      },
      body: JSON.stringify(payload),
    });

    if (!aiRes.ok) {
      return res.status(200).json({ status: false, message: "Failed to get reply from AI." });
    }

    const aiResponseData = await aiRes.json();

    return res.status(200).json({
      status: true,
      message: "Message sent successfully",
      reply: aiResponseData, // This will contain the AI's text and any audio/video
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Server Error" });
  }
};
