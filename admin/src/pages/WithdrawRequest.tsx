import RootLayout from "@/component/layout/Layout";
import AcceptedWithrawRequest from "@/component/withdrawRequest/AcceptedWithrawRequest";
import DeclineWithdrawRequest from "@/component/withdrawRequest/DeclineWithdrawRequest";
import PendingWithdrawReq from "@/component/withdrawRequest/PendingWithdrawReq";
import Analytics from "@/extra/Analytic";
import { closeDialog } from "@/store/dialogSlice";
import { RootStore } from "@/store/store";
import { setWithdrawal } from "@/store/withdrawalSlice";
import { routerChange } from "@/utils/Common";
import { withdrawRequestTypes } from "@/utils/extra";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const WithdrawRequest = () => {
  const [type, setType] = useState<string>("agency");
  const [statusType, setStatusType] = useState<string | null>(null);
  const { dialogueType } = useSelector((state: RootStore) => state.dialogue);
  const [startDate, setStartDate] = useState("All");
  const [endDate, setEndDate] = useState("All");
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    const storedType =
      localStorage.getItem("withdrawType") || "pending_Request";
    if (storedType) setStatusType(storedType);
  }, []);

  useEffect(() => {
    if (statusType) {
      localStorage.setItem("withdrawType", statusType);
    }
  }, [statusType]);

  useEffect(() => {
    routerChange("/WithdrawRequest", "mainType", router);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedType = localStorage.getItem("mainType");
      if (storedType) setType(storedType);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mainType", type);
    }
  }, [statusType]);

  return (
    <>
      {
        <div className="d-flex justify-content-between">
          <div className="my-2 withdraw_width mt-2">
            {withdrawRequestTypes.map((item: any, index: number) => (
              <button
                key={index}
                type="button"
                className={`${
                  type === item.value ? "activeBtn" : "disabledBtn"
                } ${index !== 0 ? "ms-1" : ""}`}
                onClick={() => {
                  dispatch(setWithdrawal([]));
                  setType(item.value);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          {
            <div className="col-2">
              <Analytics
                analyticsStartDate={startDate}
                analyticsStartEnd={endDate}
                analyticsStartDateSet={setStartDate}
                analyticsStartEndSet={setEndDate}
                direction={"start"}
              />
            </div>
          }
        </div>
      }

      {
        <div className="row d-flex align-items-center">
          <div className="col-12">
            <div className="d-flex gap-3" style={{ justifyContent:"end" }}>
              <button
                className={`pendingRequest ${
                  statusType === "pending_Request"
                    ? "status-active-pending"
                    : ""
                }`}
                onClick={() => setStatusType("pending_Request")}
              >
                Pending Request
              </button>

              <button
                className={`accetedRequest ${
                  statusType === "accepted_Request"
                    ? "status-active-accepted"
                    : ""
                }`}
                onClick={() => setStatusType("accepted_Request")}
              >
                Accepted Request
              </button>

              <button
                className={`declineRequest ${
                  statusType === "declined_Request"
                    ? "status-active-declined"
                    : ""
                }`}
                onClick={() => setStatusType("declined_Request")}
              >
                Declined Request
              </button>
            </div>
          </div>
        </div>
      }

      <div>
        {/* Always show pending request for 'host' */}

        {/* Show based on statusType only when type is 'agency' */}
        {statusType === "pending_Request" && (
          <PendingWithdrawReq
            statusType={statusType}
            type={type}
            startDate={startDate}
            endDate={endDate}
          />
        )}

        {statusType === "accepted_Request" && (
          <AcceptedWithrawRequest
            statusType={statusType}
            type={type}
            startDate={startDate}
            endDate={endDate}
          />
        )}

        {statusType === "declined_Request" && (
          <DeclineWithdrawRequest
            statusType={statusType}
            type={type}
            startDate={startDate}
            endDate={endDate}
          />
        )}
      </div>
    </>
  );
};

WithdrawRequest.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default WithdrawRequest;
