import RootLayout from "@/component/layout/Layout";
import AdsWatchConfig from "@/component/adsWatch/AdsWatchConfig";
import AdsWatchApiSettings from "@/component/adsWatch/AdsWatchApiSettings";
import AdsWatchRewardManagement from "@/component/adsWatch/AdsWatchRewardManagement";
import AdsWatchRewardDialog from "@/component/adsWatch/AdsWatchRewardDialog";
import CustomTaskManagement from "@/component/adsWatch/CustomTaskManagement";
import CustomTaskSubmissions from "@/component/adsWatch/CustomTaskSubmissions";
import UnityAdsPerformance from "@/component/adsWatch/UnityAdsPerformance";
import CpxPerformance from "@/component/adsWatch/CpxPerformance";
import AdGemPerformance from "@/component/adsWatch/AdGemPerformance";
import TheoremReachPerformance from "@/component/adsWatch/TheoremReachPerformance";
import AdsWatchActivityLogs from "@/component/adsWatch/AdsWatchActivityLogs";
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

  const [tab, setTab] = useState<"config" | "api" | "rewards" | "user" | "host" | "custom_tasks" | "custom_submissions" | "unity_analytics" | "cpx_analytics" | "adgem_analytics" | "theoremreach_analytics" | "activity_logs">("config");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<"latest" | "earned" | "watches">("latest");

  useEffect(() => {
    dispatch(getAdsWatchStats());
  }, [dispatch]);

  useEffect(() => {
    if (tab === "user") {
      dispatch(getAdsWatchActivity({ personType: "user", start: page, limit: rowsPerPage, sortBy }));
    } else if (tab === "host") {
      dispatch(getAdsWatchActivity({ personType: "host", start: page, limit: rowsPerPage, sortBy }));
    }
  }, [dispatch, tab, page, rowsPerPage, sortBy]);

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
      Header: "AdGem Offers",
      Cell: ({ row }: { row: any }) => (
        <div>
          <div><strong>{row?.adgemOffers || 0}</strong> completed</div>
          <small className="text-danger" style={{ color: "#EC4899" }}>{formatCoins(row?.adgemPoints || 0)} Pts</small>
        </div>
      ),
    },
    {
      Header: "TheoremReach",
      Cell: ({ row }: { row: any }) => (
        <div>
          <div><strong>{row?.theoremreachSurveys || 0}</strong> completed</div>
          <small className="text-primary" style={{ color: "#6366F1" }}>{formatCoins(row?.theoremreachPoints || 0)} Pts</small>
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

  const tabs = [
    { id: "config", label: "Ad & Survey Config", icon: "ri-sound-module-line" },
    { id: "api", label: "Ad Network Keys & SDK", icon: "ri-key-2-line" },
    { id: "rewards", label: "Milestone Rewards", icon: "ri-gift-line" },
    { id: "custom_tasks", label: "Custom Tasks", icon: "ri-task-line" },
    { id: "custom_submissions", label: "Task Submissions", icon: "ri-file-check-line" },
    { id: "unity_analytics", label: "Unity Performance", icon: "ri-gamepad-line" },
    { id: "cpx_analytics", label: "CPX Surveys", icon: "ri-survey-line" },
    { id: "adgem_analytics", label: "AdGem Offers", icon: "ri-apps-2-line" },
    { id: "theoremreach_analytics", label: "TheoremReach", icon: "ri-line-chart-line" },
    { id: "user", label: "User Activity", icon: "ri-user-smile-line" },
    { id: "host", label: "Host Activity", icon: "ri-user-star-line" },
    { id: "activity_logs", label: "Ad Watch Logs", icon: "ri-history-line" },
  ];

  return (
    <>
      {dialogueType === "adswatchreward" && <AdsWatchRewardDialog />}

      {/* ─── Top Page Header ────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="mb-1 fw-bold text-dark d-flex align-items-center gap-2">
            <i className="ri-advertisement-fill text-primary" style={{ color: "#9f5aff" }}></i>
            Ads & Rewarded Points Center
          </h4>
          <p className="text-muted mb-0 small">
            Configure rewarded ads, survey offerwalls, conversion economics, and monitor real-time user/host earnings.
          </p>
        </div>
      </div>

      {/* ─── Modern Stat Cards ──────────────────────────────────────────── */}
      <div className="row g-3 mb-4">
        {/* Total Points Earned */}
        <div className="col-12 col-md-4">
          <div
            className="card border-0 rounded-4 shadow-sm p-3 h-100 position-relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)",
              border: "1px solid #E9D5FF",
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-semibold text-muted small">Total Points Generated</span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: 32, height: 32, backgroundColor: "#E9D5FF", color: "#9333EA" }}
              >
                <i className="ri-funds-box-line fs-18"></i>
              </div>
            </div>
            <h3 className="mb-0 fw-bold d-flex align-items-center gap-2" style={{ color: "#6B21A8" }}>
              <Image src={coin} alt="coin" width={24} height={24} />
              {formatCoins(stats?.totalPoints || 0)}
            </h3>
            <span className="text-muted mt-2 d-block" style={{ fontSize: "11.5px" }}>
              Gross points across all ads & surveys
            </span>
          </div>
        </div>

        {/* Total Claimed */}
        <div className="col-12 col-md-4">
          <div
            className="card border-0 rounded-4 shadow-sm p-3 h-100 position-relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
              border: "1px solid #BBF7D0",
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-semibold text-muted small">Total Claimed Points</span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: 32, height: 32, backgroundColor: "#BBF7D0", color: "#16A34A" }}
              >
                <i className="ri-checkbox-circle-line fs-18"></i>
              </div>
            </div>
            <h3 className="mb-0 fw-bold d-flex align-items-center gap-2 text-success">
              <Image src={coin} alt="coin" width={24} height={24} />
              {formatCoins(stats?.totalClaimed || 0)}
            </h3>
            <span className="text-muted mt-2 d-block" style={{ fontSize: "11.5px" }}>
              Converted into wallet coins / cash
            </span>
          </div>
        </div>

        {/* Pending / Unclaimed */}
        <div className="col-12 col-md-4">
          <div
            className="card border-0 rounded-4 shadow-sm p-3 h-100 position-relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
              border: "1px solid #FDE68A",
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-semibold text-muted small">Pending Unclaimed Points</span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: 32, height: 32, backgroundColor: "#FDE68A", color: "#D97706" }}
              >
                <i className="ri-hourglass-2-line fs-18"></i>
              </div>
            </div>
            <h3 className="mb-0 fw-bold d-flex align-items-center gap-2" style={{ color: "#B45309" }}>
              <Image src={coin} alt="coin" width={24} height={24} />
              {formatCoins(stats?.totalPending || 0)}
            </h3>
            <span className="text-muted mt-2 d-block" style={{ fontSize: "11.5px" }}>
              Held in users' pending balances
            </span>
          </div>
        </div>
      </div>

      {/* ─── Modern Responsive Pill Navigation Tabs ─────────────────────── */}
      <div className="d-flex flex-wrap gap-2 mb-4 p-2 bg-white rounded-4 shadow-sm align-items-center">
        {tabs.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              className="btn btn-sm d-flex align-items-center gap-2 px-3 py-2 fw-semibold rounded-3 transition-all"
              style={{
                background: isActive ? "linear-gradient(135deg, #9f5aff 0%, #7c3aed 100%)" : "transparent",
                color: isActive ? "#ffffff" : "#64748b",
                border: "none",
                boxShadow: isActive ? "0 4px 12px rgba(159, 90, 255, 0.3)" : "none",
                fontSize: "13px",
                transition: "all 0.2s ease",
              }}
              onClick={() => {
                setTab(t.id as any);
                setPage(1);
              }}
            >
              <i className={`${t.icon} fs-16`}></i>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Active Tab Content ─────────────────────────────────────────── */}
      {tab === "config" && <AdsWatchConfig />}
      {tab === "api" && <AdsWatchApiSettings />}
      {tab === "rewards" && <AdsWatchRewardManagement />}
      {tab === "custom_tasks" && <CustomTaskManagement />}
      {tab === "custom_submissions" && <CustomTaskSubmissions />}
      {tab === "unity_analytics" && <UnityAdsPerformance />}
      {tab === "cpx_analytics" && <CpxPerformance />}
      {tab === "adgem_analytics" && <AdGemPerformance />}
      {tab === "theoremreach_analytics" && <TheoremReachPerformance />}
      {tab === "activity_logs" && <AdsWatchActivityLogs />}

      {(tab === "user" || tab === "host") && (
        <div className="card border-0 rounded-4 shadow-sm p-4 mb-5 bg-white">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <h6 className="fw-bold m-0 text-dark">
              {tab === "user" ? "User Activity & Earning Breakdown" : "Host Activity & Earning Breakdown"}
            </h6>
            <div className="d-flex align-items-center gap-2">
              <span className="small text-muted fw-semibold">Sort By:</span>
              <select
                className="form-select form-select-sm border-secondary-subtle fw-semibold rounded-3"
                style={{ width: "auto" }}
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setPage(1);
                }}
              >
                <option value="latest">⚡ Latest Active Users (Newest First)</option>
                <option value="earned">💎 Highest Points Earned</option>
                <option value="watches">📺 Most Watches & Surveys</option>
              </select>
            </div>
          </div>
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
