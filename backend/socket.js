
///import model
const Agency = require("./models/agency.model");
const User = require("./models/user.model");
const Host = require("./models/host.model");
const ChatTopic = require("./models/chatTopic.model");
const Chat = require("./models/chat.model");
const History = require("./models/history.model");
const Gift = require("./models/gift.model");
const Privatecall = require("./models/privatecall.model");
const Randomcall = require("./models/randomcall.model");
const LiveBroadcaster = require("./models/liveBroadcaster.model");
const LiveBroadcastView = require("./models/liveBroadcastView.model");
const LiveBroadcastHistory = require("./models/liveBroadcastHistory.model");
const VipPlanPrivilege = require("./models/vipPlanPrivilege.model");
const Block = require("./models/block.model");

//generateHistoryUniqueId
const generateHistoryUniqueId = require("./util/generateHistoryUniqueId");

//private key
const admin = require("./util/privateKey");

//mongoose
const mongoose = require("mongoose");

//moment
const moment = require("moment-timezone");

//agora-access-token
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

const presenceStore = require("./util/presenceStore");
const { resolveHostCallRates, hostWithEffectiveCallRates } = require("./util/resolveHostCallRates");

const { DATING_AI_BASE_URL, createAIHeaders } = require("./util/aiConfig");

/** Mongo user/host id → active socket id (single session: new connection kicks the previous tab/device). */
const userIdToActiveSocketId = new Map();
global.activeSockets = userIdToActiveSocketId;
global.activeChatUsers = new Map();

// Helper: derive host status string from flags
const getHostPresenceStatus = (host) => {
  if (!host) return "Offline";
  if (host.isLive) return "Live";
  if (host.isBusy) return "Busy";
  if (host.isOnline) return "Online";
  return "Offline";
};

// Helper: emit real-time host status over socket.io
const emitHostStatus = async (hostId) => {
  try {
    if (!hostId) return;

    const host = await Host.findById(hostId).select("_id isOnline isBusy isLive updatedAt").lean();
    if (!host) return;

    const status = getHostPresenceStatus(host);
    const updatedAt = host.updatedAt ? host.updatedAt.getTime() : Date.now();

    // Update in-memory presence snapshot so list APIs can merge realtime status.
    presenceStore.setHostPresence(host._id.toString(), {
      status,
      updatedAt,
      isOnline: host.isOnline,
      isBusy: host.isBusy,
      isLive: host.isLive,
    });

    io.emit("host_status_changed", {
      hostId: host._id.toString(),
      status,
      updatedAt,
    });
  } catch (error) {
    console.error("Error emitting host_status_changed event:", error);
  }
};

const round2 = (value) => Number((Number(value) || 0).toFixed(2));

const getRatePerMinute = ({ callMode, callType, host, gender }) => {
  const normalizedMode = (callMode || "").trim().toLowerCase();
  const normalizedType = (callType || "").trim().toLowerCase();
  const normalizedGender = (gender || "").trim().toLowerCase();
  const eff = resolveHostCallRates(host, global.settingJSON || {});

  if (normalizedMode === "private" && normalizedType === "audio") {
    return Math.abs(Number(eff.audioCallRate) || 0);
  }

  if (normalizedMode === "private" && normalizedType === "video") {
    return Math.abs(Number(eff.privateCallRate) || 0);
  }

  if (normalizedMode === "random" && normalizedType === "video") {
    if (normalizedGender === "female") return Math.abs(Number(eff.randomCallFemaleRate) || 0);
    if (normalizedGender === "male") return Math.abs(Number(eff.randomCallMaleRate) || 0);
    return Math.abs(Number(eff.randomCallRate) || 100);
  }

  return 0;
};

const getDiscountPercent = ({ callMode, callType, caller, vipPrivilege }) => {
  if (!caller?.isVip || !vipPrivilege) return 0;

  const normalizedMode = (callMode || "").trim().toLowerCase();
  const normalizedType = (callType || "").trim().toLowerCase();

  if (normalizedMode === "private" && normalizedType === "audio") {
    return Math.min(Math.max(Number(vipPrivilege.audioCallDiscount) || 0, 0), 100);
  }

  if (normalizedMode === "private" && normalizedType === "video") {
    return Math.min(Math.max(Number(vipPrivilege.privateCallDiscount) || 0, 0), 100);
  }

  if (normalizedMode === "random" && normalizedType === "video") {
    return Math.min(Math.max(Number(vipPrivilege.randomMatchCallDiscount) || 0, 0), 100);
  }

  return 0;
};

const buildCoinDistribution = ({ totalCoins, adminCommissionRate, agencyCommissionType, agencyCommission }) => {
  const safeTotalCoins = round2(totalCoins);
  const adminCoin = round2((safeTotalCoins * (Number(adminCommissionRate) || 0)) / 100);
  const poolAfterAdmin = round2(safeTotalCoins - adminCoin);

  let agencyCoin = 0;
  if (Number(agencyCommissionType) === 1) {
    agencyCoin = round2((poolAfterAdmin * (Number(agencyCommission) || 0)) / 100);
  }

  const hostCoin = round2(poolAfterAdmin - agencyCoin);
  const distributed = round2(hostCoin + adminCoin + agencyCoin);
  const diff = round2(safeTotalCoins - distributed);
  const hostCoinAdjusted = round2(hostCoin + diff);

  return {
    userCoin: safeTotalCoins,
    hostCoin: hostCoinAdjusted,
    adminCoin,
    agencyCoin,
  };
};

const finalizeCallBilling = async ({ callerId, receiverId, callId, callMode, callType, gender }) => {
  const [caller, receiver, callHistory, vipPrivilege] = await Promise.all([
    User.findById(callerId).select("_id coin spentCoins isVip").lean(),
    Host.findById(receiverId)
      .select("_id coin privateCallRate audioCallRate randomCallRate randomCallFemaleRate randomCallMaleRate agencyId useCustomCallRates")
      .lean(),
    History.findById(callId).select("_id userId hostId callStartTime callEndTime userCoin hostCoin adminCoin agencyCoin").lean(),
    VipPlanPrivilege.findOne().select("audioCallDiscount privateCallDiscount randomMatchCallDiscount").lean(),
  ]);

  if (!caller || !receiver || !callHistory) {
    console.log("[finalizeCallBilling] Caller, receiver, or call history missing. Skipping.");
    return;
  }

  if (!callHistory.callStartTime || !callHistory.callEndTime) {
    console.log("[finalizeCallBilling] Missing call start/end time. Skipping billing.");
    return;
  }

  const startTime = moment.tz(callHistory.callStartTime, "Asia/Kolkata");
  const endTime = moment.tz(callHistory.callEndTime, "Asia/Kolkata");
  const durationInSeconds = Math.max(0, endTime.diff(startTime, "seconds"));
  const durationInMinutes = Math.ceil(durationInSeconds / 60);

  // No billing for zero/invalid duration.
  if (durationInMinutes <= 0) return;

  const ratePerMinuteBeforeDiscount = getRatePerMinute({ callMode, callType, host: receiver, gender });
  const discountPercent = getDiscountPercent({ callMode, callType, caller, vipPrivilege });
  const discountAmount = Math.floor((ratePerMinuteBeforeDiscount * discountPercent) / 100);
  const ratePerMinute = Math.max(0, round2(ratePerMinuteBeforeDiscount - discountAmount));

  const expectedMinimum = round2(durationInMinutes * ratePerMinute);
  const alreadyDeductedUserCoin = round2(callHistory.userCoin || 0);
  const remainingCoins = round2(Math.max(0, expectedMinimum - alreadyDeductedUserCoin));

  console.log({
    callStartTime: callHistory.callStartTime,
    callEndTime: callHistory.callEndTime,
    durationInSeconds,
    durationInMinutes,
    ratePerMinute,
    totalCoins: expectedMinimum,
    alreadyDeductedUserCoin,
    remainingCoins,
  });

  if (expectedMinimum < 0) {
    throw new Error("Incorrect coin deduction detected");
  }

  if (remainingCoins <= 0) {
    return;
  }

  if (caller.coin < remainingCoins) {
    io.in(`globalRoom:${caller._id.toString()}`).emit("insufficientCoins", "You don't have sufficient coins.");
    throw new Error("Incorrect coin deduction detected");
  }

  const agency = receiver.agencyId
    ? await Agency.findById(receiver.agencyId).lean().select("_id commissionType commission")
    : null;

  const distribution = buildCoinDistribution({
    totalCoins: remainingCoins,
    adminCommissionRate: settingJSON?.adminCommissionRate || 0,
    agencyCommissionType: agency?.commissionType,
    agencyCommission: agency?.commission,
  });

  const checkTotal = round2(distribution.hostCoin + distribution.adminCoin + distribution.agencyCoin);
  if (checkTotal < remainingCoins) {
    throw new Error("Incorrect coin deduction detected");
  }

  const updates = [
    User.updateOne(
      { _id: caller._id, coin: { $gte: remainingCoins } },
      {
        $inc: {
          coin: -remainingCoins,
          spentCoins: remainingCoins,
        },
      },
    ),
    Host.updateOne({ _id: receiver._id }, { $inc: { coin: distribution.hostCoin } }),
    History.updateOne(
      { _id: callHistory._id, userId: caller._id, hostId: receiver._id },
      {
        $set: {
          agencyId: receiver.agencyId || null,
          date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        },
        $inc: {
          userCoin: distribution.userCoin,
          hostCoin: distribution.hostCoin,
          adminCoin: distribution.adminCoin,
          agencyCoin: distribution.agencyCoin,
        },
      },
    ),
  ];

  if (agency?._id) {
    updates.push(
      Agency.updateOne(
        { _id: agency._id },
        {
          $inc: {
            hostCoins: distribution.hostCoin,
            totalEarnings: distribution.agencyCoin,
            netAvailableEarnings: distribution.hostCoin + distribution.agencyCoin,
            totalEarningsWithCommissionAndHostCoin: distribution.hostCoin + distribution.agencyCoin,
          },
        },
      ),
    );
  }

  await Promise.all(updates);

  console.log("[finalizeCallBilling] Missing billing reconciled successfully.");
};

