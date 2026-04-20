const mongoose = require("mongoose");
require("dotenv").config();

async function checkHost() {
  try {
    const dbUrl = "mongodb://localhost:27017/quiet-chat-admin"; // Adjust as needed
    // Let's try to find the actual DB URL from common places
    const fs = require("fs");
    const path = require("path");
    
    let mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/quiet-chat-admin";
    
    // Check index.js or config
    const indexContent = fs.readFileSync(path.join(__dirname, "../backend/index.js"), "utf8");
    const match = indexContent.match(/mongoose\.connect\(['"](.+?)['"]/);
    if (match) mongoUri = match[1];

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB:", mongoUri);

    const Host = mongoose.model("Host", new mongoose.Schema({
        uniqueId: String,
        status: Number,
        isOnline: Boolean,
        name: String,
        isBlock: Boolean
    }));

    const host = await Host.findOne({ uniqueId: "49158860" });
    if (host) {
        console.log("Host found:", JSON.stringify(host, null, 2));
    } else {
        console.log("Host with uniqueId 49158860 not found.");
        // Try searching by name
        const hostByName = await Host.findOne({ name: /Sima/i });
        if (hostByName) {
             console.log("Host found by name (Sima):", JSON.stringify(hostByName, null, 2));
        } else {
             console.log("No host found with name Sima.");
        }
    }

    mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
  }
}

checkHost();
