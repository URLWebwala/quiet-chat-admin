import RootLayout from "@/component/layout/Layout";
import Analytics from "@/extra/Analytic";
import {
  getChartData,
  getChartDataOfHost,
  getDashboardData,
} from "@/store/dashboardSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import GetNewUser from "./GetNewUser";
import TopPerformingAgency from "./TopPerformingAgency";
import TopSpenders from "./TopSpenders";
import { formatCoins, routerChange } from "@/utils/Common";
import { getDefaultCurrency } from "@/store/settingSlice";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// ─── Quick Access Tile ──────────────────────────────────────────────
const QuickTile = ({
  icon,
  label,
  path,
  color,
  bg,
  router,
}: {
  icon: string;
  label: string;
  path: string;
  color: string;
  bg: string;
  router: any;
}) => (
  <div
    className="d-flex flex-column align-items-center justify-content-center gap-2 py-3 px-2 rounded-4 cursor-pointer"
    style={{
      background: bg,
      border: `1.5px solid ${color}22`,
      transition: "all 0.2s ease",
      minHeight: "90px",
    }}
    onClick={() => router.push(path)}
    onMouseEnter={(e: any) => {
      e.currentTarget.style.transform = "translateY(-3px)";
      e.currentTarget.style.boxShadow = `0 8px 24px ${color}30`;
    }}
    onMouseLeave={(e: any) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "none";
    }}
  >
    <div
      className="d-flex align-items-center justify-content-center rounded-3"
      style={{ width: 40, height: 40, backgroundColor: color, color: "#fff" }}
    >
      <i className={`${icon} fs-18`}></i>
    </div>
    <span
      className="text-center fw-semibold"
      style={{ fontSize: "11px", color: "#374151", lineHeight: "1.3" }}
    >
      {label}
    </span>
  </div>
);

// ─── Stat Card ─────────────────────────────────────────────────────
const StatCard = ({
  icon,
  title,
  value,
  color,
  bg,
  badge,
  onClick,
}: any) => (
  <div
    className="card rounded-4 p-3 bg-white shadow-sm h-100 cursor-pointer"
    style={{
      border: "none",
      borderLeft: `4px solid ${color}`,
      transition: "all 0.2s ease",
    }}
    onClick={onClick}
    onMouseEnter={(e: any) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = `0 8px 20px ${color}25`;
    }}
    onMouseLeave={(e: any) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "";
    }}
  >
    <div className="d-flex align-items-center justify-content-between mb-2">
      <div
        className="rounded-3 d-flex align-items-center justify-content-center"
        style={{ width: 36, height: 36, backgroundColor: bg, color }}
      >
        <i className={`${icon} fs-17`}></i>
      </div>
      {badge && (
        <span
          className="badge rounded-pill fw-semibold"
          style={{ fontSize: "10px", backgroundColor: bg, color }}
        >
          {badge}
        </span>
      )}
    </div>
    <h4 className="fw-bold text-dark mb-0" style={{ fontSize: "22px" }}>
      {formatCoins(value)}
    </h4>
    <span className="text-muted" style={{ fontSize: "12px" }}>
      {title}
    </span>
  </div>
);

// ─── Finance Card ──────────────────────────────────────────────────
const FinanceCard = ({
  icon,
  title,
  value,
  subtitle,
  gradient,
  prefix,
  onClick,
}: any) => (
  <div
    className="card border-0 rounded-4 p-3 text-white h-100 cursor-pointer overflow-hidden position-relative"
    style={{ background: gradient, transition: "all 0.2s ease" }}
    onClick={onClick}
    onMouseEnter={(e: any) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.filter = "brightness(1.06)";
    }}
    onMouseLeave={(e: any) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.filter = "brightness(1)";
    }}
  >
    {/* bg glow */}
    <div
      style={{
        position: "absolute",
        right: -20,
        top: -20,
        width: 80,
        height: 80,
        borderRadius: "50%",
        backgroundColor: "rgba(255,255,255,0.08)",
      }}
    />
    <div className="d-flex justify-content-between align-items-center mb-2">
      <span style={{ fontSize: "12px", opacity: 0.9, fontWeight: 500 }}>
        {title}
      </span>
      <div
        className="d-flex align-items-center justify-content-center rounded-circle"
        style={{ width: 30, height: 30, backgroundColor: "rgba(255,255,255,0.2)" }}
      >
        <i className={`${icon} fs-15`}></i>
      </div>
    </div>
    <div className="d-flex align-items-baseline gap-1">
      {prefix && (
        <span style={{ fontSize: "15px", fontWeight: 700 }}>{prefix}</span>
      )}
      <span style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.5px" }}>
        {formatCoins(value)}
      </span>
    </div>
    <span style={{ fontSize: "11px", opacity: 0.75, marginTop: "2px", display: "block" }}>
      {subtitle}
    </span>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
