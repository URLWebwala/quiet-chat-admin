require("dotenv").config();
const mongoose = require("mongoose");
const CustomTask = require("../models/customTask.model");

const mongoUri = process.env.MongoDb_Connection_String || "mongodb://MzFssFLA0X:ZyabvHgsqU@45.113.225.185:27017/quietchat?authSource=admin";

console.log("Connecting to Live Mongo URI:", mongoUri);

const tasksToSeed = [
  {
    title: "Follow us on Instagram",
    description: "Follow our official Instagram handle @quietchatapp, take a screenshot of your following screen and submit proof to claim 100 points.",
    actionUrl: "https://instagram.com",
    rewardPoints: 100,
    requireProof: true,
    maxCompletionsPerUser: 1,
    isActive: true,
  },
  {
    title: "Play Store 5-Star Review",
    description: "Give QuietChat a 5-star review on Play Store with positive feedback, take a screenshot of your published review and submit proof.",
    actionUrl: "https://play.google.com/store/apps/details?id=com.quietchat.video.live",
    rewardPoints: 200,
    requireProof: true,
    maxCompletionsPerUser: 1,
    isActive: true,
  },
  {
    title: "Subscribe YouTube Channel",
    description: "Subscribe to QuietChat official YouTube channel and press the bell icon for video updates.",
    actionUrl: "https://youtube.com",
    rewardPoints: 150,
    requireProof: true,
    maxCompletionsPerUser: 1,
    isActive: true,
  },
  {
    title: "Join Official Telegram Group",
    description: "Join our official Telegram community group to stay updated on daily reward bonuses and app announcements.",
    actionUrl: "https://t.me",
    rewardPoints: 100,
    requireProof: false,
    maxCompletionsPerUser: 1,
    isActive: true,
  },
  {
    title: "Like & Follow Facebook Page",
    description: "Like and follow the official QuietChat Facebook page, upload a screenshot to get instant 100 reward points.",
    actionUrl: "https://facebook.com",
    rewardPoints: 100,
    requireProof: true,
    maxCompletionsPerUser: 1,
    isActive: true,
  },
  {
    title: "Follow Official Twitter / X",
    description: "Follow @quietchatapp on Twitter / X, upload screenshot proof of following to get 100 points.",
    actionUrl: "https://x.com",
    rewardPoints: 100,
    requireProof: true,
    maxCompletionsPerUser: 1,
    isActive: true,
  },
  {
    title: "Join Official Discord Community",
    description: "Join our vibrant Discord server to chat with users, creators, and participate in weekly giveaways.",
    actionUrl: "https://discord.gg",
    rewardPoints: 150,
    requireProof: false,
    maxCompletionsPerUser: 1,
    isActive: true,
  },
  {
    title: "Rate 5 Stars on iOS App Store",
    description: "Rate 5 stars on Apple App Store, take a screenshot of your review and submit for 200 points.",
    actionUrl: "https://apple.com",
    rewardPoints: 200,
    requireProof: true,
    maxCompletionsPerUser: 1,
    isActive: true,
  },
  {
    title: "Share QuietChat App Link",
    description: "Share QuietChat download link with your friends on WhatsApp or social media to claim instant bonus points.",
    actionUrl: "https://quietchat.in",
    rewardPoints: 100,
    requireProof: false,
    maxCompletionsPerUser: 1,
    isActive: true,
  },
  {
    title: "Watch Intro Video on YouTube",
    description: "Watch our 1-minute QuietChat app walkthrough video on YouTube to learn how to earn maximum rewards.",
    actionUrl: "https://youtube.com",
    rewardPoints: 75,
    requireProof: false,
    maxCompletionsPerUser: 1,
    isActive: true,
  },
  {
    title: "Instagram Story Tag Bonus",
    description: "Post a story on Instagram mentioning @quietchatapp, take a screenshot after 1 hour and submit proof.",
    actionUrl: "https://instagram.com",
    rewardPoints: 250,
    requireProof: true,
    maxCompletionsPerUser: 1,
    isActive: true,
  },
  {
    title: "Join Beta Tester Program",
    description: "Enroll in Play Store Beta program for early access features and submit screenshot proof.",
    actionUrl: "https://play.google.com/store/apps/details?id=com.quietchat.video.live",
    rewardPoints: 150,
    requireProof: true,
    maxCompletionsPerUser: 1,
    isActive: true,
  },
  {
    title: "Follow Founder on LinkedIn",
    description: "Follow QuietChat official LinkedIn company page and founder profile to earn 100 points.",
    actionUrl: "https://linkedin.com",
    rewardPoints: 100,
    requireProof: true,
    maxCompletionsPerUser: 1,
    isActive: true,
  },
  {
    title: "Complete App Feedback Form",
    description: "Fill our quick 2-minute user experience feedback form to help us improve your chat experience.",
    actionUrl: "https://quietchat.in",
    rewardPoints: 120,
    requireProof: false,
    maxCompletionsPerUser: 1,
    isActive: true,
  },
  {
    title: "Daily VIP Community Check-In",
    description: "Check in to our daily VIP community announcement board and get instant 100 reward points.",
    actionUrl: "https://quietchat.in",
    rewardPoints: 100,
    requireProof: false,
    maxCompletionsPerUser: 1,
    isActive: true,
  },
];

mongoose
  .connect(mongoUri)
  .then(async () => {
    console.log("Connected to Live MongoDB!");

    // Clear old sample tasks
    await CustomTask.deleteMany({});
    console.log("Cleared existing custom tasks.");

    // Insert 15 realistic custom tasks
    const inserted = await CustomTask.insertMany(tasksToSeed);
    console.log(`Successfully inserted ${inserted.length} custom tasks into Live MongoDB!`);

    process.exit(0);
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
  });
