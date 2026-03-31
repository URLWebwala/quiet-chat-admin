const axios = require("axios");

/**
 * Create a RazorpayX payout (https://razorpay.com/docs/x/payouts/)
 * Requires: settingJSON.razorpayId + razorpaySecretKey, razorpayXFromAccountNumber,
 * and withdrawal.paymentDetails.fund_account_id (or fundAccountId from RazorpayX contact).
 */
exports.createPayoutForWithdrawal = async ({ withdrawal, settingJSON }) => {
  const keyId = settingJSON?.razorpayId?.trim();
  const keySecret = settingJSON?.razorpaySecretKey?.trim();
  const fromAccount = settingJSON?.razorpayXFromAccountNumber?.trim();

  const pd = withdrawal?.paymentDetails && typeof withdrawal.paymentDetails === "object" ? withdrawal.paymentDetails : {};
  const fundAccountId = pd.fund_account_id || pd.fundAccountId || pd.fund_account;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay API key / secret not configured in admin settings.");
  }
  if (!fromAccount) {
    throw new Error("RazorpayX source account missing: set razorpayXFromAccountNumber in admin settings.");
  }
  if (!fundAccountId) {
    throw new Error(
      "Host payout is missing fund_account_id in paymentDetails. Host app must send RazorpayX fund account id when requesting withdrawal."
    );
  }

  const amountInr = Number(withdrawal.amount);
  if (!Number.isFinite(amountInr) || amountInr <= 0) {
    throw new Error("Invalid withdrawal amount.");
  }

  const amountPaise = Math.round(amountInr * 100);
  if (amountPaise < 100) {
    throw new Error("Payout amount too small (minimum ₹1).");
  }

  const reference_id = `wd_${String(withdrawal._id)}`.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const body = {
    account_number: fromAccount,
    fund_account_id: String(fundAccountId).trim(),
    amount: amountPaise,
    currency: "INR",
    mode: "IMPS",
    purpose: "payout",
    queue_if_low_balance: true,
    reference_id,
    narration: `HostWD${(withdrawal.uniqueId || "").replace(/[^a-zA-Z0-9]/g, "")}`.slice(0, 30),
  };

  const res = await axios.post("https://api.razorpay.com/v1/payouts", body, {
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    timeout: 45000,
  });

  return { data: res.data, reference_id };
};
