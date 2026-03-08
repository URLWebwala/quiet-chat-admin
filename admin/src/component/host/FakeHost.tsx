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

export const FakeHost = ({ type }: any) => {
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
      setData(filteredData);
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

  const agencyTable = [
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
                    borderRadius: "50px",
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

    ,
    // {
    //   Header: "Video",
    //   Cell: ({ row }: { row: any }) => (
    //     <video
    //       controls
    //       style={{ width: "120px", height: "100px" }}
    //       src={baseURL + row?.video[0]}
    //     />
    //   ),
    // },

    {
      Header: "Email",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize fw-normal">{row?.email || "-"}</span>
      ),
    },

    {
      Header: "Gender",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize fw-normal">{row?.gender || "-"}</span>
      ),
    },

    {
      Header: "Impression",
      Cell: ({ row, index }: { row: any; index: any }) => {
        const isExpanded = expanded[index] || false;
        const impressionText = String(row?.impression || ""); // Convert to string
        const previewText = impressionText.substring(0, 30); // First 30 chars

        return (
          <div
            className="text-capitalize padding-left-2px"
            style={{ width: "350px" }}
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
              dispatch(openDialog({ type: "fakeHost", data: row }));
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

      <div className="d-flex justify-content-end  gap-3 align-items-center">
        {/* <div
          className="title text-capitalized fw-600 "
          style={{ color: "#404040", fontSize: "20px" }}
        ></div> */}
        {/* <div className="betBox">
          <Button
            className={`bg-main p-10 text-white m10-bottom `}
            bIcon={image}
            text="Add Male Message"
            onClick={async () => {
              const data = await dispatch(getMessage({ gender: 1 }));
              dispatch(
                openMessageDialog({
                  type: "messageHost",
                  gender: "male",
                  data: data?.payload?.data?.message.toString(),
                })
              );
            }}
          />
          {dialogueType === "messageHost" && <MessageDialog />}
        </div>
        <div className="betBox">
          <Button
            className={`bg-primary p-10 text-white m10-bottom `}
            bIcon={image}
            text="Add Female Message"
            onClick={async () => {
              const data = await dispatch(getMessage({ gender: 2 }));
              dispatch(
                openMessageDialog({
                  type: "messageHost",
                  gender: "female",
                  data: data?.payload?.data?.message.toString(),
                })
              );
            }}
          />
          {dialogueType === "messageHost" && <MessageDialog />}
        </div> */}
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
            column={agencyTable}
            serverSearching={handleFilterData}
            placeholder={"Search by Host Name/Unique ID"}
          />
        </div>
      </div>

      <div className="mt-1">
        <div style={{ marginBottom: "32px" }}>
            <Table
              data={fakeHost}
              mapData={agencyTable}
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
