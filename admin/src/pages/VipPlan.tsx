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
import { warning } from "@/utils/Alert";
import ToggleSwitch from "@/extra/TogggleSwitch";
import { useRouter } from "next/router";
import { activeVipPlan, deleteVipPlan, getVipPlan } from "@/store/vipPlanSlice";
import { getDefaultCurrency } from "@/store/settingSlice";
import coin from "@/assets/images/coin.png";
import CommonDialog from "@/utils/CommonDialog";
import VipPlanShimmer from "@/component/Shimmer/VipPlanShimmer";
import { formatCoins } from "@/utils/Common";


const VipPlan = ({type} : any) => {
    const router = useRouter();
    const dispatch = useDispatch();
    const { dialogue, dialogueType } = useSelector(
        (state: RootStore) => state.dialogue
    );
      const [showDialog, setShowDialog] = useState(false);
      const [selectedId, setSelectedId] = useState(null);
      
    const { vipPlan, total } = useSelector((state: RootStore) => state.vipPlan)
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [page, setPage] = useState<number>(1);
    const { defaultCurrency } = useSelector((state: RootStore) => state.setting)

    useEffect(() => {
        dispatch(getDefaultCurrency())
    }, [dispatch , type])

    useEffect(() => {
        const payload = {
            start: page,
            limit: rowsPerPage
        }
        if(type){

            dispatch(getVipPlan(payload))
        }
    }, [dispatch, page, rowsPerPage , type])

    const handleChangePage = (event: any, newPage: any) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: any) => {
        setRowsPerPage(parseInt(event, 10));
        setPage(1);
    };

     const confirmDelete = async () => {
        if (selectedId) {
          dispatch(deleteVipPlan(selectedId));
          setShowDialog(false);
        }
      };

      const handleDelete = (id: any) => {
               

        setSelectedId(id);
        setShowDialog(true);
      };
    


    const handleOpen = (row: any) => {
        router.push("/CoinPlanHistory");
        localStorage.setItem("coinPlanHistoryData", JSON.stringify(row));
    }

    const coinPlanTable = [
        {
            Header: "No",
            Cell: ({ index }: { index: any }) => (
                <span> {(page - 1) * rowsPerPage + parseInt(index) + 1}</span>
            ),
        },


        {
            Header: "Validity",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize fw-normal">{row?.validity || 0}</span>
            ),
        },

        {
            Header: "Validity Type",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize fw-normal">{row?.validityType || "-"}</span>
            ),
        },

        {
            Header: `Price (${defaultCurrency?.symbol})`,
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize fw-normal">{formatCoins(row?.price)}</span>
            ),
        },

        {
            Header: "Coin",
            Cell: ({ row }: { row: any }) => (

                <div
                   style={{display : "flex", justifyContent : "center" , gap : "10px"}}
                >
                    <div style={{width : "30px"}}>
                        <img
                            src={coin.src}
                            height={25}
                            width={25}
                        />

                    </div>
                    <div style={{width : "50px" , textAlign : "start"}}>
                    <span className="text-capitalize fw-normal">
                        {formatCoins(row?.coin) || 0}
                    </span>
                    </div>
                </div>
            ),
        },

        {
            Header: "Active",
            body: "isActive",
            Cell: ({ row }: { row: any }) => (
                <ToggleSwitch
                    value={row?.isActive}
                    onClick={() => {
                        const id: any = row?._id;
                          
                        dispatch(activeVipPlan(id));
                    }}
                />
            ),
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
                            dispatch(openDialog({ type: "vipPlan", data: row }));
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
                    data={vipPlan}
                    mapData={coinPlanTable}
                    PerPage={rowsPerPage}
                    Page={page}
                    type={"server"}
                    shimmer={<VipPlanShimmer />}
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

VipPlan.getLayout = function getLayout(page: React.ReactNode) {
    return <RootLayout>{page}</RootLayout>;
};
export default VipPlan;