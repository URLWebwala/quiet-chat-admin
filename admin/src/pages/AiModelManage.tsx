import React, { useEffect, useState, useMemo } from "react";
import RootLayout from "@/component/layout/Layout";
import Title from "@/extra/Title";
import { toast } from "react-toastify";
import axios from "axios";
import Image from "next/image";
import femaleAvatar from "@/assets/images/female.png";
import maleAvatar from "@/assets/images/male.png";
import { baseURL } from "@/utils/config";
import { fetchAiHosts } from "@/utils/aiChatApi";
import {
  FaUsers,
  FaComments,
  FaSearch,
  FaArrowLeft,
  FaUserCheck,
  FaBan,
  FaTrashAlt,
  FaCommentDots,
  FaCode,
  FaCopy,
  FaCheck,
  FaRobot,
  FaCalendarAlt,
  FaClock,
  FaExternalLinkAlt,
  FaTimes,
  FaSyncAlt,
  FaShieldAlt,
  FaHeart,
  FaPhotoVideo,
  FaPlus,
  FaVideo,
  FaImage,
  FaPlay,
} from "react-icons/fa";

interface ModelPostData {
  _id: string;
  hostSlug: string;
  title: string;
  description: string;
  mediaUrl: string;
  type: "photo" | "video";
  isActive: boolean;
  order: number;
  createdAt: string;
}

interface ModelCardData {
  id: string;
  name: string;
  slug: string;
  flavor: string;
  image: string;
  gender: string;
  age: number;
  city: string;
  tagline: string;
  bio: string;
  totalUsers: number;
  totalMessages: number;
  lastActive: string | null;
  source?: string;
  isBlock?: boolean;
}

interface ModelUserData {
  _id: string;
  hostSlug: string;
  hostName: string;
  name: string;
  email: string;
  gender: string;
  avatar?: string;
  isBlock: boolean;
  totalMessages: number;
  lastMessageAt: string | null;
  createdAt: string;
}

interface ModelUserChatMsg {
  _id: string;
  sender: "user" | "host";
  message: string;
  delayMs?: number;
  createdAt: string;
}

