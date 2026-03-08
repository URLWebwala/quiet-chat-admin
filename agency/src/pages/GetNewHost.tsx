import Pagination from "@/extra/Pagination";
import Table from "@/extra/Table";
import { RootStore } from "@/store/store"
import { baseURL } from "@/utils/config";
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux";
import male from "@/assets/images/male.png"
import DashboardTable from "@/extra/DashboardTable";
import { getNewHost } from "@/store/dashboardSlice";
import { formatCoins, getCountryCodeFromEmoji } from "@/utils/Common";
import india from "@/assets/images/india.png"
import NewHostShimmer from "@/component/shimmer/NewHostShimmer";

 const GetNewHost = (props: any) => {
    const { startDate, endDate } = props;
    const dispatch = useDispatch();
    const { newHost } = useSelector((state: RootStore) => state.dashboard)

  


      useEffect(() => {
        let payload: any = {
          startDate,
          endDate,
        };
        dispatch(getNewHost(payload));
      }, [dispatch, startDate, endDate]);

      const newHostData = [
        {
          Header: "No",
          Cell: ({ index }: { index: any }) => (
            <div style={{ width: "50px" }}>
              <span> {index + 1}</span>
            </div>
          ),
        },
    
        {
          Header: "Unique Id",
          Cell: ({ row }: { row: any }) => (
            <span className="text-capitalize ">{row?.uniqueId || "-"}</span>
          ),
        },
    
    
        {
          Header: "User",
          body: "profilePic",
          Cell: ({ row }: { row: any }) => {
            const updatedImagePath = row?.image ? row.image.replace(/\\/g, "/") : "";
    
            return (
              <div style={{ cursor: "pointer" }}>
                <div className="d-flex justify-content-center align-items-center gap-3 px-2 py-1">
                  <div style={{textAlign : "end" , width : "100px"}}>
                    <img
                      src={row?.image ? baseURL + updatedImagePath : male.src}
                      alt="Image"
                      loading="eager"
                      draggable="false"
                      style={{ borderRadius: "50%", objectFit: "cover", height: "50px", width: "50px" }}
                      height={70}
                      width={70}
                    />
                  </div>

                  <div style={{textAlign : "start" , width : "200px"}}>
                    <span className="mb-0 text-sm text-capitalize ">{row?.name || "-"}</span>
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
                                    src={flagImageUrl ? flagImageUrl : india.src}
                                    height={40}
                                    width={40}
                                    alt={`${countryName} Flag`}
                                    style={{
                                        objectFit: "cover",
                                        borderRadius: "50%",
                                        border: "1px solid #ccc",
                                    }}
                                />
                            </div>
                        )}
                        <div style={{ width: "200px", textAlign: "start" }}>
                            <span className="text-capitalize" style={{ marginLeft: "10px" }}>
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
            <span className="text-capitalize">{formatCoins(row?.coin)}</span>
          ),
        },
    
        {
          Header: "Block",
          Cell: ({ row }: { row: any }) => (
            <div >
              <span className="text-capitalize">{row?.isBlock ? "Yes" : "No"}</span>
            </div>
          ),
        },
    
        {
          Header: "Online",
          Cell: ({ row }: { row: any }) => (
            <div>
              <span className="text-capitalize">{row?.isOnline ? "Yes" : "No"}</span>
            </div>
          ),
        },
    
        {
          Header: "Date",
          Cell: ({ row }: { row: any }) => (
            <div style={{ textAlign : "center" }}>
              <span className="text-capitalize text-nowrap">{row?.createdAt?.split("T")[0] || "-"}</span>
            </div>
          ),
        },
      ];






    return (
        <div className="mt-4">
            <DashboardTable
                title={"Recent Host"}
                data={newHost}
                mapData={newHostData}
                shimmer={<NewHostShimmer />}

            />

        </div>
    )
}

export default GetNewHost