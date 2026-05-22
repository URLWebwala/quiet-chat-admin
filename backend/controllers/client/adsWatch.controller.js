const mongoose = require("mongoose");

const User = require("../../models/user.model");
const Host = require("../../models/host.model");
const History = require("../../models/history.model");
const AdsWatchProgress = require("../../models/adsWatchProgress.model");
const AdsWatchLog = require("../../models/adsWatchLog.model");
const AdsWatchReward = require("../../models/adsWatchReward.model");
const { HISTORY_TYPE } = require("../../types/constant");
const generateHistoryUniqueId = require("../../util/generateHistoryUniqueId");

const getToday = () => new Date().toISOString().slice(0, 10);

function getAdsSettings() {
  const s = global.settingJSON || {};
  return {
    enabled: !!s.adsWatchEnabled,
    userCoinPerAd: Number(s.adsWatchUserCoinPerAd) || 0,
    hostCoinPerAd: Number(s.adsWatchHostCoinPerAd) || 0,
    userDailyLimit: Number(s.adsWatchUserDailyLimit) || 0,
    hostDailyLimit: Number(s.adsWatchHostDailyLimit) || 0,
    minCoinsToClaim: Number(s.adsWatchMinCoinsToClaim) || 0,
    claimFrequencyHours: Number(s.adsWatchClaimFrequencyHours) || 24,
    fullWatchBonus: Number(s.adsWatchFullWatchBonus) || 0,
    rewardedAdsEnabled: s.adsWatchRewardedAdsEnabled !== false,
    interstitialAdsEnabled: s.adsWatchInterstitialAdsEnabled !== false,
    hostBonusMultiplier: Number(s.adsWatchHostBonusMultiplier) || 1,
    vipBonusPoints: Number(s.adsWatchVipBonusPoints) || 0,
  };
}

async function resolvePersonContext(userId, personTypeRaw) {
  const personType = String(personTypeRaw || "user").toLowerCase() === "host" ? "host" : "user";
  const uid = new mongoose.Types.ObjectId(userId);

  if (personType === "host") {
    const host = await Host.findOne({ userId: uid, status: 2 }).select("_id coin").lean();
    if (!host) {
      return { error: "Host profile not found or not approved." };
    }
    return { personType, userId: uid, hostId: host._id, walletCoin: host.coin || 0 };
  }

  const user = await User.findById(uid).select("coin isVip isBlock").lean();
  if (!user) {
    return { error: "User not found." };
  }
  if (user.isBlock) {
    return { error: "User is blocked by admin." };
  }
  return { personType, userId: uid, hostId: null, walletCoin: user.coin || 0, isVip: !!user.isVip };
}

async function getOrCreateProgress(ctx) {
  let progress = await AdsWatchProgress.findOne({ userId: ctx.userId, personType: ctx.personType });
  if (!progress) {
    progress = new AdsWatchProgress({
      userId: ctx.userId,
      hostId: ctx.hostId,
      personType: ctx.personType,
    });
  } else if (ctx.hostId && !progress.hostId) {
    progress.hostId = ctx.hostId;
  }
  return progress;
}

function resetDailyCounterIfNeeded(progress) {
  const today = getToday();
  if (progress.lastWatchDate !== today) {
    progress.watchesToday = 0;
    progress.lastWatchDate = today;
  }
}