const Dashboard = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [startDate, setStartDate] = useState("All");
  const [endDate, setEndDate] = useState("All");
  const [activeTab, setActiveTab] = useState<string>("recent_users");

  const { dashboardData, chartData, loading } = useSelector(
    (state: RootStore) => state.dashboard
  );
  const { defaultCurrency } = useSelector((state: RootStore) => state.setting);

  const dd = dashboardData as any;

  useEffect(() => {
    const saved = localStorage.getItem("dashTab") || "recent_users";
    setActiveTab(saved);
  }, []);

  useEffect(() => {
    const payload: any = { startDate, endDate };
    dispatch(getDashboardData(payload));
    dispatch(getDefaultCurrency());
    dispatch(getChartData(payload));
    dispatch(getChartDataOfHost(payload));

    const interval = setInterval(() => {
      dispatch(getDashboardData(payload));
    }, 30000);
    return () => clearInterval(interval);
  }, [dispatch, startDate, endDate]);

  const cur = defaultCurrency?.symbol || "₹";

  // ── Chart data processing ──────────────────────────────────────
  const labels = Array.from(
    new Set([...(chartData || []).map((d: any) => d._id)])
  ).sort() as string[];

  const userSeries = labels.map((date) => {
    const f: any = (chartData || []).find((d: any) => d._id === date);
    return f ? f.count : 0;
  });

  // ── Chart options ──────────────────────────────────────────────
  const areaOptions: any = {
    chart: {
      type: "area",
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: "Inter, sans-serif",
      sparkline: { enabled: false },
    },
    colors: ["#8F6DFF"],
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2.5 },
    fill: {
      type: "gradient",
      gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.0, stops: [0, 95, 100] },
    },
    xaxis: {
      categories: labels.length > 0 ? labels : ["No Data"],
      labels: { style: { colors: "#94A3B8", fontSize: "11px" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: "#94A3B8", fontSize: "11px" } } },
    grid: { strokeDashArray: 3, borderColor: "#F1F5F9", padding: { left: 4, right: 4 } },
    tooltip: { theme: "light" },
    legend: { show: false },
  };

  const radialOptions: any = {
    chart: { type: "radialBar", fontFamily: "Inter, sans-serif" },
    colors: ["#8F6DFF", "#10B981", "#F59E0B"],
    plotOptions: {
      radialBar: {
        offsetY: 0,
        startAngle: 0,
        endAngle: 270,
        hollow: { margin: 5, size: "30%" },
        track: { background: "#F8FAFC", strokeWidth: "100%" },
        dataLabels: {
          name: { fontSize: "13px", fontWeight: 600, color: "#374151" },
          value: { fontSize: "18px", fontWeight: 700, color: "#111827" },
        },
      },
    },
    labels: ["Online", "VIP", "Blocked"],
    legend: {
      show: true,
      floating: false,
      fontSize: "12px",
      position: "bottom",
      labels: { useSeriesColors: true },
    },
  };

  const totalUsers = dd?.totalUsers || 1;
  const radialSeries = [
    Math.min(100, Math.round(((dd?.totalOnlineUsers || 0) / totalUsers) * 100)),
    Math.min(100, Math.round(((dd?.totalVipUsers || 0) / totalUsers) * 100)),
    Math.min(100, Math.round(((dd?.totalBlockedUsers || 0) / totalUsers) * 100)),
  ];

  const barOptions: any = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "Inter, sans-serif" },
    colors: ["#8F6DFF", "#10B981", "#F59E0B"],
    plotOptions: { bar: { borderRadius: 5, columnWidth: "38%", distributed: true } },
    dataLabels: { enabled: false },
    legend: { show: false },
    xaxis: {
      categories: ["Revenue", "Commission", "Coins Sold"],
      labels: { style: { colors: "#94A3B8", fontSize: "12px" } },
      axisBorder: { show: false },
    },
    yaxis: { labels: { style: { colors: "#94A3B8", fontSize: "11px" } } },
    grid: { strokeDashArray: 3, borderColor: "#F1F5F9" },
    tooltip: { theme: "light" },
  };

  const barSeries = [
    {
      name: "Amount",
      data: [
        dd?.grossPaymentsCollected || 0,
        dd?.adminCommissionEarned || 0,
        dd?.coinsSold || 0,
      ],
    },
  ];

  // ── Quick Access items ─────────────────────────────────────────
  const quickLinks = [
    { icon: "ri-group-2-line",      label: "All Users",        path: "/User/User",        color: "#8F6DFF", bg: "#F5F3FF" },
    { icon: "ri-robot-line",        label: "AI Host List",     path: "/AiHost",           color: "#6366F1", bg: "#EEF2FF" },
    { icon: "ri-add-circle-line",   label: "Add AI Host",      path: "/AddAiHost",        color: "#8B5CF6", bg: "#F5F3FF" },
    { icon: "ri-chat-4-line",       label: "AI Chat",          path: "/AiChat",           color: "#EC4899", bg: "#FDF2F8" },
    { icon: "ri-settings-4-line",   label: "AI Settings",      path: "/AiSettings",       color: "#F59E0B", bg: "#FFFBEB" },
    { icon: "ri-find-replace-line", label: "AI Inspector",     path: "/AiInspector",      color: "#10B981", bg: "#ECFDF5" },
    { icon: "ri-advertisement-line",label: "Ads & Points",     path: "/AdsWatchSetting",  color: "#06B6D4", bg: "#ECFEFF" },
    { icon: "ri-gift-2-line",       label: "Gifts",            path: "/GiftPage",         color: "#EF4444", bg: "#FEF2F2" },
    { icon: "ri-task-line",         label: "Daily Challenges", path: "/DailyChallenge",   color: "#F97316", bg: "#FFF7ED" },
    { icon: "ri-vip-crown-2-line",  label: "VIP Plans",        path: "/VipPlanPrevilage", color: "#D97706", bg: "#FFFBEB" },
    { icon: "ri-history-line",      label: "Plan History",     path: "/PlanHistory",      color: "#6366F1", bg: "#EEF2FF" },
    { icon: "ri-hand-coin-line",    label: "Withdrawals",      path: "/WithdrawRequest",  color: "#DC2626", bg: "#FEF2F2" },
    { icon: "ri-building-4-line",   label: "Agencies",         path: "/Agency",           color: "#0EA5E9", bg: "#F0F9FF" },
    { icon: "ri-dashboard-3-line",  label: "Reward Dashboard", path: "/reward-dashboard", color: "#8F6DFF", bg: "#F5F3FF" },
    { icon: "ri-file-chart-line",   label: "Reports",          path: "/reward-reports",   color: "#64748B", bg: "#F8FAFC" },
  ];

  // ── Tab configuration ──────────────────────────────────────────
  const tabs = [
    { key: "recent_users",         label: "Recent Users",    icon: "ri-user-add-line" },
    { key: "top_perfoming_agency", label: "Top Agencies",    icon: "ri-building-4-line" },
    { key: "top_spenders",         label: "Top Spenders",    icon: "ri-coin-line" },
  ];

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    localStorage.setItem("dashTab", key);
    routerChange("/dashboard", "tab", router);
  };

  return (
    <div
      style={{ background: "#F8FAFC", minHeight: "100vh", padding: "20px 20px 40px" }}
    >
      {/* ═══ HEADER ═══════════════════════════════════════════ */}
      <div
        className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 bg-white rounded-4 shadow-sm"
        style={{ padding: "18px 24px", border: "1px solid #E2E8F0" }}
      >
        <div>
          <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
            <h4 className="fw-bold text-dark mb-0" style={{ fontSize: "20px" }}>
              Welcome, Admin 👋
            </h4>
            <span
              className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill fw-semibold"
              style={{ fontSize: "10px", background: "#DCFCE7", color: "#16A34A" }}
            >
              <span
                className="rounded-circle bg-success"
                style={{ width: 6, height: 6, display: "inline-block" }}
              />
              Live · Auto-refresh 30s
            </span>
          </div>
          <p className="text-muted mb-0" style={{ fontSize: "13px" }}>
            Real-time platform overview — users, revenue, AI activity & more.
          </p>
        </div>

        <Analytics
          analyticsStartDate={startDate}
          analyticsStartEnd={endDate}
          analyticsStartDateSet={setStartDate}
          analyticsStartEndSet={setEndDate}
          direction={"end"}
        />
      </div>

      {/* ═══ FINANCE CARDS ════════════════════════════════════ */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-4">
          <FinanceCard
            icon="ri-money-dollar-circle-line"
            title="Total Revenue"
            value={dd?.grossPaymentsCollected || 0}
            subtitle="Gross payments collected"
            gradient="linear-gradient(135deg, #8F6DFF 0%, #6366F1 100%)"
            prefix={cur}
            onClick={() => router.push("/PlanHistory")}
          />
        </div>
        <div className="col-12 col-sm-4">
          <FinanceCard
            icon="ri-coins-line"
            title="Coins Sold"
            value={dd?.coinsSold || 0}
            subtitle="In-app coin purchases"
            gradient="linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
            onClick={() => router.push("/PlanHistory/coinhistory")}
          />
        </div>
        <div className="col-12 col-sm-4">
          <FinanceCard
            icon="ri-percent-line"
            title="Total Earning"
            value={dd?.adminCommissionEarned || 0}
            subtitle="Admin commission (coins)"
            gradient="linear-gradient(135deg, #10B981 0%, #059669 100%)"
          />
        </div>
      </div>

      {/* ═══ USER STAT CARDS ══════════════════════════════════ */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <StatCard
            icon="ri-group-line"
            title="Total Users"
            value={dd?.totalUsers || 0}
            color="#8F6DFF"
            bg="rgba(143,109,255,0.1)"
            onClick={() => router.push("/User/User")}
          />
        </div>
        <div className="col-6 col-md-3">
          <StatCard
            icon="ri-user-shared-line"
            title="Online Now"
            value={dd?.totalOnlineUsers || 0}
            color="#10B981"
            bg="rgba(16,185,129,0.1)"
            badge="LIVE"
            onClick={() => router.push({ pathname: "/User/User", query: { userStatus: "online" } })}
          />
        </div>
        <div className="col-6 col-md-3">
          <StatCard
            icon="ri-vip-crown-2-line"
            title="VIP Users"
            value={dd?.totalVipUsers || 0}
            color="#F59E0B"
            bg="rgba(245,158,11,0.1)"
            onClick={() => router.push({ pathname: "/User/User", query: { userStatus: "vip" } })}
          />
        </div>
        <div className="col-6 col-md-3">
          <StatCard
            icon="ri-user-forbid-line"
            title="Blocked Users"
            value={dd?.totalBlockedUsers || 0}
            color="#EF4444"
            bg="rgba(239,68,68,0.1)"
            onClick={() => router.push({ pathname: "/User/User", query: { userStatus: "blocked" } })}
          />
        </div>
        <div className="col-6 col-md-6">
          <StatCard
            icon="ri-eye-line"
            title="Total Impressions"
            value={dd?.totalImpressions || 0}
            color="#06B6D4"
            bg="rgba(6,182,212,0.1)"
            onClick={() => router.push("/Impression")}
          />
        </div>
        <div className="col-6 col-md-6">
          <StatCard
            icon="ri-survey-line"
            title="Daily Check-Ins"
            value={dd?.totalCheckIns || 0}
            color="#8B5CF6"
            bg="rgba(139,92,246,0.1)"
            onClick={() => router.push("/DailyCheckInReward")}
          />
        </div>
      </div>

      {/* ═══ CHARTS ROW ═══════════════════════════════════════ */}
      <div className="row g-3 mb-4">
        {/* Area chart */}
        <div className="col-12 col-xl-8">
          <div
            className="bg-white rounded-4 shadow-sm h-100"
            style={{ padding: "20px 20px 10px", border: "1px solid #E2E8F0" }}
          >
            <div className="mb-1">
              <h6 className="fw-bold text-dark mb-0" style={{ fontSize: "15px" }}>
                User Registration Trend
              </h6>
              <span className="text-muted" style={{ fontSize: "12px" }}>
                New users over selected period
              </span>
            </div>
            {loading?.chartDataHost ? (
              <div
                className="d-flex align-items-center justify-content-center text-muted"
                style={{ height: 280 }}
              >
                <i className="ri-loader-4-line fs-24 me-2" style={{ animation: "spin 1s linear infinite" }} />
                Loading…
              </div>
            ) : (
              <Chart options={areaOptions} series={[{ name: "Users", data: userSeries }]} type="area" height={290} />
            )}
          </div>
        </div>

        {/* Radial chart */}
        <div className="col-12 col-xl-4">
          <div
            className="bg-white rounded-4 shadow-sm h-100"
            style={{ padding: "20px", border: "1px solid #E2E8F0" }}
          >
            <div className="mb-1">
              <h6 className="fw-bold text-dark mb-0" style={{ fontSize: "15px" }}>
                User Breakdown
              </h6>
              <span className="text-muted" style={{ fontSize: "12px" }}>
                % of total users
              </span>
            </div>
            <div className="d-flex align-items-center justify-content-center">
              <Chart options={radialOptions} series={radialSeries} type="radialBar" height={290} />
            </div>
          </div>
        </div>

        {/* Bar chart */}
        <div className="col-12">
          <div
            className="bg-white rounded-4 shadow-sm"
            style={{ padding: "20px", border: "1px solid #E2E8F0" }}
          >
            <div className="mb-1">
              <h6 className="fw-bold text-dark mb-0" style={{ fontSize: "15px" }}>
                Financial Overview
              </h6>
              <span className="text-muted" style={{ fontSize: "12px" }}>
                Revenue · Commission · Coins Sold
              </span>
            </div>
            <Chart options={barOptions} series={barSeries} type="bar" height={220} />
          </div>
        </div>
      </div>

      {/* ═══ QUICK ACCESS ═════════════════════════════════════ */}
      <div
        className="bg-white rounded-4 shadow-sm mb-4"
        style={{ padding: "20px", border: "1px solid #E2E8F0" }}
      >
        <div className="d-flex align-items-center gap-2 mb-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-3"
            style={{ width: 30, height: 30, background: "#F5F3FF" }}
          >
            <i className="ri-flashlight-line fs-16" style={{ color: "#8F6DFF" }}></i>
          </div>
          <div>
            <h6 className="fw-bold text-dark mb-0" style={{ fontSize: "15px" }}>
              Quick Access
            </h6>
            <span className="text-muted" style={{ fontSize: "11px" }}>
              Navigate to any section in one click
            </span>
          </div>
        </div>

        <div className="row g-2">
          {quickLinks.map((item, idx) => (
            <div className="col-6 col-sm-4 col-md-3 col-lg-2 col-xl-1-5" key={idx}>
              <QuickTile
                icon={item.icon}
                label={item.label}
                path={item.path}
                color={item.color}
                bg={item.bg}
                router={router}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ═══ DATA TABLES ══════════════════════════════════════ */}
      <div
        className="bg-white rounded-4 shadow-sm"
        style={{ padding: "20px", border: "1px solid #E2E8F0" }}
      >
        {/* Tab Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
          <div className="d-flex align-items-center gap-2">
            <div
              className="d-flex align-items-center justify-content-center rounded-3"
              style={{ width: 30, height: 30, background: "#F5F3FF" }}
            >
              <i className="ri-bar-chart-grouped-line fs-16" style={{ color: "#8F6DFF" }}></i>
            </div>
            <div>
              <h6 className="fw-bold text-dark mb-0" style={{ fontSize: "15px" }}>
                Activity Reports
              </h6>
              <span className="text-muted" style={{ fontSize: "11px" }}>
                Filter by date range above
              </span>
            </div>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className="btn btn-sm rounded-pill d-inline-flex align-items-center gap-1 fw-semibold"
                style={{
                  fontSize: "12px",
                  padding: "5px 14px",
                  background: activeTab === tab.key ? "#8F6DFF" : "#F1F5F9",
                  color: activeTab === tab.key ? "#fff" : "#475569",
                  border: "none",
                  transition: "all 0.15s ease",
                }}
                onClick={() => handleTabChange(tab.key)}
              >
                <i className={`${tab.icon} fs-13`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "recent_users" && (
            <GetNewUser startDate={startDate} endDate={endDate} type="Recent Users" />
          )}
          {activeTab === "top_perfoming_agency" && (
            <TopPerformingAgency
              startDate={startDate}
              endDate={endDate}
              type="top_perfoming_agency"
            />
          )}
          {activeTab === "top_spenders" && (
            <TopSpenders startDate={startDate} endDate={endDate} type="top_spenders" />
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .col-xl-1-5 {
          flex: 0 0 auto;
          width: 16.6666%;
        }
        @media (max-width: 1199px) { .col-xl-1-5 { width: 16.6666%; } }
        @media (max-width: 991px)  { .col-xl-1-5 { width: 25%; } }
        @media (max-width: 767px)  { .col-xl-1-5 { width: 33.33%; } }
        @media (max-width: 575px)  { .col-xl-1-5 { width: 50%; } }
      `}</style>
    </div>
  );
};

Dashboard.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default Dashboard;
