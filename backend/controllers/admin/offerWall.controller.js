const OfferWall = require("../../models/offerWall.model");
const fs = require("fs");
const { deleteFiles, deleteFile } = require("../../util/deletefile");

// Create Offer Wall Banner
exports.addOfferWall = async (req, res) => {
  try {
    const {
      title,
      description,
      buttonText,
      actionUrl,
      actionType,
      durationDays,
      startDate,
      endDate,
      isActive,
      priority,
    } = req.body;

    if (!title) {
      if (req.files) deleteFiles(req.files);
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Title is required." });
    }

    let imagePath = "";
    if (req.files?.image && req.files.image[0]) {
      imagePath = req.files.image[0].path;
    } else if (req.file) {
      imagePath = req.file.path;
    }

    if (!imagePath) {
      return res.status(200).json({ status: false, message: "Banner image is required." });
    }

    const start = startDate ? new Date(startDate) : new Date();
    let end = endDate ? new Date(endDate) : null;
    const days = Number(durationDays) || 7;

    if (!end || isNaN(end.getTime())) {
      end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    }

    const offer = new OfferWall({
      title: title.trim(),
      description: description ? description.trim() : "",
      image: imagePath,
      buttonText: buttonText ? buttonText.trim() : "START EARNING TODAY!",
      actionUrl: actionUrl ? actionUrl.trim() : "",
      actionType: actionType || "link",
      durationDays: days,
      startDate: start,
      endDate: end,
      isActive: isActive === "false" || isActive === false ? false : true,
      priority: Number(priority) || 1,
    });

    await offer.save();

    return res.status(200).json({
      status: true,
      message: "Offer Wall banner created successfully.",
      data: offer,
    });
  } catch (error) {
    if (req.files) deleteFiles(req.files);
    if (req.file) deleteFile(req.file);
    console.error("Error in addOfferWall:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Modify Offer Wall Banner
exports.modifyOfferWall = async (req, res) => {
  try {
    const offerWallId = req.query.offerWallId || req.body.offerWallId;

    if (!offerWallId) {
      if (req.files) deleteFiles(req.files);
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "offerWallId is required." });
    }

    const offer = await OfferWall.findById(offerWallId);
    if (!offer || offer.isDelete) {
      if (req.files) deleteFiles(req.files);
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Offer not found." });
    }

    const {
      title,
      description,
      buttonText,
      actionUrl,
      actionType,
      durationDays,
      startDate,
      endDate,
      isActive,
      priority,
    } = req.body;

    if (title !== undefined) offer.title = title.trim();
    if (description !== undefined) offer.description = description ? description.trim() : "";
    if (buttonText !== undefined) offer.buttonText = buttonText ? buttonText.trim() : "START EARNING TODAY!";
    if (actionUrl !== undefined) offer.actionUrl = actionUrl ? actionUrl.trim() : "";
    if (actionType !== undefined) offer.actionType = actionType;
    if (priority !== undefined) offer.priority = Number(priority) || 1;
    if (isActive !== undefined) {
      offer.isActive = isActive === "true" || isActive === true;
    }

    if (startDate) {
      offer.startDate = new Date(startDate);
    }

    if (durationDays !== undefined && !endDate) {
      const days = Number(durationDays) || 7;
      offer.durationDays = days;
      const baseStart = offer.startDate || new Date();
      offer.endDate = new Date(baseStart.getTime() + days * 24 * 60 * 60 * 1000);
    } else if (endDate) {
      offer.endDate = new Date(endDate);
      const baseStart = offer.startDate || new Date();
      offer.durationDays = Math.max(1, Math.ceil((offer.endDate - baseStart) / (1000 * 60 * 60 * 24)));
    }

    // New image uploaded
    let newImagePath = "";
    if (req.files?.image && req.files.image[0]) {
      newImagePath = req.files.image[0].path;
    } else if (req.file) {
      newImagePath = req.file.path;
    }

    if (newImagePath) {
      if (offer.image && fs.existsSync(offer.image)) {
        try {
          fs.unlinkSync(offer.image);
        } catch (e) {
          console.error("Failed to delete old image:", e);
        }
      }
      offer.image = newImagePath;
    }

    await offer.save();

    return res.status(200).json({
      status: true,
      message: "Offer Wall updated successfully.",
      data: offer,
    });
  } catch (error) {
    if (req.files) deleteFiles(req.files);
    if (req.file) deleteFile(req.file);
    console.error("Error in modifyOfferWall:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Toggle Active / Inactive Status
exports.toggleStatus = async (req, res) => {
  try {
    const offerWallId = req.query.offerWallId || req.body.offerWallId;

    if (!offerWallId) {
      return res.status(200).json({ status: false, message: "offerWallId is required." });
    }

    const offer = await OfferWall.findById(offerWallId);
    if (!offer || offer.isDelete) {
      return res.status(200).json({ status: false, message: "Offer not found." });
    }

    offer.isActive = !offer.isActive;
    await offer.save();

    return res.status(200).json({
      status: true,
      message: `Offer is now ${offer.isActive ? "Active" : "Closed / Inactive"}.`,
      data: offer,
    });
  } catch (error) {
    console.error("Error in toggleStatus:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Retrieve Offer Wall List for Admin
exports.retrieveOfferWallList = async (req, res) => {
  try {
    const offers = await OfferWall.find({ isDelete: false }).sort({ createdAt: -1 }).lean();

    const now = new Date();
    const enrichedOffers = offers.map((item) => {
      const isExpired = item.endDate ? now > new Date(item.endDate) : false;
      const daysLeft = item.endDate ? Math.ceil((new Date(item.endDate) - now) / (1000 * 60 * 60 * 24)) : 0;
      
      let computedStatus = "active";
      if (!item.isActive) {
        computedStatus = "closed";
      } else if (isExpired) {
        computedStatus = "expired";
      }

      return {
        ...item,
        isExpired,
        daysLeft: daysLeft > 0 ? daysLeft : 0,
        computedStatus,
      };
    });

    const totalCount = enrichedOffers.length;
    const activeCount = enrichedOffers.filter((o) => o.computedStatus === "active").length;
    const totalImpressions = enrichedOffers.reduce((acc, curr) => acc + (curr.impressionCount || 0), 0);
    const totalClicks = enrichedOffers.reduce((acc, curr) => acc + (curr.clickCount || 0), 0);

    return res.status(200).json({
      status: true,
      message: "Offer wall list retrieved successfully.",
      data: enrichedOffers,
      metrics: {
        totalOffers: totalCount,
        activeOffers: activeCount,
        totalImpressions,
        totalClicks,
      },
    });
  } catch (error) {
    console.error("Error in retrieveOfferWallList:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Delete Offer Wall Banner
exports.discardOfferWall = async (req, res) => {
  try {
    const offerWallId = req.query.offerWallId || req.body.offerWallId;

    if (!offerWallId) {
      return res.status(200).json({ status: false, message: "offerWallId is required." });
    }

    const offer = await OfferWall.findById(offerWallId);
    if (!offer) {
      return res.status(200).json({ status: false, message: "Offer not found." });
    }

    if (offer.image && fs.existsSync(offer.image)) {
      try {
        fs.unlinkSync(offer.image);
      } catch (e) {
        console.error("Failed to delete image file:", e);
      }
    }

    await OfferWall.findByIdAndDelete(offerWallId);

    return res.status(200).json({
      status: true,
      message: "Offer Wall banner deleted successfully.",
    });
  } catch (error) {
    console.error("Error in discardOfferWall:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
