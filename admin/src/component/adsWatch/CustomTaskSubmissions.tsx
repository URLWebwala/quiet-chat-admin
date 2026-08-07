import React, { useEffect, useState } from "react";
import Table from "@/extra/Table";
import Pagination from "@/extra/Pagination";
import { apiInstanceFetch } from "@/api/axiosApi";
import { Success, Secondary } from "@/api/toastServices";
import { baseURL } from "@/utils/config";

interface Submission {
  _id: string;
  userId: {
    _id: string;
    name: string;
    uniqueId: string;
    image: string;
    phone: string;
  };
  taskId: {
    _id: string;
    title: string;
    rewardPoints: number;
    actionUrl: string;
  };
  proofImage: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string;
  submittedAt: string;
}

const CustomTaskSubmissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalSubmissions, setTotalSubmissions] = useState(0);

  // Lightbox Preview Modal State
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Reject Modal State
  const [rejectModalSubmission, setRejectModalSubmission] = useState<Submission | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await apiInstanceFetch.get(
        `/admin/customTask/submissions?start=${page}&limit=${rowsPerPage}&status=${statusFilter}`
      );
      if (res?.status) {
        setSubmissions(res.submissions || []);
        setTotalSubmissions(res.total || 0);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [page, rowsPerPage, statusFilter]);

  const handleApprove = async (sub: Submission) => {
    if (!window.confirm(`Approve task submission for ${sub.userId?.name || "user"} and award +${sub.taskId?.rewardPoints || 50} points?`)) {
      return;
    }

    try {
      const res = await apiInstanceFetch.post("/admin/customTask/verifySubmission", {
        submissionId: sub._id,
        status: "approved",
      });

      if (res?.status) {
        Success(res.message || "Submission approved successfully!");
        fetchSubmissions();
      } else {
        Secondary(res?.message || "Failed to approve submission");
      }
    } catch (err: any) {
      console.error(err);
      Secondary("Failed to approve submission");
    }
  };

  const handleOpenRejectModal = (sub: Submission) => {
    setRejectModalSubmission(sub);
    setRejectionReason("Screenshot proof not valid or unverified.");
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalSubmission) return;

    try {
      const res = await apiInstanceFetch.post("/admin/customTask/verifySubmission", {
        submissionId: rejectModalSubmission._id,
        status: "rejected",
        rejectionReason,
      });

      if (res?.status) {
        Success("Submission rejected");
        setRejectModalSubmission(null);
        fetchSubmissions();
      }
    } catch (err: any) {
      console.error(err);
      Secondary("Failed to reject submission");
    }
  };

  const getFullImageUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const origin = (baseURL || "https://admin.quietchat.in").replace(/\/api\/?$/, "");
    return `${origin}/${path}`;
  };

  const columns = [
    {
      Header: "User",
      Cell: ({ row }: { row: Submission }) => (
        <div className="d-flex align-items-center gap-2">
          <img
            src={getFullImageUrl(row.userId?.image) || "https://via.placeholder.com/40"}
            alt=""
            className="rounded-circle"
            style={{ width: 38, height: 38, objectFit: "cover" }}
          />
          <div>
            <div className="fw-semibold small">{row.userId?.name || "Unknown User"}</div>
            <div className="text-muted extra-small">ID: {row.userId?.uniqueId || "-"}</div>
          </div>
        </div>
      ),
    },
    {
      Header: "Task",
      Cell: ({ row }: { row: Submission }) => (
        <div>
          <div className="fw-semibold small">{row.taskId?.title || "Custom Task"}</div>
          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-0 extra-small">
            +{row.taskId?.rewardPoints || 50} Points
          </span>
        </div>
      ),
    },
    {
      Header: "Proof Screenshot",
      Cell: ({ row }: { row: Submission }) => (
        row.proofImage ? (
          <div className="position-relative" style={{ cursor: "pointer" }} onClick={() => setPreviewImage(getFullImageUrl(row.proofImage))}>
            <img
              src={getFullImageUrl(row.proofImage)}
              alt="Proof"
              className="rounded border"
              style={{ width: 50, height: 50, objectFit: "cover" }}
            />
            <span className="badge bg-dark position-absolute bottom-0 end-0 extra-small">View</span>
          </div>
        ) : (
          <span className="text-muted extra-small">No Image</span>
        )
      ),
    },
    {
      Header: "Submitted Date",
      Cell: ({ row }: { row: Submission }) => (
        <span className="small text-muted">{new Date(row.submittedAt).toLocaleString()}</span>
      ),
    },
    {
      Header: "Status",
      Cell: ({ row }: { row: Submission }) => {
        if (row.status === "approved") {
          return <span className="badge bg-success text-white">Approved</span>;
        } else if (row.status === "rejected") {
          return (
            <div>
              <span className="badge bg-danger text-white">Rejected</span>
              {row.rejectionReason && (
                <div className="extra-small text-danger mt-1" style={{ maxWidth: 180 }}>
                  {row.rejectionReason}
                </div>
              )}
            </div>
          );
        }
        return <span className="badge bg-warning text-dark">Pending Review</span>;
      },
    },
    {
      Header: "Verification",
      Cell: ({ row }: { row: Submission }) => (
        row.status === "pending" ? (
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-success d-flex align-items-center gap-1" onClick={() => handleApprove(row)}>
              <i className="ri-check-line"></i> Approve
            </button>
            <button className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" onClick={() => handleOpenRejectModal(row)}>
              <i className="ri-close-line"></i> Reject
            </button>
          </div>
        ) : (
          <span className="text-muted small">Processed</span>
        )
      ),
    },
  ];

  const handlePageChange = (_event: React.MouseEvent | null, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(parseInt(value, 10));
    setPage(1);
  };

  return (
    <div className="card border-0 shadow-sm p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h5 className="mb-1">Task Submissions Verification</h5>
          <p className="text-muted small mb-0">Review user screenshot proofs and approve/reject to award points</p>
        </div>
        <div className="d-flex gap-2">
          <button
            className={`btn btn-sm ${statusFilter === "pending" ? "btn-warning" : "btn-outline-secondary"}`}
            onClick={() => { setStatusFilter("pending"); setPage(1); }}
          >
            Pending
          </button>
          <button
            className={`btn btn-sm ${statusFilter === "approved" ? "btn-success" : "btn-outline-secondary"}`}
            onClick={() => { setStatusFilter("approved"); setPage(1); }}
          >
            Approved
          </button>
          <button
            className={`btn btn-sm ${statusFilter === "rejected" ? "btn-danger" : "btn-outline-secondary"}`}
            onClick={() => { setStatusFilter("rejected"); setPage(1); }}
          >
            Rejected
          </button>
          <button
            className={`btn btn-sm ${statusFilter === "all" ? "btn-dark" : "btn-outline-secondary"}`}
            onClick={() => { setStatusFilter("all"); setPage(1); }}
          >
            All Submissions
          </button>
        </div>
      </div>

      <Table data={submissions} mapData={columns} />

      <Pagination
        type="server"
        serverPage={page}
        setServerPage={setPage}
        serverPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        totalData={totalSubmissions}
      />

      {/* Lightbox Modal */}
      {previewImage && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.8)" }} onClick={() => setPreviewImage(null)}>
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content bg-transparent border-0 text-center">
              <div className="text-end mb-2">
                <button className="btn btn-sm btn-light rounded-circle" onClick={() => setPreviewImage(null)}>
                  <i className="ri-close-line fs-4"></i>
                </button>
              </div>
              <img src={previewImage} alt="Full Proof" className="img-fluid rounded shadow" style={{ maxHeight: "80vh", objectFit: "contain" }} />
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModalSubmission && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title">Reject Submission</h5>
                <button type="button" className="btn-close" onClick={() => setRejectModalSubmission(null)}></button>
              </div>
              <form onSubmit={handleConfirmReject}>
                <div className="modal-body">
                  <p className="small text-muted mb-2">Please state the rejection reason for user {rejectModalSubmission.userId?.name}:</p>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setRejectModalSubmission(null)}>Cancel</button>
                  <button type="submit" className="btn btn-danger">Reject Submission</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomTaskSubmissions;
