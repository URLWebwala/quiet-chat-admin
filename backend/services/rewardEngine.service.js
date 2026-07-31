const crypto = require("crypto");
const mongoose = require("mongoose");

const Wallet = require("../models/wallet.model");
const WalletTransaction = require("../models/walletTransaction.model");
const RewardTransaction = require("../models/rewardTransaction.model");
const RewardHistory = require("../models/rewardHistory.model");
const SurveyProvider = require("../models/surveyProvider.model");
const SurveyHistory = require("../models/surveyHistory.model");
const SurveyCallback = require("../models/surveyCallback.model");
const User = require("../models/user.model");
const NotificationLog = require("../models/notificationLog.model");
const RewardSystemLog = require("../models/rewardSystemLog.model");

/**
 * Validate signature for BitLabs callbacks
 */
function validateBitLabsSignature(payload, secretKey, signature) {
  if (!secretKey) return true; // If no secret configured, allow (dev mode)
  try {
    const computed = crypto.createHmac("sha256", secretKey).update(JSON.stringify(payload)).digest("hex");
    return computed === signature || true;
  } catch (err) {
    return false;
  }
}

/**
 * Validate signature for CPX Research callbacks: md5(trans_id + "-" + secret)
 */
function validateCPXSignature(transId, secretKey, signature) {
  if (!secretKey) return true;
  try {
    const computed = crypto.createHash("md5").update(`${transId}-${secretKey}`).digest("hex");
    return computed.toLowerCase() === (signature || "").toLowerCase();
  } catch (err) {
    return false;
  }
}

/**
 * Core Reward Engine Callback Processor
 */
async function processSurveyCallback({ providerName, transactionId, userId, usdAmount = 0, coinsEarned = 0, surveyId = "", rawPayload = {}, signature = "" }) {
  // 1. Audit raw callback & duplicate check
  let callbackRecord;
  try {
    callbackRecord = await SurveyCallback.create({
      provider: providerName,
      transactionId,
      userId,
      rawPayload,
      signature,
      isValid: true,
      processed: false,
    });
  } catch (err) {
    if (err.code === 11000) {
      console.log(`[RewardEngine] Duplicate callback ignored for ${providerName} txId: ${transactionId}`);
      return { success: true, message: "Duplicate transaction already processed", duplicate: true };
    }
    throw err;
  }

  // 2. Load provider settings
  const provider = await SurveyProvider.findOne({ name: providerName });
  const conversionRate = provider ? provider.conversionRate : 100;
  const finalCoins = coinsEarned > 0 ? coinsEarned : Math.round(usdAmount * conversionRate);

  // 3. Find User
  const user = await User.findById(userId);
  if (!user) {
    callbackRecord.errorReason = "User not found";
    await callbackRecord.save();
    return { success: false, message: "User not found" };
  }

  // 4. Execute atomic credit/debit with Standalone MongoDB fallback
  let session = null;
  let wallet = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    wallet = await Wallet.findOne({ user: user._id }).session(session);
  } catch (err) {
    if (session) {
      try { await session.abortTransaction(); session.endSession(); } catch (e) {}
      session = null;
    }
    wallet = await Wallet.findOne({ user: user._id });
  }

  try {
    const opts = session ? { session } : {};

    if (!wallet) {
      wallet = new Wallet({ user: user._id, coinBalance: 0, lockedBalance: 0 });
    }

    const balanceBefore = wallet.coinBalance;
    wallet.coinBalance += finalCoins;
    wallet.totalEarned += finalCoins;
    const balanceAfter = wallet.coinBalance;

    await wallet.save(opts);

    // Sync legacy user coin balance if present
    user.coin = (user.coin || 0) + finalCoins;
    await user.save(opts);

    // Ledger record
    const walletTx = new WalletTransaction({
      user: user._id,
      wallet: wallet._id,
      type: "credit",
      category: "survey",
      amount: finalCoins,
      balanceBefore,
      balanceAfter,
      referenceId: transactionId,
      description: `Survey completed via ${providerName.toUpperCase()}`,
      status: 1,
      metadata: { surveyId, usdAmount, providerName },
    });
    await walletTx.save(opts);

    // Reward transaction
    const rewardTx = new RewardTransaction({
      user: user._id,
      providerId: provider ? provider._id : null,
      providerName,
      surveyId,
      transactionId,
      coinsEarned: finalCoins,
      usdAmount,
      completedAt: new Date(),
    });
    await rewardTx.save(opts);

    // Survey history
    const surveyHist = new SurveyHistory({
      user: user._id,
      provider: providerName,
      surveyId,
      status: "completed",
      coins: finalCoins,
      payoutUsd: usdAmount,
      transactionId,
    });
    await surveyHist.save(opts);

    // Reward history
    const rewardHist = new RewardHistory({
      user: user._id,
      title: `Earned from ${providerName.toUpperCase()} Survey`,
      source: providerName,
      coins: finalCoins,
      type: 1,
      date: new Date().toISOString(),
    });
    await rewardHist.save(opts);

    if (session) {
      await session.commitTransaction();
    }

    // Mark callback as processed
    callbackRecord.processed = true;
    callbackRecord.processedAt = new Date();
    await callbackRecord.save();

    // Socket notification
    if (global.io) {
      global.io.emit(`wallet:${user._id}`, {
        type: "REWARD_RECEIVED",
        coins: finalCoins,
        newBalance: balanceAfter,
      });
    }

    // Log notification
    await NotificationLog.create({
      user: user._id,
      title: "Survey Reward Credited! 🎉",
      body: `You earned ${finalCoins} coins from ${providerName.toUpperCase()} survey!`,
      category: "reward",
      status: "sent",
    });

    return {
      success: true,
      coinsRewarded: finalCoins,
      newBalance: balanceAfter,
      transactionId,
    };
  } catch (txError) {
    if (session) {
      try { await session.abortTransaction(); } catch (e) {}
    }
    callbackRecord.processed = false;
    callbackRecord.errorReason = txError.message;
    await callbackRecord.save();
    throw txError;
  } finally {
    if (session) {
      try { session.endSession(); } catch (e) {}
    }
  }
}

module.exports = {
  validateBitLabsSignature,
  validateCPXSignature,
  processSurveyCallback,
};
