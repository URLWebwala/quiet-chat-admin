import React, { useEffect, useState, useMemo } from "react";
import RootLayout from "@/component/layout/Layout";
import Title from "@/extra/Title";
import Pagination from "@/extra/Pagination";
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
} from "@/utils/aiChatApi";
import { toast } from "react-toastify";
import { FaSave, FaTimes, FaPlus, FaComments, FaArrowLeft } from "react-icons/fa";
import CustomSelect from "@/extra/CustomSelect";
import Searching from "@/extra/Searching";

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
    <div className="card ai-sq-card p-4">
      <h5 className="fw-bold text-dark mb-1 fs-16">
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
                      className="ai-sq-input"
                      value={draft.fact}
                      onChange={(e) => setDraft((prev) => ({ ...prev, fact: e.target.value }))}
                    />
                    <div className="d-flex gap-2 align-items-center">
                      <CustomSelect
                        options={[
                          { value: "long", label: "long" },
                          { value: "short", label: "short" },
                        ]}
                        value={draft.kind}
                        onChange={(v) => setDraft((prev) => ({ ...prev, kind: v }))}
                        style={{ maxWidth: "120px" }}
                        size="sm"
                      />
                      {draft.kind === "short" && (
                        <input
                          type="date"
                          className="ai-sq-input"
                          value={draft.event_date}
                          onChange={(e) =>
                            setDraft((prev) => ({ ...prev, event_date: e.target.value }))
                          }
                        />
                      )}
                      <button
                        className="btn btn-sm btn-primary ai-sq-btn py-1 px-2.5"
                        onClick={() => handleSaveDetail(detailId)}
                      >
                        <FaSave /> Save
                      </button>
                      <button
                        className="btn btn-sm btn-outline-secondary ai-sq-btn py-1 px-2"
                        onClick={() => setEditingId(null)}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="fw-medium text-dark fs-13 mb-1">{d.fact}</div>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className="badge bg-light text-secondary border fs-11 ai-sq-pill fw-normal">
                        {d.kind === "short" ? `short · ${d.event_date || "undated"}` : "long"}
                      </span>
                      <span className="badge bg-light text-secondary border fs-11 ai-sq-pill fw-normal">
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
        <label className="form-label text-dark fs-13 fw-semibold mb-2">
          Teach {personaMale ? "him" : "her"} a fact
        </label>
        <input
          type="text"
          className="ai-sq-input mb-2"
          value={fact}
          onChange={(e) => setFact(e.target.value)}
          placeholder={`${userMale ? "his" : "her"} dog is called Rio`}
        />

        <div className="mb-2">
          <input
            type="text"
            className="ai-sq-input"
            style={{ maxWidth: "180px" }}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category (e.g. pet, job, family)"
          />
        </div>

        <div className="mb-3">
          <CustomSelect
            options={[
              { value: "long", label: "long (permanent memory)" },
              { value: "short", label: "short (time-bound with event date)" },
            ]}
            value={kind}
            onChange={(v) => setKind(v)}
          />
        </div>

        {kind === "short" && (
          <div className="mb-3">
            <input
              type="date"
              className="ai-sq-input"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>
        )}

        <button
          type="submit"
          className="btn text-white ai-sq-btn shadow-sm"
          style={{ backgroundColor: "#8F6DFF" }}
          disabled={!fact.trim()}
        >
          <FaPlus /> Add Fact
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
  onBack: () => void;
}) => {
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
      <div className="text-center py-5 ai-sq-card shadow-sm border p-5">
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
      {/* TOP HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h4 className="fw-bold text-dark mb-0 fs-18">
          Conversation Inspection{" "}
          <span className="text-muted fw-normal fs-14">
            · {profile?.name || convo.profile_id} · {totalMsgs} messages
          </span>
        </h4>
        <div className="d-flex align-items-center gap-2">
          <Link
            href={`/AiChat?conversationId=${conversationId}`}
            className="btn btn-outline-primary ai-sq-btn"
            style={{ borderColor: "#8F6DFF", color: "#8F6DFF" }}
          >
            <FaComments /> Open in Chat
          </Link>
          <button
            className="btn btn-outline-secondary ai-sq-btn"
            onClick={onBack}
          >
            <FaArrowLeft /> Back to List
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* LEFT COLUMN */}
        <div className="col-12 col-lg-7">
          <div className="card ai-sq-card p-4 mb-4">
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label text-dark fs-13 fw-semibold mb-1">Stage</label>
                <div>
                  {stages && stages.length > 0 ? (
                    <CustomSelect
                      options={stages.map((s) => ({ value: s, label: s.toUpperCase() }))}
                      value={convo.stage || "discovery"}
                      onChange={(v) => patchConversation({ stage: v })}
                    />
                  ) : (
                    <span className="text-muted fs-13">not used — expert chats have no stages</span>
                  )}
                </div>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label text-dark fs-13 fw-semibold mb-1">Status</label>
                <CustomSelect
                  options={[
                    { value: "active", label: "Active" },
                    { value: "blocked", label: "Blocked" },
                  ]}
                  value={convo.status || "active"}
                  onChange={(v) => patchConversation({ status: v })}
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="form-label text-dark fs-13 fw-semibold mb-1.5 d-block">
                Labels on {userMale ? "his" : "her"} last message
              </label>
              <div className="d-flex flex-wrap gap-1.5">
                {labels.length === 0 ? (
                  <span className="badge bg-light text-secondary border fs-11 px-2.5 py-1 ai-sq-pill fw-normal">
                    Safe
                  </span>
                ) : (
                  labels.map((l: string) => (
                    <span
                      key={l}
                      className="badge bg-light text-secondary border fs-11 px-2.5 py-1 ai-sq-pill fw-normal"
                    >
                      {l}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="text-muted fs-12 mt-3 pt-2 border-top">
              {totalMsgs} messages · user: <strong>{userNameDisplay}</strong>
            </div>
          </div>

          {/* BOTTOM CARD: THREAD */}
          <div className="card ai-sq-card p-4">
            <h5 className="fw-bold text-dark mb-3 fs-16">Message Thread</h5>
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
                    <div key={m.id || m._id} className="p-3 border rounded-2" style={{ backgroundColor: isUser ? "#f8fafc" : "#ffffff" }}>
                      <div className="d-flex align-items-center justify-content-between mb-1">
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

        {/* RIGHT COLUMN: MEMORY SECTION */}
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
  onOpen: (id: string) => void;
}) => {
  const [rows, setRows] = useState<any[]>([]);
  const [profilesMap, setProfilesMap] = useState<{ [id: string]: any }>({});
  const [usersMap, setUsersMap] = useState<{ [id: string]: any }>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked">("all");

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(20);

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

  const filteredRows = useMemo(() => {
    return rows.filter((c: any) => {
      if (statusFilter === "active" && c.status === "blocked") return false;
      if (statusFilter === "blocked" && c.status !== "blocked") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const profile = profilesMap[c.profile_id];
        const user = usersMap[c.external_user_id];
        const profileName = (profile?.name || c.profile_id || "").toLowerCase();
        const userName = (user?.name || c.user_name || c.external_user_id || "").toLowerCase();
        const stage = (c.stage || "").toLowerCase();
        return profileName.includes(q) || userName.includes(q) || stage.includes(q);
      }
      return true;
    });
  }, [rows, profilesMap, usersMap, statusFilter, searchQuery]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  return (
    <div>
      {/* 1. SEARCH & FILTER TOP BAR */}
      <div className="d-flex align-items-center justify-content-between gap-3 mb-3 flex-wrap">
        <div style={{ minWidth: "280px", maxWidth: "450px", flex: "1 1 280px" }}>
          <Searching
            type="server"
            serverSearching={(val: string) => {
              setSearchQuery(val || "");
              setPage(1);
            }}
            placeholder="Search profile, user, stage..."
          />
        </div>

        <div className="d-flex align-items-center gap-2">
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn btn-sm ai-sq-btn px-3 py-2 ${
                statusFilter === "all" ? "btn-dark text-white shadow-sm" : "btn-outline-secondary"
              }`}
              onClick={() => {
                setStatusFilter("all");
                setPage(1);
              }}
            >
              All
            </button>
            <button
              type="button"
              className={`btn btn-sm ai-sq-btn px-3 py-2 ${
                statusFilter === "active" ? "btn-dark text-white shadow-sm" : "btn-outline-secondary"
              }`}
              onClick={() => {
                setStatusFilter("active");
                setPage(1);
              }}
            >
              Active
            </button>
            <button
              type="button"
              className={`btn btn-sm ai-sq-btn px-3 py-2 ${
                statusFilter === "blocked" ? "btn-dark text-white shadow-sm" : "btn-outline-secondary"
              }`}
              onClick={() => {
                setStatusFilter("blocked");
                setPage(1);
              }}
            >
              Blocked
            </button>
          </div>

          <button
            className="btn btn-sm btn-outline-secondary ai-sq-btn px-3 py-2"
            onClick={loadList}
          >
            <i className="ri-refresh-line me-1"></i> Refresh
          </button>
        </div>
      </div>

      {/* 2. SUBTITLE */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="text-muted fs-13 fw-semibold">
          Conversations · {filteredRows.length} of {rows.length}
        </span>
      </div>

      {/* 3. TABLE CARD */}
      <div className="card ai-sq-card overflow-hidden">
        {loading ? (
          <div className="text-center py-5 text-muted">
            <div className="spinner-border spinner-border-sm text-primary mb-2"></div>
            <p className="mb-0 fs-13">Loading conversations...</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-4 text-center text-muted fs-13">No conversations active yet.</div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 fs-13">
                <thead className="table-light">
                  <tr className="fs-12 text-uppercase text-muted fw-bold">
                    <th className="ps-4">Profile</th>
                    <th>User</th>
                    <th>Stage</th>
                    <th className="text-center">Msgs</th>
                    <th>Last Message</th>
                    <th className="pe-4 text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((c: any) => {
                    const cid = c.conversation_id || c.id || c._id;
                    const profile = profilesMap[c.profile_id];
                    const user = usersMap[c.external_user_id];
                    const userName = user?.name || c.user_name || (c.external_user_id ? (c.external_user_id.length > 12 ? c.external_user_id.slice(0, 10) + "..." : c.external_user_id) : "—");
                    const profileTag = profile?.category || profile?.tag || (profile?.gender === "male" ? "boy" : profile?.gender === "female" ? "girl" : "");

                    return (
                      <tr key={cid}>
                        <td className="ps-4">
                          <span className="fw-semibold text-dark fs-14 me-1.5">
                            {profile?.name || c.profile_id}
                          </span>
                          {profileTag && (
                            <span className="badge bg-light text-secondary border fs-11 fw-normal ai-sq-pill px-2 py-0.5">
                              {profileTag}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="text-dark fs-13">
                            {userName}
                          </span>
                        </td>
                        <td>
                          {c.stage ? (
                            <span className="badge bg-secondary text-white fs-11 text-uppercase px-2.5 py-1 ai-sq-pill">
                              {c.stage}
                            </span>
                          ) : (
                            <span className="text-muted fs-13">—</span>
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
                            type="button"
                            className="btn btn-sm btn-outline-primary ai-sq-btn px-2.5 py-1"
                            onClick={() => onOpen(cid)}
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            {filteredRows.length > rowsPerPage && (
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
                totalData={filteredRows.length}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

/* ================= 4. MAIN CONTAINER ================= */
const AiInspectorPage = () => {
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const qId = urlParams.get("id");
      if (qId && qId.trim().length > 0) {
        setActiveConvoId(qId.trim());
      }
    }
  }, []);

  const handleOpen = (cid: string) => {
    setActiveConvoId(cid);
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", `/AiInspector?id=${cid}`);
    }
  };

  const handleBack = () => {
    setActiveConvoId(null);
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", "/AiInspector");
    }
  };

  return (
    <>
      <style jsx global>{`
        .ai-sq-input,
        .ai-sq-textarea,
        .ai-sq-select {
          border-radius: 6px !important;
          border: 1.5px solid #cbd5e1 !important;
          padding: 8px 12px !important;
          font-size: 13.5px !important;
          color: #0f172a !important;
          background-color: #ffffff !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04) !important;
          transition: all 0.15s ease !important;
          width: 100%;
        }
        .ai-sq-input:focus,
        .ai-sq-textarea:focus,
        .ai-sq-select:focus {
          border-color: #8f6dff !important;
          outline: none !important;
          box-shadow: 0 0 0 3px rgba(143, 109, 255, 0.2) !important;
        }
        .ai-sq-card {
          border-radius: 8px !important;
          border: 1px solid #e2e8f0 !important;
          background: #ffffff !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
        }
        .ai-sq-btn {
          border-radius: 6px !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          padding: 7px 16px !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
          transition: all 0.15s ease !important;
        }
        .ai-sq-pill {
          border-radius: 4px !important;
          font-weight: 500 !important;
        }
      `}</style>

      <div className="p-3">
        <div className="mb-3">
          <Title name="AI Inspector & Memory Manager" display="none" />
        </div>

        {activeConvoId ? (
          <ConversationDetailView
            conversationId={activeConvoId}
            onBack={handleBack}
          />
        ) : (
          <ConversationListView
            onOpen={handleOpen}
          />
        )}
      </div>
    </>
  );
};

AiInspectorPage.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default AiInspectorPage;
