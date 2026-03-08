import { getTopPerformingHost } from "@/store/dashboardSlice";
import { RootStore } from "@/store/store"
import { baseURL } from "@/utils/config";
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux";
import male from "@/assets/images/male.png"
import RootLayout from "@/component/layout/Layout";
import { getLiveHost } from "@/store/hostSlice";
import Table from "@/extra/Table";
import { getCountryCodeFromEmoji } from "@/utils/Common";
import india from "@/assets/images/india.png"
import LiveDataHostShimmer from "@/component/shimmer/LiveDataHostShimmer";

const LiveHost = (props: any) => {
  const { startDate, endDate } = props;
  const dispatch = useDispatch();
  const { topPerformingHost } = useSelector((state: RootStore) => state.dashboard)
  const { liveHost } = useSelector((state: RootStore) => state.host)
  const { defaultCurrency } = useSelector((state: RootStore) => state.setting)
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    const payload = {
      start: page,
      limit: rowsPerPage
    }
    dispatch(getLiveHost(payload))
  }, [])




  const liveDataHost = [
    {
      Header: "No",
      Cell: ({ index }: { index: any }) => (
        <div style={{ width: "50px" }}>
          <span> {index + 1}</span>
        </div>
      ),
    },


    {
      Header: "Host",
      body: "profilePic",
      Cell: ({ row }: { row: any }) => {
        const updatedImagePath = row?.image ? row.image.replace(/\\/g, "/") : "";

        return (
          <div style={{ cursor: "pointer" }}>
            <div className="d-flex justify-content-center px-2 py-1">
              <div>
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
              <div className="d-flex flex-column justify-content-center text-start ms-3">
                <span className="mb-0 text-sm text-capitalize fw-normal">{row?.name || "-"}</span>
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
        console.log('countryCode: ', countryCode);

        const flagImageUrl = countryCode
          ? `https://flagcdn.com/w80/${countryCode}.png`
          : null;

        return (
          <div className="d-flex justify-content-end align-items-center gap-3">
            {flagImageUrl && (
              <div style={{ width: "150px", textAlign: "end" }}>
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
              <span className="text-capitalize text-nowrap" style={{ marginLeft: "10px" }}>
                {countryName}
              </span>
            </div>
          </div>
        );
      },
    },

    {
      Header: "View",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize fw-normal">{row?.view || 0}</span>
      ),
    },

    {
      Header: "Created At",
      Cell: ({ row }: { row: any }) => {
        const date = new Date(row?.createdAt);
        const formattedDate = isNaN(date.getTime())
          ? "-"
          : date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          });
        return <span className="text-nowrap text-normal">{formattedDate}</span>;
      },
    },

  ];




  return (
    <>
      <div
        className="title text-capitalized fw-400 livehosttext"
        style={{ color: "#868686", fontSize: "20px" }}
      >
        Live Host
      </div>
      <div className="">
        <Table
          data={liveHost}
          mapData={liveDataHost}
          type="client"
          shimmer={<LiveDataHostShimmer />}
        />

      </div>
    </>
  )
}
LiveHost.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};
export default LiveHost;