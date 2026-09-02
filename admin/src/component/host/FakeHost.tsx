import RootLayout from "@/component/layout/Layout";
import Button from "@/extra/Button";
import { openDialog, openMessageDialog } from "@/store/dialogSlice";
import { useDispatch, useSelector } from "react-redux";
import image from "@/assets/images/bannerImage.png";
import messageSvg from "@/assets/images/message-regular.svg";
import { RootStore } from "@/store/store";
import AgencyDialog from "@/component/agency/AgencyDialog";
import { useEffect, useState } from "react";
import { baseURL } from "@/utils/config";
import ToggleSwitch from "@/extra/TogggleSwitch";
import { blockUnblockAgency } from "@/store/agencySlice";
import { useRouter } from "next/router";
import info from "@/assets/images/info.svg";
import female from "@/assets/images/female.png";
import male from "@/assets/images/male.png";
import userIcon from "@/assets/images/user.png";
import Table from "@/extra/Table";
import Pagination from "@/extra/Pagination";
import Analytics from "@/extra/Analytic";
import Searching from "@/extra/Searching";
import HostDialog from "./HostDialog";
import {
  blockonlinebusyHost,
  deleteHost,
  getRealOrFakeHost,
  getMessage,
} from "@/store/hostSlice";
import Image from "next/image";
import { warning } from "@/utils/Alert";
import EditIcon from "@/assets/images/edit.svg";
import TrashIcon from "@/assets/images/delete.svg";
import CommonDialog from "@/utils/CommonDialog";
import MessageDialog from "./MessageDialog";
import FakeHostShimmer from "../Shimmer/FakeHostShimmer";

