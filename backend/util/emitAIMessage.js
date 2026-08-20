const Chat = require("../models/chat.model");
const ChatTopic = require("../models/chatTopic.model");
const Host = require("../models/host.model");
const User = require("../models/user.model");
const admin = require("./privateKey");

async function handleAIResponse(aiResponseData, topic) {
  if (!topic) return;

  const [host, user] = await Promise.all([
    Host.findById(topic.receiverId).select("name image isFake").lean(),
    User.findById(topic.senderId).select("name fcmToken").lean(),
  ]);

  const hostName = host?.name || "Host";
  const hostImage = host?.image || "";

  const bubbles = Array.isArray(aiResponseData?.messages) && aiResponseData.messages.length > 0
    ? aiResponseData.messages
    : [{ message: aiResponseData?.reply || aiResponseData?.response || "Hello!", delay_ms: 1200 }];

  for (const bubble of bubbles) {
    const bubbleText = typeof bubble === "string" ? bubble : bubble?.message;
    if (!bubbleText) continue;

    const delay = Math.min(Math.max(Number(bubble?.delay_ms) || 1200, 800), 3500);
    await new Promise(resolve => setTimeout(resolve, delay));

    const aiChat = new Chat({
      messageType: 1,
      senderId: topic.receiverId,
      message: bubbleText,
      image: "",
      chatTopicId: topic._id,
      date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    });

    await Promise.all([
      aiChat.save(),
      ChatTopic.updateOne(
        { _id: topic._id },
        {
          $set: { chatId: aiChat._id },
          $inc: { messageCount: 1 }
        },
      ),
    ]);

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
        message: bubbleText,
        messageType: 1,
        senderRole: "host",
        receiverRole: "user",
        date: aiChat.date
      }),
      messageId: aiChat._id.toString(),
    };

    if (global.io) {
      global.io.in("globalRoom:" + topic.senderId.toString()).emit("chatMessageSent", aiEventData);
      global.io.in("globalRoom:" + topic.receiverId.toString()).emit("chatMessageSent", aiEventData);
    }

    if (user && user.fcmToken) {
      try {
        const adminInstance = await admin;
        const payload = {
          token: user.fcmToken,
          data: {
            title: `${hostName} 💌`,
            body: bubbleText,
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
}

module.exports = handleAIResponse;
