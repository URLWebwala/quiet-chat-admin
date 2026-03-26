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

  if (normalizedMode === "private" && normalizedType === "audio") {
    return Math.abs(Number(host?.audioCallRate) || 0);
  }

  if (normalizedMode === "private" && normalizedType === "video") {
    return Math.abs(Number(host?.privateCallRate) || 0);
  }

  if (normalizedMode === "random" && normalizedType === "video") {
    if (normalizedGender === "female") return Math.abs(Number(host?.randomCallFemaleRate) || 0);
    if (normalizedGender === "male") return Math.abs(Number(host?.randomCallMaleRate) || 0);
    return Math.abs(Number(host?.randomCallRate) || 100);
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
    Host.findById(receiverId).select("_id coin privateCallRate audioCallRate randomCallRate randomCallFemaleRate randomCallMaleRate agencyId").lean(),
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
    console.warn("Invalid or missing ID from globalRoom:", globalRoom);
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

    const user = await User.findById(canonicalId).select("_id isOnline").lean();

    if (user) {
      await User.findByIdAndUpdate(user._id, { $set: { isOnline: true } }, { new: true });
    } else {
      const host = await Host.findOne({ _id: canonicalId, status: 2 }).select("_id isOnline").lean();

      if (host) {
        await Host.findByIdAndUpdate(host._id, { $set: { isOnline: true } }, { new: true });
        await emitHostStatus(host._id);
      }
    }
  } else {
    console.warn("Invalid globalRoom format:", globalRoom);
  }

  //chat
  socket.on("chatMessageSent", async (data) => {
    const parseData = JSON.parse(data);
    console.log("🔹 Data in chatMessageSent:", parseData);

    let senderPromise, receiverPromise;

    if (parseData?.senderRole === "user") {
      senderPromise = User.findById(parseData?.senderId).lean().select("_id name image coin isVip");
    } else if (parseData?.senderRole === "host") {
      senderPromise = Host.findById(parseData?.senderId).lean().select("_id name image isFake coin");
    }

    if (parseData?.receiverRole === "host") {
      receiverPromise = Host.findById(parseData?.receiverId).lean().select("_id name image fcmToken isBlock coin chatRate agencyId");
    } else if (parseData?.receiverRole === "user") {
      receiverPromise = User.findById(parseData?.receiverId).lean().select("_id name image fcmToken isBlock coin");
    }

    const chatTopicPromise = ChatTopic.findById(parseData?.chatTopicId).lean().select("_id senderId receiverId chatId messageCount");

    const [uniqueId, sender, receiver, chatTopic] = await Promise.all([generateHistoryUniqueId(), senderPromise, receiverPromise, chatTopicPromise]);

    if (!chatTopic) {
      console.log("❌ Chat topic not found");
      return;
    }

    if (parseData?.messageType == 1) {
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
        const chatRate = receiver.chatRate || 10;

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
            $set: { chatId: chat._id },
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
        const chatRate = receiver.chatRate || 10;

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
              body: `🗨️ ${chat?.message}`,
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
      console.log("ℹ️ Other message type received");

      const eventData = {
        data,
        messageId: parseData?.messageId?.toString() || "",
      };

      io.in("globalRoom:" + chatTopic?.senderId?.toString()).emit("chatMessageSent", eventData);
      io.in("globalRoom:" + chatTopic?.receiverId?.toString()).emit("chatMessageSent", eventData);
    }
  });

  socket.on("chatGiftSent", async (data) => {
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

    if (!chatTopic) {
      console.log("❌ Chat topic not found");
      return;
    }

    if (!gift) {
      console.log("❌ Gift not found");
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
          callType: callType,
          callerId: caller._id,
          receiverId: receiver._id,
          callerImage: caller.image,
          callerName: caller.name,
          callerUniqueId: caller.uniqueId,
          receiverName: receiver.name,
          receiverImage: receiver.image,
          receiverUniqueId: receiver.uniqueId,
          callId: callHistory._id,
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
              gender: String(dataOfVideoCall.gender),
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

        console.log(`Call successfully initiated: ${caller.name} → ${receiver.name}`);

        callHistory.type = callType?.trim()?.toLowerCase() === "audio" ? 11 : callType?.trim()?.toLowerCase() === "video" ? 12 : null;
        callHistory.callType = callType?.trim()?.toLowerCase();
        callHistory.isPrivate = true;
        callHistory.userId = caller._id;
        callHistory.hostId = receiver._id;
        callHistory.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

        await Promise.all([
          callHistory.save(),
          Privatecall({
            caller: caller._id,
            receiver: receiver._id,
          }).save(),
        ]);
      } else {
        console.log("Failed to verify caller or receiver availability");

        io.in("globalRoom:" + caller._id.toString()).emit("callRinging", {
          message: "Call setup failed. One or both users became unavailable.",
          isBusy: true,
        });

        // Update isBusy only for the user who failed verification
        if (callerVerify.modifiedCount > 0) {
          await User.updateOne({ _id: callerId, isBusy: true }, { $set: { isBusy: false, callId: null } });
          console.log(`🔹 Caller Status Updated: Caller verification failed, isBusy reset`);
        }

        if (receiverVerify.modifiedCount > 0) {
          await Host.updateOne({ _id: receiverId, isBusy: true }, { $set: { isBusy: false, callId: null } });
          console.log(`🔹 Receiver Status Updated: Receiver verification failed, isBusy reset`);
        }
        return;
      }
    } else {
      console.log("Condition not met - receiver not available");

      io.in("globalRoom:" + callerId.toString()).emit("callRinging", {
        message: "Receiver is unavailable for a call at this moment.",
        isBusy: true,
      });
      return;
    }
  });

  socket.on("callResponseHandled", async (data) => {
    try {
      const parsedData = JSON.parse(data);

      const { callerId, receiverId, callId, isAccept, callType, callMode, callerRole, receiverRole } = parsedData;
      console.log("🟢 [callResponseHandled] Event received:", parsedData);

      const validRoles = ["user", "host"];
      if (!validRoles.includes(callerRole?.toLowerCase()) || !validRoles.includes(receiverRole?.toLowerCase())) {
        io.in("globalRoom:" + callerId.toString()).emit("callRinging", { message: "Invalid roles provided." });
        return;
      }

      const callerModel = callerRole.trim().toLowerCase() === "user" ? User : Host;
      const receiverModel = receiverRole.trim().toLowerCase() === "host" ? Host : User;

      const callerRoom = `globalRoom:${callerId}`;
      const receiverRoom = `globalRoom:${receiverId}`;

      console.log(`🔄 Fetching caller, receiver, and call history for callId: ${callId}`);

      const [caller, receiver, callHistory] = await Promise.all([
        callerModel.findById(callerId).select("_id name isBusy callId").lean(),
        receiverModel.findById(receiverId).select("_id name isBusy callId").lean(),
        History.findById(callId).select("_id callConnect"),
      ]);

      if (!caller || !receiver || !callHistory) {
        console.error("❌ [callResponseHandled] Invalid caller, receiver, or call history.");
        return io.to(callerRoom).emit("callResponseHandled", { message: "Invalid call data." });
      }

      console.log(`✅ Caller: ${caller.name} | Receiver: ${receiver.name} | Call ID: ${callId}`);

      if (callMode.trim().toLowerCase() === "private") {
        if (!isAccept && caller.callId?.toString() === callId.toString()) {
          console.log(`📵 [callResponseHandled] Call rejected by receiver ${receiver.name}`);

          io.to(callerRoom).emit("callRejected", data);
          io.to(receiverRoom).emit("callRejected", data);

          const [callerUpdate, receiverUpdate, privateCallDeleted] = await Promise.all([
            callerModel.updateOne({ _id: caller._id }, { $set: { isBusy: false, callId: null } }),
            receiverModel.updateOne({ _id: receiver._id }, { $set: { isBusy: false, callId: null } }),
            Privatecall.deleteOne({ caller: caller._id, receiver: receiver._id }),
          ]);

          console.log(`🔹 Caller Status Updated:`, callerUpdate);
          console.log(`🔹 Receiver Status Updated:`, receiverUpdate);
          console.log(`🔹 Private Call Deleted:`, privateCallDeleted);

          let chatTopic;
          chatTopic = await ChatTopic.findOne({
            $or: [
              {
                $and: [{ senderId: caller._id }, { receiverId: receiver._id }],
              },
              {
                $and: [{ senderId: receiver._id }, { receiverId: caller._id }],
              },
            ],
          });

          const chat = new Chat();

          if (!chatTopic) {
            chatTopic = new ChatTopic();

            chatTopic.chatId = chat._id;
            chatTopic.senderId = caller._id;
            chatTopic.receiverId = receiver._id;
          }

          chat.chatTopicId = chatTopic._id;
          chat.senderId = callerId;
          chat.messageType = callType.trim().toLowerCase() === "audio" ? 5 : 6;
          chat.message = callType.trim().toLowerCase() === "audio" ? "📞 Audio Call" : "📽 Video Call";
          chat.callType = 2; // 2.declined
          chat.callId = callId;
          chat.isRead = true;
          chat.date = new Date().toLocaleString();

          chatTopic.chatId = chat._id;

          callHistory.callConnect = false;
          
          await Promise.all([chat.save(), chatTopic.save(), callHistory?.save()]);
          console.log("✅ Call rejection chat & history saved.");
          return;
        }

        if (isAccept && caller.callId?.toString() === callId.toString()) {
          console.log(`📞 [callResponseHandled] Call accepted by receiver ${receiver.name}`);

          const privateCallDelete = await Privatecall.deleteOne({
            caller: new mongoose.Types.ObjectId(caller._id),
            receiver: new mongoose.Types.ObjectId(receiver._id),
          });

          console.log("🗑 Private call entry deleted:", privateCallDelete);

          if (privateCallDelete?.deletedCount > 0) {
            console.log("🟢 Call accepted, emitting event...");

            const [callerSockets, receiverSockets] = await Promise.all([io.in(callerRoom).fetchSockets(), io.in(receiverRoom).fetchSockets()]);

            const callerSocket = callerSockets?.[0];
            const receiverSocket = receiverSockets?.[0];

            if (callerSocket && !callerSocket.rooms.has(callId)) {
              callerSocket.join(callId);
            }

            if (receiverSocket && !receiverSocket.rooms.has(callId)) {
              receiverSocket.join(callId);
            }

            io.to(callId.toString()).emit("callAnswerReceived", data);

            console.log(`📡 [callAnswerReceived] Event sent to both parties: Caller(${caller.name}) & Receiver(${receiver.name})`);

            let chatTopic;
            chatTopic = await ChatTopic.findOne({
              $or: [
                {
                  $and: [{ senderId: caller._id }, { receiverId: receiver._id }],
                },
                {
                  $and: [{ senderId: receiver._id }, { receiverId: caller._id }],
                },
              ],
            });

            const chat = new Chat();

            if (!chatTopic) {
              chatTopic = new ChatTopic();

              chatTopic.chatId = chat._id;
              chatTopic.senderId = caller._id;
              chatTopic.receiverId = receiver._id;
            }

            chat.chatTopicId = chatTopic._id;
            chat.senderId = callerId;
            chat.messageType = callType.trim().toLowerCase() === "audio" ? 5 : 6;
            chat.message = callType.trim().toLowerCase() === "audio" ? "📞 Audio Call" : "📽 Video Call";
            chat.callType = 1; //1.received
            chat.callId = callId;
            chat.date = new Date().toLocaleString();

            chatTopic.chatId = chat._id;

            await Promise.all([
              chat?.save(),
              chatTopic?.save(),
              User.updateOne({ _id: caller._id }, { $set: { isBusy: true, callId: callId } }),
              Host.updateOne({ _id: receiver._id }, { $set: { isBusy: true, callId: callId } }),
              History.updateOne({ _id: callHistory._id }, { $set: { callConnect: true, callStartTime: moment().tz("Asia/Kolkata").format() } }),
            ]);

            await emitHostStatus(receiver._id);
            console.log("✅ Caller and Receiver status updated & call history saved.");
          } else {
            console.log(`🚨 Call disconnected`);

            io.to(receiverRoom).emit("callAutoEnded", data);

            await Promise.all([
              User.updateOne({ _id: caller._id, isBusy: true }, { $set: { isBusy: false, callId: null } }),
              Host.updateOne({ _id: receiver._id, isBusy: true }, { $set: { isBusy: false, callId: null } }),
            ]);

            await emitHostStatus(receiver._id);
            console.log("🔹 Caller & Receiver status reset.");
          }
        }
      }

      if (callMode.trim().toLowerCase() === "random") {
        if (!isAccept && caller.callId?.toString() === callId.toString()) {
          console.log(`📵 [callResponseHandled] Call rejected by receiver ${receiver.name}`);

          io.to(callerRoom).emit("callRejected", data);
          io.to(receiverRoom).emit("callRejected", data);

          const [callerUpdate, receiverUpdate, randomCallDeleted] = await Promise.all([
            callerModel.updateOne({ _id: caller._id }, { $set: { isBusy: false, callId: null } }),
            receiverModel.updateOne({ _id: receiver._id }, { $set: { isBusy: false, callId: null } }),
            Randomcall.deleteOne({ caller: caller._id }),
          ]);

          console.log(`🔹 Caller Status Updated:`, callerUpdate);
          console.log(`🔹 Receiver Status Updated:`, receiverUpdate);
          console.log(`🔹 Random Call Deleted:`, randomCallDeleted);

          let chatTopic;
          chatTopic = await ChatTopic.findOne({
            $or: [
              {
                $and: [{ senderId: caller._id }, { receiverId: receiver._id }],
              },
              {
                $and: [{ senderId: receiver._id }, { receiverId: caller._id }],
              },
            ],
          });

          const chat = new Chat();

          if (!chatTopic) {
            chatTopic = new ChatTopic();

            chatTopic.chatId = chat._id;
            chatTopic.senderId = caller._id;
            chatTopic.receiverId = receiver._id;
          }

          chat.chatTopicId = chatTopic._id;
          chat.senderId = callerId;
          chat.messageType = 6;
          chat.message = "📽 Video Call";
          chat.callType = 2; // 2.declined
          chat.callId = callId;
          chat.isRead = true;
          chat.date = new Date().toLocaleString();

          chatTopic.chatId = chat._id;

          callHistory.callConnect = false;
          
          await Promise.all([chat.save(), chatTopic.save(), callHistory?.save()]);
          console.log("✅ Call rejection chat & history saved.");
          return;
        }

        if (isAccept && caller.callId?.toString() === callId.toString()) {
          console.log(`📞 [callResponseHandled] Call accepted by receiver ${receiver.name}`);

          const randomCallDeleted = await Randomcall.deleteOne({
            caller: new mongoose.Types.ObjectId(caller._id),
          });

          console.log("🗑 Private call entry deleted:", randomCallDeleted);

          if (randomCallDeleted?.deletedCount > 0) {
            console.log("🟢 Call accepted, emitting event...");

            const [callerSockets, receiverSockets] = await Promise.all([io.in(callerRoom).fetchSockets(), io.in(receiverRoom).fetchSockets()]);

            const callerSocket = callerSockets?.[0];
            const receiverSocket = receiverSockets?.[0];

            if (callerSocket && !callerSocket.rooms.has(callId)) {
              callerSocket.join(callId);
            }

            if (receiverSocket && !receiverSocket.rooms.has(callId)) {
              receiverSocket.join(callId);
            }

            io.to(callId.toString()).emit("callAnswerReceived", data);

            console.log(`📡 [callAnswerReceived] Event sent to both parties: Caller(${caller.name}) & Receiver(${receiver.name})`);

            let chatTopic;
            chatTopic = await ChatTopic.findOne({
              $or: [
                {
                  $and: [{ senderId: caller._id }, { receiverId: receiver._id }],
                },
                {
                  $and: [{ senderId: receiver._id }, { receiverId: caller._id }],
                },
              ],
            });

            const chat = new Chat();

            if (!chatTopic) {
              chatTopic = new ChatTopic();

              chatTopic.chatId = chat._id;
              chatTopic.senderId = caller._id;
              chatTopic.receiverId = receiver._id;
            }

            chat.chatTopicId = chatTopic._id;
            chat.senderId = callerId;
            chat.messageType = 6;
            chat.message = "📽 Video Call";
            chat.callType = 1; //1.received
            chat.callId = callId;
            chat.date = new Date().toLocaleString();

            chatTopic.chatId = chat._id;

            await Promise.all([
              chat?.save(),
              chatTopic?.save(),
              User.updateOne({ _id: caller._id }, { $set: { isBusy: true, callId: callId } }),
              Host.updateOne({ _id: receiver._id }, { $set: { isBusy: true, callId: callId } }),
              History.updateOne({ _id: callHistory._id }, { $set: { callConnect: true, callStartTime: moment().tz("Asia/Kolkata").format() } }),
            ]);

            await emitHostStatus(receiver._id);
            console.log("✅ Caller and Receiver status updated & call history saved.");
          } else {
            console.log(`🚨 Call disconnected`);

            io.to(receiverRoom).emit("callAutoEnded", data);

            await Promise.all([
              User.updateOne({ _id: caller._id, isBusy: true }, { $set: { isBusy: false, callId: null } }),
              Host.updateOne({ _id: receiver._id, isBusy: true }, { $set: { isBusy: false, callId: null } }),
            ]);

            await emitHostStatus(receiver._id);
            console.log("🔹 Caller & Receiver status reset.");
          }
        }
      }
    } catch (error) {
      console.error("❌ [callResponseHandled] Error:", error);
      io.to(`globalRoom:${socket.id}`).emit("callResponseHandled", { message: "Server error. Please try again." });
    }
  });

  socket.on("callCancelled", async (data) => {
    const parseData = JSON.parse(data);
    const { callerId, receiverId, callId, callType, callMode, callerRole, receiverRole } = parseData;
    console.log("🟢 [callCancelled] Event received:", parseData);

    const validRoles = ["user", "host"];
    if (!validRoles.includes(callerRole?.toLowerCase()) || !validRoles.includes(receiverRole?.toLowerCase())) {
      io.in("globalRoom:" + callerId.toString()).emit("callRinging", { message: "Invalid roles provided." });
      return;
    }

    console.log(`🔄 Fetching call details for callId: ${callId}`);

    const callerModel = callerRole.trim().toLowerCase() === "user" ? User : Host;
    const receiverModel = receiverRole.trim().toLowerCase() === "host" ? Host : User;

    const [caller, receiver, callHistory] = await Promise.all([
      callerModel.findById(callerId).select("_id name fcmToken isBlock").lean(),
      receiverModel.findById(receiverId).select("_id name fcmToken isBlock").lean(),
      History.findById(callId).select("_id userId callConnect"),
    ]);

    if (!caller || !receiver || !callHistory) {
      console.error("❌ [callCancelled] Invalid caller, receiver, or call history.");
      return io.to(`globalRoom:${callerId}`).emit("callCancelFailed", { message: "Invalid call data." });
    }

    io.to("globalRoom:" + callerId).emit("callFinished", data);
    io.to("globalRoom:" + receiverId).emit("callFinished", data);

    console.log(`✅ Caller: ${caller.name} | Receiver: ${receiver.name} | Call ID: ${callId}`);

    if (callMode.trim().toLowerCase() === "private") {
      const [callerUpdate, receiverUpdate, privateCallDeleted] = await Promise.all([
        callerModel.updateOne({ _id: caller._id }, { $set: { isBusy: false, callId: null } }),
        receiverModel.updateOne({ _id: receiver._id }, { $set: { isBusy: false, callId: null } }),
        Privatecall.deleteOne({ caller: caller._id, receiver: receiver._id }),
      ]);

      console.log(`🔹 Caller Status Updated:`, callerUpdate);
      console.log(`🔹 Receiver Status Updated:`, receiverUpdate);
      console.log(`🔹 Private Call Deleted:`, privateCallDeleted);

      if (callerRole?.trim().toLowerCase() === "host") await emitHostStatus(caller._id);
      if (receiverRole?.trim().toLowerCase() === "host") await emitHostStatus(receiver._id);
    }

    if (callMode.trim().toLowerCase() === "random") {
      const [callerUpdate, receiverUpdate, randomCallDeleted] = await Promise.all([
        callerModel.updateOne({ _id: caller._id }, { $set: { isBusy: false, callId: null } }),
        receiverModel.updateOne({ _id: receiver._id }, { $set: { isBusy: false, callId: null } }),
        Randomcall.deleteOne({ caller: caller._id }),
      ]);

      console.log(`🔹 Caller Status Updated:`, callerUpdate);
      console.log(`🔹 Receiver Status Updated:`, receiverUpdate);
      console.log(`🔹 Private Call Deleted:`, randomCallDeleted);

      if (callerRole?.trim().toLowerCase() === "host") await emitHostStatus(caller._id);
      if (receiverRole?.trim().toLowerCase() === "host") await emitHostStatus(receiver._id);
    }

    callHistory.callConnect = false;

    let chatTopic;
    chatTopic = await ChatTopic.findOne({
      $or: [
        {
          $and: [{ senderId: caller._id }, { receiverId: receiver._id }],
        },
        {
          $and: [{ senderId: receiver._id }, { receiverId: caller._id }],
        },
      ],
    });

    const chat = new Chat();

    if (!chatTopic) {
      chatTopic = new ChatTopic();

      chatTopic.chatId = chat._id;
      chatTopic.senderId = caller._id;
      chatTopic.receiverId = receiver._id;
      await chatTopic.save();
    }

    chat.chatTopicId = chatTopic._id;
    chat.callId = callHistory?._id;
    chat.senderId = callHistory?.userId;
    chat.messageType = callType.trim().toLowerCase() === "audio" ? 5 : 6;
    chat.message = callType.trim().toLowerCase() === "audio" ? "📞 Audio Call" : "📽 Video Call";
    chat.callType = 3; //3.missedCall
    chat.date = new Date().toLocaleString();
    chat.isRead = true;

    chatTopic.chatId = chat._id;

    await Promise.all([chat?.save(), chatTopic?.save(), callHistory?.save()]);

    if (!receiver.isBlock && receiver.fcmToken !== null) {
      const payload = {
        token: receiver.fcmToken,
        data: {
          title: `📞 Missed Call from ${caller.name || "Someone"} ⏳`,
          body: `You missed a call from  ${caller.name || "Someone"}. Tap to reconnect now! 🔄✨`,
          type: "missedCall",
        },
      };

      const adminPromise = await admin;
      adminPromise
        .messaging()
        .send(payload)
        .then((response) => {
          console.log("Successfully sent with response: ", response);
        })
        .catch((error) => {
          console.log("Error sending message:      ", error);
        });
    }
  });

  socket.on("callDisconnected", async (data) => {
    const parseData = JSON.parse(data);
    const { callerId, receiverId, callId, callType, callMode, callerRole, receiverRole } = parseData;
    console.log("[callDisconnected]", "data in callDisconnected:", parseData);

    const validRoles = ["user", "host"];
    if (!validRoles.includes(callerRole?.toLowerCase()) || !validRoles.includes(receiverRole?.toLowerCase())) {
      io.in("globalRoom:" + callerId.toString()).emit("callRinging", { message: "Invalid roles provided." });
      return;
    }

    const callerModel = callerRole.trim().toLowerCase() === "user" ? User : Host;
    const receiverModel = receiverRole.trim().toLowerCase() === "host" ? Host : User;

    const [caller, receiver, callHistory] = await Promise.all([
      callerModel.findById(callerId).select("_id name").lean(),
      receiverModel.findById(receiverId).select("_id name").lean(),
      History.findById(callId).select("_id callConnect callStartTime callEndTime duration"),
    ]);

    if (!caller || !receiver || !callHistory) {
      console.error("❌ [callDisconnected] Invalid caller, receiver, or call history.");
      return io.to(`globalRoom:${callerId}`).emit("callTerminationFailed", { message: "Invalid call data." });
    }

    io.to(callId.toString()).emit("callDisconnected", data);
    io.socketsLeave(callId.toString());

    console.log(`✅ Caller: ${caller.name} | Receiver: ${receiver.name} | Call ID: ${callId}`);

    if (callMode.trim().toLowerCase() === "private") {
      const [callerUpdate, receiverUpdate, privateCallDeleted] = await Promise.all([
        callerModel.updateOne({ _id: callerId }, { $set: { isBusy: false, callId: null } }),
        receiverModel.updateOne({ _id: receiverId }, { $set: { isBusy: false, callId: null } }),
        Privatecall.deleteOne({ caller: callerId, receiver: receiverId }),
      ]);

      console.log(`🔹 Caller Status Updated:`, callerUpdate);
      console.log(`🔹 Receiver Status Updated:`, receiverUpdate);
      console.log(`🔹 Private Call Deleted:`, privateCallDeleted);

      if (callerRole?.trim().toLowerCase() === "host") await emitHostStatus(callerId);
      if (receiverRole?.trim().toLowerCase() === "host") await emitHostStatus(receiverId);
    }

    if (callMode.trim().toLowerCase() === "random") {
      const [callerUpdate, receiverUpdate, randomCallDeleted] = await Promise.all([
        callerModel.updateOne({ _id: callerId }, { $set: { isBusy: false, callId: null } }),
        receiverModel.updateOne({ _id: receiverId }, { $set: { isBusy: false, callId: null } }),
        Randomcall.deleteOne({ caller: callerId }),
      ]);

      console.log(`🔹 Caller Status Updated:`, callerUpdate);
      console.log(`🔹 Receiver Status Updated:`, receiverUpdate);
      console.log(`🔹 Private Call Deleted:`, randomCallDeleted);

      if (callerRole?.trim().toLowerCase() === "host") await emitHostStatus(callerId);
      if (receiverRole?.trim().toLowerCase() === "host") await emitHostStatus(receiverId);
    }

    callHistory.callConnect = false;
    callHistory.callEndTime = moment().tz("Asia/Kolkata").format();

    const start = moment.tz(callHistory.callStartTime, "Asia/Kolkata");
    const end = moment.tz(callHistory.callEndTime, "Asia/Kolkata");
    const duration = moment.utc(end.diff(start)).format("HH:mm:ss");
    callHistory.duration = duration;

    await Promise.all([
      Chat.findOneAndUpdate(
        { callId: callHistory._id },
        {
          $set: {
            callDuration: duration,
            messageType: callType.trim().toLowerCase() === "audio" ? 5 : 6,
            message: callType.trim().toLowerCase() === "audio" ? "📞 Audio Call" : "📽 Video Call",
            callType: 1, // 1 = Received Call
            isRead: true,
          },
        },
        { new: true },
      ),
      callHistory.save(),
    ]);

    try {
      await finalizeCallBilling({
        callerId,
        receiverId,
        callId: callHistory._id,
        callMode,
        callType,
      });
    } catch (billingError) {
      console.error("[callDisconnected] Billing reconciliation failed:", billingError);
    }
  });

  socket.on("callCoinCharged", async (data) => {
    try {
      const parsedData = JSON.parse(data);
      console.log("[callCoinCharged] Parsed Data:", parsedData);

      const { callerId, receiverId, callId, callMode, gender } = parsedData;

      const [caller, receiver, callHistory, vipPrivilege] = await Promise.all([
        User.findById(callerId).select("_id coin isVip").lean(),
        Host.findById(receiverId).select("_id coin privateCallRate audioCallRate randomCallRate randomCallFemaleRate randomCallMaleRate agencyId").lean(),
        History.findById(callId).select("_id callType isPrivate isRandom").lean(),
        VipPlanPrivilege.findOne().select("audioCallDiscount privateCallDiscount randomMatchCallDiscount").lean(),
      ]);

      if (!caller || !receiver || !callHistory) {
        console.log("[callCoinCharged] Caller, Receiver, or CallHistory not found!");
        return;
      }

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

      const [callUniqueId, caller, receiver, vipPrivilege] = await Promise.all([
        generateHistoryUniqueId(),
        User.findById(callerId).select("_id coin isVip").lean(),
        Host.findById(receiverId).select("_id coin privateCallRate audioCallRate randomCallRate randomCallFemaleRate randomCallMaleRate agencyId").lean(),
        VipPlanPrivilege.findOne().select("audioCallDiscount privateCallDiscount randomMatchCallDiscount").lean(),
      ]);

      if (!caller || !receiver) {
        console.log("[callCoinChargedForFakeCall] Caller or Receiver not found!");
        return;
      }

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
    console.log(`Socket disconnected: ${id} - ${socket.id} - Reason: ${reason}`);

    if (globalRoom) {
      const sockets = await io.in(globalRoom).fetchSockets();
      console.log("🔄 Checking active sockets in room:", sockets.length);

      if (sockets?.length == 0) {
        const personId = new mongoose.Types.ObjectId(id);
        console.log(`🔍 Fetching data for Id: ${personId}`);

        const host = await Host.findById(personId).select("_id callId isLive liveHistoryId").lean();
        if (host) {
          if (host.callId && host.callId !== null) {
            const callId = new mongoose.Types.ObjectId(host.callId);
            console.log(`📞 Host was in an active call. Ending Call ID: ${callId}`);

            io.socketsLeave(host.callId.toString());

            const [callHistory] = await Promise.all([
              History.findById(callId).select("_id userId hostId callType isRandom callStartTime"),
              Privatecall.deleteOne({ receiver: personId }),
              Host.updateOne({ _id: personId }, { $set: { isOnline: false, isBusy: false, isLive: false, callId: null, liveHistoryId: null } }),
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
              LiveBroadcaster.deleteOne({ hostId: personId, liveHistoryId }),
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
        } else {
          const user = await User.findById(personId).select("_id callId").lean();

          if (user) {
            if (user.callId && user.callId !== null) {
              const callId = new mongoose.Types.ObjectId(user.callId);
              console.log(`📞 User was in an active call. Ending Call ID: ${callId}`);

              io.socketsLeave(user.callId.toString());

              const [callHistory] = await Promise.all([
                History.findById(callId).select("_id userId hostId callType isRandom callStartTime"),
                Privatecall.deleteOne({ caller: personId }),
                User.updateOne(
                  { _id: personId },
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
                },
              },
            );
          }
        }
      }
    }
  });
});
