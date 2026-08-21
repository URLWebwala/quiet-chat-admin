const cron = require("node-cron");
const ChatTopic = require("../models/chatTopic.model");
const Host = require("../models/host.model");
const User = require("../models/user.model");
const { DATING_AI_BASE_URL, createAIHeaders } = require("../util/aiConfig");
const handleAIResponse = require("../util/emitAIMessage");

function isBackgroundPushAllowed() {
  const istDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const hour = istDate.getHours();
  const s = global.settingJSON || {};

  const mStart = Number.isFinite(s.autoMessageMorningStartHour) ? s.autoMessageMorningStartHour : 6;
  const mEnd = Number.isFinite(s.autoMessageMorningEndHour) ? s.autoMessageMorningEndHour : 13;
  const eStart = Number.isFinite(s.autoMessageEveningStartHour) ? s.autoMessageEveningStartHour : 17;
  const eEnd = Number.isFinite(s.autoMessageEveningEndHour) ? s.autoMessageEveningEndHour : 1;

  const isMorningSlot = hour >= mStart && hour < mEnd;
  const isEveningSlot = eEnd < eStart ? (hour >= eStart || hour < eEnd) : (hour >= eStart && hour < eEnd);

  return isMorningSlot || isEveningSlot;
}

async function getOrCreateConversationForTopic(topic) {
  try {
    const [host, user] = await Promise.all([
      Host.findById(topic.receiverId).select("name gender isFake").lean(),
      User.findById(topic.senderId).select("name gender").lean(),
    ]);

    if (!host || !user) return null;

    // 1. Get AI Profiles
    const profilesRes = await fetch(`${DATING_AI_BASE_URL}/api/profiles`, {
      method: "GET",
      headers: createAIHeaders("GET", "/api/profiles"),
    });

    let aiProfileId = null;
    if (profilesRes.ok) {
      const profiles = await profilesRes.json();
      const hostNameLower = (host.name || "").toLowerCase().trim();
      const matched = profiles.find((p) => (p.name || "").toLowerCase().trim() === hostNameLower);
      if (matched) {
        aiProfileId = matched.id;
      } else if (profiles.length > 0) {
        aiProfileId = profiles[0].id;
      }
    }

    if (!aiProfileId) return null;

    // 2. Create or Get conversation
    const rawGender = (user?.gender ? String(user.gender) : "").toLowerCase().trim();
    const userGender = rawGender === "female" ? "female" : "male";
    const userName = (user?.name || "User").trim().slice(0, 60) || "User";

    const createPayload = {
      profile_id: aiProfileId,
      external_user_id: user._id.toString(),
      user_gender: userGender,
      user_name: userName,
    };

    const createRes = await fetch(`${DATING_AI_BASE_URL}/api/conversations`, {
      method: "POST",
      headers: createAIHeaders("POST", "/api/conversations", createPayload),
      body: JSON.stringify(createPayload),
    });

    if (createRes.ok) {
      const convo = await createRes.json();
      topic.aiConversationId = convo.conversation_id;
      await ChatTopic.updateOne(
        { _id: topic._id },
        { $set: { aiConversationId: convo.conversation_id } }
      );
      return convo.conversation_id;
    }
  } catch (e) {
    console.error("[AI Nudge Helper Error]:", e.message);
  }
  return null;
}

