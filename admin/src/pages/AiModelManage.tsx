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
import CommonDialog from "@/utils/CommonDialog";
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
  FaLock,
  FaCoins,
  FaChevronLeft,
  FaChevronRight,
  FaLayerGroup,
  FaCommentAlt,
  FaReply,
  FaPaperPlane,
  FaCheckCircle,
  FaEdit,
  FaFilter,
} from "react-icons/fa";

interface ModelPostData {
  _id: string;
  hostSlug: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaUrls?: string[];
  isCarousel?: boolean;
  type: "photo" | "video";
  category?: "discover" | "exclusive";
  creditCost?: number;
  likesCount?: number;
  commentsCount?: number;
  comments?: any[];
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
  totalLikes?: number;
  totalComments?: number;
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
  credits?: number;
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

  // New Post Modal State (supports single or multi-media carousel)
  const [showAddPostModal, setShowAddPostModal] = useState<boolean>(false);
  const [newPostCategory, setNewPostCategory] = useState<"discover" | "exclusive">("discover");
  const [newPostCreditCost, setNewPostCreditCost] = useState<number>(25);
  const [postCategoryFilter, setPostCategoryFilter] = useState<"all" | "discover" | "exclusive">("all");
  const [newPostTitle, setNewPostTitle] = useState<string>("");
  const [newPostDesc, setNewPostDesc] = useState<string>("");
  const [newPostType, setNewPostType] = useState<"photo" | "video" | "carousel">("photo");
  const [newPostFiles, setNewPostFiles] = useState<File[]>([]);
  const [newPostPreviews, setNewPostPreviews] = useState<{ url: string; type: "photo" | "video"; name: string }[]>([]);
  const [activeCardSlides, setActiveCardSlides] = useState<Record<string, number>>({});

  // Comments Modal & Creator Reply State
  const [activeCommentsModel, setActiveCommentsModel] = useState<ModelCardData | null>(null);
  const [modelAllComments, setModelAllComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState<boolean>(false);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null);
  const [commentsFilter, setCommentsFilter] = useState<"all" | "unreplied" | "replied">("all");
  const [commentsSearch, setCommentsSearch] = useState<string>("");

