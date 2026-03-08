import RootLayout from "@/component/layout/Layout";
import { useDispatch, useSelector } from "react-redux";
import { RootStore } from "@/store/store";
import Table from "@/extra/Table";
import { useEffect, useState } from "react";
import Analytics from "@/extra/Analytic";
import CoinPlanTable from "../../component/Shimmer/CoinPlanTable";
import { useRouter } from "next/router";
import Pagination from "@/extra/Pagination";
import React from 'react';
import { retrieveCoinPlanPurchase } from "@/store/coinPlanSlice";
import { getDefaultCurrency } from "@/store/settingSlice";
import Searching from "@/extra/Searching";
import { formatCoins } from "@/utils/number";

const VipHistory = () => {
    const dispatch = useDispatch();
    const router = useRouter();
    const { id } = router.query;
    const { defaultCurrency } = useSelector((state: RootStore) => state.setting)

    const { dialogueType } = useSelector(
        (state: RootStore) => state.dialogue
    );

    const { userPlanPurchaseHistory, totalUserPlanPurchaseHistory } = useSelector(
        (state: any) => state.coinPlan
    );

    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [page, setPage] = useState<number>(1);
    const [data, setData] = useState<any[]>([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        dispatch(getDefaultCurrency())
    }, [dispatch])

    useEffect(() => {
        if (!id) return;

        const Id = Array.isArray(id) ? id[0] : id; // normalize query id

        const payload = {
            start: page,
            limit: rowsPerPage,
            userId: Id,
            type: 8,
            search,
        };

        dispatch(retrieveCoinPlanPurchase(payload));
    }, [dispatch, id, page, rowsPerPage, search]);


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

    const vipHistoryTable = [
        {
            Header: "No",
            Cell: ({ index }: any) => (
                <span>{(page - 1) * rowsPerPage + Number(index) + 1}</span>
            ),
        },
        {
            Header: "UniqueId",
            Cell: ({ row }: any) => (
                <span className="text-capitalize">{row?.uniqueId || "-"}</span>
            ),
        },

        {
            Header: "Payment Gateway",
            Cell: ({ row }: any) => (
                <span>{row?.paymentGateway || "-"}</span>
            ),
        },
        {
            Header: `Price (${defaultCurrency?.currencyCode || '$'})`,
            Cell: ({ row }: any) => (
                <span>{formatCoins(row?.price)}</span>
            ),
        },
        {
            Header: "Coin",
            Cell: ({ row }: any) => (
                <span>{formatCoins(row?.coin)}</span>
            ),
        },
        {
            Header: "Date",
            Cell: ({ row }: any) => (
                <span>{row?.date || "-"}</span>
            ),
        },
    ];



    return (
        <>
            <div className="row d-flex align-items-center pt-3">
                <div
                    className="col-12 col-lg-6 col-md-6 col-sm-12 fs-20 fw-600"
                    style={{ color: "#404040" }}
                >Vip Plan History</div>
                <div className="col-12 col-lg-6 col-md-6 col-sm-12 fs-20 fw-600"
                    style={{ color: "#404040" }}
                >
                    <Searching
                        type={`server`}
                        data={userPlanPurchaseHistory}
                        setData={setData}
                        column={vipHistoryTable}
                        serverSearching={handleFilterData}
                        placeholder={"Search by Payment Gateway/Unique ID"}
                    />
                </div>
            </div>

            <div className="mt-2">
                <div style={{ marginBottom: "32px" }}>
                    <Table
                        data={userPlanPurchaseHistory}
                        mapData={vipHistoryTable}
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
                        totalData={totalUserPlanPurchaseHistory}
                    />
                
            </div>
        </>
    );
};

VipHistory.getLayout = (page: React.ReactNode) => (
    <RootLayout>{page}</RootLayout>
);

export default VipHistory;