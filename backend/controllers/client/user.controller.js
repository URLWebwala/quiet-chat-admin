const User = require("../../models/user.model");

//fs
const fs = require("fs");
const path = require("path");

//mongoose
const mongoose = require("mongoose");

//import model
const History = require("../../models/history.model");
const Host = require("../../models/host.model");
const ChatTopic = require("../../models/chatTopic.model");
const Chat = require("../../models/chat.model");
const Message = require("../../models/message.model");
const LiveBroadcastHistory = require("../../models/liveBroadcastHistory.model");
const Block = require("../../models/block.model");
const CheckIn = require("../../models/checkIn.model");
const HostMatchHistory = require("../../models/hostMatchHistory.model");
const LiveBroadcastView = require("../../models/liveBroadcastView.model");
const LiveBroadcaster = require("../../models/liveBroadcaster.model");

//deletefile
const { deleteFile } = require("../../util/deletefile");

//userFunction
const userFunction = require("../../util/userFunction");

function resolveLocalFilePath(filePath) {
  if (!filePath) return null;

  let p = String(filePath);

  // If a full URL or absolute path contains `/storage/...`, keep only from `storage`.
  const storageIdx = p.indexOf("storage");
  if (storageIdx !== -1) p = p.slice(storageIdx);

  // Normalize to a relative path and avoid leading slashes.
  p = p.replace(/\\/g, "/").replace(/^\/+/, "");

  // Most deployments run with CWD = backend/ so `storage/...` resolves correctly.
  return path.resolve(process.cwd(), p);
}

function deleteFileIfExists(filePath) {
  const fullPath = resolveLocalFilePath(filePath);
  if (!fullPath) return;

  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`File deleted: ${fullPath}`);
    }
  } catch (err) {
    console.error(`Failed to delete file: ${fullPath}`, err?.message || err);
  }
}

//generateHistoryUniqueId
const generateHistoryUniqueId = require("../../util/generateHistoryUniqueId");

//validatePlanExpiration
const validatePlanExpiration = require("../../util/validatePlanExpiration");
const { evaluateProfile, mergeStringField } = require("../../util/profileCompleteness");

//private key
const admin = require("../../util/privateKey");