  // Custom Confirmation Dialog (Uses Admin's standard CommonDialog)
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    text: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    text: "Delete",
    onConfirm: () => {},
  });

  const openConfirmDialog = (
    title: string,
    description: string,
    onConfirm: () => void,
    text = "Delete"
  ) => {
    setConfirmModal({
      open: true,
      title,
      description,
      text,
      onConfirm,
    });
  };

  // Add / Adjust User Credits Modal State
  const [creditModal, setCreditModal] = useState<{
    open: boolean;
    user: any | null;
    amount: number | string;
    note: string;
    submitting: boolean;
  }>({
    open: false,
    user: null,
    amount: 100,
    note: "Admin Bonus Credits",
    submitting: false,
  });

  const handleOpenAddCredits = (user: any) => {
    setCreditModal({
      open: true,
      user,
      amount: 100,
      note: "Admin Bonus Credits",
      submitting: false,
    });
  };

  const handleSubmitAddCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditModal.user) return;
    const amt = parseInt(String(creditModal.amount), 10);
    if (isNaN(amt) || amt === 0) {
      toast.error("Please enter a valid credit amount");
      return;
    }

    setCreditModal((prev) => ({ ...prev, submitting: true }));
    try {
      const res = await axios.post(
        `${apiBase}/api/admin/model-manage/user/${creditModal.user._id}/adjust-credits`,
        {
          amount: amt,
          note: creditModal.note,
        }
      );
      if (res.data?.status) {
        toast.success(res.data.message || "Credits updated successfully!");
        setModelUsers((prev) =>
          prev.map((u) =>
            u._id === creditModal.user._id
              ? { ...u, credits: res.data.newBalance ?? (u.credits || 0) + amt }
              : u
          )
        );
        setCreditModal((prev) => ({ ...prev, open: false, submitting: false }));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to adjust credits");
      setCreditModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleOpenCommentsModal = async (model: ModelCardData) => {
    setActiveCommentsModel(model);
    setCommentsFilter("all");
    setCommentsSearch("");
    setCommentsLoading(true);
    try {
      const res = await axios
        .get(`${apiBase}/api/model-media/all-comments?hostSlug=${model.slug}`)
        .catch(() => null);
      if (res?.data?.status && Array.isArray(res.data.comments)) {
        setModelAllComments(res.data.comments);
      } else {
        setModelAllComments([]);
      }
    } catch (e: any) {
      console.warn("Error fetching all comments:", e);
      setModelAllComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleSendReply = async (comment: any) => {
    const text = (replyInputs[comment._id] || "").trim();
    if (!text || !activeCommentsModel) return;

    setReplyingCommentId(comment._id);
    try {
      const res = await axios.post(`${apiBase}/api/model-media/comment/reply`, {
        postId: comment.postId,
        commentId: comment._id,
        replyText: text,
        author: activeCommentsModel.name,
      });

      if (res.data?.status) {
        toast.success(`Reply sent as ${activeCommentsModel.name}!`);
        setModelAllComments((prev) =>
          prev.map((c) =>
            c._id === comment._id
              ? {
                  ...c,
                  reply: {
                    text,
                    repliedAt: new Date().toISOString(),
                    author: activeCommentsModel.name,
                  },
                }
              : c
          )
        );
        setReplyInputs((prev) => ({ ...prev, [comment._id]: "" }));
      } else {
        toast.error(res.data?.message || "Failed to send reply");
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to send reply");
    } finally {
      setReplyingCommentId(null);
    }
  };

  // Helper to resolve media URLs
  const resolveMediaUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:") || url.startsWith("data:")) return url;
    const clean = url.startsWith("/") ? url : `/${url}`;
    return `${apiBase}${clean}`;
  };

  // Filtered comments for the active comments modal
  const { filteredComments, unrepliedCount, repliedCount } = useMemo(() => {
    let unreplied = 0;
    let replied = 0;
    modelAllComments.forEach((c) => {
      if (c.reply?.text) replied++;
      else unreplied++;
    });

    const filtered = modelAllComments.filter((c) => {
      if (commentsFilter === "unreplied" && c.reply?.text) return false;
      if (commentsFilter === "replied" && !c.reply?.text) return false;
      if (commentsSearch.trim()) {
        const q = commentsSearch.toLowerCase();
        const matchUser = (c.userName || "").toLowerCase().includes(q);
        const matchText = (c.text || "").toLowerCase().includes(q);
        const matchPost = (c.postTitle || "").toLowerCase().includes(q);
        if (!matchUser && !matchText && !matchPost) return false;
      }
      return true;
    });

    return { filteredComments: filtered, unrepliedCount: unreplied, repliedCount: replied };
  }, [modelAllComments, commentsFilter, commentsSearch]);

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
            totalLikes: s.totalLikes || 0,
            totalComments: s.totalComments || 0,
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
            const s = statsMap.get(slug) || statsMap.get((name || "").toLowerCase()) || {};
            return {
              ...bh,
              name,
              slug,
              image: resolveAvatar(rawImg, bh.gender || "female"),
              totalLikes: s.totalLikes || 0,
              totalComments: s.totalComments || 0,
            };
          });
      }

      // Fetch posts to ensure real-time likes & comments count across all models
      try {
        const postsRes = await axios.get(`${apiBase}/api/model-media/list?limit=100`).catch(() => null);
        if (postsRes?.data?.status && Array.isArray(postsRes.data.posts)) {
          const likesBySlug: Record<string, number> = {};
          const commentsBySlug: Record<string, number> = {};
          postsRes.data.posts.forEach((p: any) => {
            const s = (p.hostSlug || "").toLowerCase();
            const baseSlug = s.split("-")[0];
            const countLikes = p.likesCount || (Array.isArray(p.likedByUsers) ? p.likedByUsers.length : 0);
            const countComments = p.commentsCount || (Array.isArray(p.comments) ? p.comments.length : 0);
            likesBySlug[s] = (likesBySlug[s] || 0) + countLikes;
            likesBySlug[baseSlug] = (likesBySlug[baseSlug] || 0) + countLikes;
            commentsBySlug[s] = (commentsBySlug[s] || 0) + countComments;
            commentsBySlug[baseSlug] = (commentsBySlug[baseSlug] || 0) + countComments;
          });

          merged = merged.map((m) => {
            const s = m.slug.toLowerCase();
            const b = m.name.toLowerCase();
            const postLikes = Math.max(m.totalLikes || 0, likesBySlug[s] || likesBySlug[b] || 0);
            const postComments = Math.max(m.totalComments || 0, commentsBySlug[s] || commentsBySlug[b] || 0);
            return {
              ...m,
              totalLikes: postLikes,
              totalComments: postComments,
            };
          });
        }
      } catch (err) {
        console.warn("Post stats calculation note:", err);
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

  // Remove single file from preview list
  const handleRemovePreview = (index: number) => {
    setNewPostFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPostPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Publish New Post with Photo or Video (supports multi-item carousel)
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModel) return;
    if (newPostFiles.length === 0) {
      toast.warning("Please choose at least one photo or video to upload");
      return;
    }
    setUploadingPost(true);
    try {
      const formData = new FormData();
      formData.append("hostSlug", selectedModel.slug);
      formData.append("title", newPostTitle);
      formData.append("description", newPostDesc);
      formData.append("type", newPostType === "video" ? "video" : "photo");
      formData.append("isCarousel", String(newPostType === "carousel" || newPostFiles.length > 1));
      formData.append("category", newPostCategory);
      formData.append("creditCost", newPostCategory === "exclusive" ? String(newPostCreditCost || 25) : "0");
      
      // Append all selected files for carousel
      newPostFiles.forEach((file) => {
        formData.append("media", file);
      });

      const res = await axios.post(`${apiBase}/api/admin/host-post/create`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.status) {
        toast.success(
          `${newPostCategory === "exclusive" ? "Exclusive media" : "Discover post"} published successfully to ${selectedModel.name}'s feed!`
        );
        setNewPostTitle("");
        setNewPostDesc("");
        setNewPostFiles([]);
        setNewPostPreviews([]);
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

  // Handle Delete Post with Custom Modal
  const handleDeletePost = (postId: string) => {
    openConfirmDialog(
      "Delete Media Post",
      "Are you sure you want to delete this media post from the model's feed?",
      async () => {
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
      }
    );
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

  // 5. Delete User with Custom Modal
  const handleDeleteUser = (userId: string, name: string) => {
    openConfirmDialog(
      "Delete User",
      `Are you sure you want to delete user "${name}" and all their chat history? This action cannot be undone.`,
      async () => {
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
      }
    );
  };

  // 6. Clear User Chats with Custom Modal
  const handleClearUserChats = (userId: string) => {
    openConfirmDialog(
      "Clear Chat History",
      "Are you sure you want to clear all chat messages between this user and the AI model? This cannot be recovered.",
      async () => {
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
      },
      "Delete"
    );
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

  // Filtered Model Posts (Discover vs Exclusive)
  const filteredModelPosts = useMemo(() => {
    if (postCategoryFilter === "discover") {
      return modelPosts.filter((p) => p.category !== "exclusive");
    }
    if (postCategoryFilter === "exclusive") {
      return modelPosts.filter((p) => p.category === "exclusive");
    }
    return modelPosts;
  }, [modelPosts, postCategoryFilter]);

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

                          {/* 4 Stats Cards: Users, Chats, Total Likes, Comments */}
                          <div className="row g-2 mb-3">
                            <div className="col-3">
                              <div className="p-2 rounded-3 bg-light text-center border h-100 d-flex flex-column justify-content-center">
                                <span className="small text-muted d-block text-truncate" style={{ fontSize: "10px" }}>
                                  Users
                                </span>
                                <strong className="text-dark fs-14 d-flex align-items-center justify-content-center gap-1 mt-1">
                                  <FaUsers className="text-primary" size={12} /> {model.totalUsers}
                                </strong>
                              </div>
                            </div>
                            <div className="col-3">
                              <div className="p-2 rounded-3 bg-light text-center border h-100 d-flex flex-column justify-content-center">
                                <span className="small text-muted d-block text-truncate" style={{ fontSize: "10px" }}>
                                  Chats
                                </span>
                                <strong className="text-dark fs-14 d-flex align-items-center justify-content-center gap-1 mt-1">
                                  <FaComments className="text-info" size={12} /> {model.totalMessages}
                                </strong>
                              </div>
                            </div>
                            <div className="col-3">
                              <div className="p-2 rounded-3 bg-light text-center border h-100 d-flex flex-column justify-content-center">
                                <span className="small text-muted d-block text-truncate" style={{ fontSize: "10px" }}>
                                  Total Likes
                                </span>
                                <strong className="text-dark fs-14 d-flex align-items-center justify-content-center gap-1 mt-1">
                                  <FaHeart className="text-danger" size={12} /> {model.totalLikes || 0}
                                </strong>
                              </div>
                            </div>
                            <div className="col-3">
                              <button
                                type="button"
                                className="btn p-2 rounded-3 bg-light text-center border h-100 w-100 d-flex flex-column justify-content-center align-items-center shadow-none"
                                style={{ transition: "all 0.15s ease", cursor: "pointer" }}
                                onClick={() => handleOpenCommentsModal(model)}
                                title="Click to view all comments and reply"
                              >
                                <span className="small text-muted d-block text-truncate" style={{ fontSize: "10px" }}>
                                  Comments
                                </span>
                                <strong className="text-dark fs-14 d-flex align-items-center justify-content-center gap-1 mt-1">
                                  <FaCommentAlt className="text-warning" size={11} /> {model.totalComments || 0}
                                </strong>
                              </button>
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
                      <th>Credits</th>
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
                          <span className="badge bg-warning-subtle text-dark border border-warning-subtle px-2.5 py-1.5 fw-bold d-inline-flex align-items-center gap-1.5">
                            <FaCoins className="text-warning" size={12} />
                            <span>{(user.credits || 0).toLocaleString()}</span>
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
                              onClick={() => handleOpenAddCredits(user)}
                              className="btn btn-outline-warning rounded-pill px-2.5 me-1 d-inline-flex align-items-center gap-1 text-dark fw-bold shadow-sm"
                              title={`Add or adjust credits for ${user.name}`}
                            >
                              <FaCoins className="text-warning" size={13} /> + Credits
                            </button>
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
                  Posts &amp; Exclusive Media for <span className="text-primary">{selectedModel.name}</span>
                </h5>
                <p className="text-muted small mb-0">
                  Manage Discover photos/videos (100% Free) and Exclusive paid content (Unlocked with credits in real-time).
                </p>
              </div>

              <div className="d-flex align-items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setNewPostCategory("discover");
                    setShowAddPostModal(true);
                  }}
                  className="btn btn-success btn-sm rounded-pill px-3 d-flex align-items-center gap-1 shadow-sm text-white"
                >
                  <FaPlus size={11} /> Add Discover Post (Free)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewPostCategory("exclusive");
                    setShowAddPostModal(true);
                  }}
                  className="btn btn-warning btn-sm rounded-pill px-3 d-flex align-items-center gap-1 shadow-sm text-dark fw-bold"
                >
                  <FaLock size={11} /> Add Exclusive Media (Paid)
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

            {/* Filter Pills */}
            <div className="d-flex align-items-center gap-2 mb-4 pb-2">
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3 ${
                  postCategoryFilter === "all" ? "btn-dark shadow-sm" : "btn-light border text-muted"
                }`}
                onClick={() => setPostCategoryFilter("all")}
              >
                All Content ({modelPosts.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3 ${
                  postCategoryFilter === "discover" ? "btn-success text-white shadow-sm" : "btn-light border text-muted"
                }`}
                onClick={() => setPostCategoryFilter("discover")}
              >
                <FaCheck className="me-1" size={10} /> Discover Free ({modelPosts.filter((p) => p.category !== "exclusive").length})
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3 ${
                  postCategoryFilter === "exclusive" ? "btn-warning text-dark fw-bold shadow-sm" : "btn-light border text-muted"
                }`}
                onClick={() => setPostCategoryFilter("exclusive")}
              >
                <FaLock className="me-1" size={10} /> Exclusive Paid ({modelPosts.filter((p) => p.category === "exclusive").length})
              </button>
            </div>

            {postsLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="text-muted small mt-2">Loading posts for {selectedModel.name}...</p>
              </div>
            ) : filteredModelPosts.length === 0 ? (
              <div className="text-center py-5">
                <FaPhotoVideo size={42} className="text-muted mb-2 opacity-50" />
                <h6 className="text-muted">No Posts Found</h6>
                <p className="text-muted small mb-3">
                  {postCategoryFilter === "exclusive"
                    ? `No Exclusive paid media uploaded yet for ${selectedModel.name}.`
                    : postCategoryFilter === "discover"
                    ? `No Discover free posts published yet for ${selectedModel.name}.`
                    : `No posts or media published yet for ${selectedModel.name}.`}
                </p>
                <div className="d-flex justify-content-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewPostCategory("discover");
                      setShowAddPostModal(true);
                    }}
                    className="btn btn-outline-success btn-sm rounded-pill px-3"
                  >
                    <FaPlus className="me-1" size={11} /> Add Discover Post
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewPostCategory("exclusive");
                      setShowAddPostModal(true);
                    }}
                    className="btn btn-outline-warning btn-sm rounded-pill px-3 text-dark fw-semibold"
                  >
                    <FaLock className="me-1" size={11} /> Add Exclusive Media
                  </button>
                </div>
              </div>
            ) : (
              <div className="row g-4">
                {filteredModelPosts.map((post) => {
                  const isExclusive = post.category === "exclusive";
                  const mediaList = post.mediaUrls && post.mediaUrls.length > 0 ? post.mediaUrls : [post.mediaUrl];
                  const currentSlide = activeCardSlides[post._id] || 0;
                  const currentMedia = mediaList[currentSlide] || post.mediaUrl;
                  const isMulti = mediaList.length > 1;

                  return (
                    <div key={post._id} className="col-12 col-md-6 col-lg-4">
                      <div className="card h-100 border rounded-4 overflow-hidden shadow-sm bg-white d-flex flex-column">
                        {/* Media container */}
                        <div className="position-relative bg-dark" style={{ height: "240px" }}>
                          {post.type === "video" ? (
                            <video
                              key={currentMedia}
                              src={resolveMediaUrl(currentMedia)}
                              controls
                              className="w-100 h-100 object-fit-cover"
                            />
                          ) : (
                            <img
                              key={currentMedia}
                              src={resolveMediaUrl(currentMedia)}
                              alt={post.title}
                              className="w-100 h-100 object-fit-cover"
                            />
                          )}

                          {/* Media Type & Carousel Badge (Top Left) */}
                          <div className="position-absolute top-0 start-0 m-2 d-flex align-items-center gap-1">
                            <span
                              className="badge rounded-pill bg-dark bg-opacity-75 text-white d-flex align-items-center gap-1 shadow-sm"
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
                            {isMulti && (
                              <span
                                className="badge rounded-pill bg-primary bg-opacity-90 text-white d-flex align-items-center gap-1 shadow-sm"
                                style={{ fontSize: "11px" }}
                              >
                                <FaLayerGroup size={10} /> {currentSlide + 1}/{mediaList.length}
                              </span>
                            )}
                          </div>

                          {/* Carousel Navigation Arrows */}
                          {isMulti && (
                            <>
                              <button
                                type="button"
                                className="btn btn-sm btn-dark bg-opacity-75 text-white position-absolute top-50 start-0 translate-middle-y ms-2 rounded-circle p-0 d-flex align-items-center justify-content-center shadow"
                                style={{ width: "28px", height: "28px", zIndex: 2 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveCardSlides((prev) => ({
                                    ...prev,
                                    [post._id]: (currentSlide - 1 + mediaList.length) % mediaList.length,
                                  }));
                                }}
                                title="Previous slide"
                              >
                                <FaChevronLeft size={11} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-dark bg-opacity-75 text-white position-absolute top-50 end-0 translate-middle-y me-2 rounded-circle p-0 d-flex align-items-center justify-content-center shadow"
                                style={{ width: "28px", height: "28px", zIndex: 2 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveCardSlides((prev) => ({
                                    ...prev,
                                    [post._id]: (currentSlide + 1) % mediaList.length,
                                  }));
                                }}
                                title="Next slide"
                              >
                                <FaChevronRight size={11} />
                              </button>
                            </>
                          )}

                          {/* Category & Rate Badge (Top Right) */}
                          <span
                            className={`position-absolute top-0 end-0 m-2 badge rounded-pill d-flex align-items-center gap-1 shadow-sm px-2 py-1 ${
                              isExclusive ? "bg-warning text-dark fw-bold" : "bg-success text-white fw-semibold"
                            }`}
                            style={{ fontSize: "11px", zIndex: 2 }}
                          >
                            {isExclusive ? (
                              <>
                                <FaLock size={10} /> {post.creditCost || 25} Credits
                              </>
                            ) : (
                              <>
                                <FaCheck size={10} /> FREE
                              </>
                            )}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="p-3 d-flex flex-column flex-grow-1 justify-content-between">
                          <div>
                            <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                              <h6 className="fw-bold text-dark mb-0 text-truncate">{post.title || "Untitled Moment"}</h6>
                              <span
                                className={`badge rounded-pill text-uppercase ${
                                  isExclusive ? "bg-warning bg-opacity-25 text-dark" : "bg-success bg-opacity-10 text-success"
                                }`}
                                style={{ fontSize: "10px" }}
                              >
                                {isExclusive ? "Exclusive" : "Discover"}
                              </span>
                            </div>
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
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MODAL: ADD NEW FEED / EXCLUSIVE POST (WITH CAROUSEL & FIXED VISIBLE FOOTER) */}
        {showAddPostModal && selectedModel && (
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", zIndex: 1060 }}
          >
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg" style={{ maxWidth: "780px", width: "95%" }}>
              <div
                className="modal-content rounded-4 border-0 shadow-lg d-flex flex-column overflow-hidden"
                style={{ maxHeight: "90vh" }}
              >
                {/* Fixed Header */}
                <div className="modal-header bg-dark text-white px-4 py-3 border-0 flex-shrink-0">
                  <div className="d-flex align-items-center gap-2">
                    {newPostCategory === "exclusive" ? (
                      <FaLock className="text-warning" />
                    ) : (
                      <FaPhotoVideo className="text-success" />
                    )}
                    <h6 className="modal-title fw-bold mb-0">
                      {newPostCategory === "exclusive" ? "Add Exclusive Media (Paid)" : "Add Discover Post (Free)"} for {selectedModel.name}
                    </h6>
                  </div>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => {
                      setShowAddPostModal(false);
                      setNewPostPreviews([]);
                      setNewPostFiles([]);
                    }}
                  />
                </div>

                <form onSubmit={handleCreatePost} className="d-flex flex-column flex-grow-1 overflow-hidden">
                  {/* Scrollable Body */}
                  <div
                    className="modal-body p-4 bg-light flex-grow-1 overflow-y-auto"
                    style={{ maxHeight: "calc(90vh - 130px)" }}
                  >
                    {/* Post Category Selection: Discover (Free) vs Exclusive (Paid) */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-dark mb-1">Post Destination &amp; Category</label>
                      <div className="d-flex gap-3">
                        <button
                          type="button"
                          className={`btn rounded-pill flex-fill py-2 d-flex align-items-center justify-content-center gap-2 ${
                            newPostCategory === "discover"
                              ? "btn-success text-white shadow-sm fw-bold"
                              : "btn-outline-secondary bg-white text-secondary"
                          }`}
                          onClick={() => setNewPostCategory("discover")}
                        >
                          <FaCheck size={13} /> Discover Post (100% Free)
                        </button>
                        <button
                          type="button"
                          className={`btn rounded-pill flex-fill py-2 d-flex align-items-center justify-content-center gap-2 ${
                            newPostCategory === "exclusive"
                              ? "btn-warning text-dark fw-bold shadow-sm"
                              : "btn-outline-secondary bg-white text-secondary"
                          }`}
                          onClick={() => setNewPostCategory("exclusive")}
                        >
                          <FaLock size={13} /> Exclusive (Paid Unlock)
                        </button>
                      </div>
                    </div>

                    {/* Price / Unlock Rate for Exclusive Post */}
                    {newPostCategory === "exclusive" ? (
                      <div
                        className="mb-3 p-3 rounded-3 border shadow-sm"
                        style={{ backgroundColor: "#fefce8", borderColor: "#fde047" }}
                      >
                        <div className="row align-items-center g-3">
                          <div className="col-12 col-md-6">
                            <label className="form-label fw-bold text-dark mb-1 d-flex align-items-center gap-1" style={{ fontSize: "14px" }}>
                              <FaCoins className="text-warning" /> Unlock Price (Credits)
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={10000}
                              className="form-control rounded-3 bg-white fw-bold text-dark"
                              style={{ height: "46px", fontSize: "16px", padding: "8px 14px", border: "1.5px solid #f59e0b" }}
                              placeholder="e.g. 25"
                              value={newPostCreditCost}
                              onChange={(e) => setNewPostCreditCost(Math.max(1, parseInt(e.target.value, 10) || 1))}
                              required={newPostCategory === "exclusive"}
                            />
                          </div>
                          <div className="col-12 col-md-6">
                            <div className="text-muted small pt-md-3" style={{ fontSize: "12px", lineHeight: "1.5" }}>
                              Users will spend this exact amount of credits in real-time to unlock and view this exclusive {newPostType}.
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-3 p-2.5 rounded-3 bg-success bg-opacity-10 border border-success border-opacity-25 d-flex align-items-center gap-2">
                        <FaCheck className="text-success flex-shrink-0" size={13} />
                        <span className="small text-success fw-medium" style={{ fontSize: "13px" }}>
                          Discover posts are 100% FREE for all users to view. (Credit Cost: 0)
                        </span>
                      </div>
                    )}

                    {/* Media Type Selection */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-dark mb-1 d-flex align-items-center justify-content-between">
                        <span>Media Format / Type</span>
                        <span className="text-muted" style={{ fontSize: "11px", fontWeight: "normal" }}>
                          {newPostType === "carousel" ? "Multiple images/videos supported" : newPostType === "video" ? "MP4 or MOV video" : "Single photo"}
                        </span>
                      </label>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className={`btn rounded-pill flex-fill py-2 d-flex align-items-center justify-content-center gap-2 ${
                            newPostType === "photo" ? "btn-primary shadow-sm fw-bold" : "btn-outline-secondary bg-white text-secondary"
                          }`}
                          onClick={() => {
                            setNewPostType("photo");
                            if (newPostFiles.length > 1) {
                              setNewPostFiles([newPostFiles[0]]);
                              setNewPostPreviews([newPostPreviews[0]]);
                            }
                          }}
                        >
                          <FaImage size={14} /> Photo
                        </button>
                        <button
                          type="button"
                          className={`btn rounded-pill flex-fill py-2 d-flex align-items-center justify-content-center gap-2 ${
                            newPostType === "carousel" ? "btn-primary shadow-sm fw-bold" : "btn-outline-secondary bg-white text-secondary"
                          }`}
                          onClick={() => setNewPostType("carousel")}
                        >
                          <FaLayerGroup size={14} /> Carousel (Multi-items)
                        </button>
                        <button
                          type="button"
                          className={`btn rounded-pill flex-fill py-2 d-flex align-items-center justify-content-center gap-2 ${
                            newPostType === "video" ? "btn-primary shadow-sm fw-bold" : "btn-outline-secondary bg-white text-secondary"
                          }`}
                          onClick={() => {
                            setNewPostType("video");
                            if (newPostFiles.length > 1) {
                              setNewPostFiles([newPostFiles[0]]);
                              setNewPostPreviews([newPostPreviews[0]]);
                            }
                          }}
                        >
                          <FaVideo size={14} /> Video
                        </button>
                      </div>
                    </div>

                    {/* File Selector */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-dark mb-1">
                        {newPostType === "carousel"
                          ? "Select Photos & Videos for Carousel (Multi-Select)"
                          : newPostType === "video"
                          ? "Select Video File"
                          : "Select Photo File"}
                      </label>
                      <input
                        type="file"
                        multiple={newPostType === "carousel"}
                        accept={newPostType === "video" ? "video/*" : newPostType === "carousel" ? "image/*,video/*" : "image/*"}
                        className="form-control rounded-3 bg-white"
                        style={{ padding: "8px 12px" }}
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length > 0) {
                            const previews = files.map((f) => ({
                              url: URL.createObjectURL(f),
                              type: (f.type.startsWith("video/") ? "video" : "photo") as "photo" | "video",
                              name: f.name,
                            }));
                            if (newPostType === "carousel") {
                              setNewPostFiles((prev) => [...prev, ...files]);
                              setNewPostPreviews((prev) => [...prev, ...previews]);
                            } else {
                              setNewPostFiles(files.slice(0, 1));
                              setNewPostPreviews(previews.slice(0, 1));
                            }
                          }
                        }}
                      />
                      <small className="text-muted d-block mt-1" style={{ fontSize: "11px" }}>
                        {newPostType === "carousel"
                          ? "You can choose multiple photos and videos at once or add more sequentially to build your Instagram-style swipe carousel."
                          : newPostType === "video"
                          ? "Choose MP4 or MOV video file to upload."
                          : "Choose JPG, PNG, or WebP photo file to upload."}
                      </small>
                    </div>

                    {/* Multi-Item Carousel Previews */}
                    {newPostPreviews.length > 0 && (
                      <div className="mb-3 p-3 bg-white rounded-3 border shadow-sm">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="small fw-bold text-dark d-flex align-items-center gap-2">
                            <FaLayerGroup className="text-primary" /> {newPostPreviews.length} {newPostPreviews.length > 1 ? "Carousel Slides" : "Media Item"} Selected
                          </span>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger py-0 px-2 rounded-pill fw-semibold"
                            style={{ fontSize: "11px" }}
                            onClick={() => {
                              setNewPostFiles([]);
                              setNewPostPreviews([]);
                            }}
                          >
                            Clear all
                          </button>
                        </div>

                        <div className="d-flex gap-3 overflow-x-auto pb-2 pt-1">
                          {newPostPreviews.map((p, idx) => (
                            <div
                              key={idx}
                              className="position-relative rounded-3 overflow-hidden border shadow-sm bg-dark flex-shrink-0"
                              style={{ width: "110px", height: "110px" }}
                            >
                              {p.type === "video" ? (
                                <video src={p.url} className="w-100 h-100 object-fit-cover" />
                              ) : (
                                <img src={p.url} alt={p.name} className="w-100 h-100 object-fit-cover" />
                              )}
                              <span
                                className="position-absolute bottom-0 start-0 m-1 badge bg-dark bg-opacity-75 text-white fw-bold"
                                style={{ fontSize: "10px" }}
                              >
                                Slide {idx + 1}
                              </span>
                              <button
                                type="button"
                                className="btn btn-sm btn-danger rounded-circle position-absolute top-0 end-0 m-1 p-0 d-flex align-items-center justify-content-center shadow"
                                style={{ width: "22px", height: "22px" }}
                                onClick={() => handleRemovePreview(idx)}
                                title="Remove file"
                              >
                                <FaTimes size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Post Title */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-dark mb-1">Title / Headline</label>
                      <input
                        type="text"
                        className="form-control rounded-3 bg-white"
                        style={{ padding: "8px 12px" }}
                        placeholder="e.g. Evening in Indiranagar, Bangalore"
                        value={newPostTitle}
                        onChange={(e) => setNewPostTitle(e.target.value)}
                        required
                      />
                    </div>

                    {/* Post Description */}
                    <div className="mb-1">
                      <label className="form-label fw-semibold small text-dark mb-1">Caption / Description</label>
                      <textarea
                        rows={3}
                        className="form-control rounded-3 bg-white"
                        style={{ padding: "8px 12px" }}
                        placeholder="e.g. Caught this quiet moment after sunset. What are you up to tonight?"
                        value={newPostDesc}
                        onChange={(e) => setNewPostDesc(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Fixed Always-Visible Footer */}
                  <div className="modal-footer bg-white border-top px-4 py-3 d-flex justify-content-end gap-3 flex-shrink-0">
                    <button
                      type="button"
                      className="btn btn-light border rounded-pill px-4 py-2 fw-medium"
                      onClick={() => {
                        setShowAddPostModal(false);
                        setNewPostPreviews([]);
                        setNewPostFiles([]);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploadingPost || newPostFiles.length === 0}
                      className={`btn rounded-pill px-4 py-2 d-flex align-items-center gap-2 shadow-sm ${
                        newPostCategory === "exclusive" ? "btn-warning text-dark fw-bold" : "btn-primary fw-bold"
                      }`}
                    >
                      {uploadingPost ? (
                        <>
                          <div className="spinner-border spinner-border-sm" role="status"></div>
                          Publishing...
                        </>
                      ) : (
                        <>
                          {newPostCategory === "exclusive" ? <FaLock size={13} /> : <FaPlus size={13} />}
                          {newPostCategory === "exclusive"
                            ? `Publish Exclusive (${newPostCreditCost} Credits)`
                            : `Publish Free Discover ${newPostPreviews.length > 1 ? "Carousel" : "Post"}`}
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
        {/* SECTION 5: CUSTOM COMMENTS & CREATOR REPLIES POPUP */}
        {activeCommentsModel && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.78)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setActiveCommentsModel(null);
                setModelAllComments([]);
              }
            }}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "20px",
                width: "100%",
                maxWidth: "780px",
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.45)",
                overflow: "hidden",
                border: "1px solid rgba(255, 255, 255, 0.15)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 1. Popup Header */}
              <div
                style={{
                  background: "linear-gradient(135deg, #111827 0%, #1e1b4b 55%, #31103f 100%)",
                  padding: "16px 22px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  color: "#ffffff",
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ position: "relative", width: "46px", height: "46px", flexShrink: 0 }}>
                    <img
                      src={resolveAvatar(activeCommentsModel.image, activeCommentsModel.gender)}
                      alt={activeCommentsModel.name}
                      style={{
                        width: "46px",
                        height: "46px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid rgba(255,255,255,0.4)",
                      }}
                      onError={(e: any) => {
                        e.target.src = activeCommentsModel.gender === "male" ? maleAvatar.src : femaleAvatar.src;
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        bottom: "1px",
                        right: "1px",
                        width: "12px",
                        height: "12px",
                        backgroundColor: "#22c55e",
                        borderRadius: "50%",
                        border: "2px solid #111827",
                      }}
                    />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <h5 style={{ margin: 0, fontWeight: 700, fontSize: "16px", color: "#ffffff" }}>
                        Comments on {activeCommentsModel.name}&apos;s Posts
                      </h5>
                      <span
                        style={{
                          backgroundColor: "#f59e0b",
                          color: "#000000",
                          fontWeight: 700,
                          fontSize: "11px",
                          padding: "2px 8px",
                          borderRadius: "20px",
                        }}
                      >
                        {modelAllComments.length} {modelAllComments.length === 1 ? "Comment" : "Comments"}
                      </span>
                      {unrepliedCount > 0 && (
                        <span
                          style={{
                            backgroundColor: "#e11d48",
                            color: "#ffffff",
                            fontWeight: 700,
                            fontSize: "10px",
                            padding: "2px 8px",
                            borderRadius: "20px",
                          }}
                        >
                          {unrepliedCount} Needs Reply
                        </span>
                      )}
                    </div>
                    <p style={{ margin: "3px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
                      Review user comments and send official verified replies as {activeCommentsModel.name}
                    </p>
                  </div>
                </div>

                {/* Header Close Button */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveCommentsModel(null);
                    setModelAllComments([]);
                  }}
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "none",
                    borderRadius: "50%",
                    width: "34px",
                    height: "34px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    flexShrink: 0,
                  }}
                  title="Close popup"
                >
                  <FaTimes size={15} />
                </button>
              </div>

              {/* 2. Sub-header Filter & Search Bar */}
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                  padding: "10px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "10px",
                  flexShrink: 0,
                }}
              >
                {/* Filter Tabs */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setCommentsFilter("all")}
                    style={{
                      padding: "5px 14px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: commentsFilter === "all" ? "none" : "1px solid #cbd5e1",
                      backgroundColor: commentsFilter === "all" ? "#0f172a" : "#ffffff",
                      color: commentsFilter === "all" ? "#ffffff" : "#475569",
                      transition: "all 0.15s",
                    }}
                  >
                    All ({modelAllComments.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommentsFilter("unreplied")}
                    style={{
                      padding: "5px 14px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: commentsFilter === "unreplied" ? "none" : "1px solid #fecdd3",
                      backgroundColor: commentsFilter === "unreplied" ? "#e11d48" : "#ffffff",
                      color: commentsFilter === "unreplied" ? "#ffffff" : "#e11d48",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s",
                    }}
                  >
                    <span>Needs Reply</span>
                    <span
                      style={{
                        backgroundColor: commentsFilter === "unreplied" ? "#ffffff" : "#e11d48",
                        color: commentsFilter === "unreplied" ? "#e11d48" : "#ffffff",
                        padding: "1px 6px",
                        borderRadius: "10px",
                        fontSize: "10px",
                        fontWeight: 700,
                      }}
                    >
                      {unrepliedCount}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommentsFilter("replied")}
                    style={{
                      padding: "5px 14px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: commentsFilter === "replied" ? "none" : "1px solid #bbf7d0",
                      backgroundColor: commentsFilter === "replied" ? "#16a34a" : "#ffffff",
                      color: commentsFilter === "replied" ? "#ffffff" : "#16a34a",
                      transition: "all 0.15s",
                    }}
                  >
                    Replied ({repliedCount})
                  </button>
                </div>

                {/* Search Bar */}
                <div style={{ position: "relative", minWidth: "220px" }}>
                  <FaSearch
                    size={12}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94a3b8",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search comment or user..."
                    value={commentsSearch}
                    onChange={(e) => setCommentsSearch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 28px 6px 32px",
                      fontSize: "12px",
                      borderRadius: "20px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      outline: "none",
                    }}
                  />
                  {commentsSearch && (
                    <button
                      type="button"
                      onClick={() => setCommentsSearch("")}
                      style={{
                        position: "absolute",
                        right: "8px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#94a3b8",
                        padding: "2px",
                      }}
                    >
                      <FaTimes size={10} />
                    </button>
                  )}
                </div>
              </div>

              {/* 3. Scrollable Comments Body */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "16px 20px",
                  backgroundColor: "#f1f5f9",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  maxHeight: "calc(90vh - 180px)",
                }}
              >
                {commentsLoading ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
                    <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
                    Loading comments...
                  </div>
                ) : modelAllComments.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
                    <FaCommentAlt size={36} style={{ color: "#94a3b8", marginBottom: "10px" }} />
                    <h6 style={{ fontWeight: 700, margin: "0 0 4px" }}>No comments yet</h6>
                    <p style={{ margin: 0, fontSize: "12.5px" }}>
                      No comments have been posted on {activeCommentsModel.name}&apos;s photos or videos yet.
                    </p>
                  </div>
                ) : filteredComments.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
                    <FaFilter size={30} style={{ color: "#94a3b8", marginBottom: "10px" }} />
                    <h6 style={{ fontWeight: 700, margin: "0 0 4px" }}>No matching comments</h6>
                    <p style={{ margin: 0, fontSize: "12.5px" }}>
                      Try changing the filter or search term to see other comments.
                    </p>
                  </div>
                ) : (
                  filteredComments.map((comment) => {
                    const isVideo =
                      comment.postType === "video" ||
                      (comment.postMediaUrl && /\.(mp4|mov|webm|m4v)$/i.test(comment.postMediaUrl));
                    const isReplied = Boolean(comment.reply?.text);

                    return (
                      <div
                        key={comment._id}
                        style={{
                          backgroundColor: "#ffffff",
                          borderRadius: "14px",
                          border: isReplied ? "1px solid #e2e8f0" : "1.5px solid #fecdd3",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                          overflow: "hidden",
                        }}
                      >
                        {/* Post Header Bar */}
                        <div
                          style={{
                            backgroundColor: "#f8fafc",
                            borderBottom: "1px solid #edf2f7",
                            padding: "8px 14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
                            {/* Media Thumbnail */}
                            <div
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "8px",
                                backgroundColor: "#0f172a",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#ffffff",
                                overflow: "hidden",
                                flexShrink: 0,
                              }}
                            >
                              {isVideo ? (
                                <div style={{ textAlign: "center", fontSize: "8px", fontWeight: 700, color: "#f43f5e" }}>
                                  <FaVideo size={13} />
                                  <div style={{ lineHeight: 1 }}>REEL</div>
                                </div>
                              ) : comment.postMediaUrl ? (
                                <img
                                  src={resolveMediaUrl(comment.postMediaUrl)}
                                  alt="Post"
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  onError={(e: any) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                              ) : (
                                <FaImage size={15} style={{ opacity: 0.6 }} />
                              )}
                            </div>

                            {/* Title & Badges */}
                            <div style={{ minWidth: 0 }}>
                              <span
                                style={{
                                  fontSize: "12.5px",
                                  fontWeight: 700,
                                  color: "#1e293b",
                                  display: "block",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  maxWidth: "320px",
                                }}
                              >
                                {comment.postTitle || "Post"}
                              </span>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                                <span
                                  style={{
                                    fontSize: "9.5px",
                                    fontWeight: 600,
                                    padding: "1px 7px",
                                    borderRadius: "10px",
                                    backgroundColor: comment.postCategory === "exclusive" ? "#fef3c7" : "#dcfce7",
                                    color: comment.postCategory === "exclusive" ? "#92400e" : "#166534",
                                  }}
                                >
                                  {comment.postCategory === "exclusive" ? "Exclusive Vault" : "Discover Feed"}
                                </span>
                                <span
                                  style={{
                                    fontSize: "9.5px",
                                    padding: "1px 6px",
                                    borderRadius: "10px",
                                    backgroundColor: "#f1f5f9",
                                    color: "#64748b",
                                  }}
                                >
                                  {isVideo ? "Video Reel" : comment.postType === "carousel" ? "Carousel" : "Photo"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Post Date */}
                          <span style={{ fontSize: "11px", color: "#94a3b8", flexShrink: 0 }}>
                            {comment.createdAt
                              ? new Date(comment.createdAt).toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : ""}
                          </span>
                        </div>

                        {/* Comment Body */}
                        <div style={{ padding: "14px" }}>
                          {/* User Row */}
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                            <div
                              style={{
                                width: "34px",
                                height: "34px",
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                                color: "#ffffff",
                                fontWeight: 700,
                                fontSize: "13px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {(comment.userName || "U").slice(0, 1).toUpperCase()}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  marginBottom: "4px",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                                    {comment.userName || "User"}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "9.5px",
                                      padding: "1px 6px",
                                      borderRadius: "8px",
                                      backgroundColor: "#f1f5f9",
                                      color: "#64748b",
                                    }}
                                  >
                                    User
                                  </span>
                                </div>
                                <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                                  {comment.createdAt
                                    ? new Date(comment.createdAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : ""}
                                </span>
                              </div>

                              {/* Comment Text Bubble */}
                              <div
                                style={{
                                  backgroundColor: "#f8fafc",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "10px",
                                  padding: "9px 13px",
                                  fontSize: "13px",
                                  color: "#1e293b",
                                  lineHeight: "1.45",
                                }}
                              >
                                {comment.text}
                              </div>
                            </div>
                          </div>

                          {/* Creator Reply (If exists) */}
                          {comment.reply?.text && (
                            <div
                              style={{
                                marginLeft: "44px",
                                marginTop: "10px",
                                backgroundColor: "#fff1f2",
                                border: "1px solid #fecdd3",
                                borderLeft: "3.5px solid #f43f5e",
                                borderRadius: "10px",
                                padding: "9px 13px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  marginBottom: "4px",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <img
                                    src={resolveAvatar(activeCommentsModel.image, activeCommentsModel.gender)}
                                    alt={activeCommentsModel.name}
                                    style={{
                                      width: "20px",
                                      height: "20px",
                                      borderRadius: "50%",
                                      objectFit: "cover",
                                    }}
                                  />
                                  <span
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      color: "#be123c",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                    }}
                                  >
                                    {comment.reply.author || activeCommentsModel.name}
                                    <FaCheckCircle size={10} color="#3b82f6" />
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "9px",
                                      fontWeight: 600,
                                      padding: "1px 6px",
                                      borderRadius: "8px",
                                      backgroundColor: "#e11d48",
                                      color: "#ffffff",
                                    }}
                                  >
                                    Official Reply
                                  </span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  {comment.reply.repliedAt && (
                                    <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                                      {new Date(comment.reply.repliedAt).toLocaleDateString([], {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setReplyInputs((prev) => ({
                                        ...prev,
                                        [comment._id]: comment.reply.text,
                                      }))
                                    }
                                    style={{
                                      background: "none",
                                      border: "none",
                                      color: "#be123c",
                                      fontSize: "11px",
                                      fontWeight: 600,
                                      cursor: "pointer",
                                      padding: 0,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "3px",
                                    }}
                                  >
                                    <FaEdit size={10} /> Edit
                                  </button>
                                </div>
                              </div>
                              <div style={{ fontSize: "12.5px", color: "#881337", lineHeight: "1.4" }}>
                                {comment.reply.text}
                              </div>
                            </div>
                          )}

                          {/* Reply Input Bar */}
                          <div
                            style={{
                              marginTop: "12px",
                              paddingTop: "12px",
                              borderTop: "1px solid #f1f5f9",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <img
                              src={resolveAvatar(activeCommentsModel.image, activeCommentsModel.gender)}
                              alt={activeCommentsModel.name}
                              style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "50%",
                                objectFit: "cover",
                                flexShrink: 0,
                              }}
                            />
                            <input
                              type="text"
                              placeholder={
                                comment.reply?.text
                                  ? `Update reply as ${activeCommentsModel.name}...`
                                  : `Reply to ${comment.userName || "user"} as ${activeCommentsModel.name}...`
                              }
                              value={replyInputs[comment._id] || ""}
                              onChange={(e) =>
                                setReplyInputs((prev) => ({
                                  ...prev,
                                  [comment._id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleSendReply(comment);
                                }
                              }}
                              style={{
                                flex: 1,
                                padding: "8px 14px",
                                fontSize: "12.5px",
                                borderRadius: "20px",
                                border: "1px solid #cbd5e1",
                                backgroundColor: "#f8fafc",
                                outline: "none",
                              }}
                            />
                            <button
                              type="button"
                              disabled={!replyInputs[comment._id]?.trim() || replyingCommentId === comment._id}
                              onClick={() => handleSendReply(comment)}
                              style={{
                                background: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "20px",
                                padding: "8px 18px",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor:
                                  !replyInputs[comment._id]?.trim() || replyingCommentId === comment._id
                                    ? "not-allowed"
                                    : "pointer",
                                opacity:
                                  !replyInputs[comment._id]?.trim() || replyingCommentId === comment._id ? 0.6 : 1,
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                flexShrink: 0,
                                boxShadow: "0 2px 4px rgba(225,29,72,0.25)",
                              }}
                            >
                              {replyingCommentId === comment._id ? (
                                <span>Sending...</span>
                              ) : (
                                <>
                                  <FaPaperPlane size={10} />
                                  <span>{comment.reply?.text ? "Update" : "Reply"}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* 4. Popup Footer */}
              <div
                style={{
                  padding: "12px 20px",
                  backgroundColor: "#ffffff",
                  borderTop: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Showing <strong>{filteredComments.length}</strong> of <strong>{modelAllComments.length}</strong> comments
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCommentsModel(null);
                      setModelAllComments([]);
                    }}
                    style={{
                      padding: "7px 20px",
                      borderRadius: "20px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#f8fafc",
                      color: "#334155",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCommentsModel(null);
                      setModelAllComments([]);
                    }}
                    style={{
                      padding: "7px 24px",
                      borderRadius: "20px",
                      border: "none",
                      backgroundColor: "#0f172a",
                      color: "#ffffff",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(15,23,42,0.2)",
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── ADD CREDITS TO USER MODAL ─── */}
        {creditModal.open && creditModal.user && (
          <div
            className="dialog"
            style={{ zIndex: 1070 }}
            onClick={() => setCreditModal((prev) => ({ ...prev, open: false }))}
          >
            <div className="w-100">
              <div className="row justify-content-center m-0">
                <div className="col-xl-4 col-md-5 col-11 d-flex justify-content-center">
                  <div
                    className="commonmainDiaogBox text-start"
                    style={{ width: "100%", maxWidth: "420px", maxHeight: "90vh", overflowY: "auto" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Modal Header */}
                    <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="rounded-circle bg-warning bg-opacity-10 text-warning d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{ width: "38px", height: "38px" }}
                        >
                          <FaCoins size={18} />
                        </div>
                        <div>
                          <h6 className="fw-bold mb-0 text-dark">Add Credits to User</h6>
                          <small className="text-muted text-truncate d-block" style={{ maxWidth: "260px" }}>
                            {creditModal.user.name} ({creditModal.user.email})
                          </small>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => setCreditModal((prev) => ({ ...prev, open: false }))}
                      />
                    </div>

                    {/* Current Balance Card */}
                    <div className="rounded-3 bg-light p-3 mb-3 border d-flex align-items-center justify-content-between">
                      <span className="text-muted small fw-semibold">Current Balance:</span>
                      <span className="badge bg-warning text-dark fs-14 fw-bold px-2.5 py-1.5 d-inline-flex align-items-center gap-1.5 shadow-sm">
                        <FaCoins size={13} /> {(creditModal.user.credits || 0).toLocaleString()} Credits
                      </span>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmitAddCredits}>
                      <div className="mb-3">
                        <label className="form-label text-dark small fw-bold mb-1">
                          Credits to Add / Deduct
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-white text-warning border-end-0">
                            <FaCoins />
                          </span>
                          <input
                            type="number"
                            className="form-control border-start-0 fw-bold fs-15"
                            placeholder="e.g. 100 or 500"
                            value={creditModal.amount}
                            onChange={(e) =>
                              setCreditModal((prev) => ({ ...prev, amount: e.target.value }))
                            }
                            required
                          />
                        </div>
                        <small className="text-muted" style={{ fontSize: "11px" }}>
                          Enter positive (e.g. 100) to add, or negative (e.g. -50) to deduct.
                        </small>
                      </div>

                      {/* Quick Presets */}
                      <div className="mb-3">
                        <label className="form-label text-muted small mb-1" style={{ fontSize: "11px" }}>
                          Quick Presets:
                        </label>
                        <div className="d-flex gap-1.5 flex-wrap">
                          {[50, 100, 300, 500, 1000].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() =>
                                setCreditModal((prev) => ({ ...prev, amount: preset }))
                              }
                              className={`btn btn-sm rounded-pill px-2.5 py-0.5 fw-semibold ${
                                Number(creditModal.amount) === preset
                                  ? "btn-warning text-dark"
                                  : "btn-outline-secondary"
                              }`}
                              style={{ fontSize: "12px" }}
                            >
                              +{preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Note / Reason */}
                      <div className="mb-4">
                        <label className="form-label text-dark small fw-bold mb-1">
                          Reason / Note (Optional)
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. Promotional gift, Admin recharge"
                          value={creditModal.note}
                          onChange={(e) =>
                            setCreditModal((prev) => ({ ...prev, note: e.target.value }))
                          }
                        />
                      </div>

                      {/* Modal Footer Buttons */}
                      <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                        <button
                          type="button"
                          className="btn btn-light btn-sm rounded-pill px-3"
                          onClick={() => setCreditModal((prev) => ({ ...prev, open: false }))}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={creditModal.submitting}
                          className="btn btn-warning btn-sm rounded-pill px-4 text-dark fw-bold d-flex align-items-center gap-1 shadow-sm"
                        >
                          <FaCoins size={12} />
                          <span>{creditModal.submitting ? "Updating..." : "Add Credits"}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── STANDARD ADMIN CONFIRMATION DIALOG ─── */}
        <CommonDialog
          open={confirmModal.open}
          onCancel={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
          onConfirm={() => {
            const fn = confirmModal.onConfirm;
            setConfirmModal((prev) => ({ ...prev, open: false }));
            if (fn) fn();
          }}
          title={confirmModal.title}
          description={confirmModal.description}
          text={confirmModal.text}
        />
      </div>
    </RootLayout>
  );
};

export default AiModelManage;
