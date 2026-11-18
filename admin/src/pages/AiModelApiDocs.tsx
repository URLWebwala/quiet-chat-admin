import React, { useEffect, useState, useMemo } from "react";
import RootLayout from "@/component/layout/Layout";
import Title from "@/extra/Title";
import { toast } from "react-toastify";
import {
  AiHostPersona,
  fetchAiHosts,
} from "@/utils/aiChatApi";
import axios from "axios";
import Image from "next/image";
import femaleAvatar from "@/assets/images/female.png";
import maleAvatar from "@/assets/images/male.png";
import { baseURL } from "@/utils/config";
import {
  FaRobot,
  FaCopy,
  FaCheck,
  FaPaperPlane,
  FaCode,
  FaTerminal,
  FaHistory,
  FaRedo,
  FaUserCheck,
  FaCoins,
  FaExternalLinkAlt,
  FaMobileAlt,
} from "react-icons/fa";

const FLAVOR_COLORS: { [key: string]: { bg: string; text: string; border: string } } = {
  "Sweet & Romantic": { bg: "#fdf2f8", text: "#db2777", border: "#fbcfe8" },
  "Playful & Teasing": { bg: "#faf5ff", text: "#9333ea", border: "#e9d5ff" },
  "Bold & Sassy": { bg: "#fff7ed", text: "#ea580c", border: "#fed7aa" },
  "Cute & Bubbly": { bg: "#fefce8", text: "#ca8a04", border: "#fef08a" },
  "Charming & Elegant": { bg: "#f0f9ff", text: "#0284c7", border: "#bae6fd" },
  "Witty & Sarcastic": { bg: "#f5f3ff", text: "#6d28d9", border: "#ddd6fe" },
  "Caring & Supportive": { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  "Mysterious & Sultry": { bg: "#f8fafc", text: "#334155", border: "#cbd5e1" },
};

const getFlavorStyle = (flavor?: string) => {
  if (!flavor) return { bg: "#f3f4f6", text: "#374151", border: "#e5e7eb" };
  return FLAVOR_COLORS[flavor] || { bg: "#f3f4f6", text: "#374151", border: "#e5e7eb" };
};

// Code snippet box component with copy button
const CodeSnippet = ({
  code,
  language = "bash",
  title,
}: {
  code: string;
  language?: string;
  title?: string;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Snippet copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-3 border overflow-hidden my-2" style={{ backgroundColor: "#0f172a" }}>
      <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom border-secondary bg-dark text-white">
        <span className="small fw-semibold text-secondary font-monospace">
          {title || language.toUpperCase()}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="btn btn-sm btn-outline-light d-flex align-items-center gap-1 py-1 px-2"
          style={{ fontSize: "11px" }}
        >
          {copied ? (
            <>
              <FaCheck className="text-success" /> Copied
            </>
          ) : (
            <>
              <FaCopy /> Copy
            </>
          )}
        </button>
      </div>
      <pre
        className="p-3 text-light font-monospace small mb-0"
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          maxHeight: "340px",
          overflowY: "auto",
          fontSize: "12px",
          lineHeight: "1.5",
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
};

const AiModelApiDocs = () => {
  const [models, setModels] = useState<AiHostPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<AiHostPersona | null>(null);

  // Active code snippet tabs: "curl" | "flutter" | "js"
  const [activeTabChat, setActiveTabChat] = useState<"curl" | "flutter" | "js">("flutter");
  const [activeTabHist, setActiveTabHist] = useState<"curl" | "flutter" | "js">("flutter");
  const [activeTabReset, setActiveTabReset] = useState<"curl" | "flutter" | "js">("flutter");
  const [activeTabDetail, setActiveTabDetail] = useState<"curl" | "flutter" | "js">("flutter");

  // Live Console State for test message
  const [testUserId, setTestUserId] = useState("user_dev_101");
  const [testUserName, setTestUserName] = useState("Rahul");
  const [testMessage, setTestMessage] = useState("Hi! Aap kaisi ho?");
  const [testing, setTesting] = useState(false);
  const [liveResponse, setLiveResponse] = useState<any>(null);

  // Load models dynamically from live server
  useEffect(() => {
    setLoading(true);
    fetchAiHosts()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setModels(list);
        if (list.length > 0) {
          setSelectedModel(list[0]);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch models for API docs:", err);
        toast.error("Failed to load AI Models");
      })
      .finally(() => setLoading(false));
  }, []);

  const currentSlug = selectedModel?.slug || (selectedModel?.name ? selectedModel.name.toLowerCase() : "aisha-sweet");
  const currentModelId = selectedModel?.id || selectedModel?._id || "6af7f908ed36e58e3830f6b0";
  const modelName = selectedModel?.name || "Model";
  const apiBase = "https://adminai.quietchat.in/api";

  // Dynamic code snippets for chat
  const curlChat = useMemo(() => {
    return `curl -X POST "${apiBase}/hosts/${currentSlug}/chat" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "${testMessage || "Hello"}",
    "external_user_id": "${testUserId}",
    "user_name": "${testUserName}",
    "user_gender": "male"
  }'`;
  }, [currentSlug, testMessage, testUserId, testUserName]);

  const flutterChat = useMemo(() => {
    return `import 'dart:convert';
import 'package:http/http.dart' as http;

Future<String?> sendAiModelMessage({
  required String userMessage,
  required String userId,
  required String userName,
}) async {
  final url = Uri.parse('${apiBase}/hosts/${currentSlug}/chat');
  
  final response = await http.post(
    url,
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'message': userMessage,
      'external_user_id': userId,
      'user_name': userName,
      'user_gender': 'male',
    }),
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    // Returns persona reply string
    return data['reply'];
  } else {
    print('AI Error: \${response.statusCode} - \${response.body}');
    return null;
  }
}`;
  }, [currentSlug]);

  const jsChat = useMemo(() => {
    return `import axios from 'axios';

async function sendAiMessage(message, userId, userName) {
  try {
    const res = await axios.post('${apiBase}/hosts/${currentSlug}/chat', {
      message: message,
      external_user_id: userId,
      user_name: userName,
      user_gender: 'male'
    });
    console.log('${modelName} reply:', res.data.reply);
    return res.data;
  } catch (err) {
    console.error('API Error:', err.response?.data || err.message);
  }
}`;
  }, [currentSlug, modelName]);

  // Code snippets for History
  const curlHistory = useMemo(() => {
    return `curl -X GET "${apiBase}/hosts/${currentSlug}/history?external_user_id=${testUserId}"`;
  }, [currentSlug, testUserId]);

  const flutterHistory = useMemo(() => {
    return `import 'dart:convert';
import 'package:http/http.dart' as http;

Future<List<dynamic>?> getAiModelHistory(String userId) async {
  final url = Uri.parse('${apiBase}/hosts/${currentSlug}/history?external_user_id=\$userId');
  final res = await http.get(url);
  if (res.statusCode == 200) {
    final data = jsonDecode(res.body);
    return data['messages']; // Array of {id, role, text, created_at}
  }
  return null;
}`;
  }, [currentSlug]);

  const jsHistory = useMemo(() => {
    return `const res = await axios.get('${apiBase}/hosts/${currentSlug}/history', {
  params: { external_user_id: '${testUserId}' }
});
console.log('Messages:', res.data.messages);`;
  }, [currentSlug, testUserId]);

  // Code snippets for Reset
  const curlReset = useMemo(() => {
    return `curl -X POST "${apiBase}/hosts/${currentSlug}/reset" \\
  -H "Content-Type: application/json" \\
  -d '{"external_user_id": "${testUserId}"}'`;
  }, [currentSlug, testUserId]);

  const flutterReset = useMemo(() => {
    return `await http.post(
  Uri.parse('${apiBase}/hosts/${currentSlug}/reset'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({'external_user_id': userId}),
);`;
  }, [currentSlug]);

  // Code snippet for Profile Details
  const curlDetails = useMemo(() => {
    return `curl -X GET "${apiBase}/hosts/${currentSlug}"`;
  }, [currentSlug]);

  const flutterDetails = useMemo(() => {
    return `final res = await http.get(Uri.parse('${apiBase}/hosts/${currentSlug}'));
final profile = jsonDecode(res.body);`;
  }, [currentSlug]);

  // Execute live API test
  const handleTestChat = async () => {
    if (!testMessage.trim()) {
      toast.warning("Please type a test message.");
      return;
    }
    setTesting(true);
    setLiveResponse(null);
    try {
      const res = await axios.post(`${apiBase}/hosts/${currentSlug}/chat`, {
        message: testMessage.trim(),
        external_user_id: testUserId.trim() || "dev_user",
        user_name: testUserName.trim() || "User",
        user_gender: "male",
      });
      setLiveResponse(res.data);
      toast.success(`${modelName} replied successfully!`);
    } catch (err: any) {
      const errData = err.response?.data || err.message;
      setLiveResponse({ error: true, details: errData });
      toast.error("Failed to call API.");
    } finally {
      setTesting(false);
    }
  };

  const flavorStyle = getFlavorStyle(selectedModel?.flavor);

  const rawAvatar =
    selectedModel?.image ||
    selectedModel?.avatar_url ||
    (selectedModel?.gender === "male" ? maleAvatar : femaleAvatar);
  const avatarSrc =
    typeof rawAvatar === "object" && (rawAvatar as any)?.src
      ? (rawAvatar as any).src
      : rawAvatar;
  const resolvedAvatar =
    typeof avatarSrc === "string" &&
    (avatarSrc.startsWith("http") || avatarSrc.startsWith("/"))
      ? avatarSrc
      : typeof avatarSrc === "string" && avatarSrc
      ? `${baseURL}${avatarSrc}`
      : "/assets/images/female.png";

  return (
    <div className="p-3">
      {/* Title */}
      <Title name="AI Model API Documentation" />

      {/* Intro Header Banner */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white mt-3">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h4 className="fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
              <FaCode className="text-primary" /> AI Model Live REST API Reference
            </h4>
            <p className="text-muted small mb-0">
              Direct REST endpoints for Flutter App and Web frontend integration. Every AI Model has a dedicated persona endpoint, live chat memory, and automatic response generator.
            </p>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill font-monospace small">
              API Base: {apiBase}
            </span>
            <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill font-monospace small">
              ● {models.length} Models Loaded
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted small">Loading AI Model profiles...</p>
        </div>
      ) : (
        <div className="row g-4">
          {/* LEFT: MODEL SELECTOR LIST */}
          <div className="col-12 col-lg-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white sticky-top" style={{ top: "80px" }}>
              <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <FaRobot className="text-primary" /> Select AI Model
              </h6>
              <div className="d-flex flex-column gap-2" style={{ maxHeight: "400px", overflowY: "auto" }}>
                {models.map((m) => {
                  const isSelected = (selectedModel?.id || selectedModel?._id) === (m.id || m._id);
                  const mFlavor = getFlavorStyle(m.flavor);
                  return (
                    <button
                      key={m.id || m._id}
                      type="button"
                      onClick={() => {
                        setSelectedModel(m);
                        setLiveResponse(null);
                      }}
                      className={`btn text-start p-2 rounded-3 border transition-all ${
                        isSelected
                          ? "btn-primary text-white shadow-sm"
                          : "btn-light text-dark bg-white"
                      }`}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <strong className="small">{m.name} {m.surname || ""}</strong>
                        <span
                          className="badge px-2 py-0 rounded-pill small"
                          style={
                            isSelected
                              ? { backgroundColor: "rgba(255,255,255,0.25)", color: "#fff" }
                              : { backgroundColor: mFlavor.bg, color: mFlavor.text }
                          }
                        >
                          {m.flavor || "Sweet"}
                        </span>
                      </div>
                      <div className={`font-monospace small ${isSelected ? "text-white-50" : "text-muted"}`} style={{ fontSize: "11px" }}>
                        /{m.slug || m.name.toLowerCase()}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Model Profile Card */}
              {selectedModel && (
                <div className="mt-4 pt-3 border-top">
                  <div className="text-center mb-2">
                    <div
                      className="position-relative rounded-circle overflow-hidden mx-auto mb-2 border shadow-sm"
                      style={{ width: "64px", height: "64px" }}
                    >
                      <Image
                        src={resolvedAvatar}
                        alt={selectedModel.name}
                        fill
                        style={{ objectFit: "cover" }}
                        unoptimized
                      />
                    </div>
                    <h6 className="fw-bold mb-0 text-dark">
                      {selectedModel.name} {selectedModel.surname || ""}
                    </h6>
                    <small className="text-muted d-block">
                      {selectedModel.age ? `${selectedModel.age}y` : ""} · {selectedModel.home_place || "Model"}
                    </small>
                    <span
                      className="badge px-2 py-1 mt-1 rounded-pill small border"
                      style={{
                        backgroundColor: flavorStyle.bg,
                        color: flavorStyle.text,
                        borderColor: flavorStyle.border,
                      }}
                    >
                      {selectedModel.flavor}
                    </span>
                  </div>

                  <div className="bg-light p-2 rounded-3 small">
                    <div className="d-flex justify-content-between py-1 border-bottom">
                      <span className="text-muted">Slug:</span>
                      <strong className="font-monospace text-primary">{currentSlug}</strong>
                    </div>
                    <div className="d-flex justify-content-between py-1 border-bottom">
                      <span className="text-muted">Model ID:</span>
                      <small className="font-monospace text-dark text-truncate" style={{ maxWidth: "120px" }}>
                        {currentModelId}
                      </small>
                    </div>
                    <div className="d-flex justify-content-between py-1">
                      <span className="text-muted">Rate:</span>
                      <strong>{selectedModel.chatRate || 5} coins/msg</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: DYNAMIC API DOCUMENTATION */}
          <div className="col-12 col-lg-9">
            {/* ENDPOINT 1: SEND MESSAGE */}
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-success px-3 py-2 fw-bold font-monospace">POST</span>
                  <h5 className="fw-bold mb-0 text-dark font-monospace" style={{ fontSize: "16px" }}>
                    /api/hosts/{currentSlug}/chat
                  </h5>
                </div>
                <span className="badge bg-light text-dark border">
                  Direct Chat with {modelName}
                </span>
              </div>
              <p className="text-muted small mb-3">
                Sends a user message directly to <strong>{modelName}</strong>. The AI persona generates a realistic, emotionally resonant response using {modelName}&apos;s specific flavor (<em>{selectedModel?.flavor}</em>), memory context, and speaking style.
              </p>

              {/* Language Tabs */}
              <div className="d-flex align-items-center gap-2 mb-2">
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-1 ${activeTabChat === "flutter" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => setActiveTabChat("flutter")}
                >
                  <FaMobileAlt className="me-1" /> Flutter / Dart
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-1 ${activeTabChat === "curl" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => setActiveTabChat("curl")}
                >
                  <FaTerminal className="me-1" /> cURL
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-1 ${activeTabChat === "js" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => setActiveTabChat("js")}
                >
                  <FaCode className="me-1" /> JavaScript / Axios
                </button>
              </div>

              {/* Code Snippet Box */}
              {activeTabChat === "flutter" && (
                <CodeSnippet code={flutterChat} language="dart" title={`Flutter (http) - Chat with ${modelName}`} />
              )}
              {activeTabChat === "curl" && (
                <CodeSnippet code={curlChat} language="bash" title={`cURL - POST /api/hosts/${currentSlug}/chat`} />
              )}
              {activeTabChat === "js" && (
                <CodeSnippet code={jsChat} language="javascript" title={`JavaScript (Axios) - ${modelName}`} />
              )}

              {/* LIVE CONSOLE: TEST THIS ENDPOINT */}
              <div className="bg-light p-3 rounded-4 mt-3 border">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2 small">
                    <FaPaperPlane className="text-primary" /> Live Test Console — Send Message to {modelName}
                  </h6>
                  <small className="text-muted">Real-time AI response</small>
                </div>

                <div className="row g-2 mb-2">
                  <div className="col-12 col-md-4">
                    <label className="form-label text-muted" style={{ fontSize: "11px" }}>User ID</label>
                    <input
                      type="text"
                      className="form-control form-control-sm font-monospace"
                      value={testUserId}
                      onChange={(e) => setTestUserId(e.target.value)}
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label text-muted" style={{ fontSize: "11px" }}>User Name</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={testUserName}
                      onChange={(e) => setTestUserName(e.target.value)}
                    />
                  </div>
                  <div className="col-12 col-md-4 d-flex align-items-end">
                    <button
                      type="button"
                      disabled={testing}
                      onClick={handleTestChat}
                      className="btn btn-primary btn-sm w-100 rounded-pill fw-semibold d-flex align-items-center justify-content-center gap-2"
                    >
                      {testing ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                          Generating...
                        </>
                      ) : (
                        <>
                          <FaPaperPlane /> Send to {modelName}
                        </>
                      )}
                    </button>
                  </div>
                  <div className="col-12">
                    <label className="form-label text-muted" style={{ fontSize: "11px" }}>Message</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      placeholder="Type your message..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !testing) handleTestChat();
                      }}
                    />
                  </div>
                </div>

                {/* Live Response Box */}
                {liveResponse && (
                  <div className="mt-3">
                    <span className="small fw-bold text-dark d-block mb-1">
                      {liveResponse.error ? "❌ Error Response" : `✅ ${modelName}'s Real-Time Reply:`}
                    </span>
                    {!liveResponse.error && (
                      <div className="p-3 bg-white rounded-3 border-start border-4 border-primary mb-2 shadow-sm">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <strong className="text-primary">{modelName}:</strong>
                          <span className="badge bg-light text-muted small">{selectedModel?.flavor}</span>
                        </div>
                        <p className="mb-0 fs-14 text-dark">&ldquo;{liveResponse.reply}&rdquo;</p>
                      </div>
                    )}
                    <CodeSnippet
                      code={JSON.stringify(liveResponse, null, 2)}
                      language="json"
                      title="Raw Server Response (200 OK)"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ENDPOINT 2: GET CHAT HISTORY */}
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-primary px-3 py-2 fw-bold font-monospace">GET</span>
                  <h5 className="fw-bold mb-0 text-dark font-monospace" style={{ fontSize: "16px" }}>
                    /api/hosts/{currentSlug}/history
                  </h5>
                </div>
                <span className="badge bg-light text-dark border">
                  Retrieve Conversation History
                </span>
              </div>
              <p className="text-muted small mb-3">
                Fetches past conversation turns between this user and <strong>{modelName}</strong>. Includes user prompts, AI persona replies, and timestamps.
              </p>

              {/* Query Parameters Table */}
              <div className="table-responsive mb-3">
                <table className="table table-sm table-bordered small">
                  <thead className="table-light">
                    <tr>
                      <th>Query Parameter</th>
                      <th>Type</th>
                      <th>Required</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-monospace text-primary">external_user_id</td>
                      <td>String</td>
                      <td><span className="badge bg-danger">Required</span></td>
                      <td>Unique ID of the app user (e.g. <code>user_123</code> or MongoDB user ID).</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Language Tabs */}
              <div className="d-flex align-items-center gap-2 mb-2">
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-1 ${activeTabHist === "flutter" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => setActiveTabHist("flutter")}
                >
                  <FaMobileAlt className="me-1" /> Flutter / Dart
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-1 ${activeTabHist === "curl" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => setActiveTabHist("curl")}
                >
                  <FaTerminal className="me-1" /> cURL
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-1 ${activeTabHist === "js" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => setActiveTabHist("js")}
                >
                  <FaCode className="me-1" /> JavaScript
                </button>
              </div>

              {activeTabHist === "flutter" && (
                <CodeSnippet code={flutterHistory} language="dart" title={`Flutter - Get ${modelName} History`} />
              )}
              {activeTabHist === "curl" && (
                <CodeSnippet code={curlHistory} language="bash" title={`cURL - GET History`} />
              )}
              {activeTabHist === "js" && (
                <CodeSnippet code={jsHistory} language="javascript" title="JavaScript - History" />
              )}
            </div>

            {/* ENDPOINT 3: RESET CHAT MEMORY */}
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-warning text-dark px-3 py-2 fw-bold font-monospace">POST</span>
                  <h5 className="fw-bold mb-0 text-dark font-monospace" style={{ fontSize: "16px" }}>
                    /api/hosts/{currentSlug}/reset
                  </h5>
                </div>
                <span className="badge bg-light text-dark border">
                  Reset Conversation Memory
                </span>
              </div>
              <p className="text-muted small mb-3">
                Clears conversation history and dialogue state for the given user with <strong>{modelName}</strong>. Use when user wants to restart chat from scratch.
              </p>

              <div className="d-flex align-items-center gap-2 mb-2">
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-1 ${activeTabReset === "flutter" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => setActiveTabReset("flutter")}
                >
                  <FaMobileAlt className="me-1" /> Flutter / Dart
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-1 ${activeTabReset === "curl" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => setActiveTabReset("curl")}
                >
                  <FaTerminal className="me-1" /> cURL
                </button>
              </div>

              {activeTabReset === "flutter" && (
                <CodeSnippet code={flutterReset} language="dart" title="Flutter - Reset Memory" />
              )}
              {activeTabReset === "curl" && (
                <CodeSnippet code={curlReset} language="bash" title="cURL - Reset Memory" />
              )}
            </div>

            {/* ENDPOINT 4: GET PROFILE DETAILS */}
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-info text-dark px-3 py-2 fw-bold font-monospace">GET</span>
                  <h5 className="fw-bold mb-0 text-dark font-monospace" style={{ fontSize: "16px" }}>
                    /api/hosts/{currentSlug}
                  </h5>
                </div>
                <span className="badge bg-light text-dark border">
                  Get Full Model Profile
                </span>
              </div>
              <p className="text-muted small mb-3">
                Retrieves full metadata for <strong>{modelName}</strong>, including flavor, tagline, bio, language, profile video, and photo gallery.
              </p>

              <div className="d-flex align-items-center gap-2 mb-2">
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-1 ${activeTabDetail === "flutter" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => setActiveTabDetail("flutter")}
                >
                  <FaMobileAlt className="me-1" /> Flutter / Dart
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-1 ${activeTabDetail === "curl" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => setActiveTabDetail("curl")}
                >
                  <FaTerminal className="me-1" /> cURL
                </button>
              </div>

              {activeTabDetail === "flutter" && (
                <CodeSnippet code={flutterDetails} language="dart" title={`Flutter - Get ${modelName} Profile`} />
              )}
              {activeTabDetail === "curl" && (
                <CodeSnippet code={curlDetails} language="bash" title={`cURL - GET Profile`} />
              )}
            </div>

            {/* QUIETCHAT BACKEND CLIENT ROUTE (WITH COIN BILLING) */}
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border-start border-4 border-warning">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-warning text-dark px-3 py-2 fw-bold font-monospace">POST</span>
                  <h5 className="fw-bold mb-0 text-dark font-monospace" style={{ fontSize: "16px" }}>
                    /api/client/ai/chat
                  </h5>
                </div>
                <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                  App Route (with Coin Deduction)
                </span>
              </div>
              <p className="text-muted small mb-2">
                This is the QuietChat app backend route that automatically deducts <strong>{selectedModel?.chatRate || 5} coins</strong> from the user&apos;s wallet balance, creates/updates MongoDB chat topics, and proxies the message to {modelName}.
              </p>
              <CodeSnippet
                code={`curl -X POST "http://YOUR_SERVER_IP:5001/api/client/ai/chat" \\
  -H "Authorization: Bearer <USER_JWT_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "hostId": "${currentModelId}",
    "message": "Hi ${modelName}!"
  }'`}
                language="bash"
                title="QuietChat Mobile App Backend Route"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

AiModelApiDocs.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default AiModelApiDocs;
