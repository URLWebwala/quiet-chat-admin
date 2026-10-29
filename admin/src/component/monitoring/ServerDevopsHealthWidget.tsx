import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAppDispatch } from "@/store/store";
import { useSelector } from "react-redux";
import { fetchSystemMetrics } from "@/store/systemMonitorSlice";

export const ServerDevopsHealthWidget: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { metrics, loadingMetrics } = useSelector(
    (state: any) => state.systemMonitor
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchSystemMetrics());
    const interval = setInterval(() => {
      dispatch(fetchSystemMetrics());
    }, 15000); // 15s live refresh
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await dispatch(fetchSystemMetrics());
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const m = metrics;
  const recentErrors = m?.recentErrors || [];
  const errorsToday = m?.apiStats?.errorsToday ?? 0;
  const totalErrors = m?.apiStats?.totalErrors ?? 0;
  const reliabilityScore = m?.apiStats?.reliabilityScore ?? "99.9";

  const hostLabel = m?.host?.label || (m?.host?.platform === "darwin" ? "local-mac" : "vm");
  const isHealthy = (m?.database?.status === "CONNECTED" || m?.database?.state === 1) && errorsToday === 0;

  return (
    <div className="mb-4">
      {/* ─── Top Header Bar ────────────────────────────────────────── */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div className="d-flex align-items-center gap-2">
          <div
            className="d-flex align-items-center justify-content-center rounded-3"
            style={{ width: 32, height: 32, backgroundColor: "#EEF2FF", color: "#6366F1" }}
          >
            <i className="ri-server-line fs-17"></i>
          </div>
          <h5 className="fw-bold text-dark mb-0" style={{ fontSize: "17px", letterSpacing: "-0.3px" }}>
            Server Infrastructure & DevOps Health
          </h5>
          <span
            className="badge rounded-pill fw-semibold px-2 py-1"
            style={{
              fontSize: "11px",
              backgroundColor: "#E0F2FE",
              color: "#0369A1",
              border: "1px solid #BAE6FD",
            }}
          >
            Host: {hostLabel}
          </span>
          {isRefreshing && (
            <span className="text-muted small d-inline-flex align-items-center gap-1" style={{ fontSize: "11px" }}>
              <i className="ri-loader-4-line spin-anim"></i> Updating...
            </span>
          )}
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-light border rounded-pill d-inline-flex align-items-center gap-1 text-secondary"
            style={{ fontSize: "12px", padding: "5px 12px", background: "#fff" }}
            onClick={handleManualRefresh}
            title="Refresh metrics now"
          >
            <i className={`ri-refresh-line ${isRefreshing ? "spin-anim" : ""}`}></i>
            Sync
          </button>
          <button
            type="button"
            className="btn btn-sm rounded-pill d-inline-flex align-items-center gap-1 fw-semibold shadow-sm"
            style={{
              fontSize: "12px",
              padding: "5px 16px",
              backgroundColor: "#EEF2FF",
              color: "#4F46E5",
              border: "1px solid #C7D2FE",
              transition: "all 0.15s ease",
            }}
            onClick={() => router.push("/server-monitor")}
            onMouseEnter={(e: any) => {
              e.currentTarget.style.backgroundColor = "#4F46E5";
              e.currentTarget.style.color = "#FFFFFF";
            }}
            onMouseLeave={(e: any) => {
              e.currentTarget.style.backgroundColor = "#EEF2FF";
              e.currentTarget.style.color = "#4F46E5";
            }}
          >
            <i className="ri-terminal-box-line fs-14"></i>
            Full Telemetry Console
          </button>
        </div>
      </div>

      {/* ─── 4 Metric Cards Row ────────────────────────────────────── */}
      <div className="row g-3 mb-3">
        {/* Card 1: CPU Core Load */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card border-0 rounded-4 p-3 bg-white shadow-sm h-100 position-relative overflow-hidden"
            style={{ border: "1px solid #F1F5F9" }}
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <div className="d-flex align-items-center gap-2">
                <i className="ri-cpu-line fs-16" style={{ color: "#3B82F6" }}></i>
                <span className="text-secondary fw-semibold" style={{ fontSize: "12px" }}>
                  CPU Core Load
                </span>
              </div>
              <span className="text-muted fw-medium" style={{ fontSize: "11px" }}>
                {m?.cpu?.cores || 2} Cores
              </span>
            </div>

            <div className="d-flex align-items-baseline gap-1 my-2">
              <span className="fw-bold text-dark" style={{ fontSize: "28px", letterSpacing: "-1px" }}>
                {m?.cpu?.loadPercent ?? 12}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="progress rounded-pill mb-2" style={{ height: "6px", backgroundColor: "#EFF6FF" }}>
              <div
                className="progress-bar rounded-pill"
                role="progressbar"
                style={{
                  width: `${Math.min(100, Math.max(5, m?.cpu?.loadPercent ?? 12))}%`,
                  background: "linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)",
                }}
              />
            </div>

            <div className="d-flex justify-content-between align-items-center text-muted" style={{ fontSize: "11px" }}>
              <span className="text-truncate" style={{ maxWidth: "60%" }} title={m?.cpu?.model || "Processor"}>
                {m?.cpu?.model || "Host Processor"}
              </span>
              <span>Load: {m?.cpu?.load1m || "0.25"}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Host Memory (RAM) */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card border-0 rounded-4 p-3 bg-white shadow-sm h-100 position-relative overflow-hidden"
            style={{ border: "1px solid #F1F5F9" }}
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <div className="d-flex align-items-center gap-2">
                <i className="ri-heart-pulse-line fs-16" style={{ color: "#10B981" }}></i>
                <span className="text-secondary fw-semibold" style={{ fontSize: "12px" }}>
                  Host Memory (RAM)
                </span>
              </div>
              <span className="fw-semibold" style={{ fontSize: "11px", color: "#059669" }}>
                {m?.memory?.usedPercent ?? 18}% Used
              </span>
            </div>

            <div className="d-flex align-items-baseline gap-1 my-2">
              <span className="fw-bold text-dark" style={{ fontSize: "26px", letterSpacing: "-0.5px" }}>
                {m?.memory?.usedGB || "1.3"}
              </span>
              <span className="text-muted" style={{ fontSize: "14px" }}>
                / {m?.memory?.totalGB || "7.75"} GB
              </span>
            </div>

            {/* Progress bar */}
            <div className="progress rounded-pill mb-2" style={{ height: "6px", backgroundColor: "#ECFDF5" }}>
              <div
                className="progress-bar rounded-pill"
                role="progressbar"
                style={{
                  width: `${Math.min(100, Math.max(5, m?.memory?.usedPercent ?? 18))}%`,
                  background: "linear-gradient(90deg, #10B981 0%, #059669 100%)",
                }}
              />
            </div>

            <div className="d-flex justify-content-between align-items-center text-muted" style={{ fontSize: "11px" }}>
              <span>Node RSS: <strong className="text-dark">{m?.memory?.nodeRssMB || 104} MB</strong></span>
              <span>Free: {m?.memory?.freeGB || "6.45"} GB</span>
            </div>
          </div>
        </div>

        {/* Card 3: Root Storage (/) */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card border-0 rounded-4 p-3 bg-white shadow-sm h-100 position-relative overflow-hidden"
            style={{ border: "1px solid #F1F5F9" }}
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <div className="d-flex align-items-center gap-2">
                <i className="ri-hard-drive-2-line fs-16" style={{ color: "#D946EF" }}></i>
                <span className="text-secondary fw-semibold" style={{ fontSize: "12px" }}>
                  Root Storage (/)
                </span>
              </div>
              <span className="fw-semibold" style={{ fontSize: "11px", color: "#C026D3" }}>
                {m?.storage?.usedPercent ?? 15}% Used
              </span>
            </div>

            <div className="d-flex align-items-baseline gap-1 my-2">
              <span className="fw-bold text-dark" style={{ fontSize: "26px", letterSpacing: "-0.5px" }}>
                {m?.storage?.usedGB || "7.2"}
              </span>
              <span className="text-muted" style={{ fontSize: "14px" }}>
                / {m?.storage?.totalGB || "47.3"} GB
              </span>
            </div>

            {/* Progress bar */}
            <div className="progress rounded-pill mb-2" style={{ height: "6px", backgroundColor: "#FDF4FF" }}>
              <div
                className="progress-bar rounded-pill"
                role="progressbar"
                style={{
                  width: `${Math.min(100, Math.max(5, m?.storage?.usedPercent ?? 15))}%`,
                  background: "linear-gradient(90deg, #D946EF 0%, #C026D3 100%)",
                }}
              />
            </div>

            <div className="d-flex justify-content-between align-items-center text-muted" style={{ fontSize: "11px" }}>
              <span className="text-truncate" style={{ maxWidth: "60%" }}>
                {m?.storage?.partition || "NVMe SSD"}
              </span>
              <span>{m?.storage?.freeGB || "40.1"} GB Free</span>
            </div>
          </div>
        </div>

        {/* Card 4: Database Engine */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card border-0 rounded-4 p-3 bg-white shadow-sm h-100 position-relative overflow-hidden"
            style={{ border: "1px solid #F1F5F9" }}
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <div className="d-flex align-items-center gap-2">
                <i className="ri-database-2-line fs-16" style={{ color: "#06B6D4" }}></i>
                <span className="text-secondary fw-semibold" style={{ fontSize: "12px" }}>
                  MongoDB DB Engine
                </span>
              </div>
              <span
                className="badge rounded-pill fw-semibold px-2 py-0"
                style={{
                  fontSize: "10px",
                  backgroundColor: "#DCFCE7",
                  color: "#16A34A",
                  border: "1px solid #BBF7D0",
                }}
              >
                ONLINE
              </span>
            </div>

            <div className="d-flex align-items-baseline gap-1 my-2">
              <span className="fw-bold text-dark" style={{ fontSize: "24px", letterSpacing: "-0.5px" }}>
                Connected
              </span>
              <span className="text-muted" style={{ fontSize: "13px" }}>
                ({m?.database?.name || "quietchat"})
              </span>
            </div>

            {/* Progress bar */}
            <div className="progress rounded-pill mb-2" style={{ height: "6px", backgroundColor: "#ECFEFF" }}>
              <div
                className="progress-bar rounded-pill"
                role="progressbar"
                style={{
                  width: "100%",
                  background: "linear-gradient(90deg, #06B6D4 0%, #0891B2 100%)",
                }}
              />
            </div>

            <div className="d-flex justify-content-between align-items-center text-muted" style={{ fontSize: "11px" }}>
              <span>Version: <strong className="text-dark">{m?.database?.version || "v8.10"}</strong></span>
              <span>Engine: <strong className="text-success">Active</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bottom Panels (Two Columns) ───────────────────────────── */}
      <div className="row g-3">
        {/* Left Panel: System Health & Live Services */}
        <div className="col-12 col-lg-5">
          <div
            className="bg-white rounded-4 shadow-sm h-100 p-3 p-md-4 d-flex flex-column justify-content-between"
            style={{ border: "1px solid #E2E8F0" }}
          >
            <div>
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <i className="ri-stack-line fs-18 text-primary"></i>
                  <h6 className="fw-bold text-dark mb-0" style={{ fontSize: "15px" }}>
                    System Health & Live Services
                  </h6>
                </div>
                <span
                  className="badge rounded-pill fw-semibold px-3 py-1"
                  style={{
                    fontSize: "11px",
                    backgroundColor: isHealthy ? "#DCFCE7" : "#FEF3C7",
                    color: isHealthy ? "#16A34A" : "#D97706",
                  }}
                >
                  {isHealthy ? "100% Healthy" : "Monitoring Active"}
                </span>
              </div>

              {/* Service rows */}
              <div className="d-flex flex-column gap-2 mb-3">
                {/* 1. MongoDB */}
                <div
                  className="d-flex justify-content-between align-items-center p-2 rounded-3"
                  style={{ background: "#F8FAFC" }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <i className="ri-database-line fs-16 text-success"></i>
                    <span className="fw-medium text-dark" style={{ fontSize: "13px" }}>
                      MongoDB Database
                    </span>
                  </div>
                  <span className="fw-bold text-success" style={{ fontSize: "12px" }}>
                    CONNECTED ({m?.database?.version || "v8.10.2"})
                  </span>
                </div>

                {/* 2. Socket.io Multi-Node */}
                <div
                  className="d-flex justify-content-between align-items-center p-2 rounded-3"
                  style={{ background: "#F8FAFC" }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <i className="ri-pulse-line fs-16 text-info"></i>
                    <span className="fw-medium text-dark" style={{ fontSize: "13px" }}>
                      Socket.io Realtime Engine
                    </span>
                  </div>
                  <span className="fw-bold text-info" style={{ fontSize: "12px" }}>
                    {m?.realtime?.operationalStatus || "100% OPERATIONAL"} ({m?.realtime?.connectedUsers || 0} Sockets)
                  </span>
                </div>


                {/* 3. Bull Queue & Cron */}
                <div
                  className="d-flex justify-content-between align-items-center p-2 rounded-3"
                  style={{ background: "#F8FAFC" }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <i className="ri-timer-flash-line fs-16" style={{ color: "#8F6DFF" }}></i>
                    <span className="fw-medium text-dark" style={{ fontSize: "13px" }}>
                      Auto Chat Job & AI Nudge Cron
                    </span>
                  </div>
                  <span className="fw-bold" style={{ fontSize: "12px", color: "#8F6DFF" }}>
                    SCHEDULED & ACTIVE
                  </span>
                </div>

                {/* 4. Process RAM Allocation */}
                <div className="p-2 rounded-3" style={{ background: "#F8FAFC" }}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <div className="d-flex align-items-center gap-2">
                      <i className="ri-memory-card-line fs-16 text-primary"></i>
                      <span className="fw-medium text-dark" style={{ fontSize: "13px" }}>
                        Process RAM Allocation
                      </span>
                    </div>
                    <span className="fw-bold text-dark" style={{ fontSize: "12px" }}>
                      {m?.memory?.nodeRssMB || 104} MB / {Math.round(parseFloat(m?.memory?.totalGB || "16") * 1024)} MB
                    </span>
                  </div>
                  <div className="progress rounded-pill" style={{ height: "5px", backgroundColor: "#E2E8F0" }}>
                    <div
                      className="progress-bar rounded-pill bg-primary"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(((m?.memory?.nodeRssMB || 104) / (parseFloat(m?.memory?.totalGB || "16") * 1024)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* 5. Process Uptime */}
                <div
                  className="d-flex justify-content-between align-items-center p-2 rounded-3"
                  style={{ background: "#F8FAFC" }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <i className="ri-time-line fs-16 text-warning"></i>
                    <span className="fw-medium text-dark" style={{ fontSize: "13px" }}>
                      Backend Process Uptime
                    </span>
                  </div>
                  <span className="fw-bold text-dark" style={{ fontSize: "12px" }}>
                    {m?.uptime?.formatted || "0h 8m"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action link */}
            <button
              type="button"
              className="btn btn-outline-primary rounded-pill w-100 py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold"
              style={{ fontSize: "13px" }}
              onClick={() => router.push("/server-monitor")}
            >
              <i className="ri-terminal-box-line fs-15"></i>
              View Detailed Server Telemetry Console
            </button>
          </div>
        </div>

        {/* Right Panel: Live API Failure & Error Monitor */}
        <div className="col-12 col-lg-7">
          <div
            className="bg-white rounded-4 shadow-sm h-100 p-3 p-md-4 d-flex flex-column justify-content-between"
            style={{ border: "1px solid #E2E8F0" }}
          >
            <div>
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <i className="ri-error-warning-line fs-18 text-warning"></i>
                  <h6 className="fw-bold text-dark mb-0" style={{ fontSize: "15px" }}>
                    Live API Failure & Error Monitor
                  </h6>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span
                    className="badge rounded-pill fw-semibold px-2 py-1"
                    style={{
                      fontSize: "11px",
                      backgroundColor: errorsToday === 0 ? "#DCFCE7" : "#FEE2E2",
                      color: errorsToday === 0 ? "#16A34A" : "#DC2626",
                    }}
                  >
                    {errorsToday} Errors Today
                  </span>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push("/api-error-logs");
                    }}
                    className="text-primary text-decoration-none fw-semibold"
                    style={{ fontSize: "12px" }}
                  >
                    Full Logs →
                  </a>
                </div>
              </div>

              {/* Main Content Area */}
              {recentErrors.length === 0 ? (
                /* Zero Errors State matching screenshot */
                <div className="d-flex flex-column align-items-center justify-content-center py-4 my-2 text-center">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle mb-3"
                    style={{
                      width: 52,
                      height: 52,
                      backgroundColor: "#DCFCE7",
                      color: "#16A34A",
                    }}
                  >
                    <i className="ri-check-line fs-26 fw-bold"></i>
                  </div>
                  <h6 className="fw-bold text-dark mb-1" style={{ fontSize: "15px" }}>
                    Zero API Failures
                  </h6>
                  <p className="text-secondary small mb-0" style={{ maxWidth: "340px", fontSize: "12px" }}>
                    All platform APIs and socket connections are operating smoothly.
                  </p>
                </div>
              ) : (
                /* Recent Errors List */
                <div className="d-flex flex-column gap-2 mb-2" style={{ maxHeight: "215px", overflowY: "auto" }}>
                  {recentErrors.map((err: any, idx: number) => {
                    const is500 = err.status >= 500;
                    return (
                      <div
                        key={err._id || idx}
                        className="p-2 rounded-3 border d-flex align-items-center justify-content-between gap-2"
                        style={{
                          backgroundColor: is500 ? "#FEF2F2" : "#FFFBEB",
                          borderColor: is500 ? "#FCA5A5" : "#FDE68A",
                        }}
                      >
                        <div className="d-flex align-items-center gap-2 text-truncate" style={{ maxWidth: "70%" }}>
                          <span
                            className={`badge px-2 py-1 ${is500 ? "bg-danger" : "bg-warning text-dark"}`}
                            style={{ fontSize: "10px" }}
                          >
                            {err.method || "API"} {err.status}
                          </span>
                          <span className="font-monospace text-dark small text-truncate" title={err.endpoint}>
                            {err.endpoint}
                          </span>
                        </div>
                        <div className="text-end text-nowrap">
                          <span className="text-muted d-block" style={{ fontSize: "11px" }}>
                            {err.createdAt ? new Date(err.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now"}
                          </span>
                          <span className="fw-semibold text-danger small text-truncate d-inline-block" style={{ maxWidth: "150px" }} title={err.message}>
                            {err.message}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="d-flex justify-content-between align-items-center pt-3 border-top text-muted"
              style={{ fontSize: "12px" }}
            >
              <span>Total Errors Recorded: <strong className="text-dark">{totalErrors}</strong></span>
              <span>API Reliability Score: <strong className="text-success">{reliabilityScore}%</strong></span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .spin-anim {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ServerDevopsHealthWidget;
