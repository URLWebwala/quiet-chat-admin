import React, { useEffect, useState } from "react";
import RootLayout from "@/component/layout/Layout";
import Title from "@/extra/Title";
import Link from "next/link";
import { fetchFlags, updateFlag, updateConversation, AiFlag } from "@/utils/aiChatApi";
import { toast } from "react-toastify";

const AiFlags = () => {
  const [flags, setFlags] = useState<AiFlag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    loadFlags();
  }, [statusFilter]);

  const loadFlags = async () => {
    setLoading(true);
    try {
      const data = await fetchFlags(statusFilter);
      setFlags(data);
    } catch (e) {
      console.error("Failed to load safety flags:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReviewed = async (flagId: string) => {
    try {
      const updated = await updateFlag(flagId, "reviewed");
      if (updated) {
        toast.success("Flag marked as reviewed");
        loadFlags();
      }
    } catch (e) {
      toast.error("Failed to update flag status");
    }
  };

  const handleUnblockConversation = async (conversationId: string) => {
    try {
      const res = await updateConversation(conversationId, { status: "active" });
      if (res) {
        toast.success("Conversation unblocked successfully!");
        loadFlags();
      }
    } catch (e) {
      toast.error("Failed to unblock conversation");
    }
  };

  const filteredFlags = flags.filter((f) => {
    const matchesSeverity = severityFilter === "all" || f.severity === severityFilter;
    const matchesSearch =
      (f.message_text || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.reason || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.conversation_id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.safety_label || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-danger text-white";
      case "high":
        return "bg-warning text-dark";
      case "medium":
        return "bg-info text-white";
      case "low":
      default:
        return "bg-secondary text-white";
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Title name="AI Safety Flags & Moderation" />
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="row g-3 align-items-center mb-3">
          <div className="col-md-3">
            <label className="form-label fs-13 text-muted mb-1">Status Filter</label>
            <div className="btn-group w-100" role="group">
              <button
                type="button"
                className={`btn btn-sm ${statusFilter === "open" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setStatusFilter("open")}
              >
                Open Flags
              </button>
              <button
                type="button"
                className={`btn btn-sm ${statusFilter === "reviewed" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setStatusFilter("reviewed")}
              >
                Reviewed Flags
              </button>
            </div>
          </div>

          <div className="col-md-3">
            <label className="form-label fs-13 text-muted mb-1">Severity Filter</label>
            <select
              className="form-select form-select-sm bg-light"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label fs-13 text-muted mb-1">Search Flags</label>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <i className="ri-search-line text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0"
                placeholder="Search by message text, label, or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted mt-2 fs-13">Loading moderation flags...</p>
          </div>
        ) : filteredFlags.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="ri-shield-check-line fs-1 text-success mb-2 d-block"></i>
            <h5>No Safety Flags Found</h5>
            <p className="fs-13">There are currently no {statusFilter} safety flags matching your criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle table-hover fs-13">
              <thead className="table-light">
                <tr>
                  <th>Timestamp</th>
                  <th>Flagged Message</th>
                  <th>Safety Label</th>
                  <th>Severity</th>
                  <th>Reason</th>
                  <th>Conversation</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFlags.map((flag) => (
                  <tr key={flag.id}>
                    <td className="text-nowrap text-muted">
                      {flag.created_at ? new Date(flag.created_at).toLocaleString() : "N/A"}
                    </td>
                    <td style={{ maxWidth: "250px" }}>
                      <span className="fw-semibold text-dark d-block text-truncate" title={flag.message_text}>
                        "{flag.message_text}"
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {flag.safety_label || "Unknown"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getSeverityBadge(flag.severity)}`}>
                        {flag.severity}
                      </span>
                    </td>
                    <td style={{ maxWidth: "220px" }}>
                      <small className="text-muted text-truncate d-block" title={flag.reason}>
                        {flag.reason || "-"}
                      </small>
                    </td>
                    <td>
                      <Link
                        href={`/AiInspector?id=${flag.conversation_id}`}
                        className="btn btn-xs btn-outline-info rounded-pill"
                      >
                        Inspect #{flag.conversation_id.slice(-6)}
                      </Link>
                    </td>
                    <td className="text-end text-nowrap">
                      {flag.status === "open" && (
                        <button
                          type="button"
                          className="btn btn-sm btn-success me-1"
                          onClick={() => handleMarkReviewed(flag.id)}
                          title="Mark Reviewed"
                        >
                          <i className="ri-check-line me-1"></i> Mark Reviewed
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => handleUnblockConversation(flag.conversation_id)}
                        title="Unblock Conversation"
                      >
                        <i className="ri-lock-unlock-line me-1"></i> Unblock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

AiFlags.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default AiFlags;
