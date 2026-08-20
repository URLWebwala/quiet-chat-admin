import React, { useEffect, useState } from "react";
import RootLayout from "@/component/layout/Layout";
import Title from "@/extra/Title";
import { apiInstanceFetch } from "@/utils/ApiInstance";
import dynamic from "next/dynamic";
import Link from "next/link";
import male from "@/assets/images/male.png";
import { toast } from "react-toastify";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function RewardDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Manual Adjustment Modal State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustUserId, setAdjustUserId] = useState("");
  const [adjustType, setAdjustType] = useState("credit");
  const [adjustCoins, setAdjustCoins] = useState<number | string>(100);
  const [adjustDescription, setAdjustDescription] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await apiInstanceFetch.get(`api/admin/reward/dashboard?timeRange=${dateFilter}`);
      if (res.status) {
        setStats(res.data);
      }
    } catch (err) {
      console.error("Reward dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [dateFilter]);

  const handleManualAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustUserId.trim() || !adjustCoins || Number(adjustCoins) <= 0) {
      toast.error("Please provide a valid User ID / Unique ID and Coin amount.");
      return;
    }

    try {
      setAdjusting(true);
      const res = await apiInstanceFetch.post("api/admin/reward/manual", {
        userId: adjustUserId.trim(),
        type: adjustType,
        coins: Number(adjustCoins),
        description: adjustDescription.trim() || `Admin manual ${adjustType}`,
      });

      if (res.status) {
        toast.success(`Successfully ${adjustType === "credit" ? "credited" : "debited"} ${adjustCoins} coins!`);
        setShowAdjustModal(false);
        setAdjustUserId("");
        setAdjustCoins(100);
        setAdjustDescription("");
        fetchStats();
      } else {
        toast.error(res.message || "Failed to adjust wallet balance");
      }
    } catch (err: any) {
      toast.error(err.message || "Error processing balance adjustment");
    } finally {
      setAdjusting(false);
    }
  };

  const cards = stats?.cards || {
    totalCoinsInWallets: 0,
    todaysRewards: 0,
    todaysSurveys: 0,
    todaysAdsWatched: 0,
    totalUsdRevenue: 0,
    pendingWithdrawals: 0,
    pendingWithdrawalsAmount: 0,
    completedWithdrawalsAmount: 0,
    totalUsersCount: 0,
  };

  const adNetworks = stats?.adNetworks || [];
  const providerStats = stats?.providerStats || [];
  const recentTx = stats?.recentTx || [];
  const categoryBreakdown = stats?.categoryBreakdown || [];
  const weeklyTrend = stats?.weeklyTrend || [];
  const topEarners = stats?.topEarners || [];
  const economy = stats?.economy || {
    grossRevenueUsd: 0,
    completedPayoutsInr: 0,
    completedPayoutsUsd: 0,
    netProfitUsd: 0,
    profitMargin: "100.0",
    pointsPerRupee: 10,
    userMinWithdrawLimit: 100,
    userMaxWithdrawLimit: 10000,
  };
  const fraudShield = stats?.fraudShield || {
    isEnabled: true,
    maxAdsPerDevice: 35,
    claimFrequencyHours: 24,
    pointsPerCoin: 1,
    minCoinsToClaim: 100,
  };

  // Filtered transactions
  const filteredTx = recentTx.filter((tx: any) => {
    if (activeTab === "all") return true;
    if (activeTab === "survey") return tx.category?.toLowerCase().includes("survey");
    if (activeTab === "ad") return tx.category?.toLowerCase().includes("ad") || tx.category?.toLowerCase().includes("watch");
    if (activeTab === "withdraw") return tx.category?.toLowerCase().includes("withdraw");
    return true;
  });

  // Chart 1: 7-Day Trend Chart
  const trendDates = weeklyTrend.map((d: any) => d._id || "Date");
  const trendCoins = weeklyTrend.map((d: any) => d.coins || 0);

  const trendChartOptions: any = {
    chart: {
      type: "area",
      height: 280,
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: "inherit",
    },
    colors: ["#8F6DFF", "#10B981"],
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 90, 100],
      },
    },
    xaxis: {
      categories: trendDates.length > 0 ? trendDates : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      labels: { style: { colors: "#6b7280", fontSize: "11px" } },
    },
    yaxis: {
      labels: {
        style: { colors: "#6b7280", fontSize: "11px" },
        formatter: (val: number) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val),
      },
    },
    tooltip: {
      theme: "light",
      y: { formatter: (val: number) => `${val.toLocaleString()} Coins` },
    },
    grid: { borderColor: "#f3f4f6" },
  };

  const trendChartSeries = [
    {
      name: "Coins Distributed",
      data: trendCoins.length > 0 ? trendCoins : [0, 0, 0, 0, 0, 0, 0],
    },
  ];

  // Chart 2: Category Breakdown Donut
  const catLabels = categoryBreakdown.map((c: any) => {
    const raw = c._id || "other";
    return raw.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
  });
  const catSeries = categoryBreakdown.map((c: any) => c.totalCoins || 0);

  const donutOptions: any = {
    chart: { type: "donut", height: 280, fontFamily: "inherit" },
    labels: catLabels.length > 0 ? catLabels : ["Surveys", "Ads", "Daily CheckIn", "Tasks"],
    colors: ["#8F6DFF", "#3B82F6", "#10B981", "#F59E0B", "#EC4899", "#6366F1"],
    legend: { position: "bottom", fontSize: "12px", labels: { colors: "#4b5563" } },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: "72%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total Distributed",
              fontSize: "12px",
              color: "#6b7280",
              formatter: () => `${cards.totalCoinsInWallets.toLocaleString()}`,
            },
          },
        },
      },
    },
  };

  return (
    <RootLayout>
      <div className="main-content" style={{ paddingBottom: "60px" }}>
        {/* Top Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h4 className="fw-bold mb-1" style={{ color: "#1e293b", letterSpacing: "-0.5px" }}>
              Monetization & Reward Hub
            </h4>
            <p className="text-muted small mb-0">
              Complete analytics for AdMob, AdSense, Unity Ads, CPX, BitLabs and User Payouts.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* Quick Balance Adjustment Button */}
            <button
              onClick={() => setShowAdjustModal(true)}
              className="btn btn-warning btn-sm px-3 py-2 rounded-3 text-dark fw-semibold d-flex align-items-center gap-1 shadow-sm"
              style={{ backgroundColor: "#fbbf24", borderColor: "#f59e0b" }}
            >
              <i className="ri-hand-coin-line fs-16"></i>
              Adjust Balance
            </button>

            <button
              onClick={fetchStats}
              disabled={loading}
              className="btn btn-outline-secondary btn-sm px-3 py-2 rounded-3 d-flex align-items-center gap-1 shadow-sm"
              style={{ background: "#fff" }}
            >
              <i className={`ri-refresh-line ${loading ? "ri-spin" : ""}`}></i>
              Refresh
            </button>

            <Link
              href="/AdsWatchSetting"
              className="btn btn-sm px-3 py-2 rounded-3 text-white d-flex align-items-center gap-1 shadow-sm text-decoration-none"
              style={{ backgroundColor: "#8F6DFF" }}
            >
              <i className="ri-settings-4-line"></i>
              Ad Units & Keys
            </Link>

            <Link
              href="/survey-providers"
              className="btn btn-outline-primary btn-sm px-3 py-2 rounded-3 d-flex align-items-center gap-1 shadow-sm text-decoration-none"
              style={{ borderColor: "#8F6DFF", color: "#8F6DFF", background: "#fff" }}
            >
              <i className="ri-survey-line"></i>
              Survey Providers
            </Link>

            <Link
              href="/reward-withdrawals"
              className="btn btn-danger btn-sm px-3 py-2 rounded-3 d-flex align-items-center gap-1 shadow-sm text-decoration-none"
            >
              <i className="ri-hand-coin-line"></i>
              Withdrawals ({cards.pendingWithdrawals})
            </Link>
          </div>
        </div>

        {/* Top 6 KPI Metric Cards */}
        <div className="row g-3 mb-4">
          {/* Card 1: Total Coins in Circulation */}
          <div className="col-xl-2 col-md-4 col-sm-6">
            <div
              className="card border-0 shadow-sm p-3 h-100 position-relative overflow-hidden"
              style={{
                borderRadius: "16px",
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                color: "#fff",
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span style={{ fontSize: "11px", opacity: 0.9, fontWeight: 600, textTransform: "uppercase" }}>
                  Wallet Circulation
                </span>
                <i className="ri-coins-line fs-20" style={{ opacity: 0.8 }}></i>
              </div>
              <h3 className="fw-bold mb-1" style={{ letterSpacing: "-0.5px" }}>
                {cards.totalCoinsInWallets.toLocaleString()}
              </h3>
              <span style={{ fontSize: "11px", opacity: 0.8 }}>Total User Balance</span>
            </div>
          </div>

          {/* Card 2: Today's Coins Issued */}
          <div className="col-xl-2 col-md-4 col-sm-6">
            <div
              className="card border-0 shadow-sm p-3 h-100 position-relative overflow-hidden"
              style={{
                borderRadius: "16px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#fff",
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span style={{ fontSize: "11px", opacity: 0.9, fontWeight: 600, textTransform: "uppercase" }}>
                  Today's Rewards
                </span>
                <i className="ri-gift-line fs-20" style={{ opacity: 0.8 }}></i>
              </div>
              <h3 className="fw-bold mb-1" style={{ letterSpacing: "-0.5px" }}>
                {cards.todaysRewards.toLocaleString()}
              </h3>
              <span style={{ fontSize: "11px", opacity: 0.8 }}>Coins Issued Today</span>
            </div>
          </div>

          {/* Card 3: Today's Surveys */}
          <div className="col-xl-2 col-md-4 col-sm-6">
            <div
              className="card border-0 shadow-sm p-3 h-100 position-relative overflow-hidden"
              style={{
                borderRadius: "16px",
                background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
                color: "#fff",
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span style={{ fontSize: "11px", opacity: 0.9, fontWeight: 600, textTransform: "uppercase" }}>
                  Surveys Today
                </span>
                <i className="ri-survey-line fs-20" style={{ opacity: 0.8 }}></i>
              </div>
              <h3 className="fw-bold mb-1" style={{ letterSpacing: "-0.5px" }}>
                {cards.todaysSurveys}
              </h3>
              <span style={{ fontSize: "11px", opacity: 0.8 }}>Completed Tasks</span>
            </div>
          </div>

          {/* Card 4: Ads Watched Today */}
          <div className="col-xl-2 col-md-4 col-sm-6">
            <div
              className="card border-0 shadow-sm p-3 h-100 position-relative overflow-hidden"
              style={{
                borderRadius: "16px",
                background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                color: "#fff",
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span style={{ fontSize: "11px", opacity: 0.9, fontWeight: 600, textTransform: "uppercase" }}>
                  Ads Watched
                </span>
                <i className="ri-play-circle-line fs-20" style={{ opacity: 0.8 }}></i>
              </div>
              <h3 className="fw-bold mb-1" style={{ letterSpacing: "-0.5px" }}>
                {cards.todaysAdsWatched || 0}
              </h3>
              <span style={{ fontSize: "11px", opacity: 0.8 }}>Videos & Interstitials</span>
            </div>
          </div>

          {/* Card 5: Total USD/USDT Value */}
          <div className="col-xl-2 col-md-4 col-sm-6">
            <div
              className="card border-0 shadow-sm p-3 h-100 position-relative overflow-hidden"
              style={{
                borderRadius: "16px",
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                color: "#fff",
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span style={{ fontSize: "11px", opacity: 0.9, fontWeight: 600, textTransform: "uppercase" }}>
                  Gross Revenue
                </span>
                <i className="ri-money-dollar-circle-line fs-20" style={{ opacity: 0.8 }}></i>
              </div>
              <h3 className="fw-bold mb-1" style={{ letterSpacing: "-0.5px" }}>
                ${(cards.totalUsdRevenue || 0).toFixed(2)}
              </h3>
              <span style={{ fontSize: "11px", opacity: 0.8 }}>Total USDT Earned</span>
            </div>
          </div>

          {/* Card 6: Pending Withdrawals */}
          <div className="col-xl-2 col-md-4 col-sm-6">
            <div
              className="card border-0 shadow-sm p-3 h-100 position-relative overflow-hidden"
              style={{
                borderRadius: "16px",
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                color: "#fff",
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span style={{ fontSize: "11px", opacity: 0.9, fontWeight: 600, textTransform: "uppercase" }}>
                  Pending Payouts
                </span>
                <i className="ri-time-line fs-20" style={{ opacity: 0.8 }}></i>
              </div>
              <h3 className="fw-bold mb-1" style={{ letterSpacing: "-0.5px" }}>
                {cards.pendingWithdrawals}
              </h3>
              <span style={{ fontSize: "11px", opacity: 0.8 }}>
                ₹{(cards.pendingWithdrawalsAmount || 0).toLocaleString()} Value
              </span>
            </div>
          </div>
        </div>

        {/* Section 1: Platform Net Profit & Fraud Shield Highlights */}
        <div className="row g-4 mb-4">
          {/* Net Profit Calculator Card */}
          <div className="col-lg-7">
            <div
              className="card border-0 shadow-sm p-4 h-100 position-relative overflow-hidden d-flex flex-column justify-content-between"
              style={{
                borderRadius: "18px",
                background: "linear-gradient(135deg, #059669 0%, #065f46 100%)",
                color: "#fff",
                minHeight: "290px",
              }}
            >
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="d-flex align-items-center justify-content-center rounded-circle"
                      style={{ width: 38, height: 38, backgroundColor: "rgba(255,255,255,0.2)" }}
                    >
                      <i className="ri-funds-box-line fs-20 text-white"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0 text-white" style={{ fontSize: "16px" }}>
                        Platform Net Profit & Economics
                      </h6>
                      <span style={{ fontSize: "12px", opacity: 0.85 }}>Real-time Gross Revenue vs User Payout Expenses</span>
                    </div>
                  </div>
                  <span
                    className="badge px-3 py-2 rounded-pill fw-bold"
                    style={{ backgroundColor: "rgba(255,255,255,0.25)", fontSize: "12px" }}
                  >
                    {economy.profitMargin}% Margin
                  </span>
                </div>

                <div className="row g-3 my-1 align-items-stretch">
                  <div className="col-md-4">
                    <div
                      className="p-3 rounded-3 h-100 d-flex flex-column justify-content-between"
                      style={{ backgroundColor: "rgba(0,0,0,0.18)", minHeight: "105px" }}
                    >
                      <span className="d-block text-truncate" style={{ fontSize: "11px", opacity: 0.85, fontWeight: 600 }}>
                        GROSS REVENUE (USDT)
                      </span>
                      <div className="my-1">
                        <h4 className="fw-bold mb-0 text-white" style={{ fontSize: "22px" }}>
                          ${(economy.grossRevenueUsd || 0).toFixed(2)}
                        </h4>
                      </div>
                      <span style={{ fontSize: "10px", opacity: 0.75 }}>Total Revenue</span>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div
                      className="p-3 rounded-3 h-100 d-flex flex-column justify-content-between"
                      style={{ backgroundColor: "rgba(0,0,0,0.18)", minHeight: "105px" }}
                    >
                      <span className="d-block text-truncate" style={{ fontSize: "11px", opacity: 0.85, fontWeight: 600 }}>
                        TOTAL PAYOUTS GIVEN
                      </span>
                      <div className="my-1">
                        <h4 className="fw-bold mb-0 text-white" style={{ fontSize: "22px" }}>
                          ₹{(economy.completedPayoutsInr || 0).toLocaleString()}
                        </h4>
                      </div>
                      <span style={{ fontSize: "10px", opacity: 0.75 }}>
                        ~${(economy.completedPayoutsUsd || 0).toFixed(2)} USD
                      </span>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div
                      className="p-3 rounded-3 h-100 d-flex flex-column justify-content-between"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.22)",
                        border: "1px solid rgba(255,255,255,0.35)",
                        minHeight: "105px",
                      }}
                    >
                      <span className="d-block text-truncate" style={{ fontSize: "11px", fontWeight: 700 }}>
                        NET PLATFORM PROFIT
                      </span>
                      <div className="my-1">
                        <h4 className="fw-bold mb-0 text-white" style={{ fontSize: "22px" }}>
                          ${(economy.netProfitUsd || 0).toFixed(2)} <span style={{ fontSize: "12px" }}>USDT</span>
                        </h4>
                      </div>
                      <span style={{ fontSize: "10px", opacity: 0.9 }}>Net Available</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center pt-2 mt-2 border-top border-white-50" style={{ fontSize: "12px", opacity: 0.9 }}>
                <span>Conversion Rate: <strong>{economy.pointsPerRupee} Coins = ₹1</strong></span>
                <span>Limits: <strong>Min ₹{economy.userMinWithdrawLimit} / Max ₹{economy.userMaxWithdrawLimit.toLocaleString()}</strong></span>
              </div>
            </div>
          </div>

          {/* Fraud Protection & Risk Shield Card */}
          <div className="col-lg-5">
            <div
              className="card border-0 shadow-sm p-4 h-100 position-relative overflow-hidden d-flex flex-column justify-content-between"
              style={{
                borderRadius: "18px",
                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                color: "#fff",
                minHeight: "290px",
              }}
            >
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="d-flex align-items-center justify-content-center rounded-circle"
                      style={{ width: 38, height: 38, backgroundColor: "rgba(16, 185, 129, 0.2)" }}
                    >
                      <i className="ri-shield-check-line fs-20 text-success"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0 text-white" style={{ fontSize: "16px" }}>
                        Anti-Fraud & Security Shield
                      </h6>
                      <span style={{ fontSize: "12px", opacity: 0.8 }}>Automated abuse & velocity detection</span>
                    </div>
                  </div>
                  <span className="badge bg-success px-3 py-1 rounded-pill" style={{ fontSize: "11px", fontWeight: 700 }}>
                    <i className="ri-checkbox-circle-fill me-1"></i> ACTIVE
                  </span>
                </div>

                <div className="d-flex flex-column gap-2 my-1" style={{ fontSize: "13px" }}>
                  <div className="d-flex justify-content-between align-items-center p-2 px-3 rounded-2" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                    <span className="text-white-50">Device Ad Velocity Cap:</span>
                    <span className="fw-bold text-success">{fraudShield.maxAdsPerDevice} Ads / Device / Day</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center p-2 px-3 rounded-2" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                    <span className="text-white-50">Claim Cooldown Frequency:</span>
                    <span className="fw-bold text-info">{fraudShield.claimFrequencyHours} Hours</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center p-2 px-3 rounded-2" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                    <span className="text-white-50">Min Points to Convert:</span>
                    <span className="fw-bold text-warning">{fraudShield.minCoinsToClaim} Points</span>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center pt-2 mt-2 border-top border-white-50" style={{ fontSize: "12px", opacity: 0.8 }}>
                <span>Security Engine: <strong>Rule-based & Device ID Hash</strong></span>
                <span>Protection: <strong className="text-success">Active</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Ad Networks & Survey Integrations (Rich Colorful Cards) */}
        <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: "18px" }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h6 className="fw-bold mb-1" style={{ color: "#1e293b" }}>
                <i className="ri-broadcast-line text-primary me-2"></i>
                Ad Networks & Survey Integrations
              </h6>
              <p className="text-muted small mb-0">
                Connected ad SDKs, offerwalls, and provider endpoints serving live in the app.
              </p>
            </div>
            <Link href="/AdsWatchSetting" className="btn btn-outline-secondary btn-sm rounded-3">
              Configure IDs
            </Link>
          </div>

          <div className="row g-4">
            {adNetworks.map((net: any) => {
              const gradientMap: any = {
                admob_android: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                admob_ios: "linear-gradient(135deg, #475569 0%, #1e293b 100%)",
                adsense_web: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                unity_ads: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
                cpx_research: "linear-gradient(135deg, #f43f5e 0%, #be123c 100%)",
                bitlabs: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
                adgem: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
                theoremreach: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)",
              };
              const bgGradient = gradientMap[net.id] || "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)";

              return (
                <div key={net.id} className="col-lg-4 col-md-6">
                  <div
                    className="card border-0 shadow-sm p-4 h-100 position-relative overflow-hidden d-flex flex-column justify-content-between"
                    style={{
                      borderRadius: "18px",
                      background: bgGradient,
                      color: "#fff",
                      minHeight: "220px",
                    }}
                  >
                    {/* Floating Watermark Background Icon */}
                    <div
                      style={{
                        position: "absolute",
                        right: -15,
                        top: -15,
                        width: 110,
                        height: 110,
                        borderRadius: "50%",
                        backgroundColor: "rgba(255,255,255,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                      }}
                    >
                      <i className={`${net.icon || "ri-ad-line"} text-white`} style={{ fontSize: "56px", opacity: 0.25 }}></i>
                    </div>

                    <div>
                      {/* Top Row: Network Info & Active Badge */}
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="d-flex align-items-center justify-content-center rounded-circle"
                            style={{ width: 36, height: 36, backgroundColor: "rgba(255,255,255,0.2)" }}
                          >
                            <i className={`${net.icon || "ri-ad-line"} fs-18 text-white`}></i>
                          </div>
                          <div>
                            <h6 className="fw-bold mb-0 text-white" style={{ fontSize: "15px" }}>
                              {net.name}
                            </h6>
                            <span style={{ fontSize: "11px", opacity: 0.85 }}>{net.type}</span>
                          </div>
                        </div>

                        <span
                          className="badge rounded-pill px-3 py-1"
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            backgroundColor: net.isEnabled ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.3)",
                            color: "#fff",
                            backdropFilter: "blur(4px)",
                          }}
                        >
                          {net.isEnabled ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>

                      {/* Middle: Big Bold USDT Earnings */}
                      <div className="my-2">
                        <span style={{ fontSize: "11px", opacity: 0.85, textTransform: "uppercase", fontWeight: 600 }}>
                          Total USDT Earnings
                        </span>
                        <div className="d-flex align-items-baseline gap-2">
                          <h2 className="fw-bold mb-0 text-white" style={{ letterSpacing: "-0.5px", fontSize: "28px" }}>
                            ${(net.totalUsdt || 0).toFixed(2)}
                          </h2>
                          <span style={{ fontSize: "13px", opacity: 0.9, fontWeight: 700 }}>USDT</span>
                        </div>
                      </div>

                      {/* Badges & Today's Earning */}
                      <div className="d-flex align-items-center gap-2 my-2 flex-wrap">
                        <span
                          className="badge px-2 py-1"
                          style={{
                            backgroundColor: "rgba(255,255,255,0.2)",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                        >
                          {net.todaysUsdt > 0 ? `+$${net.todaysUsdt.toFixed(2)} Today` : "$0.00 Today"}
                        </span>
                        <span style={{ fontSize: "11px", opacity: 0.85 }}>
                          {net.count || 0} completions ({net.totalCoins?.toLocaleString() || 0} coins)
                        </span>
                      </div>
                    </div>

                    {/* Bottom Translucent Info Pill */}
                    <div
                      className="mt-3 p-2 px-3 rounded-3 d-flex justify-content-between align-items-center"
                      style={{
                        backgroundColor: "rgba(0,0,0,0.18)",
                        fontSize: "11px",
                      }}
                    >
                      <span className="text-truncate" style={{ maxWidth: "160px", opacity: 0.9 }}>
                        {net.appId ? `ID: ${net.appId}` : net.clientId ? `Pub: ${net.clientId}` : net.gameIdAndroid ? `Game: ${net.gameIdAndroid}` : "Configured"}
                      </span>
                      <span className="fw-bold" style={{ opacity: 0.95 }}>
                        {net.pointsPerAd ? `+${net.pointsPerAd} Coins/Ad` : net.pointsPerSurvey ? `+${net.pointsPerSurvey} Coins/Survey` : "Ready"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Charts Row */}
        <div className="row g-4 mb-4">
          {/* Trend Chart */}
          <div className="col-lg-7">
            <div className="card border-0 shadow-sm p-4 h-100" style={{ borderRadius: "18px" }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="fw-bold mb-1" style={{ color: "#1e293b" }}>
                    <i className="ri-line-chart-line text-success me-2"></i>
                    7-Day Reward Issuance Trend
                  </h6>
                  <p className="text-muted small mb-0">Daily volume of coins earned by users</p>
                </div>
              </div>
              <Chart options={trendChartOptions} series={trendChartSeries} type="area" height={260} />
            </div>
          </div>

          {/* Donut Category Chart */}
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm p-4 h-100" style={{ borderRadius: "18px" }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="fw-bold mb-1" style={{ color: "#1e293b" }}>
                    <i className="ri-pie-chart-2-line text-warning me-2"></i>
                    Earnings By Channel
                  </h6>
                  <p className="text-muted small mb-0">Distribution across ads, surveys, and streaks</p>
                </div>
              </div>
              {catSeries.length > 0 ? (
                <Chart options={donutOptions} series={catSeries} type="donut" height={260} />
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted p-4">
                  <i className="ri-donut-chart-line fs-32 mb-2 text-secondary"></i>
                  <span>No category breakdown data available yet</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Top Earners Leaderboard & Provider Breakdown */}
        <div className="row g-4 mb-4">
          {/* Top 5 Earners Leaderboard */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm p-4 h-100" style={{ borderRadius: "18px" }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="fw-bold mb-1" style={{ color: "#1e293b" }}>
                    <i className="ri-trophy-line text-warning me-2"></i>
                    Top Earners Leaderboard
                  </h6>
                  <p className="text-muted small mb-0">Highest reward earners on the platform</p>
                </div>
                <Link href="/User/User" className="small text-decoration-none" style={{ color: "#8F6DFF" }}>
                  View All Users &rarr;
                </Link>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
                  <thead className="table-light">
                    <tr>
                      <th>Rank & User</th>
                      <th className="text-center">Unique ID</th>
                      <th className="text-center">Current Wallet</th>
                      <th className="text-end">Total Lifetime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topEarners.map((w: any, idx: number) => {
                      const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
                      return (
                        <tr key={w._id || idx}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <span style={{ fontSize: "16px", minWidth: "24px" }}>{medal}</span>
                              <img
                                src={w.user?.image || male.src}
                                alt="Avatar"
                                className="rounded-circle border"
                                style={{ width: 32, height: 32, objectFit: "cover" }}
                                onError={(e: any) => {
                                  e.target.src = male.src;
                                }}
                              />
                              <div>
                                <span className="fw-bold d-block text-dark">{w.user?.name || "User"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="text-center font-monospace text-muted">{w.user?.uniqueId || "-"}</td>
                          <td className="text-center fw-bold text-primary">{(w.coinBalance || 0).toLocaleString()}</td>
                          <td className="text-end fw-bold text-success">{(w.totalEarned || w.coinBalance || 0).toLocaleString()} coins</td>
                        </tr>
                      );
                    })}
                    {topEarners.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-4">
                          No active wallet data found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Survey Provider Performance */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm p-4 h-100" style={{ borderRadius: "18px" }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0" style={{ color: "#1e293b" }}>
                  <i className="ri-survey-line text-info me-2"></i>
                  Survey Provider Breakdown
                </h6>
                <Link href="/survey-providers" className="small text-decoration-none" style={{ color: "#8F6DFF" }}>
                  View Settings &rarr;
                </Link>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
                  <thead className="table-light">
                    <tr>
                      <th>Provider</th>
                      <th className="text-center">Completions</th>
                      <th className="text-center">Coins Issued</th>
                      <th className="text-end">USD Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {providerStats.map((p: any, idx: number) => (
                      <tr key={idx}>
                        <td className="fw-bold text-uppercase d-flex align-items-center gap-2">
                          <span
                            className="rounded-circle d-inline-block"
                            style={{
                              width: 10,
                              height: 10,
                              backgroundColor: p._id?.toLowerCase().includes("cpx") ? "#FF6B6B" : "#845EC2",
                            }}
                          ></span>
                          {p._id || "Unknown"}
                        </td>
                        <td className="text-center fw-semibold">{p.count}</td>
                        <td className="text-center text-success fw-semibold">+{p.totalCoins?.toLocaleString()}</td>
                        <td className="text-end fw-bold text-dark">${(p.totalUsd || 0).toFixed(2)} USDT</td>
                      </tr>
                    ))}
                    {providerStats.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-4">
                          No provider callbacks recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Live Activity Ledger */}
        <div className="card border-0 shadow-sm p-4" style={{ borderRadius: "18px" }}>
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h6 className="fw-bold mb-0" style={{ color: "#1e293b" }}>
                <i className="ri-history-line text-primary me-2"></i>
                Live Reward & Ledger Activity
              </h6>
              <p className="text-muted small mb-0">Real-time user reward credits, payouts, and manual adjustments</p>
            </div>

            {/* Filter Tabs */}
            <div className="btn-group btn-group-sm" role="group">
              <button
                type="button"
                className={`btn btn-sm ${activeTab === "all" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setActiveTab("all")}
                style={activeTab === "all" ? { backgroundColor: "#8F6DFF", borderColor: "#8F6DFF" } : {}}
              >
                All
              </button>
              <button
                type="button"
                className={`btn btn-sm ${activeTab === "survey" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setActiveTab("survey")}
                style={activeTab === "survey" ? { backgroundColor: "#8F6DFF", borderColor: "#8F6DFF" } : {}}
              >
                Surveys
              </button>
              <button
                type="button"
                className={`btn btn-sm ${activeTab === "ad" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setActiveTab("ad")}
                style={activeTab === "ad" ? { backgroundColor: "#8F6DFF", borderColor: "#8F6DFF" } : {}}
              >
                Ads
              </button>
              <button
                type="button"
                className={`btn btn-sm ${activeTab === "withdraw" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setActiveTab("withdraw")}
                style={activeTab === "withdraw" ? { backgroundColor: "#8F6DFF", borderColor: "#8F6DFF" } : {}}
              >
                Payouts
              </button>
            </div>
          </div>

          <div className="table-responsive" style={{ maxHeight: "380px", overflowY: "auto" }}>
            <table className="table table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
              <thead className="table-light sticky-top">
                <tr>
                  <th>User</th>
                  <th className="text-center">Category</th>
                  <th className="text-center">Coins</th>
                  <th className="text-end">Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredTx.map((tx: any, idx: number) => (
                  <tr key={idx}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <img
                          src={tx.user?.image || male.src}
                          alt="Avatar"
                          className="rounded-circle border"
                          style={{ width: 30, height: 30, objectFit: "cover" }}
                          onError={(e: any) => {
                            e.target.src = male.src;
                          }}
                        />
                        <div>
                          <span className="fw-semibold d-block text-dark" style={{ fontSize: "12px" }}>
                            {tx.user?.name || "App User"}
                          </span>
                          {tx.user?.uniqueId && (
                            <span className="text-muted" style={{ fontSize: "10px" }}>
                              ID: {tx.user.uniqueId}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                      <span
                        className={`badge px-2 py-1 ${
                          tx.category?.includes("survey")
                            ? "bg-primary-subtle text-primary"
                            : tx.category?.includes("ad")
                            ? "bg-purple-subtle text-purple"
                            : tx.category?.includes("withdraw")
                            ? "bg-danger-subtle text-danger"
                            : "bg-success-subtle text-success"
                        }`}
                        style={{ fontSize: "11px" }}
                      >
                        {tx.category || tx.type}
                      </span>
                    </td>
                    <td className="text-center">
                      <span
                        className={`fw-bold ${tx.type === "credit" ? "text-success" : "text-danger"}`}
                        style={{ fontSize: "13px" }}
                      >
                        {tx.type === "credit" ? "+" : "-"}
                        {tx.amount?.toLocaleString()}
                      </span>
                    </td>
                    <td className="text-end text-muted small">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                    </td>
                  </tr>
                ))}
                {filteredTx.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-4">
                      No matching transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Manual Coin Adjustment Modal */}
        {showAdjustModal && (
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow" style={{ borderRadius: "16px" }}>
                <div className="modal-header border-bottom">
                  <h5 className="modal-title fw-bold">
                    <i className="ri-hand-coin-line text-warning me-2"></i>
                    Quick Adjust User Wallet
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowAdjustModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleManualAdjust}>
                  <div className="modal-body p-4">
                    <div className="mb-3">
                      <label className="form-label fw-semibold" style={{ fontSize: "13px" }}>
                        Target User (User ID or Unique ID)
                      </label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        placeholder="e.g. 64b1f... or Unique ID"
                        value={adjustUserId}
                        onChange={(e) => setAdjustUserId(e.target.value)}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold" style={{ fontSize: "13px" }}>
                        Adjustment Action
                      </label>
                      <div className="d-flex gap-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="adjustType"
                            id="creditRadio"
                            value="credit"
                            checked={adjustType === "credit"}
                            onChange={() => setAdjustType("credit")}
                          />
                          <label className="form-check-label text-success fw-bold" htmlFor="creditRadio">
                            Credit (+) Add Coins
                          </label>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="adjustType"
                            id="debitRadio"
                            value="debit"
                            checked={adjustType === "debit"}
                            onChange={() => setAdjustType("debit")}
                          />
                          <label className="form-check-label text-danger fw-bold" htmlFor="debitRadio">
                            Debit (-) Deduct Coins
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold" style={{ fontSize: "13px" }}>
                        Coin Amount
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="form-control rounded-3"
                        value={adjustCoins}
                        onChange={(e) => setAdjustCoins(e.target.value)}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold" style={{ fontSize: "13px" }}>
                        Description / Reason
                      </label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        placeholder="e.g. Survey compensation, referral bonus"
                        value={adjustDescription}
                        onChange={(e) => setAdjustDescription(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="modal-footer border-top bg-light" style={{ borderBottomLeftRadius: "16px", borderBottomRightRadius: "16px" }}>
                    <button
                      type="button"
                      className="btn btn-outline-secondary rounded-3"
                      onClick={() => setShowAdjustModal(false)}
                      disabled={adjusting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary rounded-3 text-white"
                      style={{ backgroundColor: "#8F6DFF", borderColor: "#8F6DFF" }}
                      disabled={adjusting}
                    >
                      {adjusting ? "Processing..." : "Confirm Adjustment"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </RootLayout>
  );
}
