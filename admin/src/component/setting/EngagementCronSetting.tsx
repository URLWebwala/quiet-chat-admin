import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootStore, useAppDispatch } from "@/store/store";
import { getSetting, handleSetting, updateSetting } from "@/store/settingSlice";
import { ExInput } from "@/extra/Input";
import ToggleSwitch from "@/extra/TogggleSwitch";
import { apiInstanceFetch } from "@/utils/ApiInstance";
import { baseURL } from "@/utils/config";
import Pagination from "@/extra/Pagination";
import { toast } from "react-toastify";

const HOURS_OPTIONS = [
  { value: 0, label: "12:00 AM (Midnight)" },
  { value: 1, label: "01:00 AM" },
  { value: 2, label: "02:00 AM" },
  { value: 3, label: "03:00 AM" },
  { value: 4, label: "04:00 AM" },
  { value: 5, label: "05:00 AM" },
  { value: 6, label: "06:00 AM" },
  { value: 7, label: "07:00 AM" },
  { value: 8, label: "08:00 AM" },
  { value: 9, label: "09:00 AM" },
  { value: 10, label: "10:00 AM" },
  { value: 11, label: "11:00 AM" },
  { value: 12, label: "12:00 PM (Noon)" },
  { value: 13, label: "01:00 PM" },
  { value: 14, label: "02:00 PM" },
  { value: 15, label: "03:00 PM" },
  { value: 16, label: "04:00 PM" },
  { value: 17, label: "05:00 PM" },
  { value: 18, label: "06:00 PM" },
  { value: 19, label: "07:00 PM" },
  { value: 20, label: "08:00 PM" },
  { value: 21, label: "09:00 PM" },
  { value: 22, label: "10:00 PM" },
  { value: 23, label: "11:00 PM" },
];

