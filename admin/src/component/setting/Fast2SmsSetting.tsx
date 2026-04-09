import Button from "@/extra/Button";
import { ExInput } from "@/extra/Input";
import ToggleSwitch from "@/extra/TogggleSwitch";
import { getSetting, handleSetting, updateSetting } from "@/store/settingSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { apiInstanceFetch } from "@/utils/ApiInstance";
import { isSkeleton } from "@/utils/allSelector";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const Fast2SmsSetting = () => {
  const dispatch = useAppDispatch();
  const roleSkeleton = useSelector(isSkeleton);
  const { setting }: any = useSelector((state: RootStore) => state?.setting);

  const [apiKey, setApiKey] = useState("");
  const [senderId, setSenderId] = useState("");
  const [route, setRoute] = useState<"otp" | "dlt">("otp");
  const [dltMessage, setDltMessage] = useState("");
  const [flash, setFlash] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [notice, setNotice] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: "success" | "error";
  }>({ open: false, title: "", message: "", variant: "success" });

  const showNotice = (
    title: string,
    message: string,
    variant: "success" | "error" = "success"
  ) => setNotice({ open: true, title, message, variant });

  useEffect(() => {
    dispatch(getSetting());
  }, [dispatch]);

  useEffect(() => {
    if (!setting) return;
    setApiKey(setting.fast2smsApiKey || "");
    setSenderId(setting.fast2smsSenderId || "");
    setRoute(setting.fast2smsRoute === "dlt" ? "dlt" : "otp");
    setDltMessage(setting.fast2smsDltMessage || "");
    setFlash(Number(setting.fast2smsFlash) === 1);
  }, [setting]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setting?._id) return;
    setSaving(true);
    try {
      await dispatch(
        updateSetting({
          settingId: setting._id,
          settingDataSubmit: {
            fast2smsApiKey: apiKey.trim(),
            fast2smsSenderId: senderId.trim(),
            fast2smsRoute: route,
            fast2smsDltMessage: dltMessage,
            fast2smsFlash: flash ? 1 : 0,
          },
        })
      ).unwrap();
      showNotice("Saved", "Fast2SMS settings were saved successfully.", "success");
      dispatch(getSetting());
    } catch {
      showNotice("Save failed", "Could not save settings. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    if (!setting?._id || !testPhone.trim()) {
      showNotice("Mobile required", "Enter a test mobile number.", "error");
      return;
    }
    setTesting(true);
    try {
      const res = await apiInstanceFetch.post(
        `api/admin/setting/testFast2Sms?settingId=${setting._id}`,
        { phone: testPhone.trim() }
      );
      showNotice("Test SMS", res?.message || "SMS sent. Check the device.", "success");
    } catch (err: any) {
      showNotice(
        "Test failed",
        typeof err?.message === "string" ? err.message : "Could not send test SMS.",
        "error"
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="mainSetting">
      {notice.open && (
        <div
          className="dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="fast2sms-notice-title"
          onClick={() => setNotice((n) => ({ ...n, open: false }))}
        >
          <div className="w-100" onClick={(e) => e.stopPropagation()}>
            <div className="row justify-content-center">
              <div className="col-xl-3 col-md-4 col-11">
                <div className="commonmainDiaogBox text-center">
                  <h5
                    id="fast2sms-notice-title"
                    className="mt-2 mb-0"
                    style={{
                      color: notice.variant === "success" ? "#28a745" : "#dc3545",
                    }}
                  >
                    {notice.title}
                  </h5>
                  <p className="commontext mt-3 mb-0" style={{ fontSize: "15px" }}>
                    {notice.message}
                  </p>
                  <button
                    type="button"
                    className="logout-button mt-4"
                    style={{
                      backgroundColor: notice.variant === "success" ? "#9f5aff" : "#6c757d",
                    }}
                    onClick={() => setNotice((n) => ({ ...n, open: false }))}
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <form onSubmit={handleSave}>
        <div className="settingBox row">
          <div className="col-12 mt-2">
            <div className="settingBoxOuter">
              <div className="settingBoxHeader">
                <h4 className="settingboxheader">SMS API — Fast2SMS</h4>
                <p className="text-muted small px-3 mb-2">
                  Used when Firebase phone OTP/APNs is unavailable. Authorization:{" "}
                  <a
                    href="https://docs.fast2sms.com/reference/authorization"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Fast2SMS docs
                  </a>
                  . Endpoint: POST https://www.fast2sms.com/dev/bulkV2
                </p>
                <hr style={{ width: "95%", margin: "5px 9px" }} />
              </div>

              <div
                className="d-flex justify-content-between align-items-start px-3 pb-2"
                style={{ paddingRight: "20px" }}
              >
                <div>
                  <p className="mb-0 fw-semibold">Enable SMS OTP (Fast2SMS)</p>
                  <span className="text-muted" style={{ fontSize: "12px" }}>
                    When on, the app can call /api/client/sms/requestOtp and verifyOtp.
                  </span>
                </div>
                {roleSkeleton ? (
                  <div className="skeleton mb-2" style={{ height: "24px", width: "48px" }} />
                ) : (
                  <ToggleSwitch
                    value={!!setting?.fast2smsEnabled}
                    onClick={() => {
                      if (setting?._id) {
                        dispatch(handleSetting({ settingId: setting._id, type: "fast2smsEnabled" }));
                      }
                    }}
                  />
                )}
              </div>

              <div className="px-3 pb-3">
                <ExInput
                  id="fast2smsApiKey"
                  name="fast2smsApiKey"
                  label="Fast2SMS API key (Authorization header)"
                  placeholder="Paste API authorization key from Fast2SMS dashboard"
                  value={apiKey}
                  onChange={(e: any) => setApiKey(e.target.value)}
                />
                <ExInput
                  id="fast2smsSenderId"
                  name="fast2smsSenderId"
                  label="Sender ID (required for DLT route)"
                  placeholder="e.g. TOKOWS"
                  value={senderId}
                  onChange={(e: any) => setSenderId(e.target.value)}
                />
                <div className="my-2">
                  <label className="form-label">Route</label>
                  <select
                    className="form-select"
                    value={route}
                    onChange={(e) => setRoute(e.target.value as "otp" | "dlt")}
                  >
                    <option value="otp">OTP (Fast2SMS OTP route)</option>
                    <option value="dlt">DLT (template + variables_values)</option>
                  </select>
                  <small className="text-muted">
                    DLT requires an approved template in fast2smsDltMessage with {"{#var#}"}.
                  </small>
                </div>
                {route === "dlt" && (
                  <div className="my-2">
                    <label className="form-label">DLT message template</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder='e.g. Your OTP is {#var#}.'
                      value={dltMessage}
                      onChange={(e) => setDltMessage(e.target.value)}
                    />
                  </div>
                )}
                <div className="form-check my-2">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="fast2smsFlash"
                    checked={flash}
                    onChange={(e) => setFlash(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="fast2smsFlash">
                    Flash SMS (1) — usually leave off
                  </label>
                </div>
                <Button
                  type="submit"
                  text={saving ? "Saving…" : "Save Fast2SMS settings"}
                  className="text-light fw-bold mt-2"
                  style={{ backgroundColor: "#9f5aff" }}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <div className="col-12 mt-3">
            <div className="settingBoxOuter">
              <div className="settingBoxHeader">
                <h4 className="settingboxheader">Test SMS</h4>
                <hr style={{ width: "95%", margin: "5px 9px" }} />
              </div>
              <div className="px-3 pb-3">
                <div className="row g-2 g-md-3 align-items-end">
                  <div className="col-12 col-md">
                    <label htmlFor="testPhone" className="form-label mb-1">
                      Mobile number
                    </label>
                    <ExInput
                      id="testPhone"
                      name="testPhone"
                      label=""
                      placeholder="e.g. 9876543210 or +919876543210"
                      value={testPhone}
                      onChange={(e: any) => setTestPhone(e.target.value)}
                      newClass="form-control"
                    />
                  </div>
                  <div className="col-12 col-md-auto d-grid d-md-block">
                    <Button
                      type="button"
                      text={testing ? "Sending…" : "Send test SMS"}
                      className="text-light fw-bold"
                      style={{
                        backgroundColor: "#9f5aff",
                        minHeight: 42,
                        paddingLeft: 20,
                        paddingRight: 20,
                      }}
                      onClick={sendTest}
                      disabled={testing}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Fast2SmsSetting;
