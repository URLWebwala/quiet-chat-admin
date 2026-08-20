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
            width: "7%",
            align: "center",
            thClass: "text-center",
            tdClass: "text-center",
            Cell: ({ index }: { index: any }) => (
                <span>{index + 1}</span>
            ),
        },

        {
            Header: "Unique Id",
            width: "15%",
            align: "center",
            thClass: "text-center",
            tdClass: "text-center",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize" style={{ fontWeight: "400" }}>{row?.uniqueId || "-"}</span>
            ),
        },

        {
            Header: "User",
            body: "profilePic",
            width: "28%",
            align: "left",
            thClass: "text-start ps-4",
            tdClass: "text-start ps-4",
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

                    typeof window !== "undefined" && localStorage.setItem("userData", JSON.stringify(row));
                };

                return (
                    <div style={{ cursor: "pointer" }} onClick={handleClick}>
                        <div className="d-flex align-items-center py-1">
                            <img
                                src={
                                    row?.image
                                        ? `${row.image}${row.image.includes("googleusercontent") ? "?s96" : ""}`
                                        : male.src
                                }
                                alt="Image"
                                loading="eager"
                                draggable="false"
                                style={{
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    height: "42px",
                                    width: "42px",
                                }}
                                onError={(e: any) => {
                                    e.target.onerror = null;
                                    e.target.src = male.src;
                                }}
                                height={42}
                                width={42}
                            />
                            <div className="d-flex flex-column justify-content-center text-start ms-2">
                                <p className="mb-0 text-capitalize" style={{ fontSize: "14px", fontWeight: "500" }}>{row?.name || "-"}</p>
                            </div>
                        </div>
                    </div>
                );
            },
        },

        {
            Header: "Country",
            width: "18%",
            align: "center",
            thClass: "text-center",
            tdClass: "text-center",
            Cell: ({ row }: { row: any }) => {
                const countryName = row?.country || "-";
                const emoji = row?.countryFlagImage; // e.g., "🇮🇳"
                const countryCode = getCountryCodeFromEmoji(emoji); // "in"
                const flagImageUrl = countryCode
                    ? `https://flagcdn.com/w80/${countryCode}.png`
                    : null;

                return (
                    <div className="d-flex align-items-center justify-content-center gap-2">
                        {flagImageUrl ? (
                            <img
                                src={flagImageUrl}
                                height={22}
                                width={22}
                                alt={`${countryName} Flag`}
                                style={{
                                    objectFit: "cover",
                                    borderRadius: "50%",
                                    border: "1px solid #ccc",
                                }}
                                onError={(e: any) => {
                                    e.target.style.display = "none";
                                }}
                            />
                        ) : null}
                        <span className="text-capitalize" style={{ fontWeight: "400", fontSize: "13px" }}>
                            {countryName}
                        </span>
                    </div>
                );
            },
        },

        {
            Header: "Coin",
            width: "10%",
            align: "center",
            thClass: "text-center",
            tdClass: "text-center",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize" style={{ fontWeight: "400" }}>{row?.coin || 0}</span>
            ),
        },

        {
            Header: "Online",
            width: "10%",
            align: "center",
            thClass: "text-center",
            tdClass: "text-center",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize" style={{ fontWeight: "400" }}>{row?.isOnline ? "Yes" : "No"}</span>
            ),
        },

        {
            Header: "Date",
            width: "12%",
            align: "center",
            thClass: "text-center",
            tdClass: "text-center",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize text-nowrap" style={{ fontWeight: "400" }}>{row?.createdAt?.split("T")[0] || "-"}</span>
            ),
        },
    ];

    return (
        <div className="mt-4">
            <DashboardTable
                title={"Recent Users"}
                data={newUsers}
                mapData={pendingHostRequest}
                shimmer={<PendingHostRequestShimmer />}

            />

        </div>
    )
}

export default GetNewUser