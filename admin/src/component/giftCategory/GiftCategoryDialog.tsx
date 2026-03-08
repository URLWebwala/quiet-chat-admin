import Button from "@/extra/Button";
import { ExInput } from "@/extra/Input";
import { closeDialog } from "@/store/dialogSlice";
import { createGiftCategory, getGiftCategory, updateGiftCategory } from "@/store/giftSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
interface ErrorState {
    title: string
}
const GiftCategoryDialog = () => {
  
    const [title, setTitle] = useState("");

    const { dialogue, dialogueData } = useSelector(
        (state: RootStore) => state.dialogue
    );

    useEffect(() => {
        setTitle(dialogueData?.name)
    },[dialogueData])


    const dispatch = useAppDispatch();

    const [error, setError] = useState({
        title: ""
    });

    const handleSubmit = (e: any) => {

        if (
            !title) {
            let error = {} as ErrorState;
            if (!title) error.title = "Gift Category is Required!";

            return setError({ ...error });
        } else {

            if (dialogueData) {
                let payload = {
                    categoryId: dialogueData?._id,
                    name : title
                };

                dispatch(updateGiftCategory(payload));
            } else {
                dispatch(createGiftCategory(title));
            }

            dispatch(closeDialog());
        }
    };

    return (
        <>
            <div className="dialog">
                <div style={{width : "1100px"}}>
                    <div className="row justify-content-center">
                        <div className="col-xl-5 col-md-8 col-11">
                            <div className="mainDiaogBox">
                                <div className="row justify-content-between align-items-center formHead">
                                    <div className="col-8">
                                        <h2 className="text-theme fs-26 m0">Gift Category</h2>
                                    </div>
                                  
                                    <div className="col-4">
                                        <div
                                            className="closeButton"
                                            onClick={() => {
                                                dispatch(closeDialog());
                                            }}
                                            style={{fontSize : "20px"}}

                                        >
                                            ✖
                                        </div>
                                    </div>
                                </div>

                                <div className="row  formFooter mt-3">
                                <div className="col-12">
                                        <ExInput
                                            type="text"
                                            id="title"
                                            name="title"
                                            value={title}
                                            label="Gift Category"
                                            placeholder="Gift Category"
                                            errorMessage={error && error.title}
                                            onChange={(e: any) => {
                                                setTitle(e.target.value);
                                                if (!e.target.value) {
                                                    return setError({
                                                        ...error,
                                                        title: "Gift Category is required",
                                                    });
                                                } else {
                                                     return setError({
                                                        ...error,
                                                        title: "",
                                                    });
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="col-12 text-end m0">
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
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default GiftCategoryDialog;
