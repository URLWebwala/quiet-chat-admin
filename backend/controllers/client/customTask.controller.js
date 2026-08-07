const mongoose = require("mongoose");
const CustomTask = require("../../models/customTask.model");
const CustomTaskSubmission = require("../../models/customTaskSubmission.model");
const AdsWatchProgress = require("../../models/adsWatchProgress.model");

// Fetch active tasks for client app with submission status
exports.getTaskList = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access." });
    }

    const tasks = await CustomTask.find({ isActive: true }).sort({ createdAt: -1 });
    const taskIds = tasks.map((t) => t._id);

    // Get user's submissions for these tasks
    const submissions = await CustomTaskSubmission.find({
      userId: new mongoose.Types.ObjectId(userId),
      taskId: { $in: taskIds },
    });

    const submissionMap = {};
    submissions.forEach((sub) => {
      submissionMap[String(sub.taskId)] = sub;
    });

    const tasksWithStatus = tasks.map((task) => {
      const taskObj = task.toObject();
      const sub = submissionMap[String(task._id)];
      if (!sub) {
        taskObj.userStatus = "not_started";
        taskObj.submissionId = null;
        taskObj.proofImage = "";
        taskObj.rejectionReason = "";
      } else {
        taskObj.userStatus = sub.status; // pending, approved, rejected
        taskObj.submissionId = sub._id;
        taskObj.proofImage = sub.proofImage;
        taskObj.rejectionReason = sub.rejectionReason;
      }
      return taskObj;
    });

    return res.status(200).json({
      status: true,
      message: "Custom task list fetched successfully.",
      tasks: tasksWithStatus,
    });
  } catch (error) {
    console.error("Get client task list error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Submit task proof
exports.submitTaskProof = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access." });
    }

    const { taskId } = req.body;
    if (!taskId) {
      return res.status(200).json({ status: false, message: "taskId is required." });
    }

    const task = await CustomTask.findById(taskId);
    if (!task || !task.isActive) {
      return res.status(200).json({ status: false, message: "Task is not active or found." });
    }

    // Check existing submissions
    const existingCount = await CustomTaskSubmission.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      taskId: new mongoose.Types.ObjectId(taskId),
      status: { $in: ["pending", "approved"] },
    });

    if (existingCount >= (task.maxCompletionsPerUser || 1)) {
      return res.status(200).json({ status: false, message: "Task is already submitted or completed." });
    }

    let proofImagePath = "";
    if (req.file) {
      proofImagePath = req.file.path.replace(/\\/g, "/");
    } else if (task.requireProof) {
      return res.status(200).json({ status: false, message: "Screenshot proof image is required for this task." });
    }

    const autoApprove = !task.requireProof;
    const initialStatus = autoApprove ? "approved" : "pending";

    const submission = new CustomTaskSubmission({
      taskId: task._id,
      userId: new mongoose.Types.ObjectId(userId),
      personType: "user",
      proofImage: proofImagePath,
      status: initialStatus,
      rewardPoints: task.rewardPoints,
      submittedAt: new Date(),
      processedAt: autoApprove ? new Date() : null,
    });

    if (autoApprove) {
      let progress = await AdsWatchProgress.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        personType: "user",
      });

      if (!progress) {
        progress = new AdsWatchProgress({
          userId: new mongoose.Types.ObjectId(userId),
          personType: "user",
          pendingCoins: 0,
          totalEarned: 0,
        });
      }

      progress.pendingCoins = (progress.pendingCoins || 0) + task.rewardPoints;
      progress.totalEarned = (progress.totalEarned || 0) + task.rewardPoints;
      await progress.save();

      await CustomTask.findByIdAndUpdate(task._id, { $inc: { totalCompletions: 1 } });
    }

    await submission.save();

    return res.status(200).json({
      status: true,
      message: autoApprove
        ? `Task completed! ${task.rewardPoints} points credited to your balance.`
        : "Task proof submitted successfully. Waiting for admin verification.",
      submission,
    });
  } catch (error) {
    console.error("Submit task proof error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
