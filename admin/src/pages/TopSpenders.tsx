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
            width: "8%",
            align: "center",
            thClass: "text-center",
            tdClass: "text-center",
            Cell: ({ index }: { index: any }) => (
                <span className="fw-semibold">{index + 1}</span>
            ),
        },

        {
            Header: "Spender",
            body: "profilePic",
            width: "35%",
            align: "left",
            thClass: "text-start ps-4",
            tdClass: "text-start ps-4",
            Cell: ({ row }: { row: any }) => {
                const rawImagePath = row?.image || "";
                const normalizedImagePath = rawImagePath.replace(/\\/g, "/");

                const imageUrl = normalizedImagePath.includes("storage")
                    ? baseURL + normalizedImagePath
                    : normalizedImagePath;

                return (
                    <div style={{ cursor: "pointer" }}>
                        <div className="d-flex align-items-center py-1">
                            <img
                                src={row?.image ? imageUrl : (male.src || male)}
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
                                <span className="mb-0 text-sm text-capitalize" style={{ fontWeight: "500" }}>{row?.name || "-"}</span>
                            </div>
                        </div>
                    </div>
                );
            },
        },

        {
            Header: "Country",
            width: "25%",
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
            Header: "Vip",
            width: "14%",
            align: "center",
            thClass: "text-center",
            tdClass: "text-center",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize" style={{ fontWeight: "400" }}>{row?.isVip ? "Yes" : "No"}</span>
            ),
        },

        {
            Header: `Total Coin Spend`,
            width: "18%",
            align: "center",
            thClass: "text-center",
            tdClass: "text-center",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize" style={{ fontWeight: "400" }}>{row?.totalCoinsSpent || 0}</span>
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