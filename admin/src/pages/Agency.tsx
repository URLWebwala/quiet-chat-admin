import RootLayout from "@/component/layout/Layout";
import Button from "@/extra/Button";
import { openDialog } from "@/store/dialogSlice";
import { useDispatch, useSelector } from "react-redux";
import image from "@/assets/images/bannerImage.png";
import { RootStore } from "@/store/store";
import AgencyDialog from "@/component/agency/AgencyDialog";
import { useEffect, useState } from "react";
import { baseURL } from "@/utils/config";
import ToggleSwitch from "@/extra/TogggleSwitch";
import { blockUnblockAgency, getAllAgency } from "@/store/agencySlice";
import { useRouter } from "next/router";
import info from "@/assets/images/info.svg";
import male from "@/assets/images/male.png";
import Table from "@/extra/Table";
import Pagination from "@/extra/Pagination";
import Analytics from "@/extra/Analytic";
import Searching from "@/extra/Searching";
import { getDefaultCurrency } from "@/store/settingSlice";
import EditIcon from "@/assets/images/edit.svg";
import TrashIcon from "@/assets/images/delete.svg";
import Image from "next/image";
import { warning } from "@/utils/Alert";
import agencyWiseHost from "@/assets/images/agencyWiseHost.svg";
import { formatCoins, getCountryCodeFromEmoji } from "@/utils/Common";
import india from "@/assets/images/india.png";
import { setToast } from "@/utils/toastServices";
import AgencyShimmer from "@/component/Shimmer/AgencyShimmer";

const Agency = () => {
  const dispatch = useDispatch();
  const { dialogue, dialogueType } = useSelector(
    (state: RootStore) => state.dialogue,
  );

  const { defaultCurrency } = useSelector((state: RootStore) => state.setting);
  const { agency, total } = useSelector((state: RootStore) => state.agency);
  const router = useRouter();
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [startDate, setStartDate] = useState("All");
  const [endDate, setEndDate] = useState("All");

  useEffect(() => {
    const payload = {
      search,
      start: page,
      limit: rowsPerPage,
      startDate,
      endDate,
    };
    dispatch(getAllAgency(payload));
  }, [search, page, rowsPerPage, startDate, endDate]);

  useEffect(() => {
    dispatch(getDefaultCurrency());
  }, []);

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  const handleInfo = (row: any) => {
    router.push({
      pathname: "/Host/AgencyWiseHost",
      query: { id: row?._id },
    });

    typeof window !== "undefined" &&
      localStorage.setItem("agencyData", JSON.stringify(row));
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

  const agencyTable = [
    {
      Header: "No",
      Cell: ({ index }: { index: any }) => (
        <span> {(page - 1) * rowsPerPage + parseInt(index) + 1}</span>
      ),
    },

    {
      Header: "Agency",
      body: "profilePic",
      Cell: ({ row }: { row: any }) => {
        const updatedImagePath = row?.image
          ? row.image.replace(/\\/g, "/")
          : "";

        return (
          <div className="d-flex justify-content-end align-items-center gap-4 px-2 py-1">
            <div style={{ width: "60px", textAlign: "end" }}>
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
                onError={(e: any) => {
                  e.target.onerror = null;
                  e.target.src = male.src;
                }}
              />
            </div>
            <div style={{ width: "200px", textAlign: "start" }}>
              <p
                className="mb-0  text-capitalize"
                style={{ fontWeight: "500" }}
              >
                {row?.name || "-"}
              </p>
              <p
                className="text-capitalize fw-normal"
                style={{ fontWeight: "400", fontSize: "12px", color: "gray" }}
              >
                {row?.agencyCode || "-"}
              </p>
            </div>
          </div>
        );
      },
    },

    {
      Header: "Commission (%)",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize fw-normal">
          {formatCoins(row?.commission) || 0}
        </span>
      ),
    },

    {
      Header: "Email",
      Cell: ({ row }: { row: any }) => (
        <span className="text-lowercase fw-normal">{row?.email || "-"}</span>
      ),
    },

    {
      Header: "Mobile Number",
      Cell: ({ row }: { row: any }) => (
        <div style={{ width: "200px" }}>
          <span className="text-capitalize fw-normal">
            {row?.countryCode && row?.mobileNumber
              ? `+${row.countryCode} ${row.mobileNumber}`
              : "-"}
          </span>
        </div>
      ),
    },

    {
      Header: "Password",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize fw-normal">
          {row?.password || "-"}
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
          <div className="d-flex justify-content-end align-items-center gap-3">
            {flagImageUrl && (
              <div style={{ width: "70px", textAlign: "end" }}>
                <img
                  src={
                    row?.countryFlagImage ? row?.countryFlagImage : india.src
                  }
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
      Header: "Host Coin",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize fw-normal">
          {formatCoins(row?.hostCoins)}
        </span>
      ),
    },

    {
      Header: `Total Earning (${defaultCurrency?.symbol})`,
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize fw-normal">
          {formatCoins(row?.totalEarnings || 0)}
        </span>
      ),
    },

    {
      Header: "Total Host",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize fw-normal">
          {row?.totalHosts || 0}
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
            dispatch(blockUnblockAgency(id));
          }}
        />
      ),
    },

    {
      Header: "Host",
      Cell: ({ row }: { row: any }) => (
        <div className="cursor-pointer">
          <img
            src={agencyWiseHost.src}
            height={24}
            width={24}
            alt="Info-Image"
            onClick={() => handleInfo(row)}
          />
        </div>
      ),
    },

    {
      Header: "Action",
      Cell: ({ row }: { row: any }) => (
        <span className="d-block mx-auto">
          <button
            className="me-2"
            style={{
              backgroundColor: "#CFF3FF",
              borderRadius: "8px",
              padding: "8px",
            }}
            onClick={() => {
              dispatch(openDialog({ type: "agency", data: row }));
            }}
          >
            <img src={EditIcon.src} alt="Edit Icon" width={22} height={22} />
          </button>
        </span>
      ),
    },
  ];

  return (
    <>
      {dialogueType === "agency" && <AgencyDialog />}

      <div className="d-flex justify-content-between align-items-center">
        <div
          className="title text-capitalized fw-600 "
          style={{ color: "#404040", fontSize: "20px" }}
        >
          Agency
        </div>
        <div className="betBox">
          <Button
            className={`bg-button p-10 text-white m10-bottom `}
            bIcon={image}
            text="Add Agency"
            onClick={() => {
              // if (agency.length >= 1) {
              //   setToast("error", "you are not allowed to add more than one agency!");
              //   return;
              // }
              dispatch(openDialog({ type: "agency" }));
            }}
          />
          {dialogueType === "agency" && <AgencyDialog />}
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
        <div className="col-6 mt-2">
          <Searching
            type={`server`}
            data={agency}
            setData={setData}
            column={agencyTable}
            serverSearching={handleFilterData}
            placeholder={"Search by AgencyCode/Name"}
          />
        </div>
      </div>

      <div className="mt-1">
        <Table
          data={agency}
          mapData={agencyTable}
          PerPage={rowsPerPage}
          Page={page}
          type={"server"}
          shimmer={<AgencyShimmer />}
        />
        <div
          style={{
            marginTop: "30px",
          }}
        >
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
    </>
  );
};

Agency.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};
export default Agency;
