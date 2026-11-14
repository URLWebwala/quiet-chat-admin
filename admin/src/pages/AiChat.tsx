import React, { useEffect, useState, useRef, useMemo } from "react";
import RootLayout from "@/component/layout/Layout";
import Title from "@/extra/Title";
import male from "@/assets/images/male.png";
import female from "@/assets/images/female.png";
import AiChatIcon from "@/assets/images/aiChat";
import { useDispatch, useSelector } from "react-redux";
import { RootStore } from "@/store/store";
import { baseURL } from "@/utils/config";
import { useRouter } from "next/router";
import {
  createAiConversation,
  sendAiMessage,
  fetchConversations,
  fetchAiProfiles,
  createAiProfile,
  fetchAiExperts,
  fetchAiHosts,
  sendHostDirectMessage,
  resetHostChatHistory,
  AiExpert,
  AiHostPersona,
} from "@/utils/aiChatApi";
import HostQAModal from "@/component/host/HostQAModal";
import { FaUserGraduate, FaRobot, FaVial, FaTrashAlt, FaHeart } from "react-icons/fa";
import { toast } from "react-toastify";

interface ChatMessage {
  id: string;
  sender: "user" | "host";
  text: string;
  time: string;
  status?: "sent" | "delivered" | "read";
}

const FLAVOR_COLORS: { [key: string]: { bg: string; text: string; border: string } } = {
  "Sweet & Romantic": { bg: "#fce7f3", text: "#db2777", border: "#fbcfe8" },
  "Playful & Teasing": { bg: "#fef3c7", text: "#d97706", border: "#fde68a" },
  "Bold & Sassy": { bg: "#fee2e2", text: "#dc2626", border: "#fecaca" },
  "Cute & Bubbly": { bg: "#ede9fe", text: "#7c3aed", border: "#ddd6fe" },
  "Charming & Elegant": { bg: "#e0e7ff", text: "#4338ca", border: "#c7d2fe" },
  "Witty & Sarcastic": { bg: "#ffedd5", text: "#ea580c", border: "#fed7aa" },
  "Caring & Supportive": { bg: "#dcfce7", text: "#16a34a", border: "#bbf7d0" },
  "Mysterious & Sultry": { bg: "#f3e8ff", text: "#9333ea", border: "#e9d5ff" },
};

