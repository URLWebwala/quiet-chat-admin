import React, { useEffect, useState } from "react";
import RootLayout from "@/component/layout/Layout";
import Title from "@/extra/Title";
import {
  fetchAiSettings,
  fetchAiSettingsOptions,
  updateAiSettings,
  resetAnalyzerPrompt,
} from "@/utils/aiChatApi";

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
      openai: ["gpt-4o-mini", "gpt-4o"],
      anthropic: ["claude-3-5-sonnet-20241022"],
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
        // Fallback default configuration matching python backend runtime_settings
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
          text: "Saved. It applies to the very next message.",
        });
      } else {
        setMessage({
          type: "success",
          text: "Settings saved locally. Connect Python AI backend for live service sync.",
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Title name="Settings" />
        <div className="d-flex align-items-center gap-2">
          {!isEditing ? (
            <button
              type="button"
              className="btn btn-outline-primary px-4 py-2 rounded-3 fw-semibold d-flex align-items-center gap-2 shadow-sm"
              onClick={() => setIsEditing(true)}
              style={{ borderColor: "#8F6DFF", color: "#8F6DFF" }}
            >
              <i className="ri-edit-line fs-16"></i>
              Edit
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-outline-secondary px-3 py-2 rounded-3 fw-semibold d-flex align-items-center gap-1 shadow-sm"
              onClick={() => setIsEditing(false)}
            >
              <i className="ri-close-line fs-16"></i>
              Cancel
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary px-4 py-2 rounded-3 fw-semibold d-flex align-items-center gap-2 shadow-sm"
            onClick={() => handleSave()}
            disabled={!isEditing || saving || loading}
            style={{
              backgroundColor: "#8F6DFF",
              borderColor: "#8F6DFF",
              opacity: !isEditing ? 0.55 : 1,
              cursor: !isEditing ? "not-allowed" : "pointer",
            }}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-1"></span>
                Saving…
              </>
            ) : (
              <>
                <i className="ri-save-line fs-16"></i>
                Save
              </>
            )}
          </button>
        </div>
      </div>


      {message && (
        <div
          className={`alert alert-${
            message.type === "success" ? "success" : "danger"
          } alert-dismissible fade show rounded-3 mb-4`}
          role="alert"
        >
          <i
            className={`ri-${
              message.type === "success" ? "checkbox-circle" : "error-warning"
            }-line me-2 fs-16`}
          ></i>
          {message.text}
          <button
            type="button"
            className="btn-close"
            onClick={() => setMessage(null)}
          ></button>
        </div>
      )}

      {loading || !cfg ? (
        <div className="text-center py-5 text-muted bg-white rounded-4 shadow-sm border">
          <div className="spinner-border text-primary mb-3"></div>
          <p className="mb-0 fs-14">Loading Settings…</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="d-flex flex-column gap-4 mb-5">

          {/* ================= 1. MODEL ================= */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h4 className="fw-bold text-dark mb-3">Model</h4>
            
            <div className="d-flex gap-4 mb-3">
              {(options?.providers || ["openai", "anthropic"]).map((p) => (
                <div className="form-check" key={p}>
                  <input
                    className="form-check-input cursor-pointer"
                    type="radio"
                    name="llm_provider"
                    id={`provider-${p}`}
                    checked={cfg.llm_provider === p}
                    disabled={!isEditing}
                    onChange={() => setField("llm_provider", p)}
                  />
                  <label
                    className="form-check-label fw-semibold text-capitalize fs-14 cursor-pointer ms-1"
                    htmlFor={`provider-${p}`}
                  >
                    {p}
                  </label>
                </div>
              ))}
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold text-dark fs-13 mb-1">
                  Model id (pick one or type any)
                </label>
                <input
                  type="text"
                  className="form-control bg-light border fs-13"
                  list="model-suggestions"
                  value={cfg.llm_model || ""}
                  disabled={!isEditing}
                  onChange={(e) => setField("llm_model", e.target.value)}
                  placeholder="e.g. gpt-4o-mini"
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
                  className="form-control bg-light border fs-13"
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

          {/* ================= 2. CHAT ================= */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h4 className="fw-bold text-dark mb-3">Chat</h4>

            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold text-dark fs-13 mb-1">
                  Recent messages she sees per reply
                </label>
                <input
                  type="number"
                  className="form-control bg-light border fs-13"
                  min="2"
                  max="200"
                  value={cfg.chat_history_limit ?? 45}
                  disabled={!isEditing}
                  onChange={(e) => setField("chat_history_limit", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold text-dark fs-13 mb-1">
                  Timezone for her clock
                </label>
                <input
                  type="text"
                  className="form-control bg-light border fs-13"
                  value={cfg.chat_timezone || "Asia/Kolkata"}
                  disabled={!isEditing}
                  onChange={(e) => setField("chat_timezone", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold text-dark fs-13 mb-1">
                  Block the conversation at severity
                </label>
                <select
                  className="form-select bg-light border fs-13 text-capitalize"
                  value={cfg.block_severity || "critical"}
                  disabled={!isEditing}
                  onChange={(e) => setField("block_severity", e.target.value)}
                >
                  {(options?.severities || ["low", "medium", "high", "critical"]).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold text-dark fs-13 mb-1">
                  Short memory lives (days after its event)
                </label>
                <input
                  type="number"
                  className="form-control bg-light border fs-13"
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
                <select
                  className="form-select bg-light border fs-13 text-capitalize"
                  value={cfg.pet_name_from_stage || "flirting"}
                  disabled={!isEditing}
                  onChange={(e) => setField("pet_name_from_stage", e.target.value)}
                >
                  {stagesList.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
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
                  Block replies that try to leave the chat
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
                  Work out what he means before answering (experimental)
                </label>
              </div>


              <div className="text-muted fs-12 d-flex flex-column gap-2 border-top pt-3 mt-2">
                <p className="mb-0">
                  She reasons about his message in a hidden scratchpad before writing. Built for a Gujarati chat where she answered “lol samjhu chu” (“lol I understand”) to “I don’t understand you” — but measured over 12 tries it did slightly <em>worse</em> than leaving it off, and it costs output tokens. If replies read as fluent nonsense, change the model above first: that took the same chat from word salad to clean. Leave this off unless your own A/B says otherwise.
                </p>
                <p className="mb-0">
                  With that on, any reply of hers that proposes meeting, a call, a number or another app is regenerated once, and dropped if it happens again. Leave it on — the prompt already forbids it, but this is the part that cannot be talked out of it. A catch shows up as <code>last_guard_hit</code> on the conversation.
                </p>
                <p className="mb-0">
                  She picks her own pet name for him once the relationship reaches that stage — never on day one — and then keeps it. Clear a bad one from the Inspector and she picks another.
                </p>
                <p className="mb-0">
                  A "short" memory ("exam on Friday", "ate pizza today") is kept this many days past its date — long enough for her to ask how it went — then deleted. Permanent facts never expire.
                </p>
                <p className="mb-0">
                  The history window counts <em>messages</em>, not exchanges, and she now answers in one to three messages per turn — so 45 covers about as many exchanges as 30 used to.
                </p>
              </div>
            </div>
          </div>

          {/* ================= 3. GIFTS ================= */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h4 className="fw-bold text-dark mb-1">Gifts</h4>
            <p className="text-muted fs-13 mb-3">
              She asks him for a gift from the catalog, in her own words, inside a normal reply. The catalog itself is on the Gifts page.
            </p>

            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold text-dark fs-13 mb-1">
                  Gift asks start at stage
                </label>
                <select
                  className="form-select bg-light border fs-13 text-capitalize"
                  value={cfg.gift_from_stage || "flirting"}
                  disabled={!isEditing}
                  onChange={(e) => setField("gift_from_stage", e.target.value)}
                >
                  {stagesList.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold text-dark fs-13 mb-1">
                  Asks that stay a hint, naming nothing (%)
                </label>
                <input
                  type="number"
                  className="form-control bg-light border fs-13"
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
                  className="form-control bg-light border fs-13"
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
                  className="form-control bg-light border fs-13"
                  min="0"
                  max="60"
                  value={cfg.gift_max_days ?? 4}
                  disabled={!isEditing}
                  onChange={(e) => setField("gift_max_days", e.target.value)}
                />
              </div>
            </div>

            <div className="text-muted fs-12 d-flex flex-column gap-2 border-top pt-3 mt-4">
              <p className="mb-0">
                The gap is drawn fresh each time inside that window, so the asks never fall into a rhythm he can predict. An ask he ignores is dropped — she waits out the whole window again rather than pushing. Set both to 0 and the stage to <code>discovery</code> to demo it without waiting days.
              </p>
              <p className="mb-0">
                Which gift she asks for is picked here, not by the model: the cheapest one first, then always above the priciest he has already given. A hint names nothing at all, so the app has no button to show — that share is deliberate, it keeps her from sounding like a shop.
              </p>
            </div>
          </div>

          {/* ================= 4. REPLY PACING ================= */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h4 className="fw-bold text-dark mb-1">Reply pacing</h4>
            <p className="text-muted fs-13 mb-3">
              She answers in one to a few short messages, each with the pause the app waits before showing it. The server never sleeps — the chat screen plays the timing out.
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
                  className="form-control bg-light border fs-13"
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
                  className="form-control bg-light border fs-13"
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
                  className="form-control bg-light border fs-13"
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
                  className="form-control bg-light border fs-13"
                  min="0"
                  max="60000"
                  value={cfg.typing_think_max_ms ?? 1200}
                  disabled={!isEditing}
                  onChange={(e) => setField("typing_think_max_ms", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-6 col-lg-4">
                <label className="form-label fw-semibold text-dark fs-12 mb-1">
                  Gap between her own messages, shortest (ms)
                </label>
                <input
                  type="number"
                  className="form-control bg-light border fs-13"
                  min="0"
                  max="60000"
                  value={cfg.bubble_pause_min_ms ?? 300}
                  disabled={!isEditing}
                  onChange={(e) => setField("bubble_pause_min_ms", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-6 col-lg-4">
                <label className="form-label fw-semibold text-dark fs-12 mb-1">
                  Gap between her own messages, longest (ms)
                </label>
                <input
                  type="number"
                  className="form-control bg-light border fs-13"
                  min="0"
                  max="60000"
                  value={cfg.bubble_pause_max_ms ?? 900}
                  disabled={!isEditing}
                  onChange={(e) => setField("bubble_pause_max_ms", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-6 col-lg-4">
                <label className="form-label fw-semibold text-dark fs-12 mb-1">
                  Randomness, lowest (% of the computed time)
                </label>
                <input
                  type="number"
                  className="form-control bg-light border fs-13"
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
                  className="form-control bg-light border fs-13"
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
                  className="form-control bg-light border fs-13"
                  min="0"
                  max="60000"
                  value={cfg.typing_delay_min_ms ?? 600}
                  disabled={!isEditing}
                  onChange={(e) => setField("typing_delay_min_ms", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-6 col-lg-4">
                <label className="form-label fw-semibold text-dark fs-12 mb-1">
                  Longest she may take for a whole reply (ms)
                </label>
                <input
                  type="number"
                  className="form-control bg-light border fs-13"
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
                  className="form-control bg-light border fs-13"
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
                  className="form-control bg-light border fs-13"
                  min="0"
                  max="100"
                  value={cfg.bubble_split_chance ?? 30}
                  disabled={!isEditing}
                  onChange={(e) => setField("bubble_split_chance", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-6 col-lg-4">
                <label className="form-label fw-semibold text-dark fs-12 mb-1">
                  Wait for his next message (ms)
                </label>
                <input
                  type="number"
                  className="form-control bg-light border fs-13"
                  min="0"
                  max="60000"
                  value={cfg.batch_quiet_ms ?? 1200}
                  disabled={!isEditing}
                  onChange={(e) => setField("batch_quiet_ms", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-6 col-lg-4">
                <label className="form-label fw-semibold text-dark fs-12 mb-1">
                  Most of his messages in one reply
                </label>
                <input
                  type="number"
                  className="form-control bg-light border fs-13"
                  min="1"
                  max="50"
                  value={cfg.max_batch_messages ?? 10}
                  disabled={!isEditing}
                  onChange={(e) => setField("max_batch_messages", e.target.value)}
                />
              </div>
            </div>

            <div className="text-muted fs-12 d-flex flex-column gap-2 border-top pt-3 mt-4">
              <p className="mb-0">
                He can send two or three messages in a row without waiting, and they get one reply between them. The wait is how long a message pauses to see whether another is coming — it is subtracted from her first pause, so it costs nothing in felt latency. 0 answers straight away and only catches messages that land while she is already writing.
              </p>
              <p className="mb-0">
                She splits her reply across two messages on almost every turn if left alone, which reads as a tic rather than as a person — so only this share of replies is allowed to arrive in pieces, and the rest are joined back into one. 0 means always a single message.
              </p>
              <p className="mb-0">
                240 wpm reading is adult silent reading, measured. The typing speed is not the human number: real thumb typing is 36–38 wpm, and at that speed a 19-word reply took 32 seconds here. 110 keeps a long answer slower than a short one without the wait. The whole reply is capped at 15s, which is the longest anyone ever waits.
              </p>
            </div>
          </div>

          {/* ================= 5. STAGE LADDER ================= */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h4 className="fw-bold text-dark mb-1">Stage ladder</h4>
            <p className="text-muted fs-13 mb-3">
              Total messages (both sides) needed before a conversation may enter each stage. It must never go backwards.
            </p>

            <div className="row g-3">
              {stagesList.map((stage) => (
                <div className="col-12 col-md-6 col-lg-3" key={stage}>
                  <label className="form-label fw-semibold text-capitalize text-dark fs-13 mb-1">
                    {stage}
                  </label>
                  <input
                    type="number"
                    className="form-control bg-light border fs-13"
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
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h4 className="fw-bold text-dark mb-1">Analyzer prompt</h4>
            <p className="text-muted fs-13 mb-3">
              What she is asked to extract from each of his messages — facts, tone, safety, whether the stage may advance. Breaking it does not break the chat: analysis failures are swallowed.
            </p>

            <textarea
              className="form-control bg-light border fs-12 font-monospace"
              rows={22}
              value={cfg.analyzer_prompt || DEFAULT_SHIPPED_PROMPT}
              disabled={!isEditing}
              onChange={(e) => setField("analyzer_prompt", e.target.value)}
              style={{ fontFamily: "monospace", lineHeight: "1.5" }}
            ></textarea>

            <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1.5 fs-12 fw-semibold"
                onClick={handleResetPrompt}
                disabled={!isEditing || resettingPrompt}
              >
                {resettingPrompt ? "Resetting…" : "Reset to shipped prompt"}
              </button>

              <button
                type="submit"
                className="btn btn-primary px-4 py-2 rounded-3 fw-semibold shadow-sm"
                disabled={!isEditing || saving}
                style={{
                  backgroundColor: "#8F6DFF",
                  borderColor: "#8F6DFF",
                  opacity: !isEditing ? 0.55 : 1,
                  cursor: !isEditing ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>


        </form>
      )}
    </>
  );
};

AiSettings.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default AiSettings;
