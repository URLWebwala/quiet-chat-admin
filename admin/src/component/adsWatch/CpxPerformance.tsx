import React, { useEffect, useState } from "react";
import { apiInstanceFetch } from "@/utils/ApiInstance";

interface DailyRecord {
  date: string;
  clicks: number;
  completes: number;
  screenouts: number;
  revenueUsd: number;
  conversionRate: number;
}

interface SummaryData {
  totalRevenue: number;
  totalClicks: number;
  totalCompletes: number;
  totalScreenouts: number;
  conversionRate: number;
}

const CpxPerformance: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [days, setDays] = useState(7);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [dailyList, setDailyList] = useState<DailyRecord[]>([]);

  const fetchAnalytics = async (selectedDays: number) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await apiInstanceFetch.get(`api/admin/setting/cpxAnalytics?days=${selectedDays}`);
      if (res?.status) {
        setSummary(res.summary || null);
        setDailyList(res.dailyList || []);
      } else {
        setErrorMessage(res?.message || "Failed to fetch CPX Research analytics.");
      }
    } catch (err: any) {
      console.error("Fetch CPX analytics error:", err);
      setErrorMessage(err?.message || "Failed to connect to CPX Analytics API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(days);
  }, [days]);

  return (
    <div className="cpx-performance-container">
      {/* Header & Filter Controls */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h5 className="mb-1 fw-bold text-dark">CPX Research Survey Performance & Revenue Analytics</h5>
          <p className="text-muted small mb-0">
            Real-time survey clicks, completed surveys, screenouts, conversion rate, and revenue USD
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
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-success bg-opacity-10 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-uppercase fw-bold text-success">Total Revenue USD</span>
              <div className="p-2 bg-success text-white rounded-3">
                <i className="ri-money-dollar-circle-fill fs-5" />
              </div>
            </div>
            <h3 className="fw-bold mb-0 text-dark">
              ${loading ? "..." : (summary?.totalRevenue || 0).toFixed(2)}
            </h3>
            <span className="extra-small text-muted mt-1">
              {days === 0 ? "Earned Today" : `Earned in last ${days} days`}
            </span>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-primary bg-opacity-10 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-uppercase fw-bold text-primary">Survey Clicks</span>
              <div className="p-2 bg-primary text-white rounded-3">
                <i className="ri-cursor-fill fs-5" />
              </div>
            </div>
            <h3 className="fw-bold mb-0 text-dark">
              {loading ? "..." : (summary?.totalClicks || 0).toLocaleString()}
            </h3>
            <span className="extra-small text-muted mt-1">User survey attempts</span>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-info bg-opacity-10 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-uppercase fw-bold text-info">Completes</span>
              <div className="p-2 bg-info text-white rounded-3">
                <i className="ri-checkbox-circle-fill fs-5" />
              </div>
            </div>
            <h3 className="fw-bold mb-0 text-dark">
              {loading ? "..." : (summary?.totalCompletes || 0).toLocaleString()}
            </h3>
            <span className="extra-small text-muted mt-1">Successful survey completes</span>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-warning bg-opacity-10 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-uppercase fw-bold text-warning">Conversion Rate</span>
              <div className="p-2 bg-warning text-dark rounded-3">
                <i className="ri-percent-fill fs-5" />
              </div>
            </div>
            <h3 className="fw-bold mb-0 text-dark">
              {loading ? "..." : `${summary?.conversionRate || 0}%`}
            </h3>
            <span className="extra-small text-muted mt-1">Completes vs Clicks ratio</span>
          </div>
        </div>
      </div>

      {/* Daily Breakdown Data Table */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-header bg-white border-0 py-3 px-4 d-flex align-items-center justify-content-between">
          <h6 className="fw-bold m-0 text-dark">Daily Survey Performance Breakdown</h6>
          <span className="badge bg-light text-dark fw-medium border">{dailyList.length} Days Recorded</span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: "14px" }}>
            <thead className="table-light">
              <tr>
                <th className="ps-4">Date</th>
                <th>Clicks</th>
                <th>Completes</th>
                <th>Screen Outs</th>
                <th>Conversion Rate</th>
                <th className="pe-4 text-end">Revenue ($)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                    Fetching CPX Research Survey Performance...
                  </td>
                </tr>
              ) : dailyList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    No survey performance data recorded for the selected date range.
                  </td>
                </tr>
              ) : (
                dailyList.map((row, idx) => (
                  <tr key={idx}>
                    <td className="ps-4 fw-semibold">{row.date || "N/A"}</td>
                    <td>{row.clicks.toLocaleString()}</td>
                    <td>
                      <span className="badge bg-success-subtle text-success border border-success-subtle">
                        {row.completes.toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                        {row.screenouts.toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className="fw-medium">{row.conversionRate}%</span>
                    </td>
                    <td className="pe-4 text-end fw-bold text-success">${row.revenueUsd.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CpxPerformance;
