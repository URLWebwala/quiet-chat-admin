const express = require("express");
const route = express.Router();
const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });
const HostPost = require("../../models/hostPost.model");

// ─── PUBLIC: Get posts for a hostSlug (called from prototype/frontend) ────────
route.get("/list", async (req, res) => {
  try {
    const { hostSlug } = req.query;
    if (!hostSlug) return res.status(200).json({ status: false, message: "hostSlug required", posts: [] });

    const posts = await HostPost.find({ hostSlug: hostSlug.toLowerCase().trim(), isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return res.status(200).json({ status: true, posts });
  } catch (err) {
    console.error("hostPost list error:", err);
    return res.status(500).json({ status: false, message: err.message, posts: [] });
  }
});

// ─── ADMIN: Create a new post with file upload ────────────────────────────────
route.post("/create", upload.single("media"), async (req, res) => {
  try {
    const { hostSlug, title, description, type, order } = req.body;
    if (!hostSlug) return res.status(400).json({ status: false, message: "hostSlug is required" });
    if (!req.file) return res.status(400).json({ status: false, message: "Media file (photo or video) is required" });

    // Determine type if not explicitly set
    let mediaType = type;
    if (!mediaType) {
      const mime = req.file.mimetype || "";
      mediaType = mime.startsWith("video/") ? "video" : "photo";
    }

    const post = new HostPost({
      hostSlug: hostSlug.toLowerCase().trim(),
      title: (title || "").trim(),
      description: (description || "").trim(),
      mediaUrl: req.file.path,
      type: mediaType === "video" ? "video" : "photo",
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

// ─── ADMIN: Update a post (title, description, order, isActive) ───────────────
route.patch("/update", async (req, res) => {
  try {
    const postId = req.body.postId || req.body._id;
    const { title, description, order, isActive } = req.body;
    if (!postId) return res.status(400).json({ status: false, message: "postId required" });

    const update = {};
    if (title !== undefined) update.title = String(title).trim();
    if (description !== undefined) update.description = String(description).trim();
    if (order !== undefined) update.order = Number(order);
    if (isActive !== undefined) update.isActive = Boolean(isActive);

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
