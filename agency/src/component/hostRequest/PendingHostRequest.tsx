import Pagination from "@/extra/Pagination";
import Table from "@/extra/Table";
import { openDialog } from "@/store/dialogSlice";
import { getHostRequest, hostRequestUpdate } from "@/store/hostRequestSlice";
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
  impression: string;
}

const PendingHostRequest = (props: any) => {
  const dispatch = useDispatch();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<any>(null);
  const router = useRouter();

  const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});
  const toggleReview = (index: number) => {
    setExpanded((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const { dialogue, dialogueType } = useSelector(
    (state: RootStore) => state.dialogue
  );
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const { hostRequest, totalHostRequest, countryData } = useSelector(
    (state: RootStore) => state.hostRequest
  );

  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const handleOpenWithdrawDialogue = (row: any) => {
    dispatch(openDialog({ type: "reason", data: row }));
  };

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  const handleAccepteHostRequest = async () => {
    if (selectedId) {
      const payload = {
        requestId: selectedId?._id,
        userId: selectedId?.userId,
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

  const handleOpenAgencyDialog = (row: any) => {
    if (row?.agencyId === null) {
      dispatch(
        openDialog({ type: "assignagency", data: { row, type: "expert" } })
      );
    }
  };

  const handleActionAccept = (id: any) => {
    setSelectedId(id);
    setShowDialog(true);
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

        return (
          <div className="d-flex justify-content-end align-items-center">
            {/* Image Section */}
            <div style={{ width: "100px", textAlign: "center" }}>
              <img
                src={row?.image ? baseURL + updatedImagePath : male.src}
                alt="Image"
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
        );
      },
    },
    {
      Header: "Impression",
      Cell: ({ row, index }: { row: SuggestedServiceData; index: any }) => {
        const isExpanded = expanded[index] || false;
        const impressionText = String(row?.impression || ""); // Convert to string
        const previewText = impressionText.substring(0, 30); // First 30 chars

        return (
          <div
            className="text-capitalize padding-left-2px"
            style={{ width: "300px" }}
          >
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

    // {
    //     Header: "Assign Agency",
    //     Cell: ({ row }: { row: any }) => (

    //         <span className="d-flex justify-content-center">
    //             <button
    //                 className="py-1 me-2"
    //                 style={{ backgroundColor: "#CDE7FF", borderRadius: "8px" }}
    //                 onClick={() => handleOpenAgencyDialog(row)}
    //             >
    //                 <img
    //                     src={agencyImage.src}
    //                     alt="Agency-Image"
    //                     height={26}
    //                     width={26}
    //                 />
    //             </button>
    //         </span>

    //     )
    // },

    {
      Header: "Action",
      Cell: ({ row }: { row: SuggestedServiceData }) => (
        <div className="d-flex justify-content-center ">
          <button
            className="me-1"
            style={{
              backgroundColor: "#D6FFD7",
              borderRadius: "8px",
              padding: "8px",
            }}
            onClick={() => handleActionAccept(row)}
          >
            <img src={accept.src} height={22} width={22} alt="Accept" />
          </button>
          <button
            style={{
              backgroundColor: "#FFE7E7",
              borderRadius: "8px",
              padding: "8px",
            }}
            onClick={() => handleOpenWithdrawDialogue(row)}
          >
            <img src={decline.src} height={22} width={22} alt="Decline" />
          </button>
        </div>
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
              column={pendingHostRequest}
              serverSearching={handleFilterData}
              placeholder="Search by Host Name / Unique ID"
            />
      </div>
      </div>
      {dialogueType === "reason" && <HostReasonDialog />}
      {dialogueType == "assignagency" && <AssignAgencyToDialog />}
      <CommonDialog
        open={showDialog}
        onCancel={() => setShowDialog(false)}
        onConfirm={handleAccepteHostRequest}
        text={"Accept"}
      />

      <div>
        
        <Table
          data={hostRequest}
          mapData={pendingHostRequest}
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

export default PendingHostRequest;
