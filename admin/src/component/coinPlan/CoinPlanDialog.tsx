import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootStore, useAppDispatch } from "@/store/store";
import { closeDialog } from "@/store/dialogSlice";
import { ExInput } from "@/extra/Input";
import Button from "@/extra/Button";

import { hostRequestDeclined } from "@/store/hostRequestSlice";
import { createImpression, updateImpression } from "@/store/impressionSlice";
import { createCoinPlan, updateCoinPlan } from "@/store/coinPlanSlice";
import { getDefaultCurrency } from "@/store/settingSlice";

interface ErrorState {
    coin: string;
    bonusCoin: string;
    price: string;
    productId: string;
}

const CoinPlanDialog = () => {
    const { dialogueData } = useSelector((state: RootStore) => state.dialogue);

    const { defaultCurrency } = useSelector((state: RootStore) => state.setting)


    const dispatch = useAppDispatch();
    const [mongoId, setMongoId] = useState<any>();
    const [coin, setcoin] = useState<any>();
    const [bonusCoin, setBonusCoin] = useState<any>();
    const [price, setPrice] = useState<any>();
    const [productId, setProductId] = useState();
    const [error, setError] = useState({
        coin: "",
        bonusCoin: "",
        price: "",
        productId: "",
    });

    useEffect(() => {
        dispatch(getDefaultCurrency())
    }, [dispatch])

    useEffect(() => {
        if (dialogueData) {
            setMongoId(dialogueData?._id);
            setcoin(dialogueData?.coins)
            setBonusCoin(dialogueData?.bonusCoins)
            setPrice(dialogueData?.price)
            setProductId(dialogueData?.productId)
        }
    }, [dialogueData]);

    const handleSubmit = (e: any) => {
        e.preventDefault();
        

        if (!coin ||
            coin <= 0 ||
            !bonusCoin ||
            bonusCoin <=0 ||
            price <=0 ||
            !price

        ) {
            let error = {} as ErrorState;

            if (!coin) error.coin = "coin is Required";
            if (coin <= 0) error.coin = "Coin can not less than or equal to 0";

            if (!bonusCoin) error.bonusCoin = "Bonus Coin is Required";
            if (bonusCoin <= 0) error.bonusCoin = "Bonus Coin can not less than or equal to 0";

            if (!price) error.price = "Price is Required";
            if (price <= 0) error.price = "Price can not less than or equal to 0";

            if (!productId) error.productId = "ProductId is Required";
            return setError({ ...error });
        } else {
            const payload: any = {
                coins: coin,
                bonusCoins: bonusCoin,
                price: price,
                productId: productId,
            }
            if (dialogueData) {
                payload.coinPlanId = dialogueData?._id; // Ensure coinPlanId exists in dialogueData
                dispatch(updateCoinPlan(payload))

            } else {

                dispatch(createCoinPlan(payload));
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
                                    <h4 className="text-theme m0"> Coin Plan</h4>
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
                                            type={`number`}
                                            id={`coin`}
                                            name={`Coin`}
                                            value={coin}
                                            label={`Coin`}
                                            placeholder={`Coin`}
                                            errorMessage={error.coin && error.coin}
                                            onChange={(e: any) => {
                                                setcoin(e.target.value);
                                                if (!e.target.value) {
                                                    return setError({
                                                        ...error,
                                                        coin: "coin is Required !",
                                                    });
                                                } else if (e?.target?.value <= 0){
                                                    return setError({
                                                        ...error,
                                                        coin: "coin can not less than or equal to 0",
                                                    });
                                                }
                                                 else {
                                                    setError({
                                                        ...error,
                                                        coin: "",
                                                    });
                                                }
                                            }}
                                        />
                                    </div>

                                    <div className="col-12">
                                        <ExInput
                                            type={`number`}
                                            id={`bonusCoins`}
                                            name={`bonusCoins`}
                                            value={bonusCoin}
                                            label={`Bonus Coin`}
                                            placeholder={`Bonus Coin`}
                                            errorMessage={error.bonusCoin && error.bonusCoin}
                                            onChange={(e: any) => {
                                                setBonusCoin(e.target.value);
                                                if (!e.target.value) {
                                                    return setError({
                                                        ...error,
                                                        bonusCoin: "Bonus Coin is Required !",
                                                    });
                                                }else if (e?.target?.value <= 0){
                                                    return setError({
                                                        ...error,
                                                        bonusCoin: "Bonus Coin can not less than or equal to 0",
                                                    });
                                                } 
                                                
                                                else {
                                                    setError({
                                                        ...error,
                                                        bonusCoin: "",
                                                    });
                                                }
                                            }}
                                        />
                                    </div>

                                    <div className="col-12">
                                        <ExInput
                                            type={`number`}
                                            id={`price`}
                                            name={`price `}
                                            value={price}
                                            label={`Price (${defaultCurrency?.symbol})`}
                                            placeholder={`Price (${defaultCurrency?.symbol})`}
                                            errorMessage={error.price && error.price}
                                            onChange={(e: any) => {
                                                setPrice(e.target.value);
                                                if (!e.target.value) {
                                                    return setError({
                                                        ...error,
                                                        price: "Price is Required !",
                                                    });
                                                }
                                                else if (e?.target?.value <= 0){
                                                    return setError({
                                                        ...error,
                                                        price: "Price can not less than or equal to 0",
                                                    });
                                                }
                                                else {
                                                    setError({
                                                        ...error,
                                                        price: "",
                                                    });
                                                }
                                            }}
                                        />
                                    </div>

                                    <div className="col-12">
                                        <ExInput
                                            type={`text`}
                                            id={`productid`}
                                            name={`productid`}
                                            value={productId}
                                            label={`Product Id`}
                                            placeholder={`Product Id`}
                                            errorMessage={error.productId && error.productId}
                                            onChange={(e: any) => {
                                                setProductId(e.target.value);
                                                if (!e.target.value) {
                                                    return setError({
                                                        ...error,
                                                        productId: "Product Id is Required !",
                                                    });
                                                } else {
                                                    setError({
                                                        ...error,
                                                        productId: "",
                                                    });
                                                }
                                            }}
                                        />
                                    </div>

                                    <div className="mt-4 d-flex justify-content-end gap-1">
                                        <Button
                                            className={`text-light cancelButton`}
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
export default CoinPlanDialog;