export const FakeHost = ({ type, hideAddButton = false }: any) => {
  const dispatch = useDispatch();
  const { dialogue, dialogueType } = useSelector(
    (state: RootStore) => state.dialogue
  );
  const {
    fakeHost,
    totalFakeHost,
    femaleCount,
    maleCount,
    totalChatUsers,
    mostInteractiveHost,
    totalAiMessages,
  }: any = useSelector((state: RootStore) => state.host);
  const router = useRouter();
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [startDate, setStartDate] = useState("All");
  const [endDate, setEndDate] = useState("All");
  const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});
  const [showDialog, setShowDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  

  const toggleReview = (index: number) => {
    setExpanded((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const flagImages =
    fakeHost
      ?.map((fakeHost: any) => fakeHost?.countryFlagImage?.toUpperCase())
      .filter(Boolean) || [];

  useEffect(() => {
    const payload = {
      start: page,
      limit: rowsPerPage,
      startDate,
      endDate,
      search,
      type: 2,
    };
    if (type === "fake_host") {
      dispatch(getRealOrFakeHost(payload));
    }
  }, [page, rowsPerPage, startDate, endDate, search, type]);

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  const handleInfo = (row: any) => {
    router.push({
      pathname: "/Host/HostInfoPage",
      query: { id: row?._id, type: "fakeHost" },
    });

    typeof window !== "undefined" &&
      localStorage.setItem("hostData", JSON.stringify(row));
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
      setStartDate(filteredData?.startDate || "All");
      setEndDate(filteredData?.endDate || "All");
    }
  };

  const confirmDelete = async () => {
    if (selectedId) {
      dispatch(deleteHost(selectedId));
      setShowDialog(false);
    }
  };
  const handleDelete = (id: any) => {
 

    setSelectedId(id);
    setShowDialog(true);
  };

  const fakeHostTable = [
    {
      Header: "No",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ index }: { index: any }) => (
        <span>{(page - 1) * rowsPerPage + index + 1}</span>
      ),
    },
    {
      Header: "Unique Id",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize fw-semibold text-primary">
          {row?.uniqueId || "-"}
        </span>
      ),
    },

    {
      Header: "Host",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => {
        const isFemale = row?.gender?.toLowerCase() === "female";
        const defaultAvatar = isFemale ? female.src : male.src;

        const hasCustomImage =
          row?.image &&
          typeof row.image === "string" &&
          row.image.trim() !== "" &&
          !row.image.endsWith("male.png") &&
          !row.image.endsWith("female.png");

        const initialSrc = hasCustomImage
          ? row.image.startsWith("http")
            ? row.image
            : baseURL + row.image.replace(/\\/g, "/")
          : defaultAvatar;

        const [imgSrc, setImgSrc] = useState(initialSrc);

        useEffect(() => {
          setImgSrc(initialSrc);
        }, [initialSrc]);

        return (
          <div style={{ cursor: "pointer" }}>
            <div className="d-flex px-2 py-1 align-items-center justify-content-center">
              <div>
                <img
                  src={imgSrc}
                  onError={() => setImgSrc(defaultAvatar)}
                  alt={row?.name || "Host"}
                  loading="eager"
                  draggable="false"
                  style={{
                    borderRadius: "50px",
                    objectFit: "cover",
                    height: "40px",
                    width: "40px",
                  }}
                  height={40}
                  width={40}
                />
              </div>
              <div className="d-flex flex-column justify-content-center text-start ms-2">
                <span className="mb-0 text-sm fw-semibold text-capitalize text-dark">
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
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize fw-normal">{row?.gender || "-"}</span>
      ),
    },

    {
      Header: "Connected Users",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => {
        const totalUsers = row?.totalUsers || 0;
        const regularUsers = row?.regularUsers || 0;
        return (
          <div className="d-flex flex-column align-items-center justify-content-center py-1">
            <span
              className="fw-bold text-dark d-inline-flex align-items-center gap-1"
              style={{ fontSize: "15px", letterSpacing: "0.2px" }}
            >
              <i className="ri-user-smile-fill text-primary" style={{ fontSize: "17px" }}></i>
              <span>{totalUsers} {totalUsers === 1 ? "User" : "Users"}</span>
            </span>
            <span
              className="badge rounded-pill mt-1.5 d-inline-flex align-items-center gap-1"
              style={{
                backgroundColor: regularUsers > 0 ? "#DCFCE7" : "#F1F5F9",
                color: regularUsers > 0 ? "#15803D" : "#64748B",
                fontSize: "12.5px",
                fontWeight: 600,
                padding: "4px 10px",
                border: regularUsers > 0 ? "1px solid #BBF7D0" : "1px solid #E2E8F0",
              }}
              title="Users with regular chat interactions"
            >
              <i className="ri-repeat-2-line" style={{ fontSize: "13px" }}></i>
              {regularUsers} Regular
            </span>
          </div>
        );
      },
    },

    {
      Header: "Message Stats",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => {
        const hostSent = row?.hostSentMessages || 0;
        const totalMsgs = row?.totalMessages || 0;
        return (
          <div className="d-flex flex-column align-items-center justify-content-center py-1">
            <span
              className="badge rounded-pill mb-1 fw-bold d-inline-flex align-items-center gap-1"
              style={{
                backgroundColor: "#EEF2FF",
                color: "#4338CA",
                fontSize: "13.5px",
                padding: "5px 12px",
                border: "1px solid #C7D2FE",
              }}
              title="Messages sent by this AI Host"
            >
              <i className="ri-send-plane-fill" style={{ fontSize: "14px" }}></i>
              {hostSent} Host Sent
            </span>
            <span
              className="text-secondary fw-semibold d-inline-flex align-items-center gap-1"
              style={{ fontSize: "12.5px" }}
            >
              <span>Total:</span>
              <strong className="text-dark" style={{ fontSize: "13px" }}>{totalMsgs}</strong>
              <span>msgs</span>
            </span>
          </div>
        );
      },
    },

    {
      Header: "Chat Rate",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize fw-bold text-dark">{row?.chatRate || 0}</span>
      ),
    },

    {
      Header: "Impression",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row, index }: { row: any; index: any }) => {
        const isExpanded = expanded[index] || false;
        const impressionText = String(row?.impression || ""); // Convert to string
        const previewText = impressionText.substring(0, 35); // First 35 chars

        return (
          <div
            className="text-capitalize text-center mx-auto"
            style={{ maxWidth: "280px" }}
          >
            {isExpanded ? impressionText : previewText || "-"}
          </div>
        );
      },
    },

    {
      Header: "Type & Language",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => {
        const isGlobal = row?.type === "global";
        return (
          <div className="d-flex flex-column align-items-center justify-content-center gap-1">
            <span
              className="badge rounded-pill px-2.5 py-1"
              style={{
                backgroundColor: isGlobal ? "#EFF6FF" : "#F1F5F9",
                color: isGlobal ? "#1D4ED8" : "#334155",
                fontSize: "11.5px",
                border: isGlobal ? "1px solid #BFDBFE" : "1px solid #E2E8F0",
                fontWeight: 600,
              }}
            >
              {isGlobal ? `Global (${row?.timezone || "UTC"})` : "Local (India)"}
            </span>
            <span className="text-muted" style={{ fontSize: "11px" }}>
              {isGlobal ? (row?.language || "English") : (row?.language || "Hinglish (Roman)")}
            </span>
          </div>
        );
      },
    },

    {
      Header: "Online",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => (
        <span className={`badge ${row?.isOnline ? "bg-success-subtle text-success" : "bg-secondary-subtle text-secondary"}`}>
          {row?.isOnline ? "Yes" : "No"}
        </span>
      ),
    },

    {
      Header: "Created At",
      thClass: "text-center",
      tdClass: "text-center",
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
      Header: "Status",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => {
        const isEnabled = !row?.isBlock;
        return (
          <div className="d-flex align-items-center justify-content-center gap-2">
            <ToggleSwitch
              checked={isEnabled}
              onChange={() => {
                const payload = {
                  hostId: row?._id,
                  type: "isBlock",
                };
                dispatch(blockonlinebusyHost(payload));
              }}
            />
            <span
              className={`badge ${isEnabled ? "bg-success text-white" : "bg-danger text-white"}`}
              style={{ fontSize: "11px", fontWeight: "600", padding: "4px 8px" }}
            >
              {isEnabled ? "Active" : "Disabled"}
            </span>
          </div>
        );
      },
    },

    {
      Header: "Info",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => (
        <div className="d-flex justify-content-center">
          <button
            style={{
              backgroundColor: "#E1F8FF",
              borderRadius: "10px",
              padding: "8px",
            }}
            onClick={() => handleInfo(row)}
            title="Host Details"
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
      ),
    },

    {
      Header: "Action",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => (
        <div className="d-flex justify-content-center align-items-center">
          <button
            className="me-2"
            style={{
              backgroundColor: "#CFF3FF",
              borderRadius: "8px",
              padding: "8px",
            }}
            onClick={() => {
              if (typeof window !== "undefined") {
                localStorage.setItem("editAiHostData", JSON.stringify(row));
              }
              router.push({
                pathname: "/AddAiHost",
                query: { id: row?._id },
              });
            }}
            title="Edit Host"
          >
            <img src={EditIcon.src} alt="Edit Icon" width={22} height={22} />
          </button>
          <button
            style={{
              backgroundColor: "#FFE7E7",
              borderRadius: "8px",
              padding: "8px",
            }}
            onClick={() => handleDelete(row?._id)}
            title="Delete Host"
          >
            <img src={TrashIcon.src} alt="Trash Icon" width={22} height={22} />
          </button>
        </div>
      ),
    },
  ];

  const topHostGender = mostInteractiveHost?.gender?.toLowerCase() === "male";
  const defaultTopHostAvatar = topHostGender ? male.src : female.src;
  const topHostImg = mostInteractiveHost?.image
    ? mostInteractiveHost.image.startsWith("http")
      ? mostInteractiveHost.image
      : baseURL + mostInteractiveHost.image.replace(/\\/g, "/")
    : defaultTopHostAvatar;

  return (
    <>
      <CommonDialog
        open={showDialog}
        onCancel={() => setShowDialog(false)}
        onConfirm={confirmDelete}
        text={"Delete"}
      />

      {!hideAddButton && (
        <div className="d-flex justify-content-end gap-3 align-items-center">
          <div className="betBox">
            <Button
              className={`bg-button p-10 text-white m10-bottom `}
              bIcon={image}
              text="Add Fake Host"
              onClick={() => {
                dispatch(openDialog({ type: "fakeHost" }));
              }}
            />
            {dialogueType === "fakeHost" && <HostDialog />}
          </div>
        </div>
      )}

      {/* ─── Total Female / Male Host Stats Cards ────────────────────── */}
      <div className="row g-3 mb-3 mt-1">
        <div className="col-12 col-sm-6 col-md-6 col-lg-3">
          <div
            className="card border-0 rounded-4 shadow-sm p-3 h-100 position-relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #FFF0F5 0%, #FFE4E6 100%)",
              borderLeft: "4px solid #E11D48",
              boxShadow: "0 4px 15px rgba(225, 29, 72, 0.08)",
              transition: "all 0.25s ease",
            }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted fw-semibold" style={{ fontSize: "13px", letterSpacing: "0.2px" }}>
                  Total Female Hosts
                </span>
                <h3 className="mb-0 mt-1 fw-bold" style={{ color: "#E11D48", fontSize: "26px" }}>
                  {femaleCount ?? (fakeHost?.filter((h: any) => h?.gender?.toLowerCase() === "female").length || 0)}
                </h3>
                <span
                  className="badge rounded-pill mt-2 d-inline-flex align-items-center gap-1 px-2 py-1"
                  style={{ backgroundColor: "#FFE4E6", color: "#BE123C", fontSize: "11px", fontWeight: 600 }}
                >
                  <i className="ri-women-line"></i> Female Profiles
                </span>
              </div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                style={{
                  width: "50px",
                  height: "50px",
                  background: "linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)",
                  boxShadow: "0 6px 16px rgba(225, 29, 72, 0.25)",
                }}
              >
                <Image src={female} alt="Female Host" width={30} height={30} style={{ borderRadius: "50%", objectFit: "cover" }} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-6 col-lg-3">
          <div
            className="card border-0 rounded-4 shadow-sm p-3 h-100 position-relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
              borderLeft: "4px solid #2563EB",
              boxShadow: "0 4px 15px rgba(37, 99, 235, 0.08)",
              transition: "all 0.25s ease",
            }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted fw-semibold" style={{ fontSize: "13px", letterSpacing: "0.2px" }}>
                  Total Male Hosts
                </span>
                <h3 className="mb-0 mt-1 fw-bold" style={{ color: "#2563EB", fontSize: "26px" }}>
                  {maleCount ?? (fakeHost?.filter((h: any) => h?.gender?.toLowerCase() === "male").length || 0)}
                </h3>
                <span
                  className="badge rounded-pill mt-2 d-inline-flex align-items-center gap-1 px-2 py-1"
                  style={{ backgroundColor: "#DBEAFE", color: "#1D4ED8", fontSize: "11px", fontWeight: 600 }}
                >
                  <i className="ri-men-line"></i> Male Profiles
                </span>
              </div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                style={{
                  width: "50px",
                  height: "50px",
                  background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                  boxShadow: "0 6px 16px rgba(37, 99, 235, 0.25)",
                }}
              >
                <Image src={male} alt="Male Host" width={30} height={30} style={{ borderRadius: "50%", objectFit: "cover" }} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-6 col-lg-3">
          <div
            className="card border-0 rounded-4 shadow-sm p-3 h-100 position-relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
              borderLeft: "4px solid #10B981",
              boxShadow: "0 4px 15px rgba(16, 185, 129, 0.08)",
              transition: "all 0.25s ease",
            }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted fw-semibold" style={{ fontSize: "13px", letterSpacing: "0.2px" }}>
                  Total Chat Users
                </span>
                <h3 className="mb-0 mt-1 fw-bold" style={{ color: "#059669", fontSize: "26px" }}>
                  {totalChatUsers || 0}
                </h3>
                <span
                  className="badge rounded-pill mt-2 d-inline-flex align-items-center gap-1 px-2 py-1"
                  style={{ backgroundColor: "#D1FAE5", color: "#047857", fontSize: "11px", fontWeight: 600 }}
                >
                  <i className="ri-user-voice-line"></i> Interacting Users
                </span>
              </div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                style={{
                  width: "50px",
                  height: "50px",
                  background: "linear-gradient(135deg, #34D399 0%, #10B981 100%)",
                  boxShadow: "0 6px 16px rgba(16, 185, 129, 0.25)",
                }}
              >
                <Image src={userIcon} alt="Chat Users" width={28} height={28} style={{ objectFit: "contain" }} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-6 col-lg-3">
          <div
            className="card border-0 rounded-4 shadow-sm p-3 h-100 position-relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)",
              borderLeft: "4px solid #8B5CF6",
              boxShadow: "0 4px 15px rgba(139, 92, 246, 0.08)",
              transition: "all 0.25s ease",
            }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div style={{ maxWidth: "calc(100% - 55px)" }}>
                <span className="text-muted fw-semibold" style={{ fontSize: "13px", letterSpacing: "0.2px" }}>
                  Top Interactive Host
                </span>
                <h3 className="mb-0 mt-1 fw-bold text-truncate" style={{ color: "#7C3AED", fontSize: "22px" }} title={mostInteractiveHost?.name || "None"}>
                  {mostInteractiveHost?.name || "None"}
                </h3>
                <span
                  className="badge rounded-pill mt-2 d-inline-flex align-items-center gap-1 px-2 py-1 text-truncate"
                  style={{ backgroundColor: "#EDE9FE", color: "#6D28D9", fontSize: "11px", fontWeight: 600, maxWidth: "100%" }}
                >
                  <i className="ri-fire-line"></i> {mostInteractiveHost?.userCount || 0} Users • {mostInteractiveHost?.messageCount || 0} Msgs
                </span>
              </div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center shadow-sm flex-shrink-0"
                style={{
                  width: "50px",
                  height: "50px",
                  background: "linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)",
                  boxShadow: "0 6px 16px rgba(139, 92, 246, 0.25)",
                }}
              >
                <img
                  src={topHostImg}
                  alt={mostInteractiveHost?.name || "Top Host"}
                  width={34}
                  height={34}
                  style={{ borderRadius: "50%", objectFit: "cover" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center">
        <Analytics
          analyticsStartDate={startDate}
          analyticsStartEnd={endDate}
          analyticsStartDateSet={setStartDate}
          analyticsStartEndSet={setEndDate}
          direction={"start"}
        />
        <div className="col-6 mt-3">
          <Searching
            type={`server`}
            data={fakeHost}
            setData={setData}
            column={fakeHostTable}
            serverSearching={handleFilterData}
            placeholder={"Search by Host Name/Unique ID"}
          />
        </div>
      </div>

      <div className="mt-1">
        <div style={{ marginBottom: "32px" }}>
            <Table
              data={fakeHost}
              mapData={fakeHostTable}
              PerPage={rowsPerPage}
              Page={page}
              type={"server"}
              shimmer={<FakeHostShimmer />}
            />
        </div>
        <Pagination
          type={"server"}
          serverPage={page}
          setServerPage={setPage}
          serverPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          totalData={totalFakeHost}
        />
      </div>
    </>
  );
};