const FLAVOR_COLORS: { [key: string]: { bg: string; text: string; border: string } } = {
  "Sweet & Romantic": { bg: "#fdf2f8", text: "#db2777", border: "#fbcfe8" },
  "Playful & Teasing": { bg: "#faf5ff", text: "#9333ea", border: "#e9d5ff" },
  "Bold & Sassy": { bg: "#fff7ed", text: "#ea580c", border: "#fed7aa" },
  "Cute & Bubbly": { bg: "#fefce8", text: "#ca8a04", border: "#fef08a" },
  "Charming & Elegant": { bg: "#f0f9ff", text: "#0284c7", border: "#bae6fd" },
  "Glamorous & Flirty": { bg: "#fdf4ff", text: "#c026d3", border: "#f5d0fe" },
  "Caring & Supportive": { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  "Mysterious & Sultry": { bg: "#f8fafc", text: "#334155", border: "#cbd5e1" },
};

const getFlavorStyle = (flavor?: string) => {
  if (!flavor) return { bg: "#f3f4f6", text: "#4b5563", border: "#e5e7eb" };
  return FLAVOR_COLORS[flavor] || { bg: "#f3f4f6", text: "#4b5563", border: "#e5e7eb" };
};

// Helper to safely resolve full URL for storage/ or relative images
const resolveAvatar = (rawAvatar: any, gender: string = "female"): string => {
  if (!rawAvatar) return gender === "male" ? maleAvatar.src : femaleAvatar.src;
  const avatarSrc = typeof rawAvatar === "object" && rawAvatar?.src ? rawAvatar.src : rawAvatar;
  if (typeof avatarSrc !== "string" || !avatarSrc.trim()) {
    return gender === "male" ? maleAvatar.src : femaleAvatar.src;
  }
  if (
    avatarSrc.startsWith("http://") ||
    avatarSrc.startsWith("https://") ||
    avatarSrc.startsWith("data:")
  ) {
    return avatarSrc;
  }
  const cleanBase = (baseURL || "https://admin.quietchat.in").replace(/\/$/, "");
  const cleanPath = avatarSrc.startsWith("/") ? avatarSrc : `/${avatarSrc}`;
  return `${cleanBase}${cleanPath}`;
};

const AiModelManage = () => {
  // Global Models State
  const [loading, setLoading] = useState<boolean>(true);
  const [models, setModels] = useState<ModelCardData[]>([]);
  const [totalRegisteredUsers, setTotalRegisteredUsers] = useState<number>(0);
  const [totalMessages, setTotalMessages] = useState<number>(0);

  // Filters & Selection
  const [modelSearch, setModelSearch] = useState<string>("");
  const [selectedFlavor, setSelectedFlavor] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<ModelCardData | null>(null);

  // Selected Model's Users
  const [usersLoading, setUsersLoading] = useState<boolean>(false);
  const [modelUsers, setModelUsers] = useState<ModelUserData[]>([]);
  const [userSearch, setUserSearch] = useState<string>("");

  // Chat History Modal State
  const [activeChatUser, setActiveChatUser] = useState<ModelUserData | null>(null);
  const [chatMessages, setChatMessages] = useState<ModelUserChatMsg[]>([]);
  const [chatsLoading, setChatsLoading] = useState<boolean>(false);

  // API Integration Guide Modal State
  const [apiModalModel, setApiModalModel] = useState<ModelCardData | null>(null);
  const [copiedKey, setCopiedKey] = useState<string>("");

  // Sub-tab when a model is selected: "users" | "posts"
  const [modelTab, setModelTab] = useState<"users" | "posts">("users");

  // Feed Posts & Media State
  const [modelPosts, setModelPosts] = useState<ModelPostData[]>([]);
  const [postsLoading, setPostsLoading] = useState<boolean>(false);
  const [uploadingPost, setUploadingPost] = useState<boolean>(false);

  // New Post Modal State
  const [showAddPostModal, setShowAddPostModal] = useState<boolean>(false);
  const [newPostTitle, setNewPostTitle] = useState<string>("");
  const [newPostDesc, setNewPostDesc] = useState<string>("");
  const [newPostType, setNewPostType] = useState<"photo" | "video">("photo");
  const [newPostFile, setNewPostFile] = useState<File | null>(null);
  const [newPostPreview, setNewPostPreview] = useState<string>("");

  // Helper to resolve media URLs
  const resolveMediaUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:") || url.startsWith("data:")) return url;
    const clean = url.startsWith("/") ? url : `/${url}`;
    return `${apiBase}${clean}`;
  };

  // Normalized API base URL
  const apiBase = useMemo(() => {
    return (baseURL || "https://admin.quietchat.in/").replace(/\/$/, "");
  }, []);

  // 1. Fetch Models Summary (Strictly official AI Models only: Aisha, Riya, Sanya, Tara, Shanaya)
  const loadModelsSummary = async () => {
    setLoading(true);
    try {
      // Fetch official AI personas (same source as /AiModels)
      const officialHosts = await fetchAiHosts().catch(() => []);

      // Fetch user and message counts from backend
      const res = await axios
        .get(`${apiBase}/api/admin/model-manage/hosts-summary`)
        .catch(() => ({ data: { status: false, hosts: [], totalRegisteredUsers: 0, totalMessages: 0 } }));

      const backendHosts: any[] = res.data?.hosts || [];
      const statsMap = new Map<string, any>();
      backendHosts.forEach((bh) => {
        const slug = bh.slug || (bh.name ? bh.name.toLowerCase() : "");
        statsMap.set(slug, bh);
        if (bh.name) statsMap.set(bh.name.toLowerCase().trim(), bh);
      });

      const fallbackImages: Record<string, string> = {
        aisha: "storage/1795265677148.jpg",
        riya: "storage/1770636189581.jpg",
        sanya: "storage/1795268165609.jpg",
        tara: "storage/1795267494038.jpg",
        shanaya: "storage/1788543557169.jpg",
      };

      let merged: ModelCardData[] = [];

      if (officialHosts && officialHosts.length > 0) {
        merged = officialHosts.map((oh) => {
          let slug = oh.slug || (oh.name ? oh.name.toLowerCase() : "");
          let name = oh.name;
          if (slug === "meera-caring" || name.toLowerCase() === "meera") {
            name = "Shanaya";
            if (!slug || slug === "meera-caring") slug = "shanaya-prototype";
          }
          const s = statsMap.get(slug) || statsMap.get(name.toLowerCase()) || {};
          const fallback = fallbackImages[name.toLowerCase()] || "";
          const rawImg = s.image || (oh as any).image || (oh as any).avatar || (oh as any).avatar_url || fallback;
          return {
            id: oh.id || oh._id || slug,
            name: name,
            slug: slug,
            flavor: oh.flavor || "Sweet & Romantic",
            image: resolveAvatar(rawImg, oh.gender || "female"),
            gender: oh.gender || "female",
            age: oh.age || 22,
            city: oh.home_place || (oh as any).city || "Mumbai",
            tagline: oh.tagline || (oh as any).status || "",
            bio: oh.bio || "",
            totalUsers: s.totalUsers || 0,
            totalMessages: s.totalMessages || 0,
            lastActive: s.lastActive || null,
            isBlock: false,
            source: "ai-persona",
          };
        });
      } else if (backendHosts.length > 0) {
        // Fallback: strictly filter to official AI model names
        const allowedNames = ["aisha", "riya", "sanya", "tara", "shanaya", "meera"];
        merged = backendHosts
          .filter((bh) => allowedNames.includes((bh.name || "").toLowerCase().trim()))
          .map((bh) => {
            let name = bh.name;
            let slug = bh.slug;
            if (slug === "meera-caring" || name.toLowerCase() === "meera") {
              name = "Shanaya";
              if (!slug || slug === "meera-caring") slug = "shanaya-prototype";
            }
            const fallback = fallbackImages[name.toLowerCase()] || "";
            const rawImg = bh.image || fallback;
            return {
              ...bh,
              name,
              slug,
              image: resolveAvatar(rawImg, bh.gender || "female"),
            };
          });
      }

      setModels(merged);
      setTotalRegisteredUsers(res.data?.totalRegisteredUsers || 0);
      setTotalMessages(res.data?.totalMessages || 0);
    } catch (err: any) {
      console.error("Failed to load models summary:", err);
      toast.error("Failed to load models summary from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModelsSummary();
  }, [apiBase]);

  // 2. Fetch Users for Selected Model
  const loadModelUsers = async (slug: string) => {
    setUsersLoading(true);
    try {
      const res = await axios.get(`${apiBase}/api/admin/model-manage/users`, {
        params: { hostSlug: slug, search: userSearch },
      });
      if (res.data?.status) {
        setModelUsers(res.data.users || []);
      }
    } catch (err: any) {
      console.error("Failed to load model users:", err);
      toast.error("Failed to load users for this AI model.");
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch Feed Posts for Selected Model
  const loadModelPosts = async (slug: string) => {
    setPostsLoading(true);
    try {
      const res = await axios.get(`${apiBase}/api/model-media/list?hostSlug=${encodeURIComponent(slug)}`);
      if (res.data?.status) {
        setModelPosts(res.data.posts || []);
      } else {
        setModelPosts([]);
      }
    } catch (err: any) {
      console.error("Failed to load model posts:", err);
      toast.error("Failed to load feed posts.");
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedModel) {
      loadModelUsers(selectedModel.slug);
      loadModelPosts(selectedModel.slug);
    }
  }, [selectedModel, userSearch]);

  // Handle Publish New Post with Photo or Video
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModel) return;
    if (!newPostFile) {
      toast.warning("Please choose a photo or video to upload");
      return;
    }
    setUploadingPost(true);
    try {
      const formData = new FormData();
      formData.append("hostSlug", selectedModel.slug);
      formData.append("title", newPostTitle);
      formData.append("description", newPostDesc);
      formData.append("type", newPostType);
      formData.append("media", newPostFile);

      const res = await axios.post(`${apiBase}/api/admin/host-post/create`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.status) {
        toast.success(`Post published successfully to ${selectedModel.name}'s feed!`);
        setNewPostTitle("");
        setNewPostDesc("");
        setNewPostFile(null);
        setNewPostPreview("");
        setShowAddPostModal(false);
        loadModelPosts(selectedModel.slug);
      } else {
        toast.error(res.data?.message || "Failed to publish post");
      }
    } catch (err: any) {
      console.error("Publish post error:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to publish post");
    } finally {
      setUploadingPost(false);
    }
  };

  // Handle Delete Post
  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this feed post?")) return;
    try {
      const res = await axios.delete(`${apiBase}/api/admin/host-post/delete?postId=${postId}`);
      if (res.data?.status) {
        toast.success("Post removed from feed");
        if (selectedModel) loadModelPosts(selectedModel.slug);
      } else {
        toast.error(res.data?.message || "Failed to delete post");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete post");
    }
  };

  // 3. Open User Chat History Modal
  const handleOpenUserChats = async (user: ModelUserData) => {
    setActiveChatUser(user);
    setChatsLoading(true);
    try {
      const res = await axios.get(`${apiBase}/api/admin/model-manage/user-chats`, {
        params: { hostUserId: user._id },
      });
      if (res.data?.status) {
        setChatMessages(res.data.chats || []);
      }
    } catch (err: any) {
      console.error("Failed to load user chats:", err);
      toast.error("Failed to load chat history.");
    } finally {
      setChatsLoading(false);
    }
  };

  // 4. Toggle User Block
  const handleToggleBlock = async (userId: string) => {
    try {
      const res = await axios.patch(`${apiBase}/api/admin/model-manage/user/${userId}/toggle-block`);
      if (res.data?.status) {
        toast.success(res.data.message || "User status updated");
        if (selectedModel) loadModelUsers(selectedModel.slug);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update user block status");
    }
  };

  // 5. Delete User
  const handleDeleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${name}" and all their chat messages?`)) {
      return;
    }
    try {
      const res = await axios.delete(`${apiBase}/api/admin/model-manage/user/${userId}`);
      if (res.data?.status) {
        toast.success("User deleted successfully.");
        if (selectedModel) {
          loadModelUsers(selectedModel.slug);
          loadModelsSummary();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    }
  };

  // 6. Clear User Chats
  const handleClearUserChats = async (userId: string) => {
    if (!window.confirm("Clear all chat messages between this user and the AI model?")) {
      return;
    }
    try {
      const res = await axios.post(`${apiBase}/api/admin/model-manage/clear-chats`, { hostUserId: userId });
      if (res.data?.status) {
        toast.success("Chat history cleared.");
        setChatMessages([]);
        if (selectedModel) {
          loadModelUsers(selectedModel.slug);
          loadModelsSummary();
        }
      }
    } catch (err: any) {
      toast.error("Failed to clear chat history");
    }
  };

  // Copy helper
  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(""), 2000);
  };

  // Filtered Models
  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      const matchSearch =
        !modelSearch.trim() ||
        m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
        m.slug.toLowerCase().includes(modelSearch.toLowerCase()) ||
        m.city.toLowerCase().includes(modelSearch.toLowerCase());
      const matchFlavor = !selectedFlavor || m.flavor === selectedFlavor;
      return matchSearch && matchFlavor;
    });
  }, [models, modelSearch, selectedFlavor]);

  const uniqueFlavors = useMemo(() => {
    const s = new Set<string>();
    models.forEach((m) => {
      if (m.flavor) s.add(m.flavor);
    });
    return Array.from(s);
  }, [models]);

  return (
    <RootLayout>
      <div className="main-content mb-5">
        <Title name="Ai Model Manage" />

        {/* TOP HERO & SUMMARY CARDS */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-4 border-primary">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted small fw-semibold text-uppercase">AI Models</span>
                  <h3 className="fw-bold mb-0 mt-1 text-dark">{models.length}</h3>
                  <small className="text-muted">Live interactive personas</small>
                </div>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-primary"
                  style={{ width: "48px", height: "48px", backgroundColor: "#eff6ff" }}
                >
                  <FaRobot size={22} />
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-4 border-success">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted small fw-semibold text-uppercase">Model-Specific Users</span>
                  <h3 className="fw-bold mb-0 mt-1 text-dark">{totalRegisteredUsers}</h3>
                  <small className="text-muted">Registered across all AI models</small>
                </div>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-success"
                  style={{ width: "48px", height: "48px", backgroundColor: "#f0fdf4" }}
                >
                  <FaUsers size={22} />
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-4 border-info">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted small fw-semibold text-uppercase">Total Chat Messages</span>
                  <h3 className="fw-bold mb-0 mt-1 text-dark">{totalMessages}</h3>
                  <small className="text-muted">Saved conversation histories</small>
                </div>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-info"
                  style={{ width: "48px", height: "48px", backgroundColor: "#f0f9ff" }}
                >
                  <FaComments size={22} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BREADCRUMB / SELECTED MODEL VIEW TOGGLE */}
        {selectedModel && (
          <div className="alert alert-light border shadow-sm rounded-4 p-3 mb-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedModel(null)}
                className="btn btn-outline-secondary btn-sm rounded-pill d-flex align-items-center gap-2 px-3"
              >
                <FaArrowLeft /> All AI Models
              </button>
              <div className="position-relative flex-shrink-0" style={{ width: "42px", height: "42px" }}>
                <img
                  src={resolveAvatar(selectedModel.image, selectedModel.gender)}
                  alt={selectedModel.name}
                  className="rounded-circle border object-fit-cover w-100 h-100 shadow-sm"
                  onError={(e: any) => {
                    e.target.src = selectedModel.gender === "male" ? maleAvatar.src : femaleAvatar.src;
                  }}
                />
                <span
                  className="position-absolute bottom-0 end-0 rounded-circle bg-success border border-white"
                  style={{ width: "10px", height: "10px" }}
                ></span>
              </div>
              <div>
                <h6 className="fw-bold mb-0 text-dark">
                  {selectedModel.name}{" "}
                  <span
                    className="badge rounded-pill ms-2"
                    style={{
                      backgroundColor: getFlavorStyle(selectedModel.flavor).bg,
                      color: getFlavorStyle(selectedModel.flavor).text,
                      border: `1px solid ${getFlavorStyle(selectedModel.flavor).border}`,
                    }}
                  >
                    {selectedModel.flavor}
                  </span>
                </h6>
                <small className="text-muted">
                  Model Slug: <code>{selectedModel.slug}</code> &bull; {selectedModel.totalUsers} registered users &bull;{" "}
                  {selectedModel.totalMessages} chats
                </small>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                onClick={() => setApiModalModel(selectedModel)}
                className="btn btn-sm btn-outline-primary rounded-pill d-flex align-items-center gap-1 px-3"
              >
                <FaCode /> API Integration
              </button>
              <button
                type="button"
                onClick={() => loadModelUsers(selectedModel.slug)}
                className="btn btn-sm btn-light border rounded-pill d-flex align-items-center gap-1"
                title="Refresh users"
              >
                <FaSyncAlt />
              </button>
            </div>
          </div>
        )}

        {/* SECTION 1: PROFILE WISE CARDS GRID (When No Model Selected) */}
        {!selectedModel && (
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
            {/* Filter Bar */}
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
              <div>
                <h5 className="fw-bold mb-1 text-dark">AI Model Profiles</h5>
                <p className="text-muted small mb-0">
                  Select any AI model card below to manage its registered users and inspect user-wise chat histories.
                </p>
              </div>

              <div className="d-flex align-items-center gap-2 flex-wrap">
                {/* Search Box - unified clean rounded-pill container */}
                <div
                  className="d-flex align-items-center bg-white border rounded-pill px-3 shadow-sm"
                  style={{ width: "260px", height: "36px" }}
                >
                  <FaSearch className="text-muted me-2 flex-shrink-0" style={{ fontSize: "13px" }} />
                  <input
                    type="text"
                    className="border-0 bg-transparent w-100 p-0 text-dark"
                    style={{ outline: "none", fontSize: "13px", boxShadow: "none" }}
                    placeholder="Search by name, city..."
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                  />
                  {modelSearch && (
                    <button
                      type="button"
                      onClick={() => setModelSearch("")}
                      className="btn btn-link btn-sm p-0 text-muted ms-1 text-decoration-none"
                      title="Clear search"
                    >
                      <FaTimes size={11} />
                    </button>
                  )}
                </div>

                {/* Flavor filter */}
                <select
                  className="form-select form-select-sm rounded-pill shadow-sm"
                  style={{ width: "170px", height: "36px", fontSize: "13px" }}
                  value={selectedFlavor}
                  onChange={(e) => setSelectedFlavor(e.target.value)}
                >
                  <option value="">All Flavors</option>
                  {uniqueFlavors.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={loadModelsSummary}
                  className="btn btn-sm btn-light border rounded-pill px-3 shadow-sm d-flex align-items-center gap-1"
                  style={{ height: "36px" }}
                >
                  <FaSyncAlt size={12} /> Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="text-muted small mt-2">Loading AI Model Profiles...</p>
              </div>
            ) : filteredModels.length === 0 ? (
              <div className="text-center py-5">
                <FaRobot size={36} className="text-muted mb-2" />
                <h6 className="text-muted">No AI Model Profiles Found</h6>
                <small className="text-muted">Try clearing your search query or add a new AI Model.</small>
              </div>
            ) : (
              <div className="row g-4">
                {filteredModels.map((model) => {
                  const flavorStyle = getFlavorStyle(model.flavor);
                  return (
                    <div key={model.slug} className="col-12 col-md-6 col-lg-4">
                      <div className="card h-100 border rounded-4 shadow-sm overflow-hidden transition-all bg-white d-flex flex-column">
                        {/* Top Banner / Avatar Header */}
                        <div
                          className="p-3 border-bottom d-flex align-items-center gap-3"
                          style={{ backgroundColor: "#fbfcfd" }}
                        >
                          <div
                            className="position-relative flex-shrink-0"
                            style={{ width: "64px", height: "64px" }}
                          >
                            <img
                              src={resolveAvatar(model.image, model.gender)}
                              alt={model.name}
                              className="rounded-circle border object-fit-cover w-100 h-100 shadow-sm"
                              onError={(e: any) => {
                                e.target.src = model.gender === "male" ? maleAvatar.src : femaleAvatar.src;
                              }}
                            />
                            <span
                              className="position-absolute bottom-0 end-0 rounded-circle bg-success border border-white"
                              style={{ width: "13px", height: "13px" }}
                              title="Active Model Persona"
                            ></span>
                          </div>

                          <div className="overflow-hidden">
                            <h6 className="fw-bold mb-1 text-dark text-truncate">{model.name}</h6>
                            <span
                              className="badge rounded-pill mb-1"
                              style={{
                                backgroundColor: flavorStyle.bg,
                                color: flavorStyle.text,
                                border: `1px solid ${flavorStyle.border}`,
                                fontSize: "11px",
                              }}
                            >
                              {model.flavor}
                            </span>
                            <div className="text-muted small text-truncate" style={{ fontSize: "11px" }}>
                              {model.age}y &bull; {model.city}
                            </div>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-3 flex-grow-1 d-flex flex-column justify-content-between">
                          <p
                            className="text-muted small mb-3 fst-italic"
                            style={{
                              fontSize: "12px",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              minHeight: "36px",
                            }}
                          >
                            &ldquo;{model.tagline || model.bio || "Available for spontaneous chats."}&rdquo;
                          </p>

                          {/* Stats Row */}
                          <div className="row g-2 mb-3">
                            <div className="col-6">
                              <div className="p-2 rounded-3 bg-light text-center border">
                                <span className="small text-muted d-block" style={{ fontSize: "11px" }}>
                                  Users
                                </span>
                                <strong className="text-dark fs-14 d-flex align-items-center justify-content-center gap-1">
                                  <FaUsers className="text-primary" /> {model.totalUsers}
                                </strong>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="p-2 rounded-3 bg-light text-center border">
                                <span className="small text-muted d-block" style={{ fontSize: "11px" }}>
                                  Chats
                                </span>
                                <strong className="text-dark fs-14 d-flex align-items-center justify-content-center gap-1">
                                  <FaComments className="text-info" /> {model.totalMessages}
                                </strong>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="d-flex align-items-center gap-2 pt-2 border-top">
                            <button
                              type="button"
                              onClick={() => setSelectedModel(model)}
                              className="btn btn-primary btn-sm flex-grow-1 rounded-pill fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2"
                            >
                              <FaUsers /> Manage Users ({model.totalUsers})
                            </button>
                            <button
                              type="button"
                              onClick={() => setApiModalModel(model)}
                              className="btn btn-outline-secondary btn-sm rounded-circle p-2"
                              title="API Docs & Register/Login Snippet"
                            >
                              <FaCode />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SUB-NAVIGATION TABS FOR SELECTED MODEL */}
        {selectedModel && (
          <div className="d-flex align-items-center gap-2 mb-3">
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-4 py-2 fw-semibold d-flex align-items-center gap-2 transition-all ${
                modelTab === "users" ? "btn-primary shadow-sm" : "btn-light border text-dark"
              }`}
              onClick={() => setModelTab("users")}
            >
              <FaUsers /> Registered Users ({modelUsers.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-4 py-2 fw-semibold d-flex align-items-center gap-2 transition-all ${
                modelTab === "posts" ? "btn-primary shadow-sm" : "btn-light border text-dark"
              }`}
              onClick={() => {
                setModelTab("posts");
                if (selectedModel) loadModelPosts(selectedModel.slug);
              }}
            >
              <FaPhotoVideo /> Discover Feed &amp; Posts ({modelPosts.length})
            </button>
          </div>
        )}

        {/* SECTION 2A: MODEL USERS LIST (Visible When Users Tab is Active) */}
        {selectedModel && modelTab === "users" && (
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4 pb-3 border-bottom">
              <div>
                <h5 className="fw-bold mb-1 text-dark">
                  Registered Users for <span className="text-primary">{selectedModel.name}</span>
                </h5>
                <p className="text-muted small mb-0">
                  Each AI model maintains an isolated user base. These users registered specifically for {selectedModel.name} via email &amp; password.
                </p>
              </div>

              <div className="d-flex align-items-center gap-2">
                <div
                  className="d-flex align-items-center bg-white border rounded-pill px-3 shadow-sm"
                  style={{ width: "280px", height: "36px" }}
                >
                  <FaSearch className="text-muted me-2 flex-shrink-0" style={{ fontSize: "13px" }} />
                  <input
                    type="text"
                    className="border-0 bg-transparent w-100 p-0 text-dark"
                    style={{ outline: "none", fontSize: "13px", boxShadow: "none" }}
                    placeholder="Search by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                  {userSearch && (
                    <button
                      type="button"
                      onClick={() => setUserSearch("")}
                      className="btn btn-link btn-sm p-0 text-muted ms-1 text-decoration-none"
                      title="Clear search"
                    >
                      <FaTimes size={11} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {usersLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="text-muted small mt-2">Loading registered users for {selectedModel.name}...</p>
              </div>
            ) : modelUsers.length === 0 ? (
              <div className="text-center py-5">
                <FaUsers size={36} className="text-muted mb-2" />
                <h6 className="text-muted">No Users Registered Yet for {selectedModel.name}</h6>
                <p className="text-muted small mb-3">
                  Users who sign up on this model&apos;s frontend prototype or API will appear here.
                </p>
                <button
                  type="button"
                  onClick={() => setApiModalModel(selectedModel)}
                  className="btn btn-outline-primary btn-sm rounded-pill px-3"
                >
                  <FaCode className="me-1" /> View Registration &amp; Login API
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr className="text-uppercase text-muted" style={{ fontSize: "11px" }}>
                      <th style={{ width: "40px" }}>#</th>
                      <th>User</th>
                      <th>Email</th>
                      <th>Gender</th>
                      <th>Joined Date</th>
                      <th>Total Chats</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modelUsers.map((user, idx) => (
                      <tr key={user._id}>
                        <td className="text-muted small">{idx + 1}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded-circle bg-light d-flex align-items-center justify-content-center text-secondary border flex-shrink-0"
                              style={{ width: "36px", height: "36px" }}
                            >
                              <FaRobot />
                            </div>
                            <div>
                              <strong className="text-dark d-block fs-14">{user.name}</strong>
                              <small className="text-muted font-monospace" style={{ fontSize: "10px" }}>
                                ID: {user._id.slice(-6)}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="font-monospace small text-dark">{user.email}</span>
                        </td>
                        <td>
                          <span
                            className={`badge text-capitalize ${
                              user.gender === "female" ? "bg-danger-subtle text-danger" : "bg-primary-subtle text-primary"
                            }`}
                          >
                            {user.gender || "male"}
                          </span>
                        </td>
                        <td>
                          <small className="text-muted">
                            {new Date(user.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </small>
                        </td>
                        <td>
                          <span className="badge bg-info-subtle text-info border border-info-subtle px-2 py-1">
                            💬 {user.totalMessages} msgs
                          </span>
                        </td>
                        <td>
                          {user.isBlock ? (
                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                              Suspended
                            </span>
                          ) : (
                            <span className="badge bg-success-subtle text-success border border-success-subtle">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              onClick={() => handleOpenUserChats(user)}
                              className="btn btn-outline-primary rounded-pill px-3 me-1 d-flex align-items-center gap-1"
                              title="Inspect full conversation"
                            >
                              <FaComments /> View Chats
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleBlock(user._id)}
                              className={`btn btn-sm ${user.isBlock ? "btn-outline-success" : "btn-outline-warning"} rounded-circle me-1`}
                              title={user.isBlock ? "Unsuspend user" : "Suspend user"}
                            >
                              <FaBan />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user._id, user.name)}
                              className="btn btn-outline-danger btn-sm rounded-circle"
                              title="Delete user"
                            >
                              <FaTrashAlt />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SECTION 2B: FEED POSTS & MEDIA (Visible When Posts Tab is Active) */}
        {selectedModel && modelTab === "posts" && (
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4 pb-3 border-bottom">
              <div>
                <h5 className="fw-bold mb-1 text-dark">
                  Discover Feed &amp; Moments for <span className="text-primary">{selectedModel.name}</span>
                </h5>
                <p className="text-muted small mb-0">
                  Upload photos and videos with title &amp; description. These appear directly in {selectedModel.name}&apos;s Discover page in Instagram-style scrollable grid.
                </p>
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPostModal(true)}
                  className="btn btn-primary btn-sm rounded-pill px-4 d-flex align-items-center gap-2 shadow-sm"
                >
                  <FaPlus /> Upload Photo / Video
                </button>
                <button
                  type="button"
                  onClick={() => loadModelPosts(selectedModel.slug)}
                  className="btn btn-light border btn-sm rounded-pill"
                  title="Refresh posts"
                >
                  <FaSyncAlt />
                </button>
              </div>
            </div>

            {postsLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="text-muted small mt-2">Loading feed posts for {selectedModel.name}...</p>
              </div>
            ) : modelPosts.length === 0 ? (
              <div className="text-center py-5">
                <FaPhotoVideo size={42} className="text-muted mb-2 opacity-50" />
                <h6 className="text-muted">No Feed Posts Published Yet for {selectedModel.name}</h6>
                <p className="text-muted small mb-3">
                  Add photos or videos with titles &amp; captions. They will instantly appear on {selectedModel.name}&apos;s live Discover page.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddPostModal(true)}
                  className="btn btn-outline-primary btn-sm rounded-pill px-4"
                >
                  <FaPlus className="me-1" /> Upload First Photo or Video
                </button>
              </div>
            ) : (
              <div className="row g-4">
                {modelPosts.map((post) => (
                  <div key={post._id} className="col-12 col-md-6 col-lg-4">
                    <div className="card h-100 border rounded-4 overflow-hidden shadow-sm bg-white d-flex flex-column">
                      {/* Media container */}
                      <div className="position-relative bg-dark" style={{ height: "240px" }}>
                        {post.type === "video" ? (
                          <video
                            src={resolveMediaUrl(post.mediaUrl)}
                            controls
                            className="w-100 h-100 object-fit-cover"
                          />
                        ) : (
                          <img
                            src={resolveMediaUrl(post.mediaUrl)}
                            alt={post.title}
                            className="w-100 h-100 object-fit-cover"
                          />
                        )}
                        <span
                          className="position-absolute top-0 start-0 m-2 badge rounded-pill bg-dark bg-opacity-75 text-white d-flex align-items-center gap-1 shadow-sm"
                          style={{ fontSize: "11px" }}
                        >
                          {post.type === "video" ? (
                            <>
                              <FaVideo className="text-warning" /> Video
                            </>
                          ) : (
                            <>
                              <FaImage className="text-info" /> Photo
                            </>
                          )}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-3 d-flex flex-column flex-grow-1 justify-content-between">
                        <div>
                          <h6 className="fw-bold text-dark mb-1">{post.title || "Untitled Moment"}</h6>
                          <p className="text-muted small mb-3" style={{ minHeight: "36px", whiteSpace: "pre-line" }}>
                            {post.description || "No caption added."}
                          </p>
                        </div>

                        <div className="pt-2 border-top d-flex align-items-center justify-content-between">
                          <small className="text-muted" style={{ fontSize: "11px" }}>
                            {new Date(post.createdAt).toLocaleDateString()}
                          </small>
                          <button
                            type="button"
                            onClick={() => handleDeletePost(post._id)}
                            className="btn btn-outline-danger btn-sm rounded-pill px-3 py-1 d-flex align-items-center gap-1"
                            style={{ fontSize: "12px" }}
                            title="Delete post"
                          >
                            <FaTrashAlt size={11} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODAL: ADD NEW FEED POST */}
        {showAddPostModal && selectedModel && (
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", zIndex: 1060 }}
          >
            <div className="modal-dialog modal-dialog-centered modal-md">
              <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
                <div className="modal-header bg-dark text-white px-4 py-3 border-0">
                  <div className="d-flex align-items-center gap-2">
                    <FaPhotoVideo className="text-primary" />
                    <h6 className="modal-title fw-bold mb-0">
                      Add Discover Post for {selectedModel.name}
                    </h6>
                  </div>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => {
                      setShowAddPostModal(false);
                      setNewPostPreview("");
                      setNewPostFile(null);
                    }}
                  />
                </div>

                <form onSubmit={handleCreatePost}>
                  <div className="modal-body p-4 bg-light">
                    {/* Media Type */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-dark">Media Type</label>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className={`btn btn-sm rounded-pill flex-fill d-flex align-items-center justify-content-center gap-2 ${
                            newPostType === "photo" ? "btn-primary" : "btn-outline-secondary bg-white"
                          }`}
                          onClick={() => setNewPostType("photo")}
                        >
                          <FaImage /> Photo
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm rounded-pill flex-fill d-flex align-items-center justify-content-center gap-2 ${
                            newPostType === "video" ? "btn-primary" : "btn-outline-secondary bg-white"
                          }`}
                          onClick={() => setNewPostType("video")}
                        >
                          <FaVideo /> Video
                        </button>
                      </div>
                    </div>

                    {/* File Upload */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-dark">Select File</label>
                      <input
                        type="file"
                        accept={newPostType === "video" ? "video/*" : "image/*"}
                        className="form-control form-control-sm rounded-3"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setNewPostFile(file);
                            setNewPostPreview(URL.createObjectURL(file));
                          }
                        }}
                        required
                      />
                    </div>

                    {/* Preview */}
                    {newPostPreview && (
                      <div className="mb-3 rounded-3 overflow-hidden border bg-dark text-center" style={{ maxHeight: "200px" }}>
                        {newPostType === "video" ? (
                          <video src={newPostPreview} controls className="w-100" style={{ maxHeight: "200px" }} />
                        ) : (
                          <img src={newPostPreview} alt="Preview" className="w-100 object-fit-contain" style={{ maxHeight: "200px" }} />
                        )}
                      </div>
                    )}

                    {/* Post Title */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-dark">Title / Headline</label>
                      <input
                        type="text"
                        className="form-control form-control-sm rounded-3"
                        placeholder="e.g. Evening in Indiranagar, Bangalore"
                        value={newPostTitle}
                        onChange={(e) => setNewPostTitle(e.target.value)}
                        required
                      />
                    </div>

                    {/* Post Description */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-dark">Caption / Description</label>
                      <textarea
                        rows={3}
                        className="form-control form-control-sm rounded-3"
                        placeholder="e.g. Caught this quiet moment after sunset. What are you up to tonight?"
                        value={newPostDesc}
                        onChange={(e) => setNewPostDesc(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="modal-footer bg-white border-top px-4 py-2 d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-light border rounded-pill px-3"
                      onClick={() => {
                        setShowAddPostModal(false);
                        setNewPostPreview("");
                        setNewPostFile(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploadingPost || !newPostFile}
                      className="btn btn-sm btn-primary rounded-pill px-4 d-flex align-items-center gap-2"
                    >
                      {uploadingPost ? (
                        <>
                          <div className="spinner-border spinner-border-sm" role="status"></div>
                          Publishing...
                        </>
                      ) : (
                        <>
                          <FaPlus /> Publish to Feed
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: USER CHAT HISTORY MODAL */}
        {activeChatUser && (
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            style={{ backgroundColor: "rgba(15, 23, 42, 0.65)" }}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
              <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
                {/* Modal Header */}
                <div className="modal-header bg-dark text-white px-4 py-3 border-0">
                  <div className="d-flex align-items-center gap-3">
                    <div className="position-relative flex-shrink-0" style={{ width: "44px", height: "44px" }}>
                      <img
                        src={resolveAvatar(selectedModel?.image, selectedModel?.gender)}
                        alt="Model"
                        className="rounded-circle border object-fit-cover w-100 h-100"
                        onError={(e: any) => {
                          e.target.src = selectedModel?.gender === "male" ? maleAvatar.src : femaleAvatar.src;
                        }}
                      />
                      <span
                        className="position-absolute bottom-0 end-0 rounded-circle bg-success border border-white"
                        style={{ width: "11px", height: "11px" }}
                      ></span>
                    </div>

                    <div>
                      <h6 className="fw-bold mb-0 text-white">
                        {selectedModel?.name} &amp; {activeChatUser.name}
                      </h6>
                      <small className="text-secondary font-monospace" style={{ fontSize: "11px" }}>
                        Model: {activeChatUser.hostSlug} &bull; User: {activeChatUser.email}
                      </small>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setActiveChatUser(null)}
                  ></button>
                </div>

                {/* Modal Body: Message Thread */}
                <div
                  className="modal-body p-4"
                  style={{ backgroundColor: "#f8fafc", maxHeight: "480px", overflowY: "auto" }}
                >
                  {chatsLoading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status"></div>
                      <p className="text-muted small mt-2">Loading conversation thread...</p>
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="text-center py-5">
                      <FaCommentDots size={36} className="text-muted mb-2" />
                      <h6 className="text-muted">No Chat Messages Yet</h6>
                      <small className="text-muted">This user has not sent any messages to {selectedModel?.name} yet.</small>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {chatMessages.map((msg) => {
                        const isUser = msg.sender === "user";
                        return (
                          <div
                            key={msg._id}
                            className={`d-flex ${isUser ? "justify-content-end" : "justify-content-start"}`}
                          >
                            <div
                              className="rounded-4 p-3 shadow-sm position-relative"
                              style={{
                                maxWidth: "78%",
                                backgroundColor: isUser ? "#2563eb" : "#ffffff",
                                color: isUser ? "#ffffff" : "#1e293b",
                                border: isUser ? "none" : "1px solid #e2e8f0",
                              }}
                            >
                              <div className="d-flex align-items-center justify-content-between gap-3 mb-1">
                                <span
                                  className="fw-bold small"
                                  style={{ color: isUser ? "#bfdbfe" : "#ec4899", fontSize: "11px" }}
                                >
                                  {isUser ? activeChatUser.name : selectedModel?.name}
                                </span>
                                <small
                                  style={{
                                    fontSize: "10px",
                                    color: isUser ? "rgba(255,255,255,0.7)" : "#94a3b8",
                                  }}
                                >
                                  {new Date(msg.createdAt).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </small>
                              </div>
                              <p className="mb-0 fs-14" style={{ whiteSpace: "pre-wrap" }}>
                                {msg.message}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="modal-footer bg-white border-top px-4 py-2 d-flex justify-content-between align-items-center">
                  <span className="small text-muted font-monospace">
                    Total: {chatMessages.length} messages
                  </span>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleClearUserChats(activeChatUser._id)}
                      className="btn btn-sm btn-outline-danger rounded-pill px-3"
                    >
                      <FaTrashAlt className="me-1" /> Clear History
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveChatUser(null)}
                      className="btn btn-sm btn-dark rounded-pill px-4"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: API INTEGRATION MODAL */}
        {apiModalModel && (
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            style={{ backgroundColor: "rgba(15, 23, 42, 0.65)" }}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
              <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
                <div className="modal-header bg-dark text-white px-4 py-3 border-0">
                  <div className="d-flex align-items-center gap-2">
                    <FaCode className="text-warning" />
                    <h6 className="fw-bold mb-0 text-white">
                      User Auth &amp; Chat APIs for {apiModalModel.name}
                    </h6>
                  </div>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setApiModalModel(null)}
                  ></button>
                </div>

                <div className="modal-body p-4 bg-light" style={{ maxHeight: "500px", overflowY: "auto" }}>
                  <p className="small text-muted mb-3">
                    Frontend apps (like <code>shanaya-prototype</code> or custom React frontend) can register users, log them in with email &amp; password, and chat with <strong>{apiModalModel.name}</strong> using these endpoints:
                  </p>

                  {/* 1. Register API */}
                  <div className="card border-0 rounded-3 p-3 bg-white shadow-sm mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="badge bg-success font-monospace">POST /api/model-user/register</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            `curl -X POST "${apiBase}/api/model-user/register" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "hostSlug": "${apiModalModel.slug}",\n    "email": "user@example.com",\n    "password": "Password123",\n    "name": "Rahul",\n    "gender": "male"\n  }'`,
                            "reg_curl"
                          )
                        }
                        className="btn btn-sm btn-outline-secondary"
                      >
                        {copiedKey === "reg_curl" ? <FaCheck className="text-success" /> : <FaCopy />} Copy
                      </button>
                    </div>
                    <small className="text-muted mb-1 d-block">Registers user specifically for {apiModalModel.name} (isolated user base).</small>
                    <pre className="bg-dark text-white rounded p-2 mb-0 font-monospace small" style={{ fontSize: "11px" }}>
{`curl -X POST "${apiBase}/api/model-user/register" \\
  -H "Content-Type: application/json" \\
  -d '{
    "hostSlug": "${apiModalModel.slug}",
    "email": "user@example.com",
    "password": "Password123",
    "name": "Rahul",
    "gender": "male"
  }'`}
                    </pre>
                  </div>

                  {/* 2. Login API */}
                  <div className="card border-0 rounded-3 p-3 bg-white shadow-sm mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="badge bg-primary font-monospace">POST /api/model-user/login</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            `curl -X POST "${apiBase}/api/model-user/login" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "hostSlug": "${apiModalModel.slug}",\n    "email": "user@example.com",\n    "password": "Password123"\n  }'`,
                            "login_curl"
                          )
                        }
                        className="btn btn-sm btn-outline-secondary"
                      >
                        {copiedKey === "login_curl" ? <FaCheck className="text-success" /> : <FaCopy />} Copy
                      </button>
                    </div>
                    <small className="text-muted mb-1 d-block">Returns JWT Bearer token valid for 30 days.</small>
                    <pre className="bg-dark text-white rounded p-2 mb-0 font-monospace small" style={{ fontSize: "11px" }}>
{`curl -X POST "${apiBase}/api/model-user/login" \\
  -H "Content-Type: application/json" \\
  -d '{
    "hostSlug": "${apiModalModel.slug}",
    "email": "user@example.com",
    "password": "Password123"
  }'`}
                    </pre>
                  </div>

                  {/* 3. Send Message API */}
                  <div className="card border-0 rounded-3 p-3 bg-white shadow-sm mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="badge bg-warning text-dark font-monospace">POST /api/model-user/chat</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            `curl -X POST "${apiBase}/api/model-user/chat" \\\n  -H "Authorization: Bearer <USER_JWT_TOKEN>" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "message": "Hi ${apiModalModel.name}!"\n  }'`,
                            "chat_curl"
                          )
                        }
                        className="btn btn-sm btn-outline-secondary"
                      >
                        {copiedKey === "chat_curl" ? <FaCheck className="text-success" /> : <FaCopy />} Copy
                      </button>
                    </div>
                    <small className="text-muted mb-1 d-block">Saves message in DB and returns real-time persona reply.</small>
                    <pre className="bg-dark text-white rounded p-2 mb-0 font-monospace small" style={{ fontSize: "11px" }}>
{`curl -X POST "${apiBase}/api/model-user/chat" \\
  -H "Authorization: Bearer <USER_JWT_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Hi ${apiModalModel.name}!"
  }'`}
                    </pre>
                  </div>

                  {/* 4. Chat History */}
                  <div className="card border-0 rounded-3 p-3 bg-white shadow-sm mb-0">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="badge bg-info text-dark font-monospace">GET /api/model-user/history</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            `curl -X GET "${apiBase}/api/model-user/history" \\\n  -H "Authorization: Bearer <USER_JWT_TOKEN>"`,
                            "hist_curl"
                          )
                        }
                        className="btn btn-sm btn-outline-secondary"
                      >
                        {copiedKey === "hist_curl" ? <FaCheck className="text-success" /> : <FaCopy />} Copy
                      </button>
                    </div>
                    <small className="text-muted mb-1 d-block">Retrieves all past messages between user and this AI model.</small>
                    <pre className="bg-dark text-white rounded p-2 mb-0 font-monospace small" style={{ fontSize: "11px" }}>
{`curl -X GET "${apiBase}/api/model-user/history" \\
  -H "Authorization: Bearer <USER_JWT_TOKEN>"`}
                    </pre>
                  </div>
                </div>

                <div className="modal-footer bg-white border-top px-4 py-2">
                  <button
                    type="button"
                    onClick={() => setApiModalModel(null)}
                    className="btn btn-sm btn-dark rounded-pill px-4"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RootLayout>
  );
};

export default AiModelManage;
