import Pagination from "@/extra/Pagination";
import Table from "@/extra/Table";
import { openDialog } from "@/store/dialogSlice";
import { RootStore } from "@/store/store";
import { warning, warningForAccept } from "@/utils/Alert";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import info from "@/assets/images/info.svg";
import { baseURL } from "@/utils/config";
import male from "@/assets/images/male.png";
import ToggleSwitch from "@/extra/TogggleSwitch";
import RootLayout from "@/component/layout/Layout";
import Analytics from "@/extra/Analytic";
import Searching from "@/extra/Searching";
import historyInfo from "@/assets/images/history1.png";
import { blockUnblockHost, getRealOrFakeHost } from "@/store/hostSlice";
import notification from "@/assets/images/notification1.svg";
import { blockonlinebusyHost, getAgencyWiseHost } from "@/store/agencySlice";
import UserShimmer from "@/component/shimmer/UserShimmer";
import { formatCoins } from "@/utils/Common";

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

const Host = () => {
  const dispatch = useDispatch();
  const [startDate, setStartDate] = useState("All");
  const [endDate, setEndDate] = useState("All");
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
  const { agencyWiseHost, totalagencyWiseHost } = useSelector(
    (state: RootStore) => state.agency
  );
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  useEffect(() => {
    const payload = {
      limit: rowsPerPage,
      start: page,
      search
    };
    dispatch(getAgencyWiseHost(payload));
  }, [search, rowsPerPage, page]);

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event, 10));
    setPage(1);
  };

  const handleInfo = (row: any) => {
    router.push({
      pathname: "/Host/HostInfo",
      query: { id: row?._id },
    });

    typeof window !== "undefined" &&
      localStorage.setItem("hostData", JSON.stringify(row));
  };

  const handleRedirect = (row: any) => {
    router.push({
      pathname: "/Host/HostHistoryPage",
      query: { id: row?._id, type: "host" },
    });

    typeof window !== "undefined" &&
      localStorage.setItem("hostData", JSON.stringify(row));
  };

  const handleNotify = (id: any) => {
    dispatch(openDialog({ type: "notification", data: { id, type: "host" } }));
  };

  const handleFilterData = (filteredData: any) => {
    setPage(1);
    if (typeof filteredData === "string") {
      setSearch(filteredData);
    } else {
      setData(filteredData);
    }
  };

  const userTable = [
    {
      Header: "No",
      Cell: ({ index }: { index: any }) => (
        <span> {(page - 1) * rowsPerPage + parseInt(index) + 1}</span>
      ),
    },

    {
      Header: "Unique Id",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize fw-normal">
          {row?.uniqueId || "-"}
        </span>
      ),
    },

    {
      Header: "Host",
      body: "profilePic",
      Cell: ({ row }: { row: any }) => {
        const updatedImagePath = row?.image
          ? row.image.replace(/\\/g, "/")
          : "";

        return (
          <div style={{ cursor: "pointer" }}>
            <div className="d-flex px-2 py-1">
              <div>
                <img
                  src={row?.image ? baseURL + updatedImagePath : male.src}
                  alt="Image"
                  loading="eager"
                  draggable="false"
                  style={{
                    borderRadius: "50%",
                    objectFit: "cover",
                    height: "50px",
                    width: "50px",
                  }}
                  height={70}
                  width={70}
                />
              </div>
              <div className="d-flex flex-column justify-content-center text-start ms-3">
                <span className="mb-0 text-sm text-capitalize">
                  {row?.name || "-"}
                </span>
              </div>
            </div>
          </div>
        );
      },
    },

    {
      Header: "Gender",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize fw-normal">{row?.gender || "-"}</span>
      ),
    },

    {
      Header: "Identity Proof Type",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize fw-normal">
          {row?.identityProofType || "-"}
        </span>
      ),
    },

    {
      Header: "Impression",
      Cell: ({ row, index }: { row: SuggestedServiceData; index: any }) => {
        const isExpanded = expanded[index] || false;
        const impressionText = String(row?.impression || ""); // Convert to string
        const previewText = impressionText.substring(0, 50); // First 30 chars

        return (
          <div className="text-capitalize fw-normal padding-left-2px">
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
      Header: "Coin",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize fw-normal">
          {formatCoins(row?.coin)}
        </span>
      ),
    },

    {
      Header: "Online",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize fw-normal">
          {row?.isOnline === true ? "Yes" : "No"}
        </span>
      ),
    },

    {
      Header: "Busy",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize fw-normal">
          {row?.isBusy === true ? "Yes" : "No"}
        </span>
      ),
    },

    {
      Header: "Live",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize fw-normal">
          {row?.isLive === true ? "Yes" : "No"}
        </span>
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

    {
      Header: "Block",
      body: "isBlock",
      Cell: ({ row }: { row: any }) => (
        <ToggleSwitch
          value={row?.isBlock}
          onClick={() => {
            
            const id: any = row?._id;
            const payload = {
              hostId: id,
              type: "isBlock",
            };
            dispatch(blockonlinebusyHost(payload));
          }}
        />
      ),
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
            <img
              src={info.src}
              height={22}
              width={22}
              alt="Info-Image"
              style={{ height: "22px", width: "22px", objectFit: "contain" }}
              className="iconsize"
            />
          </button>
        </span>
      ),
    },

    {
      Header: "Noification",
      body: "",
      Cell: ({ row }: { row: any }) => (
        <button
          className="text-white"
          onClick={() => handleNotify(row?._id)}
          style={{
            borderRadius: "12px",
            padding: "8px",
            background: "#FFEFE1",
          }}
        >
          <img
            src={notification.src}
            width={22}
            height={22}
            style={{ height: "22px", width: "22px", objectFit: "contain" }}
            className="iconsize"
          />
        </button>
      ),
    },

    {
      Header: "History",
      body: "",
      Cell: ({ row }: { row: any }) => (
        <button
          style={{
            borderRadius: "10px",
            padding: "8px",
            background: "#FFE7E7",
          }}
          onClick={() => handleRedirect(row)}
        >
          <img
            src={historyInfo.src}
            height={22}
            width={22}
            alt="History"
            style={{ height: "22px", width: "22px", objectFit: "cover" }}
            className="notificationIconSize"
          />
        </button>
      ),
    },
  ];

  return (
    <div className="mainCategory">
      <div className="mt-4">
        <div className="row align-items-center">
  {/* Left Title */}
  <div className="col-12 col-md-6">
    <div
      className="title text-capitalize"
      style={{ color: "#868686", fontSize: "20px" }}
    >
      Host
    </div>
  </div>

  {/* Right Search */}
  <div className="col-12 col-md-6 d-flex justify-content-end">
    <Searching
      type="server"
      data={agencyWiseHost}
      setData={setData}
      column={userTable}
      serverSearching={handleFilterData}
      placeholder="Search by Host Name/Unique ID"
    />
  </div>
</div>

        <Table
          data={agencyWiseHost}
          mapData={userTable}
          PerPage={rowsPerPage}
          Page={page}
          type={"server"}
          shimmer={<UserShimmer />}
        />
        <Pagination
          type={"server"}
          serverPage={page}
          setServerPage={setPage}
          serverPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          totalData={totalagencyWiseHost}
        />
      </div>
    </div>
  );
};

Host.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default Host;
