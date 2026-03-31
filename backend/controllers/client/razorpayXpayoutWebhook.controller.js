const crypto = require("crypto");
const mongoose = require("mongoose");
const WithdrawalRequest = require("../../models/withdrawalRequest.model");
const Host = require("../../models/host.model");
const History = require("../../models/history.model");
const { WITHDRAWAL_STATUS } = require("../../types/constant");

/**
 * RazorpayX payout webhooks — mount with express.raw({ type: "application/json" }).
 * Events: payout.processed, payout.failed, payout.reversed (and queued handled as processing).
 */
exports.handleRazorpayPayoutWebhook = async (req, res) => {
  try {
    const rawBody = req.body;
    const signature = req.headers["x-razorpay-signature"];
    const secret =
      global.settingJSON?.razorpayXPayoutWebhookSecret?.trim() || global.settingJSON?.razorpaySecretKey?.trim();

    if (!secret || !signature) {
      console.warn("[RazorpayX Payout Webhook] Missing secret or signature");
      return res.status(400).send("Bad request");
    }

    const buf = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody || ""), "utf8");
    const expectedSign = crypto.createHmac("sha256", secret).update(buf).digest("hex");
    if (expectedSign !== signature) {
      console.warn("[RazorpayX Payout Webhook] Invalid signature");
      return res.status(400).send("Invalid signature");
    }

    const payload = JSON.parse(buf.toString("utf8"));
    const event = payload.event || "";
    const payoutEntity = payload.payload?.payout?.entity;
    if (!payoutEntity || !payoutEntity.id) {
      return res.status(200).send("OK");
    }

    const payoutId = payoutEntity.id;
    const referenceId = payoutEntity.reference_id || "";
    const status = (payoutEntity.status || "").toLowerCase();

    let withdrawal = await WithdrawalRequest.findOne({ razorpayPayoutId: payoutId }).lean();
    if (!withdrawal && referenceId && referenceId.startsWith("wd_")) {
      const oid = referenceId.replace(/^wd_/, "");
      if (mongoose.Types.ObjectId.isValid(oid)) {
        withdrawal = await WithdrawalRequest.findById(oid).lean();
      }
    }
    if (!withdrawal || withdrawal.person !== 2) {
      return res.status(200).send("OK");
    }

    const dateNow = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

    if (event === "payout.processed" || status === "processed") {
      if (withdrawal.status === WITHDRAWAL_STATUS.ACCEPTED) {
        return res.status(200).send("OK");
      }
      await Promise.all([
        WithdrawalRequest.updateOne(
          { _id: withdrawal._id, status: WITHDRAWAL_STATUS.PAYOUT_PROCESSING },
          {
            $set: {
              status: WITHDRAWAL_STATUS.ACCEPTED,
              acceptOrDeclineDate: dateNow,
              payoutLastError: "",
            },
          }
        ),
        History.updateOne(
          { uniqueId: withdrawal.uniqueId, type: 5 },
          { $set: { payoutStatus: WITHDRAWAL_STATUS.ACCEPTED, date: dateNow } }
        ),
      ]);
      return res.status(200).send("OK");
    }

    if (event === "payout.failed" || event === "payout.reversed" || status === "failed" || status === "reversed") {
      const reason = payoutEntity.status_details?.description || payoutEntity.failure_reason || event;

      if (withdrawal.status === WITHDRAWAL_STATUS.PAYOUT_FAILED) {
        return res.status(200).send("OK");
      }

      if (withdrawal.status === WITHDRAWAL_STATUS.PAYOUT_PROCESSING) {
        await Host.updateOne(
          { _id: withdrawal.hostId },
          {
            $inc: {
              coin: withdrawal.coin,
              redeemedCoins: -withdrawal.coin,
              redeemedAmount: -withdrawal.amount,
            },
          }
        );
      }

      await Promise.all([
        WithdrawalRequest.updateOne(
          { _id: withdrawal._id },
          {
            $set: {
              status: WITHDRAWAL_STATUS.PAYOUT_FAILED,
              payoutLastError: String(reason).slice(0, 500),
              acceptOrDeclineDate: dateNow,
            },
          }
        ),
        History.updateOne(
          { uniqueId: withdrawal.uniqueId, type: 5 },
          { $set: { payoutStatus: WITHDRAWAL_STATUS.PAYOUT_FAILED, reason: String(reason).slice(0, 500), date: dateNow } }
        ),
      ]);
      return res.status(200).send("OK");
    }

    return res.status(200).send("OK");
  } catch (e) {
    console.error("[RazorpayX Payout Webhook]", e);
    return res.status(500).send("Error");
  }
};
