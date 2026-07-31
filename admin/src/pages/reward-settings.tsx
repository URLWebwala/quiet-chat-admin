import React, { useEffect, useState } from "react";
import RootLayout from "@/component/layout/Layout";
import Title from "@/extra/Title";
import { apiInstanceFetch } from "@/utils/ApiInstance";
import { setToast } from "@/utils/toastServices";

export default function RewardSettings() {
  const [form, setForm] = useState({
    coinToCurrencyRate: 100,
    currencySymbol: "$",
    currencyCode: "USD",
    userSharePercentage: 70,
    adminSharePercentage: 30,
    minWithdrawalCoins: 500,
    maxDailyWithdrawalCoins: 50000,
  });

  const [loading, setLoading] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await apiInstanceFetch.get("api/admin/reward/settings");
      if (res.status && res.data) {
        setForm({ ...form, ...res.data });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await apiInstanceFetch.post("api/admin/reward/settings", form);
      if (res.status) {
        setToast("success", "Reward & Revenue settings saved successfully!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RootLayout>
      <div className="main-content">
        <Title title="Reward Rules & Revenue Settings" name="Settings" />

        <div className="card shadow-sm border-0 p-4 mt-4 style-card">
          <h5 className="fw-bold mb-4"><i className="ri-settings-4-line text-primary me-2"></i>Global Revenue & Coin Conversion</h5>

          <form onSubmit={handleSubmit}>
            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold">Coins per 1 Currency Unit</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.coinToCurrencyRate}
                  onChange={(e) => setForm({ ...form, coinToCurrencyRate: Number(e.target.value) })}
                  required
                />
                <small className="text-muted">e.g. 100 coins = $1.00 USD</small>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Currency Code</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.currencyCode}
                  onChange={(e) => setForm({ ...form, currencyCode: e.target.value })}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Currency Symbol</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.currencySymbol}
                  onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">User Revenue Share (%)</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.userSharePercentage}
                  onChange={(e) => setForm({ ...form, userSharePercentage: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Admin Commission (%)</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.adminSharePercentage}
                  onChange={(e) => setForm({ ...form, adminSharePercentage: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Minimum Withdrawal Coins</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.minWithdrawalCoins}
                  onChange={(e) => setForm({ ...form, minWithdrawalCoins: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Max Daily Withdrawal Limit (Coins)</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.maxDailyWithdrawalCoins}
                  onChange={(e) => setForm({ ...form, maxDailyWithdrawalCoins: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary px-4" disabled={loading}>
              {loading ? "Saving..." : "Save Configuration"}
            </button>
          </form>
        </div>
      </div>
    </RootLayout>
  );
}
