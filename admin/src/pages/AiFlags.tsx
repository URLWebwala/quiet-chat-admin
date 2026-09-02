import React, { useEffect, useState } from "react";
import RootLayout from "@/component/layout/Layout";
import Title from "@/extra/Title";
import Link from "next/link";
import { fetchFlags, updateFlag, updateConversation, AiFlag } from "@/utils/aiChatApi";
import { toast } from "react-toastify";
import { FaShieldAlt, FaCheck, FaLockOpen } from "react-icons/fa";
import CustomSelect from "@/extra/CustomSelect";
import Searching from "@/extra/Searching";

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
      <style jsx global>{`
        .ai-sq-input,
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
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Title name="AI Safety Flags & Moderation" display="none" />
        </div>

        {/* Filter Bar using Custom Searching Component */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-3">
          <div className="d-flex flex-wrap align-items-center gap-3" style={{ minWidth: "320px", flex: "1 1 320px" }}>
            <div className="btn-group" role="group">
              <button
                type="button"
                className={`btn ai-sq-btn px-3 py-2 ${
                  statusFilter === "open" ? "btn-dark text-white shadow-sm" : "btn-outline-secondary"
                }`}
                onClick={() => setStatusFilter("open")}
              >
                Open Flags
              </button>
              <button
                type="button"
                className={`btn ai-sq-btn px-3 py-2 ${
                  statusFilter === "reviewed" ? "btn-dark text-white shadow-sm" : "btn-outline-secondary"
                }`}
                onClick={() => setStatusFilter("reviewed")}
              >
                Reviewed
              </button>
            </div>

            <div style={{ minWidth: "180px", maxWidth: "240px", flex: 1 }}>
              <CustomSelect
                options={[
                  { value: "all", label: "All Severities" },
                  { value: "critical", label: "Critical" },
                  { value: "high", label: "High" },
                  { value: "medium", label: "Medium" },
                  { value: "low", label: "Low" },
                ]}
                value={severityFilter}
                onChange={(val: any) => setSeverityFilter(val)}
                placeholder="Severity..."
              />
            </div>
          </div>

          <div style={{ minWidth: "280px", maxWidth: "450px", flex: "1 1 280px" }}>
            <Searching
              type="server"
              serverSearching={(val: string) => setSearchQuery(val || "")}
              placeholder="Search flags by message, label, reason..."
            />
          </div>
        </div>

        <div className="card ai-sq-card p-4 mb-4">

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="text-muted mt-2 fs-13">Loading moderation flags...</p>
            </div>
          ) : filteredFlags.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <FaShieldAlt className="fs-1 text-success mb-2 d-block mx-auto" />
              <h5 className="fw-bold text-dark">No Safety Flags Found</h5>
              <p className="fs-13">There are currently no {statusFilter} safety flags matching your criteria.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle table-hover fs-13 mb-0">
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
                        <span className="badge bg-light text-dark border ai-sq-pill px-2.5 py-1">
                          {flag.safety_label || "Unknown"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getSeverityBadge(flag.severity)} ai-sq-pill px-2.5 py-1`}>
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
                          className="btn btn-xs btn-outline-info ai-sq-pill"
                        >
                          Inspect #{flag.conversation_id.slice(-6)}
                        </Link>
                      </td>
                      <td className="text-end text-nowrap">
                        {flag.status === "open" && (
                          <button
                            type="button"
                            className="btn btn-sm btn-success ai-sq-btn me-1 px-2.5 py-1"
                            onClick={() => handleMarkReviewed(flag.id)}
                            title="Mark Reviewed"
                          >
                            <FaCheck /> Reviewed
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-warning ai-sq-btn px-2.5 py-1"
                          onClick={() => handleUnblockConversation(flag.conversation_id)}
                          title="Unblock Conversation"
                        >
                          <FaLockOpen /> Unblock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

AiFlags.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default AiFlags;
