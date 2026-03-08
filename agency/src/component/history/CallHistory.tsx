import RootLayout from "@/component/layout/Layout";
import { useDispatch, useSelector } from "react-redux";
import { RootStore } from "@/store/store";
import Table from "@/extra/Table";
import Pagination from "@/extra/Pagination";
import { useEffect, useState } from "react";
import Analytics from "@/extra/Analytic";
// import { getCallHistory } from "@/store/userSlice";
import { getHostCallHistory } from "@/store/hostSlice";
import CoinPlan from "../shimmer/CoinPlan";
import { formatCoins } from "@/utils/Common";

const CallHistory = (props: any) => {
  const { queryType } = props;
  const dispatch = useDispatch();
  const hostData =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("hostData") || "null")
      : null;
  const { hostCallHistory, totalCallHistory , totalDuration }: any = useSelector(
    (state: RootStore) => state.host
  );

  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [startDate, setStartDate] = useState("All");
  const [endDate, setEndDate] = useState("All");

  useEffect(() => {
    const payload = {
      start: page,
      limit: rowsPerPage,
      hostId: hostData?._id,
      startDate,
      endDate,
    };
    dispatch(getHostCallHistory(payload));
  }, [dispatch, page, rowsPerPage, startDate, endDate]);

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event, 10));
    setPage(1);
  };

  const callHistoryTable = [
    {
      Header: "No",
      Cell: ({ index }: { index: any }) => (
        <span> {(page - 1) * rowsPerPage + parseInt(index) + 1}</span>
      ),
    },

    {
      Header: "UniqueId",
      Cell: ({ row }: { row: any }) => (
        <div style={{ width: "120px" }}>
          <span className="text-capitalize">{row?.uniqueId || "-"}</span>
        </div>
      ),
    },

    {
      Header: `Sender Name`,
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize cursorPointer">
          {row?.senderName || "-"}
        </span>
      ),
    },

    {
      Header: "Description",
      Cell: ({ row }: { row: any }) => (
        <div style={{ width: "200px" }}>
          <span className="text-capitalize text-normal">
            {row?.typeDescription || "-"}
          </span>
        </div>
      ),
    },

    queryType === "host"
      ? {
          Header: "User Coin",
          Cell: ({ row }: { row: any }) => (
            <div style={{ width: "70px" }}>
              <span
                className="text-capitalize text-normal"
                style={{ color: "red" }}
              >
                {`  - ${formatCoins(row?.userCoin)}` || 0}
              </span>
            </div>
          ),
        }
      : {
          Header: "User Coin",
          Cell: ({ row }: { row: any }) => (
            <div style={{ width: "70px" }}>
              <span
                className="text-capitalize text-normal"
                style={{ color: row?.isIncome ? "green" : "red" }}
              >
                {`${row?.isIncome ? "+" : "-"}  ${formatCoins(row?.userCoin)}` ||
                  0}
              </span>
            </div>
          ),
        },
    queryType === "host"
      ? {
          Header: "Host Coin",
          Cell: ({ row }: { row: any }) => (
            <span
              className="text-capitalize text-normal"
              style={{
                color: "green",
              }}
            >
              {`+${formatCoins(row?.hostCoin)}` || 0}
            </span>
          ),
        }
      : {
          Header: "Host Coin",
          Cell: ({ row }: { row: any }) => (
            <span
              className="text-capitalize text-normal"
              style={{
                color: "green",
              }}
            >
              {`+${formatCoins(row?.hostCoin)}` || 0}
            </span>
          ),
        },

    {
      Header: "Admin Coin",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">
          {formatCoins(row?.adminCoin)}
        </span>
      ),
    },

    {
      Header: "Call Type",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">{row?.callType || "-"}</span>
      ),
    },

    {
      Header: "Is Random",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">{row?.isRandom ? "Yes" : "No"}</span>
      ),
    },

    {
      Header: "Is Private",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">{row?.isPrivate ? "Yes" : "No"}</span>
      ),
    },

    {
      Header: "Call Start Time",
      Cell: ({ row }: { row: any }) => {
        const rawDate = row?.callStartTime;
        let formattedDate = "-";

        if (rawDate) {
          const date = new Date(rawDate);
          const optionsDate: Intl.DateTimeFormatOptions = {
            month: "long",
            day: "numeric",
            year: "numeric",
          };
          const optionsTime: Intl.DateTimeFormatOptions = {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          };

          const datePart = date.toLocaleDateString("en-US", optionsDate); // e.g., May 13, 2025
          const timePart = date.toLocaleTimeString("en-US", optionsTime); // e.g., 1:25:49 PM

          formattedDate = `${datePart}, ${timePart}`;
        }

        return (
          <span className="text-capitalize text-nowrap">{formattedDate}</span>
        );
      },
    },

    {
      Header: "Call End Time",
      Cell: ({ row }: { row: any }) => {
        const rawDate = row?.callEndTime;
        let formattedDate = "-";

        if (rawDate) {
          const date = new Date(rawDate);
          const optionsDate: Intl.DateTimeFormatOptions = {
            month: "long",
            day: "numeric",
            year: "numeric",
          };
          const optionsTime: Intl.DateTimeFormatOptions = {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          };

          const datePart = date.toLocaleDateString("en-US", optionsDate); // e.g., May 13, 2025
          const timePart = date.toLocaleTimeString("en-US", optionsTime); // e.g., 1:25:49 PM

          formattedDate = `${datePart}, ${timePart}`;
        }

        return (
          <span className="text-capitalize text-nowrap">{formattedDate}</span>
        );
      },
    },

    {
      Header: "Duration",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">{row?.duration || "-"}</span>
      ),
    },

    {
      Header: "Date",
      Cell: ({ row }: { row: any }) => (
        <div style={{ width: "100px" }}>
          <span className="text-capitalize">
            {row?.createdAt?.split("T")[0] || "-"}
          </span>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="row d-flex align-items-center pt-3">
        <div
          className="col-12 col-lg-6 col-md-6 col-sm-12 fs-20 fw-600"
          style={{ color: "#404040" }}
        ></div>

        <div className="mb-0 d-flex justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <span className="fs-16 fw-600" style={{ color: "#404040" }}>
              Total Duration:
            </span>
            <span className="fs-16 fw-600" style={{ color: "#404040" }}>
              {totalDuration}
            </span>
          </div>
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
        <Table
          data={hostCallHistory}
          mapData={callHistoryTable}
          PerPage={rowsPerPage}
          Page={page}
          type={"server"}
          shimmer={<CoinPlan />}
        />
        <Pagination
          type={"server"}
          serverPage={page}
          setServerPage={setPage}
          serverPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          totalData={totalCallHistory}
        />
      </div>
    </>
  );
};

CallHistory.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};
export default CallHistory;
