import Button from "@/extra/Button";
import Table from "@/extra/Table";
import ToggleSwitch from "@/extra/TogggleSwitch";
import image from "@/assets/images/bannerImage.png";
import EditIcon from "@/assets/images/edit.svg";
import TrashIcon from "@/assets/images/delete.svg";
import coin from "@/assets/images/coin.png";
import {
  deleteAdsWatchReward,
  getAdsWatchRewards,
  toggleAdsWatchRewardStatus,
  updateAdsWatchReward,
} from "@/store/adsWatchSlice";
import { openDialog } from "@/store/dialogSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { formatCoins } from "@/utils/Common";
import CommonDialog from "@/utils/CommonDialog";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const AdsWatchRewardManagement = () => {
  const dispatch = useAppDispatch();
  const { rewards } = useSelector((state: RootStore) => state.adsWatch);
  const [filter, setFilter] = useState<"all" | "user" | "host">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    dispatch(getAdsWatchRewards(filter));
  }, [dispatch, filter]);

  const confirmDelete = () => {
    if (selectedId) {
      dispatch(deleteAdsWatchReward(selectedId));
      setShowDialog(false);
      setSelectedId(null);
    }
  };

  const filteredRewards =
    filter === "all" ? rewards : rewards.filter((item: any) => item.target === filter);

  const emptyFilterHint =
    filter === "host"
      ? "No host rewards yet. Create one with the Hosts button in Add Reward, or switch to All / Users."
      : filter === "user"
        ? "No user rewards yet. Create one with the Users button in Add Reward, or switch to All."
        : "No rewards created yet. Click + Add Reward to create your first pack.";

  const handleToggleComingSoon = async (reward: any) => {
    const updatedStatus = !reward?.isComingSoon;
    const action = await dispatch(
      updateAdsWatchReward({
        rewardId: reward._id,
        isComingSoon: updatedStatus,
      })
    );
    if (updateAdsWatchReward.fulfilled.match(action)) {
      dispatch(getAdsWatchRewards(filter));
    }
  };

  const rewardTable = [
    {
      Header: "Reward Name",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => (
        <div className="d-flex align-items-center justify-content-center gap-2">
          <Image src={coin} alt="" width={22} height={22} />
          <span className="fw-bold text-dark">{row?.name || "-"}</span>
        </div>
      ),
    },
    {
      Header: "Target",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => (
        <div className="d-flex justify-content-center">
          <span
            className={`badge rounded-pill px-2.5 py-1.5 ${row?.target === "host" ? "bg-warning text-dark" : "bg-primary text-white"}`}
            style={{ fontSize: "11px", fontWeight: 600 }}
          >
            {row?.target === "host" ? "Host" : "User"}
          </span>
        </div>
      ),
    },
    {
      Header: "Reward Type",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => {
        const isRupee = row?.rewardType === "rupee";
        return (
          <div className="d-flex justify-content-center">
            <span
              className={`badge rounded-pill px-2.5 py-1.5 ${isRupee ? "bg-success text-white" : "bg-warning-subtle text-dark"}`}
              style={{ fontSize: "11px", fontWeight: 600, border: isRupee ? "none" : "1px solid #d4af37" }}
            >
              {isRupee ? "💰 Rupees (INR)" : "🪙 Wallet Coins"}
            </span>
          </div>
        );
      },
    },
    {
      Header: "Required Points",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => (
        <div className="d-flex justify-content-center">
          <span className="fw-bold text-primary" style={{ fontSize: "13px" }}>
            ⭐ {formatCoins(row?.requiredPoints || 0)} Pts
          </span>
        </div>
      ),
    },
    {
      Header: "Payout Value",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => {
        const isRupee = row?.rewardType === "rupee";
        return (
          <div className="d-flex justify-content-center">
            <span className="fw-extrabold" style={{ fontSize: "13.5px", color: isRupee ? "#16a34a" : "#ca8a04" }}>
              {isRupee ? `₹${row?.rupeeValue || 0}` : `${formatCoins(row?.coinValue || row?.requiredPoints || 0)} Coins`}
            </span>
          </div>
        );
      },
    },
    {
      Header: "Coming Soon Tag",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => {
        const isSoon = !!row?.isComingSoon;
        return (
          <div className="d-flex align-items-center justify-content-center gap-2">
            <ToggleSwitch
              checked={isSoon}
              onChange={() => handleToggleComingSoon(row)}
            />
            <span
              className={`badge ${isSoon ? "bg-warning text-dark" : "bg-success-subtle text-success"}`}
              style={{ fontSize: "10.5px", fontWeight: 700, padding: "4px 8px" }}
            >
              {isSoon ? "⏳ COMING SOON" : "🟢 LIVE"}
            </span>
          </div>
        );
      },
    },
    {
      Header: "Active Status",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => (
        <div className="d-flex align-items-center justify-content-center gap-2">
          <ToggleSwitch
            checked={!!row?.isActive}
            onChange={() => dispatch(toggleAdsWatchRewardStatus(row?._id))}
          />
          <small className={row?.isActive ? "text-success fw-semibold" : "text-muted"}>
            {row?.isActive ? "Active" : "Hidden"}
          </small>
        </div>
      ),
    },
    {
      Header: "Action",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => (
        <div className="action-button d-flex align-items-center justify-content-center">
          <button
            className="me-2 btn btn-sm"
            style={{ backgroundColor: "#CFF3FF", borderRadius: "8px", padding: "6px 8px" }}
            onClick={() => dispatch(openDialog({ type: "adswatchreward", data: row }))}
            title="Edit Reward"
          >
            <img src={EditIcon.src} alt="Edit" width={18} height={18} />
          </button>
          <button
            className="btn btn-sm"
            style={{ backgroundColor: "#FFE7E7", borderRadius: "8px", padding: "6px 8px" }}
            onClick={() => {
              setSelectedId(row?._id);
              setShowDialog(true);
            }}
            title="Delete Reward"
          >
            <img src={TrashIcon.src} alt="Delete" width={18} height={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <CommonDialog
        open={showDialog}
        onCancel={() => setShowDialog(false)}
        onConfirm={confirmDelete}
        text={"Delete"}
      />

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h5 className="mb-1">Reward Management</h5>
          <p className="text-muted mb-0">
            Collect points from ads — equal points convert to wallet coins (1:1).
          </p>
        </div>
        <Button
          className="bg-button text-white"
          bIcon={image}
          text="+ Add Reward"
          onClick={() => dispatch(openDialog({ type: "adswatchreward" }))}
        />
      </div>

      <div className="d-flex gap-2 mb-3">
        {(["all", "user", "host"] as const).map((item) => (
          <button
            key={item}
            type="button"
            className={`btn btn-sm ${filter === item ? "btn-primary" : "btn-outline-secondary"}`}
            onClick={() => setFilter(item)}
          >
            {item === "all" ? "All" : item === "user" ? "Users" : "Hosts"}
          </button>
        ))}
      </div>

      <div className="card border-0 shadow-sm p-3">
        {filteredRewards.length === 0 && (
          <div className="alert alert-light border mb-3 py-2 small text-muted">{emptyFilterHint}</div>
        )}
        <Table data={filteredRewards} mapData={rewardTable} type="client" />
      </div>
    </>
  );
};

export default AdsWatchRewardManagement;