io.on("connection", async (socket) => {
  console.log("Socket Connection done Client ID: ", socket.id);

  const { globalRoom } = socket.handshake.query;
  const rawId = typeof globalRoom === "string" ? globalRoom.split(":")[1] : null;
  if (!rawId) {
    console.warn("Invalid or missing ID from globalRoom:", globalRoom, "| Socket ID:", socket.id);
    return;
  }

  // Clients should use Mongo ObjectId in `globalRoom:<id>`, but some clients may send `uniqueId`.
  // Resolve `uniqueId` → real _id to keep presence + events consistent.
  let canonicalId = rawId;
  if (!mongoose.Types.ObjectId.isValid(rawId)) {
    const [userByUniqueId, hostByUniqueId] = await Promise.all([
      User.findOne({ uniqueId: String(rawId) }).select("_id").lean(),
      Host.findOne({ uniqueId: String(rawId), status: 2 }).select("_id").lean(),
    ]);
    canonicalId = userByUniqueId?._id?.toString() || hostByUniqueId?._id?.toString() || rawId;
  }

  if (!mongoose.Types.ObjectId.isValid(canonicalId)) {
    console.warn("Unable to resolve globalRoom id to ObjectId:", { globalRoom, rawId });
    return;
  }

  console.log("Socket connected with:", canonicalId, rawId !== canonicalId ? `(resolved from ${rawId})` : "");

  if (globalRoom) {
    if (!socket.rooms.has(globalRoom)) {
      socket.join(globalRoom);
      console.log(`Socket joined room: ${globalRoom}`);
    } else {
      console.log(`Socket is already in room: ${globalRoom}`);
    }

    const canonicalRoom = `globalRoom:${canonicalId}`;
    if (!socket.rooms.has(canonicalRoom)) {
      socket.join(canonicalRoom);
      if (canonicalRoom !== globalRoom) console.log(`Socket also joined canonical room: ${canonicalRoom}`);
    }

    const [user, hostDoc] = await Promise.all([
      User.findById(canonicalId).select("_id").lean(),
      Host.findOne({ $or: [{ _id: canonicalId }, { userId: canonicalId }], status: 2 }).select("_id userId").lean(),
    ]);

    if (user) {
      await User.updateOne(
        { _id: user._id },
        { $set: { isOnline: true, lastActiveAt: new Date() } },
      );
    }

    if (hostDoc) {
      await Host.updateOne(
        { _id: hostDoc._id },
        { $set: { isOnline: true, lastActiveAt: new Date() } },
      );
      await emitHostStatus(hostDoc._id);

      // Also ensure the linked user is marked online if we found them via host profile
      if (!user && hostDoc.userId) {
        await User.updateOne(
          { _id: hostDoc.userId },
          { $set: { isOnline: true, lastActiveAt: new Date() } },
        );
      }
    }

    const uidStr = canonicalId.toString();
    if (!userIdToActiveSocketId.has(uidStr)) {
      userIdToActiveSocketId.set(uidStr, new Set());
    }
    userIdToActiveSocketId.get(uidStr).add(socket.id);

    socket.on("disconnect", () => {
      const set = userIdToActiveSocketId.get(uidStr);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) {
          userIdToActiveSocketId.delete(uidStr);
        }
      }
      global.activeChatUsers.delete(uidStr);
    });
  } else {
    console.warn("Invalid globalRoom format:", globalRoom);
  }

  // Topic presence tracking
  socket.on("joinChatTopic", (data) => {
    try {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      const { chatTopicId } = parsed || {};
      if (chatTopicId && canonicalId) {
        global.activeChatUsers.set(canonicalId.toString(), chatTopicId.toString());
        console.log(`[Presence] User ${canonicalId} entered chat topic ${chatTopicId}`);
      }
    } catch (e) {
      console.error("[joinChatTopic] Error:", e.message);
    }
  });

  socket.on("leaveChatTopic", () => {
    if (canonicalId) {
      global.activeChatUsers.delete(canonicalId.toString());
      console.log(`[Presence] User ${canonicalId} left chat topic`);
    }
  });

  //chat
  socket.on("chatMessageSent", async (data) => {
    try {
      const parseData = JSON.parse(data);
      console.log("🔹 Data in chatMessageSent:", parseData);

      const idOk = (v) => typeof v === "string" && v.trim() !== "" && mongoose.Types.ObjectId.isValid(v.trim());
      if (!idOk(parseData?.senderId) || !idOk(parseData?.receiverId) || !idOk(parseData?.chatTopicId)) {
        console.warn("chatMessageSent: missing or invalid senderId, receiverId, or chatTopicId — ignoring message.");
        return;
      }

      const senderId = parseData.senderId.trim();
      const receiverId = parseData.receiverId.trim();
      const chatTopicId = parseData.chatTopicId.trim();

      let senderPromise, receiverPromise;

      if (parseData?.senderRole === "user") {
        senderPromise = User.findById(senderId).lean().select("_id name image coin isVip gender fcmToken");
      } else if (parseData?.senderRole === "host") {
        senderPromise = Host.findById(senderId).lean().select("_id name image isFake coin");
      }

      if (parseData?.receiverRole === "host") {
        receiverPromise = Host.findById(receiverId).lean().select("_id name image fcmToken isBlock coin chatRate agencyId isFake");
      } else if (parseData?.receiverRole === "user") {
        receiverPromise = User.findById(receiverId).lean().select("_id name image fcmToken isBlock coin");
      }

      if (!senderPromise || !receiverPromise) {
        console.warn("chatMessageSent: unknown senderRole or receiverRole — ignoring message.", {
          senderRole: parseData?.senderRole,
          receiverRole: parseData?.receiverRole,
        });
        return;
      }

      const chatTopicPromise = ChatTopic.findById(chatTopicId).lean().select("_id senderId receiverId chatId messageCount aiConversationId");

      const [uniqueId, sender, receiver, chatTopic] = await Promise.all([generateHistoryUniqueId(), senderPromise, receiverPromise, chatTopicPromise]);

      if (!sender || !receiver || !chatTopic) {
        console.warn("chatMessageSent: sender, receiver, or chatTopic not found.", {
          sender: !!sender,
          receiver: !!receiver,
          chatTopic: !!chatTopic,
        });
        return;
      }

      const receiverForChat =
        receiver && parseData?.receiverRole === "host" ? hostWithEffectiveCallRates(receiver, global.settingJSON || {}) : receiver;

      // Type 1=Text, 2=Image, 3=Video, etc. All these should be saved.
      if (parseData?.messageType == 1 || parseData?.messageType == 2 || parseData?.messageType == 3) {
        if (parseData.senderRole === "user" && parseData.receiverRole === "host") {
          let maxFreeChatMessages = settingJSON.maxFreeChatMessages || 10;

          //Check if sender is VIP
          if (sender?.isVip) {
            const vipPrivilege = await VipPlanPrivilege.findOne().select("freeMessages").lean();
            if (vipPrivilege?.freeMessages) {
              maxFreeChatMessages = vipPrivilege.freeMessages;
            }
          }

          const isWithinFreeLimit = chatTopic.messageCount < maxFreeChatMessages;
          const chatRate = receiverForChat.chatRate || 10;

          if (!isWithinFreeLimit && sender?.coin < chatRate) {
            console.log("❌ Insufficient coins, message not sent.");
            io.in("globalRoom:" + chatTopic?.senderId?.toString()).emit("insufficientCoins", "Insufficient coins to send message.");
            return;
          }
        }

        const chat = new Chat({
          messageType: parseData?.messageType,
          senderId: parseData?.senderId,
          message: parseData?.message,
          image: parseData?.image || "",
          chatTopicId: chatTopic._id,
          date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        });

        await Promise.all([
          chat.save(),
          ChatTopic.updateOne(
            { _id: chatTopic._id },
            {
              $set: {
                chatId: chat._id,
                consecutiveNudgeCount: 0,
                lastSenderRole: parseData?.senderRole || "user",
                lastInteractionAt: new Date(),
                nextNudgeTime: new Date(Date.now() + 60 * 1000),
              },
              $inc: { messageCount: 1 },
            },
          ),
        ]);

        const eventData = {
          data,
          messageId: chat._id.toString(),
        };

        io.in("globalRoom:" + chatTopic?.senderId?.toString()).emit("chatMessageSent", eventData);
        io.in("globalRoom:" + chatTopic?.receiverId?.toString()).emit("chatMessageSent", eventData);

        if (parseData.senderRole === "user" && parseData.receiverRole === "host") {
          const maxFreeChatMessages = settingJSON.maxFreeChatMessages || 10;
          const adminCommissionRate = settingJSON.adminCommissionRate || 10;
          const isWithinFreeLimit = chatTopic.messageCount < maxFreeChatMessages;
          const chatRate = receiverForChat.chatRate || 10;

          let deductedCoins = 0;
          let adminShare = 0;
          let hostEarnings = 0;
          let agencyShare = 0;

          if (!isWithinFreeLimit && sender.coin >= chatRate) {
            deductedCoins = chatRate;
            adminShare = (chatRate * adminCommissionRate) / 100;
            hostEarnings = chatRate - adminShare;

            adminShare = Number(adminShare.toFixed(2));
            hostEarnings = Number(hostEarnings.toFixed(2));

            let agencyUpdate = null;
            if (receiver.agencyId) {
              const agency = await Agency.findById(receiver.agencyId).lean().select("_id commissionType commission");

              if (agency) {
                if (agency.commissionType === 1) {
                  // Percentage commission
                  agencyShare = (hostEarnings * agency.commission) / 100;
                } else {
                  // Fixed salary, ignore earnings share
                  agencyShare = 0;
                }

                agencyShare = Number(agencyShare.toFixed(2));

                agencyUpdate = Agency.updateOne(
                  { _id: agency._id },
                  {
                    $inc: {
                      hostCoins: hostEarnings,
                      totalEarnings: agencyShare,
                      netAvailableEarnings: hostEarnings + agencyShare,
                      totalEarningsWithCommissionAndHostCoin: hostEarnings + agencyShare,
                    },
                  },
                );
              }
            }

            await Promise.all([
              User.updateOne(
                { _id: sender._id, coin: { $gte: deductedCoins } },
                {
                  $inc: {
                    coin: -deductedCoins,
                    spentCoins: deductedCoins,
                  },
                },
              ),
              Host.updateOne({ _id: receiver._id }, { $inc: { coin: hostEarnings } }),
              History.create({
                uniqueId: uniqueId,
                type: 9,
                userId: sender._id,
                hostId: receiver._id,
                agencyId: receiver?.agencyId,
                userCoin: chatRate,
                hostCoin: hostEarnings,
                adminCoin: adminShare,
                agencyCoin: agencyShare,
                date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
              }),
              agencyUpdate,
            ]);

            console.log(`💰 Coins Deducted: ${deductedCoins} | Admin: ${adminShare} | Host Earnings: ${hostEarnings}`);
          }
        }

        if (receiver && receiver.fcmToken) {
          const isBlocked = await Block.findOne({
            $or: [
              { userId: sender._id, hostId: receiver._id },
              { userId: receiver._id, hostId: sender._id },
            ],
          });

          if (!isBlocked) {
            const payload = {
              token: receiver.fcmToken,
              data: {
                title: `${sender?.name} sent you a message 💌`,
                body: parseData?.messageType == 1 ? `🗨️ ${chat?.message}` : `🗨️ [Media Message]`,
                type: "CHAT",
                senderId: String(parseData?.senderId ?? ""),
                receiverId: String(parseData?.receiverId ?? ""),
                userName: String(sender?.name ?? ""),
                hostName: String(receiver?.name ?? ""),
                userImage: String(sender?.image ?? ""),
                hostImage: String(receiver?.image ?? ""),
                senderRole: String(parseData?.senderRole ?? ""),
                isOnline: String(parseData?.isOnline ?? ""),
                isFakeSender: String(parseData?.senderRole === "host" ? !!sender?.isFake : false),
              },
            };

            try {
              const adminInstance = await admin;
              const response = await adminInstance.messaging().send(payload);
              console.log("✅ Successfully sent FCM notification: ", response);
            } catch (error) {
              console.log("❌ Error sending FCM message:", error);
            }
          } else {
            console.log("🚫 Notification not sent. Block exists between sender and receiver.");
          }
        }
      } else {
        console.log("ℹ️ Other message type received (non-persisted):", parseData?.messageType);

        const eventData = {
          data,
          messageId: parseData?.messageId?.toString() || "",
        };

        io.in("globalRoom:" + chatTopic?.senderId?.toString()).emit("chatMessageSent", eventData);
        io.in("globalRoom:" + chatTopic?.receiverId?.toString()).emit("chatMessageSent", eventData);
      }

      // Check if the receiver is an active fake host and it's a message from user to host
      if (parseData?.senderRole === "user" && parseData?.receiverRole === "host" && receiver?.isFake === true && !receiver?.isBlock && receiver?.isOnline !== false) {
        // Emit typing event to sender
        io.in("globalRoom:" + chatTopic?.senderId?.toString()).emit("chatTyping", { isTyping: true, receiverId: receiver._id.toString() });

        // Call AI Backend asynchronously
        (async () => {
          try {
            // 1. Get profiles to find the AI profile ID
            let aiProfileId = null;
            const profilesRes = await fetch(`${DATING_AI_BASE_URL}/api/profiles`, {
              method: "GET",
              headers: createAIHeaders("GET", "/api/profiles")
            });
            if (profilesRes.ok) {
              const profiles = await profilesRes.json();
              const hostNameClean = (receiver.name || "").toLowerCase().trim();
              const profile = profiles.find((p) => (p.name || "").toLowerCase().trim() === hostNameClean);
              if (profile) {
                aiProfileId = profile.id || profile._id;
              } else if (profiles.length > 0) {
                aiProfileId = profiles[0].id || profiles[0]._id;
                console.warn(`[AI Chat] Profile matching host "${receiver.name}" not found. Falling back to profile ID ${aiProfileId}`);
              }
            } else {
              const errText = await profilesRes.text();
              console.error(`[AI Chat] Failed to fetch /api/profiles (status ${profilesRes.status}):`, errText);
            }
            if (!aiProfileId) throw new Error(`AI Profile not found for host "${receiver?.name}"`);

            // 2. Find or Create Conversation
            async function getOrCreateConversation(forceNew = false) {
              let convId = forceNew ? null : chatTopic.aiConversationId;
              if (!convId) {
                const query = `external_user_id=${sender._id.toString()}&profile_id=${aiProfileId}`;
                const convRes = await fetch(`${DATING_AI_BASE_URL}/api/conversations?${query}`, {
                  method: "GET",
                  headers: createAIHeaders("GET", "/api/conversations", null, query)
                });
                if (convRes.ok) {
                  const convs = await convRes.json();
                  if (convs.length > 0) convId = convs[0].conversation_id;
                }

                if (!convId) {
                  const rawGender = (sender?.gender ? String(sender.gender) : "").toLowerCase().trim();
                  const userGender = rawGender === "female" ? "female" : "male";
                  const userName = (sender?.name || "User").trim().slice(0, 60) || "User";

                  const createPayload = {
                    profile_id: aiProfileId,
                    external_user_id: sender._id.toString(),
                    user_gender: userGender,
                    user_name: userName
                  };
                  const createRes = await fetch(`${DATING_AI_BASE_URL}/api/conversations`, {
                    method: "POST",
                    headers: createAIHeaders("POST", "/api/conversations", createPayload),
                    body: JSON.stringify(createPayload)
                  });
                  if (createRes.ok) {
                    const convo = await createRes.json();
                    convId = convo.conversation_id;
                  } else {
                    const createErr = await createRes.text();
                    throw new Error(`Failed to create AI conversation: ${createErr}`);
                  }
                }

                // Cache the conversation id for future messages
                chatTopic.aiConversationId = convId;
                await ChatTopic.updateOne(
                  { _id: chatTopic._id },
                  { $set: { aiConversationId: convId } }
                );
              }
              return convId;
            }

            let conversationId = await getOrCreateConversation(false);

            // 3. Send message
            const msgPayload = { message: parseData?.message || "" };
            let msgPath = `/api/conversations/${conversationId}/messages`;
            let aiRes = await fetch(`${DATING_AI_BASE_URL}${msgPath}`, {
              method: "POST",
              headers: createAIHeaders("POST", msgPath, msgPayload),
              body: JSON.stringify(msgPayload),
            });

            // If 404 (conversation expired / not found on AI server), force recreate and retry
            if (aiRes.status === 404) {
              console.warn(`[AI Chat] Conversation ${conversationId} returned 404. Recreating conversation...`);
              conversationId = await getOrCreateConversation(true);
              msgPath = `/api/conversations/${conversationId}/messages`;
              aiRes = await fetch(`${DATING_AI_BASE_URL}${msgPath}`, {
                method: "POST",
                headers: createAIHeaders("POST", msgPath, msgPayload),
                body: JSON.stringify(msgPayload),
              });
            }

            if (aiRes.ok) {
              const aiResponseData = await aiRes.json();
              console.log("[AI Chat] Response from AI backend:", aiResponseData);

              function splitIntoNaturalBubbles(raw) {
                const result = [];
                for (const b of raw) {
                  const text = typeof b === "string" ? b : b?.message;
                  if (!text || typeof text !== "string") continue;
                  const clean = text.trim();
                  if (!clean) continue;

                  if (clean.includes("\n")) {
                    const lines = clean.split(/\n+/).map((s) => s.trim()).filter(Boolean);
                    if (lines.length > 1) {
                      lines.slice(0, 3).forEach((l) => result.push(l));
                      continue;
                    }
                  }

                  if (clean.length > 55) {
                    const sentences = clean.match(/[^.?!]+[.?!]+(?:\s+|$)|[^.?!]+$/g);
                    if (sentences && sentences.length > 1) {
                      const trimmed = sentences.map((s) => s.trim()).filter(Boolean);
                      if (trimmed.length === 2) {
                        trimmed.forEach((s) => result.push(s));
                        continue;
                      }
                      if (trimmed.length > 2) {
                        result.push(trimmed[0]);
                        result.push(trimmed.slice(1).join(" "));
                        continue;
                      }
                    }
                  }

                  result.push(clean);
                }
                return result.length > 0 ? result : ["Hello!"];
              }

              const rawBubbles = Array.isArray(aiResponseData?.messages) && aiResponseData.messages.length > 0
                ? aiResponseData.messages
                : [{ message: aiResponseData?.reply || aiResponseData?.response || "Hello!" }];

              const bubbles = splitIntoNaturalBubbles(rawBubbles);

              // 1. Initial realistic reading delay (1.5s - 2.8s)
              await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 1000) + 1500));

              for (let i = 0; i < bubbles.length; i++) {
                const bubbleText = bubbles[i];
                if (!bubbleText) continue;

                // Human-like typing delay: base thinking time (1.5s - 2.5s) + ~40ms per character
                const charDelay = (bubbleText.length || 20) * 40;
                const baseDelay = i === 0 ? Math.floor(Math.random() * 800) + 1500 : Math.floor(Math.random() * 500) + 1200;
                const totalDelay = Math.min(Math.max(baseDelay + charDelay, 2000), 5500);

                io.in("globalRoom:" + chatTopic?.senderId?.toString()).emit("chatTyping", { isTyping: true, receiverId: receiver._id.toString() });
                await new Promise((resolve) => setTimeout(resolve, totalDelay));

                const aiChat = new Chat({
                  messageType: 1,
                  senderId: receiver._id,
                  message: bubbleText,
                  image: "",
                  chatTopicId: chatTopic._id,
                  date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
                });

                await Promise.all([
                  aiChat.save(),
                  ChatTopic.updateOne(
                    { _id: chatTopic._id },
                    {
                      $set: {
                        chatId: aiChat._id,
                        lastSenderRole: "host",
                        lastInteractionAt: new Date(),
                        nextNudgeTime: new Date(Date.now() + Math.max(60 * 1000, ((Number(global.settingJSON?.messageInitiatedAt) || 1) * 60 * 1000))),
                      },
                      $inc: { messageCount: 1 }
                    },
                  ),
                ]);

                const aiEventData = {
                  data: JSON.stringify({
                    chatTopicId: chatTopic._id.toString(),
                    senderId: receiver._id.toString(),
                    receiverId: sender._id.toString(),
                    name: receiver?.name || "Host",
                    hostName: receiver?.name || "Host",
                    senderName: receiver?.name || "Host",
                    image: receiver?.image || "",
                    hostImage: receiver?.image || "",
                    senderImage: receiver?.image || "",
                    message: bubbleText,
                    messageType: 1,
                    senderRole: "host",
                    receiverRole: "user",
                    date: aiChat.date
                  }),
                  messageId: aiChat._id.toString(),
                };

                // Emit AI message
                io.in("globalRoom:" + chatTopic?.senderId?.toString()).emit("chatMessageSent", aiEventData);
                io.in("globalRoom:" + chatTopic?.receiverId?.toString()).emit("chatMessageSent", aiEventData);
              }

              // Stop typing
              io.in("globalRoom:" + chatTopic?.senderId?.toString()).emit("chatTyping", { isTyping: false, receiverId: receiver._id.toString() });
            } else {
              const errBody = await aiRes.text();
              console.error(`[AI Chat] Failed to send message to AI (status ${aiRes.status}):`, errBody);
              io.in("globalRoom:" + chatTopic?.senderId?.toString()).emit("chatTyping", { isTyping: false, receiverId: receiver._id.toString() });
            }
          } catch (err) {
            console.error("Error fetching AI reply:", err);
            io.in("globalRoom:" + chatTopic?.senderId?.toString()).emit("chatTyping", { isTyping: false, receiverId: receiver._id.toString() });
          }
        })();
      }

    } catch (err) {
      console.error("CRITICAL ERROR in chatMessageSent:", err);
    }
  });

  socket.on("chatGiftSent", async (data) => {
    try {
      const parseData = JSON.parse(data);
      console.log("🎁 Data in chatGiftSent:", parseData);

      let senderPromise, receiverPromise;

      if (parseData?.senderRole === "user") {
        senderPromise = User.findById(parseData?.senderId).lean().select("_id name coin name image");
      } else if (parseData?.senderRole === "host") {
        senderPromise = Host.findById(parseData?.senderId).lean().select("_id name coin name image");
      }

      if (parseData?.receiverRole === "host") {
        receiverPromise = Host.findById(parseData?.receiverId).lean().select("_id fcmToken isBlock coin agencyId name image");
      } else if (parseData?.receiverRole === "user") {
        receiverPromise = User.findById(parseData?.receiverId).lean().select("_id fcmToken isBlock coin name image");
      }

      const chatTopicPromise = ChatTopic.findById(parseData?.chatTopicId).lean().select("_id senderId receiverId chatId");
      const giftPromise = Gift.findById(parseData?.giftId).lean().select("_id coin image svgaImage type");

      const [uniqueId, sender, receiver, chatTopic, gift] = await Promise.all([generateHistoryUniqueId(), senderPromise, receiverPromise, chatTopicPromise, giftPromise]);

      if (!sender || !receiver || !chatTopic || !gift) {
        console.warn("chatGiftSent: missing data — ignoring.", {
          sender: !!sender,
          receiver: !!receiver,
          chatTopic: !!chatTopic,
          gift: !!gift,
        });
        return;
      }

      const giftPrice = gift?.coin || 0;
      const giftCount = parseData?.giftCount || 1;
      const totalGiftCost = giftPrice * giftCount;
      const adminCommissionRate = settingJSON.adminCommissionRate;

      if (sender?.coin < totalGiftCost) {
        console.log("❌ Insufficient coins, gift not sent.");
        io.in("globalRoom:" + chatTopic?.senderId?.toString()).emit("insufficientCoins", "Insufficient coins to send gift.");
        return;
      }

      const chat = new Chat({
        messageType: 4,
        message: `🎁 ${sender.name} sent a gift`,
        image: "",
        giftImage: gift.image || "",
        giftsvgaImage: gift.svgaImage || "",
        senderId: sender._id,
        chatTopicId: chatTopic._id,
        giftCount: giftCount,
        giftType: gift.type,
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      });

      await Promise.all([
        chat.save(),
        ChatTopic.updateOne(
          { _id: chatTopic._id },
          {
            $set: { chatId: chat._id },
          },
        ),
      ]);

      const eventData = {
        data,
        messageId: chat._id.toString(),
      };

      io.in("globalRoom:" + chatTopic?.senderId?.toString()).emit("chatGiftSent", eventData);
      io.in("globalRoom:" + chatTopic?.receiverId?.toString()).emit("chatGiftSent", eventData);

      let adminShare = 0;
      let hostEarnings = 0;
      let agencyShare = 0;

      adminShare = (totalGiftCost * adminCommissionRate) / 100;
      hostEarnings = totalGiftCost - adminShare;

      adminShare = Number(adminShare.toFixed(2));
      hostEarnings = Number(hostEarnings.toFixed(2));

      let agencyUpdate = null;
      if (receiver.agencyId) {
        const agency = await Agency.findById(receiver.agencyId).lean().select("_id commissionType commission");

        if (agency) {
          if (agency.commissionType === 1) {
            // Percentage commission
            agencyShare = (hostEarnings * agency.commission) / 100;
          } else {
            // Fixed salary, ignore earnings share
            agencyShare = 0;
          }

          agencyShare = Number(agencyShare.toFixed(2));

          agencyUpdate = Agency.updateOne(
            { _id: agency._id },
            {
              $inc: {
                hostCoins: hostEarnings,
                totalEarnings: agencyShare,
                netAvailableEarnings: hostEarnings + agencyShare,
                totalEarningsWithCommissionAndHostCoin: hostEarnings + agencyShare,
              },
            },
          );
        }
      }

      await Promise.all([
        User.updateOne(
          { _id: sender._id, coin: { $gte: totalGiftCost } },
          {
            $inc: {
              coin: -totalGiftCost,
              spentCoins: totalGiftCost,
            },
          },
        ),
        Host.updateOne({ _id: receiver._id }, { $inc: { coin: hostEarnings, totalGifts: 1 } }),
        History.create({
          uniqueId: uniqueId,
          type: 10,
          userId: sender._id,
          hostId: receiver._id,
          agencyId: receiver?.agencyId,
          giftId: gift._id,
          giftCoin: gift.coin || 0,
          giftImage: gift.image || "",
          giftsvgaImage: gift.svgaImage || "",
          giftType: gift.type || 1,
          giftCount: giftCount,
          userCoin: totalGiftCost,
          hostCoin: hostEarnings,
          adminCoin: adminShare,
          agencyCoin: agencyShare,
          date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        }),
        agencyUpdate,
      ]);

      console.log(`💰 Gift Sent | Cost: ${totalGiftCost} | Admin Share: ${adminShare} | Host Earnings: ${hostEarnings} | Agency Earnings: ${agencyShare}`);

      if (receiver && !receiver.isBlock && receiver.fcmToken) {
        const payload = {
          token: receiver.fcmToken,
          data: {
            title: `${sender.name} sent you a gift 🎁`,
            body: `💝 You received ${giftCount} gifts worth ${totalGiftCost} coins!`,
            type: "GIFT",
            giftCount: giftCount.toString(),
            senderId: String(parseData?.senderId ?? ""),
            receiverId: String(parseData?.receiverId ?? ""),
            isOnline: String(parseData?.isOnline ?? ""),
            userName: String(sender?.name ?? ""),
            userImage: String(sender?.image ?? ""),
            hostName: String(receiver?.name ?? ""),
            hostImage: String(receiver?.image ?? ""),
            senderRole: String(parseData?.senderRole ?? ""),
          },
        };

        try {
          const adminInstance = await admin;
          const response = await adminInstance.messaging().send(payload);
          console.log("✅ Successfully sent FCM notification for gift:", response);
        } catch (error) {
          console.log("❌ Error sending FCM message:", error);
        }
      }
    } catch (err) {
      console.error("CRITICAL ERROR in chatGiftSent:", err);
    }
  });

  socket.on("chatMessageSeen", async (data) => {
    try {
      const parsedData = JSON.parse(data);
      console.log("🔹 Data in chatMessageSeen event:", parsedData);

      const updated = await Chat.findByIdAndUpdate(parsedData.messageId, { $set: { isRead: true } }, { new: true, lean: true, select: "_id isRead" });

      if (!updated) {
        console.log(`No message found with ID ${parsedData.messageId}`);
      } else {
        console.log(`Updated isRead to true for message with ID: ${updated._id}`);
      }
    } catch (error) {
      console.error("Error updating chatMessageSeen:", error);
    }
  });

  //private video call
  socket.on("callRinging", async (data) => {
    try {
      const parsedData = JSON.parse(data);
      console.log("callRinging request received:", parsedData);

      const { callerId, receiverId, agoraUID, channel, callType, callerRole, receiverRole } = parsedData;

      const validRoles = ["user", "host"];
      if (!validRoles.includes(callerRole?.toLowerCase()) || !validRoles.includes(receiverRole?.toLowerCase())) {
        io.in("globalRoom:" + callerId.toString()).emit("callRinging", { message: "Invalid roles provided." });
        return;
      }

      const callerModel = callerRole.trim().toLowerCase() === "user" ? User : Host;
      const receiverModel = receiverRole.trim().toLowerCase() === "host" ? Host : User;

      const role = RtcRole.PUBLISHER;
      const uid = agoraUID ? agoraUID : 0;
      const expirationTimeInSeconds = 24 * 3600;
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

      const [callUniqueId, token, caller, receiver] = await Promise.all([
        generateHistoryUniqueId(),
        RtcTokenBuilder.buildTokenWithUid(settingJSON?.agoraAppId, settingJSON?.agoraAppCertificate, channel, uid, role, privilegeExpiredTs),
        callerModel.findById(callerId).select("_id name image isBlock isBusy callId isOnline uniqueId").lean(),
        receiverModel.findById(receiverId).select("_id name image isBlock isBusy callId isOnline uniqueId fcmToken").lean(),
      ]);

      if (!caller) {
        io.in("globalRoom:" + callerId.toString()).emit("callRinging", { message: "Caller does not found." });
        return;
      }

      if (caller.isBlock) {
        io.in("globalRoom:" + callerId.toString()).emit("callRinging", {
          message: "Caller is blocked.",
          isBlock: true,
        });
        return;
      }

      if (caller.isBusy && caller.callId) {
        io.in("globalRoom:" + callerId.toString()).emit("callRinging", {
          message: "Caller is busy with someone else.",
          isBusy: true,
        });
        return;
      }

      if (!receiver) {
        io.in("globalRoom:" + callerId.toString()).emit("callRinging", { message: "Receiver does not found." });
        return;
      }

      if (receiver.isBlock) {
        io.in("globalRoom:" + callerId.toString()).emit("callRinging", {
          message: "Receiver is blocked.",
          isBlock: true,
        });
        return;
      }

      if (!receiver.isOnline) {
        io.in("globalRoom:" + callerId.toString()).emit("callRinging", {
          message: "Receiver is not online.",
          isOnline: false,
        });
        return;
      }

      if (receiver.isBusy && receiver.callId) {
        io.in("globalRoom:" + callerId.toString()).emit("callRinging", {
          message: "Receiver is busy with another call.",
          isBusy: true,
        });
        return;
      }

      if (!receiver.isBusy && receiver.callId === null) {
        console.log("Receiver and Caller are free. Proceeding with call setup.");

        const callHistory = new History();
        callHistory.uniqueId = callUniqueId;

        const [callerVerify, receiverVerify] = await Promise.all([
          callerModel.updateOne(
            {
              _id: caller._id,
              isBlock: false,
              isOnline: true,
              isBusy: false,
              callId: null,
              ...(callerRole.trim().toLowerCase() === "host" ? { isFake: false, isLive: false } : {}),
            },
            {
              $set: {
                isBusy: true,
                callId: callHistory._id.toString(),
              },
            },
          ),
          receiverModel.updateOne(
            {
              _id: receiver._id,
              isBlock: false,
              isOnline: true,
              isBusy: false,
              callId: null,
              ...(receiverRole.trim().toLowerCase() === "host" ? { isFake: false, isLive: false } : {}),
            },
            {
              $set: {
                isBusy: true,
                callId: callHistory._id.toString(),
              },
            },
          ),
        ]);

        if (callerVerify.modifiedCount > 0 && receiverVerify.modifiedCount > 0) {
          const dataOfVideoCall = {
            callId: callHistory._id,
            callerId: caller._id,
            callerName: caller.name,
            callerImage: caller.image,
            callerUniqueId: caller.uniqueId,
            receiverId: receiver._id,
            receiverName: receiver.name,
            receiverImage: receiver.image,
            receiverUniqueId: receiver.uniqueId,
            callType: callType.trim().toLowerCase(),
            callMode: "private",
            callerRole,
            receiverRole,
            token,
            channel,
          };

          io.in("globalRoom:" + receiver._id.toString()).emit("callIncoming", dataOfVideoCall); // Notify receiver
          io.in("globalRoom:" + caller._id.toString()).emit("callConnected", dataOfVideoCall); // Notify caller

          if (!receiver.isBlock && receiver.fcmToken !== null) {
            const isVideo = callType?.trim().toLowerCase() === "video";
            const callerName = caller?.name?.trim() || "Someone";

            const notificationTitle = isVideo ? "📹 Video Call Request" : "📞 Audio Call Request";
            const notificationBody = isVideo
              ? `${callerName} is inviting you to a video call. Tap to connect now! 👥`
              : `${callerName} is calling you for an audio chat. Tap to join the conversation! 📞`;

            const payload = {
              token: receiver.fcmToken,
              data: {
                title: notificationTitle,
                body: notificationBody,
                type: "callIncoming",
                callType: String(dataOfVideoCall.callType),
                callId: String(dataOfVideoCall.callId),
                callerId: String(dataOfVideoCall.callerId),
                receiverId: String(dataOfVideoCall.receiverId),
                callerName: String(dataOfVideoCall.callerName),
                callerImage: String(dataOfVideoCall.callerImage),
                callerUniqueId: String(dataOfVideoCall.callerUniqueId),
                receiverName: String(dataOfVideoCall.receiverName),
                receiverImage: String(dataOfVideoCall.receiverImage),
                receiverUniqueId: String(dataOfVideoCall.receiverUniqueId),
                token: String(dataOfVideoCall.token),
                channel: String(dataOfVideoCall.channel),
                callMode: String(dataOfVideoCall.callMode),
                gender: String(dataOfVideoCall.gender || ""),
              },
            };

            try {
              const adminInstance = await admin;
              await adminInstance.messaging().send(payload);
              console.log("📨 Call notification sent successfully");
            } catch (fcmError) {
              console.error("⚠️ Failed to send call notification:", fcmError);
            }
          }

          console.log(`Call successfully initiated: ${caller.name} → ${receiver.name}`);

          callHistory.type = callType?.trim()?.toLowerCase() === "audio" ? 11 : callType?.trim()?.toLowerCase() === "video" ? 12 : null;
          callHistory.callType = callType?.trim()?.toLowerCase();
          callHistory.isPrivate = true;

          // CORRECT MAPPING: Determine who is the User and who is the Host for History fields
          if (callerRole.trim().toLowerCase() === "user") {
            callHistory.userId = caller._id;
            callHistory.hostId = receiver._id;
          } else {
            callHistory.userId = receiver._id;
            callHistory.hostId = caller._id;
          }

          callHistory.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

          await Promise.all([
            callHistory.save(),
            Privatecall({
              caller: caller._id,
              receiver: receiver._id,
            }).save(),
          ]);
        } else {
          console.log("Failed to verify caller or receiver availability (Racing condition)");

          io.in("globalRoom:" + caller._id.toString()).emit("callRinging", {
            message: "Call setup failed. One or both users became unavailable.",
            isBusy: true,
          });

          // Cleanup if one of them was updated
          if (callerVerify.modifiedCount > 0) {
            await callerModel.updateOne({ _id: callerId, callId: callHistory._id.toString() }, { $set: { isBusy: false, callId: null } });
          }
          if (receiverVerify.modifiedCount > 0) {
            await receiverModel.updateOne({ _id: receiverId, callId: callHistory._id.toString() }, { $set: { isBusy: false, callId: null } });
          }
        }
      } else {
        console.log("Condition not met - receiver not available or busy");
        io.in("globalRoom:" + callerId.toString()).emit("callRinging", {
          message: "Receiver is unavailable for a call at this moment.",
          isBusy: true,
        });
      }
    } catch (err) {
      console.error("CRITICAL ERROR in callRinging:", err);
    }
  });

  socket.on("callResponseHandled", async (data) => {
    try {
      const parsedData = JSON.parse(data);
      const { callerId, receiverId, callId, isAccept, callType, callMode, callerRole, receiverRole } = parsedData;
      console.log("🟢 [callResponseHandled] Event received:", parsedData);

      const callerRoom = `globalRoom:${callerId}`;
      const receiverRoom = `globalRoom:${receiverId}`;

      console.log(`🔄 Fetching call history for resilience lookup, callId: ${callId}`);

      const callHistory = await History.findById(callId).select("-uniqueId").lean();

      if (!callHistory) {
        console.error("❌ [callResponseHandled] Call history not found for ID:", callId);
        return io.to(callerRoom).emit("callResponseHandled", { message: "Call history not found." });
      }

      console.log(`✅ History Found: UserId=${callHistory.userId}, HostId=${callHistory.hostId}`);

      const [user, host] = await Promise.all([
        User.findById(callHistory.userId).select("_id name isBusy callId coin").lean(),
        Host.findById(callHistory.hostId).select("_id name isBusy callId coin agencyId").lean(),
      ]);

      if (!user || !host) {
        console.error("❌ [callResponseHandled] Linked User or Host not found.", { user: !!user, host: !!host });
        return io.to(callerRoom).emit("callResponseHandled", { message: "Participant data missing." });
      }

      // Source of truth for caller/receiver logic (we know caller started it)
      // In callRinging, caller was userId if role was user, or hostId if role was host.
      // But for simplicity in these handlers, we'll just refer to "user" and "host" variables since they are found.

      if (callMode.trim().toLowerCase() === "private") {
        if (!isAccept && (user.callId?.toString() === callId.toString() || host.callId?.toString() === callId.toString())) {
          console.log(`📵 [callResponseHandled] Call rejected by receiver ${host.name}`);

          io.to(callerRoom).emit("callRejected", data);
          io.to(receiverRoom).emit("callRejected", data);

          await Promise.all([
            User.updateOne({ _id: user._id }, { $set: { isBusy: false, callId: null } }),
            Host.updateOne({ _id: host._id }, { $set: { isBusy: false, callId: null } }),
            Privatecall.deleteOne({ caller: callHistory.userId, receiver: callHistory.hostId }),
          ]);

          let chatTopic = await ChatTopic.findOne({
            $or: [
              { $and: [{ senderId: user._id }, { receiverId: host._id }] },
              { $and: [{ senderId: host._id }, { receiverId: user._id }] },
            ],
          });

          const chat = new Chat({
            chatTopicId: chatTopic?._id,
            senderId: receiverId, // The one who responded (rejected)
            messageType: callType.trim().toLowerCase() === "audio" ? 5 : 6,
            message: callType.trim().toLowerCase() === "audio" ? "📞 Audio Call" : "📽 Video Call",
            callType: 2, // 2.declined
            callId: callId,
            isRead: true,
            date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
          });

          if (!chatTopic) {
            chatTopic = new ChatTopic({
              chatId: chat._id,
              senderId: user._id,
              receiverId: host._id,
            });
            chat.chatTopicId = chatTopic._id;
            await chatTopic.save();
          } else {
            chatTopic.chatId = chat._id;
            await chatTopic.save();
          }

          await Promise.all([chat.save(), History.updateOne({ _id: callId }, { $set: { callConnect: false } })]);
          console.log("✅ Call rejection processed.");
          return;
        }

        if (isAccept && (user.callId?.toString() === callId.toString() || host.callId?.toString() === callId.toString())) {
          console.log(`📞 [callResponseHandled] Call accepted by receiver ${host.name}`);

          const privateCallDelete = await Privatecall.deleteOne({
            $or: [
              { caller: user._id, receiver: host._id },
              { caller: host._id, receiver: user._id },
            ],
          });

          if (privateCallDelete?.deletedCount > 0) {
            console.log("🟢 Call accepted via Privatecall match.");

            const [callerSockets, receiverSockets] = await Promise.all([io.in(callerRoom).fetchSockets(), io.in(receiverRoom).fetchSockets()]);

            [...callerSockets, ...receiverSockets].forEach((s) => {
              if (!s.rooms.has(callId.toString())) s.join(callId.toString());
            });

            io.to(callId.toString()).emit("callAnswerReceived", data);

            let chatTopic = await ChatTopic.findOne({
              $or: [
                { $and: [{ senderId: user._id }, { receiverId: host._id }] },
                { $and: [{ senderId: host._id }, { receiverId: user._id }] },
              ],
            });

            const chat = new Chat({
              chatTopicId: chatTopic?._id,
              senderId: receiverId,
              messageType: callType.trim().toLowerCase() === "audio" ? 5 : 6,
              message: callType.trim().toLowerCase() === "audio" ? "📞 Audio Call" : "📽 Video Call",
              callType: 1, //1.received
              callId: callId,
              date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
            });

            if (!chatTopic) {
              chatTopic = new ChatTopic({
                chatId: chat._id,
                senderId: user._id,
                receiverId: host._id,
              });
              chat.chatTopicId = chatTopic._id;
              await chatTopic.save();
            } else {
              chatTopic.chatId = chat._id;
              await chatTopic.save();
            }

            await Promise.all([
              chat.save(),
              User.updateOne({ _id: user._id }, { $set: { isBusy: true, callId: callId } }),
              Host.updateOne({ _id: host._id }, { $set: { isBusy: true, callId: callId } }),
              History.updateOne({ _id: callId }, { $set: { callConnect: true, callStartTime: moment().tz("Asia/Kolkata").format() } }),
            ]);

            await emitHostStatus(host._id);
            console.log("✅ Call connected and history updated.");
          } else {
            console.log(`🚨 Call already disconnected or matched record missing.`);
            io.to(receiverRoom).emit("callAutoEnded", data);
            await Promise.all([
              User.updateOne({ _id: user._id, callId: callId }, { $set: { isBusy: false, callId: null } }),
              Host.updateOne({ _id: host._id, callId: callId }, { $set: { isBusy: false, callId: null } }),
            ]);
            await emitHostStatus(host._id);
          }
        }
      }

      if (callMode.trim().toLowerCase() === "random") {
        if (!isAccept) {
          console.log(`📵 [callResponseHandled] Random call rejected.`);
          io.to(callerRoom).emit("callRejected", data);
          io.to(receiverRoom).emit("callRejected", data);
          await Promise.all([
            User.updateOne({ _id: user._id }, { $set: { isBusy: false, callId: null } }),
            Host.updateOne({ _id: host._id }, { $set: { isBusy: false, callId: null } }),
            Randomcall.deleteOne({ caller: user._id }),
          ]);
          return;
        }

        if (isAccept) {
          const randomCallDeleted = await Randomcall.deleteOne({ caller: user._id });
          if (randomCallDeleted?.deletedCount > 0) {
            const [callerSockets, receiverSockets] = await Promise.all([io.in(callerRoom).fetchSockets(), io.in(receiverRoom).fetchSockets()]);
            [...callerSockets, ...receiverSockets].forEach((s) => {
              if (!s.rooms.has(callId.toString())) s.join(callId.toString());
            });

            io.to(callId.toString()).emit("callAnswerReceived", data);

            await Promise.all([
              User.updateOne({ _id: user._id }, { $set: { isBusy: true, callId: callId } }),
              Host.updateOne({ _id: host._id }, { $set: { isBusy: true, callId: callId } }),
              History.updateOne({ _id: callId }, { $set: { callConnect: true, callStartTime: moment().tz("Asia/Kolkata").format() } }),
            ]);

            await emitHostStatus(host._id);
          } else {
            io.to(receiverRoom).emit("callAutoEnded", data);
            await Promise.all([
              User.updateOne({ _id: user._id, callId: callId }, { $set: { isBusy: false, callId: null } }),
              Host.updateOne({ _id: host._id, callId: callId }, { $set: { isBusy: false, callId: null } }),
            ]);
          }
        }
      }
    } catch (error) {
      console.error("❌ [callResponseHandled] Error:", error);
    }
  });

  socket.on("callCancelled", async (data) => {
    try {
      const parseData = JSON.parse(data);
      const { callerId, receiverId, callId, callType, callMode } = parseData;
      console.log("🟢 [callCancelled] Event received:", parseData);

      const callerRoom = `globalRoom:${callerId}`;
      const receiverRoom = `globalRoom:${receiverId}`;

      console.log(`🔄 Fetching call history for resilience lookup, callId: ${callId}`);
      const callHistory = await History.findById(callId).lean();

      if (!callHistory) {
        console.error("❌ [callCancelled] Invalid call history.");
        return io.to(callerRoom).emit("callCancelFailed", { message: "Invalid call data." });
      }

      const [user, host] = await Promise.all([
        User.findById(callHistory.userId).select("_id name fcmToken isBlock").lean(),
        Host.findById(callHistory.hostId).select("_id name fcmToken isBlock").lean(),
      ]);

      if (!user || !host) {
        console.error("❌ [callCancelled] User or Host missing for history lookup.");
        return;
      }

      io.to(callerRoom).emit("callFinished", data);
      io.to(receiverRoom).emit("callFinished", data);

      console.log(`✅ Caller: ${user.name} | Receiver: ${host.name} | Call ID: ${callId}`);

      if (callMode.trim().toLowerCase() === "private") {
        await Promise.all([
          User.updateOne({ _id: user._id }, { $set: { isBusy: false, callId: null } }),
          Host.updateOne({ _id: host._id }, { $set: { isBusy: false, callId: null } }),
          Privatecall.deleteOne({ caller: user._id, receiver: host._id }),
        ]);

        await emitHostStatus(host._id);
      }

      if (callMode.trim().toLowerCase() === "random") {
        await Promise.all([
          User.updateOne({ _id: user._id }, { $set: { isBusy: false, callId: null } }),
          Host.updateOne({ _id: host._id }, { $set: { isBusy: false, callId: null } }),
          Randomcall.deleteOne({ caller: user._id }),
        ]);
        await emitHostStatus(host._id);
      }

      let chatTopic = await ChatTopic.findOne({
        $or: [
          { $and: [{ senderId: user._id }, { receiverId: host._id }] },
          { $and: [{ senderId: host._id }, { receiverId: user._id }] },
        ],
      });

      const chat = new Chat({
        chatTopicId: chatTopic?._id,
        callId: callHistory._id,
        senderId: callHistory.userId,
        messageType: callType.trim().toLowerCase() === "audio" ? 5 : 6,
        message: callType.trim().toLowerCase() === "audio" ? "📞 Audio Call" : "📽 Video Call",
        callType: 3,
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        isRead: true,
      });

      if (!chatTopic) {
        chatTopic = new ChatTopic({
          chatId: chat._id,
          senderId: user._id,
          receiverId: host._id,
        });
        chat.chatTopicId = chatTopic._id;
        await chatTopic.save();
      } else {
        chatTopic.chatId = chat._id;
        await chatTopic.save();
      }

      await Promise.all([chat.save(), History.updateOne({ _id: callId }, { $set: { callConnect: false } })]);

      if (!host.isBlock && host.fcmToken) {
        const payload = {
          token: host.fcmToken,
          data: {
            title: `📞 Missed Call from ${user.name || "Someone"} ⏳`,
            body: `You missed a call from ${user.name || "Someone"}. Tap to reconnect now! 🔄✨`,
            type: "missedCall",
          },
        };

        try {
          const adminInstance = await admin;
          await adminInstance.messaging().send(payload);
          console.log("✅ Missed call notification sent.");
        } catch (fcmError) {
          console.log("❌ Error sending missed call FCM:", fcmError);
        }
      }
    } catch (err) {
      console.error("CRITICAL ERROR in callCancelled:", err);
    }
  });

  socket.on("callDisconnected", async (data) => {
    try {
      const parseData = JSON.parse(data);
      const { callerId, receiverId, callId, callType, callMode, callerRole, receiverRole } = parseData;
      console.log("[callDisconnected]", "data in callDisconnected:", parseData);

      const callerRoom = `globalRoom:${callerId}`;

      console.log(`🔄 Fetching call history for resilience lookup, callId: ${callId}`);
      const callHistory = await History.findById(callId).lean();

      if (!callHistory) {
         console.error("❌ [callDisconnected] Invalid call history.");
         return io.to(callerRoom).emit("callTerminationFailed", { message: "Invalid call data." });
      }

      const [user, host] = await Promise.all([
        User.findById(callHistory.userId).select("_id name").lean(),
        Host.findById(callHistory.hostId).select("_id name").lean(),
      ]);

      if (!user || !host) {
        console.error("❌ [callDisconnected] User or Host missing for history lookup.");
        return;
      }

      io.to(callId.toString()).emit("callDisconnected", data);
      io.socketsLeave(callId.toString());

      console.log(`✅ Caller: ${user.name} | Receiver: ${host.name} | Call ID: ${callId}`);

      if (callMode.trim().toLowerCase() === "private") {
        await Promise.all([
          User.updateOne({ _id: user._id }, { $set: { isBusy: false, callId: null } }),
          Host.updateOne({ _id: host._id }, { $set: { isBusy: false, callId: null } }),
          Privatecall.deleteOne({ caller: user._id, receiver: host._id }),
        ]);

        await emitHostStatus(host._id);
      }

      if (callMode.trim().toLowerCase() === "random") {
        await Promise.all([
          User.updateOne({ _id: user._id }, { $set: { isBusy: false, callId: null } }),
          Host.updateOne({ _id: host._id }, { $set: { isBusy: false, callId: null } }),
          Randomcall.deleteOne({ caller: user._id }),
        ]);

        await emitHostStatus(host._id);
      }

      const updatedHistory = await History.findByIdAndUpdate(
        callId,
        {
          $set: {
            callConnect: false,
            callEndTime: moment().tz("Asia/Kolkata").format(),
          },
        },
        { new: true }
      );

      if (updatedHistory && updatedHistory.callStartTime) {
        const start = moment.tz(updatedHistory.callStartTime, "Asia/Kolkata");
        const end = moment.tz(updatedHistory.callEndTime, "Asia/Kolkata");
        const duration = moment.utc(end.diff(start)).format("HH:mm:ss");

        await Promise.all([
            History.updateOne({ _id: callId }, { $set: { duration: duration } }),
            Chat.findOneAndUpdate(
              { callId: callId },
              {
                $set: {
                  callDuration: duration,
                  messageType: callType.trim().toLowerCase() === "audio" ? 5 : 6,
                  message: callType.trim().toLowerCase() === "audio" ? "📞 Audio Call" : "📽 Video Call",
                  callType: 1, // 1 = Received Call
                  isRead: true,
                },
              }
            )
        ]);
      }

      try {
        await finalizeCallBilling({
          callerId: callHistory.userId, // Initiate billing using true userId
          receiverId: callHistory.hostId, // Using true hostId
          callId: callId,
          callMode,
          callType,
        });
      } catch (billingError) {
        console.error("[callDisconnected] Billing reconciliation failed:", billingError);
      }
    } catch (err) {
      console.error("CRITICAL ERROR in callDisconnected:", err);
    }
  });

  socket.on("callCoinCharged", async (data) => {
    try {
      const parsedData = JSON.parse(data);
      console.log("[callCoinCharged] Parsed Data:", parsedData);

      const { callId, callMode, gender } = parsedData;

      const callHistory = await History.findById(callId).select("_id userId hostId callType isPrivate isRandom").lean();

      if (!callHistory) {
        console.log("[callCoinCharged] CallHistory not found!");
        return;
      }

      console.log(`[callCoinCharged] History match: User=${callHistory.userId}, Host=${callHistory.hostId}`);

      const [user, hostRaw, vipPrivilege] = await Promise.all([
        User.findById(callHistory.userId).select("_id coin isVip").lean(),
        Host.findById(callHistory.hostId)
          .select("_id coin privateCallRate audioCallRate randomCallRate randomCallFemaleRate randomCallMaleRate agencyId useCustomCallRates")
          .lean(),
        VipPlanPrivilege.findOne().select("audioCallDiscount privateCallDiscount randomMatchCallDiscount").lean(),
      ]);

      if (!user || !hostRaw) {
        console.log("[callCoinCharged] User or Host not found for history IDs!", { user: !!user, host: !!hostRaw });
        return;
      }

      const caller = user;
      const receiverRaw = hostRaw;

      const receiver = hostWithEffectiveCallRates(receiverRaw, global.settingJSON || {});

      if (callMode?.toLowerCase()?.trim() === "private" && callHistory.callType?.toLowerCase()?.trim() === "audio") {
        const adminCommissionRate = settingJSON?.adminCommissionRate;
        let audioCallCharge = Math.abs(receiver.audioCallRate);
        let audioCallDiscount = 0;

        // Check if user is VIP and apply discount
        if (caller.isVip && caller.vipPrivilege) {
          audioCallDiscount = Math.min(Math.max(vipPrivilege.audioCallDiscount || 0, 0), 100);

          const discountAmount = Math.floor((audioCallCharge * audioCallDiscount) / 100);
          audioCallCharge = audioCallCharge - discountAmount;
        }

        if (caller.coin >= audioCallCharge) {
          let agency = null;
          let agencyUpdate = null;
          if (receiver.agencyId) {
            agency = await Agency.findById(receiver.agencyId).lean().select("_id commissionType commission");
          }

          const distribution = buildCoinDistribution({
            totalCoins: audioCallCharge,
            adminCommissionRate,
            agencyCommissionType: agency?.commissionType,
            agencyCommission: agency?.commission,
          });

          if (agency) {
            agencyUpdate = Agency.updateOne(
              { _id: agency._id },
              {
                $inc: {
                  hostCoins: distribution.hostCoin,
                  totalEarnings: distribution.agencyCoin,
                  netAvailableEarnings: distribution.hostCoin + distribution.agencyCoin,
                  totalEarningsWithCommissionAndHostCoin: distribution.hostCoin + distribution.agencyCoin,
                },
              },
            );
          }

          console.log(
            `[callCoinCharged] Deducting ${audioCallCharge} coins from Caller: ${caller._id}, Admin Share: ${distribution.adminCoin}, Host Earnings: ${distribution.hostCoin}, Agency: ${distribution.agencyCoin}`,
          );

          await Promise.all([
            User.updateOne(
              { _id: caller._id, coin: { $gte: audioCallCharge } },
              {
                $inc: {
                  coin: -audioCallCharge,
                  spentCoins: audioCallCharge,
                },
              },
            ),
            Host.updateOne({ _id: receiver._id }, { $inc: { coin: distribution.hostCoin } }),
            History.updateOne(
              { _id: callHistory._id, userId: caller._id, hostId: receiver._id },
              {
                $set: {
                  agencyId: receiver.agencyId,
                  date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
                },
                $inc: {
                  userCoin: audioCallCharge,
                  hostCoin: distribution.hostCoin,
                  adminCoin: distribution.adminCoin,
                  agencyCoin: distribution.agencyCoin,
                },
              },
            ),
            agencyUpdate,
          ]);

          console.log("[callCoinCharged] Coin deduction and history update successful.");
        } else {
          console.log(`[callCoinCharged] Insufficient Coins for Caller: ${caller._id}`);
          io.in("globalRoom:" + caller._id.toString()).emit("insufficientCoins", "You don't have sufficient coins.");
        }
      }

      if (callMode?.toLowerCase()?.trim() === "private" && callHistory.callType?.toLowerCase()?.trim() === "video" && callHistory.isPrivate) {
        const adminCommissionRate = settingJSON?.adminCommissionRate;
        let privateCallCharge = Math.abs(receiver.privateCallRate);
        let privateCallDiscount = 0;

        // Check if user is VIP and apply discount
        if (caller.isVip && vipPrivilege) {
          privateCallDiscount = Math.min(Math.max(vipPrivilege.privateCallDiscount || 0, 0), 100);

          const discountAmount = Math.floor((privateCallCharge * privateCallDiscount) / 100);
          privateCallCharge = privateCallCharge - discountAmount;
        }

        if (caller.coin >= privateCallCharge) {
          let agency = null;
          let agencyUpdate = null;
          if (receiver.agencyId) {
            agency = await Agency.findById(receiver.agencyId).lean().select("_id commissionType commission");
          }

          const distribution = buildCoinDistribution({
            totalCoins: privateCallCharge,
            adminCommissionRate,
            agencyCommissionType: agency?.commissionType,
            agencyCommission: agency?.commission,
          });

          if (agency) {
            agencyUpdate = Agency.updateOne(
              { _id: agency._id },
              {
                $inc: {
                  hostCoins: distribution.hostCoin,
                  totalEarnings: distribution.agencyCoin,
                  netAvailableEarnings: distribution.hostCoin + distribution.agencyCoin,
                  totalEarningsWithCommissionAndHostCoin: distribution.hostCoin + distribution.agencyCoin,
                },
              },
            );
          }

          console.log(
            `[callCoinCharged] Deducting ${privateCallCharge} coins from Caller: ${caller._id}, Admin Share: ${distribution.adminCoin}, Host Earnings: ${distribution.hostCoin}, Agency: ${distribution.agencyCoin}`,
          );

          await Promise.all([
            User.updateOne(
              { _id: caller._id, coin: { $gte: privateCallCharge } },
              {
                $inc: {
                  coin: -privateCallCharge,
                  spentCoins: privateCallCharge,
                },
              },
            ),
            Host.updateOne({ _id: receiver._id }, { $inc: { coin: distribution.hostCoin } }),
            History.updateOne(
              { _id: callHistory._id, userId: caller._id, hostId: receiver._id },
              {
                $set: {
                  agencyId: receiver.agencyId,
                  date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
                },
                $inc: {
                  userCoin: privateCallCharge,
                  hostCoin: distribution.hostCoin,
                  adminCoin: distribution.adminCoin,
                  agencyCoin: distribution.agencyCoin,
                },
              },
            ),
            agencyUpdate,
          ]);

          console.log("[callCoinCharged] Coin deduction and history update successful.");
        } else {
          console.log(`[callCoinCharged] Insufficient Coins for Caller: ${caller._id}`);
          io.in("globalRoom:" + caller._id.toString()).emit("insufficientCoins", "You don't have sufficient coins.");
        }
      }

      if (callMode?.toLowerCase()?.trim() === "random" && callHistory.callType?.toLowerCase()?.trim() === "video" && callHistory.isRandom) {
        const genderQuery = gender?.toLowerCase();

        let randomCallCharge;
        if (genderQuery === "female") {
          randomCallCharge = Math.abs(receiver.randomCallFemaleRate);
        } else if (genderQuery === "male") {
          randomCallCharge = Math.abs(receiver.randomCallMaleRate);
        } else {
          randomCallCharge = Math.abs(receiver.randomCallRate) || 100;
        }

        // Check if user is VIP and apply discount
        let randomCallDiscount = 0;
        if (caller.isVip && vipPrivilege) {
          randomCallDiscount = Math.min(Math.max(vipPrivilege.randomMatchCallDiscount || 0, 0), 100);

          const discountAmount = Math.floor((randomCallCharge * randomCallDiscount) / 100);
          randomCallCharge = randomCallCharge - discountAmount;
        }

        const adminCommissionRate = settingJSON?.adminCommissionRate;

        if (caller.coin >= randomCallCharge) {
          let agency = null;
          let agencyUpdate = null;
          if (receiver.agencyId) {
            agency = await Agency.findById(receiver.agencyId).lean().select("_id commissionType commission");
          }

          const distribution = buildCoinDistribution({
            totalCoins: randomCallCharge,
            adminCommissionRate,
            agencyCommissionType: agency?.commissionType,
            agencyCommission: agency?.commission,
          });

          if (agency) {
            agencyUpdate = Agency.updateOne(
              { _id: agency._id },
              {
                $inc: {
                  hostCoins: distribution.hostCoin,
                  totalEarnings: distribution.agencyCoin,
                  netAvailableEarnings: distribution.hostCoin + distribution.agencyCoin,
                  totalEarningsWithCommissionAndHostCoin: distribution.hostCoin + distribution.agencyCoin,
                },
              },
            );
          }

          console.log(
            `[callCoinCharged] Deducting ${randomCallCharge} coins from Caller: ${caller._id}, Admin Share: ${distribution.adminCoin}, Host Earnings: ${distribution.hostCoin}, Agency: ${distribution.agencyCoin}`,
          );

          await Promise.all([
            User.updateOne(
              { _id: caller._id, coin: { $gte: randomCallCharge } },
              {
                $inc: {
                  coin: -randomCallCharge,
                  spentCoins: randomCallCharge,
                },
              },
            ),
            Host.updateOne({ _id: receiver._id }, { $inc: { coin: distribution.hostCoin } }),
            History.updateOne(
              { _id: callHistory._id, userId: caller._id, hostId: receiver._id },
              {
                $set: {
                  agencyId: receiver.agencyId,
                  date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
                },
                $inc: {
                  userCoin: randomCallCharge,
                  hostCoin: distribution.hostCoin,
                  adminCoin: distribution.adminCoin,
                  agencyCoin: distribution.agencyCoin,
                },
              },
            ),
            agencyUpdate,
          ]);

          console.log("[callCoinCharged] Coin deduction and history update successful.");
        } else {
          console.log(`[callCoinCharged] Insufficient Coins for Caller: ${caller._id}`);
          io.in("globalRoom:" + caller._id.toString()).emit("insufficientCoins", "You don't have sufficient coins.");
        }
      }
    } catch (error) {
      console.error("[callCoinCharged] Error:", error);
    }
  });

  socket.on("callCoinChargedForFakeCall", async (data) => {
    try {
      const parsedData = JSON.parse(data);
      console.log("[callCoinChargedForFakeCall] Parsed Data:", parsedData);

      const { callerId, receiverId, callMode, callType, gender } = parsedData;
      if (!idOk(callerId) || !idOk(receiverId)) {
        console.warn("[callCoinChargedForFakeCall] Invalid callerId or receiverId:", { callerId, receiverId });
        return;
      }

      const [callUniqueId, caller, receiverRaw, vipPrivilege] = await Promise.all([
        generateHistoryUniqueId(),
        User.findById(callerId).select("_id coin isVip").lean(),
        Host.findById(receiverId)
          .select("_id coin privateCallRate audioCallRate randomCallRate randomCallFemaleRate randomCallMaleRate agencyId useCustomCallRates")
          .lean(),
        VipPlanPrivilege.findOne().select("audioCallDiscount privateCallDiscount randomMatchCallDiscount").lean(),
      ]);

      if (!caller || !receiverRaw) {
        console.log("[callCoinChargedForFakeCall] Caller or Receiver not found!");
        return;
      }

      const receiver = hostWithEffectiveCallRates(receiverRaw, global.settingJSON || {});

      const normalizedCallType = callType?.trim()?.toLowerCase();
      const normalizedCallMode = callMode?.trim()?.toLowerCase();

      let historyDoc = await History.findOne({
        userId: caller._id,
        hostId: receiver._id,
        callType: normalizedCallMode,
        isPrivate: normalizedCallMode === "private",
        isRandom: normalizedCallMode === "random",
        type: normalizedCallType === "audio" ? 11 : 12,
      });

      if (!historyDoc) {
        historyDoc = await History.create({
          uniqueId: callUniqueId,
          type: normalizedCallType === "audio" ? 11 : 12,
          userId: caller._id,
          hostId: receiver._id,
          isPrivate: normalizedCallMode === "private",
          isRandom: normalizedCallMode === "random",
          callType: normalizedCallMode,
          date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        });
      }

      const historyId = historyDoc._id;
      const settingJSON = global.settings || { adminCommissionRate: 20 };
      const adminCommissionRate = settingJSON.adminCommissionRate || 20;

      const processCallPayment = async (callCharge, discountPercent = 0) => {
        const discountAmount = Math.floor((callCharge * discountPercent) / 100);
        callCharge -= discountAmount;

        let agency = null;
        let agencyUpdate = null;

        if (receiver.agencyId) {
          agency = await Agency.findById(receiver.agencyId).lean().select("_id commissionType commission");
        }

        const distribution = buildCoinDistribution({
          totalCoins: callCharge,
          adminCommissionRate,
          agencyCommissionType: agency?.commissionType,
          agencyCommission: agency?.commission,
        });

        if (agency) {
          agencyUpdate = Agency.updateOne(
            { _id: agency._id },
            {
              $inc: {
                hostCoins: distribution.hostCoin,
                totalEarnings: distribution.agencyCoin,
                netAvailableEarnings: distribution.hostCoin + distribution.agencyCoin,
                totalEarningsWithCommissionAndHostCoin: distribution.hostCoin + distribution.agencyCoin,
              },
            },
          );
        }

        if (caller.coin >= callCharge) {
          await Promise.all([
            User.updateOne(
              { _id: caller._id, coin: { $gte: callCharge } },
              {
                $inc: {
                  coin: -callCharge,
                  spentCoins: callCharge,
                },
              },
            ),
            Host.updateOne({ _id: receiver._id }, { $inc: { coin: distribution.hostCoin } }),
            History.updateOne(
              { _id: historyId },
              {
                $set: {
                  agencyId: receiver.agencyId || null,
                  date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
                },
                $inc: {
                  userCoin: callCharge,
                  hostCoin: distribution.hostCoin,
                  adminCoin: distribution.adminCoin,
                  agencyCoin: distribution.agencyCoin,
                },
              },
            ),
            agencyUpdate,
          ]);

          console.log("[callCoinChargedForFakeCall] Coin deduction and history update successful.");
        } else {
          console.log(`[callCoinChargedForFakeCall] Insufficient Coins for Caller: ${caller._id}`);
          io.in("globalRoom:" + caller._id.toString()).emit("insufficientCoins", "You don't have sufficient coins.");
        }
      };

      if (normalizedCallMode === "private" && normalizedCallType === "audio") {
        const rate = Math.abs(receiver.audioCallRate);
        const discount = caller.isVip && vipPrivilege?.audioCallDiscount ? Math.min(Math.max(vipPrivilege.audioCallDiscount, 0), 100) : 0;
        await processCallPayment(rate, discount);
      }

      if (normalizedCallMode === "private" && normalizedCallType === "video") {
        const rate = Math.abs(receiver.privateCallRate);
        const discount = caller.isVip && vipPrivilege?.privateCallDiscount ? Math.min(Math.max(vipPrivilege.privateCallDiscount, 0), 100) : 0;
        await processCallPayment(rate, discount);
      }

      if (normalizedCallMode === "random" && normalizedCallType === "video") {
        let rate = Math.abs(receiver.randomCallRate) || 100;
        if (gender?.toLowerCase() === "female") {
          rate = Math.abs(receiver.randomCallFemaleRate);
        } else if (gender?.toLowerCase() === "male") {
          rate = Math.abs(receiver.randomCallMaleRate);
        }

        const discount = caller.isVip && vipPrivilege?.randomMatchCallDiscount ? Math.min(Math.max(vipPrivilege.randomMatchCallDiscount, 0), 100) : 0;

        await processCallPayment(rate, discount);
      }
    } catch (error) {
      console.error("[callCoinChargedForFakeCall] Error:", error);
    }
  });

  //random video call
  socket.on("ringingStarted", async (data) => {
    const parsedData = JSON.parse(data);
    const { callerId, receiverId, agoraUID, channel, gender, callerRole, receiverRole } = parsedData;
    console.log("ringingStarted request received:", parsedData);

    const validRoles = ["user", "host"];
    if (!validRoles.includes(callerRole?.toLowerCase()) || !validRoles.includes(receiverRole?.toLowerCase())) {
      io.in("globalRoom:" + callerId.toString()).emit("callRinging", { message: "Invalid roles provided." });
      return;
    }

    const callerModel = callerRole.trim().toLowerCase() === "user" ? User : Host;
    const receiverModel = receiverRole.trim().toLowerCase() === "host" ? Host : User;

    const role = RtcRole.PUBLISHER;
    const uid = agoraUID ? agoraUID : 0;
    const expirationTimeInSeconds = 24 * 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const [callUniqueId, token, caller, receiver] = await Promise.all([
      generateHistoryUniqueId(),
      RtcTokenBuilder.buildTokenWithUid(settingJSON?.agoraAppId, settingJSON?.agoraAppCertificate, channel, uid, role, privilegeExpiredTs),
      User.findById(callerId).select("_id name image isBlock isBusy callId isOnline uniqueId").lean(),
      Host.findById(receiverId).select("_id name image isBlock isBusy callId isOnline uniqueId fcmToken").lean(),
    ]);

    if (!caller) {
      io.in("globalRoom:" + caller._id.toString()).emit("ringingStarted", { message: "Caller does not found." });
      return;
    }

    if (caller.isBlock) {
      io.in("globalRoom:" + caller._id.toString()).emit("ringingStarted", {
        message: "Caller is blocked.",
        isBlock: true,
      });
      return;
    }

    if (caller.isBusy && caller.callId) {
      io.in("globalRoom:" + caller._id.toString()).emit("ringingStarted", {
        message: "Caller is busy with someone else.",
        isBusy: true,
      });
      return;
    }

    if (!receiver) {
      io.in("globalRoom:" + caller._id.toString()).emit("ringingStarted", { message: "Receiver does not found." });
      return;
    }

    if (receiver.isBlock) {
      io.in("globalRoom:" + caller._id.toString()).emit("ringingStarted", {
        message: "Receiver is blocked.",
        isBlock: true,
      });
      return;
    }

    if (!receiver.isOnline) {
      io.in("globalRoom:" + caller._id.toString()).emit("ringingStarted", {
        message: "Receiver is not online.",
        isOnline: false,
      });
      return;
    }

    if (receiver.isBusy && receiver.callId) {
      io.in("globalRoom:" + caller._id.toString()).emit("ringingStarted", {
        message: "Receiver is busy with another call.",
        isBusy: true,
      });
      return;
    }

    if (!receiver.isBusy && receiver.callId === null) {
      console.log("Receiver and Caller are free. Proceeding with call setup.");

      const callHistory = new History();
      callHistory.uniqueId = callUniqueId;
      callHistory.callId = callUniqueId;

      const [callerVerify, receiverVerify] = await Promise.all([
        callerModel.updateOne(
          {
            _id: caller._id,
            isBlock: false,
            isOnline: true,
            isBusy: false,
            callId: null,
            ...(callerRole.trim().toLowerCase() === "host" ? { isFake: false, isLive: false } : {}),
          },
          {
            $set: {
              isBusy: true,
              callId: callHistory._id.toString(),
            },
          },
        ),
        receiverModel.updateOne(
          {
            _id: receiver._id,
            isBlock: false,
            isOnline: true,
            isBusy: false,
            callId: null,
            ...(receiverRole.trim().toLowerCase() === "host" ? { isFake: false, isLive: false } : {}),
          },
          {
            $set: {
              isBusy: true,
              callId: callHistory._id.toString(),
            },
          },
        ),
      ]);

      if (callerVerify.modifiedCount > 0 && receiverVerify.modifiedCount > 0) {
        const dataOfVideoCall = {
          callerId: caller._id,
          receiverId: receiver._id,
          callerImage: caller.image,
          callerName: caller.name,
          callerUniqueId: caller.uniqueId,
          receiverName: receiver.name,
          receiverImage: receiver.image,
          receiverUniqueId: receiver.uniqueId,
          callId: callHistory._id,
          callType: "video",
          callMode: "random",
          token,
          channel,
          callerRole,
          receiverRole,
          gender: gender.trim().toLowerCase(),
        };

        io.in("globalRoom:" + receiver._id.toString()).emit("callIncoming", dataOfVideoCall); // Notify receiver
        io.in("globalRoom:" + caller._id.toString()).emit("callConnected", dataOfVideoCall); // Notify caller

        console.log(`Call successfully initiated: ${caller.name} → ${receiver.name}`);

        if (!receiver.isBlock && receiver.fcmToken !== null) {
          const isVideo = dataOfVideoCall.callType?.trim().toLowerCase() === "video";
          const isRandom = dataOfVideoCall.callMode === "random";
          const callerName = dataOfVideoCall.callerName?.trim() || "Someone";

          const notificationTitle = isVideo ? (isRandom ? "🎥 Incoming Random Video Call!" : "🎥 Incoming Video Call") : isRandom ? "📞 Incoming Random Audio Call!" : "📞 Incoming Audio Call";

          const notificationBody = isVideo
            ? isRandom
              ? `${callerName} wants to randomly video chat with you! Tap to join 🔗`
              : `${callerName} is inviting you to a video call. Tap to connect now! 👥`
            : isRandom
              ? `${callerName} wants a random audio chat! Tap to talk 🎙️`
              : `${callerName} is calling you for an audio chat. Tap to join the conversation! 📞`;

          const payload = {
            token: receiver.fcmToken,
            data: {
              title: notificationTitle,
              body: notificationBody,
              type: "callIncoming",
              callType: dataOfVideoCall.callType,
              callId: dataOfVideoCall.callId.toString(),
              callerId: dataOfVideoCall.callerId.toString(),
              receiverId: dataOfVideoCall.receiverId.toString(),
              callerName: dataOfVideoCall.callerName,
              callerImage: dataOfVideoCall.callerImage,
              callerUniqueId: dataOfVideoCall.callerUniqueId,
              receiverName: dataOfVideoCall.receiverName,
              receiverImage: dataOfVideoCall.receiverImage,
              receiverUniqueId: dataOfVideoCall.receiverUniqueId,
              token: dataOfVideoCall.token,
              channel: dataOfVideoCall.channel,
              callMode: dataOfVideoCall.callMode,
              gender: dataOfVideoCall.gender,
            },
          };

          const adminInstance = await admin;
          adminInstance
            .messaging()
            .send(payload)
            .then((response) => {
              console.log("📨 Call notification sent successfully:", response);
            })
            .catch((error) => {
              console.error("⚠️ Failed to send call notification:", error);
            });
        }

        callHistory.type = 13;
        callHistory.callType = "video";
        callHistory.isRandom = true;
        callHistory.userId = caller._id;
        callHistory.hostId = receiver._id;
        callHistory.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

        await Promise.all([
          callHistory.save(),
          Randomcall({
            caller: caller._id,
          }).save(),
        ]);
      } else {
        console.log("Failed to verify caller or receiver availability");

        io.in("globalRoom:" + caller._id.toString()).emit("ringingStarted", {
          message: "Call setup failed. One or both users became unavailable.",
          isBusy: true,
        });

        // Update isBusy only for the user who failed verification
        if (callerVerify.modifiedCount > 0) {
          await User.updateOne({ _id: callerId, isBusy: true }, { $set: { isBusy: false, callId: null } });
          console.log(`🔹 Caller Status Updated: Caller verification failed, isBusy reset`);
        }

        if (receiverVerify.modifiedCount > 0) {
          await User.updateOne({ _id: receiverId, isBusy: true }, { $set: { isBusy: false, callId: null } });
          console.log(`🔹 Receiver Status Updated: Receiver verification failed, isBusy reset`);
        }
        return;
      }
    } else {
      console.log("Condition not met - receiver not available");

      io.in("globalRoom:" + caller._id.toString()).emit("ringingStarted", {
        message: "Receiver is unavailable for a call at this moment.",
        isBusy: true,
      });
      return;
    }
  });

  //live-streaming
  socket.on("liveRoomJoin", async (data) => {
    const parsedData = JSON.parse(data);
    console.log("liveRoomJoin connected : ", parsedData);

    const sockets = await io.in(globalRoom).fetchSockets();

    if (sockets?.length) {
      sockets.forEach((socket) => {
        // Leave all previous liveHistoryId rooms dynamically
        socket.rooms.forEach((room) => {
          if (room !== globalRoom) {
            console.log(`Leaving old room: ${room}`);
            socket.leave(room);
          }
        });

        // Join the new live room
        socket.join(parsedData.liveHistoryId);
        console.log(`Joined new room: ${parsedData.liveHistoryId}`);
      });

      io.in(parsedData.liveHistoryId).emit("liveRoomJoin", data);
    } else {
      console.log("Sockets not able to emit");
    }
  });

  socket.on("liveStreamStatusCheck", async (data) => {
    try {
      const dataOfCheck = JSON.parse(data);
      console.log("[liveStreamStatusCheck] Parsed data:", dataOfCheck);

      const { liveHistoryId, hostId } = dataOfCheck;

      const liveUser = await LiveBroadcaster.findOne({ hostId: hostId, liveHistoryId: liveHistoryId }).lean();

      if (!liveUser) {
        console.log(`[liveStreamStatusCheck] User ${hostId} is not live.`);

        const targetSocket = io.sockets.sockets.get(socket.id);
        if (targetSocket) {
          console.log("Target socket exists, emitting...");
          targetSocket.emit("liveStreamStatusCheck", { hostId, liveStatus: false });
        } else {
          console.log("Target socket not found.");
        }
        return;
      }

      console.log(`[liveStreamStatusCheck] User ${hostId} is live.`);

      const targetSocket = io.sockets.sockets.get(socket.id);
      if (targetSocket) {
        console.log("Target socket exists, emitting...");
        targetSocket.emit("liveStreamStatusCheck", { hostId, liveStatus: true });
      } else {
        console.log("Target socket not found.");
      }
    } catch (error) {
      console.error("[liveStreamStatusCheck] Error:", error);
    }
  });

  socket.on("liveJoinerCount", async (data) => {
    const dataOfaddView = JSON.parse(data);
    console.log("[liveJoinerCount] Received data:", dataOfaddView);

    const { userId, liveHistoryId } = dataOfaddView;

    const [user, liveUser, existLiveView] = await Promise.all([
      User.findById(userId).select("_id name image gender countryFlagImage country").lean(),
      LiveBroadcaster.findOne({ liveHistoryId }).select("view").lean(),
      LiveBroadcastView.findOne({ userId, liveHistoryId }).lean(),
    ]);

    if (!user) {
      console.log(`[liveJoinerCount] User not found.`);
      return;
    }

    if (!liveUser) {
      console.log(`[liveJoinerCount] LiveUser not found.`);
      return;
    }

    if (!socket.rooms.has(liveHistoryId)) {
      socket.join(liveHistoryId.toString());
      console.log(`[liveJoinerCount] joined room: ${liveHistoryId}`);
    } else {
      console.log(`[liveJoinerCount] User is already in room: ${liveHistoryId}`);
    }

    if (!existLiveView) {
      console.log("[liveJoinerCount] Creating new LiveView entry");

      await LiveBroadcastView.create({
        userId,
        liveHistoryId,
        ...user,
      });
    }

    const totalViews = await LiveBroadcastView.countDocuments({ liveHistoryId });
    console.log(`[liveJoinerCount] Total viewers for ${liveHistoryId}:`, totalViews);

    io.in(liveHistoryId).emit("liveJoinerCount", totalViews);

    await Promise.all([
      LiveBroadcaster.updateOne(
        { _id: liveUser?._id },
        {
          $set: { view: totalViews },
        },
      ),
      LiveBroadcastHistory.updateOne(
        { _id: liveHistoryId },
        {
          $set: { audienceCount: totalViews },
        },
      ),
    ]);
  });

  socket.on("removeLiveJoiner", async (data) => {
    try {
      const dataOflessView = JSON.parse(data);
      console.log("[removeLiveJoiner] Received data:", dataOflessView);

      const { userId, liveHistoryId } = dataOflessView;

      const [liveUser, existLiveView] = await Promise.all([LiveBroadcaster.findOne({ liveHistoryId }).select("_id view").lean(), LiveBroadcastView.findOne({ userId, liveHistoryId }).lean()]);

      if (!liveUser) {
        console.log(`[removeLiveJoiner] LiveUser not found.`);
        return;
      }

      if (existLiveView) {
        console.log("[removeLiveJoiner] Removing user from LiveView");
        await LiveBroadcastView.deleteOne({ _id: existLiveView._id });
      }

      const totalViews = await LiveBroadcastView.countDocuments({ liveHistoryId });
      console.log(`[removeLiveJoiner] Updated total viewers for ${liveHistoryId}:`, totalViews);

      io.in(liveHistoryId).emit("removeLiveJoiner", totalViews);

      await LiveBroadcaster.updateOne({ _id: liveUser._id }, { $set: { view: totalViews } });

      if (!socket.rooms.has(liveHistoryId)) {
        socket.leave(liveHistoryId);
        console.log(`[removeLiveJoiner] joined room: ${liveHistoryId}`);
      } else {
        console.log(`[removeLiveJoiner] User is already in room: ${liveHistoryId}`);
      }
    } catch (error) {
      console.error("[removeLiveJoiner] Error:", error);
    }
  });

  socket.on("aiNudge", async (data) => {
    try {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      const { chatTopicId } = parsed || {};
      if (!chatTopicId) return;

      // 1. Check if auto message is enabled globally
      if (global.settingJSON && global.settingJSON.isAutoMessageEnabled === false) {
        console.log(`[Socket aiNudge] Auto message is disabled globally. Ignoring nudge for topic ${chatTopicId}.`);
        return;
      }

      const topic = await ChatTopic.findById(chatTopicId);
      if (topic && topic.aiConversationId) {
        // 2. Enforce max nudges cap from settings
        const maxNudges = Number(global.settingJSON?.autoMessageMaxNudges) || 3;
        if ((topic.consecutiveNudgeCount || 0) >= maxNudges) {
          console.log(`[Socket aiNudge] Topic ${chatTopicId} reached max ${maxNudges} nudges. Waiting for user response.`);
          return;
        }

        // 3. Enforce cooldown to prevent rapid spamming (respect messageInitiatedAt setting, min 60s)
        const now = Date.now();
        const minGapMs = Math.max(60 * 1000, ((Number(global.settingJSON?.messageInitiatedAt) || 1) * 60 * 1000));
        
        if (topic.lastInteractionAt && (now - new Date(topic.lastInteractionAt).getTime() < minGapMs)) {
          const remainingSec = Math.ceil((minGapMs - (now - new Date(topic.lastInteractionAt).getTime())) / 1000);
          console.log(`[Socket aiNudge] Nudge throttled for topic ${chatTopicId}. Cooldown active for another ${remainingSec}s.`);
          return;
        }

        if (topic.nextNudgeTime && new Date(topic.nextNudgeTime).getTime() > now) {
          const remainingSec = Math.ceil((new Date(topic.nextNudgeTime).getTime() - now) / 1000);
          console.log(`[Socket aiNudge] Nudge throttled for topic ${chatTopicId}. Next allowed nudge in ${remainingSec}s.`);
          return;
        }

        console.log(`[Socket] Received Tier 1 In-Chat Nudge for AI conversation: ${topic.aiConversationId}`);
        const { DATING_AI_BASE_URL, createAIHeaders } = require("./util/aiConfig");
        
        // 1. Emit typing indicator to user room immediately for realistic animation
        io.in("globalRoom:" + topic.senderId.toString()).emit("chatTyping", { isTyping: true, receiverId: topic.receiverId.toString() });

        const res = await fetch(`${DATING_AI_BASE_URL}/api/conversations/${topic.aiConversationId}/nudge`, {
          method: 'POST',
          headers: createAIHeaders("POST", `/api/conversations/${topic.aiConversationId}/nudge`)
        });
        
        if (res.ok) {
          const aiResponseData = await res.json();
          const handleAIResponse = require("./util/emitAIMessage");
          await handleAIResponse(aiResponseData, topic);

          topic.consecutiveNudgeCount = (topic.consecutiveNudgeCount || 0) + 1;
          topic.lastSenderRole = "host";
          topic.lastInteractionAt = new Date();
          topic.nextNudgeTime = new Date(Date.now() + minGapMs);
          await topic.save();
        }

        // 2. Stop typing indicator
        io.in("globalRoom:" + topic.senderId.toString()).emit("chatTyping", { isTyping: false, receiverId: topic.receiverId.toString() });
      }
    } catch (error) {
      console.error("[Socket aiNudge Error]:", error.message);
    }
  });

  socket.on("liveCommentBroadcast", async (data) => {
    try {
      const dataOfComment = JSON.parse(data);
      console.log("[liveCommentBroadcast] Parsed data:", dataOfComment);

      const { liveHistoryId } = dataOfComment;

      if (!socket.rooms.has(liveHistoryId)) {
        socket.join(liveHistoryId.toString());
        console.log(`[liveCommentBroadcast] joined room: ${liveHistoryId}`);
      } else {
        console.log(`[liveCommentBroadcast] User is already in room: ${liveHistoryId}`);
      }

      const [liveHistory] = await Promise.all([LiveBroadcastHistory.findById(liveHistoryId).select("_id").lean()]);

      io.in(liveHistoryId).emit("liveCommentBroadcast", data);

      const socketCount = (await io.in(liveHistoryId).fetchSockets())?.length || 0;
      console.log(`[liveCommentBroadcast] Active sockets in room ${liveHistoryId}:`, socketCount);

      if (liveHistory) {
        await LiveBroadcastHistory.updateOne({ _id: liveHistory._id }, { $inc: { liveComments: 1 } });
      }
    } catch (error) {
      console.error("[liveCommentBroadcast] Error:", error);
    }
  });

  socket.on("liveGiftSent", async (data) => {
    const giftData = JSON.parse(data);
    console.log("Gift Data Received:", giftData);

    if (!socket.rooms.has(giftData.liveHistoryId)) {
      socket.join(giftData.liveHistoryId.toString());
      console.log(`[liveGiftSent] joined room: ${giftData.liveHistoryId}`);
    } else {
      console.log(`[liveGiftSent] User is already in room: ${giftData.liveHistoryId}`);
    }

    try {
      const [uniqueId, senderUser, receiver, gift] = await Promise.all([
        generateHistoryUniqueId(),
        User.findById(giftData.senderId).lean().select("_id coin"),
        Host.findById(giftData.receiverId).lean().select("_id coin totalGifts agencyId"),
        Gift.findById(giftData.giftId).lean().select("_id coin image type svgaImage"),
      ]);

      if (!senderUser) {
        console.log("Sender user not found");
        io.in(`globalRoom:${giftData.senderId}`).emit("liveGiftReceived", { error: "Sender user not found" });
        return;
      }

      if (!receiver) {
        console.log("Receiver user not found");
        io.in(`globalRoom:${giftData.receiverId}`).emit("liveGiftReceived", { error: "Receiver user not found" });
        return;
      }

      if (!gift) {
        console.log("Gift not found");
        io.in(`globalRoom:${giftData.senderId}`).emit("liveGiftReceived", { error: "Gift not found" });
        return;
      }

      const giftCount = Number(giftData.giftCount);
      const coinPerGift = Math.abs(gift.coin);
      const totalCoin = coinPerGift * giftCount;

      if (senderUser.coin < totalCoin) {
        console.log("Insufficient coins");
        io.in(`globalRoom:${giftData.senderId}`).emit("liveGiftReceived", { error: "You don't have enough coins" });
        return;
      }

      io.in(giftData.liveHistoryId).emit("liveGiftReceived", giftData);

      const adminCommissionRate = settingJSON.adminCommissionRate;

      let adminShare = 0;
      let hostEarnings = 0;
      let agencyShare = 0;

      adminShare = (totalCoin * adminCommissionRate) / 100;
      hostEarnings = totalCoin - adminShare;

      adminShare = Number(adminShare.toFixed(2));
      hostEarnings = Number(hostEarnings.toFixed(2));

      let agencyUpdate = null;
      if (receiver.agencyId) {
        const agency = await Agency.findById(receiver.agencyId).lean().select("_id commissionType commission");

        if (agency) {
          if (agency.commissionType === 1) {
            // Percentage commission
            agencyShare = (hostEarnings * agency.commission) / 100;
          } else {
            // Fixed salary, ignore earnings share
            agencyShare = 0;
          }

          agencyShare = Number(agencyShare.toFixed(2));

          agencyUpdate = Agency.updateOne(
            { _id: agency._id },
            {
              $inc: {
                hostCoins: hostEarnings,
                totalEarnings: agencyShare,
                netAvailableEarnings: hostEarnings + agencyShare,
                totalEarningsWithCommissionAndHostCoin: hostEarnings + agencyShare,
              },
            },
          );
        }
      }

      const liveHistoryUpdate =
        giftData.liveHistoryId && mongoose.Types.ObjectId.isValid(giftData.liveHistoryId)
          ? LiveBroadcastHistory.findByIdAndUpdate(
              giftData.liveHistoryId,
              {
                $inc: {
                  coins: totalCoin,
                  gifts: giftCount,
                },
              },
              { new: true },
            )
          : Promise.resolve();

      await Promise.all([
        User.updateOne(
          { _id: senderUser._id, coin: { $gte: totalCoin } },
          {
            $inc: {
              coin: -totalCoin,
              spentCoins: totalCoin,
            },
          },
        ),
        Host.updateOne({ _id: receiver._id }, { $inc: { coin: hostEarnings, totalGifts: 1 } }),
        History.create({
          uniqueId: uniqueId,
          type: 2,
          userId: senderUser._id,
          hostId: receiver._id,
          agencyId: receiver?.agencyId,
          giftId: giftData.giftId,
          giftCoin: gift.coin || 0,
          giftImage: gift.image || "",
          giftsvgaImage: gift.svgaImage || "",
          giftType: gift.type || 1,
          giftCount: giftCount,
          userCoin: totalCoin,
          hostCoin: hostEarnings,
          adminCoin: adminShare,
          agencyCoin: agencyShare,
          date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        }),
        agencyUpdate,
        liveHistoryUpdate,
      ]);
    } catch (error) {
      console.error("Error in liveGiftSent:", error);
      io.in(giftData.liveHistoryId).emit("liveGiftReceived", { error: "An error occurred while processing the gift." });
      return;
    }
  });

  socket.on("liveStreamEnd", async (data) => {
    try {
      const parsedData = JSON.parse(data);
      console.log("Received liveStreamEnd event with data:", parsedData);

      const { hostId, liveHistoryId } = parsedData;

      io.in(liveHistoryId).emit("liveStreamEnd", data);

      const [host, liveUser, liveHistory] = await Promise.all([
        Host.findOne({ liveHistoryId }).select("_id isLive isBusy liveHistoryId").lean(),
        LiveBroadcaster.findOne({ hostId, liveHistoryId }).select("_id hostId liveHistoryId isAudio").lean(),
        LiveBroadcastHistory.findById(liveHistoryId).select("_id startTime endTime duration").lean(),
      ]);

      if (!host) {
        console.log("⚠️ Host not found.");
        return;
      }

      if (!liveUser) {
        console.log(`⚠️ No LiveUser found with hostId: ${hostId} and liveHistoryId: ${liveHistoryId}`);
        return;
      }

      if (!liveHistory) {
        console.log("⚠️ LiveHistory not found.");
        return;
      }

      if (host.isLive) {
        const endTime = moment().tz("Asia/Kolkata").format();
        const start = moment.tz(liveHistory.startTime, "Asia/Kolkata");
        const end = moment.tz(endTime, "Asia/Kolkata");
        const duration = moment.utc(end.diff(start)).format("HH:mm:ss");

        await Promise.all([
          LiveBroadcastHistory.updateOne({ _id: liveHistory._id }, { $set: { endTime, duration } }),
          Host.updateOne({ _id: host._id }, { $set: { isLive: false, isBusy: false, liveHistoryId: null } }),
          LiveBroadcastView.deleteMany({ liveHistoryId }),
          LiveBroadcaster.deleteOne({ hostId, liveHistoryId }),
        ]);

        console.log(`✅ Host is no longer live.`);
        console.log("✅ Related liveViews deleted.");
        console.log(`✅ LiveBroadcaster entry deleted for hostId: ${hostId}`);
      }

      const sockets = await io.in(liveHistoryId).fetchSockets();
      console.log(`🔄 Active sockets in room (${liveHistoryId}): ${sockets.length}`);

      if (sockets.length) {
        io.socketsLeave(liveHistoryId);
        console.log(`✅ All sockets removed from room: ${liveHistoryId}`);
      } else {
        console.log("⚠️ No active sockets found to remove.");
      }
    } catch (error) {
      console.error("❌ Error in liveStreamEnd:", error);
    }
  });

  socket.on("disconnect", async (reason) => {
    console.log(`Socket disconnected: ${canonicalId} - ${socket.id} - Reason: ${reason}`);

    const uidStr = canonicalId.toString();
    const mapped = userIdToActiveSocketId.get(uidStr);
    if (mapped && mapped !== socket.id) {
      return;
    }
    if (mapped === socket.id) {
      userIdToActiveSocketId.delete(uidStr);
    }

    if (globalRoom) {
      const sockets = await io.in(globalRoom).fetchSockets();
      console.log("🔄 Checking active sockets in room:", sockets.length);

      if (sockets?.length == 0) {
        const personId = new mongoose.Types.ObjectId(canonicalId);
        console.log(`🔍 Fetching data for Id: ${personId}`);

        const [host, user] = await Promise.all([
          Host.findOne({ $or: [{ _id: personId }, { userId: personId }] }).select("_id callId isLive liveHistoryId userId").lean(),
          User.findById(personId).select("_id callId").lean(),
        ]);

        if (host) {
          if (host.callId && host.callId !== null) {
            const callId = new mongoose.Types.ObjectId(host.callId);
            console.log(`📞 Host was in an active call. Ending Call ID: ${callId}`);

            io.socketsLeave(host.callId.toString());

            const [callHistory] = await Promise.all([
              History.findById(callId).select("_id userId hostId callType isRandom callStartTime"),
              Privatecall.deleteOne({ receiver: host._id }),
              Host.updateOne({ _id: host._id }, {
                $set: {
                  isOnline: false,
                  isBusy: false,
                  isLive: false,
                  callId: null,
                  liveHistoryId: null,
                  lastActiveAt: new Date(),
                },
              }),
            ]);

            if (callHistory) {
              callHistory.callConnect = false;
              callHistory.callEndTime = moment().tz("Asia/Kolkata").format();

              const start = moment.tz(callHistory.callStartTime, "Asia/Kolkata");
              const end = moment.tz(callHistory.callEndTime, "Asia/Kolkata");
              const duration = moment.utc(end.diff(start)).format("HH:mm:ss");
              callHistory.duration = duration;

              await Promise.all([
                callHistory?.save(),
                Chat.findOneAndUpdate(
                  { callId: callHistory._id },
                  {
                    $set: {
                      callDuration: duration,
                      callType: 1, // 1 = Received Call
                      isRead: true,
                    },
                  },
                  { new: true },
                ),
              ]);

              try {
                await finalizeCallBilling({
                  callerId: callHistory.userId,
                  receiverId: host._id,
                  callId: callHistory._id,
                  callMode: callHistory.isRandom ? "random" : "private",
                  callType: callHistory.callType,
                });
              } catch (billingError) {
                console.error("[disconnect-host] Billing reconciliation failed:", billingError);
              }
            }
          }

          if (host.isLive && host.liveHistoryId) {
            const liveHistoryId = new mongoose.Types.ObjectId(host.liveHistoryId);
            console.log(`📴 Live session ended for host. Live History ID: ${liveHistoryId}`);

            const liveHistory = await LiveBroadcastHistory.findById(liveHistoryId).select("startTime").lean();

            const endTime = moment().tz("Asia/Kolkata").format();
            const start = moment.tz(liveHistory.startTime, "Asia/Kolkata");
            const end = moment.tz(endTime, "Asia/Kolkata");
            const duration = moment.utc(end.diff(start)).format("HH:mm:ss");

            await Promise.all([
              LiveBroadcastHistory.updateOne({ _id: liveHistory._id }, { $set: { endTime, duration } }),
              Host.updateOne({ _id: host._id }, { $set: { isLive: false, isBusy: false, liveHistoryId: null } }),
              LiveBroadcastView.deleteMany({ liveHistoryId }),
              LiveBroadcaster.deleteOne({ hostId: host._id, liveHistoryId }),
            ]);

            console.log(`✅ Host is no longer live.`);
            console.log("✅ Related liveViews deleted.");
            console.log(`✅ LiveBroadcaster entry deleted`);
          }

          await Host.updateOne(
            { _id: host._id },
            {
              $set: {
                isOnline: false,
                isBusy: false,
                isLive: false,
                liveHistoryId: null,
                callId: null,
              },
            },
          );
          await emitHostStatus(host._id);
        }

        if (user) {
          if (user.callId && user.callId !== null) {
            const callId = new mongoose.Types.ObjectId(user.callId);
            console.log(`📞 User was in an active call. Ending Call ID: ${callId}`);

            io.socketsLeave(user.callId.toString());

            const [callHistory] = await Promise.all([
              History.findById(callId).select("_id userId hostId callType isRandom callStartTime"),
              Privatecall.deleteOne({ caller: user._id }),
              User.updateOne(
                { _id: user._id },
                {
                  $set: {
                    isOnline: false,
                    isBusy: false,
                    isLive: false,
                    callId: null,
                    liveHistoryId: null,
                  },
                },
              ),
            ]);

            if (callHistory) {
              callHistory.callConnect = false;
              callHistory.callEndTime = moment().tz("Asia/Kolkata").format();

              const start = moment.tz(callHistory.callStartTime, "Asia/Kolkata");
              const end = moment.tz(callHistory.callEndTime, "Asia/Kolkata");
              const duration = moment.utc(end.diff(start)).format("HH:mm:ss");
              callHistory.duration = duration;

              await Promise.all([
                callHistory?.save(),
                Chat.updateOne(
                  { callId: callHistory._id },
                  {
                    $set: {
                      callDuration: duration,
                      callType: 1, // 1 = Received Call
                      isRead: true,
                    },
                  },
                ),
              ]);

              try {
                await finalizeCallBilling({
                  callerId: callHistory.userId,
                  receiverId: callHistory.hostId,
                  callId: callHistory._id,
                  callMode: callHistory.isRandom ? "random" : "private",
                  callType: callHistory.callType,
                });
              } catch (billingError) {
                console.error("[disconnect-user] Billing reconciliation failed:", billingError);
              }
            }
          }

          await User.updateOne(
            { _id: user._id },
            {
              $set: {
                isOnline: false,
                isBusy: false,
                isLive: false,
                liveHistoryId: null,
                callId: null,
                lastActiveAt: new Date(),
              },
            },
          );
        }
      }
    }
  });
});
