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
  const { fakeHost, totalFakeHost, femaleCount, maleCount }: any = useSelector(
    (state: RootStore) => state.host
  );
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
      Cell: ({ index }: { index: any }) => (
        <span>{(page - 1) * rowsPerPage + index + 1}</span>
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
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize fw-normal">{row?.gender || "-"}</span>
      ),
    },

    {
      Header: "Chat Rate",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize fw-normal">{row?.chatRate || 0}</span>
      ),
    },

    {
      Header: "Impression",
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
      Header: "Online",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize fw-normal">
          {row?.isOnline ? "Yes" : "No"}
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

    // {
    //   Header: "IsBusy",
    //   body: "isBusy",
    //   Cell: ({ row }: { row: any }) => (
    //     <ToggleSwitch
    //       value={row?.isBusy}
    //       onClick={() => {
    //         const id: any = row?._id;
    //         const payload = {
    //           hostId: id,
    //           type: "isBusy"
    //         }
    //         dispatch(blockonlinebusyHost(payload));
    //       }}
    //     />
    //   ),
    // },

    // {
    //   Header: "IsLive",
    //   body: "isLive",
    //   Cell: ({ row }: { row: any }) => (
    //     <ToggleSwitch
    //       value={row?.isLive}
    //       onClick={() => {
    //         const id: any = row?._id;
    //         const payload = {
    //           hostId: id,
    //           type: "isLive"
    //         }
    //         dispatch(blockonlinebusyHost(payload));
    //       }}
    //     />
    //   ),
    // },

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
      Header: "Action",
      Cell: ({ row }: { row: any }) => (
        <div className="d-flex mx-auto">
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
          >
            <img src={TrashIcon.src} alt="Trash Icon" width={22} height={22} />
          </button>
        </div>
      ),
    },
  ];

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
