import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootStore, useAppDispatch } from "@/store/store";
import { closeDialog } from "@/store/dialogSlice";
import { ExInput } from "@/extra/Input";
import Button from "@/extra/Button";

import { hostRequestDeclined } from "@/store/hostRequestSlice";
import { createImpression, updateImpression } from "@/store/impressionSlice";
import { createIdentityProof, updateDocumentType } from "@/store/settingSlice";

interface ErrorState {
    title: string;
}

const DocumentTypeDialog = () => {
    const { dialogueData } = useSelector((state: RootStore) => state.dialogue);
   

    const dispatch = useAppDispatch();
    const [mongoId, setMongoId] = useState<any>();
    const [title, settitle] = useState<any>();
    const [error, setError] = useState({
        title: "",
    });

    useEffect(() => {
        if (dialogueData) {
            setMongoId(dialogueData?._id);
            settitle(dialogueData?.title)
        }
    }, [dialogueData]);

    const handleSubmit = (e: any) => {
        e.preventDefault();

        if (!title) {
            let error = {} as ErrorState;

            if (!title) error.title = "title is Required";
            return setError({ ...error });
        } else {
            if (dialogueData) {
                const payload = {
                    title : title,
                    identityProofId : dialogueData?._id    
                }
                dispatch(updateDocumentType(payload))

            } else {

                dispatch(createIdentityProof(title));
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
                                    <h4 className="text-theme m0"> Identity Proof</h4>
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
                                            id={`title`}
                                            name={`title`}
                                            value={title}
                                            label={`Title`}
                                            placeholder={`Title`}
                                            errorMessage={error.title && error.title}
                                            onChange={(e: any) => {
                                                settitle(e.target.value);
                                                if (!e.target.value) {
                                                    return setError({
                                                        ...error,
                                                        title: "title is Required !",
                                                    });
                                                } else {
                                                    setError({
                                                        ...error,
                                                        title: "",
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
export default DocumentTypeDialog;
