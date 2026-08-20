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
  const { fakeHost, totalFakeHost }: any = useSelector(
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
