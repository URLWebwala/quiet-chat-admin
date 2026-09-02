import axios from "axios";
import CryptoJS from "crypto-js";

const AI_API_BASE = process.env.NEXT_PUBLIC_AI_API_BASE || "https://ai.quietchat.in/api";
const AI_HMAC_SECRET = process.env.NEXT_PUBLIC_AI_HMAC_SECRET || "P~R920%(~BVUT.sDKe[M):h[=NNeF";

const aiClient = axios.create({
  baseURL: AI_API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
});

// Attach HMAC-SHA256 signed request headers for Dating AI Chat security contract (§2)
aiClient.interceptors.request.use((config) => {
  const method = (config.method || "GET").toUpperCase();

  let fullPath = config.url || "/";
  if (!fullPath.startsWith("/api")) {
    fullPath = `/api${fullPath.startsWith("/") ? "" : "/"}${fullPath}`;
  }

  if (config.params && Object.keys(config.params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(config.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      fullPath += (fullPath.includes("?") ? "&" : "?") + queryString;
    }
  }

  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);

  const bodyStr =
    config.data !== undefined && config.data !== null
      ? typeof config.data === "string"
        ? config.data
        : JSON.stringify(config.data)
      : "";

  const bodyHash = CryptoJS.SHA256(bodyStr).toString(CryptoJS.enc.Hex);
  const canonicalString = [method, fullPath, timestamp, nonce, bodyHash].join("\n");
  const signature = CryptoJS.HmacSHA256(canonicalString, AI_HMAC_SECRET).toString(CryptoJS.enc.Hex);

  config.headers["X-Timestamp"] = timestamp;
  config.headers["X-Nonce"] = nonce;
  config.headers["X-Signature"] = signature;
  config.headers["X-API-Key"] = AI_HMAC_SECRET;

  return config;
});