function buildStatusResponse(settings, progress, ctx) {
  resetDailyCounterIfNeeded(progress);
  const dailyLimit = ctx.personType === "host" ? settings.hostDailyLimit : settings.userDailyLimit;
  const coinPerAd = ctx.personType === "host" ? settings.hostCoinPerAd : settings.userCoinPerAd;
  const remainingWatches = Math.max(0, dailyLimit - (progress.watchesToday || 0));

  let canClaim = progress.pendingCoins >= settings.minCoinsToClaim;
  let nextClaimInHours = 0;
  if (progress.lastClaimAt && settings.claimFrequencyHours > 0) {
    const hoursSinceClaim = (Date.now() - new Date(progress.lastClaimAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceClaim < settings.claimFrequencyHours) {
      canClaim = false;
      nextClaimInHours = Math.ceil(settings.claimFrequencyHours - hoursSinceClaim);
    }
  }

  return {
    enabled: settings.enabled,
    personType: ctx.personType,
    coinPerAd,
    dailyLimit,
    watchesToday: progress.watchesToday || 0,
    remainingWatches,
    pendingCoins: progress.pendingCoins || 0,
    minCoinsToClaim: settings.minCoinsToClaim,
    canClaim: settings.enabled && canClaim && progress.pendingCoins > 0,
    nextClaimInHours,
    walletCoins: ctx.walletCoin || 0,
    totalWatches: progress.totalWatches || 0,
    totalClaimed: progress.totalClaimed || 0,
    claimFrequencyHours: settings.claimFrequencyHours,
    fullWatchBonus: settings.fullWatchBonus,
    rewardedAdsEnabled: settings.rewardedAdsEnabled,
    interstitialAdsEnabled: settings.interstitialAdsEnabled,
  };
}

exports.getStatus = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const settings = getAdsSettings();
    const ctx = await resolvePersonContext(req.user.userId, req.query.personType);
    if (ctx.error) {
      return res.status(200).json({ status: false, message: ctx.error });
    }

    const progress = await getOrCreateProgress(ctx);
    return res.status(200).json({
      status: true,
      message: "Ads watch status fetched successfully.",
      data: buildStatusResponse(settings, progress, ctx),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

exports.watchAd = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const settings = getAdsSettings();
    if (!settings.enabled) {
      return res.status(200).json({ status: false, message: "Ads watch feature is currently disabled." });
    }

    const adType = String(req.query.adType || "rewarded").toLowerCase();
    if (adType === "rewarded" && !settings.rewardedAdsEnabled) {
      return res.status(200).json({ status: false, message: "Rewarded ads are disabled." });
    }
    if (adType === "interstitial" && !settings.interstitialAdsEnabled) {
      return res.status(200).json({ status: false, message: "Interstitial ads are disabled." });
    }

    const ctx = await resolvePersonContext(req.user.userId, req.query.personType);
    if (ctx.error) {
      return res.status(200).json({ status: false, message: ctx.error });
    }

    const progress = await getOrCreateProgress(ctx);
    resetDailyCounterIfNeeded(progress);

    const dailyLimit = ctx.personType === "host" ? settings.hostDailyLimit : settings.userDailyLimit;
    if (dailyLimit > 0 && progress.watchesToday >= dailyLimit) {
      return res.status(200).json({ status: false, message: "Daily ad watch limit reached." });
    }

    let coinsEarned = ctx.personType === "host" ? settings.hostCoinPerAd : settings.userCoinPerAd;
    if (ctx.personType === "host") {
      coinsEarned = Math.round(coinsEarned * settings.hostBonusMultiplier);
    }
    if (ctx.isVip && settings.vipBonusPoints > 0) {
      coinsEarned += settings.vipBonusPoints;
    }
    if (String(req.query.isFullWatch).toLowerCase() === "true" && settings.fullWatchBonus > 0) {
      coinsEarned += settings.fullWatchBonus;
    }

    if (coinsEarned <= 0) {
      return res.status(200).json({ status: false, message: "Invalid coin reward configuration." });
    }

    progress.pendingCoins = (progress.pendingCoins || 0) + coinsEarned;
    progress.watchesToday = (progress.watchesToday || 0) + 1;
    progress.totalWatches = (progress.totalWatches || 0) + 1;
    progress.totalEarned = (progress.totalEarned || 0) + coinsEarned;
    progress.lastWatchDate = getToday();

    await Promise.all([
      progress.save(),
      AdsWatchLog.create({
        userId: ctx.userId,
        hostId: ctx.hostId,
        personType: ctx.personType,
        action: "watch",
        coins: coinsEarned,
        adType,
      }),
    ]);

    ctx.walletCoin = ctx.walletCoin || 0;
    return res.status(200).json({
      status: true,
      message: "Ad watched successfully. Coins added to pending balance.",
      data: {
        coinsEarned,
        ...buildStatusResponse(settings, progress, ctx),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

exports.claimCoins = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const settings = getAdsSettings();
    if (!settings.enabled) {
      return res.status(200).json({ status: false, message: "Ads watch feature is currently disabled." });
    }

    const ctx = await resolvePersonContext(req.user.userId, req.query.personType);
    if (ctx.error) {
      return res.status(200).json({ status: false, message: ctx.error });
    }

    const progress = await getOrCreateProgress(ctx);
    resetDailyCounterIfNeeded(progress);

    if ((progress.pendingCoins || 0) < settings.minCoinsToClaim) {
      return res.status(200).json({
        status: false,
        message: `Minimum ${settings.minCoinsToClaim} coins required to claim.`,
      });
    }

    if (progress.lastClaimAt && settings.claimFrequencyHours > 0) {
      const hoursSinceClaim = (Date.now() - new Date(progress.lastClaimAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceClaim < settings.claimFrequencyHours) {
        const waitHours = Math.ceil(settings.claimFrequencyHours - hoursSinceClaim);
        return res.status(200).json({
          status: false,
          message: `Please wait ${waitHours} hour(s) before claiming again.`,
        });
      }
    }

    const claimAmount = progress.pendingCoins;
    const uniqueId = await generateHistoryUniqueId();
    const historyDate = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

    progress.pendingCoins = 0;
    progress.totalClaimed = (progress.totalClaimed || 0) + claimAmount;
    progress.lastClaimAt = new Date();

    const walletUpdate =
      ctx.personType === "host"
        ? Host.findByIdAndUpdate(ctx.hostId, { $inc: { coin: claimAmount } }, { new: true })
        : User.findByIdAndUpdate(ctx.userId, { $inc: { coin: claimAmount } }, { new: true });

    const historyPayload =
      ctx.personType === "host"
        ? {
            uniqueId,
            hostId: ctx.hostId,
            hostCoin: claimAmount,
            type: HISTORY_TYPE.ADS_WATCH_CLAIM,
            date: historyDate,
          }
        : {
            uniqueId,
            userId: ctx.userId,
            userCoin: claimAmount,
            type: HISTORY_TYPE.ADS_WATCH_CLAIM,
            date: historyDate,
          };

    const [, updatedWallet] = await Promise.all([
      Promise.all([
        progress.save(),
        History.create(historyPayload),
        AdsWatchLog.create({
          userId: ctx.userId,
          hostId: ctx.hostId,
          personType: ctx.personType,
          action: "claim",
          coins: claimAmount,
        }),
      ]),
      walletUpdate,
    ]);

    ctx.walletCoin = updatedWallet?.coin ?? (ctx.walletCoin || 0) + claimAmount;

    return res.status(200).json({
      status: true,
      message: `${claimAmount} coins claimed and added to wallet.`,
      data: {
        claimedCoins: claimAmount,
        ...buildStatusResponse(settings, progress, ctx),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

exports.fetchRewards = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const settings = getAdsSettings();
    const ctx = await resolvePersonContext(req.user.userId, req.query.personType);
    if (ctx.error) {
      return res.status(200).json({ status: false, message: ctx.error });
    }

    const progress = await getOrCreateProgress(ctx);
    resetDailyCounterIfNeeded(progress);

    const rewards = await AdsWatchReward.find({ target: ctx.personType, isActive: true })
      .sort({ requiredPoints: 1 })
      .lean();

    const data = rewards.map((reward) => ({
      ...reward,
      canRedeem: settings.enabled && (progress.pendingCoins || 0) >= reward.requiredPoints,
    }));

    return res.status(200).json({
      status: true,
      message: "Ads watch rewards fetched successfully.",
      data,
      pendingCoins: progress.pendingCoins || 0,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

exports.redeemReward = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    if (!req.query.rewardId) {
      return res.status(200).json({ status: false, message: "rewardId is required." });
    }

    const settings = getAdsSettings();
    if (!settings.enabled) {
      return res.status(200).json({ status: false, message: "Ads watch feature is currently disabled." });
    }

    const ctx = await resolvePersonContext(req.user.userId, req.query.personType);
    if (ctx.error) {
      return res.status(200).json({ status: false, message: ctx.error });
    }

    const reward = await AdsWatchReward.findOne({
      _id: req.query.rewardId,
      target: ctx.personType,
      isActive: true,
    }).lean();

    if (!reward) {
      return res.status(200).json({ status: false, message: "Reward not found or inactive." });
    }

    const progress = await getOrCreateProgress(ctx);
    resetDailyCounterIfNeeded(progress);

    if ((progress.pendingCoins || 0) < reward.requiredPoints) {
      return res.status(200).json({
        status: false,
        message: `You need at least ${reward.requiredPoints} points to redeem this reward.`,
      });
    }

    const uniqueId = await generateHistoryUniqueId();
    const historyDate = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

    progress.pendingCoins = (progress.pendingCoins || 0) - reward.requiredPoints;
    progress.totalClaimed = (progress.totalClaimed || 0) + reward.coinValue;

    const walletUpdate =
      ctx.personType === "host"
        ? Host.findByIdAndUpdate(ctx.hostId, { $inc: { coin: reward.coinValue } }, { new: true })
        : User.findByIdAndUpdate(ctx.userId, { $inc: { coin: reward.coinValue } }, { new: true });

    const historyPayload =
      ctx.personType === "host"
        ? {
            uniqueId,
            hostId: ctx.hostId,
            hostCoin: reward.coinValue,
            type: HISTORY_TYPE.ADS_WATCH_REDEEM,
            date: historyDate,
          }
        : {
            uniqueId,
            userId: ctx.userId,
            userCoin: reward.coinValue,
            type: HISTORY_TYPE.ADS_WATCH_REDEEM,
            date: historyDate,
          };

    const [, updatedWallet] = await Promise.all([
      Promise.all([
        progress.save(),
        History.create(historyPayload),
        AdsWatchLog.create({
          userId: ctx.userId,
          hostId: ctx.hostId,
          personType: ctx.personType,
          action: "claim",
          coins: reward.coinValue,
        }),
      ]),
      walletUpdate,
    ]);

    ctx.walletCoin = updatedWallet?.coin ?? (ctx.walletCoin || 0) + reward.coinValue;

    return res.status(200).json({
      status: true,
      message: `${reward.coinValue} coins added to wallet.`,
      data: {
        reward,
        redeemedPoints: reward.requiredPoints,
        receivedCoins: reward.coinValue,
        ...buildStatusResponse(settings, progress, ctx),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
