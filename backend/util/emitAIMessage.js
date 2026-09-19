const Chat = require("../models/chat.model");
const ChatTopic = require("../models/chatTopic.model");
const Host = require("../models/host.model");
const User = require("../models/user.model");
const admin = require("./privateKey");

async function handleAIResponse(aiResponseData, topic) {
  if (!topic) return;

  const [host, user] = await Promise.all([
    Host.findById(topic.receiverId).select("name image isFake gender").lean(),
    User.findById(topic.senderId).select("name fcmToken").lean(),
  ]);

  const hostName = host?.name || "Host";
  const hostImage = host?.image || "";

  let askedGift = null;
  if (aiResponseData?.gift) {
    askedGift = {
      gift_id: aiResponseData.gift.gift_id || aiResponseData.gift.id,
      name: aiResponseData.gift.name,
      coin_price: aiResponseData.gift.coin_price,
      gender: host?.gender || "female",
    };
    await ChatTopic.updateOne({ _id: topic._id }, { $set: { askedGift } }).catch(() => {});
  }

  const rawBubbles = Array.isArray(aiResponseData?.messages)
    ? aiResponseData.messages
    : (aiResponseData?.reply || aiResponseData?.response ? [{ message: aiResponseData?.reply || aiResponseData?.response, delay_ms: 2000 }] : []);

  const savedBubbles = [];
  let lastChatId = null;

  if (aiResponseData?.superseded !== true && rawBubbles.length > 0) {
    for (let i = 0; i < rawBubbles.length; i++) {
      const bubble = rawBubbles[i];
      const bubbleText = typeof bubble === "string" ? bubble : bubble.message;
      if (!bubbleText) continue;

      const delay = bubble.delay_ms || (bubbleText.length * 40 + 1500);

      const aiChat = new Chat({
        messageType: 1,
        senderId: topic.receiverId,
        message: bubbleText,
        image: "",
        chatTopicId: topic._id,
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      });

      await aiChat.save();
      lastChatId = aiChat._id;
      savedBubbles.push({ message: bubbleText, delay_ms: delay, id: aiChat._id });
    }

    if (lastChatId) {
      await ChatTopic.updateOne(
        { _id: topic._id },
        {
          $set: {
            chatId: lastChatId,
            lastSenderRole: "host",
            lastInteractionAt: new Date(),
          },
          $inc: { messageCount: savedBubbles.length }
        },
      );
    }
  }

  const aiEventData = {
    data: JSON.stringify({
      chatTopicId: topic._id.toString(),
      senderId: topic.receiverId.toString(),
      receiverId: topic.senderId.toString(),
      name: hostName,
      hostName: hostName,
      senderName: hostName,
      image: hostImage,
      hostImage: hostImage,
      senderImage: hostImage,
      messages: savedBubbles,
      superseded: aiResponseData?.superseded,
      messageType: 1,
      senderRole: "host",
      receiverRole: "user",
      date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      gift: askedGift,
    }),
    messageId: lastChatId ? lastChatId.toString() : "",
  };

  if (global.io) {
    global.io.in("globalRoom:" + topic.senderId.toString()).emit("chatMessageSent", aiEventData);
    global.io.in("globalRoom:" + topic.receiverId.toString()).emit("chatMessageSent", aiEventData);
  }

  if (askedGift && global.io) {
    global.io.in("globalRoom:" + topic.senderId.toString()).emit("aiGiftHint", {
      chatTopicId: topic._id.toString(),
      gift: askedGift,
      personaGender: host?.gender || "female",
    });
  }

  if (user && user.fcmToken && savedBubbles.length > 0) {
    const firstMessageText = savedBubbles[0].message;
    try {
      const adminInstance = await admin;
      const payload = {
        token: user.fcmToken,
        notification: {
          title: `${hostName} 💌`,
          body: firstMessageText,
        },
        data: {
          title: `${hostName} 💌`,
          body: firstMessageText,
          type: "CHAT",
          senderId: topic.receiverId.toString(),
          receiverId: topic.senderId.toString(),
          userName: String(user.name || ""),
          hostName: String(hostName),
          hostImage: String(hostImage),
          senderRole: "host",
          isOnline: "true",
          isFakeSender: "true",
        },
      };
      await adminInstance.messaging().send(payload);
      console.log(`✅ Sent AI message FCM notification from ${hostName} to ${user.name}`);
    } catch (fcmErr) {
      console.log("❌ Error sending AI FCM notification:", fcmErr.message);
    }
  }
}

module.exports = handleAIResponse;
