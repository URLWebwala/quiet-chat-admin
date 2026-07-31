import React, { useEffect, useState } from "react";
import RootLayout from "@/component/layout/Layout";
import Title from "@/extra/Title";
import { apiInstanceFetch } from "@/utils/ApiInstance";

export default function RewardDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await apiInstanceFetch.get("api/admin/reward/dashboard");
      if (res.status) {
        setStats(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const cards = stats?.cards || {
    totalCoinsInWallets: 0,
    todaysRewards: 0,
    todaysSurveys: 0,
    pendingWithdrawals: 0,
    completedWithdrawalsAmount: 0,
  };

  return (
    <RootLayout>
      <div className="main-content">
        <Title title="Reward System Dashboard" name="Overview" />

        <div className="row mt-4">
          <div className="col-lg-3 col-md-6 mb-4">
            <div className="card shadow-sm border-0 p-3" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#fff" }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-white-50 mb-1">Total Coins in Wallets</h6>
                  <h3 className="mb-0 fw-bold">{cards.totalCoinsInWallets.toLocaleString()}</h3>
                </div>
                <i className="ri-coins-line fs-32 text-white-50"></i>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-4">
            <div className="card shadow-sm border-0 p-3" style={{ background: "linear-gradient(135deg, #2af598 0%, #009efd 100%)", color: "#fff" }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-white-50 mb-1">Today's Rewards Issued</h6>
                  <h3 className="mb-0 fw-bold">{cards.todaysRewards.toLocaleString()}</h3>
                </div>
                <i className="ri-gift-line fs-32 text-white-50"></i>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-4">
            <div className="card shadow-sm border-0 p-3" style={{ background: "linear-gradient(135deg, #ff0844 0%, #ffb199 100%)", color: "#fff" }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-white-50 mb-1">Today's Surveys</h6>
                  <h3 className="mb-0 fw-bold">{cards.todaysSurveys}</h3>
                </div>
                <i className="ri-survey-line fs-32 text-white-50"></i>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-4">
            <div className="card shadow-sm border-0 p-3" style={{ background: "linear-gradient(135deg, #f12711 0%, #f5af19 100%)", color: "#fff" }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-white-50 mb-1">Pending Withdrawals</h6>
                  <h3 className="mb-0 fw-bold">{cards.pendingWithdrawals}</h3>
                </div>
                <i className="ri-time-line fs-32 text-white-50"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Survey Providers Breakdown */}
        <div className="row mt-3">
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm border-0 p-4">
              <h5 className="fw-bold mb-3">Survey Provider Stats</h5>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Provider</th>
                      <th>Completions</th>
                      <th>Coins Issued</th>
                      <th>USD Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.providerStats || []).map((p: any, idx: number) => (
                      <tr key={idx}>
                        <td className="fw-semibold text-uppercase">{p._id}</td>
                        <td>{p.count}</td>
                        <td>{p.totalCoins?.toLocaleString()}</td>
                        <td>${p.totalUsd?.toFixed(2)}</td>
                      </tr>
                    ))}
                    {(!stats?.providerStats || stats.providerStats.length === 0) && (
                      <tr>
                        <td colSpan={4} className="text-center text-muted">No provider callbacks recorded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Wallet Ledger */}
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm border-0 p-4">
              <h5 className="fw-bold mb-3">Recent Ledger Activity</h5>
              <div className="table-responsive">
                <table className="table table-sm table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>User</th>
                      <th>Type</th>
                      <th>Coins</th>
                      <th>Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.recentTx || []).map((tx: any, idx: number) => (
                      <tr key={idx}>
                        <td>{tx.user?.name || "User"}</td>
                        <td>
                          <span className={`badge bg-${tx.type === "credit" ? "success" : "danger"}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="fw-bold">{tx.amount}</td>
                        <td>{tx.category}</td>
                      </tr>
                    ))}
                    {(!stats?.recentTx || stats.recentTx.length === 0) && (
                      <tr>
                        <td colSpan={4} className="text-center text-muted">No transactions found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RootLayout>
  );
}
