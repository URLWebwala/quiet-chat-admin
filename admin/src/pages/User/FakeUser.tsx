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

const FakeUser = (props: any) => {
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
    const { hostRequest, totalHostRequest, countryData

    } = useSelector((state: RootStore) => state.hostRequest)
    const flagImages = hostRequest?.map((host) => host?.countryFlagImage?.toUpperCase());
    // Filter countryData based on the flagImages array
    const matchingCountries = countryData.filter((country) =>
        flagImages?.includes(country.flag)
    );
    const flagImageUrl = matchingCountries[0]?.flags?.png
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

    const pendingHostRequest = [
        {
            Header: "No",
            Cell: ({ index }: { index: any }) => (
                <span> {(page - 1) * rowsPerPage + parseInt(index) + 1}</span>
            ),
        },


        {
            Header: "Host",
            accessor: "host",
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
                                width="60"
                                height="60"
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
            Header: "Agency",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize fw-bold">{row?.agencyId?.name ? row?.agencyId?.name : row?.agency?.name || "-"}</span>
            ),
        },

        {
            Header: "Impression",
            Cell: ({ row, index }: { row: SuggestedServiceData, index: any }) => {
                const isExpanded = expanded[index] || false;
                const impressionText = String(row?.impression || ""); // Convert to string
                const previewText = impressionText.substring(0, 30); // First 30 chars

                return (
                    <span className="text-capitalize fw-bold padding-left-2px">
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
                <span className="text-capitalize fw-bold">{row?.identityProofType || "-"}</span>
            ),
        },



        {
            Header: "Country",
            Cell: ({ row }: { row: any }) => (
                <div className="d-flex align-items-center justify-content-center">
                    <img
                        src={flagImageUrl}
                        height={20}
                        width={20}
                        alt="Country Image"
                        style={{ objectFit: "contain" }}
                    />
                    <span className="text-capitalize fw-bold">{row?.country || "-"}</span>

                </div>
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
        {
            Header: "Assign Agency",
            Cell: ({ row }: { row: any }) => (


                <span className="d-flex justify-content-center">
                    <button
                        className="py-1 me-2"
                        style={{ backgroundColor: "#CDE7FF", borderRadius: "8px" }}
                        onClick={() => handleOpenAgencyDialog(row)}
                    >
                        <img
                            src={agencyImage.src}
                            alt="Agency-Image"
                            height={26}
                            width={26}
                        />
                    </button>
                </span>

            )
        },

        {
            Header: "Action",
            Cell: ({ row }: { row: SuggestedServiceData }) => (
                <span>
                    <button
                        className="me-3"
                        style={{ backgroundColor: "#D6FFD7", borderRadius: "8px", padding: "10px" }}
                        onClick={() =>
                            handleAccepteHostRequest(row)
                        }
                    >
                        <img
                            src={accept.src}
                            height={24}
                            width={24}
                            alt="Accept"
                        />
                    </button>
                    <button
                        style={{ backgroundColor: "#FFE7E7", borderRadius: "8px", padding: "10px" }}
                        onClick={() => handleOpenWithdrawDialogue(row)}
                    >
                        <img
                            src={decline.src}
                            height={24}
                            width={24}
                            alt="Decline"
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
                    data={hostRequest}
                    mapData={pendingHostRequest}
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
                    totalData={totalHostRequest}
                />
            </div>
        </div>
    )
}

export default FakeUser