const mongoose = require("mongoose");

const User = require("../../models/user.model");
const Host = require("../../models/host.model");
const History = require("../../models/history.model");
const AdsWatchProgress = require("../../models/adsWatchProgress.model");
const AdsWatchLog = require("../../models/adsWatchLog.model");
const AdsWatchReward = require("../../models/adsWatchReward.model");
const { HISTORY_TYPE } = require("../../types/constant");
const generateHistoryUniqueId = require("../../util/generateHistoryUniqueId");
const adminFCM = require("../../util/privateKey");

const getToday = () => new Date().toISOString().slice(0, 10);

function getAdsSettings() {
  const s = global.settingJSON || {};
  const pointsPerCoin = Number(s.adsWatchPointsPerCoin) > 0 ? Number(s.adsWatchPointsPerCoin) : 1;
  return {
    enabled: !!s.adsWatchEnabled,
    userPointsPerAd: Number(s.adsWatchUserCoinPerAd) || 0,
    hostPointsPerAd: Number(s.adsWatchHostCoinPerAd) || 0,
    userCoinPerAd: Number(s.adsWatchUserCoinPerAd) || 0,
    hostCoinPerAd: Number(s.adsWatchHostCoinPerAd) || 0,
    userDailyLimit: Number(s.adsWatchUserDailyLimit) || 0,
    hostDailyLimit: Number(s.adsWatchHostDailyLimit) || 0,
    minPointsToClaim: Number(s.adsWatchMinCoinsToClaim) || 0,
    minCoinsToClaim: Number(s.adsWatchMinCoinsToClaim) || 0,
    pointsPerCoin,
    claimFrequencyHours: Number(s.adsWatchClaimFrequencyHours) || 24,
    fullWatchBonus: Number(s.adsWatchFullWatchBonus) || 0,
    rewardedAdsEnabled: s.adsWatchRewardedAdsEnabled !== false,
    interstitialAdsEnabled: s.adsWatchInterstitialAdsEnabled !== false,
    bannerAdsEnabled: s.adsWatchBannerAdsEnabled !== false,
    hostBonusMultiplier: Number(s.adsWatchHostBonusMultiplier) || 1,
    vipBonusPoints: Number(s.adsWatchVipBonusPoints) || 0,
    pointsPerRupee: Number(s.pointsPerRupee) > 0 ? Number(s.pointsPerRupee) : 10,
    bitlabsEnabled: !!s.bitlabsEnabled,
    bitlabsPointsPerSurvey: Number(s.bitlabsPointsPerSurvey) || 50,
    cpxEnabled: !!s.cpxEnabled,
    cpxPointsPerSurvey: Number(s.cpxPointsPerSurvey) || 50,
    unityAdsEnabled: s.unityAdsEnabled !== false,
    unityPointsPerAd: Number(s.unityPointsPerAd) || 25,
    unityGameIdAndroid: s.unityGameIdAndroid || "800001502",
    unityPlacementIdAndroid: s.unityPlacementIdAndroid || "Rewarded_Android",
    unityGameIdIos: s.unityGameIdIos || "5749102",
    unityPlacementIdIos: s.unityPlacementIdIos || "Rewarded_iOS",
  };
}

