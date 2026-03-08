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
import historyInfo from "@/assets/images/history1.png"
import CoinPlanTable from "../Shimmer/CoinPlanTable";


const CoinPlanPurchaseHistory = () => {
    const dispatch = useDispatch();
    const { dialogue, dialogueType } = useSelector(
        (state: RootStore) => state.dialogue
    );
    const userData = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("userData") || "null") : null;
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
            pathname: "/PurchaseCoinPlanHistory",
            query: { id: row?._id },
        });

        typeof window !== "undefined" && localStorage.setItem("purchaseCoinPlanHistoryData", JSON.stringify(row))

    }

    const coinPlanTable = [
        {
            Header: "No",
            Cell: ({ index }: { index: any }) => (
                <span> {(page - 1) * rowsPerPage + parseInt(index) + 1}</span>
            ),
        },


        {
            Header: "User",
            body: "user",
            Cell: ({ row }: { row: any }) => {
                const rawImagePath = row?.image || "";
                const normalizedImagePath = rawImagePath.replace(/\\/g, "/");

                const imageUrl = normalizedImagePath.includes("storage")
                    ? baseURL + normalizedImagePath
                    : normalizedImagePath;

                return (
                    <div style={{ cursor: "pointer" }}>
                        <div className="d-flex justify-content-center px-2 py-1">
                            <div>
                                <img
                                    src={row?.image ? imageUrl : male.src}
                                    alt="Image"
                                    loading="eager"
                                    draggable="false"
                                    style={{
                                        borderRadius: "10px",
                                        objectFit: "cover",
                                        height: "50px",
                                        width: "50px",
                                    }}
                                    height={70}
                                    width={70}
                                />
                            </div>
                            <div className="d-flex flex-column justify-content-center text-start ms-3">
                                <p className="mb-0 text-sm text-capitalize fw-normal">{row?.name || "-"}</p>
                                 <p className="mb-0 text-sm text-capitalize fw-normal">{row?.coinPlanPurchase[0]?.uniqueId || "-"}</p>
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            Header: "IsVip",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize font-normal">{row?.isVip ? "Yes" : "No"}</span>
            ),
        },

        {
            Header: "Total Plans Purchased",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize">{row?.totalPlansPurchased || 0}</span>
            ),
        },

        {
            Header: `Total Price Spend (${defaultCurrency?.symbol})`,
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize">{row?.totalPriceSpent || 0}</span>
            ),
        },

        // {
        //     Header: "Date and Time",
        //     Cell: ({ row }: { row: any }) => (
        //         <span className="text-capitalize">{row?.date || "-"}</span>
        //     ),
        // },

        {
            Header: `History`,
            Cell: ({ row }: { row: any }) => (
                <button
                    style={{ borderRadius: "10px", background: "#FFE7E7", padding: "8px" }}
                    onClick={() => handleRedirect(row)}
                >
                    <img
                        src={historyInfo.src}
                        alt="History"
                        style={{ height: "22px", width: "22px", objectFit: "cover" }}


                    />
                </button>
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
                <Table
                    data={userCoinPlanPurchaseHistory}
                    mapData={coinPlanTable}
                    PerPage={rowsPerPage}
                    Page={page}
                    type={"server"}
            shimmer = {<CoinPlanTable />}

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

CoinPlanPurchaseHistory.getLayout = function getLayout(page: React.ReactNode) {
    return <RootLayout>{page}</RootLayout>;
};
export default CoinPlanPurchaseHistory;