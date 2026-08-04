const ExcelJS = require("exceljs");
const Wallet = require("../../models/wallet.model");
const WalletTransaction = require("../../models/walletTransaction.model");
const RewardTransaction = require("../../models/rewardTransaction.model");
const SurveyHistory = require("../../models/surveyHistory.model");
const SurveyProvider = require("../../models/surveyProvider.model");
const RewardWithdrawalRequest = require("../../models/rewardWithdrawalRequest.model");
const PayoutBatch = require("../../models/payoutBatch.model");
const PayoutTransaction = require("../../models/payoutTransaction.model");
const RevenueSetting = require("../../models/revenueSetting.model");
const RewardRule = require("../../models/rewardRule.model");
const NotificationLog = require("../../models/notificationLog.model");
const User = require("../../models/user.model");
const mongoose = require("mongoose");
const { REWARD_WITHDRAWAL_STATUS, BULK_PAYOUT_STATUS } = require("../../types/rewardConstant");

/**
 * GET /api/admin/reward/dashboard
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      totalWallets,
      todaysRewards,
      todaysSurveys,
      pendingWithdrawals,
      completedWithdrawals,
      providerStats,
      recentTx,
    ] = await Promise.all([
      Wallet.aggregate([{ $group: { _id: null, totalCoins: { $sum: "$coinBalance" }, count: { $sum: 1 } } }]),
      RewardTransaction.aggregate([{ $match: { createdAt: { $gte: startOfDay } } }, { $group: { _id: null, total: { $sum: "$coinsEarned" } } }]),
      SurveyHistory.countDocuments({ createdAt: { $gte: startOfDay } }),
      RewardWithdrawalRequest.countDocuments({ status: REWARD_WITHDRAWAL_STATUS.PENDING }),
      RewardWithdrawalRequest.aggregate([{ $match: { status: REWARD_WITHDRAWAL_STATUS.COMPLETED } }, { $group: { _id: null, total: { $sum: "$amountCurrency" } } }]),
      RewardTransaction.aggregate([{ $group: { _id: "$providerName", totalCoins: { $sum: "$coinsEarned" }, totalUsd: { $sum: "$usdAmount" }, count: { $sum: 1 } } }]),
      WalletTransaction.find().populate("user", "name email image").sort({ createdAt: -1 }).limit(10),
    ]);

    const totalCoinsInWallets = totalWallets[0] ? totalWallets[0].totalCoins : 0;
    const totalTodayCoins = todaysRewards[0] ? todaysRewards[0].total : 0;
    const totalCompletedWithdrawalAmount = completedWithdrawals[0] ? completedWithdrawals[0].total : 0;

    return res.status(200).json({
      status: true,
      data: {
        cards: {
          totalCoinsInWallets,
          todaysRewards: totalTodayCoins,
          todaysSurveys,
          pendingWithdrawals,
          completedWithdrawalsAmount: totalCompletedWithdrawalAmount,
        },
        providerStats,
        recentTx,
      },
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

/**
 * POST /api/admin/reward/manual
 * Manual Admin Credit / Debit Wallet
 */
