const Host = require("../../models/host.model");
const User = require("../../models/user.model");
const History = require("../../models/history.model");
const ChatTopic = require("../../models/chatTopic.model");
const Chat = require("../../models/chat.model");
const generateHistoryUniqueId = require("../../util/generateHistoryUniqueId");
const mongoose = require("mongoose");
const { DATING_AI_BASE_URL, createAIHeaders } = require("../../util/aiConfig");
const { resolveHostCallRates } = require("../../util/resolveHostCallRates");

// 1. Fetch AI Dating Profiles
exports.getAiProfiles = async (req, res) => {
  try {
    const rawGender = (req.query.gender || "").toLowerCase().trim();
    const genderQuery = rawGender ? `&gender=${encodeURIComponent(rawGender)}` : "";
    const queryString = `is_active=true${genderQuery}`;
    const headers = createAIHeaders("GET", "/api/profiles", null, queryString);
    const aiRes = await fetch(`${DATING_AI_BASE_URL}/api/profiles?${queryString}`, {
      method: "GET",
      headers,
    });

    if (!aiRes.ok) {
      return res.status(500).json({ status: false, message: "Failed to fetch AI profiles from AI server." });
    }

    const aiProfiles = (await aiRes.json()) || [];

    const hosts = await Host.find({
      isFake: true,
      isBlock: { $ne: true },
      ...(rawGender ? { gender: rawGender } : {}),
    })
      .lean()
      .select("name chatRate _id image isBlock useCustomCallRates gender impression language age bio video profileVideo liveVideo");

    const activeHostMap = new Map(hosts.map((h) => [h.name.toLowerCase().trim(), h]));
    const matchedNames = new Set();

    const profilesWithRates = aiProfiles
      .filter((profile) => {
        const dbHost = activeHostMap.get(profile.name.toLowerCase().trim());
        if (!dbHost) return false;
        if (rawGender) {
          const pGender = (profile.gender || dbHost.gender || "").toLowerCase().trim();
          if (pGender && pGender !== rawGender) return false;
        }
        matchedNames.add(profile.name.toLowerCase().trim());
        return true;
      })
      .map((profile) => {
        const dbHost = activeHostMap.get(profile.name.toLowerCase().trim());
        const effectiveRates = resolveHostCallRates(dbHost, global.settingJSON);
        return {
          ...profile,
          gender: profile.gender || dbHost?.gender,
          chatRate: effectiveRates.chatRate,
          chat_rate: effectiveRates.chatRate,
          hostId: dbHost?._id || null,
          image: dbHost?.image || profile.avatar_url,
          video: dbHost?.profileVideo?.[0] || dbHost?.video?.[0] || dbHost?.liveVideo?.[0] || null,
          profileVideo: dbHost?.profileVideo || [],
          videoList: dbHost?.video || [],
        };
      });

    // Include any active fake hosts from MongoDB that were not in Python AI server (e.g. manually added in Admin Panel)
    for (const host of hosts) {
      if (!matchedNames.has(host.name.toLowerCase().trim())) {
        const effectiveRates = resolveHostCallRates(host, global.settingJSON);
        profilesWithRates.push({
          id: host._id,
          hostId: host._id,
          name: host.name,
          gender: host.gender || rawGender || "female",
          age: host.age || 22,
          image: host.image,
          avatar_url: host.image,
          chatRate: effectiveRates.chatRate,
          chat_rate: effectiveRates.chatRate,
          personality: host.impression?.length ? host.impression : ["Smart", "Friendly"],
          language: host.language?.length ? host.language[0] : "Hinglish",
          bio: host.bio || "",
          video: host.profileVideo?.[0] || host.video?.[0] || host.liveVideo?.[0] || null,
          profileVideo: host.profileVideo || [],
          videoList: host.video || [],
        });
      }
    }

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
      receiver = await Host.findById(receiverId).select("name chatRate agencyId coin useCustomCallRates isBlock");
      if (receiver && receiver.isBlock) {
        return res.status(200).json({ status: false, message: "This AI host profile is currently disabled or inactive." });
      }
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

    // Sync latest user name & gender to AI service before generating reply
    try {
      const rawGender = (sender?.gender ? String(sender.gender) : "").toLowerCase().trim();
      const userGender = rawGender === "female" ? "female" : "male";
      const userName = (sender?.name || "User").trim().slice(0, 60) || "User";
      const patchPayload = { user_name: userName, user_gender: userGender };
      const patchPath = `/api/conversations/${activeConversationId}`;
      await fetch(`${DATING_AI_BASE_URL}${patchPath}`, {
        method: "PATCH",
        headers: createAIHeaders("PATCH", patchPath, patchPayload),
        body: JSON.stringify(patchPayload),
      }).catch(() => {});
    } catch (patchErr) {}

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

// 5. Send Virtual Gift to AI Host
exports.sendAiGift = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const { hostId, chatTopicId, giftId, giftName } = req.body;
    if (!hostId && !chatTopicId) {
      return res.status(200).json({ status: false, message: "hostId or chatTopicId is required." });
    }

    const senderId = new mongoose.Types.ObjectId(req.user.userId);
    const sender = await User.findById(senderId).select("name coin spentCoins gender");
    if (!sender) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    let chatTopic = null;
    if (chatTopicId && mongoose.Types.ObjectId.isValid(chatTopicId)) {
      chatTopic = await ChatTopic.findById(chatTopicId);
    }

    let receiver = null;
    if (hostId && mongoose.Types.ObjectId.isValid(hostId)) {
      receiver = await Host.findById(hostId).select("name gender agencyId coin isFake isBlock");
    } else if (chatTopic && chatTopic.receiverId) {
      receiver = await Host.findById(chatTopic.receiverId).select("name gender agencyId coin isFake isBlock");
    }

    if (!receiver) {
      return res.status(200).json({ status: false, message: "Host not found." });
    }

    if (!chatTopic) {
      chatTopic = await ChatTopic.findOne({
        $or: [
          { senderId: sender._id, receiverId: receiver._id },
          { senderId: receiver._id, receiverId: sender._id },
        ],
      });
    }

    // Resolve Gift from AI Backend Catalog
    let gift = null;
    try {
      const queryString = "is_active=true";
      const headers = createAIHeaders("GET", "/api/gifts", null, queryString);
      const giftsRes = await fetch(`${DATING_AI_BASE_URL}/api/gifts?${queryString}`, {
        method: "GET",
        headers,
      });
      if (giftsRes.ok) {
        const gifts = await giftsRes.json();
        gift = gifts.find(
          (g) =>
            (giftId && (g.id === giftId || g._id === giftId)) ||
            (giftName && (g.name || "").toLowerCase().trim() === String(giftName).toLowerCase().trim())
        );
      }
    } catch (gErr) {
      console.warn("sendAiGift: Failed to fetch gifts from AI server:", gErr.message);
    }

    const coinCost = gift?.coin_price || Number(req.body.coinPrice) || 30;
    const finalGiftId = gift?.id || giftId;
    const finalGiftName = gift?.name || giftName || "Virtual Gift";

    if (sender.coin < coinCost) {
      return res.status(200).json({
        status: false,
        insufficientCoins: true,
        message: "Insufficient coins to send gift.",
      });
    }

    // Coin Deduction & Host Commission
    const adminCommissionRate = global.settingJSON?.adminCommissionRate || 10;
    const adminShare = (coinCost * adminCommissionRate) / 100;
    const hostEarnings = coinCost - adminShare;
    const uniqueId = await generateHistoryUniqueId();

    await Promise.all([
      User.updateOne(
        { _id: sender._id, coin: { $gte: coinCost } },
        { $inc: { coin: -coinCost, spentCoins: coinCost } }
      ),
      Host.updateOne(
        { _id: receiver._id },
        { $inc: { coin: hostEarnings, totalGifts: 1 } }
      ),
      History.create({
        uniqueId,
        type: 10,
        userId: sender._id,
        hostId: receiver._id,
        agencyId: receiver.agencyId || null,
        giftCoin: coinCost,
        giftCount: 1,
        userCoin: coinCost,
        hostCoin: hostEarnings,
        adminCoin: adminShare,
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      }),
    ]);

    // Notify AI Server about the gift purchase
    let aiGiftData = null;
    let activeConversationId = chatTopic?.aiConversationId;

    if (activeConversationId && finalGiftId) {
      try {
        const giftPath = `/api/conversations/${activeConversationId}/gifts`;
        const giftPayload = { gift_id: finalGiftId };
        const giftHeaders = createAIHeaders("POST", giftPath, giftPayload);
        const aiGiftRes = await fetch(`${DATING_AI_BASE_URL}${giftPath}`, {
          method: "POST",
          headers: giftHeaders,
          body: JSON.stringify(giftPayload),
        });
        if (aiGiftRes.ok) {
          aiGiftData = await aiGiftRes.json();
          console.log("[AI Gift] Recorded gift with AI backend:", aiGiftData);
        } else {
          console.warn("[AI Gift] AI backend returned status", aiGiftRes.status);
        }
      } catch (aiErr) {
        console.warn("[AI Gift] Error communicating with AI backend:", aiErr.message);
      }
    }

    // Clear askedGift on ChatTopic
    if (chatTopic) {
      await ChatTopic.updateOne({ _id: chatTopic._id }, { $unset: { askedGift: 1 } });
    }

    // Create gift chat bubble
    const giftChat = new Chat({
      messageType: 4, // 4 = gift
      message: `🎁 ${sender.name || "User"} sent ${finalGiftName}`,
      senderId: sender._id,
      chatTopicId: chatTopic?._id,
      giftCount: 1,
      giftType: 1,
      giftImage: gift?.image_url || "",
      date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    });
    await giftChat.save();

    // Prepare thank-you reply from AI persona
    const replyText =
      aiGiftData?.reply ||
      aiGiftData?.messages?.[0]?.message ||
      `Aww, thank you so much for the ${finalGiftName}! 🥹❤️`;

    const thankYouChat = new Chat({
      messageType: 1,
      senderId: receiver._id,
      message: replyText,
      chatTopicId: chatTopic?._id,
      date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    });
    await thankYouChat.save();

    if (chatTopic) {
      await ChatTopic.updateOne(
        { _id: chatTopic._id },
        {
          $set: { chatId: thankYouChat._id, lastSenderRole: "host" },
          $inc: { messageCount: 2 },
        }
      );
    }

    // Real-time Socket notifications
    if (global.io && chatTopic) {
      // 1. Emit gift message
      const giftEventData = {
        data: JSON.stringify({
          chatTopicId: chatTopic._id.toString(),
          senderId: sender._id.toString(),
          receiverId: receiver._id.toString(),
          senderRole: "user",
          receiverRole: "host",
          message: giftChat.message,
          messageType: 4,
          giftImage: gift?.image_url || "",
          giftCount: 1,
          giftType: 1,
          date: giftChat.date,
        }),
        messageId: giftChat._id.toString(),
      };
      global.io.in("globalRoom:" + sender._id.toString()).emit("chatMessageSent", giftEventData);
      global.io.in("globalRoom:" + receiver._id.toString()).emit("chatMessageSent", giftEventData);

      // 2. Emit thank-you message
      const thankYouEventData = {
        data: JSON.stringify({
          chatTopicId: chatTopic._id.toString(),
          senderId: receiver._id.toString(),
          receiverId: sender._id.toString(),
          senderRole: "host",
          receiverRole: "user",
          name: receiver.name,
          hostName: receiver.name,
          senderName: receiver.name,
          image: receiver.image || "",
          message: thankYouChat.message,
          messages: aiGiftData?.messages,
          messageType: 1,
          date: thankYouChat.date,
        }),
        messageId: thankYouChat._id.toString(),
      };
      setTimeout(() => {
        if (global.io) {
          global.io.in("globalRoom:" + sender._id.toString()).emit("chatMessageSent", thankYouEventData);
          global.io.in("globalRoom:" + receiver._id.toString()).emit("chatMessageSent", thankYouEventData);
          // 3. Clear hint banner
          global.io.in("globalRoom:" + sender._id.toString()).emit("aiGiftHintCleared", {
            chatTopicId: chatTopic._id.toString(),
          });
        }
      }, 1000);
    }

    const updatedUser = await User.findById(sender._id).select("coin");

    return res.status(200).json({
      status: true,
      message: "Gift sent successfully!",
      gift: {
        gift_id: finalGiftId,
        name: finalGiftName,
        coin_price: coinCost,
      },
      reply: replyText,
      remainingCoins: updatedUser?.coin ?? 0,
    });
  } catch (error) {
    console.error("sendAiGift error:", error);
    return res.status(500).json({ status: false, message: error.message || "Server Error" });
  }
};

