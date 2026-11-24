import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootStore, useAppDispatch } from "@/store/store";
import { getSetting, handleSetting, updateSetting } from "@/store/settingSlice";
import { Success, DangerRight } from "@/api/toastServices";
import ToggleSwitch from "@/extra/TogggleSwitch";
import { FaGift, FaCoins, FaInfoCircle } from "react-icons/fa";

export default function AiModelFreeCreditsSetting() {
  const dispatch = useAppDispatch();
  const setting: any = useSelector((state: RootStore) => state.setting.setting);

  const [enabled, setEnabled] = useState<boolean>(true);
  const [welcomeCredits, setWelcomeCredits] = useState<number>(100);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    dispatch(getSetting());
  }, [dispatch]);

  useEffect(() => {
    if (setting) {
      setEnabled(setting.aiModelFreeCreditsEnabled !== false);
      setWelcomeCredits(
        setting.aiModelWelcomeFreeCredits !== undefined
          ? Number(setting.aiModelWelcomeFreeCredits)
          : 100
      );
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
        },
      };

      const res = await dispatch(updateSetting(payload));
      if (res?.payload?.status) {
        Success("AI Model Free Credits saved successfully!");
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
    <div className="card rounded-4 border-0 shadow-sm p-4 bg-white" style={{ maxWidth: "800px" }}>
      <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white"
            style={{ width: "48px", height: "48px", background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)" }}
          >
            <FaGift size={22} />
          </div>
          <div>
            <h5 className="fw-bold mb-1 text-dark">AI Model Free Credits</h5>
            <p className="text-muted small mb-0">
              Configure global welcome free credits awarded automatically to every new registered user.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave}>
        {/* GLOBAL WELCOME FREE CREDITS */}
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
                Free Credits Amount
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
                Applied globally to all new registrations. Existing users will not receive duplicate credits.
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="p-3 bg-white rounded-3 border d-flex gap-2 align-items-start">
                <FaInfoCircle className="text-primary mt-1 flex-shrink-0" />
                <div className="small text-muted">
                  <strong>Global Setting:</strong> One fixed credit amount for all new users. Free credits are added to the user wallet upon successful registration and logged in transaction history.
                </div>
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
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Free Credits Setting</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
