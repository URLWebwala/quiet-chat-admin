import React, { useEffect, useState, useMemo } from "react";
import RootLayout from "@/component/layout/Layout";
import Title from "@/extra/Title";
import { toast } from "react-toastify";
import axios from "axios";
import Image from "next/image";
import femaleAvatar from "@/assets/images/female.png";
import maleAvatar from "@/assets/images/male.png";
import { baseURL } from "@/utils/config";
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
} from "react-icons/fa";

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

  // Normalized API base URL
  const apiBase = useMemo(() => {
    return (baseURL || "https://admin.quietchat.in/").replace(/\/$/, "");
  }, []);

  // 1. Fetch Models Summary
  const loadModelsSummary = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiBase}/api/admin/model-manage/hosts-summary`);
      if (res.data?.status) {
        setModels(res.data.hosts || []);
        setTotalRegisteredUsers(res.data.totalRegisteredUsers || 0);
        setTotalMessages(res.data.totalMessages || 0);
      }
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

  useEffect(() => {
    if (selectedModel) {
      loadModelUsers(selectedModel.slug);
    }
  }, [selectedModel, userSearch]);

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
              <div className="position-relative" style={{ width: "42px", height: "42px" }}>
                {selectedModel.image ? (
                  <img
                    src={selectedModel.image}
                    alt={selectedModel.name}
                    className="rounded-circle border object-fit-cover w-100 h-100 shadow-sm"
                    onError={(e: any) => {
                      e.target.src = femaleAvatar.src;
                    }}
                  />
                ) : (
                  <Image
                    src={selectedModel.gender === "male" ? maleAvatar : femaleAvatar}
                    alt={selectedModel.name}
                    width={42}
                    height={42}
                    className="rounded-circle border"
                  />
                )}
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
                {/* Search */}
                <div className="input-group input-group-sm" style={{ width: "240px" }}>
                  <span className="input-group-text bg-white border-end-0">
                    <FaSearch className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search by name, city..."
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                  />
                </div>

                {/* Flavor filter */}
                <select
                  className="form-select form-select-sm"
                  style={{ width: "180px" }}
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
                  className="btn btn-sm btn-light border rounded-pill px-3 d-flex align-items-center gap-1"
                >
                  <FaSyncAlt /> Refresh
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
                            {model.image ? (
                              <img
                                src={model.image}
                                alt={model.name}
                                className="rounded-circle border object-fit-cover w-100 h-100 shadow-sm"
                                onError={(e: any) => {
                                  e.target.src = femaleAvatar.src;
                                }}
                              />
                            ) : (
                              <Image
                                src={model.gender === "male" ? maleAvatar : femaleAvatar}
                                alt={model.name}
                                width={64}
                                height={64}
                                className="rounded-circle border"
                              />
                            )}
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

        {/* SECTION 2: MODEL USERS LIST (Visible When a Model is Selected) */}
        {selectedModel && (
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
                <div className="input-group input-group-sm" style={{ width: "260px" }}>
                  <span className="input-group-text bg-white border-end-0">
                    <FaSearch className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
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
                    <div className="position-relative" style={{ width: "44px", height: "44px" }}>
                      {selectedModel?.image ? (
                        <img
                          src={selectedModel.image}
                          alt={selectedModel.name}
                          className="rounded-circle border object-fit-cover w-100 h-100"
                          onError={(e: any) => {
                            e.target.src = femaleAvatar.src;
                          }}
                        />
                      ) : (
                        <Image
                          src={femaleAvatar}
                          alt="Model"
                          width={44}
                          height={44}
                          className="rounded-circle border"
                        />
                      )}
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
