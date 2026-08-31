const Host = require("../../models/host.model");
const User = require("../../models/user.model");
const Agency = require("../../models/agency.model");
const ChatTopic = require("../../models/chatTopic.model");
const Chat = require("../../models/chat.model");
const axios = require("axios");

//private key
const admin = require("../../util/privateKey");

//mongoose
const mongoose = require("mongoose");

//fs
const fs = require("fs");

//deletefile
const { deleteFiles } = require("../../util/deletefile");

//generateUniqueId
const generateUniqueId = require("../../util/generateUniqueId");
const { resolveHostCallRates } = require("../../util/resolveHostCallRates");
const { evaluateProfile } = require("../../util/profileCompleteness");

const moment = require("moment-timezone");
const LiveBroadcaster = require("../../models/liveBroadcaster.model");
const LiveBroadcastView = require("../../models/liveBroadcastView.model");
const LiveBroadcastHistory = require("../../models/liveBroadcastHistory.model");
const presenceStore = require("../../util/presenceStore");

const parseArrayField = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
    return val.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

const getHostPresenceStatus = (host) => {
  if (!host) return "Offline";
  if (host.isLive) return "Live";
  if (host.isBusy) return "Busy";
  if (host.isOnline) return "Online";
  return "Offline";
};

//retrive host requests
exports.fetchHostRequest = async (req, res) => {
  try {
    if (!req.query.status) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const start = Math.max(parseInt(req.query.start) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 20, 1);

    const statusParam = req.query.status;
    const search = req.query.search && req.query.search.trim().toLowerCase() !== "all" ? req.query.search.trim() : null;

    let matchQuery = { isFake: false };
    if (statusParam !== "All") {
      const statusInt = parseInt(statusParam);
      matchQuery.status = statusInt;
      if (statusInt === 1) matchQuery.agencyId = null;
    }

    const result = await Host.aggregate([
      { $match: matchQuery },

      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userId",
          pipeline: [{ $project: { _id: 1, name: 1, image: 1, uniqueId: 1, phone: 1 } }],
        },
      },
      { $unwind: { path: "$userId", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "agencies",
          localField: "agencyId",
          foreignField: "_id",
          as: "agency",
          pipeline: [{ $project: { _id: 1, name: 1, image: 1, agencyCode: 1 } }],
        },
      },
      { $unwind: { path: "$agency", preserveNullAndEmptyArrays: true } },

      ...(search
        ? [
          {
            $match: {
              $or: [
                { "userId.name": { $regex: search, $options: "i" } },
                { "userId.uniqueId": { $regex: search, $options: "i" } },

                { "agency.name": { $regex: search, $options: "i" } },
                { "agency.agencyCode": { $regex: search, $options: "i" } },

                { name: { $regex: search, $options: "i" } },
                { uniqueId: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
              ],
            },
          },
        ]
        : []),

      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $sort: { createdAt: -1 } }, { $skip: (start - 1) * limit }, { $limit: limit }],
        },
      },
    ]);

    const total = result[0]?.metadata[0]?.total || 0;
    const request = result[0]?.data || [];

    return res.status(200).json({
      status: true,
      message: "Retrieve host's request for admin.",
      total,
      data: request,
    });
  } catch (error) {
    console.error("fetchHostRequest error:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//accept Or decline host request
exports.handleHostRequest = async (req, res) => {
  try {
    if (!settingJSON) {
      return res.status(200).json({ status: false, message: "Setting not found." });
    }

    const { requestId, userId, status, reason } = req.query;

    if (!requestId || !userId || !status) {
      return res.status(200).json({ status: false, message: "Invalid details provided." });
    }

    const hostObjectId = new mongoose.Types.ObjectId(requestId);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const statusNumber = Number(status);

    const host = await Host.findOne({ _id: hostObjectId });

    if (!host) {
      return res.status(200).json({ status: false, message: "Host request not found." });
    }

    if (host.agencyId === null) {
      return res.status(200).json({
        status: false,
        message: "Please assign this host to an agency before accepting the request.",
      });
    }

    if (host.status === 2) {
      return res.status(200).json({
        status: false,
        message: "Host request has already been accepted.",
      });
    }

    if (host.status === 3) {
      return res.status(200).json({
        status: false,
        message: "Host request has already been rejected.",
      });
    }

    if (statusNumber === 2) {
      host.status = 2;
      host.randomCallRate = settingJSON.generalRandomCallRate;
      host.randomCallFemaleRate = settingJSON.femaleRandomCallRate;
      host.randomCallMaleRate = settingJSON.maleRandomCallRate;
      host.privateCallRate = settingJSON.videoPrivateCallRate;
      host.audioCallRate = settingJSON.audioPrivateCallRate;
      host.chatRate = settingJSON.chatInteractionRate;
      host.useCustomCallRates = false;
      await host.save();

      res.status(200).json({
        status: true,
        message: "Host request accepted successfully.",
        data: host,
      });

      const user = await User.findOne({ _id: userObjectId }).select("isHost hostId");
      if (user) {
        user.isHost = true;
        user.hostId = host._id;
        await user.save();
      }

      if (host.fcmToken) {
        const payload = {
          token: host.fcmToken,
          data: {
            title: "🎉 Host Verification Successful!",
            body: "Congratulations! Your host request has been approved. You’re now ready to go live! 🚀",
          },
        };

        try {
          const adminInstance = await admin;
          await adminInstance.messaging().send(payload);
          console.log("Notification sent successfully.");
        } catch (error) {
          console.error("Error sending notification:", error);
        }
      }
    } else if (statusNumber === 3) {
      if (!reason || reason.trim() === "") {
        return res.status(200).json({
          status: false,
          message: "Please provide a reason for rejection.",
        });
      }

      host.status = 3;
      host.reason = reason.trim();
      await host.save();

      res.status(200).json({
        status: true,
        message: "Host request rejected successfully.",
        data: host,
      });

      if (host.fcmToken) {
        const payload = {
          token: host.fcmToken,
          data: {
            title: "❌ Host Request Declined",
            body: "Unfortunately, your host request was declined. Please check your details or contact support for assistance. 📩",
          },
        };

        try {
          const adminInstance = await admin;
          await adminInstance.messaging().send(payload);
          console.log("Notification sent successfully.");
        } catch (error) {
          console.error("Error sending notification:", error);
        }
      }
    } else {
      return res.status(200).json({ status: false, message: "Invalid status value provided." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//assign host under agency
exports.assignHostToAgency = async (req, res) => {
  try {
    const { requestId, agencyId, userId } = req.query;

    if (!requestId || !agencyId || !userId) {
      return res.status(200).json({
        status: false,
        message: "Required parameters missing: requestId or agencyId.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(requestId) || !mongoose.Types.ObjectId.isValid(agencyId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(200).json({
        status: false,
        message: "Invalid requestId or agencyId or userId format. Must be a valid ObjectId.",
      });
    }

    const requestObjectId = new mongoose.Types.ObjectId(requestId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [hostRequest, agency, user] = await Promise.all([
      Host.findOne({ _id: requestObjectId, status: 1 }),
      Agency.findById(agencyId).select("_id name agencyCode").lean(),
      User.findById(userObjectId).select("_id").lean(),
    ]);

    if (!hostRequest) {
      return res.status(200).json({ status: false, message: "Host request not found." });
    }

    if (hostRequest.agencyId !== null) {
      return res.status(200).json({ status: false, message: "This host request is already assigned to an agency." });
    }

    if (!agency) {
      return res.status(200).json({ status: false, message: "Agency not found." });
    }

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    if (hostRequest.status === 2) {
      return res.status(200).json({ status: false, message: "This host request has already been accepted." });
    }

    if (hostRequest.status === 3) {
      return res.status(200).json({ status: false, message: "This host request has already been rejected." });
    }

    hostRequest.agencyId = agency._id;
    hostRequest.status = 2;
    hostRequest.randomCallRate = settingJSON.generalRandomCallRate;
    hostRequest.randomCallFemaleRate = settingJSON.femaleRandomCallRate;
    hostRequest.randomCallMaleRate = settingJSON.maleRandomCallRate;
    hostRequest.privateCallRate = settingJSON.videoPrivateCallRate;
    hostRequest.audioCallRate = settingJSON.audioPrivateCallRate;
    hostRequest.chatRate = settingJSON.chatInteractionRate;
    hostRequest.useCustomCallRates = false;

    res.status(200).json({
      status: true,
      message: "Host successfully assigned to the agency.",
      request: { ...hostRequest.toObject(), agency },
    });

    await Promise.all([
      hostRequest.save(),
      User.updateOne(
        { _id: user._id },
        {
          $set: {
            isHost: true,
            hostId: hostRequest._id,
          },
        },
      ),
    ]);

    if (hostRequest.fcmToken) {
      const payload = {
        token: hostRequest.fcmToken,
        data: {
          title: "🎉 Host Verification Successful!",
          body: "Congratulations! Your host request has been approved. You’re now ready to go live! 🚀",
        },
      };

      try {
        const adminInstance = await admin;
        await adminInstance.messaging().send(payload);
        console.log("Notification sent successfully.");
      } catch (error) {
        console.error("Error sending notification:", error);
      }
    }
  } catch (error) {
    console.error("Error in assignHostToAgency:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error", error: error.message });
  }
};

//get agency's hosts
exports.listAgencyHosts = async (req, res) => {
  try {
    if (!req.query.agencyId || !mongoose.Types.ObjectId.isValid(req.query.agencyId)) {
      return res.status(200).json({
        status: false,
        message: "Valid agencyId is required",
      });
    }

    const agencyId = new mongoose.Types.ObjectId(req.query.agencyId);

    const start = Math.max(parseInt(req.query.start) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 20, 1);

    const search = req.query.search?.trim() || "All";
    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";

    let dateFilter = {};
    if (startDate && endDate && startDate !== "All" && endDate !== "All") {
      const s = new Date(startDate);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      dateFilter.createdAt = { $gte: s, $lte: e };
    }

    let searchFilter = {};
    if (search && search !== "All") {
      searchFilter.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }, { uniqueId: { $regex: search, $options: "i" } }];
    }

    const matchStage = {
      agencyId,
      status: 2,
      isFake: false,
      ...dateFilter,
      ...searchFilter,
    };

    const result = await Host.aggregate([
      { $match: matchStage },

      {
        $facet: {
          metadata: [{ $count: "total" }],

          data: [
            {
              $lookup: {
                from: "followerfollowings",
                let: { hostId: "$_id" },
                pipeline: [{ $match: { $expr: { $eq: ["$followingId", "$$hostId"] } } }, { $count: "count" }],
                as: "followers",
              },
            },
            {
              $addFields: {
                totalFollowers: {
                  $ifNull: [{ $arrayElemAt: ["$followers.count", 0] }, 0],
                },
              },
            },

            {
              $project: {
                name: 1,
                gender: 1,
                image: 1,
                impression: 1,
                identityProofType: 1,
                uniqueId: 1,
                isOnline: 1,
                isBusy: 1,
                isLive: 1,
                countryFlagImage: 1,
                country: 1,
                totalFollowers: 1,
                createdAt: 1,
              },
            },

            { $sort: { createdAt: -1 } },
            { $skip: (start - 1) * limit },
            { $limit: limit },
          ],
        },
      },
    ]);

    const totalHosts = result[0]?.metadata[0]?.total || 0;
    const hosts = result[0]?.data || [];

    return res.status(200).json({
      status: true,
      message: "Agency wise hosts fetched successfully",
      total: totalHosts,
      hosts,
    });
  } catch (error) {
    console.error("listAgencyHosts error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
    });
  }
};

//create host
exports.createHost = async (req, res) => {
  try {
    const { name, bio, dob, gender, countryFlagImage, country, language, impression, email } = req.body;

    if (
      !name ||
      !gender ||
      !req.files ||
      !Array.isArray(req.files.image) ||
      req.files.image.length === 0
    ) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({
        status: false,
        message: "Missing required host details (name, gender) or profile image file.",
      });
    }

    const hasInvalidFile = (arr) => arr?.some((file) => !file?.path);

    if (
      hasInvalidFile(req.files.image) ||
      (req.files.video && hasInvalidFile(req.files.video)) ||
      (req.files.liveVideo && hasInvalidFile(req.files.liveVideo)) ||
      (req.files.photoGallery && hasInvalidFile(req.files.photoGallery))
    ) {
      deleteFiles(req.files);
      return res.status(200).json({
        status: false,
        message: "Invalid file(s) uploaded. Ensure files are uploaded properly without 'url' fields.",
      });
    }

    const targetEmail = (email && email.trim()) ? email.trim() : `aihost_${Date.now()}_${Math.floor(Math.random() * 1000)}@quietchat.com`;
    const [uniqueId, existingHost] = await Promise.all([generateUniqueId(), Host.findOne({ email: targetEmail }).select("_id").lean()]);

    if (existingHost) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({
        status: false,
        message: "A host profile with this email already exists.",
      });
    }

    const newHost = new Host({
      name,
      email: targetEmail,
      bio: bio || "",
      dob: dob || "",
      gender,
      countryFlagImage: countryFlagImage || "",
      country: country || "",
      language: parseArrayField(language),
      impression: parseArrayField(impression),

      // AI Host Persona Prompt Fields
      surname: req.body.surname || "",
      birthdateFreeText: req.body.birthdateFreeText || "",
      whereFrom: req.body.whereFrom || "",
      workOrStudy: req.body.workOrStudy || "",
      motherName: req.body.motherName || "",
      fatherName: req.body.fatherName || "",
      siblings: parseArrayField(req.body.siblings),
      looksLike: req.body.looksLike || "",
      normalDay: req.body.normalDay || "",
      textingStyle: req.body.textingStyle || "",
      howFlirts: req.body.howFlirts || "",
      quirksAndHabits: req.body.quirksAndHabits || "",
      openingLine: req.body.openingLine || "",
      lifeStory: req.body.lifeStory || "",
      happyMemories: parseArrayField(req.body.happyMemories),
      painfulMemories: parseArrayField(req.body.painfulMemories),
      pastRelationship: req.body.pastRelationship || "",
      fearsInsecurities: req.body.fearsInsecurities || "",
      dreamsGoals: req.body.dreamsGoals || "",
      values: req.body.values || "",
      likes: parseArrayField(req.body.likes),
      dislikes: parseArrayField(req.body.dislikes),
      hobbies: parseArrayField(req.body.hobbies),
      secrets: parseArrayField(req.body.secrets),
      personality: parseArrayField(req.body.personality),
      textingLanguage: req.body.textingLanguage || "English",

      image: req.files.image ? req.files.image[0].path : "",
      photoGallery: req.files.photoGallery?.map((file) => file.path) || [],
      video: req.files.video?.map((file) => file.path) || [],
      profileVideo: req.files.profileVideo?.map((file) => file.path) || [],
      liveVideo: req.files.liveVideo?.map((file) => file.path) || [],
      uniqueId,
      status: 2,
      isFake: true,
      randomCallRate: settingJSON.generalRandomCallRate,
      randomCallFemaleRate: settingJSON.femaleRandomCallRate,
      randomCallMaleRate: settingJSON.maleRandomCallRate,
      privateCallRate: settingJSON.videoPrivateCallRate,
      audioCallRate: settingJSON.audioPrivateCallRate,
      chatRate: settingJSON.chatInteractionRate,
      useCustomCallRates: false,
      date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    });

    await newHost.save();

    return res.status(200).json({
      status: true,
      message: "Host created successfully.",
      host: newHost,
    });
  } catch (error) {
    if (req.files) deleteFiles(req.files);
    console.error("Create Host Error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Failed to create host profile due to server error.",
    });
  }
};

//update host
exports.updateHost = async (req, res) => {
  try {
    console.log("📥 req.body updateHost:", req.body);
    console.log("📁 req.files updateHost:", req.files);

    const {
      hostId,
      name,
      bio,
      dob,
      gender,
      countryFlagImage,
      country,
      language,
      impression,
      email,
      randomCallRate,
      randomCallFemaleRate,
      randomCallMaleRate,
      privateCallRate,
      audioCallRate,
      chatRate,
      removeProfileVideoIndex,
      removeLiveVideoIndex,
      removePhotoGalleryIndex,
      removeVideoIndexes,
    } = req.body;

    const arrayFields = ["removeProfileVideoIndex", "removeLiveVideoIndex", "removePhotoGalleryIndex", "removeVideoIndexes"];

    for (const key of arrayFields) {
      if (req.body[key]) {
        if (typeof req.body[key] === "string") {
          try {
            req.body[key] = JSON.parse(req.body[key]);
          } catch (e) {
            if (req.files) deleteFiles(req.files);
            return res.status(200).json({
              status: false,
              message: `Invalid format for '${key}'. It must be a valid JSON array.`,
            });
          }
        }

        if (!Array.isArray(req.body[key])) {
          if (req.files) deleteFiles(req.files);
          return res.status(200).json({
            status: false,
            message: `'${key}' must be an array.`,
          });
        }
      }
    }

    if (!hostId) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "Missing hostId." });
    }

    const [host, existingHost] = await Promise.all([
      Host.findById(hostId),
      email
        ? Host.findOne({ email: email.trim(), _id: { $ne: hostId } })
          .select("_id")
          .lean()
        : null,
    ]);

    if (!host) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "Host not found." });
    }

    if (existingHost) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "Email already in use." });
    }

    host.name = name || host.name;
    host.email = email || host.email;
    host.bio = bio !== undefined ? bio : host.bio;
    host.dob = dob !== undefined ? dob : host.dob;
    host.gender = gender || host.gender;
    host.countryFlagImage = countryFlagImage !== undefined ? countryFlagImage : host.countryFlagImage;
    host.country = country !== undefined ? country : host.country;
    host.impression = impression !== undefined ? parseArrayField(impression) : host.impression;
    host.language = language !== undefined ? parseArrayField(language) : host.language;

    // AI Host Persona Prompt Fields update
    if (req.body.surname !== undefined) host.surname = req.body.surname;
    if (req.body.birthdateFreeText !== undefined) host.birthdateFreeText = req.body.birthdateFreeText;
    if (req.body.whereFrom !== undefined) host.whereFrom = req.body.whereFrom;
    if (req.body.workOrStudy !== undefined) host.workOrStudy = req.body.workOrStudy;
    if (req.body.motherName !== undefined) host.motherName = req.body.motherName;
    if (req.body.fatherName !== undefined) host.fatherName = req.body.fatherName;
    if (req.body.siblings !== undefined) host.siblings = parseArrayField(req.body.siblings);
    if (req.body.looksLike !== undefined) host.looksLike = req.body.looksLike;
    if (req.body.normalDay !== undefined) host.normalDay = req.body.normalDay;
    if (req.body.textingStyle !== undefined) host.textingStyle = req.body.textingStyle;
    if (req.body.howFlirts !== undefined) host.howFlirts = req.body.howFlirts;
    if (req.body.quirksAndHabits !== undefined) host.quirksAndHabits = req.body.quirksAndHabits;
    if (req.body.openingLine !== undefined) host.openingLine = req.body.openingLine;
    if (req.body.lifeStory !== undefined) host.lifeStory = req.body.lifeStory;
    if (req.body.happyMemories !== undefined) host.happyMemories = parseArrayField(req.body.happyMemories);
    if (req.body.painfulMemories !== undefined) host.painfulMemories = parseArrayField(req.body.painfulMemories);
    if (req.body.pastRelationship !== undefined) host.pastRelationship = req.body.pastRelationship;
    if (req.body.fearsInsecurities !== undefined) host.fearsInsecurities = req.body.fearsInsecurities;
    if (req.body.dreamsGoals !== undefined) host.dreamsGoals = req.body.dreamsGoals;
    if (req.body.values !== undefined) host.values = req.body.values;
    if (req.body.likes !== undefined) host.likes = parseArrayField(req.body.likes);
    if (req.body.dislikes !== undefined) host.dislikes = parseArrayField(req.body.dislikes);
    if (req.body.hobbies !== undefined) host.hobbies = parseArrayField(req.body.hobbies);
    if (req.body.secrets !== undefined) host.secrets = parseArrayField(req.body.secrets);
    if (req.body.personality !== undefined) host.personality = parseArrayField(req.body.personality);
    if (req.body.textingLanguage !== undefined) host.textingLanguage = req.body.textingLanguage;

    const parseTruthy = (v) => v === true || v === "true" || v === 1 || v === "1";
    const useGlobal = parseTruthy(req.body.useGlobalCallRates);
    const rateKeys = ["randomCallRate", "randomCallFemaleRate", "randomCallMaleRate", "privateCallRate", "audioCallRate", "chatRate"];
    const rateTouched = rateKeys.filter((k) => Object.prototype.hasOwnProperty.call(req.body, k));

    if (useGlobal) {
      host.useCustomCallRates = false;
    } else if (rateTouched.length) {
      host.useCustomCallRates = true;
      const applyNum = (key) => {
        if (!Object.prototype.hasOwnProperty.call(req.body, key)) return;
        const n = Number(req.body[key]);
        if (Number.isFinite(n)) host[key] = n;
      };
      rateKeys.forEach(applyNum);
    }

    if (req.files?.image?.[0]) {
      if (host.image && fs.existsSync(host.image)) {
        const imageName = host.image.split("/").pop();
        if (!["male.png", "female.png"].includes(imageName)) {
          fs.unlinkSync(host.image);
          console.log("🗑️ Deleted previous image:", host.image);
        }
      }
      host.image = req.files.image[0].path;
      console.log("🆕 Updated image:", host.image);
    }

    if (Array.isArray(req.body.removePhotoGalleryIndex)) {
      const sorted = req.body.removePhotoGalleryIndex
        .map(Number)
        .filter((i) => !isNaN(i))
        .sort((a, b) => b - a);
      for (const i of sorted) {
        const filePath = host.photoGallery?.[i];
        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Deleted photoGallery[${i}]: ${filePath}`);
        }
        host.photoGallery.splice(i, 1);
      }
    }

    if (req.files?.photoGallery) {
      const newPhotos = req.files.photoGallery.filter((f) => f?.path).map((f) => f.path);
      host.photoGallery = [...(host.photoGallery || []), ...newPhotos];
      newPhotos.forEach((path, idx) => console.log(`🆕 Added photoGallery[${host.photoGallery.length - newPhotos.length + idx}]: ${path}`));
    }

    if (Array.isArray(req.body.removeVideoIndexes)) {
      const sorted = req.body.removeVideoIndexes
        .map(Number)
        .filter((i) => !isNaN(i))
        .sort((a, b) => b - a);
      for (const i of sorted) {
        const videoPath = host.video?.[i];
        if (videoPath && fs.existsSync(videoPath)) {
          fs.unlinkSync(videoPath);
          console.log(`🗑️ Deleted video[${i}]: ${videoPath}`);
        }
        host.video.splice(i, 1);
      }
    }

    if (req.files?.video?.length) {
      const newVideos = req.files.video.map((file) => file.path);
      host.video = host.video.concat(newVideos);
      newVideos.forEach((path, idx) => console.log(`🆕 Added video[${host.video.length - newVideos.length + idx}]: ${path}`));
    }

    if (Array.isArray(req.body.removeLiveVideoIndex)) {
      const sorted = req.body.removeLiveVideoIndex
        .map(Number)
        .filter((i) => !isNaN(i))
        .sort((a, b) => b - a);
      for (const i of sorted) {
        const filePath = host.liveVideo?.[i];
        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Deleted liveVideo[${i}]: ${filePath}`);
        }
        host.liveVideo.splice(i, 1);
      }
    }

    if (req.files?.liveVideo) {
      const newVideos = req.files.liveVideo.filter((f) => f?.path).map((f) => f.path);
      host.liveVideo = [...(host.liveVideo || []), ...newVideos];
      newVideos.forEach((path, idx) => console.log(`🆕 Added liveVideo[${host.liveVideo.length - newVideos.length + idx}]: ${path}`));
    }

    if (Array.isArray(req.body.removeProfileVideoIndex)) {
      const sorted = req.body.removeProfileVideoIndex
        .map(Number)
        .filter((i) => !isNaN(i))
        .sort((a, b) => b - a);
      for (const i of sorted) {
        const filePath = host.profileVideo?.[i];
        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Deleted profileVideo[${i}]: ${filePath}`);
        }
        host.profileVideo.splice(i, 1);
      }
    }

    if (req.files?.profileVideo) {
      const newVideos = req.files.profileVideo.filter((f) => f?.path).map((f) => f.path);
      host.profileVideo = [...(host.profileVideo || []), ...newVideos];
      newVideos.forEach((path, idx) => console.log(`🆕 Added profileVideo[${host.profileVideo.length - newVideos.length + idx}]: ${path}`));
    }

    await host.save();

    console.log("✅ Final image:", host.image);
    console.log("✅ Final photoGallery:", host.photoGallery);
    console.log("✅ Final video:", host.video);
    console.log("✅ Final liveVideo:", host.liveVideo);
    console.log("✅ Final profileVideo:", host.profileVideo);

    return res.status(200).json({
      status: true,
      message: "Host profile updated successfully.",
      host,
    });
  } catch (error) {
    if (req.files) deleteFiles(req.files);
    console.error("❌ Update Host Error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Failed to update host profile due to server error.",
    });
  }
};

//toggle host status
exports.toggleHostStatusByType = async (req, res) => {
  try {
    const { hostId, type } = req.query;

    if (!hostId || !type) {
      return res.status(200).json({ status: false, message: "Host ID and type are required!" });
    }

    if (!mongoose.Types.ObjectId.isValid(hostId)) {
      return res.status(200).json({ status: false, message: "Invalid hostId format." });
    }

    const validTypes = ["isBlock", "isBusy", "isLive"];
    if (!validTypes.includes(type)) {
      return res.status(200).json({
        status: false,
        message: `Invalid type. Valid types: ${validTypes.join(", ")}`,
      });
    }

    const host = await Host.findOne({ _id: hostId });
    if (!host) {
      return res.status(200).json({ status: false, message: "Host not found." });
    }

    host[type] = !host[type];

    if (type === "isBlock") {
      if (host.isBlock) {
        // When host is disabled/blocked, immediately mark offline and unbusy
        host.isOnline = false;
        host.isBusy = false;
        host.isLive = false;
      } else {
        // When unblocked, fake hosts are online by default
        if (host.isFake) {
          host.isOnline = true;
        }
      }
    }

    await host.save();

    return res.status(200).json({
      status: true,
      message: `Host ${type} status has been ${host[type] ? "enabled" : "disabled"} successfully.`,
      data: host,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Admin: force-end host live (same cleanup + socket signal as client "liveStreamEnd")
exports.terminateHostLive = async (req, res) => {
  try {
    const { hostId } = req.query;

    if (!hostId) {
      return res.status(200).json({ status: false, message: "Host ID is required." });
    }

    if (!mongoose.Types.ObjectId.isValid(hostId)) {
      return res.status(200).json({ status: false, message: "Invalid hostId format." });
    }

    const host = await Host.findById(hostId).select("_id name isLive isBusy liveHistoryId fcmToken").lean();
    if (!host) {
      return res.status(200).json({ status: false, message: "Host not found." });
    }

    if (!host.isLive || !host.liveHistoryId) {
      return res.status(200).json({ status: false, message: "Host is not live." });
    }

    const liveHistoryId = host.liveHistoryId.toString();
    const hostObjectId = host._id;
    const payloadStr = JSON.stringify({
      hostId: hostObjectId.toString(),
      liveHistoryId,
      terminatedBy: "admin",
      title: "Live ended by Admin",
      body: "Your live session was ended by admin due to policy/quality reasons. You can go live again after a while. If you think this is a mistake, contact support.",
    });

    const liveHistory = await LiveBroadcastHistory.findById(host.liveHistoryId)
      .select("_id startTime endTime duration")
      .lean();

    if (global.io) {
      global.io.in(liveHistoryId).emit("liveStreamEnd", payloadStr);
      // Optional explicit event for newer apps (keep liveStreamEnd for backward compatibility)
      global.io.in(liveHistoryId).emit("host_live_terminated", payloadStr);
    }

    const endTime = moment().tz("Asia/Kolkata").format();
    let duration = "00:00:00";
    if (liveHistory?.startTime) {
      const start = moment.tz(liveHistory.startTime, "Asia/Kolkata");
      const end = moment.tz(endTime, "Asia/Kolkata");
      duration = moment.utc(end.diff(start)).format("HH:mm:ss");
    }

    await Promise.all([
      liveHistory?._id
        ? LiveBroadcastHistory.updateOne({ _id: liveHistory._id }, { $set: { endTime, duration } })
        : Promise.resolve(),
      Host.updateOne(
        { _id: hostObjectId, isLive: true, liveHistoryId: host.liveHistoryId },
        { $set: { isLive: false, isBusy: false, liveHistoryId: null } }
      ),
      LiveBroadcastView.deleteMany({ liveHistoryId: host.liveHistoryId }),
      LiveBroadcaster.deleteMany({ hostId: hostObjectId, liveHistoryId: host.liveHistoryId }),
    ]);

    if (global.io) {
      try {
        const sockets = await global.io.in(liveHistoryId).fetchSockets();
        if (sockets.length) {
          global.io.socketsLeave(liveHistoryId);
        }
      } catch (e) {
        console.error("[terminateHostLive] socketsLeave:", e);
      }
    }

    const hostAfter = await Host.findById(hostObjectId).select("_id isOnline isBusy isLive updatedAt").lean();
    if (hostAfter && global.io) {
      const status = getHostPresenceStatus(hostAfter);
      const updatedAt = hostAfter.updatedAt ? hostAfter.updatedAt.getTime() : Date.now();
      presenceStore.setHostPresence(hostAfter._id.toString(), {
        status,
        updatedAt,
        isOnline: hostAfter.isOnline,
        isBusy: hostAfter.isBusy,
        isLive: hostAfter.isLive,
      });
      global.io.emit("host_status_changed", {
        hostId: hostAfter._id.toString(),
        status,
        updatedAt,
      });
    }

    // Push notification to host device (if token exists)
    if (host?.fcmToken) {
      try {
        const payload = {
          token: host.fcmToken,
          data: {
            title: "Live ended by Admin",
            body: "Your live session was ended by admin. Please review guidelines and try again later.",
            type: "LIVE_TERMINATED",
            hostId: hostObjectId.toString(),
            liveHistoryId,
          },
        };
        const adminInstance = await admin;
        adminInstance.messaging().send(payload).catch((err) => {
          console.error("[terminateHostLive] FCM error:", err.message);
        });
      } catch (e) {
        console.error("[terminateHostLive] FCM exception:", e?.message || e);
      }
    }

    return res.status(200).json({
      status: true,
      message: "Live session terminated.",
      data: { _id: hostObjectId.toString(), isLive: false, isBusy: false, liveHistoryId: null },
    });
  } catch (error) {
    console.error("terminateHostLive:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//get host's profile
exports.fetchHostProfile = async (req, res) => {
  try {
    const { hostId } = req.query;

    if (!hostId) {
      return res.status(200).json({ status: false, message: "Host ID must be required!" });
    }

    if (!mongoose.Types.ObjectId.isValid(hostId)) {
      return res.status(200).json({ status: false, message: "Invalid hostId format." });
    }

    const [hostDoc] = await Promise.all([Host.findOne({ _id: hostId }).populate("agencyId", "name image agencyCode")]);

    if (!hostDoc) {
      return res.status(200).json({ status: false, message: "Host not found." });
    }

    const hostPlain = hostDoc.toObject ? hostDoc.toObject() : hostDoc;
    const linkedUser = hostPlain?.userId ? await User.findById(hostPlain.userId).select("phone").lean() : null;
    const eff = resolveHostCallRates(hostPlain, settingJSON || {});
    const host = {
      ...hostPlain,
      phone: linkedUser?.phone || "",
      randomCallRate: eff.randomCallRate,
      randomCallFemaleRate: eff.randomCallFemaleRate,
      randomCallMaleRate: eff.randomCallMaleRate,
      privateCallRate: eff.privateCallRate,
      audioCallRate: eff.audioCallRate,
      chatRate: eff.chatRate,
      useCustomCallRates: hostPlain.useCustomCallRates === true,
    };

    const profileCheck = evaluateProfile({
      name: host.name,
      gender: host.gender,
      dob: host.dob,
      image: host.image,
    });

    return res.status(200).json({
      status: true,
      message: "Host profile retrieved successfully.",
      host,
      profileComplete: profileCheck.complete,
      missingProfileFields: profileCheck.missingFields,
      profileErrors: profileCheck.errors,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

const seedDefaultAiHostsIfEmpty = async () => {
  try {
    const fakeCount = await Host.countDocuments({ isFake: true });
    if (fakeCount > 0) return;

    console.log("🌱 No AI Hosts found in Node.js DB. Fetching from Python AI Service or seed file...");
    let profiles = [];
    try {
      const res = await axios.get("http://localhost:8000/api/profiles", {
        headers: { "X-API-Key": "generate-a-long-random-string" },
        timeout: 3000
      });
      if (Array.isArray(res.data) && res.data.length > 0) {
        profiles = res.data;
      }
    } catch (e) {
      console.warn("Could not fetch from Python AI API, attempting to load profiles_seed.json...");
    }

    if (!profiles || profiles.length === 0) {
      const seedPath = "d:/Projects/ai-quietchat/scripts/profiles_seed.json";
      if (fs.existsSync(seedPath)) {
        profiles = JSON.parse(fs.readFileSync(seedPath, "utf-8"));
      }
    }

    if (!Array.isArray(profiles) || profiles.length === 0) return;

    for (const p of profiles) {
      const cleanName = (p.name || "").trim();
      if (!cleanName) continue;

      const existing = await Host.findOne({
        name: { $regex: `^${cleanName}$`, $options: "i" },
        isFake: true,
      });
      if (existing) continue;

      const uniqueId = await generateUniqueId();
      const newHost = new Host({
        name: cleanName,
        surname: p.surname || "",
        email: `${(p.name || "ai").toLowerCase()}_${Date.now()}_${Math.floor(Math.random()*1000)}@quietchat.com`,
        bio: p.bio || p.greeting || "AI Host",
        dob: p.birthdate || p.dob || "01/01/2000",
        birthdateFreeText: p.birthdate || "",
        age: p.age || 22,
        gender: p.gender || "female",
        country: p.home_place || "India",
        countryFlagImage: "https://flagcdn.com/w320/in.png",
        whereFrom: p.home_place || "",
        workOrStudy: p.occupation || "",
        motherName: p.mother_name || "",
        fatherName: p.father_name || "",
        siblings: p.siblings || [],
        looksLike: p.appearance || "",
        normalDay: p.daily_routine || "",
        textingStyle: p.texting_style || "",
        howFlirts: p.flirting_style || "",
        quirksAndHabits: p.quirks || "",
        openingLine: p.greeting || "",
        lifeStory: p.bio || "",
        happyMemories: p.happy_memories || [],
        painfulMemories: p.painful_memories || [],
        pastRelationship: p.ex || "",
        fearsInsecurities: p.fears || "",
        dreamsGoals: p.dreams || "",
        values: p.values || "",
        likes: p.likes || [],
        dislikes: p.dislikes || [],
        hobbies: p.hobbies || [],
        secrets: p.secrets || [],
        personality: p.personality || [],
        textingLanguage: p.language || "English",
        impression: p.personality || ["Friendly"],
        language: [p.language || "English"],
        image: p.gender === "male" ? "male.png" : "female.png",
        photoGallery: [],
        video: [],
        profileVideo: [],
        liveVideo: [],
        uniqueId,
        status: 2,
        isFake: true,
        isOnline: true,
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      });
      await newHost.save();
    }
    console.log(`✅ Seeded ${profiles.length} AI Hosts into Node.js database.`);
  } catch (err) {
    console.error("Error seeding default AI hosts:", err);
  }
};

//get hosts
exports.fetchHostList = async (req, res) => {
  try {
    if (!req.query.type) {
      return res.status(200).json({ status: false, message: "Host type is required!" });
    }

    const hostType = parseInt(req.query.type);
    if (hostType === 2) {
      await seedDefaultAiHostsIfEmpty();
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const search = req.query.search || "";
    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";

    // New filters for status / country / gender / language / rates / sort
    const statusFilter = (req.query.status || "all").toString().toLowerCase(); // online|offline|on_call|live|all
    const countryFilter = req.query.country ? req.query.country.toString().toLowerCase() : "";
    const genderFilter = req.query.gender ? req.query.gender.toString().toLowerCase() : "";
    const sortBy = (req.query.sortBy || "online_status").toString();
    const sortOrder = (req.query.sortOrder || "desc").toString().toLowerCase() === "asc" ? 1 : -1;

    // languages[] can come as languages or languages[]
    let languagesFilter = [];
    const langParam = req.query.languages || req.query["languages[]"];
    if (Array.isArray(langParam)) {
      languagesFilter = langParam.map((l) => l.toString().toLowerCase()).filter(Boolean);
    } else if (langParam) {
      languagesFilter = [langParam.toString().toLowerCase()];
    }

    const minAudioRate = req.query.minAudioRate ? Number(req.query.minAudioRate) : null;
    const maxAudioRate = req.query.maxAudioRate ? Number(req.query.maxAudioRate) : null;
    const minVideoRate = req.query.minVideoRate ? Number(req.query.minVideoRate) : null;
    const maxVideoRate = req.query.maxVideoRate ? Number(req.query.maxVideoRate) : null;
    const minRandomRate = req.query.minRandomRate ? Number(req.query.minRandomRate) : null;
    const maxRandomRate = req.query.maxRandomRate ? Number(req.query.maxRandomRate) : null;

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

    const rateFilter = {};
    if (minAudioRate != null || maxAudioRate != null) {
      rateFilter.audioCallRate = {};
      if (minAudioRate != null) rateFilter.audioCallRate.$gte = minAudioRate;
      if (maxAudioRate != null) rateFilter.audioCallRate.$lte = maxAudioRate;
    }
    if (minVideoRate != null || maxVideoRate != null) {
      rateFilter.privateCallRate = {};
      if (minVideoRate != null) rateFilter.privateCallRate.$gte = minVideoRate;
      if (maxVideoRate != null) rateFilter.privateCallRate.$lte = maxVideoRate;
    }
    if (minRandomRate != null || maxRandomRate != null) {
      rateFilter.randomCallRate = {};
      if (minRandomRate != null) rateFilter.randomCallRate.$gte = minRandomRate;
      if (maxRandomRate != null) rateFilter.randomCallRate.$lte = maxRandomRate;
    }

    const filter = {
      ...dateFilterQuery,
      ...rateFilter,
      status: 2,
      isFake: hostType === 1 ? false : true,
      ...(countryFilter ? { country: countryFilter } : {}),
      ...(genderFilter ? { gender: genderFilter } : {}),
      ...(languagesFilter.length
        ? {
          language: {
            $elemMatch: {
              $in: languagesFilter,
            },
          },
        }
        : {}),
    };

    // Status based filter (online / on_call / offline)
    const statusMatch = {};
    if (statusFilter === "online") {
      statusMatch.isOnline = true;
      statusMatch.isBusy = false;
      statusMatch.isLive = false;
    } else if (statusFilter === "on_call") {
      statusMatch.isBusy = true;
    } else if (statusFilter === "live") {
      statusMatch.isLive = true;
    } else if (statusFilter === "offline") {
      statusMatch.isOnline = false;
      statusMatch.isBusy = false;
      statusMatch.isLive = false;
    }

    const combinedMatch = Object.keys(statusMatch).length ? { ...filter, ...statusMatch } : filter;

    const [totalHosts, hostList, statusStats] = await Promise.all([
      Host.countDocuments(combinedMatch),
      Host.aggregate([
        { $match: combinedMatch },
        {
          $lookup: {
            from: "followerfollowings",
            localField: "_id",
            foreignField: "followingId",
            as: "followers",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userId",
          },
        },
        { $unwind: { path: "$userId", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "agencies",
            localField: "agencyId",
            foreignField: "_id",
            as: "agencyId",
          },
        },
        { $unwind: { path: "$agencyId", preserveNullAndEmptyArrays: true } },

        ...(search && search !== "All"
          ? [
            {
              $match: {
                $or: [
                  { "userId.name": { $regex: search, $options: "i" } },
                  { "userId.uniqueId": { $regex: search, $options: "i" } },
                  { "userId.phone": { $regex: search, $options: "i" } },

                  { "agencyId.name": { $regex: search, $options: "i" } },
                  { "agencyId.agencyCode": { $regex: search, $options: "i" } },

                  { name: { $regex: search, $options: "i" } },
                  { uniqueId: { $regex: search, $options: "i" } },
                  { email: { $regex: search, $options: "i" } },
                ],
              },
            },
          ]
          : []),

        {
          $addFields: {
            totalFollowers: { $size: "$followers" },
            statusText: {
              $switch: {
                branches: [
                  {
                    case: { $and: [{ $eq: ["$isOnline", true] }, { $eq: ["$isLive", true] }, { $eq: ["$isBusy", true] }] },
                    then: "Live",
                  },
                  {
                    case: { $and: [{ $eq: ["$isOnline", true] }, { $eq: ["$isBusy", true] }] },
                    then: "Busy",
                  },
                  {
                    case: { $eq: ["$isOnline", true] },
                    then: "Online",
                  },
                ],
                default: "Offline",
              },
            },
            statusRank: {
              $switch: {
                branches: [
                  { case: { $eq: ["$statusText", "Live"] }, then: 1 },
                  { case: { $eq: ["$statusText", "Online"] }, then: 2 },
                  { case: { $eq: ["$statusText", "Busy"] }, then: 3 },
                  { case: { $eq: ["$statusText", "Offline"] }, then: 4 },
                ],
                default: 5,
              },
            },
          },
        },
        {
          $project: {
            name: 1,
            gender: 1,
            bio: 1,
            age: 1,
            dob: 1,
            email: 1,
            phone: "$userId.phone",
            image: 1,
            video: 1,
            liveVideo: 1,
            profileVideo: 1,
            impression: 1,
            identityProofType: 1,
            identityProof: 1,
            photoGallery: 1,
            uniqueId: 1,
            isBlock: 1,
            isOnline: 1,
            isBusy: 1,
            isLive: 1,
            countryFlagImage: 1,
            country: 1,
            photoGallery: 1,
            randomCallRate: 1,
            randomCallFemaleRate: 1,
            randomCallMaleRate: 1,
            privateCallRate: 1,
            audioCallRate: 1,
            chatRate: 1,
            useCustomCallRates: 1,
            coin: 1,
            totalGifts: 1,
            language: 1,
            totalFollowers: 1,
            createdAt: 1,
            statusText: 1,
            statusRank: 1,
            "userId._id": 1,
            "userId.name": 1,
            "userId.image": 1,
            "userId.uniqueId": 1,
            "userId.phone": 1,
            "agencyId._id": 1,
            "agencyId.name": 1,
            "agencyId.image": 1,
            "agencyId.agencyCode": 1,
          },
        },
        {
          $sort:
            sortBy === "online_status"
              ? { statusRank: 1, createdAt: -1 }
              : sortBy === "createdAt"
                ? { createdAt: sortOrder }
                : { statusRank: 1, createdAt: -1 },
        },
        { $skip: (start - 1) * limit },
        { $limit: limit },
      ]),
      // Status breakdown counts for current filtered set (before pagination)
      Host.aggregate([
        { $match: combinedMatch },
        {
          $addFields: {
            statusText: {
              $switch: {
                branches: [
                  {
                    case: { $and: [{ $eq: ["$isOnline", true] }, { $eq: ["$isLive", true] }, { $eq: ["$isBusy", true] }] },
                    then: "Live",
                  },
                  {
                    case: { $and: [{ $eq: ["$isOnline", true] }, { $eq: ["$isBusy", true] }] },
                    then: "Busy",
                  },
                  {
                    case: { $eq: ["$isOnline", true] },
                    then: "Online",
                  },
                ],
                default: "Offline",
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalHosts: { $sum: 1 },
            onlineCount: {
              $sum: {
                $cond: [{ $eq: ["$statusText", "Online"] }, 1, 0],
              },
            },
            onCallCount: {
              $sum: {
                $cond: [{ $eq: ["$statusText", "Busy"] }, 1, 0],
              },
            },
            offlineCount: {
              $sum: {
                $cond: [{ $eq: ["$statusText", "Offline"] }, 1, 0],
              },
            },
            femaleCount: {
              $sum: {
                $cond: [{ $eq: [{ $toLower: "$gender" }, "female"] }, 1, 0],
              },
            },
            maleCount: {
              $sum: {
                $cond: [{ $eq: [{ $toLower: "$gender" }, "male"] }, 1, 0],
              },
            },
          },
        },
      ]),
    ]);

    const statsDoc = statusStats?.[0] || {};

    // ─── Calculate Interaction & Chat Metrics for Page Hosts ─────────
    const pageHostIds = hostList.map((h) => h._id);
    const chatStatsMap = {};

    if (pageHostIds.length > 0) {
      const [topicAgg, hostChatAgg] = await Promise.all([
        ChatTopic.aggregate([
          {
            $match: {
              $or: [
                { senderId: { $in: pageHostIds } },
                { receiverId: { $in: pageHostIds } },
              ],
            },
          },
          {
            $project: {
              hostId: {
                $cond: [{ $in: ["$senderId", pageHostIds] }, "$senderId", "$receiverId"],
              },
              userId: {
                $cond: [{ $in: ["$senderId", pageHostIds] }, "$receiverId", "$senderId"],
              },
              messageCount: { $ifNull: ["$messageCount", 0] },
            },
          },
          {
            $group: {
              _id: "$hostId",
              totalMessages: { $sum: "$messageCount" },
              uniqueUsers: { $addToSet: "$userId" },
              regularUsers: {
                $sum: {
                  $cond: [{ $gte: ["$messageCount", 3] }, 1, 0],
                },
              },
            },
          },
        ]),
        Chat.aggregate([
          {
            $match: {
              senderId: { $in: pageHostIds },
            },
          },
          {
            $group: {
              _id: "$senderId",
              hostSentCount: { $sum: 1 },
            },
          },
        ]),
      ]);

      (topicAgg || []).forEach((t) => {
        const idStr = t._id.toString();
        chatStatsMap[idStr] = {
          totalUsers: (t.uniqueUsers || []).length,
          regularUsers: t.regularUsers || 0,
          totalMessages: t.totalMessages || 0,
          hostSentMessages: 0,
        };
      });

      (hostChatAgg || []).forEach((c) => {
        const idStr = c._id.toString();
        if (!chatStatsMap[idStr]) {
          chatStatsMap[idStr] = {
            totalUsers: 0,
            regularUsers: 0,
            totalMessages: 0,
            hostSentMessages: 0,
          };
        }
        chatStatsMap[idStr].hostSentMessages = c.hostSentCount || 0;
      });
    }

    // ─── Global AI Interaction Metrics for Top Summary Cards ──────────
    let totalChatUsers = 0;
    let mostInteractiveHost = null;
    let totalAiMessages = 0;

    if (hostType === 2) {
      const fakeHostIds = await Host.find({ isFake: true }).distinct("_id");
      if (fakeHostIds && fakeHostIds.length > 0) {
        const [globalUserAgg, topHostAgg] = await Promise.all([
          ChatTopic.aggregate([
            {
              $match: {
                $or: [
                  { senderId: { $in: fakeHostIds } },
                  { receiverId: { $in: fakeHostIds } },
                ],
              },
            },
            {
              $project: {
                userId: {
                  $cond: [{ $in: ["$senderId", fakeHostIds] }, "$receiverId", "$senderId"],
                },
                messageCount: { $ifNull: ["$messageCount", 0] },
              },
            },
            {
              $group: {
                _id: null,
                uniqueUsers: { $addToSet: "$userId" },
                totalMessages: { $sum: "$messageCount" },
              },
            },
          ]),
          ChatTopic.aggregate([
            {
              $match: {
                $or: [
                  { senderId: { $in: fakeHostIds } },
                  { receiverId: { $in: fakeHostIds } },
                ],
              },
            },
            {
              $project: {
                hostId: {
                  $cond: [{ $in: ["$senderId", fakeHostIds] }, "$senderId", "$receiverId"],
                },
                userId: {
                  $cond: [{ $in: ["$senderId", fakeHostIds] }, "$receiverId", "$senderId"],
                },
                messageCount: { $ifNull: ["$messageCount", 0] },
              },
            },
            {
              $group: {
                _id: "$hostId",
                users: { $addToSet: "$userId" },
                msgCount: { $sum: "$messageCount" },
              },
            },
            {
              $project: {
                _id: 1,
                userCount: { $size: "$users" },
                msgCount: 1,
              },
            },
            { $sort: { userCount: -1, msgCount: -1 } },
            { $limit: 1 },
          ]),
        ]);

        if (globalUserAgg && globalUserAgg.length > 0) {
          totalChatUsers = (globalUserAgg[0].uniqueUsers || []).length;
          totalAiMessages = globalUserAgg[0].totalMessages || 0;
        }

        if (topHostAgg && topHostAgg.length > 0) {
          const topHostDoc = await Host.findById(topHostAgg[0]._id).select("name uniqueId image gender").lean();
          if (topHostDoc) {
            mostInteractiveHost = {
              _id: topHostDoc._id,
              name: topHostDoc.name,
              uniqueId: topHostDoc.uniqueId,
              image: topHostDoc.image,
              gender: topHostDoc.gender,
              userCount: topHostAgg[0].userCount || 0,
              messageCount: topHostAgg[0].msgCount || 0,
            };
          }
        }
      }
    }

    const setting = settingJSON || {};
    const hostListDisplayed = hostList.map((h) => {
      const eff = resolveHostCallRates(h, setting);
      const hostStats = chatStatsMap[h._id.toString()] || {
        totalUsers: 0,
        regularUsers: 0,
        totalMessages: 0,
        hostSentMessages: 0,
      };

      return {
        ...h,
        randomCallRate: eff.randomCallRate,
        randomCallFemaleRate: eff.randomCallFemaleRate,
        randomCallMaleRate: eff.randomCallMaleRate,
        privateCallRate: eff.privateCallRate,
        audioCallRate: eff.audioCallRate,
        chatRate: eff.chatRate,
        totalUsers: hostStats.totalUsers,
        regularUsers: hostStats.regularUsers,
        totalMessages: hostStats.totalMessages,
        hostSentMessages: hostStats.hostSentMessages,
      };
    });

    return res.status(200).json({
      status: true,
      message: "Hosts retrieved successfully!",
      page: start,
      limit,
      totalHosts,
      femaleCount: statsDoc.femaleCount || 0,
      maleCount: statsDoc.maleCount || 0,
      onlineCount: statsDoc.onlineCount || 0,
      onCallCount: statsDoc.onCallCount || 0,
      offlineCount: statsDoc.offlineCount || 0,
      totalChatUsers,
      mostInteractiveHost,
      totalAiMessages,
      hostList: hostListDisplayed,
    });
  } catch (error) {
    console.error("Error fetching hosts:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//delete host
exports.deleteHost = async (req, res) => {
  try {
    const { hostId } = req.query;

    if (!hostId) {
      return res.status(200).json({
        status: false,
        message: "Missing or invalid host details. Please check and try again.",
      });
    }

    const host = await Host.findOne({ _id: hostId }).select("_id image photoGallery video liveVideo profileVideo").lean();

    if (!host) {
      return res.status(200).json({ status: false, message: "Host not found." });
    }

    res.status(200).json({
      status: true,
      message: "Host deleted successfully.",
    });

    if (host.image) {
      const imagePath = host.image.includes("storage") ? "storage" + host.image.split("storage")[1] : "";
      if (imagePath && fs.existsSync(imagePath)) {
        const imageName = imagePath.split("/").pop();
        if (!["male.png", "female.png"].includes(imageName)) {
          try {
            fs.unlinkSync(imagePath);
          } catch (error) {
            console.error(`Error deleting profile image: ${imagePath}`, error);
          }
        }
      }
    }

    if (Array.isArray(host.photoGallery) && host.photoGallery.length > 0) {
      for (const photoUrl of host.photoGallery) {
        if (photoUrl) {
          const photoGalleryPath = photoUrl?.split("storage");
          if (photoGalleryPath?.[1]) {
            const filePath = "storage" + photoGalleryPath[1];
            if (fs.existsSync(filePath)) {
              try {
                fs.unlinkSync(filePath);
              } catch (error) {
                console.error(`Error deleting gallery image: ${filePath}`, error);
              }
            }
          }
        }
      }
    }

    if (Array.isArray(host.video) && host.video.length > 0) {
      for (const videoUrl of host.video) {
        const videoPath = videoUrl?.split("storage");
        if (videoPath?.[1]) {
          const filePath = "storage" + videoPath[1];
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
            } catch (error) {
              console.error(`Error deleting gallery image: ${filePath}`, error);
            }
          }
        }
      }
    }

    if (Array.isArray(host.liveVideo) && host.liveVideo.length > 0) {
      for (const liveVideo of host.liveVideo) {
        const liveVideoPath = liveVideo?.split("storage");
        if (liveVideoPath?.[1]) {
          const filePath = "storage" + liveVideoPath[1];
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
            } catch (error) {
              console.error(`Error deleting gallery image: ${filePath}`, error);
            }
          }
        }
      }
    }

    if (Array.isArray(host.profileVideo) && host.profileVideo.length > 0) {
      for (const profileVideo of host.profileVideo) {
        const profileVideoPath = profileVideo?.split("storage");
        if (profileVideoPath?.[1]) {
          const filePath = "storage" + profileVideoPath[1];
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
            } catch (error) {
              console.error(`Error deleting gallery image: ${filePath}`, error);
            }
          }
        }
      }
    }

    await Host.deleteOne({ _id: hostId });
  } catch (error) {
    console.error("Delete Host Error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Failed to delete host due to server error.",
    });
  }
};
