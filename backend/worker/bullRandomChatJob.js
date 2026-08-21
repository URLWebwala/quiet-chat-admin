// bullRandomChatJob.js - Disabled in favor of AI Nudge System
const Bull = require("bull");

const chatQueue = new Bull("chat-job-queue", {
  redis: {
    host: "127.0.0.1",
    port: 6379,
  },
});

// Process handler disabled: only AI Nudge handles auto-messages
chatQueue.process("repeat", async (job) => {
  console.log("⏹ Legacy random chat job is disabled. Only AI Nudge system is active.");
  return;
});

// Clean up all existing repeatable jobs to ensure only AI Nudge runs
const scheduleChatJob = async () => {
  try {
    const repeatJobs = await chatQueue.getRepeatableJobs();
    for (const job of repeatJobs) {
      console.log(`🗑 Removing legacy chat job: key=${job.key}`);
      await chatQueue.removeRepeatableByKey(job.key);
    }
    console.log("✅ Legacy random chat queue cleared. Only AI Nudge is active.");
  } catch (err) {
    console.error("Error clearing legacy chat queue:", err.message);
  }
};

scheduleChatJob.chatQueue = chatQueue;

module.exports = scheduleChatJob;
