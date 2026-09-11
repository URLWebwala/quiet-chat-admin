const Coupon = require("../../models/coupon.model");
const mongoose = require("mongoose");

// Create a new coupon
exports.createCoupon = async (req, res) => {
  try {
    const {
      code,
      title,
      coin,
      expiryDate,
      isPerUserLimit = true,
      perUserLimitCount = 1,
      maxUsers = 0,
      isActive = true,
    } = req.body;

    if (!code || !coin) {
      return res.status(200).json({ status: false, message: "Coupon code and coin amount are required." });
    }

    const normalizedCode = String(code).trim().toUpperCase();
    if (!normalizedCode) {
      return res.status(200).json({ status: false, message: "Valid coupon code is required." });
    }

    const numericCoin = Number(coin);
    if (isNaN(numericCoin) || numericCoin <= 0) {
      return res.status(200).json({ status: false, message: "Coin amount must be greater than 0." });
    }

    // Check duplicate
    const existing = await Coupon.findOne({ code: normalizedCode });
    if (existing) {
      return res.status(200).json({ status: false, message: "A coupon with this code already exists." });
    }

    const coupon = new Coupon({
      code: normalizedCode,
      title: title ? String(title).trim() : "",
      coin: numericCoin,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      isPerUserLimit: Boolean(isPerUserLimit),
      perUserLimitCount: Math.max(1, Number(perUserLimitCount) || 1),
      maxUsers: Math.max(0, Number(maxUsers) || 0),
      isActive: Boolean(isActive),
    });

    await coupon.save();

    return res.status(200).json({
      status: true,
      message: "Coupon created successfully.",
      data: coupon,
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Fetch coupons with pagination and search
exports.fetchCoupons = async (req, res) => {
  try {
    const start = Math.max(1, parseInt(req.query.start) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const search = req.query.search ? String(req.query.search).trim() : "";

    const query = {};
    if (search && search !== "ALL") {
      query.$or = [
        { code: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
      ];
    }

    const [total, coupons] = await Promise.all([
      Coupon.countDocuments(query),
      Coupon.find(query)
        .sort({ createdAt: -1 })
        .skip((start - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      status: true,
      message: "Coupons retrieved successfully.",
      total,
      data: coupons,
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Modify an existing coupon
exports.modifyCoupon = async (req, res) => {
  try {
    const {
      couponId,
      code,
      title,
      coin,
      expiryDate,
      isPerUserLimit,
      perUserLimitCount,
      maxUsers,
      isActive,
    } = req.body;

    if (!couponId) {
      return res.status(200).json({ status: false, message: "couponId is required." });
    }

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(200).json({ status: false, message: "Coupon not found." });
    }

    if (code) {
      const normalizedCode = String(code).trim().toUpperCase();
      const existing = await Coupon.findOne({ code: normalizedCode, _id: { $ne: couponId } });
      if (existing) {
        return res.status(200).json({ status: false, message: "Another coupon with this code already exists." });
      }
      coupon.code = normalizedCode;
    }

    if (title !== undefined) coupon.title = String(title).trim();
    if (coin !== undefined && Number(coin) > 0) coupon.coin = Number(coin);
    if (expiryDate !== undefined) coupon.expiryDate = expiryDate ? new Date(expiryDate) : null;
    if (isPerUserLimit !== undefined) coupon.isPerUserLimit = Boolean(isPerUserLimit);
    if (perUserLimitCount !== undefined) coupon.perUserLimitCount = Math.max(1, Number(perUserLimitCount) || 1);
    if (maxUsers !== undefined) coupon.maxUsers = Math.max(0, Number(maxUsers) || 0);
    if (isActive !== undefined) coupon.isActive = Boolean(isActive);

    await coupon.save();

    return res.status(200).json({
      status: true,
      message: "Coupon updated successfully.",
      data: coupon,
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Toggle status (Active / Inactive)
exports.toggleCouponStatus = async (req, res) => {
  try {
    const couponId = req.query.couponId || req.body.couponId;
    if (!couponId) {
      return res.status(200).json({ status: false, message: "couponId is required." });
    }

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(200).json({ status: false, message: "Coupon not found." });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    return res.status(200).json({
      status: true,
      message: `Coupon is now ${coupon.isActive ? "Active" : "Inactive"}.`,
      data: coupon,
    });
  } catch (error) {
    console.error("Error toggling coupon status:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Remove a coupon
exports.removeCoupon = async (req, res) => {
  try {
    const couponId = req.query.couponId || req.body.couponId;
    if (!couponId) {
      return res.status(200).json({ status: false, message: "couponId is required." });
    }

    const coupon = await Coupon.findByIdAndDelete(couponId);
    if (!coupon) {
      return res.status(200).json({ status: false, message: "Coupon not found." });
    }

    return res.status(200).json({
      status: true,
      message: "Coupon deleted successfully.",
    });
  } catch (error) {
    console.error("Error removing coupon:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Retrieve redemptions of a specific coupon
exports.retrieveCouponRedemptions = async (req, res) => {
  try {
    const couponId = req.query.couponId;
    const start = Math.max(1, parseInt(req.query.start) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);

    if (!couponId) {
      return res.status(200).json({ status: false, message: "couponId is required." });
    }

    const coupon = await Coupon.findById(couponId)
      .populate({
        path: "redeemedUsers.userId",
        select: "name uniqueId email image coin mobileNumber",
      })
      .lean();

    if (!coupon) {
      return res.status(200).json({ status: false, message: "Coupon not found." });
    }

    const allRedemptions = (coupon.redeemedUsers || []).reverse();
    const total = allRedemptions.length;
    const paginated = allRedemptions.slice((start - 1) * limit, start * limit);

    return res.status(200).json({
      status: true,
      message: "Redemption history fetched.",
      total,
      data: paginated,
    });
  } catch (error) {
    console.error("Error retrieving coupon redemptions:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Retrieve all user claim histories across all coupons
exports.fetchAllCouponClaims = async (req, res) => {
  try {
    const start = Math.max(1, parseInt(req.query.start) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const search = req.query.search ? String(req.query.search).trim() : "";

    const pipeline = [
      { $unwind: "$redeemedUsers" },
      {
        $lookup: {
          from: "users",
          localField: "redeemedUsers.userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: "$redeemedUsers._id",
          couponId: "$_id",
          couponCode: "$code",
          couponTitle: "$title",
          coin: "$redeemedUsers.coin",
          redeemedAt: "$redeemedUsers.redeemedAt",
          user: {
            _id: "$user._id",
            name: "$user.name",
            uniqueId: "$user.uniqueId",
            image: "$user.image",
            mobileNumber: "$user.mobileNumber",
          },
        },
      },
      { $sort: { redeemedAt: -1 } },
    ];

    if (search && search !== "ALL") {
      pipeline.push({
        $match: {
          $or: [
            { couponCode: { $regex: search, $options: "i" } },
            { "user.name": { $regex: search, $options: "i" } },
            { "user.uniqueId": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    const countPipeline = [...pipeline, { $count: "total" }];
    const [countResult, data] = await Promise.all([
      Coupon.aggregate(countPipeline),
      Coupon.aggregate([...pipeline, { $skip: (start - 1) * limit }, { $limit: limit }]),
    ]);

    const total = countResult[0]?.total || 0;

    return res.status(200).json({
      status: true,
      message: "All coupon claims retrieved successfully.",
      total,
      data,
    });
  } catch (error) {
    console.error("Error fetching all coupon claims:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