const EngagementCronSetting = () => {
  const dispatch = useAppDispatch();
  const { setting }: any = useSelector((state: RootStore) => state.setting);

  const [messageInitiatedAt, setMessageInitiatedAt] = useState("5");
  const [callInitiatedAt, setCallInitiatedAt] = useState("1");
  const [autoMessageMaxNudges, setAutoMessageMaxNudges] = useState("3");
  const [autoMessageMorningStartHour, setAutoMessageMorningStartHour] = useState("6");
  const [autoMessageMorningEndHour, setAutoMessageMorningEndHour] = useState("13");
  const [autoMessageEveningStartHour, setAutoMessageEveningStartHour] = useState("17");
  const [autoMessageEveningEndHour, setAutoMessageEveningEndHour] = useState("1");
  const [isAutoCallEnabled, setIsAutoCallEnabled] = useState(true);
  const [isAutoMessageEnabled, setIsAutoMessageEnabled] = useState(true);

  const [cronStatus, setCronStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [triggeringManual, setTriggeringManual] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const [logPage, setLogPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchCronStatus = async (page = logPage, limit = rowsPerPage) => {
    try {
      setLoadingStatus(true);
      const res = await apiInstanceFetch.get(`api/admin/setting/cronJobStatus?page=${page}&limit=${limit}`);
      if (res?.status && res?.data) {
        setCronStatus(res.data);
      }
    } catch (e) {
      console.error("Error fetching cron status:", e);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handlePageChange = (event: any, newPage: number) => {
    setLogPage(newPage);
    fetchCronStatus(newPage, rowsPerPage);
  };

  const handleRowsPerPageChange = (newLimit: string) => {
    const limitNum = parseInt(newLimit, 10) || 10;
    setRowsPerPage(limitNum);
    setLogPage(1);
    fetchCronStatus(1, limitNum);
  };

  useEffect(() => {
    dispatch(getSetting());
    fetchCronStatus(1, 10);
  }, [dispatch]);

  useEffect(() => {
    if (setting) {
      setMessageInitiatedAt(String(setting.messageInitiatedAt ?? 5));
      setCallInitiatedAt(String(setting.callInitiatedAt ?? 1));
      setAutoMessageMaxNudges(String(setting.autoMessageMaxNudges ?? 3));
      setAutoMessageMorningStartHour(String(setting.autoMessageMorningStartHour ?? 6));
      setAutoMessageMorningEndHour(String(setting.autoMessageMorningEndHour ?? 13));
      setAutoMessageEveningStartHour(String(setting.autoMessageEveningStartHour ?? 17));
      setAutoMessageEveningEndHour(String(setting.autoMessageEveningEndHour ?? 1));
      setIsAutoCallEnabled(setting.isAutoCallEnabled !== false);
      setIsAutoMessageEnabled(setting.isAutoMessageEnabled !== false);
    }
  }, [setting]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setting?._id) return;

    try {
      setSavingSettings(true);
      const payload = {
        settingId: setting._id,
        settingDataSubmit: {
          messageInitiatedAt: Number(messageInitiatedAt) || 5,
          callInitiatedAt: Number(callInitiatedAt) || 1,
          autoMessageMaxNudges: Number(autoMessageMaxNudges) || 3,
          autoMessageMorningStartHour: Number(autoMessageMorningStartHour) || 6,
          autoMessageMorningEndHour: Number(autoMessageMorningEndHour) || 13,
          autoMessageEveningStartHour: Number(autoMessageEveningStartHour) || 17,
          autoMessageEveningEndHour: Number(autoMessageEveningEndHour) || 1,
          isAutoCallEnabled,
          isAutoMessageEnabled,
        },
      };

      const result = await dispatch(updateSetting(payload));
      if (updateSetting.fulfilled.match(result)) {
        toast.success("Engagement timings & active slots saved successfully!");
        fetchCronStatus();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggle = (type: string) => {
    if (!setting?._id) return;
    dispatch(handleSetting({ settingId: setting._id, type }));
    if (type === "isAutoCallEnabled") setIsAutoCallEnabled(!isAutoCallEnabled);
    if (type === "isAutoMessageEnabled") setIsAutoMessageEnabled(!isAutoMessageEnabled);
    setTimeout(fetchCronStatus, 500);
  };

  const handleManualTrigger = async () => {
    try {
      setTriggeringManual(true);
      const res = await apiInstanceFetch.post("api/admin/setting/triggerManualChatJob", {});
      if (res?.status) {
        toast.success(res.message || "Manual chat batch triggered!");
        setTimeout(fetchCronStatus, 1000);
      } else {
        toast.error(res?.message || "Failed to trigger chat batch");
      }
    } catch (err: any) {
      toast.error(err.message || "Error triggering chat job");
    } finally {
      setTriggeringManual(false);
    }
  };

  const isMsgActive = isAutoMessageEnabled;
  const isSlotActive = cronStatus?.isSlotActiveNow ?? true;

  return (
    <div className="engagement-cron-setting">
      {/* ─── Top Live Status Banner ────────────────────────────────────────── */}
      <div className="card border-0 rounded-4 shadow-sm p-4 bg-white mb-4" style={{ borderLeft: "5px solid #0D9488" }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 pb-3 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center"
              style={{ width: 46, height: 46, backgroundColor: "#CCFBF1", color: "#0F766E" }}
            >
              <i className="ri-robot-line fs-24"></i>
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h5 className="mb-0 fw-bold text-dark">Automated Bot Engagement & Cron Scheduler</h5>
                <span
                  className={`badge px-3 py-1 rounded-pill small fw-semibold ${
                    isMsgActive ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"
                  }`}
                >
                  <i className={`ri-circle-fill fs-8 me-1 ${isMsgActive ? "text-success" : "text-danger"}`}></i>
                  {isMsgActive ? "Scheduler Active" : "Scheduler Paused"}
                </span>
              </div>
              <span className="text-muted small">
                Live queue health, timing intervals, active delivery windows, and webhook event status
              </span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm rounded-3 d-flex align-items-center gap-1.5 px-3 py-2 fw-semibold"
              onClick={() => fetchCronStatus(1, rowsPerPage)}
              disabled={loadingStatus}
            >
              <i className={`ri-refresh-line ${loadingStatus ? "ri-spin" : ""}`}></i>
              Refresh Status
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm rounded-3 d-flex align-items-center gap-1.5 px-3 py-2 fw-bold text-white shadow-sm"
              style={{ background: "linear-gradient(135deg, #0D9488 0%, #0F766E 100%)", border: "none" }}
              onClick={handleManualTrigger}
              disabled={triggeringManual}
            >
              <i className={`ri-flashlight-line ${triggeringManual ? "ri-spin" : ""}`}></i>
              {triggeringManual ? "Dispatching..." : "Trigger Instant Batch"}
            </button>
          </div>
        </div>

        {/* 4 Metrics Strip */}
        <div className="row g-3 pt-3">
          <div className="col-6 col-lg-3">
            <div className="p-3 rounded-3 bg-light border h-100">
              <span className="text-muted small d-block mb-1">Queue Interval</span>
              <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-1">
                <i className="ri-timer-line text-primary"></i> Every {messageInitiatedAt} Mins
              </h6>
              <span className="text-muted" style={{ fontSize: "11px" }}>Auto-rescheduled on save</span>
            </div>
          </div>

          <div className="col-6 col-lg-3">
            <div className="p-3 rounded-3 bg-light border h-100">
              <span className="text-muted small d-block mb-1">Current IST Time</span>
              <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-1">
                <i className="ri-time-line text-info"></i> {cronStatus?.currentIstTime || "Live IST"}
              </h6>
              <span className="text-muted" style={{ fontSize: "11px" }}>Asia/Kolkata timezone</span>
            </div>
          </div>

          <div className="col-6 col-lg-3">
            <div className="p-3 rounded-3 bg-light border h-100">
              <span className="text-muted small d-block mb-1">Active Window Status</span>
              <h6 className={`fw-bold mb-0 d-flex align-items-center gap-1 ${isSlotActive ? "text-success" : "text-warning"}`}>
                <i className={isSlotActive ? "ri-checkbox-circle-line" : "ri-moon-line"}></i>
                {cronStatus?.activeSlotName || (isSlotActive ? "Window Active" : "Quiet Hours")}
              </h6>
              <span className="text-muted" style={{ fontSize: "11px" }}>
                {isSlotActive ? "Delivering messages" : "Sleep time silence"}
              </span>
            </div>
          </div>

          <div className="col-6 col-lg-3">
            <div className="p-3 rounded-3 bg-light border h-100">
              <span className="text-muted small d-block mb-1">Queue Health</span>
              <h6 className="fw-bold text-success mb-0 d-flex align-items-center gap-1">
                <i className="ri-heart-pulse-line"></i> Connected & Ready
              </h6>
              <span className="text-muted" style={{ fontSize: "11px" }}>Redis Bull Job Engine</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveSettings}>
        <div className="row g-4 mb-4 align-items-stretch">
          {/* ─── 1. Timing & Time Window Slots Configuration ───────────────── */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="rounded-3 d-flex align-items-center justify-content-center"
                      style={{ width: 36, height: 36, backgroundColor: "#EEF2FF", color: "#4F46E5" }}
                    >
                      <i className="ri-timer-line fs-20"></i>
                    </div>
                    <div>
                      <h6 className="mb-0 fw-bold text-dark">Timing & Daily Active Windows</h6>
                      <span className="text-muted small">Set intervals, unreplied nudge caps, and IST delivery slots</span>
                    </div>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-4">
                    <ExInput
                      type="number"
                      label="Message Delay (Mins)"
                      placeholder="e.g. 5"
                      value={messageInitiatedAt}
                      onChange={(e: any) => setMessageInitiatedAt(e.target.value)}
                    />
                    <span className="text-muted d-block mt-1" style={{ fontSize: "11px" }}>Loop interval</span>
                  </div>

                  <div className="col-4">
                    <ExInput
                      type="number"
                      label="Call Delay (Mins)"
                      placeholder="e.g. 1"
                      value={callInitiatedAt}
                      onChange={(e: any) => setCallInitiatedAt(e.target.value)}
                    />
                    <span className="text-muted d-block mt-1" style={{ fontSize: "11px" }}>Idle user delay</span>
                  </div>

                  <div className="col-4">
                    <ExInput
                      type="number"
                      label="Max Nudges / User"
                      placeholder="e.g. 3"
                      value={autoMessageMaxNudges}
                      onChange={(e: any) => setAutoMessageMaxNudges(e.target.value)}
                    />
                    <span className="text-muted d-block mt-1" style={{ fontSize: "11px" }}>Unreplied cap</span>
                  </div>

                  {/* Daily Active Engagement Time Slots */}
                  <div className="col-12 mt-2">
                    <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                      <span className="fw-bold text-dark d-flex align-items-center gap-2" style={{ fontSize: "13.5px" }}>
                        <i className="ri-sun-cloudy-line text-primary fs-18"></i> Daily Active Engagement Delivery Slots (IST)
                      </span>
                      <span className="badge bg-primary-subtle text-primary px-2.5 py-1 rounded-pill small fw-semibold">
                        2 Slots Configurable
                      </span>
                    </div>

                    <p className="text-muted mb-3" style={{ fontSize: "12px", lineHeight: "1.4" }}>
                      Cron job runs continuously, but messages are delivered <strong>only</strong> during these active hours so users are never disturbed during late-night sleep hours.
                    </p>

                    <div className="d-flex flex-column gap-3">
                      {/* Morning Slot Card */}
                      <div className="bg-white border shadow-sm" style={{ padding: "18px 20px", borderRadius: "14px", borderColor: "#E2E8F0" }}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="badge bg-warning-subtle text-dark px-3 py-1.5 rounded-pill fw-bold" style={{ fontSize: "12px" }}>
                            🌅 Morning Delivery Window
                          </span>
                          <span className="text-muted small" style={{ fontSize: "11.5px" }}>Recommended: 06:00 AM – 01:00 PM</span>
                        </div>
                        <div className="d-flex flex-column flex-sm-row gap-3">
                          <div className="flex-fill">
                            <label className="text-muted small mb-1.5 fw-semibold d-block" style={{ fontSize: "12px" }}>
                              Start Time
                            </label>
                            <select
                              className="form-select fw-semibold w-100"
                              style={{ fontSize: "13px", borderRadius: "10px", padding: "9px 12px", border: "1px solid #D1D5DB" }}
                              value={autoMessageMorningStartHour}
                              onChange={(e: any) => setAutoMessageMorningStartHour(e.target.value)}
                            >
                              {HOURS_OPTIONS.map((h) => (
                                <option key={`m-start-${h.value}`} value={h.value}>
                                  {h.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex-fill">
                            <label className="text-muted small mb-1.5 fw-semibold d-block" style={{ fontSize: "12px" }}>
                              End Time
                            </label>
                            <select
                              className="form-select fw-semibold w-100"
                              style={{ fontSize: "13px", borderRadius: "10px", padding: "9px 12px", border: "1px solid #D1D5DB" }}
                              value={autoMessageMorningEndHour}
                              onChange={(e: any) => setAutoMessageMorningEndHour(e.target.value)}
                            >
                              {HOURS_OPTIONS.map((h) => (
                                <option key={`m-end-${h.value}`} value={h.value}>
                                  {h.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Evening Slot Card */}
                      <div className="bg-white border shadow-sm" style={{ padding: "18px 20px", borderRadius: "14px", borderColor: "#E2E8F0" }}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="badge px-3 py-1.5 rounded-pill fw-bold" style={{ backgroundColor: "#EEF2FF", color: "#4F46E5", fontSize: "12px" }}>
                            🌙 Evening / Night Delivery Window
                          </span>
                          <span className="text-muted small" style={{ fontSize: "11.5px" }}>Recommended: 05:00 PM – 01:00 AM</span>
                        </div>
                        <div className="d-flex flex-column flex-sm-row gap-3">
                          <div className="flex-fill">
                            <label className="text-muted small mb-1.5 fw-semibold d-block" style={{ fontSize: "12px" }}>
                              Start Time
                            </label>
                            <select
                              className="form-select fw-semibold w-100"
                              style={{ fontSize: "13px", borderRadius: "10px", padding: "9px 12px", border: "1px solid #D1D5DB" }}
                              value={autoMessageEveningStartHour}
                              onChange={(e: any) => setAutoMessageEveningStartHour(e.target.value)}
                            >
                              {HOURS_OPTIONS.map((h) => (
                                <option key={`e-start-${h.value}`} value={h.value}>
                                  {h.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex-fill">
                            <label className="text-muted small mb-1.5 fw-semibold d-block" style={{ fontSize: "12px" }}>
                              End Time
                            </label>
                            <select
                              className="form-select fw-semibold w-100"
                              style={{ fontSize: "13px", borderRadius: "10px", padding: "9px 12px", border: "1px solid #D1D5DB" }}
                              value={autoMessageEveningEndHour}
                              onChange={(e: any) => setAutoMessageEveningEndHour(e.target.value)}
                            >
                              {HOURS_OPTIONS.map((h) => (
                                <option key={`e-end-${h.value}`} value={h.value}>
                                  {h.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Master Switches */}
                  <div className="col-12 col-md-6 mt-2">
                    <div className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-light border h-100">
                      <div>
                        <span className="fw-semibold small text-dark d-block">Enable Auto Message</span>
                        <span className="text-muted" style={{ fontSize: "11px" }}>Send welcome/nudges</span>
                      </div>
                      <ToggleSwitch
                        onClick={() => handleToggle("isAutoMessageEnabled")}
                        value={isAutoMessageEnabled}
                      />
                    </div>
                  </div>

                  <div className="col-12 col-md-6 mt-2">
                    <div className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-light border h-100">
                      <div>
                        <span className="fw-semibold small text-dark d-block">Enable Auto Call</span>
                        <span className="text-muted" style={{ fontSize: "11px" }}>Trigger automated calls</span>
                      </div>
                      <ToggleSwitch
                        onClick={() => handleToggle("isAutoCallEnabled")}
                        value={isAutoCallEnabled}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-end pt-3 mt-3 border-top">
                <button
                  type="submit"
                  className="btn btn-primary d-inline-flex align-items-center gap-2 px-4 py-2.5 fw-bold rounded-3 shadow-sm"
                  style={{ background: "linear-gradient(135deg, #0D9488 0%, #0F766E 100%)", border: "none" }}
                  disabled={savingSettings}
                >
                  <i className={`ri-save-3-line fs-18 ${savingSettings ? "ri-spin" : ""}`}></i>
                  {savingSettings ? "Saving..." : "Save Engagement Timing"}
                </button>
              </div>
            </div>
          </div>

          {/* ─── 2. Webhooks & Cron Engines Real-Time Health ────────────────── */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="rounded-3 d-flex align-items-center justify-content-center"
                      style={{ width: 36, height: 36, backgroundColor: "#FEF3C7", color: "#D97706" }}
                    >
                      <i className="ri-radar-line fs-20"></i>
                    </div>
                    <div>
                      <h6 className="mb-0 fw-bold text-dark">Live Webhooks & Engine Endpoints</h6>
                      <span className="text-muted small">Real-time status of S2S postbacks and schedulers</span>
                    </div>
                  </div>
                  <span className="badge bg-success-subtle text-success px-2.5 py-1 rounded-pill small fw-semibold">
                    6 Endpoints Active
                  </span>
                </div>

                <div className="d-flex flex-column gap-2.5">
                  {(cronStatus?.webhooks || [
                    { name: "AdGem S2S Postback Webhook", endpoint: "/api/client/adgem/webhook", status: "Active & Listening", type: "Offerwall", health: "Healthy" },
                    { name: "TheoremReach S2S Postback Router", endpoint: "/api/client/theoremreach/webhook", status: "Active & Listening", type: "Surveys", health: "Healthy" },
                    { name: "CPX Research Survey Webhook", endpoint: "/api/client/cpx/webhook", status: "Active & Listening", type: "Surveys", health: "Healthy" },
                    { name: "BitLabs Survey Wall Webhook", endpoint: "/api/client/bitlabs/webhook", status: "Active & Listening", type: "Surveys", health: "Healthy" },
                    { name: "RazorpayX Automated Payouts", endpoint: "/api/client/razorpay/webhook", status: "Active & Listening", type: "Payouts", health: "Healthy" },
                    { name: "Cashfree Automated Webhook", endpoint: "/api/client/cashfree/webhook", status: "Active & Listening", type: "Payments", health: "Healthy" },
                  ]).map((wh: any, i: number) => (
                    <div key={i} className="p-3 rounded-3 bg-light border d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="fw-bold text-dark small">{wh.name}</span>
                          <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: "10.5px" }}>{wh.type}</span>
                        </div>
                        <code className="text-primary fw-semibold" style={{ fontSize: "11.5px" }}>{wh.endpoint}</code>
                      </div>
                      <span className="badge bg-success-subtle text-success px-3 py-1.5 rounded-pill fw-semibold" style={{ fontSize: "11.5px" }}>
                        <i className="ri-checkbox-circle-fill me-1"></i> {wh.health || "Healthy"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-3 mt-3 border bg-teal-subtle" style={{ backgroundColor: "#F0FDFA", borderColor: "#CCFBF1" }}>
                <div className="d-flex align-items-center gap-2">
                  <i className="ri-information-line fs-18 text-teal" style={{ color: "#0D9488" }}></i>
                  <span className="small text-dark fw-semibold">
                    All webhooks and background jobs are running live on the Node.js server.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* ─── 3. Recent Automated Engagement Activity Log Table ──────────────── */}
      <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
        <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center"
              style={{ width: 36, height: 36, backgroundColor: "#F3E8FF", color: "#9333EA" }}
            >
              <i className="ri-history-line fs-20"></i>
            </div>
            <div>
              <h6 className="mb-0 fw-bold text-dark">Recent Automated Engagement Dispatch Logs</h6>
              <span className="text-muted small">Latest bot conversations and automated nudges triggered</span>
            </div>
          </div>
          <span className="badge bg-primary-subtle text-primary px-3 py-1.5 rounded-pill fw-semibold small">
            Live Stream
          </span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
            <thead className="table-light">
              <tr>
                <th className="py-3 px-3" style={{ width: "24%" }}>
                  <div className="d-flex align-items-center justify-content-start text-dark fw-bold">Target User</div>
                </th>
                <th className="py-3 px-3" style={{ width: "22%" }}>
                  <div className="d-flex align-items-center justify-content-start text-dark fw-bold">AI / Demo Host</div>
                </th>
                <th className="py-3 px-3" style={{ width: "32%" }}>
                  <div className="d-flex align-items-center justify-content-start text-dark fw-bold">Last Message / Nudge</div>
                </th>
                <th className="py-3 px-3" style={{ width: "10%" }}>
                  <div className="d-flex align-items-center justify-content-center text-dark fw-bold">Nudges Count</div>
                </th>
                <th className="py-3 px-3" style={{ width: "12%" }}>
                  <div className="d-flex align-items-center justify-content-end text-dark fw-bold">Dispatched At</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {cronStatus?.recentLogs?.length > 0 ? (
                cronStatus.recentLogs.map((log: any, idx: number) => {
                  const getFullImg = (path?: string) => {
                    if (!path || typeof path !== "string" || path.trim() === "") return "";
                    const clean = path.trim();
                    if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("data:")) return clean;
                    return `${baseURL}${clean.replace(/^\//, "").replace(/\\/g, "/")}`;
                  };
                  const userImg = getFullImg(log.userImage);
                  const hostImg = getFullImg(log.hostImage);

                  return (
                    <tr key={log._id || idx}>
                      <td className="py-3 px-3 text-start">
                        <div className="d-flex align-items-center gap-2.5">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0 shadow-sm"
                            style={{ width: 40, height: 40, minWidth: 40, overflow: "hidden", backgroundColor: "#6366F1", fontSize: "14px" }}
                          >
                            {userImg ? (
                              <img
                                src={userImg}
                                alt=""
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={(e: any) => {
                                  e.currentTarget.style.display = "none";
                                  const fallback = e.currentTarget.parentElement?.querySelector(".avatar-fallback");
                                  if (fallback) (fallback as HTMLElement).style.display = "flex";
                                }}
                              />
                            ) : null}
                            <span className="avatar-fallback" style={{ display: userImg ? "none" : "flex" }}>
                              {(log.user || "U").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <span className="fw-bold text-dark d-block">{log.user}</span>
                            <span className="text-muted" style={{ fontSize: "11px" }}>ID: {log.userId}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-start">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0 shadow-sm"
                            style={{ width: 40, height: 40, minWidth: 40, overflow: "hidden", backgroundColor: "#9333EA", fontSize: "14px" }}
                          >
                            {hostImg ? (
                              <img
                                src={hostImg}
                                alt=""
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={(e: any) => {
                                  e.currentTarget.style.display = "none";
                                  const fallback = e.currentTarget.parentElement?.querySelector(".host-fallback");
                                  if (fallback) (fallback as HTMLElement).style.display = "flex";
                                }}
                              />
                            ) : null}
                            <span className="host-fallback" style={{ display: hostImg ? "none" : "flex" }}>
                              {(log.host || "H").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <span className="fw-bold text-dark d-block" style={{ fontSize: "12.5px" }}>{log.host}</span>
                            <span className="badge px-2 py-0.5 rounded-pill fw-semibold" style={{ backgroundColor: "#F3E8FF", color: "#9333EA", fontSize: "10.5px" }}>
                              AI Host
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-start">
                        <div className="p-2.5 rounded-3 bg-light border text-dark" style={{ fontSize: "12.5px", maxWidth: 380, lineHeight: "1.4" }}>
                          {log.lastMessage}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="badge bg-light text-dark border px-2.5 py-1.5 rounded-pill fw-bold">
                          {log.consecutiveNudges} / {autoMessageMaxNudges}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-end text-muted small">
                        {log.updatedAt ? new Date(log.updatedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : "Recent"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-muted">
                    <i className="ri-inbox-line fs-24 d-block mb-1"></i>
                    No recent automated engagement logs found. Click <strong>"Trigger Instant Batch"</strong> above to dispatch test messages.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {cronStatus?.totalLogs > 0 && (
          <div className="pt-3 border-top">
            <Pagination
              type="client"
              serverPage={logPage}
              setServerPage={setLogPage}
              serverPerPage={rowsPerPage}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              totalData={cronStatus?.totalLogs || 0}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EngagementCronSetting;
