import Pagination from "@/extra/Pagination";
import Table from "@/extra/Table";
import Title from "@/extra/Title";
import { openDialog } from "@/store/dialogSlice";
import { getHostRequest } from "@/store/hostRequestSlice";
import { RootStore } from "@/store/store";
import { baseURL } from "@/utils/config";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import male from "@/assets/images/male.png";
import info from "@/assets/images/info.svg";
import { getCountryCodeFromEmoji } from "@/utils/Common";
import india from "@/assets/images/india.png";
import AcceptedHostRequestShimmer from "../shimmer/AcceptedHostRequestShimmer";
import Searching from "@/extra/Searching";

interface SuggestedServiceData {
  _id: string;
  doctor: string;
  name: string;
  gender: string;
  email: string;
  age: number;
  dob: any;
  description: string;
  country: string;
  reason: string;
}

const DeclinedHostRequest = (props: any) => {
  const router = useRouter();

  const dispatch = useDispatch();
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const { hostRequest, totalHostRequest, countryData } = useSelector(
    (state: RootStore) => state.hostRequest
  );

  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});
  const [expandedReason, setExpandedReason] = useState<{
    [key: number]: boolean;
  }>({});

  const toggleReview = (index: number) => {
    setExpanded((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleReviewReason = (index: number) => {
    setExpandedReason((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  useEffect(() => {
    const payload = {
      start: page,
      limit: rowsPerPage,
      status: 3,
      search
    };
    dispatch(getHostRequest(payload));
  }, [page, rowsPerPage, search]);

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event, 10));
    setPage(1);
  };

  const handleInfo = (row: any) => {
    router.push({
      pathname: "/HostProfile",
      query: { id: row?._id },
    });

    typeof window !== "undefined" &&
      localStorage.setItem("hostData", JSON.stringify(row));
  };

  const handleFilterData = (filteredData: any) => {
    setPage(1);
    if (typeof filteredData === "string") {
      setSearch(filteredData);
    } else {
      setData(filteredData);
    }
  };

  const declinedHostRequestTable = [
    {
      Header: "No",
      Cell: ({ index }: { index: any }) => (
        <span> {(page - 1) * rowsPerPage + parseInt(index) + 1}</span>
      ),
    },
    {
      Header: "Host",
      accessor: "host",
      Cell: (
        { row }: { row: any } // Correct destructuring
      ) => (
        <div className="d-flex justify-content-end align-items-center">
          {/* Image Section */}
          <div style={{ width: "60px", textAlign: "start" }}>
            <img
              src={
                row?.image ? baseURL + row.image.replace(/\\/g, "/") : male.src
              }
              alt={"Image"}
              width="60"
              height="60"
              style={{ borderRadius: "50%", objectFit: "cover" }} // Styling for better appearance
            />
          </div>

          {/* Product Name */}
          <div style={{ width: "200px", textAlign: "start" }}>
            <span className="text-capitalize ms-3 cursorPointer text-nowrap">
              {row?.name || "-"}
            </span>
          </div>
        </div>
      ),
    },

    {
      Header: "Impression",
      Cell: ({ row, index }: { row: any; index: any }) => {
        const isExpanded = expanded[index] || false;
        const impressionText = String(row?.impression || ""); // Convert to string
        const previewText = impressionText.substring(0, 30); // First 30 chars

        return (
          <div className="text-capitalize padding-left-2px">
            {isExpanded ? impressionText : previewText || "-"}
            {impressionText.length > 10 && (
                            <div
                                onClick={() => toggleReview(index)}
                                className="text-primary bg-none"
                                style={{ cursor: "pointer", marginLeft: "5px" }}
                            >
                                {isExpanded && impressionText.length > 10 ? " Read less" : " Read more..."}
                            </div>
                        )}
          </div>
        );
      },
    },

    {
      Header: "Dcoument Type",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize text-nowrap">
          {row?.identityProofType || "-"}
        </span>
      ),
    },

    {
      Header: "Reason",
      Cell: ({ row, index }: { row: any; index: any }) => {
        const isExpanded = expandedReason[index] || false;
        const impressionText = String(row?.reason || ""); // Convert to string
        const previewText = impressionText.substring(0, 30); // First 30 chars

        return (
          <div
            className="text-capitalize padding-left-2px"
            style={{
              width: "400px",
            }}
          >
            {isExpanded ? impressionText : previewText}
            {impressionText.length > 10 && (
              <span
                onClick={() => toggleReviewReason(index)}
                className="text-primary bg-none"
                style={{ cursor: "pointer", marginLeft: "5px" }}
              >
                {isExpanded && impressionText.length > 10
                  ? " Read less"
                  : " Read more..."}
              </span>
            )}
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
           <div className="d-flex align-items-center" style={{ gap: "10px" }}>
            {flagImageUrl && (
              <img
                src={flagImageUrl}
                height={40}
                width={40}
                alt={`${countryName} Flag`}
                style={{ objectFit: "cover", borderRadius: "50%", border: "1px solid #ccc" }}
              />
            )}
            <span className="text-capitalize">{countryName}</span>
          </div>
        );
      },
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

    {
      Header: "Info",
      Cell: ({ row }: { row: SuggestedServiceData }) => (
        <span className="">
          <button
            style={{
              backgroundColor: "#E1F8FF",
              borderRadius: "10px",
              padding: "8px",
            }}
            onClick={() => handleInfo(row)}
          >
            <img src={info.src} height={22} width={22} alt="Info-Image" />
          </button>
        </span>
      ),
    },
  ];
  return (
    <div className="mainCategory">
      <div className="row align-items-center justify-content-end mb-3">
    <div className="col-lg-6 col-sm-8">
      <Searching
      type="server"
      data={hostRequest}
      setData={setData}
      column={declinedHostRequestTable}
      serverSearching={handleFilterData}
      placeholder="Search by Host Name / Unique ID"
    />
    </div>
    </div>
      <div>
        <Table
          data={hostRequest}
          mapData={declinedHostRequestTable}
          PerPage={rowsPerPage}
          Page={page}
          type={"server"}
          shimmer={<AcceptedHostRequestShimmer />}
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
  );
};

export default DeclinedHostRequest;
