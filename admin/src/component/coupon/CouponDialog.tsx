import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootStore, useAppDispatch } from "@/store/store";
import { closeDialog } from "@/store/dialogSlice";
import { ExInput } from "@/extra/Input";
import Button from "@/extra/Button";
import { createCoupon, updateCoupon } from "@/store/couponSlice";

const CouponDialog = () => {
  const { dialogueData } = useSelector((state: RootStore) => state.dialogue);
  const dispatch = useAppDispatch();

  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [coin, setCoin] = useState<any>("");
  const [expiryDate, setExpiryDate] = useState("");
  const [isPerUserLimit, setIsPerUserLimit] = useState(true);
  const [perUserLimitCount, setPerUserLimitCount] = useState<any>(1);
  const [maxUsers, setMaxUsers] = useState<any>(0);
  const [isActive, setIsActive] = useState(true);

  const [error, setError] = useState({
    code: "",
    coin: "",
  });

  useEffect(() => {
    if (dialogueData) {
      setCode(dialogueData.code || "");
      setTitle(dialogueData.title || "");
      setCoin(dialogueData.coin || "");
      setExpiryDate(
        dialogueData.expiryDate
          ? new Date(dialogueData.expiryDate).toISOString().split("T")[0]
          : ""
      );
      setIsPerUserLimit(dialogueData.isPerUserLimit ?? true);
      setPerUserLimitCount(dialogueData.perUserLimitCount || 1);
      setMaxUsers(dialogueData.maxUsers || 0);
      setIsActive(dialogueData.isActive ?? true);
    }
  }, [dialogueData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    const newError = { code: "", coin: "" };

    if (!code || !code.trim()) {
      newError.code = "Coupon code is required!";
      hasError = true;
    }

    if (!coin || Number(coin) <= 0) {
      newError.coin = "Coins must be greater than 0!";
      hasError = true;
    }

    if (hasError) {
      setError(newError);
      return;
    }

    const payload: any = {
      code: code.trim().toUpperCase(),
      title: title.trim(),
      coin: Number(coin),
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
      isPerUserLimit: Boolean(isPerUserLimit),
      perUserLimitCount: Math.max(1, Number(perUserLimitCount) || 1),
      maxUsers: Math.max(0, Number(maxUsers) || 0),
      isActive: Boolean(isActive),
    };

    if (dialogueData?._id) {
      payload.couponId = dialogueData._id;
      dispatch(updateCoupon(payload));
    } else {
      dispatch(createCoupon(payload));
    }

    dispatch(closeDialog());
  };

  return (
    <div className="dialog">
      <div className="w-100">
        <div className="row justify-content-center">
          <div className="col-xl-4 col-md-6 col-11">
            <div className="mainDiaogBox">
              <div className="row justify-content-between align-items-center formHead">
                <div className="col-8">
                  <h4 className="text-theme m0">
                    {dialogueData ? "Edit Coupon Code" : "Create Coupon Code"}
                  </h4>
                </div>
                <div className="col-4">
                  <div
                    className="closeButton"
                    onClick={() => dispatch(closeDialog())}
                    style={{ fontSize: "20px", cursor: "pointer" }}
                  >
                    <i className="ri-close-line"></i>
                  </div>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="p-3">
                <div className="row g-3">
                  {/* Coupon Code */}
                  <div className="col-12">
                    <ExInput
                      type="text"
                      id="couponCode"
                      name="couponCode"
                      value={code}
                      label="Coupon Code (e.g. WELCOME50, QUIET100)"
                      placeholder="ENTER COUPON CODE"
                      errorMessage={error.code}
                      onChange={(e: any) => {
                        setCode(e.target.value.toUpperCase());
                        if (error.code) setError({ ...error, code: "" });
                      }}
                    />
                  </div>

                  {/* Coin Amount */}
                  <div className="col-12">
                    <ExInput
                      type="number"
                      id="couponCoin"
                      name="couponCoin"
                      value={coin}
                      label="Coins to Add (Free Reward)"
                      placeholder="e.g. 50, 100, 250"
                      errorMessage={error.coin}
                      onChange={(e: any) => {
                        setCoin(e.target.value);
                        if (error.coin) setError({ ...error, coin: "" });
                      }}
                    />
                  </div>

                  {/* Description / Title */}
                  <div className="col-12">
                    <ExInput
                      type="text"
                      id="couponTitle"
                      name="couponTitle"
                      value={title}
                      label="Description / Title (Optional)"
                      placeholder="e.g. Special festive bonus reward"
                      onChange={(e: any) => setTitle(e.target.value)}
                    />
                  </div>

                  {/* Expiry Date */}
                  <div className="col-12">
                    <label className="form-label text-theme fw-semibold small mb-1">
                      Expiry Date (Optional)
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                    <small className="text-secondary">Leave blank for no expiry</small>
                  </div>

                  {/* Per User Limit Check */}
                  <div className="col-12">
                    <div className="form-check form-switch d-flex align-items-center gap-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="isPerUserLimit"
                        checked={isPerUserLimit}
                        onChange={(e) => setIsPerUserLimit(e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                      <label
                        className="form-check-label text-theme small fw-medium"
                        htmlFor="isPerUserLimit"
                        style={{ cursor: "pointer" }}
                      >
                        Limit 1 time per user (User cannot claim multiple times)
                      </label>
                    </div>
                  </div>

                  {/* Max Users / Total Limit */}
                  <div className="col-12">
                    <ExInput
                      type="number"
                      id="maxUsers"
                      name="maxUsers"
                      value={maxUsers}
                      label="Total Claim Limit across all users (0 = Unlimited)"
                      placeholder="0 for unlimited"
                      onChange={(e: any) => setMaxUsers(e.target.value)}
                    />
                  </div>

                  {/* Active Toggle */}
                  <div className="col-12">
                    <div className="form-check form-switch d-flex align-items-center gap-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="isActiveToggle"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                      <label
                        className="form-check-label text-theme small fw-medium"
                        htmlFor="isActiveToggle"
                        style={{ cursor: "pointer" }}
                      >
                        Status: {isActive ? "Active (Can be redeemed)" : "Inactive (Disabled)"}
                      </label>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="mt-4 d-flex justify-content-end gap-2">
                    <Button
                      className="text-light cancelButton"
                      text="Cancel"
                      type="button"
                      onClick={() => dispatch(closeDialog())}
                    />
                    <Button
                      type="submit"
                      className="text-white submitButton"
                      text={dialogueData ? "Update Coupon" : "Create Coupon"}
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

export default CouponDialog;
