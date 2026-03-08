import RootLayout from "@/component/layout/Layout";
import Analytics from "@/extra/Analytic";
import Table from "@/extra/Table";
import Title from "@/extra/Title";
import {
  getChartData,
  getChartDataOfHost,
  getDashboardData,
} from "@/store/dashboardSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import dayjs from "dayjs";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Male from "../assets/images/male.png";
import { isLoading } from "@/utils/allSelector";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import GetNewUser from "./GetNewUser";
import TopPerformingHost from "./TopPerformingHost";
import { userTypes } from "@/utils/extra";
import TopPerformingAgency from "./TopPerformingAgency";
import TopSpenders from "./TopSpenders";
import { formatCoins, routerChange } from "@/utils/Common";
import { fontWeight } from "html2canvas/dist/types/css/property-descriptors/font-weight";
import { Box, Divider, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import { getDefaultCurrency } from "@/store/settingSlice";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Corrected Icon Imports
import total_user from "@/assets/images/total_user.svg";
import total_block_user from "@/assets/images/total_block_user.svg";
import total_vip_user from "@/assets/images/total_vip_user.svg";
import total_agency from "@/assets/images/total_agency.png";
import total_pending_host from "@/assets/images/total_pending_host.png";
import total_host from "@/assets/images/total_host.svg";
import total_impression from "@/assets/images/total_impression.svg";
import total_live_host from "@/assets/images/total_live_host.svg";
import noImage from "@/assets/images/noImage.png";
import coin from "@/assets/images/coin.png";


const Dashboard = () => {
  const dispatch = useAppDispatch();
  const [data, setData] = useState([]);
  const { dialogueType } = useSelector((state: RootStore) => state.dialogue);
  const { defaultCurrency } = useSelector((state: RootStore) => state.setting)

  const [startDate, setStartDate] = useState("All");
  const [endDate, setEndDate] = useState("All");
  const loader = useSelector<any>(isLoading);
  const { loading } = useSelector((state: RootStore) => state.dashboard);
  const [type, setType] = useState<string | null>(null);

  useEffect(() => {
    const storedType = localStorage.getItem("dashType") || "Recent Users";
    if (storedType) setType(storedType);
  }, []);

  useEffect(() => {
    if (type) {
      localStorage.setItem("dashType", type);
      routerChange("/dashboard", "dashType", router);
    }
  }, [type]);

  const router = useRouter();

  useEffect(() => {
    let payload: any = {
      startDate,
      endDate,
    };
    dispatch(getDashboardData(payload));
    dispatch(getDefaultCurrency())

    dispatch(getChartData(payload));
    dispatch(getChartDataOfHost(payload));
  }, [dispatch, startDate, endDate]);

  const dashboard: any = useSelector((state: RootStore) => state.dashboard);

  function ListItem({ loading, children }: any) {
    return (
      <div className="list-item">
        {loading ? <Skeleton style={{ height: "45px" }} /> : children}
      </div>
    );
  }

  const dashboardCards = [
    {
      title: "Total Users",
      icon: total_user.src || total_user,
      amount: dashboard?.dashboardData?.totalUsers,
      link: "/User/User",
      infoTooltip: "Total registered users in the system\nIncludes active and inactive users",

    },
    {
      title: "Total Block User",
      icon: total_block_user.src || total_block_user,
      amount: dashboard?.dashboardData?.totalBlockedUsers,
      link: "/User/User",
      infoTooltip: "Users who have been blocked\nCannot log in or access features",
    },
    {
      title: "Total VIP User",
      icon: total_vip_user.src || total_vip_user,
      amount: dashboard?.dashboardData?.totalVipUsers,
      link: "/User/User",
      infoTooltip: "Premium users with VIP access\nEnjoys extra privileges",
    },
    {
      title: "Total Agency",
      icon: total_agency.src || total_agency,
      amount: dashboard?.dashboardData?.totalAgency,
      link: "/Agency",
      infoTooltip: "Registered agencies in the system\nManages multiple hosts or users",
    },
    {
      title: "Total Pending Host",
      icon: total_pending_host.src || total_pending_host,
      amount: dashboard?.dashboardData?.totalPendingHosts,
      link: "/HostRequest",
      infoTooltip: "Hosts waiting for approval\nPending verification or documents",
    },
    {
      title: "Total Host",
      icon: total_host.src || total_host,
      amount: dashboard?.dashboardData?.totalHosts,
      link: "/Host",
      infoTooltip: "All approved hosts\nAble to go live and earn revenue",
    },

    {
      title: "Total Impressions",
      icon: total_impression.src || total_impression,
      amount: dashboard?.dashboardData?.totalImpressions,
      link: "/Impression",
      infoTooltip: "Total content impressions\nHow many times content was viewed",
    },
    {
      title: "Total Current Live Host",
      icon: total_live_host.src || total_live_host,
      amount: dashboard?.dashboardData?.totalCurrentLiveHosts,
      link: "/Host",
      infoTooltip: "Hosts currently streaming live\nActive at this moment",
    },

  ];

  const dashboardCards1 = [
    {
      title: "Total Revenue",
      subtitle: "Gross payments collected",
      icon: "/images/admin_commission.svg",
      amount: dashboard?.dashboardData?.grossPaymentsCollected,
      link: "/PlanHistory",
      currency: defaultCurrency?.symbol,
      infoTooltip: "Total earnings from users purchasing coin plans and VIP plans.",
    },
    {
      title: "Coins Sold",
      subtitle: "Total in-app coins purchased",
      icon: "/images/host_earnings.svg",
      amount: dashboard?.dashboardData?.coinsSold,
      // link: "/Coins",
      infoTooltip: "Total coins sold to users.",
      coin: coin,
    },
    {
      title: "Admin Commission Earned",
      subtitle: "Platform commission income",
      icon: "/images/host_payouts.svg",
      amount: dashboard?.dashboardData?.adminCommissionEarned,
      // link: "/Revenue",
      infoTooltip: "Total commission earned by admin\nFrom all transactions",
      coin: coin,
    },
    {
      title: "Host Earnings Generated",
      subtitle: "Total host income created",
      icon: "/images/pending_payout.svg",
      amount: dashboard?.dashboardData?.hostEarningsGenerated,
      // link: "/HostEarnings",
      infoTooltip: "Total earnings generated by hosts\nIncludes completed and pending payouts",
      coin: coin,
    },
    {
      title: "Host Payouts Completed",
      subtitle: "Paid out to hosts",
      icon: "/images/gross_payments.svg",
      amount: dashboard?.dashboardData?.hostPayoutsCompleted,
      // link: "/HostPayouts",
      infoTooltip: "Total payouts successfully completed to hosts",
      coin: coin,
    },
    {
      title: "Pending Payout Liability",
      subtitle: "Amount yet to be paid",
      icon: "/images/coins_sold.svg",
      amount: dashboard?.dashboardData?.pendingPayoutLiability,
      // link: "/HostPayouts",
      infoTooltip: "Total pending payouts due to hosts\nLiability yet to be paid",
      coin: coin,
    },
  ];




  return (
    <div className="mainDashboard">
      <div className="dashBoardHead">
        <h3
          className="text-start"
          style={{ fontWeight: "500", marginBottom: "0px" }}
        >
          Welcome Admin!
        </h3>
        <div className="row mb-0">
          <div className="col-12 col-md-3 col-sm-3 !mb-3 d-flex align-items-center">
            <Title
              name="Dashboard"
              className="textcommonclass"
              display={"none"}
              bottom={"0"}
              style={{ color: "#404040" }}
            />
          </div>

          <div className="col-md-9 col-12 mb-0 d-flex justify-content-end">
            <Analytics
              analyticsStartDate={startDate}
              analyticsStartEnd={endDate}
              analyticsStartDateSet={setStartDate}
              analyticsStartEndSet={setEndDate}
              direction={"end"}
            />
          </div>
        </div>
      </div>
      <div className="mainDashbox">
        <div
          className="row"
          style={{
            rowGap: "25px",
          }}
        >
          {dashboardCards?.map((card, index) => (
            <div
              key={index}
              className="col-xl-3 col-lg-3 col-md-6 col-sm-6 col-12"

            >

              {loading.dashboardData ? (
                <SkeletonTheme baseColor="#e2e5e7" >
                  <div className="row">
                    <div className="col-5">
                      <Skeleton
                        height={100}
                        width={310}
                        style={{
                          height: "380px",
                          width: "500px",
                          objectFit: "cover",
                          boxSizing: "border-box",
                          borderRadius: "5px",
                          // borderTopLeftRadius: "30px",
                          // borderBottomLeftRadius: "30px",
                          border: "1px solid #e2e5e7",
                        }}
                      />
                    </div>
                  </div>
                </SkeletonTheme>
              ) : (
                <DashBox
                  title={card.title}
                  icon={card.icon}
                  amount={card.amount?.toFixed()}
                  onClick={() => router.push({ pathname: card.link })}
                  // currency={card.currency}
                  infoTooltip={card.infoTooltip}

                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="row mb-2 mt-2">
        <div className="col-12 col-md-3 col-sm-3 mb-0 d-flex align-items-center">
          <Title
            name="Admin Revenue "
            className="textcommonclass"
            display={"none"}
            bottom={"0"}
            style={{ color: "#404040" }}
          />
        </div>

      </div>

      <div className="mainDashbox">
        <div
          className="row"
          style={{
            rowGap: "25px",
          }}
        >
          {dashboardCards1?.map((card, index) => (
            <div
              key={index}
              className="col-xl-3 col-lg-3 col-md-6 col-sm-6 col-12"

            >

              {loading.dashboardData ? (
                <SkeletonTheme baseColor="#e2e5e7" >
                  <div className="row">
                    <div className="col-5">
                      <Skeleton
                        height={100}
                        width={310}
                        style={{
                          height: "380px",
                          width: "500px",
                          objectFit: "cover",
                          boxSizing: "border-box",
                          borderRadius: "5px",
                          // borderTopLeftRadius: "30px",
                          // borderBottomLeftRadius: "30px",
                          border: "1px solid #e2e5e7",
                        }}
                      />
                    </div>
                  </div>
                </SkeletonTheme>
              ) : (
                <DashBox
                  title={card.title}
                  icon={card.icon}
                  amount={card.amount?.toFixed()}
                  onClick={() => router.push({ pathname: card.link })}
                  currency={card.currency}
                  coin={card.coin}
                  infoTooltip={card.infoTooltip}
                  subtitle={card.subtitle}

                />
              )}
            </div>
          ))}
        </div>
      </div>



      <h4
        className="textcommonclass"
        style={{
          marginTop: "14px",
          marginBottom: "15px",
          fontSize: "26px",
          fontWeight: 400,
        }}
      >
        Data Analysis
      </h4>
      <div
        className="m20-top apexChart tsBox"
        style={{ border: `${loader ? "1px solid #e2e5e7" : ""}` }}
      >
        {loading.chartDataHost ? (
          <>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Skeleton height={20} width={350} />
            </div>
            <div style={{ padding: "20px" }}>
              <ListItem loading={loading.chartDataHost}>List Item 1</ListItem>
              <ListItem loading={loading.chartDataHost}>List Item 2</ListItem>
              <ListItem loading={loading.chartDataHost}>List Item 3</ListItem>
              <ListItem loading={loading.chartDataHost}>List Item 3</ListItem>
              <ListItem loading={loading.chartDataHost}>List Item 3</ListItem>
              <ListItem loading={loading.chartDataHost}>List Item 3</ListItem>
            </div>
          </>
        ) : (
          <ApexChart startDate={startDate} endDate={endDate} />
        )}
      </div>

      <h4
        className="textcommonclass"
        style={{
          marginTop: "25px",
          marginBottom: "10px",
          fontSize: "26px",
          fontWeight: 400,
        }}
      >
        All Data Analysis
      </h4>

      <div
        className={`userTable ${dialogueType === "doctor" ? "d-none" : "d-block"
          }`}
        style={{ marginTop: "15px" }}
      >
        <div className="my-2 user1_width mt-2">
          {userTypes.map((item, index) => (
            <button
              key={index}
              type="button"
              className={`${type === item.value ? "activeBtn" : "disabledBtn"
                } ${index !== 0 ? "ms-1" : ""}`}
              onClick={() => setType(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {type === "Recent Users" && (
          <GetNewUser startDate={startDate} endDate={endDate} type={type} />
        )}
        {type === "top_perfoming_host" && (
          <TopPerformingHost
            startDate={startDate}
            endDate={endDate}
            type={type}
          />
        )}
        {type === "top_perfoming_agency" && (
          <TopPerformingAgency
            startDate={startDate}
            endDate={endDate}
            type={type}
          />
        )}

        {type === "top_spenders" && (
          <TopSpenders startDate={startDate} endDate={endDate} type={type} />
        )}
      </div>
    </div>
  );
};
Dashboard.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default Dashboard;

const DashBox = ({
  infoTooltip,
  icon,
  title,
  amount,
  currency,
  coin,
  subtitle,
  onClick,
}: any) => {

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    e.currentTarget.src = noImage.src;
  };


  return (
    <Paper
      elevation={2}
      sx={{
        display: "flex",
        cursor: "pointer",
        padding: 2,
        position: "relative",
        backgroundColor: "#ffffff",
        borderLeft: "6px solid #8a4dff",
        borderRadius: 2,
        alignItems: "center",
      }}
      onClick={onClick}
    >
      {/* Info tooltip */}
      {infoTooltip && (
        <Tooltip title={infoTooltip} arrow placement="top-start">
          <IconButton
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              padding: 0,
              color: "#8a4dff",
            }}
          >
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {/* Icon */}
        <Box
          sx={{
            width: { xs: 40, md: 60 },
            height: { xs: 40, md: 60 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={icon}
            width={56}
            height={56}
            alt={title}
            onError={handleImageError}
            style={{ objectFit: 'contain' }}
          />
        </Box>

        {/* Divider */}
        <Divider
          orientation="vertical"
          flexItem
          sx={{ width: "1px", height: "60px", backgroundColor: "#a7a7a7" }}
        />

        {/* Content */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: 500,
              lineHeight: "16px",
            }}
          >
            {title}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {coin && (
              <Box
                component="img"
                src={`/images/coin.png`}
                alt="coin"
                sx={{ width: 20, height: 20 }}
              />
            )}

            {currency && (
              <Typography sx={{ fontSize: 28, fontWeight: 400 }}>
                {currency}
              </Typography>
            )}

            <Typography sx={{ fontSize: 28, fontWeight: 600 }}>
              {formatCoins(amount)}
            </Typography>
          </Box>

          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
};


const ChartChart = dynamic(() => import("react-apexcharts"), { ssr: false });
const ApexChart = ({ startDate, endDate }: any) => {
  const [chart, setChart] = useState<any>();
  const dispatch = useAppDispatch();
  const { chartData, chartDataHost } = useSelector(
    (state: RootStore) => state.dashboard
  );

  let label: any = [];
  let dataAmount: any = [];
  let dataCount: any = [];

  const allDatesSet = new Set([
    ...chartData.map((item: any) => item._id),
    ...chartDataHost.map((item: any) => item._id),
  ]);

  label = Array.from(allDatesSet).sort(); // your x-axis categories

  // Step 2: Map user and host data to the label list
  dataAmount = label.map((date: any) => {
    const found: any = chartData.find((item: any) => item._id === date);
    return found ? found.count : 0;
  });

  dataCount = label.map((date: any) => {
    const found: any = chartDataHost.find((item: any) => item._id === date);
    return found ? found.count : 0;
  });

  const totalSeries = {
    dataSet: [
      {
        name: "Total User",
        data: dataAmount,
      },
      {
        name: "Total Host",
        data: dataCount,
        markers: {
          size: 5,
          strokeColors: "#092C1C",
        },
      },
    ],
  };
  const optionsTotal: any = {
    chart: {
      type: "area",
      stacked: false,
      height: 500,
      background: "#fff",
      toolbar: {
        show: false,
      },
    },

    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [20, 100, 100, 100],
      },
      colors: ["#8544FF", "transparent"], // Set second series fill to transparent
    },
    grid: {
      padding: {
        right: 20,
        left: 20,
      },
    },

    yaxis: {
      show: false,
    },
    xaxis: {
      categories: label,
      labels: {
        offsetX: 5,
        style: {
          fontSize: "12px",
          colors: "#333",
        },
      },
      tickPlacement: "on",
      axisBorder: {
        show: true,
      },
      axisTicks: {
        show: true,
      },
      forceNiceScale: true,
    },

    tooltip: {
      shared: true,
    },
    title: {
      text: "User and Host Data",
      style: {
        color: "#1C2B20",
        marginTop: "50px",
        fontWeight: "500",
      },
      align: "center",
      offsetX: 20,
      cssClass: "mt-5",
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
      offsetY: -10,
      offsetX: -100,
      markers: {
        width: 24,
        height: 24,
        radius: 6, // Rounded square
        fillColors: ["#8A4DFF", "#1C0B2B"], // Custom legend colors
      },
      itemMargin: {
        horizontal: 20,
        vertical: 0,
      },
      labels: {
        colors: "#000000",
        useSeriesColors: false,
      },
    },
    colors: ["#8544FF", "#2A1138"],
  };

  return (
    <div id="chart">
      <ChartChart
        options={optionsTotal}
        series={totalSeries?.dataSet}
        type="area"
        height={400}
      />
    </div>
  );
};
