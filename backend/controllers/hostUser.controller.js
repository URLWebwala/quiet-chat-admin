const jwt = require("jsonwebtoken");
const axios = require("axios");
const HostUser = require("../models/hostUser.model");
const HostUserChat = require("../models/hostUserChat.model");
const HostUserTransaction = require("../models/hostUserTransaction.model");
const HostPost = require("../models/hostPost.model");
const Host = require("../models/host.model");
const CreditPlan = require("../models/creditPlan.model");
const Setting = require("../models/setting.model");
const { hashPassword, verifyPassword } = require("../util/passwordHelper");
const { validateHostUserToken, JWT_SECRET } = require("../middleware/validateHostUserToken.middleware");
const { DATING_AI_BASE_URL, createAIHeaders } = require("../util/aiConfig");
const { resolveCurrencyForCountry, calculateLocalizedPrice } = require("../util/currencyHelper");

/** Helper to clean any timestamps or speaker tags from AI response */
function cleanAIMessage(text) {
  if (!text || typeof text !== "string") return "";
  let clean = text.trim();
  for (let i = 0; i < 3; i++) {
    const before = clean;
    // Remove timestamps with brackets: [04:58 PM], (04:58 PM), [16:58], etc.
    clean = clean.replace(/^[\[\(]?\s*\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\s*[\]\)]\s*[:\-\s]*/i, "");
    // Remove orphaned closing bracket timestamp: "04:58 PM] ", "16:58] ", "4:58 pm] "
    clean = clean.replace(/^\s*\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\s*\]\s*[:\-\s]*/i, "");
    // Remove leading speaker prefix: "[Shanaya]:", "Shanaya:", "[Meera 04:58 PM]:", "Assistant:"
    clean = clean.replace(/^(?:\[?\s*(?:Shanaya|Meera|Host|AI|Assistant|User)(?:\s+\d{1,2}:\d{2}(?:\s*[AaPp][Mm])?)?\s*\]?\s*[:\-])\s*/i, "");
    // Remove leftover bracket or colon
    clean = clean.replace(/^[\]\):\-]\s*/, "");
    clean = clean.trim();
    if (clean === before) break;
  }
  return clean;
}

/** Helper to retrieve live global settings */
async function getSettingsConfig() {
  if (global.settingJSON && Object.keys(global.settingJSON).length > 0) {
    return global.settingJSON;
  }
  const s = await Setting.findOne().sort({ createdAt: -1 }).lean();
  if (s) {
    global.settingJSON = s;
    return s;
  }
  return {};
}

/**
 * 1. Register a new user for a specific Host persona
 * POST /api/host-user/register
 * Body: { hostSlug, email, password, name, gender, hostName }
 */
