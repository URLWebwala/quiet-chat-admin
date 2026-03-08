import RootLayout from "@/component/layout/Layout";
import Analytics from "@/extra/Analytic";
import Table from "@/extra/Table";
import Title from "@/extra/Title";
import {
  getagencyEarnings,
  getDashboardData,
  getHostEarnings,
  getNewHost,
} from "@/store/dashboardSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { isLoading } from "@/utils/allSelector";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import TopPerformingHost from "./TopPerformingHost";
import { userTypes } from "@/utils/extra";
import { formatCoins, routerChange } from "@/utils/Common";
import GetNewHost from "./GetNewHost";
import totalActiveHost from "@/assets/images/totalactiveHost.svg";
import totalLiveHost from "@/assets/images/totalLiveHost.svg";
import totalSuspendedHost from "@/assets/images/totalSuspendedHost.svg";
import totalHost from "@/assets/images/totalHost.svg";
import totalPayoutPending from "@/assets/images/totalPayoutPending.svg";
import totalPayoutCompleted from "@/assets/images/totalPayoutCompleted.svg";
import totalAgencyEarning from "@/assets/images/totalImpression.png";
import totalAgencyUnderHost from "@/assets/images/totalAgencyUnderHost.svg";
import { Divider } from "@mui/material";

interface topProviderData {
  profileImage?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  doctorEarning?: number;
  appointment?: number;
  maskType?: string;
  earning?: number;
  avgRating?: number;
  uniqueId?: string;
  createdAt?: any;
  completedBookingCount: any;
}