//check the user is exists or not with loginType 3 quick (identity)
exports.quickUserVerification = async (req, res) => {
  try {
    const { identity } = req.query;

    if (!identity) {
      return res.status(200).json({ status: false, message: "identity is required." });
    }

    const user = await User.findOne({ identity, loginType: 3 }).select("_id").lean();

    return res.status(200).json({
      status: true,
      message: user ? "User login successfully." : "User must sign up.",
      isLogin: !!user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

//user login and sign up
exports.signInOrSignUpUser = async (req, res) => {
  try {
    const { identity, loginType, fcmToken, email, phone, name, image, dob } = req.body;

    // loginType is required. fcmToken is optional (simulators, APNS not ready, permission denied).
    if (loginType === undefined || loginType === null) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Oops! Invalid details!!" });
    }

    const { uid, provider } = req.user;

    let userQuery;

    switch (loginType) {
      case 1:
        if (!email) return res.status(200).json({ status: false, message: "email is required." });
        userQuery = { email, loginType: 1 };
        break;
      case 2:
        if (!email) return res.status(200).json({ status: false, message: "email is required." });
        userQuery = { email, loginType: 2 };
        break;
      case 3:
        // Guest/anonymous (Firebase UID based)
        userQuery = { firebaseUid: uid };
        break;
      case 4:
        // Phone OTP (Firebase UID based). If guest account is linked with phone,
        // UID remains same so we must lookup by firebaseUid to avoid data loss.
        if (!phone) {
          return res.status(200).json({ status: false, message: "phone is required." });
        }
        userQuery = { firebaseUid: uid };
        break;
      default:
        if (req.file) deleteFile(req.file);
        return res.status(200).json({ status: false, message: "Invalid loginType." });
    }

    let user = null;
    if (Object.keys(userQuery).length > 0) {
      // Full document: login must not strip gender/dob (profileComplete) and must not rely on a partial save.
      user = await User.findOne(userQuery);
    }

    if (user) {
      console.log("✅ User already exists, logging in...");

      if (user.firebaseUid && user.firebaseUid !== uid) {
        console.log("If a user exists but firebaseUid mismatch");
        console.warn(`⚠️ UID mismatch — token UID (${uid}) vs user.firebaseUid (${user.firebaseUid})`);
        return res.status(403).json({
          status: false,
          message: "Identity already taken or unauthorized login attempt.",
        });
      }

      if (user.isBlock) {
        return res.status(403).json({ status: false, message: "🚷 User is blocked by the admin." });
      }

      if (user.isHost && user.hostId) {
        const host = await Host.findById(user.hostId).select("isBlock fcmToken");

        if (!host) {
          console.warn(`⚠️ No Host found with ID: ${user.hostId}`);
          // If the host document was deleted but user still has isHost/hostId, repair it.
          user.isHost = false;
          user.hostId = null;
        } else {
          if (host.isBlock) {
            return res.status(403).json({ status: false, message: "🚷 Host account is blocked by the admin." });
          }

          host.fcmToken = fcmToken || host.fcmToken;
          await host.save();
        }
      }

      // Do not overwrite stored profile with empty/whitespace from the client on every login.
      user.name = mergeStringField(user.name, name);
      user.dob = mergeStringField(user.dob, dob);
      if (req.file) {
        user.image = req.file.path;
      } else if (image !== undefined && image !== null) {
        const imgTrim = String(image).trim();
        if (imgTrim.length > 0) user.image = imgTrim;
      }
      user.fcmToken = fcmToken ? fcmToken : user.fcmToken;
      if (phone !== undefined && phone !== null) {
        const p = String(phone).trim();
        if (p.length > 0) user.phone = p;
      }
      if (identity !== undefined && identity !== null) {
        const idt = String(identity).trim();
        if (idt.length > 0) user.identity = idt;
      }
      user.loginType = loginType !== undefined ? Number(loginType) : user.loginType;
      user.lastlogin = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      await user.save();

      const profileCheck = evaluateProfile({
        name: user.name,
        gender: user.gender,
        dob: user.dob,
        image: user.image,
      });

      return res.status(200).json({
        status: true,
        message: "User logged in.",
        user,
        signUp: false,
        profileComplete: profileCheck.complete,
        missingProfileFields: profileCheck.missingFields,
        profileErrors: profileCheck.errors,
      });
    } else {
      console.log("🆕 Registering new user...");

      const bonusCoins = settingJSON.loginBonus ? settingJSON.loginBonus : 5000;

      const newUser = new User();
      newUser.firebaseUid = uid;
      newUser.provider = provider;
      newUser.coin = bonusCoins;
      newUser.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      newUser.phone = phone ? String(phone).trim() : "";

      const user = await userFunction(newUser, req);

      return res.status(200).json({
        status: true,
        message: "A new user has registered an account.",
        signUp: true,
        user: {
          _id: user._id,
          loginType: user.loginType,
          name: user.name,
          image: user.image,
          fcmToken: user.fcmToken,
          lastlogin: user.lastlogin,
        },
      });

      const uniqueId = await generateHistoryUniqueId();

      await Promise.all([
        History.create({
          uniqueId: uniqueId,
          userId: newUser._id,
          userCoin: bonusCoins,
          type: 1,
          date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        }),
      ]);

      if (user && user.fcmToken && user.fcmToken !== null) {
        const payload = {
          token: user.fcmToken,
          data: {
            title: "🚀 Instant Bonus Activated! 🎁",
            body: "🎊 Hooray! You've unlocked a special welcome reward just for joining us. Enjoy your bonus! 💰",
            type: "LOGINBONUS",
          },
        };

        const adminPromise = await admin;
        adminPromise
          .messaging()
          .send(payload)
          .then((response) => {
            console.log("Successfully sent with response: ", response);
          })
          .catch((error) => {
            console.log("Error sending message: ", error);
          });
      }

      //✅ Send random messages from 4 hosts
      const [hosts, latestMessageDoc] = await Promise.all([
        Host.find({ video: { $ne: [] } })
          .sort({ createdAt: -1 })
          .limit(5),
        Message.findOne().sort({ createdAt: -1 }).lean(),
      ]);

      const fallbackMessages = [
        "Hey there! 👋",
        "How's your day going? 😊",
        "Wanna chat? 💬",
        "You look amazing today! ✨",
        "Let's talk! 💖",
        "Hope you're having a great time! 🌟",
        "What's your favorite movie? 🎬",
        "I’d love to get to know you better! 😄",
      ];

      for (const host of hosts) {
        const chatTopic = await ChatTopic.findOne({
          $or: [
            { senderId: host._id, receiverId: user._id },
            { senderId: user._id, receiverId: host._id },
          ],
        });

        const messages = latestMessageDoc?.message?.length > 0 ? latestMessageDoc.message : fallbackMessages;
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        const messageType = Math.random() < 0.5 ? 1 : 2;

        let imageUrl = "";
        if (messageType === 2) {
          const images = Array.isArray(host.image) ? host.image : [host.image];
          if (images.length > 0) {
            const index = Math.floor(Math.random() * images.length);
            imageUrl = images[index];
          }
        }

        let chat;
        if (chatTopic) {
          chat = new Chat({
            chatTopicId: chatTopic._id,
            senderId: host._id,
            messageType,
            message: messageType === 2 ? "📸 Image" : randomMessage,
            image: messageType === 2 ? imageUrl : "",
            date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
          });
          chatTopic.chatId = chat._id;
          await Promise.all([chat.save(), chatTopic.save()]);
        } else {
          const newChatTopic = new ChatTopic({
            senderId: host._id,
            receiverId: user._id,
          });

          chat = new Chat({
            chatTopicId: newChatTopic._id,
            senderId: host._id,
            messageType,
            message: messageType === 2 ? "📸 Image" : randomMessage,
            image: messageType === 2 ? imageUrl : "",
            date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
          });

          newChatTopic.chatId = chat._id;
          await Promise.all([newChatTopic.save(), chat.save()]);
        }

        if (user && user.fcmToken && user.fcmToken !== null) {
          const payload = {
            token: user.fcmToken,
            data: {
              title: `${host.name} sent you a message 📩`,
              body: `🗨️ ${chat.message}`,
              type: "CHAT",
              senderId: String(host._id),
              receiverId: String(user._id),
              userName: String(host.name),
              hostName: String(user.name),
              userImage: String(host.image || ""),
              hostImage: String(user.image || ""),
              isOnline: String(user?.isOnline ?? ""),
              senderRole: "host",
              isFakeSender: String(host.isFake || "false"),
              isFake: String(host.isFake),
            },
          };

          const adminInstance = await admin;
          adminInstance.messaging().send(payload).catch(console.error);
        }
      }
    }
  } catch (error) {
    if (req.file) deleteFile(req.file);
    console.error("Error:", error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

//update profile of the user
exports.modifyUserProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    // res.status(200).json({ status: true, message: "The user's profile has been modified." });

    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const [user] = await Promise.all([User.findOne({ _id: userId })]);

    const mergedImage = req?.file?.path ? req.file.path : user.image;
    const mergedName = req.body.name !== undefined ? mergeStringField(user.name, req.body.name) : user.name;
    const mergedGender =
      req.body.gender !== undefined
        ? mergeStringField(user.gender || "", req.body.gender)
        : user.gender;
    const mergedGenderNorm = mergedGender != null ? String(mergedGender).toLowerCase().trim() : "";
    const mergedDob = req.body.dob !== undefined ? mergeStringField(user.dob, req.body.dob) : user.dob;

    const profileCheck = evaluateProfile({
      name: mergedName,
      gender: mergedGenderNorm,
      dob: mergedDob,
      image: mergedImage,
    });

    if (!profileCheck.complete) {
      if (req?.file?.path) deleteFileIfExists(req.file.path);
      return res.status(200).json({
        status: false,
        message: "Please complete your profile: name, date of birth (18+), gender (male / female / trans), and profile photo are required.",
        missingProfileFields: profileCheck.missingFields,
        profileErrors: profileCheck.errors,
      });
    }

    if (req?.file?.path) {
      deleteFileIfExists(user.image);
      user.image = req.file.path;
    }

    user.name = mergedName;
    user.selfIntro = req.body.selfIntro ? req.body.selfIntro : user.selfIntro;
    user.gender = mergedGenderNorm;
    user.bio = req.body.bio ? req.body.bio : user.bio;
    user.dob = mergedDob;
    user.age = req.body.age ? req.body.age : user.age;
    user.phone = req.body.phone ? String(req.body.phone).trim() : user.phone;
    // Allow phone/OTP users to add/update email from Edit Profile.
    user.email = req.body.email !== undefined ? mergeStringField(user.email, req.body.email) : user.email;
    user.countryFlagImage = req.body.countryFlagImage ? req.body.countryFlagImage : user.countryFlagImage;
    user.country = req.body.country ? req.body.country.toLowerCase()?.trim() : user.country;

    await user.save();

    if (user.isHost && user.hostId) {
      await Host.updateOne(
        { _id: user.hostId },
        {
          $set: {
            name: mergedName,
            gender: mergedGenderNorm,
            dob: mergedDob,
            image: user.image,
          },
        }
      );
    }

    return res.status(200).json({ status: true, message: "The user's profile has been modified." });
  } catch (error) {
    if (req.file) deleteFile(req.file);
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get user profile
exports.retrieveUserProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const [userDoc, hostRequest] = await Promise.all([
      User.findOne({ _id: userId }),
      Host.findOne({ userId }).select("status").lean(),
    ]);

    const hasHostRequest = !!hostRequest;

    if (
      userDoc &&
      userDoc.isVip &&
      userDoc.vipPlanId !== null &&
      userDoc.vipPlanStartDate !== null &&
      userDoc.vipPlanEndDate !== null
    ) {
      const validity = userDoc.vipPlan.validity;
      const validityType = userDoc.vipPlan.validityType;
      await validatePlanExpiration(userDoc, validity, validityType);
    }

    const user = userDoc ? userDoc.toObject({ versionKey: false }) : null;

    const profileCheck = user
      ? evaluateProfile({
          name: user.name,
          gender: user.gender,
          dob: user.dob,
          image: user.image,
        })
      : { complete: false, missingFields: [], errors: [] };

    res.status(200).json({
      status: true,
      message: "The user has retrieved their profile.",
      user,
      hasHostRequest,
      profileComplete: profileCheck.complete,
      missingProfileFields: profileCheck.missingFields,
      profileErrors: profileCheck.errors,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//delete user
exports.deactivateMyAccount = async (req, res) => {
  try {
    const userUid = req.headers["x-user-uid"];
    if (!userUid) {
      console.warn("⚠️ [AUTH] User UID.");
      return res.status(401).json({ status: false, message: "User UID required for authentication." });
    }

    const user = await User.findOne({ firebaseUid: userUid }).lean();
    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    // if (user.isHost && user.hostId !== null) {
    //   const host = await Host.findById(user.hostId).select("_id image photoGallery video liveVideo").lean();
    //   if (host) {
    //     deleteFileIfExists(host?.image);

    //     if (Array.isArray(host.photoGallery)) {
    //       for (const imgPath of host.photoGallery) {
    //         deleteFileIfExists(imgPath);
    //       }
    //     }

    //     if (Array.isArray(host.video)) {
    //       for (const imgPath of host.video) {
    //         deleteFileIfExists(imgPath);
    //       }
    //     }

    //     if (Array.isArray(host.liveVideo)) {
    //       for (const imgPath of host.liveVideo) {
    //         deleteFileIfExists(imgPath);
    //       }
    //     }

    //     await LiveBroadcastHistory.deleteMany({ hostId: host?._id });
    //     await Host.deleteOne({ _id: host?._id });
    //   }
    // }

    const host = await Host.findOne({ userId: user?._id }).select("_id image photoGallery video liveVideo profileVideo identityProof").lean();
    if (host) {
      deleteFileIfExists(host?.image);

      if (Array.isArray(host.photoGallery)) {
        for (const imgPath of host.photoGallery) {
          deleteFileIfExists(imgPath);
        }
      }

      if (Array.isArray(host.video)) {
        for (const imgPath of host.video) {
          deleteFileIfExists(imgPath);
        }
      }

      if (Array.isArray(host.liveVideo)) {
        for (const imgPath of host.liveVideo) {
          deleteFileIfExists(imgPath);
        }
      }

      await LiveBroadcastHistory.deleteMany({ hostId: host?._id });
      await Host.deleteOne({ _id: host?._id });
    }

    if (user?.image) {
      deleteFileIfExists(user.image);
    }

    const [chats] = await Promise.all([Chat.find({ senderId: user?._id })]);

    for (const chat of chats) {
      deleteFileIfExists(chat?.image);
      deleteFileIfExists(chat?.audio);
    }

    await Promise.all([
      ChatTopic.deleteMany({ $or: [{ senderId: user?._id }, { receiverId: user?._id }] }),
      Chat.deleteMany({ senderId: user?._id }),
      Block.deleteMany({ userId: user?._id }),
      CheckIn.deleteMany({ userId: user?._id }),
      History.deleteMany({ userId: user?._id }),
      HostMatchHistory.deleteMany({ userId: user?._id }),
      LiveBroadcaster.deleteMany({ userId: user?._id }),
      LiveBroadcastView.deleteMany({ userId: user?._id }),
      User.deleteOne({ _id: user._id }),
    ]);

    if (user.firebaseUid) {
      try {
        const adminPromise = await admin;
        adminPromise.auth().deleteUser(user.firebaseUid);
        console.log(`✅ Firebase user deleted: ${user.firebaseUid}`);
      } catch (err) {
        console.error(`❌ Failed to delete Firebase user ${user.firebaseUid}:`, err.message);
      }
    }

    return res.status(200).json({
      status: true,
      message: "User and related data successfully deleted.",
    });
  } catch (error) {
    console.error(error);
    if (res.headersSent) return;
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get Firebase UID by Device UUID
exports.getFirebaseUidByDeviceUuid = async (req, res) => {
  try {
    const { deviceUuid, loginType } = req.query;

    if (!deviceUuid) {
      return res.status(400).json({
        status: false,
        message: "Device UUID is required.",
      });
    }

    if (!loginType) {
      return res.status(400).json({
        status: false,
        message: "Login type is required.",
      });
    }

    const user = await User.findOne({ identity: deviceUuid.trim(), loginType: Number(loginType) }, { firebaseUid: 1 }).lean();

    if (!user || !user.firebaseUid) {
      return res.status(404).json({
        status: false,
        message: "Firebase UID not found for this device.",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Firebase UID fetched successfully.",
      firebaseUid: user.firebaseUid,
    });
  } catch (error) {
    console.error("Fetch Firebase UID Error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//generate Firebase Custom Token
exports.getFirebaseCustomToken = async (req, res) => {
  try {
    const { firebaseUid } = req.query;

    if (!firebaseUid) {
      return res.status(400).json({ status: false, message: "Firebase UID is required." });
    }

    const firebaseAdmin = await admin;
    const customToken = await firebaseAdmin.auth().createCustomToken(firebaseUid);

    return res.status(200).json({
      status: true,
      message: "Firebase custom token generated successfully.",
      customToken,
    });
  } catch (error) {
    console.error("Generate Custom Token Error:", error);
    return res.status(500).json({ status: false, message: error.message || "Failed to generate Firebase custom token." });
  }
};

exports.addBankAccount = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const { bankName, accountNumber, ifscCode, accountHolderName, upiId } = req.body;

    if (!bankName?.trim() || !accountNumber?.trim() || !ifscCode?.trim() || !accountHolderName?.trim()) {
      return res.status(200).json({ status: false, message: "Bank Name, Account Number, IFSC and Holder Name are required." });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    user.bankDetails = {
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim(),
      accountHolderName: accountHolderName.trim(),
      upiId: upiId ? upiId.trim() : "",
    };

    await user.save();

    return res.status(200).json({
      status: true,
      message: "Bank account details saved successfully.",
      data: user.bankDetails,
    });
  } catch (error) {
    console.error("addBankAccount error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

exports.getBankAccount = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const user = await User.findById(req.user.userId).select("bankDetails").lean();
    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    return res.status(200).json({
      status: true,
      message: "Bank account details retrieved successfully.",
      data: user.bankDetails || {},
    });
  } catch (error) {
    console.error("getBankAccount error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
