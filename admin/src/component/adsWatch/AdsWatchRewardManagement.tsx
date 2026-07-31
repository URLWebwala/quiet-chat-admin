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

  const rewardTable = [
    {
      Header: "Reward",
      Cell: ({ row }: { row: any }) => (
        <div className="d-flex align-items-center gap-2">
          <Image src={coin} alt="" width={22} height={22} />
          <span>{row?.name || "-"}</span>
        </div>
      ),
    },
    {
      Header: "Target",
      Cell: ({ row }: { row: any }) => (
        <span
          className={`badge ${row?.target === "host" ? "bg-warning text-dark" : "bg-info text-dark"}`}
        >
          {row?.target === "host" ? "Host" : "User"}
        </span>
      ),
    },
    {
      Header: "Points → Reward",
      Cell: ({ row }: { row: any }) => {
        const pts = row?.requiredPoints || 0;
        const type = row?.rewardType || "coin";
        return (
          <span className="d-flex align-items-center gap-1">
            <Image src={coin} alt="" width={16} height={16} />
            {formatCoins(pts)} pts → {type === "rupee" ? `₹${row?.rupeeValue || 0}` : `${formatCoins(row?.coinValue || pts)} coins`}
          </span>
        );
      },
    },
    {
      Header: "Status",
      Cell: ({ row }: { row: any }) => (
        <ToggleSwitch
          checked={!!row?.isActive}
          onChange={() => dispatch(toggleAdsWatchRewardStatus(row?._id))}
        />
      ),
    },
    {
      Header: "Action",
      Cell: ({ row }: { row: any }) => (
        <div className="action-button">
          <button
            className="me-2"
            style={{ backgroundColor: "#CFF3FF", borderRadius: "8px", padding: "8px" }}
            onClick={() => dispatch(openDialog({ type: "adswatchreward", data: row }))}
          >
            <img src={EditIcon.src} alt="Edit" width={22} height={22} />
          </button>
          <button
            style={{ backgroundColor: "#FFE7E7", borderRadius: "8px", padding: "8px" }}
            onClick={() => {
              setSelectedId(row?._id);
              setShowDialog(true);
            }}
          >
            <img src={TrashIcon.src} alt="Delete" width={22} height={22} />
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
