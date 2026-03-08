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
import coin from "@/assets/images/coin.png";
import { formatCoins, getCountryCodeFromEmoji } from "@/utils/Common";
import india from "@/assets/images/india.png";

const UserFollowingList = () => {
  const { userFollowingList, totalFollowingList }: any = useSelector(
    (state: RootStore) => state.user
  );
  const { countryData } = useSelector((state: RootStore) => state.hostRequest);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const userData =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("userData") || "null")
      : null;

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getUserFollowingList(userData?._id));
  }, []);

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event, 10));
    setPage(1);
  };

  const userTable = [
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
        const updatedImagePath = row?.followingId?.image
          ? row.followingId?.image.replace(/\\/g, "/")
          : "";

        return (
          <div style={{ cursor: "pointer" }}>
            <div className="d-flex justify-content-center px-2 py-1">
              <div>
                <img
                  src={
                    row?.followingId?.image
                      ? baseURL + updatedImagePath
                      : male.src
                  }
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
              <div className="d-flex flex-column justify-content-center text-start ms-3">
                <b className="mb-0 text-sm text-capitalize fw-normal">
                  {row?.followingId?.name || "-"}
                </b>
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
          {row?.followingId?.uniqueId || "-"}
        </span>
      ),
    },

    {
      Header: "Country",
      Cell: ({ row }: { row: any }) => {
        const countryName = row?.followingId?.country || "-";
        const emoji = row?.followingId?.countryFlagImage; // e.g., "🇮🇳"
        console.log('emoji: ', emoji);

        const countryCode = getCountryCodeFromEmoji(emoji); // "in"

          // const flagImageUrl = countryCode
        //   ? `https://flagcdn.com/w80/${countryCode}.png`
        //   : null;
        const flagImageUrl = emoji;

        return (
          <div className="d-flex justify-content-center align-items-center gap-3">
            {flagImageUrl && (
              <div style={{ width: "70px", textAlign: "end" }}>
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
            <div style={{ width: "100px", textAlign: "start" }}>
              <span className="text-capitalize text-nowrap">{countryName}</span>
            </div>
          </div>
        );
      },
    },

    {
      Header: "Coin",
      Cell: ({ row }: { row: any }) => (
        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          <div style={{ width: "30px" }}>
            <img src={coin.src} height={25} width={25} />
          </div>
          <div style={{ width: "50px", textAlign: "start" }}>
            <span className="text-capitalize fw-bold">
              {formatCoins(row?.followingId?.coin)}
            </span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mt-4">
        <Table
          data={userFollowingList}
          mapData={userTable}
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
          totalData={totalFollowingList}
        />
      </div>
    </div>
  );
};

UserFollowingList.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default UserFollowingList;