// --- INTERFACES ---
export interface AiProfile {
  id: string;
  _id?: string;
  profile_id?: string;
  name: string;
  surname?: string;
  gender: "female" | "male";
  age?: number;
  birthdate?: string;
  home_place?: string;
  mother_name?: string;
  father_name?: string;
  siblings?: string[];
  appearance?: string;
  occupation?: string;
  daily_routine?: string;
  quirks?: string;
  texting_style?: string;
  flirting_style?: string;
  bio?: string;
  happy_memories?: string[];
  painful_memories?: string[];
  ex?: string;
  fears?: string;
  dreams?: string;
  likes?: string[];
  dislikes?: string[];
  hobbies?: string[];
  values?: string;
  secrets?: string[];
  greeting?: string;
  personality?: string[];
  language?: string;
  type?: "local" | "global";
  timezone?: string;
  is_active?: boolean;
  prompt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AiExpert {
  id: string;
  _id?: string;
  category: string;
  specialty: string;
  tagline?: string;
  gender: "female" | "male";
  name: string;
  surname?: string;
  age?: number | null;
  home_place?: string;
  appearance?: string;
  occupation?: string;
  daily_routine?: string;
  bio?: string;
  likes?: string[];
  dislikes?: string[];
  hobbies?: string[];
  values?: string;
  quirks?: string;
  texting_style?: string;
  greeting?: string;
  type: "local" | "global";
  timezone?: string;
  language?: string;
  image?: string;
  photoGallery?: string[];
  video?: string[];
  chatRate?: number;
  chat_rate?: number;
  totalUsers?: number;
  connected_users?: number;
  regularUsers?: number;
  regular_users?: number;
  hostSentMessages?: number;
  expert_sent_messages?: number;
  totalMessages?: number;
  total_messages?: number;
  is_active?: boolean;
  prompt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AiConversation {
  conversation_id: string;
  profile_id: string;
  external_user_id?: string | null;
  user_gender: "male" | "female";
  user_name: string;
  pet_name?: string | null;
  stage?: string;
  status?: "active" | "blocked";
  details?: any[];
  last_tone?: string | null;
  last_emotion?: string | null;
  last_intent?: string | null;
  last_safety_label?: string | null;
  last_guard_hit?: string | null;
  received_gifts?: any[];
  message_count?: number;
  last_message_at?: string;
  created_at?: string;
}

export interface AiMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  created_at?: string;
  delay_ms?: number;
}

export interface AiFlag {
  id: string;
  conversation_id: string;
  message_id: string;
  message_text: string;
  safety_label: string;
  severity: "low" | "medium" | "high" | "critical";
  reason: string;
  status: "open" | "reviewed";
  created_at: string;
}

export interface AiGift {
  id: string;
  _id?: string;
  gender: "female" | "male";
  name: string;
  description: string;
  coin_price: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// --- DATING PROFILES ---
export const fetchAiProfiles = async (gender?: string, is_active?: boolean): Promise<AiProfile[]> => {
  try {
    const params: any = {};
    if (gender) params.gender = gender;
    if (is_active !== undefined) params.is_active = is_active;
    const res = await aiClient.get("/profiles", { params });
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.warn("fetchAiProfiles error:", err);
    return [];
  }
};

export const fetchSingleProfile = async (profileId: string): Promise<AiProfile | null> => {
  try {
    const res = await aiClient.get(`/profiles/${profileId}`);
    return res.data;
  } catch (err) {
    console.warn("fetchSingleProfile error:", err);
    return null;
  }
};

export const fetchProfileOptions = async (): Promise<{
  natures: string[];
  languages: string[];
  genders: string[];
  types?: string[];
  timezones?: string[];
} | null> => {
  try {
    const res = await aiClient.get("/profiles/options");
    return res.data;
  } catch (err) {
    console.warn("fetchProfileOptions error:", err);
    return null;
  }
};

export const importAiProfiles = async (rawJsonText: string): Promise<any> => {
  try {
    const res = await aiClient.post("/profiles/import", rawJsonText, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data;
  } catch (err: any) {
    console.warn("importAiProfiles error:", err);
    throw err?.response?.data?.detail || err;
  }
};

export const fetchImportPrompt = async (): Promise<string> => {
  try {
    const res = await aiClient.get("/profiles/import/prompt");
    return res.data?.text || "";
  } catch (err) {
    console.warn("fetchImportPrompt error:", err);
    return "";
  }
};

export const createAiProfile = async (profileData: any): Promise<any> => {
  try {
    const res = await aiClient.post("/profiles", profileData);
    return res.data;
  } catch (err) {
    console.warn("createAiProfile error:", err);
    throw err;
  }
};

export const updateAiProfile = async (profileId: string, profileData: any): Promise<any> => {
  try {
    const res = await aiClient.put(`/profiles/${profileId}`, profileData);
    return res.data;
  } catch (err) {
    console.warn("updateAiProfile error:", err);
    throw err;
  }
};

export const deleteAiProfile = async (profileId: string): Promise<boolean> => {
  try {
    await aiClient.delete(`/profiles/${profileId}`);
    return true;
  } catch (err) {
    console.warn("deleteAiProfile error:", err);
    return false;
  }
};

// --- TOPIC ADVISORS / EXPERTS (§4.9) ---
export const fetchAiExperts = async (
  gender?: string,
  is_active?: boolean,
  category?: string
): Promise<AiExpert[]> => {
  try {
    const params: any = {};
    if (gender) params.gender = gender;
    if (is_active !== undefined) params.is_active = is_active;
    if (category) params.category = category;
    const res = await aiClient.get("/experts", { params });
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.warn("fetchAiExperts error:", err);
    return [];
  }
};

export const fetchSingleExpert = async (expertId: string): Promise<AiExpert | null> => {
  try {
    const res = await aiClient.get(`/experts/${expertId}`);
    return res.data;
  } catch (err) {
    console.warn("fetchSingleExpert error:", err);
    return null;
  }
};

export const fetchExpertOptions = async (): Promise<{
  genders: string[];
  types: string[];
  timezones: string[];
  categories: string[];
} | null> => {
  try {
    const res = await aiClient.get("/experts/options");
    return res.data;
  } catch (err) {
    console.warn("fetchExpertOptions error:", err);
    return null;
  }
};

export const createAiExpert = async (expertData: any): Promise<any> => {
  try {
    const res = await aiClient.post("/experts", expertData);
    return res.data;
  } catch (err: any) {
    console.warn("createAiExpert error:", err);
    throw err?.response?.data?.detail || err;
  }
};

export const updateAiExpert = async (expertId: string, expertData: any): Promise<any> => {
  try {
    const res = await aiClient.put(`/experts/${expertId}`, expertData);
    return res.data;
  } catch (err: any) {
    console.warn("updateAiExpert error:", err);
    throw err?.response?.data?.detail || err;
  }
};

export const deleteAiExpert = async (expertId: string): Promise<boolean> => {
  try {
    await aiClient.delete(`/experts/${expertId}`);
    return true;
  } catch (err) {
    console.warn("deleteAiExpert error:", err);
    return false;
  }
};

export const fetchExpertImportPrompt = async (): Promise<string> => {
  try {
    const res = await aiClient.get("/experts/import/prompt");
    return res.data?.text || "";
  } catch (err) {
    console.warn("fetchExpertImportPrompt error:", err);
    return "";
  }
};

export const importAiExperts = async (rawJsonText: string): Promise<any> => {
  try {
    const res = await aiClient.post("/experts/import", rawJsonText, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data;
  } catch (err: any) {
    console.warn("importAiExperts error:", err);
    throw err?.response?.data?.detail || err;
  }
};

export const listAllPersonas = async (): Promise<(AiProfile | AiExpert)[]> => {
  const [profiles, experts] = await Promise.all([fetchAiProfiles(), fetchAiExperts()]);
  return [...profiles, ...experts];
};

// --- CONVERSATIONS & MESSAGES ---
export const fetchConversations = async (externalUserId?: string, profileId?: string): Promise<AiConversation[]> => {
  try {
    const params: any = {};
    if (externalUserId) params.external_user_id = externalUserId;
    if (profileId) params.profile_id = profileId;
    const res = await aiClient.get("/conversations", { params });
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.warn("fetchConversations error:", err);
    return [];
  }
};

export const fetchSingleConversation = async (conversationId: string): Promise<AiConversation | null> => {
  try {
    const res = await aiClient.get(`/conversations/${conversationId}`);
    return res.data;
  } catch (err) {
    console.warn("fetchSingleConversation error:", err);
    return null;
  }
};

export const createAiConversation = async (
  profileId: string,
  userName = "Admin",
  userGender = "male",
  externalUserId?: string
): Promise<AiConversation | null> => {
  try {
    const res = await aiClient.post("/conversations", {
      profile_id: profileId,
      user_gender: userGender,
      user_name: userName,
      external_user_id: externalUserId || undefined,
    });
    return res.data;
  } catch (err) {
    console.warn("createAiConversation error:", err);
    return null;
  }
};

export const updateConversation = async (conversationId: string, data: any): Promise<any> => {
  try {
    const res = await aiClient.patch(`/conversations/${conversationId}`, data);
    return res.data;
  } catch (err) {
    console.warn("updateConversation error:", err);
    return null;
  }
};

export const fetchAiMessages = async (conversationId: string, limit = 50, before?: string): Promise<AiMessage[]> => {
  try {
    const params: any = { limit };
    if (before) params.before = before;
    const res = await aiClient.get(`/conversations/${conversationId}/messages`, { params });
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.warn("fetchAiMessages error:", err);
    return [];
  }
};

export const sendAiMessage = async (
  conversationId: string,
  messageOrMessages: string | string[]
): Promise<{ reply?: string; messages?: { message: string; delay_ms?: number }[]; stage?: string; flagged?: boolean; gift?: any } | null> => {
  try {
    const payload = Array.isArray(messageOrMessages)
      ? { messages: messageOrMessages }
      : { message: messageOrMessages };
    const res = await aiClient.post(`/conversations/${conversationId}/messages`, payload);
    return res.data;
  } catch (err) {
    console.warn("sendAiMessage error:", err);
    return null;
  }
};

export const sendOpener = async (conversationId: string): Promise<any> => {
  try {
    const res = await aiClient.post(`/conversations/${conversationId}/opener`);
    return res.data;
  } catch (err) {
    console.warn("sendOpener error:", err);
    return null;
  }
};

export const sendNudge = async (conversationId: string): Promise<any> => {
  try {
    const res = await aiClient.post(`/conversations/${conversationId}/nudge`);
    return res.data;
  } catch (err) {
    console.warn("sendNudge error:", err);
    return null;
  }
};

export const sendGiftPurchase = async (conversationId: string, giftId: string): Promise<any> => {
  try {
    const res = await aiClient.post(`/conversations/${conversationId}/gifts`, { gift_id: giftId });
    return res.data;
  } catch (err) {
    console.warn("sendGiftPurchase error:", err);
    return null;
  }
};

// --- INSPECTOR & MEMORY DETAILS ---
export const fetchConversationDetails = async (conversationId: string): Promise<any[]> => {
  try {
    const res = await aiClient.get(`/conversations/${conversationId}/details`);
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.warn("fetchConversationDetails error:", err);
    return [];
  }
};

export const addConversationDetail = async (conversationId: string, detailData: any): Promise<any> => {
  try {
    const res = await aiClient.post(`/conversations/${conversationId}/details`, detailData);
    return res.data;
  } catch (err) {
    console.warn("addConversationDetail error:", err);
    return null;
  }
};

export const updateConversationDetail = async (conversationId: string, detailId: string, detailData: any): Promise<any> => {
  try {
    const res = await aiClient.patch(`/conversations/${conversationId}/details/${detailId}`, detailData);
    return res.data;
  } catch (err) {
    console.warn("updateConversationDetail error:", err);
    return null;
  }
};

export const deleteConversationDetail = async (conversationId: string, detailId: string): Promise<boolean> => {
  try {
    await aiClient.delete(`/conversations/${conversationId}/details/${detailId}`);
    return true;
  } catch (err) {
    console.warn("deleteConversationDetail error:", err);
    return false;
  }
};

// --- FLAGS & MODERATION ---
export const fetchFlags = async (status = "open", conversationId?: string): Promise<AiFlag[]> => {
  try {
    const params: any = { status };
    if (conversationId) params.conversation_id = conversationId;
    const res = await aiClient.get("/flags", { params });
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.warn("fetchFlags error:", err);
    return [];
  }
};

export const updateFlag = async (flagId: string, status = "reviewed"): Promise<AiFlag | null> => {
  try {
    const res = await aiClient.patch(`/flags/${flagId}`, { status });
    return res.data;
  } catch (err) {
    console.warn("updateFlag error:", err);
    return null;
  }
};

// --- VIRTUAL GIFTS ---
export const fetchAiGifts = async (gender?: string, is_active?: boolean): Promise<AiGift[]> => {
  try {
    const params: any = {};
    if (gender) params.gender = gender;
    if (is_active !== undefined) params.is_active = is_active;
    const res = await aiClient.get("/gifts", { params });
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.warn("fetchAiGifts error:", err);
    return [];
  }
};

export const fetchSingleGift = async (giftId: string): Promise<AiGift | null> => {
  try {
    const res = await aiClient.get(`/gifts/${giftId}`);
    return res.data;
  } catch (err) {
    console.warn("fetchSingleGift error:", err);
    return null;
  }
};

export const createAiGift = async (giftData: any): Promise<AiGift | null> => {
  try {
    const res = await aiClient.post("/gifts", giftData);
    return res.data;
  } catch (err) {
    console.warn("createAiGift error:", err);
    return null;
  }
};

export const updateAiGift = async (giftId: string, giftData: any): Promise<AiGift | null> => {
  try {
    const res = await aiClient.put(`/gifts/${giftId}`, giftData);
    return res.data;
  } catch (err) {
    console.warn("updateAiGift error:", err);
    return null;
  }
};

export const deleteAiGift = async (giftId: string): Promise<boolean> => {
  try {
    await aiClient.delete(`/gifts/${giftId}`);
    return true;
  } catch (err) {
    console.warn("deleteAiGift error:", err);
    return false;
  }
};

// --- AI SETTINGS ---
export const fetchAiSettings = async (): Promise<any> => {
  try {
    const res = await aiClient.get("/settings");
    return res.data;
  } catch (err) {
    console.warn("fetchAiSettings error:", err);
    return null;
  }
};

export const fetchAiSettingsOptions = async (): Promise<any> => {
  try {
    const res = await aiClient.get("/settings/options");
    return res.data;
  } catch (err) {
    console.warn("fetchAiSettingsOptions error:", err);
    return null;
  }
};

export const updateAiSettings = async (settingsData: any): Promise<any> => {
  try {
    const res = await aiClient.patch("/settings", settingsData);
    return res.data;
  } catch (err) {
    console.warn("updateAiSettings error:", err);
    return null;
  }
};

export const resetAnalyzerPrompt = async (): Promise<any> => {
  try {
    const res = await aiClient.post("/settings/analyzer-prompt/reset");
    return res.data;
  } catch (err) {
    console.warn("resetAnalyzerPrompt error:", err);
    return null;
  }
};