const Dashboard = () => {
  const dispatch = useAppDispatch();
  const [data, setData] = useState([]);
  const { dashboardData }: any = useSelector(
    (state: RootStore) => state.dashboard
  );
  const [startDate, setStartDate] = useState("All");
  const [endDate, setEndDate] = useState("All");
  const loader = useSelector<any>(isLoading);
  const [type, setType] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedType = localStorage.getItem("dashType") || "Recent Host";
      if (storedType) setType(storedType);
    }
  }, []);

  useEffect(() => {
    if (type) {
      localStorage.setItem("dashType", type);
    }
  }, [type]);

  useEffect(() => {
    routerChange("/dashboard", "dashType", router);
  }, []);

  useEffect(() => {
    let payload: any = {
      startDate,
      endDate,
    };
    dispatch(getDashboardData(payload));
    dispatch(getNewHost(payload));
  }, [dispatch, startDate, endDate]);

  useEffect(() => {
    const payload: any = { startDate, endDate, type: "agencyEarning" };
    dispatch(getagencyEarnings(payload));
  }, [dispatch, startDate, endDate]);

  useEffect(() => {
    const payload: any = { startDate, endDate, type: "hostEarning" };
    dispatch(getHostEarnings(payload));
  }, [dispatch, startDate, endDate]);

  const dashboard: any = useSelector((state: RootStore) => state.dashboard);

  function ListItem({ loading, children }: any) {
    return (
      <div className="list-item">
        {loading ? <Skeleton style={{ height: "45px" }} /> : children}
      </div>
    );
  }

  return (
    <div className="mainDashboard">
      <div className="dashBoardHead">
        <h3 className="m3-bottom text-start">Welcome Admin!</h3>
        <div className="row mb-0">
          <div className="col-12 col-md-3 col-sm-3 mb-0 d-flex align-items-center">
            <Title
              name="Dashboard"
              display={"none"}
              bottom={"0"}
              style={{ color: "#404040" }}
            />
          </div>

          <div className="col-md-9 col-12 col-sm-9 mb-0 d-flex justify-content-lg-end justify-content-sm-end analytic-class">
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
        <div className="row">
          <div className="col-lg-4 col-xl-3 col-md-6 col-sm-6 col-12 mt-3 p-0">
            {loader ? (
              <>
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
                    {/* <div className="col-7 mt-2">
                      <Skeleton width={100} height={12} />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "start",
                          alignItems: "center", // 👈 vertical centering
                          // height: "100%", // 👈 make sure parent has height
                          paddingLeft: "10px",
                        }}
                      >
                        <Skeleton width={45} height={45} className="" />
                      </div>
                    </div> */}
                  </div>
                </SkeletonTheme>
              </>
            ) : (
              <DashBox
                title={`${"Total Active Host"}`}
                dashSVG={
                  <img src={totalActiveHost.src} className="img-class" />
                }
                amount={dashboardData?.activeHosts}
                onClick={() =>
                  router.push({
                    pathname: "/Host",
                  })
                }
              />
            )}
          </div>

          <div className="col-lg-4 col-xl-3 col-md-6 col-sm-6 col-12 mt-3 p-0">
            {loader ? (
              <>
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
                    {/* <div className="col-7 mt-2">
                      <Skeleton width={100} height={12} />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "start",
                          alignItems: "center", // 👈 vertical centering
                          // height: "100%", // 👈 make sure parent has height
                          paddingLeft: "10px",
                        }}
                      >
                        <Skeleton width={45} height={45} className="" />
                      </div>
                    </div> */}
                  </div>
                </SkeletonTheme>
              </>
            ) : (
              <DashBox
                title="Total Live Host"
                dashSVG={
                  <img
                    src={totalLiveHost.src}
                    width={56}
                    height={56}
                    className="img-class"
                  />
                }
                amount={dashboardData?.hostsLiveNow}
                onClick={() =>
                  router.push({
                    pathname: "/LiveHost",
                  })
                }
              />
            )}
          </div>

          <div className="col-lg-4 col-xl-3 col-md-6 col-sm-6 col-12 mt-3 p-0">
            {loader ? (
              <>
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
                    {/* <div className="col-7 mt-2">
                      <Skeleton width={100} height={12} />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "start",
                          alignItems: "center", // 👈 vertical centering
                          // height: "100%", // 👈 make sure parent has height
                          paddingLeft: "10px",
                        }}
                      >
                        <Skeleton width={45} height={45} className="" />
                      </div>
                    </div> */}
                  </div>
                </SkeletonTheme>
              </>
            ) : (
              <DashBox
                title="Total Suspended Host"
                dashSVG={
                  <img
                    src={totalSuspendedHost.src}
                    width={56}
                    height={56}
                    className="img-class"
                  />
                }
                amount={dashboardData?.suspendedHosts}
                onClick={() =>
                  router.push({
                    pathname: "/Host",
                  })
                }
              />
            )}
          </div>

          <div className="col-lg-4 col-xl-3 col-md-6 col-sm-6 col-12 mt-3 p-0">
            {loader ? (
              <>
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
                    {/* <div className="col-7 mt-2">
                      <Skeleton width={100} height={12} />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "start",
                          alignItems: "center", // 👈 vertical centering
                          // height: "100%", // 👈 make sure parent has height
                          paddingLeft: "10px",
                        }}
                      >
                        <Skeleton width={45} height={45} className="" />
                      </div>
                    </div> */}
                  </div>
                </SkeletonTheme>
              </>
            ) : (
              <DashBox
                title="Total Host"
                dashSVG={
                  <img
                    src={totalHost.src}
                    width={56}
                    height={56}
                    className="img-class"
                  />
                }
                amount={dashboard?.dashboardData?.totalHosts}
                onClick={() =>
                  router.push({
                    pathname: "/Host",
                  })
                }
              />
            )}
          </div>

          <div className="col-lg-4 col-xl-3 col-md-6 col-sm-6 col-12 mt-3 p-0">
            {loader ? (
              <>
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
                    {/* <div className="col-7 mt-2">
                      <Skeleton width={100} height={12} />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "start",
                          alignItems: "center", // 👈 vertical centering
                          // height: "100%", // 👈 make sure parent has height
                          paddingLeft: "10px",
                        }}
                      >
                        <Skeleton width={45} height={45} className="" />
                      </div>
                    </div> */}
                  </div>
                </SkeletonTheme>
              </>
            ) : (
              <DashBox
                title="Total Payout Pending"
                dashSVG={
                  <img
                    src={totalPayoutPending.src}
                    width={54}
                    height={54}
                    className="img-class"
                  />
                }
                amount={dashboardData?.totalPayoutPending}
                // onClick={() =>
                //   router.push({
                //     pathname: "/Agency",
                //   })
                // }
              />
            )}
          </div>

          <div className="col-lg-4 col-xl-3 col-md-6 col-sm-6 col-12 mt-3 p-0">
            {loader ? (
              <>
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
                    {/* <div className="col-7 mt-2">
                      <Skeleton width={100} height={12} />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "start",
                          alignItems: "center", // 👈 vertical centering
                          // height: "100%", // 👈 make sure parent has height
                          paddingLeft: "10px",
                        }}
                      >
                        <Skeleton width={45} height={45} className="" />
                      </div>
                    </div> */}
                  </div>
                </SkeletonTheme>
              </>
            ) : (
              <DashBox
                title="Total Payout Completed"
                dashSVG={
                  <img
                    src={totalPayoutCompleted.src}
                    width={56}
                    height={56}
                    className="img-class"
                  />
                }
                amount={dashboardData?.totalPayoutCompleted}
                // onClick={() =>
                //   router.push({
                //     pathname: "/ProviderWithdrawal",
                //   })
                // }
              />
            )}
          </div>

          <div className="col-lg-4 col-xl-3 col-md-6 col-sm-6 col-12 mt-3 p-0">
            {loader ? (
              <>
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
                    {/* <div className="col-7 mt-2">
                      <Skeleton width={100} height={12} />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "start",
                          alignItems: "center", // 👈 vertical centering
                          // height: "100%", // 👈 make sure parent has height
                          paddingLeft: "10px",
                        }}
                      >
                        <Skeleton width={45} height={45} className="" />
                      </div>
                    </div> */}
                  </div>
                </SkeletonTheme>
              </>
            ) : (
              <DashBox
                title="Total Agency Earnings"
                dashSVG={
                  <img
                    src={totalAgencyEarning.src}
                    width={56}
                    height={56}
                    className="img-class"
                  />
                }
                amount={dashboardData?.totalAgencyEarnings}
                onClick={() =>
                  router.push({
                    pathname: "/AgencyEarningHistory",
                  })
                }
              />
            )}
          </div>

          <div className="col-lg-4 col-xl-3 col-md-6 col-sm-6 col-12 mt-3 p-0">
            {loader ? (
              <>
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
                    {/* <div className="col-7 mt-2">
                      <Skeleton width={100} height={12} />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "start",
                          alignItems: "center", // 👈 vertical centering
                          // height: "100%", // 👈 make sure parent has height
                          paddingLeft: "10px",
                        }}
                      >
                        <Skeleton width={45} height={45} className="" />
                      </div>
                    </div> */}
                  </div>
                </SkeletonTheme>
              </>
            ) : (
              <DashBox
                title="Total Agency Under Host Ear."
                dashSVG={
                  <img
                    src={totalAgencyUnderHost.src}
                    width={56}
                    height={56}
                    className="img-class"
                  />
                }
                amount={dashboardData?.totalAgencyUnderHostsEarning}
                onClick={() =>
                  router.push({
                    pathname: "/Host",
                  })
                }
              />
            )}
          </div>
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
        {loader ? (
          <>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Skeleton height={20} width={350} />
            </div>
            <div style={{ padding: "20px" }}>
              <ListItem loading={loader}>List Item 1</ListItem>
              <ListItem loading={loader}>List Item 2</ListItem>
              <ListItem loading={loader}>List Item 3</ListItem>
              <ListItem loading={loader}>List Item 3</ListItem>
              <ListItem loading={loader}>List Item 3</ListItem>
              <ListItem loading={loader}>List Item 3</ListItem>
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
          fontSize  : "26px",
          fontWeight : 400
        }}
      >
        All Data Analysis
      </h4>

      <div className="my-2 user1_width mt-2">
        {userTypes.map((item, index) => (
          <button
            key={index}
            type="button"
            className={`${type === item.value ? "activeBtn" : "disabledBtn"} ${
              index !== 0 ? "ms-1" : ""
            }`}
            onClick={() => setType(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {type === "Recent Host" && (
        <GetNewHost startDate={startDate} endDate={endDate} />
      )}

      {type === "top_perfoming_host" && (
        <TopPerformingHost startDate={startDate} endDate={endDate} />
      )}
    </div>
  );
};
Dashboard.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default Dashboard;

const DashBox = ({ dashIcon, dashSVG, title, amount, onClick }: any) => {
  return (
    <div className="dashBox d-flex cursor" onClick={onClick}>
      <div className="dashIconBox midBox col-xl-4 col-md-5 col-6">
        <div className="dashIcon midBox">
          {dashIcon ? <i className={`${dashIcon}`}></i> : dashSVG}
        </div>
      </div>
      <Divider
        orientation="vertical"
        flexItem
        style={{
          width: "1px", // thickness of divider
          height: "80px", // height of the divider
          backgroundColor: "#a7a7a7", // color of the divider
          marginTop: "20px",
          marginLeft: "15px",
        }}
      />
      <div className="boxContent text-center col-xl-8 col-md-7 col-6">
        <div className="boxTitle midBox">
          <p className="text-decoration-underline">{title}</p>
        </div>
        <div className="boxAmount midBox mt-2" >
          <p style={{ fontSize: "22px", fontWeight: "400" }}> {formatCoins(amount)}</p>
        </div>
      </div>
    </div>
  );
};

const ApexChart = ({ startDate, endDate }: any) => {
  const [chart, setChart] = useState<any>();
  const dispatch = useAppDispatch();
  const ChartChart = dynamic(() => import("react-apexcharts"), { ssr: false });
  const { chartData, agencyEarningData, hostEarningData } = useSelector(
    (state: RootStore) => state.dashboard
  );

  let label: any = [];
  let dataAmount: any = [];
  let dataCount: any = [];

  const allDatesSet = new Set([
    ...agencyEarningData.map((item: any) => item._id),
    ...hostEarningData.map((item: any) => item._id),
  ]);

  label = Array.from(allDatesSet).sort(); // your x-axis categories

  // Step 2: Map user and host data to the label list
  dataAmount = label.map((date: any) => {
    const found: any = agencyEarningData.find((item: any) => item._id === date);
    return found ? formatCoins(found.totalAgencyEarnings) : 0;
  });

  dataCount = label.map((date: any) => {
    const found: any = hostEarningData.find((item: any) => item._id === date);
    return found ? formatCoins(found.totalHostEarnings) : 0;
  });

  const totalSeries = {
    dataSet: [
      {
        name: "Total Agency Earning",
        data: dataAmount,
      },
      {
        name: "Total Host Earning",
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
      text: "Earning Data",
      style: {
        color: "#1C2B20",
        marginTop: "50px",
      },
      align: "center",
      offsetX: 20,
      cssClass: "mt-5",
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      offsetY: -10,
      offsetX: -100,
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