function convertPointsToCoins(points, pointsPerCoin) {
  const rate = pointsPerCoin > 0 ? pointsPerCoin : 1;
  const coins = Math.floor((points || 0) / rate);
  const pointsUsed = coins * rate;
  return { coins, pointsUsed, remainingPoints: (points || 0) - pointsUsed };
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
  const pointsPerAd = ctx.personType === "host" ? settings.hostPointsPerAd : settings.userPointsPerAd;
  const pendingPoints = progress.pendingCoins || 0;
  const conversion = convertPointsToCoins(pendingPoints, settings.pointsPerCoin);
  const remainingWatches = Math.max(0, dailyLimit - (progress.watchesToday || 0));

  let canClaim = pendingPoints >= settings.minPointsToClaim && conversion.coins > 0;
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
    pointsPerAd,
    coinPerAd: pointsPerAd,
    pointsPerCoin: settings.pointsPerCoin,
    dailyLimit,
    watchesToday: progress.watchesToday || 0,
    remainingWatches,
    pendingPoints,
    pendingCoins: pendingPoints,
    minPointsToClaim: settings.minPointsToClaim,
    minCoinsToClaim: settings.minPointsToClaim,
    convertibleCoins: conversion.coins,
    canClaim: settings.enabled && canClaim,
    nextClaimInHours,
    walletCoins: ctx.walletCoin || 0,
    totalWatches: progress.totalWatches || 0,
    totalClaimed: progress.totalClaimed || 0,
    claimFrequencyHours: settings.claimFrequencyHours,
    fullWatchBonus: settings.fullWatchBonus,
    rewardedAdsEnabled: settings.rewardedAdsEnabled,
    interstitialAdsEnabled: settings.interstitialAdsEnabled,
    bannerAdsEnabled: settings.bannerAdsEnabled,
    bitlabsEnabled: settings.bitlabsEnabled || false,
    bitlabsPointsPerSurvey: settings.bitlabsPointsPerSurvey || 50,
    cpxEnabled: settings.cpxEnabled || false,
    cpxPointsPerSurvey: settings.cpxPointsPerSurvey || 50,
    unityAdsEnabled: settings.unityAdsEnabled !== false,
    unityPointsPerAd: settings.unityPointsPerAd || 25,
    unityGameIdAndroid: settings.unityGameIdAndroid || "5749102",
    unityPlacementIdAndroid: settings.unityPlacementIdAndroid || "Rewarded_Android",
    unityGameIdIos: settings.unityGameIdIos || "5749102",
    unityPlacementIdIos: settings.unityPlacementIdIos || "Rewarded_iOS",
    pointsPerRupee: settings.pointsPerRupee || 10,
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
    const ctx = await resolvePersonContext(req.user.userId, req.query.personType);
    if (ctx.error) {
      return res.status(200).json({ status: false, message: ctx.error });
    }

    const progress = await getOrCreateProgress(ctx);
    resetDailyCounterIfNeeded(progress);

    let pointsEarned = 0;
    let isSurvey = false;

    if (adType === "bitlabs") {
      if (!settings.bitlabsEnabled) {
        return res.status(200).json({ status: false, message: "BitLabs surveys are disabled." });
      }
      pointsEarned = settings.bitlabsPointsPerSurvey ?? 50;
      isSurvey = true;
    } else if (adType === "cpx") {
      if (!settings.cpxEnabled) {
        return res.status(200).json({ status: false, message: "CPX Research surveys are disabled." });
      }
      pointsEarned = settings.cpxPointsPerSurvey ?? 50;
      isSurvey = true;
    } else if (adType === "unity") {
      if (!settings.unityAdsEnabled) {
        return res.status(200).json({ status: false, message: "Unity Ads are disabled." });
      }
      pointsEarned = settings.unityPointsPerAd ?? 25;
      isSurvey = false;
    } else {
      if (adType === "rewarded" && !settings.rewardedAdsEnabled) {
        return res.status(200).json({ status: false, message: "Rewarded ads are disabled." });
      }
      if (adType === "interstitial" && !settings.interstitialAdsEnabled) {
        return res.status(200).json({ status: false, message: "Interstitial ads are disabled." });
      }
      if (adType === "banner" && !settings.bannerAdsEnabled) {
        return res.status(200).json({ status: false, message: "Banner ads are disabled." });
      }

      const dailyLimit = ctx.personType === "host" ? settings.hostDailyLimit : settings.userDailyLimit;
      if (dailyLimit > 0 && progress.watchesToday >= dailyLimit) {
        return res.status(200).json({ status: false, message: "Daily ad watch limit reached." });
      }

      pointsEarned = ctx.personType === "host" ? settings.hostPointsPerAd : settings.userPointsPerAd;
      if (ctx.personType === "host") {
        pointsEarned = Math.round(pointsEarned * settings.hostBonusMultiplier);
      }
      if (ctx.isVip && settings.vipBonusPoints > 0) {
        pointsEarned += settings.vipBonusPoints;
      }
      if (String(req.query.isFullWatch).toLowerCase() === "true" && settings.fullWatchBonus > 0) {
        pointsEarned += settings.fullWatchBonus;
      }
    }

    if (pointsEarned <= 0) {
      return res.status(200).json({ status: false, message: "Invalid points reward configuration." });
    }

    progress.pendingCoins = (progress.pendingCoins || 0) + pointsEarned;
    if (!isSurvey) {
      progress.watchesToday = (progress.watchesToday || 0) + 1;
      progress.totalWatches = (progress.totalWatches || 0) + 1;
      progress.lastWatchDate = getToday();
    }
    progress.totalEarned = (progress.totalEarned || 0) + pointsEarned;

    await Promise.all([
      progress.save(),
      AdsWatchLog.create({
        userId: ctx.userId,
        hostId: ctx.hostId,
        personType: ctx.personType,
        action: isSurvey ? `survey_${adType}` : "watch",
        coins: pointsEarned,
        adType,
      }),
    ]);

    ctx.walletCoin = ctx.walletCoin || 0;
    return res.status(200).json({
      status: true,
      message: "Ad watched successfully. Points added to pending balance.",
      data: {
        pointsEarned,
        coinsEarned: pointsEarned,
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

    const pendingPoints = progress.pendingCoins || 0;
    if (pendingPoints < settings.minPointsToClaim) {
      return res.status(200).json({
        status: false,
        message: `Minimum ${settings.minPointsToClaim} points required to claim.`,
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

    const conversion = convertPointsToCoins(pendingPoints, settings.pointsPerCoin);
    if (conversion.coins <= 0) {
      return res.status(200).json({
        status: false,
        message: `You need at least ${settings.pointsPerCoin} points to convert to 1 coin.`,
      });
    }

    const uniqueId = await generateHistoryUniqueId();
    const historyDate = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

    progress.pendingCoins = conversion.remainingPoints;
    progress.totalClaimed = (progress.totalClaimed || 0) + conversion.coins;
    progress.lastClaimAt = new Date();

    const walletUpdate =
      ctx.personType === "host"
        ? Host.findByIdAndUpdate(ctx.hostId, { $inc: { coin: conversion.coins } }, { new: true })
        : User.findByIdAndUpdate(ctx.userId, { $inc: { coin: conversion.coins } }, { new: true });

    const historyPayload =
      ctx.personType === "host"
        ? {
            uniqueId,
            hostId: ctx.hostId,
            hostCoin: conversion.coins,
            type: HISTORY_TYPE.ADS_WATCH_CLAIM,
            date: historyDate,
          }
        : {
            uniqueId,
            userId: ctx.userId,
            userCoin: conversion.coins,
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
          coins: conversion.coins,
        }),
      ]),
      walletUpdate,
    ]);

    ctx.walletCoin = updatedWallet?.coin ?? (ctx.walletCoin || 0) + conversion.coins;

    // 🔔 Push notification: coins credited
    try {
      const fcmTarget = ctx.personType === "host"
        ? await Host.findById(ctx.hostId).select("fcmToken").lean()
        : await User.findById(ctx.userId).select("fcmToken").lean();
      if (fcmTarget?.fcmToken) {
        const adminInstance = await adminFCM;
        adminInstance.messaging().send({
          token: fcmTarget.fcmToken,
          data: {
            title: "🎉 Coins Credited!",
            body: `${conversion.coins} coins have been added to your wallet.`,
            type: "REWARD",
          },
        }).catch((e) => console.error("FCM claimCoins error:", e.message));
      }
    } catch (_) {}

    return res.status(200).json({
      status: true,
      message: `${conversion.pointsUsed} points converted to ${conversion.coins} wallet coins.`,
      data: {
        claimedPoints: conversion.pointsUsed,
        claimedCoins: conversion.coins,
        remainingPoints: conversion.remainingPoints,
        ...buildStatusResponse(settings, progress, ctx),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

exports.claimRupees = async (req, res) => {
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

    if (ctx.personType === "host") {
      return res.status(200).json({ status: false, message: "Only users can convert points to Rupees." });
    }

    const progress = await getOrCreateProgress(ctx);
    resetDailyCounterIfNeeded(progress);

    const pendingPoints = progress.pendingCoins || 0;
    if (pendingPoints < settings.minPointsToClaim) {
      return res.status(200).json({
        status: false,
        message: `Minimum ${settings.minPointsToClaim} points required to claim.`,
      });
    }

    const pointsPerRupee = Number(global.settingJSON?.pointsPerRupee) > 0 ? Number(global.settingJSON?.pointsPerRupee) : 10;
    const rupeesEarned = Math.floor(pendingPoints / pointsPerRupee);
    const pointsUsed = rupeesEarned * pointsPerRupee;

    if (rupeesEarned <= 0) {
      return res.status(200).json({
        status: false,
        message: `You need at least ${pointsPerRupee} points to convert to 1 Rupee.`,
      });
    }

    const uniqueId = await generateHistoryUniqueId();
    const historyDate = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

    progress.pendingCoins = pendingPoints - pointsUsed;
    progress.totalClaimed = (progress.totalClaimed || 0) + pointsUsed;
    progress.lastClaimAt = new Date();

    const walletUpdate = User.findByIdAndUpdate(ctx.userId, { $inc: { rupeeBalance: rupeesEarned } }, { new: true });

    const historyPayload = {
      uniqueId,
      userId: ctx.userId,
      rupee: rupeesEarned,
      type: HISTORY_TYPE.ADS_WATCH_CLAIM,
      date: historyDate,
    };

    const [, updatedWallet] = await Promise.all([
      Promise.all([
        progress.save(),
        History.create(historyPayload),
        AdsWatchLog.create({
          userId: ctx.userId,
          personType: ctx.personType,
          action: "claim_rupee",
          coins: rupeesEarned,
        }),
      ]),
      walletUpdate,
    ]);

    // 🔔 Push notification: rupees credited
    try {
      const fcmUser = await User.findById(ctx.userId).select("fcmToken").lean();
      if (fcmUser?.fcmToken) {
        const adminInstance = await adminFCM;
        adminInstance.messaging().send({
          token: fcmUser.fcmToken,
          data: {
            title: "💰 Cash Added!",
            body: `₹${rupeesEarned} has been added to your wallet balance.`,
            type: "REWARD",
          },
        }).catch((e) => console.error("FCM claimRupees error:", e.message));
      }
    } catch (_) {}

    return res.status(200).json({
      status: true,
      message: `${pointsUsed} points converted to ₹${rupeesEarned} cash balance.`,
      data: {
        claimedPoints: pointsUsed,
        claimedRupees: rupeesEarned,
        remainingPoints: progress.pendingCoins,
        rupeeBalance: updatedWallet?.rupeeBalance || 0,
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

    const data = rewards.map((reward) => {
      const type = reward.rewardType || "coin";
      return {
        ...reward,
        rewardType: type === "rupee" ? "wallet_rupee" : "wallet_coins",
        rewardTypeLabel: type === "rupee" ? "Wallet Rupees" : "Wallet Coins",
        valueLabel: type === "rupee" ? `₹${reward.rupeeValue || 0}` : `${reward.coinValue || 0} Coins`,
        canRedeem: settings.enabled && (progress.pendingCoins || 0) >= reward.requiredPoints,
      };
    });

    return res.status(200).json({
      status: true,
      message: "Ads watch rewards fetched successfully.",
      data,
      pendingCoins: progress.pendingCoins || 0,
      pendingPoints: progress.pendingCoins || 0,
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
    progress.totalClaimed = (progress.totalClaimed || 0) + reward.requiredPoints;

    const isRupee = reward.rewardType === "rupee";

    const walletUpdate =
      ctx.personType === "host"
        ? Host.findByIdAndUpdate(ctx.hostId, { $inc: { coin: reward.coinValue } }, { new: true })
        : (isRupee
           ? User.findByIdAndUpdate(ctx.userId, { $inc: { rupeeBalance: reward.rupeeValue } }, { new: true })
           : User.findByIdAndUpdate(ctx.userId, { $inc: { coin: reward.coinValue } }, { new: true }));

    const historyPayload =
      ctx.personType === "host"
        ? {
            uniqueId,
            hostId: ctx.hostId,
            hostCoin: reward.coinValue,
            type: HISTORY_TYPE.ADS_WATCH_REDEEM,
            date: historyDate,
          }
        : (isRupee
           ? {
               uniqueId,
               userId: ctx.userId,
               rupee: reward.rupeeValue,
               type: HISTORY_TYPE.ADS_WATCH_REDEEM,
               date: historyDate,
             }
           : {
               uniqueId,
               userId: ctx.userId,
               userCoin: reward.coinValue,
               type: HISTORY_TYPE.ADS_WATCH_REDEEM,
               date: historyDate,
             });

    const [, updatedWallet] = await Promise.all([
      Promise.all([
        progress.save(),
        History.create(historyPayload),
        AdsWatchLog.create({
          userId: ctx.userId,
          hostId: ctx.hostId,
          personType: ctx.personType,
          action: isRupee ? "claim_rupee" : "claim",
          coins: isRupee ? reward.rupeeValue : reward.coinValue,
        }),
      ]),
      walletUpdate,
    ]);

    if (!isRupee) {
      ctx.walletCoin = updatedWallet?.coin ?? (ctx.walletCoin || 0) + reward.coinValue;
    }

    // 🔔 Push notification: reward redeemed
    try {
      const fcmTarget = ctx.personType === "host"
        ? await Host.findById(ctx.hostId).select("fcmToken").lean()
        : await User.findById(ctx.userId).select("fcmToken").lean();
      if (fcmTarget?.fcmToken) {
        const adminInstance = await adminFCM;
        const notifBody = isRupee
          ? `₹${reward.rupeeValue} cash reward has been added to your wallet!`
          : `${reward.coinValue} coins reward has been added to your wallet!`;
        adminInstance.messaging().send({
          token: fcmTarget.fcmToken,
          data: {
            title: "🎁 Reward Redeemed!",
            body: notifBody,
            type: "REWARD",
          },
        }).catch((e) => console.error("FCM redeemReward error:", e.message));
      }
    } catch (_) {}

    return res.status(200).json({
      status: true,
      message: isRupee
        ? `₹${reward.rupeeValue} cash added to wallet.`
        : `${reward.coinValue} coins added to wallet.`,
      data: {
        reward,
        redeemedPoints: reward.requiredPoints,
        receivedCoins: isRupee ? 0 : reward.coinValue,
        receivedRupees: isRupee ? reward.rupeeValue : 0,
        rupeeBalance: updatedWallet?.rupeeBalance || 0,
        ...buildStatusResponse(settings, progress, ctx),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
