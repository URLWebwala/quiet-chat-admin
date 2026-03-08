import React from "react";
import RootLayout from "@/component/layout/Layout";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootStore } from "@/store/store";
import { getPlanPurchaseHistory } from "@/store/coinPlanSlice";
import Pagination from "@/extra/Pagination";
import Analytics from "@/extra/Analytic";
import { getDefaultCurrency } from "@/store/settingSlice";
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useRouter } from "next/router";
import Table from "@/extra/Table";
import { baseURL } from "@/utils/config";
import male from "@/assets/images/male.png";
import CoinPlanShimmer from "@/component/Shimmer/CoinPlanShimmer";
import Searching from "@/extra/Searching";
import { copyId } from "@/utils/Common";
import { MdContentCopy } from "react-icons/md";
import PlanPurchaseHistoryShimmer from "@/component/Shimmer/PlanPurchaseHistoryShimmer";
import { getImageUrl } from "@/utils/getImageUrl";
import { formatCoins } from "@/utils/number";

const PlanHistory = () => {
    const dispatch = useDispatch();
    const { planPurchaseHistory, totalPlanPurchaseHistory, adminEarning } = useSelector((state: RootStore) => state.coinPlan);

    const { defaultCurrency } = useSelector((state: RootStore) => state.setting)
    const [type, setType] = useState<string>("coin"); // "coin" or "vip"
    const [rowsPerPage, setRowsPerPage] = useState<number>(20);
    const [page, setPage] = useState<number>(1);
    const [startDate, setStartDate] = useState("All");
    const [endDate, setEndDate] = useState("All");
    const [data, setData] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const router = useRouter();

    useEffect(() => {
        const payload = {
            start: page,
            limit: rowsPerPage,
            startDate,
            endDate,
            type: type === "coin" ? 7 : 8,
            search
        };
        dispatch(getPlanPurchaseHistory(payload));
    }, [dispatch, page, rowsPerPage, type, startDate, endDate, search]);

    useEffect(() => {
        dispatch(getDefaultCurrency())
    }, [dispatch])

    const handleChangePage = (event: any, newPage: any) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: any) => {
        setRowsPerPage(parseInt(event, 10));
        setPage(1);
    };

    const handleFilterData = (filteredData: any) => {
        setPage(1);
        if (typeof filteredData === "string") {
            setSearch(filteredData);
        } else {
            setData(filteredData);
        }
    };


    const planPurchaseHistoryTable = [
        {
            Header: "No",
            Cell: ({ index }: { index: any }) => (
                <span>{(page - 1) * rowsPerPage + parseInt(index) + 1}</span>
            ),
        },
        {
            Header: "User",
            body: "profilePic",
            Cell: ({ row }: { row: any }) => {
                const rawImagePath = row?.image || "";
                const normalizedImagePath = rawImagePath.replace(/\\/g, "/");

                const imageUrl = normalizedImagePath.includes("storage")
                    ? baseURL + normalizedImagePath
                    : normalizedImagePath;

                return (
                    <div className="d-flex justify-content-center align-items-center">
                        <div
                            className="d-flex align-items-center justify-content-center px-2 py-1"

                        >
                            {/* Image */}
                            <div className="d-flex justify-content-center">
                                <img
                                    src={getImageUrl(row?.image)}
                                    referrerPolicy="no-referrer"
                                    alt="Image"
                                    loading="eager"
                                    draggable="false"
                                    style={{
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                        height: "50px",
                                        width: "50px",
                                    }}
                                    onError={(e: any) => {
                                        e.target.onerror = null;
                                        e.target.src = `/images/male.png`;
                                    }}
                                />
                            </div>

                            {/* Text */}
                            <div
                                className="d-flex flex-column justify-content-center align-items-start ms-3 text-nowrap"
                                style={{ width: "100px" }}
                            >
                                <p className="mb-0 text-sm text-capitalize fw-normal text-left">
                                    {row?.name || "-"}
                                </p>
                                <div className="d-flex align-items-center">
                                    <p
                                        className="mb-0 text-capitalize fw-normal text-center"
                                        style={{ fontSize: "12px", color: "gray" }}
                                    >
                                        {row?.uniqueId || "-"}
                                    </p>
                                    <button
                                        className="btn btn-sm p-1"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            copyId(row?.uniqueId);
                                        }}
                                        style={{ fontSize: "10px", lineHeight: "1" }}
                                        title="Copy Unique ID"
                                    >
                                        <MdContentCopy size={14} color="gray" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            Header: `Total Spent (${defaultCurrency?.currencyCode || '$'})`,
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize fw-normal">{formatCoins(row?.totalPriceSpent)}</span>
            ),
        },
        {
            Header: "Plans Bought",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize fw-normal">{row?.totalPlansPurchased || 0}</span>
            ),
        },
        {
            Header: "Records",
            Cell: ({ row }: { row: any }) => (
                <button
                    style={{ backgroundColor: "#f5f3ff", borderRadius: "8px", padding: "8px", color: "#9f5aff", }}
                    onClick={() => {
                        const path =
                            type === "coin"
                                ? "/PlanHistory/coinhistory"
                                : "/PlanHistory/viphistory";

                        router.push({
                            pathname: path,
                            query: { id: row?._id },
                        });

                        localStorage.setItem("userData", JSON.stringify(row?._id));
                    }}
                >
                    <span>View History</span>
                    <ChevronRightIcon
                        sx={{
                            width: 22,
                            height: 22,
                        }}
                    />
                </button>
            ),
        },
    ];

    return (
        <>
            <div className="d-flex align-items-center justify-content-end">
                <div style={{ fontWeight: "500", fontSize: "18px" }}>
                    Total Admin Earning:{" "}
                    <span style={{ color: "green" }}>{defaultCurrency?.currencyCode || '$'}{formatCoins(adminEarning)}</span>
                </div>
            </div>
            <div className="plan">
                <div className="my-2 expert_width">
                    <button
                        type="button"
                        className={`${type === "coin" ? "activeBtn" : "disabledBtn"}`}
                        onClick={() => setType("coin")}
                    >
                        Coin
                    </button>
                    <button
                        type="button"
                        className={`${type === "vip" ? "activeBtn" : "disabledBtn"} ms-1`}
                        onClick={() => setType("vip")}
                    >
                        VIP
                    </button>
                </div>
            </div>
            <div className="d-flex justify-content-between align-items-center">
                <Analytics
                    analyticsStartDate={startDate}
                    analyticsStartEnd={endDate}
                    analyticsStartDateSet={setStartDate}
                    analyticsStartEndSet={setEndDate}
                    direction={"start"}
                />
                <div className="col-6 mt-3">
                    <Searching
                        type={`server`}
                        data={planPurchaseHistory}
                        setData={setData}
                        column={planPurchaseHistoryTable}
                        serverSearching={handleFilterData}
                        placeholder={"Search by User Name / Unique Id"}
                    />
                </div>
            </div>

            <div>

                <Table
                    data={planPurchaseHistory}
                    mapData={planPurchaseHistoryTable}
                    PerPage={rowsPerPage}
                    Page={page}
                    type={"server"}
                    shimmer={<PlanPurchaseHistoryShimmer />}

                />
                <div style={{ marginTop: "32px", marginBottom: "28px" }}>
                    <Pagination
                        type={"server"}
                        serverPage={page}
                        setServerPage={setPage}
                        serverPerPage={rowsPerPage}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        totalData={totalPlanPurchaseHistory}
                    />
                </div>
            </div>
        </>
    );
};

PlanHistory.getLayout = function getLayout(page: React.ReactNode) {
    return <RootLayout>{page}</RootLayout>;
};

export default PlanHistory;
