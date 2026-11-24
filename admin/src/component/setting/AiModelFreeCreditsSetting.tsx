import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootStore, useAppDispatch } from "@/store/store";
import { getSetting, handleSetting, updateSetting } from "@/store/settingSlice";
import { Success, DangerRight } from "@/api/toastServices";
import ToggleSwitch from "@/extra/TogggleSwitch";
import Button from "@/extra/Button";
import { FaGift, FaCoins, FaComments, FaImage, FaVideo, FaCheckCircle, FaInfoCircle } from "react-icons/fa";

export default function AiModelFreeCreditsSetting() {
  const dispatch = useAppDispatch();
  const setting: any = useSelector((state: RootStore) => state.setting.setting);

  const [enabled, setEnabled] = useState<boolean>(true);
  const [welcomeCredits, setWelcomeCredits] = useState<number>(100);
  const [chatRate, setChatRate] = useState<number>(5);
  const [exclusivePhotoRate, setExclusivePhotoRate] = useState<number>(20);
  const [exclusiveVideoRate, setExclusiveVideoRate] = useState<number>(50);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    dispatch(getSetting());
  }, [dispatch]);

  useEffect(() => {
    if (setting) {
      setEnabled(setting.aiModelFreeCreditsEnabled !== false);
      setWelcomeCredits(setting.aiModelWelcomeFreeCredits !== undefined ? Number(setting.aiModelWelcomeFreeCredits) : 100);
      setChatRate(setting.aiModelChatCreditRate !== undefined ? Number(setting.aiModelChatCreditRate) : 5);
      setExclusivePhotoRate(setting.aiModelExclusivePhotoRate !== undefined ? Number(setting.aiModelExclusivePhotoRate) : 20);
      setExclusiveVideoRate(setting.aiModelExclusiveVideoRate !== undefined ? Number(setting.aiModelExclusiveVideoRate) : 50);
    }
  }, [setting]);

  const handleToggle = () => {
    if (!setting?._id) return;
    dispatch(handleSetting({ settingId: setting._id, type: "aiModelFreeCreditsEnabled" }));
    setEnabled(!enabled);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setting?._id) {
      DangerRight("Settings not loaded yet. Please refresh.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        settingId: setting._id,
        settingDataSubmit: {
          aiModelFreeCreditsEnabled: enabled,
          aiModelWelcomeFreeCredits: Math.max(0, Number(welcomeCredits) || 0),
          aiModelChatCreditRate: Math.max(0, Number(chatRate) || 0),
          aiModelExclusivePhotoRate: Math.max(0, Number(exclusivePhotoRate) || 0),
          aiModelExclusiveVideoRate: Math.max(0, Number(exclusiveVideoRate) || 0),
        },
      };

      const res = await dispatch(updateSetting(payload));
      if (res?.payload?.status) {
        Success("AI Model Free Credits and Rates saved successfully!");
        dispatch(getSetting());
      } else {
        DangerRight(res?.payload?.message || "Failed to save settings");
      }
    } catch (err: any) {
      DangerRight(err?.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card rounded-4 border-0 shadow-sm p-4 bg-white">
      <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white"
            style={{ width: "48px", height: "48px", background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)" }}
          >
            <FaGift size={22} />
          </div>
          <div>
            <h5 className="fw-bold mb-1 text-dark">AI Model Free Credits & Real-Time Wallet Rates</h5>
            <p className="text-muted small mb-0">
              Configure global welcome free credits for new user registrations and real-time wallet deduction rates.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave}>
        {/* SECTION 1: GLOBAL WELCOME FREE CREDITS */}
        <div className="p-4 rounded-4 mb-4 border" style={{ backgroundColor: "#faf5ff" }}>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h6 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                <FaCoins className="text-warning" /> AI Model Free Credits (Global New User Bonus)
              </h6>
              <p className="text-muted small mb-0">
                When enabled, every new user who registers will automatically receive these free credits once.
              </p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className={`badge ${enabled ? "bg-success" : "bg-secondary"}`}>
                {enabled ? "Active" : "Disabled"}
              </span>
              <ToggleSwitch
                onClick={handleToggle}
                value={enabled}
              />
            </div>
          </div>

          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold text-dark small">
                Welcome Free Credits (Amount per New User)
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <FaCoins className="text-warning" />
                </span>
                <input
                  type="number"
                  min="0"
                  max="100000"
                  className="form-control bg-white border-start-0"
                  value={welcomeCredits}
                  onChange={(e) => setWelcomeCredits(Number(e.target.value))}
                  disabled={!enabled}
                  placeholder="e.g. 100"
                  required
                />
                <span className="input-group-text bg-light text-muted small">Credits</span>
              </div>
              <div className="form-text small text-muted">
                Applied globally to all new registrations across AI personas (Shanaya, etc.). Existing users will not receive duplicate bonuses.
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="p-3 bg-white rounded-3 border d-flex gap-2 align-items-start">
                <FaInfoCircle className="text-primary mt-1 flex-shrink-0" />
                <div className="small text-muted">
                  <strong>Global Single Setting:</strong> Admin sets one credit amount. No profile-wise complexity. Welcome credits are logged in user wallet history as <code>welcome_bonus</code>.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: REAL-TIME CREDIT DEDUCTION RATES */}
        <div className="p-4 rounded-4 mb-4 border bg-light">
          <div className="mb-3">
            <h6 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
              <FaCoins className="text-primary" /> Real-Time Credit Deduction Rates
            </h6>
            <p className="text-muted small mb-0">
              Set the exact credit amount deducted immediately when users interact with paid AI features.
            </p>
          </div>

          <div className="row g-3">
            {/* Chat Rate */}
            <div className="col-12 col-md-4">
              <div className="p-3 bg-white rounded-3 border h-100 shadow-sm">
                <label className="form-label fw-semibold text-dark small d-flex align-items-center gap-2">
                  <FaComments className="text-primary" /> Chat Message Rate
                </label>
                <div className="input-group">
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    className="form-control"
                    value={chatRate}
                    onChange={(e) => setChatRate(Number(e.target.value))}
                    required
                  />
                  <span className="input-group-text bg-light small">Credits / msg</span>
                </div>
                <div className="form-text small text-muted mt-2">
                  Deducted per sent message in real-time. If balance is 0, message sending is blocked.
                </div>
              </div>
            </div>

            {/* Exclusive Photo Rate */}
            <div className="col-12 col-md-4">
              <div className="p-3 bg-white rounded-3 border h-100 shadow-sm">
                <label className="form-label fw-semibold text-dark small d-flex align-items-center gap-2">
                  <FaImage className="text-info" /> Exclusive Photo Unlock
                </label>
                <div className="input-group">
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    className="form-control"
                    value={exclusivePhotoRate}
                    onChange={(e) => setExclusivePhotoRate(Number(e.target.value))}
                    required
                  />
                  <span className="input-group-text bg-light small">Credits / photo</span>
                </div>
                <div className="form-text small text-muted mt-2">
                  Deducted when unlocking an exclusive photo. Once unlocked, remains permanently accessible.
                </div>
              </div>
            </div>

            {/* Exclusive Video Rate */}
            <div className="col-12 col-md-4">
              <div className="p-3 bg-white rounded-3 border h-100 shadow-sm">
                <label className="form-label fw-semibold text-dark small d-flex align-items-center gap-2">
                  <FaVideo className="text-danger" /> Exclusive Video Unlock
                </label>
                <div className="input-group">
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    className="form-control"
                    value={exclusiveVideoRate}
                    onChange={(e) => setExclusiveVideoRate(Number(e.target.value))}
                    required
                  />
                  <span className="input-group-text bg-light small">Credits / video</span>
                </div>
                <div className="form-text small text-muted mt-2">
                  Deducted when unlocking an exclusive video clip.
                </div>
              </div>
            </div>
          </div>

          {/* CRITICAL DISCOVER NOTICE */}
          <div className="mt-3 p-3 rounded-3 bg-success bg-opacity-10 border border-success border-opacity-25 d-flex align-items-center gap-3">
            <FaCheckCircle className="text-success fs-4 flex-shrink-0" />
            <div>
              <span className="badge bg-success me-2">FREE CONTENT</span>
              <strong className="text-dark small">Discover Photos & Videos: Always FREE (0 credits).</strong>
              <div className="text-muted small">
                Discover feed photos and videos are always completely free to browse and watch. Zero credits will be deducted for Discover content.
              </div>
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="d-flex justify-content-end gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary rounded-pill px-5 py-2 fw-semibold shadow-sm d-flex align-items-center gap-2"
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                <span>Saving Settings...</span>
              </>
            ) : (
              <span>Save AI Model Free Credits Settings</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
