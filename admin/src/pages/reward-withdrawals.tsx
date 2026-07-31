import React, { useEffect, useState } from "react";
import RootLayout from "@/component/layout/Layout";
import Title from "@/extra/Title";
import { apiInstanceFetch } from "@/utils/ApiInstance";
import { setToast } from "@/utils/toastServices";

export default function RewardWithdrawals() {
  const [requests, setRequests] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("1"); // 1: Pending
  const [loading, setLoading] = useState(false);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const res = await apiInstanceFetch.get(`api/admin/reward/withdrawals?status=${statusFilter}`);
      if (res.status) {
        setRequests(res.data?.requests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: string, newStatus: number, comment: string = "") => {
    try {
      const res = await apiInstanceFetch.patch(`api/admin/reward/withdrawal/${id}/status`, {
        status: newStatus,
        adminComment: comment,
      });
      if (res.status) {
        setToast("success", "Withdrawal status updated!");
        fetchWithdrawals();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const statusBadges: { [key: number]: { text: string; bg: string } } = {
    1: { text: "Pending", bg: "warning" },
    2: { text: "Approved", bg: "info" },
    3: { text: "Rejected", bg: "danger" },
    4: { text: "Processing", bg: "primary" },
    5: { text: "Completed", bg: "success" },
    6: { text: "Failed", bg: "dark" },
  };

  return (
    <RootLayout>
      <div className="main-content">
        <Title title="Reward Withdrawal Requests" name="Withdrawals" />

        <div className="card shadow-sm border-0 p-4 mt-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="fw-bold mb-0">Requests Queue</h5>
            <div className="btn-group">
              {[
                { label: "Pending", val: "1" },
                { label: "Approved", val: "2" },
                { label: "Rejected", val: "3" },
                { label: "Completed", val: "5" },
              ].map((b) => (
                <button
                  key={b.val}
                  className={`btn btn-${statusFilter === b.val ? "primary" : "outline-primary"}`}
                  onClick={() => setStatusFilter(b.val)}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Request No</th>
                  <th>User</th>
                  <th>Coins</th>
                  <th>Amount</th>
                  <th>Payout Type</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const badge = statusBadges[req.status] || { text: "Unknown", bg: "secondary" };
                  return (
                    <tr key={req._id}>
                      <td className="fw-bold">{req.requestNumber}</td>
                      <td>
                        <div>
                          <p className="mb-0 fw-semibold">{req.user?.name || "User"}</p>
                          <small className="text-muted">{req.user?.email || req.user?.uniqueId}</small>
                        </div>
                      </td>
                      <td className="fw-bold text-warning">{req.coins}</td>
                      <td className="fw-bold text-success">${req.amountCurrency?.toFixed(2)}</td>
                      <td className="text-uppercase fw-semibold">{req.payoutType}</td>
                      <td>
                        <span className={`badge bg-${badge.bg}`}>{badge.text}</span>
                      </td>
                      <td>
                        {req.status === 1 && (
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-success"
                              onClick={() => handleUpdateStatus(req._id, 2)}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => handleUpdateStatus(req._id, 3, "Rejected by admin")}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {req.status === 2 && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleUpdateStatus(req._id, 5, "Completed manually")}
                          >
                            Mark Completed
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {requests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">No withdrawal requests found under this status.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RootLayout>
  );
}
