import React, { useEffect, useState } from "react";
import RootLayout from "@/component/layout/Layout";
import Title from "@/extra/Title";
import Pagination from "@/extra/Pagination";
import { useRouter } from "next/router";
import Link from "next/link";
import { apiInstanceFetch } from "@/utils/ApiInstance";
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

const lookupUsersBatch = async (userIds: string[]): Promise<{ [id: string]: any }> => {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (!uniqueIds.length) return {};
  try {
    const res = await apiInstanceFetch.get(
      `api/admin/user/lookupUsers?userIds=${encodeURIComponent(uniqueIds.join(","))}`
    );
    if (res?.status && res.users) {
      return res.users;
    }
  } catch (err) {
    console.warn("lookupUsersBatch error:", err);
  }
  return {};
};

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
        <p className="text-muted fs-13 mb-4">Nothing yet — the analyzer fills this in.</p>
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
      <form onSubmit={handleAddDetail} className="pt-2">
        <label className="form-label text-dark fs-13 mb-2">
          Teach {personaMale ? "him" : "her"} a fact
        </label>
        <input
          type="text"
          className="form-control bg-white border fs-13 mb-2 rounded-2"
          value={fact}
          onChange={(e) => setFact(e.target.value)}
          placeholder={`${userMale ? "his" : "her"} dog is called Rio`}
        />

        <div className="mb-2">
          <input
            type="text"
            className="form-control bg-white border fs-13 rounded-2"
            style={{ maxWidth: "160px" }}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="other"
          />
        </div>

        <div className="mb-3">
          <select
            className="form-select bg-white border fs-13 rounded-2"
            value={kind}
            onChange={(e: any) => setKind(e.target.value)}
          >
            <option value="long">long</option>
            <option value="short">short</option>
          </select>
        </div>

        {kind === "short" && (
          <div className="mb-3">
            <input
              type="date"
              className="form-control bg-white border fs-13 rounded-2"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>
        )}

        <button
          type="submit"
          className="btn btn-light border bg-white shadow-sm px-4 py-1.5 fs-13 text-muted rounded-2"
          disabled={!fact.trim()}
        >
          Add
        </button>
      </form>
    </div>
  );
};

