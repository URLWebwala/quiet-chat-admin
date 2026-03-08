import Pagination from "@/extra/Pagination";
import Table from "@/extra/Table";
import { getNewUsers } from "@/store/dashboardSlice";
import { RootStore } from "@/store/store"
import { baseURL } from "@/utils/config";
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux";
import male from "@/assets/images/male.png"
import DashboardTable from "@/extra/DashboardTable";
import Image from "next/image";
import { useRouter } from "next/router";
import { getCountryCodeFromEmoji } from "@/utils/Common";
import india from "@/assets/images/india.png"
import PendingHostRequestShimmer from "@/component/Shimmer/PendingHostRequestShimmer";


const GetNewUser = (props: any) => {
    const { startDate, endDate } = props;
    const dispatch = useDispatch();
    const { newUsers } = useSelector((state: RootStore) => state.dashboard)
    const router = useRouter()

    useEffect(() => {

        const payload = {
            startDate,
            endDate
        }
        dispatch(getNewUsers(payload))
    }, [dispatch, startDate, endDate])




    const pendingHostRequest = [
        {
            Header: "No",
            Cell: ({ index }: { index: any }) => (
                <span> {index + 1}</span>
            ),
        },

        {
            Header: "Unique Id",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize" style={{ fontWeight: "400" }}>{row?.uniqueId || "-"}</span>
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

                const handleClick = () => {
                    router.push({
                        pathname: "/User/UserInfoPage",
                        query: { id: row?._id },
                    });

                    typeof window !== "undefined" && localStorage.setItem("userData", JSON.stringify(row))

                }

                return (
                    <div style={{ cursor: "pointer" }}
                        onClick={handleClick}
                    >
                        <div className="d-flex px-2 py-1"

                        >
                            <div>
                                <img
                                    // src={row?.image ? imageUrl : male.src}
                                    src={
                                        row?.image
                                            ? `${row.image}${row.image.includes('googleusercontent') ? '?s96' : ''}`
                                            : male.src
                                    }
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
                                <p className="mb-0  text-capitalize" style={{fontSize: "14px" , fontWeight: "500"}}>{row?.name || "-"}</p>
                                <p className="text-capitalize" style={{ fontWeight: "400" , fontSize: "12px" , color: "606060" }}>{row?.uniqueId || "-"}</p>
                            </div>
                        </div>
                    </div>
                );
            }

        },



        {
            Header: "Email",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize" style={{ fontWeight: "400" }}>{row?.email || "-"}</span>
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
                        <div style={{ width: "200px", textAlign: "start" }}>
                            <span className="text-capitalize " style={{ marginLeft: "10px" , fontWeight: "400" }}>
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
                <span className="text-capitalize " style={{fontWeight : "400"}}>{row?.coin || 0}</span>
            ),
        },

        {
            Header: "Online",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize " style={{fontWeight : "400"}}>{row?.isOnline ? "Yes" : "No"}</span>
            ),
        },

        {
            Header: "Date",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize  text-nowrap" style={{fontWeight : "400"}}>{row?.createdAt?.split("T")[0] || "-"}</span>
            ),
        },

    ];

    return (
        <div className="mt-4">
            <DashboardTable
                title={"Recent Users"}
                data={newUsers}
                mapData={pendingHostRequest}
                shimmer = {<PendingHostRequestShimmer />}

            />

        </div>
    )
}

export default GetNewUser