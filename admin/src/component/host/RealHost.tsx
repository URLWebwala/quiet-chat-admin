import Pagination from "@/extra/Pagination";
import Table from "@/extra/Table";
import { openDialog } from "@/store/dialogSlice";
import { RootStore } from "@/store/store";
import { warning, warningForAccept } from "@/utils/Alert";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import info from "@/assets/images/info.svg";
import { baseURL, key } from "@/utils/config";
import male from "@/assets/images/male.png";
import ToggleSwitch from "@/extra/TogggleSwitch";
import RootLayout from "@/component/layout/Layout";
import Analytics from "@/extra/Analytic";
import Searching from "@/extra/Searching";
import historyInfo from "@/assets/images/history1.png";
import {
  blockonlinebusyHost,
  blockRealHost,
  blockUnblockHost,
  getRealOrFakeHost,
  terminateHostLive,
} from "@/store/hostSlice";
import notification from "@/assets/images/notification1.svg";
import Image from "next/image";
import { formatCoins, getCountryCodeFromEmoji } from "@/utils/Common";
import india from "@/assets/images/india.png";
import HostShimmer from "../Shimmer/HostShimmer";
import Select from "react-select";

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

type HostPresenceFilter = "all" | "online" | "live" | "on_call";

const PRESENCE_FILTERS: { key: HostPresenceFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "online", label: "Online" },
  { key: "live", label: "Live" },
  { key: "on_call", label: "On Call" },
];

function hostPresenceFromQuery(query: {
  hostStatus?: string | string[];
}): HostPresenceFilter {
  const raw = query.hostStatus;
  const q = Array.isArray(raw) ? raw[0] : raw;
  const s = typeof q === "string" ? q.toLowerCase() : "";
  if (s === "online" || s === "live" || s === "on_call") return s;
  return "all";
}

