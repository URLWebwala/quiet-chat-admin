const AdsWatchReward = require("../../models/adsWatchReward.model");

exports.createReward = async (req, res) => {
  try {
    const { name, target, rewardType, coinValue, rupeeValue, requiredPoints, description, isComingSoon } = req.body;

    if (!name?.trim() || !target || !requiredPoints) {
      return res.status(200).json({ status: false, message: "Name, target, and required points are required." });
    }

    const type = String(rewardType || "coin").toLowerCase();
    if (!["coin", "rupee"].includes(type)) {
      return res.status(200).json({ status: false, message: "rewardType must be coin or rupee." });
    }

    if (!["user", "host"].includes(String(target).toLowerCase())) {
      return res.status(200).json({ status: false, message: "Target must be user or host." });
    }

    const parsedPoints = Number(requiredPoints);
    if (!Number.isFinite(parsedPoints) || parsedPoints <= 0) {
      return res.status(200).json({ status: false, message: "Required points must be greater than 0." });
    }

    let parsedCoinValue = 0;
    let parsedRupeeValue = 0;

    if (type === "coin") {
      parsedCoinValue = Number(coinValue);
      if (!Number.isFinite(parsedCoinValue) || parsedCoinValue <= 0) {
        return res.status(200).json({ status: false, message: "Coin value must be greater than 0." });
      }
    } else {
      parsedRupeeValue = Number(rupeeValue);
      if (!Number.isFinite(parsedRupeeValue) || parsedRupeeValue <= 0) {
        return res.status(200).json({ status: false, message: "Rupee value must be greater than 0." });
      }
    }

    const reward = await AdsWatchReward.create({
      name: name.trim(),
      target: String(target).toLowerCase(),
      rewardType: type,
      coinValue: parsedCoinValue,
      rupeeValue: parsedRupeeValue,
      requiredPoints: parsedPoints,
      description: description?.trim() || "",
      isComingSoon: isComingSoon !== undefined ? !!isComingSoon : (type === "rupee"),
    });

    return res.status(200).json({
      status: true,
      message: "Ads watch reward created successfully.",
      data: reward,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

exports.updateReward = async (req, res) => {
  try {
    const { rewardId, name, target, rewardType, coinValue, rupeeValue, requiredPoints, description, isActive, isComingSoon } = req.body;

    if (!rewardId) {
      return res.status(200).json({ status: false, message: "rewardId is required." });
    }

    const reward = await AdsWatchReward.findById(rewardId);
    if (!reward) {
      return res.status(200).json({ status: false, message: "Reward not found." });
    }

    if (name !== undefined) reward.name = String(name).trim();
    if (target !== undefined) {
      if (!["user", "host"].includes(String(target).toLowerCase())) {
        return res.status(200).json({ status: false, message: "Target must be user or host." });
      }
      reward.target = String(target).toLowerCase();
    }

    if (rewardType !== undefined) {
      const type = String(rewardType).toLowerCase();
      if (!["coin", "rupee"].includes(type)) {
        return res.status(200).json({ status: false, message: "rewardType must be coin or rupee." });
      }
      reward.rewardType = type;
    }

    if (requiredPoints !== undefined) {
      const parsedPoints = Number(requiredPoints);
      if (!Number.isFinite(parsedPoints) || parsedPoints <= 0) {
        return res.status(200).json({ status: false, message: "Required points must be greater than 0." });
      }
      reward.requiredPoints = parsedPoints;
    }

    if (coinValue !== undefined) {
      const parsedCoinValue = Number(coinValue);
      if (Number.isFinite(parsedCoinValue)) {
        reward.coinValue = parsedCoinValue;
      }
    }

    if (rupeeValue !== undefined) {
      const parsedRupeeValue = Number(rupeeValue);
      if (Number.isFinite(parsedRupeeValue)) {
        reward.rupeeValue = parsedRupeeValue;
      }
    }

    if (description !== undefined) reward.description = String(description).trim();
    if (isActive !== undefined) reward.isActive = !!isActive;
    if (isComingSoon !== undefined) reward.isComingSoon = !!isComingSoon;

    await reward.save();

    return res.status(200).json({
      status: true,
      message: "Ads watch reward updated successfully.",
      data: reward,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

exports.fetchRewards = async (req, res) => {
  try {
    const target = String(req.query.target || "all").toLowerCase();
    const query = target === "user" || target === "host" ? { target } : {};

    const rewards = await AdsWatchReward.find(query).sort({ requiredPoints: 1 }).lean();

    return res.status(200).json({
      status: true,
      message: "Ads watch rewards fetched successfully.",
      total: rewards.length,
      data: rewards,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

exports.toggleRewardStatus = async (req, res) => {
  try {
    if (!req.query.rewardId) {
      return res.status(200).json({ status: false, message: "rewardId is required." });
    }

    const reward = await AdsWatchReward.findById(req.query.rewardId);
    if (!reward) {
      return res.status(200).json({ status: false, message: "Reward not found." });
    }

    reward.isActive = !reward.isActive;
    await reward.save();

    return res.status(200).json({
      status: true,
      message: "Reward status updated successfully.",
      data: reward,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

exports.removeReward = async (req, res) => {
  try {
    if (!req.query.rewardId) {
      return res.status(200).json({ status: false, message: "rewardId is required." });
    }

    const reward = await AdsWatchReward.findById(req.query.rewardId);
    if (!reward) {
      return res.status(200).json({ status: false, message: "Reward not found." });
    }

    await reward.deleteOne();

    return res.status(200).json({
      status: true,
      message: "Ads watch reward deleted successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