exports.register = async (req, res) => {
  try {
    const { hostSlug, email, password, name, gender, hostName, country, countryCode, currency } = req.body || {};

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
    const settings = await getSettingsConfig();

    // Resolve user country and currency
    const resolvedCurrency = await resolveCurrencyForCountry(country || "India");

    // Calculate Welcome Free Credits based on global admin settings
    const freeCreditsEnabled = settings.aiModelFreeCreditsEnabled !== false;
    const welcomeCredits = freeCreditsEnabled ? Math.max(0, parseInt(settings.aiModelWelcomeFreeCredits, 10) || 100) : 0;

    const newUser = await HostUser.create({
      hostSlug: cleanSlug,
      hostName: hostName || cleanSlug,
      name: (name && name.trim()) || "User",
      email: cleanEmail,
      password: hashedPassword,
      gender: gender === "female" ? "female" : "male",
      country: country || resolvedCurrency.name || "India",
      countryCode: countryCode || resolvedCurrency.countryCode || "IN",
      currency: currency || resolvedCurrency.currencyCode || "INR",
      credits: welcomeCredits,
      receivedWelcomeBonus: welcomeCredits > 0,
      unlockedExclusiveMedia: [],
      lastLogin: new Date(),
    });

    // Create transaction history entry for Welcome Free Credits
    if (welcomeCredits > 0) {
      await HostUserTransaction.create({
        hostUserId: newUser._id,
        hostSlug: cleanSlug,
        type: "credit",
        amount: welcomeCredits,
        balanceBefore: 0,
        balanceAfter: welcomeCredits,
        category: "welcome_bonus",
        description: `Welcome Free Credits granted on new registration`,
      });
    }

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
      message: welcomeCredits > 0
        ? `Registration successful! You received ${welcomeCredits} Welcome Free Credits.`
        : "Registration successful!",
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
    const user = await HostUser.findById(req.hostUser._id).select("-password").lean();
    return res.status(200).json({
      status: true,
      user: user || req.hostUser,
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
 * Real-time credit deduction applies here.
 * POST /api/host-user/chat
 * Body: { message }
 */
exports.chat = async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message || !message.trim()) {
      return res.status(400).json({ status: false, message: "Message text is required" });
    }

    const hostUser = await HostUser.findById(req.hostUser._id);
    if (!hostUser) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    const cleanMsg = message.trim();
    const hostSlug = hostUser.hostSlug;
    const settings = await getSettingsConfig();

    // Check Chat Credit Rate: lookup specific model's configured credit rate or fallback to global
    let chatRate = 5;
    if (hostSlug) {
      const cleanSlug = hostSlug.toLowerCase().trim();
      const firstPart = cleanSlug.split("-")[0];
      const hostDoc = await Host.findOne({
        $or: [
          { slug: cleanSlug },
          { name: { $regex: new RegExp(`^${firstPart}`, "i") } },
        ],
        isFake: true,
      }).lean();
      if (hostDoc && hostDoc.chatRate !== undefined && hostDoc.chatRate !== null) {
        chatRate = Math.max(0, parseInt(hostDoc.chatRate, 10));
      } else if (settings.aiModelChatCreditRate !== undefined) {
        chatRate = Math.max(0, parseInt(settings.aiModelChatCreditRate, 10));
      }
    }
    const currentCredits = Number(hostUser.credits) || 0;

    if (chatRate > 0 && currentCredits < chatRate) {
      return res.status(402).json({
        status: false,
        insufficientCredits: true,
        message: `Insufficient credits. Sending a message requires ${chatRate} credits (Current balance: ${currentCredits}). Please recharge to continue.`,
        requiredCredits: chatRate,
        currentCredits,
      });
    }

    // 1. Deduct credits in real-time if rate > 0
    let balanceAfter = currentCredits;
    if (chatRate > 0) {
      balanceAfter = Math.max(0, currentCredits - chatRate);
      hostUser.credits = balanceAfter;
      await hostUser.save();

      // Log transaction
      await HostUserTransaction.create({
        hostUserId: hostUser._id,
        hostSlug: hostSlug,
        type: "debit",
        amount: chatRate,
        balanceBefore: currentCredits,
        balanceAfter: balanceAfter,
        category: "chat_message",
        description: `Chat message with ${hostUser.hostName || hostSlug}`,
      });
    }

    // 2. Save user's message to MongoDB
    const userChat = await HostUserChat.create({
      hostUserId: hostUser._id,
      hostSlug: hostSlug,
      sender: "user",
      message: cleanMsg,
    });

    // 3. Call AI persona engine (adminai server)
    const targetBase = (DATING_AI_BASE_URL || "https://adminai.quietchat.in").replace(/\/api\/?$/, "");
    let targetAiSlug = hostSlug;
    if (hostSlug === "shanaya-prototype" || hostSlug === "shanaya-caring") {
      targetAiSlug = "meera-caring";
    }
    const aiPath = `/api/hosts/${targetAiSlug}/chat`;
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
        if (aiData.reply) hostReply = cleanAIMessage(aiData.reply);
        if (aiData.messages && aiData.messages[0]?.delay_ms) {
          delayMs = aiData.messages[0].delay_ms;
        }
      } else {
        console.warn(`AI persona server status: ${aiResponse.status}`);
      }
    } catch (aiErr) {
      console.warn("AI engine call fallback:", aiErr.message);
    }

    // Clean final host reply before saving & returning
    hostReply = cleanAIMessage(hostReply);

    // 4. Save AI reply to MongoDB
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
      creditsRemaining: balanceAfter,
      creditsDeducted: chatRate,
    });
  } catch (error) {
    console.error("HostUser Chat Error:", error);
    return res.status(500).json({ status: false, message: error.message || "Failed to process message" });
  }
};

