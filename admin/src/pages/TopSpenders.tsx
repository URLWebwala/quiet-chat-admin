import Pagination from "@/extra/Pagination";
import Table from "@/extra/Table";
import { getNewUsers, getTopAgencies, getTopPerformingHost, getTopSpenders } from "@/store/dashboardSlice";
import { RootStore } from "@/store/store"
import { baseURL } from "@/utils/config";
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux";
import male from "@/assets/images/male.png"
import { getDefaultCurrency } from "@/store/settingSlice";
import DashboardTable from "@/extra/DashboardTable";
import Image from "next/image";
import { getCountryCodeFromEmoji } from "@/utils/Common";
import india from "@/assets/images/india.png"
import Spenders from "../component/Shimmer/Spenders";


const TopSpenders = (props: any) => {
    const { startDate, endDate } = props;
    const dispatch = useDispatch();
    const { topSpenders } = useSelector((state: RootStore) => state.dashboard)

    useEffect(() => {
        dispatch(getDefaultCurrency())
    }, [])

    useEffect(() => {

        const payload = {
            startDate,
            endDate
        }

        dispatch(getTopSpenders(payload))
    }, [dispatch, startDate, endDate])


    const pendingHostRequest = [
        {
            Header: "No",
            Cell: ({ index }: { index: any }) => (
                <span className="fw-semibold"> {index + 1}</span>
            ),
        },

        {
            Header: "Spender",
            body: "profilePic",
            Cell: ({ row }: { row: any }) => {
                const rawImagePath = row?.image || "";
                const normalizedImagePath = rawImagePath.replace(/\\/g, "/");

                const imageUrl = normalizedImagePath.includes("storage")
                    ? baseURL + normalizedImagePath
                    : normalizedImagePath;

                return (
                    <div style={{ cursor: "pointer" }}>
                        <div className="d-flex px-2 py-1">
                            <div>
                                <img
                                    src={row?.image ? imageUrl : male}
                                    alt="Image"
                                    loading="eager"
                                    draggable="false"
                                    style={{
                                        borderRadius: "50px",
                                        objectFit: "cover",
                                        height: "50px",
                                        width: "50px",
                                    }}
                                    onError={(e: any) => {
                                        e.target.onerror = null;
                                        e.target.src = male.src;
                                    }}
                                    height={70}
                                    width={70}
                                />
                            </div>
                            <div className="d-flex flex-column justify-content-center text-start ms-3">
                                <span className="mb-0 text-sm text-capitalize" style={{ fontWeight: "500" }}>{row?.name || "-"}</span>
                            </div>
                        </div>
                    </div>
                );
            },
        },


        {
            Header: "Email",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize"  style={{ fontWeight: "400" }} >{row?.email || "-"}</span>
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
                                <div style={{ width: "70px", textAlign: "end" }}>
                                    <img
                                        src={flagImageUrl ? flagImageUrl : india.src}
                                        height={40}
                                        width={40}
                                        alt={`${countryName} Flag`}
                                        style={{
                                            objectFit: "cover",
                                            borderRadius: "50px",
                                            border: "1px solid #ccc",
                                        }}
                                    />
                                </div>
                            )}
                            <div style={{ width: "300px", textAlign: "start" }}>
                                <span className="text-capitalize " style={{ marginLeft: "10px" , fontWeight: "400" }}>
                                    {countryName}
                                </span>
                            </div>
                        </div>
                    );
                },
            },
    


        {
            Header: "Vip",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize " style={{ fontWeight : "400"}}>{row?.isVip ? "Yes" : "No"}</span>
            ),
        },


        {
            Header: `Total Coin Spend`,
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize " style={{ fontWeight : "400"}}>{row?.totalCoinsSpent || 0}</span>
            ),
        },


    ];


    return (
        <div className="mt-4">
            <DashboardTable
                title={"Top Spenders"}
                data={topSpenders}
                mapData={pendingHostRequest}
                shimmer = {<Spenders />}

            />

        </div>
    )
}

export default TopSpenders