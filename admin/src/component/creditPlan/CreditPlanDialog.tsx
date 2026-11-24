import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootStore, useAppDispatch } from "@/store/store";
import { closeDialog } from "@/store/dialogSlice";
import { ExInput } from "@/extra/Input";
import Button from "@/extra/Button";
import { createCreditPlan, updateCreditPlan, getCreditPlan } from "@/store/creditPlanSlice";
import { getDefaultCurrency } from "@/store/settingSlice";

interface ErrorState {
  credits: string;
  bonusCredits: string;
  price: string;
  productId: string;
}

const CreditPlanDialog = () => {
  const { dialogueData } = useSelector((state: RootStore) => state.dialogue);
  const { defaultCurrency } = useSelector((state: RootStore) => state.setting);

  const dispatch = useAppDispatch();
  const [mongoId, setMongoId] = useState<any>();
  const [credits, setCredits] = useState<any>("");
  const [bonusCredits, setBonusCredits] = useState<any>("0");
  const [price, setPrice] = useState<any>("");
  const [actualPrice, setActualPrice] = useState<any>("");
  const [discount, setDiscount] = useState<any>("");
  const [productId, setProductId] = useState<any>("");
  const [error, setError] = useState({
    credits: "",
    bonusCredits: "",
    price: "",
    productId: "",
  });

  useEffect(() => {
    dispatch(getDefaultCurrency());
  }, [dispatch]);

  useEffect(() => {
    if (dialogueData) {
      setMongoId(dialogueData?._id);
      setCredits(dialogueData?.credits ?? "");
      setBonusCredits(dialogueData?.bonusCredits ?? 0);
      const rawPrice = dialogueData?.price ?? "";
      const rawActualPrice = dialogueData?.actualPrice ?? dialogueData?.price ?? "";
      const rawDiscount =
        dialogueData?.discount ??
        (rawActualPrice > rawPrice ? Math.round(((rawActualPrice - rawPrice) / rawActualPrice) * 100) : "");

      setPrice(rawPrice);
      setActualPrice(rawActualPrice);
      setDiscount(rawDiscount);
      setProductId(dialogueData?.productId ?? "");
    }
  }, [dialogueData]);

  const handleActualPriceChange = (val: any) => {
    setActualPrice(val);
    const numActual = Number(val);
    const numDisc = Number(discount);
    const numPrice = Number(price);

    if (numActual > 0 && numDisc > 0) {
      const calcPrice = Math.max(0, Math.round(numActual - (numActual * numDisc) / 100));
      setPrice(calcPrice);
      if (error.price) setError((prev: any) => ({ ...prev, price: "" }));
    } else if (numActual > 0 && numPrice > 0 && numActual >= numPrice) {
      const calcDiscount = Math.round(((numActual - numPrice) / numActual) * 100);
      setDiscount(calcDiscount);
    }
  };

  const handleDiscountChange = (val: any) => {
    setDiscount(val);
    const numDisc = Number(val);
    const numActual = Number(actualPrice);
    const numPrice = Number(price);

    if (numDisc >= 0 && numDisc < 100 && numActual > 0) {
      const calcPrice = Math.max(0, Math.round(numActual - (numActual * numDisc) / 100));
      setPrice(calcPrice);
      if (error.price) setError((prev: any) => ({ ...prev, price: "" }));
    } else if (numDisc >= 0 && numDisc < 100 && numPrice > 0 && (!numActual || numActual <= 0)) {
      const calcActual = Math.round(numPrice / (1 - numDisc / 100));
      setActualPrice(calcActual);
    }
  };

  const handlePriceChange = (val: any) => {
    setPrice(val);
    const numPrice = Number(val);
    const numActual = Number(actualPrice);

    if (numPrice > 0 && numActual > numPrice) {
      const calcDiscount = Math.round(((numActual - numPrice) / numActual) * 100);
      setDiscount(calcDiscount);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!credits || Number(credits) <= 0 || price === "" || Number(price) < 0) {
      let err = {} as ErrorState;
      if (!credits) err.credits = "Credits is required";
      if (Number(credits) <= 0) err.credits = "Credits must be greater than 0";
      if (price === "" || Number(price) < 0) err.price = "Valid price is required";
      return setError({ ...error, ...err });
    }

    const payload: any = {
      credits: Number(credits),
      bonusCredits: Number(bonusCredits) || 0,
      price: Number(price),
      actualPrice: Number(actualPrice) || Number(price),
      discount: Number(discount) || 0,
      productId: String(productId || "").trim().toLowerCase(),
    };

    if (dialogueData) {
      payload.creditPlanId = dialogueData?._id;
      await dispatch(updateCreditPlan(payload));
    } else {
      await dispatch(createCreditPlan(payload));
    }

    dispatch(closeDialog());
    dispatch(getCreditPlan({ start: 1, limit: 10 }));
  };

  return (
    <div className="dialog">
      <div className="w-100">
        <div className="row justify-content-center">
          <div className="col-xl-3 col-md-4 col-11">
            <div className="mainDiaogBox">
              <div className="row justify-content-between align-items-center formHead">
                <div className="col-8">
                  <h4 className="text-theme m0">
                    {dialogueData ? "Edit Credit Plan" : "Add Credit Plan"}
                  </h4>
                </div>
                <div className="col-4">
                  <div
                    className="closeButton"
                    onClick={() => {
                      dispatch(closeDialog());
                    }}
                    style={{ fontSize: "20px", cursor: "pointer" }}
                  >
                    ✖
                  </div>
                </div>
              </div>
              <form id="creditPlanForm" onSubmit={handleSubmit}>
                <div className="row align-items-start formBody">
                  <div className="col-12">
                    <ExInput
                      type={`number`}
                      id={`credits`}
                      name={`credits`}
                      value={credits}
                      label={`Credits`}
                      placeholder={`e.g. 100`}
                      errorMessage={error.credits && error.credits}
                      onChange={(e: any) => {
                        setCredits(e.target.value);
                        if (!e.target.value) {
                          setError({ ...error, credits: "Credits is required" });
                        } else if (Number(e.target.value) <= 0) {
                          setError({ ...error, credits: "Credits must be greater than 0" });
                        } else {
                          setError({ ...error, credits: "" });
                        }
                      }}
                    />
                  </div>

                  <div className="col-12">
                    <ExInput
                      type={`number`}
                      id={`bonusCredits`}
                      name={`bonusCredits`}
                      value={bonusCredits}
                      label={`Bonus Credits`}
                      placeholder={`e.g. 10`}
                      errorMessage={error.bonusCredits && error.bonusCredits}
                      onChange={(e: any) => {
                        setBonusCredits(e.target.value);
                      }}
                    />
                  </div>

                  <div className="col-6">
                    <ExInput
                      type={`number`}
                      id={`actualPrice`}
                      name={`actualPrice`}
                      value={actualPrice}
                      label={`Actual Price (${defaultCurrency?.symbol || "₹"})`}
                      placeholder={`e.g. 149`}
                      onChange={(e: any) => handleActualPriceChange(e.target.value)}
                    />
                  </div>

                  <div className="col-6">
                    <ExInput
                      type={`number`}
                      id={`discount`}
                      name={`discount`}
                      value={discount}
                      label={`Discount (%)`}
                      placeholder={`e.g. 20`}
                      onChange={(e: any) => handleDiscountChange(e.target.value)}
                    />
                  </div>

                  <div className="col-12">
                    <ExInput
                      type={`number`}
                      id={`price`}
                      name={`price`}
                      value={price}
                      label={`Offer / Final Price (${defaultCurrency?.symbol || "₹"})`}
                      placeholder={`e.g. 99`}
                      errorMessage={error.price && error.price}
                      onChange={(e: any) => {
                        handlePriceChange(e.target.value);
                        if (!e.target.value) {
                          setError({ ...error, price: "Price is required" });
                        } else {
                          setError({ ...error, price: "" });
                        }
                      }}
                    />
                  </div>

                  <div className="col-12">
                    <ExInput
                      type={`text`}
                      id={`productId`}
                      name={`productId`}
                      value={productId}
                      label={`Product ID / Package Code`}
                      placeholder={`e.g. com.quietchat.credits.100`}
                      errorMessage={error.productId && error.productId}
                      onChange={(e: any) => {
                        setProductId(e.target.value);
                      }}
                    />
                  </div>
                </div>

                <div className="row formFooter justify-content-end gap-2 p-3">
                  <Button
                    type="button"
                    className={`bg-gray text-dark border`}
                    text="Cancel"
                    onClick={() => dispatch(closeDialog())}
                  />
                  <Button
                    type="submit"
                    className={`bg-button text-white`}
                    text={dialogueData ? "Update Plan" : "Create Plan"}
                    onClick={handleSubmit}
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditPlanDialog;
