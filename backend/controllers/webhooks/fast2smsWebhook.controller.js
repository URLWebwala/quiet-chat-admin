const RewardSystemLog = require("../../models/rewardSystemLog.model");

/**
 * POST /api/client/fast2sms/webhook
 * Handles Fast2SMS Webhooks for WhatsApp & OTP delivery status reports
 */
exports.handleFast2SMSWebhook = async (req, res) => {
  try {
    const payload = req.method === "POST" ? req.body : req.query;
    console.log("[Fast2SMS Webhook Received]", JSON.stringify(payload));

    const requestId = payload.request_id || payload.requestId || "";
    const mobile = payload.mobile || payload.recipient_id || "";
    const status = String(payload.status || payload.status_description || "UNKNOWN").toUpperCase();
    const failureReason = payload.failure_reason || payload.description || "";
    const amountDebited = payload.amount_debited || 0;

    // Log webhook event for audit & delivery tracking
    await RewardSystemLog.create({
      level: status === "DELIVERED" || status === "SUCCESS" ? "info" : "warn",
      source: "Fast2SMSWebhook",
      message: `Fast2SMS WhatsApp/OTP report: Mobile=${mobile}, Status=${status}, ReqId=${requestId}${failureReason ? `, Reason=${failureReason}` : ""}`,
      stackTrace: JSON.stringify(payload),
    });

    // Fast2SMS expects 200 OK status
    return res.status(200).json({ status: "success", message: "Fast2SMS Webhook processed successfully" });
  } catch (err) {
    console.error("Fast2SMS Webhook Error:", err);
    return res.status(200).json({ status: "error", message: err.message });
  }
};
