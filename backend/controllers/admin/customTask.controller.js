const mongoose = require("mongoose");
const CustomTask = require("../../models/customTask.model");
const CustomTaskSubmission = require("../../models/customTaskSubmission.model");
const AdsWatchProgress = require("../../models/adsWatchProgress.model");
const User = require("../../models/user.model");
const Host = require("../../models/host.model");
const sendEarningNotification = require("../../util/sendEarningNotification");
const verifyScreenshotProof = require("../../util/ocrVerification");

// Create Task
exports.createTask = async (req, res) => {
  try {
    const { title, description, actionUrl, rewardPoints, requireProof, icon, maxCompletionsPerUser } = req.body;
    if (!title) {
      return res.status(200).json({ status: false, message: "Task title is required." });
    }

    const task = new CustomTask({
      title: title.trim(),
      description: description ? description.trim() : "",
      actionUrl: actionUrl ? actionUrl.trim() : "",
      rewardPoints: Number(rewardPoints) > 0 ? Number(rewardPoints) : 50,
      requireProof: requireProof !== undefined ? !!requireProof : true,
      icon: icon ? icon.trim() : "",
      maxCompletionsPerUser: Number(maxCompletionsPerUser) > 0 ? Number(maxCompletionsPerUser) : 1,
      isActive: true,
    });

    await task.save();
    return res.status(200).json({ status: true, message: "Custom task created successfully.", task });
  } catch (error) {
    console.error("Create task error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Fetch Tasks
exports.fetchTasks = async (req, res) => {
  try {
    const tasks = await CustomTask.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ status: true, message: "Tasks fetched successfully.", tasks });
  } catch (error) {
    console.error("Fetch tasks error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Update Task
exports.updateTask = async (req, res) => {
  try {
    const { taskId, title, description, actionUrl, rewardPoints, requireProof, icon, maxCompletionsPerUser, isActive } = req.body;
    if (!taskId) {
      return res.status(200).json({ status: false, message: "TaskId is required." });
    }

    const task = await CustomTask.findById(taskId);
    if (!task) {
      return res.status(200).json({ status: false, message: "Task not found." });
    }

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (actionUrl !== undefined) task.actionUrl = actionUrl.trim();
    if (rewardPoints !== undefined) task.rewardPoints = Number(rewardPoints);
    if (requireProof !== undefined) task.requireProof = !!requireProof;
    if (icon !== undefined) task.icon = icon.trim();
    if (maxCompletionsPerUser !== undefined) task.maxCompletionsPerUser = Number(maxCompletionsPerUser);
    if (isActive !== undefined) task.isActive = !!isActive;

    await task.save();
    return res.status(200).json({ status: true, message: "Task updated successfully.", task });
  } catch (error) {
    console.error("Update task error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Delete Task
exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.query;
    if (!taskId) {
      return res.status(200).json({ status: false, message: "TaskId is required." });
    }

    await CustomTask.findByIdAndDelete(taskId);
    await CustomTaskSubmission.deleteMany({ taskId });

    return res.status(200).json({ status: true, message: "Task deleted successfully." });
  } catch (error) {
    console.error("Delete task error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Fetch Task Submissions
exports.fetchSubmissions = async (req, res) => {
  try {
    const start = Math.max(1, parseInt(req.query.start) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (start - 1) * limit;

    const filter = {};
    if (req.query.status && ["pending", "approved", "rejected"].includes(req.query.status)) {
      filter.status = req.query.status;
    }
    if (req.query.taskId) {
      filter.taskId = req.query.taskId;
    }

    const total = await CustomTaskSubmission.countDocuments(filter);
    const submissions = await CustomTaskSubmission.find(filter)
      .populate("userId", "name uniqueId image email phone")
      .populate("taskId", "title rewardPoints requireProof actionUrl description")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      status: true,
      message: "Task submissions fetched successfully.",
      total,
      submissions,
    });
  } catch (error) {
    console.error("Fetch submissions error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Verify Submission (Approve / Reject)
exports.verifySubmission = async (req, res) => {
  try {
    const { submissionId, status, rejectionReason, forceApprove } = req.body;
    if (!submissionId || !["approved", "rejected"].includes(status)) {
      return res.status(200).json({ status: false, message: "Valid submissionId and status (approved/rejected) are required." });
    }

    const submission = await CustomTaskSubmission.findById(submissionId).populate("taskId");
    if (!submission) {
      return res.status(200).json({ status: false, message: "Submission not found." });
    }

    if (submission.status !== "pending") {
      return res.status(200).json({ status: false, message: `Submission is already ${submission.status}.` });
    }

    if (status === "approved") {
      // AI OCR Image Verification Check
      if (submission.proofImage && !forceApprove) {
        try {
          const ocrResult = await verifyScreenshotProof(
            submission.proofImage,
            submission.taskId?.title || "",
            submission.taskId?.description || ""
          );

          if (!ocrResult.isValid) {
            return res.status(200).json({
              status: false,
              isOcrFailed: true,
              message: `AI Image Verification Failed: ${ocrResult.reason}`,
              ocrReason: ocrResult.reason,
            });
          }
        } catch (err) {
          console.error("AI OCR verification error:", err);
        }
      }
      const rewardPoints = submission.rewardPoints || submission.taskId?.rewardPoints || 50;
      submission.status = "approved";
      submission.processedAt = new Date();

      // Find or create AdsWatchProgress for user
      const personType = submission.personType || "user";
      let progress = await AdsWatchProgress.findOne({
        userId: submission.userId,
        personType,
      });

      if (!progress) {
        progress = new AdsWatchProgress({
          userId: submission.userId,
          personType,
          pendingCoins: 0,
          totalEarned: 0,
        });
      }

      progress.pendingCoins = (progress.pendingCoins || 0) + rewardPoints;
      progress.totalEarned = (progress.totalEarned || 0) + rewardPoints;
      await progress.save();

      // Increment task completions count
      if (submission.taskId) {
        await CustomTask.findByIdAndUpdate(submission.taskId._id, { $inc: { totalCompletions: 1 } });
      }

      await submission.save();

      // Send Instant FCM Push Notification to User
      const taskTitle = submission.taskId?.title || "Custom Task";
      sendEarningNotification(
        submission.userId,
        "🎉 Task Approved!",
        `Your submission for "${taskTitle}" has been approved! +${rewardPoints} reward points added to your balance.`
      );

      return res.status(200).json({
        status: true,
        message: `Task submission approved. ${rewardPoints} points credited to user.`,
        submission,
      });
    } else {
      submission.status = "rejected";
      submission.rejectionReason = rejectionReason ? String(rejectionReason).trim() : "Proof verification failed.";
      submission.processedAt = new Date();
      await submission.save();

      // Send Rejection Notification to User
      const taskTitle = submission.taskId?.title || "Custom Task";
      sendEarningNotification(
        submission.userId,
        "❌ Task Submission Status",
        `Your submission for "${taskTitle}" was rejected. Reason: ${submission.rejectionReason}`
      );

      return res.status(200).json({
        status: true,
        message: "Task submission rejected.",
        submission,
      });
    }
  } catch (error) {
    console.error("Verify submission error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
