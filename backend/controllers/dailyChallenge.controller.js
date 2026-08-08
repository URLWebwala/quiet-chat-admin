const DailyChallenge = require("../models/dailyChallenge.model");
const DailyChallengeProgress = require("../models/dailyChallengeProgress.model");
const CustomTask = require("../models/customTask.model");
const CustomTaskSubmission = require("../models/customTaskSubmission.model");
const User = require("../models/user.model");
const History = require("../models/history.model");

// Helper to get YYYY-MM-DD string
const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// --- ADMIN CONTROLLERS ---

// Create Daily Challenge
exports.createDailyChallenge = async (req, res) => {
  try {
    const { title, description, date, tasks, bonusCoins, isActive } = req.body;

    if (!title || !date || !tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ status: false, message: "Title, date, and at least 1 task are required." });
    }

    const existing = await DailyChallenge.findOne({ date });
    if (existing) {
      return res.status(400).json({ status: false, message: `Daily Challenge for date ${date} already exists.` });
    }

    const challenge = await DailyChallenge.create({
      title,
      description: description || "",
      date,
      tasks,
      bonusCoins: bonusCoins !== undefined ? Number(bonusCoins) : 50,
      isActive: isActive !== undefined ? isActive : true,
    });

    return res.status(200).json({
      status: true,
      message: "Daily Challenge created successfully.",
      data: challenge,
    });
  } catch (error) {
    console.error("createDailyChallenge error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Get All Daily Challenges (Admin)
exports.getDailyChallenges = async (req, res) => {
  try {
    const challenges = await DailyChallenge.find()
      .populate("tasks")
      .sort({ date: -1 });

    return res.status(200).json({
      status: true,
      message: "Daily Challenges fetched successfully.",
      data: challenges,
    });
  } catch (error) {
    console.error("getDailyChallenges error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Update Daily Challenge (Admin)
exports.updateDailyChallenge = async (req, res) => {
  try {
    const { challengeId } = req.query;
    const { title, description, date, tasks, bonusCoins, isActive } = req.body;

    if (!challengeId) {
      return res.status(400).json({ status: false, message: "challengeId is required." });
    }

    const challenge = await DailyChallenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ status: false, message: "Daily Challenge not found." });
    }

    if (title !== undefined) challenge.title = title;
    if (description !== undefined) challenge.description = description;
    if (date !== undefined) challenge.date = date;
    if (tasks !== undefined && Array.isArray(tasks)) challenge.tasks = tasks;
    if (bonusCoins !== undefined) challenge.bonusCoins = Number(bonusCoins);
    if (isActive !== undefined) challenge.isActive = isActive;

    await challenge.save();

    return res.status(200).json({
      status: true,
      message: "Daily Challenge updated successfully.",
      data: challenge,
    });
  } catch (error) {
    console.error("updateDailyChallenge error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Delete Daily Challenge (Admin)
exports.deleteDailyChallenge = async (req, res) => {
  try {
    const { challengeId } = req.query;

    if (!challengeId) {
      return res.status(400).json({ status: false, message: "challengeId is required." });
    }

    await DailyChallenge.findByIdAndDelete(challengeId);

    return res.status(200).json({
      status: true,
      message: "Daily Challenge deleted successfully.",
    });
  } catch (error) {
    console.error("deleteDailyChallenge error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// --- CLIENT CONTROLLERS ---

// Get Today's Active Daily Challenge for App User
exports.getTodayChallenge = async (req, res) => {
  try {
    const userId = req.user?._id || req.query.userId;
    const today = getTodayDateString();

    let challenge = await DailyChallenge.findOne({ date: today, isActive: true }).populate("tasks");

    // If no challenge specifically for today, fetch latest active challenge as fallback
    if (!challenge) {
      challenge = await DailyChallenge.findOne({ isActive: true }).sort({ createdAt: -1 }).populate("tasks");
    }

    if (!challenge) {
      return res.status(200).json({
        status: true,
        message: "No active daily challenge for today.",
        data: null,
      });
    }

    // Get User Submissions for tasks in this challenge
    let completedTaskIds = [];
    let isBonusClaimed = false;

    if (userId) {
      // Find completed submissions for this user
      const submissions = await CustomTaskSubmission.find({
        userId,
        taskId: { $in: challenge.tasks.map((t) => t._id) },
        status: "approved",
      });

      completedTaskIds = submissions.map((s) => s.taskId.toString());

      // Check progress model
      const progress = await DailyChallengeProgress.findOne({
        userId,
        dailyChallengeId: challenge._id,
      });

      if (progress) {
        isBonusClaimed = progress.isBonusClaimed;
      }
    }

    const totalTasksCount = challenge.tasks.length;
    const completedCount = completedTaskIds.length;
    const isTargetReached = totalTasksCount > 0 && completedCount >= totalTasksCount;

    return res.status(200).json({
      status: true,
      message: "Today's Daily Challenge retrieved.",
      data: {
        _id: challenge._id,
        title: challenge.title,
        description: challenge.description,
        date: challenge.date,
        bonusCoins: challenge.bonusCoins,
        tasks: challenge.tasks,
        totalTasksCount,
        completedCount,
        completedTaskIds,
        isTargetReached,
        isBonusClaimed,
      },
    });
  } catch (error) {
    console.error("getTodayChallenge error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Claim Daily Challenge Bonus Coins (Client App)
exports.claimDailyBonus = async (req, res) => {
  try {
    const userId = req.user?._id || req.body.userId;
    const { challengeId } = req.body;

    if (!userId || !challengeId) {
      return res.status(400).json({ status: false, message: "userId and challengeId are required." });
    }

    const challenge = await DailyChallenge.findById(challengeId).populate("tasks");
    if (!challenge) {
      return res.status(404).json({ status: false, message: "Daily Challenge not found." });
    }

    // Check if user has already claimed bonus
    let progress = await DailyChallengeProgress.findOne({
      userId,
      dailyChallengeId: challenge._id,
    });

    if (progress && progress.isBonusClaimed) {
      return res.status(400).json({ status: false, message: "Daily Bonus already claimed!" });
    }

    // Check if user completed all tasks
    const submissions = await CustomTaskSubmission.find({
      userId,
      taskId: { $in: challenge.tasks.map((t) => t._id) },
      status: "approved",
    });

    const completedTaskIds = submissions.map((s) => s.taskId.toString());
    if (completedTaskIds.length < challenge.tasks.length) {
      return res.status(400).json({
        status: false,
        message: `Complete all ${challenge.tasks.length} tasks to claim bonus coins! (${completedTaskIds.length}/${challenge.tasks.length} done)`,
      });
    }

    // Credit coins to user wallet
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found." });
    }

    const bonusCoins = challenge.bonusCoins || 50;
    user.coin = (user.coin || 0) + bonusCoins;
    await user.save();

    // Create or update progress record
    if (!progress) {
      progress = new DailyChallengeProgress({
        userId,
        dailyChallengeId: challenge._id,
        date: challenge.date,
        completedTaskIds,
        isBonusClaimed: true,
        claimedAt: new Date(),
      });
    } else {
      progress.isBonusClaimed = true;
      progress.claimedAt = new Date();
      progress.completedTaskIds = completedTaskIds;
    }
    await progress.save();

    // Create history entry
    try {
      if (History) {
        await History.create({
          userId: user._id,
          coin: bonusCoins,
          type: 1, // Add coin type
          isIncome: true,
          reason: `Daily Target Bonus: ${challenge.title}`,
          date: new Date().toISOString(),
        });
      }
    } catch (hErr) {
      console.log("History creation fallback:", hErr.message);
    }

    return res.status(200).json({
      status: true,
      message: `🎉 Success! +${bonusCoins} Bonus Coins claimed!`,
      data: {
        newCoinBalance: user.coin,
        bonusCoins,
        isBonusClaimed: true,
      },
    });
  } catch (error) {
    console.error("claimDailyBonus error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