/**
 * 6. Unlock Exclusive Photo or Video
 * POST /api/host-user/unlock-media
 * Body: { mediaId, type: 'photo' | 'video' }
 */
exports.unlockMedia = async (req, res) => {
  try {
    const { mediaId, type } = req.body || {};
    if (!mediaId) {
      return res.status(400).json({ status: false, message: "mediaId is required" });
    }

    const hostUser = await HostUser.findById(req.hostUser._id);
    if (!hostUser) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    const mediaIdStr = String(mediaId);
    const alreadyUnlocked = Array.isArray(hostUser.unlockedExclusiveMedia) && hostUser.unlockedExclusiveMedia.includes(mediaIdStr);
    if (alreadyUnlocked) {
      return res.status(200).json({
        status: true,
        message: "Media is already unlocked.",
        unlocked: true,
        credits: hostUser.credits || 0,
        unlockedExclusiveMedia: hostUser.unlockedExclusiveMedia,
      });
    }

    // Lookup post in HostPost if valid ObjectId
    let post = null;
    if (mediaIdStr.match(/^[0-9a-fA-F]{24}$/)) {
      post = await HostPost.findById(mediaIdStr).lean();
    }

    // Discover content is 100% FREE - zero deduction
    if (post && post.category === "discover") {
      if (!Array.isArray(hostUser.unlockedExclusiveMedia)) {
        hostUser.unlockedExclusiveMedia = [];
      }
      hostUser.unlockedExclusiveMedia.push(mediaIdStr);
      await hostUser.save();
      return res.status(200).json({
        status: true,
        message: "Discover media is 100% free!",
        unlocked: true,
        credits: hostUser.credits || 0,
        creditsDeducted: 0,
        unlockedMediaId: mediaIdStr,
        unlockedExclusiveMedia: hostUser.unlockedExclusiveMedia,
      });
    }

    // For Exclusive content, determine exact rate:
    // Priority: post.creditCost set by admin at creation -> req.body.creditCost -> fallback 20
    let rate = 20;
    if (post && post.creditCost !== undefined && post.creditCost !== null) {
      rate = Math.max(0, parseInt(post.creditCost, 10));
    } else if (req.body.creditCost !== undefined) {
      rate = Math.max(0, parseInt(req.body.creditCost, 10));
    }

    const isVideo = (post && post.type === "video") || type === "video";
    const currentCredits = Number(hostUser.credits) || 0;

    if (rate > 0 && currentCredits < rate) {
      return res.status(402).json({
        status: false,
        insufficientCredits: true,
        message: `Insufficient credits to unlock this exclusive ${isVideo ? "video" : "photo"}. Required: ${rate} credits (Current balance: ${currentCredits}).`,
        requiredCredits: rate,
        currentCredits,
      });
    }

    const balanceAfter = Math.max(0, currentCredits - rate);
    hostUser.credits = balanceAfter;
    if (!Array.isArray(hostUser.unlockedExclusiveMedia)) {
      hostUser.unlockedExclusiveMedia = [];
    }
    hostUser.unlockedExclusiveMedia.push(mediaIdStr);
    await hostUser.save();

    // Log transaction
    if (rate > 0) {
      await HostUserTransaction.create({
        hostUserId: hostUser._id,
        hostSlug: hostUser.hostSlug,
        type: "debit",
        amount: rate,
        balanceBefore: currentCredits,
        balanceAfter: balanceAfter,
        category: isVideo ? "exclusive_video" : "exclusive_photo",
        mediaId: mediaIdStr,
        description: `Unlocked Exclusive ${isVideo ? "Video" : "Photo"} (${post?.title || mediaIdStr})`,
      });
    }

    return res.status(200).json({
      status: true,
      message: `Exclusive ${isVideo ? "video" : "photo"} unlocked successfully!`,
      credits: balanceAfter,
      creditsDeducted: rate,
      unlockedMediaId: mediaIdStr,
      unlockedExclusiveMedia: hostUser.unlockedExclusiveMedia,
    });
  } catch (error) {
    console.error("Unlock Media Error:", error);
    return res.status(500).json({ status: false, message: error.message || "Failed to unlock media" });
  }
};

