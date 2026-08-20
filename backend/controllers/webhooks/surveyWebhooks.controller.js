const rewardEngine = require("../../services/rewardEngine.service");
const SurveyProvider = require("../../models/surveyProvider.model");
const RewardSystemLog = require("../../models/rewardSystemLog.model");

/**
 * POST /api/client/bitlabs/webhook
 * BitLabs Callback Handler
 * Accepts postback params: uid / val / tx_id / hash / etc.
 */
exports.handleBitLabsWebhook = async (req, res) => {
  try {
    const payload = req.method === "POST" ? req.body : req.query;
    console.log("[BitLabs Webhook Received]", payload);

    const userId = payload.uid || payload.user_id || payload.subId;
    const transactionId = payload.tx_id || payload.transaction_id || payload.txId;
    const usdAmount = parseFloat(payload.val || payload.amount || payload.reward || 0);
    const signature = payload.hash || payload.signature || "";

    if (!userId || !transactionId) {
      return res.status(400).json({ status: "error", message: "Missing required parameters: uid or tx_id" });
    }

    const provider = await SurveyProvider.findOne({ name: "bitlabs" });
    const isSigValid = rewardEngine.validateBitLabsSignature(payload, provider ? provider.secretKey : "", signature);

    if (!isSigValid) {
      return res.status(401).json({ status: "error", message: "Invalid hash signature" });
    }

    const result = await rewardEngine.processSurveyCallback({
      providerName: "bitlabs",
      transactionId,
      userId,
      usdAmount,
      surveyId: payload.survey_id || "",
      rawPayload: payload,
      signature,
    });

    return res.status(200).json({ status: "success", result });
  } catch (err) {
    console.error("BitLabs Webhook Error:", err);
    await RewardSystemLog.create({
      level: "error",
      source: "BitLabsWebhook",
      message: err.message,
      stackTrace: err.stack,
    });
    return res.status(500).json({ status: "error", message: err.message });
  }
};

/**
 * POST /api/client/cpx/webhook
 * CPX Research Callback Handler
 * Postback params: user_id / trans_id / amount_local / hash / status / etc.
 */
exports.handleCPXWebhook = async (req, res) => {
  try {
    const payload = req.method === "POST" ? req.body : req.query;
    console.log("[CPX Research Webhook Received]", payload);

    const userId = payload.user_id || payload.subId || payload.uid;
    const transactionId = payload.trans_id || payload.transaction_id || payload.tx_id;
    const usdAmount = parseFloat(payload.amount_local || payload.amount_usd || payload.reward || 0);
    const signature = payload.hash || payload.secure_hash || payload.signature || "";
    const status = payload.status !== undefined ? String(payload.status) : "1"; // 1 = completed, 2 = canceled

    if (!userId || !transactionId) {
      return res.status(400).send("ERROR: Missing user_id or trans_id");
    }

    const provider = await SurveyProvider.findOne({ name: "cpx" });
    const secretKey = (provider && provider.secretKey) ? provider.secretKey : "WGoFs3p9spEZr4Ozcq2WmPyBjcrxMmOr";
    const isSigValid = rewardEngine.validateCPXSignature(transactionId, secretKey, signature);

    if (!isSigValid) {
      return res.status(401).send("ERROR: Invalid signature");
    }

    // Handle Canceled / Fraud status (status = 2)
    if (status === "2") {
      console.log(`[CPX Webhook] Survey Canceled/Chargeback for txId: ${transactionId}, userId: ${userId}`);
      await RewardSystemLog.create({
        level: "warn",
        source: "CPXWebhook",
        message: `CPX survey canceled by provider for txId: ${transactionId}, userId: ${userId}`,
        stackTrace: JSON.stringify(payload),
      });
      return res.status(200).send("OK");
    }

    const result = await rewardEngine.processSurveyCallback({
      providerName: "cpx",
      transactionId,
      userId,
      usdAmount,
      surveyId: payload.survey_id || payload.offer_id || "",
      rawPayload: payload,
      signature,
    });

    // CPX expects literal text response "OK" or "1"
    return res.status(200).send("OK");
  } catch (err) {
    console.error("CPX Webhook Error:", err);
    await RewardSystemLog.create({
      level: "error",
      source: "CPXWebhook",
      message: err.message,
      stackTrace: err.stack,
    });
    return res.status(500).send("ERROR");
  }
};

/**
 * ALL /api/client/adgem/webhook
 * AdGem S2S Callback Handler
 * Postback params: player_id / user_id / amount / payout / transaction_id / campaign_id / signature
 */
