import RootLayout from "@/component/layout/Layout";
import Button from "@/extra/Button";
import image from "@/assets/images/bannerImage.png";
import { openDialog } from "@/store/dialogSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootStore } from "@/store/store";
import Table from "@/extra/Table";
import Pagination from "@/extra/Pagination";
import { useEffect, useState } from "react";
import Image from "next/image";
import TrashIcon from "@/assets/images/delete.svg";
import EditIcon from "@/assets/images/edit.svg";
import {  warning } from "@/utils/Alert";
import { activeCoinPlan, deleteCoinPlan, getCoinPlan } from "@/store/coinPlanSlice";
import ToggleSwitch from "@/extra/TogggleSwitch";
import { useRouter } from "next/router";
import { getDefaultCurrency } from "@/store/settingSlice";
import coin from "@/assets/images/coin.png";
import CommonDialog from "@/utils/CommonDialog";
import CoinPlanShimmer from "@/component/Shimmer/CoinPlanShimmer";
import { formatCoins } from "@/utils/Common";



const CoinPlan = ({ type }: any) => {
    const router = useRouter();
    const dispatch = useDispatch();
    const { dialogue, dialogueType } = useSelector(
        (state: RootStore) => state.dialogue
    );
 
    const [showDialog, setShowDialog] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const { defaultCurrency } = useSelector((state: RootStore) => state.setting)
    const { coinPlan, total } = useSelector((state: RootStore) => state.coinPlan)
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [page, setPage] = useState<number>(1);

    useEffect(() => {
        const payload = {
            start: page,
            limit: rowsPerPage
        }
        if (type) {

            dispatch(getCoinPlan(payload))
        }
    }, [dispatch, page, rowsPerPage, type])

    const handleChangePage = (event: any, newPage: any) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: any) => {
        setRowsPerPage(parseInt(event, 10));
        setPage(1);
    };

    useEffect(() => {
        dispatch(getDefaultCurrency())
    }, [dispatch])




    const confirmDelete = async () => {
        if (selectedId) {
            dispatch(deleteCoinPlan(selectedId));
            setShowDialog(false);
        }
    };
    const handleDelete = (id: any) => {

        setSelectedId(id);
        setShowDialog(true);
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

                <div
                    style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}
                >
                    <div style={{ width: "30px" }}>
                        <img
                            src={coin.src}
                            height={25}
                            width={25}
                        />

                    </div>
                    <div style={{ width: "50px", textAlign: "start" }}>
                        <span className="text-capitalize fw-normal">
                            {formatCoins(row?.coins)}
                        </span>
                    </div>
                </div>
            ),
        },


        {
            Header: "Bonus Coin",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize fw-normal">{formatCoins(row?.bonusCoins)}</span>
            ),
        },

        {
            Header: `Price (${defaultCurrency?.symbol})`,
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize fw-normal">{formatCoins(row?.price)}</span>
            ),
        },

        {
            Header: "Product Id",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize fw-normal">{row?.productId || "-"}</span>
            ),
        },

        {
            Header: "Active",
            body: "isActive",
            Cell: ({ row }: { row: any }) => (
                <ToggleSwitch
                    value={row?.isActive}
                    onClick={() => {
                        const payload = {

                            id: row?._id,
                            type: "isActive"
                        }
                        dispatch(activeCoinPlan(payload));
                    }}
                />
            ),
        },

        {
            Header: "Popular",
            body: "IsPopular",
            Cell: ({ row }: { row: any }) => (
                <ToggleSwitch
                    value={row?.isFeatured}
                    onClick={() => {
                        const payload = {

                            id: row?._id,
                            type: "isFeatured"
                        }
                        dispatch(activeCoinPlan(payload));
                    }}
                />
            ),
        },

        {
            Header: "Action",
            Cell: ({ row }: { row: any }) => (
                <div className="d-flex justify-content-center">
                    <button
                        className="me-2"
                        style={{
                            backgroundColor: "#CFF3FF",
                            borderRadius: "8px",
                            padding: "8px",
                        }}
                        onClick={() => {
                            dispatch(openDialog({ type: "coinplan", data: row }));
                        }}
                    >
                        <img
                            src={EditIcon.src}
                            alt="Edit Icon"
                            width={22}
                            height={22}
                        />
                    </button>
                    <button
                        style={{
                            backgroundColor: "#FFE7E7",
                            borderRadius: "8px",
                            padding: "8px",
                        }}
                        onClick={() => handleDelete(row?._id)}
                    >
                        <img
                            src={TrashIcon.src}
                            alt="Trash Icon"
                            width={22}
                            height={22}
                        />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <>
            <CommonDialog
                open={showDialog}
                onCancel={() => setShowDialog(false)}
                onConfirm={confirmDelete}
                text={"Delete"}
            />
            <div className="row">
                <div className="col-6 new-fake-btn d-flex justify-content-end align-items-center">
                    <div className="dashboardHeader primeHeader mb-3 p-0"></div>
                </div>
            </div>

            <div>
                <Table
                    data={coinPlan}
                    mapData={coinPlanTable}
                    PerPage={rowsPerPage}
                    Page={page}
                    type={"server"}
                    shimmer={<CoinPlanShimmer />}
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

CoinPlan.getLayout = function getLayout(page: React.ReactNode) {
    return <RootLayout>{page}</RootLayout>;
};
export default CoinPlan;