import React, { useEffect, useState } from "react";
import RootLayout from "@/component/layout/Layout";
import Title from "@/extra/Title";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  fetchConversations,
  fetchAiProfiles,
  fetchSingleConversation,
  fetchSingleProfile,
  fetchAiMessages,
  fetchConversationDetails,
  addConversationDetail,
  updateConversationDetail,
  deleteConversationDetail,
  updateConversation,
  fetchAiSettingsOptions,
  sendNudge,
  sendGiftPurchase,
  fetchAiGifts,
} from "@/utils/aiChatApi";
import { toast } from "react-toastify";

/* ================= 1. MEMORY CARD COMPONENT ================= */
const MemorySection = ({
  conversationId,
  personaMale,
  userMale,
}: {
  conversationId: string;
  personaMale: boolean;
  userMale: boolean;
}) => {
  const [details, setDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fact, setFact] = useState<string>("");
  const [category, setCategory] = useState<string>("other");
  const [kind, setKind] = useState<"long" | "short">("long");
  const [eventDate, setEventDate] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ fact: string; kind: "long" | "short"; event_date: string }>({
    fact: "",
    kind: "long",
    event_date: "",
  });

  useEffect(() => {
    loadDetails();
  }, [conversationId]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const data = await fetchConversationDetails(conversationId);
      setDetails(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDetail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fact.trim()) return;

    try {
      await addConversationDetail(conversationId, {
        fact: fact.trim(),
        category: category.trim() || "other",
        kind,
        event_date: kind === "short" && eventDate ? eventDate : undefined,
      });
      setFact("");
      setEventDate("");
      loadDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveDetail = async (detailId: string) => {
    try {
      await updateConversationDetail(conversationId, detailId, {
        fact: draft.fact,
        kind: draft.kind,
        event_date: draft.kind === "short" ? draft.event_date || undefined : "",
      });
      setEditingId(null);
      loadDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDetail = async (detailId: string) => {
    try {
      await deleteConversationDetail(conversationId, detailId);
      loadDetails();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
      <h5 className="fw-bold text-dark mb-1">
        What {personaMale ? "he" : "she"} remembers
      </h5>
      <p className="text-muted fs-12 mb-3">
        long = permanent · short = tied to a date, forgotten a few days after it.
      </p>

      {loading ? (
        <p className="text-muted fs-13">Loading memories...</p>
      ) : details.length === 0 ? (
        <p className="text-muted fs-13 italic">Nothing yet — the analyzer fills this in.</p>
      ) : (
        <div className="d-flex flex-column gap-2 mb-4">
          {details.map((d: any) => {
            const isEditing = editingId === (d.id || d._id);
            const detailId = d.id || d._id;

            return (
              <div key={detailId} className="border-bottom pb-2 pt-1">
                {isEditing ? (
                  <div className="d-flex flex-column gap-2">
                    <input
                      type="text"
                      className="form-control form-control-sm bg-light fs-13"
                      value={draft.fact}
                      onChange={(e) => setDraft((prev) => ({ ...prev, fact: e.target.value }))}
                    />
                    <div className="d-flex gap-2 align-items-center">
                      <select
                        className="form-select form-select-sm bg-light fs-12"
                        style={{ maxWidth: "100px" }}
                        value={draft.kind}
                        onChange={(e: any) =>
                          setDraft((prev) => ({ ...prev, kind: e.target.value }))
                        }
                      >
                        <option value="long">long</option>
                        <option value="short">short</option>
                      </select>
                      {draft.kind === "short" && (
                        <input
                          type="date"
                          className="form-control form-control-sm bg-light fs-12"
                          value={draft.event_date}
                          onChange={(e) =>
                            setDraft((prev) => ({ ...prev, event_date: e.target.value }))
                          }
                        />
                      )}
                      <button
                        className="btn btn-sm btn-primary py-0 px-2 fs-12"
                        onClick={() => handleSaveDetail(detailId)}
                      >
                        Save
                      </button>
                      <button
                        className="btn btn-sm btn-light py-0 px-2 fs-12"
                        onClick={() => setEditingId(null)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="fw-medium text-dark fs-13 mb-1">{d.fact}</div>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className="badge bg-light text-secondary border fs-11 fw-normal">
                        {d.kind === "short" ? `short · ${d.event_date || "undated"}` : "long"}
                      </span>
                      <span className="badge bg-light text-secondary border fs-11 fw-normal">
                        {d.category || "other"}
                      </span>
                      <button
                        className="btn btn-link p-0 text-primary fs-12 text-decoration-none"
                        onClick={() => {
                          setEditingId(detailId);
                          setDraft({
                            fact: d.fact,
                            kind: d.kind || "long",
                            event_date: d.event_date || "",
                          });
                        }}
                      >
                        edit
                      </button>
                      <button
                        className="btn btn-link p-0 text-danger fs-12 text-decoration-none"
                        onClick={() => handleDeleteDetail(detailId)}
                      >
                        forget
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TEACH HER A FACT FORM */}
      <form onSubmit={handleAddDetail} className="border-top pt-3 mt-2">
        <label className="form-label fw-semibold text-dark fs-13 mb-1">
          Teach {personaMale ? "him" : "her"} a fact
        </label>
        <input
          type="text"
          className="form-control bg-light border fs-13 mb-2"
          value={fact}
          onChange={(e) => setFact(e.target.value)}
          placeholder={`${userMale ? "his" : "her"} dog is called Rio`}
        />

        <div className="d-flex gap-2 align-items-center">
          <input
            type="text"
            className="form-control form-control-sm bg-light fs-12"
            style={{ maxWidth: "120px" }}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="category"
          />
          <select
            className="form-select form-select-sm bg-light fs-12"
            style={{ maxWidth: "100px" }}
            value={kind}
            onChange={(e: any) => setKind(e.target.value)}
          >
            <option value="long">long</option>
            <option value="short">short</option>
          </select>
          {kind === "short" && (
            <input
              type="date"
              className="form-control form-control-sm bg-light fs-12"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          )}
          <button
            type="submit"
            className="btn btn-sm btn-primary px-3 fs-12 ms-auto"
            disabled={!fact.trim()}
          >
            Add
          </button>
        </div>
      </form>
    </div>
  );
};

/* ================= 2. CONVERSATION DETAIL PAGE ================= */
const ConversationDetailView = ({ conversationId }: { conversationId: string }) => {
  const router = useRouter();
  const [convo, setConvo] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [nudging, setNudging] = useState<boolean>(false);
  const [availableGifts, setAvailableGifts] = useState<any[]>([]);
  const [selectedGiftId, setSelectedGiftId] = useState<string>("");
  const [sendingGift, setSendingGift] = useState<boolean>(false);

  useEffect(() => {
    loadData();
    loadGifts();
  }, [conversationId]);

  const loadGifts = async () => {
    try {
      const gifts = await fetchAiGifts();
      setAvailableGifts(gifts);
      if (gifts.length > 0) setSelectedGiftId(gifts[0].id || gifts[0]._id || "");
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const c = await fetchSingleConversation(conversationId);
      if (c) {
        setConvo(c);
        if (c.profile_id) {
          const p = await fetchSingleProfile(c.profile_id);
          if (p) setProfile(p);
        }
      }

      const msgs = await fetchAiMessages(conversationId);
      setMessages(msgs);

      const opts = await fetchAiSettingsOptions();
      if (opts?.stages) setStages(opts.stages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const patchConversation = async (data: any) => {
    try {
      const updated = await updateConversation(conversationId, data);
      if (updated) {
        setConvo(updated);
        toast.success("Conversation updated");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerNudge = async () => {
    setNudging(true);
    try {
      const res = await sendNudge(conversationId);
      if (res?.skipped) {
        toast.info(`Nudge skipped: ${res.skipped}`);
      } else if (res?.messages?.length) {
        toast.success(`Nudge sent: "${res.reply || res.messages[0].message}"`);
        loadData();
      } else {
        toast.info("No nudge message generated");
      }
    } catch (e) {
      toast.error("Failed to trigger nudge");
    } finally {
      setNudging(false);
    }
  };

  const handleSimulateGift = async () => {
    if (!selectedGiftId) {
      toast.error("Select a gift to send");
      return;
    }
    setSendingGift(true);
    try {
      const res = await sendGiftPurchase(conversationId, selectedGiftId);
      if (res) {
        toast.success(`Gift purchase recorded! Thank you reply: "${res.reply}"`);
        loadData();
      } else {
        toast.error("Failed to record gift purchase");
      }
    } catch (e) {
      toast.error("Error simulating gift purchase");
    } finally {
      setSendingGift(false);
    }
  };

  if (loading || !convo) {
    return (
      <div className="text-center py-5 bg-white rounded-4 shadow-sm border">
        <div className="spinner-border text-primary mb-2"></div>
        <p className="text-muted mb-0 fs-13">Loading conversation inspection...</p>
      </div>
    );
  }

  const personaMale = profile?.gender === "male";
  const userMale = convo.user_gender ? convo.user_gender === "male" : !personaMale;

  const labels = [
    convo.last_tone,
    convo.last_emotion,
    convo.last_intent,
    convo.last_safety_label,
  ].filter(Boolean);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Title name="Conversation Inspection" />
        <button
          className="btn btn-outline-secondary px-3 py-1.5 rounded-3 fs-13 fw-semibold shadow-sm"
          onClick={() => router.push("/AiInspector")}
        >
          <i className="ri-arrow-left-line me-1"></i> Back to list
        </button>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-7">
          {/* HEADER & METRICS */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
            <div className="row g-3 align-items-center">
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold text-dark fs-12 mb-1">Stage</label>
                <select
                  className="form-select bg-light border fs-13 text-capitalize"
                  value={convo.stage || "discovery"}
                  onChange={(e) => patchConversation({ stage: e.target.value })}
                >
                  {(stages.length ? stages : [convo.stage || "discovery"]).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold text-dark fs-12 mb-1">Status</label>
                <select
                  className="form-select bg-light border fs-13 text-capitalize"
                  value={convo.status || "active"}
                  onChange={(e) => patchConversation({ status: e.target.value })}
                >
                  <option value="active">active</option>
                  <option value="blocked">blocked</option>
                </select>
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold text-dark fs-12 mb-1">
                  Labels on {userMale ? "his" : "her"} last message
                </label>
                <div className="d-flex flex-wrap gap-1">
                  {labels.length === 0 ? (
                    <span className="text-muted fs-12">none yet</span>
                  ) : (
                    labels.map((l: string) => (
                      <span key={l} className="badge bg-info-subtle text-info border fs-11 fw-normal">
                        {l}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            <p className="text-muted fs-12 mt-3 mb-0 border-top pt-2">
              {convo.message_count || 0} messages · user {convo.external_user_id || "—"} ·{" "}
              <Link href="/AiChat" className="text-primary text-decoration-underline">
                open as chat
              </Link>
            </p>
          </div>

          {/* TEST ACTIONS: NUDGE & GIFT SIMULATION */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
            <h5 className="fw-bold text-dark mb-2">Test Actions & Triggers</h5>
            <div className="row g-3 align-items-end">
              <div className="col-12 col-md-6">
                <label className="form-label fs-12 fw-semibold text-muted mb-1">Unprompted Nudge</label>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-1.5"
                  onClick={handleTriggerNudge}
                  disabled={nudging || convo.status === "blocked"}
                >
                  <i className="ri-notification-3-line"></i>
                  {nudging ? "Triggering Nudge..." : "Trigger Persona Nudge"}
                </button>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fs-12 fw-semibold text-muted mb-1">Simulate Gift Purchase</label>
                <div className="input-group input-group-sm">
                  <select
                    className="form-select bg-light fs-12"
                    value={selectedGiftId}
                    onChange={(e) => setSelectedGiftId(e.target.value)}
                  >
                    {availableGifts.map((g) => (
                      <option key={g.id || g._id} value={g.id || g._id}>
                        🎁 {g.name} ({g.coin_price} coins)
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-warning text-dark fw-semibold"
                    onClick={handleSimulateGift}
                    disabled={sendingGift || !selectedGiftId}
                  >
                    {sendingGift ? "Sending..." : "Send Gift"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* GIFTS */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
            <h5 className="fw-bold text-dark mb-1">Gifts</h5>
            <p className="text-muted fs-13 mb-2">
              {convo.last_gift_ask_at
                ? `Last asked ${new Date(convo.last_gift_ask_at).toLocaleString()}`
                : `${personaMale ? "He" : "She"} has not asked for anything yet.`}
              {convo.asked_gift_id && " · an ask is still open"}
            </p>

            {convo.received_gifts?.length ? (
              <div className="d-flex flex-wrap gap-1.5">
                {convo.received_gifts.map((g: any, idx: number) => (
                  <span key={idx} className="badge bg-light text-dark border fs-12 fw-medium">
                    🎁 {g.name} · {g.coin_price} coins
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-muted fs-12 mb-0">
                Nothing received. Gifts are given from the chat screen.
              </p>
            )}
          </div>

          {/* THREAD TRANSCRIPT */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h5 className="fw-bold text-dark mb-3">Thread</h5>
            {messages.length === 0 ? (
              <p className="text-muted fs-13 mb-0">Empty thread.</p>
            ) : (
              <div
                className="d-flex flex-column gap-3 overflow-auto"
                style={{ maxHeight: "500px" }}
              >
                {messages.map((m: any) => {
                  const isUser = m.role === "user";
                  return (
                    <div key={m.id || m._id} className="border-bottom pb-2">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <strong className="fs-13 text-dark">
                          {isUser
                            ? convo.external_user_id || "user"
                            : profile?.name || (personaMale ? "him" : "her")}
                        </strong>
                        <span className="text-muted fs-11">
                          {new Date(m.created_at || Date.now()).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-secondary fs-13">{m.text}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: MEMORY INSPECTOR */}
        <div className="col-12 col-lg-5">
          <MemorySection
            conversationId={conversationId}
            personaMale={personaMale}
            userMale={userMale}
          />
        </div>
      </div>
    </div>
  );
};

/* ================= 3. CONVERSATION LIST PAGE ================= */
const ConversationListView = () => {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [profilesMap, setProfilesMap] = useState<{ [id: string]: any }>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadList();
  }, []);

  const loadList = async () => {
    setLoading(true);
    try {
      const [convos, profiles] = await Promise.all([
        fetchConversations(),
        fetchAiProfiles(),
      ]);

      const pMap: { [id: string]: any } = {};
      if (Array.isArray(profiles)) {
        profiles.forEach((p: any) => {
          const pid = p.id || p._id;
          if (pid) pMap[pid] = p;
        });
      }

      setProfilesMap(pMap);
      setRows(Array.isArray(convos) ? convos : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Title name="Conversations" />
        <button
          className="btn btn-sm btn-light border shadow-sm rounded-3 px-3 py-1.5 text-dark fw-semibold fs-13"
          onClick={loadList}
        >
          <i className="ri-refresh-line me-1"></i> Refresh
        </button>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-0 bg-white overflow-hidden">
        {loading ? (
          <div className="text-center py-5 text-muted">
            <div className="spinner-border spinner-border-sm text-primary mb-2"></div>
            <p className="mb-0 fs-13">Loading conversations...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-center text-muted fs-13">No conversations active yet.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr className="fs-12 text-uppercase text-muted fw-bold">
                  <th className="ps-4">Profile</th>
                  <th>User</th>
                  <th>Stage</th>
                  <th className="text-center">Msgs</th>
                  <th>Last</th>
                  <th className="pe-4 text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c: any) => {
                  const cid = c.conversation_id || c.id || c._id;
                  const profile = profilesMap[c.profile_id];

                  return (
                    <tr key={cid}>
                      <td className="ps-4">
                        <span className="fw-semibold text-dark fs-14 me-2">
                          {profile?.name || c.profile_id}
                        </span>
                        {profile && (
                          <span
                            className={`badge ${
                              profile.gender === "male"
                                ? "bg-info-subtle text-info border-info"
                                : "bg-danger-subtle text-danger border-danger"
                            } border fs-11 fw-normal`}
                          >
                            {profile.gender === "male" ? "boy" : "girl"}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="text-secondary fs-13">
                          {c.external_user_id || "—"}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-cyan text-white fs-11 text-uppercase px-2.5 py-1 rounded-pill me-1" style={{ backgroundColor: "#0284C7" }}>
                          {c.stage || "discovery"}
                        </span>
                        {c.status === "blocked" && (
                          <span className="badge bg-danger text-white fs-11 text-uppercase px-2 py-1 rounded-pill">
                            blocked
                          </span>
                        )}
                      </td>
                      <td className="text-center fw-semibold fs-13 text-dark">
                        {c.message_count || 0}
                      </td>
                      <td className="text-muted fs-12">
                        {c.last_message_at
                          ? new Date(c.last_message_at).toLocaleString()
                          : "—"}
                      </td>
                      <td className="pe-4 text-end">
                        <button
                          className="btn btn-sm btn-link text-primary fw-semibold fs-13 text-decoration-underline p-0"
                          onClick={() => router.push(`/AiInspector?id=${cid}`)}
                        >
                          open
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* ================= 4. MAIN CONTAINER ================= */
const AiInspectorPage = () => {
  const [convoId, setConvoId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      setConvoId(urlParams.get("id"));
    }
  }, []);

  if (!isClient) return null;

  return convoId ? (
    <ConversationDetailView conversationId={convoId} />
  ) : (
    <ConversationListView />
  );
};

AiInspectorPage.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default AiInspectorPage;
