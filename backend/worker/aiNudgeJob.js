const cron = require("node-cron");
const ChatTopic = require("../models/chatTopic.model");
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

      // Find active AI topics that need a nudge (max consecutive unreplied nudges)
      const activeTopics = await ChatTopic.find({
        aiConversationId: { $ne: null },
        consecutiveNudgeCount: { $lt: maxNudges },
        $or: [
          { nextNudgeTime: { $lte: now } },
          { nextNudgeTime: null }
        ]
      });

      if (activeTopics.length > 0) {
        console.log(`[AI Nudge] Found ${activeTopics.length} AI topic(s) eligible for nudge.`);
      }

      for (const topic of activeTopics) {
        try {
          const userId = topic.senderId?.toString();
          
          // Check user presence:
          // Is user currently connected on socket?
          const isUserSocketConnected = global.activeSockets && global.activeSockets.has(userId);
          
          // Is user actively viewing this specific chat topic right now?
          const isUserInThisChat = global.activeChatUsers && global.activeChatUsers.get(userId) === topic._id.toString();

          // If user is actively inside this chat, Tier 1 in-chat timer handles it
          if (isUserInThisChat) {
            continue;
          }

          // If user is offline (App Closed - Tier 3), check active time window
          if (!isUserSocketConnected) {
            if (!isBackgroundPushAllowed()) {
              console.log(`[AI Nudge] Skipping offline push for ${userId} (outside 6AM-1PM & 5PM-1AM IST window).`);
              continue;
            }
          }

          console.log(`[AI Nudge] Triggering Tier ${isUserSocketConnected ? '2 (In-App)' : '3 (App-Closed)'} nudge for conversation: ${topic.aiConversationId}`);

          const res = await fetch(`${DATING_AI_BASE_URL}/api/conversations/${topic.aiConversationId}/nudge`, {
            method: 'POST',
            headers: createAIHeaders("POST", `/api/conversations/${topic.aiConversationId}/nudge`)
          });

          if (res.ok) {
            const aiResponseData = await res.json();
            await handleAIResponse(aiResponseData, topic);

            // Increment consecutive nudge count
            topic.consecutiveNudgeCount = (topic.consecutiveNudgeCount || 0) + 1;
            topic.lastSenderRole = "host";
            topic.lastInteractionAt = new Date();

            // Next schedule interval:
            // If in-app outside chat (Tier 2): configured message delay (e.g. 5 mins, min 1 min)
            // If app closed (Tier 3): 15-30 minutes gap
            const configuredDelayMins = Number(global.settingJSON?.messageInitiatedAt) || 5;
            if (isUserSocketConnected) {
              topic.nextNudgeTime = new Date(Date.now() + Math.max(60 * 1000, configuredDelayMins * 60 * 1000));
            } else {
              const randomIntervalMs = Math.floor(Math.random() * (30 - 15 + 1) + 15) * 60 * 1000;
              topic.nextNudgeTime = new Date(Date.now() + randomIntervalMs);
            }

            await topic.save();
            console.log(`[AI Nudge] Nudge #${topic.consecutiveNudgeCount} sent for ${topic.aiConversationId}. Next nudge at: ${topic.nextNudgeTime}`);
          } else {
            console.log(`[AI Nudge] AI server rejected nudge for ${topic.aiConversationId} with status ${res.status}`);
          }
        } catch (error) {
          console.log(`[AI Nudge Error] Failed to process ${topic.aiConversationId}:`, error.message);
        }
      }
    } catch (err) {
      console.error("[AI Nudge] Error running cron job:", err.message);
    }
  });
}

module.exports = startAINudgeJob;