exports.handleAdGemWebhook = async (req, res) => {
  try {
    const payload = req.method === "POST" ? req.body : req.query;
    console.log("[AdGem Webhook Received]", payload);

    const userId = payload.player_id || payload.user_id || payload.subId || payload.uid;
    const transactionId = payload.transaction_id || payload.tx_id || payload.trans_id || payload.id;
    const usdAmount = parseFloat(payload.payout || 0);
    const coinsAmount = parseInt(payload.amount || 0, 10);
    const signature = payload.signature || payload.verifier || payload.hash || "";

    if (!userId || !transactionId) {
      return res.status(400).send("ERROR: Missing player_id or transaction_id");
    }

    const provider = await SurveyProvider.findOne({ name: "adgem" });
    const secretKey = (provider && provider.secretKey) ? provider.secretKey : (global.settingJSON?.adgemSecretKey || "");
    const isSigValid = rewardEngine.validateAdGemSignature(transactionId, secretKey, signature);

    if (!isSigValid) {
      return res.status(401).send("ERROR: Invalid signature");
    }

    const result = await rewardEngine.processSurveyCallback({
      providerName: "adgem",
      transactionId,
      userId,
      usdAmount,
      coinsEarned: coinsAmount > 0 ? coinsAmount : 0,
      surveyId: payload.campaign_id || payload.offer_id || payload.campaign_name || "adgem_offer",
      rawPayload: payload,
      signature,
    });

    // AdGem expects HTTP 200 with OK or 1
    return res.status(200).send("OK");
  } catch (err) {
    console.error("AdGem Webhook Error:", err);
    await RewardSystemLog.create({
      level: "error",
      source: "AdGemWebhook",
      message: err.message,
      stackTrace: err.stack,
    });
    return res.status(500).send("ERROR");
  }
};

/**
 * POST or GET /api/client/theoremreach/webhook
 * TheoremReach Callback / S2S Postback Handler
 * Parameters: user_id / reward / tx_id / status / hash / etc.
 */
exports.handleTheoremReachWebhook = async (req, res) => {
  try {
    const payload = req.method === "POST" ? req.body : req.query;
    console.log("[TheoremReach Webhook Received]", payload);

    const userId = payload.user_id || payload.uid || payload.subid || payload.player_id;
    const transactionId = payload.transaction_id || payload.tx_id || payload.trans_id || payload.id || `tr_${Date.now()}`;
    const rewardCoins = parseInt(payload.reward || payload.amount || payload.points || payload.reward_amount || 0, 10);
    const usdAmount = parseFloat(payload.payout || payload.usd_amount || payload.val || 0);
    const signature = payload.hash || payload.signature || payload.enc || "";
    const resultStatus = payload.result || payload.status; // 10 = Complete

    if (!userId) {
      return res.status(400).send("ERROR: Missing user_id");
    }

    const provider = await SurveyProvider.findOne({ name: "theoremreach" });
    const secretKey = (provider && provider.secretKey) ? provider.secretKey : (global.settingJSON?.theoremreachSecretKey || "");
    const fullUrl = (req.protocol + "://" + req.get("host") + req.originalUrl).split("&hash=")[0].split("?hash=")[0];
    const isSigValid = rewardEngine.validateTheoremReachSignature(payload, secretKey, signature, fullUrl);

    if (!isSigValid) {
      return res.status(401).send("ERROR: Invalid signature");
    }

    const result = await rewardEngine.processSurveyCallback({
      providerName: "theoremreach",
      transactionId,
      userId,
      usdAmount,
      coinsEarned: rewardCoins > 0 ? rewardCoins : 0,
      surveyId: payload.survey_id || payload.campaign_id || "theoremreach_survey",
      rawPayload: payload,
      signature,
    });

    // TheoremReach expects HTTP 200 with OK or 1
    return res.status(200).send("OK");
  } catch (err) {
    console.error("TheoremReach Webhook Error:", err);
    await RewardSystemLog.create({
      level: "error",
      source: "TheoremReachWebhook",
      message: err.message,
      stackTrace: err.stack,
    });
    return res.status(500).send("ERROR");
  }
};

/**
 * POST /api/client/survey/test-callback
 * Sandbox Callback Simulator for Testing Integrations
 */
exports.handleTestCallback = async (req, res) => {
  try {
    const { providerName = "bitlabs", userId, coins = 100, usdAmount = 1.0 } = req.body;
    if (!userId) {
      return res.status(400).json({ status: false, message: "userId is required for test callback" });
    }

    const testTxId = `test_tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const result = await rewardEngine.processSurveyCallback({
      providerName,
      transactionId: testTxId,
      userId,
      usdAmount,
      coinsEarned: coins,
      surveyId: "test_survey_99",
      rawPayload: { isTest: true, ...req.body },
    });

    return res.status(200).json({ status: true, message: "Test callback executed successfully", result });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};
