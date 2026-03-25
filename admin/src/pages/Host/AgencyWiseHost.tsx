import RootLayout from "@/component/layout/Layout";
import Analytics from "@/extra/Analytic";
import Pagination from "@/extra/Pagination";
import Searching from "@/extra/Searching";
import Table from "@/extra/Table";
import { getAgencyWiseHost } from "@/store/agencySlice";
import { RootStore } from "@/store/store";
import { baseURL } from "@/utils/config";
import { key } from "@/utils/config";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import male from "@/assets/images/male.png";
import ToggleSwitch from "@/extra/TogggleSwitch";
import { openDialog } from "@/store/dialogSlice";
import { blockonlinebusyHost } from "@/store/hostSlice";
import info from "@/assets/images/info.svg";
import notification from "@/assets/images/notification1.svg";
import historyInfo from "@/assets/images/history1.png";
import { getCountryCodeFromEmoji } from "@/utils/Common";
import india from "@/assets/images/india.png";
import noImg from "@/assets/images/noImg.png";

const AgencyWiseHost = () => {
  const { agencyWiseHost, totalagencyWiseHost } = useSelector(
    (state: RootStore) => state.agency
  );

  const agencyData =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("agencyData") || "null")
      : null;
  

  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [startDate, setStartDate] = useState("All");
  const [endDate, setEndDate] = useState("All");
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const dispatch = useDispatch();
  const router = useRouter();
  const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});
  const [exportType, setExportType] = useState<{ value: string; label: string } | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const toggleReview = (index: number) => {
    setExpanded((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  useEffect(() => {
    const payload = {
      start: page,
      limit: rowsPerPage,
      startDate,
      endDate,
      search,
      agencyId: router?.query?.id,
    };
    if (router?.query?.id) {
      dispatch(getAgencyWiseHost(payload));
    }
  }, [page, rowsPerPage, startDate, endDate, search, router?.query?.id]);

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

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

  const downloadAgencyHostEarnings = async () => {
    try {
      const agencyId = router?.query?.id;
      if (!agencyId) return;
      setIsExporting(true);

      const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
      const uid = typeof window !== "undefined" ? sessionStorage.getItem("uid") : null;

      const qs = new URLSearchParams({
        agencyId: String(agencyId),
        startDate,
        endDate,
      });

      const resp = await fetch(`${baseURL}api/admin/history/exportAgencyHostEarnings?${qs.toString()}`, {
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
      a.download = filenameFromHeader || `agency-host-earnings_${String(agencyId)}.xlsx`;
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

  const agencyWiseHostTable = [
    {
      Header: "No",
      Cell: ({ index }: { index: any }) => (
        <span> {(page - 1) * rowsPerPage + parseInt(index) + 1}</span>
      ),
    },

    {
      Header: "Host",
      body: "profilePic",
      Cell: ({ row }: { row: any }) => {
        const updatedImagePath = row?.image
          ? row.image.replace(/\\/g, "/")
          : row.image;

        const handleClick = () => {
          router.push({
            pathname: "/Host/HostInfoPage",
            query: { id: row?._id },
          });
        };

        return (
          <div style={{ cursor: "pointer" }} onClick={handleClick}>
            <div className="d-flex px-2 py-1 ">
              <div>
                <img
                  src={
                    row?.image
                      ? row.image.includes("http")
                        ? updatedImagePath
                        : baseURL + updatedImagePath
                      : noImg.src
                  }
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
                  onError={(
                    e: React.SyntheticEvent<HTMLImageElement, Event>
                  ) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = noImg.src;
                  }}
                />
              </div>
              <div className="d-flex flex-column justify-content-center text-start ms-3 text-nowrap">
                <p className="mb-0 text-sm text-capitalize">
                  {row?.name || "-"}
                </p>
                <p className="text-capitalize fw-normal">
                  {row?.uniqueId || "-"}
                </p>
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
      Cell: ({ row, index }: { row: any; index: any }) => {
        const isExpanded = expanded[index] || false;
        const impressionText = String(row?.impression || ""); // Convert to string
        const previewText = impressionText.substring(0, 15); // First 30 chars

        return (
          <span className="text-capitalize fw-normal padding-left-2px text-nowrap">
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
                    width: "40px",
                    height: "40px",
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
      Cell: ({ row }: { row: any }) => (
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
            borderRadius: "10px",
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
        <button
          style={{
            borderRadius: "10px",
            background: "#FFE7E7",
            padding: "8px",
          }}
          onClick={() => handleRedirect(row)}
        >
          <img
            src={historyInfo.src}
            height={22}
            width={22}
            alt="History"
            style={{ height: "22px", width: "22px", objectFit: "cover" }}
          />
        </button>
      ),
    },
  ];

  return (
    <div>
      <p
        className="text-theme"
        style={{
          color: "rgb(64, 64, 64)",
          fontSize: "20px",
          fontWeight: "bold",
        }}
      >
        {`${agencyData?.name}'s Host`}
      </p>
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <Analytics
            analyticsStartDate={startDate}
            analyticsStartEnd={endDate}
            analyticsStartDateSet={setStartDate}
            analyticsStartEndSet={setEndDate}
            direction={"start"}
          />

          <div className="d-flex align-items-center gap-2">
            <div style={{ minWidth: "220px" }}>
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
                if (exportType?.value === "excel") downloadAgencyHostEarnings();
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
              }}
            >
              {isExporting ? "Exporting..." : "Download"}
            </button>
          </div>
        </div>

        <div className="col-6 mt-3">
          <Searching
            type={`server`}
            data={agencyWiseHost}
            setData={setData}
            column={agencyWiseHostTable}
            serverSearching={handleFilterData}
            placeholder={"Find Name/UniqueID..."}
          />
        </div>
      </div>
      <Table
        data={agencyWiseHost}
        mapData={agencyWiseHostTable}
        PerPage={rowsPerPage}
        Page={page}
        type={"server"}
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
  );
};

AgencyWiseHost.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default AgencyWiseHost;
