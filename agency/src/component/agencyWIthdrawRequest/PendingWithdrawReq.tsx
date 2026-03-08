import { openDialog } from '@/store/dialogSlice';
import { RootStore, useAppDispatch } from '@/store/store';
import {  reqAccepted } from '@/utils/Alert';
import { baseURL } from '@/utils/config';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import Table from '@/extra/Table';
import Pagination from '@/extra/Pagination';
import ReasonDialog from '@/component/hostRequest/HostReasonDialog';
import { acceptOrDeclineWithdrawRequestForAgency, getWithdrawalRequest } from '@/store/withdrawalSlice';
import infoImage from "@/assets/images/info.svg";
import { Modal } from '@mui/material';
import { ExInput } from '@/extra/Input';
import Button from '@/extra/Button';
import Image from 'next/image';
import male from "@/assets/images/male.png"
import CommonDialog from '@/utils/CommonDialog';
import image from "@/assets/images/bannerImage.png";
import AddWithdrawDialogue from '../setting/AddWithdrawDialogue';
import WithdrawPendingAgencyShimmer from '../shimmer/WithdrawPendingAgencyShimmer';
import { formatCoins } from '@/utils/Common';

const style: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  backgroundColor: "background.paper",
  borderRadius: "13px",
  border: "1px solid #C9C9C9",
  boxShadow: "24px",
  padding: "19px",
};

const PendingWithdrawReq = (props: any) => {
  const { statusType, type, startDate, endDate } = props
  const person = type == "user" ? 3 : type == "host" ? 2 : type == "agency" ? 1 : null
  const status = statusType === "pending_Request" ? 1 : statusType === "accepted_Request" ? 2 :
    statusType === "declined_Request" ? 3 : null

  const { withdrawRequest, totalWithdrawal, success  } = useSelector(
    (state: RootStore) => state.withdrawal
  );

  const { admin } = useSelector((state: RootStore) => state?.admin);
  const netAvailableEarning = admin?.netAvailableEarnings;


  const { setting }: any = useSelector((state: RootStore) => state?.setting);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<any>(null);

  const { dialogueType } = useSelector(
    (state: RootStore) => state.dialogue
  );

  const router = useRouter();

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
      // person: 1,
      // status: 1
      person,
      status,
    };
    if (status && person && type) {


      dispatch(getWithdrawalRequest(payload));
    }
  }, [dispatch, page, rowsPerPage, search, person, status, startDate, endDate, type,  success]);

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event, 10));
    setPage(1);
  };

  const handleActionDeclined = (id: any) => {
    dispatch(openDialog({ type: "reasondialog", data: { _id: id } }));

  };

  const handleOpenInfo = (row: any) => {
    setOpenInfo(true);
    setInfodata(row);
  };


  const handleAcceptRequest = async () => {
    if (selectedId) {
      const payload = {
        requestId: selectedId?._id,
        hostId: selectedId?.hostId?._id,
        type: "approve"
      }
      dispatch(acceptOrDeclineWithdrawRequestForAgency(payload));
      setShowDialog(false);
    }
  };
  const handleActionAccept = (id: any) => {

    setSelectedId(id);
    setShowDialog(true);
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
            backgroundColor: "#E1F8FF",
            borderRadius: "10px",
            padding: "8px",
          }}
        >
          <img src={infoImage.src} height={22} width={22} alt="Info" onClick={() => handleOpenInfo(row)} />
        </button>
      ),
    },



  ].filter(Boolean); // This removes all `undefined` values


  const handleCloseInfo = () => {
    setOpenInfo(false);
  };

  const handleCloseReason = () => {
    setOpenReason(false);
  };


  return (
    <>
      {dialogueType === "withdraw" && <AddWithdrawDialogue amount={netAvailableEarning} />}

      <div className="col-12 col-sm-12 col-md-12 col-lg-12 new-fake-btn d-flex justify-content-end mt-3 m-sm-0">
        <Button
          className={`bg-button p-10 text-white m10-bottom`}
          bIcon={image}
          text="Add"
          onClick={() => {
            dispatch(
              openDialog({
                type: "withdraw",
                // data: { netAvailableEarning },
              })
            );
          }}
        />
      </div>
      <div>
        {dialogueType == "reasondialog" && <ReasonDialog />}
        <CommonDialog
          open={showDialog}
          onCancel={() => setShowDialog(false)}
          onConfirm={handleAcceptRequest}
          text={"Accept"}
        />
        <div className='mt-4'>
          <Table
            data={withdrawRequest}
            mapData={withdrawPendingTable}
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
          totalData={totalWithdrawal}
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
                      <h2 className="text-theme m0 fs-24 textpayment">Payment Detail Info</h2>
                    </div>
                    <div className="col-2">
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

                        {infoData?.paymentDetails &&
                          Object.entries(infoData.paymentDetails).map(([key, value]: [string, any]) => {
                            return (
                              <div className="col-12 mt-1 text-about" key={key}>
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

export default PendingWithdrawReq