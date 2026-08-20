const { HOST_REQUEST_STATUS } = require("../types/constant");

const mongoose = require("mongoose");

const hostSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: "Agency", default: null },

    name: { type: String, default: "" },
    gender: { type: String, default: "" },
    bio: { type: String, default: "" },
    age: { type: Number, default: 18 },
    dob: { type: String, default: "" },
    email: { type: String, default: "" },
    countryFlagImage: { type: String, default: "" },
    country: { type: String, trim: true, lowercase: true, default: "" },

    // AI Host Persona Prompt Fields
    surname: { type: String, default: "" },
    birthdateFreeText: { type: String, default: "" },
    whereFrom: { type: String, default: "" },
    workOrStudy: { type: String, default: "" },
    motherName: { type: String, default: "" },
    fatherName: { type: String, default: "" },
    siblings: { type: Array, default: [] },
    looksLike: { type: String, default: "" },
    normalDay: { type: String, default: "" },
    textingStyle: { type: String, default: "" },
    howFlirts: { type: String, default: "" },
    quirksAndHabits: { type: String, default: "" },
    openingLine: { type: String, default: "" },
    lifeStory: { type: String, default: "" },
    happyMemories: { type: Array, default: [] },
    painfulMemories: { type: Array, default: [] },
    pastRelationship: { type: String, default: "" },
    fearsInsecurities: { type: String, default: "" },
    dreamsGoals: { type: String, default: "" },
    values: { type: String, default: "" },
    likes: { type: Array, default: [] },
    dislikes: { type: Array, default: [] },
    hobbies: { type: Array, default: [] },
    secrets: { type: Array, default: [] },
    personality: { type: Array, default: [] },
    textingLanguage: { type: String, default: "English" },

    impression: { type: Array, default: [] },
    language: { type: Array, default: [] },
    identityProofType: { type: String, default: "" },
    identityProof: { type: Array, default: [] },
    image: { type: String, default: "" },
    photoGallery: { type: Array, default: [] },
    profileVideo: { type: Array, default: [] }, //profile video
    video: { type: Array, default: [] }, //videocall video
    liveVideo: { type: Array, default: [] }, //live video

    ipAddress: { type: String, default: "" },
    identity: { type: String, default: "" },
    fcmToken: { type: String, default: null },
    uniqueId: { type: String, unique: true, default: "" },

    status: { type: Number, enum: HOST_REQUEST_STATUS, default: 1 },
    reason: { type: String, default: "" },

    randomCallRate: { type: Number, default: 0 },
    randomCallFemaleRate: { type: Number, default: 0 },
    randomCallMaleRate: { type: Number, default: 0 },
    privateCallRate: { type: Number, default: 0 },
    audioCallRate: { type: Number, default: 0 },
    chatRate: { type: Number, default: 0 },
    /** When false/undefined, live rates come from global Setting; when true, host.* rate fields are used. */
    useCustomCallRates: { type: Boolean, default: false },

    coin: { type: Number, default: 0 },
    totalGifts: { type: Number, default: 0 },

    redeemedCoins: { type: Number, default: 0 },
    redeemedAmount: { type: Number, default: 0 },

    isBlock: { type: Boolean, default: false },
    isFake: { type: Boolean, default: false },

    isOnline: { type: Boolean, default: false },
    isBusy: { type: Boolean, default: false },

    callId: { type: String, default: null },

    isLive: { type: Boolean, default: false },
    liveHistoryId: { type: mongoose.Schema.Types.ObjectId, ref: "LiveBroadcastHistory", default: null },
    agoraUid: { type: Number, default: 0 },
    channel: { type: String, default: "" },
    token: { type: String, default: "" },

    date: { type: String, default: "" },
    /** Last time this host was seen active (socket connect / action). */
    lastActiveAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

hostSchema.index({ isOnline: 1, isBusy: 1, isFake: 1, isLive: 1, isBlock: 1, callId: 1 });
hostSchema.index({ isFake: 1 });
hostSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Host", hostSchema);
