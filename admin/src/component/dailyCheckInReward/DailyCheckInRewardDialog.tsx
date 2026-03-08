import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootStore, useAppDispatch } from "@/store/store";
import { closeDialog } from "@/store/dialogSlice";
import { ExInput } from "@/extra/Input";
import Button from "@/extra/Button";

import { hostRequestDeclined } from "@/store/hostRequestSlice";
import { createImpression, updateImpression } from "@/store/impressionSlice";
import { createIdentityProof, updateDocumentType } from "@/store/settingSlice";
import { createDailyReward, updateDailyReward } from "@/store/dailyCheckInRewardSlice";

interface ErrorState {
    dailyRewardCoin: string;
    day: string
}

const DailyCheckInRewardDialog = () => {
    const { dialogueData } = useSelector((state: RootStore) => state.dialogue);
    

    const dispatch = useAppDispatch();
    const [mongoId, setMongoId] = useState<any>();
    const [dailyRewardCoin, setdailyRewardCoin] = useState<any>();
    const [day, setDay] = useState<any>();
    const [error, setError] = useState({
        dailyRewardCoin: "",
        day: "",
    });

    const dayValue = [
        { name: "1", value: "1" },
        { name: "2", value: "2" },
        { name: "3", value: "3" },
        { name: "4", value: "4" },
        { name: "5", value: "5" },
        { name: "6", value: "6" },
        { name: "7", value: "7" },

    ]


    useEffect(() => {
        if (dialogueData) {
            setMongoId(dialogueData?._id);
            setDay(dialogueData?.day)
            setdailyRewardCoin(dialogueData?.dailyRewardCoin)
        }
    }, [dialogueData]);

    const handleSubmit = (e: any) => {
        e.preventDefault();

        if (!dailyRewardCoin || dailyRewardCoin <=0 || !day) {
            let error = {} as ErrorState;

            if (!dailyRewardCoin) error.dailyRewardCoin = "Daily Reward Coin is Required";
            if (dailyRewardCoin <= 0) error.dailyRewardCoin = "Daily Reward Coin can not less than or equal to 0.";

            if (!day) error.day = "Day is Required";
            return setError({ ...error });
        } else {
            if (dialogueData) {
                const payload = {
                    dailyRewardCoin: dailyRewardCoin,
                    dailyRewardCoinId: dialogueData?._id
                }
                dispatch(updateDailyReward(payload))

            } else {

                const payload : any = {
                    day,
                    dailyRewardCoin
                }

                dispatch(createDailyReward(payload));
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
                                <div className="col-10">
                                    <h4 className="text-theme m0"> Daily Check In Reward</h4>
                                </div>
                                <div className="col-2">
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

                                    <div className="inputData">
                                        <label className="  " htmlFor="category">
                                            Day
                                        </label>
                                        <select
                                            name="category"
                                            className="rounded-2"
                                            id="category"
                                            value={day}
                                            onChange={(e) => {
                                                setDay(e.target.value);
                                                setError((prev) => ({ ...prev, day: e.target.value ? "" : "Gift Category is required" }));
                                            }}
                                            disabled={dialogueData ? true : false}
                                        >
                                            <option value="">
                                                --Select Day--
                                            </option>
                                            {dayValue?.map((data) => (
                                                <option key={data.name} value={data.name}>
                                                    {data.value}
                                                </option>
                                            ))}
                                        </select>

                                        {error?.day && (
                                            <p className="errorMessage text-start">
                                                {error && error?.day}
                                            </p>
                                        )}
                                    </div>
                                    <div className="col-12">
                                        <ExInput
                                            type={`number`}
                                            id={`dailyRewardCoin`}
                                            name={`dailyRewardCoin`}
                                            value={dailyRewardCoin}
                                            label={`Daily Reward Coin`}
                                            placeholder={`Daily Reward Coin`}
                                            errorMessage={error.dailyRewardCoin && error.dailyRewardCoin}
                                            onChange={(e: any) => {
                                                setdailyRewardCoin(e.target.value);
                                                if (!e.target.value) {
                                                    return setError({
                                                        ...error,
                                                        dailyRewardCoin: "Daily Reward Coin is Required !",
                                                    });
                                                } 
                                                else if (e.target.value <=0) {
                                                    setError({
                                                        ...error,
                                                        dailyRewardCoin: "Daily Reward Coin can not less than or equal to 0.",
                                                    });
                                                }
                                                else {
                                                    setError({
                                                        ...error,
                                                        dailyRewardCoin: "",
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
export default DailyCheckInRewardDialog;
