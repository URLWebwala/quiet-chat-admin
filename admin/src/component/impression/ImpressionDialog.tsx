import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootStore, useAppDispatch } from "@/store/store";
import { closeDialog } from "@/store/dialogSlice";
import { ExInput } from "@/extra/Input";
import Button from "@/extra/Button";

import { hostRequestDeclined } from "@/store/hostRequestSlice";
import { createImpression, updateImpression } from "@/store/impressionSlice";

interface ErrorState {
    name: string;
}

const ImpressionDialog = () => {
    const { dialogueData } = useSelector((state: RootStore) => state.dialogue);
   

    const dispatch = useAppDispatch();
    const [mongoId, setMongoId] = useState<any>();
    const [name, setName] = useState<any>();
    const [error, setError] = useState({
        name: "",
    });

    useEffect(() => {
        if (dialogueData) {
            setMongoId(dialogueData?._id);
            setName(dialogueData?.name)
        }
    }, [dialogueData]);

    const handleSubmit = (e: any) => {
        e.preventDefault();

        if (!name) {
            let error = {} as ErrorState;

            if (!name) error.name = "name is Required";
            return setError({ ...error });
        } else {
            if (dialogueData) {
                const payload = {
                    name : name,
                    impressionId : dialogueData?._id    
                }
                dispatch(updateImpression(payload))

            } else {

                dispatch(createImpression(name));
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
                                    <h4 className="text-theme m0"> Host Tags</h4>
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
                                            id={`name`}
                                            name={`name`}
                                            value={name}
                                            label={`Name`}
                                            placeholder={`Name`}
                                            errorMessage={error.name && error.name}
                                            onChange={(e: any) => {
                                                setName(e.target.value);
                                                if (!e.target.value) {
                                                    return setError({
                                                        ...error,
                                                        name: "name is Required !",
                                                    });
                                                } else {
                                                    setError({
                                                        ...error,
                                                        name: "",
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
export default ImpressionDialog;
