import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootStore, useAppDispatch } from "@/store/store";
import { closeDialog } from "@/store/dialogSlice";
import { ExInput } from "@/extra/Input";
import Button from "@/extra/Button";

import { hostRequestDeclined } from "@/store/hostRequestSlice";
import { acceptOrDeclineWithdrawRequestForAgency } from "@/store/withdrawalSlice";

interface ErrorState {
  reason: string;
}

const HostReasonDialog = () => {
  const { dialogueData, dialogueType } = useSelector((state: RootStore) => state.dialogue);


  const dispatch = useAppDispatch();
  const [mongoId, setMongoId] = useState<any>();
  const [reason, setReason] = useState<any>();
  const [error, setError] = useState({
    reason: "",
  });

  useEffect(() => {
    if (dialogueData) {
      setMongoId(dialogueData);
    }
  }, [dialogueData]);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    

    if (!reason) {
      let error = {} as ErrorState;

      if (!reason) error.reason = "Reason is Required";
      return setError({ ...error });
    } else {
      if(dialogueType === "reasondialog"){
        const payload = {
          reason,
          requestId: dialogueData?._id?._id,
          hostId: dialogueData?._id?.hostId?._id,
          type : "reject"
        };
        dispatch(acceptOrDeclineWithdrawRequestForAgency(payload))
      }else {
        
        const payload = {
          reason,
          requestId: dialogueData?._id,
          userId: dialogueData?.userId
        };
        dispatch(hostRequestDeclined(payload));
      }
     
      dispatch(closeDialog());
    }
  };

  return (
    <div className="dialog">
      <div className="w-100">
        <div className="row justify-content-center">
          <div className="col-xl-3 col-md-4 col-11">
            <div className="mainDiaogBox">
              <div className="row justify-content-between align-items-center formHead">
                <div className="col-8">
                  <h4 className="text-theme m0"> Reason</h4>
                </div>
                <div className="col-4">
                  <div
                    className="closeButton"
                    onClick={() => {
                      dispatch(closeDialog());
                    }}
                    style={{ fontSize: "20px" }}
                  >
                    ✖
                  </div>
                </div>
              </div>
              <form id="expertForm">
                <div className="row align-items-start formBody">
                  <div className="col-12">
                    <ExInput
                      type={`text`}
                      id={`reason`}
                      name={`reason`}
                      label={`Reason`}
                      placeholder={`Enter reason...`}
                      errorMessage={error.reason && error.reason}
                      onChange={(e: any) => {
                        setReason(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            reason: "Reason is Required !",
                          });
                        } else {
                          setError({
                            ...error,
                            reason: "",
                          });
                        }
                      }}
                    />
                  </div>

                  <div className="mt-4 d-flex justify-content-end gap-1">
                    <Button
                      className={`cancelButton text-light`}
                      text={`Cancel`}
                      type={`button`}
                      onClick={() => dispatch(closeDialog())}
                    />
                    <Button
                      type={`submit`}
                      className={` text-white m10-left submitButton`}
                      // style={{ backgroundColor: "#1ebc1e" }}
                      text={`Submit`}
                      onClick={(e: any) => handleSubmit(e)}
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default HostReasonDialog;
