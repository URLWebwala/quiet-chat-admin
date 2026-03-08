import RootLayout from "@/component/layout/Layout";
import { useDispatch, useSelector } from "react-redux";
import { RootStore } from "@/store/store";
import Table from "@/extra/Table";
import Pagination from "@/extra/Pagination";
import { useEffect, useState } from "react";
import Analytics from "@/extra/Analytic";
import { getGiftHistory } from "@/store/userSlice";
import { getHostGiftHistory } from "@/store/hostSlice";
import CoinPlanTable from "../Shimmer/CoinPlanTable";
import { formatCoins } from "@/utils/Common";


const GiftHistory = (props: any) => {
    const { queryType } = props;
    const dispatch = useDispatch();
    const { dialogue, dialogueType } = useSelector(
        (state: RootStore) => state.dialogue
    );
    const userData = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("userData") || "null") : null;
    const hostData = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("hostData") || "null") : null;

    const { userGiftHistory, totalUserGiftHistory } = useSelector((state: RootStore) => state.user)
    const { hostGiftHistory, total } = useSelector((state: RootStore) => state.host)

    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [page, setPage] = useState<number>(1);
    const [startDate, setStartDate] = useState("All");
    const [endDate, setEndDate] = useState("All");



    useEffect(() => {
        const payload = {
            start: page,
            limit: rowsPerPage,
            id: queryType === "host" ? hostData?._id : userData?._id,
            startDate,
            endDate
        }

        if (queryType === "host") {
            dispatch(getHostGiftHistory(payload))
        } else if (queryType !== "host") {
            dispatch(getGiftHistory(payload))
        }
    }, [dispatch, page, rowsPerPage, startDate, endDate , queryType ])

    const handleChangePage = (event: any, newPage: any) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: any) => {
        setRowsPerPage(parseInt(event, 10));
        setPage(1);
    };


    const giftTable = [
        {
            Header: "No",
            Cell: ({ index }: { index: any }) => (
                <span> {(page - 1) * rowsPerPage + parseInt(index) + 1}</span>
            ),
        },

        {
            Header: "UniqueId",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize">{row?.uniqueId || "-"}</span>
            ),
        },

        {
            Header: `${queryType === "host" ? "Sender Name" : "Receiver Name"} `,
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize cursorPointer">
                    {queryType === "host" ? row?.senderName || "-" : row?.receiverName || "-"}
                </span>
            ),
        },

        {
            Header: "Description",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize">{row?.typeDescription || "-"}</span>
            ),
        },


        queryType === "host"
            ? {
                Header: "User Coin",
                Cell: ({ row }: { row: any }) => (
                    <span
                        className="text-capitalize fw-normal"
                        style={{ color: "red" }}
                    >
                        {`  - ${formatCoins(row?.userCoin)}` || 0}
                    </span>
                ),
            }
            : {
                Header: "User Coin",
                Cell: ({ row }: { row: any }) => (
                    <span
                        className="text-capitalize fw-normal"
                        style={{ color: row?.isIncome ? "green" : "red" }}
                    >
                        {`${row?.isIncome ? "+" : "-"}  ${formatCoins(row?.userCoin)}` || 0}
                    </span>
                ),
            },
            queryType === "host" ?
            {
                Header: "Host Coin",
                Cell: ({ row }: { row: any }) => {
                  const hostCoin = row?.hostCoin ?? 0;
                  const isPositive = hostCoin > 0;
                  return (
                    <span
                      className="text-capitalize"
                      style={{
                        color: isPositive ? "green" : "inherit",
                      }}
                    >
                      {isPositive ? `+${formatCoins(hostCoin)}` : formatCoins(hostCoin)}
                    </span>
                  );
                },
              }:
    
              {
                Header: "Host Coin",
                Cell: ({ row }: { row: any }) => {
                  const hostCoin = row?.hostCoin ?? 0;
                  const isPositive = hostCoin > 0;
                  return (
                    <span
                      className="text-capitalize"
                      style={{
                        color: isPositive ? "green" : "inherit",
                      }}
                    >
                      {isPositive ? `+${formatCoins(hostCoin)}` : formatCoins(hostCoin)}
                    </span>
                  );
                },
              },


        {
            Header: "Admin Coin",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize">{formatCoins(row?.adminCoin)}</span>
            ),
        },

        {
            Header: "Agency Coin",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize">{formatCoins(row?.agencyCoin)}</span>
            ),
        },

        {
            Header: "Date",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize">{row?.createdAt?.split("T")[0]}</span>
            ),
        },



    ];

    return (
        <>
            <div className="row d-flex align-items-center pt-3">
                <div className="col-12 col-lg-6 col-md-6 col-sm-12 fs-20 fw-600"
                    style={{ color: "#404040" }}
                >
                </div>

                <div className="col-md-6 col-6 mb-0 d-flex justify-content-end">

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
                <div style={{marginBottom: "32px"}}>
                <Table
                    data={queryType === "host" ? hostGiftHistory : userGiftHistory}
                    mapData={giftTable}
                    PerPage={rowsPerPage}
                    Page={page}
                    type={"server"}
            shimmer = {<CoinPlanTable />}

                />
                </div>
                <Pagination
                    type={"server"}
                    serverPage={page}
                    setServerPage={setPage}
                    serverPerPage={rowsPerPage}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    totalData={queryType === "host" ? total : totalUserGiftHistory}
                />
            </div>
        </>
    )
}

GiftHistory.getLayout = function getLayout(page: React.ReactNode) {
    return <RootLayout>{page}</RootLayout>;
};
export default GiftHistory;