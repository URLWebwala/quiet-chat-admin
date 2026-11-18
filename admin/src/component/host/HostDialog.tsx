import { closeDialog } from "@/store/dialogSlice";
import { RootStore } from "@/store/store";
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/router";
import AiHostForm from "./AiHostForm";

const HostDialog = ({ isInline = false }: { isInline?: boolean }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { dialogueData } = useSelector(
    (state: RootStore) => state.dialogue
  );

  if (isInline) {
    return <AiHostForm initialData={dialogueData} />;
  }

  return (
    <div className="dialog">
      <div style={{ width: "1000px" }}>
        <div className="row justify-content-center">
          <div className="col-12">
            <div className="mainDiaogBox p-4 bg-white rounded-4 shadow" style={{ width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
              <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                <h4 className="fw-bold text-dark m-0">{dialogueData ? "Edit AI Host" : "Add AI Host"}</h4>
                <div
                  className="closeButton cursor-pointer"
                  onClick={() => dispatch(closeDialog())}
                  style={{ fontSize: "20px" }}
                >
                  ✖
                </div>
              </div>
              <AiHostForm initialData={dialogueData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostDialog;
