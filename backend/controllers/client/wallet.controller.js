const Wallet = require("../../models/wallet.model");
const WalletTransaction = require("../../models/walletTransaction.model");
const RewardWithdrawalRequest = require("../../models/rewardWithdrawalRequest.model");
const WithdrawalAccount = require("../../models/withdrawalAccount.model");
const SurveyProvider = require("../../models/surveyProvider.model");
const RevenueSetting = require("../../models/revenueSetting.model");
const SurveyHistory = require("../../models/surveyHistory.model");
const User = require("../../models/user.model");
const mongoose = require("mongoose");
const { REWARD_WITHDRAWAL_STATUS } = require("../../types/rewardConstant");

/**
 * GET /api/client/wallet
 */
exports.getWallet = async (req, res) => {
  try {
    const userId = req.user._id || req.query.userId || req.headers["x-user-uid"];
    if (!userId) return res.status(400).json({ status: false, message: "User ID required" });

    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = await Wallet.create({ user: userId, coinBalance: 0, lockedBalance: 0 });
    }

    const settings = (await RevenueSetting.findOne()) || { coinToCurrencyRate: 100, currencyCode: "USD", minWithdrawalCoins: 500 };
    const currencyEquivalent = (wallet.coinBalance / settings.coinToCurrencyRate).toFixed(2);

    return res.status(200).json({
      status: true,
      data: {
        wallet,
        currencyEquivalent,
        currencyCode: settings.currencyCode,
        minWithdrawalCoins: settings.minWithdrawalCoins,
      },
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

/**
 * GET /api/client/wallet/history
 */
exports.getWalletHistory = async (req, res) => {
  try {
    const userId = req.user._id || req.query.userId || req.headers["x-user-uid"];
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 20);

    const transactions = await WalletTransaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await WalletTransaction.countDocuments({ user: userId });

    return res.status(200).json({
      status: true,
      data: { transactions, total, page, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

/**
 * POST /api/client/withdraw
 */
exports.requestWithdrawal = async (req, res) => {
  try {
    const userId = req.user._id || req.body.userId;
    const { coins, payoutType, accountDetails } = req.body;

    if (!coins || coins <= 0) return res.status(400).json({ status: false, message: "Valid coin amount is required" });

    const settings = (await RevenueSetting.findOne()) || { coinToCurrencyRate: 100, currencyCode: "USD", minWithdrawalCoins: 500 };

    if (coins < settings.minWithdrawalCoins) {
      return res.status(400).json({
        status: false,
        message: `Minimum withdrawal threshold is ${settings.minWithdrawalCoins} coins ($${(settings.minWithdrawalCoins / settings.coinToCurrencyRate).toFixed(2)})`,
      });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const wallet = await Wallet.findOne({ user: userId }).session(session);
      if (!wallet || wallet.coinBalance < coins) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ status: false, message: "Insufficient balance" });
      }

      if (wallet.isFrozen) {
        await session.abortTransaction();
        session.endSession();
        return res.status(403).json({ status: false, message: `Wallet frozen: ${wallet.freezeReason || "Contact support"}` });
      }

      const balanceBefore = wallet.coinBalance;
      wallet.coinBalance -= coins;
      wallet.lockedBalance += coins;
      wallet.totalWithdrawn += coins;
      await wallet.save({ session });

      const amountCurrency = parseFloat((coins / settings.coinToCurrencyRate).toFixed(2));
      const requestNumber = `WD_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      const request = new RewardWithdrawalRequest({
        requestNumber,
        user: userId,
        coins,
        amountCurrency,
        currency: settings.currencyCode,
        payoutType,
        accountDetails,
        status: REWARD_WITHDRAWAL_STATUS.PENDING,
      });
      await request.save({ session });

      // Record debit in ledger
      const walletTx = new WalletTransaction({
        user: userId,
        wallet: wallet._id,
        type: "debit",
        category: "withdrawal",
        amount: coins,
        balanceBefore,
        balanceAfter: wallet.coinBalance,
        referenceId: request._id.toString(),
        description: `Withdrawal request submitted (#${requestNumber})`,
        status: 1,
      });
      await walletTx.save({ session });

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({ status: true, message: "Withdrawal request submitted successfully", requestNumber });
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
 * GET /api/client/withdraw/history
 */
exports.getWithdrawalHistory = async (req, res) => {
  try {
    const userId = req.user._id || req.query.userId;
    const requests = await RewardWithdrawalRequest.find({ user: userId }).sort({ createdAt: -1 });
    return res.status(200).json({ status: true, data: requests });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

/**
 * POST /api/client/bank-account
 */
exports.saveWithdrawalAccount = async (req, res) => {
  try {
    const userId = req.user._id || req.body.userId;
    const { type, accountHolderName, accountNumber, ifscCode, bankName, upiId, email, isDefault } = req.body;

    if (isDefault) {
      await WithdrawalAccount.updateMany({ user: userId }, { isDefault: false });
    }

    const account = await WithdrawalAccount.create({
      user: userId,
      type,
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      upiId,
      email,
      isDefault: isDefault || true,
    });

    return res.status(200).json({ status: true, message: "Payout account saved", account });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

/**
 * GET /api/client/survey/providers
 */
exports.getSurveyProviders = async (req, res) => {
  try {
    const providers = await SurveyProvider.find({ isActive: true }).sort({ priority: 1 });
    return res.status(200).json({ status: true, data: providers });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};
