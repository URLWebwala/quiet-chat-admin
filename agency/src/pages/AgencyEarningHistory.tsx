import RootLayout from "@/component/layout/Layout";
import Analytics from "@/extra/Analytic";
import Pagination from "@/extra/Pagination";
import Table from "@/extra/Table";
import { getAgencyEarningHistory } from "@/store/agencySlice";
import { RootStore } from "@/store/store";
import { baseURL } from "@/utils/config";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import male from "@/assets/images/male.png";
import AgencyEarningHistoryShimmer from "@/component/shimmer/AgencyEarningHistoryShimmer ";
import coin from "@/assets/images/coin.png";
import { ExInput } from "@/extra/Input";
import { getSetting } from "@/store/settingSlice";
import { formatCoins } from "@/utils/Common";

const AgencyEarningHistory = () => {
  const dispatch = useDispatch();
  const {
    totalAgencyEarningHistory,
    agencyEarningHistory,
    totalAgencyEarning,
  } = useSelector((state: RootStore) => state.agency);
  const { admin } = useSelector((state: RootStore) => state.admin);
  const { setting } = useSelector((state: RootStore) => state.setting);
  console.log("setting", setting);



  const [startDate, setStartDate] = useState("All");
  const [endDate, setEndDate] = useState("All");
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    const payload = {
      start: page,
      limit: rowsPerPage,
      startDate,
      endDate,
    };
    dispatch(getAgencyEarningHistory(payload));
  }, [dispatch, page, rowsPerPage, startDate, endDate]);

  useEffect(() => {
    dispatch(getSetting());
  }, []);

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event, 10));
    setPage(1);
  };

  const agencyEarningHistoryTable = [
    {
      Header: "No",
      Cell: ({ index }: { index: number }) => (
        <span>{(page - 1) * rowsPerPage + index + 1}</span>
      ),
    },

    {
      Header: "UniqueId",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize cursor text-nowrap">
          {row?.uniqueId}
        </span>
      ),
    },

    {
      Header: "Sender Name",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">{row?.senderName}</span>
      ),
    },

    {
      Header: "Receiver Name",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">{row?.receiverName}</span>
      ),
    },

    {
      Header: "Description",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize text-nowrap">
          {row?.typeDescription}
        </span>
      ),
    },

    {
      Header: "User Coin",
      Cell: ({ row }: { row: any }) => <span>{formatCoins(row?.userCoin)}</span>,
    },

    {
      Header: "Host Coin",
      Cell: ({ row }: { row: any }) => <span>{formatCoins(row?.hostCoin)}</span>,
    },

    {
      Header: "Admin Coin",
      Cell: ({ row }: { row: any }) => <span>{formatCoins(row?.adminCoin)}</span>,
    },

    {
      Header: "Agency Coin",
      Cell: ({ row }: { row: any }) => <span>{formatCoins(row?.agencyCoin)}</span>,
    },

    {
      Header: "Date",
      body: "date",
      Cell: ({ row }: { row: any }) => (
        <span className="text-nowrap">
          {row?.createdAt?.split("T")[0] || "-"}
        </span>
      ),
    },
  ];

  return (
    <>
      <div>
        <div className="d-flex justify-content-between align-items-center mt-3 mt-md-4">
          <div>
            <Analytics
              analyticsStartDate={startDate}
              analyticsStartEnd={endDate}
              analyticsStartDateSet={setStartDate}
              analyticsStartEndSet={setEndDate}
              direction="start"
            />
          </div>

          <div
            className="d-flex"
            style={{ color: "#838080", fontSize: "20px" }}
          >
            <span style={{ marginRight: "5px" }}>
              <img
                src={coin.src} // or import coin from '@/assets/coin.png' and use coin.src
                alt="coin"
                style={{
                  width: 25,
                  height: 25,
                  verticalAlign: "middle",
                }}
              />
            </span>
            Total Agency Earning :{" "}
            <span style={{ color: "#626262" }}>
              {formatCoins(totalAgencyEarning)}
            </span>
          </div>
        </div>

        {/* <div
          className="row"
          style={{
            margin: "20px 1px 1px",
            border: "1px solid #e3e3e3",
            borderRadius: "5px",
            boxShadow: "1px 1px 5px rgb(0,0,0,0.1)",
          }}
        >
         
          <div className="col-6" style={{ backgroundColor: "transparent" }}>
            <ExInput
              id={`totalWithdraw`}
              name={`totalWithdraw`}
              value={admin?.totalWithdrawn}
               label={
                <span style={{ fontSize: "15px" }}>
                  Total Withdraw {" "}
                  <img
                    src={coin.src} 
                    alt="coin"
                    style={{
                      width: 20,
                      height: 20,
                      verticalAlign: "middle",
                    }}
                  />
                </span>
              }
              placeholder={`Total Withdraw`}
              readOnly
            />
          </div>
          <div className="col-6">
            <ExInput
              id={`totalWithdrawamount`}
              name={`totalWithdrawamount`}
              value={admin?.totalWithdrawnAmount || 0}
              label={
                <span
                  style={{ fontSize: "15px" }}
                >{`Total Withdraw Amount (${setting?.currency?.currencyCode})`}</span>
              }
              placeholder={`Total Withdraw Amount`}
              readOnly
            />
          </div>
        </div> */}
        <div className="mt-2">
          <Table
            data={agencyEarningHistory}
            mapData={agencyEarningHistoryTable}
            PerPage={rowsPerPage}
            Page={page}
            type={"server"}
            shimmer={<AgencyEarningHistoryShimmer />}
          />
        </div>
        <Pagination
          type={"server"}
          serverPage={page}
          setServerPage={setPage}
          serverPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          totalData={totalAgencyEarningHistory}
        />
      </div>
    </>
  );
};

AgencyEarningHistory.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};
export default AgencyEarningHistory;
