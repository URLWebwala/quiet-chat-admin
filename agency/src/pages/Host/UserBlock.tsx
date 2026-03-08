import RootLayout from "@/component/layout/Layout";
import Pagination from "@/extra/Pagination";
import Table from "@/extra/Table";
import { RootStore } from "@/store/store";
import { baseURL } from "@/utils/config";
import React, { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux";
import male from "@/assets/images/male.png"
import Image from "next/image";
import { getUserBlockList } from "@/store/hostSlice";
import coin from "@/assets/images/coin.png";
import { formatCoins, getCountryCodeFromEmoji } from "@/utils/Common";
import india from "@/assets/images/india.png"

const UserBlock = () => {
    const { userBlockList, total } = useSelector((state: RootStore) => state.host)
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [page, setPage] = useState<number>(1);
    const hostData = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("hostData") || "null") : null;






    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(getUserBlockList(hostData?._id))
    }, [])


    const handleChangePage = (event: any, newPage: any) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: any) => {
        setRowsPerPage(parseInt(event, 10));
        setPage(1);
    };

    const userTable = [
        {
            Header: "No",
            Cell: ({ index }: { index: any }) => (
                <span> {(page - 1) * rowsPerPage + parseInt(index) + 1}</span>
            ),
        },

        {
            Header: "User",
            body: "profilePic",
            Cell: ({ row }: { row: any }) => {
                const updatedImagePath = row?.hostId?.image ? row.hostId?.image.replace(/\\/g, "/") : "";

                return (
                    <div style={{ cursor: "pointer" }}>
                        <div className="d-flex justify-content-center px-2 py-1">
                            <div>
                                <img
                                    src={row?.hostId?.image ? baseURL + updatedImagePath : male.src}
                                    alt="Image"
                                    loading="eager"
                                    draggable="false"
                                    style={{ borderRadius: "10px", objectFit: "cover", height: "50px", width: "50px" }}
                                    height={70}
                                    width={70}
                                />
                            </div>
                            <div className="d-flex flex-column justify-content-center text-start ms-3">
                                <b className="mb-0 text-sm text-capitalize">{row?.hostId?.name || "-"}</b>
                            </div>
                        </div>
                    </div>
                );
            },
        },

        {
            Header: "Unique Id",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize fw-normal">{row?.hostId?.uniqueId || "-"}</span>
            ),
        },
  {
            Header: "Country",
            Cell: ({ row }: { row: any }) => {
                const countryName = row?.country || "-";
                const emoji = row?.countryFlagImage; // e.g., "🇮🇳"

                const countryCode = getCountryCodeFromEmoji(emoji); // "in"

                const flagImageUrl = countryCode
                    ? `https://flagcdn.com/w80/${countryCode}.png`
                    : null;

                return (
                    <div className="d-flex justify-content-end align-items-center gap-3">
                        {flagImageUrl && (
                            <div style={{ width: "150px", textAlign: "end" }}>
                                <img
                                    src={flagImageUrl ? flagImageUrl : india.src}
                                    height={30}
                                    width={40}
                                    alt={`${countryName} Flag`}
                                    style={{
                                        objectFit: "cover",
                                        borderRadius: "4px",
                                        border: "1px solid #ccc",
                                    }}
                                />
                            </div>
                        )}
                        <div style={{ width: "200px", textAlign: "start" }}>
                            <span className="text-capitalize text-nowrap" style={{ marginLeft: "10px" }}>
                                {countryName}
                            </span>
                        </div>
                    </div>
                );
            },
        },




        {
            Header: "Coin",
            Cell: ({ row }: { row: any }) => (

                <div
                    style={{ display: "flex", justifyContent: "center", gap: "10px" }}
                >
                    <div style={{ width: "30px" }}>
                        <img
                            src={coin.src}
                            height={25}
                            width={25}
                        />

                    </div>
                    <div style={{ width: "50px", textAlign: "start" }}>
                        <span className="text-capitalize fw-bold">
                            {formatCoins(row?.hostId?.coin)}
                        </span>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <div>
            <div className="mt-4">
                <Table
                    data={userBlockList}
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

UserBlock.getLayout = function getLayout(page: React.ReactNode) {
    return <RootLayout>{page}</RootLayout>;
};

export default UserBlock