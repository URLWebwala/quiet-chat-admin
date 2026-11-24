const express = require("express");
const route = express.Router();
const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });
const HostPost = require("../../models/hostPost.model");

// ─── PUBLIC: Get posts for a hostSlug (called from prototype/frontend) ────────
route.get("/list", async (req, res) => {
  try {
    const { hostSlug, category } = req.query;
    if (!hostSlug) return res.status(200).json({ status: false, message: "hostSlug required", posts: [] });

    const query = { hostSlug: hostSlug.toLowerCase().trim(), isActive: true };
    if (category) {
      const cat = category.toLowerCase().trim();
      if (cat === "exclusive") {
        query.category = "exclusive";
      } else if (cat === "discover") {
        query.category = { $ne: "exclusive" };
      } else {
        query.category = cat;
      }
    }

    const posts = await HostPost.find(query)
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return res.status(200).json({ status: true, posts });
  } catch (err) {
    console.error("hostPost list error:", err);
    return res.status(500).json({ status: false, message: err.message, posts: [] });
  }
});

// ─── ADMIN: Create a new post with file upload (Supports single or multi-media carousel) ───
route.post("/create", upload.any(), async (req, res) => {
  try {
    const { hostSlug, title, description, type, order, category, creditCost } = req.body;
    if (!hostSlug) return res.status(400).json({ status: false, message: "hostSlug is required" });

    const files = req.files && req.files.length > 0 ? req.files : (req.file ? [req.file] : []);
    if (files.length === 0) return res.status(400).json({ status: false, message: "Media file (photo or video) is required" });

    const mediaUrls = files.map((f) => f.path);
    const primaryMediaUrl = mediaUrls[0];
    const isCarousel = mediaUrls.length > 1;

    // Determine type if not explicitly set
    let mediaType = type;
    if (!mediaType) {
      const mime = files[0].mimetype || "";
      mediaType = mime.startsWith("video/") ? "video" : "photo";
    }

    const postCategory = category === "exclusive" ? "exclusive" : "discover";
    const postCost = postCategory === "exclusive" ? Math.max(0, parseInt(creditCost, 10) || 0) : 0;

    const post = new HostPost({
      hostSlug: hostSlug.toLowerCase().trim(),
      title: (title || "").trim(),
      description: (description || "").trim(),
      mediaUrl: primaryMediaUrl,
      mediaUrls: mediaUrls,
      isCarousel: isCarousel,
      type: mediaType === "video" ? "video" : "photo",
      category: postCategory,
      creditCost: postCost,
      order: order ? Number(order) : 0,
      isActive: true,
    });
    await post.save();

    return res.status(200).json({ status: true, message: "Post published successfully", post });
  } catch (err) {
    console.error("hostPost create error:", err);
    return res.status(500).json({ status: false, message: err.message || "Failed to create post" });
  }
});

// ─── ADMIN: Update a post (title, description, order, isActive, category, creditCost) ───
route.patch("/update", async (req, res) => {
  try {
    const postId = req.body.postId || req.body._id;
    const { title, description, order, isActive, category, creditCost } = req.body;
    if (!postId) return res.status(400).json({ status: false, message: "postId required" });

    const update = {};
    if (title !== undefined) update.title = String(title).trim();
    if (description !== undefined) update.description = String(description).trim();
    if (order !== undefined) update.order = Number(order);
    if (isActive !== undefined) update.isActive = Boolean(isActive);
    if (category !== undefined) update.category = category === "exclusive" ? "exclusive" : "discover";
    if (creditCost !== undefined) update.creditCost = Math.max(0, parseInt(creditCost, 10) || 0);

    const post = await HostPost.findByIdAndUpdate(postId, update, { new: true });
    return res.status(200).json({ status: true, message: "Post updated", post });
  } catch (err) {
    console.error("hostPost update error:", err);
    return res.status(500).json({ status: false, message: err.message });
  }
});

// ─── ADMIN: Delete a post ────────────────────────────────────────────────────
route.delete("/delete", async (req, res) => {
  try {
    const postId = req.query.postId || req.body?.postId || req.query.id;
    if (!postId) return res.status(400).json({ status: false, message: "postId required" });

    await HostPost.findByIdAndDelete(postId);
    return res.status(200).json({ status: true, message: "Post deleted successfully" });
  } catch (err) {
    console.error("hostPost delete error:", err);
    return res.status(500).json({ status: false, message: err.message });
  }
});

module.exports = route;