function startAINudgeJob() {
  console.log("⏰ AI Nudge Job initialized (Tier 2 & 3 Scheduler).");

  // Run every 1 minute
  cron.schedule("* * * * *", async () => {
    // If auto messages are disabled globally, do not nudge
    if (global.settingJSON && global.settingJSON.isAutoMessageEnabled === false) {
      return;
    }

    try {
      const now = new Date();
      const maxNudges = Number(global.settingJSON?.autoMessageMaxNudges) || 3;

      // 1. Reset unreplied cap if 4+ hours have passed since last interaction
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
      await ChatTopic.updateMany(
        {
          consecutiveNudgeCount: { $gte: maxNudges },
          updatedAt: { $lte: fourHoursAgo },
        },
        {
          $set: {
            consecutiveNudgeCount: 0,
            nextNudgeTime: new Date(),
          },
        }
      );

      // 2. Auto-initialize icebreaker topics for online users if any fake hosts are missing topics
      if (global.activeSockets && global.activeSockets.size > 0) {
        const onlineUserIds = Array.from(global.activeSockets.keys());
        const fakeHosts = await Host.find({ isFake: true, isBlock: false }).select("_id name").limit(6).lean();

        for (const uid of onlineUserIds) {
          for (const fHost of fakeHosts) {
            const existing = await ChatTopic.findOne({ senderId: uid, receiverId: fHost._id });
            if (!existing) {
              const newTopic = new ChatTopic({
                senderId: uid,
                receiverId: fHost._id,
                consecutiveNudgeCount: 0,
                nextNudgeTime: new Date(),
              });
              await newTopic.save();
              await getOrCreateConversationForTopic(newTopic);
            }
          }
        }
      }

      // 3. Find active topics eligible for nudge
      const activeTopics = await ChatTopic.find({
        consecutiveNudgeCount: { $lt: maxNudges },
        $or: [
          { nextNudgeTime: { $lte: now } },
          { nextNudgeTime: null },
        ],
      }).limit(25);

      if (activeTopics.length > 0) {
        console.log(`[AI Nudge] Found ${activeTopics.length} AI topic(s) eligible for nudge.`);
      }

      for (const topic of activeTopics) {
        try {
          const userId = topic.senderId?.toString();

          // Check user presence:
          const isUserSocketConnected = global.activeSockets && global.activeSockets.has(userId);
          const isUserInThisChat = global.activeChatUsers && global.activeChatUsers.get(userId) === topic._id.toString();

          // If user is actively inside this chat, Tier 1 in-chat timer handles it
          if (isUserInThisChat) {
            continue;
          }

          // If user is offline (App Closed - Tier 3), check active time window
          if (!isUserSocketConnected) {
            if (!isBackgroundPushAllowed()) {
              continue;
            }
          }

          // Ensure conversation ID exists
          let convId = topic.aiConversationId;
          if (!convId) {
            convId = await getOrCreateConversationForTopic(topic);
          }
          if (!convId) {
            continue;
          }

          console.log(`[AI Nudge] Triggering Tier ${isUserSocketConnected ? "2 (In-App)" : "3 (App-Closed)"} nudge for conversation: ${convId}`);

          let res = await fetch(`${DATING_AI_BASE_URL}/api/conversations/${convId}/nudge`, {
            method: "POST",
            headers: createAIHeaders("POST", `/api/conversations/${convId}/nudge`),
          });

          // If 404 (conversation expired on AI service), recreate and retry
          if (res.status === 404) {
            console.warn(`[AI Nudge] Conversation ${convId} returned 404. Recreating conversation...`);
            convId = await getOrCreateConversationForTopic(topic);
            if (convId) {
              res = await fetch(`${DATING_AI_BASE_URL}/api/conversations/${convId}/nudge`, {
                method: "POST",
                headers: createAIHeaders("POST", `/api/conversations/${convId}/nudge`),
              });
            }
          }

          if (res.ok) {
            const aiResponseData = await res.json();
            await handleAIResponse(aiResponseData, topic);

            // Increment consecutive nudge count
            topic.consecutiveNudgeCount = (topic.consecutiveNudgeCount || 0) + 1;
            topic.lastSenderRole = "host";
            topic.lastInteractionAt = new Date();

            const configuredDelayMins = Number(global.settingJSON?.messageInitiatedAt) || 5;
            if (isUserSocketConnected) {
              topic.nextNudgeTime = new Date(Date.now() + Math.max(60 * 1000, configuredDelayMins * 60 * 1000));
            } else {
              const randomIntervalMs = Math.floor(Math.random() * (30 - 15 + 1) + 15) * 60 * 1000;
              topic.nextNudgeTime = new Date(Date.now() + randomIntervalMs);
            }

            await topic.save();
            console.log(`[AI Nudge] Nudge #${topic.consecutiveNudgeCount} sent for ${convId}. Next nudge at: ${topic.nextNudgeTime}`);
          } else {
            console.log(`[AI Nudge] AI server rejected nudge for ${convId} with status ${res.status}`);
          }
        } catch (error) {
          console.log(`[AI Nudge Error] Failed to process ${topic.aiConversationId || topic._id}:`, error.message);
        }
      }
    } catch (err) {
      console.error("[AI Nudge] Error running cron job:", err.message);
    }
  });
}

module.exports = startAINudgeJob;
