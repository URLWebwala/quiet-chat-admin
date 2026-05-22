const AdsWatchReward = require("../../models/adsWatchReward.model");

exports.createReward = async (req, res) => {
  try {
    const { name, target, coinValue, requiredPoints, description } = req.body;

    if (!name?.trim() || !target || !coinValue || !requiredPoints) {
      return res.status(200).json({ status: false, message: "Name, target, coin value and required points are required." });
    }

    if (!["user", "host"].includes(String(target).toLowerCase())) {
      return res.status(200).json({ status: false, message: "Target must be user or host." });
    }

    const parsedCoinValue = Number(coinValue);
    const parsedRequiredPoints = Number(requiredPoints);

    if (!Number.isFinite(parsedCoinValue) || parsedCoinValue <= 0) {
      return res.status(200).json({ status: false, message: "Coin value must be greater than 0." });
    }

    if (!Number.isFinite(parsedRequiredPoints) || parsedRequiredPoints <= 0) {
      return res.status(200).json({ status: false, message: "Required points must be greater than 0." });
    }

    const reward = await AdsWatchReward.create({
      name: name.trim(),
      target: String(target).toLowerCase(),
      coinValue: parsedCoinValue,
      requiredPoints: parsedRequiredPoints,
      description: description?.trim() || "",
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
    const { rewardId, name, target, coinValue, requiredPoints, description, isActive } = req.body;

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
    if (coinValue !== undefined) {
      const parsed = Number(coinValue);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return res.status(200).json({ status: false, message: "Coin value must be greater than 0." });
      }
      reward.coinValue = parsed;
    }
    if (requiredPoints !== undefined) {
      const parsed = Number(requiredPoints);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return res.status(200).json({ status: false, message: "Required points must be greater than 0." });
      }
      reward.requiredPoints = parsed;
    }
    if (description !== undefined) reward.description = String(description).trim();
    if (isActive !== undefined) reward.isActive = !!isActive;

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

    const rewards = await AdsWatchReward.find(query).sort({ createdAt: -1 }).lean();

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