/* ================= 2. CONVERSATION DETAIL PAGE ================= */
const ConversationDetailView = ({
  conversationId,
  onBack,
}: {
  conversationId: string;
  onBack?: () => void;
}) => {
  const router = useRouter();
  const [convo, setConvo] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadData();
  }, [conversationId]);

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
        if (c.external_user_id) {
          const uMap = await lookupUsersBatch([c.external_user_id]);
          if (uMap[c.external_user_id]) {
            setUserData(uMap[c.external_user_id]);
          }
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

  const totalMsgs = messages.length || convo.message_count || 0;
  const userNameDisplay = userData?.name || convo.user_name || "User";

  return (
    <div>
      {/* TOP HEADER: Conversation · {profile.name} · {count} messages + Buttons */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h4 className="fw-bold text-dark mb-0 fs-18">
          Conversation{" "}
          <span className="text-muted fw-normal fs-15">
            · {profile?.name || convo.profile_id} · {totalMsgs} messages
          </span>
        </h4>
        <div className="d-flex align-items-center gap-2">
          <Link
            href="/AiChat"
            className="btn btn-sm btn-light border bg-white shadow-sm px-3 py-1.5 fs-13 text-dark fw-medium rounded-2 text-decoration-none"
          >
            Open as chat
          </Link>
          <button
            className="btn btn-sm btn-light border bg-white shadow-sm px-3 py-1.5 fs-13 text-dark fw-medium rounded-2"
            onClick={() => {
              if (onBack) onBack();
              else router.push("/AiInspector", undefined, { shallow: true });
            }}
          >
            Back to list
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* LEFT COLUMN: STAGE/STATUS CARD + THREAD */}
        <div className="col-12 col-lg-7">
          {/* TOP CARD: STAGE, STATUS, LABELS */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label text-muted fs-12 fw-medium mb-1">Stage</label>
                <div>
                  {stages && stages.length > 0 ? (
                    <select
                      className="form-select form-select-sm bg-light border fs-13 text-capitalize"
                      value={convo.stage || "discovery"}
                      onChange={(e) => patchConversation({ stage: e.target.value })}
                    >
                      {stages.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-muted fs-13">not used — expert chats have no stages</span>
                  )}
                </div>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label text-muted fs-12 fw-medium mb-1">Status</label>
                <select
                  className="form-select form-select-sm bg-light border fs-13 text-capitalize"
                  style={{ maxWidth: "160px" }}
                  value={convo.status || "active"}
                  onChange={(e) => patchConversation({ status: e.target.value })}
                >
                  <option value="active">active</option>
                  <option value="blocked">blocked</option>
                </select>
              </div>
            </div>

            <div className="mt-3">
              <label className="form-label text-muted fs-12 fw-medium mb-1.5 d-block">
                Labels on {userMale ? "his" : "her"} last message
              </label>
              <div className="d-flex flex-wrap gap-1.5">
                {labels.length === 0 ? (
                  <>
                    <span className="badge bg-light text-secondary border fs-11 px-2.5 py-1 rounded-pill fw-normal">
                      Casual
                    </span>
                    <span className="badge bg-light text-secondary border fs-11 px-2.5 py-1 rounded-pill fw-normal">
                      Safe
                    </span>
                  </>
                ) : (
                  labels.map((l: string) => (
                    <span
                      key={l}
                      className="badge bg-light text-secondary border fs-11 px-2.5 py-1 rounded-pill fw-normal"
                    >
                      {l}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="text-muted fs-12 mt-3 pt-2 border-top">
              {totalMsgs} messages · user {userNameDisplay}
              {userData?.uniqueId ? ` (ID: ${userData.uniqueId})` : ""}
            </div>
          </div>

          {/* BOTTOM CARD: THREAD */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h5 className="fw-bold text-dark mb-3 fs-16">Thread</h5>
            {messages.length === 0 ? (
              <p className="text-muted fs-13 mb-0">Empty thread.</p>
            ) : (
              <div
                className="d-flex flex-column gap-3 overflow-auto pe-2"
                style={{ maxHeight: "480px" }}
              >
                {messages.map((m: any) => {
                  const isUser = m.role === "user";
                  const senderName = isUser
                    ? userNameDisplay
                    : (profile?.name || (personaMale ? "Him" : "Her"));
                  const timeStr = m.created_at
                    ? new Date(m.created_at).toLocaleString()
                    : new Date().toLocaleString();

                  return (
                    <div key={m.id || m._id} className="mb-1">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <strong className="fs-13 text-dark">{senderName}</strong>
                        <span className="text-muted fs-11">{timeStr}</span>
                      </div>
                      <div className="text-secondary fs-13" style={{ lineHeight: "1.5" }}>
                        {m.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: WHAT SHE REMEMBERS */}
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
const ConversationListView = ({
  onOpen,
}: {
  onOpen?: (id: string) => void;
}) => {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [profilesMap, setProfilesMap] = useState<{ [id: string]: any }>({});
  const [usersMap, setUsersMap] = useState<{ [id: string]: any }>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

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

      const rowsList = Array.isArray(convos) ? convos : [];
      const userIds = rowsList.map((c: any) => c.external_user_id).filter(Boolean);
      const uMap = await lookupUsersBatch(userIds);

      setUsersMap(uMap);
      setProfilesMap(pMap);
      setRows(rowsList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const paginatedRows = rows.slice((page - 1) * rowsPerPage, page * rowsPerPage);

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
          <>
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
                  {paginatedRows.map((c: any) => {
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
                          {(() => {
                            const u = usersMap[c.external_user_id];
                            const displayName = u?.name || c.user_name || "User";
                            const displayId = u?.uniqueId
                              ? `ID: ${u.uniqueId}`
                              : (c.external_user_id ? `ID: ${c.external_user_id}` : "—");
                            const userImg = u?.image;

                            return (
                              <div className="d-flex align-items-center gap-2">
                                {userImg ? (
                                  <img
                                    src={userImg}
                                    alt={displayName}
                                    className="rounded-circle border flex-shrink-0"
                                    style={{ width: 34, height: 34, objectFit: "cover" }}
                                    onError={(e: any) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <div
                                    className="rounded-circle bg-light border d-flex align-items-center justify-content-center text-muted fw-bold fs-12 flex-shrink-0"
                                    style={{ width: 34, height: 34 }}
                                  >
                                    {displayName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div style={{ minWidth: 0 }}>
                                  <div className="fw-semibold text-dark fs-13 d-flex align-items-center gap-1 text-truncate">
                                    <span>{displayName}</span>
                                    {u?.isVip && (
                                      <span className="badge bg-warning text-dark fs-10 px-1 py-0.5">VIP</span>
                                    )}
                                  </div>
                                  <div className="text-muted fs-11 font-monospace text-truncate">
                                    {displayId}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td>
                          <span
                            className="badge bg-cyan text-white fs-11 text-uppercase px-2.5 py-1 rounded-pill me-1"
                            style={{ backgroundColor: "#0284C7" }}
                          >
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
                            onClick={() => {
                              if (onOpen) onOpen(cid);
                              else router.push(`/AiInspector?id=${cid}`, undefined, { shallow: true });
                            }}
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

            {/* PAGINATION */}
            <Pagination
              type={"client"}
              serverPage={page}
              setServerPage={setPage}
              serverPerPage={rowsPerPage}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(val) => {
                setRowsPerPage(parseInt(val, 10));
                setPage(1);
              }}
              totalData={rows.length}
            />
          </>
        )}
      </div>
    </div>
  );
};

/* ================= 4. MAIN CONTAINER ================= */
const AiInspectorPage = () => {
  const router = useRouter();
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);

  useEffect(() => {
    if (router.isReady) {
      const qId = router.query.id;
      if (typeof qId === "string" && qId.trim().length > 0) {
        setActiveConvoId(qId.trim());
      } else {
        setActiveConvoId(null);
      }
    }
  }, [router.isReady, router.query.id]);

  const handleOpen = (cid: string) => {
    setActiveConvoId(cid);
    router.push(`/AiInspector?id=${cid}`, undefined, { shallow: true });
  };

  const handleBack = () => {
    setActiveConvoId(null);
    router.push("/AiInspector", undefined, { shallow: true });
  };

  return activeConvoId ? (
    <ConversationDetailView
      conversationId={activeConvoId}
      onBack={handleBack}
    />
  ) : (
    <ConversationListView
      onOpen={handleOpen}
    />
  );
};

AiInspectorPage.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default AiInspectorPage;

