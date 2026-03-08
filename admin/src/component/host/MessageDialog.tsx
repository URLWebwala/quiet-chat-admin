import countriesData from "@/api/countries.json";
import Button from "@/extra/Button";
import { Textarea } from "@/extra/Input";
import { closeDialog, closeMessageDialog } from "@/store/dialogSlice";
import {
  createHost,
  getImpression,
  updateHost,
  updateMessage,
} from "@/store/hostSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { baseURL } from "@/utils/config";
import moment from "moment";
import React, { useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { FileWithPath } from "react-dropzone";
import { useSelector } from "react-redux";

const MessageDialog = () => {
  
  const { isLoading } = useSelector((state: any) => state.host);
  const dispatch = useAppDispatch();
  const { dialogue, dialogueData, gender } = useSelector(
    (state: RootStore) => state.dialogue
  );
  const [error, setError] = useState<any>({
    message: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    setMessage(dialogueData);
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!message) {
      let error: any = {};
      if (!message) error.message = "Message is Required!";
      return setError({ ...error });
    }
    await dispatch(
      updateMessage({ message, gender: gender === "male" ? 1 : 2 })
    );
    dispatch(closeMessageDialog());
  };

  return (
    <>
      <div className="dialog">
        <div style={{ width: "1800px" }}>
          <div className="row justify-content-center">
            <div className="col-xl-5 col-md-8 col-11">
              <div className="mainDiaogBox" style={{ width: "700px" }}>
                <div className="row justify-content-between align-items-center formHead">
                  <div className="col-8">
                    <h2 className="text-theme fs-26 m0">Message</h2>
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

                <div className="row  formFooter mt-3">
                 
                  <div className="col-12 mt-2">
                    <Textarea
                      row={10}
                      type={`text`}
                      id={`message`}
                      name={`message`}
                      value={message}
                      defaultValue={message && message}
                      label={`Message`}
                      placeholder={`message`}
                      errorMessage={error.message && error.message}
                      onChange={(e: any) => {
                        setMessage(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            message: `Message is required`,
                          });
                        } else {
                          return setError({
                            ...error,
                            message: "",
                          });
                        }
                      }}
                    />
                  </div>
                   <p className={`errorMessage text-start text-danger `}>
                    {"Note: Message must be in comma separate value."}
                  </p>

                  <div className="col-12 text-end m0">
                    <Button
                      className={`cancelButton text-white`}
                      text={`Cancel`}
                      type={`button`}
                      onClick={() => dispatch(closeDialog())}
                    />
                    <Button
                      type={`submit`}
                      className={` text-white m10-left submitButton ${
                        isLoading ? "disabledBtn " : " "
                      } `}
                      // style={{ backgroundColor: "#1ebc1e" }}
                      text={isLoading ? "Loading... " : "Submit"}
                      disabled={isLoading}
                      onClick={(e: any) => handleSubmit(e)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MessageDialog;
