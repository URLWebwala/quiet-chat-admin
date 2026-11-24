import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FaPaperPlane,
  FaSignOutAlt,
  FaRedo,
  FaUser,
  FaLock,
  FaEnvelope,
  FaHeart,
  FaCircle,
  FaShieldAlt,
  FaSmile,
} from "react-icons/fa";

// Default API Base for Model-User APIs
const DEFAULT_API_BASE =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5001"
    : "https://admin.quietchat.in";

const MODEL_SLUG = "shanaya-prototype";
const MODEL_NAME = "Shanaya";
const MODEL_AVATAR =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop";

export default function ShanayaPrototype() {
  // Config
  const [apiBase, setApiBase] = useState(DEFAULT_API_BASE);

  // Auth State
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Auth Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("male");

  // Chat State
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Check saved token on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem("shanaya_jwt_token");
      const savedUser = localStorage.getItem("shanaya_user");
      if (savedToken) {
        setToken(savedToken);
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (e) {}
        }
        // Verify with profile endpoint
        fetchProfile(savedToken);
      }
    }
  }, []);

  // Fetch Profile
  const fetchProfile = async (authToken) => {
    try {
      const res = await axios.get(`${apiBase}/api/model-user/profile`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.data?.status && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem("shanaya_user", JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.warn("Profile fetch error, token might be expired:", err.message);
      handleLogout();
    }
  };

  // Fetch Chat History
  const fetchHistory = async (authToken) => {
    setHistoryLoading(true);
    try {
      const res = await axios.get(`${apiBase}/api/model-user/history`, {
        headers: { Authorization: `Bearer ${authToken || token}` },
      });
      if (res.data?.status && Array.isArray(res.data.chats)) {
        if (res.data.chats.length > 0) {
          setMessages(
            res.data.chats.map((c) => ({
              id: c._id,
              sender: c.sender,
              text: c.message,
              time: new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            }))
          );
        } else {
          // Default welcoming opener
          setMessages([
            {
              id: "intro_msg",
              sender: "host",
              text: "Hey there... was hoping you'd drop by tonight ✨ How was your day?",
              time: "Just now",
            },
          ]);
        }
      }
    } catch (err) {
      console.error("Fetch history error:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchHistory(token);
    }
  }, [token]);

  // Handle Login / Register Submit
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      if (authMode === "register") {
        if (!name.trim()) throw new Error("Please enter your name");
        if (!email.trim()) throw new Error("Please enter your email");
        if (!password.trim()) throw new Error("Please enter a password");

        const res = await axios.post(`${apiBase}/api/model-user/register`, {
          hostSlug: MODEL_SLUG,
          hostName: MODEL_NAME,
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          gender,
        });

        if (res.data?.status) {
          const newToken = res.data.token;
          const newUser = res.data.user;
          setToken(newToken);
          setUser(newUser);
          localStorage.setItem("shanaya_jwt_token", newToken);
          localStorage.setItem("shanaya_user", JSON.stringify(newUser));
        } else {
          throw new Error(res.data?.message || "Registration failed");
        }
      } else {
        // Login mode
        if (!email.trim()) throw new Error("Please enter your email");
        if (!password.trim()) throw new Error("Please enter your password");

        const res = await axios.post(`${apiBase}/api/model-user/login`, {
          hostSlug: MODEL_SLUG,
          email: email.trim(),
          password: password.trim(),
        });

        if (res.data?.status) {
          const newToken = res.data.token;
          const newUser = res.data.user;
          setToken(newToken);
          setUser(newUser);
          localStorage.setItem("shanaya_jwt_token", newToken);
          localStorage.setItem("shanaya_user", JSON.stringify(newUser));
        } else {
          throw new Error(res.data?.message || "Login failed");
        }
      }
    } catch (err) {
      setAuthError(err.response?.data?.message || err.message || "Authentication error occurred");
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setMessages([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("shanaya_jwt_token");
      localStorage.removeItem("shanaya_user");
    }
  };

  // Handle Reset Memory
  const handleResetChat = async () => {
    if (!window.confirm("Are you sure you want to reset your conversation history with Shanaya?")) return;
    try {
      await axios.post(
        `${apiBase}/api/model-user/reset`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages([
        {
          id: "reset_msg",
          sender: "host",
          text: "Hey! New start... tell me what's on your mind right now ✨",
          time: "Just now",
        },
      ]);
    } catch (err) {
      alert("Failed to reset memory");
    }
  };

  // Handle Send Message
  const handleSendMessage = async (textToSend) => {
    const msgText = (textToSend || inputText).trim();
    if (!msgText || isTyping) return;

    // Optimistic UI update
    const userMsg = {
      id: "u_" + Date.now(),
      sender: "user",
      text: msgText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      const res = await axios.post(
        `${apiBase}/api/model-user/chat`,
        { message: msgText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.status && res.data.reply) {
        const hostMsg = {
          id: "h_" + Date.now(),
          sender: "host",
          text: res.data.reply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, hostMsg]);
      } else {
        throw new Error(res.data?.message || "No reply from Shanaya");
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: "err_" + Date.now(),
          sender: "host",
          text: "Hmm, network me thodi glitch thi... can you say that again? 💕",
          time: "Just now",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickPrompts = [
    "Hey Shanaya! What are you doing tonight? ✨",
    "Tell me about your day! Had any coffee yet? ☕",
    "What kind of vibes do you like in someone? 😉",
    "Late night thoughts... what's on your mind? 🌙",
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#070a12",
        backgroundImage:
          "radial-gradient(circle at 50% 0%, rgba(236, 72, 153, 0.15) 0%, transparent 60%), radial-gradient(circle at 100% 100%, rgba(147, 51, 234, 0.12) 0%, transparent 50%)",
        color: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      {/* =========================================================================
          VIEW 1: AUTHENTICATION SCREEN (LOGIN / REGISTER)
      ========================================================================= */}
      {!token ? (
        <div
          className="glass-card"
          style={{
            width: "100%",
            maxWidth: "460px",
            borderRadius: "28px",
            padding: "36px 32px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px rgba(236, 72, 153, 0.15)",
          }}
        >
          {/* Host Branding Card */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div style={{ position: "relative", display: "inline-block", marginBottom: "16px" }}>
              <img
                src={MODEL_AVATAR}
                alt={MODEL_NAME}
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid #ec4899",
                  boxShadow: "0 0 25px rgba(236, 72, 153, 0.4)",
                }}
              />
              <span
                className="online-pulse"
                style={{
                  position: "absolute",
                  bottom: "6px",
                  right: "6px",
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  backgroundColor: "#22c55e",
                  border: "3px solid #0b0f19",
                }}
              ></span>
            </div>

            <h2 style={{ fontSize: "26px", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.5px" }}>
              Chat with {MODEL_NAME}
            </h2>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "linear-gradient(90deg, #ec4899, #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: "700",
                fontSize: "13px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginTop: "4px",
              }}
            >
              ✨ Glamorous &amp; Flirty Persona
            </div>
            <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "6px", lineHeight: "1.5" }}>
              Personal 1-on-1 private chat with Shanaya. Create your account or sign in to start talking.
            </p>
          </div>

          {/* Tab Switcher */}
          <div
            style={{
              display: "flex",
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              borderRadius: "14px",
              padding: "4px",
              marginBottom: "24px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setAuthError("");
              }}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: "10px",
                border: "none",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
                backgroundColor: authMode === "login" ? "#ec4899" : "transparent",
                color: authMode === "login" ? "#ffffff" : "#94a3b8",
                transition: "all 0.2s ease",
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("register");
                setAuthError("");
              }}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: "10px",
                border: "none",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
                backgroundColor: authMode === "register" ? "#ec4899" : "transparent",
                color: authMode === "register" ? "#ffffff" : "#94a3b8",
                transition: "all 0.2s ease",
              }}
            >
              Create Account
            </button>
          </div>

          {/* Error Alert */}
          {authError && (
            <div
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                color: "#fca5a5",
                borderRadius: "12px",
                padding: "10px 14px",
                fontSize: "13px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FaShieldAlt /> {authError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuthSubmit}>
            {authMode === "register" && (
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px", fontWeight: "600" }}>
                  Your Name
                </label>
                <div style={{ position: "relative" }}>
                  <FaUser style={{ position: "absolute", left: "14px", top: "14px", color: "#64748b" }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="glass-input"
                    style={{
                      width: "100%",
                      padding: "12px 14px 12px 40px",
                      borderRadius: "12px",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px", fontWeight: "600" }}>
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <FaEnvelope style={{ position: "absolute", left: "14px", top: "14px", color: "#64748b" }} />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input"
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 40px",
                    borderRadius: "12px",
                    fontSize: "14px",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: authMode === "register" ? "16px" : "24px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px", fontWeight: "600" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <FaLock style={{ position: "absolute", left: "14px", top: "14px", color: "#64748b" }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input"
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 40px",
                    borderRadius: "12px",
                    fontSize: "14px",
                  }}
                />
              </div>
            </div>

            {authMode === "register" && (
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px", fontWeight: "600" }}>
                  Gender
                </label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setGender("male")}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "10px",
                      border: gender === "male" ? "2px solid #3b82f6" : "1px solid rgba(255,255,255,0.1)",
                      backgroundColor: gender === "male" ? "rgba(59, 130, 246, 0.2)" : "transparent",
                      color: "#ffffff",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender("female")}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "10px",
                      border: gender === "female" ? "2px solid #ec4899" : "1px solid rgba(255,255,255,0.1)",
                      backgroundColor: gender === "female" ? "rgba(236, 72, 153, 0.2)" : "transparent",
                      color: "#ffffff",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  >
                    Female
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "14px",
                border: "none",
                background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
                color: "#ffffff",
                fontWeight: "700",
                fontSize: "15px",
                cursor: authLoading ? "not-allowed" : "pointer",
                boxShadow: "0 10px 20px -5px rgba(236, 72, 153, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {authLoading ? (
                "Connecting..."
              ) : authMode === "register" ? (
                <>Start Chatting with {MODEL_NAME} ✨</>
              ) : (
                <>Sign In &amp; Resume Chat 💕</>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <small style={{ color: "#64748b", fontSize: "11px" }}>
              Powered by QuietChat AI Model Architecture &bull; Model: <code>{MODEL_SLUG}</code>
            </small>
          </div>
        </div>
      ) : (
        /* =========================================================================
            VIEW 2: FULL 1-ON-1 PERSONA CHAT ROOM SCREEN
        ========================================================================= */
        <div
          className="glass-card"
          style={{
            width: "100%",
            maxWidth: "760px",
            height: "92vh",
            borderRadius: "28px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 50px rgba(236, 72, 153, 0.15)",
          }}
        >
          {/* CHAT HEADER */}
          <div
            style={{
              padding: "16px 24px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              backgroundColor: "rgba(11, 15, 25, 0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            {/* Host Identity */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ position: "relative", width: "48px", height: "48px" }}>
                <img
                  src={MODEL_AVATAR}
                  alt={MODEL_NAME}
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #ec4899",
                  }}
                />
                <span
                  className="online-pulse"
                  style={{
                    position: "absolute",
                    bottom: "2px",
                    right: "2px",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: "#22c55e",
                    border: "2px solid #070a12",
                  }}
                ></span>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#ffffff", margin: 0 }}>
                    {MODEL_NAME}
                  </h3>
                  <span
                    style={{
                      background: "rgba(236, 72, 153, 0.15)",
                      color: "#f472b6",
                      border: "1px solid rgba(236, 72, 153, 0.3)",
                      fontSize: "10px",
                      fontWeight: "700",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      textTransform: "uppercase",
                    }}
                  >
                    AI Host
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: isTyping ? "#ec4899" : "#22c55e", fontWeight: "500", marginTop: "2px" }}>
                  {isTyping ? "Shanaya is typing..." : "● Online & Ready"}
                </div>
              </div>
            </div>

            {/* User Pill & Action Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "20px",
                  padding: "4px 12px",
                  fontSize: "12px",
                  color: "#cbd5e1",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <FaSmile style={{ color: "#38bdf8" }} />
                <span>{user?.name || "User"}</span>
              </div>

              <button
                type="button"
                onClick={handleResetChat}
                title="Reset conversation memory"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#94a3b8",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FaRedo size={12} />
              </button>

              <button
                type="button"
                onClick={handleLogout}
                title="Log out"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#f87171",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FaSignOutAlt size={12} />
              </button>
            </div>
          </div>

          {/* CHAT MESSAGES BODY */}
          <div
            style={{
              flex: 1,
              padding: "24px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {historyLoading && (
              <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: "13px" }}>
                Loading conversation with Shanaya...
              </div>
            )}

            {messages.map((m) => {
              const isUser = m.sender === "user";
              return (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    justifyContent: isUser ? "flex-end" : "flex-start",
                    alignItems: "flex-end",
                    gap: "8px",
                  }}
                >
                  {!isUser && (
                    <img
                      src={MODEL_AVATAR}
                      alt={MODEL_NAME}
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        marginBottom: "4px",
                      }}
                    />
                  )}

                  <div
                    style={{
                      maxWidth: "76%",
                      borderRadius: isUser ? "22px 22px 4px 22px" : "22px 22px 22px 4px",
                      padding: "14px 18px",
                      fontSize: "14px",
                      lineHeight: "1.5",
                      background: isUser
                        ? "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)"
                        : "rgba(17, 24, 39, 0.9)",
                      color: "#ffffff",
                      border: isUser ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
                      boxShadow: isUser
                        ? "0 8px 20px -4px rgba(236, 72, 153, 0.4)"
                        : "0 8px 20px -4px rgba(0, 0, 0, 0.3)",
                    }}
                  >
                    <div>{m.text}</div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: isUser ? "rgba(255,255,255,0.7)" : "#64748b",
                        marginTop: "6px",
                        textAlign: isUser ? "right" : "left",
                      }}
                    >
                      {m.time}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
                <img
                  src={MODEL_AVATAR}
                  alt={MODEL_NAME}
                  style={{ width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover" }}
                />
                <div
                  style={{
                    background: "rgba(17, 24, 39, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "22px 22px 22px 4px",
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span
                    className="bounce-1"
                    style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#ec4899" }}
                  ></span>
                  <span
                    className="bounce-2"
                    style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#ec4899" }}
                  ></span>
                  <span
                    className="bounce-3"
                    style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#ec4899" }}
                  ></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* QUICK SUGGESTION CHIPS */}
          <div
            style={{
              padding: "8px 20px",
              display: "flex",
              gap: "8px",
              overflowX: "auto",
              backgroundColor: "rgba(11, 15, 25, 0.6)",
              borderTop: "1px solid rgba(255, 255, 255, 0.04)",
            }}
          >
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(p)}
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "16px",
                  padding: "6px 14px",
                  color: "#cbd5e1",
                  fontSize: "12px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* INPUT BAR */}
          <div
            style={{
              padding: "16px 20px",
              backgroundColor: "rgba(11, 15, 25, 0.95)",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{ display: "flex", gap: "10px", alignItems: "center" }}
            >
              <input
                type="text"
                placeholder="Message Shanaya..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isTyping}
                className="glass-input"
                style={{
                  flex: 1,
                  padding: "14px 20px",
                  borderRadius: "24px",
                  fontSize: "14px",
                }}
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                style={{
                  background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
                  border: "none",
                  borderRadius: "50%",
                  width: "48px",
                  height: "48px",
                  color: "#ffffff",
                  cursor: !inputText.trim() || isTyping ? "not-allowed" : "pointer",
                  opacity: !inputText.trim() || isTyping ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 16px rgba(236, 72, 153, 0.4)",
                  flexShrink: 0,
                }}
              >
                <FaPaperPlane size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
