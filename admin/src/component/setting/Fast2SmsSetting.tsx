import Button from "@/extra/Button";
import { ExInput } from "@/extra/Input";
import ToggleSwitch from "@/extra/TogggleSwitch";
import { getSetting, handleSetting, updateSetting } from "@/store/settingSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { apiInstanceFetch } from "@/utils/ApiInstance";
import { isSkeleton } from "@/utils/allSelector";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

/** Parse Fast2SMS GET /dev/dlt_manager/whatsapp?type=template style JSON into form fields. */
function extractFast2smsWaIdsFromWabaJson(payload: unknown): {
  phoneNumberId?: string;
  messageId?: number;
  varCount?: number;
} {
  const out: { phoneNumberId?: string; messageId?: number; varCount?: number } = {};
  if (!payload || typeof payload !== "object") return out;
  const root = payload as { data?: unknown[] };
  const data = Array.isArray(root.data) ? root.data : [];
  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (out.phoneNumberId == null && row.phone_number_id != null) {
      const digits = String(row.phone_number_id).replace(/\D/g, "");
      if (digits.length >= 8 && digits.length <= 24) out.phoneNumberId = digits;
    }
  }
  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const templates = Array.isArray(row.templates) ? row.templates : [];
    let picked: Record<string, unknown> | undefined;
    for (const t of templates) {
      if (!t || typeof t !== "object") continue;
      const tr = t as Record<string, unknown>;
      if (String(tr.category || "").toUpperCase() === "AUTHENTICATION") {
        picked = tr;
        break;
      }
    }
    if (!picked && templates[0] && typeof templates[0] === "object") {
      picked = templates[0] as Record<string, unknown>;
    }
    if (picked) {
      const rawMid = picked.message_id;
      let mid: number | null = null;
      if (typeof rawMid === "number" && Number.isFinite(rawMid)) mid = rawMid;
      else if (typeof rawMid === "string" && /^\d+$/.test(rawMid.trim())) {
        const n = Number(rawMid.trim());
        if (Number.isFinite(n)) mid = n;
      }
      if (mid != null && mid > 0 && mid < 100_000_000_000) {
        out.messageId = mid;
        const rawVc = picked.var_count ?? picked.variable_count;
        if (typeof rawVc === "number" && Number.isFinite(rawVc)) {
          out.varCount = Math.min(2, Math.max(0, Math.floor(rawVc)));
        }
        break;
      }
    }
  }
  return out;
}

