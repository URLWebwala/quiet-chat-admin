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
 * Postback params: user_id / trans_id / amount_local / hash / etc.
 */
exports.handleCPXWebhook = async (req, res) => {
  try {
    const payload = req.method === "POST" ? req.body : req.query;
    console.log("[CPX Research Webhook Received]", payload);

    const userId = payload.user_id || payload.subId || payload.uid;
    const transactionId = payload.trans_id || payload.transaction_id || payload.tx_id;
    const usdAmount = parseFloat(payload.amount_local || payload.amount_usd || payload.reward || 0);
    const signature = payload.hash || payload.signature || "";

    if (!userId || !transactionId) {
      return res.status(400).send("ERROR: Missing user_id or trans_id");
    }

    const provider = await SurveyProvider.findOne({ name: "cpx" });
    const isSigValid = rewardEngine.validateCPXSignature(transactionId, provider ? provider.secretKey : "", signature);

    if (!isSigValid) {
      return res.status(401).send("ERROR: Invalid signature");
    }

    const result = await rewardEngine.processSurveyCallback({
      providerName: "cpx",
      transactionId,
      userId,
      usdAmount,
      surveyId: payload.survey_id || "",
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
