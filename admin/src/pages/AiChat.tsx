import React, { useEffect, useState, useRef, useMemo } from "react";
import RootLayout from "@/component/layout/Layout";
import Title from "@/extra/Title";
import male from "@/assets/images/male.png";
import female from "@/assets/images/female.png";
import AiChatIcon from "@/assets/images/aiChat";
import { getMessage, getRealOrFakeHost } from "@/store/hostSlice";
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
  AiExpert,
} from "@/utils/aiChatApi";
import { FaUserGraduate } from "react-icons/fa";

interface ChatMessage {
  id: string;
  sender: "user" | "host";
  text: string;
  time: string;
  status?: "sent" | "delivered" | "read";
}

const AiChat = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { fakeHost, isLoading }: any = useSelector((state: RootStore) => state.host);

  // Tab State: "hosts" or "experts"
  const [activeTab, setActiveTab] = useState<"hosts" | "experts">("hosts");

  // Selection
  const [selectedHost, setSelectedHost] = useState<any>(null);
  const [selectedExpert, setSelectedExpert] = useState<AiExpert | null>(null);

  // Experts list
  const [experts, setExperts] = useState<AiExpert[]>([]);
  const [loadingExperts, setLoadingExperts] = useState<boolean>(false);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const [maleTemplates, setMaleTemplates] = useState<string[]>([]);
  const [femaleTemplates, setFemaleTemplates] = useState<string[]>([]);

  // Track active AI backend conversation per ID
  const [conversationsMap, setConversationsMap] = useState<{ [id: string]: string }>({});
  const [isTyping, setIsTyping] = useState<boolean>(false);
  
  // Store chat history per persona ID (host ID or expert ID)
  const [chats, setChats] = useState<{ [id: string]: ChatMessage[] }>({});
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch AI Hosts & Experts on mount
  useEffect(() => {
    dispatch(
      getRealOrFakeHost({
        start: 1,
        limit: 100,
        startDate: "All",
        endDate: "All",
        search: "",
        type: 2,
      })
    );
    loadTemplates();
    initExistingConversations();
    loadExpertsList();
  }, [dispatch]);

  const loadExpertsList = async () => {
    setLoadingExperts(true);
    try {
      const data = await fetchAiExperts();
      setExperts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn("Could not load AI experts for chat:", e);
    } finally {
      setLoadingExperts(false);
    }
  };

  // Handle URL Query parameters (e.g. /AiChat?expertId=xxx or /AiChat?hostId=yyy)
  useEffect(() => {
    if (!router.isReady) return;
    const { expertId, hostId } = router.query;

    if (expertId && experts.length > 0) {
      const targetExp = experts.find((e) => String(e.id) === String(expertId) || String(e._id) === String(expertId));
      if (targetExp) {
        setActiveTab("experts");
        setSelectedExpert(targetExp);
      }
    } else if (hostId && fakeHost && fakeHost.length > 0) {
      const targetHost = fakeHost.find((h: any) => String(h._id) === String(hostId));
      if (targetHost) {
        setActiveTab("hosts");
        setSelectedHost(targetHost);
      }
    }
  }, [router.isReady, router.query, experts, fakeHost]);

  // Set default selected host or expert
  useEffect(() => {
    if (activeTab === "hosts" && fakeHost && fakeHost.length > 0 && !selectedHost) {
      setSelectedHost(fakeHost[0]);
    } else if (activeTab === "experts" && experts.length > 0 && !selectedExpert) {
      setSelectedExpert(experts[0]);
    }
  }, [activeTab, fakeHost, experts, selectedHost, selectedExpert]);

  // Scroll chat to bottom on new message or typing state change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, selectedHost, selectedExpert, isTyping, activeTab]);

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

  const loadTemplates = async () => {
    try {
      const maleRes = await dispatch(getMessage({ gender: 1 }));
      const femaleRes = await dispatch(getMessage({ gender: 2 }));

      const maleRaw = maleRes?.payload?.data?.message;
      const femaleRaw = femaleRes?.payload?.data?.message;

      const cleanItem = (m: string) => cleanQuoteText(m);

      if (Array.isArray(maleRaw)) {
        setMaleTemplates(maleRaw.map(cleanItem).filter(Boolean));
      } else if (typeof maleRaw === "string") {
        setMaleTemplates(maleRaw.split(",").map(cleanItem).filter(Boolean));
      }

      if (Array.isArray(femaleRaw)) {
        setFemaleTemplates(femaleRaw.map(cleanItem).filter(Boolean));
      } else if (typeof femaleRaw === "string") {
        setFemaleTemplates(femaleRaw.split(",").map(cleanItem).filter(Boolean));
      }
    } catch (err) {
      console.error("Failed to load message templates:", err);
    }
  };

  // Filter AI Host list
  const filteredHosts = useMemo(() => {
    return (fakeHost || []).filter((host: any) => {
      const matchesSearch =
        (host?.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (host?.uniqueId || "").toString().toLowerCase().includes(search.toLowerCase());
      
      const matchesGender =
        genderFilter === "all" ||
        (host?.gender || "").toLowerCase() === genderFilter;

      return matchesSearch && matchesGender;
    });
  }, [fakeHost, search, genderFilter]);

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
        genderFilter === "all" ||
        (exp?.gender || "").toLowerCase() === genderFilter;

      return matchesSearch && matchesGender;
    });
  }, [experts, search, genderFilter]);

  // Get active templates or expert advice suggestions
  const activeTemplates = useMemo(() => {
    if (activeTab === "experts" && selectedExpert) {
      const suggestions: string[] = [];
      if (selectedExpert.tagline) suggestions.push(selectedExpert.tagline);
      if (selectedExpert.specialty) suggestions.push(`How do I deal with ${selectedExpert.specialty.toLowerCase()}?`);
      if (selectedExpert.category) suggestions.push(`Can you guide me on ${selectedExpert.category.toLowerCase()}?`);
      if (selectedExpert.values) suggestions.push(selectedExpert.values);
      return suggestions.slice(0, 4);
    }

    return selectedHost?.gender?.toLowerCase() === "male"
      ? maleTemplates
      : femaleTemplates;
  }, [activeTab, selectedHost, selectedExpert, maleTemplates, femaleTemplates]);

  // Current active persona details
  const activePersonaId = activeTab === "hosts" ? selectedHost?._id : selectedExpert?.id;
  const activePersonaName = activeTab === "hosts" ? selectedHost?.name : selectedExpert?.name;
  const activePersonaGender = activeTab === "hosts" ? selectedHost?.gender : selectedExpert?.gender;

  // Current chat messages for selected persona
  const currentMessages: ChatMessage[] = activePersonaId
    ? chats[activePersonaId] || [
        {
          id: "welcome-1",
          sender: "host",
          text:
            activeTab === "hosts"
              ? cleanQuoteText(selectedHost?.openingLine) ||
                `Hi there! I am ${selectedHost?.name || "AI Host"}. How can I help you today? ✨`
              : selectedExpert?.greeting ||
                selectedExpert?.tagline ||
                `Hello! I am ${selectedExpert?.name || "Advisor"}, your ${
                  selectedExpert?.specialty || selectedExpert?.category || "topic"
                } advisor. What's on your mind today? 🎓`,
          time: "10:00 AM",
        },
      ]
    : [];

  const VALID_NATURES = ["Smart", "Confident", "Shy", "Friendly", "Funny", "Insecure", "Jealous", "Lazy", "Stubborn"];

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
      let convoId = conversationsMap[personaId];

      // 1. If conversation is not established yet, create it
      if (!convoId) {
        if (activeTab === "hosts") {
          const pythonProfiles = await fetchAiProfiles();
          let targetProfile = pythonProfiles.find(
            (p: any) => p.name?.toLowerCase() === selectedHost?.name?.toLowerCase()
          );

          if (!targetProfile) {
            let personalityArr = ["Friendly"];
            if (Array.isArray(selectedHost?.personality)) {
              const valid = selectedHost.personality.filter((p: string) => VALID_NATURES.includes(p));
              if (valid.length > 0) personalityArr = valid;
            } else if (typeof selectedHost?.personality === "string") {
              const parts = selectedHost.personality.split(",").map((s: string) => s.trim());
              const valid = parts.filter((p: string) => VALID_NATURES.includes(p));
              if (valid.length > 0) personalityArr = valid;
            }

            targetProfile = await createAiProfile({
              name: selectedHost?.name || "AI Host",
              gender: selectedHost?.gender?.toLowerCase() === "male" ? "male" : "female",
              age: selectedHost?.age || 22,
              bio: selectedHost?.bio || selectedHost?.openingLine || "AI Host",
              greeting: selectedHost?.openingLine || "Hi there!",
              personality: personalityArr,
              language: "English",
            });
          }

          const targetObj: any = targetProfile;
          const pythonProfileId = targetObj?.id || targetObj?._id || targetObj?.profile_id;
          if (pythonProfileId) {
            const newConvo = await createAiConversation(
              pythonProfileId,
              "Admin",
              selectedHost?.gender?.toLowerCase() === "male" ? "female" : "male"
            );
            if (newConvo?.conversation_id) {
              convoId = newConvo.conversation_id;
              setConversationsMap((prev) => ({ ...prev, [personaId]: convoId }));
            }
          }
        } else if (activeTab === "experts" && selectedExpert?.id) {
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
      }

      let responseBubbles: { text: string; delay_ms?: number }[] = [];

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

      // 2. Fallback if AI backend is offline or reply empty
      if (responseBubbles.length === 0) {
        if (activeTab === "hosts") {
          const templates =
            selectedHost?.gender?.toLowerCase() === "male" ? maleTemplates : femaleTemplates;
          const fallbackText =
            templates.length > 0
              ? templates[Math.floor(Math.random() * templates.length)]
              : "Thanks for messaging me! 💖";
          responseBubbles = [{ text: fallbackText, delay_ms: 1000 }];
        } else {
          const fallbackText = selectedExpert?.tagline
            ? `I hear you. Remember: ${selectedExpert.tagline} How would you like to proceed?`
            : `That's a very important point. Let's break it down step-by-step to find the right solution for you.`;
          responseBubbles = [{ text: fallbackText, delay_ms: 1000 }];
        }
      }

      // 3. Render message bubbles with smooth typing delay
      for (let i = 0; i < responseBubbles.length; i++) {
        const bubble = responseBubbles[i];
        const bubbleDelay = bubble.delay_ms || 1000;

        setIsTyping(true);
        await new Promise((res) => setTimeout(res, Math.min(Math.max(bubbleDelay, 500), 12000)));

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

      {/* Main Chat Layout Container */}
      <div
        className="card shadow-sm rounded-4 overflow-hidden mb-4"
        style={{
          height: "calc(100vh - 170px)",
          minHeight: "540px",
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
            <div className="p-3 border-bottom bg-white d-flex flex-column gap-2" style={{ borderColor: "#E2E8F0" }}>
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
                    {fakeHost?.length || 0}
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
                <i
                  className="ri-search-line position-absolute top-50 start-0 translate-middle-y ms-3 text-muted fs-15"
                ></i>
                <input
                  type="text"
                  className="form-control ps-5 pe-4 py-1.5 bg-light border-0 fs-13"
                  placeholder={activeTab === "hosts" ? "Search AI Host name or ID..." : "Search expert, category, specialty..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "6px" }}
                />
                {search && (
                  <i
                    className="ri-close-circle-fill position-absolute top-50 end-0 translate-middle-y me-3 text-muted cursor-pointer fs-15"
                    onClick={() => setSearch("")}
                  ></i>
                )}
              </div>

              {/* Gender Filter Control */}
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
            </div>

            {/* Persona List: Hosts or Experts */}
            <div className="flex-grow-1 overflow-auto">
              {activeTab === "hosts" ? (
                /* AI HOSTS LIST */
                isLoading ? (
                  <div className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading AI Hosts...
                  </div>
                ) : filteredHosts.length === 0 ? (
                  <div className="text-center py-5 text-muted fs-14">
                    No AI Host found.
                  </div>
                ) : (
                  filteredHosts.map((host: any) => {
                    const isSelected = selectedHost?._id === host?._id;
                    const isFemale = host?.gender?.toLowerCase() === "female";
                    const defaultAvatar = isFemale ? female.src : male.src;

                    const hasCustomImage =
                      host?.image &&
                      typeof host.image === "string" &&
                      host.image.trim() !== "" &&
                      !host.image.endsWith("male.png") &&
                      !host.image.endsWith("female.png");

                    const avatarSrc = hasCustomImage
                      ? host.image.startsWith("http")
                        ? host.image
                        : baseURL + host.image.replace(/\\/g, "/")
                      : defaultAvatar;

                    return (
                      <div
                        key={host?._id}
                        className={`d-flex align-items-center p-3 border-bottom cursor-pointer transition-all ${
                          isSelected ? "bg-light border-start border-4 border-primary" : ""
                        }`}
                        style={{
                          backgroundColor: isSelected ? "#F0F2F5" : "transparent",
                          cursor: "pointer",
                        }}
                        onClick={() => setSelectedHost(host)}
                      >
                        <div className="position-relative flex-shrink-0 me-3">
                          <img
                            src={avatarSrc}
                            onError={(e: any) => {
                              e.currentTarget.src = defaultAvatar;
                            }}
                            alt={host?.name}
                            className="rounded-circle object-fit-cover"
                            style={{ width: "44px", height: "44px" }}
                          />
                          <span
                            className={`position-absolute bottom-0 end-0 p-1 rounded-circle border border-2 border-white ${
                              host?.isOnline !== false ? "bg-success" : "bg-secondary"
                            }`}
                            style={{ width: "11px", height: "11px" }}
                          ></span>
                        </div>

                        <div className="flex-grow-1 min-w-0">
                          <div className="d-flex justify-content-between align-items-center mb-0.5">
                            <h6 className="mb-0 text-truncate fw-bold text-dark fs-13">
                              {host?.name || "AI Host"}
                            </h6>
                            <span className="fs-11 text-muted">ID: {host?.uniqueId || "-"}</span>
                          </div>
                          <div className="d-flex align-items-center gap-1 text-muted fs-11">
                            <span
                              className="badge px-1.5 py-0.5 rounded fs-10"
                              style={{
                                color: isFemale ? "#db2777" : "#2563eb",
                                backgroundColor: isFemale ? "#fce7f3" : "#eff6ff",
                              }}
                            >
                              {host?.gender || "AI"}
                            </span>
                            <span className="text-truncate">
                              {host?.impression ? String(host.impression).split(",")[0] : "AI Persona"}
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
                    No AI Experts found.
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
                            width: "44px",
                            height: "44px",
                            borderRadius: "8px",
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
                              style={{ backgroundColor: "#ede9fe", color: "#6d28d9", borderRadius: "3px" }}
                            >
                              {exp?.specialty || "Expert"}
                            </span>
                          </div>
                          <div className="text-muted fs-11 text-truncate">
                            <span className="fw-semibold text-secondary">{exp?.category || "Advisor"}</span>
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
                        const isSelectedFemale = selectedHost?.gender?.toLowerCase() === "female";
                        const selectedDefaultAvatar = isSelectedFemale ? female.src : male.src;
                        const hasSelectedCustomImage =
                          selectedHost?.image &&
                          typeof selectedHost.image === "string" &&
                          selectedHost.image.trim() !== "" &&
                          !selectedHost.image.endsWith("male.png") &&
                          !selectedHost.image.endsWith("female.png");
                        const headerAvatarSrc = hasSelectedCustomImage
                          ? selectedHost.image.startsWith("http")
                            ? selectedHost.image
                            : baseURL + selectedHost.image.replace(/\\/g, "/")
                          : selectedDefaultAvatar;

                        return (
                          <img
                            src={headerAvatarSrc}
                            onError={(e: any) => {
                              e.currentTarget.src = selectedDefaultAvatar;
                            }}
                            alt={selectedHost?.name}
                            className="rounded-circle object-fit-cover"
                            style={{ width: "42px", height: "42px" }}
                          />
                        );
                      })()
                    ) : (
                      <div
                        className="d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "8px",
                          backgroundColor: selectedExpert?.gender === "female" ? "#db2777" : "#0284c7",
                          fontSize: "16px",
                        }}
                      >
                        {selectedExpert?.name ? selectedExpert.name.slice(0, 1) : "E"}
                      </div>
                    )}

                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <h6 className="mb-0 fw-bold fs-15 text-dark">
                          {activePersonaName}
                        </h6>
                        {activeTab === "hosts" ? (
                          <span className="badge bg-secondary fs-10">#{selectedHost?.uniqueId}</span>
                        ) : (
                          <span className="badge bg-info text-white fs-10" style={{ borderRadius: "3px" }}>
                            {selectedExpert?.specialty || selectedExpert?.category || "Expert"}
                          </span>
                        )}
                      </div>
                      <span className="fs-12 text-success d-flex align-items-center gap-1">
                        <i className="ri-checkbox-blank-circle-fill fs-8"></i>
                        {activeTab === "hosts" ? "Online • AI Dating Host" : `Online • ${selectedExpert?.category || "Topic Advisor"}`}
                      </span>
                    </div>
                  </div>

                  {activeTab === "experts" && selectedExpert?.tagline && (
                    <div className="d-none d-lg-block text-end" style={{ maxWidth: "350px" }}>
                      <small className="text-muted fst-italic fs-12 text-truncate d-block">
                        "{selectedExpert.tagline}"
                      </small>
                    </div>
                  )}
                </div>

                {/* Messages Scroll View */}
                <div
                  className="flex-grow-1 overflow-auto p-4"
                  style={{
                    backgroundColor: "#f8f9fa",
                    backgroundImage:
                      "radial-gradient(#0000000a 1px, transparent 0)",
                    backgroundSize: "20px 20px",
                  }}
                >
                  <div className="text-center mb-4">
                    <span className="badge bg-white text-muted shadow-sm px-3 py-1.5 rounded-pill fs-11 border">
                      TODAY • {activeTab === "hosts" ? "AI HOST CONVERSATION" : "EXPERT ADVISOR CHAT"}
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
                            backgroundColor: isUser ? (activeTab === "hosts" ? "#8F6DFF" : "#0284c7") : "#FFFFFF",
                            borderRadius: isUser
                              ? "12px 12px 0px 12px"
                              : "12px 12px 12px 0px",
                          }}
                        >
                          <p className="mb-1 fs-14" style={{ whiteSpace: "pre-wrap" }}>
                            {cleanQuoteText(msg.text)}
                          </p>
                          <div className="d-flex justify-content-end align-items-center gap-1 mt-1">
                            <span className={`fs-10 ${isUser ? "text-white-50" : "text-muted"}`}>{msg.time}</span>
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
                      <div className="bg-white text-dark border p-3 rounded-3 shadow-sm" style={{ borderRadius: "12px 12px 12px 0px" }}>
                        <div className="d-flex align-items-center gap-1">
                          <span className="spinner-grow spinner-grow-sm text-primary" style={{ width: "6px", height: "6px" }}></span>
                          <span className="spinner-grow spinner-grow-sm text-primary ms-1" style={{ width: "6px", height: "6px" }}></span>
                          <span className="spinner-grow spinner-grow-sm text-primary ms-1" style={{ width: "6px", height: "6px" }}></span>
                          <span className="fs-12 text-muted ms-2">{activePersonaName || "AI"} is typing...</span>
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
                      {activeTab === "hosts" ? "⚡ Quick AI Templates:" : "💡 Suggested Questions:"}
                    </span>
                    {activeTemplates.slice(0, 6).map((tmpl, idx) => (
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
                <p className="fs-14">
                  Select an AI Host or AI Expert from the sidebar list to test conversation replies.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

AiChat.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default AiChat;
