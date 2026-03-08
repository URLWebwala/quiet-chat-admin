import RootLayout from "@/component/layout/Layout";
import Button from "@/extra/Button";
import Table from "@/extra/Table";
import { openDialog } from "@/store/dialogSlice";
import { useDispatch, useSelector } from "react-redux";
import image from "@/assets/images/bannerImage.png";
import { baseURL } from "@/utils/config";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import Analytics from "@/extra/Analytic";
import { getWithdrawalRequest } from "@/store/withdrawalSlice";
import { RootStore } from "@/store/store";
import AddWithdrawDialogue from "@/component/setting/AddWithdrawDialogue";
import male from "@/assets/images/male.png"
import infoImage from "@/assets/images/info.svg";

import Image from "next/image";
import { Modal } from "@mui/material";
import { ExInput } from "@/extra/Input";
import { formatCoins } from "@/utils/Common";

const Withdraw = () => {
  const [rowsPerPage, setRowsPerPage] = useState<number>(20);
  const [page, setPage] = useState<number>(1);
  const [startDate, setStartDate] = useState("All");
  const [endDate, setEndDate] = useState("All");
  const [search, setSearch] = useState<string | undefined>("All");
  const [openReason, setOpenReason] = useState(false);

  const [openInfo, setOpenInfo] = useState(false);
  const [infoData, setInfodata] = useState<any>();
  const { dialogue, dialogueType } = useSelector(
    (state: RootStore) => state.dialogue
  );
  const { withdrawRequest } = useSelector((state: RootStore) => state.withdrawal)

  const dispatch = useDispatch();

  useEffect(() => {
    const payload: any = {
      start: page,
      limit: rowsPerPage,
      search,
      startDate,
      endDate,
      person: 1,
      status: 1
    };
    dispatch(getWithdrawalRequest(payload));
  }, [dispatch, page, rowsPerPage, search, startDate, endDate]);

  const handleOpenInfo = (row: any) => {
    setOpenInfo(true);
    setInfodata(row);
  };

  const handleCloseReason = () => {
    setOpenReason(false);
  };

  const handleCloseInfo = () => {
    setOpenInfo(false);
  };

  const withdrawPendingTable = [
    {
      Header: "No",
      Cell: ({ index }: { index: number }) => (
        <span>{(page - 1) * rowsPerPage + index + 1}</span>
      ),
    },
    {
      Header: "UniqueId",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize cursor">{row?.uniqueId}</span>
      ),
    },

    {
      Header: "Agency",
      accessor: "agency",
      Cell: ({ row }: { row: any }) => {
        const updatedImagePath = row?.agencyId?.image ? row.agencyId.image.replace(/\\/g, "/") : "";

        return (
          <div className="d-flex justify-content-center align-items-center">
            <div style={{ width: "100px", textAlign: "end" }}>
              <img
                src={row?.agencyId?.image ? baseURL + updatedImagePath : male.src}
                alt="Image"
                width="60"
                height="60"
                style={{ borderRadius: "10px", objectFit: "cover" }}
              />
            </div>
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
      Cell: ({ row }: { row: any }) => (
        <span>{row?.requestDate?.split(",")[0] || "-"}</span>
      ),
    },
    {
      Header: "Info",
      Cell: ({ row }: { row: any }) => (
        <button
          style={{
            backgroundColor: "#c3e0ff",
            borderRadius: "10px",
            padding: "10px",
          }}
        >
          <img src={infoImage.src} alt="Info" onClick={() => handleOpenInfo(row)} />
        </button>
      ),
    },




  ].filter(Boolean); 


  return (
    <>
      <div className="payment-setting-box user-table mt-3">

        {dialogueType === "withdraw" && <AddWithdrawDialogue amount={0} />}

        <div className="row align-items-center mb-2 p-3 ml-1">
          <div className="col-12 col-sm-6 col-md-6 col-lg-6">
            <Analytics
            
              analyticsStartDate={startDate}
              analyticsStartEnd={endDate}
              analyticsStartDateSet={setStartDate}
              analyticsStartEndSet={setEndDate}
              direction={"start"}
            />
          </div>
          <div className="col-12 col-sm-6 col-md-6 col-lg-6 new-fake-btn d-flex justify-content-end mt-3 m-sm-0">
            <Button
              className={`bg-button p-10 text-white m10-bottom `}
              bIcon={image}
              text="Add"
              onClick={() => {
                dispatch(openDialog({ type: "withdraw" }));
              }}
            />
          </div>


        </div>
        <div className="mt-3">
          <Table
            data={withdrawRequest}
            mapData={withdrawPendingTable}
            type={"client"}
          />
        </div>
      </div>

      <Modal
        open={openInfo}
        onClose={handleCloseReason}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <div className="dialog">
          <div className="w-75">
            <div className="row justify-content-center">
              <div className="col-xl-5 col-md-8 col-11">
                <div className="mainDiaogBox">
                  <div className="row justify-content-between align-items-center formHead">
                    <div className="col-8">
                      <h2 className="text-theme m0">Payment Detail Info</h2>
                    </div>
                    <div className="col-4">
                      <div
                        className="closeButton"
                        onClick={handleCloseInfo}
                      >
                        <i className="ri-close-line"></i>
                      </div>
                    </div>
                  </div>
                  <form style={{ padding: "15px", paddingTop: "0px" }}>
                    <div className="row sound-add-box" style={{ overflowX: "hidden" }}>
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

                        {infoData?.paymentDetails?.map((item: any) => {
                          return (
                            <div className="col-12 mt-1 text-about">
                              <ExInput
                                type={"text"}
                                label={item?.split(":")[0] || "-"}
                                name={"Payment Details"}
                                value={item?.split(":")[1] || "-"}
                                newClass={`mt-3`}
                                readOnly
                              />
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 d-flex justify-content-end">
                        <Button
                          onClick={handleCloseInfo}
                          btnName={"Close"}
                          newClass={"close-model-btn"}
                        />
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}

Withdraw.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};
export default Withdraw;