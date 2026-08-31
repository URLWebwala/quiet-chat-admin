"use client";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/store/store";
import { useRouter } from "next/router";
import { login, setLoading } from "@/store/adminSlice";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../component/lib/firebaseConfig";
import { DangerRight } from "@/api/toastServices";
import { projectName } from "@/utils/config";

interface RootState {
  admin: {
    isAuth: boolean;
    admin: Object;
    isLoading: boolean;
  };
}

export default function Login() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuth, isLoading } = useSelector(
    (state: RootState) => state.admin
  );
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [error, setError] = useState({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("remembered_email");
      const savedPassword = localStorage.getItem("remembered_password");
      const savedRemember = localStorage.getItem("rememberMe");
      if (savedEmail) setEmail(savedEmail);
      if (savedPassword) setPassword(savedPassword);
      if (savedRemember !== null) setRememberMe(savedRemember === "true");
    }
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      let errorObj: any = {};
      if (!email) errorObj.email = "Email is required";
      if (!password) errorObj.password = "Password is required";
      return setError(errorObj);
    }

    dispatch(setLoading(true));
    setLoginLoading(true);

    if (rememberMe) {
      localStorage.setItem("remembered_email", email);
      localStorage.setItem("remembered_password", password);
      localStorage.setItem("rememberMe", "true");
    } else {
      localStorage.removeItem("remembered_email");
      localStorage.removeItem("remembered_password");
      localStorage.removeItem("rememberMe");
    }

    const token = await loginUser(email, password);

    let payload: any = {
      email,
      password,
    };

    if (token) {
      dispatch(login(payload));
    }
    dispatch(setLoading(false));
    setLoginLoading(false);
  };

  const loginUser = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = userCredential?.user?.uid;

      if (!userCredential.user) {
        console.error("No user found after login");
        return null;
      }

      const token = await userCredential?.user?.getIdToken(true);
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("uid", uid);

      return token;
    } catch (error: any) {
      DangerRight("Invalid credentials. Please check your email and password.");
      return null;
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="login-wrapper">
      {/* ─── Left Hero Showcase (55% width on desktop) ───────────────── */}
      <div className="login-hero-pane">
        {/* Ambient background glow elements */}
        <div
          style={{
            position: "absolute",
            width: "380px",
            height: "380px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(99, 102, 241, 0.15))",
            filter: "blur(90px)",
            top: "10%",
            left: "5%",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(139, 92, 246, 0.1))",
            filter: "blur(80px)",
            bottom: "10%",
            right: "5%",
            pointerEvents: "none",
          }}
        />

        {/* Top Branding Row */}
        <div className="position-relative d-flex align-items-center justify-content-between z-1">
          <div className="d-flex align-items-center gap-3">
            <img
              src="/white logo.svg"
              alt="Quiet Chat"
              style={{ height: "42px", objectFit: "contain" }}
              onError={(e: any) => {
                e.currentTarget.src = "/logo web.svg";
              }}
            />
          </div>
          <span
            className="badge rounded-pill px-3 py-2 d-inline-flex align-items-center gap-2"
            style={{
              background: "rgba(255, 255, 255, 0.07)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#C4B5FD",
              fontSize: "12px",
              fontWeight: 500,
              backdropFilter: "blur(12px)",
              letterSpacing: "0.5px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#10B981",
                boxShadow: "0 0 10px #10B981",
              }}
            />
            Enterprise Admin v2.0
          </span>
        </div>

        {/* Center 3D Showcase Card */}
        <div className="position-relative my-auto py-4 z-1 d-flex flex-column align-items-center">
          <div
            className="p-3 rounded-4 shadow-2-strong"
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.6), 0 0 40px rgba(139, 92, 246, 0.15)",
              maxWidth: "520px",
              width: "100%",
            }}
          >
            <div
              className="rounded-4 overflow-hidden position-relative"
              style={{ width: "100%", aspectRatio: "1/1", maxHeight: "360px" }}
            >
              <img
                src="/images/login-hero.jpg"
                alt="AI Dating & Chat Connections"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(15, 14, 23, 0.85) 0%, rgba(15, 14, 23, 0) 50%)",
                }}
              />
              <div
                className="position-absolute bottom-0 start-0 end-0 p-3 text-white d-flex align-items-center justify-content-between"
              >
                <div>
                  <h6 className="mb-0 fw-bold" style={{ fontSize: "15px", letterSpacing: "0.2px" }}>
                    AI Conversation Engine
                  </h6>
                  <p className="mb-0 text-white-50" style={{ fontSize: "12px" }}>
                    Smart matchmaking & automated real-time chat
                  </p>
                </div>
                <span
                  className="badge rounded-pill px-2.5 py-1.5"
                  style={{
                    backgroundColor: "rgba(124, 58, 237, 0.6)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    fontSize: "11px",
                  }}
                >
                  ⚡ Live AI
                </span>
              </div>
            </div>
          </div>

          <div className="text-center mt-4 px-3" style={{ maxWidth: "520px" }}>
            <h3
              className="fw-bold text-white mb-2"
              style={{
                fontSize: "24px",
                letterSpacing: "-0.3px",
                background: "linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 60%, #C4B5FD 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Powering Smart Dating & Real Connections
            </h3>
            <p
              className="text-white-50 mb-0"
              style={{ fontSize: "13.5px", lineHeight: "1.6" }}
            >
              Manage AI host personalities, oversee live user interactions, monitor revenue streams, and configure platform settings in real-time.
            </p>
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div className="position-relative z-1 d-flex align-items-center justify-content-center gap-3 flex-wrap">
          <div
            className="px-3 py-2 rounded-3 d-flex align-items-center gap-2"
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              color: "#E2E8F0",
              fontSize: "12px",
            }}
          >
            <i className="ri-shield-check-fill text-success fs-6"></i>
            <span>256-bit SSL Protection</span>
          </div>
          <div
            className="px-3 py-2 rounded-3 d-flex align-items-center gap-2"
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              color: "#E2E8F0",
              fontSize: "12px",
            }}
          >
            <i className="ri-robot-2-fill text-warning fs-6"></i>
            <span>Intelligent AI Nudge</span>
          </div>
          <div
            className="px-3 py-2 rounded-3 d-flex align-items-center gap-2"
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              color: "#E2E8F0",
              fontSize: "12px",
            }}
          >
            <i className="ri-line-chart-line text-info fs-6"></i>
            <span>Real-time Analytics</span>
          </div>
        </div>
      </div>

      {/* ─── Right Form Section (45% on desktop, 100% on mobile) ─────── */}
      <div className="login-form-pane">
        <div style={{ width: "100%", maxWidth: "420px" }}>
          {/* Brand Logo & Header */}
          <div className="text-center mb-4">
            <div className="d-inline-block mb-3">
              <img
                src="/logo web.svg"
                alt="Quiet Chat"
                style={{
                  height: "54px",
                  maxWidth: "240px",
                  objectFit: "contain",
                }}
                onError={(e: any) => {
                  e.currentTarget.src = "/logoicon.png";
                }}
              />
            </div>
            <h2
              className="fw-bold mb-1"
              style={{
                color: "#18181B",
                fontSize: "26px",
                letterSpacing: "-0.5px",
              }}
            >
              Admin Sign In
            </h2>
            <p
              className="text-muted mb-0"
              style={{ fontSize: "14px", lineHeight: "1.5" }}
            >
              Enter your credentials to access the {projectName || "Quiet Chat"} management console.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="mb-3">
              <label
                htmlFor="adminEmail"
                className="form-label fw-semibold"
                style={{ fontSize: "13px", color: "#3F3F46" }}
              >
                Email Address
              </label>
              <div className="position-relative">
                <span
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#A1A1AA",
                    fontSize: "18px",
                    display: "flex",
                    alignItems: "center",
                    pointerEvents: "none",
                  }}
                >
                  <i className="ri-mail-line"></i>
                </span>
                <input
                  id="adminEmail"
                  type="email"
                  value={email}
                  placeholder="admin@quietchat.com"
                  autoComplete="email"
                  onKeyDown={handleKeyPress}
                  onChange={(e: any) => {
                    setEmail(e.target.value);
                    if (!e.target.value) {
                      setError((prev) => ({ ...prev, email: "Email is required" }));
                    } else {
                      setError((prev) => ({ ...prev, email: "" }));
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 42px",
                    borderRadius: "12px",
                    border: error.email ? "1.5px solid #EF4444" : "1.5px solid #E4E4E7",
                    fontSize: "14px",
                    color: "#18181B",
                    backgroundColor: "#FAFAFA",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#7C3AED";
                    e.target.style.backgroundColor = "#FFFFFF";
                    e.target.style.boxShadow = "0 0 0 4px rgba(124, 58, 237, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = error.email ? "#EF4444" : "#E4E4E7";
                    e.target.style.backgroundColor = "#FAFAFA";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
              {error.email && (
                <span className="text-danger d-block mt-1" style={{ fontSize: "12px" }}>
                  <i className="ri-error-warning-line me-1"></i>
                  {error.email}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div className="mb-3">
              <label
                htmlFor="adminPassword"
                className="form-label fw-semibold"
                style={{ fontSize: "13px", color: "#3F3F46" }}
              >
                Password
              </label>
              <div className="position-relative">
                <span
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#A1A1AA",
                    fontSize: "18px",
                    display: "flex",
                    alignItems: "center",
                    pointerEvents: "none",
                  }}
                >
                  <i className="ri-lock-2-line"></i>
                </span>
                <input
                  id="adminPassword"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  onKeyDown={handleKeyPress}
                  onChange={(e: any) => {
                    setPassword(e.target.value);
                    if (!e.target.value) {
                      setError((prev) => ({ ...prev, password: "Password is required" }));
                    } else {
                      setError((prev) => ({ ...prev, password: "" }));
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 42px 12px 42px",
                    borderRadius: "12px",
                    border: error.password ? "1.5px solid #EF4444" : "1.5px solid #E4E4E7",
                    fontSize: "14px",
                    color: "#18181B",
                    backgroundColor: "#FAFAFA",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#7C3AED";
                    e.target.style.backgroundColor = "#FFFFFF";
                    e.target.style.boxShadow = "0 0 0 4px rgba(124, 58, 237, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = error.password ? "#EF4444" : "#E4E4E7";
                    e.target.style.backgroundColor = "#FAFAFA";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#71717A",
                    fontSize: "18px",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={showPassword ? "ri-eye-line" : "ri-eye-off-line"}></i>
                </button>
              </div>
              {error.password && (
                <span className="text-danger d-block mt-1" style={{ fontSize: "12px" }}>
                  <i className="ri-error-warning-line me-1"></i>
                  {error.password}
                </span>
              )}
            </div>

            {/* Remember Me */}
            <div className="d-flex align-items-center justify-content-between mb-4">
              <label
                className="d-flex align-items-center gap-2 mb-0"
                style={{ cursor: "pointer", userSelect: "none" }}
              >
                <input
                  type="checkbox"
                  id="rememberMeCheckbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    width: "18px",
                    height: "18px",
                    accentColor: "#7C3AED",
                    cursor: "pointer",
                    borderRadius: "4px",
                  }}
                />
                <span style={{ fontSize: "13.5px", color: "#52525B", fontWeight: 500 }}>
                  Stay signed in for 30 days
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || loginLoading}
              style={{
                width: "100%",
                padding: "13px 20px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)",
                color: "#FFFFFF",
                fontSize: "15px",
                fontWeight: 600,
                cursor: isLoading || loginLoading ? "not-allowed" : "pointer",
                boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.4)",
                transition: "all 0.25s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                if (!isLoading && !loginLoading) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 14px 30px -5px rgba(124, 58, 237, 0.5)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 10px 25px -5px rgba(124, 58, 237, 0.4)";
              }}
            >
              {loginLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <i className="ri-arrow-right-line fs-5"></i>
                </>
              )}
            </button>
          </form>

          {/* Security & System Info Footer */}
          <div className="mt-5 text-center">
            <div
              className="d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill mb-2"
              style={{
                background: "#F4F4F5",
                color: "#71717A",
                fontSize: "11.5px",
                fontWeight: 500,
              }}
            >
              <i className="ri-lock-fill text-success"></i>
              <span>Encrypted Firebase Admin Session</span>
            </div>
            <p className="text-muted mb-0" style={{ fontSize: "12px" }}>
              © {new Date().getFullYear()} {projectName || "Quiet Chat"}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
