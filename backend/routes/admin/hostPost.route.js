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
    const isCarousel = Boolean(
      req.body.isCarousel === "true" ||
      req.body.isCarousel === true ||
      mediaUrls.length > 1 ||
      type === "carousel"
    );

    // Determine type if not explicitly set
    let mediaType = type === "carousel" ? (files[0].mimetype?.startsWith("video/") ? "video" : "photo") : type;
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

// ─── PUBLIC: Like / Unlike a post ───────────────────────────────────────────
route.post("/like", async (req, res) => {
  try {
    const { postId, userId, userName } = req.body;
    if (!postId) return res.status(400).json({ status: false, message: "postId required" });

    const post = await HostPost.findById(postId);
    if (!post) return res.status(404).json({ status: false, message: "Post not found" });

    const userIdentifier = String(userId || userName || "anonymous").trim();
    const alreadyLiked = Array.isArray(post.likedByUsers) && post.likedByUsers.includes(userIdentifier);

    let isLiked = false;
    if (alreadyLiked) {
      post.likedByUsers = post.likedByUsers.filter((u) => u !== userIdentifier);
      post.likesCount = Math.max(0, (post.likesCount || 1) - 1);
      isLiked = false;
    } else {
      if (!Array.isArray(post.likedByUsers)) post.likedByUsers = [];
      post.likedByUsers.push(userIdentifier);
      post.likesCount = (post.likesCount || 0) + 1;
      isLiked = true;
    }

    await post.save();
    return res.status(200).json({
      status: true,
      isLiked,
      likesCount: post.likesCount,
      likedByUsers: post.likedByUsers,
    });
  } catch (err) {
    console.error("hostPost like error:", err);
    return res.status(500).json({ status: false, message: err.message });
  }
});

// ─── PUBLIC: Add a comment to a post ─────────────────────────────────────────
route.post("/comment", async (req, res) => {
  try {
    const { postId, text, userName, userAvatar } = req.body;
    if (!postId || !text) return res.status(400).json({ status: false, message: "postId and text required" });

    const post = await HostPost.findById(postId);
    if (!post) return res.status(404).json({ status: false, message: "Post not found" });

    const newComment = {
      userName: (userName || "User").trim(),
      userAvatar: userAvatar || "",
      text: String(text).trim(),
      createdAt: new Date(),
    };

    if (!Array.isArray(post.comments)) post.comments = [];
    post.comments.push(newComment);
    post.commentsCount = post.comments.length;

    await post.save();
    return res.status(200).json({
      status: true,
      message: "Comment added",
      commentsCount: post.commentsCount,
      comment: newComment,
      comments: post.comments,
    });
  } catch (err) {
    console.error("hostPost comment error:", err);
    return res.status(500).json({ status: false, message: err.message });
  }
});

// ─── PUBLIC: Get comments for a post ─────────────────────────────────────────
route.get("/comments", async (req, res) => {
  try {
    const { postId } = req.query;
    if (!postId) return res.status(400).json({ status: false, message: "postId required" });

    const post = await HostPost.findById(postId).select("comments commentsCount").lean();
    if (!post) return res.status(404).json({ status: false, message: "Post not found" });

    return res.status(200).json({
      status: true,
      comments: post.comments || [],
      commentsCount: post.commentsCount || (post.comments ? post.comments.length : 0),
    });
  } catch (err) {
    console.error("hostPost get comments error:", err);
    return res.status(500).json({ status: false, message: err.message });
  }
});

// ─── ADMIN: Get all comments for an AI model / host slug ─────────────────────
route.get("/all-comments", async (req, res) => {
  try {
    const { hostSlug } = req.query;
    let filter = {};
    if (hostSlug) {
      const slugLower = String(hostSlug).toLowerCase().trim();
      const aliases = [slugLower];
      if (slugLower.includes("shanaya") || slugLower.includes("meera")) {
        aliases.push("shanaya", "shanaya-prototype", "meera-caring", "shanaya-caring");
      } else {
        aliases.push(slugLower.split("-")[0]);
      }
      filter.hostSlug = { $in: aliases };
    }

    const posts = await HostPost.find(filter)
      .select("title mediaUrl mediaUrls isCarousel type category comments commentsCount hostSlug")
      .lean();

    const allComments = [];
    posts.forEach((p) => {
      if (Array.isArray(p.comments)) {
        p.comments.forEach((c) => {
          allComments.push({
            _id: c._id,
            userName: c.userName || "User",
            userAvatar: c.userAvatar || "",
            text: c.text,
            createdAt: c.createdAt,
            reply: c.reply || null,
            postId: p._id,
            postTitle: p.title || "Untitled Post",
            postMediaUrl: p.mediaUrl,
            postCategory: p.category,
            postType: p.type,
            hostSlug: p.hostSlug,
          });
        });
      }
    });

    allComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.status(200).json({
      status: true,
      comments: allComments,
      total: allComments.length,
    });
  } catch (err) {
    console.error("hostPost get all-comments error:", err);
    return res.status(500).json({ status: false, message: err.message });
  }
});

// ─── ADMIN: Reply to a user comment ──────────────────────────────────────────
route.post("/comment/reply", async (req, res) => {
  try {
    const { postId, commentId, replyText, author } = req.body;
    if (!postId || !commentId || !replyText) {
      return res.status(400).json({ status: false, message: "postId, commentId, and replyText required" });
    }

    const post = await HostPost.findById(postId);
    if (!post) return res.status(404).json({ status: false, message: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ status: false, message: "Comment not found" });

    comment.reply = {
      text: String(replyText).trim(),
      repliedAt: new Date(),
      author: String(author || "Creator").trim(),
    };

    await post.save();

    return res.status(200).json({
      status: true,
      message: "Reply saved successfully",
      comment,
    });
  } catch (err) {
    console.error("hostPost comment reply error:", err);
    return res.status(500).json({ status: false, message: err.message });
  }
});

module.exports = route;
