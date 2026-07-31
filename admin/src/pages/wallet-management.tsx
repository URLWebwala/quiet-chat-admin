import React, { useState } from "react";
import RootLayout from "@/component/layout/Layout";
import Title from "@/extra/Title";
import { apiInstanceFetch } from "@/utils/ApiInstance";
import { setToast } from "@/utils/toastServices";

export default function WalletManagement() {
  const [userId, setUserId] = useState("");
  const [type, setType] = useState("credit");
  const [coins, setCoins] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // Freeze state
  const [freezeUserId, setFreezeUserId] = useState("");
  const [freezeReason, setFreezeReason] = useState("");
  const [isFrozen, setIsFrozen] = useState(true);

  const handleManualAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !coins) {
      setToast("error", "User ID and coins are required");
      return;
    }

    try {
      setLoading(true);
      const res = await apiInstanceFetch.post("api/admin/reward/wallet/manual", {
        userId,
        type,
        coins: Number(coins),
        description,
      });

      if (res.status) {
        setToast("success", res.message);
        setUserId("");
        setCoins("");
        setDescription("");
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFreeze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!freezeUserId) {
      setToast("error", "User ID required");
      return;
    }

    try {
      setLoading(true);
      const res = await apiInstanceFetch.post("api/admin/reward/wallet/freeze", {
        userId: freezeUserId,
        isFrozen,
        freezeReason,
      });

      if (res.status) {
        setToast("success", res.message);
        setFreezeUserId("");
        setFreezeReason("");
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RootLayout>
      <div className="main-content">
        <Title title="Wallet & Ledger Management" name="Wallet" />

        <div className="row mt-4">
          {/* Manual Adjust Card */}
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm border-0 p-4">
              <h5 className="fw-bold mb-3"><i className="ri-coin-line text-warning me-2"></i>Manual Credit / Debit Wallet</h5>
              <form onSubmit={handleManualAdjust}>
                <div className="mb-3">
                  <label className="form-label">User Mongo ID</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter User _id"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    required
                  />
                </div>

                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">Operation</label>
                    <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                      <option value="credit">Credit (+) Coins</option>
                      <option value="debit">Debit (-) Coins</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label">Amount (Coins)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 500"
                      value={coins}
                      onChange={(e) => setCoins(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Reason / Description</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Admin adjustment for campaign bonus"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? "Processing..." : "Submit Adjustment"}
                </button>
              </form>
            </div>
          </div>

          {/* Freeze Wallet Card */}
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm border-0 p-4">
              <h5 className="fw-bold mb-3"><i className="ri-lock-2-line text-danger me-2"></i>Freeze / Unfreeze Wallet</h5>
              <form onSubmit={handleFreeze}>
                <div className="mb-3">
                  <label className="form-label">User Mongo ID</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter User _id"
                    value={freezeUserId}
                    onChange={(e) => setFreezeUserId(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Wallet Status</label>
                  <select className="form-select" value={isFrozen ? "true" : "false"} onChange={(e) => setIsFrozen(e.target.value === "true")}>
                    <option value="true">Freeze Wallet (Block Withdrawals)</option>
                    <option value="false">Unfreeze Wallet (Active)</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Freeze Reason</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Suspicious survey completion rate"
                    value={freezeReason}
                    onChange={(e) => setFreezeReason(e.target.value)}
                  />
                </div>

                <button type="submit" className={`btn btn-${isFrozen ? "danger" : "success"} w-100`} disabled={loading}>
                  {loading ? "Updating..." : isFrozen ? "Freeze User Wallet" : "Unfreeze User Wallet"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </RootLayout>
  );
}