// 6. Get active gift ask for chat
exports.getAiActiveAsk = async (req, res) => {
  try {
    const { hostId, chatTopicId } = req.query;
    if (!hostId && !chatTopicId) {
      return res.status(200).json({ status: false, message: "hostId or chatTopicId is required." });
    }

    let chatTopic = null;
    if (chatTopicId && mongoose.Types.ObjectId.isValid(chatTopicId)) {
      chatTopic = await ChatTopic.findById(chatTopicId);
    }
    if (!chatTopic && hostId && mongoose.Types.ObjectId.isValid(hostId)) {
      const senderId = new mongoose.Types.ObjectId(req.user.userId);
      const receiverId = new mongoose.Types.ObjectId(hostId);
      chatTopic = await ChatTopic.findOne({
        $or: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      });
    }

    if (!chatTopic) {
      return res.status(200).json({ status: true, askedGift: null });
    }

    let askedGift = chatTopic.askedGift || null;

    // If not cached on chatTopic, check AI server conversation
    if (!askedGift && chatTopic.aiConversationId) {
      try {
        const path = `/api/conversations/${chatTopic.aiConversationId}`;
        const headers = createAIHeaders("GET", path);
        const convRes = await fetch(`${DATING_AI_BASE_URL}${path}`, { method: "GET", headers });
        if (convRes.ok) {
          const conv = await convRes.json();
          if (conv.asked_gift_id) {
            const giftQuery = `is_active=true`;
            const gHeaders = createAIHeaders("GET", "/api/gifts", null, giftQuery);
            const giftsRes = await fetch(`${DATING_AI_BASE_URL}/api/gifts?${giftQuery}`, {
              method: "GET",
              headers: gHeaders,
            });
            if (giftsRes.ok) {
              const gifts = await giftsRes.json();
              const match = gifts.find((g) => g.id === conv.asked_gift_id || g._id === conv.asked_gift_id);
              if (match) {
                askedGift = {
                  gift_id: match.id || match._id,
                  name: match.name,
                  coin_price: match.coin_price,
                  gender: match.gender,
                };
                await ChatTopic.updateOne({ _id: chatTopic._id }, { $set: { askedGift } });
              }
            }
          }
        }
      } catch (err) {
        console.warn("getAiActiveAsk error checking AI server:", err.message);
      }
    }

    return res.status(200).json({
      status: true,
      askedGift,
    });
  } catch (error) {
    console.error("getAiActiveAsk error:", error);
    return res.status(500).json({ status: false, message: error.message || "Server Error" });
  }
};
