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
  FaKey,
  FaLink,
  FaReact,
  FaSlidersH,
  FaHistory,
  FaTrashAlt,
  FaExternalLinkAlt,
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

// Reusable Code Snippet Box with 1-click copy
const CodeSnippet = ({
  code,
  language = "javascript",
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
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-3 border overflow-hidden my-3 shadow-sm" style={{ backgroundColor: "#0f172a" }}>
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
              <FaCheck className="text-success" /> Copied!
            </>
          ) : (
            <>
              <FaCopy /> Copy Code
            </>
          )}
        </button>
      </div>
      <pre
        className="p-3 text-light font-monospace small mb-0"
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          maxHeight: "380px",
          overflowY: "auto",
          fontSize: "12px",
          lineHeight: "1.55",
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

  // Global Configurable Environment Variables
  const [baseUrl, setBaseUrl] = useState("https://adminai.quietchat.in/api");
  const [authToken, setAuthToken] = useState("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sample_token_xyz");
  const [userId, setUserId] = useState("user_react_001");
  const [userName, setUserName] = useState("Rahul");

  // Selected Doc Tab: "component" | "hook" | "service" | "routing" | "curl"
  const [activeDocTab, setActiveDocTab] = useState<
    "component" | "hook" | "service" | "routing" | "curl"
  >("component");

  // Live Console State
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
  const flavor = selectedModel?.flavor || "Sweet & Romantic";

  // 1. React.js Full Page / Chat Component for this profile
  const reactComponentSnippet = useMemo(() => {
    return `import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// API Configuration
const BASE_URL = '${baseUrl}';
const AUTH_TOKEN = '${authToken}';
const MODEL_SLUG = '${currentSlug}'; // ${modelName} (${flavor})

export default function ${modelName}ChatPage() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [modelProfile, setModelProfile] = useState(null);
  const messagesEndRef = useRef(null);

  const userId = '${userId}';
  const userName = '${userName}';

  // 1. Fetch ${modelName}'s Profile & History on Load
  useEffect(() => {
    async function init() {
      try {
        // Fetch Model Profile
        const profileRes = await axios.get(\`\${BASE_URL}/hosts/\${MODEL_SLUG}\`, {
          headers: { Authorization: \`Bearer \${AUTH_TOKEN}\` }
        });
        setModelProfile(profileRes.data);

        // Fetch Conversation History
        const histRes = await axios.get(\`\${BASE_URL}/hosts/\${MODEL_SLUG}/history\`, {
          params: { external_user_id: userId },
          headers: { Authorization: \`Bearer \${AUTH_TOKEN}\` }
        });
        if (histRes.data?.messages) {
          setMessages(histRes.data.messages);
        }
      } catch (err) {
        console.error('Failed to load ${modelName} chat:', err);
      }
    }
    init();
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // 2. Send Message to ${modelName}
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    // Append optimistic user message
    const newMsg = { id: Date.now(), role: 'user', text: userText };
    setMessages((prev) => [...prev, newMsg]);
    setLoading(true);

    try {
      const response = await axios.post(
        \`\${BASE_URL}/hosts/\${MODEL_SLUG}/chat\`,
        {
          message: userText,
          external_user_id: userId,
          user_name: userName,
          user_gender: 'male',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: \`Bearer \${AUTH_TOKEN}\`,
          },
        }
      );

      // Append AI persona reply
      const aiReply = {
        id: Date.now() + 1,
        role: 'assistant',
        text: response.data.reply,
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      console.error('Chat error:', err);
      alert('Failed to send message to ${modelName}.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Reset Memory Context
  const handleReset = async () => {
    if (!window.confirm('Restart chat with ${modelName}?')) return;
    try {
      await axios.post(
        \`\${BASE_URL}/hosts/\${MODEL_SLUG}/reset\`,
        { external_user_id: userId },
        { headers: { Authorization: \`Bearer \${AUTH_TOKEN}\` } }
      );
      setMessages([]);
      alert('Memory reset!');
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '20px auto', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '80vh', border: '1px solid #e2e8f0' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>${modelName}</h2>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>${flavor}</span>
        </div>
        <button onClick={handleReset} style={{ background: '#334155', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>
          Reset Memory
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#64748b', marginTop: '40px' }}>
            Say hello to \${modelProfile?.name || '${modelName}'}!
          </div>
        )}
        {messages.map((m, idx) => {
          const isMe = m.role === 'user';
          return (
            <div key={idx} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '75%', padding: '10px 16px', borderRadius: isMe ? '16px 16px 0 16px' : '16px 16px 16px 0', background: isMe ? '#8F6DFF' : '#ffffff', color: isMe ? '#ffffff' : '#0f172a', border: isMe ? 'none' : '1px solid #e2e8f0', fontSize: '14px', lineHeight: 1.5, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                {m.text}
              </div>
            </div>
          );
        })}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '8px 16px', background: '#e2e8f0', borderRadius: '12px', fontSize: '13px', color: '#475569', fontStyle: 'italic' }}>
              ${modelName} is typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} style={{ padding: '12px 16px', background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={\`Message \${modelProfile?.name || '${modelName}'}...\`}
          style={{ flex: 1, padding: '10px 14px', borderRadius: '24px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
        />
        <button type="submit" disabled={loading} style={{ background: '#8F6DFF', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '24px', cursor: 'pointer', fontWeight: 600 }}>
          Send
        </button>
      </form>
    </div>
  );
}`;
  }, [baseUrl, authToken, currentSlug, modelName, flavor, userId, userName]);

  // 2. React Custom Hook (useAiModelChat)
  const reactHookSnippet = useMemo(() => {
    return `// src/hooks/useAiModelChat.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BASE_URL = '${baseUrl}';

export function useAiModelChat(slug = '${currentSlug}', options = {}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const token = options.token || '${authToken}';
  const userId = options.userId || '${userId}';
  const userName = options.userName || '${userName}';

  // Axios helper with Base URL & Auth Bearer Token
  const client = axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: \`Bearer \${token}\`,
      'Content-Type': 'application/json',
    },
  });

  // Load chat history
  const loadHistory = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await client.get(\`/hosts/\${slug}/history\`, {
        params: { external_user_id: userId },
      });
      if (res.data?.messages) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.warn('Failed to load history:', err);
    }
  }, [slug, userId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Send message
  const sendMessage = async (text) => {
    if (!text?.trim() || loading) return;
    setLoading(true);
    setError(null);

    // Optimistic user message
    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', text }]);

    try {
      const res = await client.post(\`/hosts/\${slug}/chat\`, {
        message: text,
        external_user_id: userId,
        user_name: userName,
        user_gender: 'male',
      });

      const reply = res.data?.reply;
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'assistant', text: reply }]);
      return reply;
    } catch (err) {
      setError(err?.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset conversation context
  const resetChat = async () => {
    try {
      await client.post(\`/hosts/\${slug}/reset\`, { external_user_id: userId });
      setMessages([]);
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    resetChat,
    reloadHistory: loadHistory,
  };
}`;
  }, [baseUrl, authToken, currentSlug, userId, userName]);

  // 3. React API Service Module (aiModelService.js)
  const reactServiceSnippet = useMemo(() => {
    return `// src/services/aiModelService.js
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_AI_BASE_URL || '${baseUrl}';
const AUTH_TOKEN = process.env.REACT_APP_AI_AUTH_TOKEN || '${authToken}';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Authorization: \`Bearer \${AUTH_TOKEN}\`,
  },
  timeout: 60000,
});

/**
 * Send message to an AI Model profile
 * @param {string} slug - Model slug (e.g. "${currentSlug}")
 * @param {string} message - User message text
 * @param {string} userId - User ID (e.g. "${userId}")
 * @param {string} userName - User Name (e.g. "${userName}")
 */
export async function sendModelChat(slug, message, userId = '${userId}', userName = '${userName}') {
  const response = await api.post(\`/hosts/\${slug}/chat\`, {
    message,
    external_user_id: userId,
    user_name: userName,
    user_gender: 'male',
  });
  return response.data; // { reply, conversation_id, messages, host }
}

/**
 * Fetch full profile of an AI Model
 */
export async function getModelProfile(slug) {
  const response = await api.get(\`/hosts/\${slug}\`);
  return response.data;
}

/**
 * Fetch chat history for an AI Model
 */
export async function getModelHistory(slug, userId = '${userId}') {
  const response = await api.get(\`/hosts/\${slug}/history\`, {
    params: { external_user_id: userId },
  });
  return response.data?.messages || [];
}

/**
 * Reset memory for an AI Model
 */
export async function resetModelMemory(slug, userId = '${userId}') {
  const response = await api.post(\`/hosts/\${slug}/reset\`, {
    external_user_id: userId,
  });
  return response.data;
}

export default api;`;
  }, [baseUrl, authToken, currentSlug, userId, userName]);

  // 4. React Dynamic Routing Guide
  const reactRoutingSnippet = useMemo(() => {
    return `// App.js (React Router v6 setup for Dynamic Profile Pages)
import React from 'react';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { useAiModelChat } from './hooks/useAiModelChat';

// Dedicated Dynamic Page for ANY AI Model Profile!
function DynamicModelChatView() {
  const { slug } = useParams(); // Reads :slug from URL (e.g. /model/aisha-sweet)
  const { messages, loading, sendMessage, resetChat } = useAiModelChat(slug);
  const [text, setText] = React.useState('');

  return (
    <div className="chat-container">
      <h2>Chatting with /{slug}</h2>
      <button onClick={resetChat}>Reset Chat</button>

      <div className="messages-box">
        {messages.map((m, i) => (
          <div key={i} className={\`msg \${m.role}\`}>
            <strong>{m.role === 'user' ? 'You' : slug}: </strong>
            <span>{m.text}</span>
          </div>
        ))}
        {loading && <p>AI is thinking...</p>}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); sendMessage(text); setText(''); }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." />
        <button type="submit" disabled={loading}>Send</button>
      </form>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Dynamic Route: Works for ${currentSlug}, riya-playful, or ANY new model! */}
        <Route path="/model/:slug" element={<DynamicModelChatView />} />
      </Routes>
    </BrowserRouter>
  );
}`;
  }, [currentSlug]);

  // 5. Raw cURL & HTTP with Headers
  const curlSnippet = useMemo(() => {
    return `# 1. Send Message to ${modelName}
curl -X POST "${baseUrl}/hosts/${currentSlug}/chat" \\
  -H "Authorization: Bearer ${authToken}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "${testMessage}",
    "external_user_id": "${userId}",
    "user_name": "${userName}",
    "user_gender": "male"
  }'

# 2. Get ${modelName} Conversation History
curl -X GET "${baseUrl}/hosts/${currentSlug}/history?external_user_id=${userId}" \\
  -H "Authorization: Bearer ${authToken}"

# 3. Reset ${modelName} Conversation Memory
curl -X POST "${baseUrl}/hosts/${currentSlug}/reset" \\
  -H "Authorization: Bearer ${authToken}" \\
  -H "Content-Type: application/json" \\
  -d '{"external_user_id": "${userId}"}'

# 4. Get ${modelName} Profile Info
curl -X GET "${baseUrl}/hosts/${currentSlug}" \\
  -H "Authorization: Bearer ${authToken}"`;
  }, [baseUrl, currentSlug, authToken, testMessage, userId, userName, modelName]);

  // Run live test (uses server-side /api/model-chat proxy to eliminate browser cross-origin CORS blocks)
  const handleTestChat = async () => {
    if (!testMessage.trim()) {
      toast.warning("Please type a test message.");
      return;
    }
    setTesting(true);
    setLiveResponse(null);
    try {
      // Use internal server route to safely bypass cross-origin browser CORS policies
      const res = await axios.post("/api/model-chat", {
        baseUrl: baseUrl.trim(),
        slug: currentSlug,
        message: testMessage.trim(),
        external_user_id: userId.trim() || "react_user",
        user_name: userName.trim() || "Rahul",
        user_gender: "male",
        authToken: authToken.trim(),
      });
      setLiveResponse(res.data);
      toast.success(`${modelName} replied successfully!`);
    } catch (err: any) {
      // Fallback direct request
      try {
        const directRes = await axios.post(
          `${baseUrl}/hosts/${currentSlug}/chat`,
          {
            message: testMessage.trim(),
            external_user_id: userId.trim() || "react_user",
            user_name: userName.trim() || "Rahul",
            user_gender: "male",
          },
          {
            headers: {
              "Content-Type": "application/json",
              ...(authToken ? { Authorization: `Bearer ${authToken.trim()}` } : {}),
            },
          }
        );
        setLiveResponse(directRes.data);
        toast.success(`${modelName} replied successfully!`);
      } catch (fallbackErr: any) {
        const errData =
          err.response?.data?.details ||
          err.response?.data ||
          fallbackErr.response?.data ||
          fallbackErr.message ||
          err.message;
        setLiveResponse({ error: true, details: errData });
        toast.error("API test failed. Check Base URL / Token or CORS.");
      }
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
      <Title name="AI Model API Documentation (React.js)" />

      {/* TOP CONFIGURATION BAR: Base URL & Auth Token */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white mt-3 border-start border-4 border-primary">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <div className="d-flex align-items-center gap-2">
            <FaReact className="text-info fs-4" />
            <h5 className="fw-bold mb-0 text-dark">React.js Environment & API Configuration</h5>
          </div>
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1 rounded-pill small">
            Live Config Sync
          </span>
        </div>

        <p className="text-muted small mb-3">
          Configure your <strong>Base URL</strong> and <strong>Bearer Auth Token</strong> below. Every React component, hook, and code snippet on this page will automatically update with these credentials in real-time.
        </p>

        <div className="row g-3">
          {/* Base URL */}
          <div className="col-12 col-md-6">
            <label className="form-label small fw-bold text-dark d-flex align-items-center gap-1">
              <FaLink className="text-primary" /> API Base URL
            </label>
            <div className="input-group input-group-sm">
              <input
                type="text"
                className="form-control font-monospace"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://your-domain.com/api"
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  navigator.clipboard.writeText(baseUrl);
                  toast.success("Base URL copied!");
                }}
              >
                <FaCopy />
              </button>
            </div>
            <small className="text-muted" style={{ fontSize: "11px" }}>
              Default: <code>https://adminai.quietchat.in/api</code>
            </small>
          </div>

          {/* Auth Token */}
          <div className="col-12 col-md-6">
            <label className="form-label small fw-bold text-dark d-flex align-items-center gap-1">
              <FaKey className="text-warning" /> Authorization Bearer Token
            </label>
            <div className="input-group input-group-sm">
              <input
                type="text"
                className="form-control font-monospace"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                placeholder="Bearer JWT or API Secret Token"
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  navigator.clipboard.writeText(authToken);
                  toast.success("Token copied!");
                }}
              >
                <FaCopy />
              </button>
            </div>
            <small className="text-muted" style={{ fontSize: "11px" }}>
              Sent in <code>Authorization: Bearer &lt;token&gt;</code> header
            </small>
          </div>
        </div>

        <div className="alert alert-info py-2 px-3 rounded-3 small mb-0 mt-3 d-flex align-items-center gap-2 border-0 bg-info-subtle text-info-emphasis">
          <FaSlidersH />
          <span>
            <strong>React Frontend CORS Tip:</strong> When developing with React (Vite / CRA / Next.js) on a custom domain, remember to proxy requests through your backend or add your domain to Nginx CORS headers to prevent browser preflight blocks.
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted small">Loading AI Model profiles...</p>
        </div>
      ) : (
        <div className="row g-4">
          {/* LEFT COLUMN: DYNAMIC MODEL SELECTOR */}
          <div className="col-12 col-lg-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white sticky-top" style={{ top: "80px" }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <FaRobot className="text-primary" /> Select Model
                </h6>
                <span className="badge bg-success-subtle text-success small">{models.length} Loaded</span>
              </div>

              {/* Models List */}
              <div className="d-flex flex-column gap-2" style={{ maxHeight: "380px", overflowY: "auto" }}>
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

          {/* RIGHT COLUMN: REACT.JS DOCUMENTATION */}
          <div className="col-12 col-lg-9">
            {/* DOC TABS NAVIGATION */}
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 border-bottom pb-3 mb-3">
                <div>
                  <h5 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                    <FaReact className="text-info fs-4" /> Integration Suite for {modelName} (<code>/{currentSlug}</code>)
                  </h5>
                  <p className="text-muted small mb-0">
                    Ready-to-use React.js architecture: UI Component, Custom Hook, Axios Service, and Dynamic Routing.
                  </p>
                </div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="badge bg-light text-dark border font-monospace">
                    Endpoint: {baseUrl}/hosts/{currentSlug}/chat
                  </span>
                </div>
              </div>

              {/* Navigation Pill Buttons */}
              <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold ${
                    activeDocTab === "component" ? "btn-primary shadow-sm" : "btn-outline-secondary"
                  }`}
                  onClick={() => setActiveDocTab("component")}
                >
                  <FaReact className="me-1 text-info" /> React UI Component
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold ${
                    activeDocTab === "hook" ? "btn-primary shadow-sm" : "btn-outline-secondary"
                  }`}
                  onClick={() => setActiveDocTab("hook")}
                >
                  <FaCode className="me-1 text-warning" /> Custom Hook (useAiModelChat)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold ${
                    activeDocTab === "service" ? "btn-primary shadow-sm" : "btn-outline-secondary"
                  }`}
                  onClick={() => setActiveDocTab("service")}
                >
                  <FaLink className="me-1 text-success" /> Axios API Service
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold ${
                    activeDocTab === "routing" ? "btn-primary shadow-sm" : "btn-outline-secondary"
                  }`}
                  onClick={() => setActiveDocTab("routing")}
                >
                  <FaSlidersH className="me-1 text-primary" /> React Dynamic Routes
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold ${
                    activeDocTab === "curl" ? "btn-primary shadow-sm" : "btn-outline-secondary"
                  }`}
                  onClick={() => setActiveDocTab("curl")}
                >
                  <FaTerminal className="me-1 text-light" /> cURL & HTTP
                </button>
              </div>

              {/* TAB 1: REACT UI COMPONENT */}
              {activeDocTab === "component" && (
                <div>
                  <h6 className="fw-bold text-dark mb-1">
                    Complete Standalone React.js Chat Component for {modelName}
                  </h6>
                  <p className="text-muted small mb-2">
                    Copy and paste this component into your React.js project. It handles message list, history fetching, auto-scroll, optimistic UI updates, and memory reset.
                  </p>
                  <CodeSnippet
                    code={reactComponentSnippet}
                    language="jsx"
                    title={`src/components/${modelName}ChatPage.jsx`}
                  />
                </div>
              )}

              {/* TAB 2: REACT HOOK */}
              {activeDocTab === "hook" && (
                <div>
                  <h6 className="fw-bold text-dark mb-1">
                    Reusable React Hook: <code>useAiModelChat(slug, options)</code>
                  </h6>
                  <p className="text-muted small mb-2">
                    Clean separation of concerns: import this hook into any custom React screen to get <code>messages</code>, <code>loading</code>, <code>sendMessage</code>, and <code>resetChat</code>.
                  </p>
                  <CodeSnippet
                    code={reactHookSnippet}
                    language="javascript"
                    title="src/hooks/useAiModelChat.js"
                  />
                </div>
              )}

              {/* TAB 3: AXIOS SERVICE */}
              {activeDocTab === "service" && (
                <div>
                  <h6 className="fw-bold text-dark mb-1">
                    Configured Axios API Client with Base URL & Bearer Token
                  </h6>
                  <p className="text-muted small mb-2">
                    Centralized API client for all AI Model endpoints. Handles timeout, JSON headers, and Bearer token authentication.
                  </p>
                  <CodeSnippet
                    code={reactServiceSnippet}
                    language="javascript"
                    title="src/services/aiModelService.js"
                  />
                </div>
              )}

              {/* TAB 4: ROUTING GUIDE */}
              {activeDocTab === "routing" && (
                <div>
                  <h6 className="fw-bold text-dark mb-1">
                    Dynamic Profile Page Routing (React Router v6)
                  </h6>
                  <p className="text-muted small mb-2">
                    How to configure React Router so that <code>/model/:slug</code> dynamically routes to <strong>{modelName}</strong> (<code>/{currentSlug}</code>) and any new model you add in the future with ZERO code changes.
                  </p>
                  <CodeSnippet
                    code={reactRoutingSnippet}
                    language="jsx"
                    title="src/App.jsx (React Router v6)"
                  />
                </div>
              )}

              {/* TAB 5: cURL */}
              {activeDocTab === "curl" && (
                <div>
                  <h6 className="fw-bold text-dark mb-1">
                    Raw HTTP & cURL Reference with Headers
                  </h6>
                  <p className="text-muted small mb-2">
                    Direct terminal or Postman commands with <code>Authorization: Bearer &lt;token&gt;</code> and <code>{baseUrl}</code>.
                  </p>
                  <CodeSnippet
                    code={curlSnippet}
                    language="bash"
                    title={`cURL Commands for ${modelName}`}
                  />
                </div>
              )}
            </div>

            {/* LIVE CONSOLE / TEST COMPONENT IN REAL-TIME */}
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border-top border-4 border-success">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <div className="d-flex align-items-center gap-2">
                  <FaPaperPlane className="text-success fs-5" />
                  <h5 className="fw-bold mb-0 text-dark">
                    Live React API Console — Test Message with {modelName}
                  </h5>
                </div>
                <span className="badge bg-success-subtle text-success border border-success-subtle small px-3 py-1 rounded-pill">
                  Live Endpoint: {baseUrl}/hosts/{currentSlug}/chat
                </span>
              </div>

              <p className="text-muted small mb-3">
                Send a real test request directly to <strong>{modelName}</strong> using your configured Base URL and Token. View the immediate response from the AI persona engine.
              </p>

              <div className="row g-2 mb-3">
                <div className="col-12 col-md-4">
                  <label className="form-label text-muted small mb-1">User ID</label>
                  <input
                    type="text"
                    className="form-control form-control-sm font-monospace"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label text-muted small mb-1">User Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-4 d-flex align-items-end">
                  <button
                    type="button"
                    disabled={testing}
                    onClick={handleTestChat}
                    className="btn btn-success btn-sm w-100 rounded-pill fw-semibold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                  >
                    {testing ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        Calling API...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane /> Send to {modelName}
                      </>
                    )}
                  </button>
                </div>
                <div className="col-12">
                  <label className="form-label text-muted small mb-1">Test Message</label>
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
                <div className="mt-2">
                  <span className="small fw-bold text-dark d-block mb-1">
                    {liveResponse.error ? "❌ Error Output:" : `✅ ${modelName}'s Real-Time Persona Reply:`}
                  </span>
                  {!liveResponse.error && (
                    <div className="p-3 bg-light rounded-3 border-start border-4 border-success mb-2 shadow-sm">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <strong className="text-success">{modelName}:</strong>
                        <span className="badge bg-white text-muted small border">{selectedModel?.flavor}</span>
                      </div>
                      <p className="mb-0 fs-14 text-dark font-monospace">&ldquo;{liveResponse.reply}&rdquo;</p>
                    </div>
                  )}
                  <CodeSnippet
                    code={JSON.stringify(liveResponse, null, 2)}
                    language="json"
                    title="Live API Response Object"
                  />
                </div>
              )}
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
