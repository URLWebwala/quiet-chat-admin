import Pagination from "@/extra/Pagination";
import Table from "@/extra/Table";
import { openDialog } from "@/store/dialogSlice";
import {  getHostRequest, hostRequestUpdate } from "@/store/hostRequestSlice";
import { RootStore } from "@/store/store";
import { warning, warningForAccept } from "@/utils/Alert";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import info from "@/assets/images/info.svg";
import accept from "@/assets/images/accept.svg";
import decline from "@/assets/images/decline.svg";
import { baseURL } from "@/utils/config";
import male from "@/assets/images/male.png"
import Image from "next/image";
import agencyImage from "../../assets/images/agencyImage.svg"
import { setToast } from "@/utils/toastServices";
import { blockuser, getRealOrFakeUser } from "@/store/userSlice";
import ToggleSwitch from "@/extra/TogggleSwitch";
import { formatCoins } from "@/utils/Common";


interface SuggestedServiceData {
    _id: string;
    doctor: string;
    name: string;
    gender: string;
    email: string;
    age: number;
    dob: any
    description: string;
    country: string;
    impression: string
}

const RealUser = (props: any) => {
    const { startDate, endDate } = props;
    const dispatch = useDispatch();
    const router = useRouter();
   
    const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});

    const toggleReview = (index: number) => {
        setExpanded(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const { dialogue, dialogueType } = useSelector(
        (state: RootStore) => state.dialogue
    );
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [page, setPage] = useState<number>(1);
    const { user, total, countryData } = useSelector((state: RootStore) => state.user)
    const handleOpenWithdrawDialogue = (row: any) => {
        dispatch(openDialog({ type: "reason", data: row }));
    };

    const handleChangePage = (event: any, newPage: any) => {
        setPage(newPage);
    };

    const handleAccepteHostRequest = (row: any) => {
        

        const payload = {
            requestId: row?._id,
            userId: row?.userId
        }

        const data = warningForAccept("Host Request");
        data
            .then((logouts: any) => {
                const yes = logouts.isConfirmed;
                if (yes) {
                    dispatch(hostRequestUpdate(payload));
                }
            })
            .catch((err: any) => console.log(err));
    };

    useEffect(() => {

        const payload = {
            start: page,
            limit: rowsPerPage,
            startDate,
            endDate
        }

        dispatch(getRealOrFakeUser(payload))
    }, [page, rowsPerPage, startDate, endDate])

    useEffect(() => {
        const payload = {
            start: page,
            limit: rowsPerPage,
            status: 1
        }
        dispatch(getHostRequest(payload))
    }, [page, rowsPerPage])

    const handleChangeRowsPerPage = (event: any) => {
        setRowsPerPage(parseInt(event, 10));
        setPage(1);
    };

    const handleInfo = (row: any) => {

        router.push({
            pathname: "/HostProfile",
            query: { id: row?._id },
        });

        typeof window !== "undefined" && localStorage.setItem("hostData", JSON.stringify(row))

    };

    const handleOpenAgencyDialog = (row: any) => {


        if (row?.agencyId === null) {
            dispatch(openDialog({ type: "assignagency", data: { row, type: "expert" } }));
        }
    };




    const userTable = [
        {
            Header: "No",
            Cell: ({ index }: { index: any }) => (
                <span> {(page - 1) * rowsPerPage + parseInt(index) + 1}</span>
            ),
        },
        {
            Header: "Name",
            accessor: "Name",
            Cell: ({ row }: { row: any }) => {
                // Define updatedImagePath before returning JSX
                const updatedImagePath = row?.image ? row.image.replace(/\\/g, "/") : "";
                return (
                    <div className="d-flex justify-content-end align-items-center">
                        {/* Image Section */}
                        <div style={{ width: "60px", textAlign: "center" }}>
                            <img
                                src={row?.image ? baseURL + updatedImagePath : male.src}
                                alt="Image"
                                height={60}
                                width={60}
                                style={{ borderRadius: "10px", objectFit: "cover" }} // Styling for better appearance
                            />
                        </div>

                        {/* Product Name */}
                        <div style={{ width: "200px", textAlign: "start" }}>
                            <span className="text-capitalize ms-3 cursorPointer text-nowrap">
                                {row?.name || "-"}
                            </span>
                        </div>
                    </div>
                );
            },
        },

        {
            Header: "Unique Id",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize fw-normal">{row?.uniqueId || "-"}</span>
            ),
        },

        {
            Header: "Coin",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize fw-normal">{formatCoins(row?.coin)}</span>
            ),
        },

        {
            Header: "Agency",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize fw-normal">{row?.agencyId?.name ? row?.agencyId?.name : row?.agency?.name || "-"}</span>
            ),
        },

        {
            Header: "Impression",
            Cell: ({ row, index }: { row: SuggestedServiceData, index: any }) => {
                const isExpanded = expanded[index] || false;
                const impressionText = String(row?.impression || ""); // Convert to string
                const previewText = impressionText.substring(0, 30); // First 30 chars

                return (
                    <span className="text-capitalize fw-normal padding-left-2px">
                        {isExpanded ? impressionText : previewText}
                        {impressionText.length > 10 && (
                            <span
                                onClick={() => toggleReview(index)}
                                className="text-primary bg-none"
                                style={{ cursor: "pointer", marginLeft: "5px" }}
                            >
                                {isExpanded && impressionText.length > 10 ? " Read less" : " Read more..."}
                            </span>
                        )}
                    </span>
                );

            },
        },

        {
            Header: "Dcoument Type",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize fw-normal">{row?.identityProofType || "-"}</span>
            ),
        },

        
        {
            Header: "Is Block",
            body: "isBlock",
            sorting: { type: "client" },
            Cell: ({ row }: { row: any }) => (
                <ToggleSwitch
                    value={row?.isActive}
                    onClick={() => {
                        const id: any = row?._id;
                          
                        dispatch(blockuser(id));
                    }}
                />
            ),
        },







        {
            Header: "Info",
            Cell: ({ row }: { row: SuggestedServiceData }) => (
                <span className="">
                    <button
                        style={{ backgroundColor: "#c3e0ff", borderRadius: "10px", padding: "10px" }}
                        onClick={() => handleInfo(row)}
                    >
                        <img
                            src={info.src}
                            height={24}
                            width={24}
                            alt="Info-Image"
                        />
                    </button>
                </span>
            ),
        },
    ];
    return (
        <div className="mainCategory">



            <div>
                <Table
                    data={user}
                    mapData={userTable}
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
        </div>
    )
}

export default RealUser