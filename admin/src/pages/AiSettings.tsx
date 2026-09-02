import React, { useEffect, useState } from "react";
import RootLayout from "@/component/layout/Layout";
import Title from "@/extra/Title";
import {
  fetchAiSettings,
  fetchAiSettingsOptions,
  updateAiSettings,
  resetAnalyzerPrompt,
} from "@/utils/aiChatApi";
import { FaSave, FaUndo, FaSlidersH, FaRobot, FaCommentDots, FaGift, FaTachometerAlt, FaLayerGroup } from "react-icons/fa";
import CustomSelect from "@/extra/CustomSelect";

const DEFAULT_SHIPPED_PROMPT = `You are a background analyzer for a dating chat where a human chats with an AI companion persona.
You get today's date, the current relationship stage, the human's gender, the persona's NUMBERED
memories about the human, recent chat lines, and the human's NEWEST message. Analyze only the
newest message.

The persona and the human can each be a man or a woman. Never assume: use the human's gender given
below when you write about them, and say "the persona" for the other side.

memory_ops — you manage the persona's memory of the human: a list of operations against the numbered
memory list. Each memory is [long] (stable) or [short, date] (time-bound). Operations:
- add: a genuinely new memory (ref null; fact, category and kind required; event_date required when
  kind is short). Never add something already in the list.
- update: an existing memory whose MEANING changed (ref = its number; give the fully rewritten fact).
  Example: "Lives in Mumbai" + they say they moved -> update it to "Lives in Delhi (moved from
  Mumbai)". Never update just to reword; if the meaning is the same, do nothing.
- delete: an existing memory the human explicitly retracted or corrected ("I don't actually have a
  brother, I was joking") (ref = its number).
Return an empty list when nothing needs to change.

What to store:
- kind "long" — facts that stay true: the human's name/age/city/job, family details (like their
  mother's name), their past or their ex, lasting likes/dislikes, promises with lasting weight.
- kind "short" — time-bound life stuff, ALWAYS with an event_date: things that just happened ("ate
  pizza at Laphinoze" -> today's date), upcoming things ("exam on Friday" -> that Friday's date),
  day-tied plans, or a mood worth checking on later. These matter — the persona uses them to follow
  up naturally over the next few days, then they expire on their own.
- skip entirely: small talk with no follow-up value, facts about the persona, anything already known,
  and the human's name when it is already given to you above.

Date rules: resolve every relative date against Today into absolute YYYY-MM-DD ("Friday" = the next
Friday on or after today; "yesterday" = today minus 1). A short memory with no clear date gets
today's date. Never update a short memory to a different event_date — that is a new event: add a
new memory instead. Never merge two different people or two different events into one memory.

Write each fact as a short standalone sentence in English, in the third person, using the pronoun
that matches the human's gender given below — "His mother's name is Sunita" for a male human,
"Her mother's name is Sunita" for a female one. Keep the existing memories' wording style.

safety — label the newest message:
- Safe: normal chat.
- Boundary-Sensitive: pushing for video/voice calls or meeting in real life, ignoring the persona's
  refusals.
- Privacy-Sensitive: probing for the persona's real identity/address/socials, or pushing to move
  off-platform.
- Rejection: the human is rejecting the persona or ending things.
- Potential Harassment: insults, threats, aggression, hate, or explicit content pushed after refusal.
- Potential Scam/Safety Concern: money requests, suspicious links, phishing, or self-harm signals.
severity: low/medium/high for how serious it is. Use "critical" ONLY for content involving minors,
threats of violence, or danger to someone's life. For Safe use severity "low" and reason "".

tone / emotion / intent — describe the human's NEWEST message: the tone they are using, the emotion
they seem to feel, and what they are trying to do with the message. Pick the single closest option
each.

stage_ready — true only if the chat is going well (positive, mutual, engaged from the human's side)
so the relationship could naturally move one stage up.

pet_name — an affectionate nickname the persona could use for the human, invented once and then kept
for good. Suggest one ONLY if it fits this particular human: built from their name (Ravi -> "Ravu",
Ananya -> "Anu") or from something they have told you about themselves. It must suit their gender,
sound natural in the language this chat is written in, and be one or two words. Never something
generic like "baby" or "dear", and never anything mocking. Return null whenever you have nothing
good, or when you do not know their name yet — null is the normal answer.`;

