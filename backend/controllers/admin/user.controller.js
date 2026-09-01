const mongoose = require("mongoose");
const User = require("../../models/user.model");
const History = require("../../models/history.model");

const generateHistoryUniqueId = require("../../util/generateHistoryUniqueId");
const { evaluateProfile } = require("../../util/profileCompleteness");

//get users
exports.retrieveUserList = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const searchString = req.query.search || "";
    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";

    let dateFilterQuery = {};
    if (startDate !== "All" && endDate !== "All") {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);

      dateFilterQuery = {
        createdAt: {
          $gte: startDateObj,
          $lte: endDateObj,
        },
      };
    }

    let searchQuery = {};
    if (searchString !== "All" && searchString !== "") {
      const trimmedSearch = searchString.trim();
      const escapedSearch = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const digitsOnly = trimmedSearch.replace(/\D/g, "");

      const orConditions = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { email: { $regex: escapedSearch, $options: "i" } },
        { uniqueId: { $regex: escapedSearch, $options: "i" } },
        { phone: { $regex: escapedSearch, $options: "i" } },
        { mobile: { $regex: escapedSearch, $options: "i" } },
      ];

      if (digitsOnly.length >= 3) {
        orConditions.push({ phone: { $regex: digitsOnly, $options: "i" } });
        orConditions.push({ mobile: { $regex: digitsOnly, $options: "i" } });
      }

      searchQuery = {
        $or: orConditions,
      };
    }

    let filter = {
      ...dateFilterQuery,
      ...searchQuery,
    };

    // By default, do not show approved hosts in the "Users" list.
    // A host is still a user account in DB, but the admin UI expects separation.
    // Pass excludeHosts=false to include hosts in this list.
    const excludeHostsParam = (req.query.excludeHosts ?? "true").toString().toLowerCase();
    const excludeHosts = excludeHostsParam !== "false";
    if (excludeHosts) {
      filter.isHost = { $ne: true };
    }

    const statusFilter = (req.query.status || "all").toString().toLowerCase();
    if (statusFilter === "online") {
      filter.isOnline = true;
      filter.isBlock = false;
    } else if (statusFilter === "blocked") {
      filter.isBlock = true;
    } else if (statusFilter === "vip") {
      filter.isVip = true;
    }

    const coinRange = (req.query.coinRange || "all").toString().toLowerCase();
    if (coinRange === "0") {
      filter.coin = { $gte: 0, $lte: 0 };
    } else if (coinRange === "1-100") {
      filter.coin = { $gte: 1, $lte: 100 };
    } else if (coinRange === "101-500") {
      filter.coin = { $gte: 101, $lte: 500 };
    } else if (coinRange === "501-1000") {
      filter.coin = { $gte: 501, $lte: 1000 };
    } else if (coinRange === "1000plus" || coinRange === "1000+") {
      filter.coin = { $gte: 1000 };
    }

    const rechargeFilter = (req.query.rechargeFilter || "all").toString().toLowerCase();
    if (rechargeFilter === "recharged") {
      filter.rechargedCoins = { $gt: 0 };
    }

    const genderFilter = (req.query.gender || "all").toString().toLowerCase().trim();
    if (genderFilter === "male" || genderFilter === "female") {
      filter.gender = { $regex: new RegExp(`^${genderFilter}$`, "i") };
    }

    const [totalActiveUsers, totalVIPUsers, totalMaleUsers, totalFemaleUsers, totalUsers, users] = await Promise.all([
      User.countDocuments({ isBlock: false, ...dateFilterQuery }),
      User.countDocuments({ isVip: true, ...dateFilterQuery }),
      User.countDocuments({ gender: "male", ...dateFilterQuery }),
      User.countDocuments({ gender: "female", ...dateFilterQuery }),
      User.countDocuments(filter),
      User.aggregate([
        { $match: filter },
        { $sort: { createdAt: -1 } },
        { $skip: (start - 1) * limit },
        { $limit: limit },
        {
          $lookup: {
            from: "followerfollowings",
            localField: "_id",
            foreignField: "followerId", // user follows these hosts
            as: "followings",
          },
        },
        {
          $project: {
            _id: 1,
            uniqueId: 1,
            name: 1,
            email: 1,
            phone: 1,
            image: 1,
            countryFlagImage: 1,
            country: 1,
            gender: 1,
            coin: 1,
            rechargedCoins: 1,
            isHost: 1,
            isVip: 1,
            isBlock: 1,
            isOnline: 1,
            loginType: 1,
            createdAt: 1,
            totalFollowings: { $size: "$followings" },
          },
        },
      ]),
    ]);

    return res.status(200).json({
      status: true,
      message: "Retrieved real users!",
      totalActiveUsers,
      totalVIPUsers,
      totalMaleUsers,
      totalFemaleUsers,
      total: totalUsers,
      data: users,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

const Host = require("../../models/host.model");

//toggle user's block status
exports.modifyUserBlockStatus = async (req, res, next) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(200).json({ status: false, message: "User ID is required." });
    }

    const user = await User.findById(userId).select("uniqueId name image countryFlagImage country gender coin rechargedCoins isHost isVip isBlock isFake loginType createdAt");
    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    user.isBlock = !user.isBlock;
    await user.save();

    if (user.isBlock) {
      const socketTarget = userId.toString();
      if (global.io) {
        global.io.in(`globalRoom:${socketTarget}`).emit("userBlocked", {
          status: false,
          userId: socketTarget,
          message: "Your account has been blocked by administrator.",
        });
        global.io.in(`globalRoom:${socketTarget}`).emit("forceLogout", {
          status: false,
          userId: socketTarget,
          message: "Your account has been blocked by administrator.",
        });
      }
    }

    return res.status(200).json({
      status: true,
      message: `User has been ${user.isBlock ? "blocked" : "unblocked"} successfully.`,
      data: user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "An error occurred while updating user block status." });
  }
};

