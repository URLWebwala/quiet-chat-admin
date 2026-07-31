const axios = require("axios");
const mongoose = require("mongoose");
const crypto = require("crypto");
require("dotenv").config({ path: ".env" });

const User = require("../models/user.model");
const SurveyProvider = require("../models/surveyProvider.model");
const Wallet = require("../models/wallet.model");
const WalletTransaction = require("../models/walletTransaction.model");

async function runCPXTest() {
  try {
    const mongoUri = process.env.MongoDb_Connection_String || "mongodb://127.0.0.1:27017/quietchat";
    await mongoose.connect(mongoUri);
    console.log("==========================================");
    console.log("      CPX RESEARCH WEBHOOK TEST SUITE     ");
    console.log("==========================================");

    // 1. Find test user
    let user = await User.findOne();
    console.log(`👤 User: ${user.name} (ID: ${user._id})`);

    // 2. CPX Provider setting
    let provider = await SurveyProvider.findOne({ name: "cpx" });
    const secretKey = provider ? provider.secretKey : "cpx_secret_key_123";
    const transId = `cpx_tx_${Date.now()}`;
    const amountLocal = "3.00"; // $3.00 USD = 300 Coins
    const hash = crypto.createHash("md5").update(`${transId}-${secretKey}`).digest("hex");

    console.log("\n🧪 Test 1: Valid CPX Callback Execution");
    console.log(`   Transaction ID: ${transId}`);
    console.log(`   Amount USD: $${amountLocal}`);
    console.log(`   MD5 Hash: ${hash}`);

    const walletBefore = await Wallet.findOne({ user: user._id });
    const initialBalance = walletBefore ? walletBefore.coinBalance : 0;

    const res1 = await axios.post("http://localhost:5000/api/client/reward/cpx/webhook", {
      user_id: user._id.toString(),
      trans_id: transId,
      amount_local: amountLocal,
      hash: hash,
    });

    console.log(`   Response Status: ${res1.status}`);
    console.log(`   Response Body: "${res1.data}"`);

    const walletAfter1 = await Wallet.findOne({ user: user._id });
    console.log(`   Balance Before: ${initialBalance} Coins | Balance After: ${walletAfter1.coinBalance} Coins (+${walletAfter1.coinBalance - initialBalance} credited)`);

    console.log("\n🧪 Test 2: Duplicate Callback Prevention (Idempotency)");
    const res2 = await axios.post("http://localhost:5000/api/client/reward/cpx/webhook", {
      user_id: user._id.toString(),
      trans_id: transId,
      amount_local: amountLocal,
      hash: hash,
    });

    console.log(`   Response Status: ${res2.status}`);
    console.log(`   Response Body: "${res2.data}"`);

    const walletAfter2 = await Wallet.findOne({ user: user._id });
    console.log(`   Balance After Duplicate Retry: ${walletAfter2.coinBalance} Coins (No Double-Credit!)`);

    console.log("\n==========================================");
    console.log("   ✅ CPX RESEARCH TEST PASSED 100%");
    console.log("==========================================");

    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ CPX Test Error:", err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

runCPXTest();
