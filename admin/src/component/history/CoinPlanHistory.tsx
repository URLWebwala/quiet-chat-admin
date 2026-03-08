import RootLayout from "@/component/layout/Layout";
import { useDispatch, useSelector } from "react-redux";
import { RootStore } from "@/store/store";
import Table from "@/extra/Table";
import Pagination from "@/extra/Pagination";
import { useEffect, useState } from "react";
import Analytics from "@/extra/Analytic";
import {  getCoinPlanUserHistory } from "@/store/coinPlanSlice";
import { formatCoins } from "@/utils/Common";


const CoinPlanUserHistory = () => {
    const dispatch = useDispatch();
    const { dialogue, dialogueType } = useSelector(
        (state: RootStore) => state.dialogue
    );
    const userData = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("userData") || "null") : null;

    const { coinPlanHistory, total } = useSelector((state: RootStore) => state.coinPlan)
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [page, setPage] = useState<number>(1);
    const [startDate, setStartDate] = useState("All");
    const [endDate, setEndDate] = useState("All");


    useEffect(() => {
        const payload = {
            start: page,
            limit: rowsPerPage,
            userId: userData?._id,
            startDate,
            endDate
        }
        dispatch(getCoinPlanUserHistory(payload))

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
            Header: "Coin",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize fw-bold">{formatCoins(row?.coins)}</span>
            ),
        },

        {
            Header: "Bonus Coin",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize fw-bold">{formatCoins(row?.bonusCoins)}</span>
            ),
        },

        {
            Header: "Price",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize fw-bold">{formatCoins(row?.price)}</span>
            ),
        },

        {
            Header: "Product Id",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize fw-bold">{row?.productId || "-"}</span>
            ),
        },


    ];

    return (
        <>
            <div className="row d-flex align-items-center">
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
                <Table
                    data={coinPlanHistory}
                    mapData={coinPlanTable}
                    PerPage={rowsPerPage}
                    Page={page}
                    type={"server"}
                />
                <Pagination
                    type={"server"}
                    serverPage={page}
                    setServerPage={setPage}
                    serverPerPage={rowsPerPage}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    totalData={total}
                />
            </div>
        </>
    )
}

CoinPlanUserHistory.getLayout = function getLayout(page: React.ReactNode) {
    return <RootLayout>{page}</RootLayout>;
};
export default CoinPlanUserHistory;