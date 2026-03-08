import RootLayout from "@/component/layout/Layout";
import { useDispatch, useSelector } from "react-redux";
import { RootStore } from "@/store/store";
import Table from "@/extra/Table";
import Pagination from "@/extra/Pagination";
import { useEffect, useState } from "react";
import Analytics from "@/extra/Analytic";
import { getCoinPlanPurchaseHistory } from "@/store/userSlice";
import Image from "next/image";
import { baseURL } from "@/utils/config";
import male from "@/assets/images/male.png"
import { getDefaultCurrency } from "@/store/settingSlice";
import { useRouter } from "next/router";
import historyInfo from "@/assets/images/History.png"
import { formatCoins } from "@/utils/Common";


const PurchaseCoinPlanHistory = () => {
    const dispatch = useDispatch();
    const { dialogue, dialogueType } = useSelector(
        (state: RootStore) => state.dialogue
    );
    const userData = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("purchaseCoinPlanHistoryData") || "null") : null;
    const { defaultCurrency } = useSelector((state: RootStore) => state.setting)
    const { userCoinPlanPurchaseHistory, totalCoinPlanPurchase } = useSelector((state: RootStore) => state.user)
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [page, setPage] = useState<number>(1);
    const [startDate, setStartDate] = useState("All");
    const [endDate, setEndDate] = useState("All");
    const router = useRouter();


    useEffect(() => {
        dispatch(getDefaultCurrency())
    }, [dispatch])

    useEffect(() => {
        const payload = {
            start: page,
            limit: rowsPerPage,
            id: userData?._id,
            startDate,
            endDate
        }
        dispatch(getCoinPlanPurchaseHistory(payload))
    }, [dispatch, page, rowsPerPage, startDate, endDate])

    const handleChangePage = (event: any, newPage: any) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: any) => {
        setRowsPerPage(parseInt(event, 10));
        setPage(1);
    };


    const handleRedirect = (row: any) => {
        router.push({
            pathname: "/history/PurchaseCoinPlanPage",
            query: { id: row?._id },
        });

        typeof window !== "undefined" && localStorage.setItem("userData", JSON.stringify(row))

    }

    const coinPlanTable = [
        {
            Header: "No",
            Cell: ({ index }: { index: any }) => (
                <span> {(page - 1) * rowsPerPage + parseInt(index) + 1}</span>
            ),
        },

      

        {
            Header: "UniqueId",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize">{row?.uniqueId}</span>
            ),
        },

        {
            Header: "Payment Gateway",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize">{row?.paymentGateway || "-"}</span>
            ),
        },

        {
            Header: `Price (${defaultCurrency?.symbol})`,
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize">{formatCoins(row?.price)}</span>
            ),
        },

       

        {
            Header: "coin",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize">{formatCoins(row?.coin)}</span>
            ),
        },

        {
            Header: "Bonus Coin",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize">{formatCoins(row?.bonusCoins)}</span>
            ),
        },

        



    ];

    return (
        <>
            <div className="row d-flex align-items-center pt-3">
                <div className="col-12 col-lg-6 col-md-6 col-sm-12 fs-20 fw-600"
                    style={{ color: "#404040" }}
                >
                    Purchase  Coin Plan  History
                </div>
            </div>

            <div className="mt-2">
                <Table
                    data={userData?.coinPlanPurchase}
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
                    totalData={totalCoinPlanPurchase}
                />
            </div>
        </>
    )
}

PurchaseCoinPlanHistory.getLayout = function getLayout(page: React.ReactNode) {
    return <RootLayout>{page}</RootLayout>;
};
export default PurchaseCoinPlanHistory;