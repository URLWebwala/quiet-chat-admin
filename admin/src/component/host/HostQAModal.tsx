import React, { useState } from "react";
import { AiHostPersona, testHostQA } from "@/utils/aiChatApi";
import { toast } from "react-toastify";
import { FaPlay, FaRobot, FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from "react-icons/fa";

interface HostQAModalProps {
  host: AiHostPersona | null;
  onClose: () => void;
}

const PRESET_SCENARIOS = [
  {
    id: "turn1_typo",
    title: "1. First-Time & Typo Handling",
    category: "First-time & Typo",
    userMessage: "dhiya ji apna btao",
    history: [{ role: "assistant", text: "Hey, main Riya hoon! kaisa chal raha hai sab?" }],
    description: "Tests if host avoids echoing typo 'dhiya ji' or hallucinating fake shared history.",
  },
  {
    id: "work_stress",
    title: "2. Work & Everyday Stress",
    category: "Everyday Talk",
    userMessage: "bus office ka kaam chal raha hai non-stop",
    history: [],
    description: "Casual work conversation without assistant-like robotic phrasing.",
  },
  {
    id: "tired_reaction",
    title: "3. User Feeling Tired",
    category: "Empathy & Reaction",
    userMessage: "ha thoda sa thak gaya hu",
    history: [
      { role: "assistant", text: "kya kar rahe ho?" },
      { role: "user", text: "office ka kaam" },
    ],
    description: "Reaction-first empathy without repetitive caffeine questions or cliché sympathy.",
  },
  {
    id: "compliment_tease",
    title: "4. Compliments & Flirting",
    category: "Flirting & Persona Vibe",
    userMessage: "tum pasand ho mujhe",
    history: [],
    description: "Playful reaction matching host flavor; no excessive 'aww' loops.",
  },
  {
    id: "turn1_clarification",
    title: "5. Turn 1 Reality Check",
    category: "First Conversation",
    userMessage: "mai toh phli bar baat kr rha tumse",
    history: [{ role: "assistant", text: "kya tumhe meri purani baatein yaad hai?" }],
    description: "User clarifies it is first chat; host smoothly adapts without fake memories.",
  },
  {
    id: "short_reply",
    title: "6. Short One-Word Reply",
    category: "Short Replies",
    userMessage: "achha",
    history: [{ role: "assistant", text: "aaj mausam bada mast ho raha hai yahan." }],
    description: "Host handles short replies naturally without interrogating.",
  },
  {
    id: "hinglish_mistake",
    title: "7. Hinglish Slang & Shortcuts",
    category: "Hinglish Slang",
    userMessage: "kch ni yrr btao ap kse ho",
    history: [],
    description: "Understands Hinglish typing abbreviations like 'kch ni yrr' smoothly.",
  },
  {
    id: "topic_change",
    title: "8. Topic Shift",
    category: "Topic Continuity",
    userMessage: "waise aaj bahar barish ho rahi hai",
    history: [
      { role: "assistant", text: "kaam khatam hua?" },
      { role: "user", text: "haan done" },
    ],
    description: "Seamlessly shifts to the new topic without forcing the old one.",
  },
  {
    id: "late_night",
    title: "9. Late Night & Loneliness",
    category: "Late Night Warmth",
    userMessage: "neend nahi aa rahi... tum soyi nahi?",
    history: [],
    description: "Soft, engaging late night vibe matching host persona.",
  },
  {
    id: "meetup_boundary",
    title: "10. Real Life Boundary Check",
    category: "Boundaries",
    userMessage: "kya hum kal mil sakte hain coffee pe?",
    history: [],
    description: "Maintains natural playful boundary without breaking character.",
  },
];

export const HostQAModal: React.FC<HostQAModalProps> = ({ host, onClose }) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("turn1_typo");
  const [customMessage, setCustomMessage] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

  if (!host) return null;

  const activeScenario = PRESET_SCENARIOS.find((s) => s.id === selectedScenarioId) || PRESET_SCENARIOS[0];

  const handleRunQA = async () => {
    setTesting(true);
    setResult(null);
    try {
      const payload = isCustom
        ? { message: customMessage.trim(), history: [], scenario_id: "custom" }
        : {
            message: activeScenario.userMessage,
            history: activeScenario.history,
            scenario_id: activeScenario.id,
          };

      const res = await testHostQA(host.id, payload);
      setResult(res);
      toast.success("Benchmark completed!");
    } catch (err: any) {
      toast.error(err?.message || "QA test failed to run on AI server.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1060 }}
      tabIndex={-1}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
          {/* Header */}
          <div className="modal-header bg-dark text-white p-3 px-4 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <FaRobot className="text-warning fs-4" />
              <div>
                <h5 className="modal-title fw-bold mb-0">Host QA Benchmark Test</h5>
                <small className="text-secondary">
                  Testing Persona: <span className="text-white fw-semibold">{host.name}</span> ({host.flavor})
                </small>
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4" style={{ maxHeight: "75vh", overflowY: "auto" }}>
            {/* Scenario Picker */}
            <div className="mb-3">
              <label className="form-label fw-bold small text-muted text-uppercase mb-2">
                Select Benchmark Scenario:
              </label>
              <div className="d-flex gap-2 flex-wrap mb-2">
                {PRESET_SCENARIOS.map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => {
                      setIsCustom(false);
                      setSelectedScenarioId(sc.id);
                      setResult(null);
                    }}
                    className={`btn btn-sm rounded-pill px-3 py-1 ${
                      !isCustom && selectedScenarioId === sc.id
                        ? "btn-primary shadow-sm"
                        : "btn-outline-secondary"
                    }`}
                  >
                    {sc.title}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setIsCustom(true);
                    setResult(null);
                  }}
                  className={`btn btn-sm rounded-pill px-3 py-1 ${
                    isCustom ? "btn-primary shadow-sm" : "btn-outline-secondary"
                  }`}
                >
                  Custom Message...
                </button>
              </div>
            </div>

            {/* Scenario details */}
            {!isCustom ? (
              <div className="p-3 rounded-3 bg-light border mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="badge bg-secondary">{activeScenario.category}</span>
                  <small className="text-muted">ID: {activeScenario.id}</small>
                </div>
                <p className="small text-muted mb-2">{activeScenario.description}</p>
                <div className="p-2 rounded bg-white border font-monospace small">
                  <strong>Simulated User:</strong> "{activeScenario.userMessage}"
                </div>
              </div>
            ) : (
              <div className="mb-3">
                <label className="form-label fw-semibold small">Enter custom user message:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. kch ni yrr btao ap kse ho"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                />
              </div>
            )}

            {/* Run Button */}
            <div className="d-flex justify-content-end mb-4">
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 rounded-3 shadow-sm"
                onClick={handleRunQA}
                disabled={testing || (isCustom && !customMessage.trim())}
              >
                {testing ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Evaluating {host.name}...
                  </>
                ) : (
                  <>
                    <FaPlay className="small" /> Run Benchmark Test
                  </>
                )}
              </button>
            </div>

            {/* Results Section */}
            {result && (
              <div className="border rounded-4 p-3 bg-white shadow-sm">
                <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                  <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                    {result.passed ? (
                      <FaCheckCircle className="text-success fs-5" />
                    ) : (
                      <FaExclamationTriangle className="text-warning fs-5" />
                    )}
                    <span>
                      Result:{" "}
                      <span className={result.passed ? "text-success" : "text-warning"}>
                        {result.passed ? "PASSED" : "REVIEW RECOMMENDED"}
                      </span>
                    </span>
                  </h6>
                  {result.score !== undefined && (
                    <span className="badge bg-dark fs-6 px-3 py-1">
                      Score: {result.score}/100 {result.grade ? `(${result.grade})` : ""}
                    </span>
                  )}
                </div>

                {/* Reply Bubble */}
                <div className="mb-3">
                  <label className="small text-muted fw-bold d-block mb-1">
                    {host.name}'s Generated Reply:
                  </label>
                  <div className="p-3 rounded-4 bg-light text-dark border font-monospace fs-6">
                    "{result.reply || result.response || "No reply generated"}"
                  </div>
                </div>

                {/* Audit breakdown */}
                {result.checks && (
                  <div className="row g-2">
                    {Object.entries(result.checks).map(([checkKey, checkVal]: [string, any]) => (
                      <div className="col-6 col-md-4" key={checkKey}>
                        <div className="p-2 border rounded-3 bg-light small d-flex justify-content-between align-items-center">
                          <span className="text-capitalize">{checkKey.replace(/_/g, " ")}:</span>
                          <span
                            className={`badge ${
                              checkVal === true
                                ? "bg-success"
                                : checkVal === false
                                ? "bg-danger"
                                : "bg-secondary"
                            }`}
                          >
                            {String(checkVal)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer bg-light p-3">
            <button type="button" className="btn btn-secondary px-4 rounded-3" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostQAModal;
