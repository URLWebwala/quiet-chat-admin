import RootLayout from "@/component/layout/Layout";
import AcceptedWithrawRequest from "@/component/withdrawRequest/AcceptedWithrawRequest";
import DeclineWithdrawRequest from "@/component/withdrawRequest/DeclineWithdrawRequest";
import PendingWithdrawReq from "@/component/withdrawRequest/PendingWithdrawReq";
import Analytics from "@/extra/Analytic";
import { RootStore } from "@/store/store";
import { routerChange } from "@/utils/Common";
import { withdrawRequestTypes } from "@/utils/extra";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react"
import { useSelector } from "react-redux";

const WithdrawRequest = () => {
    const [type, setType] = useState<string>("agency");
    const [statusType, setStatusType] = useState<string | null>("pending_Request");
    const { dialogueType } = useSelector((state: RootStore) => state.dialogue);
    const [startDate, setStartDate] = useState("All");
    const [endDate, setEndDate] = useState("All");
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedType = localStorage.getItem("withdrawType") || "pending_Request";
            setStatusType(storedType);
        }
    }, []);

    useEffect(() => {
        if (statusType) {
            localStorage.setItem("withdrawType", statusType);
        }
    }, [statusType]);

    useEffect(() => {
        routerChange("/WithdrawRequest", "mainType", router)
    }, []);



    return (
        <>
            <div className="row d-flex flex-wrap align-items-center">
                {/* Button Group Section */}
                <div className="col-12 col-sm-12 col-md-12 col-lg-12 col-xl-9">
                    <div className="d-flex" style={{gap: "8px", width : "fit-content"}}>
                        <button
                            className={`pendingRequest ${statusType === "pending_Request" ? "status-active-pending" : ""}`}
                            onClick={() => setStatusType("pending_Request")}
                        >
                            Pending Request
                        </button>

                        <button
                            className={`accetedRequest ${statusType === "accepted_Request" ? "status-active-accepted" : ""}`}
                            onClick={() => setStatusType("accepted_Request")}
                        >
                            Accepted Request
                        </button>

                        <button
                            className={`declineRequest ${statusType === "declined_Request" ? "status-active-declined" : ""}`}
                            onClick={() => setStatusType("declined_Request")}
                        >
                            Declined Request
                        </button>
                    </div>
                </div>

                {/* Analytics Component Section */}
                <div className="col-12 col-md-12  col-xl-3 d-flex justify-content-end">
                    <Analytics
                        analyticsStartDate={startDate}
                        analyticsStartEnd={endDate}
                        analyticsStartDateSet={setStartDate}
                        analyticsStartEndSet={setEndDate}
                        direction={"end"}
                    />
                </div>
            </div>

            <div>
                {/* Always show pending request for 'host' */}

                {/* Show based on statusType only when type is 'agency' */}
                {statusType === "pending_Request" && (
                    <PendingWithdrawReq statusType={statusType} type={type} startDate={startDate} endDate={endDate} />
                )}

                {statusType === "accepted_Request" && (
                    <AcceptedWithrawRequest statusType={statusType} type={type} startDate={startDate} endDate={endDate} />
                )}

                {statusType === "declined_Request" && (
                    <DeclineWithdrawRequest statusType={statusType} type={type} startDate={startDate} endDate={endDate} />
                )}
            </div>
        </>
    );
};

WithdrawRequest.getLayout = function getLayout(page: React.ReactNode) {
    return <RootLayout>{page}</RootLayout>;
};

export default WithdrawRequest;
