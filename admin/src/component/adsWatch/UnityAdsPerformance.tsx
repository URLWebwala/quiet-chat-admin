import React, { useEffect, useState } from "react";
import { apiInstanceFetch } from "@/utils/ApiInstance";

interface DailyRecord {
  date: string;
  revenue: number;
  impressions: number;
  requests: number;
  ecpm: number;
  fillRate: number;
}

interface SummaryData {
  totalRevenue: number;
  totalImpressions: number;
  totalRequests: number;
  avgEcpm: number;
  fillRate: number;
}

const UnityAdsPerformance: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [days, setDays] = useState(7);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [dailyList, setDailyList] = useState<DailyRecord[]>([]);

  const fetchAnalytics = async (selectedDays: number) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await apiInstanceFetch.get(`api/admin/setting/unityAnalytics?days=${selectedDays}`);
      if (res?.status) {
        setIsConfigured(true);
        setSummary(res.summary || null);
        setDailyList(res.dailyList || []);
      } else {
        if (res?.isConfigured === false) {
          setIsConfigured(false);
        }
        setErrorMessage(res?.message || "Failed to fetch Unity Ads analytics.");
      }
    } catch (err: any) {
      console.error("Fetch Unity analytics error:", err);
      setErrorMessage(err?.message || "Failed to connect to Unity Reporting API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(days);
  }, [days]);

  return (
    <div className="unity-ads-performance-container">
      {/* Header & Filter Controls */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h5 className="mb-1 fw-bold text-dark">Unity Ads Performance & Monetization Analytics</h5>
          <p className="text-muted small mb-0">
            Real-time impressions, eCPM, fill rate, and ad revenue directly from Unity Monetization Reporting API
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select form-select-sm shadow-sm border-secondary-subtle fw-semibold"
            style={{ width: "auto", borderRadius: "8px" }}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
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

      {/* Warning Alert if Not Configured */}
      {!isConfigured && (
        <div className="alert alert-warning border-0 shadow-sm rounded-4 p-4 mb-4">
          <div className="d-flex align-items-center gap-3">
            <i className="ri-information-fill fs-2 text-warning" />
            <div>
              <h6 className="fw-bold mb-1">Unity Reporting API Not Configured</h6>
              <p className="small text-muted mb-0">
                Please enter your <strong>Unity Organization ID</strong> and <strong>Reporting API Key</strong> in the <strong>Ad API Settings</strong> tab to enable live performance analytics.
              </p>
            </div>
          </div>
        </div>
      )}

      {errorMessage && isConfigured && (
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
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-primary bg-opacity-10 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-uppercase fw-bold text-primary">Total Revenue</span>
              <div className="p-2 bg-primary text-white rounded-3">
                <i className="ri-money-dollar-circle-fill fs-5" />
              </div>
            </div>
            <h3 className="fw-bold mb-0 text-dark">
              ${loading ? "..." : (summary?.totalRevenue || 0).toFixed(2)}
            </h3>
            <span className="extra-small text-muted mt-1">Earned in last {days} days</span>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-success bg-opacity-10 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-uppercase fw-bold text-success">Total Impressions</span>
              <div className="p-2 bg-success text-white rounded-3">
                <i className="ri-eye-fill fs-5" />
              </div>
            </div>
            <h3 className="fw-bold mb-0 text-dark">
              {loading ? "..." : (summary?.totalImpressions || 0).toLocaleString()}
            </h3>
            <span className="extra-small text-muted mt-1">Ad views delivered</span>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-info bg-opacity-10 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-uppercase fw-bold text-info">Average eCPM</span>
              <div className="p-2 bg-info text-white rounded-3">
                <i className="ri-line-chart-fill fs-5" />
              </div>
            </div>
            <h3 className="fw-bold mb-0 text-dark">
              ${loading ? "..." : (summary?.avgEcpm || 0).toFixed(2)}
            </h3>
            <span className="extra-small text-muted mt-1">Effective cost per 1,000 views</span>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-warning bg-opacity-10 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-uppercase fw-bold text-warning">Fill Rate</span>
              <div className="p-2 bg-warning text-dark rounded-3">
                <i className="ri-pie-chart-2-fill fs-5" />
              </div>
            </div>
            <h3 className="fw-bold mb-0 text-dark">
              {loading ? "..." : `${summary?.fillRate || 0}%`}
            </h3>
            <span className="extra-small text-muted mt-1">Successful ad responses</span>
          </div>
        </div>
      </div>

      {/* Daily Breakdown Data Table */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-header bg-white border-0 py-3 px-4 d-flex align-items-center justify-content-between">
          <h6 className="fw-bold m-0 text-dark">Daily Performance Breakdown</h6>
          <span className="badge bg-light text-dark fw-medium border">{dailyList.length} Days Recorded</span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: "14px" }}>
            <thead className="table-light">
              <tr>
                <th className="ps-4">Date</th>
                <th>Ad Requests</th>
                <th>Impressions</th>
                <th>Fill Rate</th>
                <th>eCPM ($)</th>
                <th className="pe-4 text-end">Revenue ($)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                    Fetching Unity Monetization Reporting Data...
                  </td>
                </tr>
              ) : dailyList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    No analytics data returned for the selected date range.
                  </td>
                </tr>
              ) : (
                dailyList.map((row, idx) => (
                  <tr key={idx}>
                    <td className="ps-4 fw-semibold">{row.date || "N/A"}</td>
                    <td>{row.requests.toLocaleString()}</td>
                    <td>{row.impressions.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${row.fillRate >= 80 ? "bg-success-subtle text-success" : "bg-warning-subtle text-warning"}`}>
                        {row.fillRate}%
                      </span>
                    </td>
                    <td className="fw-medium">${row.ecpm.toFixed(2)}</td>
                    <td className="pe-4 text-end fw-bold text-success">${row.revenue.toFixed(2)}</td>
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

export default UnityAdsPerformance;
