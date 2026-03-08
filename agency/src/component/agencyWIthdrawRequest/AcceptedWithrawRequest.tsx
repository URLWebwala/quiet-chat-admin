import { RootStore, useAppDispatch } from "@/store/store";
import {  reqAccepted } from "@/utils/Alert";
import { baseURL } from "@/utils/config";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Table from "@/extra/Table";
import Pagination from "@/extra/Pagination";
import ReasonDialog from "@/component/hostRequest/HostReasonDialog";
import { getWithdrawalRequest } from "@/store/withdrawalSlice";
import Image from "next/image";
import male from "@/assets/images/male.png";
import infoImage from "@/assets/images/info.svg";
import { Modal } from "@mui/material";
import { ExInput } from "@/extra/Input";
import Button from "@/extra/Button";
import WithdrawPendingAgencyShimmer from "../shimmer/WithdrawPendingAgencyShimmer";
import { formatCoins } from "@/utils/Common";

const AcceptedWithrawRequest = (props: any) => {
  const { statusType, type, startDate, endDate } = props;

  const person =
    type == "user" ? 3 : type == "host" ? 2 : type == "agency" ? 1 : null;
  const status =
    statusType === "pending_Request"
      ? 1
      : statusType === "accepted_Request"
      ? 2
      : statusType === "declined_Request"
      ? 3
      : null;

  const { acceptedWithdrawal, totalAcceptedWithdrawal } = useSelector(
    (state: RootStore) => state.withdrawal
  );

  const { dialogueType } = useSelector((state: RootStore) => state.dialogue);
  
  const dispatch = useAppDispatch();
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState<string | undefined>("All");
  const [rowsPerPage, setRowsPerPage] = useState<number>(20);
  const [page, setPage] = useState<number>(1);
  const [openInfo, setOpenInfo] = useState(false);
  const [infoData, setInfodata] = useState<any>();
  const [openReason, setOpenReason] = useState(false);

  useEffect(() => {
    const payload: any = {
      start: page,
      limit: rowsPerPage,
      search,
      startDate,
      endDate,
      person: 1,
      status: 2,
    };
    if (status && person && statusType && type) {
      dispatch(getWithdrawalRequest(payload));
    }
  }, [dispatch, page, rowsPerPage, search, person, status, startDate, endDate]);

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event, 10));
    setPage(1);
  };

  const handleOpenInfo = (row: any) => {
    setOpenInfo(true);
    setInfodata(row);
  };

  const handleCloseInfo = () => {
    setOpenInfo(false);
  };

  const handleCloseReason = () => {
    setOpenReason(false);
  };

  const withdrawAcceptedtable = [
    {
      Header: "No",
      Cell: ({ index }: { index: number }) => (
        <span>{(page - 1) * rowsPerPage + index + 1}</span>
      ),
    },

    {
      Header: "UniqueId",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize  cursor">{row?.uniqueId}</span>
      ),
    },

    {
      Header: "Agency",
      accessor: "agency",
      Cell: ({ row }: { row: any }) => {
        // Define updatedImagePath before returning JSX
        const updatedImagePath = row?.agencyId?.image
          ? row.agencyId?.image.replace(/\\/g, "/")
          : "";

        return (
          <div className="d-flex justify-content-center align-items-center">
            {/* Image Section */}
            <div style={{ width: "150px", textAlign: "end" }}>
              <img
                src={
                  row?.agencyId?.image ? baseURL + updatedImagePath : male.src
                }
                alt="Image"
                width="60"
                height="60"
                style={{ borderRadius: "10px", objectFit: "cover" }} // Styling for better appearance
                onError={(e: any) => {
                  e.target.onerror = null;
                  e.target.src = male.src;
                }}
              />
            </div>

            {/* Product Name */}
            <div style={{ width: "200px", textAlign: "start" }}>
              <span className="text-capitalize ms-3 cursorPointer text-nowrap">
                {row?.agencyId?.name || "-"}
              </span>
            </div>
          </div>
        );
      },
    },

    {
      Header: "Coin",
      Cell: ({ row }: { row: any }) => <span>{formatCoins(row?.coin)}</span>,
    },

    {
      Header: `Amount`,
      Cell: ({ row }: { row: any }) => <span>{formatCoins(row?.amount)}</span>,
    },

    {
      Header: "Date",
      body: "date",
      Cell: ({ row }: { row: any }) => (
        <span>{row?.acceptOrDeclineDate?.split(",")[0] || "-"}</span>
      ),
    },

    {
      Header: "Info",
      Cell: ({ row }: { row: any }) => (
        <button
          style={{
            backgroundColor: "#E1F8FF",
            borderRadius: "10px",
            padding: "8px",
          }}
        >
          <img
            src={infoImage.src}
            height={22}
            width={22}
            alt="Info"
            onClick={() => handleOpenInfo(row)}
          />
        </button>
      ),
    },
  ];
  return (
    <>
      <div>
        {dialogueType == "reasondialog" && <ReasonDialog />}

        <div className="mt-4">
          <Table
            data={acceptedWithdrawal}
            mapData={withdrawAcceptedtable}
            PerPage={rowsPerPage}
            Page={page}
            type={"server"}
            shimmer={<WithdrawPendingAgencyShimmer />}
          />
        </div>
        <Pagination
          type={"server"}
          serverPage={page}
          setServerPage={setPage}
          serverPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          totalData={totalAcceptedWithdrawal}
        />
      </div>

      <Modal
        open={openInfo}
        onClose={handleCloseReason}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <div className="dialog">
          <div className="">
            <div className="row justify-content-center">
              <div className="col-xl-12 col-sm-12 col-md-12 col-11">
                <div className="mainDiaogBox">
                  <div className="row justify-content-between align-items-center formHead">
                    <div className="col-10">
                      <h2 className="text-theme m0 fs-24 textpayment">
                        Payment Detail Info
                      </h2>
                    </div>
                    <div className="col-2">
                      <div className="closeButton" onClick={handleCloseInfo}>
                        <i className="ri-close-line"></i>
                      </div>
                    </div>
                  </div>
                  <form style={{ padding: "15px", paddingTop: "0px" }}>
                    <div
                      className="row sound-add-box"
                      style={{ overflowX: "hidden" }}
                    >
                      <div className="col-12 mt-2">
                        <div className="col-12 mt-3 text-about">
                          <ExInput
                            type={"text"}
                            label={"Payment Gateway"}
                            name={"Payment Gateway"}
                            value={infoData?.paymentGateway}
                            newClass={`mt-3`}
                            readOnly
                          />
                        </div>

                        {infoData?.paymentDetails &&
                          Object.entries(infoData.paymentDetails).map(
                            ([key, value]: [string, any]) => {
                              return (
                                <div
                                  className="col-12 mt-1 text-about"
                                  key={key}
                                >
                                  <ExInput
                                    type="text"
                                    label={key || "-"}
                                    name="Payment Details"
                                    value={value || "-"}
                                    newClass="mt-3"
                                    readOnly
                                  />
                                </div>
                              );
                            }
                          )}
                      </div>
                      {/* <div className="mt-3 d-flex justify-content-end">
                        <Button
                          onClick={handleCloseInfo}
                          btnName={"Close"}
                          newClass={"close-model-btn"}
                        />
                      </div> */}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AcceptedWithrawRequest;