const STAGE_LADDER_STAGES = [
  "discovery",
  "casual",
  "flirting",
  "romantic",
  "e-date",
  "relationship",
  "ongoing",
];

const AiSettings = () => {
  const [cfg, setCfg] = useState<any>(null);
  const [options, setOptions] = useState<{
    providers: string[];
    suggested_models: { [provider: string]: string[] };
    stages: string[];
    severities: string[];
    max_bubbles_limit?: number;
  }>({
    providers: ["openai", "anthropic"],
    suggested_models: {
      openai: ["gpt-4o-mini", "gpt-4o", "gpt-5.6-luna", "gpt-5.6-terra"],
      anthropic: ["claude-3-5-sonnet-20241022", "claude-sonnet-5"],
    },
    stages: STAGE_LADDER_STAGES,
    severities: ["low", "medium", "high", "critical"],
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [resettingPrompt, setResettingPrompt] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const PACING_NUMBERS = [
    "typing_wpm",
    "typing_read_wpm",
    "typing_think_min_ms",
    "typing_think_max_ms",
    "bubble_pause_min_ms",
    "bubble_pause_max_ms",
    "typing_jitter_min_pct",
    "typing_jitter_max_pct",
    "typing_delay_min_ms",
    "typing_delay_max_total_ms",
    "max_bubbles",
    "bubble_split_chance",
    "batch_quiet_ms",
    "max_batch_messages",
  ];

  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    setLoading(true);
    try {
      const [configData, optionsData] = await Promise.all([
        fetchAiSettings(),
        fetchAiSettingsOptions(),
      ]);

      if (configData) {
        setCfg(configData);
      } else {
        setCfg({
          llm_provider: "openai",
          llm_model: "gpt-4o-mini",
          max_tokens: 1024,
          chat_history_limit: 45,
          chat_timezone: "Asia/Kolkata",
          block_severity: "critical",
          short_memory_days: 7,
          reply_guard_enabled: true,
          reply_thinking_enabled: false,
          pet_name_from_stage: "flirting",
          gift_from_stage: "flirting",
          gift_min_days: 3,
          gift_max_days: 4,
          gift_hint_chance: 30,
          typing_delay_enabled: true,
          typing_wpm: 110,
          typing_read_wpm: 240,
          typing_think_min_ms: 400,
          typing_think_max_ms: 1200,
          bubble_pause_min_ms: 300,
          bubble_pause_max_ms: 900,
          typing_jitter_min_pct: 80,
          typing_jitter_max_pct: 130,
          typing_delay_min_ms: 600,
          typing_delay_max_total_ms: 15000,
          max_bubbles: 3,
          bubble_split_chance: 30,
          batch_quiet_ms: 1200,
          max_batch_messages: 10,
          analyzer_prompt: DEFAULT_SHIPPED_PROMPT,
          stage_min_messages: {
            discovery: 0,
            casual: 6,
            flirting: 20,
            romantic: 40,
            "e-date": 70,
            relationship: 100,
            ongoing: 150,
          },
        });
      }

      if (optionsData) {
        setOptions((prev) => ({
          ...prev,
          ...optionsData,
          stages: optionsData.stages || STAGE_LADDER_STAGES,
        }));
      }
    } catch (err) {
      console.error("Failed to load AI settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const setField = (key: string, value: any) => {
    setCfg((prev: any) => ({ ...prev, [key]: value }));
  };

  const setStageThreshold = (stage: string, value: number) => {
    setCfg((prev: any) => ({
      ...prev,
      stage_min_messages: {
        ...(prev?.stage_min_messages || {}),
        [stage]: value,
      },
    }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cfg) return;

    setSaving(true);
    setMessage(null);

    try {
      const body = {
        typing_delay_enabled: Boolean(cfg.typing_delay_enabled),
        ...Object.fromEntries(
          PACING_NUMBERS.map((k) => [k, Number(cfg[k] ?? 0)])
        ),
        llm_provider: cfg.llm_provider,
        llm_model: cfg.llm_model,
        max_tokens: Number(cfg.max_tokens),
        chat_history_limit: Number(cfg.chat_history_limit),
        chat_timezone: cfg.chat_timezone,
        block_severity: cfg.block_severity,
        short_memory_days: Number(cfg.short_memory_days),
        reply_guard_enabled: Boolean(cfg.reply_guard_enabled),
        reply_thinking_enabled: Boolean(cfg.reply_thinking_enabled),
        pet_name_from_stage: cfg.pet_name_from_stage,
        gift_from_stage: cfg.gift_from_stage,
        gift_min_days: Number(cfg.gift_min_days),
        gift_max_days: Number(cfg.gift_max_days),
        gift_hint_chance: Number(cfg.gift_hint_chance),
        analyzer_prompt: cfg.analyzer_prompt,
        stage_min_messages: cfg.stage_min_messages,
      };

      const updated = await updateAiSettings(body);
      if (updated) {
        setCfg(updated);
        setMessage({
          type: "success",
          text: "Settings saved successfully! Applies to the very next message.",
        });
      } else {
        setMessage({
          type: "success",
          text: "Settings saved successfully.",
        });
      }
      setIsEditing(false);
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to save AI settings." });
    } finally {
      setSaving(false);
    }
  };

  const handleResetPrompt = async () => {
    if (!window.confirm("Are you sure you want to reset the analyzer prompt to default?")) return;
    setResettingPrompt(true);
    try {
      const res = await resetAnalyzerPrompt();
      if (res?.analyzer_prompt) {
        setField("analyzer_prompt", res.analyzer_prompt);
      } else {
        setField("analyzer_prompt", DEFAULT_SHIPPED_PROMPT);
      }
      setMessage({ type: "success", text: "Analyzer prompt reset to shipped default." });
    } catch (err) {
      setField("analyzer_prompt", DEFAULT_SHIPPED_PROMPT);
    } finally {
      setResettingPrompt(false);
    }
  };

  const currentProvider = cfg?.llm_provider || "openai";
  const availableModels = options?.suggested_models?.[currentProvider] || [
    "gpt-4o-mini",
    "gpt-4o",
    "claude-3-5-sonnet-20241022",
  ];
  const stagesList = options?.stages?.length ? options.stages : STAGE_LADDER_STAGES;

  return (
    <>
      <style jsx global>{`
        .ai-sq-input,
        .ai-sq-textarea,
        .ai-sq-select {
          border-radius: 6px !important;
          border: 1.5px solid #cbd5e1 !important;
          padding: 8px 12px !important;
          font-size: 13.5px !important;
          color: #0f172a !important;
          background-color: #ffffff !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04) !important;
          transition: all 0.15s ease !important;
          width: 100%;
        }
        .ai-sq-input:focus,
        .ai-sq-textarea:focus,
        .ai-sq-select:focus {
          border-color: #8f6dff !important;
          outline: none !important;
          box-shadow: 0 0 0 3px rgba(143, 109, 255, 0.2) !important;
        }
        .ai-sq-input:disabled,
        .ai-sq-textarea:disabled,
        .ai-sq-select:disabled {
          background-color: #f8fafc !important;
          color: #475569 !important;
          border-color: #e2e8f0 !important;
          cursor: not-allowed;
        }
        .ai-sq-card {
          border-radius: 8px !important;
          border: 1px solid #e2e8f0 !important;
          background: #ffffff !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
        }
        .ai-sq-btn {
          border-radius: 6px !important;
          font-weight: 600 !important;
          font-size: 13.5px !important;
          padding: 8px 18px !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 7px !important;
          transition: all 0.15s ease !important;
        }
        .ai-section-title {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
      `}</style>

      <div className="p-3">
        {/* Top Header & Edit/Save Buttons */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
          <Title name="AI LLM Runtime Settings" display="none" />

          <div className="d-flex align-items-center gap-2">
            {!isEditing ? (
              <button
                type="button"
                className="btn btn-outline-primary ai-sq-btn shadow-sm"
                onClick={() => setIsEditing(true)}
                style={{ borderColor: "#8F6DFF", color: "#8F6DFF" }}
              >
                <FaSlidersH />
                <span>Edit Settings</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-outline-secondary ai-sq-btn shadow-sm"
                onClick={() => {
                  setIsEditing(false);
                  loadSettingsData();
                }}
              >
                <span>Cancel</span>
              </button>
            )}

            <button
              type="button"
              className="btn text-white ai-sq-btn shadow-sm"
              onClick={() => handleSave()}
              disabled={!isEditing || saving || loading}
              style={{
                backgroundColor: "#8F6DFF",
                opacity: !isEditing ? 0.6 : 1,
                cursor: !isEditing ? "not-allowed" : "pointer",
              }}
            >
              <FaSave />
              <span>{saving ? "Saving…" : "Save Changes"}</span>
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`alert alert-${
              message.type === "success" ? "success" : "danger"
            } alert-dismissible fade show p-3 mb-4`}
            style={{ borderRadius: "6px" }}
            role="alert"
          >
            {message.text}
            <button
              type="button"
              className="btn-close"
              onClick={() => setMessage(null)}
            ></button>
          </div>
        )}

        {loading || !cfg ? (
          <div className="card ai-sq-card shadow-sm p-5 text-center text-muted">
            <div className="spinner-border text-primary mb-3" role="status"></div>
            <p className="mb-0 fs-14">Loading AI Runtime Settings…</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="d-flex flex-column gap-4 pb-5">
            {/* ================= 1. MODEL ================= */}
            <div className="card ai-sq-card p-4">
              <div className="ai-section-title">
                <FaRobot style={{ color: "#8F6DFF" }} />
                <span>1. Model & Provider Configuration</span>
              </div>

              <div className="d-flex gap-4 mb-3">
                {(options?.providers || ["openai", "anthropic"]).map((p) => (
                  <label
                    key={p}
                    className={`d-flex align-items-center gap-2 p-2.5 px-3 border cursor-pointer ${
                      cfg.llm_provider === p ? "border-primary bg-light" : ""
                    }`}
                    style={{ borderRadius: "6px" }}
                  >
                    <input
                      type="radio"
                      name="llm_provider"
                      checked={cfg.llm_provider === p}
                      disabled={!isEditing}
                      onChange={() => setField("llm_provider", p)}
                    />
                    <span className="fw-semibold text-capitalize text-dark fs-14">{p}</span>
                  </label>
                ))}
              </div>

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold text-dark fs-13 mb-1">
                    Model ID <span className="text-muted fw-normal">(Pick from suggestions or type any)</span>
                  </label>
                  <input
                    type="text"
                    className="ai-sq-input"
                    list="model-suggestions"
                    value={cfg.llm_model || ""}
                    disabled={!isEditing}
                    onChange={(e) => setField("llm_model", e.target.value)}
                    placeholder="e.g. gpt-4o-mini, gpt-5.6-luna..."
                  />
                  <datalist id="model-suggestions">
                    {availableModels.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold text-dark fs-13 mb-1">
                    Max tokens per reply
                  </label>
                  <input
                    type="number"
                    className="ai-sq-input"
                    min="16"
                    max="32000"
                    value={cfg.max_tokens ?? 1024}
                    disabled={!isEditing}
                    onChange={(e) => setField("max_tokens", e.target.value)}
                  />
                </div>
              </div>

              <p className="text-muted fs-12 mt-3 mb-0">
                A changed provider or model is pinged before it is saved — if it fails, nothing is stored and the reason shows up above.
              </p>
            </div>

            {/* ================= 2. CHAT & BEHAVIOR ================= */}
            <div className="card ai-sq-card p-4">
              <div className="ai-section-title">
                <FaCommentDots style={{ color: "#2563eb" }} />
                <span>2. Chat History, Memory & Safety</span>
              </div>

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold text-dark fs-13 mb-1">
                    Recent messages persona sees per reply (history window)
                  </label>
                  <input
                    type="number"
                    className="ai-sq-input"
                    min="2"
                    max="200"
                    value={cfg.chat_history_limit ?? 45}
                    disabled={!isEditing}
                    onChange={(e) => setField("chat_history_limit", e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold text-dark fs-13 mb-1">
                    Timezone for persona's clock
                  </label>
                  <input
                    type="text"
                    className="ai-sq-input"
                    value={cfg.chat_timezone || "Asia/Kolkata"}
                    disabled={!isEditing}
                    onChange={(e) => setField("chat_timezone", e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold text-dark fs-13 mb-1">
                    Block the conversation at severity
                  </label>
                  <CustomSelect
                    options={(options?.severities || ["low", "medium", "high", "critical"]).map((s) => ({
                      value: s,
                      label: s.toUpperCase(),
                    }))}
                    value={cfg.block_severity || "critical"}
                    disabled={!isEditing}
                    onChange={(val) => setField("block_severity", val)}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold text-dark fs-13 mb-1">
                    Short memory lives (days after its event)
                  </label>
                  <input
                    type="number"
                    className="ai-sq-input"
                    min="1"
                    max="60"
                    value={cfg.short_memory_days ?? 7}
                    disabled={!isEditing}
                    onChange={(e) => setField("short_memory_days", e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold text-dark fs-13 mb-1">
                    Pet name starts at stage
                  </label>
                  <CustomSelect
                    options={stagesList.map((s) => ({
                      value: s,
                      label: s.toUpperCase(),
                    }))}
                    value={cfg.pet_name_from_stage || "flirting"}
                    disabled={!isEditing}
                    onChange={(val) => setField("pet_name_from_stage", val)}
                  />
                </div>
              </div>

              <div className="mt-4 pt-2">
                <div className="form-check mb-2">
                  <input
                    className="form-check-input cursor-pointer"
                    type="checkbox"
                    id="reply_guard_enabled"
                    checked={cfg.reply_guard_enabled ?? true}
                    disabled={!isEditing}
                    onChange={(e) => setField("reply_guard_enabled", e.target.checked)}
                  />
                  <label className="form-check-label fw-semibold text-dark fs-13 cursor-pointer ms-1" htmlFor="reply_guard_enabled">
                    Block replies that try to leave the chat (meetups, phone numbers, external apps)
                  </label>
                </div>

                <div className="form-check mb-3">
                  <input
                    className="form-check-input cursor-pointer"
                    type="checkbox"
                    id="reply_thinking_enabled"
                    checked={cfg.reply_thinking_enabled ?? false}
                    disabled={!isEditing}
                    onChange={(e) => setField("reply_thinking_enabled", e.target.checked)}
                  />
                  <label className="form-check-label fw-semibold text-dark fs-13 cursor-pointer ms-1" htmlFor="reply_thinking_enabled">
                    Work out what he means before answering (reasoning scratchpad)
                  </label>
                </div>

                <div className="text-muted fs-12 d-flex flex-column gap-2 border-top pt-3 mt-2">
                  <p className="mb-0">
                    With Reply Guard on, any reply of hers that proposes meeting, a call, a number or another app is regenerated once, and dropped if it happens again.
                  </p>
                  <p className="mb-0">
                    A "short" memory ("exam on Friday", "ate pizza today") is kept this many days past its date — long enough for her to ask how it went — then deleted. Permanent facts never expire.
                  </p>
                </div>
              </div>
            </div>

            {/* ================= 3. GIFTS ================= */}
            <div className="card ai-sq-card p-4">
              <div className="ai-section-title">
                <FaGift style={{ color: "#db2777" }} />
                <span>3. Virtual Gifts Automation</span>
              </div>
              <p className="text-muted fs-13 mb-3">
                She asks him for a gift from the catalog, in her own words, inside a normal reply.
              </p>

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold text-dark fs-13 mb-1">
                    Gift asks start at stage
                  </label>
                  <CustomSelect
                    options={stagesList.map((s) => ({
                      value: s,
                      label: s.toUpperCase(),
                    }))}
                    value={cfg.gift_from_stage || "flirting"}
                    disabled={!isEditing}
                    onChange={(val) => setField("gift_from_stage", val)}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold text-dark fs-13 mb-1">
                    Asks that stay a hint, naming nothing (%)
                  </label>
                  <input
                    type="number"
                    className="ai-sq-input"
                    min="0"
                    max="100"
                    value={cfg.gift_hint_chance ?? 30}
                    disabled={!isEditing}
                    onChange={(e) => setField("gift_hint_chance", e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold text-dark fs-13 mb-1">
                    Ask again after, at the soonest (days)
                  </label>
                  <input
                    type="number"
                    className="ai-sq-input"
                    min="0"
                    max="60"
                    value={cfg.gift_min_days ?? 3}
                    disabled={!isEditing}
                    onChange={(e) => setField("gift_min_days", e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold text-dark fs-13 mb-1">
                    …and at the latest (days)
                  </label>
                  <input
                    type="number"
                    className="ai-sq-input"
                    min="0"
                    max="60"
                    value={cfg.gift_max_days ?? 4}
                    disabled={!isEditing}
                    onChange={(e) => setField("gift_max_days", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ================= 4. REPLY PACING & DELAYS ================= */}
            <div className="card ai-sq-card p-4">
              <div className="ai-section-title">
                <FaTachometerAlt style={{ color: "#059669" }} />
                <span>4. Reply Pacing & Bubble Delays</span>
              </div>
              <p className="text-muted fs-13 mb-3">
                She answers in one to a few short messages, each with the pause the app waits before showing it.
              </p>

              <div className="form-check mb-3">
                <input
                  className="form-check-input cursor-pointer"
                  type="checkbox"
                  id="typing_delay_enabled"
                  checked={cfg.typing_delay_enabled ?? true}
                  disabled={!isEditing}
                  onChange={(e) => setField("typing_delay_enabled", e.target.checked)}
                />
                <label className="form-check-label fw-semibold text-dark fs-13 cursor-pointer ms-1" htmlFor="typing_delay_enabled">
                  Pace her replies (off = every message appears instantly)
                </label>
              </div>

              <div className="row g-3">
                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label fw-semibold text-dark fs-12 mb-1">
                    Her typing speed (words per minute)
                  </label>
                  <input
                    type="number"
                    className="ai-sq-input"
                    min="5"
                    max="300"
                    value={cfg.typing_wpm ?? 110}
                    disabled={!isEditing}
                    onChange={(e) => setField("typing_wpm", e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label fw-semibold text-dark fs-12 mb-1">
                    Her reading speed (words per minute)
                  </label>
                  <input
                    type="number"
                    className="ai-sq-input"
                    min="20"
                    max="1000"
                    value={cfg.typing_read_wpm ?? 240}
                    disabled={!isEditing}
                    onChange={(e) => setField("typing_read_wpm", e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label fw-semibold text-dark fs-12 mb-1">
                    Thinking pause, shortest (ms)
                  </label>
                  <input
                    type="number"
                    className="ai-sq-input"
                    min="0"
                    max="60000"
                    value={cfg.typing_think_min_ms ?? 400}
                    disabled={!isEditing}
                    onChange={(e) => setField("typing_think_min_ms", e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label fw-semibold text-dark fs-12 mb-1">
                    Thinking pause, longest (ms)
                  </label>
                  <input
                    type="number"
                    className="ai-sq-input"
                    min="0"
                    max="60000"
                    value={cfg.typing_think_max_ms ?? 1200}
                    disabled={!isEditing}
                    onChange={(e) => setField("typing_think_max_ms", e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label fw-semibold text-dark fs-12 mb-1">
                    Gap between bubbles, shortest (ms)
                  </label>
                  <input
                    type="number"
                    className="ai-sq-input"
                    min="0"
                    max="60000"
                    value={cfg.bubble_pause_min_ms ?? 300}
                    disabled={!isEditing}
                    onChange={(e) => setField("bubble_pause_min_ms", e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label fw-semibold text-dark fs-12 mb-1">
                    Gap between bubbles, longest (ms)
                  </label>
                  <input
                    type="number"
                    className="ai-sq-input"
                    min="0"
                    max="60000"
                    value={cfg.bubble_pause_max_ms ?? 900}
                    disabled={!isEditing}
                    onChange={(e) => setField("bubble_pause_max_ms", e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label fw-semibold text-dark fs-12 mb-1">
                    Randomness, lowest (%)
                  </label>
                  <input
                    type="number"
                    className="ai-sq-input"
                    min="1"
                    max="500"
                    value={cfg.typing_jitter_min_pct ?? 80}
                    disabled={!isEditing}
                    onChange={(e) => setField("typing_jitter_min_pct", e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label fw-semibold text-dark fs-12 mb-1">
                    Randomness, highest (%)
                  </label>
                  <input
                    type="number"
                    className="ai-sq-input"
                    min="1"
                    max="500"
                    value={cfg.typing_jitter_max_pct ?? 130}
                    disabled={!isEditing}
                    onChange={(e) => setField("typing_jitter_max_pct", e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label fw-semibold text-dark fs-12 mb-1">
                    Shortest pause before any message (ms)
                  </label>
                  <input
                    type="number"
                    className="ai-sq-input"
                    min="0"
                    max="60000"
                    value={cfg.typing_delay_min_ms ?? 600}
                    disabled={!isEditing}
                    onChange={(e) => setField("typing_delay_min_ms", e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label fw-semibold text-dark fs-12 mb-1">
                    Longest time for a whole reply (ms)
                  </label>
                  <input
                    type="number"
                    className="ai-sq-input"
                    min="100"
                    max="300000"
                    value={cfg.typing_delay_max_total_ms ?? 15000}
                    disabled={!isEditing}
                    onChange={(e) => setField("typing_delay_max_total_ms", e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label fw-semibold text-dark fs-12 mb-1">
                    Most messages in one reply (max 3)
                  </label>
                  <input
                    type="number"
                    className="ai-sq-input"
                    min="1"
                    max={options?.max_bubbles_limit ?? 3}
                    value={cfg.max_bubbles ?? 3}
                    disabled={!isEditing}
                    onChange={(e) => setField("max_bubbles", e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label fw-semibold text-dark fs-12 mb-1">
                    Replies that split into more than one (%)
                  </label>
                  <input
                    type="number"
                    className="ai-sq-input"
                    min="0"
                    max="100"
                    value={cfg.bubble_split_chance ?? 30}
                    disabled={!isEditing}
                    onChange={(e) => setField("bubble_split_chance", e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label fw-semibold text-dark fs-12 mb-1">
                    Wait for next message in burst (ms)
                  </label>
                  <input
                    type="number"
                    className="ai-sq-input"
                    min="0"
                    max="60000"
                    value={cfg.batch_quiet_ms ?? 1200}
                    disabled={!isEditing}
                    onChange={(e) => setField("batch_quiet_ms", e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label fw-semibold text-dark fs-12 mb-1">
                    Most user messages in one burst
                  </label>
                  <input
                    type="number"
                    className="ai-sq-input"
                    min="1"
                    max="50"
                    value={cfg.max_batch_messages ?? 10}
                    disabled={!isEditing}
                    onChange={(e) => setField("max_batch_messages", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ================= 5. STAGE LADDER ================= */}
            <div className="card ai-sq-card p-4">
              <div className="ai-section-title">
                <FaLayerGroup style={{ color: "#7c3aed" }} />
                <span>5. Stage Message Threshold Ladder</span>
              </div>
              <p className="text-muted fs-13 mb-3">
                Total turns needed before a conversation may enter each relationship stage. Must be non-decreasing.
              </p>

              <div className="row g-3">
                {stagesList.map((stage) => (
                  <div className="col-12 col-md-6 col-lg-3" key={stage}>
                    <label className="form-label fw-semibold text-capitalize text-dark fs-13 mb-1">
                      {stage}
                    </label>
                    <input
                      type="number"
                      className="ai-sq-input"
                      min="0"
                      value={cfg?.stage_min_messages?.[stage] ?? 0}
                      disabled={!isEditing}
                      onChange={(e) => setStageThreshold(stage, Number(e.target.value))}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ================= 6. ANALYZER PROMPT ================= */}
            <div className="card ai-sq-card p-4">
              <div className="ai-section-title">
                <FaRobot style={{ color: "#d97706" }} />
                <span>6. Background Memory & Safety Analyzer Prompt</span>
              </div>
              <p className="text-muted fs-13 mb-3">
                What the AI extracts from each incoming message — memory facts, tone, emotion, intent, safety labels, and relationship stage progression.
              </p>

              <textarea
                className="ai-sq-textarea font-monospace fs-12"
                rows={18}
                value={cfg.analyzer_prompt || DEFAULT_SHIPPED_PROMPT}
                disabled={!isEditing}
                onChange={(e) => setField("analyzer_prompt", e.target.value)}
                style={{ lineHeight: "1.5", backgroundColor: isEditing ? "#ffffff" : "#f8fafc" }}
              />

              <div className="d-flex flex-wrap justify-content-between align-items-center mt-3 pt-3 border-top gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary ai-sq-btn"
                  onClick={handleResetPrompt}
                  disabled={!isEditing || resettingPrompt}
                >
                  <FaUndo />
                  <span>{resettingPrompt ? "Resetting…" : "Reset to Shipped Prompt"}</span>
                </button>

                <button
                  type="submit"
                  className="btn text-white ai-sq-btn shadow-sm"
                  disabled={!isEditing || saving}
                  style={{
                    backgroundColor: "#8F6DFF",
                    opacity: !isEditing ? 0.55 : 1,
                    cursor: !isEditing ? "not-allowed" : "pointer",
                  }}
                >
                  <FaSave />
                  <span>{saving ? "Saving…" : "Save Changes"}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </>
  );
};

AiSettings.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default AiSettings;
