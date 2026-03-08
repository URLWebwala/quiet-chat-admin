import Pagination from "@/extra/Pagination";
import Table from "@/extra/Table";
import { getNewUsers, getTopAgencies, getTopPerformingHost } from "@/store/dashboardSlice";
import { RootStore } from "@/store/store"
import { baseURL } from "@/utils/config";
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux";
import male from "@/assets/images/male.png"
import { getDefaultCurrency } from "@/store/settingSlice";
import DashboardTable from "@/extra/DashboardTable";
import Image from "next/image";
import { formatCoins, getCountryCodeFromEmoji } from "@/utils/Common";
import india from "@/assets/images/india.png"
import PendingAgencyRequestShimmer from "@/component/Shimmer/PendingAgencyRequestShimmer";


 const TopPerformingAgency = (props: any) => {
    const { startDate, endDate } = props;
    const dispatch = useDispatch();
    const { topAgencies } = useSelector((state: RootStore) => state.dashboard)
    const {defaultCurrency} = useSelector((state : RootStore) => state.setting)

     

       useEffect(() => {
             dispatch(getDefaultCurrency())
        }, [])
    

        const pendingHostRequest = [
            {
                Header: "No",
                Cell: ({ index }: { index: any }) => (
                    <span> {index + 1}</span>
                ),
            },
    
            {
                Header: "Agency",
                body: "profilePic",
                Cell: ({ row }: { row: any }) => {
                    const rawImagePath = row?.image || "";
                    const normalizedImagePath = rawImagePath.replace(/\\/g, "/");
            
                    const imageUrl = normalizedImagePath.includes("storage")
                    ? baseURL + normalizedImagePath
                    : normalizedImagePath;
                    
                    return (
                        <div style={{ cursor: "pointer" }}>
                            <div className="d-flex justify-content-start px-2 py-1">
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
                                        height={70}
                                        width={70}
                                        onError={(e: any) => {
                                            e.target.onerror = null;
                                            e.target.src = male.src;
                                        }}
                                    />
                                </div>
                                <div className="d-flex flex-column justify-content-center text-start ms-3">
                                    <p className="mb-0 text-capitalize " style={{ fontWeight : "500" , fontSize : "14px"}}>{row?.name || "-"}</p>
                                    <p className="text-capitalize " style={{ fontWeight : "400" ,fontSize : "12px"}}>{row?.agencyCode || 0}</p>
                                </div>
                            </div>
                        </div>
                    );
                },
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
                                    src={ row?.countryFlagImage ? row?.countryFlagImage : india.src}
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
                            <span className="text-capitalize" style={{ marginLeft: "10px" , fontWeight : "400"}}>
                                {countryName}
                            </span>
                        </div>
                    </div>
                );
            },
        },

            {
                Header: `Total Earning (${defaultCurrency?.symbol})`,
                Cell: ({ row }: { row: any }) => (
                    <span className="text-capitalize " style={{ fontWeight : "400"}}>{row?.totalEarnings || "-"}</span>
                ),
            },

            {
                Header: "Commission (%)",
                Cell: ({ row }: { row: any }) => (
                    <span className="text-capitalize " style={{ fontWeight : "400"}}>{formatCoins(row?.commission)}</span>
                ),
            },

            {
                Header: "No Of Host",
                Cell: ({ row }: { row: any }) => (
                    <span className="text-capitalize " style={{ fontWeight : "400"}}>{row?.hostsCount || 0}</span>
                ),
            },


    
            {
                Header: "Date",
                Cell: ({ row }: { row: any }) => (
                    <span className="text-capitalize text-nowrap" style={{ fontWeight : "400"}}>{row?.createdAt?.split("T")[0] || "-"}</span>
                ),
            },
            
    
           
        ];
    

    useEffect(() => {

        const payload = {
            startDate,
            endDate
        }

        dispatch(getTopAgencies(payload))
    }, [dispatch , startDate , endDate])

    

    return (
        <div className="mt-4">
        <DashboardTable
         title={"Top Performing Agency"}
            data={topAgencies}
            mapData={pendingHostRequest}
            shimmer = {<PendingAgencyRequestShimmer />}
        />
       
    </div>
    )
}

export default TopPerformingAgency