const AiChat = () => {
  const router = useRouter();

  // Tab State: "hosts" (AI Host personas) or "experts" (AI Expert advisors)
  const [activeTab, setActiveTab] = useState<"hosts" | "experts">("hosts");

  // Selection
  const [selectedAiHost, setSelectedAiHost] = useState<AiHostPersona | null>(null);
  const [selectedExpert, setSelectedExpert] = useState<AiExpert | null>(null);

  // Lists
  const [aiHosts, setAiHosts] = useState<AiHostPersona[]>([]);
  const [loadingHosts, setLoadingHosts] = useState<boolean>(false);
  const [experts, setExperts] = useState<AiExpert[]>([]);
  const [loadingExperts, setLoadingExperts] = useState<boolean>(false);

  // QA benchmark modal for selected host
  const [qaModalHost, setQaModalHost] = useState<AiHostPersona | null>(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const [flavorFilter, setFlavorFilter] = useState<string>("all");

  // Track active AI backend conversation per ID
  const [conversationsMap, setConversationsMap] = useState<{ [id: string]: string }>({});
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Store chat history per persona ID
  const [chats, setChats] = useState<{ [id: string]: ChatMessage[] }>({});
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch AI Hosts & Experts on mount
  useEffect(() => {
    loadAiHostsList();
    loadExpertsList();
    initExistingConversations();
  }, []);

  const loadAiHostsList = async () => {
    setLoadingHosts(true);
    try {
      const data = await fetchAiHosts();
      setAiHosts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn("Could not load AI hosts:", e);
    } finally {
      setLoadingHosts(false);
    }
  };

  const loadExpertsList = async () => {
    setLoadingExperts(true);
    try {
      const data = await fetchAiExperts();
      setExperts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn("Could not load AI experts:", e);
    } finally {
      setLoadingExperts(false);
    }
  };

  // Handle URL Query parameters (e.g. /AiChat?expertId=xxx or /AiChat?hostId=yyy)
  useEffect(() => {
    if (!router.isReady) return;
    const { expertId, hostId } = router.query;

    if (expertId && experts.length > 0) {
      const targetExp = experts.find(
        (e) => String(e.id) === String(expertId) || String(e._id) === String(expertId)
      );
      if (targetExp) {
        setActiveTab("experts");
        setSelectedExpert(targetExp);
      }
    } else if (hostId && aiHosts.length > 0) {
      const targetHost = aiHosts.find(
        (h) =>
          String(h.id) === String(hostId) ||
          String(h._id) === String(hostId) ||
          String(h.uniqueId) === String(hostId)
      );
      if (targetHost) {
        setActiveTab("hosts");
        setSelectedAiHost(targetHost);
      }
    }
  }, [router.isReady, router.query, experts, aiHosts]);

  // Set default selected host or expert if none selected
  useEffect(() => {
    if (activeTab === "hosts" && aiHosts.length > 0 && !selectedAiHost) {
      setSelectedAiHost(aiHosts[0]);
    } else if (activeTab === "experts" && experts.length > 0 && !selectedExpert) {
      setSelectedExpert(experts[0]);
    }
  }, [activeTab, aiHosts, experts, selectedAiHost, selectedExpert]);

  // Scroll chat to bottom on new message or typing state change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, selectedAiHost, selectedExpert, isTyping, activeTab]);

  const initExistingConversations = async () => {
    try {
      const convos = await fetchConversations();
      if (Array.isArray(convos)) {
        const map: { [id: string]: string } = {};
        convos.forEach((c: any) => {
          if (c.profile_id) {
            map[c.profile_id] = c.conversation_id || c.id;
          }
        });
        setConversationsMap(map);
      }
    } catch (e) {
      console.warn("Could not fetch backend conversations:", e);
    }
  };

  const cleanQuoteText = (str: string = "") => {
    if (typeof str !== "string") return "";
    let text = str.trim();
    while (
      (text.startsWith('"') && text.endsWith('"')) ||
      (text.startsWith("'") && text.endsWith("'")) ||
      (text.startsWith("“") && text.endsWith("”")) ||
      (text.startsWith("“") && text.endsWith("“"))
    ) {
      text = text.slice(1, -1).trim();
    }
    return text.replace(/^["'“]+|["'”]+$/g, "").trim();
  };

  // Filter AI Hosts list
  const filteredAiHosts = useMemo(() => {
    return (aiHosts || []).filter((h: AiHostPersona) => {
      const text = [h?.name, h?.surname, h?.flavor, h?.tagline, h?.uniqueId, h?.occupation]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());
      const matchesGender =
        genderFilter === "all" || (h?.gender || "").toLowerCase() === genderFilter;
      const matchesFlavor = flavorFilter === "all" || h?.flavor === flavorFilter;

      return matchesSearch && matchesGender && matchesFlavor;
    });
  }, [aiHosts, search, genderFilter, flavorFilter]);

  // Filter AI Experts list
  const filteredExperts = useMemo(() => {
    return (experts || []).filter((exp: any) => {
      const text = [
        exp?.name,
        exp?.surname,
        exp?.category,
        exp?.specialty,
        exp?.tagline,
        exp?.occupation,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());
      const matchesGender =
        genderFilter === "all" || (exp?.gender || "").toLowerCase() === genderFilter;

      return matchesSearch && matchesGender;
    });
  }, [experts, search, genderFilter]);

  // Available flavors from the list
  const availableFlavors = useMemo(() => {
    const s = new Set<string>();
    aiHosts.forEach((h) => {
      if (h.flavor) s.add(h.flavor);
    });
    return Array.from(s);
  }, [aiHosts]);

  // Active persona details
  const activePersonaId =
    activeTab === "hosts"
      ? selectedAiHost?.id || selectedAiHost?._id
      : selectedExpert?.id || selectedExpert?._id;
  const activePersonaName =
    activeTab === "hosts" ? selectedAiHost?.name : selectedExpert?.name;

  // Flavor suggestions / Icebreakers
  const activeTemplates = useMemo(() => {
    if (activeTab === "hosts" && selectedAiHost) {
      const suggestions: string[] = [];
      if (selectedAiHost.greeting) suggestions.push(selectedAiHost.greeting);

      const f = (selectedAiHost.flavor || "").toLowerCase();
      if (f.includes("sweet") || f.includes("romantic")) {
        suggestions.push("Hey beautiful! What are you doing right now? ✨");
        suggestions.push("Aapki smile bohot pyaari lag rahi hai! 😊");
        suggestions.push("Coffee peene chalen kabhi? ☕");
        suggestions.push("Aaj ka din kaisa tha?");
      } else if (f.includes("playful") || f.includes("teasing")) {
        suggestions.push("Aap itne shant kyun ho? 😉");
        suggestions.push("Lagta hai koi bohot busy hai aajkal! 😜");
        suggestions.push("Ek baat poochun? Sach sach bolna!");
        suggestions.push("Guess karo main kya soch raha hoon! 😏");
      } else if (f.includes("bold") || f.includes("sassy")) {
        suggestions.push("Confidence to kamaal ka hai aapka! 🔥");
        suggestions.push("Kuch exciting sunao aaj!");
        suggestions.push("Impress me if you can! 😏");
        suggestions.push("Aapke sath baat karke energy alag hi hoti hai!");
      } else if (f.includes("caring") || f.includes("supportive")) {
        suggestions.push("Hey, sab theek hai na? Just checking in! 🌸");
        suggestions.push("Kaam ka bohot stress tha aaj, thoda chill karna hai.");
        suggestions.push("Thank you for always being so kind! ❤️");
      } else {
        suggestions.push("Hey! How are you doing today?");
        suggestions.push("Tell me something interesting about yourself!");
        suggestions.push("Aapki favorite hobby kya hai?");
        suggestions.push("Aaj ka kya plan hai?");
      }

      if (selectedAiHost.tagline) suggestions.push(selectedAiHost.tagline);
      return Array.from(new Set(suggestions)).slice(0, 6);
    }

    if (activeTab === "experts" && selectedExpert) {
      const suggestions: string[] = [];
      if (selectedExpert.tagline) suggestions.push(selectedExpert.tagline);
      if (selectedExpert.specialty)
        suggestions.push(`How do I deal with ${selectedExpert.specialty.toLowerCase()}?`);
      if (selectedExpert.category)
        suggestions.push(`Can you guide me on ${selectedExpert.category.toLowerCase()}?`);
      if (selectedExpert.values) suggestions.push(selectedExpert.values);
      return suggestions.slice(0, 5);
    }

    return [];
  }, [activeTab, selectedAiHost, selectedExpert]);

  // Current chat messages for selected persona
  const currentMessages: ChatMessage[] = activePersonaId
    ? chats[activePersonaId] || [
        {
          id: "welcome-1",
          sender: "host",
          text:
            activeTab === "hosts"
              ? cleanQuoteText(selectedAiHost?.greeting || "") ||
                cleanQuoteText(selectedAiHost?.tagline || "") ||
                `Hi there! I am ${selectedAiHost?.name || "AI Host"}. Kaise ho aap? ✨`
              : selectedExpert?.greeting ||
                selectedExpert?.tagline ||
                `Hello! I am ${selectedExpert?.name || "Advisor"}, your ${
                  selectedExpert?.specialty || selectedExpert?.category || "topic"
                } advisor. What's on your mind today? 🎓`,
          time: "10:00 AM",
        },
      ]
    : [];

  const handleResetChat = async () => {
    if (!activePersonaId) return;

    if (activeTab === "hosts" && selectedAiHost) {
      try {
        const targetId = selectedAiHost.id || selectedAiHost._id;
        if (!targetId) return;
        await resetHostChatHistory(targetId, "admin_tester");
        setChats((prev) => ({
          ...prev,
          [activePersonaId]: [
            {
              id: `reset-${Date.now()}`,
              sender: "host",
              text:
                selectedAiHost.greeting ||
                `Conversation reset! Hey, I'm ${selectedAiHost.name}. What's on your mind? ✨`,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ],
        }));
        toast.success(`Chat history reset for ${selectedAiHost.name}`);
      } catch (e: any) {
        toast.error(e.message || "Failed to reset chat history");
      }
    } else {
      setChats((prev) => ({
        ...prev,
        [activePersonaId]: [
          {
            id: `reset-${Date.now()}`,
            sender: "host",
            text: `Conversation reset. How can I guide you today?`,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ],
      }));
      toast.info("Conversation sandbox cleared");
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !activePersonaId) return;

    const personaId = activePersonaId;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "read",
    };

    setChats((prev) => ({
      ...prev,
      [personaId]: [...(prev[personaId] || currentMessages), newMsg],
    }));

    if (!textToSend) setInputText("");
    setIsTyping(true);

    try {
      let responseBubbles: { text: string; delay_ms?: number }[] = [];

      // 1. Direct Chat for AI Hosts Persona
      if (activeTab === "hosts" && selectedAiHost) {
        const hostTargetId = selectedAiHost.id || selectedAiHost._id;
        if (hostTargetId) {
          try {
            const res = await sendHostDirectMessage(hostTargetId, {
              message: text.trim(),
              external_user_id: "admin_tester",
              user_name: "Admin",
              user_gender: "male",
            });

            if (res?.messages && Array.isArray(res.messages) && res.messages.length > 0) {
              responseBubbles = res.messages.map((m: any) => ({
                text: m.text || m.message || "",
                delay_ms: m.delay_ms || 1000,
              }));
            } else if (res?.reply) {
              responseBubbles = [{ text: res.reply, delay_ms: 1000 }];
            }
          } catch (apiErr) {
            console.warn("Direct host chat failed, falling back to conversation pipeline:", apiErr);
          }
        }
      }

      // 2. Chat for AI Experts (or host fallback)
      if (responseBubbles.length === 0) {
        let convoId = conversationsMap[personaId];
        if (!convoId && activeTab === "experts" && selectedExpert?.id) {
          const newConvo = await createAiConversation(
            selectedExpert.id,
            "Admin",
            selectedExpert.gender === "male" ? "female" : "male"
          );
          if (newConvo?.conversation_id) {
            convoId = newConvo.conversation_id;
            setConversationsMap((prev) => ({ ...prev, [personaId]: convoId }));
          }
        }

        if (convoId) {
          const aiResponse = await sendAiMessage(convoId, text.trim());
          if (aiResponse?.messages && Array.isArray(aiResponse.messages) && aiResponse.messages.length > 0) {
            responseBubbles = aiResponse.messages.map((m: any) => ({
              text: m.text || m.message || "",
              delay_ms: m.delay_ms,
            }));
          } else if (aiResponse?.reply) {
            responseBubbles = [{ text: aiResponse.reply, delay_ms: 1200 }];
          }
        }
      }

      // 3. Fallback if offline
      if (responseBubbles.length === 0) {
        if (activeTab === "hosts") {
          const fallback = selectedAiHost?.tagline
            ? `${selectedAiHost.tagline} ❤️`
            : `Aww, thanks for talking to me! Kaise ho aap? 😊`;
          responseBubbles = [{ text: fallback, delay_ms: 1000 }];
        } else {
          const fallbackText = selectedExpert?.tagline
            ? `I hear you. Remember: ${selectedExpert.tagline}. Let's address this step-by-step.`
            : `That's an important point. Let's break it down to find the right approach for you.`;
          responseBubbles = [{ text: fallbackText, delay_ms: 1000 }];
        }
      }

      // 4. Render bubbles with typing delay
      for (let i = 0; i < responseBubbles.length; i++) {
        const bubble = responseBubbles[i];
        const bubbleDelay = bubble.delay_ms || 1000;

        setIsTyping(true);
        await new Promise((res) =>
          setTimeout(res, Math.min(Math.max(bubbleDelay, 400), 8000))
        );

        const aiReplyMsg: ChatMessage = {
          id: (Date.now() + i + 1).toString(),
          sender: "host",
          text: cleanQuoteText(bubble.text),
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setChats((prev) => ({
          ...prev,
          [personaId]: [...(prev[personaId] || []), aiReplyMsg],
        }));
      }
    } catch (err) {
      console.error("Error sending message to AI backend:", err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Header Bar */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Title name="AI Chat Testing & Sandbox" display="none" />
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary px-3.5 py-1.5 fs-13 d-flex align-items-center gap-2 shadow-sm bg-white"
            style={{ borderRadius: "6px", fontWeight: 600 }}
            onClick={() => router.back()}
          >
            <i className="ri-arrow-left-line fs-16"></i>
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* Main Chat Layout Container */}
      <div
        className="card shadow-sm rounded-4 overflow-hidden mb-4"
        style={{
          height: "calc(100vh - 170px)",
          minHeight: "560px",
          backgroundColor: "#F0F2F5",
          border: "1px solid #CBD5E1",
        }}
      >
        <div className="row g-0 h-100">
          {/* ================= LEFT SIDEBAR: AI HOSTS & EXPERTS ================= */}
          <div
            className="col-12 col-md-4 col-lg-3 border-end bg-white d-flex flex-column h-100"
            style={{ borderColor: "#E9EDEF" }}
          >
            {/* Tab Switcher: Hosts vs Experts */}
            <div
              className="p-3 border-bottom bg-white d-flex flex-column gap-2"
              style={{ borderColor: "#E2E8F0" }}
            >
              <div
                className="d-flex p-1 rounded-3 border"
                style={{ backgroundColor: "#F8FAFC", borderColor: "#E2E8F0" }}
              >
                <button
                  type="button"
                  className={`btn btn-sm flex-fill py-2 fs-12 fw-bold d-flex align-items-center justify-content-center gap-2 ${
                    activeTab === "hosts"
                      ? "bg-white text-dark shadow-sm border"
                      : "text-muted border-0 bg-transparent"
                  }`}
                  style={{ borderRadius: "6px" }}
                  onClick={() => setActiveTab("hosts")}
                >
                  <AiChatIcon />
                  <span>AI Hosts</span>
                  <span
                    className="badge rounded-pill px-1.5 py-0.5 fs-10"
                    style={{
                      backgroundColor: activeTab === "hosts" ? "#8F6DFF" : "#E2E8F0",
                      color: activeTab === "hosts" ? "#ffffff" : "#475569",
                    }}
                  >
                    {aiHosts?.length || 0}
                  </span>
                </button>

                <button
                  type="button"
                  className={`btn btn-sm flex-fill py-2 fs-12 fw-bold d-flex align-items-center justify-content-center gap-2 ${
                    activeTab === "experts"
                      ? "bg-white text-dark shadow-sm border"
                      : "text-muted border-0 bg-transparent"
                  }`}
                  style={{ borderRadius: "6px" }}
                  onClick={() => setActiveTab("experts")}
                >
                  <FaUserGraduate style={{ color: "#0ea5e9" }} />
                  <span>AI Experts</span>
                  <span
                    className="badge rounded-pill px-1.5 py-0.5 fs-10"
                    style={{
                      backgroundColor: activeTab === "experts" ? "#0ea5e9" : "#E2E8F0",
                      color: activeTab === "experts" ? "#ffffff" : "#475569",
                    }}
                  >
                    {experts?.length || 0}
                  </span>
                </button>
              </div>

              {/* Search Box */}
              <div className="position-relative mt-1">
                <i className="ri-search-line position-absolute top-50 start-0 translate-middle-y ms-3 text-muted fs-15"></i>
                <input
                  type="text"
                  className="form-control ps-5 pe-4 py-1.5 bg-light border-0 fs-13"
                  placeholder={
                    activeTab === "hosts"
                      ? "Search host name, flavor, tagline..."
                      : "Search expert, category, specialty..."
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    backgroundColor: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "6px",
                  }}
                />
                {search && (
                  <i
                    className="ri-close-circle-fill position-absolute top-50 end-0 translate-middle-y me-3 text-muted cursor-pointer fs-15"
                    onClick={() => setSearch("")}
                  ></i>
                )}
              </div>

              {/* Gender Filter */}
              <div
                className="d-flex p-1 rounded-2 border"
                style={{ backgroundColor: "#F1F5F9", borderColor: "#E2E8F0" }}
              >
                <button
                  type="button"
                  className={`btn btn-sm flex-fill py-1 fs-11 fw-semibold transition-all ${
                    genderFilter === "all"
                      ? "text-white shadow-sm"
                      : "text-muted border-0 bg-transparent"
                  }`}
                  style={{
                    backgroundColor: genderFilter === "all" ? "#8F6DFF" : undefined,
                    borderRadius: "4px",
                  }}
                  onClick={() => setGenderFilter("all")}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`btn btn-sm flex-fill py-1 fs-11 fw-semibold transition-all ${
                    genderFilter === "female"
                      ? "text-white shadow-sm"
                      : "text-muted border-0 bg-transparent"
                  }`}
                  style={{
                    backgroundColor: genderFilter === "female" ? "#EC4899" : undefined,
                    borderRadius: "4px",
                  }}
                  onClick={() => setGenderFilter("female")}
                >
                  Women
                </button>
                <button
                  type="button"
                  className={`btn btn-sm flex-fill py-1 fs-11 fw-semibold transition-all ${
                    genderFilter === "male"
                      ? "text-white shadow-sm"
                      : "text-muted border-0 bg-transparent"
                  }`}
                  style={{
                    backgroundColor: genderFilter === "male" ? "#3B82F6" : undefined,
                    borderRadius: "4px",
                  }}
                  onClick={() => setGenderFilter("male")}
                >
                  Men
                </button>
              </div>

              {/* Flavor Filter for Hosts */}
              {activeTab === "hosts" && availableFlavors.length > 0 && (
                <div className="d-flex align-items-center gap-1 overflow-auto py-1">
                  <span
                    className={`badge cursor-pointer px-2 py-1 fs-10 rounded-pill border ${
                      flavorFilter === "all"
                        ? "bg-dark text-white border-dark"
                        : "bg-light text-muted border-secondary-subtle"
                    }`}
                    onClick={() => setFlavorFilter("all")}
                  >
                    All Flavors
                  </span>
                  {availableFlavors.map((flavor) => {
                    const cfg = FLAVOR_COLORS[flavor] || {
                      bg: "#f1f5f9",
                      text: "#334155",
                      border: "#cbd5e1",
                    };
                    const isSelected = flavorFilter === flavor;
                    return (
                      <span
                        key={flavor}
                        className="badge cursor-pointer px-2 py-1 fs-10 rounded-pill border text-nowrap"
                        style={{
                          backgroundColor: isSelected ? cfg.text : cfg.bg,
                          color: isSelected ? "#ffffff" : cfg.text,
                          borderColor: cfg.border,
                        }}
                        onClick={() => setFlavorFilter(isSelected ? "all" : flavor)}
                      >
                        {flavor}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Persona List */}
            <div className="flex-grow-1 overflow-auto">
              {activeTab === "hosts" ? (
                /* AI HOSTS LIST */
                loadingHosts ? (
                  <div className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading AI Hosts...
                  </div>
                ) : filteredAiHosts.length === 0 ? (
                  <div className="text-center py-5 text-muted fs-14">
                    <p className="mb-2">No AI Hosts found.</p>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary rounded-pill"
                      onClick={() => router.push("/AddAiHost")}
                    >
                      + Create AI Host
                    </button>
                  </div>
                ) : (
                  filteredAiHosts.map((host: AiHostPersona) => {
                    const hostKey = host.id || host._id;
                    const isSelected =
                      (selectedAiHost?.id && selectedAiHost.id === host.id) ||
                      (selectedAiHost?._id && selectedAiHost._id === host._id);
                    const isFemale = host?.gender?.toLowerCase() === "female";
                    const defaultAvatar = isFemale ? female.src : male.src;

                    const hasCustomImage =
                      host?.image &&
                      typeof host.image === "string" &&
                      host.image.trim() !== "" &&
                      !host.image.endsWith("male.png") &&
                      !host.image.endsWith("female.png");

                    const avatarSrc =
                      hasCustomImage && host?.image
                        ? host.image.startsWith("http")
                          ? host.image
                          : baseURL + host.image.replace(/\\/g, "/")
                        : defaultAvatar;

                    const flavorCfg =
                      host.flavor && FLAVOR_COLORS[host.flavor]
                        ? FLAVOR_COLORS[host.flavor]
                        : { bg: "#ede9fe", text: "#7c3aed", border: "#ddd6fe" };

                    return (
                      <div
                        key={hostKey}
                        className={`d-flex align-items-center p-3 border-bottom cursor-pointer transition-all ${
                          isSelected ? "bg-light border-start border-4 border-primary" : ""
                        }`}
                        style={{
                          backgroundColor: isSelected ? "#F3E8FF" : "transparent",
                          cursor: "pointer",
                        }}
                        onClick={() => setSelectedAiHost(host)}
                      >
                        <div className="position-relative flex-shrink-0 me-3">
                          <img
                            src={avatarSrc}
                            onError={(e: any) => {
                              e.currentTarget.src = defaultAvatar;
                            }}
                            alt={host?.name}
                            className="rounded-circle object-fit-cover shadow-sm"
                            style={{ width: "46px", height: "46px" }}
                          />
                          <span
                            className="position-absolute bottom-0 end-0 p-1 rounded-circle border border-2 border-white bg-success"
                            style={{ width: "12px", height: "12px" }}
                          ></span>
                        </div>

                        <div className="flex-grow-1 min-w-0">
                          <div className="d-flex justify-content-between align-items-center mb-0.5">
                            <h6 className="mb-0 text-truncate fw-bold text-dark fs-13">
                              {host?.name} {host?.surname || ""}
                            </h6>
                            {host?.uniqueId && (
                              <span className="fs-10 text-muted">#{host.uniqueId}</span>
                            )}
                          </div>
                          <div className="d-flex align-items-center gap-1.5 flex-wrap mt-0.5">
                            {host.flavor && (
                              <span
                                className="badge px-1.5 py-0.5 rounded-pill fs-10 border"
                                style={{
                                  backgroundColor: flavorCfg.bg,
                                  color: flavorCfg.text,
                                  borderColor: flavorCfg.border,
                                }}
                              >
                                {host.flavor}
                              </span>
                            )}
                            <span className="fs-11 text-muted text-truncate">
                              {host?.tagline || host?.occupation || "AI Host"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                /* AI EXPERTS LIST */
                loadingExperts ? (
                  <div className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-info me-2"></div>
                    Loading AI Experts...
                  </div>
                ) : filteredExperts.length === 0 ? (
                  <div className="text-center py-5 text-muted fs-14">
                    <p className="mb-2">No AI Experts found.</p>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-info rounded-pill"
                      onClick={() => router.push("/AddAiExpert")}
                    >
                      + Create AI Expert
                    </button>
                  </div>
                ) : (
                  filteredExperts.map((exp: AiExpert) => {
                    const isSelected = selectedExpert?.id === exp?.id;
                    const isFemale = exp?.gender === "female";

                    return (
                      <div
                        key={exp?.id}
                        className={`d-flex align-items-center p-3 border-bottom cursor-pointer transition-all ${
                          isSelected ? "bg-light border-start border-4 border-info" : ""
                        }`}
                        style={{
                          backgroundColor: isSelected ? "#F0F9FF" : "transparent",
                          cursor: "pointer",
                        }}
                        onClick={() => setSelectedExpert(exp)}
                      >
                        <div
                          className="d-flex align-items-center justify-content-center text-white fw-bold shadow-sm me-3 flex-shrink-0"
                          style={{
                            width: "46px",
                            height: "46px",
                            borderRadius: "10px",
                            backgroundColor: isFemale ? "#db2777" : "#0284c7",
                            fontSize: "16px",
                          }}
                        >
                          {exp?.name ? exp.name.slice(0, 1) : "E"}
                        </div>

                        <div className="flex-grow-1 min-w-0">
                          <div className="d-flex justify-content-between align-items-center mb-0.5">
                            <h6 className="mb-0 text-truncate fw-bold text-dark fs-13">
                              {exp?.name} {exp?.surname || ""}
                            </h6>
                            <span
                              className="badge px-1.5 py-0.5 fs-10"
                              style={{
                                backgroundColor: "#ede9fe",
                                color: "#6d28d9",
                                borderRadius: "3px",
                              }}
                            >
                              {exp?.specialty || "Expert"}
                            </span>
                          </div>
                          <div className="text-muted fs-11 text-truncate">
                            <span className="fw-semibold text-secondary">
                              {exp?.category || "Advisor"}
                            </span>
                            {exp?.tagline && ` • ${exp.tagline}`}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              )}
            </div>
          </div>

          {/* ================= RIGHT CHAT WINDOW ================= */}
          <div className="col-12 col-md-8 col-lg-9 d-flex flex-column h-100 bg-white">
            {activePersonaId ? (
              <>
                {/* Chat Top Header */}
                <div
                  className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light"
                  style={{ borderColor: "#E9EDEF" }}
                >
                  <div className="d-flex align-items-center gap-3">
                    {activeTab === "hosts" ? (
                      (() => {
                        const isSelectedFemale =
                          selectedAiHost?.gender?.toLowerCase() === "female";
                        const selectedDefaultAvatar = isSelectedFemale
                          ? female.src
                          : male.src;
                        const hasSelectedCustomImage =
                          selectedAiHost?.image &&
                          typeof selectedAiHost.image === "string" &&
                          selectedAiHost.image.trim() !== "" &&
                          !selectedAiHost.image.endsWith("male.png") &&
                          !selectedAiHost.image.endsWith("female.png");
                        const headerAvatarSrc =
                          hasSelectedCustomImage && selectedAiHost?.image
                            ? selectedAiHost.image.startsWith("http")
                              ? selectedAiHost.image
                              : baseURL + selectedAiHost.image.replace(/\\/g, "/")
                            : selectedDefaultAvatar;

                        return (
                          <img
                            src={headerAvatarSrc}
                            onError={(e: any) => {
                              e.currentTarget.src = selectedDefaultAvatar;
                            }}
                            alt={selectedAiHost?.name}
                            className="rounded-circle object-fit-cover shadow-sm"
                            style={{ width: "44px", height: "44px" }}
                          />
                        );
                      })()
                    ) : (
                      <div
                        className="d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "10px",
                          backgroundColor:
                            selectedExpert?.gender === "female" ? "#db2777" : "#0284c7",
                          fontSize: "16px",
                        }}
                      >
                        {selectedExpert?.name ? selectedExpert.name.slice(0, 1) : "E"}
                      </div>
                    )}

                    <div>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <h6 className="mb-0 fw-bold fs-15 text-dark">
                          {activePersonaName}{" "}
                          {activeTab === "hosts"
                            ? selectedAiHost?.surname || ""
                            : selectedExpert?.surname || ""}
                        </h6>
                        {activeTab === "hosts" ? (
                          <>
                            {selectedAiHost?.flavor && (
                              <span
                                className="badge px-2 py-0.5 rounded-pill fs-10 border"
                                style={{
                                  backgroundColor:
                                    FLAVOR_COLORS[selectedAiHost.flavor]?.bg || "#ede9fe",
                                  color:
                                    FLAVOR_COLORS[selectedAiHost.flavor]?.text || "#7c3aed",
                                  borderColor:
                                    FLAVOR_COLORS[selectedAiHost.flavor]?.border || "#ddd6fe",
                                }}
                              >
                                {selectedAiHost.flavor}
                              </span>
                            )}
                            {selectedAiHost?.uniqueId && (
                              <span className="badge bg-secondary-subtle text-secondary fs-10">
                                #{selectedAiHost.uniqueId}
                              </span>
                            )}
                          </>
                        ) : (
                          <span
                            className="badge bg-info text-white fs-10"
                            style={{ borderRadius: "3px" }}
                          >
                            {selectedExpert?.specialty ||
                              selectedExpert?.category ||
                              "Expert"}
                          </span>
                        )}
                      </div>
                      <span className="fs-12 text-success d-flex align-items-center gap-1 mt-0.5">
                        <i className="ri-checkbox-blank-circle-fill fs-8"></i>
                        {activeTab === "hosts"
                          ? `Online • Rate: ${selectedAiHost?.chatRate || selectedAiHost?.chat_rate || 5} coins/min`
                          : `Online • ${selectedExpert?.category || "Topic Advisor"}`}
                      </span>
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div className="d-flex align-items-center gap-2">
                    {activeTab === "hosts" && selectedAiHost && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-info rounded-pill px-3 py-1.5 d-flex align-items-center gap-1.5 shadow-sm bg-white"
                        onClick={() => setQaModalHost(selectedAiHost)}
                        title="Run automated 10-point QA benchmark on this host"
                      >
                        <FaVial />
                        <span className="fs-12 fw-semibold">QA Benchmark</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger rounded-pill px-2.5 py-1.5 d-flex align-items-center gap-1 shadow-sm bg-white"
                      onClick={handleResetChat}
                      title="Reset chat sandbox history"
                    >
                      <FaTrashAlt />
                      <span className="fs-12">Reset</span>
                    </button>
                  </div>
                </div>

                {/* Messages Scroll View */}
                <div
                  className="flex-grow-1 overflow-auto p-4"
                  style={{
                    backgroundColor: "#f8f9fa",
                    backgroundImage: "radial-gradient(#0000000a 1px, transparent 0)",
                    backgroundSize: "20px 20px",
                  }}
                >
                  <div className="text-center mb-4">
                    <span className="badge bg-white text-muted shadow-sm px-3 py-1.5 rounded-pill fs-11 border">
                      TODAY •{" "}
                      {activeTab === "hosts"
                        ? `AI HOST: ${selectedAiHost?.name?.toUpperCase() || ""} (${selectedAiHost?.flavor || "General"})`
                        : "EXPERT ADVISOR CHAT"}
                    </span>
                  </div>

                  {currentMessages.map((msg) => {
                    const isUser = msg.sender === "user";
                    return (
                      <div
                        key={msg.id}
                        className={`d-flex mb-3 ${
                          isUser ? "justify-content-end" : "justify-content-start"
                        }`}
                      >
                        <div
                          className={`p-3 rounded-3 shadow-sm position-relative ${
                            isUser ? "text-white" : "bg-white text-dark border"
                          }`}
                          style={{
                            maxWidth: "70%",
                            backgroundColor: isUser
                              ? activeTab === "hosts"
                                ? "#8F6DFF"
                                : "#0284c7"
                              : "#FFFFFF",
                            borderRadius: isUser
                              ? "12px 12px 0px 12px"
                              : "12px 12px 12px 0px",
                          }}
                        >
                          <p className="mb-1 fs-14" style={{ whiteSpace: "pre-wrap" }}>
                            {cleanQuoteText(msg.text)}
                          </p>
                          <div className="d-flex justify-content-end align-items-center gap-1 mt-1">
                            <span
                              className={`fs-10 ${
                                isUser ? "text-white-50" : "text-muted"
                              }`}
                            >
                              {msg.time}
                            </span>
                            {isUser && (
                              <i className="ri-check-double-line text-white fs-14"></i>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* AI Typing Indicator */}
                  {isTyping && (
                    <div className="d-flex justify-content-start mb-3">
                      <div
                        className="bg-white text-dark border p-3 rounded-3 shadow-sm"
                        style={{ borderRadius: "12px 12px 12px 0px" }}
                      >
                        <div className="d-flex align-items-center gap-1">
                          <span
                            className="spinner-grow spinner-grow-sm text-primary"
                            style={{ width: "6px", height: "6px" }}
                          ></span>
                          <span
                            className="spinner-grow spinner-grow-sm text-primary ms-1"
                            style={{ width: "6px", height: "6px" }}
                          ></span>
                          <span
                            className="spinner-grow spinner-grow-sm text-primary ms-1"
                            style={{ width: "6px", height: "6px" }}
                          ></span>
                          <span className="fs-12 text-muted ms-2">
                            {activePersonaName || "AI"} is typing...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Quick Templates Bar */}
                {activeTemplates.length > 0 && (
                  <div className="px-3 py-2 bg-light border-top d-flex align-items-center gap-2 overflow-auto">
                    <span className="fs-11 fw-bold text-muted text-uppercase flex-shrink-0">
                      {activeTab === "hosts"
                        ? "⚡ Quick Openers:"
                        : "💡 Suggested Questions:"}
                    </span>
                    {activeTemplates.map((tmpl, idx) => (
                      <button
                        key={idx}
                        className="btn btn-xs btn-white border shadow-sm rounded-pill text-truncate text-dark px-3 py-1 fs-12 flex-shrink-0"
                        style={{ maxWidth: "260px" }}
                        onClick={() => handleSendMessage(tmpl)}
                      >
                        {tmpl}
                      </button>
                    ))}
                  </div>
                )}

                {/* Chat Input Bar */}
                <div className="p-3 bg-light border-top d-flex align-items-center gap-2">
                  <input
                    type="text"
                    className="form-control bg-white px-4 border shadow-sm fs-13"
                    style={{ borderRadius: "6px" }}
                    placeholder={`Type a message to ${activePersonaName || "AI"}...`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    disabled={isTyping}
                  />

                  <button
                    className="btn text-white d-flex align-items-center justify-content-center flex-shrink-0 shadow"
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "6px",
                      backgroundColor: activeTab === "hosts" ? "#8F6DFF" : "#0284c7",
                    }}
                    onClick={() => handleSendMessage()}
                    disabled={isTyping || !inputText.trim()}
                  >
                    <i className="ri-send-plane-2-fill text-white fs-18"></i>
                  </button>
                </div>
              </>
            ) : (
              /* No Persona Selected State */
              <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-muted p-5">
                <i className="ri-chat-smile-2-line fs-60 text-primary mb-3 opacity-50"></i>
                <h5 className="fw-bold text-dark">AI Chat Sandbox</h5>
                <p className="fs-14 text-center" style={{ maxWidth: "420px" }}>
                  Select an AI Host or AI Expert from the sidebar list to test direct 1-on-1 persona chat and response speed.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QA Benchmark Modal */}
      {qaModalHost && (
        <HostQAModal host={qaModalHost} onClose={() => setQaModalHost(null)} />
      )}
    </>
  );
};

AiChat.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default AiChat;
