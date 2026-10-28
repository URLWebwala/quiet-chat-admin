import React, { useEffect, useState } from "react";
import RootLayout from "@/component/layout/Layout";
import { useRouter } from "next/router";
import { fetchSingleExpert, updateExpertChatRate, AiExpert } from "@/utils/aiChatApi";
import { FaRobot, FaCheck, FaCopy, FaComments, FaArrowLeft, FaEdit, FaCoins, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import { baseURL } from "@/utils/config";

const ExpertInfoPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [expert, setExpert] = useState<AiExpert | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedModalPrompt, setCopiedModalPrompt] = useState(false);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [chatRateInput, setChatRateInput] = useState<number>(5);
  const [savingRate, setSavingRate] = useState(false);

  useEffect(() => {
    if (id) {
      loadExpert(id as string);
    }
  }, [id]);

  const loadExpert = async (expertId: string) => {
    setLoading(true);
    try {
      const data = await fetchSingleExpert(expertId);
      if (data) {
        setExpert(data);
        setChatRateInput(
          data.chatRate !== undefined
            ? Number(data.chatRate)
            : data.chat_rate !== undefined
            ? Number(data.chat_rate)
            : 5
        );
      } else {
        toast.error("Expert not found");
      }
    } catch (error) {
      toast.error("Failed to load expert details");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRate = async () => {
    if (!expert) return;
    setSavingRate(true);
    try {
      const ok = await updateExpertChatRate(
        {
          name: expert.name,
          hostId: (expert as any).hostId || (expert as any)._id,
          expertId: expert.id,
        },
        chatRateInput
      );
      if (ok) {
        setExpert({
          ...expert,
          chatRate: chatRateInput,
          chat_rate: chatRateInput,
        });
        setIsEditingRate(false);
        toast.success("Chat rate updated successfully!");
      } else {
        toast.error("Failed to update chat rate");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update chat rate");
    } finally {
      setSavingRate(false);
    }
  };

  const handleCopyModalPrompt = () => {
    if (!expert?.prompt) return;
    navigator.clipboard.writeText(expert.prompt);
    setCopiedModalPrompt(true);
    toast.success("Prompt copied to clipboard!");
    setTimeout(() => setCopiedModalPrompt(false), 2000);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
        <h5 className="text-muted">Expert Not Found</h5>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        .info-field-label {
          font-size: 11.5px;
          text-transform: uppercase;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.5px;
          margin-bottom: 3px;
        }
        .info-field-value {
          font-size: 13.5px;
          color: #0f172a;
          font-weight: 500;
        }
        .info-field-box {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 10px 14px;
          height: 100%;
        }
      `}</style>
      <div className="p-4">
        <div className="d-flex align-items-center mb-4 gap-3">
          <button
            onClick={() => router.back()}
            className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
            style={{ width: "36px", height: "36px", padding: 0, borderRadius: "8px" }}
          >
            <FaArrowLeft />
          </button>
          <h4 className="fw-bold mb-0 text-dark">Expert Profile</h4>
        </div>

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          {/* Header */}
          <div className="card-header bg-light border-bottom p-4">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3">
                {expert.avatar_url || expert.image || expert.avatar ? (
                  <img
                    src={(expert.avatar_url || expert.image || expert.avatar || "").startsWith("http") ? (expert.avatar_url || expert.image || expert.avatar) : baseURL + (expert.avatar_url || expert.image || expert.avatar || "").replace(/\\/g, "/")}
                    alt={expert.name}
                    className="shadow-sm"
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "12px",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    className="d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "12px",
                      backgroundColor: expert.gender === "female" ? "#EC4899" : "#8F6DFF",
                      fontSize: "24px",
                    }}
                  >
                    {expert.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <h4 className="fw-bold mb-0 text-dark">
                      {expert.name} {expert.surname || ""}
                    </h4>
                    <span
                      className="badge px-2 py-1"
                      style={{
                        backgroundColor: "#ede9fe",
                        color: "#6d28d9",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                    >
                      {expert.specialty}
                    </span>
                    <span
                      className="badge px-2 py-1 d-inline-flex align-items-center gap-1"
                      style={{
                        backgroundColor: "#fef3c7",
                        color: "#b45309",
                        borderRadius: "6px",
                        fontSize: "12px",
                        border: "1px solid #fde68a",
                      }}
                    >
                      <FaCoins />
                      <span>{expert.chatRate ?? expert.chat_rate ?? 5} Coins/Msg</span>
                    </span>
                  </div>
                  <p className="text-muted mb-0 mt-1 fs-14">
                    {expert.category} • {expert.tagline || "-"}
                  </p>
                </div>
              </div>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-primary d-flex align-items-center gap-2"
                  style={{ borderRadius: "8px" }}
                  onClick={() => router.push(`/AiChat?expertId=${expert.id}`)}
                >
                  <FaComments />
                  <span>Test Chat</span>
                </button>
                <button
                  type="button"
                  className="btn text-white"
                  style={{ backgroundColor: "#8F6DFF", borderRadius: "8px" }}
                  onClick={() => router.push(`/AddAiExpert?id=${expert.id}`)}
                >
                  Edit Expert
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="card-body p-4 d-flex flex-column gap-4">
            <div className="row g-4">
              <div className="col-12 col-md-3">
                <div className="info-field-box">
                  <div className="info-field-label">Gender / Age</div>
                  <div className="info-field-value text-capitalize">
                    {expert.gender || "-"}, {expert.age ? `${expert.age} Yrs` : "-"}
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-3">
                <div className="info-field-box">
                  <div className="info-field-label">Where From</div>
                  <div className="info-field-value">{expert.home_place || "-"}</div>
                </div>
              </div>

              <div className="col-12 col-md-3">
                <div className="info-field-box">
                  <div className="info-field-label">Type & Language</div>
                  <div className="info-field-value">
                    {expert.type === "global"
                      ? `Global (${expert.timezone || "UTC"})`
                      : "Local (Hinglish Roman)"}
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-3">
                <div
                  className="info-field-box d-flex flex-column justify-content-between position-relative"
                  style={{
                    border: "1.5px solid #e0e7ff",
                    backgroundColor: "#f5f3ff",
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <div className="info-field-label d-flex align-items-center gap-1" style={{ color: "#7c3aed" }}>
                      <FaCoins />
                      <span>Chat Rate</span>
                    </div>
                    {!isEditingRate && (
                      <button
                        type="button"
                        onClick={() => {
                          setChatRateInput(expert.chatRate ?? expert.chat_rate ?? 5);
                          setIsEditingRate(true);
                        }}
                        className="btn btn-sm p-0 text-primary d-inline-flex align-items-center gap-1"
                        style={{ fontSize: "12px", border: "none", background: "none" }}
                        title="Edit Chat Rate"
                      >
                        <FaEdit />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>

                  {isEditingRate ? (
                    <div className="d-flex flex-column gap-2 mt-1">
                      <div className="d-flex align-items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          value={chatRateInput}
                          onChange={(e) => setChatRateInput(Math.max(0, Number(e.target.value)))}
                          className="form-control form-control-sm"
                          style={{
                            maxWidth: "100px",
                            fontWeight: 700,
                            borderRadius: "6px",
                            borderColor: "#8f6dff",
                          }}
                          autoFocus
                        />
                        <span className="fs-12 text-muted">Coins/msg</span>
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          disabled={savingRate}
                          onClick={handleSaveRate}
                          className="btn btn-sm btn-success py-0 px-2 fs-12 d-flex align-items-center gap-1"
                          style={{ borderRadius: "5px" }}
                        >
                          <FaCheck />
                          <span>{savingRate ? "Saving..." : "Save"}</span>
                        </button>
                        <button
                          type="button"
                          disabled={savingRate}
                          onClick={() => {
                            setChatRateInput(expert.chatRate ?? expert.chat_rate ?? 5);
                            setIsEditingRate(false);
                          }}
                          className="btn btn-sm btn-outline-secondary py-0 px-2 fs-12 d-flex align-items-center gap-1"
                          style={{ borderRadius: "5px" }}
                        >
                          <FaTimes />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="d-flex align-items-baseline gap-1 mt-1">
                      <span className="fs-18 fw-bold" style={{ color: "#6d28d9" }}>
                        {expert.chatRate ?? expert.chat_rate ?? 5}
                      </span>
                      <span className="fs-12 text-muted fw-semibold">Coins / message</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="col-12">
                <div className="info-field-box">
                  <div className="info-field-label">Appearance & Looks</div>
                  <div className="info-field-value">{expert.appearance || "-"}</div>
                </div>
              </div>

              <div className="col-12">
                <div className="info-field-box">
                  <div className="info-field-label">Occupation & Background</div>
                  <div className="info-field-value">{expert.occupation || "-"}</div>
                </div>
              </div>

              <div className="col-12">
                <div className="info-field-box">
                  <div className="info-field-label">A Normal Day / Routine</div>
                  <div className="info-field-value">{expert.daily_routine || "-"}</div>
                </div>
              </div>

              <div className="col-12">
                <div className="info-field-box">
                  <div className="info-field-label">Story & Life Journey</div>
                  <div className="info-field-value" style={{ whiteSpace: "pre-wrap" }}>
                    {expert.bio || "-"}
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="info-field-box">
                  <div className="info-field-label">Values</div>
                  <div className="info-field-value">{expert.values || "-"}</div>
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="info-field-box">
                  <div className="info-field-label">Quirks & Habits</div>
                  <div className="info-field-value">{expert.quirks || "-"}</div>
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="info-field-box">
                  <div className="info-field-label">Texting Style</div>
                  <div className="info-field-value">{expert.texting_style || "-"}</div>
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="info-field-box">
                  <div className="info-field-label">Greeting Line</div>
                  <div className="info-field-value text-primary font-italic">
                    "{expert.greeting || "-"}"
                  </div>
                </div>
              </div>

              {Array.isArray(expert.likes) && expert.likes.length > 0 && (
                <div className="col-12 col-md-4">
                  <div className="info-field-box">
                    <div className="info-field-label">Likes</div>
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {expert.likes.map((l, i) => (
                        <span key={i} className="badge bg-info text-dark" style={{ borderRadius: "4px" }}>
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {Array.isArray(expert.dislikes) && expert.dislikes.length > 0 && (
                <div className="col-12 col-md-4">
                  <div className="info-field-box">
                    <div className="info-field-label">Dislikes</div>
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {expert.dislikes.map((d, i) => (
                        <span key={i} className="badge bg-warning text-dark" style={{ borderRadius: "4px" }}>
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {Array.isArray(expert.hobbies) && expert.hobbies.length > 0 && (
                <div className="col-12 col-md-4">
                  <div className="info-field-box">
                    <div className="info-field-label">Hobbies</div>
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {expert.hobbies.map((h, i) => (
                        <span key={i} className="badge bg-secondary" style={{ borderRadius: "4px" }}>
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Generated Prompt Box */}
            {expert.prompt && (
              <div className="border rounded-3 p-4 bg-light mt-2">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="fw-bold text-dark fs-14 d-flex align-items-center gap-2">
                    <FaRobot style={{ color: "#8F6DFF" }} />
                    <span>Generated System Prompt ({expert.prompt.length} chars)</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary py-1 px-3 fs-13 d-flex align-items-center gap-2"
                    style={{ borderRadius: "6px" }}
                    onClick={handleCopyModalPrompt}
                  >
                    {copiedModalPrompt ? <FaCheck /> : <FaCopy />}
                    <span>{copiedModalPrompt ? "Copied" : "Copy Prompt"}</span>
                  </button>
                </div>
                <pre
                  className="bg-white p-3 border rounded fs-13 text-dark font-monospace mb-0"
                  style={{ maxHeight: "300px", overflowY: "auto", whiteSpace: "pre-wrap" }}
                >
                  {expert.prompt}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

ExpertInfoPage.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default ExpertInfoPage;
