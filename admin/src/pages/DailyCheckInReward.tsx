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
import DocumentTypeDialog from "@/component/documentType/DocumentTypeDialog";
import { deleteDocumentType, getDocumentType } from "@/store/settingSlice";
import DailyCheckInRewardDialog from "@/component/dailyCheckInReward/DailyCheckInRewardDialog";
import { deleteDailyReward, getDailyCheckInReward } from "@/store/dailyCheckInRewardSlice";
import CommonDialog from "@/utils/CommonDialog";
import ImpressionShimmer from "@/component/Shimmer/ImpressionShimmer";
import { formatCoins } from "@/utils/Common";


const DailyCheckInReward = () => {
    const dispatch = useDispatch();
    const { dialogue, dialogueType } = useSelector(
        (state: RootStore) => state.dialogue
    );
 
    const { dailyReward, total } = useSelector((state: RootStore) => state.dailyReward)
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [page, setPage] = useState<number>(1);
    const [selectedId, setSelectedId] = useState(null);
    const [showDialog, setShowDialog] = useState(false);

    useEffect(() => {

        dispatch(getDailyCheckInReward())
    }, [dispatch, page, rowsPerPage])

    const handleChangePage = (event: any, newPage: any) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: any) => {
        setRowsPerPage(parseInt(event, 10));
        setPage(1);
    };


    const confirmDelete = async () => {
        if (selectedId) {
            dispatch(deleteDailyReward(selectedId));
            setShowDialog(false);
        }
    };

    const handleDelete = (id: any) => {
        

        setSelectedId(id);
        setShowDialog(true);
    };

    const documentTypeTable = [
        // {
        //     Header: "No",
        //     Cell: ({ index }: { index: any }) => (
        //         <span> {(page - 1) * rowsPerPage + parseInt(index) + 1}</span>
        //     ),
        // },


        {
            Header: "Day",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize">{row?.day || "-"}</span>
            ),
        },


        {
            Header: "Daily Reward Coin",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize">{formatCoins(row?.dailyRewardCoin)}</span>
            ),
        },

        {
            Header: "Created At",
            Cell: ({ row }: { row: any }) => {
                const date = new Date(row?.createdAt);
                const formattedDate = isNaN(date.getTime())
                    ? "-"
                    : date.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                    });
                return <span>{formattedDate}</span>;
            },
        },


        {
            Header: "Updated At",
            Cell: ({ row }: { row: any }) => {
                const date = new Date(row?.updatedAt);
                const formattedDate = isNaN(date.getTime())
                    ? "-"
                    : date.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                    });
                return <span>{formattedDate}</span>;
            },
        },


        {
            Header: "Action",
            Cell: ({ row }: { row: any }) => (
                <div className="action-button">
                    <button
                        className="me-2"
                        style={{
                            backgroundColor: "#CFF3FF",
                            borderRadius: "8px",
                            padding: "8px",
                        }}
                        onClick={() => {
                            dispatch(openDialog({ type: "dailycheckinreward", data: row }));
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
            {dialogueType === "dailycheckinreward" && <DailyCheckInRewardDialog />}
            <CommonDialog
                open={showDialog}
                onCancel={() => setShowDialog(false)}
                onConfirm={confirmDelete}
                text={"Delete"}
            />
            <div className="row d-flex align-items-center">
                <div className="col-12 col-lg-6 col-md-6 col-sm-12 fs-20 fw-600"
                    style={{ color: "#404040" }}
                >
                    Daily Check In Reward
                </div>
                <div className="col-6 new-fake-btn d-flex justify-content-end align-items-center">
                    <div className="dashboardHeader primeHeader mb-3 p-0"></div>

                    <div className="betBox">
                        <Button
                            className={`bg-button p-10 text-white m10-bottom `}
                            bIcon={image}
                            text="Add Daily Reward"
                            onClick={() => {
                                dispatch(openDialog({ type: "dailycheckinreward" }));
                            }} />
                    </div>

                </div>
            </div>

            <div>
                <Table
                    data={dailyReward}
                    mapData={documentTypeTable}
                    PerPage={rowsPerPage}
                    Page={page}
                    type={"server"}
                    shimmer={<ImpressionShimmer />}
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

DailyCheckInReward.getLayout = function getLayout(page: React.ReactNode) {
    return <RootLayout>{page}</RootLayout>;
};
export default DailyCheckInReward;