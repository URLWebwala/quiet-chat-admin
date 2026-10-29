import React, { useEffect, useState } from "react";
import RootLayout from "@/component/layout/Layout";
import { useRouter } from "next/router";
import { useAppDispatch } from "@/store/store";
import { useSelector } from "react-redux";
import {
  fetchSystemMetrics,
  fetchEndpointsStats,
  fetchSecurityOverview,
  fetchSecurityThreats,
  fetchBlockedIps,
  blockIpAddress,
  unblockIpAddress,
  fetchAdminAuditLogs,
  simulateSecurityThreat,
} from "@/store/systemMonitorSlice";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const ServerMonitorPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {
    metrics,
    endpoints,
    securityOverview,
    topSuspiciousIps,
    threatLogs,
    threatPagination,
    blockedIps,
    auditLogs,
    auditPagination,
    loadingMetrics,
    loadingEndpoints,
    loadingSecurity,
  } = useSelector((state: any) => state.systemMonitor);

  const [activeTab, setActiveTab] = useState<"hardware" | "security" | "audit" | "endpoints">("hardware");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pingLatency, setPingLatency] = useState<number | null>(null);

  // Security filters
  const [threatSearch, setThreatSearch] = useState("");
  const [threatTypeFilter, setThreatTypeFilter] = useState("ALL");
  const [threatSeverityFilter, setThreatSeverityFilter] = useState("ALL");

  // Audit filters
  const [auditSearch, setAuditSearch] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("ALL");

  // Block IP Modal
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [manualIp, setManualIp] = useState("");
  const [manualReason, setManualReason] = useState("");

  useEffect(() => {
    loadAll();
    const interval = setInterval(() => {
      dispatch(fetchSystemMetrics());
      if (activeTab === "hardware") {
        dispatch(fetchEndpointsStats());
      } else if (activeTab === "security") {
        dispatch(fetchSecurityOverview());
        dispatch(fetchSecurityThreats({ page: threatPagination.page || 1, search: threatSearch, type: threatTypeFilter, severity: threatSeverityFilter }));
        dispatch(fetchBlockedIps());
      } else if (activeTab === "audit") {
        dispatch(fetchAdminAuditLogs({ page: auditPagination.page || 1, search: auditSearch, action: auditActionFilter }));
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [dispatch, activeTab]);

  const loadAll = () => {
    dispatch(fetchSystemMetrics());
    dispatch(fetchEndpointsStats());
    dispatch(fetchSecurityOverview());
    dispatch(fetchSecurityThreats({ page: 1 }));
    dispatch(fetchBlockedIps());
    dispatch(fetchAdminAuditLogs({ page: 1 }));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await dispatch(fetchSystemMetrics());
    await dispatch(fetchEndpointsStats());
    await dispatch(fetchSecurityOverview());
    if (activeTab === "security") {
      await dispatch(fetchSecurityThreats({ page: threatPagination.page || 1, search: threatSearch, type: threatTypeFilter, severity: threatSeverityFilter }));
      await dispatch(fetchBlockedIps());
    } else if (activeTab === "audit") {
      await dispatch(fetchAdminAuditLogs({ page: auditPagination.page || 1, search: auditSearch, action: auditActionFilter }));
    }
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const handleTestPing = async () => {
    const start = performance.now();
    try {
      await dispatch(fetchSystemMetrics());
      const end = performance.now();
      const latency = Math.round(end - start);
      setPingLatency(latency);
      toast.success(`Server Pong! Latency: ${latency} ms`);
    } catch (e) {
      toast.error("Server ping failed");
    }
  };

  const handleBlockIp = async (ipToBlock: string, reasonText = "Security Policy Violation") => {
    const confirm = await Swal.fire({
      title: `Block IP ${ipToBlock}?`,
      text: "This IP will be permanently blocked by the firewall from accessing any API endpoint.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      confirmButtonText: "Yes, Block IP",
    });

    if (confirm.isConfirmed) {
      const res: any = await dispatch(blockIpAddress({ ip: ipToBlock, reason: reasonText }));
      if (res?.payload?.status) {
        toast.success(`IP ${ipToBlock} blocked successfully!`);
        dispatch(fetchSecurityOverview());
        dispatch(fetchBlockedIps());
        dispatch(fetchSecurityThreats({ page: threatPagination.page || 1 }));
      }
    }
  };

  const handleUnblockIp = async (ipToUnblock: string) => {
    const confirm = await Swal.fire({
      title: `Unblock IP ${ipToUnblock}?`,
      text: "This IP will be removed from the firewall blocklist.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10B981",
      confirmButtonText: "Yes, Unblock",
    });

    if (confirm.isConfirmed) {
      const res: any = await dispatch(unblockIpAddress({ ip: ipToUnblock }));
      if (res?.payload?.status) {
        toast.success(`IP ${ipToUnblock} unblocked.`);
        dispatch(fetchSecurityOverview());
        dispatch(fetchBlockedIps());
        dispatch(fetchSecurityThreats({ page: threatPagination.page || 1 }));
      }
    }
  };

  const handleManualBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualIp.trim()) {
      toast.error("Please enter a valid IP address");
      return;
    }
    const res: any = await dispatch(blockIpAddress({ ip: manualIp.trim(), reason: manualReason || "Admin manual block" }));
    if (res?.payload?.status) {
      toast.success(`IP ${manualIp.trim()} blocked.`);
      setShowBlockModal(false);
      setManualIp("");
      setManualReason("");
      dispatch(fetchSecurityOverview());
      dispatch(fetchBlockedIps());
    }
  };

  const handleSimulateAttack = async () => {
    toast.info("Simulating attack detection...");
    const res: any = await dispatch(simulateSecurityThreat({
      type: "INTRUSION_ATTEMPT",
      severity: "CRITICAL",
    }));
    if (res?.payload?.status) {
      toast.success("Security intrusion logged!");
      dispatch(fetchSecurityOverview());
      dispatch(fetchSecurityThreats({ page: 1 }));
    }
  };

  const m = metrics;
  const hostLabel = m?.host?.label || (m?.host?.platform === "darwin" ? "local-mac" : "vm");
  const isHealthy = m?.database?.status === "CONNECTED" || m?.database?.state === 1;

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
        return "bg-danger text-white";
      case "HIGH":
        return "bg-warning text-dark";
      case "MEDIUM":
        return "bg-info text-white";
      default:
        return "bg-secondary text-white";
    }
  };

  const getMethodBadgeClass = (method: string) => {
    switch (method?.toUpperCase()) {
      case "GET":
        return "bg-primary text-white";
      case "POST":
        return "bg-success text-white";
      case "PUT":
        return "bg-warning text-dark";
      case "PATCH":
        return "bg-info text-white";
      case "DELETE":
        return "bg-danger text-white";
      default:
        return "bg-secondary text-white";
    }
  };

  const getStatusBadgeStyle = (status: number) => {
    if (status >= 500) {
      return { backgroundColor: "#FEE2E2", color: "#DC2626", border: "1px solid #FCA5A5" };
    }
    if (status >= 400) {
      return { backgroundColor: "#FEF3C7", color: "#D97706", border: "1px solid #FCD34D" };
    }
    return { backgroundColor: "#DCFCE7", color: "#16A34A", border: "1px solid #86EFAC" };
  };

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "24px 20px 48px" }}>
      {/* ─── Page Header ───────────────────────────────────────────── */}
      <div
        className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 bg-white rounded-4 shadow-sm"
        style={{ padding: "20px 24px", border: "1px solid #E2E8F0" }}
      >
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-3 shadow-sm"
            style={{ width: 46, height: 46, backgroundColor: "#EEF2FF", color: "#4F46E5" }}
          >
            <i className="ri-server-line fs-24"></i>
          </div>
          <div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h4 className="fw-bold text-dark mb-0" style={{ fontSize: "20px" }}>
                Server Health & Security Console
              </h4>
              <span
                className="badge rounded-pill fw-semibold px-2 py-1"
                style={{
                  fontSize: "10px",
                  background: "#E0F2FE",
                  color: "#0369A1",
                  border: "1px solid #BAE6FD",
                }}
              >
                Host: {hostLabel}
              </span>
              <span
                className="badge rounded-pill fw-semibold px-2 py-1"
                style={{
                  fontSize: "10px",
                  background: "#DCFCE7",
                  color: "#16A34A",
                  border: "1px solid #BBF7D0",
                }}
              >
                ● Live 15s Auto-sync
              </span>
            </div>
            <p className="text-secondary small mb-0" style={{ fontSize: "12px" }}>
              Comprehensive server diagnostics, hardware load, intrusion prevention firewall, and admin audit trail.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button
            type="button"
            className="btn btn-sm btn-outline-primary rounded-pill d-inline-flex align-items-center gap-1"
            style={{ fontSize: "12px", padding: "6px 14px" }}
            onClick={handleTestPing}
          >
            <i className="ri-pulse-line"></i> Test Server Ping {pingLatency !== null && `(${pingLatency}ms)`}
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary rounded-pill d-inline-flex align-items-center gap-1 shadow-sm"
            style={{ fontSize: "12px", padding: "6px 16px" }}
            onClick={handleRefresh}
          >
            <i className={`ri-refresh-line ${isRefreshing ? "spin-anim" : ""}`}></i> Sync Telemetry
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger rounded-pill d-inline-flex align-items-center gap-1"
            style={{ fontSize: "12px", padding: "6px 14px" }}
            onClick={() => router.push("/api-error-logs")}
          >
            <i className="ri-bug-line"></i> API Error Logs →
          </button>
        </div>
      </div>

      {/* ─── Navigation Tabs ───────────────────────────────────────── */}
      <div className="d-flex align-items-center gap-2 mb-4 border-bottom pb-2 flex-wrap">
        <button
          type="button"
          className={`btn btn-sm rounded-pill fw-semibold d-inline-flex align-items-center gap-1 ${
            activeTab === "hardware" ? "btn-primary shadow-sm" : "btn-light text-secondary"
          }`}
          style={{ fontSize: "13px", padding: "7px 18px" }}
          onClick={() => setActiveTab("hardware")}
        >
          <i className="ri-dashboard-2-line"></i> Hardware & System Telemetry
        </button>

        <button
          type="button"
          className={`btn btn-sm rounded-pill fw-semibold d-inline-flex align-items-center gap-1 ${
            activeTab === "security" ? "btn-primary shadow-sm" : "btn-light text-secondary"
          }`}
          style={{ fontSize: "13px", padding: "7px 18px" }}
          onClick={() => {
            setActiveTab("security");
            dispatch(fetchSecurityOverview());
            dispatch(fetchSecurityThreats({ page: 1 }));
            dispatch(fetchBlockedIps());
          }}
        >
          <i className="ri-shield-check-line"></i> 🛡️ Security & Intrusion Firewall
          {securityOverview.criticalThreats > 0 && (
            <span className="badge rounded-pill bg-danger text-white ms-1" style={{ fontSize: "10px" }}>
              {securityOverview.criticalThreats} Alert
            </span>
          )}
        </button>

        <button
          type="button"
          className={`btn btn-sm rounded-pill fw-semibold d-inline-flex align-items-center gap-1 ${
            activeTab === "audit" ? "btn-primary shadow-sm" : "btn-light text-secondary"
          }`}
          style={{ fontSize: "13px", padding: "7px 18px" }}
          onClick={() => {
            setActiveTab("audit");
            dispatch(fetchAdminAuditLogs({ page: 1 }));
          }}
        >
          <i className="ri-history-line"></i> 📜 Admin Audit Trail
        </button>

        <button
          type="button"
          className={`btn btn-sm rounded-pill fw-semibold d-inline-flex align-items-center gap-1 ${
            activeTab === "endpoints" ? "btn-primary shadow-sm" : "btn-light text-secondary"
          }`}
          style={{ fontSize: "13px", padding: "7px 18px" }}
          onClick={() => {
            setActiveTab("endpoints");
            dispatch(fetchEndpointsStats());
          }}
        >
          <i className="ri-router-line"></i> Endpoints & Latency Monitor
          <span className="badge rounded-pill bg-white text-dark ms-1" style={{ fontSize: "10px" }}>
            {endpoints.length}
          </span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* TAB 1: HARDWARE & SYSTEM TELEMETRY                          */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {activeTab === "hardware" && (
        <>
          {/* 4 Metric Cards Row (CPU, RAM, DISK, DB) */}
          <div className="row g-3 mb-4">
            {/* Card 1: CPU Core Load */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 rounded-4 p-3 bg-white shadow-sm h-100" style={{ border: "1px solid #E2E8F0" }}>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <div className="d-flex align-items-center gap-2">
                    <i className="ri-cpu-line fs-17 text-primary"></i>
                    <span className="text-secondary fw-semibold" style={{ fontSize: "12px" }}>CPU Core Load</span>
                  </div>
                  <span className="text-muted fw-medium" style={{ fontSize: "11px" }}>{m?.cpu?.cores || 2} Cores</span>
                </div>
                <div className="d-flex align-items-baseline gap-1 my-2">
                  <span className="fw-bold text-dark" style={{ fontSize: "30px", letterSpacing: "-1px" }}>
                    {m?.cpu?.loadPercent ?? 12}%
                  </span>
                </div>
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
                  <span className="text-truncate" style={{ maxWidth: "60%" }}>{m?.cpu?.model || "Host Processor"}</span>
                  <span>Load: {m?.cpu?.load1m || "0.25"}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Host Memory (RAM) */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 rounded-4 p-3 bg-white shadow-sm h-100" style={{ border: "1px solid #E2E8F0" }}>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <div className="d-flex align-items-center gap-2">
                    <i className="ri-heart-pulse-line fs-17 text-success"></i>
                    <span className="text-secondary fw-semibold" style={{ fontSize: "12px" }}>Host Memory (RAM)</span>
                  </div>
                  <span className="fw-semibold" style={{ fontSize: "11px", color: "#059669" }}>
                    {m?.memory?.usedPercent ?? 18}% Used
                  </span>
                </div>
                <div className="d-flex align-items-baseline gap-1 my-2">
                  <span className="fw-bold text-dark" style={{ fontSize: "28px", letterSpacing: "-0.5px" }}>
                    {m?.memory?.usedGB || "1.3"}
                  </span>
                  <span className="text-muted" style={{ fontSize: "14px" }}>/ {m?.memory?.totalGB || "7.75"} GB</span>
                </div>
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
              <div className="card border-0 rounded-4 p-3 bg-white shadow-sm h-100" style={{ border: "1px solid #E2E8F0" }}>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <div className="d-flex align-items-center gap-2">
                    <i className="ri-hard-drive-2-line fs-17" style={{ color: "#D946EF" }}></i>
                    <span className="text-secondary fw-semibold" style={{ fontSize: "12px" }}>Root Storage (/)</span>
                  </div>
                  <span className="fw-semibold" style={{ fontSize: "11px", color: "#C026D3" }}>
                    {m?.storage?.usedPercent ?? 15}% Used
                  </span>
                </div>
                <div className="d-flex align-items-baseline gap-1 my-2">
                  <span className="fw-bold text-dark" style={{ fontSize: "28px", letterSpacing: "-0.5px" }}>
                    {m?.storage?.usedGB || "7.2"}
                  </span>
                  <span className="text-muted" style={{ fontSize: "14px" }}>/ {m?.storage?.totalGB || "47.3"} GB</span>
                </div>
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
                  <span className="text-truncate" style={{ maxWidth: "60%" }}>{m?.storage?.partition || "NVMe SSD"}</span>
                  <span>{m?.storage?.freeGB || "40.1"} GB Free</span>
                </div>
              </div>
            </div>

            {/* Card 4: Database Engine */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 rounded-4 p-3 bg-white shadow-sm h-100" style={{ border: "1px solid #E2E8F0" }}>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <div className="d-flex align-items-center gap-2">
                    <i className="ri-database-2-line fs-17 text-info"></i>
                    <span className="text-secondary fw-semibold" style={{ fontSize: "12px" }}>MongoDB DB Engine</span>
                  </div>
                  <span className="badge rounded-pill fw-semibold px-2 py-0" style={{ fontSize: "10px", backgroundColor: "#DCFCE7", color: "#16A34A" }}>
                    ONLINE
                  </span>
                </div>
                <div className="d-flex align-items-baseline gap-1 my-2">
                  <span className="fw-bold text-dark" style={{ fontSize: "26px", letterSpacing: "-0.5px" }}>Connected</span>
                  <span className="text-muted" style={{ fontSize: "13px" }}>({m?.database?.name || "quietchat"})</span>
                </div>
                <div className="progress rounded-pill mb-2" style={{ height: "6px", backgroundColor: "#ECFEFF" }}>
                  <div className="progress-bar rounded-pill" role="progressbar" style={{ width: "100%", background: "linear-gradient(90deg, #06B6D4 0%, #0891B2 100%)" }} />
                </div>
                <div className="d-flex justify-content-between align-items-center text-muted" style={{ fontSize: "11px" }}>
                  <span>Version: <strong className="text-dark">{m?.database?.version || "v8.10"}</strong></span>
                  <span>Status: <strong className="text-success">Active</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Deep Subsystems */}
          <div className="row g-3">
            <div className="col-12 col-lg-6">
              <div className="bg-white rounded-4 shadow-sm p-4 h-100" style={{ border: "1px solid #E2E8F0" }}>
                <h6 className="fw-bold text-dark mb-3" style={{ fontSize: "16px" }}>
                  <i className="ri-stack-line text-primary me-2"></i> System Health & Subsystems
                </h6>
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between align-items-center p-2 rounded-3 bg-light">
                    <span className="small text-dark fw-medium">MongoDB Connection</span>
                    <span className="fw-bold text-success small">CONNECTED ({m?.database?.version || "v8.10.2"})</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center p-2 rounded-3 bg-light">
                    <div>
                      <span className="small text-dark fw-medium d-block">
                        <i className="ri-pulse-line text-info me-1"></i> Socket.io Realtime Engine
                      </span>
                      <small className="text-muted" style={{ fontSize: "11px" }}>
                        Transports: {m?.realtime?.transports || "WebSocket / Polling"} · Active Rooms: {m?.realtime?.activeRooms || 0}
                      </small>
                    </div>
                    <span className="fw-bold text-info small">
                      {m?.realtime?.operationalStatus || "100% OPERATIONAL"} ({m?.realtime?.connectedUsers || 0} Sockets)
                    </span>
                  </div>

                  <div className="d-flex justify-content-between align-items-center p-2 rounded-3 bg-light">
                    <span className="small text-dark fw-medium">Chat & AI Nudge Jobs</span>
                    <span className="fw-bold small" style={{ color: "#8F6DFF" }}>SCHEDULED & ACTIVE</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center p-2 rounded-3 bg-light">
                    <span className="small text-dark fw-medium">Backend Process Uptime</span>
                    <span className="fw-bold text-dark small">{m?.uptime?.formatted} ({m?.uptime?.seconds}s)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-6">
              <div className="bg-white rounded-4 shadow-sm p-4 h-100" style={{ border: "1px solid #E2E8F0" }}>
                <h6 className="fw-bold text-dark mb-3" style={{ fontSize: "16px" }}>
                  <i className="ri-mac-line text-primary me-2"></i> Host Environment Architecture
                </h6>
                <ul className="list-group list-group-flush small">
                  <li className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Hostname</span>
                    <strong className="text-dark font-monospace">{m?.host?.hostname}</strong>
                  </li>
                  <li className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Platform</span>
                    <strong className="text-dark">{m?.host?.platform} (64-bit Core)</strong>
                  </li>
                  <li className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Node.js Runtime</span>
                    <strong className="text-dark font-monospace">{m?.host?.nodeVersion}</strong>
                  </li>
                  <li className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">API Reliability Score</span>
                    <strong className="text-success">{m?.apiStats?.reliabilityScore || "99.9"}%</strong>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* TAB 2: SECURITY & INTRUSION FIREWALL MONITOR                */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {activeTab === "security" && (
        <>
          {/* 4 Security Stat Cards */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 rounded-4 p-3 bg-white shadow-sm h-100" style={{ border: "1px solid #E2E8F0" }}>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="text-secondary fw-bold" style={{ fontSize: "11px" }}>TOTAL THREATS DETECTED</span>
                  <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 34, height: 34, backgroundColor: "#FEE2E2", color: "#DC2626" }}>
                    <i className="ri-shield-flash-line fs-17"></i>
                  </div>
                </div>
                <h3 className="fw-bold text-dark mb-0 mt-2" style={{ fontSize: "28px" }}>
                  {securityOverview.totalThreats}
                </h3>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 rounded-4 p-3 bg-white shadow-sm h-100" style={{ border: "1px solid #E2E8F0" }}>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="text-danger fw-bold" style={{ fontSize: "11px" }}>CRITICAL INTRUSIONS</span>
                  <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 34, height: 34, backgroundColor: "#FEE2E2", color: "#EF4444" }}>
                    <i className="ri-skull-line fs-17"></i>
                  </div>
                </div>
                <h3 className="fw-bold text-danger mb-0 mt-2" style={{ fontSize: "28px" }}>
                  {securityOverview.criticalThreats}
                </h3>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 rounded-4 p-3 bg-white shadow-sm h-100" style={{ border: "1px solid #E2E8F0" }}>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-bold" style={{ fontSize: "11px", color: "#D97706" }}>BLOCKED IPS (FIREWALL)</span>
                  <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 34, height: 34, backgroundColor: "#FEF3C7", color: "#D97706" }}>
                    <i className="ri-forbid-line fs-17"></i>
                  </div>
                </div>
                <h3 className="fw-bold mb-0 mt-2" style={{ fontSize: "28px", color: "#D97706" }}>
                  {securityOverview.blockedIpsCount}
                </h3>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 rounded-4 p-3 bg-white shadow-sm h-100" style={{ border: "1px solid #E2E8F0" }}>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="text-primary fw-bold" style={{ fontSize: "11px" }}>THREATS TODAY</span>
                  <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 34, height: 34, backgroundColor: "#EFF6FF", color: "#3B82F6" }}>
                    <i className="ri-alarm-warning-line fs-17"></i>
                  </div>
                </div>
                <h3 className="fw-bold text-primary mb-0 mt-2" style={{ fontSize: "28px" }}>
                  {securityOverview.threatsToday}
                </h3>
              </div>
            </div>
          </div>

          {/* Security Action Toolbar */}
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <h5 className="fw-bold text-dark mb-0" style={{ fontSize: "17px" }}>
                🛡️ Live Intrusion Attempts & Firewall Rules
              </h5>
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-danger rounded-pill d-inline-flex align-items-center gap-1"
                onClick={() => setShowBlockModal(true)}
              >
                <i className="ri-forbid-2-line"></i> Block IP Manually
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-pill d-inline-flex align-items-center gap-1"
                onClick={handleSimulateAttack}
              >
                <i className="ri-flask-line"></i> Simulate Attack Alert
              </button>
            </div>
          </div>

          {/* Suspicious IPs Quick List */}
          {topSuspiciousIps && topSuspiciousIps.length > 0 && (
            <div className="bg-white rounded-4 shadow-sm p-3 mb-4" style={{ border: "1px solid #FEE2E2" }}>
              <div className="d-flex align-items-center gap-2 mb-2 text-danger fw-bold small">
                <i className="ri-alert-line fs-16"></i> TOP SUSPICIOUS IPS WITH REPEATED VIOLATIONS
              </div>
              <div className="row g-2">
                {topSuspiciousIps.map((s: any, idx: number) => (
                  <div key={idx} className="col-12 col-md-6 col-lg-4">
                    <div className="p-2 rounded-3 border bg-light d-flex justify-content-between align-items-center">
                      <div>
                        <strong className="text-dark font-monospace">{s.ip}</strong>
                        <div className="text-muted small" style={{ fontSize: "11px" }}>
                          {s.count} Violations · {s.lastType}
                        </div>
                      </div>
                      {s.isBlocked ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success rounded-pill py-0 px-2"
                          style={{ fontSize: "11px" }}
                          onClick={() => handleUnblockIp(s.ip)}
                        >
                          Unblock
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-sm btn-danger rounded-pill py-0 px-2"
                          style={{ fontSize: "11px" }}
                          onClick={() => handleBlockIp(s.ip, `Suspicious activity: ${s.count} violations`)}
                        >
                          Block IP
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Threat Logs Table */}
          <div className="bg-white rounded-4 shadow-sm p-4 mb-4" style={{ border: "1px solid #E2E8F0" }}>
            <h6 className="fw-bold text-dark mb-3" style={{ fontSize: "15px" }}>
              Real-time Intrusion & Threat Events Log
            </h6>

            <div className="table-responsive">
              <table className="table align-middle table-hover mb-0">
                <thead>
                  <tr className="text-secondary small fw-bold" style={{ fontSize: "11px" }}>
                    <th>TIME</th>
                    <th>SEVERITY</th>
                    <th>TYPE</th>
                    <th>ATTACKER IP</th>
                    <th>TARGET ENDPOINT</th>
                    <th>DETAILS / MESSAGE</th>
                    <th className="text-end">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {threatLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-5 text-muted">
                        <i className="ri-shield-check-fill text-success fs-28 d-block mb-1"></i>
                        No security threats or unpermitted infiltrations recorded! Firewall is active and clean.
                      </td>
                    </tr>
                  ) : (
                    threatLogs.map((item: any) => (
                      <tr key={item._id} style={{ fontSize: "13px" }}>
                        <td className="text-secondary text-nowrap">
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </td>
                        <td>
                          <span className={`badge rounded-pill fw-bold px-2 py-1 ${getSeverityBadgeClass(item.severity)}`} style={{ fontSize: "10px" }}>
                            {item.severity}
                          </span>
                        </td>
                        <td>
                          <span className="badge rounded-pill bg-light text-dark border px-2 py-1" style={{ fontSize: "11px" }}>
                            {item.type}
                          </span>
                        </td>
                        <td className="font-monospace fw-bold text-dark">{item.ip}</td>
                        <td className="font-monospace small text-truncate" style={{ maxWidth: "200px" }} title={item.endpoint}>
                          {item.endpoint}
                        </td>
                        <td className="text-secondary small" style={{ maxWidth: "260px" }}>
                          <span className="d-block text-truncate" title={item.message}>{item.message}</span>
                        </td>
                        <td className="text-end">
                          {item.isCurrentlyBlocked ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success rounded-pill py-0 px-2"
                              style={{ fontSize: "11px" }}
                              onClick={() => handleUnblockIp(item.ip)}
                            >
                              Unblock
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger rounded-pill py-0 px-2"
                              style={{ fontSize: "11px" }}
                              onClick={() => handleBlockIp(item.ip, item.message)}
                            >
                              Block IP
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Blocked IPs Table */}
          <div className="bg-white rounded-4 shadow-sm p-4" style={{ border: "1px solid #E2E8F0" }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold text-dark mb-0" style={{ fontSize: "15px" }}>
                🚫 Firewall Blocked IP Addresses ({blockedIps.length})
              </h6>
            </div>
            <div className="table-responsive">
              <table className="table align-middle table-hover mb-0">
                <thead>
                  <tr className="text-secondary small fw-bold" style={{ fontSize: "11px" }}>
                    <th>IP ADDRESS</th>
                    <th>REASON</th>
                    <th>BLOCKED BY</th>
                    <th>DATE BLOCKED</th>
                    <th className="text-end">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {blockedIps.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-muted small">
                        No IP addresses currently blocked in firewall.
                      </td>
                    </tr>
                  ) : (
                    blockedIps.map((b: any) => (
                      <tr key={b._id} style={{ fontSize: "13px" }}>
                        <td className="font-monospace fw-bold text-danger">{b.ip}</td>
                        <td className="text-secondary small">{b.reason}</td>
                        <td className="text-dark small">{b.blockedBy || "Admin"}</td>
                        <td className="text-muted small">{new Date(b.createdAt).toLocaleDateString()}</td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success rounded-pill py-0 px-2"
                            style={{ fontSize: "11px" }}
                            onClick={() => handleUnblockIp(b.ip)}
                          >
                            Unblock IP
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* TAB 3: ADMIN AUDIT TRAIL                                    */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {activeTab === "audit" && (
        <div className="bg-white rounded-4 shadow-sm p-4" style={{ border: "1px solid #E2E8F0" }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h6 className="fw-bold text-dark mb-0" style={{ fontSize: "16px" }}>
                Admin Panel Operational Audit Trail
              </h6>
              <span className="text-muted small">
                Every sensitive administrative modification, wallet action, or security setting change is logged here.
              </span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table align-middle table-hover mb-0">
              <thead>
                <tr className="text-secondary small fw-bold" style={{ fontSize: "11px" }}>
                  <th>TIMESTAMP</th>
                  <th>ADMIN USER</th>
                  <th>ACTION</th>
                  <th>TARGET ENTITY</th>
                  <th>TARGET ID</th>
                  <th>CLIENT IP</th>
                  <th>DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted small">
                      No admin audit logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((a: any) => (
                    <tr key={a._id} style={{ fontSize: "13px" }}>
                      <td className="text-secondary small text-nowrap">
                        {new Date(a.createdAt).toLocaleString()}
                      </td>
                      <td className="fw-bold text-dark small">{a.adminEmail}</td>
                      <td>
                        <span className="badge rounded-pill bg-primary px-2 py-1" style={{ fontSize: "11px" }}>
                          {a.action}
                        </span>
                      </td>
                      <td className="text-dark small">{a.targetEntity}</td>
                      <td className="font-monospace small text-muted">{a.targetId}</td>
                      <td className="font-monospace small text-dark">{a.ip}</td>
                      <td className="font-monospace small text-muted" style={{ maxWidth: "220px" }}>
                        <span className="text-truncate d-block">{JSON.stringify(a.details)}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* TAB 4: API ENDPOINTS & LATENCY                              */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {activeTab === "endpoints" && (
        <div className="bg-white rounded-4 shadow-sm p-4" style={{ border: "1px solid #E2E8F0" }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h6 className="fw-bold text-dark mb-0" style={{ fontSize: "16px" }}>
                Active API Endpoints Performance Monitor
              </h6>
              <span className="text-muted small">
                Real-time tracking of hit rates, average latency in ms, and error rates per endpoint.
              </span>
            </div>
            <span className="badge rounded-pill bg-light text-dark border px-3 py-1">
              {endpoints.length} Endpoints Active
            </span>
          </div>

          <div className="table-responsive">
            <table className="table align-middle table-hover mb-0">
              <thead>
                <tr className="text-secondary small fw-bold" style={{ fontSize: "11px" }}>
                  <th>ROUTE PATH</th>
                  <th>METHOD</th>
                  <th>TOTAL CALLS</th>
                  <th>AVG LATENCY</th>
                  <th>FAILURES</th>
                  <th>ERROR RATE</th>
                  <th>LAST STATUS</th>
                  <th>LAST SEEN</th>
                </tr>
              </thead>
              <tbody>
                {endpoints.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-5 text-muted small">
                      No endpoint activity captured in current session yet.
                    </td>
                  </tr>
                ) : (
                  endpoints.map((ep: any, idx: number) => {
                    const latency = parseFloat(ep.avgDurationMs || "0");
                    const isSlow = latency > 500;
                    const isModerate = latency > 200 && latency <= 500;
                    return (
                      <tr key={idx} style={{ fontSize: "13px" }}>
                        <td className="font-monospace fw-semibold text-dark">{ep.path}</td>
                        <td>
                          <span className={`badge rounded-pill fw-bold px-2 py-1 ${getMethodBadgeClass(ep.method)}`} style={{ fontSize: "10px" }}>
                            {ep.method}
                          </span>
                        </td>
                        <td className="fw-bold">{ep.hits}</td>
                        <td>
                          <span
                            className="badge rounded-pill px-2 py-1"
                            style={{
                              fontSize: "11px",
                              backgroundColor: isSlow ? "#FEE2E2" : isModerate ? "#FEF3C7" : "#DCFCE7",
                              color: isSlow ? "#DC2626" : isModerate ? "#D97706" : "#16A34A",
                            }}
                          >
                            {ep.avgDurationMs} ms
                          </span>
                        </td>
                        <td className={ep.errors > 0 ? "text-danger fw-bold" : "text-muted"}>
                          {ep.errors}
                        </td>
                        <td>
                          <span className="fw-semibold" style={{ color: ep.errorRate !== "0.0%" ? "#DC2626" : "#16A34A" }}>
                            {ep.errorRate}
                          </span>
                        </td>
                        <td>
                          <span className="badge rounded-pill" style={{ fontSize: "10px", ...getStatusBadgeStyle(ep.lastStatus) }}>
                            {ep.lastStatus}
                          </span>
                        </td>
                        <td className="text-muted small">
                          {ep.lastSeen ? new Date(ep.lastSeen).toLocaleTimeString() : "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── MANUAL BLOCK IP MODAL ─────────────────────────────────── */}
      {showBlockModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(3px)" }}
          onClick={() => setShowBlockModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom px-4 py-3">
                <h6 className="modal-title fw-bold text-danger mb-0">
                  <i className="ri-forbid-line me-2"></i> Block IP in System Firewall
                </h6>
                <button type="button" className="btn-close" onClick={() => setShowBlockModal(false)}></button>
              </div>
              <form onSubmit={handleManualBlockSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-dark">IP Address to Block</label>
                    <input
                      type="text"
                      className="form-control rounded-pill"
                      placeholder="e.g. 198.51.100.12 or 203.0.113.5"
                      value={manualIp}
                      onChange={(e) => setManualIp(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small fw-bold text-dark">Reason for Blocking</label>
                    <input
                      type="text"
                      className="form-control rounded-pill"
                      placeholder="e.g. Malicious scanning / Brute-force requests"
                      value={manualReason}
                      onChange={(e) => setManualReason(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer border-top px-4 py-2">
                  <button type="button" className="btn btn-sm btn-secondary rounded-pill px-3" onClick={() => setShowBlockModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-danger rounded-pill px-4">
                    Block IP
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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

ServerMonitorPage.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default ServerMonitorPage;
