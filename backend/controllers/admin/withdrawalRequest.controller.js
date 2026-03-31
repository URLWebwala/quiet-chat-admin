const WithdrawalRequest = require("../../models/withdrawalRequest.model");

//import model
const History = require("../../models/history.model");
const Agency = require("../../models/agency.model");
const Host = require("../../models/host.model");
const { WITHDRAWAL_STATUS, WITHDRAWAL_PERSON } = require("../../types/constant");
const { createPayoutForWithdrawal } = require("../../util/razorpayXPayout");

//private key
const admin = require("../../util/privateKey");

//mongoose
const mongoose = require("mongoose");

//get withdrawal requests ( hosts / agency )
exports.retrievePayoutRequests = async (req, res) => {
  try {
    const { status, person } = req.query;

    if (!status || !person) {
      return res.status(200).json({ status: false, message: "Invalid query parameters." });
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";

    let dateFilterQuery = {};
    if (startDate !== "All" && endDate !== "All") {
      const formattedStartDate = new Date(startDate);
      const formattedEndDate = new Date(endDate);
      formattedEndDate.setHours(23, 59, 59, 999);

      dateFilterQuery = {
        createdAt: {
          $gte: formattedStartDate,
          $lte: formattedEndDate,
        },
      };
    }

    let statusQuery = {};
    if (status !== "All") {
      const parts = String(status)
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n));
      if (parts.length === 1) {
        statusQuery.status = parts[0];
      } else if (parts.length > 1) {
        statusQuery.status = { $in: parts };
      }
    }

    let personQuery = {};
    if (person !== "All") {
      const personValue = parseInt(person);
      personQuery.person = personValue;

      if (personValue === 1) {
        personQuery.agencyId = { $ne: null };
      } else if (personValue === 2) {
        personQuery.hostId = { $ne: null };
      }
    }

    const [totalRecords, records] = await Promise.all([
      WithdrawalRequest.countDocuments({
        ...personQuery,
        ...statusQuery,
        ...dateFilterQuery,
      }),
      WithdrawalRequest.find({
        ...personQuery,
        ...statusQuery,
        ...dateFilterQuery,
      })
        .populate("agencyId", "uniqueId name image")
        .populate("hostId", "uniqueId name image")
        .sort({ createdAt: -1 })
        .skip((start - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      status: true,
      message: "Withdrawal requests retrieved successfully.",
      total: totalRecords,
      data: records.length > 0 ? records : [],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//accept or decline withdrawal requests ( agency )
exports.updateAgencyWithdrawalStatus = async (req, res) => {
  try {
    const { requestId, agencyId, type, reason } = req.query;

    if (!requestId || !agencyId || !type) {
      return res.status(200).json({ status: false, message: "Missing required parameters." });
    }

    const actionType = type.trim().toLowerCase();
    const dateNow = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

    const [request, agency] = await Promise.all([
      WithdrawalRequest.findById(requestId).lean().select("_id agencyId coin amount status uniqueId"),
      Agency.findById(agencyId).lean().select("_id isBlock fcmToken netAvailableEarnings"),
    ]);

    if (!request) return res.status(200).json({ status: false, message: "Withdrawal request not found." });
    if (!agency) return res.status(200).json({ status: false, message: "Agency not found." });
    if (agency.isBlock) return res.status(403).json({ status: false, message: "Agency is blocked by admin." });

    if (request.status === WITHDRAWAL_STATUS.ACCEPTED) {
      return res.status(200).json({ status: false, message: "Request already approved." });
    }
    if (request.status === WITHDRAWAL_STATUS.DECLINED) {
      return res.status(200).json({ status: false, message: "Request already declined." });
    }

    if (actionType === "approve") {
      const agencyBalance = Number(agency.netAvailableEarnings || 0);

      if (agencyBalance < request.coin) {
        return res.status(200).json({
          status: false,
          message: "Insufficient earnings. Agency does not have enough coins to withdraw.",
        });
      }

      res.status(200).json({
        status: true,
        message: "Withdrawal request approved successfully.",
      });

      await Promise.all([
        WithdrawalRequest.updateOne(
          { _id: request._id, person: WITHDRAWAL_PERSON.AGENCY, agencyId: agencyId },
          {
            $set: {
              status: WITHDRAWAL_STATUS.ACCEPTED,
              acceptOrDeclineDate: dateNow,
            },
          }
        ),
        History.updateOne(
          { uniqueId: request.uniqueId, type: 5 },
          {
            $set: {
              payoutStatus: WITHDRAWAL_STATUS.ACCEPTED,
              date: dateNow,
            },
          }
        ),
        Agency.updateOne(
          {
            _id: agencyId,
            netAvailableEarnings: { $gte: request.coin },
          },
          {
            $inc: {
              netAvailableEarnings: -request.coin,
              totalWithdrawn: request.coin,
              totalWithdrawnAmount: request.amount,
            },
          }
        ),
      ]);

      if (agency.fcmToken) {
        const payload = {
          token: agency.fcmToken,
          data: {
            title: "✅ Withdrawal Approved!",
            body: "🎉 Great news! Your withdrawal has been successfully approved. Keep up the great work! 💼💰",
            type: "WITHDRAWREQUEST",
          },
        };

        const adminInstance = await admin;
        adminInstance
          .messaging()
          .send(payload)
          .catch((err) => {
            console.error("FCM error:", err.message);
          });
      }
    } else if (actionType === "reject") {
      if (!reason) {
        return res.status(200).json({ status: false, message: "Rejection reason is required." });
      }

      res.status(200).json({
        status: true,
        message: "Withdrawal request declined.",
      });

      await Promise.all([
        WithdrawalRequest.updateOne(
          { _id: request._id },
          {
            $set: {
              status: WITHDRAWAL_STATUS.DECLINED,
              reason: reason.trim(),
              acceptOrDeclineDate: dateNow,
            },
          }
        ),
        History.updateOne(
          { uniqueId: request.uniqueId, type: 5 },
          {
            $set: {
              payoutStatus: WITHDRAWAL_STATUS.DECLINED,
              reason,
              date: dateNow,
            },
          }
        ),
      ]);

      if (agency.fcmToken) {
        const payload = {
          token: agency.fcmToken,
          data: {
            title: "❌ Withdrawal Declined",
            body: "⚠️ Your withdrawal request was declined. Please review the reason or contact support. 📩",
            type: "WITHDRAWREQUEST",
          },
        };

        const adminInstance = await admin;
        adminInstance
          .messaging()
          .send(payload)
          .catch((err) => {
            console.error("FCM error:", err.message);
          });
      }
    } else {
      return res.status(200).json({
        status: false,
        message: "Invalid type. Must be 'approve' or 'reject'.",
      });
    }
  } catch (error) {
    console.error("Error in handleAgencyWithdrawalStatus:", error);
    res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

function razorpayPayoutErrorMessage(err) {
  const d = err?.response?.data;
  if (d && typeof d === "object") {
    return d.error?.description || d.error?.reason || d.error?.code || d.message || JSON.stringify(d);
  }
  return err?.message || "Payout request failed";
}

/** Admin final step for host withdrawals: agency-approved (4) → RazorpayX payout or reject. */
exports.finalizeHostWithdrawal = async (req, res) => {
  try {
    const { requestId, hostId, type, reason } = req.query;

    if (!requestId || !hostId || !type) {
      return res.status(200).json({ status: false, message: "Missing required parameters." });
    }

    const actionType = type.trim().toLowerCase();
    const dateNow = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

    const [request, host] = await Promise.all([
      WithdrawalRequest.findById(requestId)
        .lean()
        .select("_id hostId coin amount status uniqueId person paymentDetails razorpayPayoutId payoutReferenceId"),
      Host.findById(hostId).lean().select("_id isBlock fcmToken coin"),
    ]);

    if (!request) return res.status(200).json({ status: false, message: "Withdrawal request not found." });
    if (!host) return res.status(200).json({ status: false, message: "Host not found." });
    if (host.isBlock) return res.status(403).json({ status: false, message: "Host is blocked by admin." });

    if (request.person !== WITHDRAWAL_PERSON.HOST || String(request.hostId) !== String(hostId)) {
      return res.status(200).json({ status: false, message: "Invalid host withdrawal request." });
    }

    if (request.status === WITHDRAWAL_STATUS.ACCEPTED) {
      return res.status(200).json({ status: false, message: "Payout already completed." });
    }
    if (request.status === WITHDRAWAL_STATUS.DECLINED) {
      return res.status(200).json({ status: false, message: "Request already declined." });
    }
    if (request.status === WITHDRAWAL_STATUS.PAYOUT_FAILED) {
      return res.status(200).json({ status: false, message: "Payout failed; resolve or create a new request." });
    }
    if (request.status === WITHDRAWAL_STATUS.PENDING) {
      return res.status(200).json({ status: false, message: "Agency approval required first." });
    }

    if (request.status === WITHDRAWAL_STATUS.PAYOUT_PROCESSING && request.razorpayPayoutId) {
      return res.status(200).json({
        status: true,
        message: "Payout already initiated; status will update via webhook.",
        data: { razorpayPayoutId: request.razorpayPayoutId },
      });
    }

    if (request.status !== WITHDRAWAL_STATUS.AGENCY_APPROVED) {
      return res.status(200).json({ status: false, message: "Request is not awaiting admin payout." });
    }

    if (actionType === "reject") {
      if (!reason || !String(reason).trim()) {
        return res.status(200).json({ status: false, message: "Rejection reason is required." });
      }

      await Promise.all([
        WithdrawalRequest.updateOne(
          { _id: request._id, status: WITHDRAWAL_STATUS.AGENCY_APPROVED },
          {
            $set: {
              status: WITHDRAWAL_STATUS.DECLINED,
              reason: String(reason).trim(),
              acceptOrDeclineDate: dateNow,
            },
          }
        ),
        History.updateOne(
          { uniqueId: request.uniqueId, type: 5, hostId: request.hostId },
          {
            $set: {
              payoutStatus: WITHDRAWAL_STATUS.DECLINED,
              reason: String(reason).trim(),
              date: dateNow,
            },
          }
        ),
      ]);

      res.status(200).json({ status: true, message: "Host withdrawal declined by admin." });

      if (host.fcmToken) {
        const payload = {
          token: host.fcmToken,
          data: {
            title: "Withdrawal declined",
            body: "Your withdrawal was declined at final review. Contact support if needed.",
            type: "WITHDRAWREQUEST",
          },
        };
        const adminInstance = await admin;
        adminInstance.messaging().send(payload).catch((err) => console.error("FCM error:", err.message));
      }
      return;
    }

    if (actionType !== "approve") {
      return res.status(200).json({ status: false, message: "Invalid type. Must be 'approve' or 'reject'." });
    }

    if (!global.settingJSON) {
      return res.status(200).json({ status: false, message: "Settings not loaded." });
    }

    const amt = Number(request.amount);
    const debit = await Host.updateOne(
      { _id: request.hostId, coin: { $gte: request.coin } },
      {
        $inc: {
          coin: -request.coin,
          redeemedCoins: request.coin,
          redeemedAmount: Number.isFinite(amt) ? amt : 0,
        },
      }
    );

    if (!debit.modifiedCount) {
      return res.status(200).json({
        status: false,
        message: "Insufficient coin balance; cannot debit host for payout.",
      });
    }

    let payoutRes;
    try {
      payoutRes = await createPayoutForWithdrawal({
        withdrawal: request,
        settingJSON: global.settingJSON,
      });
    } catch (err) {
      const msg = razorpayPayoutErrorMessage(err);
      await Host.updateOne(
        { _id: request.hostId },
        {
          $inc: {
            coin: request.coin,
            redeemedCoins: -request.coin,
            redeemedAmount: Number.isFinite(amt) ? -amt : 0,
          },
        }
      );
      await WithdrawalRequest.updateOne({ _id: request._id }, { $set: { payoutLastError: String(msg).slice(0, 500) } });
      console.error("[finalizeHostWithdrawal] RazorpayX payout error:", msg);
      return res.status(200).json({ status: false, message: msg });
    }

    const { data: payoutData, reference_id } = payoutRes;

    await Promise.all([
      WithdrawalRequest.updateOne(
        { _id: request._id, status: WITHDRAWAL_STATUS.AGENCY_APPROVED },
        {
          $set: {
            status: WITHDRAWAL_STATUS.PAYOUT_PROCESSING,
            razorpayPayoutId: payoutData.id || "",
            payoutReferenceId: reference_id || "",
            payoutLastError: "",
            acceptOrDeclineDate: dateNow,
          },
        }
      ),
      History.updateOne(
        { uniqueId: request.uniqueId, type: 5, hostId: request.hostId },
        {
          $set: {
            payoutStatus: WITHDRAWAL_STATUS.PAYOUT_PROCESSING,
            date: dateNow,
          },
        }
      ),
    ]);

    res.status(200).json({
      status: true,
      message: "Payout initiated; status will update when RazorpayX confirms.",
      data: { razorpayPayoutId: payoutData.id, reference_id },
    });

    if (host.fcmToken) {
      const payload = {
        token: host.fcmToken,
        data: {
          title: "Payout processing",
          body: "Your withdrawal payout has been sent to the bank. You will be notified when it completes.",
          type: "WITHDRAWREQUEST",
        },
      };
      const adminInstance = await admin;
      adminInstance.messaging().send(payload).catch((err) => console.error("FCM error:", err.message));
    }
  } catch (error) {
    console.error("finalizeHostWithdrawal error:", error);
    res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Cleanup invalid pending HOST withdrawals (admin)
// Rejects pending requests where requested coins > current Host.coin.
// Query:
// - hostId (optional): only check one host
// - dryRun (optional): "true" to only preview
exports.cleanupInvalidHostPendingWithdrawals = async (req, res) => {
  try {
    const hostIdRaw = req.query.hostId;
    const dryRun = String(req.query.dryRun || "").toLowerCase() === "true";

    const match = { person: 2, status: 1 };
    if (hostIdRaw) {
      if (!mongoose.Types.ObjectId.isValid(String(hostIdRaw))) {
        return res.status(200).json({ status: false, message: "Invalid hostId. Please provide a valid ObjectId." });
      }
      match.hostId = new mongoose.Types.ObjectId(String(hostIdRaw));
    }

    const pending = await WithdrawalRequest.find(match)
      .select("_id hostId coin uniqueId createdAt")
      .populate("hostId", "coin name uniqueId")
      .sort({ createdAt: -1 })
      .lean();

    const invalid = pending
      .map((r) => {
        const host = r.hostId;
        const hostCoin = Number(host?.coin || 0);
        const reqCoin = Number(r?.coin || 0);
        return {
          requestId: r._id,
          requestUniqueId: r.uniqueId || "",
          requestedCoins: reqCoin,
          hostId: host?._id,
          hostUniqueId: host?.uniqueId || "",
          hostName: host?.name || "",
          hostCoinNow: hostCoin,
          createdAt: r.createdAt,
          isInvalid: reqCoin > hostCoin,
        };
      })
      .filter((x) => x.isInvalid);

    if (dryRun) {
      return res.status(200).json({
        status: true,
        message: "Preview invalid pending host withdrawals.",
        totalPending: pending.length,
        invalidCount: invalid.length,
        data: invalid,
      });
    }

    const dateNow = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const rejectReason = "Invalid request: insufficient wallet balance.";

    for (const row of invalid) {
      await Promise.all([
        WithdrawalRequest.updateOne(
          { _id: row.requestId, status: 1, person: 2 },
          { $set: { status: 3, reason: rejectReason, acceptOrDeclineDate: dateNow } }
        ),
        History.updateOne(
          { uniqueId: row.requestUniqueId, type: 5 },
          { $set: { payoutStatus: 3, reason: rejectReason, date: dateNow } }
        ),
      ]);
    }

    return res.status(200).json({
      status: true,
      message: "Invalid pending host withdrawals rejected.",
      totalPending: pending.length,
      rejectedCount: invalid.length,
      data: invalid,
    });
  } catch (error) {
    console.error("cleanupInvalidHostPendingWithdrawals error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
