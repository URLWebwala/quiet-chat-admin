import RootLayout from "@/component/layout/Layout";
import AdsWatchConfig from "@/component/adsWatch/AdsWatchConfig";
import AdsWatchApiSettings from "@/component/adsWatch/AdsWatchApiSettings";
import AdsWatchRewardManagement from "@/component/adsWatch/AdsWatchRewardManagement";
import AdsWatchRewardDialog from "@/component/adsWatch/AdsWatchRewardDialog";
import CustomTaskManagement from "@/component/adsWatch/CustomTaskManagement";
import CustomTaskSubmissions from "@/component/adsWatch/CustomTaskSubmissions";
import UnityAdsPerformance from "@/component/adsWatch/UnityAdsPerformance";
import CpxPerformance from "@/component/adsWatch/CpxPerformance";
import Table from "@/extra/Table";
import Pagination from "@/extra/Pagination";
import { getAdsWatchActivity, getAdsWatchStats } from "@/store/adsWatchSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { formatCoins } from "@/utils/Common";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import coin from "@/assets/images/coin.png";
import Image from "next/image";

const AdsWatchSetting: React.FC & { getLayout?: (page: React.ReactNode) => React.ReactNode } = () => {
  const dispatch = useAppDispatch();
  const { dialogueType } = useSelector((state: RootStore) => state.dialogue);
  const { stats, activity, totalActivity } = useSelector(
    (state: RootStore) => state.adsWatch
  );

  const [tab, setTab] = useState<"config" | "api" | "rewards" | "user" | "host" | "custom_tasks" | "custom_submissions" | "unity_analytics" | "cpx_analytics">("config");
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

  const handleChangePage = (_event: any, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (value: string) => {
    setRowsPerPage(parseInt(value, 10));
    setPage(1);
  };

  const activityTable = [
    {
      Header: "Name",
      Cell: ({ row }: { row: any }) => (
        <span className="fw-semibold">{row?.hostId?.name || row?.userId?.name || "-"}</span>
      ),
    },
    {
      Header: "Unique ID",
      Cell: ({ row }: { row: any }) => (
        <span>{row?.hostId?.uniqueId || row?.userId?.uniqueId || "-"}</span>
      ),
    },
    {
      Header: "AdMob Ads",
      Cell: ({ row }: { row: any }) => (
        <div>
          <div><strong>{row?.admobWatches || 0}</strong> watches</div>
          <small className="text-primary">{formatCoins(row?.admobPoints || 0)} Pts</small>
        </div>
      ),
    },
    {
      Header: "Unity Ads",
      Cell: ({ row }: { row: any }) => (
        <div>
          <div><strong>{row?.unityWatches || 0}</strong> watches</div>
          <small className="text-purple" style={{ color: "#7000ff" }}>{formatCoins(row?.unityPoints || 0)} Pts</small>
        </div>
      ),
    },
    {
      Header: "BitLabs Surveys",
      Cell: ({ row }: { row: any }) => (
        <div>
          <div><strong>{row?.bitlabsSurveys || 0}</strong> completed</div>
          <small className="text-success">{formatCoins(row?.bitlabsPoints || 0)} Pts</small>
        </div>
      ),
    },
    {
      Header: "CPX Surveys",
      Cell: ({ row }: { row: any }) => (
        <div>
          <div><strong>{row?.cpxSurveys || 0}</strong> completed</div>
          <small className="text-info">{formatCoins(row?.cpxPoints || 0)} Pts</small>
        </div>
      ),
    },
    {
      Header: "Custom Tasks",
      Cell: ({ row }: { row: any }) => (
        <div>
          <div><strong>{row?.customTasks || 0}</strong> completed</div>
          <small style={{ color: "#e67e22", fontWeight: 600 }}>{formatCoins(row?.customTaskPoints || 0)} Pts</small>
        </div>
      ),
    },
    {
      Header: "Total Watches",
      Cell: ({ row }: { row: any }) => (
        <span style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
          {row?.totalWatches || 0}
        </span>
      ),
    },
    {
      Header: "Total Points Earned",
      Cell: ({ row }: { row: any }) => (
        <span className="fw-bold text-success">
          {formatCoins(row?.totalEarned || 0)} Pts
        </span>
      ),
    },
    {
      Header: "Pending Points",
      Cell: ({ row }: { row: any }) => (
        <span className="d-flex align-items-center gap-1">
          <Image src={coin} alt="" width={16} height={16} />
          {formatCoins(row?.pendingCoins || 0)}
        </span>
      ),
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

      <div className="setting setting-tabs-wide mb-4">
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
          className={tab === "custom_tasks" ? "activeBtn" : "disabledBtn"}
          onClick={() => {
            setTab("custom_tasks");
            setPage(1);
          }}
        >
          Custom Tasks
        </button>
        <button
          type="button"
          className={tab === "custom_submissions" ? "activeBtn" : "disabledBtn"}
          onClick={() => {
            setTab("custom_submissions");
            setPage(1);
          }}
        >
          Task Submissions
        </button>
        <button
          type="button"
          className={tab === "unity_analytics" ? "activeBtn" : "disabledBtn"}
          onClick={() => {
            setTab("unity_analytics");
            setPage(1);
          }}
        >
          Unity Performance
        </button>
        <button
          type="button"
          className={tab === "cpx_analytics" ? "activeBtn" : "disabledBtn"}
          onClick={() => {
            setTab("cpx_analytics");
            setPage(1);
          }}
        >
          CPX Performance
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

      {tab === "custom_tasks" && <CustomTaskManagement />}

      {tab === "custom_submissions" && <CustomTaskSubmissions />}

      {tab === "unity_analytics" && <UnityAdsPerformance />}

      {tab === "cpx_analytics" && <CpxPerformance />}

      {(tab === "user" || tab === "host") && (
        <div className="card border-0 shadow-sm p-3 pb-4 mb-5">
          <div className="table-responsive mb-3">
            <Table data={activity} mapData={activityTable} type="server" />
          </div>
          <div className="pt-2 border-top">
            <Pagination
              type="server"
              serverPage={page}
              setServerPage={setPage}
              serverPerPage={rowsPerPage}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              totalData={totalActivity}
            />
          </div>
        </div>
      )}
    </>
  );
};

AdsWatchSetting.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default AdsWatchSetting;
