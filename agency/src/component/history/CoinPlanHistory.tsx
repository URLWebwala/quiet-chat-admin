import RootLayout from "@/component/layout/Layout";
import { useDispatch, useSelector } from "react-redux";
import { RootStore } from "@/store/store";
import Table from "@/extra/Table";
import Pagination from "@/extra/Pagination";
import { useEffect, useState } from "react";
import Analytics from "@/extra/Analytic";
import { getCoinPlanHistory } from "@/store/hostSlice";
import CoinPlan from "../shimmer/CoinPlan";
import { formatCoins } from "@/utils/Common";


const CoinPlanUserHistory = () => {
    const dispatch = useDispatch();
    const { dialogue, dialogueType } = useSelector(
        (state: RootStore) => state.dialogue
    );
    const hostData = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("hostData") || "null") : null;

    const { hostCoinHistory, totalHostCoinPlanHistory, totalHostEarning } = useSelector((state: RootStore) => state.host)
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
            endDate
        }
        dispatch(getCoinPlanHistory(payload))

    }, [dispatch, page, rowsPerPage, startDate, endDate])

    const handleChangePage = (event: any, newPage: any) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: any) => {
        setRowsPerPage(parseInt(event, 10));
        setPage(1);
    };


    const coinPlanTable = [
        {
            Header: "No",
            Cell: ({ index }: { index: any }) => (
                <span> {(page - 1) * rowsPerPage + parseInt(index) + 1}</span>
            ),
        },

        {
            Header: "Unique Id",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize">{row?.uniqueId || "-"}</span>
            ),
        },

        {
            Header: "Sender name",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize">{row?.senderName || "-"}</span>
            ),
        },

        {
            Header: "Description",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize">{row?.typeDescription || "-"}</span>
            ),
        },


        {
            Header: "User Coin",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize">{formatCoins(row?.userCoin)}</span>
            ),
        },

        {
            Header: "Host Coin",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize">{formatCoins(row?.hostCoin)}</span>
            ),
        },

        {
            Header: "Admin Coin",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize">{formatCoins(row?.adminCoin)}</span>
            ),
        },

         {
            Header: "Date",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize">{row?.createdAt?.split("T")[0] || 0}</span>
            ),
        },


    ];

    return (
        <>
            <div className="row d-flex align-items-center mt-3">
                <div className="col-12 col-lg-6 col-md-6 col-sm-12 fw-600 texthistory"
                    style={{ color: "#404040" }}
                >
                    <div style={{ fontWeight: 500, fontSize: "18px" }}>
                        Total Earning:{" "}
                        <span style={{ color: "#0EBA1A" }}>
                            {formatCoins(totalHostEarning)}
                        </span>
                    </div>
                </div>

                <div className="col-md-6 col-12  mb-0 d-flex justify-content-end">

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
                    data={hostCoinHistory}
                    mapData={coinPlanTable}
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
                    totalData={totalHostCoinPlanHistory}
                />
            </div>
        </>
    )
}

CoinPlanUserHistory.getLayout = function getLayout(page: React.ReactNode) {
    return <RootLayout>{page}</RootLayout>;
};
export default CoinPlanUserHistory;