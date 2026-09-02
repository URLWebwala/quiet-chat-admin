const OfferWall = require("../../models/offerWall.model");

// Fetch a Random Active Offer Banner for Popup Modal
exports.getRandomOffer = async (req, res) => {
  try {
    const now = new Date();

    const activeOffers = await OfferWall.find({
      isActive: true,
      isDelete: false,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).lean();

    if (!activeOffers || activeOffers.length === 0) {
      return res.status(200).json({
        status: false,
        message: "No active offers available at this moment.",
        data: null,
      });
    }

    // Pick a random offer from valid active offers
    const randomIndex = Math.floor(Math.random() * activeOffers.length);
    const selectedOffer = activeOffers[randomIndex];

    // Automatically bump impression count
    OfferWall.findByIdAndUpdate(selectedOffer._id, { $inc: { impressionCount: 1 } }).exec();

    return res.status(200).json({
      status: true,
      message: "Offer banner retrieved successfully.",
      data: selectedOffer,
    });
  } catch (error) {
    console.error("Error in getRandomOffer:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Fetch all Active and Unexpired Offer Banners
exports.getActiveOffers = async (req, res) => {
  try {
    const now = new Date();

    const offers = await OfferWall.find({
      isActive: true,
      isDelete: false,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      status: true,
      message: "Active offers retrieved successfully.",
      data: offers,
    });
  } catch (error) {
    console.error("Error in getActiveOffers:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Track Impression / View Count
exports.trackImpression = async (req, res) => {
  try {
    const offerId = req.query.offerId || req.body.offerId;
    if (!offerId) {
      return res.status(200).json({ status: false, message: "offerId is required." });
    }

    await OfferWall.findByIdAndUpdate(offerId, { $inc: { impressionCount: 1 } });

    return res.status(200).json({ status: true, message: "Impression tracked." });
  } catch (error) {
    console.error("Error in trackImpression:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Track Click Count
exports.trackClick = async (req, res) => {
  try {
    const offerId = req.query.offerId || req.body.offerId;
    if (!offerId) {
      return res.status(200).json({ status: false, message: "offerId is required." });
    }

    await OfferWall.findByIdAndUpdate(offerId, { $inc: { clickCount: 1 } });

    return res.status(200).json({ status: true, message: "Click tracked." });
  } catch (error) {
    console.error("Error in trackClick:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