export const RealHost = (props: any) => {
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
  const { host, total } = useSelector((state: RootStore) => state.host);
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [exportType, setExportType] = useState<{ value: string; label: string } | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [terminatingHostId, setTerminatingHostId] = useState<string | null>(null);

  const presenceFilter: HostPresenceFilter = router.isReady
    ? hostPresenceFromQuery(router.query)
    : "all";

  const setPresenceFilter = (key: HostPresenceFilter) => {
    setPage(1);
    const q: Record<string, string | string[] | undefined> = { ...router.query };
    if (key === "all") delete q.hostStatus;
    else q.hostStatus = key;
    router.replace({ pathname: router.pathname, query: q }, undefined, { shallow: true });
  };

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  useEffect(() => {
    if (!router.isReady) return;
    const status = hostPresenceFromQuery(router.query);
    dispatch(
      getRealOrFakeHost({
        start: page,
        limit: rowsPerPage,
        startDate,
        endDate,
        search,
        type: 1,
        status,
      })
    );
  }, [
    router.isReady,
    router.query.hostStatus,
    page,
    rowsPerPage,
    startDate,
    endDate,
    search,
  ]);

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event, 10));
    setPage(1);
  };

  const handleFilterData = (filteredData: any) => {
    setPage(1);
    if (typeof filteredData === "string") {
      setSearch(filteredData);
    } else {
      setData(filteredData);
    }
  };

  const handleInfo = (row: any) => {
    router.push({
      pathname: "/Host/HostInfoPage",
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

  const handleTerminateLive = async (row: any) => {
    const hid = row?._id;
    if (!hid) return;
    const { isConfirmed } = await warning("Terminate");
    if (!isConfirmed) return;
    setTerminatingHostId(String(hid));
    try {
      const resultAction = await dispatch(terminateHostLive({ hostId: String(hid) }));
      if (
        terminateHostLive.fulfilled.match(resultAction) &&
        (resultAction.payload as any)?.status &&
        router.isReady
      ) {
        dispatch(
          getRealOrFakeHost({
            start: page,
            limit: rowsPerPage,
            startDate,
            endDate,
            search,
            type: 1,
            status: hostPresenceFromQuery(router.query),
          })
        );
      }
    } finally {
      setTerminatingHostId(null);
    }
  };

  const downloadAllHostsEarnings = async () => {
    try {
      setIsExporting(true);
      const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
      const uid = typeof window !== "undefined" ? sessionStorage.getItem("uid") : null;

      const qs = new URLSearchParams({
        startDate,
        endDate,
      });

      const resp = await fetch(`${baseURL}api/admin/history/exportAllHostsEarnings?${qs.toString()}`, {
        method: "GET",
        headers: {
          key,
          Authorization: token ? `Bearer ${token}` : "",
          "x-admin-uid": uid || "",
        } as any,
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(errText || "Export failed");
      }

      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);

      const filenameFromHeader = resp.headers
        .get("content-disposition")
        ?.split("filename=")?.[1]
        ?.replaceAll('"', "")
        ?.trim();

      const a = document.createElement("a");
      a.href = url;
      a.download = filenameFromHeader || `all-hosts-earnings.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const userTable = [
    {
      Header: "No",
      cellStyle: { paddingLeft: "10px !important" },
      Cell: ({ index }: { index: any }) => (
        <p> {(page - 1) * rowsPerPage + parseInt(index) + 1}</p>
      ),
    },
    {
      Header: "Agency",
      Cell: ({ row }: { row: any }) => {
        const updatedImagePath = row?.agencyId?.image
          ? row.agencyId?.image.replace(/\\/g, "/")
          : "";
        return (
          <div className="d-flex justify-content-end align-items-center">
            <div style={{ width: "100px", textAlign: "center" }}>
              <img
                src={
                  row?.agencyId?.image ? baseURL + updatedImagePath : male.src
                }
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
            <div style={{ width: "200px", textAlign: "start" }}>
              <p
                className="text-capitalize text-nowrap font-normal"
                style={{ fontWeight: "500" }}
              >
                {row?.agencyId?.name
                  ? row?.agencyId?.name
                  : row?.agency?.name || "-"}
              </p>
              <p
                className="text-capitalize cursorPointer text-nowrap"
                style={{ fontWeight: "400", fontSize: "12px", color: "gray" }}
              >
                {row?.agencyId?.agencyCode || "-"}
              </p>
            </div>
          </div>
        );
      },
    },

    {
      Header: "Host",
      body: "profilePic",
      Cell: ({ row }: { row: any }) => {
        const updatedImagePath = row?.image
          ? row.image.replace(/\\/g, "/")
          : "";

        // const handleClick = () => {
        //   router.push({
        //     pathname: "/Host/HostInfoPage",
        //     query: { id: row?._id },
        //   });
        // };
        return (
          <div style={{ cursor: "pointer" }} onClick={() => handleInfo(row)}>
            <div className="d-flex px-2 py-1">
              <div>
                <img
                  src={row?.image ? baseURL + updatedImagePath : male.src}
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
                    e.target.error = null;
                    e.target.src = male.src;
                  }}
                  height={70}
                  width={70}
                />
              </div>
              <div className="d-flex flex-column justify-content-center text-start ms-3 text-nowrap">
                <p
                  className="mb-0  text-capitalize"
                  style={{ fontWeight: "500", fontSize: "14px" }}
                >
                  {row?.name || "-"}
                </p>

                <p
                  className="mb-0  text-capitalize"
                  style={{ fontWeight: "400", fontSize: "12px", color: "gray" }}
                >
                  {row?.uniqueId || "-"}
                </p>
              </div>
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
            className="d-flex justify-content-end align-items-center cursor-pointer"
            onClick={handleClick}
          >
            {/* Image Section */}
            <div style={{ width: "60px", textAlign: "center" }}>
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
              <p
                className="text-capitalize ms-3 cursorPointer text-nowrap"
                style={{ fontWeight: "500", fontSize: "14px" }}
              >
                {row?.userId?.name || "-"}
              </p>
              <p
                className="text-capitalize ms-3 cursorPointer text-nowrap"
                style={{ fontWeight: "400", fontSize: "12px", color: "gray" }}
              >
                {row?.userId?.uniqueId || "-"}
              </p>
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
                    borderRadius: "50px",
                    border: "1px solid #ccc",
                  }}
                />
              </div>
            )}
            <div style={{ width: "100px", textAlign: "start" }}>
              <span className="text-capitalize text-nowrap">{countryName}</span>
            </div>
          </div>
        );
      },
    },
    {
      Header: "Followers",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize fw-normal">
          {row?.totalFollowers || 0}
        </span>
      ),
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
        const previewText = impressionText.substring(0, 15); // First 30 chars

        return (
          <div
            className="text-capitalize fw-normal padding-left-2px"
            style={{ width: "250px" }}
          >
            {isExpanded ? impressionText : previewText || "-"}
            {/* {impressionText.length > 10 && (
              <span
                onClick={() => toggleReview(index)}
                className="text-primary bg-none"
                style={{ cursor: "pointer", marginLeft: "5px" }}
              >
                {isExpanded && impressionText.length > 10
                  ? " Read less"
                  : " Read more..."}
              </span>
            )} */}
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
      tdClass: "align-middle",
      Cell: ({ row }: { row: any }) => (
        <div
          className="d-flex flex-row flex-nowrap align-items-center"
          style={{ gap: "8px", minWidth: "max-content", lineHeight: 1.2 }}
        >
          <span className="text-capitalize fw-normal flex-shrink-0">
            {row?.isLive === true ? "Yes" : "No"}
          </span>
          {row?.isLive === true && (
            <button
              type="button"
              className="flex-shrink-0"
              disabled={terminatingHostId === String(row?._id)}
              onClick={(e) => {
                e.stopPropagation();
                handleTerminateLive(row);
              }}
              style={{
                padding: "4px 10px",
                fontSize: "11px",
                fontWeight: 600,
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#FEE2E2",
                color: "#B91C1C",
                cursor: terminatingHostId === String(row?._id) ? "wait" : "pointer",
                whiteSpace: "nowrap",
                opacity: terminatingHostId === String(row?._id) ? 0.7 : 1,
                lineHeight: 1.2,
              }}
            >
              {terminatingHostId === String(row?._id) ? "…" : "Terminate"}
            </button>
          )}
        </div>
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
            dispatch(blockRealHost(payload));
          }}
        />
      ),
    },

    {
      Header: "Info",
      Cell: ({ row }: { row: SuggestedServiceData }) => {
        return (
          <div className="">
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
              />
            </button>
          </div>
        );
      },
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
          />
        </button>
      ),
    },

    {
      Header: "History",
      body: "",
      Cell: ({ row }: { row: any }) => (
        <>
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
              height={30}
              width={30}
              alt="History"
              style={{ height: "24px", width: "24px", objectFit: "cover" }}
            />
          </button>
        </>
      ),
    },
  ];
  return (
    <div className="mainCategory">
      <div
        className="d-flex align-items-center gap-2 w-100 flex-nowrap pb-2"
        style={{ overflowX: "auto" }}
      >
        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          <Analytics
            analyticsStartDate={startDate}
            analyticsStartEnd={endDate}
            analyticsStartDateSet={setStartDate}
            analyticsStartEndSet={setEndDate}
            direction={"start"}
          />
        </div>

        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          <div style={{ minWidth: "200px", width: 200 }}>
            <Select
              isDisabled={isExporting}
              value={exportType}
              onChange={(opt) => setExportType(opt as any)}
              options={[{ value: "excel", label: "Excel (.xlsx)" }]}
              placeholder="Export..."
              isSearchable={false}
              styles={{
                control: (base, state) => ({
                  ...base,
                  minHeight: 38,
                  height: 38,
                  borderRadius: 10,
                  borderColor: state.isFocused ? "#8F6DFF" : "#E6E6E6",
                  boxShadow: state.isFocused ? "0 0 0 2px #8F6DFF24" : "none",
                  cursor: state.isDisabled ? "not-allowed" : "pointer",
                }),
                valueContainer: (base) => ({ ...base, height: 38, padding: "0 10px" }),
                input: (base) => ({ ...base, margin: 0, padding: 0 }),
                indicatorsContainer: (base) => ({ ...base, height: 38 }),
                placeholder: (base) => ({ ...base, color: "#666" }),
                singleValue: (base) => ({ ...base, color: "#222", fontWeight: 500 }),
                menu: (base) => ({ ...base, borderRadius: 12, overflow: "hidden", zIndex: 50 }),
                option: (base, state) => ({
                  ...base,
                  cursor: "pointer",
                  backgroundColor: state.isSelected ? "#8F6DFF" : state.isFocused ? "#8F6DFF14" : "white",
                  color: state.isSelected ? "white" : "#222",
                }),
              }}
            />
          </div>

          <button
            onClick={() => {
              if (exportType?.value === "excel") downloadAllHostsEarnings();
            }}
            disabled={isExporting || !exportType}
            style={{
              height: "38px",
              borderRadius: "8px",
              padding: "0 14px",
              border: "none",
              background: isExporting || !exportType ? "#E9E9E9" : "#8F6DFF",
              color: "white",
              fontWeight: 600,
              cursor: isExporting || !exportType ? "not-allowed" : "pointer",
              opacity: isExporting || !exportType ? 0.9 : 1,
              flexShrink: 0,
            }}
          >
            {isExporting ? "Exporting..." : "Download"}
          </button>
        </div>

        <div className="d-flex align-items-center gap-1 flex-nowrap flex-shrink-0 ps-1">
          {PRESENCE_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setPresenceFilter(key)}
              style={{
                height: "38px",
                padding: "0 12px",
                borderRadius: "8px",
                border: "none",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                backgroundColor: presenceFilter === key ? "#8F6DFF" : "#ececf4",
                color: presenceFilter === key ? "#fff" : "#333",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div
          className="ms-auto flex-shrink-0 ps-2"
          style={{ minWidth: "min(100%, 280px)", width: "clamp(220px, 32vw, 420px)" }}
        >
          <Searching
            type={`server`}
            data={host}
            setData={setData}
            column={userTable}
            serverSearching={handleFilterData}
            placeholder={"Search by Host Name/Unique ID"}
          />
        </div>
      </div>

      <div className="mt-1">
        <div style={{ marginBottom: "26px" }}>
          <Table
            data={host}
            mapData={userTable}
            PerPage={rowsPerPage}
            Page={page}
            type={"server"}
            shimmer={<HostShimmer />}
          />
        </div>
        <Pagination
          type={"server"}
          serverPage={page}
          setServerPage={setPage}
          serverPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          totalData={total}
        />
      </div>
    </div>
  );
};
