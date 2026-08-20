import React, { useEffect, useState } from "react";
import { apiInstanceFetch } from "@/utils/ApiInstance";

interface DailyRecord {
  date: string;
  surveys: number;
  coins: number;
  revenueUsd: number;
}

interface SummaryData {
  totalSurveys: number;
  totalCoinsRewarded: number;
  totalRevenueUsd: number;
  avgCoinsPerSurvey: number;
}

interface RecentTx {
  _id: string;
  transactionId: string;
  user?: {
    name: string;
    uniqueId: string;
    email: string;
  };
  coins: number;
  usdAmount: number;
  createdAt: string;
}

const TheoremReachPerformance: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [days, setDays] = useState(7);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [dailyList, setDailyList] = useState<DailyRecord[]>([]);
  const [recentTxList, setRecentTxList] = useState<RecentTx[]>([]);

  const fetchAnalytics = async (selectedDays: number) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await apiInstanceFetch.get(`api/admin/setting/theoremreachAnalytics?days=${selectedDays}`);
      if (res?.status) {
        setSummary(res.summary || null);
        setDailyList(res.dailyList || []);
        setRecentTxList(res.recentTransactions || []);
      } else {
        setErrorMessage(res?.message || "Failed to fetch TheoremReach analytics.");
      }
    } catch (err: any) {
      console.error("Fetch TheoremReach analytics error:", err);
      setErrorMessage(err?.message || "Failed to connect to TheoremReach Analytics API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(days);
  }, [days]);

  return (
    <div className="theoremreach-performance-container">
      {/* Header & Filter Controls */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h5 className="mb-1 fw-bold text-dark">
            <i className="ri-bubble-chart-line text-primary me-2"></i>
            TheoremReach Survey Router & Publisher Performance
          </h5>
          <p className="text-muted small mb-0">
            Real-time survey completions, virtual coins awarded, USD revenue, and S2S postback transactions
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select form-select-sm shadow-sm border-secondary-subtle fw-semibold"
            style={{ width: "auto", borderRadius: "8px" }}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={0}>Today</option>
            <option value={7}>Last 7 Days</option>
            <option value={14}>Last 14 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
          <button
            className="btn btn-sm btn-outline-primary shadow-sm"
            style={{ borderRadius: "8px" }}
            onClick={() => fetchAnalytics(days)}
            disabled={loading}
            title="Refresh Analytics"
          >
            <i className={`ri-refresh-line ${loading ? "spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="alert alert-danger border-0 shadow-sm rounded-3 p-3 mb-4">
          <div className="d-flex align-items-center gap-2">
            <i className="ri-error-warning-fill fs-5" />
            <span className="small fw-medium">{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Summary KPI Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-xl-3 col-sm-6">
          <div
            className="card border-0 shadow-sm p-3 h-100 rounded-4 text-white"
            style={{ background: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)" }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <p className="text-white-50 small mb-1 fw-semibold">Surveys Completed</p>
                <h3 className="mb-0 fw-bold">{summary?.totalSurveys ?? 0}</h3>
                <small className="text-white-50 mt-1 d-block">TheoremReach Sessions</small>
              </div>
              <div className="p-2 bg-white bg-opacity-25 rounded-3">
                <i className="ri-survey-line fs-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6">
          <div
            className="card border-0 shadow-sm p-3 h-100 rounded-4 text-white"
            style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)" }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <p className="text-white-50 small mb-1 fw-semibold">Est. Publisher Revenue</p>
                <h3 className="mb-0 fw-bold">${summary?.totalRevenueUsd?.toFixed(2) ?? "0.00"}</h3>
                <small className="text-white-50 mt-1 d-block">USD Earned</small>
              </div>
              <div className="p-2 bg-white bg-opacity-25 rounded-3">
                <i className="ri-money-dollar-circle-line fs-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6">
          <div
            className="card border-0 shadow-sm p-3 h-100 rounded-4 text-white"
            style={{ background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)" }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <p className="text-white-50 small mb-1 fw-semibold">Total Coins Rewarded</p>
                <h3 className="mb-0 fw-bold">{summary?.totalCoinsRewarded?.toLocaleString() ?? 0}</h3>
                <small className="text-white-50 mt-1 d-block">User Wallet Credits</small>
              </div>
              <div className="p-2 bg-white bg-opacity-25 rounded-3">
                <i className="ri-copper-coin-line fs-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6">
          <div
            className="card border-0 shadow-sm p-3 h-100 rounded-4 text-white"
            style={{ background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)" }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <p className="text-white-50 small mb-1 fw-semibold">Avg. Reward / Survey</p>
                <h3 className="mb-0 fw-bold">{summary?.avgCoinsPerSurvey ?? 0} Coins</h3>
                <small className="text-white-50 mt-1 d-block">Average User Payout</small>
              </div>
              <div className="p-2 bg-white bg-opacity-25 rounded-3">
                <i className="ri-gift-line fs-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Performance & Recent Logs Table */}
      <div className="row g-4">
        {/* Daily Breakdown Table */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h6 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
              <i className="ri-calendar-line text-primary"></i>
              Daily Performance Breakdown
            </h6>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary spinner-border-sm me-2" role="status" />
                <span className="text-muted small">Loading TheoremReach stats...</span>
              </div>
            ) : dailyList.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="ri-inbox-line fs-1 d-block mb-2 text-secondary" />
                <span className="small">No TheoremReach survey data found for selected period.</span>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="small text-muted fw-semibold">Date</th>
                      <th className="small text-muted fw-semibold text-center">Surveys</th>
                      <th className="small text-muted fw-semibold text-center">Coins</th>
                      <th className="small text-muted fw-semibold text-end">Est. USD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyList.map((row, idx) => (
                      <tr key={idx}>
                        <td className="fw-semibold text-dark small">{row.date}</td>
                        <td className="text-center small">
                          <span className="badge bg-primary-subtle text-primary fw-bold px-2 py-1 rounded-pill">
                            {row.surveys}
                          </span>
                        </td>
                        <td className="text-center small text-warning fw-bold">
                          +{row.coins.toLocaleString()}
                        </td>
                        <td className="text-end small fw-bold text-success">
                          ${row.revenueUsd.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent Real-Time S2S Transactions */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h6 className="fw-bold mb-3 text-dark d-flex align-items-center justify-content-between">
              <span className="d-flex align-items-center gap-2">
                <i className="ri-history-line text-success"></i>
                Recent S2S Postback Transactions
              </span>
              <span className="badge bg-success-subtle text-success small rounded-pill">
                ● Live Callbacks
              </span>
            </h6>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary spinner-border-sm me-2" role="status" />
                <span className="text-muted small">Loading callbacks...</span>
              </div>
            ) : recentTxList.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="ri-shield-check-line fs-1 d-block mb-2 text-secondary" />
                <span className="small">No S2S postbacks recorded yet. Run a test callback to see live data.</span>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="small text-muted fw-semibold">User</th>
                      <th className="small text-muted fw-semibold">Tx ID</th>
                      <th className="small text-muted fw-semibold text-center">Reward</th>
                      <th className="small text-muted fw-semibold text-end">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTxList.map((tx) => (
                      <tr key={tx._id}>
                        <td className="small">
                          <div className="fw-semibold text-dark">{tx.user?.name || "User"}</div>
                          <small className="text-muted">{tx.user?.uniqueId || "-"}</small>
                        </td>
                        <td className="small">
                          <code className="text-secondary fw-semibold" style={{ fontSize: "11px" }}>
                            {tx.transactionId ? `${tx.transactionId.slice(0, 10)}...` : "-"}
                          </code>
                        </td>
                        <td className="text-center small">
                          <span className="badge bg-warning-subtle text-warning-emphasis fw-bold px-2 py-1 rounded-pill">
                            +{tx.coins} Coins
                          </span>
                        </td>
                        <td className="text-end small text-muted">
                          {new Date(tx.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TheoremReachPerformance;