const Fast2SmsSetting = () => {
  const dispatch = useAppDispatch();
  const roleSkeleton = useSelector(isSkeleton);
  const { setting }: any = useSelector((state: RootStore) => state?.setting);

  const [apiKey, setApiKey] = useState("");
  const [senderId, setSenderId] = useState("");
  const [route, setRoute] = useState<"otp" | "dlt">("otp");
  const [dltMessage, setDltMessage] = useState("");
  const [flash, setFlash] = useState(false);
  const [waApiKey, setWaApiKey] = useState("");
  const [waPhoneNumberId, setWaPhoneNumberId] = useState("");
  const [waMessageId, setWaMessageId] = useState("");
  const [waVariableCount, setWaVariableCount] = useState("1");
  const [testPhone, setTestPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [fetchingWaba, setFetchingWaba] = useState(false);
  const [testingWa, setTestingWa] = useState(false);
  const [wabaPreview, setWabaPreview] = useState<string | null>(null);
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
    setWaApiKey(setting.fast2smsWhatsappApiKey || "");
    setWaPhoneNumberId(setting.fast2smsWhatsappPhoneNumberId || "");
    setWaMessageId(
      setting.fast2smsWhatsappMessageId
        ? String(setting.fast2smsWhatsappMessageId)
        : ""
    );
    setWaVariableCount(
      setting.fast2smsWhatsappVariableCount !== undefined &&
        setting.fast2smsWhatsappVariableCount !== null
        ? String(setting.fast2smsWhatsappVariableCount)
        : "1"
    );
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
            fast2smsWhatsappApiKey: waApiKey.trim(),
            fast2smsWhatsappPhoneNumberId: waPhoneNumberId.trim(),
            fast2smsWhatsappMessageId: (() => {
              const t = waMessageId.trim();
              if (!t) return 0;
              const n = Number(t);
              return Number.isFinite(n) && n > 0 ? n : 0;
            })(),
            fast2smsWhatsappVariableCount: Number.isFinite(Number(waVariableCount))
              ? Number(waVariableCount)
              : 1,
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

  const fetchWabaDetails = async (loadType: "number" | "template") => {
    if (!setting?._id) return;
    setFetchingWaba(true);
    setWabaPreview(null);
    try {
      const res: any = await apiInstanceFetch.get(
        `api/admin/setting/fast2smsWhatsappDetails?settingId=${setting._id}&type=${loadType}`
      );
      if (res?.status) {
        const payload = res.data ?? res;
        setWabaPreview(JSON.stringify(payload, null, 2));
        const rows = Array.isArray(res.data) ? res.data : [];
        if (rows.length === 0) {
          showNotice(
            "Empty response",
            loadType === "template"
              ? "Fast2SMS returned no WABA rows. In the Fast2SMS panel, confirm WhatsApp (WABA) is connected to this API key. You can still type phone_number_id and message_id from WhatsApp Manager / your template table, then Save."
              : "No connected WhatsApp number in the API response. Check the same API key as SMS, and complete WABA setup in Fast2SMS. Copy IDs from the dashboard if the API stays empty.",
            "error"
          );
        } else {
          if (loadType === "number" && rows.length >= 1) {
            const pid = rows[0]?.phone_number_id;
            if (pid !== undefined && pid !== null && String(pid).trim() !== "") {
              setWaPhoneNumberId(String(pid).trim());
            }
          }
          showNotice(
            "WABA data loaded",
            loadType === "number"
              ? "JSON is below; phone_number_id was filled when the API returned it. Copy message_id from templates (Load templates) or from your Fast2SMS WhatsApp template list."
              : "JSON is below. Find message_id (and phone_number_id) inside templates / account objects.",
            "success"
          );
        }
      } else {
        showNotice("Fetch failed", res?.message || "Could not load WABA details.", "error");
      }
    } catch (err: any) {
      showNotice(
        "Fetch failed",
        typeof err?.message === "string" ? err.message : "Could not load WABA details.",
        "error"
      );
    } finally {
      setFetchingWaba(false);
    }
  };

  const sendTestWhatsapp = async () => {
    if (!setting?._id || !testPhone.trim()) {
      showNotice("Mobile required", "Enter a test mobile number.", "error");
      return;
    }
    setTestingWa(true);
    try {
      const res: any = await apiInstanceFetch.post(
        `api/admin/setting/testFast2smsWhatsapp?settingId=${setting._id}`,
        { phone: testPhone.trim() }
      );
      if (res?.status) {
        showNotice("Test WhatsApp", res?.message || "Template sent. Check WhatsApp.", "success");
      } else {
        showNotice("Test failed", res?.message || "Could not send test WhatsApp.", "error");
      }
    } catch (err: any) {
      showNotice(
        "Test failed",
        typeof err?.message === "string" ? err.message : "Could not send test WhatsApp.",
        "error"
      );
    } finally {
      setTestingWa(false);
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
                <h4 className="settingboxheader">WhatsApp OTP (WABA) — Fast2SMS</h4>
                <p className="text-muted small px-3 mb-2">
                  After SMS succeeds, the server can also send the same OTP via an approved authentication
                  template. Get <code>phone_number_id</code> and template <code>message_id</code> from{" "}
                  <a
                    href="https://docs.fast2sms.com/reference/get-waba-template-details"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Get WABA &amp; Template Details
                  </a>{" "}
                  (or use the load buttons below). Sending uses{" "}
                  <a
                    href="https://docs.fast2sms.com/reference/sendwhatsappmessage"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Send WhatsApp Message
                  </a>{" "}
                  (GET https://www.fast2sms.com/dev/whatsapp).
                </p>
                <hr style={{ width: "95%", margin: "5px 9px" }} />
              </div>

              <div className="px-3 pb-2">
                <div className="alert alert-info small mb-0 py-2" role="region" aria-label="What to paste where">
                  <p className="fw-semibold mb-1">What goes in which field (important)</p>
                  <ul className="mb-0 ps-3">
                    <li>
                      <strong>Fast2SMS API key</strong> (top of this page, SMS block) = Authorization key for{" "}
                      <strong>SMS</strong> (<code>POST …/bulkV2</code>). Same key usually works for WhatsApp too.
                    </li>
                    <li>
                      <strong>Optional: WhatsApp-only API key</strong> (below) = only if Fast2SMS gave you a{" "}
                      <em>different</em> key under <strong>WhatsApp API</strong>; leave empty to reuse the SMS key.
                    </li>
                    <li>
                      <strong>Phone Number ID</strong> = <em>only digits</em> from <strong>WhatsApp Manager → Numbers</strong>{" "}
                      (e.g. <code>1018278628043971</code>). <strong>Not</strong> the Dev API key. <strong>Not</strong> the
                      long <strong>Template ID</strong> from the Templates table (e.g. <code>25661961060143826</code> is
                      wrong here — that belongs to Meta / template row, not Phone Number ID).
                    </li>
                    <li>
                      <strong>Fast2SMS message_id</strong> = small number from Templates / API JSON (e.g.{" "}
                      <code>18204</code> for <code>otp</code>, <code>18205</code> for <code>otp1</code>),{" "}
                      <strong>not</strong> the long Template ID column.
                    </li>
                  </ul>
                </div>
              </div>

              <div
                className="d-flex justify-content-between align-items-start px-3 pb-2"
                style={{ paddingRight: "20px" }}
              >
                <div>
                  <p className="mb-0 fw-semibold">Also send OTP on WhatsApp</p>
                  <span className="text-muted" style={{ fontSize: "12px" }}>
                    WhatsApp calls use the optional key below, otherwise the same API key as SMS. Recipient needs
                    WhatsApp on that mobile.
                  </span>
                </div>
                {roleSkeleton ? (
                  <div className="skeleton mb-2" style={{ height: "24px", width: "48px" }} />
                ) : (
                  <ToggleSwitch
                    value={!!setting?.fast2smsWhatsappOtpEnabled}
                    onClick={() => {
                      if (setting?._id) {
                        dispatch(
                          handleSetting({ settingId: setting._id, type: "fast2smsWhatsappOtpEnabled" })
                        );
                      }
                    }}
                  />
                )}
              </div>

              <div className="px-3 pb-3">
                <p className="text-muted small mb-2">
                  <strong>Important:</strong> Fill <code>phone_number_id</code> and <code>message_id</code>, then
                  click <strong>Save Fast2SMS settings</strong> above. &quot;Send test WhatsApp&quot; uses saved
                  values, not unsaved text in the fields.
                </p>
                <ExInput
                  id="fast2smsWhatsappApiKey"
                  name="fast2smsWhatsappApiKey"
                  label="WhatsApp API Authorization key (optional)"
                  placeholder="Leave empty = use Fast2SMS API key above. Paste only if WhatsApp API tab shows a different key."
                  value={waApiKey}
                  onChange={(e: any) => setWaApiKey(e.target.value)}
                />
                <ExInput
                  id="fast2smsWhatsappPhoneNumberId"
                  name="fast2smsWhatsappPhoneNumberId"
                  label="Phone Number ID (digits only — WhatsApp Manager table)"
                  placeholder="e.g. 1018278628043971 from column Phone Number ID (not tokens / JWT)"
                  value={waPhoneNumberId}
                  onChange={(e: any) => setWaPhoneNumberId(e.target.value)}
                />
                {waPhoneNumberId.trim() !== "" && /[^\d]/.test(waPhoneNumberId.trim()) && (
                  <div className="alert alert-danger py-2 px-2 small mt-1 mb-0" role="alert">
                    This is <strong>not</strong> your API key. You pasted something with letters — that is usually
                    the <strong>Authorization / Dev API key</strong> (same as the field at the top of this page).
                    WhatsApp needs the numeric <strong>Phone Number ID</strong> only (e.g.{" "}
                    <code>1018278628043971</code>) from Fast2SMS → <strong>WhatsApp Manager</strong> → Numbers
                    table. Click <strong>Load WABA number</strong> then <strong>Apply</strong>, or type only
                    digits.
                  </div>
                )}
                {waPhoneNumberId.trim() !== "" &&
                  /^\d+$/.test(waPhoneNumberId.trim()) &&
                  waPhoneNumberId.trim().length >= 17 && (
                    <div className="alert alert-warning py-2 px-2 small mt-1 mb-0" role="status">
                      This many digits often means you pasted <strong>Template ID</strong> from the Templates
                      table (Meta id). <strong>Phone Number ID</strong> is usually <strong>15–16 digits</strong> (e.g.{" "}
                      <code>1018278628043971</code>) from the <strong>Numbers</strong> row, not from Templates.
                    </div>
                  )}
                <ExInput
                  id="fast2smsWhatsappMessageId"
                  name="fast2smsWhatsappMessageId"
                  label="Fast2SMS message_id (small integer — not Meta template_id)"
                  placeholder="e.g. 18204 from Templates / WABA API field message_id (not 1635… long id)"
                  value={waMessageId}
                  onChange={(e: any) => setWaMessageId(e.target.value)}
                />
                <div className="my-2">
                  <label className="form-label">Template variable count</label>
                  <select
                    className="form-select"
                    value={waVariableCount}
                    onChange={(e) => setWaVariableCount(e.target.value)}
                  >
                    <option value="0">0 — no body variables (not for otp / otp1)</option>
                    <option value="1">1 — OTP only (template otp, message_id 18204)</option>
                    <option value="2">2 — OTP | minutes (template otp1, message_id 18205)</option>
                  </select>
                  <small className="text-muted">
                    For 2+ variables, extra slots are filled with OTP validity in minutes (same as SMS OTP
                    TTL). Template <code>otp</code> uses <strong>1</strong>; <code>otp1</code> uses{" "}
                    <strong>2</strong> (second slot is minutes unless you change the template text).
                  </small>
                  {waMessageId.trim() !== "" && waVariableCount === "0" && (
                    <div className="alert alert-warning py-2 px-2 small mt-2 mb-0" role="status">
                      Approved OTP templates need at least one body variable. Choose{" "}
                      <strong>1 — OTP only</strong> for template <code>otp</code>, or{" "}
                      <strong>2</strong> for <code>otp1</code>. Count 0 does not send the code into{" "}
                      <code>{"{{1}}"}</code>.
                    </div>
                  )}
                </div>
                <div className="d-flex flex-wrap gap-2 mt-1">
                  <Button
                    type="button"
                    text={fetchingWaba ? "Loading…" : "Load WABA number (type=number)"}
                    className="text-light fw-bold"
                    style={{ backgroundColor: "#6f42c1" }}
                    onClick={() => fetchWabaDetails("number")}
                    disabled={fetchingWaba}
                  />
                  <Button
                    type="button"
                    text={fetchingWaba ? "Loading…" : "Load templates (type=template)"}
                    className="text-light fw-bold"
                    style={{ backgroundColor: "#5a32a8" }}
                    onClick={() => fetchWabaDetails("template")}
                    disabled={fetchingWaba}
                  />
                </div>
                <small className="text-muted d-block mt-1">
                  <strong>Workflow:</strong> (1) Load number → <strong>Apply</strong> → (2) Load templates →{" "}
                  <strong>Apply</strong> again → (3) <strong>Save Fast2SMS settings</strong> → (4) Send test
                  WhatsApp. Step (1) JSON has no <code>templates[]</code>, so it cannot set <code>message_id</code>{" "}
                  — step (2) is required.
                </small>
                <small className="text-muted d-block mt-1">
                  If <code>data</code> is <code>[]</code>, the API key may not have WhatsApp linked, or WABA is
                  not set up in Fast2SMS. Use the Fast2SMS dashboard → WhatsApp / template manager and enter IDs
                  manually (e.g. message_id <code>18204</code> for template <code>otp</code> from your sheet).
                </small>
                {wabaPreview && (
                  <>
                    <pre
                      className="mt-2 p-2 bg-light border rounded small text-start"
                      style={{ maxHeight: 280, overflow: "auto", fontSize: 11 }}
                    >
                      {wabaPreview}
                    </pre>
                    <Button
                      type="button"
                      text="Apply phone_number_id & message_id from JSON above"
                      className="text-light fw-bold mt-2"
                      style={{ backgroundColor: "#198754" }}
                      onClick={() => {
                        try {
                          const parsed = JSON.parse(wabaPreview);
                          const ex = extractFast2smsWaIdsFromWabaJson(parsed);
                          if (!ex.phoneNumberId && ex.messageId == null) {
                            showNotice(
                              "Nothing to apply",
                              "Could not find phone_number_id or a template message_id in this JSON.",
                              "error"
                            );
                            return;
                          }
                          if (ex.phoneNumberId) setWaPhoneNumberId(ex.phoneNumberId);
                          if (ex.messageId != null) {
                            setWaMessageId(String(ex.messageId));
                          } else if (ex.phoneNumberId) {
                            const cur = waMessageId.trim();
                            if (cur && /^\d+$/.test(cur) && Number(cur) >= 100_000_000_000) {
                              setWaMessageId("");
                            }
                          }
                          if (ex.varCount != null) setWaVariableCount(String(ex.varCount));

                          let follow =
                            "Confirm variable count, then click Save Fast2SMS settings before Send test WhatsApp.";
                          if (ex.phoneNumberId && ex.messageId == null) {
                            follow =
                              "This JSON has no templates[] — only Phone Number ID was applied. If message_id looked like a long Meta id, it was cleared. Now click **Load templates (type=template)**, then **Apply** again, then **Save**.";
                          } else if (ex.messageId != null && !ex.phoneNumberId) {
                            follow =
                              "message_id was applied from templates JSON. If Phone Number ID is still wrong, load **type=number**, Apply, then Save.";
                          }
                          showNotice("Fields updated", follow, "success");
                        } catch {
                          showNotice("Invalid JSON", "Could not parse the preview. Load templates again.", "error");
                        }
                      }}
                    />
                    <small className="text-muted d-block mt-1">
                      In the JSON, use <code>&quot;message_id&quot;: 18204</code> for sending — not{" "}
                      <code>template_id</code> (<code>1635…</code>).
                    </small>
                  </>
                )}
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
                    <div className="d-flex flex-wrap gap-2">
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
                      <Button
                        type="button"
                        text={testingWa ? "Sending…" : "Send test WhatsApp"}
                        className="text-light fw-bold"
                        style={{
                          backgroundColor: "#6f42c1",
                          minHeight: 42,
                          paddingLeft: 20,
                          paddingRight: 20,
                        }}
                        onClick={sendTestWhatsapp}
                        disabled={testingWa}
                      />
                    </div>
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