//delete user by admin
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(200).json({ status: false, message: "User ID is required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    const socketTarget = userId.toString();
    if (global.io) {
      global.io.in(`globalRoom:${socketTarget}`).emit("userDeleted", {
        status: false,
        userId: socketTarget,
        message: "Your account has been deleted by administrator.",
      });
      global.io.in(`globalRoom:${socketTarget}`).emit("forceLogout", {
        status: false,
        userId: socketTarget,
        message: "Your account has been deleted by administrator.",
      });
    }

    await Host.deleteMany({ userId: user._id });
    await User.deleteOne({ _id: user._id });

    return res.status(200).json({
      status: true,
      message: "User has been deleted successfully.",
    });
  } catch (error) {
    console.error("Admin Delete User Error:", error);
    return res.status(500).json({ status: false, message: "An error occurred while deleting user." });
  }
};

//get user's profile
exports.fetchUserProfile = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(200).json({ status: false, message: "User ID is required." });
    }

    const [user] = await Promise.all([
      User.findOne({ _id: userId })
        .select(
          "name selfIntro gender bio age dob image email phone countryFlagImage country loginType uniqueId coin spentCoins rechargedCoins isOnline isHost hostId firebaseUid provider"
        )
        .lean(),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    const profileCheck = evaluateProfile({
      name: user.name,
      gender: user.gender,
      dob: user.dob,
      image: user.image,
    });

    return res.status(200).json({
      status: true,
      message: "The user has retrieved their profile.",
      user,
      profileComplete: profileCheck.complete,
      missingProfileFields: profileCheck.missingFields,
      profileErrors: profileCheck.errors,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//admin can add or deduct coins from a user's wallet
exports.updateUserCoin = async (req, res, next) => {
  try {
    const { userId, coin, action } = req.body;

    if (!userId || !coin || !action) {
      return res.status(400).json({
        status: false,
        message: "userId, coin, and action are required fields.",
      });
    }

    if (!["add", "deduct"].includes(action)) {
      return res.status(400).json({
        status: false,
        message: "Invalid action. Must be 'add' or 'deduct'.",
      });
    }

    if (isNaN(coin) || coin <= 0) {
      return res.status(400).json({
        status: false,
        message: "Coin must be a positive number.",
      });
    }

    const [uniqueId, user] = await Promise.all([generateHistoryUniqueId(), User.findById(userId).lean()]);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found.",
      });
    }

    if (action === "add") {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { coin: coin, rechargedCoins: coin } },
        { new: true }
      ).lean();

      await History.create({
        uniqueId: uniqueId,
        type: 14,
        userId,
        userCoin: coin,
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      });

      return res.status(200).json({
        status: true,
        message: `Successfully added ${coin} coins.`,
        data: updatedUser,
      });
    } else {
      const updatedUser = await User.findOneAndUpdate(
        { _id: userId, coin: { $gte: coin } },
        { $inc: { coin: -coin } },
        { new: true }
      ).lean();

      if (!updatedUser) {
        return res.status(400).json({
          status: false,
          message: "Insufficient balance to deduct coins.",
        });
      }

      await History.create({
        uniqueId: uniqueId,
        type: 15,
        userId,
        userCoin: coin,
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      });

      return res.status(200).json({
        status: true,
        message: `Successfully deducted ${coin} coins.`,
        data: updatedUser,
      });
    }
  } catch (error) {
    console.error("Admin Coin Update Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

// Batch lookup users by list of user IDs or uniqueIds
exports.lookupUsers = async (req, res) => {
  try {
    const userIdsParam = req.query.userIds || req.body?.userIds || "";
    let ids = [];
    if (Array.isArray(userIdsParam)) {
      ids = userIdsParam;
    } else if (typeof userIdsParam === "string" && userIdsParam.trim()) {
      ids = userIdsParam.split(",").map((id) => id.trim()).filter(Boolean);
    }

    if (!ids.length) {
      return res.status(200).json({ status: true, users: {}, data: [] });
    }

    const objectIds = [];
    const uniqueIds = [];
    for (const id of ids) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        objectIds.push(new mongoose.Types.ObjectId(id));
      } else {
        uniqueIds.push(id);
      }
    }

    const query = {
      $or: [
        ...(objectIds.length ? [{ _id: { $in: objectIds } }] : []),
        ...(uniqueIds.length ? [{ uniqueId: { $in: uniqueIds } }] : []),
      ],
    };

    const users = await User.find(query)
      .select("_id uniqueId name image gender isVip email phone")
      .lean();

    const usersMap = {};
    for (const u of users) {
      usersMap[u._id.toString()] = u;
      if (u.uniqueId) {
        usersMap[u.uniqueId.toString()] = u;
      }
    }

    return res.status(200).json({
      status: true,
      users: usersMap,
      data: users,
    });
  } catch (error) {
    console.error("Admin Lookup Users Error:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};
