import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootStore, useAppDispatch } from "@/store/store";
import { closeDialog } from "@/store/dialogSlice";
import { ExInput } from "@/extra/Input";
import Button from "@/extra/Button";
import { getDefaultCurrency } from "@/store/settingSlice";
import { getRealOrFakeUser, updateUserCoin } from "@/store/userSlice";

interface ErrorState {
    userId: string;
    amount: string;
    type: string;
}

const CoinUpdateDialog = () => {
    const { dialogueData } = useSelector((state: RootStore) => state.dialogue);
    console.log('dialogueData: ', dialogueData);    

    const dispatch = useAppDispatch();

    const [userId, setUserId] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState<"add" | "deduct">("add");
    const [error, setError] = useState<ErrorState>({
        userId: "",
        amount: "",
        type: "",
    });

    const totalCoin = dialogueData?.coin || 0;

    useEffect(() => {
        dispatch(getDefaultCurrency());
        if (dialogueData?.id) setUserId(dialogueData?.id);
    }, [dispatch, dialogueData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let err: ErrorState = { userId: "", amount: "", type: "" };
        let valid = true;

        if (!amount) {
            err.amount = "Coin is required";
            valid = false;
        } else if (Number(amount) <= 0) {
            err.amount = "Coin must be greater than 0";
            valid = false;
        } else if (type === "deduct" && Number(amount) > totalCoin) {
            err.amount = `Cannot deduct more than total coins`;
            valid = false;
        }

        if (!type) {
            err.type = "Type (Add/Deduct) is required";
            valid = false;
        }

        if (!valid) return setError(err);

        const payload = {
            userId,
            amount: Number(amount),
            type,
        };

        const res = await dispatch(updateUserCoin(payload)).unwrap();

        dispatch(closeDialog());
        if (res.status) {
            const payload = {
                start: 1,
                limit: 20,
                startDate: "All",
                endDate: "All",
                search: "",
            };
            dispatch(getRealOrFakeUser(payload));
        }
    };

    return (
        <div className="dialog">
            <div className="w-100">
                <div className="row justify-content-center">
                    <div className="col-xl-3 col-md-4 col-11">
                        <div className="mainDiaogBox">
                            {/* Header */}
                            <div className="row justify-content-between align-items-center formHead">
                                <div className="col-8">
                                    <h4 className="text-theme m0">Update Coins</h4>
                                </div>
                                <div className="col-4 text-end">
                                    <div
                                        className="closeButton"
                                        onClick={() => dispatch(closeDialog())}
                                        style={{ fontSize: "20px", cursor: "pointer" }}
                                    >
                                        ✖
                                    </div>
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} id="coinUpdateForm">
                                <div className="row align-items-start formBody">
                                    <div className="col-12">
                                        <label className="form-label">Transaction Type</label>
                                        <select
                                            className="form-select"
                                            value={type}
                                            onChange={(e) => {
                                                setType(e.target.value as "add" | "deduct");
                                                setError({ ...error, amount: "" });
                                            }}
                                        >
                                            <option value="add">Add</option>
                                            <option value="deduct">Deduct</option>
                                        </select>
                                        {error.type && (
                                            <small className="text-danger">{error.type}</small>
                                        )}
                                    </div>

                                    <div className="col-12">
                                        <ExInput
                                            type="number"
                                            id="amount"
                                            name="amount"
                                            value={amount}
                                            label="Coin"
                                            placeholder={`Enter coin (Available: ${totalCoin})`}
                                            errorMessage={error.amount}
                                            onChange={(e: any) => {
                                                setAmount(e.target.value);
                                                setError({ ...error, amount: "" });
                                            }}
                                        />
                                    </div>

                                    <div className="mt-4 d-flex justify-content-end gap-1">
                                        <Button
                                            className="text-light cancelButton"
                                            text="Cancel"
                                            type="button"
                                            onClick={() => dispatch(closeDialog())}
                                        />
                                        <Button
                                            type="submit"
                                            className="text-white m10-left submitButton"
                                            text="Submit"
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

export default CoinUpdateDialog;