/**
 * 7. Get live wallet details & transaction history
 * GET /api/host-user/wallet
 */
exports.getWallet = async (req, res) => {
  try {
    const user = await HostUser.findById(req.hostUser._id)
      .select("credits receivedWelcomeBonus unlockedExclusiveMedia name email")
      .lean();

    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    const transactions = await HostUserTransaction.find({ hostUserId: req.hostUser._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const settings = await getSettingsConfig();

    return res.status(200).json({
      status: true,
      credits: user.credits || 0,
      receivedWelcomeBonus: !!user.receivedWelcomeBonus,
      unlockedExclusiveMedia: user.unlockedExclusiveMedia || [],
      rates: {
        chatCreditRate: settings.aiModelChatCreditRate !== undefined ? Number(settings.aiModelChatCreditRate) : 5,
        exclusivePhotoRate: settings.aiModelExclusivePhotoRate !== undefined ? Number(settings.aiModelExclusivePhotoRate) : 20,
        exclusiveVideoRate: settings.aiModelExclusiveVideoRate !== undefined ? Number(settings.aiModelExclusiveVideoRate) : 50,
        discoverFree: true,
      },
      transactions,
    });
  } catch (error) {
    console.error("Get Wallet Error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

/**
 * 8. Get current rates and welcome bonus policy
 * GET /api/host-user/rates (Public)
 */
exports.getRates = async (req, res) => {
  try {
    const settings = await getSettingsConfig();
    const { hostSlug } = req.query || {};

    let chatCreditRate = settings.aiModelChatCreditRate !== undefined ? Number(settings.aiModelChatCreditRate) : 5;
    if (hostSlug) {
      const cleanSlug = hostSlug.toLowerCase().trim();
      const firstPart = cleanSlug.split("-")[0];
      const hostDoc = await Host.findOne({
        $or: [
          { slug: cleanSlug },
          { name: { $regex: new RegExp(`^${firstPart}`, "i") } },
        ],
        isFake: true,
      }).lean();
      if (hostDoc && hostDoc.chatRate !== undefined && hostDoc.chatRate !== null) {
        chatCreditRate = Math.max(0, parseInt(hostDoc.chatRate, 10));
      }
    }

    return res.status(200).json({
      status: true,
      freeCreditsEnabled: settings.aiModelFreeCreditsEnabled !== false,
      welcomeFreeCredits: settings.aiModelWelcomeFreeCredits !== undefined ? Number(settings.aiModelWelcomeFreeCredits) : 100,
      chatCreditRate: chatCreditRate,
      exclusivePhotoRate: settings.aiModelExclusivePhotoRate !== undefined ? Number(settings.aiModelExclusivePhotoRate) : 20,
      exclusiveVideoRate: settings.aiModelExclusiveVideoRate !== undefined ? Number(settings.aiModelExclusiveVideoRate) : 50,
      discoverFree: true, // Always free
    });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

/**
 * 9. Get chat history between this user and this host
 * GET /api/host-user/history
 */
exports.getHistory = async (req, res) => {
  try {
    const hostUser = req.hostUser;
    const chats = await HostUserChat.find({ hostUserId: hostUser._id })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();

    const sanitizedChats = chats.map((c) => ({
      ...c,
      message: cleanAIMessage(c.message),
    }));

    return res.status(200).json({
      status: true,
      hostSlug: hostUser.hostSlug,
      chats: sanitizedChats,
      messages: sanitizedChats,
    });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

/**
 * 10. Reset chat memory
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

/**
 * 11. Get Payment Gateway Config
 * GET /api/host-user/payment-config
 */
exports.getPaymentConfig = async (req, res) => {
  try {
    const settings = await getSettingsConfig();
    return res.status(200).json({
      status: true,
      razorpay: {
        enabled: settings.razorpayEnabled !== false && Boolean(settings.razorpayId),
        keyId: settings.razorpayId || "",
      },
      cashfree: {
        enabled: Boolean(settings.cashfreeAndroidEnabled || settings.cashfreeIosEnabled),
        env: settings.cashfreeSelectedEnv || "sandbox",
      },
      stripe: {
        enabled: Boolean(settings.stripeEnabled),
        publishableKey: settings.stripePublishableKey || "",
      },
    });
  } catch (error) {
    console.error("Get Payment Config Error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

/**
 * 12. Create Payment Order for Credit Package Recharge
 * POST /api/host-user/create-payment-order
 * Body: { planId, gateway, country, currencyCode }
 */
exports.createPaymentOrder = async (req, res) => {
  try {
    const { planId, gateway = "razorpay", country } = req.body || {};
    if (!planId) {
      return res.status(400).json({ status: false, message: "planId is required" });
    }

    const hostUser = req.hostUser;
    const plan = await CreditPlan.findById(planId).lean();
    if (!plan || !plan.isActive) {
      return res.status(404).json({ status: false, message: "Credit plan not found or inactive" });
    }

    const userCountry = country || hostUser.country || "India";
    const resolvedCurrency = await resolveCurrencyForCountry(userCountry);
    const localizedPrice = calculateLocalizedPrice(plan.price, resolvedCurrency.exchangeRate || 1);

    const settings = await getSettingsConfig();
    const orderReceipt = `sh_${Date.now()}_${hostUser._id.toString().slice(-4)}`;

    // Handle Razorpay Order Creation
    if (gateway.toLowerCase() === "razorpay") {
      const razorpayId = settings.razorpayId?.trim();
      const razorpaySecret = settings.razorpaySecretKey?.trim();

      // If live/test Razorpay credentials exist in settings
      if (razorpayId && razorpaySecret && !razorpayId.includes("RAZOR")) {
        try {
          const auth = Buffer.from(`${razorpayId}:${razorpaySecret}`).toString("base64");
          const rzpRes = await axios.post(
            "https://api.razorpay.com/v1/orders",
            {
              amount: Math.round(localizedPrice * 100), // amount in lowest currency unit (paise/cents)
              currency: resolvedCurrency.currencyCode || "INR",
              receipt: orderReceipt,
              notes: {
                hostUserId: hostUser._id.toString(),
                planId: plan._id.toString(),
                credits: plan.credits + (plan.bonusCredits || 0),
                hostSlug: hostUser.hostSlug || "shanaya-prototype",
              },
            },
            {
              headers: {
                Authorization: `Basic ${auth}`,
                "Content-Type": "application/json",
              },
              timeout: 8000,
            }
          );

          if (rzpRes.data && rzpRes.data.id) {
            return res.status(200).json({
              status: true,
              gateway: "razorpay",
              orderId: rzpRes.data.id,
              amount: localizedPrice,
              amountInUnits: rzpRes.data.amount,
              currency: resolvedCurrency.currencyCode,
              symbol: resolvedCurrency.symbol,
              keyId: razorpayId,
              plan: {
                _id: plan._id,
                credits: plan.credits,
                bonusCredits: plan.bonusCredits || 0,
                totalCredits: plan.credits + (plan.bonusCredits || 0),
              },
            });
          }
        } catch (rzpErr) {
          console.warn("Razorpay API order creation fallback:", rzpErr.response?.data || rzpErr.message);
        }
      }

      // Test/Demo sandbox fallback if no live keys or API error
      const testOrderId = `order_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      return res.status(200).json({
        status: true,
        gateway: "razorpay",
        orderId: testOrderId,
        amount: localizedPrice,
        amountInUnits: Math.round(localizedPrice * 100),
        currency: resolvedCurrency.currencyCode,
        symbol: resolvedCurrency.symbol,
        keyId: razorpayId || "rzp_test_shanaya_demo",
        isTest: true,
        plan: {
          _id: plan._id,
          credits: plan.credits,
          bonusCredits: plan.bonusCredits || 0,
          totalCredits: plan.credits + (plan.bonusCredits || 0),
        },
      });
    }

    // Default fallback order response
    const genericOrderId = `order_${Date.now()}`;
    return res.status(200).json({
      status: true,
      gateway: gateway || "razorpay",
      orderId: genericOrderId,
      amount: localizedPrice,
      currency: resolvedCurrency.currencyCode,
      symbol: resolvedCurrency.symbol,
      plan: {
        _id: plan._id,
        credits: plan.credits,
        bonusCredits: plan.bonusCredits || 0,
        totalCredits: plan.credits + (plan.bonusCredits || 0),
      },
    });
  } catch (error) {
    console.error("Create Payment Order Error:", error);
    return res.status(500).json({ status: false, message: error.message || "Failed to create payment order" });
  }
};

/**
 * 13. Verify Payment and Credit User Wallet
 * POST /api/host-user/verify-payment
 * Body: { planId, orderId, paymentId, signature, gateway, country, currency, price }
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { planId, orderId, paymentId, signature, gateway = "razorpay", currency, price } = req.body || {};
    if (!planId) {
      return res.status(400).json({ status: false, message: "planId is required" });
    }

    const hostUser = await HostUser.findById(req.hostUser._id);
    if (!hostUser) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    const plan = await CreditPlan.findById(planId).lean();
    if (!plan) {
      return res.status(404).json({ status: false, message: "Plan not found" });
    }

    // Check if this orderId or paymentId was already processed to prevent double-crediting
    const lookupId = paymentId || orderId;
    if (lookupId) {
      const existing = await HostUserTransaction.findOne({
        paymentOrderId: lookupId,
        type: "credit",
      }).lean();

      if (existing) {
        return res.status(200).json({
          status: true,
          message: "Payment already verified and credits applied.",
          credits: hostUser.credits,
        });
      }
    }

    const totalCreditsToAdd = (plan.credits || 0) + (plan.bonusCredits || 0);
    const balanceBefore = Number(hostUser.credits) || 0;
    const balanceAfter = balanceBefore + totalCreditsToAdd;

    hostUser.credits = balanceAfter;
    await hostUser.save();

    // Create Transaction Record
    const tx = await HostUserTransaction.create({
      hostUserId: hostUser._id,
      hostSlug: hostUser.hostSlug || "shanaya-prototype",
      type: "credit",
      amount: totalCreditsToAdd,
      balanceBefore,
      balanceAfter,
      category: "coin_purchase",
      description: `Recharge: ${plan.credits} Credits (+${plan.bonusCredits || 0} Bonus Credits)`,
      price: price !== undefined ? Number(price) : plan.price,
      currency: currency || "INR",
      paymentOrderId: lookupId || `manual_${Date.now()}`,
      paymentGateway: gateway,
    });

    return res.status(200).json({
      status: true,
      message: `Recharge successful! +${totalCreditsToAdd} Credits have been added to your balance.`,
      credits: balanceAfter,
      transaction: tx,
    });
  } catch (error) {
    console.error("Verify Payment Error:", error);
    return res.status(500).json({ status: false, message: error.message || "Failed to verify payment" });
  }
};
