const jwt = require("jsonwebtoken");
const HostUser = require("../models/hostUser.model");
const HostUserChat = require("../models/hostUserChat.model");
const { hashPassword, verifyPassword } = require("../util/passwordHelper");
const { validateHostUserToken, JWT_SECRET } = require("../middleware/validateHostUserToken.middleware");
const { DATING_AI_BASE_URL, createAIHeaders } = require("../util/aiConfig");

/**
 * 1. Register a new user for a specific Host persona
 * POST /api/host-user/register
 * Body: { hostSlug, email, password, name, gender, hostName }
 */
exports.register = async (req, res) => {
  try {
    const { hostSlug, email, password, name, gender, hostName } = req.body || {};

    if (!hostSlug || !hostSlug.trim()) {
      return res.status(400).json({ status: false, message: "hostSlug is required" });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ status: false, message: "Email is required" });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ status: false, message: "Password is required" });
    }

    const cleanSlug = hostSlug.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists for this specific host
    const existing = await HostUser.findOne({ hostSlug: cleanSlug, email: cleanEmail }).lean();
    if (existing) {
      return res.status(409).json({
        status: false,
        message: `An account with email ${cleanEmail} already exists for this host profile. Please login instead.`,
      });
    }

    const hashedPassword = hashPassword(password);

    const newUser = await HostUser.create({
      hostSlug: cleanSlug,
      hostName: hostName || cleanSlug,
      name: (name && name.trim()) || "User",
      email: cleanEmail,
      password: hashedPassword,
      gender: gender === "female" ? "female" : "male",
      lastLogin: new Date(),
    });

    // Generate JWT token valid for 30 days
    const token = jwt.sign(
      {
        userId: newUser._id.toString(),
        hostSlug: cleanSlug,
        email: cleanEmail,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    const safeUser = newUser.toObject();
    delete safeUser.password;

    return res.status(201).json({
      status: true,
      message: "Registration successful!",
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error("HostUser Register Error:", error);
    return res.status(500).json({ status: false, message: error.message || "Registration failed" });
  }
};

/**
 * 2. Login user for a specific Host persona
 * POST /api/host-user/login
 * Body: { hostSlug, email, password }
 */
exports.login = async (req, res) => {
  try {
    const { hostSlug, email, password } = req.body || {};

    if (!hostSlug || !hostSlug.trim()) {
      return res.status(400).json({ status: false, message: "hostSlug is required" });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ status: false, message: "Email is required" });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ status: false, message: "Password is required" });
    }

    const cleanSlug = hostSlug.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    const user = await HostUser.findOne({ hostSlug: cleanSlug, email: cleanEmail });
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "No account found with this email for this host profile.",
      });
    }

    if (user.isBlock) {
      return res.status(403).json({
        status: false,
        message: "Your account has been suspended by the administrator.",
      });
    }

    const isValid = verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ status: false, message: "Invalid password. Please check and try again." });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        hostSlug: cleanSlug,
        email: cleanEmail,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    const safeUser = user.toObject();
    delete safeUser.password;

    return res.status(200).json({
      status: true,
      message: "Login successful!",
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error("HostUser Login Error:", error);
    return res.status(500).json({ status: false, message: error.message || "Login failed" });
  }
};

/**
 * 3. Get currently logged-in user profile
 * GET /api/host-user/profile
 */
exports.getProfile = async (req, res) => {
  try {
    return res.status(200).json({
      status: true,
      user: req.hostUser,
    });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

/**
 * 4. Update user profile
 * PATCH /api/host-user/profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, gender, bio, avatar } = req.body || {};
    const updates = {};
    if (name) updates.name = name.trim();
    if (gender) updates.gender = gender;
    if (bio !== undefined) updates.bio = bio;
    if (avatar) updates.avatar = avatar;

    const updated = await HostUser.findByIdAndUpdate(req.hostUser._id, updates, { new: true })
      .select("-password")
      .lean();

    return res.status(200).json({
      status: true,
      message: "Profile updated successfully",
      user: updated,
    });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

/**
 * 5. Send chat message to host & receive live persona response
 * POST /api/host-user/chat
 * Body: { message }
 */
exports.chat = async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message || !message.trim()) {
      return res.status(400).json({ status: false, message: "Message text is required" });
    }

    const hostUser = req.hostUser;
    const cleanMsg = message.trim();
    const hostSlug = hostUser.hostSlug;

    // 1. Save user's message to MongoDB
    const userChat = await HostUserChat.create({
      hostUserId: hostUser._id,
      hostSlug: hostSlug,
      sender: "user",
      message: cleanMsg,
    });

    // 2. Call AI persona engine (adminai server)
    const targetBase = (DATING_AI_BASE_URL || "https://adminai.quietchat.in").replace(/\/api\/?$/, "");
    const aiPath = `/api/hosts/${hostSlug}/chat`;
    const aiPayload = {
      message: cleanMsg,
      external_user_id: hostUser._id.toString(),
      user_name: hostUser.name || "User",
      user_gender: hostUser.gender || "male",
    };

    let hostReply = "Hmm, mujhe sunke acha laga. Aur batao?";
    let delayMs = 1200;

    try {
      const headers = createAIHeaders("POST", aiPath, aiPayload);
      const aiResponse = await fetch(`${targetBase}${aiPath}`, {
        method: "POST",
        headers,
        body: JSON.stringify(aiPayload),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        if (aiData.reply) hostReply = aiData.reply;
        if (aiData.messages && aiData.messages[0]?.delay_ms) {
          delayMs = aiData.messages[0].delay_ms;
        }
      } else {
        console.warn(`AI persona server status: ${aiResponse.status}`);
      }
    } catch (aiErr) {
      console.warn("AI engine call fallback:", aiErr.message);
    }

    // 3. Save AI reply to MongoDB
    const hostChat = await HostUserChat.create({
      hostUserId: hostUser._id,
      hostSlug: hostSlug,
      sender: "host",
      message: hostReply,
      delayMs,
    });

    return res.status(200).json({
      status: true,
      reply: hostReply,
      userMessage: userChat,
      hostMessage: hostChat,
    });
  } catch (error) {
    console.error("HostUser Chat Error:", error);
    return res.status(500).json({ status: false, message: error.message || "Failed to process message" });
  }
};

/**
 * 6. Get chat history between this user and this host
 * GET /api/host-user/history
 */
exports.getHistory = async (req, res) => {
  try {
    const hostUser = req.hostUser;
    const chats = await HostUserChat.find({ hostUserId: hostUser._id })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();

    return res.status(200).json({
      status: true,
      hostSlug: hostUser.hostSlug,
      chats,
    });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

/**
 * 7. Reset chat memory
 * POST /api/host-user/reset
 */
exports.resetHistory = async (req, res) => {
  try {
    const hostUser = req.hostUser;
    await HostUserChat.deleteMany({ hostUserId: hostUser._id });

    // Also call AI server reset memory if available
    try {
      const targetBase = (DATING_AI_BASE_URL || "https://adminai.quietchat.in").replace(/\/api\/?$/, "");
      const resetPath = `/api/hosts/${hostUser.hostSlug}/reset`;
      const resetPayload = { external_user_id: hostUser._id.toString() };
      const headers = createAIHeaders("POST", resetPath, resetPayload);
      await fetch(`${targetBase}${resetPath}`, {
        method: "POST",
        headers,
        body: JSON.stringify(resetPayload),
      });
    } catch (e) {}

    return res.status(200).json({
      status: true,
      message: "Chat history and conversation memory reset successfully.",
    });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};
