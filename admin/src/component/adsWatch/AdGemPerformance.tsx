import React, { useEffect, useState } from "react";
import { apiInstanceFetch } from "@/utils/ApiInstance";

interface DailyRecord {
  date: string;
  impressions?: number;
  clicks: number;
  conversions: number;
  revenueUsd: number;
  ecpm?: number;
  conversionRate?: string | number;
}

interface SummaryData {
  totalRevenueUsd: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  ecpm: number;
  conversionRate: number;
}

const AdGemPerformance: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [days, setDays] = useState(7);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [dailyList, setDailyList] = useState<DailyRecord[]>([]);

  const fetchAnalytics = async (selectedDays: number) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await apiInstanceFetch.get(`api/admin/setting/adgemAnalytics?days=${selectedDays}`);
      if (res?.status) {
        setSummary(res.summary || null);
        setDailyList(res.dailyList || []);
      } else {
        setErrorMessage(res?.message || "Failed to fetch AdGem analytics.");
      }
    } catch (err: any) {
      console.error("Fetch AdGem analytics error:", err);
      setErrorMessage(err?.message || "Failed to connect to AdGem Analytics API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(days);
  }, [days]);

  return (
    <div className="adgem-performance-container">
      {/* Header & Filter Controls */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h5 className="mb-1 fw-bold text-dark">
            <i className="ri-vip-diamond-line text-danger me-2"></i>
            AdGem Offerwall & Reporting Performance
          </h5>
          <p className="text-muted small mb-0">
            Live offerwall impressions, clicks, conversions, eCPM, and revenue USD from AdGem API
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
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-danger bg-opacity-10 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-uppercase fw-bold text-danger">Total Revenue (USD)</span>
              <i className="ri-money-dollar-circle-line fs-4 text-danger" />
            </div>
            <h3 className="fw-bold mb-0 text-dark">
              ${(summary?.totalRevenueUsd || 0).toFixed(2)}
            </h3>
            <span className="small text-muted">Earned from completed offers</span>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-primary bg-opacity-10 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-uppercase fw-bold text-primary">Conversions / Completes</span>
              <i className="ri-checkbox-circle-line fs-4 text-primary" />
            </div>
            <h3 className="fw-bold mb-0 text-dark">
              {(summary?.totalConversions || 0).toLocaleString()}
            </h3>
            <span className="small text-muted">Successful conversions</span>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-info bg-opacity-10 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-uppercase fw-bold text-info">Offerwall Clicks</span>
              <i className="ri-cursor-line fs-4 text-info" />
            </div>
            <h3 className="fw-bold mb-0 text-dark">
              {(summary?.totalClicks || 0).toLocaleString()}
            </h3>
            <span className="small text-muted">User offer engagements</span>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-warning bg-opacity-10 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-uppercase fw-bold text-warning">Conversion Rate</span>
              <i className="ri-percent-line fs-4 text-warning" />
            </div>
            <h3 className="fw-bold mb-0 text-dark">
              {summary?.conversionRate || 0}%
            </h3>
            <span className="small text-muted">Completes / Clicks</span>
          </div>
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="card border-0 shadow-sm rounded-4 p-4">
        <h6 className="fw-bold mb-3 text-dark">Daily Conversion & Revenue Breakdown</h6>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
            <thead className="table-light">
              <tr>
                <th>Date</th>
                <th className="text-center">Impressions</th>
                <th className="text-center">Clicks</th>
                <th className="text-center">Conversions</th>
                <th className="text-center">eCPM</th>
                <th className="text-end">Revenue USD</th>
              </tr>
            </thead>
            <tbody>
              {dailyList.map((row, idx) => (
                <tr key={idx}>
                  <td className="fw-semibold text-dark">{row.date}</td>
                  <td className="text-center text-muted">{(row.impressions || 0).toLocaleString()}</td>
                  <td className="text-center text-info fw-semibold">{(row.clicks || 0).toLocaleString()}</td>
                  <td className="text-center text-success fw-bold">{(row.conversions || 0).toLocaleString()}</td>
                  <td className="text-center text-muted">${(row.ecpm || 0).toFixed(2)}</td>
                  <td className="text-end fw-bold text-dark">${(row.revenueUsd || 0).toFixed(2)}</td>
                </tr>
              ))}
              {dailyList.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    No AdGem performance data found for the selected timeframe.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdGemPerformance;
