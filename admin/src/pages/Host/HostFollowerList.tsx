import RootLayout from "@/component/layout/Layout";
import Pagination from "@/extra/Pagination";
import Table from "@/extra/Table";
import { RootStore } from "@/store/store";
import { getUserFollowingList } from "@/store/userSlice";
import { baseURL } from "@/utils/config";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import male from "@/assets/images/male.png";
import Image from "next/image";
import { getHostFollowerList } from "@/store/hostSlice";
import coin from "@/assets/images/coin.png";
import { formatCoins, getCountryCodeFromEmoji } from "@/utils/Common";
import india from "@/assets/images/india.png";
import FollowerlistShimmer from "@/component/Shimmer/FollowerlistShimmer";

const HostFollowerList = () => {
  const { countryData } = useSelector((state: RootStore) => state.hostRequest);
  const { hostFollowerList, totalFollowerList } = useSelector(
    (state: RootStore) => state.host
  );
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const hostData =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("hostData") || "null")
      : null;

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getHostFollowerList(hostData?._id));
  }, []);

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event, 10));
    setPage(1);
  };

  const hostTable = [
    {
      Header: "No",
      Cell: ({ index }: { index: any }) => (
        <span> {(page - 1) * rowsPerPage + parseInt(index) + 1}</span>
      ),
    },

    {
      Header: "User",
      body: "profilePic",
      Cell: ({ row }: { row: any }) => {
        const imagePath = row?.followerId?.image || "";
        const updatedImagePath = imagePath.replace(/\\/g, "/");

        // Check if image is a full URL (e.g., from Google)
        const isExternalImage = /^https?:\/\//i.test(updatedImagePath);

        const imageSrc = imagePath
          ? isExternalImage
            ? updatedImagePath
            : baseURL + updatedImagePath
          : male.src;

        return (
          <div style={{ cursor: "pointer" }}>
            <div className="d-flex justify-content-center px-2 py-1">
              <div style={{ width: "100px" }}>
                <img
                  src={imageSrc}
                  alt="Image"
                  loading="eager"
                  draggable="false"
                  style={{
                    borderRadius: "10px",
                    objectFit: "cover",
                    height: "50px",
                    width: "50px",
                  }}
                  height={70}
                  width={70}
                />
              </div>
              <div
                className="d-flex flex-column justify-content-center text-start ms-3"
                style={{ width: "200px", textAlign: "start" }}
              >
                <p className="mb-0 text-sm text-capitalize">
                  {row?.followerId?.name || "-"}
                </p>
              </div>
            </div>
          </div>
        );
      },
    },

    {
      Header: "Unique Id",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize fw-normal">
          {row?.followerId?.uniqueId || "-"}
        </span>
      ),
    },

    {
      Header: "Country",
      Cell: ({ row }: { row: any }) => {
        const countryName = row?.followerId?.country || "-";
        const emoji = row?.followerId?.countryFlagImage; // e.g., "🇮🇳"

        const countryCode = getCountryCodeFromEmoji(emoji); // "in"

        const flagImageUrl = countryCode
          ? `https://flagcdn.com/w80/${countryCode}.png`
          : null;

        return (
          <div className="d-flex justify-content-center align-items-center gap-3">
            {flagImageUrl && (
              <div style={{ width: "180px", textAlign: "end" }}>
                <img
                  src={flagImageUrl ? flagImageUrl : india.src}
                  height={30}
                  width={40}
                  alt={`${countryName} Flag`}
                  style={{
                    objectFit: "cover",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                />
              </div>
            )}
            <div style={{ width: "200px" }}>
              <span className="text-capitalize text-nowrap">{countryName}</span>
            </div>
          </div>
        );
      },
    },

    {
      Header: "Coin",
      Cell: ({ row }: { row: any }) => {
        console.log("row-->", row);
        return (
          <div
            style={{ display: "flex", justifyContent: "center", gap: "10px" }}
          >
            <div style={{ width: "30px" }}>
              <img src={coin.src} height={25} width={25} />
            </div>
            <div style={{ width: "50px", textAlign: "start" }}>
              <span className="text-capitalize fw-bold">
                {formatCoins(row?.followerId?.coin)}
              </span>
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div className="mt-4">
        <div className="mb-5" style={{}}>
          <Table
            data={hostFollowerList}
            mapData={hostTable}
            PerPage={rowsPerPage}
            Page={page}
            type={"server"}
          shimmer={<FollowerlistShimmer />}

          />
        </div>
        <Pagination
          type={"server"}
          serverPage={page}
          setServerPage={setPage}
          serverPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          totalData={totalFollowerList}
        />
      </div>
    </div>
  );
};

HostFollowerList.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default HostFollowerList;