exports.manualCreditDebitWallet = async (req, res) => {
  try {
    const { userId, type, coins, description } = req.body;
    if (!userId || !coins || !["credit", "debit"].includes(type)) {
      return res.status(400).json({ status: false, message: "Valid userId, type (credit/debit), and coins required" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let wallet = await Wallet.findOne({ user: userId }).session(session);
      if (!wallet) {
        wallet = new Wallet({ user: userId, coinBalance: 0, lockedBalance: 0 });
      }

      const balanceBefore = wallet.coinBalance;
      if (type === "debit" && wallet.coinBalance < coins) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ status: false, message: "Insufficient user wallet balance to debit" });
      }

      wallet.coinBalance += type === "credit" ? coins : -coins;
      if (type === "credit") wallet.totalEarned += coins;
      await wallet.save({ session });

      // Ledger transaction
      const walletTx = new WalletTransaction({
        user: userId,
        wallet: wallet._id,
        type,
        category: "admin_manual",
        amount: coins,
        balanceBefore,
        balanceAfter: wallet.coinBalance,
        referenceId: `admin_${Date.now()}`,
        description: description || `Manual ${type} by Admin`,
        status: 1,
      });
      await walletTx.save({ session });

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({ status: true, message: `Wallet ${type}ed ${coins} coins successfully` });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

/**
 * POST /api/admin/reward/freeze-wallet
 */
exports.freezeUserWallet = async (req, res) => {
  try {
    const { userId, isFrozen, freezeReason } = req.body;
    const wallet = await Wallet.findOneAndUpdate(
      { user: userId },
      { isFrozen, freezeReason: freezeReason || "" },
      { new: true, upsert: true }
    );
    return res.status(200).json({ status: true, message: `Wallet ${isFrozen ? "frozen" : "unfrozen"}`, wallet });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

/**
 * GET & POST Provider Management
 */
exports.getProviders = async (req, res) => {
  try {
    const defaultProviders = [
      {
        name: "bitlabs",
        title: "BitLabs Surveys",
        appId: "482cac93-7553-463c-89e1-dfc88101e03b",
        secretKey: "OJ0I672GCcURU4Yv7A3SsKWPDDd6UuRx",
        serverKey: "hfUtuQznebGWFPseJiese58xKGpyeZRb",
        isActive: true,
        conversionRate: 100,
      },
      {
        name: "cpx",
        title: "CPX Research",
        appId: "34491",
        secretKey: "WGoFs3p9spEZr4Ozcq2WmPyBjcrxMmOr",
        serverKey: "",
        isActive: true,
        conversionRate: 100,
      },
    ];

    for (const def of defaultProviders) {
      const exists = await SurveyProvider.findOne({ name: def.name });
      if (!exists) {
        await SurveyProvider.create(def);
      } else if (def.name === "bitlabs" && (!exists.appId || !exists.secretKey)) {
        exists.appId = def.appId;
        exists.secretKey = def.secretKey;
        exists.serverKey = def.serverKey;
        await exists.save();
      }
    }

    const providers = await SurveyProvider.find().sort({ name: 1 });
    return res.status(200).json({ status: true, data: providers });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.updateProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const provider = await SurveyProvider.findByIdAndUpdate(id, req.body, { new: true });
    return res.status(200).json({ status: true, message: "Provider updated", provider });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

/**
 * GET & POST Revenue & Reward Settings
 */
exports.getSettings = async (req, res) => {
  try {
    let setting = await RevenueSetting.findOne();
    if (!setting) {
      setting = await RevenueSetting.create({});
    }
    return res.status(200).json({ status: true, data: setting });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    let setting = await RevenueSetting.findOne();
    if (setting) {
      setting = await RevenueSetting.findByIdAndUpdate(setting._id, req.body, { new: true });
    } else {
      setting = await RevenueSetting.create(req.body);
    }
    return res.status(200).json({ status: true, message: "Settings saved", data: setting });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

/**
 * GET & POST Withdrawals Management
 */
exports.getWithdrawals = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = parseInt(status);

    const requests = await RewardWithdrawalRequest.find(filter)
      .populate("user", "name email uniqueId phone image")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await RewardWithdrawalRequest.countDocuments(filter);

    return res.status(200).json({ status: true, data: { requests, total } });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.updateWithdrawalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminComment } = req.body; // status: 2 (Approved), 3 (Rejected), 5 (Completed)

    const request = await RewardWithdrawalRequest.findById(id);
    if (!request) return res.status(404).json({ status: false, message: "Withdrawal request not found" });

    // If rejecting, refund locked balance to coin balance
    if (status === REWARD_WITHDRAWAL_STATUS.REJECTED && request.status !== REWARD_WITHDRAWAL_STATUS.REJECTED) {
      const wallet = await Wallet.findOne({ user: request.user });
      if (wallet) {
        wallet.coinBalance += request.coins;
        wallet.lockedBalance = Math.max(0, wallet.lockedBalance - request.coins);
        await wallet.save();

        await WalletTransaction.create({
          user: request.user,
          wallet: wallet._id,
          type: "credit",
          category: "refund",
          amount: request.coins,
          balanceBefore: wallet.coinBalance - request.coins,
          balanceAfter: wallet.coinBalance,
          referenceId: request._id.toString(),
          description: `Withdrawal request #${request.requestNumber} rejected. Coins refunded.`,
        });
      }
    }

    request.status = status;
    if (adminComment) request.adminComment = adminComment;
    if (status === REWARD_WITHDRAWAL_STATUS.COMPLETED) request.processedAt = new Date();
    await request.save();

    return res.status(200).json({ status: true, message: "Withdrawal status updated", request });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

/**
 * Bulk Payout Template Generator (ExcelJS)
 */
exports.downloadExcelTemplate = async (req, res) => {
  try {
    const format = req.query.format || "bank"; // "bank" or "standard"
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Corporate Bulk Payouts");

    if (format === "bank") {
      // Official Bank Corporate Bulk Payout Template Header (IDFC / Axis / ICICI / HDFC)
      worksheet.addRow([
        "Beneficiary Account Number",
        "IFSC",
        "Transaction Type",
        "Debit Account Number",
        "Transaction Date",
        "Amount",
        "Currency",
        "Beneficiary Email ID",
        "Remarks",
        "Custom Header - 1 (Request No)",
      ]);

      // Row 2: Bank Instruction Sub-header
      worksheet.addRow([
        "Enter beneficiary account number. MANDATORY",
        "Enter beneficiary bank IFSC code. MANDATORY for NEFT/RTGS",
        "NEFT / RTGS / IFT. MANDATORY",
        "Enter debit account number",
        "DD/MM/YYYY",
        "Enter payment amount. MANDATORY",
        "INR",
        "Enter beneficiary email ID. OPTIONAL",
        "Enter remarks. OPTIONAL",
        "Withdrawal Request Number",
      ]);

      const pendingRequests = await RewardWithdrawalRequest.find({ status: REWARD_WITHDRAWAL_STATUS.PENDING })
        .populate("user", "name email");

      const today = new Date().toLocaleDateString("en-GB"); // DD/MM/YYYY

      pendingRequests.forEach((reqItem) => {
        const details = reqItem.accountDetails || {};
        worksheet.addRow([
          details.accountNumber || "XXXXXXXXXXXX",
          details.ifscCode || "IFSC0000000",
          details.ifscCode ? "NEFT" : "IFT",
          "", // Debit account
          today,
          reqItem.amountCurrency,
          "INR",
          reqItem.user?.email || "",
          `Payout for ${reqItem.user?.name || "User"}`,
          reqItem.requestNumber,
        ]);
      });
    } else {
      worksheet.columns = [
        { header: "Request Number", key: "requestNumber", width: 25 },
        { header: "Account Holder Name", key: "accountHolderName", width: 25 },
        { header: "Bank Account Number", key: "accountNumber", width: 25 },
        { header: "IFSC Code", key: "ifscCode", width: 15 },
        { header: "Bank Name", key: "bankName", width: 20 },
        { header: "UPI ID", key: "upiId", width: 25 },
        { header: "Amount Currency", key: "amountCurrency", width: 15 },
        { header: "Coins Debited", key: "coins", width: 15 },
      ];

      const pendingRequests = await RewardWithdrawalRequest.find({ status: REWARD_WITHDRAWAL_STATUS.PENDING })
        .populate("user", "name email");

      pendingRequests.forEach((reqItem) => {
        const details = reqItem.accountDetails || {};
        worksheet.addRow({
          requestNumber: reqItem.requestNumber,
          accountHolderName: details.accountHolderName || reqItem.user?.name || "",
          accountNumber: details.accountNumber || "",
          ifscCode: details.ifscCode || "",
          bankName: details.bankName || "",
          upiId: details.upiId || "",
          amountCurrency: reqItem.amountCurrency,
          coins: reqItem.coins,
        });
      });
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=Corporate_Bulk_Payout_${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

/**
 * Upload & Validate Bulk Payout File (Supports Corporate Bank & Standard Formats)
 */
exports.uploadAndValidateExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ status: false, message: "No file uploaded" });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.getWorksheet(1);

    const records = [];
    let validCount = 0;
    let invalidCount = 0;
    let totalAmount = 0;

    // Detect format from Row 1
    const row1Cell1 = worksheet.getRow(1).getCell(1).text.toLowerCase();
    const isCorporateBankFormat = row1Cell1.includes("beneficiary") || row1Cell1.includes("account");

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip Header

      const textCell1 = row.getCell(1).text.trim().toLowerCase();
      // Skip Row 2 if it's an instruction sub-header (e.g. contains "enter" or "mandatory")
      if (rowNumber === 2 && (textCell1.includes("enter") || textCell1.includes("mandatory") || textCell1.includes("xxxx"))) {
        return;
      }

      let requestNumber = "";
      let accountHolderName = "";
      let accountNumber = "";
      let ifscCode = "";
      let bankName = "";
      let upiId = "";
      let amountCurrency = 0;

      if (isCorporateBankFormat) {
        // Corporate Bank Format Mapping:
        // Col 1: Beneficiary Account Number
        // Col 2: IFSC
        // Col 3: Transaction Type
        // Col 4: Debit Account Number
        // Col 5: Transaction Date
        // Col 6: Amount
        // Col 7: Currency
        // Col 8: Beneficiary Email
        // Col 9: Remarks
        // Col 10: Custom Header - 1 (Request Number)
        accountNumber = row.getCell(1).text.trim();
        ifscCode = row.getCell(2).text.trim();
        const txType = row.getCell(3).text.trim();
        amountCurrency = parseFloat(row.getCell(6).text.trim() || 0);
        const email = row.getCell(8).text.trim();
        const remarks = row.getCell(9).text.trim();
        requestNumber = row.getCell(10).text.trim() || `REQ_${Date.now()}_${rowNumber}`;
        accountHolderName = remarks || email || `Account ${accountNumber.slice(-4)}`;
      } else {
        // Standard Format Mapping:
        requestNumber = row.getCell(1).text.trim();
        accountHolderName = row.getCell(2).text.trim();
        accountNumber = row.getCell(3).text.trim();
        ifscCode = row.getCell(4).text.trim();
        bankName = row.getCell(5).text.trim();
        upiId = row.getCell(6).text.trim();
        amountCurrency = parseFloat(row.getCell(7).text.trim() || 0);
      }

      // Check if line is empty
      if (!accountNumber && !upiId && !amountCurrency && !requestNumber) return;

      const isValid = Boolean(amountCurrency > 0 && (accountNumber || upiId));
      if (isValid) {
        validCount++;
        totalAmount += amountCurrency;
      } else {
        invalidCount++;
      }

      records.push({
        rowNumber,
        requestNumber,
        accountHolderName,
        accountNumber,
        ifscCode,
        bankName,
        upiId,
        amountCurrency,
        isValid,
        error: isValid ? "" : "Invalid amount, missing account number or IFSC code",
      });
    });

    return res.status(200).json({
      status: true,
      data: {
        totalRecords: records.length,
        validRecords: validCount,
        invalidRecords: invalidCount,
        totalAmount,
        records,
      },
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

/**
 * Process Batch Payout Execution
 */
exports.processPayoutBatch = async (req, res) => {
  try {
    const { filename = "bulk_payout.xlsx", records = [] } = req.body;
    if (!records || records.length === 0) return res.status(400).json({ status: false, message: "No records to process" });

    const batchNumber = `BATCH_${Date.now()}`;
    const batch = await PayoutBatch.create({
      batchNumber,
      filename,
      totalRecords: records.length,
      validRecords: records.filter((r) => r.isValid).length,
      invalidRecords: records.filter((r) => !r.isValid).length,
      totalAmount: records.reduce((sum, r) => sum + (r.amountCurrency || 0), 0),
      status: BULK_PAYOUT_STATUS.COMPLETED,
      processedAt: new Date(),
    });

    for (const record of records) {
      if (!record.isValid) continue;

      const request = await RewardWithdrawalRequest.findOne({ requestNumber: record.requestNumber });
      if (request) {
        request.status = REWARD_WITHDRAWAL_STATUS.COMPLETED;
        request.batchId = batch._id;
        request.processedAt = new Date();
        await request.save();

        await PayoutTransaction.create({
          batch: batch._id,
          withdrawalRequest: request._id,
          user: request.user,
          accountDetails: {
            accountHolderName: record.accountHolderName,
            accountNumber: record.accountNumber,
            ifscCode: record.ifscCode,
            upiId: record.upiId,
          },
          amount: record.amountCurrency,
          status: "success",
          utrNumber: `UTR_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        });
      }
    }

    return res.status(200).json({ status: true, message: `Batch ${batchNumber} processed successfully`, batch });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

/**
 * GET Reports
 */
exports.getReports = async (req, res) => {
  try {
    const { type = "revenue" } = req.query;
    let reportData = [];

    if (type === "revenue") {
      reportData = await RewardTransaction.aggregate([
        { $group: { _id: "$providerName", totalCoins: { $sum: "$coinsEarned" }, totalUsd: { $sum: "$usdAmount" }, count: { $sum: 1 } } },
      ]);
    } else if (type === "withdrawals") {
      reportData = await RewardWithdrawalRequest.aggregate([
        { $group: { _id: "$status", totalAmount: { $sum: "$amountCurrency" }, count: { $sum: 1 } } },
      ]);
    } else if (type === "surveys") {
      reportData = await SurveyHistory.aggregate([
        { $group: { _id: "$provider", totalCoins: { $sum: "$coins" }, totalSurveys: { $sum: 1 } } },
      ]);
    }

    return res.status(200).json({ status: true, data: reportData });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};
