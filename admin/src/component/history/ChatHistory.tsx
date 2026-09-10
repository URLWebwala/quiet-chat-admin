import RootLayout from "@/component/layout/Layout";
import { useDispatch, useSelector } from "react-redux";
import { RootStore } from "@/store/store";
import Table from "@/extra/Table";
import Pagination from "@/extra/Pagination";
import { useEffect, useState } from "react";
import Analytics from "@/extra/Analytic";
import { getHostChatHistory } from "@/store/hostSlice";
import { getUserChatHistory } from "@/store/userSlice";
import CoinPlanTable from "../Shimmer/CoinPlanTable";
import { formatCoins } from "@/utils/Common";
import { useRouter } from "next/router";

const ChatHistory = (props: any) => {
  const { queryType } = props;
  const dispatch = useDispatch();
  const router = useRouter();

  const userData = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("userData") || "null") : null;
  const hostData = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("hostData") || "null") : null;

  const { hostChatHistory, totalHostChatHistory, totalChatCount, totalHostChatEarning } = useSelector((state: RootStore) => state.host);
  const { userChatHistory, totalUserChatHistory, totalUserChatCount, totalUserChatSpent } = useSelector((state: RootStore) => state.user);

  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [startDate, setStartDate] = useState("All");
  const [endDate, setEndDate] = useState("All");

  useEffect(() => {
    const targetId = (router.query.id as string) || (queryType === "host" ? hostData?._id : userData?._id);
    if (!targetId) return;

    const payload = {
      start: page,
      limit: rowsPerPage,
      id: targetId,
      startDate,
      endDate,
    };

    if (queryType === "host") {
      dispatch(getHostChatHistory(payload));
    } else {
      dispatch(getUserChatHistory(payload));
    }
  }, [dispatch, page, rowsPerPage, startDate, endDate, queryType, router.query.id]);

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event, 10));
    setPage(1);
  };

  const chatTable = [
    {
      Header: "No",
      Cell: ({ index }: { index: any }) => <span>{(page - 1) * rowsPerPage + parseInt(index) + 1}</span>,
    },
    {
      Header: "UniqueId",
      Cell: ({ row }: { row: any }) => <span className="text-capitalize">{row?.uniqueId || "-"}</span>,
    },
    {
      Header: queryType === "host" ? "Sender Name" : "Receiver Name",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">
          {queryType === "host" ? row?.senderName || "-" : row?.receiverName || "-"}
        </span>
      ),
    },
    {
      Header: "Description",
      Cell: ({ row }: { row: any }) => <span className="text-capitalize">{row?.typeDescription || "Chat with Host"}</span>,
    },
    {
      Header: "User Coin",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize" style={{ color: "#FF3737", fontWeight: 500 }}>
          -{formatCoins(row?.userCoin)}
        </span>
      ),
    },
    {
      Header: "Host Coin",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize" style={{ color: "#0EBA1A", fontWeight: 500 }}>
          +{formatCoins(row?.hostCoin)}
        </span>
      ),
    },
    {
      Header: "Admin Coin",
      Cell: ({ row }: { row: any }) => <span className="text-capitalize">{formatCoins(row?.adminCoin)}</span>,
    },
    {
      Header: "Agency Coin",
      Cell: ({ row }: { row: any }) => <span className="text-capitalize">{formatCoins(row?.agencyCoin)}</span>,
    },
    {
      Header: "Date",
      Cell: ({ row }: { row: any }) => <span className="text-capitalize">{row?.createdAt?.split("T")[0]}</span>,
    },
  ];

  return (
    <>
      <div className="row d-flex align-items-center pt-3">
        <div className="col-12 col-lg-8 col-md-8 col-sm-12 fs-20 fw-600 d-flex gap-4" style={{ color: "#404040" }}>
          <div>
            Total Chats: <span style={{ color: "#404040" }}>{queryType === "host" ? totalChatCount : totalUserChatCount}</span>
          </div>
          <div>
            {queryType === "host" ? "Chat Earning:" : "Chat Spent:"}{" "}
            <span style={{ color: queryType === "host" ? "#0EBA1A" : "#FF3737" }}>
              {formatCoins(queryType === "host" ? totalHostChatEarning : totalUserChatSpent)}
            </span>
          </div>
        </div>
        <div className="col-md-4 col-4 mb-0 d-flex justify-content-end">
          <Analytics
            analyticsStartDate={startDate}
            analyticsStartEnd={endDate}
            analyticsStartDateSet={setStartDate}
            analyticsStartEndSet={setEndDate}
            direction={"end"}
          />
        </div>
      </div>

      <div className="mt-2">
        <div style={{ marginBottom: "32px" }}>
          <Table
            data={queryType === "host" ? hostChatHistory : userChatHistory}
            mapData={chatTable}
            PerPage={rowsPerPage}
            Page={page}
            type={"server"}
            shimmer={<CoinPlanTable />}
          />
        </div>
        <Pagination
          type={"server"}
          serverPage={page}
          setServerPage={setPage}
          serverPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          totalData={queryType === "host" ? totalHostChatHistory : totalUserChatHistory}
        />
      </div>
    </>
  );
};

ChatHistory.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};
export default ChatHistory;
