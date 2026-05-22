import RootLayout from "@/component/layout/Layout";
import AdsWatchConfig from "@/component/adsWatch/AdsWatchConfig";
import AdsWatchApiSettings from "@/component/adsWatch/AdsWatchApiSettings";
import AdsWatchRewardManagement from "@/component/adsWatch/AdsWatchRewardManagement";
import AdsWatchRewardDialog from "@/component/adsWatch/AdsWatchRewardDialog";
import Table from "@/extra/Table";
import Pagination from "@/extra/Pagination";
import { getAdsWatchActivity, getAdsWatchStats } from "@/store/adsWatchSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { formatCoins } from "@/utils/Common";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import coin from "@/assets/images/coin.png";
import Image from "next/image";

const AdsWatchSetting = () => {
  const dispatch = useAppDispatch();
  const { dialogueType } = useSelector((state: RootStore) => state.dialogue);
  const { stats, activity, totalActivity } = useSelector(
    (state: RootStore) => state.adsWatch
  );

  const [tab, setTab] = useState<"config" | "api" | "rewards" | "user" | "host">("config");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    dispatch(getAdsWatchStats());
  }, [dispatch]);

  useEffect(() => {
    if (tab === "user") {
      dispatch(getAdsWatchActivity({ personType: "user", start: page, limit: rowsPerPage }));
    } else if (tab === "host") {
      dispatch(getAdsWatchActivity({ personType: "host", start: page, limit: rowsPerPage }));
    }
  }, [dispatch, tab, page, rowsPerPage]);

  const activityTable = [
    {
      Header: "Name",
      Cell: ({ row }: { row: any }) => (
        <span>{row?.hostId?.name || row?.userId?.name || "-"}</span>
      ),
    },
    {
      Header: "Unique ID",
      Cell: ({ row }: { row: any }) => (
        <span>{row?.hostId?.uniqueId || row?.userId?.uniqueId || "-"}</span>
      ),
    },
    {
      Header: "Pending Coins",
      Cell: ({ row }: { row: any }) => (
        <span className="d-flex align-items-center gap-1">
          <Image src={coin} alt="" width={16} height={16} />
          {formatCoins(row?.pendingCoins || 0)}
        </span>
      ),
    },
    {
      Header: "Total Watches",
      Cell: ({ row }: { row: any }) => <span>{row?.totalWatches || 0}</span>,
    },
    {
      Header: "Total Claimed",
      Cell: ({ row }: { row: any }) => (
        <span className="d-flex align-items-center gap-1">
          <Image src={coin} alt="" width={16} height={16} />
          {formatCoins(row?.totalClaimed || 0)}
        </span>
      ),
    },
    {
      Header: "Watches Today",
      Cell: ({ row }: { row: any }) => <span>{row?.watchesToday || 0}</span>,
    },
  ];

  return (
    <>
      {dialogueType === "adswatchreward" && <AdsWatchRewardDialog />}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="mb-1">Ads & Points</h4>
          <p className="text-muted mb-0">
            Manage ad rewards, claim limits, and user/host activity
          </p>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3">
            <p className="text-muted mb-1">Total Points Earned</p>
            <h4 className="mb-0 d-flex align-items-center gap-2">
              <Image src={coin} alt="" width={22} height={22} />
              {formatCoins(stats?.totalPoints || 0)}
            </h4>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3">
            <p className="text-muted mb-1">Total Claimed</p>
            <h4 className="mb-0 d-flex align-items-center gap-2">
              <Image src={coin} alt="" width={22} height={22} />
              {formatCoins(stats?.totalClaimed || 0)}
            </h4>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3">
            <p className="text-muted mb-1">Pending (Not Claimed)</p>
            <h4 className="mb-0 d-flex align-items-center gap-2">
              <Image src={coin} alt="" width={22} height={22} />
              {formatCoins(stats?.totalPending || 0)}
            </h4>
          </div>
        </div>
      </div>

      <div className="setting mb-4">
        <button
          type="button"
          className={tab === "config" ? "activeBtn" : "disabledBtn"}
          onClick={() => {
            setTab("config");
            setPage(1);
          }}
        >
          Ad Configuration
        </button>
        <button
          type="button"
          className={tab === "api" ? "activeBtn" : "disabledBtn"}
          onClick={() => {
            setTab("api");
            setPage(1);
          }}
        >
          Ad API Settings
        </button>
        <button
          type="button"
          className={tab === "rewards" ? "activeBtn" : "disabledBtn"}
          onClick={() => {
            setTab("rewards");
            setPage(1);
          }}
        >
          Reward Management
        </button>
        <button
          type="button"
          className={tab === "user" ? "activeBtn" : "disabledBtn"}
          onClick={() => {
            setTab("user");
            setPage(1);
          }}
        >
          User Activity
        </button>
        <button
          type="button"
          className={tab === "host" ? "activeBtn" : "disabledBtn"}
          onClick={() => {
            setTab("host");
            setPage(1);
          }}
        >
          Host Activity
        </button>
      </div>

      {tab === "config" && <AdsWatchConfig />}

      {tab === "api" && <AdsWatchApiSettings />}

      {tab === "rewards" && <AdsWatchRewardManagement />}

      {(tab === "user" || tab === "host") && (
        <div className="card border-0 shadow-sm p-3">
          <Table data={activity} mapData={activityTable} />
          <Pagination
            component="AdsWatch"
            type={tab}
            serverPage={page}
            setPage={setPage}
            serverPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage}
            totalData={tab === "user" ? totalActivity : totalActivity}
          />
        </div>
      )}
    </>
  );
};

AdsWatchSetting.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default AdsWatchSetting;
