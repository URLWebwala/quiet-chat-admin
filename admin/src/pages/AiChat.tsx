import React, { useEffect, useState, useRef } from "react";
import RootLayout from "@/component/layout/Layout";
import Title from "@/extra/Title";
import male from "@/assets/images/male.png";
import female from "@/assets/images/female.png";
import AiChatIcon from "@/assets/images/aiChat";
import { getMessage, getRealOrFakeHost } from "@/store/hostSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootStore } from "@/store/store";
import { baseURL } from "@/utils/config";
import {
  createAiConversation,
  sendAiMessage,
  fetchConversations,
  fetchAiProfiles,
  createAiProfile,
  AiConversation,
} from "@/utils/aiChatApi";

interface ChatMessage {
  id: string;
  sender: "user" | "host";
  text: string;
  time: string;
  status?: "sent" | "delivered" | "read";
}

const AiChat = () => {
  const dispatch = useDispatch();
  const { fakeHost, isLoading }: any = useSelector((state: RootStore) => state.host);

  const [selectedHost, setSelectedHost] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const [maleTemplates, setMaleTemplates] = useState<string[]>([]);
  const [femaleTemplates, setFemaleTemplates] = useState<string[]>([]);

  // Track active AI backend conversation per host ID
  const [conversationsMap, setConversationsMap] = useState<{ [hostId: string]: string }>({});
  const [isTyping, setIsTyping] = useState<boolean>(false);
  
  // Store chat history per host ID
  const [chats, setChats] = useState<{ [hostId: string]: ChatMessage[] }>({});
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch AI Hosts on mount
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
  }, [dispatch]);

  // Set default selected host when fakeHost list is loaded
  useEffect(() => {
    if (fakeHost && fakeHost.length > 0 && !selectedHost) {
      setSelectedHost(fakeHost[0]);
    }
  }, [fakeHost]);

  // Scroll chat to bottom on new message or typing state change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, selectedHost, isTyping]);

  const initExistingConversations = async () => {
    try {
      const convos = await fetchConversations();
      if (Array.isArray(convos)) {
        const map: { [hostId: string]: string } = {};
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
  const filteredHosts = (fakeHost || []).filter((host: any) => {
    const matchesSearch =
      (host?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (host?.uniqueId || "").toString().toLowerCase().includes(search.toLowerCase());
    
    const matchesGender =
      genderFilter === "all" ||
      (host?.gender || "").toLowerCase() === genderFilter;

    return matchesSearch && matchesGender;
  });

  // Get active host's templates
  const activeTemplates =
    selectedHost?.gender?.toLowerCase() === "male"
      ? maleTemplates
      : femaleTemplates;

  // Current chat messages for selected host
  const currentMessages: ChatMessage[] = selectedHost?._id
    ? chats[selectedHost._id] || [
        {
          id: "welcome-1",
          sender: "host",
          text: cleanQuoteText(selectedHost?.openingLine) || `Hi there! I am ${selectedHost?.name || "AI Host"}. How can I help you today? ✨`,
          time: "10:00 AM",
        },
      ]
    : [];

  const VALID_NATURES = ["Smart", "Confident", "Shy", "Friendly", "Funny", "Insecure", "Jealous", "Lazy", "Stubborn"];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !selectedHost?._id) return;

    const hostId = selectedHost._id;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "read",
    };

    setChats((prev) => ({
      ...prev,
      [hostId]: [...(prev[hostId] || currentMessages), newMsg],
    }));

    if (!textToSend) setInputText("");
    setIsTyping(true);

    try {
      // 1. Resolve Python AI profile ID
      let convoId = conversationsMap[hostId];
      if (!convoId) {
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
            setConversationsMap((prev) => ({ ...prev, [hostId]: convoId }));
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
          responseBubbles = [{ text: aiResponse.reply, delay_ms: 1500 }];
        }
      }

      // 2. Fallback to random persona template if AI backend is offline or reply empty
      if (responseBubbles.length === 0) {
        const templates =
          selectedHost?.gender?.toLowerCase() === "male" ? maleTemplates : femaleTemplates;
        const fallbackText =
          templates.length > 0
            ? templates[Math.floor(Math.random() * templates.length)]
            : "Thanks for messaging me! 💖";

        responseBubbles = [{ text: fallbackText, delay_ms: 1200 }];
      }

      // 3. Render each message bubble with its precise delay calculated by the Python backend
      for (let i = 0; i < responseBubbles.length; i++) {
        const bubble = responseBubbles[i];
        const bubbleDelay = bubble.delay_ms || 1200;

        setIsTyping(true);
        await new Promise((res) => setTimeout(res, Math.min(Math.max(bubbleDelay, 600), 15000)));

        const aiReplyMsg: ChatMessage = {
          id: (Date.now() + i + 1).toString(),
          sender: "host",
          text: cleanQuoteText(bubble.text),
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setChats((prev) => ({
          ...prev,
          [hostId]: [...(prev[hostId] || []), aiReplyMsg],
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
        <Title name="AI Chat" />
      </div>

      {/* Main Chat Layout Container with Proper Visible Border */}
      <div
        className="card shadow-sm rounded-4 overflow-hidden mb-4"
        style={{
          height: "calc(100vh - 170px)",
          minHeight: "520px",
          backgroundColor: "#F0F2F5",
          border: "1px solid #CBD5E1"
        }}
      >
        <div className="row g-0 h-100">
          
          {/* ================= LEFT SIDEBAR: AI HOST LIST ================= */}
          <div
            className="col-12 col-md-4 col-lg-3 border-end bg-white d-flex flex-column h-100"
            style={{ borderColor: "#E9EDEF" }}
          >
            {/* Sidebar Top Header */}
            <div className="p-3 border-bottom bg-white d-flex flex-column gap-3" style={{ borderColor: "#E2E8F0" }}>
              {/* Header Title & Badge */}
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-bold fs-16 text-dark d-flex align-items-center gap-2">
                  <span className="text-primary d-flex align-items-center">
                    <AiChatIcon />
                  </span>
                  <span>AI Hosts</span>
                </span>
                <span
                  className="badge rounded-pill px-2.5 py-1 fs-12 fw-semibold"
                  style={{ backgroundColor: "#F1F5F9", color: "#475569" }}
                >
                  {filteredHosts.length} Hosts
                </span>
              </div>

              {/* Search Box */}
              <div className="position-relative">
                <i
                  className="ri-search-line position-absolute top-50 start-0 translate-middle-y ms-3 text-muted fs-15"
                ></i>
                <input
                  type="text"
                  className="form-control ps-5 pe-4 py-2 bg-light border-0 rounded-pill fs-13"
                  placeholder="Search AI Host name or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}
                />
                {search && (
                  <i
                    className="ri-close-circle-fill position-absolute top-50 end-0 translate-middle-y me-3 text-muted cursor-pointer fs-15"
                    onClick={() => setSearch("")}
                  ></i>
                )}
              </div>

              {/* Segmented Filter Control */}
              <div
                className="d-flex p-1 rounded-pill border"
                style={{ backgroundColor: "#F1F5F9", borderColor: "#E2E8F0" }}
              >
                <button
                  type="button"
                  className={`btn btn-sm flex-fill rounded-pill py-1.5 fs-12 fw-semibold transition-all ${
                    genderFilter === "all"
                      ? "text-white shadow-sm"
                      : "text-muted border-0 bg-transparent"
                  }`}
                  style={genderFilter === "all" ? { backgroundColor: "#8F6DFF" } : {}}
                  onClick={() => setGenderFilter("all")}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`btn btn-sm flex-fill rounded-pill py-1.5 fs-12 fw-semibold transition-all ${
                    genderFilter === "female"
                      ? "text-white shadow-sm"
                      : "text-muted border-0 bg-transparent"
                  }`}
                  style={genderFilter === "female" ? { backgroundColor: "#EC4899" } : {}}
                  onClick={() => setGenderFilter("female")}
                >
                  Female
                </button>
                <button
                  type="button"
                  className={`btn btn-sm flex-fill rounded-pill py-1.5 fs-12 fw-semibold transition-all ${
                    genderFilter === "male"
                      ? "text-white shadow-sm"
                      : "text-muted border-0 bg-transparent"
                  }`}
                  style={genderFilter === "male" ? { backgroundColor: "#3B82F6" } : {}}
                  onClick={() => setGenderFilter("male")}
                >
                  Male
                </button>
              </div>
            </div>

            {/* AI Host List */}
            <div className="flex-grow-1 overflow-auto">
              {isLoading ? (
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
                        isSelected ? "bg-light border-start border-4 border-primary" : "hover-bg-light"
                      }`}
                      style={{
                        backgroundColor: isSelected ? "#F0F2F5" : "transparent",
                        cursor: "pointer",
                      }}
                      onClick={() => setSelectedHost(host)}
                    >
                      {/* Host Avatar with online dot */}
                      <div className="position-relative flex-shrink-0 me-3">
                        <img
                          src={avatarSrc}
                          onError={(e: any) => {
                            e.currentTarget.src = defaultAvatar;
                          }}
                          alt={host?.name}
                          className="rounded-circle object-fit-cover"
                          style={{ width: "45px", height: "45px" }}
                        />
                        <span
                          className={`position-absolute bottom-0 end-0 p-1 rounded-circle border border-2 border-white ${
                            host?.isOnline !== false ? "bg-success" : "bg-secondary"
                          }`}
                          style={{ width: "12px", height: "12px" }}
                        ></span>
                      </div>

                      {/* Host Details */}
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <h6 className="mb-0 text-truncate fw-bold text-dark fs-14">
                            {host?.name || "AI Host"}
                          </h6>
                          <span className="fs-11 text-muted">ID: {host?.uniqueId || "-"}</span>
                        </div>
                        <div className="d-flex align-items-center gap-1 text-muted fs-12">
                          <span
                            className={`badge px-1.5 py-0.5 rounded fs-10 ${
                              host?.gender?.toLowerCase() === "female"
                                ? "bg-light-pink text-pink"
                                : "bg-light-primary text-primary"
                            }`}
                            style={
                              host?.gender?.toLowerCase() === "female"
                                ? { color: "#EC4899", backgroundColor: "#FCE7F3" }
                                : {}
                            }
                          >
                            {host?.gender || "AI"}
                          </span>
                          <span className="text-truncate">
                            {host?.impression ? String(host.impression).split(",")[0] : "Online AI Host"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ================= RIGHT CHAT WINDOW ================= */}
          <div className="col-12 col-md-8 col-lg-9 d-flex flex-column h-100 bg-white">
            {selectedHost ? (
              <>
                {/* Chat Top Header */}
                <div
                  className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light"
                  style={{ borderColor: "#E9EDEF" }}
                >
                  <div className="d-flex align-items-center gap-3">
                    {(() => {
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
                    })()}
                    <div>
                      <h6 className="mb-0 fw-bold fs-15 text-dark">
                        {selectedHost?.name}{" "}
                        <span className="badge bg-secondary fs-10 ms-1">#{selectedHost?.uniqueId}</span>
                      </h6>
                      <span className="fs-12 text-success d-flex align-items-center gap-1">
                        <i className="ri-checkbox-blank-circle-fill fs-8"></i> Online • AI Host Bot
                      </span>
                    </div>
                  </div>
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
                      TODAY
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
                            backgroundColor: isUser ? "#8F6DFF" : "#FFFFFF",
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
                          <span className="fs-12 text-muted ms-2">{selectedHost?.name || "AI Host"} is typing...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Quick Auto-Reply Templates Bar */}
                {activeTemplates.length > 0 && (
                  <div className="px-3 py-2 bg-light border-top d-flex align-items-center gap-2 overflow-auto">
                    <span className="fs-11 fw-bold text-muted text-uppercase flex-shrink-0">
                      ⚡ Quick AI Templates:
                    </span>
                    {activeTemplates.slice(0, 6).map((tmpl, idx) => (
                      <button
                        key={idx}
                        className="btn btn-xs btn-white border shadow-sm rounded-pill text-truncate text-dark px-3 py-1 fs-12 flex-shrink-0"
                        style={{ maxWidth: "200px" }}
                        onClick={() => handleSendMessage(tmpl)}
                      >
                        {tmpl}
                      </button>
                    ))}
                  </div>
                )}

                {/* Chat Input Bar */}
                <div className="p-3 bg-light border-top d-flex align-items-center gap-2">
                  <button className="btn btn-link text-muted p-1 fs-20">
                    <i className="ri-emotion-happy-line"></i>
                  </button>

                  <input
                    type="text"
                    className="form-control rounded-pill bg-white px-4 border-1 shadow-sm"
                    placeholder={`Type a message to ${selectedHost?.name || "AI Host"}...`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    disabled={isTyping}
                  />

                  <button
                    className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow"
                    style={{ width: "42px", height: "42px" }}
                    onClick={() => handleSendMessage()}
                    disabled={isTyping}
                  >
                    <i className="ri-send-plane-2-fill text-white fs-18"></i>
                  </button>
                </div>
              </>
            ) : (
              /* No Host Selected State */
              <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-muted p-5">
                <i className="ri-chat-smile-2-line fs-60 text-primary mb-3 opacity-50"></i>
                <h5 className="fw-bold text-dark">AI Host Chat Window</h5>
                <p className="fs-14">Select an AI Host from the sidebar list to view conversation history or start chatting.</p>
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
