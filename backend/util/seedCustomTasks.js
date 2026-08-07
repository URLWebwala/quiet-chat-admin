require("dotenv").config();
const mongoose = require("mongoose");
const CustomTask = require("../models/customTask.model");

const mongoUri = process.env.MongoDb_Connection_String || "mongodb://MzFssFLA0X:ZyabvHgsqU@45.113.225.185:27017/quietchat?authSource=admin";

console.log("Connecting to Mongo URI:", mongoUri);

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("MongoDB Connected successfully!");

    // Delete existing if any, and insert fresh sample tasks
    await CustomTask.deleteMany({});
    console.log("Cleared existing custom tasks.");

    const inserted = await CustomTask.insertMany([
      {
        title: "Follow us on Instagram",
        description: "Follow our official Instagram page @quietchatapp, take a screenshot of your following status and upload proof to earn 100 points.",
        actionUrl: "https://instagram.com",
        rewardPoints: 100,
        requireProof: true,
        maxCompletionsPerUser: 1,
        isActive: true,
      },
      {
        title: "Play Store 5-Star Review",
        description: "Give QuietChat a 5-star review on Play Store with positive feedback, take a screenshot of your review and submit proof to earn 200 points.",
        actionUrl: "https://play.google.com/store/apps/details?id=com.quietchat.video.live",
        rewardPoints: 200,
        requireProof: true,
        maxCompletionsPerUser: 1,
        isActive: true,
      },
      {
        title: "Join Official Telegram Channel",
        description: "Join our official Telegram channel for daily bonus reward updates and live announcements.",
        actionUrl: "https://telegram.org",
        rewardPoints: 50,
        requireProof: false,
        maxCompletionsPerUser: 1,
        isActive: true,
      },
    ]);

    console.log("Successfully inserted", inserted.length, "tasks into MongoDB!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
  });
