import Pagination from "@/extra/Pagination";
import Table from "@/extra/Table";
import { openDialog } from "@/store/dialogSlice";
import {
  getAgencyList,
  getHostRequest,
  hostRequestUpdate,
} from "@/store/hostRequestSlice";
import { RootStore } from "@/store/store";
import { warning, warningForAccept } from "@/utils/Alert";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import HostReasonDialog from "./HostReasonDialog";
import { useRouter } from "next/router";
import info from "@/assets/images/info.svg";
import accept from "@/assets/images/accept.svg";
import decline from "@/assets/images/decline.svg";
import { baseURL } from "@/utils/config";
import male from "@/assets/images/male.png";
import Image from "next/image";
import agencyImage from "../../assets/images/agencyImage.svg";
import { setToast } from "@/utils/toastServices";
import AssignAgencyToDialog from "./AssignAgencyToDialg";
import CommonDialog from "@/utils/CommonDialog";
import { getCountryCodeFromEmoji } from "@/utils/Common";
import india from "@/assets/images/india.png";
import HostRequsetShimmer from "../Shimmer/HostRequsetShimmer";
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
  impression: string;
}

const PendingHostRequest = ({ type }: any) => {
  const dispatch = useDispatch();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [hasFetchedAgencyList, setHasFetchedAgencyList] = useState(false);

  const router = useRouter();

  const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});
  const toggleReview = (index: number) => {
    setExpanded((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const { dialogue, dialogueType } = useSelector(
    (state: RootStore) => state.dialogue,
  );
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const { hostRequest, totalHostRequest, countryData } = useSelector(
    (state: RootStore) => state.hostRequest,
  );
  const [selectedAgency, setSelectedAgency] = useState<string>(""); // Ensure it's a string

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  useEffect(() => {
    if (dialogueType === "assignagency" && !hasFetchedAgencyList) {
      dispatch(getAgencyList());
      setHasFetchedAgencyList(true);
    }
  }, [dialogueType, dispatch, hasFetchedAgencyList]);

  const handleAccepteHostRequest = async () => {
    if (selectedId) {
      const payload = {
        requestId: selectedId?._id,
        agencyId: selectedId?.userId,
      };
      dispatch(hostRequestUpdate(payload));
      setShowDialog(false);
    }
  };

  useEffect(() => {
    const payload = {
      start: page,
      limit: rowsPerPage,
      status: 1,
        search,
    };
    dispatch(getHostRequest(payload));
  }, [page, type , search]);

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

  const handleOpenAgencyDialog = (row: any) => {
    if (row?.agencyId === null) {
      dispatch(
        openDialog({ type: "assignagency", data: { row, type: "expert" } }),
      );
    }
  };

  const handleFilterData = (filteredData: any) => {
    setPage(1);
    if (typeof filteredData === "string") {
      setSearch(filteredData);
    } else {
      setData(filteredData);
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
        const updatedImagePath = row?.image
          ? row.image.replace(/\\/g, "/")
          : "";

        const handleClick = () => {
          router.push({
            pathname: "/Host/HostInfoPage",
            query: { id: row?._id },
          });
        };

        return (
          <div
            className="d-flex justify-content-end align-items-center cursor-pointer"
            onClick={handleClick}
          >
            {/* Image Section */}
            <div style={{ width: "100px", textAlign: "center" }}>
              <img
                src={row?.image ? baseURL + updatedImagePath : male.src}
                alt="Image"
                width="60"
                height="60"
                style={{ borderRadius: "50px", objectFit: "cover" }} // Styling for better appearance
                onError={(e: any) => {
                  e.target.onerror = null;
                  e.target.src = male.src;
                }}
              />
            </div>

            {/* Product Name */}
            <div style={{ width: "200px", textAlign: "start" }}>
              <p className="text-capitalize ms-3 cursorPointer text-nowrap">
                {row?.name || "-"}
              </p>
              <p className="text-capitalize ms-3 cursorPointer text-nowrap">
                {row?.uniqueId || "-"}
              </p>
            </div>
          </div>
        );
      },
    },

    {
      Header: "User",
      accessor: "User",
      Cell: ({ row }: { row: any }) => {
        // Define updatedImagePath before returning JSX
        const updatedImagePath = row?.userId?.image
          ? row.userId?.image.replace(/\\/g, "/")
          : "";

        const handleClick = () => {
          router.push({
            pathname: "/User/UserInfoPage",
            query: { id: row?.userId?._id },
          });
        };

        return (
          <div
            className="d-flex justify-content-end align-items-center fw-normal cursor-pointer"
            onClick={handleClick}
          >
            {/* Image Section */}
            <div style={{ width: "100px", textAlign: "center" }}>
              <img
                src={row?.userId?.image ? updatedImagePath : male.src}
                alt="Image"
                width="60"
                height="60"
                style={{ borderRadius: "50px", objectFit: "cover" }} // Styling for better appearance
                onError={(e: any) => {
                  e.target.onerror = null;
                  e.target.src = male.src;
                }}
              />
            </div>

            {/* Product Name */}
            <div style={{ width: "200px", textAlign: "start" }}>
              <p className="text-capitalize ms-3 cursorPointer text-nowrap">
                {row?.userId?.name || "-"}
              </p>
              <p className="text-capitalize ms-3 cursorPointer text-nowrap">
                {row?.userId?.uniqueId || "-"}
              </p>
            </div>
          </div>
        );
      },
    },

    {
      Header: "Impression",
      Cell: ({ row, index }: { row: SuggestedServiceData; index: any }) => {
        const isExpanded = expanded[index] || false;
        const impressionText = String(row?.impression || ""); // Convert to string
        const previewText = impressionText.substring(0, 35); // First 30 chars

        return (
          <span className="text-capitalize padding-left-2px">
            {isExpanded ? impressionText : previewText || "-"}
            {impressionText.length > 10 && (
              <span
                onClick={() => toggleReview(index)}
                className="text-primary bg-none"
                style={{ cursor: "pointer", marginLeft: "5px" }}
              >
                {isExpanded && impressionText.length > 10
                  ? " Read less"
                  : " Read more..."}
              </span>
            )}
          </span>
        );
      },
    },

    {
      Header: "Identity Proof Type",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">{row?.identityProofType || "-"}</span>
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
            <div style={{ width: "150px", textAlign: "start" }}>
              <span className="text-capitalize text-nowrap">{countryName}</span>
            </div>
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
        <div>
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
        </div>
      ),
    },

    {
      Header: "Assign Agency",
      Cell: ({ row }: { row: any }) => (
        <span className="d-flex justify-content-center">
          <button
            className="me-2"
            style={{
              backgroundColor: "#CDE7FF",
              borderRadius: "8px",
              padding: "8px",
            }}
            onClick={() => handleOpenAgencyDialog(row)}
          >
            <img
              src={agencyImage.src}
              alt="Agency-Image"
              height={22}
              width={22}
            />
          </button>
        </span>
      ),
    },
  ];

  return (
    <div className="mainCategory">
      <div className="d-flex w-100 justify-content-end mb-3">
        <div style={{ width: 600 }}>
          <Searching
            type={`server`}
            data={hostRequest}
            setData={setData}
            column={pendingHostRequest}
            serverSearching={handleFilterData}
            placeholder={"Search by Host Name/Unique ID"}
          />
        </div>
      </div>
      {dialogueType === "reason" && <HostReasonDialog />}
      {dialogueType == "assignagency" && (
        <AssignAgencyToDialog
          selectedAgency={selectedAgency}
          setSelectedAgency={setSelectedAgency}
        />
      )}
      <CommonDialog
        open={showDialog}
        onCancel={() => setShowDialog(false)}
        onConfirm={handleAccepteHostRequest}
        text={"Accept"}
      />

      <div>
        <div style={{ marginBottom: "32px" }}>
          <Table
            data={hostRequest}
            mapData={pendingHostRequest}
            PerPage={rowsPerPage}
            Page={page}
            type={"server"}
            shimmer={<HostRequsetShimmer />}
          />
        </div>
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

export default PendingHostRequest;
