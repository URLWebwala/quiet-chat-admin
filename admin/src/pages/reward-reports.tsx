import React, { useEffect, useState } from "react";
import RootLayout from "@/component/layout/Layout";
import Title from "@/extra/Title";
import { apiInstanceFetch } from "@/utils/ApiInstance";

export default function RewardReports() {
  const [reportType, setReportType] = useState("revenue");
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await apiInstanceFetch.get(`api/admin/reward/reports?type=${reportType}`);
      if (res.status) {
        setReportData(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [reportType]);

  return (
    <RootLayout>
      <div className="main-content">
        <Title title="Reports & Analytics" name="Reports" />

        <div className="card shadow-sm border-0 p-4 mt-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="fw-bold mb-0">System Analytics & Reports</h5>

            <div className="btn-group">
              {[
                { label: "Revenue Split", val: "revenue" },
                { label: "Withdrawals", val: "withdrawals" },
                { label: "Surveys", val: "surveys" },
              ].map((t) => (
                <button
                  key={t.val}
                  className={`btn btn-${reportType === t.val ? "primary" : "outline-primary"}`}
                  onClick={() => setReportType(t.val)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Category / Group</th>
                  <th>Total Coins</th>
                  <th>Total USD Value</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, idx) => (
                  <tr key={idx}>
                    <td className="fw-bold text-uppercase">{row._id || "Default"}</td>
                    <td>{row.totalCoins?.toLocaleString() || "N/A"}</td>
                    <td className="text-success fw-bold">${row.totalUsd?.toFixed(2) || row.totalAmount?.toFixed(2) || "0.00"}</td>
                    <td>{row.count || row.totalSurveys || 0}</td>
                  </tr>
                ))}

                {reportData.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-4">No report data generated yet.</td>
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
